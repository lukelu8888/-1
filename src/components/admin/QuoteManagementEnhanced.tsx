import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner@2.0.3';
import { 
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  DollarSign,
  Percent,
  Target,
  Zap,
  RefreshCw,
  Download,
  Filter,
  Search,
  Plus,
  Eye,
  Edit,
  Send,
  Copy,
  Trash2,
  AlertCircle,
  Users,
  Sparkles,
  BarChart3,
  PieChart,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Award,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Layers,
  History,
  Info,
  Save,
  X,
  Calculator,
  TrendingUpIcon,
  Package,
  Star
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  FunnelChart,
  Funnel
} from 'recharts';

interface QuoteManagementEnhancedProps {
  userRole?: string;
  user?: any;
}

// 报价状态
type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'negotiating';

export default function QuoteManagementEnhanced({ userRole = 'Sales_Rep', user }: QuoteManagementEnhancedProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<QuoteStatus | 'all'>('all');
  const [showNewQuote, setShowNewQuote] = useState(false);
  const [showQuoteDetail, setShowQuoteDetail] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [showVersionCompare, setShowVersionCompare] = useState(false);
  const [showAIPricing, setShowAIPricing] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);

  // 🔥 报价总览数据
  const quoteOverview = {
    totalQuotes: 156,
    pendingQuotes: 42,
    acceptanceRate: 68.5,
    avgConversionTime: 5.3,
    totalQuoteValue: 8950000,
    avgQuoteValue: 57372
  };

  // 🔥 报价列表数据
  const [quotes, setQuotes] = useState([
    {
      id: 'Q2024001',
      customer: 'ABC Trading Co.',
      customerEmail: 'contact@abctrading.com',
      products: [
        { name: '电气设备套装', quantity: 500, unitPrice: 250, total: 125000 }
      ],
      subtotal: 125000,
      discount: 12,
      discountAmount: 15000,
      total: 110000,
      status: 'negotiating' as QuoteStatus,
      version: 3,
      createdDate: '2024-11-20',
      validUntil: '2024-12-05',
      salesRep: 'John Smith',
      lastViewed: '2024-11-22 14:30',
      responseRate: 85,
      aiRecommendation: '建议提供3%额外折扣以促成交易，基于客户历史采购模式分析'
    },
    {
      id: 'Q2024002',
      customer: 'Global Parts Ltd.',
      customerEmail: 'orders@globalparts.com',
      products: [
        { name: '门窗配件批量订单', quantity: 1200, unitPrice: 65, total: 78000 }
      ],
      subtotal: 78000,
      discount: 8,
      discountAmount: 6240,
      total: 71760,
      status: 'sent' as QuoteStatus,
      version: 1,
      createdDate: '2024-11-22',
      validUntil: '2024-12-07',
      salesRep: 'Sarah Johnson',
      lastViewed: '2024-11-23 09:15',
      responseRate: 92,
      aiRecommendation: '客户信用评级优秀，建议给予8%折扣以快速成交'
    },
    {
      id: 'Q2024003',
      customer: 'Euro Building Materials',
      customerEmail: 'finance@eurobuild.com',
      products: [
        { name: '卫浴产品大批量订单', quantity: 800, unitPrice: 292.5, total: 234000 }
      ],
      subtotal: 234000,
      discount: 15,
      discountAmount: 35100,
      total: 198900,
      status: 'accepted' as QuoteStatus,
      version: 2,
      createdDate: '2024-11-15',
      validUntil: '2024-11-30',
      salesRep: 'Mike Chen',
      lastViewed: '2024-11-21 16:45',
      responseRate: 95,
      aiRecommendation: '已接受，建议立即转为合同'
    },
    {
      id: 'Q2024004',
      customer: 'Pacific Suppliers',
      customerEmail: 'procurement@pacificsup.com',
      products: [
        { name: '劳保用品季度采购', quantity: 2000, unitPrice: 22.5, total: 45000 }
      ],
      subtotal: 45000,
      discount: 5,
      discountAmount: 2250,
      total: 42750,
      status: 'viewed' as QuoteStatus,
      version: 1,
      createdDate: '2024-11-23',
      validUntil: '2024-12-08',
      salesRep: 'Lisa Wang',
      lastViewed: '2024-11-23 11:20',
      responseRate: 78,
      aiRecommendation: '客户已查看报价，建议24小时内电话跟进'
    },
    {
      id: 'Q2024005',
      customer: 'South America Supply',
      customerEmail: 'sales@sasuply.com',
      products: [
        { name: '混合类目订单', quantity: 1500, unitPrice: 111.33, total: 167000 }
      ],
      subtotal: 167000,
      discount: 18,
      discountAmount: 30060,
      total: 136940,
      status: 'rejected' as QuoteStatus,
      version: 4,
      createdDate: '2024-11-18',
      validUntil: '2024-11-28',
      salesRep: 'Tom Brown',
      lastViewed: '2024-11-20 10:30',
      responseRate: 45,
      aiRecommendation: '报价被拒，主要原因：价格偏高。建议调整至20%折扣重新报价'
    }
  ]);

  // 🔥 报价模板库
  const quoteTemplates = [
    {
      id: 'TPL001',
      name: '标准电气设备报价模板',
      category: '电气设备',
      defaultDiscount: 10,
      paymentTerms: '30% 预付，70% 见提单复印件',
      deliveryTerms: 'FOB 厦门港',
      validityDays: 15,
      notes: '含标准包装，不含运输保险',
      usageCount: 45
    },
    {
      id: 'TPL002',
      name: 'VIP客户专属模板',
      category: '全品类',
      defaultDiscount: 15,
      paymentTerms: '30天账期',
      deliveryTerms: 'CIF 目的港',
      validityDays: 30,
      notes: 'VIP客户专享优惠，含免费质检报告',
      usageCount: 23
    },
    {
      id: 'TPL003',
      name: '大批量订单模板',
      category: '全品类',
      defaultDiscount: 18,
      paymentTerms: '分期付款：30%-40%-30%',
      deliveryTerms: 'FOB 指定港口',
      validityDays: 20,
      notes: '适用于订单金额>$100K，含质量保证条款',
      usageCount: 12
    },
    {
      id: 'TPL004',
      name: '快速成交模板',
      category: '全品类',
      defaultDiscount: 8,
      paymentTerms: '100% 预付',
      deliveryTerms: 'EXW 工厂交货',
      validityDays: 7,
      notes: '限时优惠，7天内成交额外2%折扣',
      usageCount: 34
    }
  ];

  // 🔥 报价转化漏斗数据
  const conversionFunnel = [
    { stage: '创建报价', count: 156, percent: 100 },
    { stage: '已发送', count: 142, percent: 91 },
    { stage: '已查看', count: 118, percent: 76 },
    { stage: '谈判中', count: 78, percent: 50 },
    { stage: '已接受', count: 107, percent: 69 }
  ];

  // 🔥 报价接受率趋势
  const acceptanceTrend = [
    { month: '5月', rate: 62.5, quotes: 48, accepted: 30 },
    { month: '6月', rate: 65.2, quotes: 52, accepted: 34 },
    { month: '7月', rate: 63.8, quotes: 55, accepted: 35 },
    { month: '8月', rate: 66.7, quotes: 58, accepted: 39 },
    { month: '9月', rate: 68.1, quotes: 61, accepted: 42 },
    { month: '10月', rate: 68.5, quotes: 62, accepted: 42 }
  ];

  // 🔥 报价失败原因分析
  const rejectionReasons = [
    { reason: '价格过高', count: 18, percent: 42.9, color: '#ef4444' },
    { reason: '交期太长', count: 12, percent: 28.6, color: '#f59e0b' },
    { reason: '付款条件', count: 8, percent: 19.0, color: '#8b5cf6' },
    { reason: '产品不符', count: 4, percent: 9.5, color: '#3b82f6' }
  ];

  // 🔥 折扣分布分析
  const discountDistribution = [
    { range: '0-5%', count: 23, avgConversion: 58 },
    { range: '5-10%', count: 45, avgConversion: 65 },
    { range: '10-15%', count: 52, avgConversion: 72 },
    { range: '15-20%', count: 28, avgConversion: 78 },
    { range: '>20%', count: 8, avgConversion: 85 }
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

  // 获取报价状态样式
  const getQuoteStatusBadge = (status: QuoteStatus) => {
    const styles = {
      draft: { style: 'bg-gray-100 text-gray-700 border-gray-300', label: '草稿' },
      sent: { style: 'bg-blue-100 text-blue-700 border-blue-300', label: '已发送' },
      viewed: { style: 'bg-purple-100 text-purple-700 border-purple-300', label: '已查看' },
      accepted: { style: 'bg-emerald-100 text-emerald-700 border-emerald-300', label: '已接受' },
      rejected: { style: 'bg-red-100 text-red-700 border-red-300', label: '已拒绝' },
      expired: { style: 'bg-orange-100 text-orange-700 border-orange-300', label: '已过期' },
      negotiating: { style: 'bg-yellow-100 text-yellow-700 border-yellow-300', label: '谈判中' }
    };
    return styles[status];
  };

  // 计算报价剩余有效天数
  const getDaysRemaining = (validUntil: string) => {
    const today = new Date();
    const endDate = new Date(validUntil);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // 刷新数据
  const handleRefresh = () => {
    toast.success('数据已刷新', {
      description: '报价数据已更新到最新状态'
    });
  };

  // 导出报告
  const handleExport = () => {
    toast.success('报告导出成功', {
      description: '报价分析报告已生成并下载'
    });
  };

  // 创建新报价
  const handleCreateQuote = () => {
    toast.success('报价已创建', {
      description: '新报价已保存并发送给客户'
    });
    setShowNewQuote(false);
  };

  // 复制报价
  const handleCopyQuote = (quoteId: string) => {
    toast.success('报价已复制', {
      description: `报价 ${quoteId} 已复制为新报价`
    });
  };

  // 应用模板
  const handleApplyTemplate = (templateId: string) => {
    const template = quoteTemplates.find(t => t.id === templateId);
    toast.success('模板已应用', {
      description: `已应用模板：${template?.name}`
    });
    setShowTemplateLibrary(false);
  };

  // 发送报价
  const handleSendQuote = (quoteId: string) => {
    toast.success('报价已发送', {
      description: `报价 ${quoteId} 已通过邮件发送给客户`
    });
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 flex items-center gap-3" style={{ fontSize: '24px', fontWeight: 700 }}>
            <FileText className="w-7 h-7 text-blue-600" />
            报价管理系统增强版
            <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0">
              Enhanced
            </Badge>
          </h1>
          <p className="text-slate-600 mt-1" style={{ fontSize: '14px' }}>
            Quote Management Enhanced · AI智能定价 · 转化率分析 · 模板管理
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => setShowTemplateLibrary(true)}
          >
            <Layers className="w-4 h-4" />
            模板库
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
            刷新
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            导出报告
          </Button>
          <Button 
            size="sm" 
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowNewQuote(true)}
          >
            <Plus className="w-4 h-4" />
            新建报价
          </Button>
        </div>
      </div>

      {/* 第一行：报价总览KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* 总报价数 */}
        <Card className="p-5 bg-gradient-to-br from-slate-50 to-white border-slate-200">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-slate-600 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <p className="text-slate-600 text-sm mb-1">总报价数</p>
            <p className="text-slate-900 font-bold" style={{ fontSize: '24px' }}>
              {quoteOverview.totalQuotes}
            </p>
          </div>
        </Card>

        {/* 待处理报价 */}
        <Card className="p-5 bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <Badge className="bg-blue-100 text-blue-700 border-blue-300">
              需跟进
            </Badge>
          </div>
          <div>
            <p className="text-slate-600 text-sm mb-1">待处理报价</p>
            <p className="text-slate-900 font-bold" style={{ fontSize: '24px' }}>
              {quoteOverview.pendingQuotes}
            </p>
          </div>
        </Card>

        {/* 接受率 */}
        <Card className="p-5 bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 gap-1">
              <TrendingUp className="w-3 h-3" />
              +3.2%
            </Badge>
          </div>
          <div>
            <p className="text-slate-600 text-sm mb-1">报价接受率</p>
            <p className="text-slate-900 font-bold" style={{ fontSize: '24px' }}>
              {quoteOverview.acceptanceRate}%
            </p>
          </div>
        </Card>

        {/* 平均转化时间 */}
        <Card className="p-5 bg-gradient-to-br from-purple-50 to-white border-purple-200">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <Badge className="bg-purple-100 text-purple-700 border-purple-300 gap-1">
              <TrendingUp className="w-3 h-3" />
              -0.8天
            </Badge>
          </div>
          <div>
            <p className="text-slate-600 text-sm mb-1">平均转化时间</p>
            <p className="text-slate-900 font-bold" style={{ fontSize: '24px' }}>
              {quoteOverview.avgConversionTime}天
            </p>
          </div>
        </Card>

        {/* 报价总额 */}
        <Card className="p-5 bg-gradient-to-br from-yellow-50 to-white border-yellow-200">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 gap-1">
              <TrendingUp className="w-3 h-3" />
              +12.5%
            </Badge>
          </div>
          <div>
            <p className="text-slate-600 text-sm mb-1">报价总额</p>
            <p className="text-slate-900 font-bold" style={{ fontSize: '20px' }}>
              {formatCurrency(quoteOverview.totalQuoteValue)}
            </p>
          </div>
        </Card>

        {/* 平均报价额 */}
        <Card className="p-5 bg-gradient-to-br from-indigo-50 to-white border-indigo-200">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Calculator className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <p className="text-slate-600 text-sm mb-1">平均报价额</p>
            <p className="text-slate-900 font-bold" style={{ fontSize: '20px' }}>
              {formatCurrency(quoteOverview.avgQuoteValue)}
            </p>
          </div>
        </Card>
      </div>

      {/* 第二行：报价列表 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-slate-900 font-semibold flex items-center gap-2" style={{ fontSize: '16px' }}>
              <FileText className="w-5 h-5 text-blue-600" />
              报价列表（智能排序）
            </h3>
            <p className="text-xs text-slate-500 mt-1">按紧急程度和AI推荐优先级排序</p>
          </div>

          {/* 筛选器 */}
          <div className="flex items-center gap-2">
            <Select value={selectedStatus} onValueChange={(value: any) => setSelectedStatus(value)}>
              <SelectTrigger className="w-32 h-9">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="sent">已发送</SelectItem>
                <SelectItem value="viewed">已查看</SelectItem>
                <SelectItem value="negotiating">谈判中</SelectItem>
                <SelectItem value="accepted">已接受</SelectItem>
                <SelectItem value="rejected">已拒绝</SelectItem>
                <SelectItem value="expired">已过期</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          {quotes
            .filter(q => selectedStatus === 'all' || q.status === selectedStatus)
            .map((quote, index) => {
              const statusBadge = getQuoteStatusBadge(quote.status);
              const daysRemaining = getDaysRemaining(quote.validUntil);
              const isUrgent = daysRemaining <= 3 && daysRemaining > 0;
              const isExpired = daysRemaining < 0;
              
              return (
                <div 
                  key={quote.id} 
                  className={`bg-slate-50 rounded-lg p-4 border-2 transition-all hover:border-blue-300 ${
                    isUrgent ? 'border-orange-300' : isExpired ? 'border-red-300' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-slate-900">{quote.id}</p>
                        <Badge className={statusBadge.style}>
                          {statusBadge.label}
                        </Badge>
                        {quote.version > 1 && (
                          <Badge variant="outline" className="text-xs">
                            v{quote.version}
                          </Badge>
                        )}
                        {isUrgent && (
                          <Badge className="bg-orange-100 text-orange-700 border-orange-300">
                            即将过期
                          </Badge>
                        )}
                        {isExpired && (
                          <Badge variant="destructive">
                            已过期 {Math.abs(daysRemaining)}天
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-3 mb-3">
                        <div>
                          <p className="text-xs text-slate-600">客户名称</p>
                          <p className="text-sm font-semibold text-slate-900">{quote.customer}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">产品</p>
                          <p className="text-sm font-semibold text-slate-900">{quote.products[0].name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">报价金额</p>
                          <p className="text-sm font-semibold text-blue-600">{formatCurrency(quote.total)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">折扣</p>
                          <p className="text-sm font-semibold text-orange-600">{quote.discount}%</p>
                        </div>
                      </div>

                      {/* AI智能建议 */}
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded p-3 mb-3 border border-purple-200">
                        <p className="text-xs font-semibold text-purple-700 mb-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          AI智能建议
                        </p>
                        <p className="text-xs text-slate-700">{quote.aiRecommendation}</p>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-4">
                          <span className="text-slate-600">创建: {quote.createdDate}</span>
                          <span className="text-slate-600">有效期: {quote.validUntil}</span>
                          <span className="text-slate-600">业务员: {quote.salesRep}</span>
                          {quote.lastViewed && (
                            <span className="text-purple-600">最后查看: {quote.lastViewed}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-slate-700 font-semibold">{quote.responseRate}%</span>
                            <span className="text-slate-500">响应率</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      className="gap-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        setSelectedQuote(quote);
                        setShowQuoteDetail(true);
                      }}
                    >
                      <Eye className="w-3 h-3" />
                      查看详情
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-1"
                      onClick={() => handleCopyQuote(quote.id)}
                    >
                      <Copy className="w-3 h-3" />
                      复制
                    </Button>
                    {quote.status === 'draft' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                        onClick={() => handleSendQuote(quote.id)}
                      >
                        <Send className="w-3 h-3" />
                        发送
                      </Button>
                    )}
                    {quote.version > 1 && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-1"
                        onClick={() => setShowVersionCompare(true)}
                      >
                        <History className="w-3 h-3" />
                        版本对比
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-1"
                      onClick={() => setShowAIPricing(true)}
                    >
                      <Sparkles className="w-3 h-3" />
                      AI定价
                    </Button>
                  </div>
                </div>
              );
            })}
        </div>
      </Card>

      {/* 第三行：转化漏斗 + 接受率趋势 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 报价转化漏斗 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-slate-900 font-semibold flex items-center gap-2" style={{ fontSize: '16px' }}>
                <Target className="w-5 h-5 text-purple-600" />
                报价转化漏斗
              </h3>
              <p className="text-xs text-slate-500 mt-1">各阶段转化情况分析</p>
            </div>
          </div>

          <div className="space-y-3">
            {conversionFunnel.map((stage, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-900">{stage.stage}</span>
                  <span className="text-sm font-semibold text-blue-600">
                    {stage.count} ({stage.percent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all flex items-center justify-end pr-2" 
                    style={{ width: `${stage.percent}%` }}
                  >
                    {stage.percent >= 20 && (
                      <span className="text-white text-xs font-semibold">{stage.percent}%</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
            <p className="text-xs font-semibold text-purple-700 mb-2">💡 转化优化建议</p>
            <ul className="text-xs text-slate-700 space-y-1">
              <li>• 已发送→已查看：91%→76%，建议加强邮件提醒</li>
              <li>• 已查看→谈判：76%→50%，建议24h内电话跟进</li>
              <li>• 总体接受率69%，高于行业平均65%</li>
            </ul>
          </div>
        </Card>

        {/* 报价接受率趋势 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-slate-900 font-semibold flex items-center gap-2" style={{ fontSize: '16px' }}>
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                报价接受率趋势
              </h3>
              <p className="text-xs text-slate-500 mt-1">近6个月接受率变化</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={acceptanceTrend}>
              <defs>
                <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
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
                formatter={(value: any) => `${value}%`}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Area 
                type="monotone" 
                dataKey="rate" 
                name="接受率" 
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#colorRate)" 
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="quotes" 
                name="报价数" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
              <p className="text-xs text-slate-600 mb-1">当前接受率</p>
              <p className="text-lg font-bold text-emerald-600">68.5%</p>
              <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +6.0% vs 6个月前
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-slate-600 mb-1">月均报价数</p>
              <p className="text-lg font-bold text-blue-600">56</p>
              <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +14.3% vs 6个月前
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 第四行：失败原因分析 + 折扣分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 报价失败原因分析 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-slate-900 font-semibold flex items-center gap-2" style={{ fontSize: '16px' }}>
                <AlertCircle className="w-5 h-5 text-red-600" />
                报价失败原因分析
              </h3>
              <p className="text-xs text-slate-500 mt-1">识别问题 · 改进策略</p>
            </div>
          </div>

          <div className="space-y-3">
            {rejectionReasons.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-900">{item.reason}</span>
                  <span className="text-sm font-semibold" style={{ color: item.color }}>
                    {item.count}次 ({item.percent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className="h-3 rounded-full transition-all" 
                    style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 border border-red-200">
            <p className="text-xs font-semibold text-red-700 mb-2">⚠️ 改进建议</p>
            <ul className="text-xs text-slate-700 space-y-1">
              <li>• <strong>价格过高(43%)</strong>：建议使用AI智能定价，参考历史成交价</li>
              <li>• <strong>交期太长(29%)</strong>：优化供应链，缩短生产周期</li>
              <li>• <strong>付款条件(19%)</strong>：为优质客户提供更灵活的账期</li>
            </ul>
          </div>
        </Card>

        {/* 折扣分布与转化率 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-slate-900 font-semibold flex items-center gap-2" style={{ fontSize: '16px' }}>
                <Percent className="w-5 h-5 text-orange-600" />
                折扣分布与转化率
              </h3>
              <p className="text-xs text-slate-500 mt-1">找到最优折扣区间</p>
            </div>
          </div>

          <div className="space-y-4">
            {discountDistribution.map((item, index) => (
              <div key={index} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-900">{item.range}</p>
                    <p className="text-xs text-slate-600">{item.count}个报价</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-emerald-600">{item.avgConversion}%</p>
                    <p className="text-xs text-slate-600">转化率</p>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-emerald-600 h-2 rounded-full transition-all" 
                    style={{ width: `${item.avgConversion}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-200">
            <p className="text-xs font-semibold text-orange-700 mb-2">💡 最优折扣策略</p>
            <ul className="text-xs text-slate-700 space-y-1">
              <li>• <strong>最优区间：10-15%</strong>，平均转化率72%</li>
              <li>• 15-20%折扣转化率78%，但利润率降低</li>
              <li>• 建议：常规客户10-12%，VIP客户12-15%</li>
            </ul>
          </div>
        </Card>
      </div>

      {/* 🔥 弹窗：新建报价 */}
      <Dialog open={showNewQuote} onOpenChange={setShowNewQuote}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              新建报价
            </DialogTitle>
            <DialogDescription>
              创建新的客户报价单
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 客户信息 */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-3">客户信息</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="customerName">客户名称 *</Label>
                  <Input id="customerName" placeholder="输入客户名称" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">邮箱地址 *</Label>
                  <Input id="customerEmail" type="email" placeholder="输入邮箱" />
                </div>
              </div>
            </div>

            {/* 产品信息 */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-3">产品信息</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="productName">产品名称 *</Label>
                    <Input id="productName" placeholder="输入产品名称" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">数量 *</Label>
                    <Input id="quantity" type="number" placeholder="数量" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitPrice">单价 (USD) *</Label>
                    <Input id="unitPrice" type="number" placeholder="单价" />
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  添加产品
                </Button>
              </div>
            </div>

            {/* 定价策略 */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI智能定价建议
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="discount">折扣率 (%) *</Label>
                  <Input id="discount" type="number" placeholder="折扣率" defaultValue="10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validityDays">有效期（天）*</Label>
                  <Input id="validityDays" type="number" placeholder="有效期" defaultValue="15" />
                </div>
              </div>
              <p className="text-xs text-slate-700 mt-2">
                💡 AI建议：基于客户历史和市场数据，推荐折扣率10-12%，有效期15天
              </p>
            </div>

            {/* 条款 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">付款条款</Label>
                <Select>
                  <SelectTrigger id="paymentTerms">
                    <SelectValue placeholder="选择付款条款" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="t1">30% 预付，70% 见提单</SelectItem>
                    <SelectItem value="t2">100% 预付</SelectItem>
                    <SelectItem value="t3">30天账期</SelectItem>
                    <SelectItem value="t4">分期付款</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryTerms">交货条款</Label>
                <Select>
                  <SelectTrigger id="deliveryTerms">
                    <SelectValue placeholder="选择交货条款" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fob">FOB</SelectItem>
                    <SelectItem value="cif">CIF</SelectItem>
                    <SelectItem value="exw">EXW</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 备注 */}
            <div className="space-y-2">
              <Label htmlFor="notes">备注说明</Label>
              <Textarea id="notes" placeholder="输入备注..." rows={3} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewQuote(false)}>
              取消
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowTemplateLibrary(true)}
            >
              使用模板
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleCreateQuote}
            >
              <Save className="w-4 h-4 mr-2" />
              创建报价
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔥 弹窗：报价详情 */}
      <Dialog open={showQuoteDetail} onOpenChange={setShowQuoteDetail}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              报价详情
            </DialogTitle>
            <DialogDescription>
              {selectedQuote?.id} - {selectedQuote?.customer}
            </DialogDescription>
          </DialogHeader>

          {selectedQuote && (
            <div className="space-y-4">
              {/* 基本信息 */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 mb-3">基本信息</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-600">报价编号</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedQuote.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">状态</p>
                    <Badge className={getQuoteStatusBadge(selectedQuote.status).style}>
                      {getQuoteStatusBadge(selectedQuote.status).label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">创建日期</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedQuote.createdDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">有效期至</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedQuote.validUntil}</p>
                  </div>
                </div>
              </div>

              {/* 产品清单 */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 mb-3">产品清单</h4>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 text-xs font-semibold text-slate-600">产品名称</th>
                      <th className="text-right py-2 text-xs font-semibold text-slate-600">数量</th>
                      <th className="text-right py-2 text-xs font-semibold text-slate-600">单价</th>
                      <th className="text-right py-2 text-xs font-semibold text-slate-600">小计</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedQuote.products.map((product: any, index: number) => (
                      <tr key={index} className="border-b border-slate-100">
                        <td className="py-2 text-sm text-slate-900">{product.name}</td>
                        <td className="py-2 text-sm text-right text-slate-900">{product.quantity}</td>
                        <td className="py-2 text-sm text-right text-slate-900">{formatCurrency(product.unitPrice)}</td>
                        <td className="py-2 text-sm text-right font-semibold text-slate-900">{formatCurrency(product.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 价格汇总 */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">小计:</span>
                    <span className="text-sm font-semibold text-slate-900">{formatCurrency(selectedQuote.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">折扣 ({selectedQuote.discount}%):</span>
                    <span className="text-sm font-semibold text-orange-600">-{formatCurrency(selectedQuote.discountAmount)}</span>
                  </div>
                  <div className="border-t border-blue-300 pt-2 flex justify-between">
                    <span className="text-base font-bold text-slate-900">总计:</span>
                    <span className="text-xl font-bold text-blue-600">{formatCurrency(selectedQuote.total)}</span>
                  </div>
                </div>
              </div>

              {/* AI建议 */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI智能建议
                </h4>
                <p className="text-sm text-slate-700">{selectedQuote.aiRecommendation}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuoteDetail(false)}>
              关闭
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Send className="w-4 h-4 mr-2" />
              发送报价
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔥 弹窗：模板库 */}
      <Dialog open={showTemplateLibrary} onOpenChange={setShowTemplateLibrary}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-600" />
              报价模板库
            </DialogTitle>
            <DialogDescription>
              选择预设模板快速创建报价
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {quoteTemplates.map((template, index) => (
              <div key={template.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:border-purple-300 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-slate-900">{template.name}</p>
                      <Badge variant="outline">{template.category}</Badge>
                      <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                        已用{template.usageCount}次
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="bg-white rounded p-2">
                    <p className="text-xs text-slate-600">默认折扣</p>
                    <p className="text-sm font-semibold text-orange-600">{template.defaultDiscount}%</p>
                  </div>
                  <div className="bg-white rounded p-2">
                    <p className="text-xs text-slate-600">有效期</p>
                    <p className="text-sm font-semibold text-slate-900">{template.validityDays}天</p>
                  </div>
                  <div className="bg-white rounded p-2">
                    <p className="text-xs text-slate-600">交货条款</p>
                    <p className="text-sm font-semibold text-slate-900">{template.deliveryTerms}</p>
                  </div>
                </div>

                <div className="bg-white rounded p-3 mb-2">
                  <p className="text-xs text-slate-600 mb-1">付款条款:</p>
                  <p className="text-xs text-slate-900">{template.paymentTerms}</p>
                </div>

                <div className="bg-white rounded p-3 mb-3">
                  <p className="text-xs text-slate-600 mb-1">备注:</p>
                  <p className="text-xs text-slate-900">{template.notes}</p>
                </div>

                <Button 
                  size="sm" 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={() => handleApplyTemplate(template.id)}
                >
                  使用此模板
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateLibrary(false)}>
              关闭
            </Button>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              新建模板
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔥 弹窗：AI智能定价 */}
      <Dialog open={showAIPricing} onOpenChange={setShowAIPricing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI智能定价分析
            </DialogTitle>
            <DialogDescription>
              基于历史数据和市场分析的定价建议
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* AI推荐价格 */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border-2 border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI推荐定价方案
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-slate-600 mb-1">保守方案</p>
                  <p className="text-2xl font-bold text-blue-600">8%</p>
                  <p className="text-xs text-slate-600">成功率: 58%</p>
                </div>
                <div className="bg-white rounded-lg p-3 border-2 border-purple-500">
                  <p className="text-xs text-purple-600 mb-1 font-semibold">推荐方案 ⭐</p>
                  <p className="text-2xl font-bold text-purple-600">12%</p>
                  <p className="text-xs text-purple-600">成功率: 72%</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-slate-600 mb-1">激进方案</p>
                  <p className="text-2xl font-bold text-orange-600">15%</p>
                  <p className="text-xs text-slate-600">成功率: 78%</p>
                </div>
              </div>
              <p className="text-xs text-slate-700 mt-3">
                💡 基于该客户历史采购模式、行业平均折扣和竞品价格分析，推荐12%折扣方案
              </p>
            </div>

            {/* 历史数据对比 */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-3">历史数据参考</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">该客户历史平均折扣:</span>
                  <span className="font-semibold text-slate-900">10.5%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">同类产品平均折扣:</span>
                  <span className="font-semibold text-slate-900">11.2%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">竞品参考价格:</span>
                  <span className="font-semibold text-orange-600">$118,000 (折扣14%)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">行业平均折扣:</span>
                  <span className="font-semibold text-slate-900">12.8%</span>
                </div>
              </div>
            </div>

            {/* 利润分析 */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">利润率分析</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-slate-600">8%折扣</p>
                  <p className="text-lg font-bold text-emerald-600">28.5%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">12%折扣（推荐）</p>
                  <p className="text-lg font-bold text-blue-600">24.8%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">15%折扣</p>
                  <p className="text-lg font-bold text-orange-600">21.2%</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAIPricing(false)}>
              关闭
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700">
              应用推荐方案
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
