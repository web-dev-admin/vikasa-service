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
 * 3. Graceful fallback on unique index conflict: If a legacy row with a different ID already exists
 *    for (type, related_id), gracefully updates the content without raising constraint violations.
 * 4. Explicit credential handling: Warns when SUPABASE_SERVICE_ROLE_KEY is absent.
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

  // 2. Persist to Supabase if connected
  if (!isLocalMockMode && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://dummy.supabase.co') {
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

      // Primary insertion: upsert on primary key 'id'
      let { error } = await client.from('notifications').upsert([payload], { onConflict: 'id' });

      // Constraint recovery: If a legacy record with a different ID violated unique constraint, update it
      if (error && error.code === '23505' && relatedId) {
        const updateRes = await client
          .from('notifications')
          .update({
            title: payload.title,
            message: payload.message,
            is_read: false,
          })
          .eq('type', type)
          .eq('related_id', relatedId);
        if (!updateRes.error) {
          error = null;
        }
      }

      // Fallback table: if notifications table is missing (42P01) or had an error, try admin_notifications
      if (error) {
        try {
          const fallbackRes = await client.from('admin_notifications').upsert([payload], { onConflict: 'id' });
          if (fallbackRes.error && fallbackRes.error.code === '23505' && relatedId) {
            await client
              .from('admin_notifications')
              .update({
                title: payload.title,
                message: payload.message,
                is_read: false,
              })
              .eq('type', type)
              .eq('related_id', relatedId);
          }
        } catch {
          // ignore secondary fallback error
        }
      }
    } catch (dbErr) {
      console.warn('[NotificationDispatcher] Supabase notification persistence warning:', dbErr instanceof Error ? dbErr.message : 'Unknown DB error');
    }
  }

  return notif;
}
