// 🔥 供应商订单管理中心 V2 - 完整台湾大厂风格
// 参考图片布局：订单全盘 → 询价管理 → 报价管理 → 订单管理 → 收款管理

import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Checkbox } from '../ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { 
  LayoutGrid, FileText, Calculator, Package, DollarSign, Receipt,
  RefreshCw, Download, Settings, TrendingUp, TrendingDown, Eye,
  Circle, Filter, ChevronRight, ArrowUpRight, ArrowDownRight, Clock,
  Send, CheckCircle2, Trash2, CheckSquare, Printer
} from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '../../contexts/UserContext';
import { useRFQs } from '../../contexts/RFQContext';
import { SimpleQuoteForm } from './SimpleQuoteForm';
import SupplierRFQDocumentViewer from './SupplierRFQDocumentViewer';

// 🔥 供应商报价单接口
interface SupplierQuotation {
  id: string;
  quotationNo: string;
  sourceXJ?: string;
  customerName: string;
  customerCompany: string;
  supplierEmail: string;
  quotationDate: string;
  validUntil: string;
  totalAmount: number;
  items: any[];
  status: 'draft' | 'submitted' | 'accepted' | 'rejected' | 'completed';
  createdDate: string;
  version: number;
}

export default function SupplierOrderManagementCenterV2() {
  const { user } = useUser();
  const { rfqs, getRFQsBySupplier, deleteRFQ, updateRFQ, addQuoteToRFQ } = useRFQs();
  
  // 主Tab状态
  const [mainTab, setMainTab] = useState<'overview' | 'rfq' | 'quotation' | 'orders' | 'payment'>('overview');
  
  // 概览子Tab
  const [overviewTab, setOverviewTab] = useState<'summary' | 'conversion' | 'performance' | 'risk'>('summary');
  
  // 询价管理子Tab
  const [rfqTab, setRfqTab] = useState<'pending' | 'quoted' | 'accepted' | 'all'>('pending');
  
  // 时间筛选
  const [timeFilter, setTimeFilter] = useState('month');
  
  // 🔥 询价管理相关状态
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [selectedRFQ, setSelectedRFQ] = useState<any>(null);
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [documentRFQ, setDocumentRFQ] = useState<any>(null);
  const [selectedRFQIds, setSelectedRFQIds] = useState<string[]>([]);

  // 🔥 从localStorage读取供应商报价单
  const [supplierQuotations] = useState<SupplierQuotation[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('supplierQuotations');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return [];
        }
      }
    }
    return [];
  });

  // 🔥 获取当前供应商的数据
  const myRFQs = useMemo(() => {
    if (!user?.email) return [];
    return getRFQsBySupplier(user.email);
  }, [rfqs, user?.email, getRFQsBySupplier]);

  const myQuotations = useMemo(() => {
    if (!user?.email) return [];
    return supplierQuotations.filter(q => q.supplierEmail === user.email);
  }, [supplierQuotations, user?.email]);

  // 🔥 统计数据（模拟）
  const stats = {
    totalInquiries: 248,
    inquiryChange: +12,
    totalQuotations: 186,
    quotationChange: +8,
    totalContracts: 124,
    contractChange: +5,
    totalOrders: 98,
    orderChange: +15,
    totalPayments: 76,
    paymentChange: +10,
    conversionRate: 31,
    conversionChange: +3
  };

  // 🔥 每周业务趋势数据（模拟）
  const weeklyData = [
    { week: 'W1', inquiries: 58, quotations: 42 },
    { week: 'W2', inquiries: 62, quotations: 45 },
    { week: 'W3', inquiries: 64, quotations: 48 },
    { week: 'W4', inquiries: 64, quotations: 51 }
  ];

  // 🔥 产品类别分布（模拟）
  const categoryData = [
    { name: '电气配件', orders: 54, amount: 8850000, change: +18 },
    { name: '卫浴五金', orders: 30, amount: 4480000, change: +12 },
    { name: '门窗配件', orders: 14, amount: 2230000, change: +8 }
  ];

  // 🔥 Top客户订单明细（模拟）
  const topCustomers = [
    {
      id: '1',
      customerName: '福建高盛达富建材有限公司',
      category: '电气配件',
      orderCount: 24,
      orderAmount: 5600000,
      paidAmount: 4200000,
      pendingAmount: 1400000,
      status: '正常',
      risk: 'low'
    },
    {
      id: '2',
      customerName: '厦门市建材贸易有限公司',
      category: '卫浴五金',
      orderCount: 18,
      orderAmount: 4200000,
      paidAmount: 3800000,
      pendingAmount: 400000,
      status: '正常',
      risk: 'low'
    },
    {
      id: '3',
      customerName: '泉州市五金制品有限公司',
      category: '门窗配件',
      orderCount: 15,
      orderAmount: 3350000,
      paidAmount: 2900000,
      pendingAmount: 450000,
      status: '正常',
      risk: 'medium'
    },
    {
      id: '4',
      customerName: '福州市装饰材料有限公司',
      category: '电气配件',
      orderCount: 12,
      orderAmount: 2780000,
      paidAmount: 2500000,
      pendingAmount: 280000,
      status: '正常',
      risk: 'low'
    },
    {
      id: '5',
      customerName: '莆田市建筑五金有限公司',
      category: '卫浴五金',
      orderCount: 10,
      orderAmount: 2150000,
      paidAmount: 1950000,
      pendingAmount: 200000,
      status: '延迟',
      risk: 'high'
    }
  ];

  // 🔥 渲染统计卡片
  const renderStatCard = (title: string, value: string | number, change: number, icon: React.ReactNode) => (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-600">{title}</p>
        {icon}
      </div>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <div className={`flex items-center gap-1 text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          <span>{change >= 0 ? '+' : ''}{change}%</span>
        </div>
      </div>
    </div>
  );

  // 🔥 渲染综合概览Tab
  const renderSummaryOverview = () => (
    <div className="space-y-6">
      {/* 关键指标 */}
      <div className="grid grid-cols-6 gap-4">
        {renderStatCard('总询价', stats.totalInquiries, stats.inquiryChange, <FileText className="w-4 h-4 text-slate-400" />)}
        {renderStatCard('总报价', stats.totalQuotations, stats.quotationChange, <Calculator className="w-4 h-4 text-slate-400" />)}
        {renderStatCard('总合同', stats.totalContracts, stats.contractChange, <FileText className="w-4 h-4 text-slate-400" />)}
        {renderStatCard('总订单', stats.totalOrders, stats.orderChange, <Package className="w-4 h-4 text-slate-400" />)}
        {renderStatCard('总收款', stats.totalPayments, stats.paymentChange, <Receipt className="w-4 h-4 text-slate-400" />)}
        {renderStatCard('确到账转化', `${stats.conversionRate}%`, stats.conversionChange, <TrendingUp className="w-4 h-4 text-slate-400" />)}
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-3 gap-6">
        {/* 每周业务趋势 */}
        <Card className="col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-700">每周业务趋势</CardTitle>
              <span className="text-xs text-slate-500">Weekly Trend</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative h-48">
              {/* 简化的SVG折线图 */}
              <svg className="w-full h-full" viewBox="0 0 400 150">
                {/* 网格线 */}
                <line x1="0" y1="30" x2="400" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="60" x2="400" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="90" x2="400" y2="90" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="120" x2="400" y2="120" stroke="#f1f5f9" strokeWidth="1" />
                
                {/* 询价线（灰色） */}
                <polyline
                  points="50,60 150,50 250,45 350,45"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2"
                />
                
                {/* 报价线（橙色） */}
                <polyline
                  points="50,95 150,90 250,80 350,70"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2"
                />
                
                {/* X轴标签 */}
                <text x="50" y="145" fontSize="11" fill="#64748b" textAnchor="middle">W1</text>
                <text x="150" y="145" fontSize="11" fill="#64748b" textAnchor="middle">W2</text>
                <text x="250" y="145" fontSize="11" fill="#64748b" textAnchor="middle">W3</text>
                <text x="350" y="145" fontSize="11" fill="#64748b" textAnchor="middle">W4</text>
                
                {/* Y轴标签 */}
                <text x="5" y="125" fontSize="10" fill="#94a3b8">0</text>
                <text x="5" y="95" fontSize="10" fill="#94a3b8">20</text>
                <text x="5" y="65" fontSize="10" fill="#94a3b8">40</text>
                <text x="5" y="35" fontSize="10" fill="#94a3b8">60</text>
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* 产品类别分布 */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-medium text-slate-700">产品类别分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryData.map((category, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-700">{category.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${category.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {category.change >= 0 ? '+' : ''}{category.change}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{category.orders} 订单</span>
                    <span className="text-sm font-semibold text-slate-900">¥{(category.amount / 10000).toFixed(0)}万</span>
                  </div>
                  {idx < categoryData.length - 1 && <div className="mt-3 border-b border-slate-100" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top客户订单明细 */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-slate-700">Top客户订单明细</CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-600 hover:text-slate-900">
              查看全部
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 border-y">
                <TableHead className="h-9 text-xs font-medium text-slate-600">客户名称</TableHead>
                <TableHead className="h-9 text-xs font-medium text-slate-600">类别</TableHead>
                <TableHead className="h-9 text-xs font-medium text-slate-600 text-right">订单数</TableHead>
                <TableHead className="h-9 text-xs font-medium text-slate-600 text-right">订单金额</TableHead>
                <TableHead className="h-9 text-xs font-medium text-slate-600 text-right">已收款</TableHead>
                <TableHead className="h-9 text-xs font-medium text-slate-600 text-right">待收款</TableHead>
                <TableHead className="h-9 text-xs font-medium text-slate-600">状态</TableHead>
                <TableHead className="h-9 text-xs font-medium text-slate-600">风险</TableHead>
                <TableHead className="h-9 text-xs font-medium text-slate-600 text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topCustomers.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-slate-50">
                  <TableCell className="py-3">
                    <span className="text-sm text-slate-900">{customer.customerName}</span>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="text-sm text-slate-600">{customer.category}</span>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <span className="text-sm font-medium text-slate-900">{customer.orderCount}</span>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <span className="text-sm font-medium text-slate-900">¥{(customer.orderAmount / 10000).toFixed(1)}万</span>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <span className="text-sm text-green-600">¥{(customer.paidAmount / 10000).toFixed(1)}万</span>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <span className="text-sm text-orange-600">¥{(customer.pendingAmount / 10000).toFixed(1)}万</span>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge 
                      variant="outline"
                      className={customer.status === '正常' ? 'border-green-300 text-green-700' : 'border-orange-300 text-orange-700'}
                    >
                      {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <Circle 
                      className={`w-2 h-2 fill-current ${
                        customer.risk === 'low' ? 'text-green-500' : 
                        customer.risk === 'medium' ? 'text-yellow-500' : 
                        'text-red-500'
                      }`}
                    />
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <Button variant="ghost" size="sm" className="h-7 px-2">
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* 主导航Tab */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-6">
          <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as any)}>
            <TabsList className="bg-transparent border-b-0 h-14 gap-6 p-0">
              <TabsTrigger 
                value="overview" 
                className="relative h-14 px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:shadow-none bg-transparent"
              >
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4" />
                  <span className="text-sm font-medium">订单全盘</span>
                  <Badge className="ml-1 h-4 px-1.5 text-xs bg-orange-500 text-white border-0">NEW</Badge>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="rfq"
                className="relative h-14 px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:shadow-none bg-transparent"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-medium">询价管理</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="quotation"
                className="relative h-14 px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:shadow-none bg-transparent"
              >
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  <span className="text-sm font-medium">报价管理</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="orders"
                className="relative h-14 px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:shadow-none bg-transparent"
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <span className="text-sm font-medium">订单管理</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="payment"
                className="relative h-14 px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:shadow-none bg-transparent"
              >
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  <span className="text-sm font-medium">收款管理</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {mainTab === 'overview' && (
            <div className="space-y-4">
              {/* 页面标题栏 */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">订单全盘</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Order Overview Dashboard</p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger className="w-24 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">本周</SelectItem>
                      <SelectItem value="month">本月</SelectItem>
                      <SelectItem value="quarter">本季</SelectItem>
                      <SelectItem value="year">本年</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="h-8 gap-1">
                    <Filter className="w-3.5 h-3.5" />
                    <span className="text-xs">筛选</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 gap-1">
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="text-xs">刷新</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 gap-1">
                    <Download className="w-3.5 h-3.5" />
                    <span className="text-xs">导出</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Settings className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* 子Tab */}
              <Tabs value={overviewTab} onValueChange={(v) => setOverviewTab(v as any)}>
                <TabsList className="bg-white border border-slate-200 p-0.5 h-9">
                  <TabsTrigger value="summary" className="h-8 text-xs data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">
                    <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
                    综合概览
                  </TabsTrigger>
                  <TabsTrigger value="conversion" className="h-8 text-xs data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">
                    <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                    转化漏斗
                  </TabsTrigger>
                  <TabsTrigger value="performance" className="h-8 text-xs data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">
                    <Calculator className="w-3.5 h-3.5 mr-1.5" />
                    业绩分析
                  </TabsTrigger>
                  <TabsTrigger value="risk" className="h-8 text-xs data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">
                    <TrendingDown className="w-3.5 h-3.5 mr-1.5" />
                    风险预警
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="mt-4">
                  {renderSummaryOverview()}
                </TabsContent>

                <TabsContent value="conversion" className="mt-4">
                  <Card>
                    <CardContent className="p-12 text-center">
                      <p className="text-slate-500">转化漏斗分析</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="performance" className="mt-4">
                  <Card>
                    <CardContent className="p-12 text-center">
                      <p className="text-slate-500">业绩分析</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="risk" className="mt-4">
                  <Card>
                    <CardContent className="p-12 text-center">
                      <p className="text-slate-500">风险预警</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {mainTab === 'rfq' && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">询价管理模块</p>
              </CardContent>
            </Card>
          )}

          {mainTab === 'quotation' && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">报价管理模块</p>
              </CardContent>
            </Card>
          )}

          {mainTab === 'orders' && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">订单管理模块</p>
              </CardContent>
            </Card>
          )}

          {mainTab === 'payment' && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">收款管理模块</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}