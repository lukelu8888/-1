import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Bell, Mail, CheckCircle2, Clock, FileText, DollarSign, 
  Package, AlertCircle, X, Eye, ArrowRight, Zap, MessageSquare
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Notification as ContextNotification } from '../../contexts/NotificationContext';

// 导出类型别名以保持兼容性
export type Notification = ContextNotification;

interface NotificationCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: ContextNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onAction?: (notification: ContextNotification) => void;
}

export default function NotificationCenter({
  open,
  onOpenChange,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onAction
}: NotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'system'>('all');

  // 🔄 格式化时间戳为相对时间
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

  // 统计
  const unreadCount = notifications.filter(n => !n.read).length;
  const systemNotifications = notifications.filter(n => 
    n.type === 'inquiry_processing' || n.type === 'quotation_pending_approval'
  );

  // 过滤
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'system') return n.type === 'inquiry_processing' || n.type === 'quotation_pending_approval';
    return true;
  });

  // 获取通知图标
  const getNotificationIcon = (type: string) => {
    const icons = {
      inquiry_received: FileText,
      quotation_sent: DollarSign,
      quotation_confirmed: CheckCircle2,
      order_created: Package,
      payment_received: CheckCircle2,
      general: Bell
    };
    const Icon = icons[type as keyof typeof icons] || Bell;
    return Icon;
  };

  // 获取通知颜色
  const getNotificationColor = (type: string) => {
    const colors = {
      inquiry_received: 'text-blue-600 bg-blue-50',
      quotation_sent: 'text-green-600 bg-green-50',
      quotation_confirmed: 'text-emerald-600 bg-emerald-50',
      order_created: 'text-purple-600 bg-purple-50',
      payment_received: 'text-green-600 bg-green-50',
      general: 'text-gray-600 bg-gray-50'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  // 获取优先级配置
  const getPriorityConfig = (priority: string) => {
    const configs = {
      high: { label: '高', color: 'bg-rose-100 text-rose-700 border-rose-200' },
      medium: { label: '中', color: 'bg-amber-100 text-amber-700 border-amber-200' },
      low: { label: '低', color: 'bg-blue-100 text-blue-700 border-blue-200' }
    };
    return configs[priority as keyof typeof configs];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-base">通知中心</DialogTitle>
              {unreadCount > 0 && (
                <Badge className="bg-red-100 text-red-700 border-red-200 h-5 px-2 text-[10px]">
                  {unreadCount} 条未读
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-3 text-xs text-blue-600 hover:text-blue-700"
                onClick={onMarkAllAsRead}
              >
                全部已读
              </Button>
            )}
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
          <TabsList className="grid w-full grid-cols-3 h-9 mb-4">
            <TabsTrigger value="all" className="text-xs">
              全部通知
              <Badge className="ml-2 bg-blue-100 text-blue-700 h-4 px-1.5 text-[10px]">
                {notifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">
              未读消息
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-red-100 text-red-700 h-4 px-1.5 text-[10px]">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="system" className="text-xs">
              系统通知
              <Badge className="ml-2 bg-gray-100 text-gray-700 h-4 px-1.5 text-[10px]">
                {systemNotifications.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0 max-h-[500px] overflow-y-auto space-y-2">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">暂无通知</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const colorClass = getNotificationColor(notification.type);

                return (
                  <Card
                    key={notification.id}
                    className={`p-3 border transition-all ${
                      !notification.read
                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* 图标 */}
                      <div className={`w-9 h-9 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs text-gray-900">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>

                        <p className="text-xs text-gray-700 mb-2">
                          {notification.message}
                        </p>

                        {/* 相关信息 */}
                        {notification.relatedId && (
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-gray-100 text-gray-700 border-gray-200 h-5 px-2 text-[10px]">
                              {notification.relatedId}
                            </Badge>
                          </div>
                        )}

                        {/* 操作按钮 */}
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => onMarkAsRead(notification.id)}
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              标记已读
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[10px] text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => onDelete(notification.id)}
                          >
                            <X className="w-3 h-3 mr-1" />
                            删除
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}