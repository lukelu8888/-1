import React, { useState } from 'react';
import { Bell, X, Check, Trash2, Eye, Clock, CheckCircle2, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from './ui/sheet';
import { useOptionalNotifications, Notification } from '../contexts/NotificationContext';
import { useRouter } from '../contexts/RouterContext';

export function CustomerNotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const notificationContext = useOptionalNotifications();
  const { navigateTo } = useRouter();

  if (!notificationContext) {
    return null;
  }

  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = notificationContext;

  // 按时间排序通知（最新的在前）
  const sortedNotifications = [...notifications].sort((a, b) => b.createdAt - a.createdAt);

  // 获取通知图标
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'quotation_sent':
      case 'quotation_created':
        return <MessageSquare className="w-5 h-5 text-blue-600" />;
      case 'quotation_accepted':
      case 'quotation_confirmed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'inquiry_processing':
        return <Clock className="w-5 h-5 text-orange-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  // 获取通知背景色
  const getNotificationBg = (type: string, read: boolean) => {
    if (read) return 'bg-gray-50';
    
    switch (type) {
      case 'quotation_sent':
      case 'quotation_created':
        return 'bg-blue-50/50 border-l-4 border-l-blue-500';
      case 'quotation_accepted':
      case 'quotation_confirmed':
        return 'bg-green-50/50 border-l-4 border-l-green-500';
      case 'inquiry_processing':
        return 'bg-orange-50/50 border-l-4 border-l-orange-500';
      default:
        return 'bg-gray-50/50';
    }
  };

  // 点击通知
  const handleNotificationClick = (notification: Notification) => {
    // 标记为已读
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // 根据通知类型跳转到相应页面
    if (notification.relatedType === 'qt') {
      navigateTo('dashboard');
      setIsOpen(false);
    } else if (notification.relatedType === 'ing') {
      navigateTo('dashboard');
      setIsOpen(false);
    }
  };

  // 删除通知
  const handleDeleteNotification = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    deleteNotification(notificationId);
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return new Date(timestamp).toLocaleDateString('zh-CN');
  };

  return (
    <>
      {/* 通知按钮 */}
      <Button 
        variant="ghost" 
        className="relative"
        onClick={() => setIsOpen(true)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs text-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        <span className="hidden xl:inline ml-2">Notifications</span>
      </Button>

      {/* 通知面板 */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-full sm:max-w-lg p-0">
          <SheetHeader className="px-6 py-4 border-b bg-gradient-to-r from-orange-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <SheetTitle className="text-xl">Notification Center</SheetTitle>
                  <SheetDescription className="text-xs text-gray-600">
                    {unreadCount > 0 ? `${unreadCount} unread messages` : 'All caught up!'}
                  </SheetDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="rounded-full h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* 操作按钮 */}
            {notifications.length > 0 && (
              <div className="flex items-center gap-2 pt-3">
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllAsRead}
                    className="h-7 text-xs border-orange-200 hover:bg-orange-50"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Mark all as read
                  </Button>
                )}
                <Badge variant="outline" className="text-[10px] border-gray-300">
                  {notifications.length} total
                </Badge>
              </div>
            )}
          </SheetHeader>

          {/* 通知列表 */}
          <ScrollArea className="h-[calc(100vh-140px)]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Bell className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">No notifications yet</p>
                <p className="text-xs text-gray-500 max-w-[280px]">
                  When you receive updates about your inquiries and quotations, they'll appear here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {sortedNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      px-6 py-4 transition-all duration-200 cursor-pointer hover:bg-gray-50
                      ${getNotificationBg(notification.type, notification.read)}
                      ${!notification.read ? 'shadow-sm' : ''}
                    `}
                  >
                    <div className="flex gap-3">
                      {/* 图标 */}
                      <div className="flex-shrink-0 mt-1">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center
                          ${!notification.read ? 'bg-white shadow-sm' : 'bg-gray-100'}
                        `}>
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>

                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'}`}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {notification.message}
                        </p>

                        {/* 元数据 */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(notification.createdAt)}
                            </span>
                            {notification.relatedId && (
                              <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-gray-300">
                                {notification.relatedId}
                              </Badge>
                            )}
                          </div>

                          {/* 操作按钮 */}
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="h-6 px-2 text-[10px] hover:bg-white"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Mark read
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDeleteNotification(e, notification.id)}
                              className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* 底部提示 */}
          {notifications.length > 0 && (
            <div className="px-6 py-3 border-t bg-gray-50">
              <p className="text-[10px] text-gray-500 text-center">
                💡 Click on a notification to view details
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
