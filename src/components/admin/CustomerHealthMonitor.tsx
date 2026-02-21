import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  HeartPulse,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  ShoppingCart,
  DollarSign,
  Target,
  Award,
  Zap,
  RefreshCw,
  Download,
  Filter,
  Search,
  ArrowRight,
  Star,
  Gift,
  Bell,
  TrendingDown as TrendingDownIcon,
  Activity,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ZAxis,
  Area,
  AreaChart
} from 'recharts';

interface CustomerHealthMonitorProps {
  userRole?: string;
  user?: any; // 添加user prop
}

// 客户健康度状态
type HealthStatus = 'healthy' | 'at-risk' | 'critical' | 'lost';

// RFM客户分级
type RFMSegment = 'champion' | 'loyal' | 'potential' | 'new' | 'attention' | 'sleeping' | 'lost';

export default function CustomerHealthMonitor({ userRole = 'CEO', user }: CustomerHealthMonitorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<RFMSegment | 'all'>('all');
  const [selectedHealthStatus, setSelectedHealthStatus] = useState<HealthStatus | 'all'>('all');

  // 🔥 客户健康度总览数据
  const healthOverview = {
    total: 567,
    healthy: 342,
    atRisk: 124,
    critical: 67,
    lost: 34,
    avgHealthScore: 76.5,
    healthScoreChange: 3.2
  };

  // 🔥 客户健康度分布数据
  const healthDistribution = [
    { status: '健康', count: 342, percent: 60.3, color: '#10b981', score: '80-100' },
    { status: '关注', count: 124, percent: 21.9, color: '#f59e0b', score: '60-79' },
    { status: '风险', count: 67, percent: 11.8, color: '#ef4444', score: '40-59' },
    { status: '流失', count: 34, percent: 6.0, color: '#dc2626', score: '0-39' }
  ];

  // 🔥 RFM客户分级数据
  const rfmSegments = [
    { 
      id: 'champion' as RFMSegment,
      name: '冠军客户', 
      enName: 'Champions',
      count: 45, 
      revenue: 2345000,
      avgOrder: 52100,
      color: '#10b981',
      icon: Award,
      description: '最近购买、频繁购买、高消费',
      action: '保持关系，VIP服务'
    },
    { 
      id: 'loyal' as RFMSegment,
      name: '忠诚客户', 
      enName: 'Loyal Customers',
      count: 78, 
      revenue: 1876000,
      avgOrder: 24051,
      color: '#3b82f6',
      icon: Star,
      description: '经常购买，消费稳定',
      action: '提供会员优惠，推荐新品'
    },
    { 
      id: 'potential' as RFMSegment,
      name: '潜力客户', 
      enName: 'Potential Loyalists',
      count: 124, 
      revenue: 1234000,
      avgOrder: 9952,
      color: '#8b5cf6',
      icon: TrendingUp,
      description: '最近购买，有潜力成为忠诚客户',
      action: '培养忠诚度，交叉销售'
    },
    { 
      id: 'new' as RFMSegment,
      name: '新客户', 
      enName: 'New Customers',
      count: 89, 
      revenue: 445000,
      avgOrder: 5000,
      color: '#06b6d4',
      icon: Gift,
      description: '最近首次购买',
      action: '新客欢迎，建立关系'
    },
    { 
      id: 'attention' as RFMSegment,
      name: '需要关注', 
      enName: 'Need Attention',
      count: 97, 
      revenue: 687000,
      avgOrder: 7082,
      color: '#f59e0b',
      icon: Bell,
      description: '购买频率或金额下降',
      action: '主动联系，了解需求'
    },
    { 
      id: 'sleeping' as RFMSegment,
      name: '即将流失', 
      enName: 'About to Sleep',
      count: 67, 
      revenue: 234000,
      avgOrder: 3493,
      color: '#f97316',
      icon: AlertTriangle,
      description: '长时间未购买',
      action: '激活促销，挽回活动'
    },
    { 
      id: 'lost' as RFMSegment,
      name: '流失客户', 
      enName: 'Lost Customers',
      count: 34, 
      revenue: 89000,
      avgOrder: 2618,
      color: '#dc2626',
      icon: XCircle,
      description: '90天以上未购买',
      action: '挽回计划，特别优惠'
    }
  ];

  // 🔥 流失预警客户列表（按风险等级排序）
  const churnRiskCustomers = [
    {
      id: 'C001',
      name: 'ABC Trading Co.',
      region: '北美',
      healthScore: 42,
      lastOrderDays: 78,
      orderFrequencyChange: -45,
      revenueChange: -38,
      contactFrequency: 'low',
      riskLevel: 'high' as const,
      ltv: 234500,
      avgOrderValue: 12300,
      totalOrders: 19,
      preferredContact: 'email'
    },
    {
      id: 'C002',
      name: 'Global Parts Ltd.',
      region: '欧非',
      healthScore: 55,
      lastOrderDays: 62,
      orderFrequencyChange: -32,
      revenueChange: -25,
      contactFrequency: 'medium',
      riskLevel: 'medium' as const,
      ltv: 189000,
      avgOrderValue: 9450,
      totalOrders: 20,
      preferredContact: 'phone'
    },
    {
      id: 'C003',
      name: 'South America Supply',
      region: '南美',
      healthScore: 38,
      lastOrderDays: 92,
      orderFrequencyChange: -58,
      revenueChange: -62,
      contactFrequency: 'low',
      riskLevel: 'critical' as const,
      ltv: 156000,
      avgOrderValue: 7800,
      totalOrders: 20,
      preferredContact: 'whatsapp'
    },
    {
      id: 'C004',
      name: 'Euro Building Materials',
      region: '欧非',
      healthScore: 68,
      lastOrderDays: 45,
      orderFrequencyChange: -18,
      revenueChange: -12,
      contactFrequency: 'high',
      riskLevel: 'low' as const,
      ltv: 445000,
      avgOrderValue: 22250,
      totalOrders: 20,
      preferredContact: 'email'
    },
    {
      id: 'C005',
      name: 'North Pacific Traders',
      region: '北美',
      healthScore: 48,
      lastOrderDays: 71,
      orderFrequencyChange: -41,
      revenueChange: -35,
      contactFrequency: 'low',
      riskLevel: 'high' as const,
      ltv: 312000,
      avgOrderValue: 15600,
      totalOrders: 20,
      preferredContact: 'phone'
    }
  ];

  // 🔥 复购分析数据
  const repurchaseData = [
    { month: '1月', rate: 42.3, avgCycle: 45 },
    { month: '2月', rate: 45.8, avgCycle: 43 },
    { month: '3月', rate: 48.2, avgCycle: 42 },
    { month: '4月', rate: 51.5, avgCycle: 40 },
    { month: '5月', rate: 53.7, avgCycle: 38 },
    { month: '6月', rate: 56.2, avgCycle: 37 },
    { month: '7月', rate: 54.8, avgCycle: 38 },
    { month: '8月', rate: 57.3, avgCycle: 36 },
    { month: '9月', rate: 59.8, avgCycle: 35 },
    { month: '10月', rate: 62.1, avgCycle: 34 }
  ];

  // 🔥 即将到复购周期的客户
  const upcomingRepurchase = [
    { customer: 'ABC Trading Co.', expectedDate: '2024-11-28', daysLeft: 4, probability: 85, lastOrder: 45678 },
    { customer: 'Global Parts Ltd.', expectedDate: '2024-11-30', daysLeft: 6, probability: 78, lastOrder: 38900 },
    { customer: 'Euro Building Materials', expectedDate: '2024-12-02', daysLeft: 8, probability: 92, lastOrder: 52300 },
    { customer: 'Pacific Suppliers', expectedDate: '2024-12-05', daysLeft: 11, probability: 72, lastOrder: 28900 },
    { customer: 'South America Supply', expectedDate: '2024-12-08', daysLeft: 14, probability: 65, lastOrder: 19800 }
  ];

  // 🔥 交叉销售机会
  const crossSellOpportunities = [
    {
      customer: 'ABC Trading Co.',
      region: '北美',
      currentCategory: '电气设备',
      recommendedCategory: '卫浴产品',
      probability: 78,
      potentialRevenue: 45000,
      reason: '同类客户85%也购买此品类'
    },
    {
      customer: 'Global Parts Ltd.',
      region: '欧非',
      currentCategory: '门窗配件',
      recommendedCategory: '劳保用品',
      probability: 82,
      potentialRevenue: 32000,
      reason: '该客户行业通常需要此品类'
    },
    {
      customer: 'Euro Building Materials',
      region: '欧非',
      currentCategory: '卫浴产品',
      recommendedCategory: '电气设备',
      probability: 75,
      potentialRevenue: 56000,
      reason: '购买模式与Top客户相似'
    },
    {
      customer: 'Pacific Suppliers',
      region: '北美',
      currentCategory: '劳保用品',
      recommendedCategory: '门窗配件',
      probability: 68,
      potentialRevenue: 28000,
      reason: '季节性需求预测'
    }
  ];

  // 🔥 VIP客户分级
  const vipTiers = [
    { tier: '钻石VIP', count: 12, minLTV: 500000, color: '#a855f7', benefits: '专属客户经理、优先发货、定制服务' },
    { tier: '铂金VIP', count: 33, minLTV: 200000, color: '#3b82f6', benefits: '优先报价、优惠价格、快速响应' },
    { tier: '黄金VIP', count: 78, minLTV: 100000, color: '#f59e0b', benefits: '会员折扣、积分奖励、新品优先' },
    { tier: '白银VIP', count: 145, minLTV: 50000, color: '#64748b', benefits: '定期优惠、产品推荐、活动邀请' }
  ];

  // 🔥 客户生命周期价值趋势
  const clvTrend = [
    { month: '1月', avgCLV: 45000, topCLV: 234000, medianCLV: 28000 },
    { month: '2月', avgCLV: 47200, topCLV: 245000, medianCLV: 29500 },
    { month: '3月', avgCLV: 49800, topCLV: 256000, medianCLV: 31200 },
    { month: '4月', avgCLV: 52100, topCLV: 267000, medianCLV: 32800 },
    { month: '5月', avgCLV: 54300, topCLV: 278000, medianCLV: 34100 },
    { month: '6月', avgCLV: 56700, topCLV: 289000, medianCLV: 35600 },
    { month: '7月', avgCLV: 58900, topCLV: 298000, medianCLV: 37000 },
    { month: '8月', avgCLV: 61200, topCLV: 312000, medianCLV: 38400 },
    { month: '9月', avgCLV: 63500, topCLV: 325000, medianCLV: 39800 },
    { month: '10月', avgCLV: 65800, topCLV: 338000, medianCLV: 41200 }
  ];

  // 格式化货币
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // 获取健康度颜色
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  // 获取风险等级样式
  const getRiskBadge = (level: 'low' | 'medium' | 'high' | 'critical') => {
    const styles = {
      low: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      high: 'bg-orange-100 text-orange-700 border-orange-300',
      critical: 'bg-red-100 text-red-700 border-red-300'
    };
    const labels = {
      low: '低风险',
      medium: '中风险',
      high: '高风险',
      critical: '严重'
    };
    return { style: styles[level], label: labels[level] };
  };

  // 获取联系方式图标
  const getContactIcon = (method: string) => {
    switch (method) {
      case 'email': return Mail;
      case 'phone': return Phone;
      case 'whatsapp': return MessageSquare;
      default: return Mail;
    }
  };

  return (
    <div className="space-y-3">
      {/* 头部 - 台湾大厂风格 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 flex items-center gap-2 text-lg font-semibold">
            <HeartPulse className="w-5 h-5 text-[#F96302]" />
            客户健康度监控系统
          </h1>
          <p className="text-gray-600 mt-0.5 text-xs">
            Customer Health Monitor · 预防流失 · 促进增长
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-xs border border-[#D1D5DB] rounded hover:bg-gray-50 transition-colors flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            刷新数据
          </button>
          <button className="px-3 py-1.5 text-xs border border-[#D1D5DB] rounded hover:bg-gray-50 transition-colors flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" />
            导出报告
          </button>
        </div>
      </div>

      {/* 第一行：健康度总览KPI - 台湾大厂紧凑风格 */}
      <div className="grid grid-cols-5 gap-3">
        {/* 总客户数 */}
        <div className="bg-white border border-[#E5E7EB] rounded p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-gray-600 rounded flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs text-gray-600">总客户数</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {healthOverview.total}
          </p>
        </div>

        {/* 健康客户 */}
        <div className="bg-white border border-emerald-200 rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-600 rounded flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-gray-600">健康客户</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              {((healthOverview.healthy / healthOverview.total) * 100).toFixed(1)}%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {healthOverview.healthy}
          </p>
        </div>

        {/* 需要关注 */}
        <div className="bg-white border border-yellow-200 rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-yellow-600 rounded flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-gray-600">需要关注</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-yellow-50 text-yellow-700 border border-yellow-200 font-semibold">
              {((healthOverview.atRisk / healthOverview.total) * 100).toFixed(1)}%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {healthOverview.atRisk}
          </p>
        </div>

        {/* 高风险 */}
        <div className="bg-white border border-orange-200 rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-orange-600 rounded flex items-center justify-center">
                <XCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-gray-600">高风险</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 font-semibold">
              {((healthOverview.critical / healthOverview.total) * 100).toFixed(1)}%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {healthOverview.critical}
          </p>
        </div>

        {/* 平均健康分 */}
        <div className="bg-white border border-blue-200 rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-gray-600">平均健康分</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              +{healthOverview.healthScoreChange}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {healthOverview.avgHealthScore}
          </p>
        </div>
      </div>

      {/* RFM客户分级管理 - 台湾大厂紧凑风格 */}
      <div className="bg-white border border-[#E5E7EB] rounded">
        <div className="px-3 py-2 border-b border-[#E5E7EB] bg-[#FAFBFC]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-600" />
              RFM客户分级管理
            </p>
            <p className="text-xs text-gray-500">最近购买 · 购买频率 · 消费金额</p>
          </div>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-4 gap-3">
            {rfmSegments.map((segment, index) => {
              const Icon = segment.icon;
              return (
                <div 
                  key={segment.id}
                  className="bg-[#FAFBFC] rounded border border-[#E5E7EB] p-3 hover:border-gray-300 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: segment.color + '20' }}>
                      <Icon className="w-4 h-4" style={{ color: segment.color }} />
                    </div>
                    <span className="text-sm px-2 py-0.5 rounded font-bold" style={{ backgroundColor: segment.color + '20', color: segment.color, border: `1px solid ${segment.color}40` }}>
                      {segment.count}
                    </span>
                  </div>
                  <div className="mb-2">
                    <p className="text-sm font-semibold text-gray-900">{segment.name}</p>
                    <p className="text-xs text-gray-500">{segment.enName}</p>
                  </div>
                  <div className="space-y-1 mb-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">总收入</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(segment.revenue)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">平均订单</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(segment.avgOrder)}</span>
                    </div>
                  </div>
                  <div className="bg-white rounded border border-gray-200 p-2 mb-1.5">
                    <p className="text-xs text-gray-600 mb-0.5">特征</p>
                    <p className="text-xs text-gray-700">{segment.description}</p>
                  </div>
                  <div className="bg-white rounded border border-gray-200 p-2">
                    <p className="text-xs text-gray-600 mb-0.5">行动</p>
                    <p className="text-xs font-medium" style={{ color: segment.color }}>{segment.action}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 第三行：流失预警 + 复购分析 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 流失预警雷达 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-slate-900 font-semibold flex items-center gap-2" style={{ fontSize: '16px' }}>
                <AlertTriangle className="w-5 h-5 text-red-600" />
                流失预警TOP 5
              </h3>
              <p className="text-xs text-slate-500 mt-1">高风险客户 · 需要立即行动</p>
            </div>
            <Badge variant="destructive" className="gap-1">
              <Bell className="w-3 h-3" />
              {churnRiskCustomers.filter(c => c.riskLevel === 'high' || c.riskLevel === 'critical').length} 个高风险
            </Badge>
          </div>

          <div className="space-y-3">
            {churnRiskCustomers.map((customer, index) => {
              const riskBadge = getRiskBadge(customer.riskLevel);
              const ContactIcon = getContactIcon(customer.preferredContact);
              
              return (
                <div key={customer.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:border-slate-300 transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-900 text-sm">{customer.name}</p>
                        <Badge variant="outline" className="text-xs">{customer.region}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {customer.lastOrderDays}天未下单
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          LTV: {formatCurrency(customer.ltv)}
                        </span>
                      </div>
                    </div>
                    <Badge className={riskBadge.style}>
                      {riskBadge.label}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-white rounded p-2">
                      <p className="text-xs text-slate-600">健康分</p>
                      <p className={`text-lg font-bold ${customer.healthScore >= 60 ? 'text-emerald-600' : customer.healthScore >= 40 ? 'text-orange-600' : 'text-red-600'}`}>
                        {customer.healthScore}
                      </p>
                    </div>
                    <div className="bg-white rounded p-2">
                      <p className="text-xs text-slate-600">频率变化</p>
                      <p className="text-lg font-bold text-red-600">{customer.orderFrequencyChange}%</p>
                    </div>
                    <div className="bg-white rounded p-2">
                      <p className="text-xs text-slate-600">金额变化</p>
                      <p className="text-lg font-bold text-red-600">{customer.revenueChange}%</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 gap-1">
                      <ContactIcon className="w-3 h-3" />
                      立即联系
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 gap-1">
                      <Calendar className="w-3 h-3" />
                      安排跟进
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* 复购分析 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-slate-900 font-semibold flex items-center gap-2" style={{ fontSize: '16px' }}>
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                复购率趋势分析
              </h3>
              <p className="text-xs text-slate-500 mt-1">复购率提升 · 平均周期缩短</p>
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              当前复购率: 62.1%
            </Badge>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={repurchaseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '11px' }} />
              <YAxis yAxisId="left" stroke="#64748b" style={{ fontSize: '11px' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#64748b" style={{ fontSize: '11px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="rate" 
                name="复购率 (%)" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="avgCycle" 
                name="平均周期 (天)" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              即将到复购周期（预计未来15天）
            </p>
            <div className="space-y-2">
              {upcomingRepurchase.map((item, index) => (
                <div key={index} className="flex items-center justify-between bg-slate-50 rounded p-2 text-xs">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{item.customer}</p>
                    <p className="text-slate-600">{item.expectedDate} · {item.daysLeft}天后</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {item.probability}% 概率
                    </Badge>
                    <Button size="sm" variant="outline" className="h-7 px-2">
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* 第四行：交叉销售机会 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-slate-900 font-semibold flex items-center gap-2" style={{ fontSize: '16px' }}>
              <Zap className="w-5 h-5 text-yellow-600" />
              交叉销售机会识别
            </h3>
            <p className="text-xs text-slate-500 mt-1">基于购买行为的智能推荐</p>
          </div>
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            预计增收: {formatCurrency(crossSellOpportunities.reduce((sum, item) => sum + item.potentialRevenue, 0))}
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-2 text-xs font-semibold text-slate-600">客户名称</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-slate-600">区域</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-slate-600">当前品类</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-slate-600">推荐品类</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-slate-600">成功率</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-slate-600">预计收入</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-slate-600">推荐理由</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {crossSellOpportunities.map((item, index) => (
                <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-2">
                    <p className="text-sm font-medium text-slate-900">{item.customer}</p>
                  </td>
                  <td className="py-3 px-2">
                    <Badge variant="outline" className="text-xs">{item.region}</Badge>
                  </td>
                  <td className="py-3 px-2">
                    <p className="text-sm text-slate-700">{item.currentCategory}</p>
                  </td>
                  <td className="py-3 px-2">
                    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                      {item.recommendedCategory}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <div className="w-16 bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-emerald-600 h-2 rounded-full" 
                          style={{ width: `${item.probability}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-emerald-600">{item.probability}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(item.potentialRevenue)}</p>
                  </td>
                  <td className="py-3 px-2">
                    <p className="text-xs text-slate-600">{item.reason}</p>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <Button size="sm" variant="outline" className="gap-1 h-7">
                      <Mail className="w-3 h-3" />
                      推送
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 第五行：VIP管理 + CLV趋势 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* VIP客户分级管理 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-slate-900 font-semibold flex items-center gap-2" style={{ fontSize: '16px' }}>
                <Award className="w-5 h-5 text-purple-600" />
                VIP客户分级管理
              </h3>
              <p className="text-xs text-slate-500 mt-1">自动分级 · 专属权益</p>
            </div>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              {vipTiers.reduce((sum, tier) => sum + tier.count, 0)} 位VIP
            </Badge>
          </div>

          <div className="space-y-3">
            {vipTiers.map((tier, index) => (
              <div key={index} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: tier.color + '20' }}>
                      <Award className="w-5 h-5" style={{ color: tier.color }} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{tier.tier}</p>
                      <p className="text-xs text-slate-600">最低LTV: {formatCurrency(tier.minLTV)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">{tier.count}</p>
                    <p className="text-xs text-slate-600">位客户</p>
                  </div>
                </div>
                <div className="bg-white rounded p-2">
                  <p className="text-xs text-slate-600 mb-1">专属权益:</p>
                  <p className="text-xs text-slate-700">{tier.benefits}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
            <p className="text-xs font-semibold text-slate-700 mb-2">💡 VIP客户管理建议</p>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• 钻石VIP每月至少接触2次，确保高端服务体验</li>
              <li>• 铂金VIP提供季度业务回顾会议</li>
              <li>• 黄金VIP定期推送新品和优惠信息</li>
              <li>• 白银VIP培养计划，提升至黄金级别</li>
            </ul>
          </div>
        </Card>

        {/* 客户生命周期价值趋势 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-slate-900 font-semibold flex items-center gap-2" style={{ fontSize: '16px' }}>
                <BarChart3 className="w-5 h-5 text-blue-600" />
                客户生命周期价值趋势
              </h3>
              <p className="text-xs text-slate-500 mt-1">CLV持续增长 · 客户价值最大化</p>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              平均CLV: {formatCurrency(clvTrend[clvTrend.length - 1].avgCLV)}
            </Badge>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={clvTrend}>
              <defs>
                <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTop" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '11px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '11px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: any) => formatCurrency(value as number)}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Area 
                type="monotone" 
                dataKey="avgCLV" 
                name="平均CLV" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorAvg)" 
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="topCLV" 
                name="Top 10% CLV" 
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#colorTop)" 
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="medianCLV" 
                name="中位数CLV" 
                stroke="#f59e0b" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-slate-600 mb-1">平均CLV</p>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(clvTrend[clvTrend.length - 1].avgCLV)}</p>
              <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +46.2% vs 年初
              </p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
              <p className="text-xs text-slate-600 mb-1">Top 10% CLV</p>
              <p className="text-lg font-bold text-emerald-600">{formatCurrency(clvTrend[clvTrend.length - 1].topCLV)}</p>
              <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +44.4% vs 年初
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
              <p className="text-xs text-slate-600 mb-1">中位数CLV</p>
              <p className="text-lg font-bold text-orange-600">{formatCurrency(clvTrend[clvTrend.length - 1].medianCLV)}</p>
              <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +47.1% vs 年初
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 底部：行动建议 */}
      <div className="bg-gradient-to-r from-rose-50 via-purple-50 to-rose-50 rounded-lg p-5 border-2 border-dashed border-rose-200">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-rose-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-slate-900 font-semibold mb-2" style={{ fontSize: '14px' }}>
              🎯 本周客户健康管理行动计划
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3 border border-rose-200">
                <p className="text-xs font-semibold text-red-700 mb-1">🚨 紧急：高风险客户挽回</p>
                <p className="text-xs text-slate-700">3个高风险客户需要立即联系（ABC Trading, North Pacific, South America Supply），建议提供10%特别折扣挽回</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-orange-200">
                <p className="text-xs font-semibold text-orange-700 mb-1">⚠️ 重要：复购提醒</p>
                <p className="text-xs text-slate-700">5个客户即将到复购周期（15天内），平均复购概率78%，预计带来{formatCurrency(186000)}收入</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-yellow-200">
                <p className="text-xs font-semibold text-yellow-700 mb-1">💰 机会：交叉销售推进</p>
                <p className="text-xs text-slate-700">4个高概率交叉销售机会，预计增收{formatCurrency(161000)}，建议发送个性化产品推荐邮件</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-purple-200">
                <p className="text-xs font-semibold text-purple-700 mb-1">⭐ 优化：VIP客户关怀</p>
                <p className="text-xs text-slate-700">12位钻石VIP需要本周接触，建议CEO亲自致电或视频会议，了解需求并提供定制服务</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}