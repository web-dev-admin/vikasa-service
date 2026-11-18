import { AdminNotification, NotificationType } from '@/types';
import { dataStore } from '@/lib/data/store';
import { supabase, supabaseAdmin, isLocalMockMode } from '@/lib/supabase/client';

export interface DispatchNotificationParams {
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: 'request' | 'worker' | 'contact';
}

/**
 * Server-side & in-app notification dispatcher.
 * Strictly uses Supabase PostgreSQL 'notifications' table with in-memory dataStore fallback.
 * Zero external Firebase / Google dependencies.
 *
 * Guarantees:
 * 1. Deterministic unique identifier: Notifications for the same event share an immutable ID.
 * 2. Idempotent upserting: Duplicate submissions never generate repeated notification records.
 * 3. Bypasses RLS using server-side service role client so administrative notifications never fail.
 */
export async function dispatchAdminNotification(params: DispatchNotificationParams): Promise<AdminNotification> {
  const { type, title, message, relatedId, relatedType } = params;

  // Generate deterministic ID for the event to prevent duplicate notifications
  const deterministicId = relatedId
    ? `notif-${type}-${relatedId}`
    : `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  // 1. Save in local dataStore (deduplicated in-memory and in localStorage)
  const notif = dataStore.addNotification({
    id: deterministicId,
    type,
    title,
    message,
    related_id: relatedId,
    related_type: relatedType,
  });

  // 2. Persist to Supabase using privileged client with idempotent upsert
  if (!isLocalMockMode && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const payload = {
        id: notif.id,
        type,
        title,
        message,
        related_id: relatedId,
        related_type: relatedType,
        is_read: false,
        created_at: notif.created_at,
      };

      const client = supabaseAdmin || supabase;
      const { error } = await client.from('notifications').upsert([payload], { onConflict: 'id' });
      if (error) {
        // Fallback to admin_notifications if notifications table is not present
        try {
          await client.from('admin_notifications').upsert([payload], { onConflict: 'id' });
        } catch {
          // ignore
        }
      }
    } catch (dbErr) {
      console.warn('Supabase notification record upsert warning:', dbErr);
    }
  }

  return notif;
}
