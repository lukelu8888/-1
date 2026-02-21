// 🔥 供应商订单管理中心 - 台湾大厂专业版
// 整合：询价 → 报价 → 在制订单 → 历史订单

import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Checkbox } from '../ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { 
  LayoutGrid, FileText, Calculator, Package, Clock, CheckCircle2, 
  XCircle, AlertCircle, Search, Filter, Eye, Download, Printer,
  ArrowRight, TrendingUp, DollarSign, Calendar, Truck, Factory,
  Trash2, CheckSquare, FileCheck, Send, Archive, BarChart3, RefreshCw,
  Settings, TrendingDown, Receipt, Users, Activity, Percent, AlertTriangle,
  ChevronRight, Circle
} from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '../../contexts/UserContext';
import { useRFQs } from '../../contexts/RFQContext';
import SupplierRFQDocumentViewer from './SupplierRFQDocumentViewer';
import SupplierQuotationDocumentViewer from './SupplierQuotationDocumentViewer';
import SupplierQuotationEditor from './SupplierQuotationEditor';
import { createSupplierQuotationFromRFQ, saveSupplierQuotation } from '../../utils/createSupplierQuotationFromRFQ';
import { suppliersDatabase } from '../../data/suppliersData'; // 🔥 导入供应商数据库
import { SupplierRFQDebugger } from './SupplierRFQDebugger'; // 🔥 调试工具

// 🔥 供应商报价单接口（从localStorage读取）
interface SupplierQuotationItem {
  id: string;
  productName: string;
  modelNo: string;
  specification?: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  currency?: string;
  amount?: number;
  leadTime?: number;
  moq?: number;
  remarks?: string;
}

interface SupplierQuotation {
  id: string;
  quotationNo: string;
  sourceXJ?: string;
  sourceQR?: string;
  sourceRFQId?: string;
  customerName: string;
  customerCompany: string;
  customerContact?: string;
  customerEmail?: string;
  supplierCode: string;
  supplierName: string;
  supplierCompany: string;
  supplierContact?: string;
  supplierEmail: string;
  supplierPhone?: string;
  quotationDate: string;
  validUntil: string;
  currency: string;
  totalAmount: number;
  paymentTerms?: string;
  deliveryTerms?: string;
  packingTerms?: string;
  generalRemarks?: string;
  items: SupplierQuotationItem[];
  status: 'draft' | 'submitted' | 'accepted' | 'rejected' | 'completed';
  createdBy: string;
  createdDate: string;
  version: number;
}

// 🔥 统计数据接口
interface OrderStats {
  pendingRFQs: number;
  draftQuotations: number;
  submittedQuotations: number;
  activeOrders: number;
  completedOrders: number;
  totalValue: number;
}

export default function SupplierOrderManagementCenter() {
  const { user } = useUser();
  const { rfqs, getRFQsBySupplier, deleteRFQ, updateRFQ, addQuoteToRFQ, refreshMineFromBackend } = useRFQs();
  
  // 🔥 获取完整的供应商信息（从suppliersDatabase）
  const supplierInfo = useMemo(() => {
    if (!user?.email) return null;
    
    // 从数据库中查找匹配的供应商
    const supplier = suppliersDatabase.find(s => s.email === user.email);
    
    if (supplier) {
      return supplier;
    }
    
    // 如果找不到，返回基础信息
    return {
      email: user.email,
      name: user.company || user.name || '供应商',
      company: user.company || '供应商公司',
      contact: user.name || '联系人',
      phone: user.phone || '',
      address: user.address || '供应商地址'
    };
  }, [user]);
  
  // 🔥 从localStorage读取供应商报价单
  const [supplierQuotations, setSupplierQuotations] = useState<SupplierQuotation[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('supplierQuotations');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse supplier quotations:', e);
          return [];
        }
      }
    }
    return [];
  });
  
  // 🔥 定时刷新供应商报价数据（用于同步Admin端的接受/拒绝状态）
  React.useEffect(() => {
    const interval = setInterval(() => {
      const saved = localStorage.getItem('supplierQuotations');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSupplierQuotations(parsed);
        } catch (e) {
          console.error('Failed to parse supplier quotations:', e);
        }
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Tab状态
  const [activeTab, setActiveTab] = useState<'overview' | 'rfq' | 'quotation' | 'active-orders' | 'history'>('overview');

  // ✅ When supplier opens "客户需求", actively fetch from backend so Network shows the request.
  React.useEffect(() => {
    if (activeTab === 'rfq') {
      void refreshMineFromBackend({ force: true });
    }
  }, [activeTab, refreshMineFromBackend]);
  
  // 搜索和筛选
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  
  // 对话框状态
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [quotationDocumentViewerOpen, setQuotationDocumentViewerOpen] = useState(false);
  const [quotationEditorOpen, setQuotationEditorOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  
  // 🔥 内联编辑状态 - 用于表格行内编辑
  const [editingQuotationId, setEditingQuotationId] = useState<string | null>(null);
  
  // 批量选择
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 🔥 获取当前供应商的询价单
  const myRFQs = useMemo(() => {
    if (!user?.email) {
      console.log('⚠️ [供应商订单管理中心] 用户未登录，无法获取RFQ');
      return [];
    }
    console.log('🔍 [供应商订单管理中心] 正在获取RFQ，供应商邮箱:', user.email);
    const result = getRFQsBySupplier(user.email);
    console.log('📦 [供应商订单管理中心] 获取到的RFQ数量:', result.length);
    if (result.length > 0) {
      console.log('  - RFQ详情:', result.map(r => ({
        id: r.id,
        rfqNo: r.supplierRfqNo,
        status: r.status,
        supplier: r.supplierName
      })));
    }
    return result;
  }, [rfqs, user?.email, getRFQsBySupplier]);

  // 🔥 分类RFQ（客户需求池）
  const categorizedRFQs = useMemo(() => {
    console.log('🔍 [分类RFQ] 开始分类，总RFQ数:', myRFQs.length);
    
    // 🔥 修改：客户需求Tab显示所有待处理的RFQ（包括待报价和已下推）
    const pending = myRFQs.filter(rfq => {
      // 接受 'pending'、'sent' 和 'quoted' 状态
      const isPendingOrSent = rfq.status === 'pending' || rfq.status === 'sent' || rfq.status === 'quoted';
      // 排除已接受和已拒绝的
      const result = isPendingOrSent && rfq.status !== 'accepted' && rfq.status !== 'rejected';
      const myQuote = rfq.quotes?.find((q: any) => q.supplierCode === user?.email);
      console.log(`  - RFQ ${rfq.supplierRfqNo}: status=${rfq.status}, hasQuote=${!!myQuote}, 是否在客户需求=${result}`);
      return result;
    });
    
    const quoted = myRFQs.filter(rfq => {
      const myQuote = rfq.quotes?.find((q: any) => q.supplierCode === user?.email);
      return myQuote && rfq.status !== 'accepted' && rfq.status !== 'rejected';
    });
    
    const accepted = myRFQs.filter(rfq => rfq.status === 'accepted');
    
    console.log('📊 [分类结果] 客户需求:', pending.length, '已报价:', quoted.length, '已接受:', accepted.length);
    
    return { pending, quoted, accepted };
  }, [myRFQs, user?.email]);

  // 🔥 获取当前供应商的所有报价单
  const myQuotations = useMemo(() => {
    if (!user?.email) return [];
    return supplierQuotations.filter(q => q.supplierEmail === user.email);
  }, [supplierQuotations, user?.email]);

  // 🔥 统计数据
  const stats: OrderStats = useMemo(() => {
    // 待报价的RFQ（未提交报价的）
    const pendingRFQs = categorizedRFQs.pending.length;

    // 草稿报价单
    const draftQuotations = myQuotations.filter(q => q.status === 'draft');

    // 已提交报价单
    const submittedQuotations = myQuotations.filter(q => q.status === 'submitted' || q.status === 'accepted');

    // 在制订单（这里简化处理，实际应该从订单数据中获取）
    const activeOrders = categorizedRFQs.accepted.length;

    // 已完成订单
    const completedOrders = myQuotations.filter(q => q.status === 'completed');

    // 总订单金额
    const totalValue = myQuotations
      .filter(q => q.status === 'accepted' || q.status === 'completed')
      .reduce((sum, q) => sum + (q.totalAmount || 0), 0);

    return {
      pendingRFQs,
      draftQuotations: draftQuotations.length,
      submittedQuotations: submittedQuotations.length,
      activeOrders,
      completedOrders: completedOrders.length,
      totalValue
    };
  }, [categorizedRFQs, myQuotations, user?.email]);

  // 🔥 概览Tab状态
  const [overviewTab, setOverviewTab] = useState<'summary' | 'conversion' | 'analysis'>('summary');

  // 🔥 渲染概览Dashboard（订单全盘 - 台湾大厂风格）
  const renderOverview = () => (
    <div className="space-y-6">
      {/* 🔥 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">订单全盘</h2>
          <p className="text-sm text-slate-500 mt-1">Order Overview Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <Select defaultValue="month">
            <SelectTrigger className="w-32 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">本周</SelectItem>
              <SelectItem value="month">本月</SelectItem>
              <SelectItem value="quarter">本季度</SelectItem>
              <SelectItem value="year">本年度</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            刷新
          </Button>
        </div>
      </div>

      {/* 🔥 二级Tab导航 */}
      <Tabs value={overviewTab} onValueChange={(v: any) => setOverviewTab(v)}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="summary" className="gap-2">
            <LayoutGrid className="w-4 h-4" />
            综合概览
          </TabsTrigger>
          <TabsTrigger value="conversion" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            转化漏斗
          </TabsTrigger>
          <TabsTrigger value="analysis" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            业绩分析
          </TabsTrigger>
        </TabsList>

        {/* 综合概览Tab */}
        <TabsContent value="summary" className="space-y-6 mt-6">
          {/* 关键指标卡片 - 6个核心指标 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* 总询价 */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-2">总询价</p>
                  <div className="text-3xl font-bold text-slate-900">{myRFQs.length}</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-600">+12%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 总报价 */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-2">总报价</p>
                  <div className="text-3xl font-bold text-slate-900">{myQuotations.length}</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-600">+8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 总合同 */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-2">总合同</p>
                  <div className="text-3xl font-bold text-slate-900">{myQuotations.filter(q => q.status === 'accepted').length}</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-600">+5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 总订单 */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-2">总订单</p>
                  <div className="text-3xl font-bold text-slate-900">{stats.activeOrders}</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-600">+15%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 总收款 */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-2">总收款</p>
                  <div className="text-3xl font-bold text-slate-900">{stats.completedOrders}</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-600">+10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 赢单转化率 */}
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-orange-800 mb-2">赢单转化率</p>
                  <div className="text-3xl font-bold text-orange-900">
                    {myRFQs.length > 0 ? Math.round((myQuotations.filter(q => q.status === 'accepted').length / myRFQs.length) * 100) : 0}%
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <TrendingUp className="w-3 h-3 text-orange-700" />
                    <span className="text-xs text-orange-700">+3%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 每周业务趋势 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 趋势图 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>每周业务趋势</span>
                  <span className="text-xs text-slate-500 font-normal">Weekly Trend</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-2 pb-8 relative">
                  {/* Y轴刻度 */}
                  <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-slate-400">
                    <span>80</span>
                    <span>60</span>
                    <span>40</span>
                    <span>20</span>
                    <span>0</span>
                  </div>
                  
                  {/* 柱状图 */}
                  <div className="flex-1 flex items-end justify-around gap-4 pl-8">
                    {[
                      { week: 'W1', inquiries: 58, quotations: 42 },
                      { week: 'W2', inquiries: 62, quotations: 45 },
                      { week: 'W3', inquiries: 64, quotations: 48 },
                      { week: 'W4', inquiries: 64, quotations: 51 }
                    ].map((data, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex items-end justify-center gap-1" style={{ height: '200px' }}>
                          {/* 询价柱 */}
                          <div 
                            className="flex-1 bg-slate-300 rounded-t relative group cursor-pointer transition-all hover:bg-slate-400"
                            style={{ height: `${(data.inquiries / 80) * 100}%` }}
                          >
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-xs font-medium text-slate-700">{data.inquiries}</span>
                            </div>
                          </div>
                          {/* 报价柱 */}
                          <div 
                            className="flex-1 bg-orange-500 rounded-t relative group cursor-pointer transition-all hover:bg-orange-600"
                            style={{ height: `${(data.quotations / 80) * 100}%` }}
                          >
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-xs font-medium text-orange-700">{data.quotations}</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-slate-600 font-medium">{data.week}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* 图例 */}
                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-slate-300 rounded"></div>
                    <span className="text-xs text-slate-600">询价</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded"></div>
                    <span className="text-xs text-slate-600">报价</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 产品类别分布 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>产品类别分布</span>
                  <span className="text-xs text-slate-500 font-normal">Category Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: '电气产品', orders: 45, amount: 680000, percentage: 38, color: 'bg-blue-500' },
                    { name: '卫浴产品', orders: 32, amount: 520000, percentage: 28, color: 'bg-green-500' },
                    { name: '门窗配件', orders: 28, amount: 420000, percentage: 24, color: 'bg-orange-500' },
                    { name: '劳保用品', orders: 12, amount: 180000, percentage: 10, color: 'bg-purple-500' }
                  ].map((category, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded ${category.color}`}></div>
                          <span className="text-sm font-medium text-slate-700">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-slate-900">{category.orders} 订单</span>
                          <span className="text-xs text-slate-500 ml-2">¥{(category.amount / 1000).toFixed(0)}K</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full ${category.color} transition-all duration-500`}
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 转化漏斗Tab */}
        <TabsContent value="conversion" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">订单转化漏斗</CardTitle>
              <CardDescription>从询价到成交的完整转化路径</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-2xl mx-auto py-8">
                {[
                  { label: '询价', count: myRFQs.length, percentage: 100, color: 'bg-blue-500' },
                  { label: '报价', count: myQuotations.length, percentage: myRFQs.length > 0 ? Math.round((myQuotations.length / myRFQs.length) * 100) : 0, color: 'bg-indigo-500' },
                  { label: '合同', count: myQuotations.filter(q => q.status === 'accepted').length, percentage: myRFQs.length > 0 ? Math.round((myQuotations.filter(q => q.status === 'accepted').length / myRFQs.length) * 100) : 0, color: 'bg-purple-500' },
                  { label: '订单', count: stats.activeOrders, percentage: myRFQs.length > 0 ? Math.round((stats.activeOrders / myRFQs.length) * 100) : 0, color: 'bg-pink-500' },
                  { label: '完成', count: stats.completedOrders, percentage: myRFQs.length > 0 ? Math.round((stats.completedOrders / myRFQs.length) * 100) : 0, color: 'bg-green-500' }
                ].map((stage, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">{stage.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-slate-900">{stage.count}</span>
                        <span className="text-sm text-slate-500 w-12 text-right">{stage.percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full ${stage.color} transition-all duration-700 ease-out`}
                        style={{ width: `${stage.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 业绩分析Tab */}
        <TabsContent value="analysis" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 月度业绩 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">月度业绩趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-slate-500">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>月度业绩数据图表</p>
                </div>
              </CardContent>
            </Card>

            {/* 产品分析 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">热销产品排行</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-slate-500">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>产品销售排行榜</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  // 🔥 渲染询价单列表
  const renderRFQList = () => {
    const pendingRFQs = categorizedRFQs.pending;

    return (
      <div className="space-y-4">
        {/* 工具栏 */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="搜索询价单号、产品名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-9 text-sm">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待报价</SelectItem>
                <SelectItem value="quoted">已报价</SelectItem>
                <SelectItem value="accepted">已接受</SelectItem>
              </SelectContent>
            </Select>
            {/* 🔥 批量删除按钮 */}
            {selectedIds.length > 0 && (
              <Button 
                size="sm" 
                variant="destructive" 
                className="h-9 gap-2"
                onClick={() => {
                  if (window.confirm(`确定要删除选中的 ${selectedIds.length} 个询价单吗？\n\n⚠️ 此操作不可恢复！`)) {
                    selectedIds.forEach(id => {
                      deleteRFQ(id);
                    });
                    
                    toast.success(
                      <div className="space-y-1">
                        <p className="font-semibold">🗑️ 批量删除成功</p>
                        <p className="text-sm">已删除 {selectedIds.length} 个询价单</p>
                      </div>,
                      { duration: 3000 }
                    );
                    
                    setSelectedIds([]);
                  }
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                批量删除 ({selectedIds.length})
              </Button>
            )}
          </div>
        </div>

        {/* 表格 */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedIds.length === pendingRFQs.length && pendingRFQs.length > 0}
                    onCheckedChange={() => {
                      if (selectedIds.length === pendingRFQs.length) {
                        setSelectedIds([]);
                      } else {
                        setSelectedIds(pendingRFQs.map(rfq => rfq.id));
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="w-16">序号</TableHead>
                <TableHead className="w-40">询价单号</TableHead>
                <TableHead>产品信息</TableHead>
                <TableHead className="w-28 text-right">数量</TableHead>
                <TableHead className="w-32">截止日期</TableHead>
                <TableHead className="w-24">状态</TableHead>
                <TableHead className="w-40 text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingRFQs.length > 0 ? (
                pendingRFQs.map((rfq, index) => (
                  <TableRow key={rfq.id} className="hover:bg-slate-50">
                    <TableCell>
                      <Checkbox 
                        checked={selectedIds.includes(rfq.id)}
                        onCheckedChange={() => {
                          setSelectedIds(prev => 
                            prev.includes(rfq.id) 
                              ? prev.filter(id => id !== rfq.id)
                              : [...prev, rfq.id]
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">{index + 1}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-blue-600">{rfq.supplierRfqNo || rfq.rfqNumber}</p>
                        <p className="text-xs text-slate-500">{rfq.createdDate}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{rfq.productName || 'N/A'}</p>
                        <p className="text-xs text-slate-500">{rfq.modelNo || ''}</p>
                        {rfq.specification && (
                          <p className="text-xs text-slate-400">{rfq.specification}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-medium">{rfq.quantity?.toLocaleString() || 0}</span>
                      <span className="text-xs text-slate-500 ml-1">{rfq.unit || ''}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">{rfq.quotationDeadline}</span>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        // 🔥 检查是否已下推报价
                        const myQuote = rfq.quotes?.find((q: any) => q.supplierCode === user?.email);
                        if (myQuote) {
                          return (
                            <Badge className="bg-green-100 text-green-800 border-green-300">
                              已下推
                            </Badge>
                          );
                        } else {
                          return (
                            <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                              待报价
                            </Badge>
                          );
                        }
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {rfq.documentData && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                              setSelectedItem(rfq);
                              setDocumentViewerOpen(true);
                            }}
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            查看
                          </Button>
                        )}
                        {/* 🔥 根据是否已下推报价显示不同按钮 */}
                        {(() => {
                          const myQuote = rfq.quotes?.find((q: any) => q.supplierCode === user?.email);
                          const existingQuotation = supplierQuotations.find(q => 
                            q.sourceXJ === (rfq.supplierRfqNo || rfq.rfqNumber) &&
                            q.supplierEmail === user?.email
                          );
                          
                          if (myQuote || existingQuotation) {
                            // 已下推报价，显示"已下推"状态按钮（禁用）
                            return (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs border-green-300 text-green-700 bg-green-50 cursor-not-allowed opacity-75"
                                disabled
                              >
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                已下推
                              </Button>
                            );
                          } else {
                            // 未下推报价，显示"下推报价"按钮
                            return (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs border-orange-300 text-orange-700 hover:bg-orange-50"
                                onClick={() => {
                            // 🔥 下推报价 - 自动创建报价单并跳转到我的报价
                            try {
                              // 🔥 防止重复创建：检查是否已存在对应的报价单
                              const existingQuotation = supplierQuotations.find(q => 
                                q.sourceXJ === (rfq.supplierRfqNo || rfq.rfqNumber) &&
                                q.supplierEmail === user?.email
                              );

                              if (existingQuotation) {
                                toast.warning(
                                  <div className="space-y-1">
                                    <p className="font-semibold">⚠️ 报价单已存在</p>
                                    <p className="text-sm">询价单: {rfq.supplierRfqNo || rfq.rfqNumber}</p>
                                    <p className="text-sm">报价单: {existingQuotation.quotationNo}</p>
                                    <p className="text-xs text-slate-500 mt-1">正在跳转到我的报价...</p>
                                  </div>,
                                  { duration: 3000 }
                                );
                                
                                // 跳转到我的报价Tab
                                setTimeout(() => {
                                  setActiveTab('quotation');
                                }, 800);
                                return;
                              }

                              // 创建报价单（使用默认值）
                              console.log('🔍 创建报价单 - RFQ数据:', {
                                id: rfq.id,
                                rfqNumber: rfq.rfqNumber,
                                supplierRfqNo: rfq.supplierRfqNo,
                                productName: rfq.productName,
                                quantity: rfq.quantity,
                                unit: rfq.unit,
                                products: rfq.products, // 🔥 多产品数组
                                productsCount: rfq.products?.length || 0
                              });
                              
                              console.log('🔍 供应商信息:', {
                                email: supplierInfo?.email,
                                name: supplierInfo?.name,
                                company: supplierInfo?.company,
                                address: supplierInfo?.address,
                                phone: supplierInfo?.phone
                              });

                              const quotation = createSupplierQuotationFromRFQ(
                                rfq,
                                supplierInfo, // 🔥 传递完整的供应商信息对象
                                {
                                  unitPrice: 0, // 待填写
                                  leadTime: 30,
                                  moq: 1000,
                                  paymentTerms: 'T/T 30天',
                                  deliveryTerms: 'FOB 厦门',
                                  status: 'draft'
                                }
                              );

                              // 🔥 验证产品数量
                              console.log('✅ 报价单创建成功:', {
                                quotationNo: quotation.quotationNo,
                                itemsCount: quotation.items?.length || 0,
                                items: quotation.items
                              });

                              // 保存到localStorage
                              saveSupplierQuotation(quotation);
                              
                              // 更新本地状态
                              const updatedQuotations = [...supplierQuotations, quotation];
                              setSupplierQuotations(updatedQuotations);

                              // 🔥 将报价信息添加到RFQ的quotes数组中，标记为"已下推"
                              addQuoteToRFQ(rfq.id, {
                                supplierCode: supplierInfo?.email || user?.email || '',
                                supplierName: supplierInfo?.name || user?.username || '供应商',
                                quotedDate: new Date().toISOString().split('T')[0],
                                quotedPrice: quotation.totalAmount || 0,
                                currency: quotation.currency,
                                leadTime: quotation.items?.[0]?.leadTime || 30,
                                moq: quotation.items?.[0]?.moq || 1000,
                                validityDays: 30,
                                paymentTerms: quotation.paymentTerms || 'T/T 30天',
                                remarks: `报价单号: ${quotation.quotationNo}`
                              });

                              // 显示成功提示
                              toast.success(
                                <div className="space-y-1">
                                  <p className="font-semibold">✅ 报价单创建成功</p>
                                  <p className="text-sm">询价单: {rfq.supplierRfqNo || rfq.rfqNumber}</p>
                                  <p className="text-sm">报价单: {quotation.quotationNo}</p>
                                  <p className="text-xs text-slate-500 mt-1">状态已更新为"已下推"，正在跳转到我的报价...</p>
                                </div>,
                                { duration: 3000 }
                              );

                              // 跳转到我的报价Tab
                              setTimeout(() => {
                                setActiveTab('quotation');
                              }, 800);
                            } catch (error) {
                              console.error('创建报价单失败:', error);
                              toast.error('创建报价单失败，请重试');
                            }
                          }}
                        >
                          <Send className="w-3 h-3 mr-1" />
                          下推报价
                        </Button>
                            );
                          }
                        })()}
                        <Button
                          size="sm"
                          className="h-7 px-2 text-xs bg-orange-600 hover:bg-orange-700"
                          onClick={() => {
                            try {
                              const sourceXJ = rfq.supplierRfqNo || rfq.rfqNumber;
                              // Prefer existing draft quotation for this RFQ
                              const existingQuotation = supplierQuotations.find(q =>
                                q.sourceXJ === sourceXJ && q.supplierEmail === user?.email
                              );

                              if (existingQuotation) {
                                setSelectedQuotation(existingQuotation);
                                setQuotationEditorOpen(true);
                                return;
                              }

                              // Create a new draft quotation and open editor
                              const quotation = createSupplierQuotationFromRFQ(
                                rfq,
                                supplierInfo,
                                {
                                  unitPrice: 0,
                                  leadTime: 30,
                                  moq: 1000,
                                  paymentTerms: 'T/T 30天',
                                  deliveryTerms: 'FOB 厦门',
                                  status: 'draft',
                                }
                              );

                              saveSupplierQuotation(quotation);
                              const updatedQuotations = [...supplierQuotations, quotation];
                              setSupplierQuotations(updatedQuotations);

                              setSelectedQuotation(quotation);
                              setQuotationEditorOpen(true);
                            } catch (e) {
                              console.error('❌ 打开报价失败:', e);
                              toast.error('打开报价失败，请重试');
                            }
                          }}
                        >
                          <Calculator className="w-3 h-3 mr-1" />
                          报价
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <FileText className="w-12 h-12 mb-2" />
                      <p className="text-sm">暂无待报价询价单</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  };

  // 🔥 渲染报价单列表
  const renderQuotationList = () => {
    return (
      <div className="space-y-4">
        {/* 工具栏 */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="搜索报价单号、客户名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-9 text-sm">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="submitted">已提交</SelectItem>
                <SelectItem value="accepted">已接受</SelectItem>
              </SelectContent>
            </Select>
            {/* 🔥 批量删除按钮 */}
            {selectedIds.length > 0 && (
              <Button 
                size="sm" 
                variant="destructive" 
                className="h-9 gap-2"
                onClick={() => {
                  if (window.confirm(`确定要删除选中的 ${selectedIds.length} 个报价单吗？\n\n⚠️ 此操作不可恢复！`)) {
                    const updatedQuotations = supplierQuotations.filter(q => !selectedIds.includes(q.id));
                    setSupplierQuotations(updatedQuotations);
                    localStorage.setItem('supplierQuotations', JSON.stringify(updatedQuotations));
                    
                    toast.success(
                      <div className="space-y-1">
                        <p className="font-semibold">🗑️ 批量删除成功</p>
                        <p className="text-sm">已删除 {selectedIds.length} 个报价单</p>
                      </div>,
                      { duration: 3000 }
                    );
                    
                    setSelectedIds([]);
                  }
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                批量删除 ({selectedIds.length})
              </Button>
            )}
          </div>
        </div>

        {/* 表格 */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedIds.length === myQuotations.length && myQuotations.length > 0}
                    onCheckedChange={() => {
                      if (selectedIds.length === myQuotations.length) {
                        setSelectedIds([]);
                      } else {
                        setSelectedIds(myQuotations.map(q => q.id));
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="w-16">序号</TableHead>
                <TableHead className="w-40">报价单号</TableHead>
                <TableHead className="w-36">客户</TableHead>
                <TableHead>关联询价</TableHead>
                <TableHead className="w-32 text-right">报价金额</TableHead>
                <TableHead className="w-32">报价日期</TableHead>
                <TableHead className="w-24">状态</TableHead>
                <TableHead className="w-40 text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myQuotations.length > 0 ? (
                myQuotations.map((quotation, index) => (
                  <React.Fragment key={quotation.id}>
                    <TableRow className="hover:bg-slate-50">
                      <TableCell>
                        <Checkbox 
                          checked={selectedIds.includes(quotation.id)}
                        onCheckedChange={() => {
                          setSelectedIds(prev => 
                            prev.includes(quotation.id) 
                              ? prev.filter(id => id !== quotation.id)
                              : [...prev, quotation.id]
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">{index + 1}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-blue-600">{quotation.quotationNo}</p>
                        <p className="text-xs text-slate-500">v{quotation.version}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{quotation.customerName}</p>
                        <p className="text-xs text-slate-500">{quotation.customerCompany}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-slate-600">{quotation.sourceXJ || 'N/A'}</p>
                        <p className="text-xs text-slate-500">{quotation.sourceQR || ''}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-semibold text-green-600">
                        ¥{quotation.totalAmount?.toLocaleString() || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">{quotation.quotationDate}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        quotation.status === 'draft' 
                          ? 'bg-slate-100 text-slate-800 border-slate-300'
                          : quotation.status === 'submitted'
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : quotation.status === 'accepted'
                          ? 'bg-green-100 text-green-800 border-green-300'
                          : 'bg-slate-100 text-slate-800 border-slate-300'
                      }>
                        {quotation.status === 'draft' ? '草稿' 
                          : quotation.status === 'submitted' ? '已提交' 
                          : quotation.status === 'accepted' ? '已接受'
                          : quotation.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            setSelectedQuotation(quotation);
                            setQuotationDocumentViewerOpen(true);
                          }}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          查看
                        </Button>
                        {quotation.status === 'draft' && (
                          <Button
                            size="sm"
                            className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700"
                            onClick={() => {
                              setEditingQuotationId(quotation.id);
                            }}
                          >
                            <FileCheck className="w-3 h-3 mr-1" />
                            编辑
                          </Button>
                        )}
                        {quotation.status === 'draft' && (() => {
                          // 🔥 验证报价单是否填写完必填项
                          const isQuotationValid = () => {
                            // 检查所有产品是否都有有效的单价
                            const allPricesValid = quotation.items?.every((item: any) => {
                              return item.unitPrice && item.unitPrice > 0;
                            });
                            
                            // 检查交货期、MOQ（从第一个产品获取）
                            const firstItem = quotation.items?.[0];
                            const leadTimeValid = firstItem?.leadTime && firstItem.leadTime > 0;
                            const moqValid = firstItem?.moq && firstItem.moq > 0;
                            
                            // 检查付款条款和交货条款
                            const paymentTermsValid = quotation.paymentTerms && quotation.paymentTerms.trim().length > 0;
                            const deliveryTermsValid = quotation.deliveryTerms && quotation.deliveryTerms.trim().length > 0;
                            
                            return allPricesValid && leadTimeValid && moqValid && paymentTermsValid && deliveryTermsValid;
                          };

                          const isValid = isQuotationValid();
                          
                          return (
                            <Button
                              size="sm"
                              className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={!isValid}
                              onClick={() => {
                                if (!isValid) {
                                  toast.error(
                                    <div className="space-y-1">
                                      <p className="font-semibold">⚠️ 无法提交报价</p>
                                      <p className="text-sm">请先点击"编辑"按钮填写以下必填项：</p>
                                      <ul className="text-xs list-disc list-inside space-y-0.5">
                                        <li>所有产品的单价</li>
                                        <li>交货周期</li>
                                        <li>最小起订量(MOQ)</li>
                                        <li>付款方式</li>
                                        <li>交货条款</li>
                                      </ul>
                                    </div>,
                                    { duration: 5000 }
                                  );
                                  return;
                                }

                                // 🔥 提交报价单给COSUN
                                const updatedQuotation = {
                                  ...quotation,
                                  status: 'submitted' as const,
                                  submittedDate: new Date().toISOString().split('T')[0]
                                };
                                
                                // 更新localStorage
                                const storedQuotations = JSON.parse(localStorage.getItem('supplierQuotations') || '[]');
                                const updatedQuotations = storedQuotations.map((q: SupplierQuotation) => 
                                  q.id === quotation.id ? updatedQuotation : q
                                );
                                localStorage.setItem('supplierQuotations', JSON.stringify(updatedQuotations));
                                
                                // 更新本地状态
                                setSupplierQuotations(updatedQuotations);
                                
                                // 显示成功提示
                                toast.success(
                                  <div className="space-y-1">
                                    <p className="font-semibold">✅ 报价单已提交给COSUN采购</p>
                                    <p className="text-sm">报价单号: {quotation.quotationNo}</p>
                                    <p className="text-xs text-slate-500 mt-1">采购方将收到报价通知</p>
                                  </div>,
                                  { duration: 3000 }
                                );
                              }}
                            >
                              <Send className="w-3 h-3 mr-1" />
                              提交报价
                            </Button>
                          );
                        })()}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs hover:bg-orange-50 hover:text-orange-700"
                          onClick={() => {
                            toast.info(
                              <div className="space-y-1">
                                <p className="font-semibold">📥 准备下载报价单</p>
                                <p className="text-sm">报价单号: {quotation.quotationNo}</p>
                              </div>,
                              { duration: 2000 }
                            );
                            
                            // 🔥 下载报价单PDF
                            setTimeout(() => {
                              const printContent = document.createElement('div');
                              printContent.innerHTML = `
                                <div style="font-family: Arial, sans-serif; padding: 20px;">
                                  <h2>供应商报价单</h2>
                                  <p><strong>报价单号:</strong> ${quotation.quotationNo}</p>
                                  <p><strong>客户:</strong> ${quotation.customerName}</p>
                                  <p><strong>报价日期:</strong> ${quotation.quotationDate}</p>
                                  <p><strong>有效期至:</strong> ${quotation.validUntil}</p>
                                  <hr/>
                                  <h3>产品清单</h3>
                                  ${quotation.items.map((item: any) => `
                                    <div style="margin: 10px 0; padding: 10px; border: 1px solid #ddd;">
                                      <p><strong>${item.productName}</strong></p>
                                      <p>型号: ${item.modelNo}</p>
                                      <p>数量: ${item.quantity} ${item.unit}</p>
                                      <p>单价: ¥${item.unitPrice || 0}</p>
                                      <p>金额: ¥${item.amount || 0}</p>
                                    </div>
                                  `).join('')}
                                  <hr/>
                                  <h3 style="text-align: right;">总金额: ¥${quotation.totalAmount?.toLocaleString()}</h3>
                                </div>
                              `;
                              
                              const printWindow = window.open('', '', 'width=800,height=600');
                              if (printWindow) {
                                printWindow.document.write(printContent.innerHTML);
                                printWindow.document.close();
                                printWindow.print();
                              }
                            }, 300);
                          }}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  {/* 🔥 内联编辑器展开行 */}
                  {editingQuotationId === quotation.id && (
                    <TableRow>
                      <TableCell colSpan={9} className="bg-slate-50 p-6">
                        <SupplierQuotationEditor
                          quotation={quotation}
                          onSave={(updatedQuotation) => {
                            // 更新localStorage
                            saveSupplierQuotation(updatedQuotation);
                            
                            // 更新本地状态
                            const updatedQuotations = supplierQuotations.map(q =>
                              q.quotationNo === updatedQuotation.quotationNo ? updatedQuotation : q
                            );
                            setSupplierQuotations(updatedQuotations);
                            
                            // 关闭编辑模式
                            setEditingQuotationId(null);
                          }}
                          onCancel={() => setEditingQuotationId(null)}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Calculator className="w-12 h-12 mb-2" />
                      <p className="text-sm">暂无报价单</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  };

  // 🔥 渲染在制订单列表
  const renderActiveOrders = () => {
    const activeOrders = categorizedRFQs.accepted;

    return (
      <div className="space-y-4">
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedIds.length === activeOrders.length && activeOrders.length > 0}
                    onCheckedChange={() => {
                      if (selectedIds.length === activeOrders.length) {
                        setSelectedIds([]);
                      } else {
                        setSelectedIds(activeOrders.map(o => o.id));
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="w-16">序号</TableHead>
                <TableHead className="w-40">订单号</TableHead>
                <TableHead>产品信息</TableHead>
                <TableHead className="w-32">生产进度</TableHead>
                <TableHead className="w-32">预计交期</TableHead>
                <TableHead className="w-24">状态</TableHead>
                <TableHead className="w-32 text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeOrders.length > 0 ? (
                activeOrders.map((order, index) => (
                  <TableRow key={order.id} className="hover:bg-slate-50">
                    <TableCell>
                      <Checkbox 
                        checked={selectedIds.includes(order.id)}
                        onCheckedChange={() => {
                          setSelectedIds(prev => 
                            prev.includes(order.id) 
                              ? prev.filter(id => id !== order.id)
                              : [...prev, order.id]
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">{index + 1}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-blue-600">{order.rfqNumber}</p>
                        <p className="text-xs text-slate-500">{order.createdDate}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{order.productName || 'N/A'}</p>
                        <p className="text-xs text-slate-500">{order.quantity} {order.unit}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">生产中</span>
                          <span className="font-medium text-blue-600">60%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                          <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '60%' }}></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">{order.expectedDate}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        生产中
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                          <Eye className="w-3 h-3 mr-1" />
                          详情
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Package className="w-12 h-12 mb-2" />
                      <p className="text-sm">暂无在制订单</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  };

  // 🔥 渲染历史订单列表
  const renderHistoryOrders = () => {
    const completedOrders = myQuotations.filter(q => q.status === 'completed');

    return (
      <div className="space-y-4">
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedIds.length === completedOrders.length && completedOrders.length > 0}
                    onCheckedChange={() => {
                      if (selectedIds.length === completedOrders.length) {
                        setSelectedIds([]);
                      } else {
                        setSelectedIds(completedOrders.map(o => o.id));
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="w-16">序号</TableHead>
                <TableHead className="w-40">订单号</TableHead>
                <TableHead className="w-36">客户</TableHead>
                <TableHead>产品信息</TableHead>
                <TableHead className="w-32 text-right">订单金额</TableHead>
                <TableHead className="w-32">完成日期</TableHead>
                <TableHead className="w-32 text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedOrders.length > 0 ? (
                completedOrders.map((order, index) => (
                  <TableRow key={order.id} className="hover:bg-slate-50">
                    <TableCell>
                      <Checkbox 
                        checked={selectedIds.includes(order.id)}
                        onCheckedChange={() => {
                          setSelectedIds(prev => 
                            prev.includes(order.id) 
                              ? prev.filter(id => id !== order.id)
                              : [...prev, order.id]
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">{index + 1}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-blue-600">{order.quotationNo}</p>
                        <p className="text-xs text-slate-500">{order.quotationDate}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{order.customerName}</p>
                        <p className="text-xs text-slate-500">{order.customerCompany}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-slate-600">{order.items?.length || 0} 个产品</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-semibold text-slate-900">
                        ¥{order.totalAmount?.toLocaleString() || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">{order.createdDate}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                          <Eye className="w-3 h-3 mr-1" />
                          查看
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Archive className="w-12 h-12 mb-2" />
                      <p className="text-sm">暂无历史订单</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-orange-600" />
            订单管理中心
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            询价 → 报价 → 订单全流程管理
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            导出报表
          </Button>
          <Button size="sm" variant="outline" className="gap-2">
            <Printer className="w-4 h-4" />
            打印
          </Button>
        </div>
      </div>

      {/* Tab导航 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 bg-slate-100 p-1 h-auto">
          <TabsTrigger value="overview" className="gap-2 py-2.5 data-[state=active]:bg-white">
            <LayoutGrid className="w-4 h-4" />
            <div className="text-left">
              <p className="text-sm font-medium">概览</p>
              <p className="text-xs opacity-75">Overview</p>
            </div>
          </TabsTrigger>
          <TabsTrigger value="rfq" className="gap-2 py-2.5 data-[state=active]:bg-white">
            <FileText className="w-4 h-4" />
            <div className="text-left">
              <p className="text-sm font-medium">客户需求</p>
              <p className="text-xs opacity-75">RFQ · {stats.pendingRFQs}</p>
            </div>
          </TabsTrigger>
          <TabsTrigger value="quotation" className="gap-2 py-2.5 data-[state=active]:bg-white">
            <Calculator className="w-4 h-4" />
            <div className="text-left">
              <p className="text-sm font-medium">我的报价</p>
              <p className="text-xs opacity-75">Quotation · {myQuotations.length}</p>
            </div>
          </TabsTrigger>
          <TabsTrigger value="active-orders" className="gap-2 py-2.5 data-[state=active]:bg-white">
            <Factory className="w-4 h-4" />
            <div className="text-left">
              <p className="text-sm font-medium">在制订单</p>
              <p className="text-xs opacity-75">Active · {stats.activeOrders}</p>
            </div>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 py-2.5 data-[state=active]:bg-white">
            <Archive className="w-4 h-4" />
            <div className="text-left">
              <p className="text-sm font-medium">历史订单</p>
              <p className="text-xs opacity-75">History · {stats.completedOrders}</p>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="rfq" className="mt-6">
          {renderRFQList()}
        </TabsContent>

        <TabsContent value="quotation" className="mt-6">
          {renderQuotationList()}
        </TabsContent>

        <TabsContent value="active-orders" className="mt-6">
          {renderActiveOrders()}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {renderHistoryOrders()}
        </TabsContent>
      </Tabs>

      {/* 文档查看对话框 */}
      <Dialog open={documentViewerOpen} onOpenChange={setDocumentViewerOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>询价单文档</DialogTitle>
            <DialogDescription>完整的询价单文档，包含产品清单、商务条款和技术要求</DialogDescription>
          </DialogHeader>
          {selectedItem && <SupplierRFQDocumentViewer rfq={selectedItem} />}
        </DialogContent>
      </Dialog>

      {/* 详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>报价单详情</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              {/* 报价单详细信息 */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-600">报价单号</p>
                  <p className="font-medium">{selectedItem.quotationNo}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">客户</p>
                  <p className="font-medium">{selectedItem.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">报价日期</p>
                  <p className="font-medium">{selectedItem.quotationDate}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">有效期至</p>
                  <p className="font-medium">{selectedItem.validUntil}</p>
                </div>
              </div>
              
              {/* 产品列表 */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">产品清单</h4>
                <div className="space-y-2">
                  {selectedItem.items?.map((item: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-xs text-slate-500">{item.modelNo}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{item.quantity} {item.unit}</p>
                          {item.unitPrice && (
                            <p className="text-xs text-slate-500">¥{item.unitPrice}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 总金额 */}
              <div className="border-t pt-4 flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-slate-600">报价总金额</p>
                  <p className="text-2xl font-bold text-green-600">
                    ¥{selectedItem.totalAmount?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 🔥 报价单文档查看器对话框 */}
      <Dialog open={quotationDocumentViewerOpen} onOpenChange={setQuotationDocumentViewerOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>报价单文档</DialogTitle>
            <DialogDescription>完整的供应商报价单文档，包含产品报价、交货条款和付款方式</DialogDescription>
          </DialogHeader>
          {selectedQuotation && (
            <SupplierQuotationDocumentViewer 
              quotation={selectedQuotation}
              onEdit={() => {
                // 🔥 关闭查看对话框，打开编辑对话框
                setQuotationDocumentViewerOpen(false);
                setQuotationEditorOpen(true);
              }}
              onSubmit={() => {
                // 🔥 提交报价单给COSUN
                const updatedQuotation = {
                  ...selectedQuotation,
                  status: 'submitted' as const,
                  submittedDate: new Date().toISOString().split('T')[0]
                };
                
                // 更新localStorage
                const storedQuotations = JSON.parse(localStorage.getItem('supplierQuotations') || '[]');
                const updatedQuotations = storedQuotations.map((q: SupplierQuotation) => 
                  q.id === selectedQuotation.id ? updatedQuotation : q
                );
                localStorage.setItem('supplierQuotations', JSON.stringify(updatedQuotations));
                
                // 更新本地状态
                setSupplierQuotations(updatedQuotations);
                
                // 关闭对话框
                setQuotationDocumentViewerOpen(false);
                
                // 显示成功提示
                toast.success(
                  <div className="space-y-1">
                    <p className="font-semibold">✅ 报价单已提交给COSUN采购</p>
                    <p className="text-sm">报价单号: {selectedQuotation.quotationNo}</p>
                    <p className="text-xs text-slate-500 mt-1">采购方将收到报价通知</p>
                  </div>,
                  { duration: 3000 }
                );
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 🔥 报价单编辑对话框 */}
      <Dialog open={quotationEditorOpen} onOpenChange={setQuotationEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑报价单</DialogTitle>
            <DialogDescription>修改报价单详情并提交</DialogDescription>
          </DialogHeader>
          {selectedQuotation && (
            <SupplierQuotationEditor
              quotation={selectedQuotation}
              onSave={(updatedQuotation) => {
                // 更新localStorage
                saveSupplierQuotation(updatedQuotation);
                
                // 更新本地状态
                const updatedQuotations = supplierQuotations.map(q =>
                  q.quotationNo === updatedQuotation.quotationNo ? updatedQuotation : q
                );
                setSupplierQuotations(updatedQuotations);
                
                // 🔥 更新选中的报价单（确保文档视图能读取到最新数据）
                setSelectedQuotation(updatedQuotation);
                
                // 关闭对话框
                setQuotationEditorOpen(false);
              }}
              onCancel={() => setQuotationEditorOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 🔥 RFQ数据流转调试工具 */}
      <SupplierRFQDebugger />
    </div>
  );
}