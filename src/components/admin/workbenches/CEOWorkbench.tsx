import React, { useMemo } from 'react';
import { User } from '../../../lib/rbac-config';
import { useOrders } from '../../../contexts/OrderContext';
import { useFinance } from '../../../contexts/FinanceContext';
import { useQuotations } from '../../../contexts/QuotationContext';
import { useInquiry } from '../../../contexts/InquiryContext';
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  Clock,
  FileText,
  ShoppingCart,
  Users,
  Package,
  Target,
  Award,
  Activity,
  Zap,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingDown,
  Calendar,
  Briefcase,
  PieChart as PieChartIcon,
  BarChart3,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';

interface CEOWorkbenchProps {
  user: User;
  onNavigate: (tab: string) => void;
}

export function CEOWorkbench({ user, onNavigate }: CEOWorkbenchProps) {
  const { orders } = useOrders();
  const { accountsReceivable } = useFinance();
  const { quotations } = useQuotations();
  const { inquiries } = useInquiry();
  
  const canAccessBusinessModules = user.role !== 'Admin';

  // 🎯 核心KPI计算
  const coreMetrics = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // 本月数据
    const thisMonthOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate.getMonth() === currentMonth && 
             orderDate.getFullYear() === currentYear &&
             o.status !== 'draft' && 
             o.status !== 'cancelled';
    });
    
    const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const thisMonthProfit = thisMonthOrders.reduce((sum, o) => {
      const cost = o.totalCost || 0;
      const revenue = o.totalAmount || 0;
      return sum + (revenue - cost);
    }, 0);
    
    // 上月数据
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonthOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate.getMonth() === lastMonth && 
             orderDate.getFullYear() === lastMonthYear &&
             o.status !== 'draft' && 
             o.status !== 'cancelled';
    });
    
    const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    
    // 全年累计
    const yearToDateOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate.getFullYear() === currentYear &&
             o.status !== 'draft' && 
             o.status !== 'cancelled';
    });
    
    const yearToDateRevenue = yearToDateOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const yearToDateProfit = yearToDateOrders.reduce((sum, o) => {
      const cost = o.totalCost || 0;
      const revenue = o.totalAmount || 0;
      return sum + (revenue - cost);
    }, 0);
    
    // 计算增长率
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;
    
    // 利润率
    const profitMargin = thisMonthRevenue > 0 ? (thisMonthProfit / thisMonthRevenue) * 100 : 0;
    const ytdProfitMargin = yearToDateRevenue > 0 ? (yearToDateProfit / yearToDateRevenue) * 100 : 0;
    
    // 客户数据
    const activeCustomers = new Set(orders.filter(o => o.status !== 'cancelled').map(o => o.customerId)).size;
    
    // 订单转化率
    const totalInquiries = inquiries.filter(i => i.isSubmitted).length;
    const conversionRate = totalInquiries > 0 ? (orders.length / totalInquiries) * 100 : 0;
    
    return {
      thisMonthRevenue,
      revenueGrowth,
      profitMargin,
      yearToDateRevenue,
      ytdProfitMargin,
      activeCustomers,
      totalOrders: yearToDateOrders.length,
      conversionRate,
      thisMonthProfit,
      yearToDateProfit
    };
  }, [orders, inquiries]);

  // 🌍 区域表现
  const regionalPerformance = useMemo(() => {
    const regions = [
      { code: 'NA', name: '北美市场', color: '#3B82F6' },
      { code: 'SA', name: '南美市场', color: '#10B981' },
      { code: 'EA', name: '欧非市场', color: '#F59E0B' }
    ];
    
    return regions.map(region => {
      const regionOrders = orders.filter(o => 
        o.region === region.code && 
        o.status !== 'draft' && 
        o.status !== 'cancelled'
      );
      
      const revenue = regionOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const profit = regionOrders.reduce((sum, o) => {
        const cost = o.totalCost || 0;
        const amount = o.totalAmount || 0;
        return sum + (amount - cost);
      }, 0);
      
      const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
      
      return {
        ...region,
        revenue,
        orders: regionOrders.length,
        profit,
        profitMargin
      };
    });
  }, [orders]);

  // 📊 月度趋势（最近6个月）
  const monthlyTrend = useMemo(() => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const month = targetDate.getMonth();
      const year = targetDate.getFullYear();
      
      const monthOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate.getMonth() === month && 
               orderDate.getFullYear() === year &&
               o.status !== 'draft' && 
               o.status !== 'cancelled';
      });
      
      const revenue = monthOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const profit = monthOrders.reduce((sum, o) => {
        const cost = o.totalCost || 0;
        const amount = o.totalAmount || 0;
        return sum + (amount - cost);
      }, 0);
      
      months.push({
        month: targetDate.toLocaleDateString('zh-CN', { month: 'short' }),
        revenue: Math.round(revenue / 1000),
        profit: Math.round(profit / 1000),
        orders: monthOrders.length
      });
    }
    
    return months;
  }, [orders]);

  // ⚠️ 关键预警
  const criticalAlerts = useMemo(() => {
    const alerts = [];
    
    // 逾期应收
    const overdueAR = accountsReceivable.filter(ar => ar.status === 'overdue');
    if (overdueAR.length > 0) {
      const totalOverdue = overdueAR.reduce((sum, ar) => sum + ar.amount, 0);
      alerts.push({
        level: 'high',
        title: '逾期应收账款',
        count: overdueAR.length,
        amount: totalOverdue,
        action: () => onNavigate('finance-management')
      });
    }
    
    // 待审批报价
    const pendingQuotes = quotations.filter(q => 
      q.status === 'pending_approval' || q.status === 'regional_approved'
    );
    if (pendingQuotes.length > 0) {
      alerts.push({
        level: 'medium',
        title: '待审批报价单',
        count: pendingQuotes.length,
        action: () => onNavigate('order-management-center') // 🔥 改为订单管理中心
      });
    }
    
    // 待处理询价
    const pendingInquiries = inquiries.filter(i => i.isSubmitted && i.status === 'pending');
    if (pendingInquiries.length > 5) {
      alerts.push({
        level: 'medium',
        title: '待处理询价',
        count: pendingInquiries.length,
        action: () => onNavigate('crm') // 🔥 改为CRM（客户关系管理）
      });
    }
    
    // 低利润率订单
    const lowMarginOrders = orders.filter(o => {
      if (o.status === 'draft' || o.status === 'cancelled') return false;
      const margin = o.totalAmount > 0 ? ((o.totalAmount - (o.totalCost || 0)) / o.totalAmount) * 100 : 0;
      return margin < 10 && margin > 0;
    });
    if (lowMarginOrders.length > 0) {
      alerts.push({
        level: 'low',
        title: '低利润率订单',
        count: lowMarginOrders.length,
        action: () => onNavigate('analytics')
      });
    }
    
    return alerts;
  }, [accountsReceivable, quotations, inquiries, orders, onNavigate]);

  // 🎯 业务健康度评分
  const healthScore = useMemo(() => {
    let score = 0;
    const factors = [];
    
    // 利润率健康度 (30分)
    if (coreMetrics.profitMargin > 25) {
      score += 30;
      factors.push({ name: '利润率', score: 30, status: 'excellent' });
    } else if (coreMetrics.profitMargin > 15) {
      score += 20;
      factors.push({ name: '利润率', score: 20, status: 'good' });
    } else if (coreMetrics.profitMargin > 10) {
      score += 10;
      factors.push({ name: '利润率', score: 10, status: 'warning' });
    } else {
      factors.push({ name: '利润率', score: 0, status: 'critical' });
    }
    
    // 营收增长 (25分)
    if (coreMetrics.revenueGrowth > 20) {
      score += 25;
      factors.push({ name: '营收增长', score: 25, status: 'excellent' });
    } else if (coreMetrics.revenueGrowth > 10) {
      score += 20;
      factors.push({ name: '营收增长', score: 20, status: 'good' });
    } else if (coreMetrics.revenueGrowth > 0) {
      score += 15;
      factors.push({ name: '营收增长', score: 15, status: 'good' });
    } else {
      score += 5;
      factors.push({ name: '营收增长', score: 5, status: 'warning' });
    }
    
    // 应收账款健康度 (20分)
    const overdueCount = accountsReceivable.filter(ar => ar.status === 'overdue').length;
    const totalAR = accountsReceivable.length;
    const overdueRate = totalAR > 0 ? overdueCount / totalAR : 0;
    if (overdueRate < 0.05) {
      score += 20;
      factors.push({ name: '应收健康', score: 20, status: 'excellent' });
    } else if (overdueRate < 0.1) {
      score += 15;
      factors.push({ name: '应收健康', score: 15, status: 'good' });
    } else if (overdueRate < 0.2) {
      score += 10;
      factors.push({ name: '应收健康', score: 10, status: 'warning' });
    } else {
      factors.push({ name: '应收健康', score: 0, status: 'critical' });
    }
    
    // 客户转化率 (15分)
    if (coreMetrics.conversionRate > 50) {
      score += 15;
      factors.push({ name: '转化率', score: 15, status: 'excellent' });
    } else if (coreMetrics.conversionRate > 30) {
      score += 10;
      factors.push({ name: '转化率', score: 10, status: 'good' });
    } else if (coreMetrics.conversionRate > 20) {
      score += 5;
      factors.push({ name: '转化率', score: 5, status: 'warning' });
    } else {
      factors.push({ name: '转化率', score: 0, status: 'warning' });
    }
    
    // 订单执行效率 (10分)
    const activeOrders = orders.filter(o => o.status === 'confirmed' || o.status === 'in_production');
    if (activeOrders.length < 10) {
      score += 10;
      factors.push({ name: '执行效率', score: 10, status: 'excellent' });
    } else if (activeOrders.length < 20) {
      score += 7;
      factors.push({ name: '执行效率', score: 7, status: 'good' });
    } else {
      score += 3;
      factors.push({ name: '执行效率', score: 3, status: 'warning' });
    }
    
    return { score, factors };
  }, [coreMetrics, accountsReceivable, orders]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B'];

  return (
    <div className="space-y-4 pb-4">
      {/* 🎯 战略标题 - 紧凑版 */}
      <div className="bg-gradient-to-r from-orange-50 via-red-50 to-orange-50 border-2 border-[#F96302] rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F96302] to-red-500 flex items-center justify-center shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-gray-900 mb-0.5">
                CEO 战略驾驶舱
              </h1>
              <p className="text-gray-600" style={{ fontSize: '13px' }}>
                欢迎，{user.name || 'CEO'} · THE COSUN BM 全球业务实时监控中心
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-500">业务健康度</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className={`text-2xl font-bold ${
                  healthScore.score >= 80 ? 'text-green-600' :
                  healthScore.score >= 60 ? 'text-blue-600' :
                  healthScore.score >= 40 ? 'text-orange-600' :
                  'text-red-600'
                }`}>
                  {healthScore.score}
                </div>
                <div className="text-xs text-gray-500">/ 100分</div>
              </div>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                healthScore.score >= 80 ? 'bg-green-100' :
                healthScore.score >= 60 ? 'bg-blue-100' :
                healthScore.score >= 40 ? 'bg-orange-100' :
                'bg-red-100'
              }`}>
                {healthScore.score >= 80 ? (
                  <Award className="w-7 h-7 text-green-600" />
                ) : healthScore.score >= 60 ? (
                  <CheckCircle2 className="w-7 h-7 text-blue-600" />
                ) : healthScore.score >= 40 ? (
                  <AlertTriangle className="w-7 h-7 text-orange-600" />
                ) : (
                  <XCircle className="w-7 h-7 text-red-600" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ⚠️ 关键预警区 - 紧凑版 */}
      {criticalAlerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {criticalAlerts.map((alert, index) => (
            <Card 
              key={index}
              className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                alert.level === 'high' ? 'border-red-200 bg-red-50' :
                alert.level === 'medium' ? 'border-orange-200 bg-orange-50' :
                'border-yellow-200 bg-yellow-50'
              }`}
              onClick={alert.action}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    alert.level === 'high' ? 'bg-red-100' :
                    alert.level === 'medium' ? 'bg-orange-100' :
                    'bg-yellow-100'
                  }`}>
                    <AlertCircle className={`w-4 h-4 ${
                      alert.level === 'high' ? 'text-red-600' :
                      alert.level === 'medium' ? 'text-orange-600' :
                      'text-yellow-600'
                    }`} />
                  </div>
                  <Badge variant="outline" className={`text-xs h-5 px-1.5 ${
                    alert.level === 'high' ? 'bg-red-100 text-red-700 border-red-300' :
                    alert.level === 'medium' ? 'bg-orange-100 text-orange-700 border-orange-300' :
                    'bg-yellow-100 text-yellow-700 border-yellow-300'
                  }`}>
                    {alert.level === 'high' ? '高优先级' : alert.level === 'medium' ? '中优先级' : '需关注'}
                  </Badge>
                </div>
                <div className={`text-xs mb-1 ${
                  alert.level === 'high' ? 'text-red-600' :
                  alert.level === 'medium' ? 'text-orange-600' :
                  'text-yellow-600'
                }`}>
                  {alert.title}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`font-bold ${
                    alert.level === 'high' ? 'text-red-900' :
                    alert.level === 'medium' ? 'text-orange-900' :
                    'text-yellow-900'
                  }`}>
                    {alert.count}
                  </span>
                  <span className="text-xs text-gray-600">项待处理</span>
                  {alert.amount && (
                    <span className="text-xs text-gray-600 ml-auto">
                      ${(alert.amount / 1000).toFixed(1)}K
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 📊 核心经营指标 - 紧凑版 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 本月营收 */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:shadow-lg transition-all cursor-pointer" onClick={canAccessBusinessModules ? () => onNavigate('order-management-center') : undefined}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                coreMetrics.revenueGrowth > 0 
                  ? 'bg-green-100 text-green-700' 
                  : coreMetrics.revenueGrowth < 0 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {coreMetrics.revenueGrowth > 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : coreMetrics.revenueGrowth < 0 ? (
                  <ArrowDownRight className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
                <span>{Math.abs(coreMetrics.revenueGrowth).toFixed(1)}%</span>
              </div>
            </div>
            <div className="text-xs text-gray-600 mb-1">本月营收</div>
            <div className="text-2xl font-bold text-gray-900 mb-0.5">
              ${(coreMetrics.thisMonthRevenue / 1000).toFixed(1)}K
            </div>
            <div className="text-xs text-gray-500">vs 上月</div>
          </CardContent>
        </Card>

        {/* 本月利润率 */}
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white hover:shadow-lg transition-all cursor-pointer" onClick={() => onNavigate('analytics')}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-xs h-5 px-1.5">
                健康
              </Badge>
            </div>
            <div className="text-xs text-gray-600 mb-1">本月利润率</div>
            <div className="text-2xl font-bold text-gray-900 mb-0.5">
              {coreMetrics.profitMargin.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">
              利润 ${(coreMetrics.thisMonthProfit / 1000).toFixed(1)}K
            </div>
          </CardContent>
        </Card>

        {/* 年度累计营收 */}
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white hover:shadow-lg transition-all cursor-pointer" onClick={canAccessBusinessModules ? () => onNavigate('order-management-center') : undefined}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300 text-xs h-5 px-1.5">
                YTD
              </Badge>
            </div>
            <div className="text-xs text-gray-600 mb-1">年度累计营收</div>
            <div className="text-2xl font-bold text-gray-900 mb-0.5">
              ${(coreMetrics.yearToDateRevenue / 1000).toFixed(1)}K
            </div>
            <div className="text-xs text-gray-500">
              {coreMetrics.totalOrders} 个订单
            </div>
          </CardContent>
        </Card>

        {/* 活跃客户数 */}
        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white hover:shadow-lg transition-all cursor-pointer" onClick={canAccessBusinessModules ? () => onNavigate('customers') : undefined}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                <Target className="w-3 h-3" />
                <span>{coreMetrics.conversionRate.toFixed(0)}%</span>
              </div>
            </div>
            <div className="text-xs text-gray-600 mb-1">活跃客户数</div>
            <div className="text-2xl font-bold text-gray-900 mb-0.5">
              {coreMetrics.activeCustomers}
            </div>
            <div className="text-xs text-gray-500">
              转化率 {coreMetrics.conversionRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 📈 核心数据可视化 - 紧凑版 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 月度营收趋势 */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#F96302]" />
              月度营收与利润趋势
            </CardTitle>
            <CardDescription className="text-xs">最近6个月业绩表现</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#6B7280"
                    style={{ fontSize: '11px' }}
                  />
                  <YAxis 
                    stroke="#6B7280"
                    style={{ fontSize: '11px' }}
                    label={{ value: '金额 (K)', angle: -90, position: 'insideLeft', style: { fontSize: '11px' } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '11px'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px' }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.2}
                    name="营收"
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.2}
                    name="利润"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 区域业绩占比 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#F96302]" />
              全球区域分布
            </CardTitle>
            <CardDescription className="text-xs">营收占比与表现</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 160 }}>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={regionalPerformance}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name.replace('市场', '')} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={65}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {regionalPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `$${(value / 1000).toFixed(1)}K`}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '11px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-3">
              {regionalPerformance.map((region, index) => (
                <div key={region.code} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: COLORS[index] }}
                    />
                    <span className="text-gray-700">{region.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-medium">
                      ${(region.revenue / 1000).toFixed(1)}K
                    </span>
                    <Badge variant="outline" className="text-xs h-4 px-1.5">
                      {region.profitMargin.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 🎯 业务健康度详细分析 - 紧凑版 */}
      <Card className="border-2 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#F96302]" />
            业务健康度分析
          </CardTitle>
          <CardDescription className="text-xs">
            综合评分 {healthScore.score}/100 ·
            {healthScore.score >= 80 ? ' 优秀' : healthScore.score >= 60 ? ' 良好' : healthScore.score >= 40 ? ' 需改进' : ' 需重点关注'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {healthScore.factors.map((factor, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{factor.name}</span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs h-4 px-1.5 ${
                        factor.status === 'excellent' ? 'bg-green-100 text-green-700 border-green-300' :
                        factor.status === 'good' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                        factor.status === 'warning' ? 'bg-orange-100 text-orange-700 border-orange-300' :
                        'bg-red-100 text-red-700 border-red-300'
                      }`}
                    >
                      {factor.status === 'excellent' ? '优秀' :
                       factor.status === 'good' ? '良好' :
                       factor.status === 'warning' ? '警告' :
                       '严重'}
                    </Badge>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{factor.score}分</span>
                </div>
                <Progress 
                  value={(factor.score / 30) * 100} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 🌍 区域详细表现 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#F96302]" />
            全球市场详细表现
          </CardTitle>
          <CardDescription>三大区域核心指标对比</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">区域</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">营收</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">订单数</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">利润</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">利润率</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">状态</th>
                </tr>
              </thead>
              <tbody>
                {regionalPerformance.map((region, index) => (
                  <tr key={region.code} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index] }}
                        />
                        <span className="text-sm font-medium text-gray-900">{region.name}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 text-sm font-medium text-gray-900">
                      ${(region.revenue / 1000).toFixed(1)}K
                    </td>
                    <td className="text-right py-3 px-4 text-sm text-gray-600">
                      {region.orders}
                    </td>
                    <td className="text-right py-3 px-4 text-sm font-medium text-green-600">
                      ${(region.profit / 1000).toFixed(1)}K
                    </td>
                    <td className="text-right py-3 px-4">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          region.profitMargin > 25 ? 'bg-green-100 text-green-700 border-green-300' :
                          region.profitMargin > 15 ? 'bg-blue-100 text-blue-700 border-blue-300' :
                          region.profitMargin > 10 ? 'bg-orange-100 text-orange-700 border-orange-300' :
                          'bg-red-100 text-red-700 border-red-300'
                        }`}
                      >
                        {region.profitMargin.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="text-right py-3 px-4">
                      {region.profitMargin > 25 ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 ml-auto" />
                      ) : region.profitMargin > 15 ? (
                        <CheckCircle2 className="w-5 h-5 text-blue-600 ml-auto" />
                      ) : region.profitMargin > 10 ? (
                        <AlertTriangle className="w-5 h-5 text-orange-600 ml-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 ml-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 🚀 快速操作面板 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#F96302]" />
            快速操作中心
          </CardTitle>
          <CardDescription>常用功能快速入口</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={canAccessBusinessModules ? () => onNavigate('order-management-center') : undefined}
              className={`p-4 rounded-lg border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-all text-left ${
                !canAccessBusinessModules ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
              disabled={!canAccessBusinessModules}
            >
              <ShoppingCart className="w-6 h-6 text-blue-600 mb-2" />
              <div className="text-sm font-medium text-gray-900">订单中心</div>
              <div className="text-xs text-gray-500 mt-1">{coreMetrics.totalOrders} 个订单</div>
            </button>
            
            <button
              onClick={canAccessBusinessModules ? () => onNavigate('finance-management') : undefined}
              className={`p-4 rounded-lg border-2 border-green-200 bg-green-50 hover:bg-green-100 transition-all text-left ${
                !canAccessBusinessModules ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
              disabled={!canAccessBusinessModules}
            >
              <DollarSign className="w-6 h-6 text-green-600 mb-2" />
              <div className="text-sm font-medium text-gray-900">财务管理</div>
              <div className="text-xs text-gray-500 mt-1">应收账款管理</div>
            </button>
            
            <button
              onClick={() => onNavigate('order-management-center')} // 🔥 改为订单管理中心
              className="p-4 rounded-lg border-2 border-orange-200 bg-orange-50 hover:bg-orange-100 transition-all cursor-pointer text-left"
            >
              <FileText className="w-6 h-6 text-orange-600 mb-2" />
              <div className="text-sm font-medium text-gray-900">审批中心</div>
              <div className="text-xs text-gray-500 mt-1">
                {quotations.filter(q => q.status === 'pending_approval').length} 待审批
              </div>
            </button>
            
            <button
              onClick={() => onNavigate('analytics')}
              className="p-4 rounded-lg border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 transition-all cursor-pointer text-left"
            >
              <BarChart3 className="w-6 h-6 text-purple-600 mb-2" />
              <div className="text-sm font-medium text-gray-900">数据分析</div>
              <div className="text-xs text-gray-500 mt-1">深度业务洞察</div>
            </button>
            
            <button
              onClick={canAccessBusinessModules ? () => onNavigate('customers') : undefined}
              className={`p-4 rounded-lg border-2 border-pink-200 bg-pink-50 hover:bg-pink-100 transition-all text-left ${
                !canAccessBusinessModules ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
              disabled={!canAccessBusinessModules}
            >
              <Users className="w-6 h-6 text-pink-600 mb-2" />
              <div className="text-sm font-medium text-gray-900">客户管理</div>
              <div className="text-xs text-gray-500 mt-1">{coreMetrics.activeCustomers} 活跃客户</div>
            </button>
            
            <button
              onClick={() => onNavigate('supply-chain')}
              className="p-4 rounded-lg border-2 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition-all cursor-pointer text-left"
            >
              <Package className="w-6 h-6 text-indigo-600 mb-2" />
              <div className="text-sm font-medium text-gray-900">供应链</div>
              <div className="text-xs text-gray-500 mt-1">库存与采购</div>
            </button>
            
            <button
              onClick={() => onNavigate('role-permission')}
              className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer text-left"
            >
              <Briefcase className="w-6 h-6 text-gray-600 mb-2" />
              <div className="text-sm font-medium text-gray-900">权限管理</div>
              <div className="text-xs text-gray-500 mt-1">角色与权限</div>
            </button>
            
            <button
              onClick={() => onNavigate('settings')}
              className="p-4 rounded-lg border-2 border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer text-left"
            >
              <Settings className="w-6 h-6 text-slate-600 mb-2" />
              <div className="text-sm font-medium text-gray-900">系统设置</div>
              <div className="text-xs text-gray-500 mt-1">配置与管理</div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}