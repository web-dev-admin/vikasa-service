import crypto from 'crypto';
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

interface CachedGoogleToken {
  accessToken: string;
  expiresAt: number;
}

let cachedOAuthToken: CachedGoogleToken | null = null;

/**
 * Generates an OAuth2 access token for Google APIs using service account credentials.
 * Implements Google RFC 7523 JWT Bearer Profile natively with RS256.
 * Zero external libraries needed; uses Node.js standard crypto.
 */
async function getGoogleOAuth2AccessToken(): Promise<{ token: string; projectId: string } | null> {
  try {
    // Check environment for service account
    let projectId = process.env.FIREBASE_PROJECT_ID;
    let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    // Check if passed as a single JSON blob
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        projectId = parsed.project_id || projectId;
        clientEmail = parsed.client_email || clientEmail;
        privateKey = parsed.private_key || privateKey;
      } catch (jsonErr) {
        console.warn('[FCM v1] Error parsing FIREBASE_SERVICE_ACCOUNT JSON:', jsonErr);
      }
    }

    if (!projectId || !clientEmail || !privateKey) {
      return null;
    }

    // Return cached token if still valid (with 60-second safety buffer)
    const now = Math.floor(Date.now() / 1000);
    if (cachedOAuthToken && cachedOAuthToken.expiresAt > now + 60) {
      return { token: cachedOAuthToken.accessToken, projectId };
    }

    // Format private key (handle escaped newlines)
    const formattedKey = privateKey.replace(/\\n/g, '\n');

    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };

    const payload = {
      iss: clientEmail,
      sub: clientEmail,
      aud: 'https://oauth2.googleapis.com/token',
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      iat: now,
      exp: now + 3600,
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const message = `${encodedHeader}.${encodedPayload}`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(message);
    const signature = signer.sign(formattedKey, 'base64url');
    const jwtAssertion = `${message}.${signature}`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwtAssertion,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.warn('[FCM v1] Failed to obtain OAuth2 token from Google:', errText);
      return null;
    }

    const tokenData = await tokenRes.json();
    cachedOAuthToken = {
      accessToken: tokenData.access_token,
      expiresAt: now + (tokenData.expires_in || 3600),
    };

    return { token: tokenData.access_token, projectId };
  } catch (err) {
    console.warn('[FCM v1] OAuth2 token exchange exception:', err);
    return null;
  }
}

/**
 * Server-side notification dispatcher.
 * 1. Persists notification record to Supabase (and local dataStore fallback) FIRST.
 * 2. Fetches registered admin FCM device tokens.
 * 3. Sends Web Push notification via modern FCM HTTP v1 API.
 * 4. Automatically detects and deletes stale / unregistered device tokens.
 * 5. Ensures customer/technician submissions NEVER fail even if FCM delivery fails.
 */
export async function dispatchAdminNotification(params: DispatchNotificationParams): Promise<AdminNotification> {
  const { type, title, message, relatedId, relatedType } = params;

  // 1. Save in local store (Immediate persistence)
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

  // 3. Dispatch to registered FCM Device Tokens (PWA & Android Web Push via HTTP v1)
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
      await sendFCMHttpV1(tokens, {
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
 * Sends Web Push notifications using modern FCM HTTP v1 protocol.
 * Endpoint: https://fcm.googleapis.com/v1/projects/{projectId}/messages:send
 * Automatically prunes invalid or unregistered tokens (HTTP 404, UNREGISTERED).
 */
async function sendFCMHttpV1(tokens: string[], payload: FCMPayload): Promise<void> {
  const authConfig = await getGoogleOAuth2AccessToken();

  if (!authConfig) {
    console.info(
      '[FCM v1] Notification stored in in-app center. To enable Android background push, configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local.'
    );
    return;
  }

  const { token: accessToken, projectId } = authConfig;
  const targetUrl = payload.data.url || '/admin/dashboard';
  const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  for (const rawToken of tokens) {
    // If token was saved as JSON push subscription, extract registration token if available
    let deviceToken = rawToken;
    try {
      if (rawToken.startsWith('{')) {
        const parsed = JSON.parse(rawToken);
        if (parsed.token) {
          deviceToken = parsed.token;
        } else if (parsed.endpoint) {
          // Push subscription endpoint
          const parts = parsed.endpoint.split('/');
          deviceToken = parts[parts.length - 1];
        }
      }
    } catch {
      // Use raw token
    }

    if (!deviceToken) continue;

    try {
      const messageBody = {
        message: {
          token: deviceToken,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          webpush: {
            notification: {
              icon: '/logo/vikasa_interior_logo.png',
              badge: '/icons/icon-192x192.png',
            },
            fcm_options: {
              link: targetUrl,
            },
          },
          data: payload.data,
        },
      };

      const res = await fetch(fcmEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(messageBody),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        const status = res.status;
        const errCode = errorJson?.error?.details?.[0]?.errorCode || errorJson?.error?.status;

        console.warn(`[FCM v1] Delivery failed for token: ${status} ${errCode}`);

        // Prune invalid or expired tokens automatically
        if (
          status === 404 ||
          errCode === 'UNREGISTERED' ||
          errCode === 'INVALID_ARGUMENT' ||
          errorJson?.error?.message?.includes('registration-token-not-registered')
        ) {
          console.info(`[FCM v1] Pruning invalid token from active directory`);
          dataStore.removeDeviceToken(rawToken);

          if (!isLocalMockMode && process.env.NEXT_PUBLIC_SUPABASE_URL) {
            try {
              await supabase
                .from('admin_device_tokens')
                .delete()
                .eq('fcm_token', rawToken);
            } catch {
              // ignore
            }
          }
        }
      }
    } catch (sendErr) {
      console.warn('[FCM v1] Network failure dispatching push:', sendErr);
    }
  }
}
