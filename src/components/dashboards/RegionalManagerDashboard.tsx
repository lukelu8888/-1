// 🔥 世界顶级区域主管工作台
// Regional Manager Dashboard - B2B Foreign Trade Edition

import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ModuleHelpTooltip } from "./ModuleHelpTooltip";
import { 
  TrendingUp, TrendingDown, DollarSign, Users, Target, 
  Package, AlertCircle, Clock, Award, MapPin,
  Download, RefreshCw, Filter, ChevronRight,
  Trophy, Zap, Flag, Bell, FileText, BarChart3
} from "lucide-react";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell, ComposedChart
} from "recharts";
import { User } from "../../lib/rbac-config";

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

// 🌍 区域配置
const REGION_CONFIG = {
  NA: {
    name: '北美市场',
    enName: 'North America',
    icon: '🇺🇸',
    color: COLORS.primary,
    countries: ['美国', '加拿大', '墨西哥'],
    currency: 'USD',
    timezone: 'EST/PST'
  },
  SA: {
    name: '南美市场',
    enName: 'South America',
    icon: '🇧🇷',
    color: COLORS.success,
    countries: ['巴西', '阿根廷', '智利'],
    currency: 'USD',
    timezone: 'BRT'
  },
  EMEA: {
    name: '欧非市场',
    enName: 'Europe & Africa',
    icon: '🇩🇪',
    color: COLORS.indigo,
    countries: ['德国', '英国', '法国', '南非'],
    currency: 'EUR/USD',
    timezone: 'CET'
  }
};

interface RegionalManagerDashboardProps {
  user: User;
}

// 📊 生成区域数据
function getRegionData(region: 'NA' | 'SA' | 'EMEA') {
  const baseData = {
    NA: {
      revenue: 980000,
      target: 1000000,
      orders: 76,
      customers: 128,
      growth: 12.5,
      avgOrder: 12895,
      newCustomers: 15,
      teamSize: 8,
      conversion: 31.2,
      monthlyData: [
        { month: '1月', revenue: 155000, target: 160000, orders: 12 },
        { month: '2月', revenue: 158000, target: 165000, orders: 13 },
        { month: '3月', revenue: 162000, target: 167000, orders: 13 },
        { month: '4月', revenue: 160000, target: 168000, orders: 12 },
        { month: '5月', revenue: 168000, target: 170000, orders: 14 },
        { month: '6月', revenue: 177000, target: 170000, orders: 12 },
      ]
    },
    SA: {
      revenue: 620000,
      target: 650000,
      orders: 48,
      customers: 86,
      growth: 8.2,
      avgOrder: 12917,
      newCustomers: 9,
      teamSize: 5,
      conversion: 26.5,
      monthlyData: [
        { month: '1月', revenue: 98000, target: 105000, orders: 8 },
        { month: '2月', revenue: 101000, target: 107000, orders: 8 },
        { month: '3月', revenue: 103000, target: 108000, orders: 8 },
        { month: '4月', revenue: 102000, target: 109000, orders: 8 },
        { month: '5月', revenue: 106000, target: 110000, orders: 8 },
        { month: '6月', revenue: 110000, target: 111000, orders: 8 },
      ]
    },
    EMEA: {
      revenue: 850000,
      target: 850000,
      orders: 62,
      customers: 128,
      growth: 15.3,
      avgOrder: 13710,
      newCustomers: 12,
      teamSize: 6,
      conversion: 29.3,
      monthlyData: [
        { month: '1月', revenue: 127000, target: 140000, orders: 10 },
        { month: '2月', revenue: 136000, target: 141000, orders: 11 },
        { month: '3月', revenue: 145000, target: 142000, orders: 11 },
        { month: '4月', revenue: 143000, target: 143000, orders: 10 },
        { month: '5月', revenue: 151000, target: 142000, orders: 10 },
        { month: '6月', revenue: 148000, target: 142000, orders: 10 },
      ]
    }
  };

  return baseData[region];
}

// 🎯 生成产品线数据
function getProductData(region: 'NA' | 'SA' | 'EMEA') {
  const baseProducts = {
    NA: [
      { category: '电气产品', revenue: 380000, orders: 29, growth: 15.2, margin: 28.5, share: 38.8 },
      { category: '卫浴产品', revenue: 280000, orders: 22, growth: 10.5, margin: 32.8, share: 28.6 },
      { category: '门窗配件', revenue: 220000, orders: 17, growth: 8.8, margin: 25.2, share: 22.4 },
      { category: '劳保用品', revenue: 100000, orders: 8, growth: 18.5, margin: 18.9, share: 10.2 },
    ],
    SA: [
      { category: '电气产品', revenue: 240000, orders: 18, growth: 12.5, margin: 27.5, share: 38.7 },
      { category: '卫浴产品', revenue: 180000, orders: 14, growth: 6.2, margin: 31.8, share: 29.0 },
      { category: '门窗配件', revenue: 140000, orders: 11, growth: 5.5, margin: 24.2, share: 22.6 },
      { category: '劳保用品', revenue: 60000, orders: 5, growth: 15.2, margin: 17.9, share: 9.7 },
    ],
    EMEA: [
      { category: '电气产品', revenue: 360000, orders: 29, growth: 18.5, margin: 29.5, share: 42.4 },
      { category: '卫浴产品', revenue: 220000, orders: 16, growth: 14.8, margin: 33.8, share: 25.9 },
      { category: '门窗配件', revenue: 160000, orders: 10, growth: 10.2, margin: 26.2, share: 18.8 },
      { category: '劳保用品', revenue: 110000, orders: 7, growth: 25.5, margin: 19.9, share: 12.9 },
    ]
  };

  return baseProducts[region];
}

// 👥 生成团队数据
function getTeamData(region: 'NA' | 'SA' | 'EMEA') {
  const teams = {
    NA: [
      { name: 'John Smith', role: '区域主管', revenue: 0, orders: 76, conversion: 31.2, customers: 128, rank: 0, isManager: true },
      { name: '陈晨', role: '高级业务员', revenue: 285000, orders: 22, conversion: 32.5, customers: 18, rank: 1 },
      { name: '赵敏', role: '业务员', revenue: 252000, orders: 19, conversion: 31.2, customers: 15, rank: 2 },
      { name: 'David Lee', role: '业务员', revenue: 198000, orders: 15, conversion: 28.8, customers: 12, rank: 3 },
      { name: 'Sarah Wang', role: '业务员', revenue: 165000, orders: 13, conversion: 27.5, customers: 11, rank: 4 },
      { name: 'Tom Zhang', role: '初级业务员', revenue: 80000, orders: 7, conversion: 22.8, customers: 8, rank: 5 },
    ],
    SA: [
      { name: 'Carlos Silva', role: '区域主管', revenue: 0, orders: 48, conversion: 26.5, customers: 86, rank: 0, isManager: true },
      { name: '孙杰', role: '高级业务员', revenue: 238000, orders: 18, conversion: 26.5, customers: 14, rank: 1 },
      { name: 'Ana Santos', role: '业务员', revenue: 185000, orders: 14, conversion: 25.2, customers: 12, rank: 2 },
      { name: 'Pedro Costa', role: '业务员', revenue: 142000, orders: 11, conversion: 24.8, customers: 10, rank: 3 },
      { name: 'Maria Lopez', role: '初级业务员', revenue: 55000, orders: 5, conversion: 20.5, customers: 6, rank: 4 },
    ],
    EMEA: [
      { name: 'Hans Mueller', role: '区域主管', revenue: 0, orders: 62, conversion: 29.3, customers: 128, rank: 0, isManager: true },
      { name: '刘洋', role: '高级业务员', revenue: 268000, orders: 20, conversion: 28.8, customers: 16, rank: 1 },
      { name: '周萍', role: '业务员', revenue: 225000, orders: 17, conversion: 29.3, customers: 13, rank: 2 },
      { name: 'Emma Schmidt', role: '业务员', revenue: 195000, orders: 15, conversion: 27.5, customers: 12, rank: 3 },
      { name: 'Klaus Weber', role: '业务员', revenue: 162000, orders: 10, conversion: 26.8, customers: 10, rank: 4 },
    ]
  };

  return teams[region];
}

// 🏆 生成客户数据
function getCustomerData(region: 'NA' | 'SA' | 'EMEA') {
  const customers = {
    NA: {
      total: 128,
      strategic: 8,
      key: 28,
      standard: 62,
      atRisk: 30,
      topCustomers: [
        { name: 'ABC Supply Co.', revenue: 185000, orders: 14, health: 95, type: '战略' },
        { name: 'BuildMart Inc.', revenue: 142000, orders: 11, health: 88, type: '重点' },
        { name: 'Pro Hardware LLC', revenue: 128000, orders: 10, health: 92, type: '重点' },
        { name: 'Construction Plus', revenue: 98000, orders: 8, health: 78, type: '重点' },
        { name: 'Home Depot Supply', revenue: 85000, orders: 7, health: 82, type: '普通' },
      ]
    },
    SA: {
      total: 86,
      strategic: 5,
      key: 18,
      standard: 42,
      atRisk: 21,
      topCustomers: [
        { name: 'Ferretería Central', revenue: 125000, orders: 10, health: 90, type: '战略' },
        { name: 'Construção Brasil', revenue: 98000, orders: 8, health: 85, type: '重点' },
        { name: 'Casa do Constructor', revenue: 82000, orders: 7, health: 88, type: '重点' },
        { name: 'Materiais Argentina', revenue: 68000, orders: 6, health: 75, type: '重点' },
        { name: 'Chile Building Supply', revenue: 55000, orders: 5, health: 72, type: '普通' },
      ]
    },
    EMEA: {
      total: 128,
      strategic: 10,
      key: 32,
      standard: 58,
      atRisk: 28,
      topCustomers: [
        { name: 'BuildMart GmbH', revenue: 165000, orders: 12, health: 96, type: '战略' },
        { name: 'Euro Construction Ltd', revenue: 138000, orders: 10, health: 92, type: '重点' },
        { name: 'Deutsche Bau AG', revenue: 125000, orders: 10, health: 90, type: '重点' },
        { name: 'UK Hardware Group', revenue: 102000, orders: 8, health: 85, type: '重点' },
        { name: 'France Matériaux SA', revenue: 88000, orders: 7, health: 80, type: '普通' },
      ]
    }
  };

  return customers[region];
}

// 📈 生成销售漏斗数据
function getFunnelData(region: 'NA' | 'SA' | 'EMEA') {
  const funnels = {
    NA: [
      { stage: '询价', count: 185, value: 2380000, conversion: 100 },
      { stage: '报价', count: 115, value: 1610000, conversion: 62.2 },
      { stage: '谈判', count: 88, value: 1232000, conversion: 47.6 },
      { stage: '签约', count: 58, value: 870000, conversion: 31.4 },
      { stage: '收款', count: 48, value: 720000, conversion: 25.9 },
    ],
    SA: [
      { stage: '询价', count: 125, value: 1580000, conversion: 100 },
      { stage: '报价', count: 75, value: 1050000, conversion: 60.0 },
      { stage: '谈判', count: 52, value: 728000, conversion: 41.6 },
      { stage: '签约', count: 33, value: 495000, conversion: 26.4 },
      { stage: '收款', count: 28, value: 420000, conversion: 22.4 },
    ],
    EMEA: [
      { stage: '询价', count: 140, value: 1820000, conversion: 100 },
      { stage: '报价', count: 90, value: 1260000, conversion: 64.3 },
      { stage: '谈判', count: 72, value: 1008000, conversion: 51.4 },
      { stage: '签约', count: 48, value: 720000, conversion: 34.3 },
      { stage: '收款', count: 41, value: 615000, conversion: 29.3 },
    ]
  };

  return funnels[region];
}

// 🎯 生成市场分析数据
function getMarketData(region: 'NA' | 'SA' | 'EMEA') {
  const markets = {
    NA: {
      marketSize: 25000000,
      ourShare: 3.92,
      growthRate: 8.5,
      competition: 'high',
      opportunities: ['智能家居市场增长', '绿色建筑需求上升', '供应链本地化趋势'],
      threats: ['本地竞争加剧', '关税政策不确定性', '运费成本上涨'],
      competitorAnalysis: [
        { competitor: 'Home Depot', strength: 95, weakness: '价格较高' },
        { competitor: "Lowe's", strength: 88, weakness: '产品线有限' },
        { competitor: 'Menards', strength: 75, weakness: '区域限制' },
      ]
    },
    SA: {
      marketSize: 12000000,
      ourShare: 5.17,
      growthRate: 12.5,
      competition: 'medium',
      opportunities: ['基础设施建设加速', '城市化进程', '电商渠道发展'],
      threats: ['汇率波动', '政治不稳定', '物流基础设施薄弱'],
      competitorAnalysis: [
        { competitor: 'Leroy Merlin', strength: 85, weakness: '价格竞争' },
        { competitor: 'Sodimac', strength: 78, weakness: '服务响应慢' },
        { competitor: '本地批发商', strength: 65, weakness: '质量不稳定' },
      ]
    },
    EMEA: {
      marketSize: 35000000,
      ourShare: 2.43,
      growthRate: 6.8,
      competition: 'high',
      opportunities: ['欧盟统一市场', '绿色能源转型', '数字化改造需求'],
      threats: ['环保法规严格', '劳动力成本高', '脱欧影响'],
      competitorAnalysis: [
        { competitor: 'OBI', strength: 92, weakness: '价格高' },
        { competitor: 'Bauhaus', strength: 88, weakness: '交期长' },
        { competitor: 'Hornbach', strength: 82, weakness: '产品线窄' },
      ]
    }
  };

  return markets[region];
}

export function RegionalManagerDashboard({ user }: RegionalManagerDashboardProps) {
  const region = user.region as 'NA' | 'SA' | 'EMEA';
  const regionConfig = REGION_CONFIG[region];
  const regionData = getRegionData(region);
  const productData = getProductData(region);
  const teamData = getTeamData(region);
  const customerData = getCustomerData(region);
  const funnelData = getFunnelData(region);
  const marketData = getMarketData(region);

  // 计算完成率
  const completion = (regionData.revenue / regionData.target) * 100;

  // 核心KPI
  const coreKPIs = [
    { 
      label: '销售收入', 
      value: regionData.revenue, 
      unit: 'USD', 
      change: regionData.growth, 
      target: regionData.target, 
      completion: completion, 
      icon: DollarSign 
    },
    { 
      label: '订单数量', 
      value: regionData.orders, 
      unit: '单', 
      change: 8.5, 
      target: Math.round(regionData.target / regionData.avgOrder), 
      completion: (regionData.orders / Math.round(regionData.target / regionData.avgOrder)) * 100, 
      icon: Package 
    },
    { 
      label: '客户数量', 
      value: customerData.total, 
      unit: '家', 
      change: 6.5, 
      target: Math.round(customerData.total * 1.08), 
      completion: (customerData.total / Math.round(customerData.total * 1.08)) * 100, 
      icon: Users 
    },
    { 
      label: '转化率', 
      value: regionData.conversion, 
      unit: '%', 
      change: 2.5, 
      target: 30, 
      completion: (regionData.conversion / 30) * 100, 
      icon: Target 
    },
    { 
      label: '客单价', 
      value: regionData.avgOrder, 
      unit: 'USD', 
      change: 3.8, 
      target: 13000, 
      completion: (regionData.avgOrder / 13000) * 100, 
      icon: TrendingUp 
    },
    { 
      label: '团队人数', 
      value: regionData.teamSize, 
      unit: '人', 
      change: 0, 
      target: regionData.teamSize, 
      completion: 100, 
      icon: Award 
    },
  ];

  return (
    <div className="space-y-4 p-4 bg-slate-50">
      {/* 🎯 区域标识横幅 */}
      <div className="relative overflow-hidden rounded-xl p-6 text-white" style={{ backgroundColor: regionConfig.color }}>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-3xl">
              {regionConfig.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-white">{regionConfig.name}</h1>
                <Badge className="bg-white/20 text-white border-white/30 text-xs">
                  {regionConfig.enName}
                </Badge>
              </div>
              <p className="text-sm text-white/90">
                区域主管：{user.name} · 团队{regionData.teamSize}人 · {customerData.total}家客户
              </p>
              <div className="flex items-center gap-3 mt-2 text-sm text-white/80">
                <span>💱 {regionConfig.currency}</span>
                <span>🕐 {regionConfig.timezone}</span>
                <span>🌍 {regionConfig.countries.join(' · ')}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/80 mb-1">本月目标达成率</p>
            <p className="text-4xl font-bold">{completion.toFixed(0)}%</p>
            <div className="flex items-center justify-end gap-1 mt-2">
              <TrendingUp className="size-4" />
              <span className="text-sm">+{regionData.growth}%</span>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
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
                {kpi.change !== 0 && (
                  isPositive ? (
                    <TrendingUp className="size-3 text-green-600" />
                  ) : (
                    <TrendingDown className="size-3 text-red-600" />
                  )
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
                  {kpi.change !== 0 ? (
                    <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                      {isPositive ? '+' : ''}{kpi.change}%
                    </span>
                  ) : (
                    <span className="text-slate-500">-</span>
                  )}
                  <span className="text-slate-500">{kpi.completion.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1 mt-1">
                  <div 
                    className="h-1 rounded-full bg-blue-500"
                    style={{ width: `${Math.min(kpi.completion, 100)}%` }}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 📈 销售业绩 + 销售漏斗 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 区域销售业绩 */}
        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-1">
                <h3 className="text-sm font-semibold text-slate-900">区域销售业绩</h3>
                <ModuleHelpTooltip
                  title="区域销售业绩"
                  definition="Regional Sales Performance (区域销售业绩) 展示本区域的月度销售趋势、目标达成情况和订单数量变化，帮助区域主管掌握业绩节奏。"
                  details={[
                    '月度收入：每月实际销售额',
                    '目标对比：实际vs目标对比分析',
                    '订单趋势：订单数量变化曲线',
                    '同比增长：与去年同期对比',
                    '环比增长：与上月对比'
                  ]}
                  formula="目标达成率 = (实际收入 ÷ 目标收入) × 100%"
                  example={`${regionConfig.name}当前收入$${(regionData.revenue / 1000).toFixed(0)}K，目标达成率${completion.toFixed(0)}%，同比增长${regionData.growth}%。`}
                />
              </div>
              <p className="text-xs text-slate-600">Monthly Trend</p>
            </div>
            <Badge className="bg-green-100 text-green-700 text-xs">+{regionData.growth}%</Badge>
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={regionData.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ fontSize: 11, borderRadius: '6px' }}
                formatter={(value: number) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Bar dataKey="target" fill="#cbd5e1" name="目标" radius={[4, 4, 0, 0]} />
              <Bar dataKey="revenue" fill={regionConfig.color} name="实际" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="orders" stroke={COLORS.success} strokeWidth={2} name="订单数" />
            </ComposedChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-200 text-xs">
            <div>
              <p className="text-slate-600">本月收入</p>
              <p className="font-semibold text-blue-600">${(regionData.revenue / 1000).toFixed(0)}K</p>
            </div>
            <div>
              <p className="text-slate-600">达成率</p>
              <p className="font-semibold text-green-600">{completion.toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-slate-600">订单数</p>
              <p className="font-semibold text-purple-600">{regionData.orders}单</p>
            </div>
            <div>
              <p className="text-slate-600">客单价</p>
              <p className="font-semibold text-orange-600">${(regionData.avgOrder / 1000).toFixed(1)}K</p>
            </div>
          </div>
        </Card>

        {/* 区域销售漏斗 */}
        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-1">
                <h3 className="text-sm font-semibold text-slate-900">区域销售漏斗</h3>
                <ModuleHelpTooltip
                  title="区域销售漏斗"
                  definition="Regional Sales Funnel (区域销售漏斗) 展示本区域从询价到收款的完整销售流程各阶段转化情况，帮助识别本区域的销售瓶颈。"
                  details={[
                    '询价阶段：本区域客户询价数量',
                    '报价阶段：团队发出的报价数',
                    '谈判阶段：进入商务谈判的订单',
                    '签约阶段：成功签订的合同',
                    '收款阶段：完成收款的订单'
                  ]}
                  formula="阶段转化率 = (当前阶段数量 ÷ 询价数量) × 100%"
                  example={`${regionConfig.name}从${funnelData[0].count}个询价最终转化为${funnelData[4].count}个收款，整体转化率${funnelData[4].conversion.toFixed(1)}%。`}
                />
              </div>
              <p className="text-xs text-slate-600">Conversion Funnel</p>
            </div>
            <Badge className="bg-blue-100 text-blue-700 text-xs">{funnelData[4].conversion.toFixed(1)}%转化</Badge>
          </div>

          <div className="space-y-2">
            {funnelData.map((stage, index) => (
              <div key={stage.stage} className="relative">
                <div className="flex items-center gap-2">
                  <div 
                    className="h-11 rounded-lg flex items-center justify-between px-3 transition-all"
                    style={{ 
                      width: `${stage.conversion}%`, 
                      backgroundColor: regionConfig.color + '20',
                      border: `2px solid ${regionConfig.color}`,
                      minWidth: '120px'
                    }}
                  >
                    <div>
                      <p className="text-xs font-semibold" style={{ color: regionConfig.color }}>{stage.stage}</p>
                      <p className="text-xs text-slate-600">{stage.count}个</p>
                    </div>
                    <Badge style={{ backgroundColor: regionConfig.color }} className="text-white text-xs">
                      {stage.conversion.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">整体转化率</span>
              <span className="font-semibold text-green-600">{funnelData[4].conversion.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-slate-600">最大流失环节</span>
              <span className="font-semibold text-red-600">询价→报价</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 📦 产品线表现 + 客户健康度 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 区域产品线表现 */}
        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-1">
                <h3 className="text-sm font-semibold text-slate-900">产品线表现</h3>
                <ModuleHelpTooltip
                  title="区域产品线表现"
                  definition="Regional Product Performance (区域产品线表现) 展示各产品类别在本区域的销售表现，包括收入、订单数、增长率、市场份额等。"
                  details={[
                    '销售收入：该产品线在本区域的销售额',
                    '订单数量：该产品线的订单数',
                    '增长率：与去年同期对比',
                    '毛利率：(收入-成本)÷收入×100%',
                    '市场份额：在本区域的占比'
                  ]}
                  example={`${regionConfig.name}电气产品表现最佳，占比${productData[0].share.toFixed(1)}%。`}
                />
              </div>
              <p className="text-xs text-slate-600">Product Categories</p>
            </div>
          </div>

          <div className="space-y-2 mb-3">
            {productData.map((product, index) => (
              <div key={product.category} className="p-2.5 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-1 h-7 rounded-full"
                      style={{ backgroundColor: [COLORS.indigo, COLORS.primary, COLORS.teal, COLORS.orange][index] }}
                    />
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{product.category}</h4>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">${(product.revenue / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-green-600">+{product.growth}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <p className="text-slate-600">订单</p>
                    <p className="font-semibold">{product.orders}单</p>
                  </div>
                  <div>
                    <p className="text-slate-600">毛利率</p>
                    <p className="font-semibold text-green-600">{product.margin}%</p>
                  </div>
                  <div>
                    <p className="text-slate-600">占比</p>
                    <p className="font-semibold">{product.share.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-slate-600">客单价</p>
                    <p className="font-semibold">${(product.revenue / product.orders / 1000).toFixed(1)}K</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productData}
                  dataKey="revenue"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={50}
                  label={(entry) => `${entry.category} ${entry.share.toFixed(0)}%`}
                  labelStyle={{ fontSize: 10 }}
                >
                  {productData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={[COLORS.indigo, COLORS.primary, COLORS.teal, COLORS.orange][index]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11 }} formatter={(value: number) => `$${(value / 1000).toFixed(0)}K`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 客户健康度 */}
        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-1">
                <h3 className="text-sm font-semibold text-slate-900">客户健康度</h3>
                <ModuleHelpTooltip
                  title="区域客户健康度"
                  definition="Regional Customer Health (区域客户健康度) 基于RFM模型分析本区域客户状况，识别战略客户、重点客户和流失风险客户。"
                  details={[
                    '战略客户：高价值、高忠诚度客户',
                    '重点客户：中高价值、有增长潜力',
                    '普通客户：标准服务对象',
                    '流失风险：长期未下单需关注',
                    'Top5客户：本区域前5大客户'
                  ]}
                  example={`${regionConfig.name}共${customerData.total}家客户，其中${customerData.strategic}家战略客户需重点维护。`}
                />
              </div>
              <p className="text-xs text-slate-600">Customer Segmentation</p>
            </div>
            <Badge className="bg-blue-100 text-blue-700 text-xs">{customerData.total}家</Badge>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="p-2 bg-green-50 rounded-lg text-center border-2 border-green-200">
              <p className="text-lg font-bold text-green-600">{customerData.strategic}</p>
              <p className="text-xs text-slate-600">战略客户</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg text-center border-2 border-blue-200">
              <p className="text-lg font-bold text-blue-600">{customerData.key}</p>
              <p className="text-xs text-slate-600">重点客户</p>
            </div>
            <div className="p-2 bg-yellow-50 rounded-lg text-center border-2 border-yellow-200">
              <p className="text-lg font-bold text-yellow-600">{customerData.standard}</p>
              <p className="text-xs text-slate-600">普通客户</p>
            </div>
            <div className="p-2 bg-red-50 rounded-lg text-center border-2 border-red-200">
              <p className="text-lg font-bold text-red-600">{customerData.atRisk}</p>
              <p className="text-xs text-slate-600">流失风险</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-700 mb-2">🏆 Top5客户</h4>
            <div className="space-y-1.5">
              {customerData.topCustomers.map((customer, index) => (
                <div key={customer.name} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-600' :
                    'bg-slate-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900 truncate">{customer.name}</span>
                      <span className="font-semibold text-blue-600">${(customer.revenue / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600 mt-0.5">
                      <span>{customer.orders}单 · {customer.type}</span>
                      <span className="text-green-600">健康度{customer.health}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* 👥 团队绩效 + 市场分析 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 团队绩效排行 */}
        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-1">
                <h3 className="text-sm font-semibold text-slate-900">团队绩效排行</h3>
                <ModuleHelpTooltip
                  title="区域团队绩效"
                  definition="Regional Team Performance (区域团队绩效) 展示本区域团队成员的销售业绩排名、转化率、客户数等关键指标。"
                  details={[
                    '业绩排名：按销售收入排序',
                    '转化率：成交订单÷总询价×100%',
                    '客户数：负责管理的客户数量',
                    '订单数：成交订单总数',
                    '用途：识别优秀员工和辅导对象'
                  ]}
                  example={`${regionConfig.name}团队${regionData.teamSize}人，Top1业务员业绩${(teamData[1].revenue / 1000).toFixed(0)}K。`}
                />
              </div>
              <p className="text-xs text-slate-600">Team Ranking</p>
            </div>
            <Badge className="bg-blue-100 text-blue-700 text-xs">{regionData.teamSize}人</Badge>
          </div>

          <div className="space-y-2">
            {teamData.map((member, index) => {
              if (member.isManager) {
                return (
                  <div key={member.name} className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                    <div className="flex items-center gap-2">
                      <Trophy className="size-5 text-blue-600" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-blue-900">{member.name}</span>
                          <Badge className="bg-blue-600 text-white text-xs">{member.role}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 mt-1">
                          <span>订单: {member.orders}单</span>
                          <span>客户: {member.customers}家</span>
                          <span>转化: {member.conversion}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={member.name} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-white ${
                    member.rank === 1 ? 'bg-yellow-500' :
                    member.rank === 2 ? 'bg-gray-400' :
                    member.rank === 3 ? 'bg-orange-600' :
                    'bg-slate-400'
                  }`}>
                    {member.rank}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-semibold text-slate-900">{member.name}</span>
                      <span className="text-sm font-semibold text-blue-600">${(member.revenue / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>{member.role} · {member.customers}客户</span>
                      <span>{member.conversion}%转化</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* 市场竞争分析 */}
        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-1">
                <h3 className="text-sm font-semibold text-slate-900">市场竞争分析</h3>
                <ModuleHelpTooltip
                  title="区域市场分析"
                  definition="Regional Market Analysis (区域市场分析) 分析本区域的市场规模、我方市场份额、竞争态势、机会和威胁。"
                  details={[
                    '市场规模：本区域市场总容量',
                    '市场份额：我方占有率',
                    '增长率：市场年增长速度',
                    '竞争态势：主要竞争对手分析',
                    'SWOT分析：机会与威胁识别'
                  ]}
                  example={`${regionConfig.name}市场规模$${(marketData.marketSize / 1000000).toFixed(0)}M，我方份额${marketData.ourShare.toFixed(2)}%，仍有巨大增长空间。`}
                />
              </div>
              <p className="text-xs text-slate-600">Market Intelligence</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="p-2.5 bg-blue-50 rounded-lg text-center">
              <p className="text-xs text-slate-600 mb-1">市场规模</p>
              <p className="text-lg font-bold text-blue-600">${(marketData.marketSize / 1000000).toFixed(0)}M</p>
            </div>
            <div className="p-2.5 bg-green-50 rounded-lg text-center">
              <p className="text-xs text-slate-600 mb-1">我方份额</p>
              <p className="text-lg font-bold text-green-600">{marketData.ourShare.toFixed(2)}%</p>
            </div>
            <div className="p-2.5 bg-purple-50 rounded-lg text-center">
              <p className="text-xs text-slate-600 mb-1">增长率</p>
              <p className="text-lg font-bold text-purple-600">{marketData.growthRate}%</p>
            </div>
          </div>

          <div className="mb-3">
            <h4 className="text-xs font-semibold text-slate-700 mb-2">🎯 主要竞争对手</h4>
            <div className="space-y-2">
              {marketData.competitorAnalysis.map((comp) => (
                <div key={comp.competitor} className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-slate-900">{comp.competitor}</span>
                      <span className="font-bold text-slate-700">{comp.strength}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div 
                        className="h-1.5 rounded-full bg-gradient-to-r from-red-500 to-orange-500"
                        style={{ width: `${comp.strength}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">弱点: {comp.weakness}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-green-50 rounded-lg">
              <div className="flex items-center gap-1 mb-1">
                <Zap className="size-3 text-green-600" />
                <span className="font-semibold text-green-700">机会</span>
              </div>
              <ul className="space-y-0.5 text-slate-600">
                {marketData.opportunities.map((opp, i) => (
                  <li key={i}>• {opp}</li>
                ))}
              </ul>
            </div>
            <div className="p-2 bg-red-50 rounded-lg">
              <div className="flex items-center gap-1 mb-1">
                <AlertCircle className="size-3 text-red-600" />
                <span className="font-semibold text-red-700">威胁</span>
              </div>
              <ul className="space-y-0.5 text-slate-600">
                {marketData.threats.map((threat, i) => (
                  <li key={i}>• {threat}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* 🎯 操作按钮栏 */}
      <Card className="p-4 border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">快速操作</h3>
            <p className="text-xs text-slate-600">常用功能快捷入口</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs h-8">
              <FileText className="size-3.5 mr-1.5" />
              查看报表
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-8">
              <BarChart3 className="size-3.5 mr-1.5" />
              数据分析
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-8">
              <Users className="size-3.5 mr-1.5" />
              客户管理
            </Button>
            <Button size="sm" className="text-xs h-8" style={{ backgroundColor: regionConfig.color }}>
              <Download className="size-3.5 mr-1.5" />
              导出数据
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
