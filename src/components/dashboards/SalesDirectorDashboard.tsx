// 🔥 世界顶级销售总监工作台
// Sales Director Dashboard - B2B Foreign Trade Edition

import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ModuleHelpTooltip } from "./ModuleHelpTooltip";
import { 
  TrendingUp, TrendingDown, DollarSign, Users, Target, 
  Globe, Package, AlertCircle, Clock, Award, 
  Download, RefreshCw, Filter, ChevronRight,
  ThumbsUp, ThumbsDown, MapPin, Zap
} from "lucide-react";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie,
  AreaChart, Area, FunnelChart, Funnel,
  ComposedChart, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell, LabelList
} from "recharts";

// 🎨 颜色配置
const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  slate: '#64748b',
  purple: '#8b5cf6',
  teal: '#14b8a6',
  indigo: '#6366f1',
  orange: '#f97316',
  rose: '#f43f5e',
};

// 📊 销售业绩数据
const salesPerformance = {
  totalRevenue: 2450000,
  revenueTarget: 2500000,
  completion: 98.0,
  growth: 15.3,
  totalOrders: 186,
  orderTarget: 200,
  avgOrderValue: 13172,
  newCustomers: 28,
  monthlyTrend: [
    { month: '1月', revenue: 380000, target: 400000, orders: 29 },
    { month: '2月', revenue: 395000, target: 410000, orders: 31 },
    { month: '3月', revenue: 410000, target: 415000, orders: 32 },
    { month: '4月', revenue: 405000, target: 420000, orders: 30 },
    { month: '5月', revenue: 425000, target: 425000, orders: 33 },
    { month: '6月', revenue: 435000, target: 430000, orders: 31 },
  ]
};

// 🎯 销售漏斗数据
const salesFunnel = [
  { stage: '询价', count: 450, value: 5800000, conversion: 100, color: COLORS.indigo },
  { stage: '报价', count: 280, value: 3920000, conversion: 62.2, color: COLORS.primary },
  { stage: '谈判', count: 195, value: 2730000, conversion: 43.3, color: COLORS.teal },
  { stage: '签约', count: 128, value: 1920000, conversion: 28.4, color: COLORS.success },
  { stage: '收款', count: 98, value: 1470000, conversion: 21.8, color: COLORS.purple },
];

// 👥 客户健康度矩阵（RFM模型）
const customerHealthMatrix = {
  summary: {
    total: 342,
    strategic: 28,
    key: 84,
    standard: 156,
    atRisk: 74,
  },
  segments: [
    { name: '战略客户', count: 28, revenue: 980000, avgOrder: 35000, health: 92, color: COLORS.success },
    { name: '重点客户', count: 84, revenue: 840000, avgOrder: 10000, health: 78, color: COLORS.primary },
    { name: '普通客户', count: 156, revenue: 520000, avgOrder: 3333, health: 65, color: COLORS.warning },
    { name: '流失风险', count: 74, revenue: 110000, avgOrder: 1486, health: 35, color: COLORS.danger },
  ],
  rfmDistribution: [
    { segment: '冠军客户', count: 28, percentage: 8.2 },
    { segment: '忠诚客户', count: 56, percentage: 16.4 },
    { segment: '潜力客户', count: 84, percentage: 24.6 },
    { segment: '新客户', count: 48, percentage: 14.0 },
    { segment: '需关注', count: 52, percentage: 15.2 },
    { segment: '即将流失', count: 38, percentage: 11.1 },
    { segment: '已流失', count: 36, percentage: 10.5 },
  ]
};

// 📦 产品线表现
const productLinePerformance = [
  { 
    category: '电气产品', 
    revenue: 980000, 
    target: 1000000,
    orders: 76, 
    growth: 18.5, 
    margin: 28.5,
    topProduct: '智能开关',
    color: COLORS.indigo 
  },
  { 
    category: '卫浴产品', 
    revenue: 680000, 
    target: 650000,
    orders: 52, 
    growth: 12.3, 
    margin: 32.8,
    topProduct: '淋浴花洒',
    color: COLORS.primary 
  },
  { 
    category: '门窗配件', 
    revenue: 520000, 
    target: 550000,
    orders: 38, 
    growth: 8.7, 
    margin: 25.2,
    topProduct: '铰链系列',
    color: COLORS.teal 
  },
  { 
    category: '劳保用品', 
    revenue: 270000, 
    target: 300000,
    orders: 20, 
    growth: 22.1, 
    margin: 18.9,
    topProduct: '防护手套',
    color: COLORS.orange 
  },
];

// 🌍 区域销售表现
const regionalPerformance = [
  {
    region: '北美市场',
    revenue: 980000,
    target: 1000000,
    completion: 98.0,
    orders: 76,
    growth: 12.5,
    customers: 128,
    avgOrder: 12895,
    topCountry: '美国',
    manager: '张明',
    salesRep: 8,
    color: COLORS.primary,
    trend: [
      { month: '1月', value: 155000 },
      { month: '2月', value: 158000 },
      { month: '3月', value: 162000 },
      { month: '4月', value: 160000 },
      { month: '5月', value: 168000 },
      { month: '6月', value: 177000 },
    ]
  },
  {
    region: '南美市场',
    revenue: 620000,
    target: 650000,
    completion: 95.4,
    orders: 48,
    growth: 8.2,
    customers: 86,
    avgOrder: 12917,
    topCountry: '巴西',
    manager: '李娜',
    salesRep: 5,
    color: COLORS.success,
    trend: [
      { month: '1月', value: 98000 },
      { month: '2月', value: 101000 },
      { month: '3月', value: 103000 },
      { month: '4月', value: 102000 },
      { month: '5月', value: 106000 },
      { month: '6月', value: 110000 },
    ]
  },
  {
    region: '欧非市场',
    revenue: 850000,
    target: 850000,
    completion: 100.0,
    orders: 62,
    growth: 15.3,
    customers: 128,
    avgOrder: 13710,
    topCountry: '德国',
    manager: '王强',
    salesRep: 6,
    color: COLORS.indigo,
    trend: [
      { month: '1月', value: 127000 },
      { month: '2月', value: 136000 },
      { month: '3月', value: 145000 },
      { month: '4月', value: 143000 },
      { month: '5月', value: 151000 },
      { month: '6月', value: 148000 },
    ]
  },
];

// 🏆 团队绩效排行
const teamPerformance = {
  managers: [
    { name: '王强', region: '欧非', revenue: 850000, target: 850000, completion: 100.0, orders: 62, rank: 1 },
    { name: '张明', region: '北美', revenue: 980000, target: 1000000, completion: 98.0, orders: 76, rank: 2 },
    { name: '李娜', region: '南美', revenue: 620000, target: 650000, completion: 95.4, orders: 48, rank: 3 },
  ],
  topSalesReps: [
    { name: '陈晨', region: '北美', revenue: 285000, orders: 22, conversion: 32.5, customers: 18, rank: 1 },
    { name: '刘洋', region: '欧非', revenue: 268000, orders: 20, conversion: 28.8, customers: 16, rank: 2 },
    { name: '赵敏', region: '北美', revenue: 252000, orders: 19, conversion: 31.2, customers: 15, rank: 3 },
    { name: '孙杰', region: '南美', revenue: 238000, orders: 18, conversion: 26.5, customers: 14, rank: 4 },
    { name: '周萍', region: '欧非', revenue: 225000, orders: 17, conversion: 29.3, customers: 13, rank: 5 },
  ]
};

// 📈 销售预测
const salesForecast = {
  next3Months: 1350000,
  next6Months: 2750000,
  next12Months: 5600000,
  confidence: 87,
  trend: [
    { month: '7月', forecast: 445000, lower: 425000, upper: 465000 },
    { month: '8月', forecast: 450000, lower: 430000, upper: 470000 },
    { month: '9月', forecast: 455000, lower: 435000, upper: 475000 },
    { month: '10月', forecast: 460000, lower: 440000, upper: 480000 },
    { month: '11月', forecast: 465000, lower: 445000, upper: 485000 },
    { month: '12月', forecast: 475000, lower: 455000, upper: 495000 },
  ]
};

// 📋 订单监控
const orderMonitoring = {
  newOrders: 12,
  pendingConfirm: 8,
  pendingShipment: 15,
  overdue: 3,
  recentOrders: [
    { id: 'ORD-2024-0156', customer: 'ABC Supply Co.', amount: 28500, status: 'new', region: '北美', date: '2024-06-20' },
    { id: 'ORD-2024-0157', customer: 'BuildMart Ltd', amount: 32000, status: 'pending', region: '欧非', date: '2024-06-19' },
    { id: 'ORD-2024-0158', customer: 'Ferretería Central', amount: 18500, status: 'shipping', region: '南美', date: '2024-06-18' },
    { id: 'ORD-2024-0159', customer: 'Pro Hardware Inc', amount: 45000, status: 'overdue', region: '北美', date: '2024-06-10' },
  ]
};

// 💰 价格竞争力指数
const priceCompetitiveness = {
  overall: 102,
  byCategory: [
    { category: '电气产品', ourPrice: 100, marketAvg: 98, index: 102 },
    { category: '卫浴产品', ourPrice: 100, marketAvg: 105, index: 95 },
    { category: '门窗配件', ourPrice: 100, marketAvg: 100, index: 100 },
    { category: '劳保用品', ourPrice: 100, marketAvg: 92, index: 109 },
  ]
};

// 🎯 核心KPI
const coreKPIs = [
  { label: '销售收入', value: 2450000, unit: 'USD', change: 15.3, target: 2500000, completion: 98.0, icon: DollarSign },
  { label: '订单数量', value: 186, unit: '单', change: 12.8, target: 200, completion: 93.0, icon: Package },
  { label: '客户数量', value: 342, unit: '家', change: 8.5, target: 350, completion: 97.7, icon: Users },
  { label: '转化率', value: 28.4, unit: '%', change: 3.2, target: 30, completion: 94.7, icon: Target },
  { label: '客单价', value: 13172, unit: 'USD', change: 2.2, target: 12500, completion: 105.4, icon: TrendingUp },
  { label: '团队人数', value: 19, unit: '人', change: 5.6, target: 20, completion: 95.0, icon: Award },
];

export function SalesDirectorDashboard() {
  return (
    <div className="space-y-4 p-4 bg-slate-50">
      {/* 🎯 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 mb-1">销售总监战略管理中心</h1>
          <p className="text-sm text-slate-600">全球销售洞察 · 团队绩效管理 · 客户价值提升</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-700 bg-white">
            <option>2024年 H1</option>
            <option>2024年 Q2</option>
            <option>2024年 Q1</option>
          </select>
          <Button variant="outline" size="sm" className="text-sm h-8">
            <Filter className="size-3.5 mr-1.5" />
            筛选
          </Button>
          <Button variant="outline" size="sm" className="text-sm h-8">
            <RefreshCw className="size-3.5 mr-1.5" />
            刷新
          </Button>
          <Button size="sm" className="text-sm h-8">
            <Download className="size-3.5 mr-1.5" />
            导出
          </Button>
        </div>
      </div>

      {/* 📊 核心KPI */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {coreKPIs.map((kpi) => {
          const Icon = kpi.icon;
          const isPositive = kpi.change > 0;
          
          return (
            <Card key={kpi.label} className="p-3 border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="p-1.5 bg-blue-50 rounded-lg">
                  <Icon className="size-3.5 text-blue-600" />
                </div>
                {isPositive ? (
                  <TrendingUp className="size-3 text-green-600" />
                ) : (
                  <TrendingDown className="size-3 text-red-600" />
                )}
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-slate-600">{kpi.label}</p>
                <p className="text-base font-semibold text-slate-900">
                  {kpi.unit === 'USD' && '$'}
                  {kpi.unit === 'USD' ? (kpi.value / 1000).toFixed(0) + 'K' : kpi.value.toLocaleString()}
                  {kpi.unit === '%' && '%'}
                  {kpi.unit === '单' && '单'}
                  {kpi.unit === '家' && '家'}
                  {kpi.unit === '人' && '人'}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                    {isPositive ? '+' : ''}{kpi.change}%
                  </span>
                  <span className="text-slate-500">{kpi.completion.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1 mt-1">
                  <div 
                    className="h-1 rounded-full bg-blue-500"
                    style={{ width: `${kpi.completion}%` }}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 📈 销售业绩 + 销售漏斗 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 销售业绩驾驶舱 */}
        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-1">
                <h3 className="text-sm font-semibold text-slate-900">销售业绩驾驶舱</h3>
                <ModuleHelpTooltip
                  title="销售业绩驾驶舱"
                  definition="Sales Performance Cockpit (销售业绩驾驶舱) 实时展示销售收入、订单数量、目标达成率等核心销售指标，帮助销售总监快速掌握整体业绩状况。"
                  details={[
                    '销售收入：当期实际销售总额',
                    '目标达成率：实际收入÷目标收入×100%',
                    '订单数量：成交订单总数',
                    '平均客单价：销售总额÷订单数量',
                    '同比增长率：与去年同期对比的增长百分比'
                  ]}
                  formula="目标达成率 = (实际收入 ÷ 目标收入) × 100%"
                  example="当前销售收入$2.45M，目标达成率98%，同比增长15.3%，业绩表现优秀。"
                />
              </div>
              <p className="text-xs text-slate-600">Performance Overview</p>
            </div>
            <Badge className="bg-green-100 text-green-700 text-xs">+15.3%</Badge>
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={salesPerformance.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ fontSize: 11, borderRadius: '6px' }}
                formatter={(value: number) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Bar dataKey="target" fill="#cbd5e1" name="目标" radius={[4, 4, 0, 0]} />
              <Bar dataKey="revenue" fill={COLORS.primary} name="实际" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="orders" stroke={COLORS.success} strokeWidth={2} name="订单数" yAxisId="right" />
              <YAxis yAxisId="right" orientation="right" stroke="#64748b" tick={{ fontSize: 10 }} />
            </ComposedChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-200 text-xs">
            <div>
              <p className="text-slate-600">收入</p>
              <p className="font-semibold text-blue-600">${(salesPerformance.totalRevenue / 1000000).toFixed(2)}M</p>
            </div>
            <div>
              <p className="text-slate-600">达成率</p>
              <p className="font-semibold text-green-600">{salesPerformance.completion}%</p>
            </div>
            <div>
              <p className="text-slate-600">订单</p>
              <p className="font-semibold text-purple-600">{salesPerformance.totalOrders}单</p>
            </div>
            <div>
              <p className="text-slate-600">客单价</p>
              <p className="font-semibold text-orange-600">${(salesPerformance.avgOrderValue / 1000).toFixed(1)}K</p>
            </div>
          </div>
        </Card>

        {/* 销售漏斗分析 */}
        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-1">
                <h3 className="text-sm font-semibold text-slate-900">销售漏斗分析</h3>
                <ModuleHelpTooltip
                  title="销售漏斗分析"
                  definition="Sales Funnel Analysis (销售漏斗分析) 展示从询价到收款的完整销售流程各阶段的转化率，帮助识别销售瓶颈和改进机会。"
                  details={[
                    '询价阶段：客户提交询价请求',
                    '报价阶段：业务员发送正式报价',
                    '谈判阶段：价格、条款等商务谈判',
                    '签约阶段：签订正式销售合同',
                    '收款阶段：成功收到客户付款'
                  ]}
                  formula="转化率 = (当前阶段数量 ÷ 询价数量) × 100%"
                  example="当前从450个询价最终转化为98个收款，整体转化率21.8%，建议重点优化报价到谈判环节。"
                />
              </div>
              <p className="text-xs text-slate-600">Sales Funnel</p>
            </div>
            <Badge className="bg-blue-100 text-blue-700 text-xs">21.8%转化</Badge>
          </div>

          <div className="space-y-2">
            {salesFunnel.map((stage, index) => (
              <div key={stage.stage} className="relative">
                <div className="flex items-center gap-2">
                  <div 
                    className="h-12 rounded-lg flex items-center justify-between px-3 transition-all"
                    style={{ 
                      width: `${stage.conversion}%`, 
                      backgroundColor: stage.color + '20',
                      border: `2px solid ${stage.color}`
                    }}
                  >
                    <div>
                      <p className="text-xs font-semibold" style={{ color: stage.color }}>{stage.stage}</p>
                      <p className="text-xs text-slate-600">{stage.count}个 · ${(stage.value / 1000000).toFixed(2)}M</p>
                    </div>
                    <Badge style={{ backgroundColor: stage.color }} className="text-white text-xs">
                      {stage.conversion.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">询价→收款转化率</span>
              <span className="font-semibold text-green-600">21.8%</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-slate-600">最大流失环节</span>
              <span className="font-semibold text-red-600">询价→报价 (-37.8%)</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 👥 客户健康度 + 产品线表现 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 客户健康度矩阵 */}
        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-1">
                <h3 className="text-sm font-semibold text-slate-900">客户健康度矩阵</h3>
                <ModuleHelpTooltip
                  title="客户健康度矩阵（RFM模型）"
                  definition="Customer Health Matrix (客户健康度矩阵) 基于RFM模型（最近购买时间Recency、购买频率Frequency、购买金额Monetary），将客户分为战略、重点、普通、流失风险四类，帮助销售总监制定差异化的客户管理策略。"
                  details={[
                    '战略客户：高价值、高忠诚度，需提供VIP服务',
                    '重点客户：中高价值，有增长潜力，需重点培育',
                    '普通客户：标准服务，关注转化为重点客户',
                    '流失风险：长期未下单，需启动挽回策略'
                  ]}
                  formula="健康度评分 = Recency权重×R分 + Frequency权重×F分 + Monetary权重×M分"
                  example="当前28家战略客户贡献$980K收入（40%），需继续深化合作关系；74家流失风险客户需立即启动挽回计划。"
                />
              </div>
              <p className="text-xs text-slate-600">RFM Customer Segmentation</p>
            </div>
            <Badge className="bg-blue-100 text-blue-700 text-xs">{customerHealthMatrix.summary.total}家</Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {customerHealthMatrix.segments.map((segment) => (
              <div key={segment.name} className="p-3 border-2 rounded-lg" style={{ borderColor: segment.color }}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-slate-900">{segment.name}</h4>
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: segment.color }}
                  >
                    {segment.health}
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">数量</span>
                    <span className="font-semibold">{segment.count}家</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">收入</span>
                    <span className="font-semibold">${(segment.revenue / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">客单价</span>
                    <span className="font-semibold">${(segment.avgOrder / 1000).toFixed(1)}K</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-200">
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={customerHealthMatrix.segments} layout="vertical">
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" stroke="#64748b" tick={{ fontSize: 10 }} width={60} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {customerHealthMatrix.segments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 产品线表现 */}
        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-1">
                <h3 className="text-sm font-semibold text-slate-900">产品线表现</h3>
                <ModuleHelpTooltip
                  title="产品线表现分析"
                  definition="Product Line Performance (产品线表现) 展示电气、卫浴、门窗配件、劳保用品等各产品类别的销售收入、订单数量、增长率、毛利率等关键指标。"
                  details={[
                    '销售收入：该产品线的总销售额',
                    '订单数量：成交订单数',
                    '同比增长：与去年同期对比',
                    '毛利率：(收入-成本)÷收入×100%',
                    '明星产品：该品类销量最高的单品'
                  ]}
                  formula="目标达成率 = (实际收入 ÷ 目标收入) × 100%"
                  example="电气产品收入$980K，增长18.5%，表现最佳；劳保用品虽收入较低但增长率22.1%，是潜力品类。"
                />
              </div>
              <p className="text-xs text-slate-600">Product Categories</p>
            </div>
          </div>

          <div className="space-y-2">
            {productLinePerformance.map((product) => (
              <div key={product.category} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-1 h-8 rounded-full"
                      style={{ backgroundColor: product.color }}
                    />
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{product.category}</h4>
                      <p className="text-xs text-slate-600">明星：{product.topProduct}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">${(product.revenue / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-green-600">+{product.growth}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <p className="text-slate-600">达成率</p>
                    <p className="font-semibold">
                      {((product.revenue / product.target) * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600">订单</p>
                    <p className="font-semibold">{product.orders}单</p>
                  </div>
                  <div>
                    <p className="text-slate-600">毛利率</p>
                    <p className="font-semibold text-green-600">{product.margin}%</p>
                  </div>
                  <div>
                    <p className="text-slate-600">客单价</p>
                    <p className="font-semibold">${(product.revenue / product.orders / 1000).toFixed(1)}K</p>
                  </div>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                  <div 
                    className="h-1.5 rounded-full"
                    style={{ 
                      width: `${(product.revenue / product.target) * 100}%`,
                      backgroundColor: product.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 🌍 区域销售表现 */}
      <Card className="p-4 border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-1">
              <h3 className="text-sm font-semibold text-slate-900">全球区域销售地图</h3>
              <ModuleHelpTooltip
                title="全球区域销售地图"
                definition="Global Regional Sales Map (全球区域销售地图) 展示北美、南美、欧非三大全球区域的销售业绩、客户分布、增长趋势等多维度数据，帮助销售总监制定区域化战略。"
                details={[
                  '销售收入：该区域的总销售额',
                  '目标达成率：实际÷目标×100%',
                  '客户数量：该区域活跃客户数',
                  '区域主管：负责该区域的管理者',
                  '业务员数量：该区域销售团队规模'
                ]}
                example="欧非市场目标达成率100%，表现最佳；北美市场收入最高但仍有2%增长空间；南美市场增速较慢需关注。"
              />
            </div>
            <p className="text-xs text-slate-600">Regional Performance Matrix</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {regionalPerformance.map((region) => (
            <div key={region.region} className="p-4 border-2 rounded-lg" style={{ borderColor: region.color }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4" style={{ color: region.color }} />
                  <h4 className="text-sm font-semibold text-slate-900">{region.region}</h4>
                </div>
                <Badge 
                  style={{ 
                    backgroundColor: region.color + '20',
                    color: region.color 
                  }}
                  className="text-xs"
                >
                  {region.completion.toFixed(0)}%
                </Badge>
              </div>

              <div className="mb-3">
                <ResponsiveContainer width="100%" height={80}>
                  <AreaChart data={region.trend}>
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke={region.color} 
                      fill={region.color}
                      fillOpacity={0.2}
                    />
                    <XAxis dataKey="month" hide />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ fontSize: 11 }}
                      formatter={(value: number) => `$${(value / 1000).toFixed(0)}K`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="p-2 bg-blue-50 rounded">
                  <p className="text-slate-600">收入</p>
                  <p className="font-semibold text-blue-600">${(region.revenue / 1000).toFixed(0)}K</p>
                </div>
                <div className="p-2 bg-green-50 rounded">
                  <p className="text-slate-600">增长</p>
                  <p className="font-semibold text-green-600">+{region.growth}%</p>
                </div>
                <div className="p-2 bg-purple-50 rounded">
                  <p className="text-slate-600">订单</p>
                  <p className="font-semibold text-purple-600">{region.orders}单</p>
                </div>
                <div className="p-2 bg-orange-50 rounded">
                  <p className="text-slate-600">客户</p>
                  <p className="font-semibold text-orange-600">{region.customers}家</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 text-xs">
                <div className="flex justify-between mb-1">
                  <span className="text-slate-600">区域主管</span>
                  <span className="font-semibold">{region.manager}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-600">团队规模</span>
                  <span className="font-semibold">{region.salesRep}人</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">主要国家</span>
                  <span className="font-semibold">{region.topCountry}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 🏆 团队绩效 + 销售预测 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 团队绩效排行榜 */}
        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-1">
                <h3 className="text-sm font-semibold text-slate-900">团队绩效排行榜</h3>
                <ModuleHelpTooltip
                  title="团队绩效排行榜"
                  definition="Team Performance Leaderboard (团队绩效排行榜) 展示区域主管和业务员的销售业绩排名，包括销售收入、订单数量、目标达成率、转化率等关键指标。"
                  details={[
                    '区域主管：管理整个区域销售团队',
                    '业务员：一线销售执行人员',
                    '排名依据：销售收入为主要排序指标',
                    '转化率：成交订单÷总询价×100%',
                    '客户数：负责管理的活跃客户数'
                  ]}
                  example="王强（欧非）目标达成率100%排名第一；陈晨（北美）个人业绩$285K，转化率32.5%，是优秀业务员典范。"
                />
              </div>
              <p className="text-xs text-slate-600">Performance Ranking</p>
            </div>
          </div>

          {/* 区域主管排行 */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-slate-700 mb-2">🎯 区域主管</h4>
            <div className="space-y-2">
              {teamPerformance.managers.map((manager) => (
                <div key={manager.name} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                    manager.rank === 1 ? 'bg-yellow-500' :
                    manager.rank === 2 ? 'bg-gray-400' :
                    'bg-orange-600'
                  }`}>
                    {manager.rank}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-slate-900">{manager.name}</span>
                      <span className="text-sm font-semibold text-blue-600">${(manager.revenue / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>{manager.region} · {manager.orders}单</span>
                      <span className={manager.completion >= 100 ? 'text-green-600 font-semibold' : 'text-orange-600'}>
                        {manager.completion.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 业务员排行 */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 mb-2">⭐ 优秀业务员Top5</h4>
            <div className="space-y-1.5">
              {teamPerformance.topSalesReps.map((rep) => (
                <div key={rep.name} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                    {rep.rank}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900">{rep.name}</span>
                      <span className="font-semibold text-blue-600">${(rep.revenue / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600 mt-0.5">
                      <span>{rep.region} · {rep.customers}客户</span>
                      <span>{rep.conversion}%转化</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* 销售预测 */}
        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-1">
                <h3 className="text-sm font-semibold text-slate-900">AI销售预测</h3>
                <ModuleHelpTooltip
                  title="AI销售预测"
                  definition="AI Sales Forecast (AI销售预测) 基于历史销售数据、季节性趋势、市场环境等因素，使用机器学习算法预测未来3/6/12个月的销售趋势。"
                  details={[
                    '预测周期：未来3个月、6个月、12个月',
                    '置信度：预测准确性的概率评估',
                    '预测区间：最低值、预期值、最高值',
                    '影响因素：历史数据、季节性、市场趋势',
                    '用途：制定销售目标、资源配置、库存计划'
                  ]}
                  formula="预测值 = 趋势分量 + 季节分量 + 随机分量"
                  example="预测未来6个月销售$2.75M，置信度87%，建议按此预测制定H2销售计划和资源配置。"
                />
              </div>
              <p className="text-xs text-slate-600">Sales Forecast</p>
            </div>
            <Badge className="bg-green-100 text-green-700 text-xs">置信度87%</Badge>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <p className="text-xs text-slate-600 mb-1">未来3个月</p>
              <p className="text-lg font-bold text-blue-600">${(salesForecast.next3Months / 1000000).toFixed(2)}M</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <p className="text-xs text-slate-600 mb-1">未来6个月</p>
              <p className="text-lg font-bold text-green-600">${(salesForecast.next6Months / 1000000).toFixed(2)}M</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg text-center">
              <p className="text-xs text-slate-600 mb-1">未来12个月</p>
              <p className="text-lg font-bold text-purple-600">${(salesForecast.next12Months / 1000000).toFixed(2)}M</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={160}>
            <ComposedChart data={salesForecast.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ fontSize: 11 }}
                formatter={(value: number) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Area 
                type="monotone" 
                dataKey="upper" 
                fill={COLORS.primary} 
                fillOpacity={0.1}
                stroke="none"
              />
              <Area 
                type="monotone" 
                dataKey="lower" 
                fill="#fff" 
                fillOpacity={1}
                stroke="none"
              />
              <Line 
                type="monotone" 
                dataKey="forecast" 
                stroke={COLORS.primary} 
                strokeWidth={2.5}
                dot={{ r: 4 }}
                name="预测值"
              />
            </ComposedChart>
          </ResponsiveContainer>

          <div className="mt-3 pt-3 border-t border-slate-200 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Zap className="size-3 text-blue-600" />
              <span>基于过去12个月数据，考虑季节性因素，预测Q3-Q4销售持续增长</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 📋 订单监控 + 价格竞争力 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 订单监控 */}
        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-1">
                <h3 className="text-sm font-semibold text-slate-900">订单实时监控</h3>
                <ModuleHelpTooltip
                  title="订单实时监控"
                  definition="Order Real-time Monitoring (订单实时监控) 展示新订单、待确认、待发货、逾期订单等各状态订单的数量和详情，帮助销售总监及时处理异常订单。"
                  details={[
                    '新订单：刚收到的订单，需尽快确认',
                    '待确认：等待客户确认的订单',
                    '待发货：已确认但尚未发货的订单',
                    '逾期订单：超过承诺交付时间的订单（需优先处理）'
                  ]}
                  example="当前有3个逾期订单需立即处理，12个新订单需在24小时内响应确认。"
                />
              </div>
              <p className="text-xs text-slate-600">Order Monitoring</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="p-2 bg-blue-50 rounded-lg text-center">
              <Package className="size-4 text-blue-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-blue-600">{orderMonitoring.newOrders}</p>
              <p className="text-xs text-slate-600">新订单</p>
            </div>
            <div className="p-2 bg-yellow-50 rounded-lg text-center">
              <Clock className="size-4 text-yellow-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-yellow-600">{orderMonitoring.pendingConfirm}</p>
              <p className="text-xs text-slate-600">待确认</p>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg text-center">
              <Target className="size-4 text-purple-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-purple-600">{orderMonitoring.pendingShipment}</p>
              <p className="text-xs text-slate-600">待发货</p>
            </div>
            <div className="p-2 bg-red-50 rounded-lg text-center">
              <AlertCircle className="size-4 text-red-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-red-600">{orderMonitoring.overdue}</p>
              <p className="text-xs text-slate-600">逾期</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-700 mb-2">最近订单</h4>
            <div className="space-y-2">
              {orderMonitoring.recentOrders.map((order) => (
                <div key={order.id} className="p-2 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-900">{order.id}</span>
                    <Badge className={`text-xs ${
                      order.status === 'new' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      order.status === 'shipping' ? 'bg-purple-100 text-purple-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {order.status === 'new' ? '新订单' :
                       order.status === 'pending' ? '待确认' :
                       order.status === 'shipping' ? '待发货' :
                       '逾期'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>{order.customer}</span>
                    <span className="font-semibold text-slate-900">${order.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                    <span>{order.region}</span>
                    <span>{order.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* 价格竞争力指数 */}
        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-1">
                <h3 className="text-sm font-semibold text-slate-900">价格竞争力指数</h3>
                <ModuleHelpTooltip
                  title="价格竞争力指数"
                  definition="Price Competitiveness Index (价格竞争力指数) 对比我方报价与市场平均价格，评估各产品线的价格竞争力。指数>100表示价格高于市场，<100表示价格低于市场。"
                  details={[
                    '指数=100：价格与市场持平',
                    '指数>100：价格高于市场（可能需降价）',
                    '指数<100：价格低于市场（具有价格优势）',
                    '建议区间：95-105为合理范围',
                    '用途：定价策略调整、报价优化'
                  ]}
                  formula="竞争力指数 = (我方价格 ÷ 市场均价) × 100"
                  example="卫浴产品指数95，具有价格优势；劳保用品指数109，建议适当调整定价策略。"
                />
              </div>
              <p className="text-xs text-slate-600">Price Competitiveness</p>
            </div>
            <Badge className="bg-blue-100 text-blue-700 text-xs">综合指数102</Badge>
          </div>

          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg mb-3">
            <div className="text-center mb-2">
              <p className="text-xs text-slate-600 mb-1">整体价格竞争力</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-3xl font-bold text-blue-600">{priceCompetitiveness.overall}</p>
                <div className="text-left">
                  <p className="text-xs text-slate-600">指数</p>
                  <p className="text-xs text-green-600">✓ 合理范围</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <ThumbsUp className="size-3 text-green-600" />
                <span className="text-slate-600">价格优势：卫浴</span>
              </div>
              <div className="flex items-center gap-1">
                <ThumbsDown className="size-3 text-red-600" />
                <span className="text-slate-600">需优化：劳保</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {priceCompetitiveness.byCategory.map((item) => (
              <div key={item.category}>
                <div className="flex items-center justify-between mb-1 text-xs">
                  <span className="font-medium text-slate-900">{item.category}</span>
                  <span className={`font-bold ${
                    item.index < 95 ? 'text-green-600' :
                    item.index > 105 ? 'text-red-600' :
                    'text-blue-600'
                  }`}>
                    {item.index}
                  </span>
                </div>
                <div className="relative h-8 bg-slate-100 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center">
                    <div 
                      className="h-full flex items-center justify-center transition-all"
                      style={{ 
                        width: `${item.index}%`,
                        backgroundColor: item.index < 95 ? COLORS.success + '40' :
                                       item.index > 105 ? COLORS.danger + '40' :
                                       COLORS.primary + '40',
                        borderRight: `3px solid ${
                          item.index < 95 ? COLORS.success :
                          item.index > 105 ? COLORS.danger :
                          COLORS.primary
                        }`
                      }}
                    />
                    <div 
                      className="absolute h-full w-0.5 bg-slate-400"
                      style={{ left: '100px' }}
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-between px-3 text-xs">
                    <span className="text-slate-600">我方: {item.ourPrice}</span>
                    <span className="text-slate-600">市场: {item.marketAvg}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                  <span>
                    {item.index < 95 ? '✓ 价格优势明显' :
                     item.index > 105 ? '⚠ 建议降价' :
                     '✓ 价格合理'}
                  </span>
                  <span>
                    {item.index < 95 ? `低${100 - item.index}%` :
                     item.index > 105 ? `高${item.index - 100}%` :
                     '持平'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
