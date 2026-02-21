import React, { useState, useMemo } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, ComposedChart, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Wallet, CreditCard, Receipt, 
  Filter, Download, Calendar, RefreshCw, Target, AlertTriangle, CheckCircle,
  Clock, ArrowUpRight, ArrowDownRight, FileText, PieChart as PieIcon,
  TrendingUp as TrendUp, Percent, Activity, BarChart3, Building, Users
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface CFOAnalyticsProps {
  canViewSensitive: boolean;
}

// 📊 CFO核心财务KPI
interface FinanceKPI {
  label: string;
  value: number;
  unit: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  description: string;
  benchmark?: string;
  healthStatus?: 'excellent' | 'good' | 'warning' | 'critical';
}

export default function CFOAnalytics({ canViewSensitive }: CFOAnalyticsProps) {
  // 筛选器状态
  const [timeRange, setTimeRange] = useState('ytd');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('monthly');

  // 时间范围系数
  const timeMultiplier = useMemo(() => ({
    q3: 0.75, q4: 0.83, ytd: 0.917, year: 1.0
  })[timeRange] || 1.0, [timeRange]);

  // 🔥 区域财务对比（基础数据）
  const regionalFinance = [
    {
      region: '北美',
      code: 'NA',
      revenue: 5680000,
      cost: 3404000,
      grossProfit: 2276000,
      netProfit: 1625000,
      grossMargin: 40.1,
      netMargin: 28.6,
      receivables: 1248000,
      payables: 685000,
      cashFlow: 485000,
      dso: 42,
      dpo: 48,
      operatingExpense: 651000
    },
    {
      region: '欧非',
      code: 'EMEA',
      revenue: 4285000,
      cost: 2571000,
      grossProfit: 1714000,
      netProfit: 1226000,
      grossMargin: 40.0,
      netMargin: 28.6,
      receivables: 948000,
      payables: 515000,
      cashFlow: 368000,
      dso: 46,
      dpo: 51,
      operatingExpense: 488000
    },
    {
      region: '南美',
      code: 'SA',
      revenue: 2885000,
      cost: 1735000,
      grossProfit: 1150000,
      netProfit: 797000,
      grossMargin: 39.9,
      netMargin: 27.6,
      receivables: 649000,
      payables: 480000,
      cashFlow: 312000,
      dso: 48,
      dpo: 58,
      operatingExpense: 353000
    },
  ];

  // 🔥 月度财务趋势（12个月）
  const baseMonthlyFinanceTrend = [
    { month: '1月', revenue: 985000, cost: 591000, grossProfit: 394000, netProfit: 280000, cashFlow: 92000, receivable: 185000, payable: 105000, trading: 445000, inspection: 124000, agency: 280000, project: 136000, NA: 435000, EMEA: 330000, SA: 220000 },
    { month: '2月', revenue: 1048000, cost: 629000, grossProfit: 419000, netProfit: 298000, cashFlow: 98000, receivable: 195000, payable: 112000, trading: 475000, inspection: 132000, agency: 298000, project: 143000, NA: 463000, EMEA: 351000, SA: 234000 },
    { month: '3月', revenue: 1012000, cost: 607000, grossProfit: 405000, netProfit: 287000, cashFlow: 95000, receivable: 188000, payable: 108000, trading: 458000, inspection: 127000, agency: 288000, project: 139000, NA: 447000, EMEA: 339000, SA: 226000 },
    { month: '4月', revenue: 1125000, cost: 675000, grossProfit: 450000, netProfit: 320000, cashFlow: 105000, receivable: 208000, payable: 118000, trading: 510000, inspection: 141000, agency: 320000, project: 154000, NA: 497000, EMEA: 377000, SA: 251000 },
    { month: '5月', revenue: 1095000, cost: 657000, grossProfit: 438000, netProfit: 311000, cashFlow: 102000, receivable: 202000, payable: 115000, trading: 496000, inspection: 138000, agency: 311000, project: 150000, NA: 483000, EMEA: 367000, SA: 245000 },
    { month: '6月', revenue: 1248000, cost: 749000, grossProfit: 499000, netProfit: 355000, cashFlow: 118000, receivable: 230000, payable: 130000, trading: 565000, inspection: 157000, agency: 355000, project: 171000, NA: 551000, EMEA: 418000, SA: 279000 },
    { month: '7月', revenue: 1325000, cost: 795000, grossProfit: 530000, netProfit: 376000, cashFlow: 125000, receivable: 245000, payable: 138000, trading: 600000, inspection: 167000, agency: 377000, project: 181000, NA: 585000, EMEA: 444000, SA: 296000 },
    { month: '8月', revenue: 1285000, cost: 771000, grossProfit: 514000, netProfit: 365000, cashFlow: 121000, receivable: 238000, payable: 134000, trading: 582000, inspection: 162000, agency: 366000, project: 175000, NA: 567000, EMEA: 431000, SA: 287000 },
    { month: '9月', revenue: 1428000, cost: 857000, grossProfit: 571000, netProfit: 406000, cashFlow: 135000, receivable: 265000, payable: 149000, trading: 647000, inspection: 180000, agency: 407000, project: 194000, NA: 631000, EMEA: 479000, SA: 318000 },
    { month: '10月', revenue: 1545000, cost: 927000, grossProfit: 618000, netProfit: 439000, cashFlow: 146000, receivable: 285000, payable: 161000, trading: 700000, inspection: 195000, agency: 440000, project: 210000, NA: 682000, EMEA: 518000, SA: 345000 },
    { month: '11月', revenue: 1398000, cost: 839000, grossProfit: 559000, netProfit: 397000, cashFlow: 132000, receivable: 258000, payable: 146000, trading: 633000, inspection: 176000, agency: 398000, project: 191000, NA: 617000, EMEA: 469000, SA: 312000 },
    { month: '12月', revenue: 1356000, cost: 814000, grossProfit: 542000, netProfit: 385000, cashFlow: 128000, receivable: 250000, payable: 141000, trading: 614000, inspection: 171000, agency: 386000, project: 185000, NA: 599000, EMEA: 455000, SA: 302000 },
  ];

  // 🔥 筛选后的月度数据
  const filteredMonthlyFinanceTrend = useMemo(() => {
    let data = [...baseMonthlyFinanceTrend];
    
    // 根据时间范围截取数据
    if (timeRange === 'q3') data = data.slice(0, 9);
    else if (timeRange === 'q4') data = data.slice(0, 10);
    else if (timeRange === 'ytd') data = data.slice(0, 11);

    // 应用区域和业务线筛选
    return data.map(m => {
      let revenue = m.revenue;
      let cost = m.cost;
      
      // 业务线筛选
      if (selectedBusinessType !== 'all') {
        revenue = m[selectedBusinessType as keyof typeof m] as number || 0;
        cost = revenue * 0.6; // 成本率60%
      }
      
      // 区域筛选
      if (selectedRegion !== 'all') {
        revenue = m[selectedRegion as keyof typeof m] as number || 0;
        cost = revenue * 0.6;
      }
      
      const grossProfit = revenue - cost;
      const netProfit = grossProfit * 0.71; // 净利率约71%的毛利
      const cashFlow = netProfit * 0.33;
      
      return {
        ...m,
        revenue,
        cost,
        grossProfit,
        netProfit,
        cashFlow,
        receivable: revenue * 0.19,
        payable: cost * 0.18
      };
    });
  }, [timeRange, selectedRegion, selectedBusinessType]);

  // 🔥 筛选后的区域财务数据
  const filteredRegionalFinance = useMemo(() => {
    let data = [...regionalFinance];
    
    // 区域筛选
    if (selectedRegion !== 'all') {
      data = data.filter(r => r.code === selectedRegion);
    }
    
    // 应用时间范围系数
    return data.map(r => ({
      ...r,
      revenue: r.revenue * timeMultiplier,
      cost: r.cost * timeMultiplier,
      grossProfit: r.grossProfit * timeMultiplier,
      netProfit: r.netProfit * timeMultiplier,
      receivables: r.receivables * timeMultiplier,
      payables: r.payables * timeMultiplier,
      cashFlow: r.cashFlow * timeMultiplier,
      operatingExpense: r.operatingExpense * timeMultiplier
    }));
  }, [selectedRegion, timeMultiplier]);

  // 🔥 动态计算财务KPI
  const calculatedKPIs = useMemo(() => {
    const totalRevenue = filteredMonthlyFinanceTrend.reduce((sum, m) => sum + m.revenue, 0);
    const totalCost = filteredMonthlyFinanceTrend.reduce((sum, m) => sum + m.cost, 0);
    const totalGrossProfit = totalRevenue - totalCost;
    const totalNetProfit = filteredMonthlyFinanceTrend.reduce((sum, m) => sum + m.netProfit, 0);
    const totalCashFlow = filteredMonthlyFinanceTrend.reduce((sum, m) => sum + m.cashFlow, 0);
    const totalReceivables = filteredMonthlyFinanceTrend.reduce((sum, m) => sum + m.receivable, 0);
    const totalPayables = filteredMonthlyFinanceTrend.reduce((sum, m) => sum + m.payable, 0);
    
    const grossMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 40.0;
    const netMargin = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 28.4;
    const operatingCost = totalCost * 0.193; // 运营成本约占成本的19.3%
    
    return {
      revenue: totalRevenue,
      netProfit: totalNetProfit,
      grossProfit: totalGrossProfit,
      grossMargin: grossMargin,
      netMargin: netMargin,
      operatingCost: operatingCost,
      receivables: totalReceivables,
      payables: totalPayables,
      cashFlow: totalCashFlow,
      cashBalance: totalCashFlow * 3.68, // 现金余额约为现金流的3.68倍
    };
  }, [filteredMonthlyFinanceTrend]);

  // 🔥 更新后的财务KPI（使用动态计算值）
  const updatedFinanceKPIs: FinanceKPI[] = useMemo(() => [
    {
      label: '年度总营收',
      value: calculatedKPIs.revenue,
      unit: 'USD',
      change: '+24.8%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-red-600',
      bgColor: 'bg-red-600',
      description: '全球总营业收入',
      benchmark: `目标: $${(15000000 * timeMultiplier / 1000000).toFixed(1)}M`,
      healthStatus: 'good'
    },
    {
      label: '净利润',
      value: calculatedKPIs.netProfit,
      unit: 'USD',
      change: '+28.4%',
      trend: 'up',
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-600',
      description: '税后净利润',
      benchmark: `目标: $${(4200000 * timeMultiplier / 1000000).toFixed(1)}M`,
      healthStatus: 'good'
    },
    {
      label: '毛利润',
      value: calculatedKPIs.grossProfit,
      unit: 'USD',
      change: '+26.2%',
      trend: 'up',
      icon: TrendUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-600',
      description: '销售收入减去成本',
      benchmark: '健康区间',
      healthStatus: 'excellent'
    },
    {
      label: '毛利率',
      value: calculatedKPIs.grossMargin,
      unit: '%',
      change: '+1.2%',
      trend: 'up',
      icon: Percent,
      color: 'text-purple-600',
      bgColor: 'bg-purple-600',
      description: '毛利润/营收',
      benchmark: '行业平均35%',
      healthStatus: 'excellent'
    },
    {
      label: '净利率',
      value: calculatedKPIs.netMargin,
      unit: '%',
      change: '+2.8%',
      trend: 'up',
      icon: PieIcon,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-600',
      description: '净利润/营收',
      benchmark: '行业平均22%',
      healthStatus: 'excellent'
    },
    {
      label: '运营成本',
      value: calculatedKPIs.operatingCost,
      unit: 'USD',
      change: '-5.2%',
      trend: 'down',
      icon: Wallet,
      color: 'text-orange-600',
      bgColor: 'bg-orange-600',
      description: '总运营费用',
      benchmark: '控制良好',
      healthStatus: 'excellent'
    },
    {
      label: '应收账款',
      value: calculatedKPIs.receivables,
      unit: 'USD',
      change: '+12.5%',
      trend: 'up',
      icon: Receipt,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-600',
      description: '待收款项总额',
      benchmark: 'DSO: 45天',
      healthStatus: 'good'
    },
    {
      label: '应付账款',
      value: calculatedKPIs.payables,
      unit: 'USD',
      change: '+8.4%',
      trend: 'up',
      icon: CreditCard,
      color: 'text-pink-600',
      bgColor: 'bg-pink-600',
      description: '待付款项总额',
      benchmark: 'DPO: 52天',
      healthStatus: 'good'
    },
    {
      label: '现金流量',
      value: calculatedKPIs.cashFlow,
      unit: 'USD',
      change: '+32.8%',
      trend: 'up',
      icon: Activity,
      color: 'text-teal-600',
      bgColor: 'bg-teal-600',
      description: '经营现金流净额',
      benchmark: '现金充裕',
      healthStatus: 'excellent'
    },
    {
      label: '现金余额',
      value: calculatedKPIs.cashBalance,
      unit: 'USD',
      change: '+18.5%',
      trend: 'up',
      icon: Building,
      color: 'text-lime-600',
      bgColor: 'bg-lime-600',
      description: '银行存款余额',
      benchmark: '流动比率2.8',
      healthStatus: 'excellent'
    },
    {
      label: '资产回报率',
      value: 32.5,
      unit: '%',
      change: '+4.2%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-amber-600',
      bgColor: 'bg-amber-600',
      description: 'ROA',
      benchmark: '行业平均28%',
      healthStatus: 'excellent'
    },
    {
      label: '资产负债率',
      value: 35.2,
      unit: '%',
      change: '-2.1%',
      trend: 'down',
      icon: BarChart3,
      color: 'text-rose-600',
      bgColor: 'bg-rose-600',
      description: '负债/资产',
      benchmark: '健康区间',
      healthStatus: 'excellent'
    },
    {
      label: '收账周期',
      value: 45,
      unit: '天',
      change: '-3天',
      trend: 'down',
      icon: Clock,
      color: 'text-violet-600',
      bgColor: 'bg-violet-600',
      description: '平均收款天数',
      benchmark: '行业平均50天',
      healthStatus: 'good'
    },
    {
      label: '付款周期',
      value: 52,
      unit: '天',
      change: '+2天',
      trend: 'up',
      icon: Calendar,
      color: 'text-fuchsia-600',
      bgColor: 'bg-fuchsia-600',
      description: '平均付款天数',
      benchmark: '合理区间',
      healthStatus: 'good'
    },
  ], [calculatedKPIs, timeMultiplier]);

  // 🔥 应收账款账龄分析（动态计算）
  const calculatedReceivableAging = useMemo(() => {
    const total = calculatedKPIs.receivables;
    return [
      { category: '未逾期', amount: total * 0.551, percentage: 55.1, count: 185, avgDays: 15, risk: 'low' },
      { category: '逾期1-30天', amount: total * 0.240, percentage: 24.0, count: 78, avgDays: 22, risk: 'low' },
      { category: '逾期31-60天', amount: total * 0.140, percentage: 14.0, count: 42, avgDays: 45, risk: 'medium' },
      { category: '逾期61-90天', amount: total * 0.050, percentage: 5.0, count: 15, avgDays: 75, risk: 'high' },
      { category: '逾期90天以上', amount: total * 0.019, percentage: 1.9, count: 6, avgDays: 125, risk: 'critical' },
    ];
  }, [calculatedKPIs.receivables]);

  // 🔥 应付账款账龄分析（动态计算）
  const calculatedPayableAging = useMemo(() => {
    const total = calculatedKPIs.payables;
    return [
      { category: '未到期', amount: total * 0.55, percentage: 55.0, count: 125, avgDays: 20, priority: 'normal' },
      { category: '到期7天内', amount: total * 0.25, percentage: 25.0, count: 58, avgDays: 5, priority: 'medium' },
      { category: '到期即付', amount: total * 0.15, percentage: 15.0, count: 35, avgDays: 0, priority: 'high' },
      { category: '已逾期', amount: total * 0.05, percentage: 5.0, count: 12, avgDays: -8, priority: 'urgent' },
    ];
  }, [calculatedKPIs.payables]);

  // 🔥 成本结构分析（动态计算）
  const calculatedCostStructure = useMemo(() => {
    const totalCost = filteredMonthlyFinanceTrend.reduce((sum, m) => sum + m.cost, 0);
    const operatingCost = totalCost * 0.193;
    
    return [
      { category: '采购成本', amount: totalCost, percentage: 60.0, change: '+23.5%', benchmark: '行业平均58%' },
      { category: '运营费用', amount: operatingCost, percentage: 11.6, change: '-5.2%', benchmark: '行业平均12%' },
      { category: '人力成本', amount: totalCost * 0.233, percentage: 14.0, change: '+8.4%', benchmark: '行业平均15%' },
      { category: '物流费用', amount: totalCost * 0.117, percentage: 7.0, change: '+12.5%', benchmark: '行业平均8%' },
      { category: '营销费用', amount: totalCost * 0.067, percentage: 4.0, change: '+18.2%', benchmark: '行业平均5%' },
      { category: '管理费用', amount: totalCost * 0.057, percentage: 3.4, change: '+6.8%', benchmark: '行业平均4%' },
    ];
  }, [filteredMonthlyFinanceTrend]);

  // 🔥 应收账款账龄分析
  const receivableAging = [
    { category: '未逾期', amount: 1568000, percentage: 55.1, count: 185, avgDays: 15, risk: 'low' },
    { category: '逾期1-30天', amount: 682000, percentage: 24.0, count: 78, avgDays: 22, risk: 'low' },
    { category: '逾期31-60天', amount: 398000, percentage: 14.0, count: 42, avgDays: 45, risk: 'medium' },
    { category: '逾期61-90天', amount: 142000, percentage: 5.0, count: 15, avgDays: 75, risk: 'high' },
    { category: '逾期90天以上', amount: 55000, percentage: 1.9, count: 6, avgDays: 125, risk: 'critical' },
  ];

  // 🔥 应付账款账龄分析
  const payableAging = [
    { category: '未到期', amount: 924000, percentage: 55.0, count: 125, avgDays: 20, priority: 'normal' },
    { category: '到期7天内', amount: 420000, percentage: 25.0, count: 58, avgDays: 5, priority: 'medium' },
    { category: '到期即付', amount: 252000, percentage: 15.0, count: 35, avgDays: 0, priority: 'high' },
    { category: '已逾期', amount: 84000, percentage: 5.0, count: 12, avgDays: -8, priority: 'urgent' },
  ];

  // 🔥 成本结构分析
  const costStructure = [
    { category: '采购成本', amount: 7710000, percentage: 60.0, change: '+23.5%', benchmark: '行业平均58%' },
    { category: '运营费用', amount: 1492000, percentage: 11.6, change: '-5.2%', benchmark: '行业平均12%' },
    { category: '人力成本', amount: 1798000, percentage: 14.0, change: '+8.4%', benchmark: '行业平均15%' },
    { category: '物流费用', amount: 900000, percentage: 7.0, change: '+12.5%', benchmark: '行业平均8%' },
    { category: '营销费用', amount: 514000, percentage: 4.0, change: '+18.2%', benchmark: '行业平均5%' },
    { category: '管理费用', amount: 436000, percentage: 3.4, change: '+6.8%', benchmark: '行业平均4%' },
  ];

  // 🔥 现金流分析
  const cashFlowAnalysis = [
    { category: '经营活动现金流', inflow: 13250000, outflow: -12085000, net: 1165000, percentage: 8.8 },
    { category: '投资活动现金流', inflow: 125000, outflow: -485000, net: -360000, percentage: -2.7 },
    { category: '筹资活动现金流', inflow: 0, outflow: -145000, net: -145000, percentage: -1.1 },
  ];

  // 🔥 利润质量分析
  const profitQuality = [
    { indicator: '经营利润率', value: 32.8, benchmark: 30.0, status: 'excellent', description: '核心业务盈利能力强' },
    { indicator: '现金收入比', value: 95.2, benchmark: 90.0, status: 'excellent', description: '收入转化为现金比率高' },
    { indicator: '应收账款周转率', value: 8.1, benchmark: 7.5, status: 'good', description: '收款效率良好' },
    { indicator: '存货周转率', value: 12.5, benchmark: 10.0, status: 'excellent', description: '存货管理高效' },
    { indicator: '总资产周转率', value: 2.8, benchmark: 2.5, status: 'good', description: '资产使用效率良好' },
  ];

  // 🔥 财务风险预警
  const financialRisks = [
    {
      category: '流动性风险',
      score: 2.8,
      level: 'low',
      indicators: ['流动比率: 2.8', '速动比率: 2.3', '现金比率: 1.5'],
      recommendation: '流动性充足，建议优化闲置资金收益'
    },
    {
      category: '偿债风险',
      score: 3.2,
      level: 'low',
      indicators: ['资产负债率: 35.2%', '利息保障倍数: 28.5', '债务股本比: 0.54'],
      recommendation: '偿债能力强，可适当提高财务杠杆'
    },
    {
      category: '收款风险',
      score: 4.5,
      level: 'medium',
      indicators: ['逾期90天: $55K', '坏账率: 0.5%', 'DSO: 45天'],
      recommendation: '关注长期逾期账款，加强催收管理'
    },
    {
      category: '成本控制风险',
      score: 3.8,
      level: 'low',
      indicators: ['成本增长: 23.5%', '毛利率: 40%', '费用率: 11.6%'],
      recommendation: '成本增长可控，继续优化采购效率'
    },
    {
      category: '汇率风险',
      score: 5.2,
      level: 'medium',
      indicators: ['外币资产: $2.8M', '汇率波动: ±3.5%', '对冲比例: 45%'],
      recommendation: '建议提高外汇对冲比例至60%'
    },
  ];

  // 图表颜色
  const COLORS = ['#DC2626', '#EA580C', '#D97706', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
  const AGING_COLORS = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444',
    critical: '#DC2626'
  };

  return (
    <div className="space-y-4">
      {/* 标题栏 - 固定在顶部 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 -mt-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">CFO财务管控中心</h2>
            <p className="text-sm text-gray-600 mt-1">全面财务分析与风险管理</p>
          </div>
          <div className="flex items-center gap-2">
            {/* 🔥 时间范围筛选器 */}
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="h-8 w-[100px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="q3" className="text-xs">Q3累计</SelectItem>
                <SelectItem value="q4" className="text-xs">Q4累计</SelectItem>
                <SelectItem value="ytd" className="text-xs">本年至今</SelectItem>
                <SelectItem value="year" className="text-xs">全年</SelectItem>
              </SelectContent>
            </Select>

            {/* 🔥 区域筛选器 */}
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="h-8 w-[100px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">全球</SelectItem>
                <SelectItem value="NA" className="text-xs">北美</SelectItem>
                <SelectItem value="EMEA" className="text-xs">欧非</SelectItem>
                <SelectItem value="SA" className="text-xs">南美</SelectItem>
              </SelectContent>
            </Select>

            {/* 🔥 业务线筛选器 */}
            <Select value={selectedBusinessType} onValueChange={setSelectedBusinessType}>
              <SelectTrigger className="h-8 w-[120px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">全部业务</SelectItem>
                <SelectItem value="trading" className="text-xs">直接采购</SelectItem>
                <SelectItem value="inspection" className="text-xs">验货服务</SelectItem>
                <SelectItem value="agency" className="text-xs">代理服务</SelectItem>
                <SelectItem value="project" className="text-xs">一站式项目</SelectItem>
              </SelectContent>
            </Select>

            <div className="h-5 w-px bg-gray-300" />

            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="h-8 w-[100px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily" className="text-xs">日报</SelectItem>
                <SelectItem value="weekly" className="text-xs">周报</SelectItem>
                <SelectItem value="monthly" className="text-xs">月报</SelectItem>
                <SelectItem value="quarterly" className="text-xs">季报</SelectItem>
                <SelectItem value="yearly" className="text-xs">年报</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              导出财务报表
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              刷新数据
            </Button>
          </div>
        </div>
      </div>

      {/* 🔥 财务KPI卡片（14个核心指标） */}
      <div className="grid grid-cols-7 gap-3">
        {updatedFinanceKPIs.map((kpi) => {
          const IconComponent = kpi.icon;
          const TrendIcon = kpi.trend === 'up' ? TrendingUp : TrendingDown;
          
          return (
            <div key={kpi.label} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-2">
                <div className={`${kpi.bgColor} w-8 h-8 rounded flex items-center justify-center`}>
                  <IconComponent className="w-4 h-4 text-white" />
                </div>
                <div className={`flex items-center gap-0.5 text-xs ${kpi.trend === 'up' && !kpi.label.includes('成本') && !kpi.label.includes('负债') ? 'text-green-600' : kpi.trend === 'down' && (kpi.label.includes('成本') || kpi.label.includes('周期') || kpi.label.includes('负债')) ? 'text-green-600' : kpi.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                  <TrendIcon className="w-3 h-3" />
                  <span className="font-semibold">{kpi.change}</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-1" title={kpi.description}>{kpi.label}</p>
              <p className="text-base font-bold text-gray-900">
                {kpi.unit === 'USD' ? `$${(kpi.value / 1000000).toFixed(2)}M` : 
                 kpi.unit === '%' ? `${kpi.value.toFixed(1)}%` :
                 kpi.unit === '天' ? `${kpi.value}天` :
                 kpi.value.toLocaleString()}
              </p>
              {kpi.benchmark && (
                <p className="text-xs text-gray-500 mt-1">{kpi.benchmark}</p>
              )}
              {kpi.healthStatus && (
                <Badge className={`h-4 px-1.5 text-xs mt-1 ${
                  kpi.healthStatus === 'excellent' ? 'bg-green-100 text-green-700' :
                  kpi.healthStatus === 'good' ? 'bg-blue-100 text-blue-700' :
                  kpi.healthStatus === 'warning' ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {kpi.healthStatus === 'excellent' ? '优秀' : kpi.healthStatus === 'good' ? '良好' : kpi.healthStatus === 'warning' ? '警告' : '危急'}
                </Badge>
              )}
            </div>
          );
        })}
      </div>

      {/* 🔥 区域财务对比 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              区域财务对比分析
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">三大市场财务指标对比</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold text-gray-700">区域</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 text-right">营收</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 text-right">成本</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 text-right">毛利润</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 text-center">毛利率</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 text-right">净利润</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 text-center">净利率</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 text-right">应收账款</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 text-right">应付账款</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 text-right">现金流</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 text-center">收账周期</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 text-center">付款周期</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 text-right">运营费用</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegionalFinance.map((region) => (
                <TableRow key={region.code} className="hover:bg-gray-50">
                  <TableCell className="font-semibold text-gray-900">{region.region}</TableCell>
                  <TableCell className="text-xs text-right font-bold text-gray-900">${(region.revenue / 1000000).toFixed(2)}M</TableCell>
                  <TableCell className="text-xs text-right text-red-600">${(region.cost / 1000000).toFixed(2)}M</TableCell>
                  <TableCell className="text-xs text-right font-semibold text-green-600">${(region.grossProfit / 1000000).toFixed(2)}M</TableCell>
                  <TableCell className="text-xs text-center">
                    <Badge className="bg-green-100 text-green-700 h-5 px-2">{region.grossMargin.toFixed(1)}%</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-right font-bold text-green-600">${(region.netProfit / 1000000).toFixed(2)}M</TableCell>
                  <TableCell className="text-xs text-center">
                    <Badge className="bg-blue-100 text-blue-700 h-5 px-2">{region.netMargin.toFixed(1)}%</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-right text-indigo-600">${(region.receivables / 1000).toFixed(0)}K</TableCell>
                  <TableCell className="text-xs text-right text-pink-600">${(region.payables / 1000).toFixed(0)}K</TableCell>
                  <TableCell className="text-xs text-right text-teal-600">${(region.cashFlow / 1000).toFixed(0)}K</TableCell>
                  <TableCell className="text-xs text-center text-gray-700">{region.dso}天</TableCell>
                  <TableCell className="text-xs text-center text-gray-700">{region.dpo}天</TableCell>
                  <TableCell className="text-xs text-right text-orange-600">${(region.operatingExpense / 1000).toFixed(0)}K</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 🔥 月度财务趋势 + 应收应付账款账龄 */}
      <div className="grid grid-cols-3 gap-3">
        {/* 月度财务趋势 */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">月度财务趋势</h3>
              <p className="text-xs text-gray-500 mt-0.5">营、成本、利润、现金流</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={filteredMonthlyFinanceTrend}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#DC2626" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" dataKey="revenue" fill="url(#colorRevenue)" stroke="#DC2626" name="营收" />
              <Bar dataKey="cost" fill="#EF4444" name="成本" />
              <Line type="monotone" dataKey="netProfit" stroke="#10B981" strokeWidth={2} name="净利润" />
              <Line type="monotone" dataKey="cashFlow" stroke="#3B82F6" strokeWidth={2} name="现金流" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 应收账款账龄 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-600" />
                应收账款账龄
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">总计: $2.85M</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={calculatedReceivableAging}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                fill="#8884d8"
                dataKey="amount"
                paddingAngle={2}
              >
                {calculatedReceivableAging.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={AGING_COLORS[entry.risk as keyof typeof AGING_COLORS]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ fontSize: '11px', borderRadius: '6px' }}
                formatter={(value: any) => `$${(value / 1000).toFixed(0)}K`}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1 max-h-[100px] overflow-y-auto">
            {calculatedReceivableAging.map((item) => (
              <div key={item.category} className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded text-xs">
                <div className="flex items-center gap-1.5 flex-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: AGING_COLORS[item.risk as keyof typeof AGING_COLORS] }} />
                  <span className="text-gray-700">{item.category}</span>
                </div>
                <span className="font-semibold text-gray-900">${(item.amount / 1000).toFixed(0)}K</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🔥 成本结构 + 应付账款账龄 + 利润质量 */}
      <div className="grid grid-cols-3 gap-3">
        {/* 成本结构分析 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-orange-600" />
                成本结构
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">总成本: $12.85M</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={calculatedCostStructure}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                fill="#8884d8"
                dataKey="amount"
                paddingAngle={2}
              >
                {calculatedCostStructure.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ fontSize: '11px', borderRadius: '6px' }}
                formatter={(value: any) => `$${(value / 1000000).toFixed(2)}M`}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1 max-h-[120px] overflow-y-auto">
            {calculatedCostStructure.map((item, index) => (
              <div key={item.category} className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded text-xs">
                <div className="flex items-center gap-1.5 flex-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-gray-700">{item.category}</span>
                </div>
                <span className="font-semibold text-gray-900">{item.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* 应付账款账龄 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-pink-600" />
                应付账款账龄
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">总计: $1.68M</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={calculatedPayableAging}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="category" tick={{ fontSize: 10 }} stroke="#9CA3AF" angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10 }} stroke="#9CA3AF" />
              <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
              <Bar dataKey="amount" fill="#EC4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1">
            {calculatedPayableAging.map((item) => (
              <div key={item.category} className={`flex items-center justify-between py-1 px-2 rounded text-xs ${item.priority === 'urgent' ? 'bg-red-50' : item.priority === 'high' ? 'bg-orange-50' : 'bg-gray-50'}`}>
                <span className="text-gray-700">{item.category}</span>
                <Badge className={`h-4 px-1.5 text-xs ${item.priority === 'urgent' ? 'bg-red-100 text-red-700' : item.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                  ${(item.amount / 1000).toFixed(0)}K
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* 利润质量分析 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                利润质量
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">5项核心指标</p>
            </div>
          </div>
          <div className="space-y-2">
            {profitQuality.map((item) => (
              <div key={item.indicator} className="p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-700">{item.indicator}</span>
                  <Badge className={`h-4 px-1.5 text-xs ${item.status === 'excellent' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {item.value >= 1 ? item.value.toFixed(1) : `${item.value.toFixed(1)}%`}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">基准: {item.benchmark >= 1 ? item.benchmark.toFixed(1) : `${item.benchmark.toFixed(1)}%`}</span>
                  <span className={`text-xs ${item.value >= item.benchmark ? 'text-green-600' : 'text-orange-600'}`}>
                    {item.value >= item.benchmark ? '✓ 超标准' : '↓ 低于基准'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🔥 财务风险预警 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              财务风险预警系统
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">五大风险类别实时监控</p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {financialRisks.map((risk) => (
            <div key={risk.category} className={`border-2 rounded-lg p-3 ${risk.level === 'high' ? 'border-red-300 bg-red-50' : risk.level === 'medium' ? 'border-orange-300 bg-orange-50' : 'border-green-300 bg-green-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-900">{risk.category}</span>
                <Badge className={`h-5 px-2 text-xs ${risk.level === 'high' ? 'bg-red-100 text-red-700' : risk.level === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                  {risk.level === 'high' ? '高风险' : risk.level === 'medium' ? '中风险' : '低风险'}
                </Badge>
              </div>
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">风险评分</span>
                  <span className="font-bold text-gray-900">{risk.score.toFixed(1)}/10</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${risk.level === 'high' ? 'bg-red-600' : risk.level === 'medium' ? 'bg-orange-600' : 'bg-green-600'}`}
                    style={{ width: `${(risk.score / 10) * 100}%` }}
                  />
                </div>
              </div>
              <div className="space-y-1 mb-2">
                {risk.indicators.map((indicator, idx) => (
                  <p key={idx} className="text-xs text-gray-700">• {indicator}</p>
                ))}
              </div>
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-600"><strong>建议：</strong>{risk.recommendation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}