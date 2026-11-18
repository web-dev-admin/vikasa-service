import { AdminNotification, NotificationType } from '@/types';

export interface DispatchNotificationParams {
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: 'request' | 'worker' | 'contact';
}

/**
 * Server-side notification dispatcher (Silenced & Disabled Mode).
 *
 * All external push, database insertions, and audio alert triggers
 * have been permanently disabled to eliminate background polling storms and noise.
 */
export async function dispatchAdminNotification(params: DispatchNotificationParams): Promise<AdminNotification> {
  const { type, title, message, relatedId, relatedType } = params;

  return {
    id: relatedId ? `notif-${type}-${relatedId}` : `notif-disabled-${Date.now()}`,
    type,
    title,
    message,
    related_id: relatedId,
    related_type: relatedType,
    is_read: true,
    created_at: new Date().toISOString(),
  };
}
