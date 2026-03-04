import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  DollarSign, TrendingUp, AlertCircle, CheckCircle2, Clock, 
  FileText, CreditCard, PieChart, BarChart3, Download,
  Calendar, Search, Filter, RefreshCw, Eye, Plus, Send,
  Receipt, ArrowUpRight, ArrowDownRight, Wallet, Globe
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Progress } from '../ui/progress';
import { AccountsReceivableList } from './AccountsReceivableList'; // 🔥 新增
import CollectionManagement from './CollectionManagement'; // 🔥 真实收款管理组件
import InvoiceManagement from './InvoiceManagement'; // 🔥 真实发票管理组件
import DocumentCenter from './DocumentCenter'; // 🔥 单证中心
import PayableManagement from './PayableManagement'; // 🔥 新增：应付账款管理
import PaymentRecordManagement from './PaymentRecordManagement'; // 🔥 新增：付款记录管理
import { useAuth } from '../../hooks/useAuth'; // 🔥 导入认证钩子

// 收款记录接口
interface PaymentRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  type: 'deposit' | 'balance' | 'full';
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'CNY';
  status: 'pending' | 'received' | 'overdue';
  paymentMethod: 'T/T' | 'L/C' | 'Western Union' | 'PayPal' | 'Wire Transfer';
  dueDate: string;
  receivedDate?: string;
  bankAccount: string;
  referenceNumber?: string;
  exchangeRate?: number;
  cnyAmount?: number;
}

// 应收账款接口
interface AccountReceivable {
  id: string;
  orderNumber: string;
  customerName: string;
  customerType: 'public_pool' | 'prospect' | 'customer' | 'vip';
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'CNY';
  ageInDays: number;
  status: 'current' | 'overdue_30' | 'overdue_60' | 'overdue_90';
  lastPaymentDate?: string;
  nextPaymentDue?: string;
}

// 发票接口
interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'proforma' | 'commercial' | 'vat';
  orderNumber: string;
  customerName: string;
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'CNY';
  issueDate: string;
  dueDate: string;
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled';
  pdfUrl?: string;
}

// 利润分析接口
interface ProfitAnalysis {
  orderNumber: string;
  customerName: string;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'CNY';
}

// 汇率接口
interface ExchangeRate {
  currency: 'USD' | 'EUR' | 'GBP';
  rate: number;
  lastUpdated: string;
  change24h: number;
}

export default function FinanceManagement() {
  const { currentUser } = useAuth(); // 🔥 获取当前用户
  const [activeTab, setActiveTab] = useState<'payments' | 'receivables' | 'invoices' | 'profit' | 'reports' | 'payables' | 'payment-records' | 'documents'>('payments');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // 🔥🔥🔥 根据角色判断标签页可见性
  const canViewFrontOfficeFinance = () => {
    if (!currentUser) return true; // 如果没有用户信息，默认显示所有
    // CEO/CFO/Admin - 可以查看所有
    if (currentUser.role === 'CEO' || currentUser.role === 'CFO' || currentUser.role === 'Admin') return true;
    // 销售相关角色 - 可以查看前台财务
    if (currentUser.role === 'Sales_Manager' || currentUser.role === 'Sales_Rep') return true;
    // 财务角色 - 可以查看所有
    if (currentUser.role === 'Finance') return true;
    return false;
  };

  const canViewBackOfficeFinance = () => {
    if (!currentUser) return true; // 如果没有用户信息，默认显示所有
    // CEO/CFO/Admin - 可以查看所有
    if (currentUser.role === 'CEO' || currentUser.role === 'CFO' || currentUser.role === 'Admin') return true;
    // 采购角色 - 可以查看后台财务
    if (currentUser.role === 'Procurement') return true;
    // 财务角色 - 可以查看所有
    if (currentUser.role === 'Finance') return true;
    return false;
  };

  // 🔥🔥🔥 根据角色设置默认激活标签
  React.useEffect(() => {
    if (!currentUser) return;
    
    // 如果当前标签对当前角色不可见，切换到可见的第一个标签
    if (activeTab === 'payments' || activeTab === 'receivables' || activeTab === 'invoices' || activeTab === 'profit' || activeTab === 'reports' || activeTab === 'documents') {
      if (!canViewFrontOfficeFinance()) {
        setActiveTab('payables'); // 切换到应付账款
      }
    }
    
    if (activeTab === 'payables' || activeTab === 'payment-records') {
      if (!canViewBackOfficeFinance()) {
        setActiveTab('payments'); // 切换到收款管理
      }
    }
  }, [currentUser, activeTab]);

  // 🔥🔥🔥 新增：筛选状态
  const [timeRange, setTimeRange] = useState('ytd'); // q1, q2, q3, q4, ytd, year
  const [selectedRegion, setSelectedRegion] = useState('all'); // all, NA, EA, SA
  const [selectedBusinessType, setSelectedBusinessType] = useState('all'); // all, trading, inspection, agency, project
  const [selectedCurrency, setSelectedCurrency] = useState('all'); // all, USD, EUR, GBP

  // 🔥🔥🔥 时间范围系数
  const timeMultiplier = {
    'q1': 0.25,
    'q2': 0.50,
    'q3': 0.75,
    'q4': 0.90,
    'ytd': 0.917, // 11个月
    'year': 1.0
  }[timeRange] || 1.0;

  // 模拟收款记录数据
  const paymentRecords: PaymentRecord[] = [
    {
      id: 'PAY-001',
      orderNumber: 'ORD-2025-1156',
      customerName: 'ABC Trading Ltd.',
      type: 'deposit',
      amount: 37500,
      currency: 'USD',
      status: 'received',
      paymentMethod: 'T/T',
      dueDate: '2025-10-20',
      receivedDate: '2025-10-22',
      bankAccount: 'BOC-USD',
      referenceNumber: 'TT20251022001',
      exchangeRate: 7.24,
      cnyAmount: 271500
    },
    {
      id: 'PAY-002',
      orderNumber: 'ORD-2025-1156',
      customerName: 'ABC Trading Ltd.',
      type: 'balance',
      amount: 87500,
      currency: 'USD',
      status: 'pending',
      paymentMethod: 'T/T',
      dueDate: '2025-12-10',
      bankAccount: 'BOC-USD',
      exchangeRate: 7.24
    },
    {
      id: 'PAY-003',
      orderNumber: 'ORD-2025-1189',
      customerName: 'HomeStyle Warehouse',
      type: 'deposit',
      amount: 26700,
      currency: 'USD',
      status: 'received',
      paymentMethod: 'Wire Transfer',
      dueDate: '2025-11-06',
      receivedDate: '2025-11-08',
      bankAccount: 'BOC-USD',
      referenceNumber: 'WT20251108001',
      exchangeRate: 7.26,
      cnyAmount: 193842
    },
    {
      id: 'PAY-004',
      orderNumber: 'ORD-2025-1189',
      customerName: 'HomeStyle Warehouse',
      type: 'balance',
      amount: 62300,
      currency: 'USD',
      status: 'pending',
      paymentMethod: 'Wire Transfer',
      dueDate: '2025-11-28',
      bankAccount: 'BOC-USD',
      exchangeRate: 7.26
    },
    {
      id: 'PAY-005',
      orderNumber: 'ORD-2025-1201',
      customerName: 'Industrial Supply Hub',
      type: 'deposit',
      amount: 46800,
      currency: 'USD',
      status: 'overdue',
      paymentMethod: 'T/T',
      dueDate: '2025-11-18',
      bankAccount: 'BOC-USD',
      exchangeRate: 7.28
    },
    {
      id: 'PAY-006',
      orderNumber: 'ORD-2025-1125',
      customerName: 'EuroHome GmbH',
      type: 'full',
      amount: 45000,
      currency: 'EUR',
      status: 'received',
      paymentMethod: 'L/C',
      dueDate: '2025-11-05',
      receivedDate: '2025-11-05',
      bankAccount: 'BOC-EUR',
      referenceNumber: 'LC20251105001',
      exchangeRate: 7.85,
      cnyAmount: 353250
    }
  ];

  // 模拟应收账款数据
  const accountsReceivable: AccountReceivable[] = [
    {
      id: 'AR-001',
      orderNumber: 'ORD-2025-1156',
      customerName: 'ABC Trading Ltd.',
      customerType: 'customer',
      totalAmount: 125000,
      paidAmount: 37500,
      unpaidAmount: 87500,
      currency: 'USD',
      ageInDays: 28,
      status: 'current',
      lastPaymentDate: '2025-10-22',
      nextPaymentDue: '2025-12-10'
    },
    {
      id: 'AR-002',
      orderNumber: 'ORD-2025-1189',
      customerName: 'HomeStyle Warehouse',
      customerType: 'vip',
      totalAmount: 89000,
      paidAmount: 26700,
      unpaidAmount: 62300,
      currency: 'USD',
      ageInDays: 10,
      status: 'current',
      lastPaymentDate: '2025-11-08',
      nextPaymentDue: '2025-11-28'
    },
    {
      id: 'AR-003',
      orderNumber: 'ORD-2025-1201',
      customerName: 'Industrial Supply Hub',
      customerType: 'customer',
      totalAmount: 156000,
      paidAmount: 0,
      unpaidAmount: 156000,
      currency: 'USD',
      ageInDays: 3,
      status: 'current',
      nextPaymentDue: '2025-11-18'
    },
    {
      id: 'AR-004',
      orderNumber: 'ORD-2025-1078',
      customerName: 'BuildMart UK Ltd.',
      customerType: 'customer',
      totalAmount: 68000,
      paidAmount: 20400,
      unpaidAmount: 47600,
      currency: 'GBP',
      ageInDays: 35,
      status: 'overdue_30',
      lastPaymentDate: '2025-10-10',
      nextPaymentDue: '2025-10-25'
    },
    {
      id: 'AR-005',
      orderNumber: 'ORD-2025-0956',
      customerName: 'Construction Plus SA',
      customerType: 'customer',
      totalAmount: 92000,
      paidAmount: 27600,
      unpaidAmount: 64400,
      currency: 'EUR',
      ageInDays: 68,
      status: 'overdue_60',
      lastPaymentDate: '2025-09-10',
      nextPaymentDue: '2025-09-25'
    }
  ];

  // 模拟发票数据
  const invoices: Invoice[] = [
    {
      id: 'INV-001',
      invoiceNumber: 'PI-2025-1156',
      type: 'proforma',
      orderNumber: 'ORD-2025-1156',
      customerName: 'ABC Trading Ltd.',
      amount: 125000,
      currency: 'USD',
      issueDate: '2025-10-18',
      dueDate: '2025-10-20',
      status: 'paid',
      pdfUrl: '#'
    },
    {
      id: 'INV-002',
      invoiceNumber: 'CI-2025-1156',
      type: 'commercial',
      orderNumber: 'ORD-2025-1156',
      customerName: 'ABC Trading Ltd.',
      amount: 125000,
      currency: 'USD',
      issueDate: '2025-11-13',
      dueDate: '2025-12-10',
      status: 'issued',
      pdfUrl: '#'
    },
    {
      id: 'INV-003',
      invoiceNumber: 'PI-2025-1189',
      type: 'proforma',
      orderNumber: 'ORD-2025-1189',
      customerName: 'HomeStyle Warehouse',
      amount: 89000,
      currency: 'USD',
      issueDate: '2025-11-04',
      dueDate: '2025-11-06',
      status: 'paid',
      pdfUrl: '#'
    },
    {
      id: 'INV-004',
      invoiceNumber: 'PI-2025-1201',
      type: 'proforma',
      orderNumber: 'ORD-2025-1201',
      customerName: 'Industrial Supply Hub',
      amount: 156000,
      currency: 'USD',
      issueDate: '2025-11-15',
      dueDate: '2025-11-18',
      status: 'overdue',
      pdfUrl: '#'
    },
    {
      id: 'INV-005',
      invoiceNumber: 'CI-2025-1125',
      type: 'commercial',
      orderNumber: 'ORD-2025-1125',
      customerName: 'EuroHome GmbH',
      amount: 45000,
      currency: 'EUR',
      issueDate: '2025-11-01',
      dueDate: '2025-11-05',
      status: 'paid',
      pdfUrl: '#'
    }
  ];

  // 模拟利润分析数据 - 🔥 已清空
  const profitAnalysis: ProfitAnalysis[] = [];

  // 汇率数据
  const exchangeRates: ExchangeRate[] = [
    { currency: 'USD', rate: 7.24, lastUpdated: '2025-11-18 10:30', change24h: 0.12 },
    { currency: 'EUR', rate: 7.85, lastUpdated: '2025-11-18 10:30', change24h: -0.08 },
    { currency: 'GBP', rate: 9.15, lastUpdated: '2025-11-18 10:30', change24h: 0.05 }
  ];

  // 统计数据
  const stats = {
    totalRevenue: paymentRecords.filter(p => p.status === 'received').reduce((sum, p) => sum + (p.cnyAmount || 0), 0),
    pendingPayments: paymentRecords.filter(p => p.status === 'pending').length,
    overduePayments: paymentRecords.filter(p => p.status === 'overdue').length,
    totalReceivables: accountsReceivable.reduce((sum, ar) => sum + ar.unpaidAmount, 0),
    overdueReceivables: accountsReceivable.filter(ar => ar.status !== 'current').length,
    totalProfit: profitAnalysis.reduce((sum, p) => sum + p.profit, 0),
    avgProfitMargin: profitAnalysis.length > 0 ? profitAnalysis.reduce((sum, p) => sum + p.profitMargin, 0) / profitAnalysis.length : 0
  };

  // 获取支付状态配置
  const getPaymentStatusConfig = (status: string) => {
    const configs = {
      pending: { label: '待收', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
      received: { label: '已收', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
      overdue: { label: '逾期', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: AlertCircle }
    };
    return configs[status as keyof typeof configs];
  };

  // 获取应收账款状态配置
  const getARStatusConfig = (status: string) => {
    const configs = {
      current: { label: '正常', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      overdue_30: { label: '逾期30天', color: 'bg-amber-50 text-amber-700 border-amber-200' },
      overdue_60: { label: '逾期60天', color: 'bg-orange-50 text-orange-700 border-orange-200' },
      overdue_90: { label: '逾期90天+', color: 'bg-rose-50 text-rose-700 border-rose-200' }
    };
    return configs[status as keyof typeof configs];
  };

  // 获取发票状态配置
  const getInvoiceStatusConfig = (status: string) => {
    const configs = {
      draft: { label: '稿', color: 'bg-slate-50 text-slate-700 border-slate-200' },
      issued: { label: '已开', color: 'bg-blue-50 text-blue-700 border-blue-200' },
      paid: { label: '已付', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      overdue: { label: '逾期', color: 'bg-rose-50 text-rose-700 border-rose-200' },
      cancelled: { label: '取消', color: 'bg-slate-50 text-slate-700 border-slate-200' }
    };
    return configs[status as keyof typeof configs];
  };

  // 获取货币符号
  const getCurrencySymbol = (currency: string) => {
    const symbols = { USD: '$', EUR: '€', GBP: '£', CNY: '¥' };
    return symbols[currency as keyof typeof symbols] || currency;
  };

  return (
    <div className="space-y-4">
      {/* 🔥 标题栏 - 参考业务员模块设计 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-blue-600" />
            财务管理中心
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            全流程财务监控与资金管理
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* 🔥 时间范围筛选器 */}
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="h-8 w-[100px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="q1" className="text-xs">Q1季度</SelectItem>
              <SelectItem value="q2" className="text-xs">Q2季度</SelectItem>
              <SelectItem value="q3" className="text-xs">Q3季度</SelectItem>
              <SelectItem value="q4" className="text-xs">Q4季度</SelectItem>
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
              <SelectItem value="all" className="text-xs">全部区域</SelectItem>
              <SelectItem value="NA" className="text-xs">🇺🇸 北美</SelectItem>
              <SelectItem value="EA" className="text-xs">🇪🇺 欧非</SelectItem>
              <SelectItem value="SA" className="text-xs">🇧🇷 南美</SelectItem>
            </SelectContent>
          </Select>

          {/* 🔥 业务类型筛选器 */}
          <Select value={selectedBusinessType} onValueChange={setSelectedBusinessType}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">全部业务</SelectItem>
              <SelectItem value="trading" className="text-xs">🛒 直接采购</SelectItem>
              <SelectItem value="inspection" className="text-xs">🔍 验货服务</SelectItem>
              <SelectItem value="agency" className="text-xs">🤝 代理服务</SelectItem>
              <SelectItem value="project" className="text-xs">🌟 一站式项目</SelectItem>
            </SelectContent>
          </Select>

          {/* 🔥 货币筛选器 */}
          <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
            <SelectTrigger className="h-8 w-[100px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">全部货币</SelectItem>
              <SelectItem value="USD" className="text-xs">💵 美元 USD</SelectItem>
              <SelectItem value="EUR" className="text-xs">💶 欧元 EUR</SelectItem>
              <SelectItem value="GBP" className="text-xs">💷 英镑 GBP</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            导出报表
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            刷新数据
          </Button>
        </div>
      </div>

      {/* 顶部信息栏 - 超紧凑布局 */}
      <div className="grid grid-cols-7 gap-2">
        {/* 统计卡片 */}
        <div className="bg-white border border-gray-200 rounded p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500">总收入</span>
            <DollarSign className="w-3 h-3 text-emerald-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">¥{(stats.totalRevenue / 10000).toFixed(1)}万</p>
          <p className="text-[10px] text-gray-500 mt-0.5">已收款（CNY）</p>
        </div>

        <div className="bg-white border border-gray-200 rounded p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500">应收</span>
            <Wallet className="w-3 h-3 text-blue-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">${(stats.totalReceivables / 1000).toFixed(0)}K</p>
          <p className="text-[10px] text-gray-500 mt-0.5">待收款</p>
        </div>

        <div className="bg-white border border-gray-200 rounded p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500">逾期</span>
            <AlertCircle className="w-3 h-3 text-rose-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.overduePayments}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">需跟进</p>
        </div>

        <div className="bg-white border border-gray-200 rounded p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500">利润率</span>
            <TrendingUp className="w-3 h-3 text-purple-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.avgProfitMargin.toFixed(1)}%</p>
          <p className="text-[10px] text-gray-500 mt-0.5">平均毛利</p>
        </div>

        {/* 汇率卡片 */}
        {exchangeRates.map((rate) => (
          <div key={rate.currency} className="bg-white border border-gray-200 rounded p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-500">{rate.currency}/CNY</span>
              <Globe className="w-3 h-3 text-indigo-600" />
            </div>
            <p className="text-lg font-bold text-gray-900">{rate.rate.toFixed(2)}</p>
            <div className={`flex items-center gap-0.5 text-[10px] mt-0.5 ${rate.change24h >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {rate.change24h >= 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
              {Math.abs(rate.change24h)}%
            </div>
          </div>
        ))}
      </div>

      {/* 主内容区 */}
      <div className="bg-white border border-gray-200 rounded">
        {/* 标签页 */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <div className="border-b border-gray-200 px-3">
            <TabsList className="bg-transparent h-auto p-0 gap-4">
              {/* 🔥 前台财务标签（销售、CEO、CFO、财务可见） */}
              {canViewFrontOfficeFinance() && (
                <>
                  <TabsTrigger 
                    value="payments" 
                    className="bg-transparent border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:text-emerald-700 rounded-none px-0 pb-2 pt-2 text-[11px] font-medium"
                  >
                    <CreditCard className="w-3 h-3 mr-1" />
                    收款管理
                  </TabsTrigger>
                  <TabsTrigger 
                    value="receivables" 
                    className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-700 rounded-none px-0 pb-2 pt-2 text-[11px] font-medium"
                  >
                    <Wallet className="w-3 h-3 mr-1" />
                    应收账款
                  </TabsTrigger>
                  <TabsTrigger 
                    value="invoices" 
                    className="bg-transparent border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent data-[state=active]:text-purple-700 rounded-none px-0 pb-2 pt-2 text-[11px] font-medium"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    发票管理
                  </TabsTrigger>
                  <TabsTrigger 
                    value="documents" 
                    className="bg-transparent border-b-2 border-transparent data-[state=active]:border-cyan-600 data-[state=active]:bg-transparent data-[state=active]:text-cyan-700 rounded-none px-0 pb-2 pt-2 text-[11px] font-medium"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    单证中心
                  </TabsTrigger>
                  <TabsTrigger 
                    value="profit" 
                    className="bg-transparent border-b-2 border-transparent data-[state=active]:border-orange-600 data-[state=active]:bg-transparent data-[state=active]:text-orange-700 rounded-none px-0 pb-2 pt-2 text-[11px] font-medium"
                  >
                    <PieChart className="w-3 h-3 mr-1" />
                    利润分析
                  </TabsTrigger>
                  <TabsTrigger 
                    value="reports" 
                    className="bg-transparent border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:text-indigo-700 rounded-none px-0 pb-2 pt-2 text-[11px] font-medium"
                  >
                    <BarChart3 className="w-3 h-3 mr-1" />
                    财务报表
                  </TabsTrigger>
                </>
              )}
              
              {/* 🔥 后台财务标签（采购、CEO、CFO、财务可见） */}
              {canViewBackOfficeFinance() && (
                <>
                  <TabsTrigger 
                    value="payables" 
                    className="bg-transparent border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:bg-transparent data-[state=active]:text-red-700 rounded-none px-0 pb-2 pt-2 text-[18px] font-medium"
                  >
                    <DollarSign className="w-4 h-4 mr-1.5" />
                    应付账款
                  </TabsTrigger>
                  <TabsTrigger 
                    value="payment-records" 
                    className="bg-transparent border-b-2 border-transparent data-[state=active]:border-pink-600 data-[state=active]:bg-transparent data-[state=active]:text-pink-700 rounded-none px-0 pb-2 pt-2 text-[18px] font-medium"
                  >
                    <CreditCard className="w-4 h-4 mr-1.5" />
                    付款记录
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </div>

          {/* 收款管理标签页 - 🔥 使用真实收款管理组件 */}
          <TabsContent value="payments" className="m-0 p-4">
            <CollectionManagement />
          </TabsContent>

          {/* 应收账款标签页 - 🔥 使用真实数据 */}
          <TabsContent value="receivables" className="m-0 p-4">
            <AccountsReceivableList />
          </TabsContent>

          {/* 发票管理标签页 - 🔥 使用真实发票管理组件 */}
          <TabsContent value="invoices" className="m-0 p-4">
            <InvoiceManagement />
          </TabsContent>

          {/* 单证中心标签页 - 🔥 财务只读视图 */}
          <TabsContent value="documents" className="m-0 p-4">
            <DocumentCenter userRole="finance" />
          </TabsContent>

          {/* 利润分析标签页 */}
          <TabsContent value="profit" className="m-0">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <Input
                    placeholder="搜索订单号、客户..."
                    className="pl-7 h-7 text-[11px] border-gray-300"
                  />
                </div>
                <Select>
                  <SelectTrigger className="w-[100px] h-7 text-[11px] border-gray-300">
                    <SelectValue placeholder="排序" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high" style={{ fontSize: '11px' }}>高→低</SelectItem>
                    <SelectItem value="low" style={{ fontSize: '11px' }}>低→高</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">订单号</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">客户</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">收入</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">成本</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">利润</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">利润率</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profitAnalysis.map((profit) => (
                    <TableRow key={profit.orderNumber} className="hover:bg-gray-50">
                      <TableCell className="py-1.5">
                        <p className="text-[11px] font-medium text-blue-600">{profit.orderNumber}</p>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <p className="text-[11px] text-gray-900">{profit.customerName}</p>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <p className="text-[11px] text-gray-900">
                          {getCurrencySymbol(profit.currency)}{profit.revenue.toLocaleString()}
                        </p>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <p className="text-[11px] text-gray-600">
                          {getCurrencySymbol(profit.currency)}{profit.cost.toLocaleString()}
                        </p>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <p className="text-[11px] font-bold text-emerald-600">
                          {getCurrencySymbol(profit.currency)}{profit.profit.toLocaleString()}
                        </p>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-12">
                            <Progress value={profit.profitMargin} className="h-1" />
                          </div>
                          <Badge className={`h-4 px-1.5 text-[10px] border ${
                            profit.profitMargin >= 35 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            profit.profitMargin >= 30 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {profit.profitMargin.toFixed(1)}%
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="py-1.5 text-right">
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]">
                          详情
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* 财务报表标签页 */}
          <TabsContent value="reports" className="m-0">
            <div className="p-3 space-y-2">
              <div className="grid grid-cols-4 gap-2">
                {/* 月度收入 */}
                <div className="bg-white border border-gray-200 rounded p-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-gray-600 font-medium">月度收入</span>
                    <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <p className="text-xl font-bold text-gray-900">¥118.5万</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">2025年11月</p>
                  <div className="mt-1.5 flex items-center gap-1">
                    <ArrowUpRight className="w-2.5 h-2.5 text-emerald-600" />
                    <span className="text-[10px] text-emerald-600">环比 +15.3%</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-2 h-6 text-[10px] border-gray-300">
                    <Download className="w-2.5 h-2.5 mr-1" />
                    导出
                  </Button>
                </div>

                {/* 应收汇总 */}
                <div className="bg-white border border-gray-200 rounded p-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-gray-600 font-medium">应收汇总</span>
                    <Wallet className="w-3.5 h-3.5 text-orange-600" />
                  </div>
                  <p className="text-xl font-bold text-gray-900">$407K</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">待收款总额</p>
                  <div className="mt-1.5 space-y-0.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-600">正常</span>
                      <span className="text-gray-900 font-medium">$295K</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-600">逾期</span>
                      <span className="text-rose-600 font-medium">$112K</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-2 h-6 text-[10px] border-gray-300">
                    <Download className="w-2.5 h-2.5 mr-1" />
                    导出
                  </Button>
                </div>

                {/* 利润分析 */}
                <div className="bg-white border border-gray-200 rounded p-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-gray-600 font-medium">利润分析</span>
                    <PieChart className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-xl font-bold text-gray-900">31.8%</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">平均毛利率</p>
                  <div className="mt-1.5 space-y-0.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-600">总营收</span>
                      <span className="text-gray-900 font-medium">$483K</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-600">总利润</span>
                      <span className="text-emerald-600 font-medium">$150K</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-2 h-6 text-[10px] border-gray-300">
                    <Download className="w-2.5 h-2.5 mr-1" />
                    导出
                  </Button>
                </div>

                {/* 现金流 */}
                <div className="bg-white border border-gray-200 rounded p-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-gray-600 font-medium">现金流</span>
                    <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <p className="text-xl font-bold text-gray-900">¥81.9万</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">本月流入</p>
                  <div className="mt-1.5 space-y-0.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-600">定金</span>
                      <span className="text-gray-900 font-medium">¥46.5万</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-600">尾款</span>
                      <span className="text-gray-900 font-medium">¥35.4万</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-2 h-6 text-[10px] border-gray-300">
                    <Download className="w-2.5 h-2.5 mr-1" />
                    导出
                  </Button>
                </div>
              </div>

              {/* 快捷导出 */}
              <div className="bg-gray-50 border border-gray-200 rounded p-2.5">
                <p className="text-[11px] text-gray-600 font-medium mb-2">快捷导出</p>
                <div className="grid grid-cols-4 gap-2">
                  <Button variant="outline" size="sm" className="h-6 text-[10px] border-gray-300">
                    <FileText className="w-2.5 h-2.5 mr-1" />
                    年度报表
                  </Button>
                  <Button variant="outline" size="sm" className="h-6 text-[10px] border-gray-300">
                    <FileText className="w-2.5 h-2.5 mr-1" />
                    季度报表
                  </Button>
                  <Button variant="outline" size="sm" className="h-6 text-[10px] border-gray-300">
                    <Receipt className="w-2.5 h-2.5 mr-1" />
                    客户对账
                  </Button>
                  <Button variant="outline" size="sm" className="h-6 text-[10px] border-gray-300">
                    <FileText className="w-2.5 h-2.5 mr-1" />
                    税务报表
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 应付账款标签页 */}
          <TabsContent value="payables" className="m-0 p-4">
            <PayableManagement />
          </TabsContent>

          {/* 付款记录标签页 */}
          <TabsContent value="payment-records" className="m-0 p-4">
            <PaymentRecordManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}