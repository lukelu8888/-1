// 🔥 世界顶级CFO工作台 - 紧凑版（含完整模块定义说明）
// CFO Dashboard Compact with Help Tooltips

import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ModuleHelpTooltip } from "./ModuleHelpTooltip";
import { 
  TrendingUp, TrendingDown, DollarSign, Wallet, AlertTriangle, 
  Target, Activity, Download, RefreshCw, Shield, CheckCircle, 
  XCircle, Building2
} from "lucide-react";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  ComposedChart, RadarChart, Radar, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell
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
};

// 📊 数据定义
const financialHealthScore = {
  overall: 82,
  components: [
    { name: '盈利能力', score: 85, weight: 25 },
    { name: '偿债能力', score: 78, weight: 20 },
    { name: '营运能力', score: 88, weight: 20 },
    { name: '现金流量', score: 75, weight: 20 },
    { name: '增长能力', score: 82, weight: 15 },
  ]
};

const cashFlowWaterfallData = [
  { name: '期初', value: 850000, type: 'start' },
  { name: '经营', value: 450000, type: 'positive' },
  { name: '投资', value: -120000, type: 'negative' },
  { name: '融资', value: -80000, type: 'negative' },
  { name: '汇率', value: 15000, type: 'positive' },
  { name: '期末', value: 1115000, type: 'end' },
];

const workingCapitalData = {
  ccc: 45,
  dso: 42,
  dio: 38,
  dpo: 35,
  trend: [
    { month: '1月', ccc: 52, dso: 48, dio: 42, dpo: 38 },
    { month: '2月', ccc: 50, dso: 46, dio: 41, dpo: 37 },
    { month: '3月', ccc: 48, dso: 44, dio: 40, dpo: 36 },
    { month: '4月', ccc: 46, dso: 43, dio: 39, dpo: 36 },
    { month: '5月', ccc: 47, dso: 43, dio: 39, dpo: 35 },
    { month: '6月', ccc: 45, dso: 42, dio: 38, dpo: 35 },
  ]
};

const profitabilityData = {
  current: {
    grossMargin: 31.5,
    operatingMargin: 22.8,
    netMargin: 17.2,
    ebitdaMargin: 25.6,
    roe: 18.5,
    roa: 12.3,
    roic: 15.8,
  },
  trend: [
    { month: '1月', grossMargin: 30.2, operatingMargin: 21.5, netMargin: 16.2, ebitdaMargin: 24.0 },
    { month: '2月', grossMargin: 30.8, operatingMargin: 22.0, netMargin: 16.5, ebitdaMargin: 24.5 },
    { month: '3月', grossMargin: 31.0, operatingMargin: 22.2, netMargin: 16.8, ebitdaMargin: 25.0 },
    { month: '4月', grossMargin: 31.2, operatingMargin: 22.5, netMargin: 17.0, ebitdaMargin: 25.2 },
    { month: '5月', grossMargin: 31.3, operatingMargin: 22.6, netMargin: 17.1, ebitdaMargin: 25.4 },
    { month: '6月', grossMargin: 31.5, operatingMargin: 22.8, netMargin: 17.2, ebitdaMargin: 25.6 },
  ]
};

const budgetVsActualData = [
  { category: '营业收入', budget: 2500000, actual: 2450000, variance: -2.0, status: 'warning' },
  { category: '营业成本', budget: 1650000, actual: 1680000, variance: 1.8, status: 'danger' },
  { category: '毛利润', budget: 850000, actual: 770000, variance: -9.4, status: 'danger' },
  { category: '营业费用', budget: 380000, actual: 350000, variance: -7.9, status: 'success' },
  { category: '净利润', budget: 450000, actual: 420000, variance: -6.7, status: 'warning' },
];

const financialRatiosData = [
  { ratio: '流动比率', actual: 1.65, benchmark: 2.0 },
  { ratio: '速动比率', actual: 1.25, benchmark: 1.0 },
  { ratio: '资产负债率', actual: 0.45, benchmark: 0.60 },
  { ratio: '总资产周转率', actual: 1.8, benchmark: 1.5 },
  { ratio: 'ROE', actual: 0.185, benchmark: 0.15 },
  { ratio: '毛利率', actual: 0.315, benchmark: 0.30 },
];

const regionalPerformanceData = [
  { region: '北美市场', revenue: 980000, profit: 168000, margin: 17.14, growth: 12.5, roi: 22.3, status: 'excellent' },
  { region: '南美市场', revenue: 620000, profit: 93000, margin: 15.00, growth: 8.2, roi: 15.8, status: 'good' },
  { region: '欧非市场', revenue: 850000, profit: 159000, margin: 18.71, growth: 15.3, roi: 25.6, status: 'excellent' },
];

const riskAlerts = [
  {
    id: 'RISK-001',
    category: '信用风险',
    level: 'high',
    title: '3家客户逾期超60天',
    amount: 130000,
    impact: '现金流紧张',
    action: '启动催收程序',
    deadline: '3天内',
  },
  {
    id: 'RISK-002',
    category: '流动性风险',
    level: 'medium',
    title: '现金储备低于安全线',
    amount: 350000,
    impact: '支付能力受限',
    action: '优化现金管理',
    deadline: '7天内',
  },
];

const pendingApprovals = [
  {
    id: 'APP-001',
    type: 'capital_expenditure',
    title: '智能制造产线设备采购',
    amount: 1200000,
    npv: 850000,
    irr: 18.5,
    payback: 3.2,
    requester: '运营总监',
    priority: 'high',
  },
  {
    id: 'APP-002',
    type: 'investment',
    title: '收购供应链上游企业',
    amount: 3500000,
    npv: 1200000,
    irr: 22.3,
    payback: 4.5,
    requester: 'CEO',
    priority: 'critical',
  },
];

const coreKPIs = [
  { label: '营业收入', value: 2450000, unit: 'USD', change: 12.5, trend: 'up', target: 2500000, completion: 98.0, icon: DollarSign, color: 'blue' },
  { label: 'EBITDA', value: 628000, unit: 'USD', change: 15.3, trend: 'up', target: 650000, completion: 96.6, icon: TrendingUp, color: 'green' },
  { label: '净利润', value: 420000, unit: 'USD', change: -6.7, trend: 'down', target: 450000, completion: 93.3, icon: Wallet, color: 'purple' },
  { label: '经营现金流', value: 450000, unit: 'USD', change: 8.2, trend: 'up', target: 480000, completion: 93.8, icon: Activity, color: 'teal' },
  { label: 'ROE', value: 18.5, unit: '%', change: 2.3, trend: 'up', target: 20.0, completion: 92.5, icon: Target, color: 'indigo' },
  { label: 'CCC', value: 45, unit: '天', change: -13.5, trend: 'down', target: 40, completion: 88.9, icon: RefreshCw, color: 'orange' },
];

export function CFODashboardCompactWithHelp() {
  return (
    <div className="space-y-4 p-4 bg-slate-50">
      {/* 🎯 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 mb-1">CFO战略财务管理中心</h1>
          <p className="text-sm text-slate-600">实时财务洞察 · 战略决策支持 · 风险管控</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-700 bg-white">
            <option>2024年 Q4</option>
            <option>2024年 Q3</option>
          </select>
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

      {/* 📊 财务健康度 + 核心KPI */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* 财务健康度评分 */}
        <Card className="p-4 border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="size-4 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <h3 className="text-sm font-semibold text-slate-900">财务健康度</h3>
                  <ModuleHelpTooltip
                    title="财务健康度评分"
                    definition="财务健康度是对企业整体财务状况的综合评估指标，通过多维度分析企业的盈利能力、偿债能力、营运能力、现金流量和增长能力，给出0-100分的综合评分。"
                    details={[
                      '盈利能力（权重25%）：评估企业创造利润的能力',
                      '偿债能力（权重20%）：评估企业偿还债务的能力',
                      '营运能力（权重20%）：评估企业资产运营效率',
                      '现金流量（权重20%）：评估企业现金管理能力',
                      '增长能力（权重15%）：评估企业可持续发展潜力'
                    ]}
                    formula="总分 = Σ(各维度得分 × 权重)"
                    example="当前得分82分为优秀等级，说明企业财务状况良好，运营健康稳健。"
                  />
                </div>
                <p className="text-xs text-slate-600">综合评估</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-700 text-xs">优秀</Badge>
          </div>
          
          <div className="flex items-center gap-3 mb-3">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-blue-600">{financialHealthScore.overall}</span>
                <span className="text-lg text-slate-500">/100</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">较上季度 +3分</p>
            </div>

            <div className="flex-1">
              <ResponsiveContainer width="100%" height={120}>
                <RadarChart data={financialHealthScore.components}>
                  <PolarGrid stroke="#cbd5e1" />
                  <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                  <Radar 
                    name="得分" 
                    dataKey="score" 
                    stroke={COLORS.primary} 
                    fill={COLORS.primary} 
                    fillOpacity={0.6} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5">
            {financialHealthScore.components.map((item) => (
              <div key={item.name} className="space-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700">{item.name}</span>
                  <span className="text-slate-900 font-medium">{item.score}分</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div 
                    className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 核心KPI概览 */}
        <div className="xl:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-3">
          {coreKPIs.map((kpi) => {
            const Icon = kpi.icon;
            const bgColor = `bg-${kpi.color}-50`;
            const textColor = `text-${kpi.color}-600`;
            
            return (
              <Card key={kpi.label} className="p-3 border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-1.5 ${bgColor} rounded-lg`}>
                    <Icon className={`size-3.5 ${textColor}`} />
                  </div>
                  {kpi.trend === 'up' ? (
                    <TrendingUp className="size-3 text-green-600" />
                  ) : (
                    <TrendingDown className="size-3 text-red-600" />
                  )}
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <p className="text-xs text-slate-600">{kpi.label}</p>
                    {kpi.label === 'EBITDA' && (
                      <ModuleHelpTooltip
                        title="EBITDA"
                        definition="EBITDA (Earnings Before Interest, Taxes, Depreciation and Amortization) 是税息折旧及摊销前利润，衡量企业核心运营盈利能力的关键指标。"
                        formula="EBITDA = 净利润 + 利息 + 税项 + 折旧 + 摊销"
                        example="当前EBITDA为$628K，较上期增长15.3%，说明企业核心业务盈利能力强劲。"
                      />
                    )}
                    {kpi.label === 'ROE' && (
                      <ModuleHelpTooltip
                        title="ROE (股东权益回报率)"
                        definition="ROE (Return on Equity) 衡量企业运用股东权益创造利润的效率，是股东最关心的投资回报率指标。"
                        formula="ROE = 净利润 ÷ 股东权益 × 100%"
                        example="当前ROE为18.5%，高于行业基准15%，说明企业为股东创造了良好的投资回报。"
                      />
                    )}
                    {kpi.label === 'CCC' && (
                      <ModuleHelpTooltip
                        title="CCC (现金转换周期)"
                        definition="CCC (Cash Conversion Cycle) 是现金转换周期，衡量企业从支付现金采购到收回现金销售所需的时间，越短越好。"
                        formula="CCC = DSO + DIO - DPO"
                        example="当前CCC为45天，较上月缩短2天，说明营运资本管理效率提升。"
                      />
                    )}
                  </div>
                  <p className="text-base font-semibold text-slate-900">
                    {kpi.unit === 'USD' && '$'}
                    {kpi.unit === 'USD' ? (kpi.value / 1000).toFixed(0) + 'K' : kpi.value}
                    {kpi.unit === '%' && '%'}
                    {kpi.unit === '天' && '天'}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className={kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                      {kpi.trend === 'up' ? '+' : ''}{kpi.change}%
                    </span>
                    <span className="text-slate-500">{kpi.completion.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1 mt-1">
                    <div 
                      className={`h-1 rounded-full bg-${kpi.color}-500`}
                      style={{ width: `${kpi.completion}%` }}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 💰 现金流 + 营运资本 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-1">
                <h3 className="text-sm font-semibold text-slate-900">现金流瀑布图</h3>
                <ModuleHelpTooltip
                  title="现金流瀑布图"
                  definition="现金流瀑布图 (Cash Flow Waterfall) 是一种直观展示企业现金流入流出变化的图表，通过期初现金到经营/投资/融资活动再到期末现金的瀑布式展示，帮助CFO快速了解现金变动的来龙去脉。"
                  details={[
                    '经营活动现金流：主营业务产生的现金流（最重要）',
                    '投资活动现金流：资本支出、投资等产生的现金流',
                    '融资活动现金流：借贷、股权融资等产生的现金流',
                    '汇率影响：外汇汇率变动对现金的影响'
                  ]}
                  formula="期末现金 = 期初现金 + 经营活动 + 投资活动 + 融资活动 + 汇率影响"
                  example="当前从期初$850K增长到期末$1,115K，净增加$265K，主要来自经营活动现金流+$450K，说明主营业务现金创造能力强。"
                />
              </div>
              <p className="text-xs text-slate-600">Cash Flow Waterfall</p>
            </div>
            <Badge className="bg-green-100 text-green-700 text-xs">+$265K</Badge>
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={cashFlowWaterfallData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ fontSize: 11, borderRadius: '6px' }}
                formatter={(value: number) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {cashFlowWaterfallData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.type === 'start' || entry.type === 'end' ? COLORS.slate : entry.type === 'positive' ? COLORS.success : COLORS.danger} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-200">
            <div>
              <p className="text-xs text-slate-600">经营</p>
              <p className="text-sm font-semibold text-green-600">+$450K</p>
            </div>
            <div>
              <p className="text-xs text-slate-600">投资</p>
              <p className="text-sm font-semibold text-red-600">-$120K</p>
            </div>
            <div>
              <p className="text-xs text-slate-600">融资</p>
              <p className="text-sm font-semibold text-red-600">-$80K</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-1">
                <h3 className="text-sm font-semibold text-slate-900">营运资本管理</h3>
                <ModuleHelpTooltip
                  title="营运资本管理"
                  definition="营运资本管理 (Working Capital Management) 通过优化应收账款、存货和应付账款的周转效率，缩短现金转换周期，提升企业资金使用效率。"
                  details={[
                    'DSO (应收账款周转天数)：平均需要多少天收回客户欠款',
                    'DIO (存货周转天数)：平均需要多少天卖出存货',
                    'DPO (应付账款周转天数)：平均需要多少天支付供应商',
                    'CCC (现金转换周期)：综合衡量资金占用时间'
                  ]}
                  formula="CCC = DSO + DIO - DPO = 42 + 38 - 35 = 45天"
                  example="当前CCC为45天，说明企业的现金被占用45天。CCC越短，现金周转效率越高，资金压力越小。"
                />
              </div>
              <p className="text-xs text-slate-600">Working Capital - CCC</p>
            </div>
            <Badge className="bg-blue-100 text-blue-700 text-xs">45天</Badge>
          </div>

          <div className="flex items-center justify-center gap-2 mb-3 p-3 bg-slate-50 rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center gap-0.5">
                <p className="text-xs text-slate-600">DSO</p>
                <ModuleHelpTooltip
                  title="DSO (应收账款周转天数)"
                  definition="DSO (Days Sales Outstanding) 是应收账款周转天数，衡量企业平均需要多少天收回应收账款。"
                  formula="DSO = (应收账款 ÷ 营业收入) × 365天"
                  example="当前DSO为42天，意味着平均需要42天才能收回客户欠款。越短越好。"
                />
              </div>
              <p className="text-lg font-bold text-blue-600">{workingCapitalData.dso}</p>
            </div>
            <span className="text-lg text-slate-400">+</span>
            <div className="text-center">
              <div className="flex items-center justify-center gap-0.5">
                <p className="text-xs text-slate-600">DIO</p>
                <ModuleHelpTooltip
                  title="DIO (存货周转天数)"
                  definition="DIO (Days Inventory Outstanding) 是存货周转天数，衡量企业平均需要多少天卖出存货。"
                  formula="DIO = (存货 ÷ 营业成本) × 365天"
                  example="当前DIO为38天，意味着存货平均需要38天才能销售出去。越短越好。"
                />
              </div>
              <p className="text-lg font-bold text-purple-600">{workingCapitalData.dio}</p>
            </div>
            <span className="text-lg text-slate-400">-</span>
            <div className="text-center">
              <div className="flex items-center justify-center gap-0.5">
                <p className="text-xs text-slate-600">DPO</p>
                <ModuleHelpTooltip
                  title="DPO (应付账款周转天数)"
                  definition="DPO (Days Payable Outstanding) 是应付账款周转天数，衡量企业平均需要多少天支付供应商款项。"
                  formula="DPO = (应付账款 ÷ 营业成本) × 365天"
                  example="当前DPO为35天，意味着平均35天后才支付供应商。越长越好（在合理范围内）。"
                />
              </div>
              <p className="text-lg font-bold text-orange-600">{workingCapitalData.dpo}</p>
            </div>
            <span className="text-lg text-slate-400">=</span>
            <div className="text-center">
              <p className="text-xs text-slate-600">CCC</p>
              <p className="text-lg font-bold text-green-600">{workingCapitalData.ccc}</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={workingCapitalData.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="ccc" stroke={COLORS.success} strokeWidth={2} name="CCC" dot={false} />
              <Line type="monotone" dataKey="dso" stroke={COLORS.primary} strokeWidth={1.5} name="DSO" dot={false} />
            </LineChart>
          </ResponsiveContainer>

          <p className="mt-2 text-xs text-slate-600">
            ✓ CCC较上月缩短2天，效率提升
          </p>
        </Card>
      </div>

      {/* 📈 盈利能力 */}
      <Card className="p-4 border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-1">
              <h3 className="text-sm font-semibold text-slate-900">盈利能力深度分析</h3>
              <ModuleHelpTooltip
                title="盈利能力分析"
                definition="盈利能力分析 (Profitability Analysis) 通过毛利率、营业利润率、净利率、EBITDA率、ROE、ROA、ROIC等多个维度，全面评估企业的盈利能力和投资回报水平。"
                details={[
                  '毛利率：反映产品定价能力和成本控制',
                  '营业利润率：反映核心业务盈利能力',
                  '净利率：反映最终留存利润比例',
                  'EBITDA率：排除非经营因素的盈利能力',
                  'ROE：股东投资回报率',
                  'ROA：资产使用效率',
                  'ROIC：投资资本回报率'
                ]}
                example="当前EBITDA率25.6%、ROE 18.5%，均处于优秀水平，说明企业盈利能力强劲。"
              />
            </div>
            <p className="text-xs text-slate-600">Profitability Analysis</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="text-right">
              <p className="text-slate-600">EBITDA</p>
              <p className="font-semibold text-green-600">{profitabilityData.current.ebitdaMargin}%</p>
            </div>
            <div className="text-right">
              <p className="text-slate-600">ROE</p>
              <p className="font-semibold text-blue-600">{profitabilityData.current.roe}%</p>
            </div>
            <div className="text-right">
              <p className="text-slate-600">ROIC</p>
              <p className="font-semibold text-purple-600">{profitabilityData.current.roic}%</p>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={profitabilityData.trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 10 }} />
            <YAxis stroke="#64748b" domain={[0, 35]} tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="ebitdaMargin" stroke={COLORS.success} strokeWidth={2.5} name="EBITDA%" dot={false} />
            <Line type="monotone" dataKey="grossMargin" stroke={COLORS.primary} strokeWidth={1.5} name="毛利率%" dot={false} />
            <Line type="monotone" dataKey="netMargin" stroke={COLORS.danger} strokeWidth={1.5} name="净利率%" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-7 gap-2 mt-3 pt-3 border-t border-slate-200">
          <div>
            <p className="text-xs text-slate-600">毛利率</p>
            <p className="text-sm font-semibold text-blue-600">{profitabilityData.current.grossMargin}%</p>
          </div>
          <div>
            <p className="text-xs text-slate-600">营业率</p>
            <p className="text-sm font-semibold text-orange-600">{profitabilityData.current.operatingMargin}%</p>
          </div>
          <div>
            <p className="text-xs text-slate-600">净利率</p>
            <p className="text-sm font-semibold text-red-600">{profitabilityData.current.netMargin}%</p>
          </div>
          <div>
            <p className="text-xs text-slate-600">EBITDA</p>
            <p className="text-sm font-semibold text-green-600">{profitabilityData.current.ebitdaMargin}%</p>
          </div>
          <div>
            <p className="text-xs text-slate-600">ROE</p>
            <p className="text-sm font-semibold text-indigo-600">{profitabilityData.current.roe}%</p>
          </div>
          <div>
            <p className="text-xs text-slate-600">ROA</p>
            <p className="text-sm font-semibold text-purple-600">{profitabilityData.current.roa}%</p>
          </div>
          <div>
            <p className="text-xs text-slate-600">ROIC</p>
            <p className="text-sm font-semibold text-teal-600">{profitabilityData.current.roic}%</p>
          </div>
        </div>
      </Card>

      {/* 🎯 预算vs实际 + 财务比率 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-1">
                <h3 className="text-sm font-semibold text-slate-900">预算vs实际</h3>
                <ModuleHelpTooltip
                  title="预算差异分析"
                  definition="Budget Variance Analysis (预算差异分析) 通过对比预算目标与实际执行结果，帮助CFO识别业务偏差、分析原因、采取纠正措施。"
                  details={[
                    '✅ 绿色（优秀）：实际优于预算',
                    '⚠️ 黄色（警告）：实际略低于预算（-2%~-7%）',
                    '🚨 红色（危险）：实际大幅低于预算（<-7%）'
                  ]}
                  formula="差异率 = (实际值 - 预算值) ÷ 预算值 × 100%"
                  example="当前毛利润实际$770K vs 预算$850K，差异-9.4%，需关注成本管控和定价策略。"
                />
              </div>
              <p className="text-xs text-slate-600">Budget Variance</p>
            </div>
          </div>

          <div className="space-y-2">
            {budgetVsActualData.map((item) => (
              <div key={item.category} className="p-2.5 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-slate-900">{item.category}</span>
                  <Badge className={`text-xs ${
                    item.status === 'success' ? 'bg-green-100 text-green-700' :
                    item.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {item.variance > 0 ? '+' : ''}{item.variance.toFixed(1)}%
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-slate-600">预算</span>
                      <span className="text-slate-900">${(item.budget / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-slate-400" style={{ width: '100%' }} />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-slate-600">实际</span>
                      <span className="text-slate-900">${(item.actual / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${
                          item.status === 'success' ? 'bg-green-500' :
                          item.status === 'warning' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${(item.actual / item.budget) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-1">
                <h3 className="text-sm font-semibold text-slate-900">关键财务比率</h3>
                <ModuleHelpTooltip
                  title="关键财务比率"
                  definition="Key Financial Ratios (关键财务比率) 通过流动比率、速动比率、资产负债率、总资产周转率、ROE、毛利率等指标，多维度评估企业的偿债能力、营运能力和盈利能力。"
                  details={[
                    '流动比率：衡量短期偿债能力',
                    '速动比率：衡量即时变现能力',
                    '资产负债率：衡量财务杠杆水平',
                    '总资产周转率：衡量资产运营效率',
                    'ROE：衡量股东投资回报',
                    '毛利率：衡量产品盈利能力'
                  ]}
                  example="通过与行业基准对比，识别企业财务优势和改进空间。"
                />
              </div>
              <p className="text-xs text-slate-600">Key Ratios</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={financialRatiosData}>
              <PolarGrid stroke="#cbd5e1" />
              <PolarAngleAxis dataKey="ratio" tick={{ fill: '#64748b', fontSize: 10 }} />
              <PolarRadiusAxis angle={90} domain={[0, 'auto']} tick={{ fill: '#64748b', fontSize: 9 }} />
              <Radar name="实际" dataKey="actual" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.6} />
              <Radar name="基准" dataKey="benchmark" stroke={COLORS.success} fill={COLORS.success} fillOpacity={0.3} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-2 mt-3">
            {financialRatiosData.slice(0, 4).map((item) => (
              <div key={item.ratio} className="p-2 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600">{item.ratio}</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-sm font-semibold text-slate-900">
                    {item.ratio === '资产负债率' ? (item.actual * 100).toFixed(1) + '%' : item.actual.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-500">
                    vs {item.ratio === '资产负债率' ? (item.benchmark * 100).toFixed(0) + '%' : item.benchmark.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 🌍 区域表现 */}
      <Card className="p-4 border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-1">
              <h3 className="text-sm font-semibold text-slate-900">区域财务表现</h3>
              <ModuleHelpTooltip
                title="区域财务表现矩阵"
                definition="Regional Performance Matrix (区域表现矩阵) 通过对比不同区域/业务线的收入、利润、利润率、增长率、ROI等多维度指标，帮助CFO识别高价值市场和战略调整方向。"
                details={[
                  '营业收入：该区域的总收入规模',
                  '利润贡献：该区域的净利润',
                  '利润率：净利润÷营业收入×100%',
                  '增长率：同比增长百分比',
                  'ROI：投资回报率'
                ]}
                example="欧非市场利润率18.71%、ROI 25.6%，均为最高，应加大投资力度。"
              />
            </div>
            <p className="text-xs text-slate-600">Regional Performance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {regionalPerformanceData.map((region) => (
            <div key={region.region} className="p-3 border-2 border-slate-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-blue-600" />
                  <h4 className="text-sm font-semibold text-slate-900">{region.region}</h4>
                </div>
                <Badge className={`text-xs ${region.status === 'excellent' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {region.margin.toFixed(1)}%
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-blue-50 rounded">
                  <p className="text-xs text-slate-600">收入</p>
                  <p className="text-sm font-semibold text-blue-600">${(region.revenue / 1000).toFixed(0)}K</p>
                </div>
                <div className="p-2 bg-green-50 rounded">
                  <p className="text-xs text-slate-600">利润</p>
                  <p className="text-sm font-semibold text-green-600">${(region.profit / 1000).toFixed(0)}K</p>
                </div>
                <div className="p-2 bg-orange-50 rounded">
                  <p className="text-xs text-slate-600">增长</p>
                  <p className="text-sm font-semibold text-orange-600">+{region.growth.toFixed(1)}%</p>
                </div>
                <div className="p-2 bg-indigo-50 rounded">
                  <p className="text-xs text-slate-600">ROI</p>
                  <p className="text-sm font-semibold text-indigo-600">{region.roi.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 🚨 风险管理 + 战略审批 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 border-orange-200 bg-gradient-to-br from-orange-50 to-red-50">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="size-4 text-orange-600" />
            <div>
              <div className="flex items-center gap-1">
                <h3 className="text-sm font-semibold text-slate-900">财务风险管理</h3>
                <ModuleHelpTooltip
                  title="财务风险管理仪表板"
                  definition="Financial Risk Management Dashboard (财务风险管理仪表板) 实时监控信用风险、流动性风险、汇率风险等关键财务风险，提供预警和应对措施建议。"
                  details={[
                    '信用风险：客户无法按时偿还欠款的风险',
                    '流动性风险：无法及时筹集现金满足支付需求',
                    '汇率风险：外汇汇率波动导致的财务损失',
                    '利率风险：利率变动对融资成本的影响',
                    '市场风险：市场环境变化带来的不确定性'
                  ]}
                  example="当前有3家客户逾期超60天，金额$130K，需在3天内启动催收程序。"
                />
              </div>
              <p className="text-xs text-slate-600">Risk Management</p>
            </div>
          </div>

          <div className="space-y-2">
            {riskAlerts.map((risk) => (
              <div key={risk.id} className={`p-3 rounded-lg border-2 ${
                risk.level === 'high' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <Badge className={`text-xs ${risk.level === 'high' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'}`}>
                      {risk.category}
                    </Badge>
                    <p className="text-sm font-medium text-slate-900 mt-1">{risk.title}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      金额：<span className="font-semibold">${(risk.amount / 1000).toFixed(0)}K</span> · 
                      期限：{risk.deadline}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-slate-700">
                  <span className="font-medium">措施：</span>{risk.action}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-1">
                <h3 className="text-sm font-semibold text-slate-900">战略决策审批</h3>
                <ModuleHelpTooltip
                  title="战略决策审批"
                  definition="Strategic Approvals (战略决策审批) 为CFO提供投资项目的NPV（净现值）、IRR（内部收益率）、回收期等专业财务评估指标，支持科学决策。"
                  details={[
                    'NPV (净现值)：未来现金流折现到现在的净值，NPV>0说明项目可创造价值',
                    'IRR (内部收益率)：使NPV=0的折现率，代表项目实际回报率',
                    '回收期：收回初始投资所需的时间',
                    '决策标准：NPV>0 且 IRR>资本成本，建议批准'
                  ]}
                  formula="NPV = Σ(未来现金流 ÷ (1+折现率)^t) - 初始投资"
                  example="当前项目IRR为22.3%，远高于资本成本10%，NPV为$1.2M，建议批准投资。"
                />
              </div>
              <p className="text-xs text-slate-600">Strategic Approvals</p>
            </div>
            <Badge className="bg-blue-100 text-blue-700 text-xs">2个</Badge>
          </div>

          <div className="space-y-2">
            {pendingApprovals.map((item) => (
              <div key={item.id} className="p-3 border-2 border-slate-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    {item.priority === 'critical' && (
                      <Badge className="bg-red-500 text-white text-xs mb-1">紧急</Badge>
                    )}
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-600 mt-1">{item.requester}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
                  <div>
                    <p className="text-slate-600">金额</p>
                    <p className="font-semibold text-slate-900">${(item.amount / 1000000).toFixed(2)}M</p>
                  </div>
                  <div>
                    <p className="text-slate-600">NPV</p>
                    <p className="font-semibold text-green-600">${(item.npv / 1000000).toFixed(2)}M</p>
                  </div>
                  <div>
                    <p className="text-slate-600">IRR</p>
                    <p className="font-semibold text-blue-600">{item.irr}%</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 text-xs h-7 text-red-600">
                    <XCircle className="size-3 mr-1" />
                    拒绝
                  </Button>
                  <Button size="sm" className="flex-1 text-xs h-7 bg-green-600">
                    <CheckCircle className="size-3 mr-1" />
                    批准
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}