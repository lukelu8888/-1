import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { toast } from 'sonner@2.0.3';
import { 
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Award,
  Target,
  Activity,
  RefreshCw,
  Download,
  Eye,
  History,
  BarChart3
} from 'lucide-react';
import { 
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface CustomerCreditEvaluationProps {
  userRole?: string;
}

export default function CustomerCreditEvaluation({ userRole = 'CFO' }: CustomerCreditEvaluationProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCreditDetail, setShowCreditDetail] = useState(false);

  // 信用等级总览
  const creditOverview = {
    totalCustomers: 234,
    avgCreditScore: 76.5,
    highRiskCustomers: 12,
    mediumRiskCustomers: 45,
    lowRiskCustomers: 177,
    totalCreditLimit: 12500000
  };

  // 信用等级分布
  const creditGrades = [
    { grade: 'AAA', range: '90-100', count: 23, creditLimit: 3500000, color: '#10b981', risk: 'excellent' },
    { grade: 'AA', range: '80-89', count: 56, creditLimit: 3200000, color: '#3b82f6', risk: 'good' },
    { grade: 'A', range: '70-79', count: 98, creditLimit: 2800000, color: '#8b5cf6', risk: 'acceptable' },
    { grade: 'BBB', range: '60-69', count: 35, creditLimit: 1800000, color: '#f59e0b', risk: 'moderate' },
    { grade: 'BB', range: '50-59', count: 17, creditLimit: 980000, color: '#ef4444', risk: 'high' },
    { grade: 'B', range: '<50', count: 5, creditLimit: 220000, color: '#dc2626', risk: 'very_high' }
  ];

  // 客户信用评估列表
  const customerCreditList = [
    {
      id: 'C001',
      name: 'ABC Trading Co.',
      creditScore: 88,
      grade: 'AA',
      creditLimit: 150000,
      usedCredit: 95000,
      utilizationRate: 63.3,
      paymentHistory: 95,
      orderFrequency: 85,
      orderAmount: 90,
      cooperation: 92,
      overdueDays: 0,
      riskLevel: 'low',
      trend: 'up',
      lastUpdate: '2024-11-23'
    },
    {
      id: 'C002',
      name: 'Global Parts Ltd.',
      creditScore: 92,
      grade: 'AAA',
      creditLimit: 200000,
      usedCredit: 78000,
      utilizationRate: 39.0,
      paymentHistory: 98,
      orderFrequency: 88,
      orderAmount: 95,
      cooperation: 90,
      overdueDays: 0,
      riskLevel: 'low',
      trend: 'up',
      lastUpdate: '2024-11-22'
    },
    {
      id: 'C003',
      name: 'Euro Building Materials',
      creditScore: 75,
      grade: 'A',
      creditLimit: 180000,
      usedCredit: 156000,
      utilizationRate: 86.7,
      paymentHistory: 78,
      orderFrequency: 75,
      orderAmount: 72,
      cooperation: 75,
      overdueDays: 5,
      riskLevel: 'medium',
      trend: 'down',
      lastUpdate: '2024-11-20'
    },
    {
      id: 'C004',
      name: 'Pacific Suppliers',
      creditScore: 65,
      grade: 'BBB',
      creditLimit: 100000,
      usedCredit: 92000,
      utilizationRate: 92.0,
      paymentHistory: 65,
      orderFrequency: 68,
      orderAmount: 60,
      cooperation: 65,
      overdueDays: 12,
      riskLevel: 'high',
      trend: 'down',
      lastUpdate: '2024-11-18'
    },
    {
      id: 'C005',
      name: 'South America Supply',
      creditScore: 55,
      grade: 'BB',
      creditLimit: 80000,
      usedCredit: 78000,
      utilizationRate: 97.5,
      paymentHistory: 52,
      orderFrequency: 55,
      orderAmount: 58,
      cooperation: 55,
      overdueDays: 18,
      riskLevel: 'high',
      trend: 'down',
      lastUpdate: '2024-11-15'
    }
  ];

  // 信用评分因素权重
  const scoringFactors = [
    { factor: '付款历史', weight: 35, description: '按时付款记录和逾期情况' },
    { factor: '订单频率', weight: 20, description: '采购频率和稳定性' },
    { factor: '订单金额', weight: 25, description: '采购金额和增长趋势' },
    { factor: '合作时长', weight: 20, description: '合作年限和忠诚度' }
  ];

  // 信用风险趋势
  const riskTrend = [
    { month: '5月', lowRisk: 165, mediumRisk: 52, highRisk: 17 },
    { month: '6月', lowRisk: 168, mediumRisk: 50, highRisk: 16 },
    { month: '7月', lowRisk: 172, mediumRisk: 48, highRisk: 14 },
    { month: '8月', lowRisk: 175, mediumRisk: 47, highRisk: 12 },
    { month: '9月', lowRisk: 176, mediumRisk: 46, highRisk: 12 },
    { month: '10月', lowRisk: 177, mediumRisk: 45, highRisk: 12 }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getCreditGradeBadge = (grade: string) => {
    const styles: any = {
      'AAA': 'bg-emerald-100 text-emerald-700 border-emerald-300',
      'AA': 'bg-blue-100 text-blue-700 border-blue-300',
      'A': 'bg-purple-100 text-purple-700 border-purple-300',
      'BBB': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'BB': 'bg-orange-100 text-orange-700 border-orange-300',
      'B': 'bg-red-100 text-red-700 border-red-300'
    };
    return styles[grade] || 'bg-slate-100 text-slate-700 border-slate-300';
  };

  const getRiskBadge = (level: string) => {
    const styles: any = {
      low: { style: 'bg-emerald-100 text-emerald-700 border-emerald-300', label: '低风险' },
      medium: { style: 'bg-yellow-100 text-yellow-700 border-yellow-300', label: '中风险' },
      high: { style: 'bg-red-100 text-red-700 border-red-300', label: '高风险' }
    };
    return styles[level] || styles.low;
  };

  const handleRefresh = () => {
    toast.success('信用数据已更新', {
      description: '客户信用评分已重新计算'
    });
  };

  return (
    <div className="space-y-3">
      {/* 头部 - 台湾大厂风格 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 flex items-center gap-2 text-lg font-semibold">
            <Shield className="w-5 h-5 text-[#F96302]" />
            客户信用评估系统
            <span className="text-xs px-2 py-0.5 rounded bg-[#F96302] text-white font-normal">
              Credit
            </span>
          </h1>
          <p className="text-gray-600 mt-0.5 text-xs">
            Customer Credit Evaluation · 信用评分 · 风险预警 · 额度管理
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} className="px-3 py-1.5 text-xs border border-[#D1D5DB] rounded hover:bg-gray-50 transition-colors flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            刷新评分
          </button>
          <button className="px-3 py-1.5 text-xs border border-[#D1D5DB] rounded hover:bg-gray-50 transition-colors flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" />
            导出报告
          </button>
        </div>
      </div>

      {/* KPI总览 - 台湾大厂紧凑风格 */}
      <div className="grid grid-cols-6 gap-3">
        <div className="bg-white border border-[#E5E7EB] rounded p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <p className="text-xs text-gray-600">总客户数</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {creditOverview.totalCustomers}
          </p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
              <Award className="w-4 h-4 text-white" />
            </div>
            <p className="text-xs text-gray-600">平均信用分</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {creditOverview.avgCreditScore}
          </p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs text-gray-600">低风险客户</p>
            </div>
            <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              优秀
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {creditOverview.lowRiskCustomers}
          </p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-600 rounded flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs text-gray-600">中风险客户</p>
            </div>
            <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-700 border border-yellow-200">
              关注
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {creditOverview.mediumRiskCustomers}
          </p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                <XCircle className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs text-gray-600">高风险客户</p>
            </div>
            <span className="text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
              警告
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {creditOverview.highRiskCustomers}
          </p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <p className="text-xs text-gray-600">总授信额度</p>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(creditOverview.totalCreditLimit)}
          </p>
        </div>
      </div>

      {/* 信用等级分布 - 台湾大厂紧凑风格 */}
      <div className="bg-white border border-[#E5E7EB] rounded">
        <div className="px-3 py-2 border-b border-[#E5E7EB] bg-[#FAFBFC]">
          <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600" />
            信用等级分布
          </p>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-3 gap-3">
            {creditGrades.map((grade, index) => (
              <div key={index} className="bg-[#FAFBFC] rounded border border-[#E5E7EB] p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xl font-bold" style={{ color: grade.color }}>{grade.grade}</p>
                    <p className="text-xs text-gray-600">评分: {grade.range}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{ backgroundColor: grade.color + '20', color: grade.color, border: `1px solid ${grade.color}40` }}>
                    {grade.count}家
                  </span>
                </div>

                <div className="space-y-1.5 mb-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">授信额度</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(grade.creditLimit)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">占比</span>
                    <span className="font-semibold text-gray-900">
                      {((grade.count / creditOverview.totalCustomers) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="h-1.5 rounded-full transition-all" 
                    style={{ 
                      width: `${(grade.count / creditOverview.totalCustomers) * 100}%`,
                      backgroundColor: grade.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 客户信用评估列表 */}
      <Card className="p-6">
        <h3 className="text-slate-900 font-semibold flex items-center gap-2 mb-4" style={{ fontSize: '16px' }}>
          <Shield className="w-5 h-5 text-blue-600" />
          客户信用评估列表
        </h3>
        <div className="space-y-3">
          {customerCreditList.map((customer, index) => {
            const riskBadge = getRiskBadge(customer.riskLevel);
            const isOverdue = customer.overdueDays > 0;
            
            return (
              <div 
                key={customer.id} 
                className={`bg-slate-50 rounded-lg p-4 border-2 transition-all ${
                  customer.riskLevel === 'high' ? 'border-red-300' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold text-slate-900">{customer.name}</p>
                      <Badge className={getCreditGradeBadge(customer.grade)}>
                        {customer.grade}级
                      </Badge>
                      <Badge className={riskBadge.style}>
                        {riskBadge.label}
                      </Badge>
                      {customer.trend === 'up' ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 gap-1">
                          <TrendingUp className="w-3 h-3" />
                          改善
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 border-red-300 gap-1">
                          <TrendingDown className="w-3 h-3" />
                          下降
                        </Badge>
                      )}
                      {isOverdue && (
                        <Badge variant="destructive">
                          逾期{customer.overdueDays}天
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-5 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-slate-600">信用评分</p>
                        <p className="text-2xl font-bold text-indigo-600">{customer.creditScore}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">授信额度</p>
                        <p className="text-sm font-semibold text-slate-900">{formatCurrency(customer.creditLimit)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">已用额度</p>
                        <p className="text-sm font-semibold text-blue-600">{formatCurrency(customer.usedCredit)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">使用率</p>
                        <p className={`text-sm font-semibold ${
                          customer.utilizationRate > 80 ? 'text-red-600' : 'text-emerald-600'
                        }`}>
                          {customer.utilizationRate.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">最后更新</p>
                        <p className="text-sm font-semibold text-slate-900">{customer.lastUpdate}</p>
                      </div>
                    </div>

                    {/* 评分维度 */}
                    <div className="bg-white rounded p-3 mb-3">
                      <p className="text-xs font-semibold text-slate-700 mb-2">评分维度</p>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <p className="text-xs text-slate-600">付款历史</p>
                          <p className="text-sm font-semibold text-slate-900">{customer.paymentHistory}分</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">订单频率</p>
                          <p className="text-sm font-semibold text-slate-900">{customer.orderFrequency}分</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">订单金额</p>
                          <p className="text-sm font-semibold text-slate-900">{customer.orderAmount}分</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">合作时长</p>
                          <p className="text-sm font-semibold text-slate-900">{customer.cooperation}分</p>
                        </div>
                      </div>
                    </div>

                    {/* 额度使用进度 */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-slate-600">额度使用情况</span>
                        <span className="text-xs font-semibold text-blue-600">
                          {formatCurrency(customer.usedCredit)} / {formatCurrency(customer.creditLimit)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all ${
                            customer.utilizationRate > 80 ? 'bg-red-600' : 'bg-blue-600'
                          }`}
                          style={{ width: `${customer.utilizationRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    className="gap-1 bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setShowCreditDetail(true);
                    }}
                  >
                    <Eye className="w-3 h-3" />
                    查看详情
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1">
                    <History className="w-3 h-3" />
                    历史记录
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1">
                    <Target className="w-3 h-3" />
                    调整额度
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 评分因素权重 + 风险趋势 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 评分因素权重 */}
        <Card className="p-6">
          <h3 className="text-slate-900 font-semibold flex items-center gap-2 mb-4" style={{ fontSize: '16px' }}>
            <Target className="w-5 h-5 text-purple-600" />
            信用评分因素权重
          </h3>
          <div className="space-y-4">
            {scoringFactors.map((factor, index) => (
              <div key={index} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{factor.factor}</p>
                    <p className="text-xs text-slate-600">{factor.description}</p>
                  </div>
                  <p className="text-2xl font-bold text-indigo-600">{factor.weight}%</p>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 mt-2">
                  <div 
                    className="bg-indigo-600 h-3 rounded-full transition-all" 
                    style={{ width: `${factor.weight}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
            <p className="text-xs font-semibold text-purple-700 mb-2">💡 评分说明</p>
            <ul className="text-xs text-slate-700 space-y-1">
              <li>• 付款历史权重最高(35%)，按时付款至关重要</li>
              <li>• 订单金额(25%)反映客户采购能力</li>
              <li>• 综合评分90+为AAA级，70-79为A级</li>
            </ul>
          </div>
        </Card>

        {/* 信用风险趋势 */}
        <Card className="p-6">
          <h3 className="text-slate-900 font-semibold flex items-center gap-2 mb-4" style={{ fontSize: '16px' }}>
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            信用风险趋势
          </h3>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={riskTrend}>
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
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="lowRisk" name="低风险" fill="#10b981" stackId="a" />
              <Bar dataKey="mediumRisk" name="中风险" fill="#f59e0b" stackId="a" />
              <Bar dataKey="highRisk" name="高风险" fill="#ef4444" stackId="a" />
            </BarChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
              <p className="text-xs text-slate-600 mb-1">低风险</p>
              <p className="text-lg font-bold text-emerald-600">177</p>
              <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +7.3%
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <p className="text-xs text-slate-600 mb-1">中风险</p>
              <p className="text-lg font-bold text-yellow-600">45</p>
              <p className="text-xs text-yellow-600 flex items-center gap-1 mt-1">
                <TrendingDown className="w-3 h-3" />
                -13.5%
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <p className="text-xs text-slate-600 mb-1">高风险</p>
              <p className="text-lg font-bold text-red-600">12</p>
              <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                <TrendingDown className="w-3 h-3" />
                -29.4%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 弹窗：客户信用详情 */}
      <Dialog open={showCreditDetail} onOpenChange={setShowCreditDetail}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              客户信用详情
            </DialogTitle>
            <DialogDescription>
              {selectedCustomer?.name} - {selectedCustomer?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-4">
              {/* 信用评分 */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">综合信用评分</p>
                    <p className="text-4xl font-bold text-indigo-600">{selectedCustomer.creditScore}</p>
                  </div>
                  <Badge className={getCreditGradeBadge(selectedCustomer.grade)} style={{ fontSize: '24px', padding: '12px 20px' }}>
                    {selectedCustomer.grade}级
                  </Badge>
                </div>
              </div>

              {/* 评分雷达图 */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 mb-3">评分维度分析</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={[
                    { metric: '付款历史', score: selectedCustomer.paymentHistory },
                    { metric: '订单频率', score: selectedCustomer.orderFrequency },
                    { metric: '订单金额', score: selectedCustomer.orderAmount },
                    { metric: '合作时长', score: selectedCustomer.cooperation }
                  ]}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="metric" stroke="#64748b" style={{ fontSize: '12px' }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#64748b" style={{ fontSize: '11px' }} />
                    <Radar 
                      name="评分" 
                      dataKey="score" 
                      stroke="#6366f1" 
                      fill="#6366f1" 
                      fillOpacity={0.5}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* 额度信息 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-xs text-slate-600 mb-1">授信额度</p>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(selectedCustomer.creditLimit)}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <p className="text-xs text-slate-600 mb-1">使用率</p>
                  <p className="text-lg font-bold text-orange-600">{selectedCustomer.utilizationRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreditDetail(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}