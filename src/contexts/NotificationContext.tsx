import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCurrentUser } from '../data/authorizedUsers';

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
  relatedType?: 'inquiry' | 'quotation' | 'order' | 'payment' | 'factory_po';
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

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    // 从localStorage加载当前用户的通知
    console.log('🔧 [NotificationProvider] 初始化状态...');
    if (typeof window !== 'undefined') {
      const currentUser = getCurrentUser();
      console.log('  - 当前用户:', currentUser);
      
      if (!currentUser) {
        console.log('  - ⚠️ 未找到当前用户，返回空数组');
        return [];
      }
      
      const key = `notifications_${currentUser.email}`;
      console.log('  - localStorage键名:', key);
      
      const stored = localStorage.getItem(key);
      console.log('  - localStorage原始数据:', stored ? stored.substring(0, 100) + '...' : '空');
      
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          console.log('  - ✅ 成功解析，通知数量:', parsed.length);
          return parsed;
        } catch (e) {
          console.error('  - ❌ 解析失败:', e);
          return [];
        }
      } else {
        console.log('  - ⚠️ localStorage中没有数据');
      }
    }
    return [];
  });

  // 🔄 监听用户切换，重新加载通知
  useEffect(() => {
    const loadNotifications = () => {
      const currentUser = getCurrentUser();
      console.log('👤 [NotificationProvider] 用户切换或页面加载');
      console.log('  - 当前用户:', currentUser?.email);
      
      if (!currentUser) {
        setNotifications([]);
        return;
      }

      const stored = localStorage.getItem(`notifications_${currentUser.email}`);
      console.log('  - localStorage键名:', `notifications_${currentUser.email}`);
      
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          console.log('  - 已加载通知数量:', parsed.length);
          setNotifications(parsed);
        } catch (e) {
          console.error('  - ❌ 解析通知失败:', e);
          setNotifications([]);
        }
      } else {
        console.log('  - ⚠️ 未找到通知数据');
        setNotifications([]);
      }
    };

    // 初始加载
    loadNotifications();

    // 监听storage事件（其他标签页的变化）
    window.addEventListener('storage', loadNotifications);
    
    // 监听自定义用户切换事件
    window.addEventListener('userChanged', loadNotifications);

    return () => {
      window.removeEventListener('storage', loadNotifications);
      window.removeEventListener('userChanged', loadNotifications);
    };
  }, []);

  // 计算未读数量
  const unreadCount = notifications.filter(n => !n.read).length;

  // 保存到localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentUser = getCurrentUser();
      if (currentUser) {
        localStorage.setItem(`notifications_${currentUser.email}`, JSON.stringify(notifications));
      }
    }
  }, [notifications]);

  // 🔔 监听跨组件通知事件
  useEffect(() => {
    const handleNotificationAdded = (event: CustomEvent) => {
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      const { email, notification } = event.detail;
      console.log('🔔 [NotificationProvider] 收到通知事件');
      console.log('  - 当前用户:', currentUser.email);
      console.log('  - 通知接收人:', email);
      console.log('  - 通知内容:', notification);

      // 如果通知是发给当前用户的，更新状态
      if (email === currentUser.email) {
        console.log('  - ✅ 通知匹配，更新状态');
        setNotifications(prev => [notification, ...prev]);
      } else {
        console.log('  - ⚠️ 通知不匹配，跳过');
      }
    };

    window.addEventListener('notificationAdded', handleNotificationAdded as EventListener);

    return () => {
      window.removeEventListener('notificationAdded', handleNotificationAdded as EventListener);
    };
  }, []);

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);
    
    // 🔔 触发通知事件（可用于显示toast等）
    window.dispatchEvent(new CustomEvent('newNotification', { detail: newNotification }));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
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

// 🔧 辅助函数：向指定用户发送通知
export function sendNotificationToUser(
  recipientEmail: string,
  notification: Omit<Notification, 'id' | 'createdAt' | 'read' | 'recipient'>
) {
  if (typeof window === 'undefined') return;
  
  console.log('📬 [sendNotificationToUser] 发送通知');
  console.log('  - 接收人:', recipientEmail);
  console.log('  - 通知类型:', notification.type);
  console.log('  - 通知标题:', notification.title);
  console.log('  - 通知内容:', notification.message);
  
  // 创建完整的通知对象
  const fullNotification: Notification = {
    ...notification,
    recipient: recipientEmail,
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    read: false,
  };

  // 保存到目标用户的localStorage
  const stored = localStorage.getItem(`notifications_${recipientEmail}`);
  const existingNotifications = stored ? JSON.parse(stored) : [];
  console.log('  - 现有通知数量:', existingNotifications.length);
  
  const updated = [fullNotification, ...existingNotifications];
  localStorage.setItem(`notifications_${recipientEmail}`, JSON.stringify(updated));
  console.log('  - 保存后通知数量:', updated.length);
  console.log('  - localStorage键名:', `notifications_${recipientEmail}`);
  
  // 触发事件以便实时更新
  window.dispatchEvent(new CustomEvent('notificationAdded', { 
    detail: { email: recipientEmail, notification: fullNotification } 
  }));
  console.log('  - ✅ 通知已保存并触发事件');
}