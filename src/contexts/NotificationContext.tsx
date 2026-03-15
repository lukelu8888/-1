import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCurrentUser } from '../data/authorizedUsers';
import { notificationSupabaseService } from '../lib/supabaseService';
import { supabase } from '../lib/supabase';

// 通知类型
export type NotificationType = 
  | 'inquiry_received'           // 收到询价
  | 'inquiry_processing'         // 询价处理中
  | 'quotation_created'          // 报价已创建
  | 'quotation_pending_approval' // 报价待审核
  | 'quotation_approved'         // 报价已审核通过
  | 'quotation_rejected'         // 报价被拒绝
  | 'quotation_sent'             // 报价已发送给客户
  | 'quotation_accepted'         // 客户接受报价
  | 'quotation_declined'         // 客户拒绝报价
  | 'quotation_confirmed'        // 客户确认报价
  | 'quotation_feedback'         // 客户反馈报价（需要协商）
  | 'payment_reminder'           // 付款提醒
  | 'payment_received'           // 收到付款
  | 'payment_confirmed'          // 付款已确认
  | 'order_created'              // 订单已创建
  | 'order_to_factory'           // 给工厂下单
  | 'factory_po_pending'         // 工厂订单待审核
  | 'factory_po_approved'        // 工厂订单已审核
  | 'factory_po_sent'            // 工厂订单已发送
  | 'factory_accepted'           // 工厂接受订单
  | 'factory_declined';          // 工厂拒绝订单

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;           // 关联的业务ID（询价/报价/订单编号）
  relatedType?: 'ing' | 'qt' | 'order' | 'payment' | 'factory_po' | 'contract';
  recipient: string;            // 接收人邮箱
  sender?: string;              // 发送人
  read: boolean;
  createdAt: number;
  metadata?: {                  // 额外元数据
    customerName?: string;
    amount?: string;
    status?: string;
    reason?: string;
    [key: string]: any;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadFromSupabase = async (email: string) => {
    const data = await notificationSupabaseService.getForUser(email);
    if (data && Array.isArray(data)) {
      setNotifications(data as Notification[]);
    }
  };

  // 初始加载 & Auth 监听
  useEffect(() => {
    const initLoad = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        await loadFromSupabase(session.user.email);
      }
    };
    void initLoad();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email) {
        void loadFromSupabase(session.user.email);
      } else if (event === 'SIGNED_OUT') {
        setNotifications([]);
      }
    });

    // 兼容旧的用户切换事件
    const handleUserChanged = () => {
      const currentUser = getCurrentUser();
      if (currentUser?.email) void loadFromSupabase(currentUser.email);
    };
    window.addEventListener('userChanged', handleUserChanged);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('userChanged', handleUserChanged);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Supabase Realtime 订阅（接收新通知）
  useEffect(() => {
    let channel: ReturnType<typeof notificationSupabaseService.subscribeToUser> | null = null;

    const subscribeRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) return;
      const email = session.user.email;
      channel = notificationSupabaseService.subscribeToUser(email, (payload) => {
        const newNotif = payload.new as Notification;
        if (!newNotif) return;
        setNotifications(prev => {
          const exists = prev.find(n => n.id === newNotif.id);
          if (exists) return prev;
          window.dispatchEvent(new CustomEvent('newNotification', { detail: newNotif }));
          return [newNotif, ...prev];
        });
      });
    };

    void subscribeRealtime();

    return () => {
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  // 监听跨组件通知事件（兼容旧代码）
  useEffect(() => {
    const handleNotificationAdded = (event: CustomEvent) => {
      const currentUser = getCurrentUser();
      if (!currentUser) return;
      const { email, notification } = event.detail;
      if (email === currentUser.email) {
        setNotifications(prev => {
          const exists = prev.find(n => n.id === notification.id);
          if (exists) return prev;
          return [notification, ...prev];
        });
      }
    };
    window.addEventListener('notificationAdded', handleNotificationAdded as EventListener);
    return () => window.removeEventListener('notificationAdded', handleNotificationAdded as EventListener);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
    // 异步写入 Supabase
    void notificationSupabaseService.send({
      recipient_email: notification.recipient,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      related_id: notification.relatedId,
      related_type: notification.relatedType,
      sender: notification.sender,
      metadata: notification.metadata,
    }).catch(err => console.error('[Notification] send to Supabase failed:', err));
    window.dispatchEvent(new CustomEvent('newNotification', { detail: newNotification }));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    void notificationSupabaseService.markRead(id).catch(() => {});
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      void notificationSupabaseService.markAllRead(session.user.email).catch(() => {});
    }
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    void notificationSupabaseService.delete(id).catch(() => {});
  };

  const clearAll = async () => {
    setNotifications([]);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      void notificationSupabaseService.deleteAll(session.user.email).catch(() => {});
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

export function useOptionalNotifications() {
  return useContext(NotificationContext);
}

// 向后兼容重新导出 — 实现已移至 src/utils/notificationUtils.ts
export { sendNotificationToUser } from '../utils/notificationUtils';
