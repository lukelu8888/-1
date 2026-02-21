// 🏭 THE COSUN BM - 单证员专业工作台 Pro版
// Documentation Officer Professional Workbench Pro - Taiwan Enterprise Premium Style
// 🎯 设计理念：台湾大厂ERP风格 - 高密度信息展示 + 专业化操作 + 紧凑型布局

import React, { useState, useMemo } from 'react';
import { 
  FileText, Search, Filter, AlertTriangle, CheckCircle2, Clock, 
  XCircle, Download, Upload, Eye, Plus, RefreshCw, Archive,
  BarChart3, TrendingUp, Calendar, Bell, ChevronRight, Package,
  Ship, DollarSign, FileCheck, Truck, Plane, FileSignature,
  Printer, Send, Save, AlertCircle, PlayCircle, PauseCircle,
  List, Grid, Settings, MoreHorizontal, CheckSquare, Square,
  Target, Zap, BookOpen, ClipboardList
} from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';

// 🔥 13项标准出口单证清单（符合海关规定）
const DOCUMENT_CHECKLIST = [
  { id: 'D01', name: '出口退税申报表', nameEn: 'Export Tax Refund Declaration', required: true, category: 'tax', icon: FileText, deadline: 30, sop: '出货后30天内提交' },
  { id: 'D02', name: '购销合同/发票/付款凭证', nameEn: 'Purchase Contract/Invoice/Payment', required: true, category: 'trade', icon: FileSignature, deadline: 0, sop: '签订后立即归档' },
  { id: 'D03', name: '国内运输单据及运费凭证', nameEn: 'Domestic Transport Docs', required: false, category: 'logistics', icon: Truck, deadline: 7, sop: '发货后7天内' },
  { id: 'D04', name: '国内运费免责声明', nameEn: 'Domestic Freight Waiver', required: false, category: 'logistics', icon: XCircle, deadline: 0, sop: '根据合同条款' },
  { id: 'D05', name: '报关单/装箱单/提运单', nameEn: 'Customs Declaration/Packing List/B/L', required: true, category: 'customs', icon: FileCheck, deadline: 3, sop: '报关后3天内' },
  { id: 'D06', name: '委托报关合同及费用凭证', nameEn: 'Customs Agency Contract', required: false, category: 'customs', icon: FileSignature, deadline: 7, sop: '报关后7天内' },
  { id: 'D07', name: '采购发票及付款凭证', nameEn: 'Purchase Invoice/Payment', required: true, category: 'trade', icon: FileText, deadline: 15, sop: '采购后15天内' },
  { id: 'D08', name: '报关费用免责声明', nameEn: 'Customs Fee Waiver', required: false, category: 'customs', icon: XCircle, deadline: 0, sop: '根据合同条款' },
  { id: 'D09', name: '国际运费发票及付款凭证', nameEn: 'Intl Freight Invoice/Payment', required: false, category: 'logistics', icon: Plane, deadline: 15, sop: '开船后15天内' },
  { id: 'D10', name: '国际运费免责声明', nameEn: 'Intl Freight Waiver', required: false, category: 'logistics', icon: XCircle, deadline: 0, sop: '根据合同条款' },
  { id: 'D11', name: '收汇水单', nameEn: 'Foreign Exchange Receipt', required: true, category: 'finance', icon: DollarSign, deadline: 90, sop: '出货后90天内' },
  { id: 'D12', name: '结汇水单', nameEn: 'FX Settlement Certificate', required: true, category: 'finance', icon: DollarSign, deadline: 95, sop: '收汇后5天内' },
  { id: 'D13', name: '出口退税收汇凭证表', nameEn: 'Tax Refund FX Certificate', required: true, category: 'tax', icon: FileCheck, deadline: 100, sop: '结汇后5天内' },
];

// 单证分类定义
const CATEGORIES = {
  tax: { label: '税务', color: 'bg-red-100 text-red-800 border-red-300' },
  trade: { label: '贸易', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  customs: { label: '报关', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  logistics: { label: '物流', color: 'bg-green-100 text-green-800 border-green-300' },
  finance: { label: '财务', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
};

// 模拟订单数据
interface DocumentStatus {
  status: 'missing' | 'uploading' | 'uploaded' | 'reviewing' | 'approved' | 'rejected' | 'na';
  uploadDate?: string;
  uploadBy?: string;
  reviewer?: string;
  reviewDate?: string;
  version?: number;
  fileSize?: string;
  remarks?: string;
  urgency?: 'high' | 'medium' | 'low';
}

interface ShipmentOrder {
  orderId: string;
  contractNo: string;
  customerName: string;
  salesRep: string;
  status: 'pending' | 'processing' | 'reviewing' | 'completed' | 'overdue';
  priority: 'urgent' | 'high' | 'normal' | 'low';
  completionRate: number;
  requiredDocs: number;
  completedDocs: number;
  missingDocs: number;
  overdueItems: number;
  shipmentDate: string;
  eta: string;
  destPort: string;
  totalValue: number;
  currency: string;
  incoterm: string;
  container: string;
  documents: { [key: string]: DocumentStatus };
  lastUpdate: string;
  daysRemaining: number;
}

const mockOrders: ShipmentOrder[] = [
  {
    orderId: 'SO-NA-20251210-001',
    contractNo: 'SC-NA-20251201-001',
    customerName: 'Home Depot Inc.',
    salesRep: '张伟',
    status: 'overdue',
    priority: 'urgent',
    completionRate: 54,
    requiredDocs: 11,
    completedDocs: 6,
    missingDocs: 5,
    overdueItems: 2,
    shipmentDate: '2025-12-15',
    eta: '2026-01-05',
    destPort: 'Los Angeles',
    totalValue: 125000,
    currency: 'USD',
    incoterm: 'FOB',
    container: '40HQ x2',
    lastUpdate: '2025-12-11 14:23',
    daysRemaining: -1,
    documents: {
      D01: { status: 'approved', uploadDate: '2025-12-09', uploadBy: '李单证', reviewer: '张主管', reviewDate: '2025-12-09', version: 1, fileSize: '2.3MB' },
      D02: { status: 'approved', uploadDate: '2025-12-08', uploadBy: '李单证', reviewer: '张主管', reviewDate: '2025-12-08', version: 2, fileSize: '1.8MB' },
      D03: { status: 'uploaded', uploadDate: '2025-12-10', uploadBy: '李单证', version: 1, fileSize: '890KB', urgency: 'high' },
      D04: { status: 'na' },
      D05: { status: 'missing', urgency: 'high' },
      D06: { status: 'uploaded', uploadDate: '2025-12-10', uploadBy: '李单证', version: 1, fileSize: '1.2MB' },
      D07: { status: 'approved', uploadDate: '2025-12-09', uploadBy: '李单证', reviewer: '财务部', reviewDate: '2025-12-10', version: 1, fileSize: '3.1MB' },
      D08: { status: 'na' },
      D09: { status: 'na' },
      D10: { status: 'na' },
      D11: { status: 'missing', urgency: 'high' },
      D12: { status: 'missing' },
      D13: { status: 'missing' },
    }
  },
  {
    orderId: 'SO-EU-20251208-003',
    contractNo: 'SC-EU-20251125-002',
    customerName: 'Leroy Merlin S.A.',
    salesRep: '王芳',
    status: 'processing',
    priority: 'high',
    completionRate: 73,
    requiredDocs: 11,
    completedDocs: 8,
    missingDocs: 3,
    overdueItems: 0,
    shipmentDate: '2025-12-20',
    eta: '2026-01-15',
    destPort: 'Rotterdam',
    totalValue: 89000,
    currency: 'EUR',
    incoterm: 'CIF',
    container: '40HQ x1',
    lastUpdate: '2025-12-11 10:15',
    daysRemaining: 9,
    documents: {
      D01: { status: 'approved', uploadDate: '2025-12-07', uploadBy: '李单证', reviewer: '张主管', reviewDate: '2025-12-07', version: 1, fileSize: '1.9MB' },
      D02: { status: 'approved', uploadDate: '2025-12-06', uploadBy: '李单证', reviewer: '张主管', reviewDate: '2025-12-06', version: 1, fileSize: '2.1MB' },
      D03: { status: 'na' },
      D04: { status: 'approved', uploadDate: '2025-12-06', uploadBy: '李单证', reviewer: '张主管', version: 1, fileSize: '156KB' },
      D05: { status: 'approved', uploadDate: '2025-12-08', uploadBy: '李单证', reviewer: '报关行', reviewDate: '2025-12-08', version: 1, fileSize: '4.5MB' },
      D06: { status: 'approved', uploadDate: '2025-12-08', uploadBy: '李单证', reviewer: '财务部', reviewDate: '2025-12-09', version: 1, fileSize: '780KB' },
      D07: { status: 'approved', uploadDate: '2025-12-06', uploadBy: '李单证', reviewer: '财务部', reviewDate: '2025-12-07', version: 1, fileSize: '2.8MB' },
      D08: { status: 'na' },
      D09: { status: 'approved', uploadDate: '2025-12-09', uploadBy: '李单证', reviewer: '财务部', reviewDate: '2025-12-10', version: 1, fileSize: '1.5MB' },
      D10: { status: 'na' },
      D11: { status: 'reviewing', uploadDate: '2025-12-10', uploadBy: '李单证', version: 1, fileSize: '234KB', urgency: 'medium' },
      D12: { status: 'missing', urgency: 'medium' },
      D13: { status: 'missing', urgency: 'low' },
    }
  },
  {
    orderId: 'SO-NA-20251205-002',
    contractNo: 'SC-NA-20251120-005',
    customerName: "Lowe's Companies",
    salesRep: '张伟',
    status: 'completed',
    priority: 'normal',
    completionRate: 100,
    requiredDocs: 10,
    completedDocs: 10,
    missingDocs: 0,
    overdueItems: 0,
    shipmentDate: '2025-12-10',
    eta: '2025-12-28',
    destPort: 'New York',
    totalValue: 156000,
    currency: 'USD',
    incoterm: 'CFR',
    container: '40GP x3',
    lastUpdate: '2025-12-11 09:30',
    daysRemaining: 17,
    documents: {
      D01: { status: 'approved', uploadDate: '2025-12-04', uploadBy: '李单证', reviewer: '张主管', reviewDate: '2025-12-04', version: 1, fileSize: '2.1MB' },
      D02: { status: 'approved', uploadDate: '2025-12-03', uploadBy: '李单证', reviewer: '张主管', reviewDate: '2025-12-03', version: 1, fileSize: '1.9MB' },
      D03: { status: 'approved', uploadDate: '2025-12-05', uploadBy: '李单证', reviewer: '物流部', reviewDate: '2025-12-05', version: 1, fileSize: '1.1MB' },
      D04: { status: 'na' },
      D05: { status: 'approved', uploadDate: '2025-12-05', uploadBy: '李单证', reviewer: '报关行', reviewDate: '2025-12-05', version: 1, fileSize: '3.8MB' },
      D06: { status: 'approved', uploadDate: '2025-12-06', uploadBy: '李单证', reviewer: '财务部', reviewDate: '2025-12-06', version: 1, fileSize: '890KB' },
      D07: { status: 'approved', uploadDate: '2025-12-03', uploadBy: '李单证', reviewer: '财务部', reviewDate: '2025-12-04', version: 1, fileSize: '3.2MB' },
      D08: { status: 'na' },
      D09: { status: 'approved', uploadDate: '2025-12-07', uploadBy: '李单证', reviewer: '财务部', reviewDate: '2025-12-08', version: 1, fileSize: '1.4MB' },
      D10: { status: 'na' },
      D11: { status: 'approved', uploadDate: '2025-12-06', uploadBy: '财务部', reviewer: '银行', reviewDate: '2025-12-07', version: 1, fileSize: '345KB' },
      D12: { status: 'approved', uploadDate: '2025-12-08', uploadBy: '财务部', reviewer: '银行', reviewDate: '2025-12-09', version: 1, fileSize: '298KB' },
      D13: { status: 'approved', uploadDate: '2025-12-09', uploadBy: '李单证', reviewer: '税务部', reviewDate: '2025-12-10', version: 1, fileSize: '567KB' },
    }
  },
  {
    orderId: 'SO-SA-20251207-004',
    contractNo: 'SC-SA-20251128-003',
    customerName: 'Sodimac S.A.',
    salesRep: '李芳',
    status: 'processing',
    priority: 'normal',
    completionRate: 45,
    requiredDocs: 11,
    completedDocs: 5,
    missingDocs: 6,
    overdueItems: 0,
    shipmentDate: '2025-12-25',
    eta: '2026-02-10',
    destPort: 'Valparaiso',
    totalValue: 67000,
    currency: 'USD',
    incoterm: 'FOB',
    container: '20GP x2',
    lastUpdate: '2025-12-11 11:45',
    daysRemaining: 14,
    documents: {
      D01: { status: 'uploaded', uploadDate: '2025-12-10', uploadBy: '李单证', version: 1, fileSize: '1.8MB', urgency: 'low' },
      D02: { status: 'approved', uploadDate: '2025-12-05', uploadBy: '李单证', reviewer: '张主管', reviewDate: '2025-12-05', version: 1, fileSize: '2.0MB' },
      D03: { status: 'na' },
      D04: { status: 'approved', uploadDate: '2025-12-05', uploadBy: '李单证', reviewer: '张主管', version: 1, fileSize: '178KB' },
      D05: { status: 'uploaded', uploadDate: '2025-12-11', uploadBy: '李单证', version: 1, fileSize: '3.9MB', urgency: 'medium' },
      D06: { status: 'missing', urgency: 'low' },
      D07: { status: 'approved', uploadDate: '2025-12-06', uploadBy: '李单证', reviewer: '财务部', reviewDate: '2025-12-07', version: 1, fileSize: '2.7MB' },
      D08: { status: 'na' },
      D09: { status: 'na' },
      D10: { status: 'na' },
      D11: { status: 'missing', urgency: 'low' },
      D12: { status: 'missing' },
      D13: { status: 'missing' },
    }
  },
];

export function DocumentationOfficerWorkbenchPro() {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showSOPGuide, setShowSOPGuide] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'archived'>('current'); // 🔥 新增：当前/历史切换
  const [timeRange, setTimeRange] = useState<string>('current_month'); // 🔥 新增：时间范围筛选

  // 🔥 根据activeTab筛选订单（当前 vs 历史）
  const filteredOrders = useMemo(() => {
    let orders = mockOrders;
    
    // 🔥 Tab筛选：当前任务 vs 历史归档
    if (activeTab === 'current') {
      // 当前任务：待处理、处理中、审核中、超期（未完成的）
      orders = orders.filter(o => o.status !== 'completed');
    } else {
      // 历史归档：已完成的订单
      orders = orders.filter(o => o.status === 'completed');
    }
    
    // 状态筛选
    if (filterStatus !== 'all') {
      orders = orders.filter(o => o.status === filterStatus);
    }
    
    // 优先级筛选
    if (filterPriority !== 'all') {
      orders = orders.filter(o => o.priority === filterPriority);
    }
    
    // 搜索筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      orders = orders.filter(o => 
        o.orderId.toLowerCase().includes(query) ||
        o.contractNo.toLowerCase().includes(query) ||
        o.customerName.toLowerCase().includes(query) ||
        o.salesRep.toLowerCase().includes(query)
      );
    }
    
    return orders;
  }, [activeTab, filterStatus, filterPriority, searchQuery]);

  // 实时统计数据
  const stats = useMemo(() => {
    const total = mockOrders.length;
    const overdue = mockOrders.filter(o => o.status === 'overdue').length;
    const processing = mockOrders.filter(o => o.status === 'processing').length;
    const completed = mockOrders.filter(o => o.status === 'completed').length;
    const avgCompletion = Math.round(mockOrders.reduce((sum, o) => sum + o.completionRate, 0) / total);
    const totalMissing = mockOrders.reduce((sum, o) => sum + o.missingDocs, 0);
    const totalOverdueItems = mockOrders.reduce((sum, o) => sum + o.overdueItems, 0);
    
    return { total, overdue, processing, completed, avgCompletion, totalMissing, totalOverdueItems };
  }, []);

  // 紧急待办事项
  const urgentTasks = useMemo(() => {
    const tasks: Array<{ orderId: string; docId: string; docName: string; deadline: string; priority: string }> = [];
    mockOrders.forEach(order => {
      Object.entries(order.documents).forEach(([docId, doc]) => {
        if (doc.status === 'missing' && doc.urgency === 'high') {
          const docInfo = DOCUMENT_CHECKLIST.find(d => d.id === docId);
          if (docInfo) {
            tasks.push({
              orderId: order.orderId,
              docId,
              docName: docInfo.name,
              deadline: order.shipmentDate,
              priority: order.priority
            });
          }
        }
      });
    });
    return tasks;
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'overdue': return <Badge className="bg-red-600 text-white text-[10px] px-1.5 py-0">超期</Badge>;
      case 'processing': return <Badge className="bg-blue-500 text-white text-[10px] px-1.5 py-0">处理中</Badge>;
      case 'reviewing': return <Badge className="bg-yellow-500 text-white text-[10px] px-1.5 py-0">审核中</Badge>;
      case 'completed': return <Badge className="bg-green-600 text-white text-[10px] px-1.5 py-0">已完成</Badge>;
      default: return <Badge className="bg-gray-400 text-white text-[10px] px-1.5 py-0">待处理</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Badge className="bg-red-100 text-red-800 border border-red-300 text-[10px] px-1.5 py-0">紧急</Badge>;
      case 'high': return <Badge className="bg-orange-100 text-orange-800 border border-orange-300 text-[10px] px-1.5 py-0">高</Badge>;
      case 'normal': return <Badge className="bg-blue-100 text-blue-800 border border-blue-300 text-[10px] px-1.5 py-0">正常</Badge>;
      case 'low': return <Badge className="bg-gray-100 text-gray-800 border border-gray-300 text-[10px] px-1.5 py-0">低</Badge>;
      default: return null;
    }
  };

  const getDocStatusBadge = (status: string) => {
    switch (status) {
      case 'missing': return <span className="inline-flex items-center gap-0.5 text-red-600 text-[11px]"><XCircle className="h-3 w-3" />缺失</span>;
      case 'uploading': return <span className="inline-flex items-center gap-0.5 text-blue-600 text-[11px]"><Upload className="h-3 w-3" />上传中</span>;
      case 'uploaded': return <span className="inline-flex items-center gap-0.5 text-blue-600 text-[11px]"><Clock className="h-3 w-3" />已上传</span>;
      case 'reviewing': return <span className="inline-flex items-center gap-0.5 text-yellow-600 text-[11px]"><Eye className="h-3 w-3" />审核中</span>;
      case 'approved': return <span className="inline-flex items-center gap-0.5 text-green-600 text-[11px]"><CheckCircle2 className="h-3 w-3" />已批准</span>;
      case 'rejected': return <span className="inline-flex items-center gap-0.5 text-orange-600 text-[11px]"><AlertTriangle className="h-3 w-3" />已驳回</span>;
      case 'na': return <span className="inline-flex items-center gap-0.5 text-gray-400 text-[11px]"><span className="h-3 w-3 rounded-full bg-gray-300"></span>N/A</span>;
      default: return null;
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const toggleAllOrders = () => {
    setSelectedOrders(prev => 
      prev.length === mockOrders.length ? [] : mockOrders.map(o => o.orderId)
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🔥 顶部工作台标题栏 - 台湾大厂深色风格 */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700">
        <div className="px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-orange-400" style={{ color: '#F96302' }} />
                <h1 className="text-white text-lg font-semibold">单证管理工作台 Pro</h1>
              </div>
              <div className="h-4 w-px bg-slate-600"></div>
              <span className="text-slate-400 text-xs">Documentation Officer Workbench · THE COSUN BM 出口单证全流程管控中心</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">最后更新: 2025-12-11 14:30</span>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-300 hover:text-white hover:bg-slate-700">
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                刷新
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-300 hover:text-white hover:bg-slate-700">
                <Settings className="h-3.5 w-3.5 mr-1" />
                设置
              </Button>
              <Button size="sm" className="h-7 text-xs text-white" style={{ background: '#F96302' }}>
                <Download className="h-3.5 w-3.5 mr-1" />
                导出报表
              </Button>
            </div>
          </div>
        </div>

        {/* 🔥 紧凑型统计看板 - 单行展示 */}
        <div className="px-4 pb-2.5">
          <div className="grid grid-cols-8 gap-2">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded px-2.5 py-1.5 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 mb-0.5">总订单</div>
                <div className="text-xl font-bold text-white leading-none">{stats.total}</div>
              </div>
              <Package className="h-4 w-4 text-blue-400" />
            </div>
            <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/40 rounded px-2.5 py-1.5 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-red-200 mb-0.5">超期</div>
                <div className="text-xl font-bold text-red-100 leading-none">{stats.overdue}</div>
              </div>
              <AlertTriangle className="h-4 w-4 text-red-300" />
            </div>
            <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-500/40 rounded px-2.5 py-1.5 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-blue-200 mb-0.5">处理中</div>
                <div className="text-xl font-bold text-blue-100 leading-none">{stats.processing}</div>
              </div>
              <PlayCircle className="h-4 w-4 text-blue-300" />
            </div>
            <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/40 rounded px-2.5 py-1.5 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-green-200 mb-0.5">已完成</div>
                <div className="text-xl font-bold text-green-100 leading-none">{stats.completed}</div>
              </div>
              <CheckCircle2 className="h-4 w-4 text-green-300" />
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded px-2.5 py-1.5 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 mb-0.5">平均进度</div>
                <div className="text-xl font-bold text-white leading-none">{stats.avgCompletion}%</div>
              </div>
              <TrendingUp className="h-4 w-4 text-orange-400" />
            </div>
            <div className="bg-orange-500/20 backdrop-blur-sm border border-orange-500/40 rounded px-2.5 py-1.5 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-orange-200 mb-0.5">缺失单证</div>
                <div className="text-xl font-bold text-orange-100 leading-none">{stats.totalMissing}</div>
              </div>
              <FileText className="h-4 w-4 text-orange-300" />
            </div>
            <div className="bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/40 rounded px-2.5 py-1.5 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-yellow-200 mb-0.5">超期项</div>
                <div className="text-xl font-bold text-yellow-100 leading-none">{stats.totalOverdueItems}</div>
              </div>
              <AlertCircle className="h-4 w-4 text-yellow-300" />
            </div>
            <button
              onClick={() => setShowSOPGuide(!showSOPGuide)}
              className="bg-purple-500/20 backdrop-blur-sm border border-purple-500/40 rounded px-2.5 py-1.5 flex items-center justify-between hover:bg-purple-500/30 transition-colors cursor-pointer"
            >
              <div>
                <div className="text-[10px] text-purple-200 mb-0.5">SOP指引</div>
                <div className="text-xs font-semibold text-purple-100 leading-none">查看流程</div>
              </div>
              <BookOpen className="h-4 w-4 text-purple-300" />
            </button>
          </div>
        </div>
      </div>

      {/* 🔥 主工作区 - 双栏布局 */}
      <div className="flex gap-3 p-3">
        {/* 左侧：紧急待办 + SOP指引 */}
        <div className="w-80 flex-shrink-0 space-y-3">
          {/* 紧急待办 */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-3 py-2 border-b border-gray-200 bg-red-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                  <span className="text-xs font-semibold text-red-900">紧急待办</span>
                </div>
                <Badge className="bg-red-600 text-white text-[10px] px-1.5 py-0">{urgentTasks.length}</Badge>
              </div>
            </div>
            <div className="p-2 space-y-1.5 max-h-64 overflow-y-auto">
              {urgentTasks.length === 0 ? (
                <div className="text-center py-4 text-xs text-gray-400">暂无紧急待办</div>
              ) : (
                urgentTasks.map((task, idx) => (
                  <div key={idx} className="p-2 bg-red-50 border border-red-200 rounded text-xs hover:bg-red-100 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="font-semibold text-red-900 text-[11px]">{task.orderId}</span>
                      {getPriorityBadge(task.priority)}
                    </div>
                    <div className="text-red-700 text-[11px] mb-1">{task.docName}</div>
                    <div className="flex items-center gap-1 text-[10px] text-red-600">
                      <Clock className="h-3 w-3" />
                      截止: {task.deadline}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SOP标准流程指引 */}
          {showSOPGuide && (
            <div className="bg-white border border-purple-200 rounded-lg shadow-sm">
              <div className="px-3 py-2 border-b border-purple-200 bg-purple-50">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-purple-600" />
                  <span className="text-xs font-semibold text-purple-900">SOP标准流程</span>
                </div>
              </div>
              <div className="p-2 space-y-1 max-h-96 overflow-y-auto">
                {DOCUMENT_CHECKLIST.filter(d => d.required).map((doc, idx) => (
                  <div key={doc.id} className="p-2 bg-purple-50/50 border border-purple-100 rounded">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-[10px] font-bold mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold text-purple-900 mb-0.5">{doc.name}</div>
                        <div className="text-[10px] text-purple-700 mb-1">{doc.nameEn}</div>
                        <div className="flex items-center gap-1 text-[10px] text-purple-600">
                          <Target className="h-3 w-3" />
                          {doc.sop}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 今日统计 */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-3 py-2 border-b border-gray-200 bg-blue-50">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-xs font-semibold text-blue-900">今日统计</span>
              </div>
            </div>
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">已处理单证</span>
                <span className="text-sm font-bold text-green-600">12份</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">已审核通过</span>
                <span className="text-sm font-bold text-blue-600">8份</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">待上传</span>
                <span className="text-sm font-bold text-orange-600">5份</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">驳回重做</span>
                <span className="text-sm font-bold text-red-600">1份</span>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：订单单证列表 */}
        <div className="flex-1 space-y-3">
          {/* 工具栏 */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-2.5">
            {/* 🔥 Tab切换：当前任务 vs 历史归档 */}
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('current')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                  activeTab === 'current'
                    ? 'bg-orange-100 text-orange-800 border border-orange-300'
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
                style={activeTab === 'current' ? { background: '#FFF7ED', borderColor: '#F96302', color: '#F96302' } : {}}
              >
                <PlayCircle className="h-3.5 w-3.5" />
                当前任务
                <Badge className="bg-white text-orange-600 text-[10px] px-1.5 py-0 ml-1" style={{ background: 'white', color: '#F96302' }}>
                  {mockOrders.filter(o => o.status !== 'completed').length}
                </Badge>
              </button>
              <button
                onClick={() => setActiveTab('archived')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                  activeTab === 'archived'
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                <Archive className="h-3.5 w-3.5" />
                历史归档
                <Badge className={`text-[10px] px-1.5 py-0 ml-1 ${
                  activeTab === 'archived' ? 'bg-white text-green-600' : 'bg-gray-200 text-gray-600'
                }`}>
                  {mockOrders.filter(o => o.status === 'completed').length}
                </Badge>
              </button>
              <div className="h-4 w-px bg-gray-300 mx-1"></div>
              {/* 🔥 时间范围筛选（仅历史归档时显示） */}
              {activeTab === 'archived' && (
                <select 
                  className="border border-gray-300 rounded px-2 py-1.5 text-xs h-8"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <option value="current_month">本月</option>
                  <option value="last_month">上月</option>
                  <option value="current_quarter">本季度</option>
                  <option value="last_quarter">上季度</option>
                  <option value="current_year">本年度</option>
                  <option value="last_year">去年</option>
                  <option value="all">全部</option>
                </select>
              )}
              <div className="flex-1"></div>
              <span className="text-[10px] text-gray-500">
                {activeTab === 'current' ? '显示进行中的订单' : `显示已完成的历史订单 · ${timeRange === 'current_month' ? '本月' : timeRange === 'all' ? '全部' : '筛选中'}`}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    placeholder="搜索订单号、合同号、客户名称..."
                    className="pl-8 h-8 text-xs border-gray-300"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select 
                  className="border border-gray-300 rounded px-2 py-1.5 text-xs h-8"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">全部状态</option>
                  <option value="overdue">超期</option>
                  <option value="processing">处理中</option>
                  <option value="reviewing">审核中</option>
                  <option value="completed">已完成</option>
                </select>
                <select 
                  className="border border-gray-300 rounded px-2 py-1.5 text-xs h-8"
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                >
                  <option value="all">全部优先级</option>
                  <option value="urgent">紧急</option>
                  <option value="high">高</option>
                  <option value="normal">正常</option>
                  <option value="low">低</option>
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                {selectedOrders.length > 0 && (
                  <>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      <Download className="h-3.5 w-3.5 mr-1" />
                      批量下载
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      <Printer className="h-3.5 w-3.5 mr-1" />
                      批量打印
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      <Archive className="h-3.5 w-3.5 mr-1" />
                      批量归档
                    </Button>
                    <div className="h-4 w-px bg-gray-300"></div>
                  </>
                )}
                <div className="flex items-center gap-0.5 border border-gray-300 rounded overflow-hidden">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-2 py-1.5 text-xs ${viewMode === 'table' ? 'bg-gray-200' : 'bg-white hover:bg-gray-50'}`}
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`px-2 py-1.5 text-xs ${viewMode === 'kanban' ? 'bg-gray-200' : 'bg-white hover:bg-gray-50'}`}
                  >
                    <Grid className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 订单列表 - 超紧凑表格 */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-2 py-1.5 text-left w-8">
                      <input
                        type="checkbox"
                        checked={selectedOrders.length === mockOrders.length}
                        onChange={toggleAllOrders}
                        className="h-3.5 w-3.5 rounded border-gray-300"
                      />
                    </th>
                    <th className="px-2 py-1.5 text-left font-semibold text-gray-700 text-[11px]">订单信息</th>
                    <th className="px-2 py-1.5 text-left font-semibold text-gray-700 text-[11px]">客户/业务员</th>
                    <th className="px-2 py-1.5 text-center font-semibold text-gray-700 text-[11px]">单证进度</th>
                    <th className="px-2 py-1.5 text-center font-semibold text-gray-700 text-[11px]">状态</th>
                    <th className="px-2 py-1.5 text-left font-semibold text-gray-700 text-[11px]">船期信息</th>
                    <th className="px-2 py-1.5 text-center font-semibold text-gray-700 text-[11px]">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <React.Fragment key={order.orderId}>
                      <tr 
                        className={`border-b hover:bg-blue-50/50 transition-colors cursor-pointer ${
                          order.status === 'overdue' ? 'bg-red-50/30' : ''
                        }`}
                        onClick={() => setExpandedOrder(expandedOrder === order.orderId ? null : order.orderId)}
                      >
                        <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order.orderId)}
                            onChange={() => toggleOrderSelection(order.orderId)}
                            className="h-3.5 w-3.5 rounded border-gray-300"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-start gap-1.5">
                            <ChevronRight className={`h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5 transition-transform ${
                              expandedOrder === order.orderId ? 'rotate-90' : ''
                            }`} />
                            <div>
                              <div className="font-semibold text-gray-900 text-[11px]">{order.orderId}</div>
                              <div className="text-[10px] text-gray-500">{order.contractNo}</div>
                              <div className="text-[10px] text-gray-500">{order.currency} {order.totalValue.toLocaleString()}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <div className="text-[11px] font-medium text-gray-900">{order.customerName}</div>
                          <div className="text-[10px] text-gray-500">业务员: {order.salesRep}</div>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full transition-all ${
                                  order.completionRate === 100 ? 'bg-green-500' : 
                                  order.completionRate >= 70 ? 'bg-blue-500' : 
                                  order.completionRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${order.completionRate}%` }}
                              ></div>
                            </div>
                            <div className="text-[10px] font-semibold text-gray-700">{order.completionRate}%</div>
                            <div className="text-[10px] text-gray-500">
                              {order.completedDocs}/{order.requiredDocs}份
                              {order.missingDocs > 0 && (
                                <span className="text-red-600 ml-1">缺{order.missingDocs}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex flex-col items-center gap-1">
                            {getStatusBadge(order.status)}
                            {getPriorityBadge(order.priority)}
                            {order.overdueItems > 0 && (
                              <Badge className="bg-red-100 text-red-800 border border-red-300 text-[10px] px-1.5 py-0">
                                超期{order.overdueItems}项
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <div className="text-[10px] space-y-0.5">
                            <div className="flex items-center gap-1">
                              <Ship className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-600">{order.shipmentDate}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-600">{order.destPort}</span>
                            </div>
                            <div className="text-gray-500">{order.incoterm} · {order.container}</div>
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center justify-center gap-0.5">
                            <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px]">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px]">
                              <Upload className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px]">
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px]">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* 展开的单证详情 */}
                      {expandedOrder === order.orderId && (
                        <tr>
                          <td colSpan={7} className="px-2 py-2 bg-blue-50/30">
                            <div className="grid grid-cols-13 gap-1">
                              {DOCUMENT_CHECKLIST.map((doc) => {
                                const docStatus = order.documents[doc.id] || { status: 'missing' };
                                const Icon = doc.icon;
                                
                                return (
                                  <div
                                    key={doc.id}
                                    className={`p-1.5 rounded border text-center ${
                                      docStatus.status === 'approved' ? 'bg-green-50 border-green-300' :
                                      docStatus.status === 'uploaded' || docStatus.status === 'reviewing' ? 'bg-blue-50 border-blue-300' :
                                      docStatus.status === 'missing' ? 'bg-red-50 border-red-300' :
                                      docStatus.status === 'rejected' ? 'bg-orange-50 border-orange-300' :
                                      'bg-gray-50 border-gray-200'
                                    }`}
                                  >
                                    <div className="flex flex-col items-center gap-0.5">
                                      <Icon className={`h-3.5 w-3.5 ${
                                        docStatus.status === 'approved' ? 'text-green-600' :
                                        docStatus.status === 'uploaded' || docStatus.status === 'reviewing' ? 'text-blue-600' :
                                        docStatus.status === 'missing' ? 'text-red-600' :
                                        docStatus.status === 'rejected' ? 'text-orange-600' :
                                        'text-gray-400'
                                      }`} />
                                      <span className="text-[9px] font-bold text-gray-700">{doc.id}</span>
                                      <div className="text-[10px]">
                                        {getDocStatusBadge(docStatus.status)}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[10px] text-gray-600">
                              <div>最后更新: {order.lastUpdate}</div>
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" className="h-6 text-[10px]">
                                  <Upload className="h-3 w-3 mr-1" />
                                  批量上传
                                </Button>
                                <Button size="sm" variant="outline" className="h-6 text-[10px]">
                                  <Download className="h-3 w-3 mr-1" />
                                  打包下载
                                </Button>
                                <Button size="sm" variant="outline" className="h-6 text-[10px]">
                                  <Printer className="h-3 w-3 mr-1" />
                                  打印清单
                                </Button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}