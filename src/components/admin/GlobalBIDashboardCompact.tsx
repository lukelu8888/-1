// 🔥 全局BI决策仪表盘 - 紧凑型优化版
// 台湾大厂风格 + 高密度信息展示 + 字体恢复原版 + 竖向间距减少30%

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingCart, 
  AlertTriangle,
  RefreshCw,
  Download,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Package,
  Target,
  Award,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUpDown
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
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface GlobalBIDashboardCompactProps {
  userRole?: string;
  userRegion?: string;
}

export default function GlobalBIDashboardCompact({ userRole = 'CEO', userRegion = 'all' }: GlobalBIDashboardCompactProps) {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'quarter'>('month');
  const [selectedRegion, setSelectedRegion] = useState<'all' | 'NA' | 'SA' | 'EA'>(userRegion as any);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // 🔥 实时业务KPI数据
  const kpiData = {
    today: {
      revenue: { value: 145800, change: 12.5, trend: 'up' },
      orders: { value: 28, change: 8.3, trend: 'up' },
      newCustomers: { value: 5, change: -2.1, trend: 'down' },
      conversionRate: { value: 24.8, change: 3.2, trend: 'up' }
    },
    week: {
      revenue: { value: 892400, change: 15.2, trend: 'up' },
      orders: { value: 156, change: 11.7, trend: 'up' },
      newCustomers: { value: 32, change: 5.4, trend: 'up' },
      conversionRate: { value: 26.3, change: 2.8, trend: 'up' }
    },
    month: {
      revenue: { value: 3458900, change: 18.6, trend: 'up' },
      orders: { value: 584, change: 14.2, trend: 'up' },
      newCustomers: { value: 127, change: 9.8, trend: 'up' },
      conversionRate: { value: 28.5, change: 4.1, trend: 'up' }
    },
    quarter: {
      revenue: { value: 9876500, change: 22.3, trend: 'up' },
      orders: { value: 1654, change: 16.8, trend: 'up' },
      newCustomers: { value: 342, change: 12.5, trend: 'up' },
      conversionRate: { value: 29.7, change: 5.6, trend: 'up' }
    }
  };

  const currentKPI = kpiData[timeRange];

  // 🔥 销售漏斗数据
  const funnelData = [
    { stage: '询价', count: 856, value: 100, color: '#3b82f6' },
    { stage: '报价', count: 524, value: 61.2, color: '#8b5cf6' },
    { stage: '谈判', count: 312, value: 36.4, color: '#ec4899' },
    { stage: '成交', count: 244, value: 28.5, color: '#10b981' }
  ];

  // 🔥 区域业绩对比
  const regionData = [
    { region: '北美', revenue: 4523000, orders: 856, growth: 18.5 },
    { region: '南美', revenue: 2134000, orders: 478, growth: 22.3 },
    { region: '欧非', revenue: 3201000, orders: 624, growth: 15.7 }
  ];

  // 🔥 应收账款账龄
  const arAgingData = [
    { name: '未到期', value: 1245000, percent: 52.3, color: '#10b981' },
    { name: '1-30天', value: 645000, percent: 27.1, color: '#3b82f6' },
    { name: '31-60天', value: 312000, percent: 13.1, color: '#f59e0b' },
    { name: '61-90天', value: 124000, percent: 5.2, color: '#ef4444' },
    { name: '90天+', value: 54000, percent: 2.3, color: '#dc2626' }
  ];

  // 🔥 产品销售Top 5
  const productRankingData = [
    { product: '工业插座', sales: 234500, growth: 25.3 },
    { product: '卫浴龙头', sales: 198700, growth: 18.7 },
    { product: '门窗配件', sales: 187300, growth: 22.1 },
    { product: '安全手套', sales: 165900, growth: 15.4 },
    { product: '电气开关', sales: 154200, growth: 12.8 }
  ];

  // 🔥 销售趋势（最近6个月）
  const salesTrendData = [
    { month: '7月', actual: 3234000, forecast: 3280000 },
    { month: '8月', actual: 3456000, forecast: 3420000 },
    { month: '9月', actual: 3678000, forecast: 3640000 },
    { month: '10月', actual: 3845000, forecast: 3820000 },
    { month: '11月', actual: null, forecast: 3980000 },
    { month: '12月', actual: null, forecast: 4120000 }
  ];

  // 🔥 客户RFM分析
  const rfmData = [
    { segment: '高价值', recency: 95, frequency: 92, monetary: 98, customers: 45 },
    { segment: '重要', recency: 85, frequency: 78, monetary: 85, customers: 78 },
    { segment: '潜力', recency: 75, frequency: 45, monetary: 72, customers: 124 },
    { segment: '新客', recency: 92, frequency: 25, monetary: 35, customers: 89 },
    { segment: '流失', recency: 35, frequency: 65, monetary: 68, customers: 34 }
  ];

  // 格式化货币
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  // 格式化百分比
  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-2">
      {/* 🔥 紧凑型头部 */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg px-4 py-2.5 text-white">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            <h1 className="font-bold" style={{ fontSize: '18px' }}>全局BI决策仪表盘</h1>
            <Badge className="bg-white/20 text-white border-0 h-5 px-2 text-xs">实时</Badge>
          </div>
          <p className="text-white/80 mt-0.5 text-xs">
            Global Business Intelligence · {lastRefresh.toLocaleTimeString('zh-CN')}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 时间范围 - 紧凑 */}
          <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5">
            {(['today', 'week', 'month', 'quarter'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  timeRange === range
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-white/70 hover:bg-white/10'
                }`}
              >
                {range === 'today' && '今日'}
                {range === 'week' && '本周'}
                {range === 'month' && '本月'}
                {range === 'quarter' && '本季'}
              </button>
            ))}
          </div>

          {/* 区域筛选 - 紧凑 */}
          <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5">
            {(['all', 'NA', 'SA', 'EA'] as const).map((region) => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  selectedRegion === region
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-white/70 hover:bg-white/10'
                }`}
              >
                {region === 'all' && '全球'}
                {region === 'NA' && '北美'}
                {region === 'SA' && '南美'}
                {region === 'EA' && '欧非'}
              </button>
            ))}
          </div>

          {/* 操作按钮 - 紧凑 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLastRefresh(new Date())}
            className="h-7 px-2 text-white hover:bg-white/10 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            刷新
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-white hover:bg-white/10 text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            导出
          </Button>
        </div>
      </div>

      {/* 🔥 第一行：核心KPI - 字体恢复原版，间距缩小30% */}
      <div className="grid grid-cols-4 gap-1.5">
        {/* 销售额 */}
        <Card className="p-3 bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <div className="flex items-start justify-between mb-1.5">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <Badge variant={currentKPI.revenue.trend === 'up' ? 'default' : 'destructive'} className="h-5 px-2 text-xs">
              {currentKPI.revenue.trend === 'up' ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
              {formatPercent(currentKPI.revenue.change)}
            </Badge>
          </div>
          <p className="text-slate-600 text-sm mb-1">总销售额</p>
          <p className="text-slate-900 font-bold" style={{ fontSize: '22px' }}>
            {formatCurrency(currentKPI.revenue.value)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            较上期 {formatPercent(currentKPI.revenue.change)}
          </p>
        </Card>

        {/* 订单数 */}
        <Card className="p-3 bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
          <div className="flex items-start justify-between mb-1.5">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <Badge variant={currentKPI.orders.trend === 'up' ? 'default' : 'destructive'} className="h-5 px-2 text-xs">
              {currentKPI.orders.trend === 'up' ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
              {formatPercent(currentKPI.orders.change)}
            </Badge>
          </div>
          <p className="text-slate-600 text-sm mb-1">订单总数</p>
          <p className="text-slate-900 font-bold" style={{ fontSize: '22px' }}>
            {currentKPI.orders.value.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            较上期 {formatPercent(currentKPI.orders.change)}
          </p>
        </Card>

        {/* 新客户 */}
        <Card className="p-3 bg-gradient-to-br from-purple-50 to-white border-purple-200">
          <div className="flex items-start justify-between mb-1.5">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <Badge variant={currentKPI.newCustomers.trend === 'up' ? 'default' : 'destructive'} className="h-5 px-2 text-xs">
              {currentKPI.newCustomers.trend === 'up' ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
              {formatPercent(currentKPI.newCustomers.change)}
            </Badge>
          </div>
          <p className="text-slate-600 text-sm mb-1">新增客户</p>
          <p className="text-slate-900 font-bold" style={{ fontSize: '22px' }}>
            {currentKPI.newCustomers.value}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            较上期 {formatPercent(currentKPI.newCustomers.change)}
          </p>
        </Card>

        {/* 转化率 */}
        <Card className="p-3 bg-gradient-to-br from-orange-50 to-white border-orange-200">
          <div className="flex items-start justify-between mb-1.5">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <Badge variant={currentKPI.conversionRate.trend === 'up' ? 'default' : 'destructive'} className="h-5 px-2 text-xs">
              {currentKPI.conversionRate.trend === 'up' ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
              {formatPercent(currentKPI.conversionRate.change)}
            </Badge>
          </div>
          <p className="text-slate-600 text-sm mb-1">转化率</p>
          <p className="text-slate-900 font-bold" style={{ fontSize: '22px' }}>
            {currentKPI.conversionRate.value}%
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            较上期 {formatPercent(currentKPI.conversionRate.change)}
          </p>
        </Card>
      </div>

      {/* 🔥 第二行：销售漏斗 + 区域业绩 - 竖向间距减少30% */}
      <div className="grid grid-cols-2 gap-1.5">
        {/* 销售漏斗 */}
        <Card className="p-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-slate-900 text-sm">销售漏斗</h3>
            </div>
            <Badge variant="outline" className="h-5 px-2 text-xs">
              转化率 {funnelData[funnelData.length - 1].value.toFixed(1)}%
            </Badge>
          </div>
          <div className="space-y-1.5">
            {funnelData.map((stage, index) => (
              <div key={stage.stage}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs text-slate-600">{stage.stage}</span>
                  <span className="text-xs font-medium text-slate-900">{stage.count}</span>
                </div>
                <div className="relative h-5 bg-slate-100 rounded overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 flex items-center justify-center text-white font-medium text-xs"
                    style={{
                      width: `${stage.value}%`,
                      backgroundColor: stage.color
                    }}
                  >
                    {stage.value.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 区域业绩对比 */}
        <Card className="p-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Package className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-slate-900 text-sm">区域业绩</h3>
            </div>
          </div>
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ fontSize: '12px', padding: '8px' }}
                  formatter={(value: any) => formatCurrency(value)}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 🔥 第三行：销售趋势 + 应收账款 - 竖向间距减少30% */}
      <div className="grid grid-cols-3 gap-1.5">
        {/* 销售趋势 */}
        <Card className="p-3 col-span-2">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <TrendingUpDown className="w-4 h-4 text-purple-600" />
              <h3 className="font-semibold text-slate-900 text-sm">销售趋势预测</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-xs text-slate-600">实际</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span className="text-xs text-slate-600">预测</span>
              </div>
            </div>
          </div>
          <div className="h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ fontSize: '12px', padding: '8px' }}
                  formatter={(value: any) => formatCurrency(value)}
                />
                <Area 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6}
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="forecast" 
                  stroke="#8b5cf6" 
                  fill="#8b5cf6" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 应收账款账龄 */}
        <Card className="p-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <PieChartIcon className="w-4 h-4 text-orange-600" />
              <h3 className="font-semibold text-slate-900 text-sm">应收账款</h3>
            </div>
          </div>
          <div className="h-[80px] mb-1.5">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={arAgingData}
                  cx="50%"
                  cy="50%"
                  innerRadius={22}
                  outerRadius={35}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {arAgingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ fontSize: '11px', padding: '6px' }}
                  formatter={(value: any) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-0.5">
            {arAgingData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs text-slate-600">{item.name}</span>
                </div>
                <span className="text-xs font-medium text-slate-900">{item.percent}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 🔥 第四行：产品排行 + RFM分析 - 竖向间距减少30% */}
      <div className="grid grid-cols-2 gap-1.5">
        {/* 产品销售Top 5 */}
        <Card className="p-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-yellow-600" />
              <h3 className="font-semibold text-slate-900 text-sm">产品销售Top 5</h3>
            </div>
          </div>
          <div className="space-y-1.5">
            {productRankingData.map((product, index) => (
              <div key={product.product} className="flex items-center gap-2">
                <div className={`
                  w-5 h-5 rounded flex items-center justify-center text-xs font-bold shrink-0
                  ${index === 0 ? 'bg-yellow-500 text-white' : 
                    index === 1 ? 'bg-slate-400 text-white' :
                    index === 2 ? 'bg-orange-600 text-white' :
                    'bg-slate-200 text-slate-600'}
                `}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-slate-900 font-medium truncate">{product.product}</span>
                    <span className="text-xs font-semibold text-slate-900 ml-2">{formatCurrency(product.sales)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5 mr-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-emerald-500 h-1.5 rounded-full"
                        style={{ width: `${(product.sales / productRankingData[0].sales) * 100}%` }}
                      ></div>
                    </div>
                    <Badge variant="outline" className="h-4 px-1.5 text-[10px] bg-green-50 text-green-700 border-green-200">
                      <TrendingUp className="w-2 h-2 mr-0.5" />
                      {product.growth}%
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 客户RFM分析 */}
        <Card className="p-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-indigo-600" />
              <h3 className="font-semibold text-slate-900 text-sm">客户RFM分析</h3>
            </div>
            <Badge variant="outline" className="h-5 px-2 text-xs">
              {rfmData.reduce((sum, item) => sum + item.customers, 0)} 客户
            </Badge>
          </div>
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={rfmData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="segment" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fontSize: 10 }} />
                <Radar 
                  name="近期性" 
                  dataKey="recency" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.5}
                  strokeWidth={2}
                />
                <Radar 
                  name="频率" 
                  dataKey="frequency" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Radar 
                  name="金额" 
                  dataKey="monetary" 
                  stroke="#f59e0b" 
                  fill="#f59e0b" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip contentStyle={{ fontSize: '11px', padding: '6px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 🔥 底部提示 */}
      <div className="text-center py-1.5 text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
        <span className="flex items-center justify-center gap-1">
          <Clock className="w-3 h-3" />
          数据实时更新 · 最后刷新: {lastRefresh.toLocaleTimeString('zh-CN')}
        </span>
      </div>
    </div>
  );
}
