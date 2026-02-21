import React, { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Card } from '../ui/card';
import { Progress } from '../ui/progress';
import { 
  TrendingUp, TrendingDown, Instagram, Facebook, Youtube, Linkedin,
  Search, DollarSign, Eye, MousePointerClick, Users, 
  Calendar, Plus, BarChart3, Target, Zap, Globe,
  ExternalLink, Edit, Trash2, Copy, Share2, CheckCircle2,
  Clock, Play, Pause, ArrowUpRight, FileText, Image as ImageIcon,
  Video, Link as LinkIcon, Hash, MessageSquare, Heart, Send,
  ShoppingBag, Store, Building2, UserCheck, Filter, Download,
  PieChart, Activity, Award, Sparkles, Mail, Code2, Settings, UserPlus
} from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import SocialMediaCampaignWizard from './SocialMediaCampaignWizard';
import CampaignTrackingDashboard from './CampaignTrackingDashboard';
import SocialMediaAPIDemo from './SocialMediaAPIDemo';
import SocialMediaAccounts from './SocialMediaAccounts';
import SocialMediaLeadsFlow from './SocialMediaLeadsFlow';
import CustomerIntakeSystem from './CustomerIntakeSystem'; // 🔥 客户录入与评估系统
import { toast } from 'sonner@2.0.3';

// TikTok图标组件
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

export default function SocialMediaMarketing() {
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedMarket, setSelectedMarket] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30days');
  const [showCampaignWizard, setShowCampaignWizard] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  // 渠道数据
  const channels = [
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'from-blue-700 to-blue-500',
      bgColor: 'bg-blue-50',
      followers: 8500,
      reach: 35600,
      engagement: 3.2,
      clicks: 1450,
      conversions: 112,
      spend: 2800,
      status: 'active'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50',
      followers: 12500,
      reach: 45200,
      engagement: 3.8,
      clicks: 1240,
      conversions: 89,
      spend: 2450,
      status: 'active'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'from-blue-600 to-blue-400',
      bgColor: 'bg-blue-50',
      followers: 8900,
      reach: 32100,
      engagement: 2.4,
      clicks: 980,
      conversions: 67,
      spend: 1890,
      status: 'active'
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: TikTokIcon,
      color: 'from-black to-gray-700',
      bgColor: 'bg-gray-50',
      followers: 25600,
      reach: 128000,
      engagement: 6.2,
      clicks: 3200,
      conversions: 156,
      spend: 3200,
      status: 'active'
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: Youtube,
      color: 'from-red-600 to-red-400',
      bgColor: 'bg-red-50',
      followers: 5400,
      reach: 18900,
      engagement: 4.1,
      clicks: 890,
      conversions: 78,
      spend: 1560,
      status: 'active'
    },
    {
      id: 'google',
      name: 'Google Ads',
      icon: Search,
      color: 'from-green-600 to-blue-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-blue-50',
      followers: 0,
      reach: 89000,
      engagement: 2.8,
      clicks: 4560,
      conversions: 234,
      spend: 5600,
      status: 'active'
    },
  ];

  // 处理新活动发布
  const handlePublishCampaign = (newCampaign: any) => {
    setCampaigns([...campaigns, newCampaign]);
    toast.success('活动已添加到看板！');
  };

  // 内容发布计划 - 合并已创建的活动
  const contentCalendar = [
    // 从创建的活动生成内容日历项
    ...campaigns.map(camp => ({
      id: camp.id,
      title: camp.contentTitle || camp.name,
      type: camp.contentType || 'image',
      channels: camp.channels,
      market: camp.targetMarket?.[0] || 'all',
      scheduledDate: camp.startDate,
      status: camp.status === 'active' ? 'scheduled' : camp.status,
      engagement: camp.clicks || 0
    })),
    // 原有的示例数据
    {
      id: 1,
      title: '新款水龙头系列产品介绍',
      type: 'video',
      channels: ['instagram', 'facebook', 'tiktok'],
      market: 'north-america',
      scheduledDate: '2025-11-20',
      status: 'scheduled',
      engagement: 0
    },
    {
      id: 2,
      title: 'B2B批发优势 - 为什么选择COSUN',
      type: 'carousel',
      channels: ['instagram', 'facebook'],
      market: 'south-america',
      scheduledDate: '2025-11-21',
      status: 'scheduled',
      engagement: 0
    },
    {
      id: 3,
      title: '工厂直播 - 生产流程展示',
      type: 'live',
      channels: ['facebook', 'youtube'],
      market: 'all',
      scheduledDate: '2025-11-22',
      status: 'scheduled',
      engagement: 0
    },
    {
      id: 4,
      title: '客户案例 - 北美连锁零售商合作',
      type: 'image',
      channels: ['instagram', 'facebook', 'tiktok'],
      market: 'north-america',
      scheduledDate: '2025-11-18',
      status: 'published',
      engagement: 4520
    },
  ];

  // 广告活动 - 示例数据
  const sampleCampaigns = [
    {
      id: 1,
      name: '北美Q4产品推广 - 卫浴系列',
      channels: ['facebook', 'google'],
      market: 'north-america',
      budget: 5000,
      spent: 3240,
      impressions: 125000,
      clicks: 2890,
      conversions: 156,
      ctr: 2.31,
      cpc: 1.12,
      status: 'active',
      startDate: '2025-11-01',
      endDate: '2025-11-30'
    },
    {
      id: 2,
      name: 'TikTok爆款测试 - 门锁系列',
      channels: ['tiktok'],
      market: 'all',
      budget: 3000,
      spent: 2100,
      impressions: 450000,
      clicks: 8900,
      conversions: 234,
      ctr: 1.98,
      cpc: 0.24,
      status: 'active',
      startDate: '2025-11-10',
      endDate: '2025-11-25'
    },
    {
      id: 3,
      name: 'Instagram B2B采购指南',
      channels: ['instagram'],
      market: 'europe-africa',
      budget: 2000,
      spent: 1890,
      impressions: 78000,
      clicks: 1240,
      conversions: 67,
      ctr: 1.59,
      cpc: 1.52,
      status: 'active',
      startDate: '2025-11-05',
      endDate: '2025-11-20'
    },
  ];

  // 合并所有广告活动（新创建的 + 示例数据）
  const allCampaigns = [...campaigns, ...sampleCampaigns];

  // SEO关键词追踪
  const seoKeywords = [
    {
      keyword: 'wholesale bathroom fixtures',
      market: 'north-america',
      position: 8,
      change: 5,
      volume: 8900,
      difficulty: 42,
      url: '/products/bathroom'
    },
    {
      keyword: 'bulk door hardware supplier',
      market: 'north-america',
      position: 12,
      change: -2,
      volume: 5600,
      difficulty: 38,
      url: '/products/door-hardware'
    },
    {
      keyword: 'B2B electrical supplies',
      market: 'north-america',
      position: 15,
      change: 3,
      volume: 12000,
      difficulty: 56,
      url: '/products/electrical'
    },
    {
      keyword: 'industrial plumbing distributor',
      market: 'europe-africa',
      position: 6,
      change: 8,
      volume: 3400,
      difficulty: 35,
      url: '/products/plumbing'
    },
  ];

  // 市场配置
  const markets = [
    { id: 'north-america', name: '北美市场', flag: '🇺🇸' },
    { id: 'south-america', name: '南美市场', flag: '🇧🇷' },
    { id: 'europe-africa', name: '欧非市场', flag: '🇪🇺' },
  ];

  const getChannelIcon = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    return channel?.icon || Instagram;
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      active: 'bg-green-100 text-green-800 border-green-300',
      scheduled: 'bg-blue-100 text-blue-800 border-blue-300',
      paused: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      completed: 'bg-gray-100 text-gray-800 border-gray-300',
      published: 'bg-green-100 text-green-800 border-green-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="space-y-4 pb-6">
      {/* 页面标题栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-1" style={{ fontSize: '18px', fontWeight: 700 }}>
            社媒引流管理 + 客户录入评估
          </h1>
          <p className="text-gray-500" style={{ fontSize: '12px' }}>
            多渠道营销管理 → 线索获取 → 客户评估录入 | 社媒营销全链路闭环
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedMarket} onValueChange={setSelectedMarket}>
            <SelectTrigger className="h-9 w-36" style={{ fontSize: '12px' }}>
              <Globe className="w-4 h-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" style={{ fontSize: '12px' }}>全部市场</SelectItem>
              {markets.map(market => (
                <SelectItem key={market.id} value={market.id} style={{ fontSize: '12px' }}>
                  {market.flag} {market.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="h-9 w-32" style={{ fontSize: '12px' }}>
              <Calendar className="w-4 h-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days" style={{ fontSize: '12px' }}>近7天</SelectItem>
              <SelectItem value="30days" style={{ fontSize: '12px' }}>近30天</SelectItem>
              <SelectItem value="90days" style={{ fontSize: '12px' }}>近90天</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            className="h-9 px-4 bg-blue-600 hover:bg-blue-700" 
            style={{ fontSize: '12px' }}
            onClick={() => setShowCampaignWizard(true)}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            创建活动
          </Button>
        </div>
      </div>

      {/* 渠道概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {channels.map((channel) => {
          const Icon = channel.icon;
          return (
            <div
              key={channel.id}
              className="bg-white border border-gray-200 rounded shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              <div className={`p-4 ${channel.bgColor}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${channel.color} flex items-center justify-center shadow-md`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <Badge 
                    className={`h-5 px-2 border ${getStatusColor(channel.status)}`} 
                    style={{ fontSize: '10px' }}
                  >
                    运行中
                  </Badge>
                </div>
                <h3 className="text-gray-900 mb-1" style={{ fontSize: '13px', fontWeight: 600 }}>
                  {channel.name}
                </h3>
                {channel.followers > 0 && (
                  <p className="text-gray-500" style={{ fontSize: '11px' }}>
                    {channel.followers.toLocaleString()} 粉丝
                  </p>
                )}
              </div>

              <div className="p-3 space-y-2.5 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500" style={{ fontSize: '11px' }}>触达</span>
                  <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>
                    {channel.reach.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500" style={{ fontSize: '11px' }}>互动率</span>
                  <span className="text-green-600" style={{ fontSize: '12px', fontWeight: 600 }}>
                    {channel.engagement}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500" style={{ fontSize: '11px' }}>点击</span>
                  <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>
                    {channel.clicks.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500" style={{ fontSize: '11px' }}>转化</span>
                  <span className="text-blue-600" style={{ fontSize: '12px', fontWeight: 600 }}>
                    {channel.conversions}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-gray-500" style={{ fontSize: '11px' }}>花费</span>
                  <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>
                    ${channel.spend.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-2.5 border-t border-gray-100">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full h-7" 
                  style={{ fontSize: '11px' }}
                >
                  查看详情
                  <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 主要内容标签页 */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-white border border-gray-200 p-1 h-auto">
          <TabsTrigger value="overview" className="px-4 py-2" style={{ fontSize: '12px' }}>
            <Activity className="w-4 h-4 mr-1.5" />
            数据概览
          </TabsTrigger>
          <TabsTrigger value="content" className="px-4 py-2" style={{ fontSize: '12px' }}>
            <Calendar className="w-4 h-4 mr-1.5" />
            内容日历
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="px-4 py-2" style={{ fontSize: '12px' }}>
            <Target className="w-4 h-4 mr-1.5" />
            广告活动
          </TabsTrigger>
          <TabsTrigger value="seo" className="px-4 py-2" style={{ fontSize: '12px' }}>
            <Search className="w-4 h-4 mr-1.5" />
            SEO优化
          </TabsTrigger>
          <TabsTrigger value="audience" className="px-4 py-2" style={{ fontSize: '12px' }}>
            <Users className="w-4 h-4 mr-1.5" />
            目标受众
          </TabsTrigger>
          <TabsTrigger value="leads" className="px-4 py-2" style={{ fontSize: '12px' }}>
            <UserCheck className="w-4 h-4 mr-1.5" />
            线索管理
            <Badge className="ml-1.5 bg-orange-500 text-white border-0 px-1.5 py-0" style={{ fontSize: '9px' }}>HOT</Badge>
          </TabsTrigger>
          <TabsTrigger value="tracking" className="px-4 py-2" style={{ fontSize: '12px' }}>
            <Target className="w-4 h-4 mr-1.5" />
            全链路追踪
          </TabsTrigger>
          <TabsTrigger value="accounts" className="px-4 py-2" style={{ fontSize: '12px' }}>
            <Settings className="w-4 h-4 mr-1.5" />
            账号管理
          </TabsTrigger>
          <TabsTrigger value="api" className="px-4 py-2" style={{ fontSize: '12px' }}>
            <Code2 className="w-4 h-4 mr-1.5" />
            API集成
          </TabsTrigger>
          <TabsTrigger value="customer-intake" className="px-4 py-2" style={{ fontSize: '12px' }}>
            <UserPlus className="w-4 h-4 mr-1.5" />
            客户录入评估
            <Badge className="ml-1.5 bg-orange-500 text-white border-0 px-1.5 py-0" style={{ fontSize: '9px' }}>AI</Badge>
          </TabsTrigger>
        </TabsList>

        {/* 数据概览 */}
        <TabsContent value="overview" className="space-y-4">
          {/* 关键指标卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <Badge className="bg-green-100 text-green-700 border-0" style={{ fontSize: '10px' }}>
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                  +12.5%
                </Badge>
              </div>
              <p className="text-gray-500 mb-1" style={{ fontSize: '11px' }}>总触达人数</p>
              <p className="text-gray-900 mb-1" style={{ fontSize: '20px', fontWeight: 700 }}>
                313,200
              </p>
              <p className="text-gray-500" style={{ fontSize: '10px' }}>
                较上期增加 34,800
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <MousePointerClick className="w-5 h-5 text-purple-600" />
                </div>
                <Badge className="bg-green-100 text-green-700 border-0" style={{ fontSize: '10px' }}>
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                  +18.3%
                </Badge>
              </div>
              <p className="text-gray-500 mb-1" style={{ fontSize: '11px' }}>总点击数</p>
              <p className="text-gray-900 mb-1" style={{ fontSize: '20px', fontWeight: 700 }}>
                11,870
              </p>
              <p className="text-gray-500" style={{ fontSize: '10px' }}>
                点击率 3.79%
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-green-600" />
                </div>
                <Badge className="bg-green-100 text-green-700 border-0" style={{ fontSize: '10px' }}>
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                  +24.1%
                </Badge>
              </div>
              <p className="text-gray-500 mb-1" style={{ fontSize: '11px' }}>转化客户</p>
              <p className="text-gray-900 mb-1" style={{ fontSize: '20px', fontWeight: 700 }}>
                624
              </p>
              <p className="text-gray-500" style={{ fontSize: '10px' }}>
                转化率 5.26%
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-orange-600" />
                </div>
                <Badge className="bg-red-100 text-red-700 border-0" style={{ fontSize: '10px' }}>
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                  +8.7%
                </Badge>
              </div>
              <p className="text-gray-500 mb-1" style={{ fontSize: '11px' }}>总广告花费</p>
              <p className="text-gray-900 mb-1" style={{ fontSize: '20px', fontWeight: 700 }}>
                $14,700
              </p>
              <p className="text-gray-500" style={{ fontSize: '10px' }}>
                ROI: 4.8x
              </p>
            </div>
          </div>

          {/* 渠道表现对比 */}
          <div className="bg-white border border-gray-200 rounded shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-gray-900" style={{ fontSize: '14px', fontWeight: 600 }}>
                渠道表现对比
              </h2>
              <p className="text-gray-500 mt-0.5" style={{ fontSize: '11px' }}>
                各渠道关键指标对比分析
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left" style={{ fontSize: '11px', fontWeight: 600 }}>
                      渠道
                    </th>
                    <th className="px-4 py-3 text-right" style={{ fontSize: '11px', fontWeight: 600 }}>
                      触达
                    </th>
                    <th className="px-4 py-3 text-right" style={{ fontSize: '11px', fontWeight: 600 }}>
                      互动率
                    </th>
                    <th className="px-4 py-3 text-right" style={{ fontSize: '11px', fontWeight: 600 }}>
                      点击
                    </th>
                    <th className="px-4 py-3 text-right" style={{ fontSize: '11px', fontWeight: 600 }}>
                      转化
                    </th>
                    <th className="px-4 py-3 text-right" style={{ fontSize: '11px', fontWeight: 600 }}>
                      花费
                    </th>
                    <th className="px-4 py-3 text-right" style={{ fontSize: '11px', fontWeight: 600 }}>
                      CPC
                    </th>
                    <th className="px-4 py-3 text-right" style={{ fontSize: '11px', fontWeight: 600 }}>
                      转化成本
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {channels.map((channel, index) => {
                    const Icon = channel.icon;
                    const cpc = (channel.spend / channel.clicks).toFixed(2);
                    const cpa = (channel.spend / channel.conversions).toFixed(2);
                    
                    return (
                      <tr 
                        key={channel.id} 
                        className={`border-b border-gray-100 hover:bg-gray-50 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded bg-gradient-to-br ${channel.color} flex items-center justify-center`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>
                              {channel.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900" style={{ fontSize: '12px' }}>
                          {channel.reach.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-green-600" style={{ fontSize: '12px', fontWeight: 600 }}>
                            {channel.engagement}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900" style={{ fontSize: '12px' }}>
                          {channel.clicks.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-blue-600" style={{ fontSize: '12px', fontWeight: 600 }}>
                            {channel.conversions}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900" style={{ fontSize: '12px' }}>
                          ${channel.spend.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900" style={{ fontSize: '12px' }}>
                          ${cpc}
                        </td>
                        <td className="px-4 py-3 text-right text-orange-600" style={{ fontSize: '12px', fontWeight: 600 }}>
                          ${cpa}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* 内容日历 */}
        <TabsContent value="content" className="space-y-4">
          <div className="bg-white border border-gray-200 rounded shadow-sm">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-gray-900" style={{ fontSize: '14px', fontWeight: 600 }}>
                  内容发布日历
                </h2>
                <p className="text-gray-500 mt-0.5" style={{ fontSize: '11px' }}>
                  管理跨平台内容发布计划
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="h-8 w-32" style={{ fontSize: '11px' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" style={{ fontSize: '11px' }}>全部状态</SelectItem>
                    <SelectItem value="scheduled" style={{ fontSize: '11px' }}>待发布</SelectItem>
                    <SelectItem value="published" style={{ fontSize: '11px' }}>已发布</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="h-8 px-3 bg-blue-600 hover:bg-blue-700" style={{ fontSize: '11px' }}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  创建内容
                </Button>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {contentCalendar.map((content) => (
                <div key={content.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* 内容类型图标 */}
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      content.type === 'video' ? 'bg-purple-50' :
                      content.type === 'image' ? 'bg-blue-50' :
                      content.type === 'carousel' ? 'bg-green-50' :
                      'bg-red-50'
                    }`}>
                      {content.type === 'video' && <Video className="w-6 h-6 text-purple-600" />}
                      {content.type === 'image' && <ImageIcon className="w-6 h-6 text-blue-600" />}
                      {content.type === 'carousel' && <ImageIcon className="w-6 h-6 text-green-600" />}
                      {content.type === 'live' && <Play className="w-6 h-6 text-red-600" />}
                    </div>

                    {/* 内容信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="text-gray-900 mb-1" style={{ fontSize: '13px', fontWeight: 600 }}>
                            {content.title}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge 
                              className={`h-5 px-2 border ${getStatusColor(content.status)}`}
                              style={{ fontSize: '10px' }}
                            >
                              {content.status === 'scheduled' ? '待发布' : '已发布'}
                            </Badge>
                            <span className="text-gray-500" style={{ fontSize: '11px' }}>
                              {content.type === 'video' ? '视频' : 
                               content.type === 'carousel' ? '图集' :
                               content.type === 'live' ? '直播' : '图片'}
                            </span>
                            <span className="text-gray-400" style={{ fontSize: '11px' }}>•</span>
                            <span className="text-gray-500" style={{ fontSize: '11px' }}>
                              {markets.find(m => m.id === content.market)?.name || '全部市场'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Edit className="w-3.5 h-3.5 text-gray-600" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Copy className="w-3.5 h-3.5 text-gray-600" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-gray-600" style={{ fontSize: '11px' }}>
                            {content.scheduledDate}
                          </span>
                        </div>
                        {content.status === 'published' && (
                          <div className="flex items-center gap-1.5">
                            <Heart className="w-3.5 h-3.5 text-pink-500" />
                            <span className="text-gray-600" style={{ fontSize: '11px' }}>
                              {content.engagement.toLocaleString()} 互动
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 发布渠道 */}
                      <div className="flex items-center gap-2">
                        {content.channels.map(channelId => {
                          const channel = channels.find(c => c.id === channelId);
                          if (!channel) return null;
                          const Icon = channel.icon;
                          return (
                            <div
                              key={channelId}
                              className={`w-6 h-6 rounded flex items-center justify-center bg-gradient-to-br ${channel.color}`}
                              title={channel.name}
                            >
                              <Icon className="w-3.5 h-3.5 text-white" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* 广告活动 */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="bg-white border border-gray-200 rounded shadow-sm">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-gray-900" style={{ fontSize: '14px', fontWeight: 600 }}>
                  广告活动管理
                </h2>
                <p className="text-gray-500 mt-0.5" style={{ fontSize: '11px' }}>
                  付费推广活动追踪与优化
                </p>
              </div>
              <Button className="h-8 px-3 bg-blue-600 hover:bg-blue-700" style={{ fontSize: '11px' }}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                创建活动
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left" style={{ fontSize: '11px', fontWeight: 600 }}>
                      活动名称
                    </th>
                    <th className="px-4 py-3 text-left" style={{ fontSize: '11px', fontWeight: 600 }}>
                      渠道
                    </th>
                    <th className="px-4 py-3 text-left" style={{ fontSize: '11px', fontWeight: 600 }}>
                      市场
                    </th>
                    <th className="px-4 py-3 text-right" style={{ fontSize: '11px', fontWeight: 600 }}>
                      预算/花费
                    </th>
                    <th className="px-4 py-3 text-right" style={{ fontSize: '11px', fontWeight: 600 }}>
                      展示
                    </th>
                    <th className="px-4 py-3 text-right" style={{ fontSize: '11px', fontWeight: 600 }}>
                      点击/CTR
                    </th>
                    <th className="px-4 py-3 text-right" style={{ fontSize: '11px', fontWeight: 600 }}>
                      转化
                    </th>
                    <th className="px-4 py-3 text-right" style={{ fontSize: '11px', fontWeight: 600 }}>
                      CPC
                    </th>
                    <th className="px-4 py-3 text-left" style={{ fontSize: '11px', fontWeight: 600 }}>
                      状态
                    </th>
                    <th className="px-4 py-3 text-center" style={{ fontSize: '11px', fontWeight: 600 }}>
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allCampaigns.map((campaign, index) => (
                    <tr 
                      key={campaign.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <p className="text-gray-900 mb-0.5" style={{ fontSize: '12px', fontWeight: 600 }}>
                          {campaign.name}
                        </p>
                        <p className="text-gray-500" style={{ fontSize: '10px' }}>
                          {campaign.startDate} ~ {campaign.endDate}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {(campaign.channels || []).map(channelId => {
                            const channel = channels.find(c => c.id === channelId);
                            if (!channel) return null;
                            const Icon = channel.icon;
                            return (
                              <div
                                key={channelId}
                                className={`w-6 h-6 rounded flex items-center justify-center bg-gradient-to-br ${channel.color}`}
                              >
                                <Icon className="w-3.5 h-3.5 text-white" />
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-700" style={{ fontSize: '11px' }}>
                          {markets.find(m => m.id === campaign.market)?.flag || '🌍'}
                          {' '}
                          {markets.find(m => m.id === campaign.market)?.name || '全球'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-gray-900 mb-0.5" style={{ fontSize: '12px', fontWeight: 600 }}>
                          ${(campaign.spent || 0).toLocaleString()}
                        </p>
                        <p className="text-gray-500" style={{ fontSize: '10px' }}>
                          / ${(campaign.budget || 0).toLocaleString()}
                        </p>
                        <Progress 
                          value={campaign.budget > 0 ? ((campaign.spent || 0) / campaign.budget) * 100 : 0} 
                          className="h-1 mt-1"
                        />
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900" style={{ fontSize: '12px' }}>
                        {(campaign.impressions || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-gray-900 mb-0.5" style={{ fontSize: '12px', fontWeight: 600 }}>
                          {(campaign.clicks || 0).toLocaleString()}
                        </p>
                        <p className="text-green-600" style={{ fontSize: '10px' }}>
                          CTR {campaign.ctr || 0}%
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-blue-600" style={{ fontSize: '12px', fontWeight: 600 }}>
                          {campaign.conversions || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900" style={{ fontSize: '12px' }}>
                        ${(campaign.cpc || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge 
                          className={`h-5 px-2 border ${getStatusColor(campaign.status)}`}
                          style={{ fontSize: '10px' }}
                        >
                          运行中
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <BarChart3 className="w-3.5 h-3.5 text-gray-600" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Edit className="w-3.5 h-3.5 text-gray-600" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Pause className="w-3.5 h-3.5 text-orange-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* SEO优化 */}
        <TabsContent value="seo" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* SEO健康度 */}
            <div className="bg-white border border-gray-200 rounded shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900" style={{ fontSize: '13px', fontWeight: 600 }}>
                  SEO健康度
                </h3>
                <Badge className="bg-green-100 text-green-700 border-0" style={{ fontSize: '10px' }}>
                  良好
                </Badge>
              </div>
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#10b981"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - 0.78)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-gray-900" style={{ fontSize: '24px', fontWeight: 700 }}>78</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600" style={{ fontSize: '11px' }}>页面收录</span>
                  <span className="text-green-600" style={{ fontSize: '11px', fontWeight: 600 }}>优秀</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600" style={{ fontSize: '11px' }}>移动友好</span>
                  <span className="text-green-600" style={{ fontSize: '11px', fontWeight: 600 }}>优秀</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600" style={{ fontSize: '11px' }}>页面速度</span>
                  <span className="text-yellow-600" style={{ fontSize: '11px', fontWeight: 600 }}>良好</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600" style={{ fontSize: '11px' }}>核心指标</span>
                  <span className="text-green-600" style={{ fontSize: '11px', fontWeight: 600 }}>通过</span>
                </div>
              </div>
            </div>

            {/* 自然搜索流量 */}
            <div className="bg-white border border-gray-200 rounded shadow-sm p-4">
              <h3 className="text-gray-900 mb-4" style={{ fontSize: '13px', fontWeight: 600 }}>
                自然搜索流量
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-600" style={{ fontSize: '11px' }}>本月访问</span>
                    <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>
                      12,450
                    </span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-600" style={{ fontSize: '11px' }}>新用户</span>
                    <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>
                      8,920
                    </span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-600" style={{ fontSize: '11px' }}>询盘转化</span>
                    <span className="text-blue-600" style={{ fontSize: '12px', fontWeight: 600 }}>
                      234
                    </span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600" style={{ fontSize: '11px' }}>环比增长</span>
                    <Badge className="bg-green-100 text-green-700 border-0" style={{ fontSize: '10px' }}>
                      <TrendingUp className="w-3 h-3 mr-0.5" />
                      +15.3%
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* 快捷操作 */}
            <div className="bg-white border border-gray-200 rounded shadow-sm p-4">
              <h3 className="text-gray-900 mb-4" style={{ fontSize: '13px', fontWeight: 600 }}>
                SEO工具
              </h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start h-9" style={{ fontSize: '11px' }}>
                  <Search className="w-4 h-4 mr-2" />
                  关键词研究工具
                </Button>
                <Button variant="outline" className="w-full justify-start h-9" style={{ fontSize: '11px' }}>
                  <FileText className="w-4 h-4 mr-2" />
                  站点地图生成
                </Button>
                <Button variant="outline" className="w-full justify-start h-9" style={{ fontSize: '11px' }}>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  外链分析
                </Button>
                <Button variant="outline" className="w-full justify-start h-9" style={{ fontSize: '11px' }}>
                  <Award className="w-4 h-4 mr-2" />
                  竞品分析
                </Button>
                <Button variant="outline" className="w-full justify-start h-9" style={{ fontSize: '11px' }}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  排名追踪报告
                </Button>
              </div>
            </div>
          </div>

          {/* 关键词排名追踪 */}
          <div className="bg-white border border-gray-200 rounded shadow-sm">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-gray-900" style={{ fontSize: '14px', fontWeight: 600 }}>
                  关键词排名追踪
                </h2>
                <p className="text-gray-500 mt-0.5" style={{ fontSize: '11px' }}>
                  监控核心关键词在Google的排名变化
                </p>
              </div>
              <Button className="h-8 px-3 bg-blue-600 hover:bg-blue-700" style={{ fontSize: '11px' }}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                添加关键词
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left" style={{ fontSize: '11px', fontWeight: 600 }}>
                      关键词
                    </th>
                    <th className="px-4 py-3 text-left" style={{ fontSize: '11px', fontWeight: 600 }}>
                      市场
                    </th>
                    <th className="px-4 py-3 text-center" style={{ fontSize: '11px', fontWeight: 600 }}>
                      当前排名
                    </th>
                    <th className="px-4 py-3 text-center" style={{ fontSize: '11px', fontWeight: 600 }}>
                      排名变化
                    </th>
                    <th className="px-4 py-3 text-right" style={{ fontSize: '11px', fontWeight: 600 }}>
                      搜索量
                    </th>
                    <th className="px-4 py-3 text-center" style={{ fontSize: '11px', fontWeight: 600 }}>
                      竞争度
                    </th>
                    <th className="px-4 py-3 text-left" style={{ fontSize: '11px', fontWeight: 600 }}>
                      目标页面
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {seoKeywords.map((keyword, index) => (
                    <tr 
                      key={index}
                      className={`border-b border-gray-100 hover:bg-gray-50 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>
                            {keyword.keyword}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-700" style={{ fontSize: '11px' }}>
                          {markets.find(m => m.id === keyword.market)?.flag || '🌍'}
                          {' '}
                          {markets.find(m => m.id === keyword.market)?.name.replace('市场', '') || '全球'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge 
                          className={`h-6 px-2.5 border ${
                            keyword.position <= 3 ? 'bg-green-100 text-green-800 border-green-300' :
                            keyword.position <= 10 ? 'bg-blue-100 text-blue-800 border-blue-300' :
                            'bg-gray-100 text-gray-800 border-gray-300'
                          }`}
                          style={{ fontSize: '11px', fontWeight: 600 }}
                        >
                          #{keyword.position}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {keyword.change > 0 ? (
                            <>
                              <TrendingUp className="w-4 h-4 text-green-600" />
                              <span className="text-green-600" style={{ fontSize: '12px', fontWeight: 600 }}>
                                +{keyword.change}
                              </span>
                            </>
                          ) : keyword.change < 0 ? (
                            <>
                              <TrendingDown className="w-4 h-4 text-red-600" />
                              <span className="text-red-600" style={{ fontSize: '12px', fontWeight: 600 }}>
                                {keyword.change}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-500" style={{ fontSize: '12px' }}>-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900" style={{ fontSize: '12px' }}>
                        {keyword.volume.toLocaleString()}/月
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Progress value={keyword.difficulty} className="h-1.5 w-16" />
                          <span 
                            className={
                              keyword.difficulty < 40 ? 'text-green-600' :
                              keyword.difficulty < 60 ? 'text-yellow-600' :
                              'text-red-600'
                            }
                            style={{ fontSize: '11px', fontWeight: 600 }}
                          >
                            {keyword.difficulty}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <a 
                          href={keyword.url}
                          className="text-blue-600 hover:underline flex items-center gap-1"
                          style={{ fontSize: '11px' }}
                        >
                          {keyword.url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* 目标受众 */}
        <TabsContent value="audience" className="space-y-4">
          {/* B2B受众画像 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded shadow-sm p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Store className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-900" style={{ fontSize: '16px', fontWeight: 700 }}>
                    34%
                  </p>
                  <p className="text-gray-500" style={{ fontSize: '11px' }}>
                    零售商
                  </p>
                </div>
              </div>
              <p className="text-gray-600 mb-2" style={{ fontSize: '11px' }}>
                单店/连锁零售商店主和采购经理
              </p>
              <Badge variant="outline" className="h-5 px-2" style={{ fontSize: '10px' }}>
                主要目标
              </Badge>
            </div>

            <div className="bg-white border border-gray-200 rounded shadow-sm p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-gray-900" style={{ fontSize: '16px', fontWeight: 700 }}>
                    28%
                  </p>
                  <p className="text-gray-500" style={{ fontSize: '11px' }}>
                    批发商
                  </p>
                </div>
              </div>
              <p className="text-gray-600 mb-2" style={{ fontSize: '11px' }}>
                区域批发分销商和代理商
              </p>
              <Badge variant="outline" className="h-5 px-2" style={{ fontSize: '10px' }}>
                主要目标
              </Badge>
            </div>

            <div className="bg-white border border-gray-200 rounded shadow-sm p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-gray-900" style={{ fontSize: '16px', fontWeight: 700 }}>
                    22%
                  </p>
                  <p className="text-gray-500" style={{ fontSize: '11px' }}>
                    进口商
                  </p>
                </div>
              </div>
              <p className="text-gray-600 mb-2" style={{ fontSize: '11px' }}>
                跨境贸易公司和进口采购商
              </p>
              <Badge variant="outline" className="h-5 px-2" style={{ fontSize: '10px' }}>
                次要目标
              </Badge>
            </div>

            <div className="bg-white border border-gray-200 rounded shadow-sm p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-gray-900" style={{ fontSize: '16px', fontWeight: 700 }}>
                    16%
                  </p>
                  <p className="text-gray-500" style={{ fontSize: '11px' }}>
                    采购经理
                  </p>
                </div>
              </div>
              <p className="text-gray-600 mb-2" style={{ fontSize: '11px' }}>
                企业采购部门决策人员
              </p>
              <Badge variant="outline" className="h-5 px-2" style={{ fontSize: '10px' }}>
                次要目标
              </Badge>
            </div>
          </div>

          {/* 受众分析详情 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 地理分布 */}
            <div className="bg-white border border-gray-200 rounded shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-gray-900" style={{ fontSize: '14px', fontWeight: 600 }}>
                  地理分布
                </h3>
                <p className="text-gray-500 mt-0.5" style={{ fontSize: '11px' }}>
                  目标市场流量来源分布
                </p>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: '12px' }}>🇺🇸</span>
                      <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>
                        北美市场
                      </span>
                    </div>
                    <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>
                      45%
                    </span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: '12px' }}>🇪🇺</span>
                      <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>
                        欧非市场
                      </span>
                    </div>
                    <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>
                      32%
                    </span>
                  </div>
                  <Progress value={32} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: '12px' }}>🇧🇷</span>
                      <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>
                        南美市场
                      </span>
                    </div>
                    <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>
                      23%
                    </span>
                  </div>
                  <Progress value={23} className="h-2" />
                </div>
              </div>
            </div>

            {/* 访问时段 */}
            <div className="bg-white border border-gray-200 rounded shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-gray-900" style={{ fontSize: '14px', fontWeight: 600 }}>
                  最佳发布时段
                </h3>
                <p className="text-gray-500 mt-0.5" style={{ fontSize: '11px' }}>
                  B2B客户活跃时间分析
                </p>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between p-2.5 bg-green-50 rounded border border-green-200">
                  <div>
                    <p className="text-gray-900 mb-0.5" style={{ fontSize: '12px', fontWeight: 600 }}>
                      工作日 9:00-11:00
                    </p>
                    <p className="text-gray-600" style={{ fontSize: '10px' }}>
                      北美市场最佳时段
                    </p>
                  </div>
                  <Badge className="bg-green-600 text-white border-0" style={{ fontSize: '10px' }}>
                    最佳
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-blue-50 rounded border border-blue-200">
                  <div>
                    <p className="text-gray-900 mb-0.5" style={{ fontSize: '12px', fontWeight: 600 }}>
                      工作日 14:00-16:00
                    </p>
                    <p className="text-gray-600" style={{ fontSize: '10px' }}>
                      欧非市场最佳时段
                    </p>
                  </div>
                  <Badge className="bg-blue-600 text-white border-0" style={{ fontSize: '10px' }}>
                    良好
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-purple-50 rounded border border-purple-200">
                  <div>
                    <p className="text-gray-900 mb-0.5" style={{ fontSize: '12px', fontWeight: 600 }}>
                      工作日 10:00-12:00
                    </p>
                    <p className="text-gray-600" style={{ fontSize: '10px' }}>
                      南美市场最佳时段
                    </p>
                  </div>
                  <Badge className="bg-purple-600 text-white border-0" style={{ fontSize: '10px' }}>
                    良好
                  </Badge>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-gray-600" style={{ fontSize: '11px' }}>
                    💡 建议：B2B客户主要在工作时间浏览，避免周末和非工作时段发布
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 内容策略建议 */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded shadow-sm p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-gray-900 mb-2" style={{ fontSize: '14px', fontWeight: 600 }}>
                  B2B社媒营销策略建议
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white rounded p-3 border border-gray-200">
                    <p className="text-gray-900 mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>
                      📸 Instagram策略
                    </p>
                    <p className="text-gray-600" style={{ fontSize: '11px' }}>
                      • 产品展示图+工厂实拍<br/>
                      • 客户案例和成功故事<br/>
                      • 行业展会和认证证书<br/>
                      • 使用B2B相关标签
                    </p>
                  </div>
                  <div className="bg-white rounded p-3 border border-gray-200">
                    <p className="text-gray-900 mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>
                      🎵 TikTok策略
                    </p>
                    <p className="text-gray-600" style={{ fontSize: '11px' }}>
                      • 工厂生产流程短视频<br/>
                      • 产品功能演示<br/>
                      • 包装和物流展示<br/>
                      • 批发优势说明
                    </p>
                  </div>
                  <div className="bg-white rounded p-3 border border-gray-200">
                    <p className="text-gray-900 mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>
                      📘 Facebook策略
                    </p>
                    <p className="text-gray-600" style={{ fontSize: '11px' }}>
                      • 创建B2B专页和群组<br/>
                      • 发布行业资讯和趋势<br/>
                      • 客户评价和合作反馈<br/>
                      • 精准广告投放
                    </p>
                  </div>
                  <div className="bg-white rounded p-3 border border-gray-200">
                    <p className="text-gray-900 mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>
                      🔍 Google SEO策略
                    </p>
                    <p className="text-gray-600" style={{ fontSize: '11px' }}>
                      • 优化B2B长尾关键词<br/>
                      • 创建产品详细页面<br/>
                      • 建立行业博客内容<br/>
                      • 获取高质量外链
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 全链路追踪 */}
        <TabsContent value="tracking" className="space-y-4">
          <CampaignTrackingDashboard createdCampaigns={campaigns} />
        </TabsContent>

        {/* 线索管理 */}
        <TabsContent value="leads" className="space-y-4">
          <SocialMediaLeadsFlow />
        </TabsContent>

        {/* 账号管理 */}
        <TabsContent value="accounts" className="space-y-4">
          <SocialMediaAccounts />
        </TabsContent>

        {/* API集成 */}
        <TabsContent value="api" className="space-y-4">
          <SocialMediaAPIDemo />
        </TabsContent>

        {/* 🔥 客户录入评估 - 社媒营销的最末端，由运营专员完成 */}
        <TabsContent value="customer-intake" className="space-y-4">
          <CustomerIntakeSystem userRole="Marketing_Ops" />
        </TabsContent>
      </Tabs>

      {/* 活动创建向导 */}
      {showCampaignWizard && (
        <SocialMediaCampaignWizard 
          onClose={() => setShowCampaignWizard(false)} 
          onPublish={handlePublishCampaign}
        />
      )}
    </div>
  );
}
