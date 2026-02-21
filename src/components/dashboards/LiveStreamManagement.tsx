// 📊 直播管理后台 - Admin Portal专用
// 功能：创建直播、直播数据分析、回放管理、评论审核

import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import {
  Radio, Plus, Edit2, Trash2, Eye, TrendingUp, Users,
  Calendar, Clock, DollarSign, MessageSquare, Gift, ShoppingCart,
  BarChart3, Play, Settings, Download, FileText, Send, Check, X,
  Video, Youtube, Facebook, Linkedin, Star, AlertCircle, Zap
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface LiveEvent {
  id: string;
  title: string;
  description: string;
  speaker: string;
  scheduledTime: string;
  duration: string;
  status: 'draft' | 'scheduled' | 'live' | 'ended';
  platforms: string[];
  thumbnailUrl?: string;
  stats?: {
    totalViewers: number;
    peakViewers: number;
    totalMessages: number;
    totalOrders: number;
    revenue: number;
  };
}

export function LiveStreamManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([
    {
      id: 'live-001',
      title: '2024新品发布会 - 智能门锁系列',
      description: '展示最新智能门锁产品系列',
      speaker: '产品经理 张伟',
      scheduledTime: '2024-11-25 10:00',
      duration: '45分钟',
      status: 'live',
      platforms: ['YouTube', 'Facebook', 'LinkedIn'],
      stats: {
        totalViewers: 342,
        peakViewers: 198,
        totalMessages: 156,
        totalOrders: 45,
        revenue: 2067.55
      }
    },
    {
      id: 'live-002',
      title: '工厂参观直播 - 生产流程全揭秘',
      description: '带您走进智能制造工厂',
      speaker: '工厂总监 王强',
      scheduledTime: '2024-11-27 14:00',
      duration: '60分钟',
      status: 'scheduled',
      platforms: ['YouTube', 'Facebook'],
      stats: {
        totalViewers: 0,
        peakViewers: 0,
        totalMessages: 0,
        totalOrders: 0,
        revenue: 0
      }
    },
    {
      id: 'live-003',
      title: 'B2B采购指南分享会',
      description: '资深采购专家分享经验',
      speaker: 'Sarah Johnson',
      scheduledTime: '2024-11-20 10:00',
      duration: '30分钟',
      status: 'ended',
      platforms: ['YouTube', 'LinkedIn'],
      stats: {
        totalViewers: 523,
        peakViewers: 287,
        totalMessages: 234,
        totalOrders: 67,
        revenue: 3245.80
      }
    }
  ]);

  // 新建直播表单
  const [newLive, setNewLive] = useState({
    title: '',
    description: '',
    speaker: '',
    scheduledTime: '',
    duration: '30分钟',
    platforms: [] as string[]
  });

  // 总体数据统计
  const totalStats = {
    totalEvents: liveEvents.length,
    liveNow: liveEvents.filter(e => e.status === 'live').length,
    scheduledEvents: liveEvents.filter(e => e.status === 'scheduled').length,
    totalRevenue: liveEvents.reduce((sum, e) => sum + (e.stats?.revenue || 0), 0),
    totalViewers: liveEvents.reduce((sum, e) => sum + (e.stats?.totalViewers || 0), 0),
    totalOrders: liveEvents.reduce((sum, e) => sum + (e.stats?.totalOrders || 0), 0)
  };

  // 创建直播
  const handleCreateLive = () => {
    if (!newLive.title || !newLive.scheduledTime) {
      toast.error('请填写必填项！');
      return;
    }

    const newEvent: LiveEvent = {
      id: `live-${Date.now()}`,
      ...newLive,
      status: 'draft',
      stats: {
        totalViewers: 0,
        peakViewers: 0,
        totalMessages: 0,
        totalOrders: 0,
        revenue: 0
      }
    };

    setLiveEvents(prev => [newEvent, ...prev]);
    toast.success('直播已创建！');
    setShowCreateDialog(false);
    
    // 重置表单
    setNewLive({
      title: '',
      description: '',
      speaker: '',
      scheduledTime: '',
      duration: '30分钟',
      platforms: []
    });
  };

  // 删除直播
  const handleDeleteLive = (id: string) => {
    if (confirm('确定要删除这个直播吗？')) {
      setLiveEvents(prev => prev.filter(e => e.id !== id));
      toast.success('已删除！');
    }
  };

  // 开始直播
  const handleStartLive = (id: string) => {
    setLiveEvents(prev => prev.map(e => 
      e.id === id ? { ...e, status: 'live' as const } : e
    ));
    toast.success('直播已开始！');
  };

  // 结束直播
  const handleEndLive = (id: string) => {
    setLiveEvents(prev => prev.map(e => 
      e.id === id ? { ...e, status: 'ended' as const } : e
    ));
    toast.success('直播已结束！');
  };

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      live: { label: '直播中', className: 'bg-red-500 text-white animate-pulse' },
      scheduled: { label: '已排期', className: 'bg-blue-500 text-white' },
      ended: { label: '已结束', className: 'bg-slate-500 text-white' },
      draft: { label: '草稿', className: 'bg-slate-300 text-slate-700' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
              <Radio className="size-6 text-white" />
            </div>
            直播管理系统
          </h1>
          <p className="text-slate-600 mt-1">
            创建、管理和分析您的直播活动
          </p>
        </div>
        <Button 
          className="gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="size-4" />
          创建直播
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-6 gap-4">
        {[
          { label: '总直播数', value: totalStats.totalEvents, icon: Video, color: 'blue' },
          { label: '正在直播', value: totalStats.liveNow, icon: Radio, color: 'red' },
          { label: '已排期', value: totalStats.scheduledEvents, icon: Calendar, color: 'purple' },
          { label: '总观看', value: totalStats.totalViewers, icon: Eye, color: 'green' },
          { label: '总订单', value: totalStats.totalOrders, icon: ShoppingCart, color: 'orange' },
          { label: '总收入', value: `$${totalStats.totalRevenue.toFixed(0)}`, icon: DollarSign, color: 'emerald' }
        ].map((stat, idx) => (
          <Card key={idx} className="p-4">
            <div className={`w-10 h-10 bg-${stat.color}-100 rounded-lg flex items-center justify-center mb-3`}>
              <stat.icon className={`size-5 text-${stat.color}-600`} />
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">
              {stat.value}
            </div>
            <div className="text-sm text-slate-600">
              {stat.label}
            </div>
          </Card>
        ))}
      </div>

      {/* 主内容区 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">总览</TabsTrigger>
          <TabsTrigger value="live">
            正在直播
            {totalStats.liveNow > 0 && (
              <Badge className="ml-2 bg-red-500 text-white">{totalStats.liveNow}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="scheduled">已排期</TabsTrigger>
          <TabsTrigger value="ended">历史直播</TabsTrigger>
          <TabsTrigger value="analytics">数据分析</TabsTrigger>
        </TabsList>

        {/* 总览 */}
        <TabsContent value="overview" className="space-y-4 mt-6">
          <div className="grid gap-4">
            {liveEvents.slice(0, 5).map((event) => (
              <Card key={event.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-900">
                        {event.title}
                      </h3>
                      {getStatusBadge(event.status)}
                    </div>
                    
                    <p className="text-sm text-slate-600 mb-4">
                      {event.description}
                    </p>

                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Users className="size-4" />
                        <span>{event.speaker}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="size-4" />
                        <span>{event.scheduledTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="size-4" />
                        <span>{event.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Video className="size-4" />
                        <span>{event.platforms.join(', ')}</span>
                      </div>
                    </div>

                    {event.stats && (event.status === 'live' || event.status === 'ended') && (
                      <div className="flex gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <Eye className="size-4 text-blue-600" />
                          <span className="font-semibold">{event.stats.totalViewers}</span>
                          <span className="text-slate-500">观看</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="size-4 text-green-600" />
                          <span className="font-semibold">{event.stats.totalMessages}</span>
                          <span className="text-slate-500">消息</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="size-4 text-orange-600" />
                          <span className="font-semibold">{event.stats.totalOrders}</span>
                          <span className="text-slate-500">订单</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="size-4 text-emerald-600" />
                          <span className="font-semibold">${event.stats.revenue.toFixed(2)}</span>
                          <span className="text-slate-500">收入</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    {event.status === 'scheduled' && (
                      <Button 
                        size="sm" 
                        className="gap-2 bg-red-600 hover:bg-red-700"
                        onClick={() => handleStartLive(event.id)}
                      >
                        <Radio className="size-4" />
                        开始直播
                      </Button>
                    )}
                    {event.status === 'live' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="gap-2"
                        onClick={() => handleEndLive(event.id)}
                      >
                        <X className="size-4" />
                        结束直播
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="gap-2">
                      <Edit2 className="size-4" />
                      编辑
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-2 text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteLive(event.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 正在直播 */}
        <TabsContent value="live" className="mt-6">
          {liveEvents.filter(e => e.status === 'live').length === 0 ? (
            <Card className="p-12 text-center">
              <Radio className="size-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">当前没有正在进行的直播</h3>
              <p className="text-slate-600 mb-6">开始一个已排期的直播或创建新直播</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="size-4 mr-2" />
                创建直播
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {liveEvents.filter(e => e.status === 'live').map((event) => (
                <Card key={event.id} className="p-6 border-red-300 border-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-xl font-bold text-slate-900">
                          {event.title}
                        </h3>
                        <Badge className="bg-red-500 text-white animate-pulse">
                          <Radio className="size-3 mr-1" />
                          LIVE
                        </Badge>
                      </div>

                      <div className="grid grid-cols-4 gap-6 mb-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {event.stats?.totalViewers}
                          </div>
                          <div className="text-xs text-slate-600">实时观看</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {event.stats?.peakViewers}
                          </div>
                          <div className="text-xs text-slate-600">峰值人数</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {event.stats?.totalMessages}
                          </div>
                          <div className="text-xs text-slate-600">互动消息</div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            {event.stats?.totalOrders}
                          </div>
                          <div className="text-xs text-slate-600">订单数</div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button size="sm" className="gap-2">
                          <Eye className="size-4" />
                          查看直播间
                        </Button>
                        <Button size="sm" variant="outline" className="gap-2">
                          <BarChart3 className="size-4" />
                          实时数据
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="gap-2"
                          onClick={() => handleEndLive(event.id)}
                        >
                          <X className="size-4" />
                          结束直播
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 已排期 */}
        <TabsContent value="scheduled" className="mt-6">
          <div className="grid gap-4">
            {liveEvents.filter(e => e.status === 'scheduled').map((event) => (
              <Card key={event.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-900">{event.title}</h3>
                      {getStatusBadge(event.status)}
                    </div>
                    <p className="text-sm text-slate-600 mb-4">{event.description}</p>
                    <div className="flex gap-6 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-4" />
                        <span>{event.scheduledTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="size-4" />
                        <span>{event.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="size-4" />
                        <span>{event.speaker}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="gap-2 bg-red-600 hover:bg-red-700"
                      onClick={() => handleStartLive(event.id)}
                    >
                      <Radio className="size-4" />
                      开始直播
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit2 className="size-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDeleteLive(event.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 历史直播 */}
        <TabsContent value="ended" className="mt-6">
          <div className="grid gap-4">
            {liveEvents.filter(e => e.status === 'ended').map((event) => (
              <Card key={event.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-900">{event.title}</h3>
                      {getStatusBadge(event.status)}
                    </div>
                    <p className="text-sm text-slate-600 mb-4">{event.description}</p>
                    
                    <div className="flex gap-6 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <Eye className="size-4 text-blue-600" />
                        <span className="font-semibold">{event.stats?.totalViewers}</span>
                        <span className="text-slate-500">总观看</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="size-4 text-green-600" />
                        <span className="font-semibold">{event.stats?.totalMessages}</span>
                        <span className="text-slate-500">消息</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="size-4 text-orange-600" />
                        <span className="font-semibold">{event.stats?.totalOrders}</span>
                        <span className="text-slate-500">订单</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="size-4 text-emerald-600" />
                        <span className="font-semibold">${event.stats?.revenue.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="gap-2">
                        <Play className="size-4" />
                        查看回放
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2">
                        <Download className="size-4" />
                        下载数据
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2">
                        <BarChart3 className="size-4" />
                        详细分析
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 数据分析 */}
        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="size-5 text-blue-600" />
                直播趋势分析
              </h3>
              <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
                <p className="text-slate-500">图表组件区域</p>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <DollarSign className="size-5 text-green-600" />
                收入统计
              </h3>
              <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
                <p className="text-slate-500">图表组件区域</p>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Users className="size-5 text-purple-600" />
                观众分析
              </h3>
              <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
                <p className="text-slate-500">图表组件区域</p>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ShoppingCart className="size-5 text-orange-600" />
                转化分析
              </h3>
              <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
                <p className="text-slate-500">图表组件区域</p>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* 创建直播对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Radio className="size-5" />
              创建新直播
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="title">直播标题 *</Label>
              <Input
                id="title"
                placeholder="如：2024新品发布会"
                value={newLive.title}
                onChange={(e) => setNewLive(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="description">直播简介</Label>
              <Textarea
                id="description"
                placeholder="简要描述直播内容..."
                rows={3}
                value={newLive.description}
                onChange={(e) => setNewLive(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="speaker">主讲人</Label>
                <Input
                  id="speaker"
                  placeholder="主讲人姓名"
                  value={newLive.speaker}
                  onChange={(e) => setNewLive(prev => ({ ...prev, speaker: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="duration">时长</Label>
                <Select 
                  value={newLive.duration} 
                  onValueChange={(value) => setNewLive(prev => ({ ...prev, duration: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15分钟">15分钟</SelectItem>
                    <SelectItem value="30分钟">30分钟</SelectItem>
                    <SelectItem value="45分钟">45分钟</SelectItem>
                    <SelectItem value="60分钟">60分钟</SelectItem>
                    <SelectItem value="90分钟">90分钟</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="scheduledTime">排期时间 *</Label>
              <Input
                id="scheduledTime"
                type="datetime-local"
                value={newLive.scheduledTime}
                onChange={(e) => setNewLive(prev => ({ ...prev, scheduledTime: e.target.value }))}
              />
            </div>

            <div>
              <Label className="mb-3 block">直播平台</Label>
              <div className="flex gap-3">
                {['YouTube', 'Facebook', 'LinkedIn'].map(platform => (
                  <button
                    key={platform}
                    onClick={() => {
                      setNewLive(prev => ({
                        ...prev,
                        platforms: prev.platforms.includes(platform)
                          ? prev.platforms.filter(p => p !== platform)
                          : [...prev.platforms, platform]
                      }));
                    }}
                    className={`flex-1 p-3 border-2 rounded-lg transition-all ${
                      newLive.platforms.includes(platform)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {platform === 'YouTube' && <Youtube className="size-5 text-red-600" />}
                      {platform === 'Facebook' && <Facebook className="size-5 text-blue-600" />}
                      {platform === 'LinkedIn' && <Linkedin className="size-5 text-blue-700" />}
                      <span className="font-semibold text-sm">{platform}</span>
                      {newLive.platforms.includes(platform) && (
                        <Check className="size-4 text-blue-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateDialog(false)}>
                取消
              </Button>
              <Button className="flex-1" onClick={handleCreateLive}>
                <Plus className="size-4 mr-2" />
                创建直播
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
