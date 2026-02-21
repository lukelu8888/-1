// 🏭 THE COSUN BM - 单证员专业工作台
// Documentation Officer Professional Workbench - Taiwan Enterprise Style

import React, { useState } from 'react';
import { 
  FileText, Search, Filter, AlertTriangle, CheckCircle2, Clock, 
  XCircle, Download, Upload, Eye, Plus, RefreshCw, Archive,
  BarChart3, TrendingUp, Calendar, Bell, ChevronRight, Package,
  Ship, DollarSign, FileCheck, Truck, Plane, FileSignature
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';

// 单证类型定义（对应图片中的13项单证）
const DOCUMENT_CHECKLIST = [
  { id: 'export_tax_return', name: '出口退税申报表', code: 'D01', required: true, category: 'tax', icon: FileText },
  { id: 'purchase_contract', name: '购销商品的合同、发票、付款单据', code: 'D02', required: true, category: 'trade', icon: FileSignature },
  { id: 'domestic_transport', name: '货物国内运输单据及运费发票和对应的运费支付凭证', code: 'D03', required: false, category: 'logistics', icon: Truck },
  { id: 'domestic_freight_waiver', name: '本方不承担货物国内部分的运费', code: 'D04', required: false, category: 'logistics', icon: XCircle },
  { id: 'customs_docs', name: '报关单、装箱单、提运单等单证材料', code: 'D05', required: true, category: 'customs', icon: FileCheck },
  { id: 'customs_agency_contract', name: '委托报关合同、发票、付款凭证', code: 'D06', required: false, category: 'customs', icon: FileSignature },
  { id: 'purchase_invoice', name: '进货渠道用发票、付款凭证', code: 'D07', required: true, category: 'trade', icon: FileText },
  { id: 'customs_fee_waiver', name: '本方不承担委托报关费用', code: 'D08', required: false, category: 'customs', icon: XCircle },
  { id: 'intl_freight_docs', name: '货物国外运输运费发票、付款凭证', code: 'D09', required: false, category: 'logistics', icon: Plane },
  { id: 'intl_freight_waiver', name: '本方不承担货物国外运输', code: 'D10', required: false, category: 'logistics', icon: XCircle },
  { id: 'forex_receipt', name: '收汇水单', code: 'D11', required: true, category: 'finance', icon: DollarSign },
  { id: 'forex_settlement', name: '结汇水单', code: 'D12', required: true, category: 'finance', icon: DollarSign },
  { id: 'tax_forex_certificate', name: '出口退（免）税收汇凭证情况表', code: 'D13', required: true, category: 'tax', icon: FileCheck },
];

// 模拟订单数据
interface ShipmentOrder {
  orderId: string;
  contractNo: string;
  customerName: string;
  status: 'pending' | 'in_progress' | 'review' | 'completed' | 'urgent';
  completionRate: number;
  missingDocs: number;
  urgentDocs: number;
  shipmentDate: string;
  eta: string;
  totalValue: number;
  currency: string;
  documents: {
    [key: string]: {
      status: 'missing' | 'uploaded' | 'approved' | 'rejected' | 'na';
      uploadDate?: string;
      reviewer?: string;
      version?: number;
      fileUrl?: string;
    };
  };
}

const mockOrders: ShipmentOrder[] = [
  {
    orderId: 'SO-NA-20251210-001',
    contractNo: 'SC-NA-20251201-001',
    customerName: 'Home Depot Inc.',
    status: 'urgent',
    completionRate: 65,
    missingDocs: 4,
    urgentDocs: 2,
    shipmentDate: '2025-12-15',
    eta: '2026-01-05',
    totalValue: 125000,
    currency: 'USD',
    documents: {
      export_tax_return: { status: 'approved', uploadDate: '2025-12-09', reviewer: '李审核', version: 1 },
      purchase_contract: { status: 'approved', uploadDate: '2025-12-08', reviewer: '李审核', version: 2 },
      domestic_transport: { status: 'uploaded', uploadDate: '2025-12-10' },
      customs_docs: { status: 'missing' },
      purchase_invoice: { status: 'uploaded', uploadDate: '2025-12-09' },
      forex_receipt: { status: 'missing' },
      forex_settlement: { status: 'missing' },
      tax_forex_certificate: { status: 'missing' },
    }
  },
  {
    orderId: 'SO-EU-20251208-003',
    contractNo: 'SC-EU-20251125-002',
    customerName: 'Leroy Merlin',
    status: 'in_progress',
    completionRate: 85,
    missingDocs: 2,
    urgentDocs: 0,
    shipmentDate: '2025-12-20',
    eta: '2026-01-15',
    totalValue: 89000,
    currency: 'EUR',
    documents: {
      export_tax_return: { status: 'approved', uploadDate: '2025-12-07', reviewer: '王主管', version: 1 },
      purchase_contract: { status: 'approved', uploadDate: '2025-12-06', reviewer: '王主管', version: 1 },
      customs_docs: { status: 'approved', uploadDate: '2025-12-08', reviewer: '李审核', version: 1 },
      purchase_invoice: { status: 'approved', uploadDate: '2025-12-06', reviewer: '王主管', version: 1 },
      forex_receipt: { status: 'uploaded', uploadDate: '2025-12-09' },
      forex_settlement: { status: 'missing' },
      tax_forex_certificate: { status: 'missing' },
    }
  },
  {
    orderId: 'SO-NA-20251205-002',
    contractNo: 'SC-NA-20251120-005',
    customerName: "Lowe's Companies",
    status: 'completed',
    completionRate: 100,
    missingDocs: 0,
    urgentDocs: 0,
    shipmentDate: '2025-12-10',
    eta: '2025-12-28',
    totalValue: 156000,
    currency: 'USD',
    documents: {
      export_tax_return: { status: 'approved', uploadDate: '2025-12-04', reviewer: '张经理', version: 1 },
      purchase_contract: { status: 'approved', uploadDate: '2025-12-03', reviewer: '张经理', version: 1 },
      customs_docs: { status: 'approved', uploadDate: '2025-12-05', reviewer: '李审核', version: 1 },
      purchase_invoice: { status: 'approved', uploadDate: '2025-12-03', reviewer: '张经理', version: 1 },
      forex_receipt: { status: 'approved', uploadDate: '2025-12-06', reviewer: '财务部', version: 1 },
      forex_settlement: { status: 'approved', uploadDate: '2025-12-06', reviewer: '财务部', version: 1 },
      tax_forex_certificate: { status: 'approved', uploadDate: '2025-12-07', reviewer: '税务部', version: 1 },
    }
  },
];

export function DocumentationOfficerWorkbench() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedOrder, setSelectedOrder] = useState<ShipmentOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // 统计数据
  const stats = {
    totalOrders: mockOrders.length,
    urgentOrders: mockOrders.filter(o => o.status === 'urgent').length,
    pendingReview: mockOrders.filter(o => o.status === 'in_progress').length,
    completedToday: mockOrders.filter(o => o.status === 'completed').length,
    avgCompletionRate: Math.round(mockOrders.reduce((sum, o) => sum + o.completionRate, 0) / mockOrders.length),
    totalMissingDocs: mockOrders.reduce((sum, o) => sum + o.missingDocs, 0),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'review': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getDocStatusColor = (status: string) => {
    switch (status) {
      case 'missing': return 'text-red-600';
      case 'uploaded': return 'text-blue-600';
      case 'approved': return 'text-green-600';
      case 'rejected': return 'text-orange-600';
      case 'na': return 'text-gray-400';
      default: return 'text-gray-500';
    }
  };

  const getDocStatusIcon = (status: string) => {
    switch (status) {
      case 'missing': return <XCircle className="h-4 w-4" />;
      case 'uploaded': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle2 className="h-4 w-4" />;
      case 'rejected': return <AlertTriangle className="h-4 w-4" />;
      case 'na': return <div className="h-4 w-4 rounded-full bg-gray-200" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部工作台标题 */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white mb-0.5" style={{ fontSize: '22px', fontWeight: 600 }}>
                单证管理工作台
              </h1>
              <p className="text-gray-400" style={{ fontSize: '13px' }}>
                Documentation Officer Workbench · THE COSUN BM 出口单证全流程管控中心
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                <RefreshCw className="h-4 w-4 mr-1.5" />
                刷新数据
              </Button>
              <Button size="sm" style={{ background: '#F96302' }} className="text-white hover:opacity-90">
                <Download className="h-4 w-4 mr-1.5" />
                导出报表
              </Button>
            </div>
          </div>
        </div>

        {/* 快速统计看板 */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-6 gap-3">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-300 text-xs">待处理订单</span>
                <Package className="h-4 w-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.totalOrders}</div>
              <div className="text-xs text-gray-400 mt-0.5">Total Orders</div>
            </div>

            <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-red-200 text-xs">紧急处理</span>
                <AlertTriangle className="h-4 w-4 text-red-300" />
              </div>
              <div className="text-2xl font-bold text-red-100">{stats.urgentOrders}</div>
              <div className="text-xs text-red-200 mt-0.5">Urgent</div>
            </div>

            <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-blue-200 text-xs">审核中</span>
                <Clock className="h-4 w-4 text-blue-300" />
              </div>
              <div className="text-2xl font-bold text-blue-100">{stats.pendingReview}</div>
              <div className="text-xs text-blue-200 mt-0.5">In Review</div>
            </div>

            <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-green-200 text-xs">今日完成</span>
                <CheckCircle2 className="h-4 w-4 text-green-300" />
              </div>
              <div className="text-2xl font-bold text-green-100">{stats.completedToday}</div>
              <div className="text-xs text-green-200 mt-0.5">Completed</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-300 text-xs">平均完成率</span>
                <TrendingUp className="h-4 w-4 text-orange-400" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.avgCompletionRate}%</div>
              <div className="text-xs text-gray-400 mt-0.5">Avg Rate</div>
            </div>

            <div className="bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-orange-200 text-xs">缺失单证</span>
                <FileText className="h-4 w-4 text-orange-300" />
              </div>
              <div className="text-2xl font-bold text-orange-100">{stats.totalMissingDocs}</div>
              <div className="text-xs text-orange-200 mt-0.5">Missing Docs</div>
            </div>
          </div>
        </div>
      </div>

      {/* 主要工作区 */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white border border-gray-200">
            <TabsTrigger value="dashboard">📊 工作看板</TabsTrigger>
            <TabsTrigger value="orders">📦 订单单证</TabsTrigger>
            <TabsTrigger value="checklist">✅ 单证清单</TabsTrigger>
            <TabsTrigger value="analytics">📈 统计分析</TabsTrigger>
            <TabsTrigger value="archive">🗄️ 归档查询</TabsTrigger>
          </TabsList>

          {/* Tab 1: 工作看板 */}
          <TabsContent value="dashboard" className="space-y-4">
            {/* 预警区域 */}
            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-5 w-5 text-red-500" />
                  实时预警
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded">
                    <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-red-900">紧急：订单 SO-NA-20251210-001 缺少报关单</div>
                      <div className="text-xs text-red-700 mt-0.5">客户：Home Depot Inc. · 出货日期：2025-12-15（5天后） · 缺少4份关键单证</div>
                    </div>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-300">
                      处理
                    </Button>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-yellow-900">提醒：订单 SO-EU-20251208-003 有2份单证待审核</div>
                      <div className="text-xs text-yellow-700 mt-0.5">客户：Leroy Merlin · 收汇水单已上传24小时，等待审核</div>
                    </div>
                    <Button size="sm" variant="outline" className="text-yellow-600 border-yellow-300">
                      查看
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 今日任务 */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">📋 今日待办任务</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                        <span className="text-sm">审核 SO-NA-20251210-001 采购合同</span>
                      </div>
                      <Badge variant="outline" className="text-xs">紧急</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">收集 SO-EU-20251208-003 结汇水单</span>
                      </div>
                      <Badge variant="outline" className="text-xs">进行中</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">归档 SO-NA-20251205-002 全部单证</span>
                      </div>
                      <Badge variant="outline" className="text-xs bg-green-50">已完成</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">📊 本周完成统计</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">单证完成率</span>
                        <span className="text-sm font-semibold">{stats.avgCompletionRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${stats.avgCompletionRate}%` }}></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t">
                      <div>
                        <div className="text-xl font-bold text-green-600">8</div>
                        <div className="text-xs text-gray-500">已完成</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-blue-600">5</div>
                        <div className="text-xs text-gray-500">进行中</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-red-600">2</div>
                        <div className="text-xs text-gray-500">待处理</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 2: 订单单证管理 */}
          <TabsContent value="orders" className="space-y-4">
            {/* 搜索和筛选 */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="搜索订单号、合同号、客户名称..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <select 
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">全部状态</option>
                    <option value="urgent">紧急</option>
                    <option value="in_progress">进行中</option>
                    <option value="review">待审核</option>
                    <option value="completed">已完成</option>
                  </select>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-1.5" />
                    高级筛选
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 订单列表 */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="px-4 py-3 text-left font-semibold">订单信息</th>
                        <th className="px-4 py-3 text-left font-semibold">客户名称</th>
                        <th className="px-4 py-3 text-center font-semibold">单证进度</th>
                        <th className="px-4 py-3 text-center font-semibold">缺失/总数</th>
                        <th className="px-4 py-3 text-left font-semibold">出货日期</th>
                        <th className="px-4 py-3 text-center font-semibold">状态</th>
                        <th className="px-4 py-3 text-center font-semibold">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockOrders.map((order) => (
                        <tr 
                          key={order.orderId} 
                          className="border-b hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-semibold text-gray-900">{order.orderId}</div>
                              <div className="text-xs text-gray-500">{order.contractNo}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{order.customerName}</div>
                            <div className="text-xs text-gray-500">{order.currency} {order.totalValue.toLocaleString()}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${order.completionRate === 100 ? 'bg-green-500' : order.completionRate >= 50 ? 'bg-blue-500' : 'bg-red-500'}`}
                                  style={{ width: `${order.completionRate}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-semibold">{order.completionRate}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {order.missingDocs > 0 ? (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                                {order.missingDocs} / 13
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                完整
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs">
                              <div className="font-semibold">{order.shipmentDate}</div>
                              <div className="text-gray-500">ETA: {order.eta}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge className={`${getStatusColor(order.status)} border`}>
                              {order.status === 'urgent' ? '紧急' :
                               order.status === 'in_progress' ? '进行中' :
                               order.status === 'review' ? '待审核' :
                               order.status === 'completed' ? '已完成' : '待处理'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <Button size="sm" variant="ghost" className="h-7 px-2">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 px-2">
                                <Upload className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 px-2">
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* 选中订单的详细单证清单 */}
            {selectedOrder && (
              <Card className="border-2 border-orange-500">
                <CardHeader className="bg-orange-50 border-b border-orange-200">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      订单 {selectedOrder.orderId} - 单证清单明细
                    </CardTitle>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedOrder(null)}>
                      ✕
                    </Button>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    客户：{selectedOrder.customerName} · 合同：{selectedOrder.contractNo} · 完成率：{selectedOrder.completionRate}%
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="px-4 py-2 text-left font-semibold w-12">编号</th>
                        <th className="px-4 py-2 text-left font-semibold">单证名称</th>
                        <th className="px-4 py-2 text-center font-semibold">分类</th>
                        <th className="px-4 py-2 text-center font-semibold w-24">状态</th>
                        <th className="px-4 py-2 text-left font-semibold">上传时间</th>
                        <th className="px-4 py-2 text-left font-semibold">审核人</th>
                        <th className="px-4 py-2 text-center font-semibold">版本</th>
                        <th className="px-4 py-2 text-center font-semibold">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DOCUMENT_CHECKLIST.map((doc) => {
                        const docStatus = selectedOrder.documents[doc.id] || { status: 'missing' };
                        const Icon = doc.icon;
                        
                        return (
                          <tr key={doc.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 text-center text-gray-500 font-mono text-xs">
                              {doc.code}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-gray-400" />
                                <span className={doc.required ? 'font-medium' : ''}>
                                  {doc.name}
                                  {doc.required && <span className="text-red-500 ml-1">*</span>}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant="outline" className="text-xs">
                                {doc.category === 'tax' ? '税务' :
                                 doc.category === 'trade' ? '贸易' :
                                 doc.category === 'customs' ? '报关' :
                                 doc.category === 'logistics' ? '物流' :
                                 doc.category === 'finance' ? '财务' : doc.category}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className={`flex items-center justify-center gap-1.5 ${getDocStatusColor(docStatus.status)}`}>
                                {getDocStatusIcon(docStatus.status)}
                                <span className="text-xs font-semibold">
                                  {docStatus.status === 'missing' ? '缺失' :
                                   docStatus.status === 'uploaded' ? '已上传' :
                                   docStatus.status === 'approved' ? '已审核' :
                                   docStatus.status === 'rejected' ? '已驳回' :
                                   docStatus.status === 'na' ? 'N/A' : docStatus.status}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600">
                              {docStatus.uploadDate || '-'}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600">
                              {docStatus.reviewer || '-'}
                            </td>
                            <td className="px-4 py-3 text-center text-xs">
                              {docStatus.version ? `v${docStatus.version}` : '-'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1">
                                {docStatus.status === 'missing' ? (
                                  <Button size="sm" variant="outline" className="h-7 text-xs">
                                    <Upload className="h-3 w-3 mr-1" />
                                    上传
                                  </Button>
                                ) : docStatus.status === 'uploaded' ? (
                                  <>
                                    <Button size="sm" variant="outline" className="h-7 text-xs bg-green-50 text-green-700 border-green-300">
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      审核
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-7 px-2">
                                      <Eye className="h-3.5 w-3.5" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button size="sm" variant="ghost" className="h-7 px-2">
                                      <Eye className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-7 px-2">
                                      <Download className="h-3.5 w-3.5" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab 3: 单证清单模板 */}
          <TabsContent value="checklist" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">📋 出口单证备查目录（13项标准清单）</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Export Documentation Checklist - 适用于所有出口订单的标准单证要求
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-3">
                  {DOCUMENT_CHECKLIST.map((doc, index) => {
                    const Icon = doc.icon;
                    return (
                      <div 
                        key={doc.id}
                        className={`p-4 border-2 rounded-lg hover:shadow-md transition-shadow cursor-pointer ${
                          doc.required ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            doc.required ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
                          }`}>
                            <span className="text-xs font-bold">{index + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Icon className="h-4 w-4 text-gray-600 flex-shrink-0" />
                              <Badge variant="outline" className="text-[10px] px-1 py-0">
                                {doc.code}
                              </Badge>
                            </div>
                            <div className="text-xs font-medium text-gray-900 leading-tight">
                              {doc.name}
                              {doc.required && <span className="text-red-500 ml-1">*</span>}
                            </div>
                            <div className="mt-1">
                              <Badge variant="outline" className="text-[10px]">
                                {doc.category === 'tax' ? '税务类' :
                                 doc.category === 'trade' ? '贸易类' :
                                 doc.category === 'customs' ? '报关类' :
                                 doc.category === 'logistics' ? '物流类' :
                                 doc.category === 'finance' ? '财务类' : doc.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <div className="font-semibold mb-1">单证管理说明：</div>
                      <ul className="list-disc list-inside space-y-0.5 text-xs text-blue-800">
                        <li>标注 <span className="text-red-500">*</span> 的为必备单证，必须在出货前完成审核</li>
                        <li>第4、8、10项为"不承担"说明文件，根据实际贸易条款判断是否需要</li>
                        <li>所有单证需保存电子版和纸质版各一份，保存期限不少于5年</li>
                        <li>单证审核流程：上传 → 初审 → 复审 → 归档</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: 统计分析 */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">本月单证处理量</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">156</div>
                  <div className="text-xs text-gray-500 mt-1">笔订单单证</div>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 font-semibold">+23%</span>
                    <span className="text-gray-500">vs 上月</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">平均审核时效</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">2.3</div>
                  <div className="text-xs text-gray-500 mt-1">小时/份</div>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 font-semibold">-15%</span>
                    <span className="text-gray-500">效率提升</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">单证错误率</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">1.8%</div>
                  <div className="text-xs text-gray-500 mt-1">驳回率</div>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 font-semibold">-0.5%</span>
                    <span className="text-gray-500">质量改善</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">单证类型处理分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: '报关单据', count: 45, total: 50, color: 'bg-blue-500' },
                    { name: '贸易合同', count: 42, total: 50, color: 'bg-green-500' },
                    { name: '财务单证', count: 38, total: 50, color: 'bg-purple-500' },
                    { name: '税务文件', count: 35, total: 50, color: 'bg-orange-500' },
                    { name: '物流单据', count: 32, total: 50, color: 'bg-teal-500' },
                  ].map((item) => (
                    <div key={item.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">{item.name}</span>
                        <span className="text-sm font-semibold">{item.count}/{item.total}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`${item.color} h-2 rounded-full`}
                          style={{ width: `${(item.count / item.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 5: 归档查询 */}
          <TabsContent value="archive" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">🗄️ 单证归档查询系统</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Archive Search System - 查询历史归档的订单单证记录
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <Input placeholder="输入订单号、合同号、客户名称..." className="flex-1" />
                  <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option>全部时间</option>
                    <option>本月</option>
                    <option>近3个月</option>
                    <option>近半年</option>
                    <option>本年度</option>
                  </select>
                  <Button style={{ background: '#F96302' }} className="text-white">
                    <Search className="h-4 w-4 mr-1.5" />
                    搜索
                  </Button>
                </div>

                <div className="text-center py-12 text-gray-500">
                  <Archive className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <div className="text-sm">输入关键词开始搜索归档单证</div>
                  <div className="text-xs text-gray-400 mt-1">系统保存近5年的完整单证记录</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
