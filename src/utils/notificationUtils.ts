import { notificationSupabaseService } from '../lib/supabaseService';
import type { NotificationType } from '../contexts/NotificationContext';

export interface SendNotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
  sender?: string;
  metadata?: Record<string, unknown>;
}

/**
 * 向指定用户发送通知 — 写入 Supabase，通过 Realtime 推送到在线用户。
 * 同时触发同标签页内事件（NotificationContext 监听）。
 */
export function sendNotificationToUser(
  recipientEmail: string,
  notification: SendNotificationPayload
) {
  if (typeof window === 'undefined') return;

  const fullNotification = {
    ...notification,
    recipient: recipientEmail,
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    read: false,
  };

  void notificationSupabaseService
    .send({
      recipient_email: recipientEmail,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      related_id: notification.relatedId,
      related_type: notification.relatedType,
      sender: notification.sender,
      metadata: notification.metadata,
    })
    .catch((err) =>
      console.error('[sendNotificationToUser] Supabase failed:', err)
    );

  window.dispatchEvent(
    new CustomEvent('notificationAdded', {
      detail: { email: recipientEmail, notification: fullNotification },
    })
  );
}
