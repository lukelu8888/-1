import React, { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import { 
  TrendingUp, TrendingDown, MousePointerClick, Eye, UserPlus,
  FileText, ShoppingCart, DollarSign, ExternalLink, Calendar,
  Instagram, Facebook, Youtube, Search, Filter, Download,
  BarChart3, Target, Users, Globe, ArrowRight, CheckCircle2,
  Clock, AlertCircle, Sparkles, Link as LinkIcon, Hash
} from 'lucide-react';

// TikTok图标组件
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

interface Campaign {
  id: string;
  name: string;
  channel?: string;
  channels?: string[];
  status: 'active' | 'paused' | 'completed';
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  // 转化漏斗数据
  impressions: number;
  clicks: number;
  visits: number;
  registrations: number;
  inquiries: number;
  quotes: number;
  orders: number;
  revenue: number;
}

interface CampaignTrackingDashboardProps {
  createdCampaigns?: any[];
}

export default function CampaignTrackingDashboard({ createdCampaigns = [] }: CampaignTrackingDashboardProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30days');
  const [selectedMarket, setSelectedMarket] = useState<string>('all');

  // 模拟营销活动数据（示例）
  const sampleCampaigns: Campaign[] = [
    {
      id: 'camp-001',
      name: '北美Q4卫浴产品推广',
      channel: 'facebook',
      status: 'active',
      startDate: '2025-11-01',
      endDate: '2025-11-30',
      budget: 5000,
      spent: 3240,
      impressions: 125000,
      clicks: 2890,
      visits: 2456,
      registrations: 189,
      inquiries: 67,
      quotes: 28,
      orders: 12,
      revenue: 45600
    },
    {
      id: 'camp-002',
      name: 'TikTok爆款测试 - 门锁系列',
      channel: 'tiktok',
      status: 'active',
      startDate: '2025-11-10',
      endDate: '2025-11-25',
      budget: 3000,
      spent: 2100,
      impressions: 450000,
      clicks: 8900,
      visits: 7234,
      registrations: 456,
      inquiries: 124,
      quotes: 48,
      orders: 18,
      revenue: 67800
    },
    {
      id: 'camp-003',
      name: 'Instagram B2B采购指南',
      channel: 'instagram',
      status: 'active',
      startDate: '2025-11-05',
      endDate: '2025-11-20',
      budget: 2000,
      spent: 1890,
      impressions: 78000,
      clicks: 1240,
      visits: 998,
      registrations: 78,
      inquiries: 34,
      quotes: 15,
      orders: 6,
      revenue: 22400
    },
    {
      id: 'camp-004',
      name: 'Google搜索广告 - 批发关键词',
      channel: 'google',
      status: 'active',
      startDate: '2025-11-01',
      endDate: '2025-11-30',
      budget: 4000,
      spent: 3560,
      impressions: 89000,
      clicks: 3420,
      visits: 3124,
      registrations: 234,
      inquiries: 89,
      quotes: 38,
      orders: 16,
      revenue: 58900
    },
  ];

  // 合并新创建的活动和示例数据
  const campaigns: Campaign[] = [
    ...createdCampaigns.map(camp => ({
      id: camp.id,
      name: camp.name,
      channel: camp.channels?.[0] || 'instagram',
      channels: camp.channels,
      status: camp.status,
      startDate: camp.startDate,
      endDate: camp.endDate,
      budget: camp.budget,
      spent: camp.spent || 0,
      impressions: camp.impressions || 0,
      clicks: camp.clicks || 0,
      visits: camp.visits || 0,
      registrations: camp.registrations || 0,
      inquiries: camp.inquiries || 0,
      quotes: camp.quotes || 0,
      orders: camp.orders || 0,
      revenue: camp.revenue || 0,
    })),
    ...sampleCampaigns
  ];

  const channels = [
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'from-purple-500 to-pink-500' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'from-blue-600 to-blue-400' },
    { id: 'tiktok', name: 'TikTok', icon: TikTokIcon, color: 'from-black to-gray-700' },
    { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'from-red-600 to-red-400' },
    { id: 'google', name: 'Google Ads', icon: Search, color: 'from-green-600 to-blue-600' },
  ];

  // 聚合数据
  const filteredCampaigns = selectedCampaign === 'all' 
    ? campaigns 
    : campaigns.filter(c => c.id === selectedCampaign);

  const totals = filteredCampaigns.reduce((acc, camp) => ({
    budget: acc.budget + camp.budget,
    spent: acc.spent + camp.spent,
    impressions: acc.impressions + camp.impressions,
    clicks: acc.clicks + camp.clicks,
    visits: acc.visits + camp.visits,
    registrations: acc.registrations + camp.registrations,
    inquiries: acc.inquiries + camp.inquiries,
    quotes: acc.quotes + camp.quotes,
    orders: acc.orders + camp.orders,
    revenue: acc.revenue + camp.revenue,
  }), {
    budget: 0, spent: 0, impressions: 0, clicks: 0, visits: 0,
    registrations: 0, inquiries: 0, quotes: 0, orders: 0, revenue: 0
  });

  // 转化率计算
  const conversionRates = {
    ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions * 100).toFixed(2) : '0',
    visitRate: totals.clicks > 0 ? (totals.visits / totals.clicks * 100).toFixed(2) : '0',
    registrationRate: totals.visits > 0 ? (totals.registrations / totals.visits * 100).toFixed(2) : '0',
    inquiryRate: totals.registrations > 0 ? (totals.inquiries / totals.registrations * 100).toFixed(2) : '0',
    quoteRate: totals.inquiries > 0 ? (totals.quotes / totals.inquiries * 100).toFixed(2) : '0',
    orderRate: totals.quotes > 0 ? (totals.orders / totals.quotes * 100).toFixed(2) : '0',
    overallConversion: totals.clicks > 0 ? (totals.orders / totals.clicks * 100).toFixed(2) : '0',
  };

  // ROI计算
  const roi = totals.spent > 0 ? ((totals.revenue - totals.spent) / totals.spent * 100).toFixed(1) : '0';
  const roas = totals.spent > 0 ? (totals.revenue / totals.spent).toFixed(2) : '0';
  const cpa = totals.orders > 0 ? (totals.spent / totals.orders).toFixed(2) : '0';

  const getChannelInfo = (channelId: string) => {
    return channels.find(c => c.id === channelId);
  };

  return (
    <div className="space-y-4 pb-6">
      {/* 页面标题栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-1" style={{ fontSize: '18px', fontWeight: 700 }}>
            全链路追踪仪表板
          </h1>
          <p className="text-gray-500" style={{ fontSize: '12px' }}>
            从广告点击到订单成交的完整转化漏斗分析
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
            <SelectTrigger className="h-9 w-48" style={{ fontSize: '12px' }}>
              <Filter className="w-4 h-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" style={{ fontSize: '12px' }}>全部活动</SelectItem>
              {campaigns.map(camp => (
                <SelectItem key={camp.id} value={camp.id} style={{ fontSize: '12px' }}>
                  {camp.name}
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
          <Button variant="outline" className="h-9 px-4" style={{ fontSize: '12px' }}>
            <Download className="w-4 h-4 mr-1.5" />
            导出报告
          </Button>
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <Badge className={`h-5 px-2 border-0 ${
              Number(roi) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`} style={{ fontSize: '10px' }}>
              {Number(roi) >= 0 ? '+' : ''}{roi}% ROI
            </Badge>
          </div>
          <p className="text-gray-500 mb-1" style={{ fontSize: '11px' }}>总收入</p>
          <p className="text-gray-900 mb-1" style={{ fontSize: '20px', fontWeight: 700 }}>
            ${totals.revenue.toLocaleString()}
          </p>
          <p className="text-gray-500" style={{ fontSize: '10px' }}>
            花费 ${totals.spent.toLocaleString()} / ROAS {roas}x
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-green-600" />
            </div>
            <Badge className="bg-green-100 text-green-700 border-0" style={{ fontSize: '10px' }}>
              <TrendingUp className="w-3 h-3 mr-0.5" />
              {conversionRates.overallConversion}%
            </Badge>
          </div>
          <p className="text-gray-500 mb-1" style={{ fontSize: '11px' }}>订单总数</p>
          <p className="text-gray-900 mb-1" style={{ fontSize: '20px', fontWeight: 700 }}>
            {totals.orders}
          </p>
          <p className="text-gray-500" style={{ fontSize: '10px' }}>
            CPA ${cpa} / 总转化率 {conversionRates.overallConversion}%
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <Badge className="bg-blue-100 text-blue-700 border-0" style={{ fontSize: '10px' }}>
              {conversionRates.inquiryRate}%
            </Badge>
          </div>
          <p className="text-gray-500 mb-1" style={{ fontSize: '11px' }}>询盘数量</p>
          <p className="text-gray-900 mb-1" style={{ fontSize: '20px', fontWeight: 700 }}>
            {totals.inquiries}
          </p>
          <p className="text-gray-500" style={{ fontSize: '10px' }}>
            从 {totals.registrations} 次注册转化
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <MousePointerClick className="w-5 h-5 text-orange-600" />
            </div>
            <Badge className="bg-green-100 text-green-700 border-0" style={{ fontSize: '10px' }}>
              CTR {conversionRates.ctr}%
            </Badge>
          </div>
          <p className="text-gray-500 mb-1" style={{ fontSize: '11px' }}>总点击数</p>
          <p className="text-gray-900 mb-1" style={{ fontSize: '20px', fontWeight: 700 }}>
            {totals.clicks.toLocaleString()}
          </p>
          <p className="text-gray-500" style={{ fontSize: '10px' }}>
            从 {(totals.impressions / 1000).toFixed(0)}K 次展示
          </p>
        </div>
      </div>

      {/* 转化漏斗可视化 */}
      <div className="bg-white border border-gray-200 rounded shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-gray-900 flex items-center gap-2" style={{ fontSize: '16px', fontWeight: 600 }}>
            <Target className="w-5 h-5" />
            转化漏斗分析
          </h2>
          <p className="text-gray-500 mt-1" style={{ fontSize: '12px' }}>
            从广告展示到最终成交的完整用户旅程
          </p>
        </div>

        <div className="space-y-4">
          {/* 第1步：展示 */}
          <div className="relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-gray-900 mb-0.5" style={{ fontSize: '14px', fontWeight: 600 }}>
                      1. 广告展示
                    </p>
                    <p className="text-gray-500" style={{ fontSize: '11px' }}>
                      广告在社媒平台上的展示次数
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-900" style={{ fontSize: '18px', fontWeight: 700 }}>
                      {(totals.impressions / 1000).toFixed(0)}K
                    </p>
                    <p className="text-gray-500" style={{ fontSize: '10px' }}>
                      展示次数
                    </p>
                  </div>
                </div>
                <Progress value={100} className="h-3" />
              </div>
            </div>
            <div className="absolute left-6 top-14 w-0.5 h-6 bg-gray-300"></div>
          </div>

          {/* 第2步：点击 */}
          <div className="relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                <MousePointerClick className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-gray-900 mb-0.5" style={{ fontSize: '14px', fontWeight: 600 }}>
                      2. 广告点击
                    </p>
                    <p className="text-gray-500" style={{ fontSize: '11px' }}>
                      用户点击广告进入落地页
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-900" style={{ fontSize: '18px', fontWeight: 700 }}>
                      {totals.clicks.toLocaleString()}
                    </p>
                    <Badge className="bg-green-100 text-green-700 border-0 mt-1" style={{ fontSize: '10px' }}>
                      CTR {conversionRates.ctr}%
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0} 
                  className="h-3" 
                />
              </div>
            </div>
            <div className="absolute left-6 top-14 w-0.5 h-6 bg-gray-300"></div>
          </div>

          {/* 第3步：访问 */}
          <div className="relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-gray-900 mb-0.5" style={{ fontSize: '14px', fontWeight: 600 }}>
                      3. 网站访问
                    </p>
                    <p className="text-gray-500" style={{ fontSize: '11px' }}>
                      成功加载落地页的访问量
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-900" style={{ fontSize: '18px', fontWeight: 700 }}>
                      {totals.visits.toLocaleString()}
                    </p>
                    <Badge className="bg-green-100 text-green-700 border-0 mt-1" style={{ fontSize: '10px' }}>
                      {conversionRates.visitRate}% 到达率
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={totals.clicks > 0 ? (totals.visits / totals.clicks) * 100 : 0} 
                  className="h-3" 
                />
              </div>
            </div>
            <div className="absolute left-6 top-14 w-0.5 h-6 bg-gray-300"></div>
          </div>

          {/* 第4步：注册 */}
          <div className="relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-gray-900 mb-0.5" style={{ fontSize: '14px', fontWeight: 600 }}>
                      4. 用户注册
                    </p>
                    <p className="text-gray-500" style={{ fontSize: '11px' }}>
                      完成账号注册的新用户
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-900" style={{ fontSize: '18px', fontWeight: 700 }}>
                      {totals.registrations}
                    </p>
                    <Badge className="bg-green-100 text-green-700 border-0 mt-1" style={{ fontSize: '10px' }}>
                      {conversionRates.registrationRate}% 注册率
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={totals.visits > 0 ? (totals.registrations / totals.visits) * 100 : 0} 
                  className="h-3" 
                />
              </div>
            </div>
            <div className="absolute left-6 top-14 w-0.5 h-6 bg-gray-300"></div>
          </div>

          {/* 第5步：询价 */}
          <div className="relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-gray-900 mb-0.5" style={{ fontSize: '14px', fontWeight: 600 }}>
                      5. 提交询价
                    </p>
                    <p className="text-gray-500" style={{ fontSize: '11px' }}>
                      发起询价请求的潜在客户
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-900" style={{ fontSize: '18px', fontWeight: 700 }}>
                      {totals.inquiries}
                    </p>
                    <Badge className="bg-blue-100 text-blue-700 border-0 mt-1" style={{ fontSize: '10px' }}>
                      {conversionRates.inquiryRate}% 询价率
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={totals.registrations > 0 ? (totals.inquiries / totals.registrations) * 100 : 0} 
                  className="h-3" 
                />
              </div>
            </div>
            <div className="absolute left-6 top-14 w-0.5 h-6 bg-gray-300"></div>
          </div>

          {/* 第6步：报价 */}
          <div className="relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-gray-900 mb-0.5" style={{ fontSize: '14px', fontWeight: 600 }}>
                      6. 收到报价
                    </p>
                    <p className="text-gray-500" style={{ fontSize: '11px' }}>
                      销售团队发送的正式报价
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-900" style={{ fontSize: '18px', fontWeight: 700 }}>
                      {totals.quotes}
                    </p>
                    <Badge className="bg-purple-100 text-purple-700 border-0 mt-1" style={{ fontSize: '10px' }}>
                      {conversionRates.quoteRate}% 报价率
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={totals.inquiries > 0 ? (totals.quotes / totals.inquiries) * 100 : 0} 
                  className="h-3" 
                />
              </div>
            </div>
            <div className="absolute left-6 top-14 w-0.5 h-6 bg-gray-300"></div>
          </div>

          {/* 第7步：成交 */}
          <div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-gray-900 mb-0.5" style={{ fontSize: '14px', fontWeight: 600 }}>
                      7. 订单成交
                    </p>
                    <p className="text-gray-500" style={{ fontSize: '11px' }}>
                      最终完成交易的订单
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-600" style={{ fontSize: '18px', fontWeight: 700 }}>
                      {totals.orders}
                    </p>
                    <Badge className="bg-green-100 text-green-700 border-0 mt-1" style={{ fontSize: '10px' }}>
                      {conversionRates.orderRate}% 成交率
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={totals.quotes > 0 ? (totals.orders / totals.quotes) * 100 : 0} 
                  className="h-3" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* 漏斗总结 */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-900 mb-2" style={{ fontSize: '14px', fontWeight: 600 }}>
                  漏斗转化总结
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white rounded p-3">
                    <p className="text-gray-500 mb-1" style={{ fontSize: '10px' }}>整体转化率</p>
                    <p className="text-green-600" style={{ fontSize: '16px', fontWeight: 700 }}>
                      {conversionRates.overallConversion}%
                    </p>
                    <p className="text-gray-500" style={{ fontSize: '9px' }}>
                      点击→订单
                    </p>
                  </div>
                  <div className="bg-white rounded p-3">
                    <p className="text-gray-500 mb-1" style={{ fontSize: '10px' }}>平均订单价值</p>
                    <p className="text-blue-600" style={{ fontSize: '16px', fontWeight: 700 }}>
                      ${totals.orders > 0 ? (totals.revenue / totals.orders).toFixed(0) : '0'}
                    </p>
                    <p className="text-gray-500" style={{ fontSize: '9px' }}>
                      AOV
                    </p>
                  </div>
                  <div className="bg-white rounded p-3">
                    <p className="text-gray-500 mb-1" style={{ fontSize: '10px' }}>获客成本</p>
                    <p className="text-orange-600" style={{ fontSize: '16px', fontWeight: 700 }}>
                      ${cpa}
                    </p>
                    <p className="text-gray-500" style={{ fontSize: '9px' }}>
                      CPA
                    </p>
                  </div>
                  <div className="bg-white rounded p-3">
                    <p className="text-gray-500 mb-1" style={{ fontSize: '10px' }}>广告回报率</p>
                    <p className="text-purple-600" style={{ fontSize: '16px', fontWeight: 700 }}>
                      {roas}x
                    </p>
                    <p className="text-gray-500" style={{ fontSize: '9px' }}>
                      ROAS
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 各活动详细数据表格 */}
      <div className="bg-white border border-gray-200 rounded shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-gray-900" style={{ fontSize: '16px', fontWeight: 600 }}>
            活动详细数据
          </h2>
          <p className="text-gray-500 mt-0.5" style={{ fontSize: '12px' }}>
            每个活动的完整追踪数据
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left" style={{ fontSize: '11px', fontWeight: 600 }}>
                  活动名称
                </th>
                <th className="px-4 py-3 text-center" style={{ fontSize: '11px', fontWeight: 600 }}>
                  状态
                </th>
                <th className="px-4 py-3 text-right" style={{ fontSize: '11px', fontWeight: 600 }}>
                  展示
                </th>
                <th className="px-4 py-3 text-right" style={{ fontSize: '11px', fontWeight: 600 }}>
                  点击
                </th>
                <th className="px-4 py-3 text-right" style={{ fontSize: '11px', fontWeight: 600 }}>
                  访问
                </th>
                <th className="px-4 py-3 text-right" style={{ fontSize: '11px', fontWeight: 600 }}>
                  注册
                </th>
                <th className="px-4 py-3 text-right" style={{ fontSize: '11px', fontWeight: 600 }}>
                  询价
                </th>
                <th className="px-4 py-3 text-right" style={{ fontSize: '11px', fontWeight: 600 }}>
                  报价
                </th>
                <th className="px-4 py-3 text-right" style={{ fontSize: '11px', fontWeight: 600 }}>
                  订单
                </th>
                <th className="px-4 py-3 text-right" style={{ fontSize: '11px', fontWeight: 600 }}>
                  收入
                </th>
                <th className="px-4 py-3 text-right" style={{ fontSize: '11px', fontWeight: 600 }}>
                  ROI
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.map((campaign, index) => {
                const channelInfo = getChannelInfo(campaign.channel || campaign.channels?.[0] || 'instagram');
                const Icon = channelInfo?.icon || Instagram;
                const campaignRoi = campaign.spent > 0 
                  ? ((campaign.revenue - campaign.spent) / campaign.spent * 100).toFixed(1)
                  : '0';
                
                return (
                  <tr 
                    key={campaign.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        {channelInfo && (
                          <div className={`w-8 h-8 rounded flex items-center justify-center bg-gradient-to-br ${channelInfo.color} flex-shrink-0`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div>
                          <p className="text-gray-900 mb-0.5" style={{ fontSize: '12px', fontWeight: 600 }}>
                            {campaign.name}
                          </p>
                          <p className="text-gray-500" style={{ fontSize: '10px' }}>
                            {campaign.startDate} ~ {campaign.endDate}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge 
                        className={`h-5 px-2 border ${
                          campaign.status === 'active' ? 'bg-green-100 text-green-800 border-green-300' :
                          campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                          'bg-gray-100 text-gray-800 border-gray-300'
                        }`}
                        style={{ fontSize: '10px' }}
                      >
                        {campaign.status === 'active' ? '运行中' : campaign.status === 'paused' ? '已暂停' : '已完成'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700" style={{ fontSize: '12px' }}>
                      {(campaign.impressions / 1000).toFixed(0)}K
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>
                      {campaign.clicks.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700" style={{ fontSize: '12px' }}>
                      {campaign.visits.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-600" style={{ fontSize: '12px', fontWeight: 600 }}>
                      {campaign.registrations}
                    </td>
                    <td className="px-4 py-3 text-right text-purple-600" style={{ fontSize: '12px', fontWeight: 600 }}>
                      {campaign.inquiries}
                    </td>
                    <td className="px-4 py-3 text-right text-orange-600" style={{ fontSize: '12px', fontWeight: 600 }}>
                      {campaign.quotes}
                    </td>
                    <td className="px-4 py-3 text-right text-green-600" style={{ fontSize: '12px', fontWeight: 700 }}>
                      {campaign.orders}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>
                      ${campaign.revenue.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge 
                        className={`h-5 px-2 border-0 ${
                          Number(campaignRoi) >= 100 ? 'bg-green-100 text-green-700' :
                          Number(campaignRoi) >= 0 ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}
                        style={{ fontSize: '10px' }}
                      >
                        {Number(campaignRoi) >= 0 ? '+' : ''}{campaignRoi}%
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
