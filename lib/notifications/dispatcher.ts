import { AdminNotification, NotificationType } from '@/types';
import { dataStore } from '@/lib/data/store';
import { supabase, isLocalMockMode } from '@/lib/supabase/client';

export interface DispatchNotificationParams {
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: 'request' | 'worker' | 'contact';
}

/**
 * Server-side notification dispatcher.
 * 1. Persists notification record to Supabase (and local dataStore fallback).
 * 2. Fetches registered admin FCM device tokens.
 * 3. Sends Web Push notification via FCM.
 * 4. Ensures customer/worker submissions NEVER fail even if FCM delivery fails.
 */
export async function dispatchAdminNotification(params: DispatchNotificationParams): Promise<AdminNotification> {
  const { type, title, message, relatedId, relatedType } = params;

  // 1. Save in local store
  const notif = dataStore.addNotification({
    type,
    title,
    message,
    related_id: relatedId,
    related_type: relatedType,
  });

  // 2. Persist to Supabase if connected
  if (!isLocalMockMode && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      await supabase.from('notifications').insert([
        {
          id: notif.id,
          type,
          title,
          message,
          related_id: relatedId,
          related_type: relatedType,
          is_read: false,
          created_at: notif.created_at,
        },
      ]);
    } catch (dbErr) {
      console.warn('Supabase notification record insert warning:', dbErr);
    }
  }

  // 3. Dispatch to registered FCM Device Tokens (PWA & Android Web Push)
  try {
    let tokens: string[] = [];

    // Fetch tokens from Supabase if connected
    if (!isLocalMockMode && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const { data: dbTokens, error } = await supabase
          .from('admin_device_tokens')
          .select('fcm_token')
          .eq('is_active', true);
        if (!error && Array.isArray(dbTokens)) {
          tokens = dbTokens.map((t) => t.fcm_token).filter(Boolean);
        }
      } catch (e) {
        console.warn('Could not fetch tokens from Supabase, falling back to dataStore:', e);
      }
    }

    if (tokens.length === 0) {
      tokens = dataStore.getDeviceTokens().filter((t) => t.is_active).map((t) => t.fcm_token);
    }

    if (tokens.length > 0) {
      await sendFCMWebPush(tokens, {
        title,
        body: message,
        data: {
          notificationId: notif.id,
          type,
          relatedId: relatedId || '',
          relatedType: relatedType || '',
          url: getTargetAdminUrl(type, relatedId),
        },
      });
    }
  } catch (pushErr) {
    console.warn('FCM dispatch notice (non-fatal):', pushErr);
  }

  return notif;
}

function getTargetAdminUrl(type: NotificationType, relatedId?: string): string {
  switch (type) {
    case 'service_request':
      return relatedId ? `/admin/requests?id=${relatedId}` : '/admin/requests';
    case 'technician_application':
      return relatedId ? `/admin/workers?id=${relatedId}` : '/admin/workers';
    case 'contact_inquiry':
      return '/admin/contacts';
    case 'status_update':
      return relatedId ? `/admin/requests?id=${relatedId}` : '/admin/dashboard';
    default:
      return '/admin/dashboard';
  }
}

interface FCMPayload {
  title: string;
  body: string;
  data: Record<string, string>;
}

/**
 * Sends FCM Web Push notifications.
 * Supports standard FCM HTTP v1 / legacy protocols when Firebase credentials are configured in environment.
 */
async function sendFCMWebPush(tokens: string[], payload: FCMPayload): Promise<void> {
  const serverKey = process.env.FIREBASE_SERVER_KEY;
  if (!serverKey) {
    // If Firebase server key is not yet set in production env, log clear guidance.
    // In-app notifications continue to work seamlessly.
    console.info('[FCM Push] Notification queued for in-app center. To enable Android background push, set FIREBASE_SERVER_KEY in .env.local.');
    return;
  }

  for (const token of tokens) {
    try {
      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `key=${serverKey}`,
        },
        body: JSON.stringify({
          to: token,
          notification: {
            title: payload.title,
            body: payload.body,
            icon: '/logo/vikasa_interior_logo.png',
            click_action: payload.data.url,
          },
          data: payload.data,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[FCM Push] FCM send failed for token ${token.slice(0, 10)}...:`, errorText);
      }
    } catch (err) {
      console.warn(`[FCM Push] Network error sending to token ${token.slice(0, 10)}...:`, err);
    }
  }
}

