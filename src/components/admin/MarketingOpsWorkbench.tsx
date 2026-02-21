import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner@2.0.3';
import { 
  Megaphone,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Activity,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
  Video,
  Share2,
  ThumbsUp,
  Eye,
  MousePointerClick,
  Calendar,
  Filter,
  Plus,
  Upload,
  Download,
  RefreshCw,
  Award,
  Zap,
  Waves,
  Send,
  Play,
  Instagram,
  Linkedin,
  Facebook,
  Globe,
  Mail,
  Phone,
  MapPin,
  Building2,
  ArrowRight,
  Star,
  Percent,
  TrendingUpIcon,
  FileText,
  Edit,
  ExternalLink
} from 'lucide-react';
import { 
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface MarketingOpsWorkbenchProps {
  userRole?: string;
}

export default function MarketingOpsWorkbench({ userRole = 'Marketing_Operations' }: MarketingOpsWorkbenchProps) {
  const [showAddLeadDialog, setShowAddLeadDialog] = useState(false);
  const [showBatchImportDialog, setShowBatchImportDialog] = useState(false);

  // 📊 核心KPI数据
  const kpiData = {
    monthlyLeads: {
      value: 328,
      target: 400,
      progress: 82,
      trend: '+24%',
      lastMonth: 264
    },
    qualificationRate: {
      value: 67,
      trend: '+5%',
      benchmark: 58,
      description: '行业平均58%'
    },
    channelROI: {
      value: 4.2,
      description: '每投入$1产出$4.2',
      trend: '+0.8'
    },
    conversionRate: {
      value: 18,
      description: '我引流的客户最终成交率',
      trend: '+3%'
    }
  };

  // 📱 渠道表现数据
  const channelData = [
    { 
      name: 'TikTok', 
      leads: 156, 
      cost: 3200, 
      roi: 5.8,
      topVideo: '门窗配件安装教程#123',
      videoViews: '245K',
      conversionRate: 0.064,
      icon: Video,
      color: '#000000'
    },
    { 
      name: 'LinkedIn', 
      leads: 89, 
      cost: 4500, 
      roi: 3.2,
      topPost: 'B2B采购指南',
      impressions: '89K',
      conversionRate: 0.10,
      icon: Linkedin,
      color: '#0077B5'
    },
    { 
      name: 'Facebook', 
      leads: 52, 
      cost: 2800, 
      roi: 2.8,
      topCampaign: '门窗配件-北美',
      impressions: '156K',
      conversionRate: 0.033,
      icon: Facebook,
      color: '#1877F2'
    },
    { 
      name: 'Google Ads', 
      leads: 31, 
      cost: 1500, 
      roi: 3.5,
      topKeyword: 'hardware supplier',
      clicks: '2.3K',
      conversionRate: 1.35,
      icon: Globe,
      color: '#4285F4'
    }
  ];

  // 📋 待处理任务
  const pendingTasks = [
    {
      type: 'messages',
      title: '新留言',
      count: 23,
      priority: 'high',
      items: [
        { 
          platform: 'TikTok', 
          customer: 'John Smith', 
          message: "What's the MOQ for door hinges?", 
          time: '5分钟前',
          country: '🇺🇸'
        },
        { 
          platform: 'WhatsApp', 
          customer: '+1-555-0123', 
          message: 'Need samples for electrical outlets', 
          time: '12分钟前',
          country: '🇨🇦'
        },
        { 
          platform: 'LinkedIn', 
          customer: 'Michael Chen', 
          message: 'Looking for reliable supplier', 
          time: '25分钟前',
          country: '🇬🇧'
        }
      ]
    },
    {
      type: 'screening',
      title: '待筛选',
      count: 15,
      priority: 'medium',
      description: '今日新增询盘需要初步筛选',
      action: '开始筛选'
    },
    {
      type: 'toPublicPool',
      title: '待录入公海',
      count: 8,
      priority: 'medium',
      description: '已筛选合格，等待录入系统',
      action: '批量录入'
    }
  ];

  // 🎯 公海投放统计
  const publicPoolStats = {
    todayAdded: 12,
    weekAdded: 67,
    monthAdded: 328,
    qualityScore: 4.2,
    claimRate: 78,
    avgClaimTime: '3.5小时',
    topRegion: '北美公海池'
  };

  // 📈 本月趋势数据
  const trendData = [
    { date: '12/1', leads: 8, qualified: 6, claimed: 5 },
    { date: '12/5', leads: 12, qualified: 9, claimed: 7 },
    { date: '12/10', leads: 15, qualified: 11, claimed: 9 },
    { date: '12/15', leads: 18, qualified: 13, claimed: 11 },
    { date: '12/20', leads: 22, qualified: 16, claimed: 13 },
    { date: '12/25', leads: 19, qualified: 14, claimed: 11 },
    { date: '今天', leads: 23, qualified: 17, claimed: 14 }
  ];

  // 客户类型分布（使用系统现有的4种类型）
  const customerTypeData = [
    { name: '直接采购', value: 60, color: '#3B82F6' },
    { name: '验货服务', value: 15, color: '#10B981' },
    { name: '代理服务', value: 15, color: '#8B5CF6' },
    { name: '一站式项目', value: 10, color: '#F97316' }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 flex items-center gap-3" style={{ fontSize: '24px', fontWeight: 700 }}>
            <Megaphone className="w-7 h-7 text-purple-600" />
            运营专员工作台
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
              Marketing Ops
            </Badge>
          </h1>
          <p className="text-slate-600 mt-1" style={{ fontSize: '14px' }}>
            社媒运营 · 渠道引流 · 客户筛选 · 公海投放
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            导出报表
          </Button>
          <Button 
            className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            onClick={() => setShowAddLeadDialog(true)}
          >
            <Plus className="w-4 h-4" />
            录入新线索
          </Button>
        </div>
      </div>

      {/* 核心KPI卡片 */}
      <div className="grid grid-cols-4 gap-4">
        {/* 本月引流量 */}
        <Card className="p-5 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
              {kpiData.monthlyLeads.trend}
            </Badge>
          </div>
          <h3 className="text-sm text-slate-600 mb-1">本月引流量</h3>
          <p className="text-3xl font-bold text-slate-900 mb-2">{kpiData.monthlyLeads.value}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">目标: {kpiData.monthlyLeads.target}</span>
              <span className="font-semibold text-purple-600">{kpiData.monthlyLeads.progress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                style={{ width: `${kpiData.monthlyLeads.progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">上月: {kpiData.monthlyLeads.lastMonth}个</p>
          </div>
        </Card>

        {/* 有效线索率 */}
        <Card className="p-5 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
              {kpiData.qualificationRate.trend}
            </Badge>
          </div>
          <h3 className="text-sm text-slate-600 mb-1">有效线索率</h3>
          <p className="text-3xl font-bold text-slate-900 mb-2">{kpiData.qualificationRate.value}%</p>
          <div className="space-y-1">
            <p className="text-xs text-slate-600">
              行业平均: {kpiData.qualificationRate.benchmark}%
            </p>
            <div className="flex items-center gap-1 text-xs text-emerald-600">
              <TrendingUp className="w-3 h-3" />
              <span>优于行业 {kpiData.qualificationRate.value - kpiData.qualificationRate.benchmark}%</span>
            </div>
          </div>
        </Card>

        {/* 渠道ROI */}
        <Card className="p-5 border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
              +{kpiData.channelROI.trend}
            </Badge>
          </div>
          <h3 className="text-sm text-slate-600 mb-1">渠道ROI</h3>
          <p className="text-3xl font-bold text-slate-900 mb-2">{kpiData.channelROI.value}x</p>
          <p className="text-xs text-slate-600">{kpiData.channelROI.description}</p>
        </Card>

        {/* 最终成交转化 */}
        <Card className="p-5 border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
              {kpiData.conversionRate.trend}
            </Badge>
          </div>
          <h3 className="text-sm text-slate-600 mb-1">最终成交转化</h3>
          <p className="text-3xl font-bold text-slate-900 mb-2">{kpiData.conversionRate.value}%</p>
          <p className="text-xs text-slate-600">{kpiData.conversionRate.description}</p>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 左侧：渠道表现和待处理任务 */}
        <div className="col-span-2 space-y-6">
          {/* 渠道表现分析 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                渠道表现分析
              </h2>
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="w-3 h-3" />
                查看详细
              </Button>
            </div>

            <div className="space-y-4">
              {channelData.map((channel, idx) => {
                const ChannelIcon = channel.icon;
                return (
                  <Card key={idx} className="p-4 border-2 hover:border-purple-300 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${channel.color}15` }}
                      >
                        <ChannelIcon className="w-6 h-6" style={{ color: channel.color }} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-slate-900">{channel.name}</h3>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-xs text-slate-600">引流量</p>
                              <p className="font-semibold text-slate-900">{channel.leads}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-600">投入</p>
                              <p className="font-semibold text-slate-900">${(channel.cost / 1000).toFixed(1)}K</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-600">ROI</p>
                              <p className="font-bold text-emerald-600">{channel.roi}x</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-4 text-slate-600">
                            {channel.topVideo && (
                              <span>🎥 {channel.topVideo} · {channel.videoViews}播放</span>
                            )}
                            {channel.topPost && (
                              <span>📝 {channel.topPost} · {channel.impressions}曝光</span>
                            )}
                            {channel.topCampaign && (
                              <span>📢 {channel.topCampaign} · {channel.impressions}曝光</span>
                            )}
                            {channel.topKeyword && (
                              <span>🔍 "{channel.topKeyword}" · {channel.clicks}点击</span>
                            )}
                          </div>
                          <Badge className="bg-slate-100 text-slate-700">
                            转化率 {(channel.conversionRate * 100).toFixed(2)}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* ROI对比图表 */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">渠道ROI对比</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={channelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="roi" fill="url(#colorROI)" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="colorROI" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* 本月引流趋势 */}
          <Card className="p-6">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-5">
              <Activity className="w-5 h-5 text-blue-600" />
              本月引流趋势
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorQualified" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorClaimed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="leads" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorLeads)" name="总引流量" />
                <Area type="monotone" dataKey="qualified" stroke="#3B82F6" fillOpacity={1} fill="url(#colorQualified)" name="合格线索" />
                <Area type="monotone" dataKey="claimed" stroke="#10B981" fillOpacity={1} fill="url(#colorClaimed)" name="已被认领" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* 右侧：待处理任务和公海统计 */}
        <div className="space-y-6">
          {/* 待处理任务 */}
          <Card className="p-5">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              待处理任务
            </h2>

            <div className="space-y-3">
              {/* 新留言 */}
              <Card className="p-4 border-2 border-red-200 bg-red-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-red-600" />
                    <h3 className="font-semibold text-slate-900">新留言</h3>
                  </div>
                  <Badge className="bg-red-500 text-white">{pendingTasks[0].count}</Badge>
                </div>
                
                <div className="space-y-2 mb-3">
                  {pendingTasks[0].items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-lg border text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span>{item.country}</span>
                          <span className="font-semibold text-slate-900">{item.customer}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">{item.platform}</Badge>
                      </div>
                      <p className="text-slate-600 mb-1">{item.message}</p>
                      <p className="text-slate-400">{item.time}</p>
                    </div>
                  ))}
                </div>
                
                <Button className="w-full gap-2 bg-red-600 hover:bg-red-700">
                  <Send className="w-4 h-4" />
                  查看全部留言
                </Button>
              </Card>

              {/* 待筛选 */}
              <Card className="p-4 border-2 border-yellow-200 bg-yellow-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-yellow-600" />
                    <h3 className="font-semibold text-slate-900">待筛选</h3>
                  </div>
                  <Badge className="bg-yellow-500 text-white">{pendingTasks[1].count}</Badge>
                </div>
                <p className="text-xs text-slate-600 mb-3">{pendingTasks[1].description}</p>
                <Button className="w-full gap-2 bg-yellow-600 hover:bg-yellow-700">
                  <Play className="w-4 h-4" />
                  开始筛选
                </Button>
              </Card>

              {/* 待录入公海 */}
              <Card className="p-4 border-2 border-blue-200 bg-blue-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Waves className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-slate-900">待录入公海</h3>
                  </div>
                  <Badge className="bg-blue-500 text-white">{pendingTasks[2].count}</Badge>
                </div>
                <p className="text-xs text-slate-600 mb-3">{pendingTasks[2].description}</p>
                <Button 
                  className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                  onClick={() => setShowBatchImportDialog(true)}
                >
                  <Upload className="w-4 h-4" />
                  批量录入
                </Button>
              </Card>
            </div>
          </Card>

          {/* 公海投放统计 */}
          <Card className="p-5">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <Waves className="w-5 h-5 text-blue-600" />
              公海投放统计
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-slate-600 mb-1">今日投放</p>
                  <p className="text-2xl font-bold text-blue-600">{publicPoolStats.todayAdded}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <p className="text-xs text-slate-600 mb-1">本周投放</p>
                  <p className="text-2xl font-bold text-purple-600">{publicPoolStats.weekAdded}</p>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border-2 border-emerald-200">
                <p className="text-sm text-slate-600 mb-1">本月累计投放</p>
                <p className="text-3xl font-bold text-emerald-600 mb-2">{publicPoolStats.monthAdded}</p>
                <div className="flex items-center gap-2 text-xs">
                  <TrendingUp className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-600">环比上月 +24%</span>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">客户质量评分</span>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${
                          i < Math.floor(publicPoolStats.qualityScore) 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                    <span className="ml-1 text-sm font-semibold text-slate-900">
                      {publicPoolStats.qualityScore}/5
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">认领率</span>
                  <span className="text-sm font-semibold text-emerald-600">{publicPoolStats.claimRate}%</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">平均认领时长</span>
                  <span className="text-sm font-semibold text-slate-900">{publicPoolStats.avgClaimTime}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">最受欢迎池</span>
                  <Badge className="bg-blue-100 text-blue-700">{publicPoolStats.topRegion}</Badge>
                </div>
              </div>

              <Button variant="outline" className="w-full gap-2">
                <Eye className="w-4 h-4" />
                查看公海池
              </Button>
            </div>
          </Card>

          {/* 客户类型分布 */}
          <Card className="p-5">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              客户类型分布
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={customerTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {customerTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {customerTypeData.map((type, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: type.color }}
                  />
                  <span className="text-slate-600">{type.name}</span>
                  <span className="font-semibold text-slate-900 ml-auto">{type.value}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* 快速操作 */}
      <Card className="p-6">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-yellow-600" />
          快速操作
        </h2>
        <div className="grid grid-cols-8 gap-3">
          {[
            { icon: Plus, label: '录入新线索', color: 'purple', onClick: () => setShowAddLeadDialog(true) },
            { icon: Upload, label: '批量导入', color: 'blue', onClick: () => setShowBatchImportDialog(true) },
            { icon: Waves, label: '查看公海池', color: 'cyan' },
            { icon: BarChart3, label: '渠道分析', color: 'emerald' },
            { icon: Calendar, label: '内容日历', color: 'orange' },
            { icon: Video, label: '社媒发布', color: 'pink' },
            { icon: Target, label: '查看转化', color: 'indigo' },
            { icon: Award, label: '学习中心', color: 'yellow' }
          ].map((action, idx) => {
            const ActionIcon = action.icon;
            return (
              <Button
                key={idx}
                variant="outline"
                className="h-24 flex-col gap-2 hover:border-purple-300 hover:bg-purple-50"
                onClick={action.onClick}
              >
                <div className={`w-10 h-10 rounded-lg bg-${action.color}-100 flex items-center justify-center`}>
                  <ActionIcon className={`w-5 h-5 text-${action.color}-600`} />
                </div>
                <span className="text-xs">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </Card>

      {/* 录入新线索对话框 */}
      <Dialog open={showAddLeadDialog} onOpenChange={setShowAddLeadDialog}>
        <DialogContent className="p-0 gap-0 max-w-3xl">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Plus className="w-6 h-6 text-purple-600" />
              录入新线索
            </DialogTitle>
            <DialogDescription>
              填写客户基础信息，初步筛选后录入公海池
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 pt-2 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>公司名称 *</Label>
                <Input placeholder="例如：ABC Hardware Inc." />
              </div>
              <div className="space-y-2">
                <Label>联系人 *</Label>
                <Input placeholder="例如：John Smith" />
              </div>
              <div className="space-y-2">
                <Label>职位</Label>
                <Input placeholder="例如：Procurement Manager" />
              </div>
              <div className="space-y-2">
                <Label>国家 *</Label>
                <select className="w-full border rounded-md px-3 py-2">
                  <option>美国</option>
                  <option>加拿大</option>
                  <option>墨西哥</option>
                  <option>巴西</option>
                  <option>英国</option>
                  <option>德国</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>城市</Label>
                <Input placeholder="例如：New York" />
              </div>
              <div className="space-y-2">
                <Label>客户类型 *</Label>
                <select className="w-full border rounded-md px-3 py-2">
                  <option value="retailer">🏪 建材零售商</option>
                  <option value="project_contractor">🏗️ 项目承包商</option>
                  <option value="inspection_seeker">🔍 验货客户</option>
                  <option value="agency_seeker">🤝 中国代理</option>
                  <option value="local_manufacturer">🏭 本土工厂</option>
                  <option value="wholesaler">📦 批发商</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>邮箱</Label>
                <Input type="email" placeholder="例如：john@abc.com" />
              </div>
              <div className="space-y-2">
                <Label>电话/WhatsApp</Label>
                <Input placeholder="例如：+1-555-0123" />
              </div>
              <div className="space-y-2">
                <Label>公司网址</Label>
                <Input placeholder="例如：www.abc.com" />
              </div>
              <div className="space-y-2">
                <Label>来源渠道 *</Label>
                <select className="w-full border rounded-md px-3 py-2">
                  <option>TikTok</option>
                  <option>LinkedIn</option>
                  <option>Facebook</option>
                  <option>Google Ads</option>
                  <option>Instagram</option>
                  <option>EDM邮件</option>
                  <option>其他</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>客户规模</Label>
                <select className="w-full border rounded-md px-3 py-2">
                  <option value="large">大客户 (&gt;$100K)</option>
                  <option value="medium">中客户 ($10K-100K)</option>
                  <option value="small">小客户 (&lt;$10K)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>意向度 *</Label>
                <select className="w-full border rounded-md px-3 py-2">
                  <option value="high">高意向</option>
                  <option value="medium">中意向</option>
                  <option value="low">低意向</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>来源详情</Label>
              <Input placeholder="例如：TikTok视频#123 - 门窗安装教程" />
            </div>

            <div className="space-y-2">
              <Label>备注</Label>
              <Textarea 
                placeholder="记录客户需求、沟通内容、特殊要求等..."
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter className="p-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowAddLeadDialog(false)}>
              取消
            </Button>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={() => {
                toast.success('线索录入成功！', {
                  description: '已添加到对应区域公海池，业务员可以认领'
                });
                setShowAddLeadDialog(false);
              }}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              录入公海池
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 批量导入对话框 */}
      <Dialog open={showBatchImportDialog} onOpenChange={setShowBatchImportDialog}>
        <DialogContent className="p-0 gap-0 max-w-2xl">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Upload className="w-6 h-6 text-blue-600" />
              批量导入线索
            </DialogTitle>
            <DialogDescription>
              支持Excel/CSV格式，最多一次导入500条
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 pt-2 space-y-4">
            <Card className="p-6 border-2 border-dashed border-blue-300 bg-blue-50 text-center">
              <Upload className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <p className="text-sm text-slate-600 mb-2">拖拽文件到此处或点击选择文件</p>
              <Button variant="outline" className="gap-2">
                <FileText className="w-4 h-4" />
                选择文件
              </Button>
            </Card>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">模板下载</Label>
                <Button variant="link" size="sm" className="gap-2">
                  <Download className="w-3 h-3" />
                  下载Excel模板
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                请按照模板格式填写客户信息，必填字段：公司名称、联系人、国家、客户类型、来源渠道、意向度
              </p>
            </div>

            <Card className="p-4 bg-yellow-50 border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 space-y-1">
                  <p>• 导入前请确保数据格式正确，避免导入失败</p>
                  <p>• 系统会自动去重，已存在的客户将被跳过</p>
                  <p>• 导入后客户将直接进入对应区域的公海池</p>
                </div>
              </div>
            </Card>
          </div>

          <DialogFooter className="p-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowBatchImportDialog(false)}>
              取消
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Upload className="w-4 h-4 mr-2" />
              开始导入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
