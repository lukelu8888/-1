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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from '../ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { 
  LayoutGrid, FileText, Calculator, Package, Clock, CheckCircle2, 
  XCircle, AlertCircle, Search, Filter, Eye, Download, Printer,
  ArrowRight, TrendingUp, DollarSign, Calendar, Truck, Factory,
  Trash2, CheckSquare, FileCheck, Send, Archive, BarChart3, RefreshCw,
  Settings, TrendingDown, Receipt, Users, Activity, Percent, AlertTriangle,
  ChevronRight, Circle, X as XIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '../../contexts/UserContext';
import { useXJs } from '../../contexts/XJContext';
import XJDocumentViewer from './XJDocumentViewer';
import SupplierQuotationDocumentViewer from './SupplierQuotationDocumentViewer';
import SupplierQuotationEditor from './SupplierQuotationEditor';
import { createQuotationFromXJ, saveSupplierQuotation } from '../../utils/createQuotationFromXJ';
import { supplierQuotationService } from '../../lib/supabaseService';
import { suppliersDatabase } from '../../data/suppliersData'; // 🔥 导入供应商数据库

// 供应商报价单接口（数据源：Supabase supplier_quotations 表）
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
  const { xjs, getXJsBySupplier, deleteXJ, updateXJ, addQuoteToXJ, refreshMineFromBackend } = useXJs();
  
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
  
  // 🔥 供应商报价单 — Supabase-first
  const [supplierQuotations, setSupplierQuotations] = useState<SupplierQuotation[]>([]);

  // 从 Supabase 加载当前供应商的报价单，并定期刷新同步状态
  React.useEffect(() => {
    if (!user?.email) return;
    const load = async () => {
      try {
        const rows = await supplierQuotationService.getBySupplierEmail(user.email);
        setSupplierQuotations(Array.isArray(rows) ? (rows as SupplierQuotation[]) : []);
      } catch (e: any) {
        console.warn('⚠️ [SupplierOrderMgmt] 加载报价单失败:', e?.message);
      }
    };
    void load();
    const interval = setInterval(load, 10000); // 每10秒刷新
    return () => clearInterval(interval);
  }, [user?.email]);
  
  // Tab状态
  const [activeTab, setActiveTab] = useState<'overview' | 'xj' | 'quotation' | 'active-orders' | 'history'>('overview');

  // ✅ When supplier opens "客户需求", actively fetch from backend so Network shows the request.
  React.useEffect(() => {
    if (activeTab === 'xj') {
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
  
  // 核算报价弹窗状态（editingQuotationId 驱动，quotationEditorOpen 已在上方声明）
  const [editingQuotationId, setEditingQuotationId] = useState<string | null>(null);

  const openQuotationEditor = (id: string) => {
    // Set the quotation to edit, then reuse the existing quotationEditorOpen dialog
    const q = supplierQuotations.find(sq => sq.id === id) ?? null;
    setSelectedQuotation(q);
    setEditingQuotationId(id);
    setQuotationEditorOpen(true);
  };
  const closeQuotationEditor = () => {
    setQuotationEditorOpen(false);
    setEditingQuotationId(null);
  };
  
  // 批量选择
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 🔥 获取当前供应商的询价单
  const myXJs = useMemo(() => {
    if (!user?.email) {
      console.log('⚠️ [供应商订单管理中心] 用户未登录，无法获取采购询价');
      return [];
    }
    console.log('🔍 [供应商订单管理中心] 正在获取采购询价，供应商邮箱:', user.email);
    const result = getXJsBySupplier(user.email);
    console.log('📦 [供应商订单管理中心] 获取到的采购询价数量:', result.length);
    if (result.length > 0) {
      console.log('  - 采购询价详情:', result.map(r => ({
        id: r.id,
        xjNo: r.supplierXjNo,
        status: r.status,
        supplier: r.supplierName
      })));
    }
    return result;
  }, [xjs, user?.email, getXJsBySupplier]);

  // 🔥 分类采购询价（客户需求池）
  const categorizedRFQs = useMemo(() => {
    console.log('🔍 [分类采购询价] 开始分类，总采购询价数:', myXJs.length);
    
    // 🔥 修改：客户需求Tab显示所有待处理的采购询价（包括待报价和已下推）
    const pending = myXJs.filter(xj => {
      // 接受 'pending'、'sent' 和 'quoted' 状态
      const isPendingOrSent = xj.status === 'pending' || xj.status === 'sent' || xj.status === 'quoted';
      // 排除已接受和已拒绝的
      const result = isPendingOrSent && xj.status !== 'accepted' && xj.status !== 'rejected';
      const myQuote = xj.quotes?.find((q: any) => q.supplierCode === user?.email);
      console.log(`  - 采购询价 ${xj.supplierXjNo}: status=${xj.status}, hasQuote=${!!myQuote}, 是否在客户需求=${result}`);
      return result;
    });
    
    const quoted = myXJs.filter(xj => {
      const myQuote = xj.quotes?.find((q: any) => q.supplierCode === user?.email);
      return myQuote && xj.status !== 'accepted' && xj.status !== 'rejected';
    });
    
    const accepted = myXJs.filter(xj => xj.status === 'accepted');
    
    console.log('📊 [分类结果] 客户需求:', pending.length, '已报价:', quoted.length, '已接受:', accepted.length);
    
    return { pending, quoted, accepted };
  }, [myXJs, user?.email]);

  // 🔥 获取当前供应商的所有报价单
  const myQuotations = useMemo(() => {
    if (!user?.email) return [];
    return supplierQuotations.filter(q => q.supplierEmail === user.email);
  }, [supplierQuotations, user?.email]);

  // 🔥 统计数据
  const stats: OrderStats = useMemo(() => {
    // 待报价的采购询价（未提交报价的）
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
                  <div className="text-3xl font-bold text-slate-900">{myXJs.length}</div>
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
                    {myXJs.length > 0 ? Math.round((myQuotations.filter(q => q.status === 'accepted').length / myXJs.length) * 100) : 0}%
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
                  { label: '询价', count: myXJs.length, percentage: 100, color: 'bg-blue-500' },
                  { label: '报价', count: myQuotations.length, percentage: myXJs.length > 0 ? Math.round((myQuotations.length / myXJs.length) * 100) : 0, color: 'bg-indigo-500' },
                  { label: '合同', count: myQuotations.filter(q => q.status === 'accepted').length, percentage: myXJs.length > 0 ? Math.round((myQuotations.filter(q => q.status === 'accepted').length / myXJs.length) * 100) : 0, color: 'bg-purple-500' },
                  { label: '订单', count: stats.activeOrders, percentage: myXJs.length > 0 ? Math.round((stats.activeOrders / myXJs.length) * 100) : 0, color: 'bg-pink-500' },
                  { label: '完成', count: stats.completedOrders, percentage: myXJs.length > 0 ? Math.round((stats.completedOrders / myXJs.length) * 100) : 0, color: 'bg-green-500' }
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
                      deleteXJ(id);
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
                        setSelectedIds(pendingRFQs.map(xj => xj.id));
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
                pendingRFQs.map((xj, index) => (
                  <TableRow key={xj.id} className="hover:bg-slate-50">
                    <TableCell>
                      <Checkbox 
                        checked={selectedIds.includes(xj.id)}
                        onCheckedChange={() => {
                          setSelectedIds(prev => 
                            prev.includes(xj.id) 
                              ? prev.filter(id => id !== xj.id)
                              : [...prev, xj.id]
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">{index + 1}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-blue-600">{xj.supplierXjNo || xj.xjNumber}</p>
                        <p className="text-xs text-slate-500">{xj.createdDate}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {xj.products && xj.products.length > 0 ? (
                        <div className="space-y-0.5">
                          {xj.products.slice(0, 2).map((p: any, i: number) => (
                            <div key={i}>
                              <p className="text-sm font-medium text-slate-900 leading-tight">{p.productName || p.description || 'N/A'}</p>
                              {p.modelNo && p.modelNo !== '-' && (
                                <p className="text-xs text-slate-500">{p.modelNo}</p>
                              )}
                              {p.specification && (
                                <p className="text-xs text-slate-400 truncate max-w-[200px]">{p.specification}</p>
                              )}
                            </div>
                          ))}
                          {xj.products.length > 2 && (
                            <p className="text-xs text-blue-500">+{xj.products.length - 2} 件产品</p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium text-slate-900">{xj.productName || 'N/A'}</p>
                          {xj.modelNo && <p className="text-xs text-slate-500">{xj.modelNo}</p>}
                          {xj.specification && <p className="text-xs text-slate-400">{xj.specification}</p>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {xj.products && xj.products.length > 0 ? (
                        <div className="space-y-0.5">
                          {xj.products.slice(0, 2).map((p: any, i: number) => (
                            <div key={i} className="text-right">
                              <span className="text-sm font-medium">{(p.quantity ?? 0).toLocaleString()}</span>
                              <span className="text-xs text-slate-500 ml-1">{p.unit || 'PCS'}</span>
                            </div>
                          ))}
                          {xj.products.length > 2 && <div className="h-4" />}
                        </div>
                      ) : (
                        <>
                          <span className="text-sm font-medium">{xj.quantity?.toLocaleString() || 0}</span>
                          <span className="text-xs text-slate-500 ml-1">{xj.unit || ''}</span>
                        </>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">{xj.quotationDeadline}</span>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        // 🔥 检查是否已下推报价
                        const myQuote = xj.quotes?.find((q: any) => q.supplierCode === user?.email);
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
                        {xj.documentData && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                              setSelectedItem(xj);
                              setDocumentViewerOpen(true);
                            }}
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            查看
                          </Button>
                        )}
                        {/* 🔥 根据是否已下推报价显示不同按钮 */}
                        {(() => {
                          const myQuote = xj.quotes?.find((q: any) => q.supplierCode === user?.email);
                          const existingQuotation = supplierQuotations.find(q => 
                            q.sourceXJ === (xj.supplierXjNo || xj.xjNumber) &&
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
                                onClick={async () => {
                            // 🔥 下推报价 - 自动创建报价单并跳转到我的报价
                            try {
                              // 🔥 防止重复创建：检查是否已存在对应的报价单
                              const existingQuotation = supplierQuotations.find(q => 
                                q.sourceXJ === (xj.supplierXjNo || xj.xjNumber) &&
                                q.supplierEmail === user?.email
                              );

                              if (existingQuotation) {
                                toast.warning(
                                  <div className="space-y-1">
                                    <p className="font-semibold">⚠️ 报价单已存在</p>
                                    <p className="text-sm">询价单: {xj.supplierXjNo || xj.xjNumber}</p>
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
                              console.log('🔍 创建报价单 - 采购询价数据:', {
                                id: xj.id,
                                xjNumber: xj.xjNumber,
                                supplierXjNo: xj.supplierXjNo,
                                productName: xj.productName,
                                quantity: xj.quantity,
                                unit: xj.unit,
                                products: xj.products, // 🔥 多产品数组
                                productsCount: xj.products?.length || 0
                              });
                              
                              console.log('🔍 供应商信息:', {
                                email: supplierInfo?.email,
                                name: supplierInfo?.name,
                                company: supplierInfo?.company,
                                address: supplierInfo?.address,
                                phone: supplierInfo?.phone
                              });

                              const quotation = await createQuotationFromXJ(
                                xj,
                                supplierInfo,
                                {
                                  unitPrice: 0,
                                  leadTime: 30,
                                  moq: 1000,
                                  paymentTerms: 'T/T 30天',
                                  deliveryTerms: 'FOB 厦门',
                                  status: 'draft'
                                }
                              );

                              console.log('✅ 报价单创建成功:', {
                                quotationNo: quotation.quotationNo,
                                itemsCount: quotation.items?.length || 0,
                              });

                              // Supabase-first: 保存到 supplier_quotations 表
                              await saveSupplierQuotation(quotation);
                              
                              // 更新本地状态
                              const updatedQuotations = [...supplierQuotations, quotation];
                              setSupplierQuotations(updatedQuotations);

                              // 🔥 将报价信息添加到采购询价的quotes数组中，标记为"已下推"
                              addQuoteToXJ(xj.id, {
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
                                  <p className="text-sm">询价单: {xj.supplierXjNo || xj.xjNumber}</p>
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
                onClick={async () => {
                  if (window.confirm(`确定要删除选中的 ${selectedIds.length} 个报价单吗？\n\n⚠️ 此操作不可恢复！`)) {
                    const updatedQuotations = supplierQuotations.filter(q => !selectedIds.includes(q.id));
                    setSupplierQuotations(updatedQuotations);
                    // Supabase-first: 软删除
                    await Promise.all(selectedIds.map(id => supplierQuotationService.delete(id).catch(() => null)));
                    
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
        <Card className="rounded-none border-x-0 border-t-0 shadow-none">
          {/* ── Flat density table: one attribute = one column, single-line rows ── */}
          <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-slate-50">
                {/* Checkbox */}
                <th className="w-10 px-3 py-2.5 text-left">
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
                </th>
                <th className="w-36 px-3 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">报价单号</th>
                <th className="w-8  px-2 py-2.5 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider">版本</th>
                <th className="w-28 px-3 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">客户名称</th>
                <th className="w-44 px-3 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap hidden xl:table-cell">客户公司</th>
                <th className="w-36 px-3 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">关联询价单</th>
                <th className="w-24 px-3 py-2.5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wider">数量</th>
                <th className="w-28 px-3 py-2.5 text-right text-[11px] font-semibold text-slate-600 uppercase tracking-wider">单价</th>
                <th className="w-10 px-1 py-2.5 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">币种</th>
                {/* 报价金额 – focal column */}
                <th className="w-32 px-3 py-2.5 text-right text-[11px] font-semibold text-slate-900 uppercase tracking-wider whitespace-nowrap">报价金额 ↕</th>
                <th className="w-24 px-3 py-2.5 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">报价日期 ↕</th>
                <th className="w-20 px-3 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">状态</th>
                <th className="w-56 px-3 py-2.5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wider">操作</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {myQuotations.length > 0 ? (
                myQuotations.map((quotation) => {
                  // ── pre-compute helpers ──────────────────────────────────
                  const items: any[] = quotation.items ?? [];
                  const currency = quotation.currency || items[0]?.currency || 'CNY';
                  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '¥';

                  const totalQty = items.reduce((s: number, it: any) => s + (Number(it.quantity) || 0), 0);
                  const unit = items.length === 1 ? (items[0].unit || '') : '';

                  const prices = items
                    .map((it: any) => it.unitPrice)
                    .filter((p: any) => p != null && Number.isFinite(Number(p)))
                    .map(Number);
                  const minP = prices.length ? Math.min(...prices) : null;
                  const maxP = prices.length ? Math.max(...prices) : null;
                  const unitPriceDisplay =
                    prices.length === 0 ? '—'
                    : minP === maxP
                      ? minP!.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : `${minP!.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}~${maxP!.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

                  const total = quotation.totalAmount;
                  const totalDisplay =
                    total != null && Number.isFinite(total)
                      ? total.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : null;

                  const STATUS: Record<string, { label: string; dot: string; text: string }> = {
                    draft:     { label: '草稿',   dot: 'bg-slate-400',   text: 'text-slate-500' },
                    submitted: { label: '已提交', dot: 'bg-blue-500',    text: 'text-blue-600'  },
                    accepted:  { label: '已接受', dot: 'bg-emerald-500', text: 'text-emerald-600' },
                    rejected:  { label: '已拒绝', dot: 'bg-red-500',     text: 'text-red-500'   },
                    completed: { label: '已完成', dot: 'bg-purple-500',  text: 'text-purple-600' },
                  };
                  const st = STATUS[quotation.status] ?? STATUS.draft;

                  const isSelected = selectedIds.includes(quotation.id);

                  return (
                  <React.Fragment key={quotation.id}>
                    <tr
                      className={`group transition-colors ${
                        isSelected
                          ? 'bg-blue-50/60'
                          : 'hover:bg-slate-50/80'
                      }`}
                      style={{ height: 52 }}
                    >
                      {/* Checkbox */}
                      <td className="px-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => {
                            setSelectedIds(prev =>
                              prev.includes(quotation.id)
                                ? prev.filter(id => id !== quotation.id)
                                : [...prev, quotation.id]
                            );
                          }}
                        />
                      </td>

                      {/* 报价单号 – clickable, primary identifier */}
                      <td className="px-3 whitespace-nowrap">
                        <button
                          className="font-mono text-[13px] font-semibold text-blue-600 hover:text-blue-700 hover:underline underline-offset-2 transition-colors"
                          onClick={() => {
                            setSelectedQuotation(quotation);
                            setQuotationDocumentViewerOpen(true);
                          }}
                        >
                          {quotation.quotationNo}
                        </button>
                      </td>

                      {/* 版本 */}
                      <td className="px-2 text-center">
                        <span className="text-[11px] font-medium text-slate-400 tabular-nums">v{quotation.version}</span>
                      </td>

                      {/* 客户名称 */}
                      <td className="px-3 max-w-[112px]">
                        <span className="text-[13px] font-medium text-slate-800 truncate block" title={quotation.customerName}>
                          {quotation.customerName || '—'}
                        </span>
                      </td>

                      {/* 客户公司（响应式隐藏 < xl） */}
                      <td className="px-3 max-w-[176px] hidden xl:table-cell">
                        <span className="text-[12px] text-slate-500 truncate block" title={quotation.customerCompany}>
                          {quotation.customerCompany || '—'}
                        </span>
                      </td>

                      {/* 关联询价单（响应式隐藏 < lg） */}
                      <td className="px-3 hidden lg:table-cell">
                        <span className="font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {quotation.sourceXJ || '—'}
                        </span>
                      </td>

                      {/* 数量 – L3 */}
                      <td className="px-3 text-right whitespace-nowrap tabular-nums">
                        {items.length === 0 ? (
                          <span className="text-[13px] text-slate-300">—</span>
                        ) : (
                          <>
                            <span className="text-[13px] font-medium text-slate-700">
                              {totalQty.toLocaleString('zh-CN')}
                            </span>
                            {unit && (
                              <span className="text-[11px] text-slate-400 ml-0.5 uppercase">{unit}</span>
                            )}
                          </>
                        )}
                      </td>

                      {/* 单价 – L2: same size as qty, stronger color */}
                      <td className="px-3 text-right whitespace-nowrap tabular-nums">
                        <span className="text-[13px] font-semibold text-slate-700">
                          {unitPriceDisplay === '—' ? (
                            <span className="font-normal text-slate-300">—</span>
                          ) : (
                            unitPriceDisplay
                          )}
                        </span>
                      </td>

                      {/* 币种（响应式隐藏 < lg） */}
                      <td className="px-1 text-center hidden lg:table-cell">
                        <span className="text-[10px] font-medium text-slate-400 tracking-wide">{currency}</span>
                      </td>

                      {/* 报价金额 – L1 FOCAL COLUMN */}
                      <td className="px-3 text-right whitespace-nowrap tabular-nums">
                        {totalDisplay ? (
                          <span className="text-[15px] font-bold text-slate-900">
                            {symbol}{totalDisplay}
                          </span>
                        ) : (
                          <span className="text-[13px] text-slate-300">—</span>
                        )}
                      </td>

                      {/* 报价日期（响应式隐藏 < md） */}
                      <td className="px-3 text-center whitespace-nowrap hidden md:table-cell">
                        <span className="text-[12px] text-slate-500 tabular-nums font-mono">
                          {quotation.quotationDate || '—'}
                        </span>
                      </td>

                      {/* 状态 badge – dot + label */}
                      <td className="px-3">
                        <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${st.text} whitespace-nowrap`}>
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${st.dot} flex-shrink-0`} />
                          {st.label}
                        </span>
                      </td>

                      {/* 操作 */}
                      <td className="px-3">
                        <div className="flex items-center justify-end gap-1.5">
                        {/* 查看文档 */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs font-medium border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 gap-1.5"
                          onClick={() => {
                            setSelectedQuotation(quotation);
                            setQuotationDocumentViewerOpen(true);
                          }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          查看
                        </Button>

                        {/* 核算 / 重新核算 — 弹窗模式 */}
                        {quotation.status === 'draft' ? (
                          <Button
                            size="sm"
                            className="h-8 px-3 text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white gap-1.5 shadow-sm"
                            onClick={() => openQuotationEditor(quotation.id)}
                          >
                            <Calculator className="w-3.5 h-3.5" />
                            核算报价
                          </Button>
                        ) : quotation.status === 'submitted' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs font-medium border-orange-200 text-orange-600 hover:bg-orange-50 gap-1.5"
                            onClick={async () => {
                              const reverted = { ...quotation, status: 'draft' as const };
                              await saveSupplierQuotation(reverted);
                              const updated = supplierQuotations.map(q =>
                                q.id === quotation.id ? reverted : q
                              );
                              setSupplierQuotations(updated);
                              openQuotationEditor(quotation.id);
                              toast.info('已撤回为草稿，可重新核算报价');
                            }}
                          >
                            <Calculator className="w-3.5 h-3.5" />
                            重新核算
                          </Button>
                        ) : null}

                        {/* 提交报价 */}
                        {quotation.status === 'draft' && (() => {
                          const isQuotationValid = () => {
                            const allPricesValid = quotation.items?.every((item: any) => item.unitPrice && item.unitPrice > 0);
                            const firstItem = quotation.items?.[0];
                            const leadTimeValid = firstItem?.leadTime && firstItem.leadTime > 0;
                            const moqValid = firstItem?.moq && firstItem.moq > 0;
                            const paymentTermsValid = quotation.paymentTerms && quotation.paymentTerms.trim().length > 0;
                            const deliveryTermsValid = quotation.deliveryTerms && quotation.deliveryTerms.trim().length > 0;
                            return allPricesValid && leadTimeValid && moqValid && paymentTermsValid && deliveryTermsValid;
                          };
                          const isValid = isQuotationValid();
                          return (
                            <Button
                              size="sm"
                              className="h-8 px-3 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                              disabled={!isValid}
                              onClick={async () => {
                                if (!isValid) {
                                  toast.error(
                                    <div className="space-y-1">
                                      <p className="font-semibold">⚠️ 无法提交报价</p>
                                      <p className="text-sm">请先点击"核算报价"填写以下必填项：</p>
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
                                const updatedQuotation = {
                                  ...quotation,
                                  status: 'submitted' as const,
                                  submittedDate: new Date().toISOString().split('T')[0],
                                };
                                // Supabase-first: 更新 supplier_quotations 表
                                await saveSupplierQuotation(updatedQuotation);
                                setSupplierQuotations(prev => prev.map(q => q.id === quotation.id ? updatedQuotation : q));
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
                              <Send className="w-3.5 h-3.5" />
                              提交报价
                            </Button>
                          );
                        })()}

                        {/* 下载 – icon only */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                          title="下载报价单"
                          onClick={() => {
                            toast.info(
                              <div className="space-y-1">
                                <p className="font-semibold">📥 准备下载报价单</p>
                                <p className="text-sm">报价单号: {quotation.quotationNo}</p>
                              </div>,
                              { duration: 2000 }
                            );
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
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                        </div>
                      </td>
                    </tr>

                    {/* 核算报价已改为弹窗模式，见下方 Dialog */}
                  </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={13} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Calculator className="w-12 h-12 mb-2" />
                      <p className="text-sm">暂无报价单</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
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
                        <p className="text-sm font-medium text-blue-600">{order.xjNumber}</p>
                        <p className="text-xs text-slate-500">{order.createdDate}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.products && order.products.length > 0 ? (
                        <div className="space-y-0.5">
                          {order.products.slice(0, 2).map((p: any, i: number) => (
                            <div key={i}>
                              <p className="text-sm font-medium text-slate-900 leading-tight">{p.productName || p.description || 'N/A'}</p>
                              <p className="text-xs text-slate-500">{(p.quantity ?? 0).toLocaleString()} {p.unit || 'PCS'}</p>
                            </div>
                          ))}
                          {order.products.length > 2 && (
                            <p className="text-xs text-blue-500">+{order.products.length - 2} 件产品</p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium text-slate-900">{order.productName || 'N/A'}</p>
                          <p className="text-xs text-slate-500">{order.quantity} {order.unit}</p>
                        </div>
                      )}
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
          <TabsTrigger value="xj" className="gap-2 py-2.5 data-[state=active]:bg-white">
            <FileText className="w-4 h-4" />
            <div className="text-left">
              <p className="text-sm font-medium">客户需求</p>
              <p className="text-xs opacity-75">采购询价 · {stats.pendingRFQs}</p>
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

        <TabsContent value="xj" className="mt-6">
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
          {selectedItem && <XJDocumentViewer xj={selectedItem} />}
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

      {/* 报价单文档查看器 – 独立 DocumentModal（可拖动、A4分页） */}
      {selectedQuotation && (
        <SupplierQuotationDocumentViewer
          open={quotationDocumentViewerOpen}
          onClose={() => setQuotationDocumentViewerOpen(false)}
          quotation={selectedQuotation}
          onEdit={() => {
            setQuotationDocumentViewerOpen(false);
            setQuotationEditorOpen(true);
          }}
          onSubmit={async () => {
            const updatedQuotation = {
              ...selectedQuotation,
              status: 'submitted' as const,
              submittedDate: new Date().toISOString().split('T')[0],
            };
            // Supabase-first
            await saveSupplierQuotation(updatedQuotation);
            setSupplierQuotations(prev => prev.map(q => q.id === selectedQuotation.id ? updatedQuotation : q));
            setQuotationDocumentViewerOpen(false);
            toast.success(
              <div className="space-y-1">
                <p className="font-semibold">✅ 报价单已提交给COSUN采购</p>
                <p className="text-sm">报价单号: {selectedQuotation.quotationNo}</p>
                <p className="text-xs text-slate-500 mt-1">采购方将收到报价通知</p>
              </div>,
              { duration: 3000 },
            );
          }}
        />
      )}

      {/* 核算报价 / 编辑报价单 弹窗
          架构：Portal > Overlay(居中容器) > Content(尺寸+flex) > Header(固定) + Body(滚动)
          - Overlay: fixed inset-0 flex items-center justify-center p-6  → 负责居中
          - Content: w-full max-w-5xl max-h-full flex flex-col overflow-hidden → 负责尺寸
          - Body:    flex-1 min-h-0 overflow-y-auto                         → 负责滚动
      */}
      <Dialog open={quotationEditorOpen} onOpenChange={open => { if (!open) closeQuotationEditor(); }}>
        <DialogPortal>
          {/* 背景遮罩 */}
          <DialogOverlay />

          {/* Overlay 兼居中容器：fixed inset-0 + flex 居中，p-6 作为安全边距 */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
            {/* Modal 容器：负责尺寸与三段式 flex 布局，pointer-events-auto 恢复交互 */}
            <DialogPrimitive.Content
              className="pointer-events-auto w-full max-w-5xl max-h-full flex flex-col overflow-hidden rounded-lg border bg-white shadow-lg"
              onInteractOutside={e => e.preventDefault()}
              onOpenAutoFocus={e => e.preventDefault()}
            >
              {/* ModalHeader — shrink-0，不参与滚动 */}
              <div className="shrink-0 flex items-center gap-3 px-6 py-4 pr-14 bg-white border-b border-slate-200">
                <Calculator className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <DialogPrimitive.Title className="text-[15px] font-semibold text-slate-800 leading-tight">
                    核算报价
                  </DialogPrimitive.Title>
                  {selectedQuotation && (
                    <DialogPrimitive.Description className="text-[12px] text-slate-400 mt-0.5">
                      {selectedQuotation.quotationNo} · {selectedQuotation.customerName || 'COSUN采购'}
                    </DialogPrimitive.Description>
                  )}
                </div>
              </div>

              {/* ModalBody — flex-1 min-h-0 overflow-y-auto，内容在此滚动 */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                {selectedQuotation && (
                  <SupplierQuotationEditor
                    quotation={selectedQuotation}
                    onSave={async (updatedQuotation) => {
                      // 1. Supabase-first: 持久化到 supplier_quotations 表
                      await saveSupplierQuotation(updatedQuotation);

                      // 2. Sync unitPrice + totalAmount back into the table row
                      const updatedQuotations = supplierQuotations.map(q =>
                        q.quotationNo === updatedQuotation.quotationNo ? updatedQuotation : q
                      );
                      setSupplierQuotations(updatedQuotations);

                      // 3. Keep selectedQuotation fresh (for document viewer)
                      setSelectedQuotation(updatedQuotation);

                      // 4. Sync back to the parent 采购询价
                      const relatedRFQ = myXJs.find(r =>
                        (r.supplierXjNo || r.xjNumber) === updatedQuotation.sourceXJ
                      );
                      if (relatedRFQ) {
                        const firstItem = updatedQuotation.items?.[0];
                        addQuoteToXJ(relatedRFQ.id, {
                          supplierCode: updatedQuotation.supplierEmail || user?.email || '',
                          supplierName: updatedQuotation.supplierName || user?.username || '供应商',
                          unitPrice: firstItem?.unitPrice ?? 0,
                          totalAmount: updatedQuotation.totalAmount ?? 0,
                          currency: updatedQuotation.currency || 'CNY',
                          leadTime: firstItem?.leadTime ?? 0,
                          moq: firstItem?.moq ?? 0,
                          validityDays: 30,
                          paymentTerms: updatedQuotation.paymentTerms || '',
                          deliveryTerms: updatedQuotation.deliveryTerms || '',
                          remarks: [
                            updatedQuotation.generalRemarks,
                            updatedQuotation.supplierRemarks,
                          ].filter(Boolean).join(' | ') || `报价单号: ${updatedQuotation.quotationNo}`,
                          quoteMode: updatedQuotation.quoteMode,
                          overallMargin: updatedQuotation.overallMargin,
                          status: updatedQuotation.status,
                        });
                      }

                      // 5. Close dialog
                      closeQuotationEditor();
                    }}
                    onCancel={closeQuotationEditor}
                  />
                )}
              </div>

              {/* 关闭按钮 */}
              <DialogPrimitive.Close className="absolute top-4 right-4 z-50 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none">
                <XIcon className="w-5 h-5" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            </DialogPrimitive.Content>
          </div>
        </DialogPortal>
      </Dialog>


    </div>
  );
}