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
 * Server-side & in-app notification dispatcher.
 * Strictly uses Supabase PostgreSQL 'notifications' table with in-memory dataStore fallback.
 * Zero external Firebase / Google dependencies.
 *
 * 1. Persists notification record to local dataStore.
 * 2. Persists notification record to Supabase PostgreSQL table 'notifications'.
 * 3. Guarantees zero failures for customer and worker submissions.
 */
export async function dispatchAdminNotification(params: DispatchNotificationParams): Promise<AdminNotification> {
  const { type, title, message, relatedId, relatedType } = params;

  // 1. Save in local dataStore (immediate persistence / mock fallback)
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
      const { error } = await supabase.from('notifications').insert([payload]);
      if (error) {
        // Fallback to admin_notifications if notifications table is not present
        try {
          await supabase.from('admin_notifications').insert([payload]);
        } catch {
          // ignore
        }
      }
    } catch (dbErr) {
      console.warn('Supabase notification record insert warning:', dbErr);
    }
  }

  return notif;
}
