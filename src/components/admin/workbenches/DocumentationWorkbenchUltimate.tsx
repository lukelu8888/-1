// 🏭 THE COSUN BM - 单证管理系统 Ultimate 终极版
// Documentation Management System Ultimate - Professional B2B Export Documentation
// 🎯 设计理念：完整业务流程 + 角色协作 + 智能提醒 + 文档管理

import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, Search, Filter, AlertTriangle, CheckCircle2, Clock, 
  XCircle, Download, Upload, Eye, Plus, RefreshCw, Archive,
  BarChart3, TrendingUp, Calendar, Bell, ChevronRight, Package,
  Ship, DollarSign, FileCheck, Truck, Plane, FileSignature,
  Printer, Send, Save, AlertCircle, PlayCircle, PauseCircle,
  List, Grid, Settings, MoreHorizontal, CheckSquare, Square,
  Target, Zap, BookOpen, ClipboardList, Users, History,
  FolderOpen, FileUp, FilePlus, MessageSquare, Activity,
  ArrowRight, Info, ExternalLink, Layers, GitBranch, X
} from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { useBusinessEvent } from '../../../lib/business-event-bus';
import { documentationService } from '../../../lib/services/documentation-service';
import { toast } from 'sonner';
import { IntegrationFlowPanel } from './IntegrationFlowPanel';
import { DocumentMatrixView } from './DocumentMatrixView';
import { DocumentLibrary } from './DocumentLibrary';
import { DocumentationReports } from './DocumentationReports';
import { DocumentTemplateSelector } from '../../documents/DocumentTemplateSelector';

// 🔥 13项标准出口单证清单（完整业务逻辑）
const DOCUMENT_CHECKLIST = [
  { 
    id: 'D01', 
    name: '出口退税申报表', 
    nameEn: 'Export Tax Refund Declaration',
    category: 'tax',
    required: true,
    triggerNode: '出货+结汇完成',
    responsible: '单证员+财务',
    generationType: 'auto',
    dependencies: ['D05', 'D11', 'D12', 'D13'],
    deadline: 30,
    deadlineUnit: 'days_after_shipment',
    sop: '出货后30天内，确保D05/D11/D12/D13齐全后，系统自动生成退税申报表',
    importance: 5,
    icon: FileText
  },
  { 
    id: 'D02', 
    name: '购销合同/发票/付款凭证', 
    nameEn: 'Sales Contract/Invoice/Payment',
    category: 'trade',
    required: true,
    triggerNode: '合同签订',
    responsible: '业务员',
    generationType: 'auto',
    dependencies: [],
    deadline: 0,
    deadlineUnit: 'immediate',
    sop: '合同签订时系统自动生成销售合同（SC），付款到账后财务上传付款凭证',
    importance: 5,
    icon: FileSignature
  },
  { 
    id: 'D03', 
    name: '国内运输单据及运费凭证', 
    nameEn: 'Domestic Transport Documents',
    category: 'logistics',
    required: false,
    triggerNode: '出货通知',
    responsible: '物流部',
    generationType: 'external',
    dependencies: ['shipping_notice'],
    deadline: 7,
    deadlineUnit: 'days_after_shipment',
    sop: '发货后7天内，物流部上传运输公司提供的运输单据和运费发票',
    importance: 3,
    icon: Truck,
    autoJudge: 'incoterm'  // 根据Incoterm自动判断是否需要
  },
  { 
    id: 'D04', 
    name: '国内运费免责声明', 
    nameEn: 'Domestic Freight Waiver',
    category: 'logistics',
    required: false,
    triggerNode: '合同签订',
    responsible: '系统自动',
    generationType: 'auto',
    dependencies: ['D02'],
    deadline: 0,
    deadlineUnit: 'immediate',
    sop: '系统根据合同Incoterm条款自动判断：EXW/FCA需要；FOB/CIF/CFR不需要',
    importance: 2,
    icon: XCircle,
    autoJudge: 'incoterm'
  },
  { 
    id: 'D05', 
    name: '报关单/装箱单/提运单', 
    nameEn: 'Customs Declaration/Packing List/B/L',
    category: 'customs',
    required: true,
    triggerNode: '报关',
    responsible: '报关行',
    generationType: 'external',
    dependencies: ['D02', 'packing_list'],
    deadline: 3,
    deadlineUnit: 'days_after_customs',
    sop: '报关后3天内，报关行提供海关盖章的报关单、装箱单、提运单（B/L）',
    importance: 5,
    icon: FileCheck
  },
  { 
    id: 'D06', 
    name: '委托报关合同及费用凭证', 
    nameEn: 'Customs Brokerage Contract',
    category: 'customs',
    required: false,
    triggerNode: '报关',
    responsible: '报关行+财务',
    generationType: 'external',
    dependencies: ['D05'],
    deadline: 7,
    deadlineUnit: 'days_after_customs',
    sop: '报关后7天内，报关行提供委托合同，财务提供付款凭证',
    importance: 3,
    icon: FileSignature
  },
  { 
    id: 'D07', 
    name: '采购发票及付款凭证', 
    nameEn: 'Purchase Invoice/Payment',
    category: 'trade',
    required: true,
    triggerNode: '采购付款',
    responsible: '采购+财务',
    generationType: 'auto',
    dependencies: ['purchase_contract'],
    deadline: 15,
    deadlineUnit: 'days_after_purchase',
    sop: '采购后15天内，系统生成采购合同（PC），财务上传付款凭证',
    importance: 4,
    icon: FileText
  },
  { 
    id: 'D08', 
    name: '报关费用免责声明', 
    nameEn: 'Customs Fee Waiver',
    category: 'customs',
    required: false,
    triggerNode: '报关',
    responsible: '系统自动',
    generationType: 'auto',
    dependencies: ['D02'],
    deadline: 0,
    deadlineUnit: 'immediate',
    sop: '系统根据合同条款自动判断：买方承担报关费则生成免责声明',
    importance: 2,
    icon: XCircle,
    autoJudge: 'contract_terms'
  },
  { 
    id: 'D09', 
    name: '国际运费发票及付款凭证', 
    nameEn: 'International Freight Invoice',
    category: 'logistics',
    required: false,
    triggerNode: '开船后',
    responsible: '货代+财务',
    generationType: 'external',
    dependencies: ['D05'],
    deadline: 15,
    deadlineUnit: 'days_after_shipment',
    sop: '开船后15天内，货代提供运费发票，财务上传付款凭证',
    importance: 3,
    icon: Plane,
    autoJudge: 'incoterm'
  },
  { 
    id: 'D10', 
    name: '国际运费免责声明', 
    nameEn: 'International Freight Waiver',
    category: 'logistics',
    required: false,
    triggerNode: '合同签订',
    responsible: '系统自动',
    generationType: 'auto',
    dependencies: ['D02'],
    deadline: 0,
    deadlineUnit: 'immediate',
    sop: '系统根据Incoterm自动判断：FOB/EXW/FCA需要；CIF/CFR不需要',
    importance: 2,
    icon: XCircle,
    autoJudge: 'incoterm'
  },
  { 
    id: 'D11', 
    name: '收汇水单', 
    nameEn: 'Foreign Exchange Receipt',
    category: 'finance',
    required: true,
    triggerNode: '客户付款到账',
    responsible: '财务部',
    generationType: 'external',
    dependencies: ['D02', 'D05'],
    deadline: 90,
    deadlineUnit: 'days_after_shipment',
    sop: '出货后90天内，财务部上传银行收汇水单（外汇入账凭证）',
    importance: 5,
    icon: DollarSign
  },
  { 
    id: 'D12', 
    name: '结汇水单', 
    nameEn: 'FX Settlement Certificate',
    category: 'finance',
    required: true,
    triggerNode: '收汇后',
    responsible: '财务部',
    generationType: 'external',
    dependencies: ['D11'],
    deadline: 5,
    deadlineUnit: 'days_after_collection',
    sop: '收汇后5天内，财务部完成结汇并上传银行结汇水单',
    importance: 5,
    icon: DollarSign
  },
  { 
    id: 'D13', 
    name: '出口退税收汇凭证表', 
    nameEn: 'Tax Refund FX Certificate',
    category: 'tax',
    required: true,
    triggerNode: '结汇后',
    responsible: '单证员+财务',
    generationType: 'auto',
    dependencies: ['D12'],
    deadline: 5,
    deadlineUnit: 'days_after_settlement',
    sop: '结汇后5天内，系统根据D12自动生成出口退税收汇凭证情况表',
    importance: 5,
    icon: FileCheck
  },
];

// 业务节点定义
const BUSINESS_STAGES = [
  { id: 'ing', name: '询价', color: 'bg-gray-100 text-gray-800', icon: MessageSquare },
  { id: 'qt', name: '报价', color: 'bg-blue-100 text-blue-800', icon: FileText },
  { id: 'contract', name: '合同签订', color: 'bg-purple-100 text-purple-800', icon: FileSignature },
  { id: 'procurement', name: '采购', color: 'bg-yellow-100 text-yellow-800', icon: Package },
  { id: 'production', name: '生产/验货', color: 'bg-orange-100 text-orange-800', icon: Activity },
  { id: 'shipping', name: '出货', color: 'bg-cyan-100 text-cyan-800', icon: Truck },
  { id: 'customs', name: '报关', color: 'bg-indigo-100 text-indigo-800', icon: FileCheck },
  { id: 'documentation', name: '单证制作', color: 'bg-pink-100 text-pink-800', icon: ClipboardList },
  { id: 'collection', name: '收汇', color: 'bg-green-100 text-green-800', icon: DollarSign },
  { id: 'tax_refund', name: '退税', color: 'bg-teal-100 text-teal-800', icon: TrendingUp },
  { id: 'archived', name: '已归档', color: 'bg-gray-100 text-gray-600', icon: Archive },
];

// 单证分类
const CATEGORIES = {
  tax: { label: '税务', color: 'bg-red-50 border-red-200 text-red-800' },
  trade: { label: '贸易', color: 'bg-blue-50 border-blue-200 text-blue-800' },
  customs: { label: '报关', color: 'bg-purple-50 border-purple-200 text-purple-800' },
  logistics: { label: '物流', color: 'bg-green-50 border-green-200 text-green-800' },
  finance: { label: '财务', color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
};

// 单证状态
type DocStatus = 'pending' | 'auto_generated' | 'uploaded' | 'reviewing' | 'approved' | 'rejected' | 'na' | 'overdue';

interface DocumentInstance {
  docId: string;
  status: DocStatus;
  uploadDate?: string;
  uploadBy?: string;
  reviewer?: string;
  reviewDate?: string;
  approveDate?: string;
  version: number;
  files: Array<{
    fileId: string;
    fileName: string;
    fileSize: string;
    fileType: string;
    uploadDate: string;
    storageUrl?: string;
  }>;
  urgency?: 'critical' | 'high' | 'medium' | 'low';
  remarks?: string;
  history: Array<{
    action: string;
    operator: string;
    timestamp: string;
    comment?: string;
  }>;
}

interface ShipmentOrder {
  orderId: string;
  contractNo: string;
  customerName: string;
  salesRep: string;
  businessStage: string;
  status: 'pending' | 'processing' | 'reviewing' | 'completed' | 'overdue';
  priority: 'critical' | 'urgent' | 'high' | 'normal' | 'low';
  completionRate: number;
  requiredDocs: number;
  completedDocs: number;
  missingDocs: number;
  overdueItems: number;
  
  // 业务节点日期
  contractDate: string;
  procurementDate?: string;
  shipmentDate: string;
  customsDate?: string;
  etd?: string;  // 预计开船日
  eta?: string;  // 预计到港日
  collectionDate?: string;
  settlementDate?: string;
  
  // 贸易条款
  incoterm: 'EXW' | 'FCA' | 'FOB' | 'CFR' | 'CIF';
  paymentTerm: string;
  destPort: string;
  container: string;
  totalValue: number;
  currency: string;
  
  documents: { [key: string]: DocumentInstance };
  alerts: Array<{
    alertType: 'missing' | 'overdue' | 'pending_approval' | 'dependency';
    docId: string;
    message: string;
    severity: 'critical' | 'high' | 'medium';
  }>;
  
  lastUpdate: string;
  daysRemaining: number;
}

// 模拟订单数据
const mockOrders: ShipmentOrder[] = [
  {
    orderId: 'SO-NA-20251210-001',
    contractNo: 'SC-NA-20251201-001',
    customerName: 'Home Depot Inc.',
    salesRep: '张伟',
    businessStage: 'customs',
    status: 'overdue',
    priority: 'critical',
    completionRate: 54,
    requiredDocs: 11,
    completedDocs: 6,
    missingDocs: 5,
    overdueItems: 2,
    contractDate: '2025-12-01',
    procurementDate: '2025-12-05',
    shipmentDate: '2025-12-15',
    customsDate: '2025-12-14',
    etd: '2025-12-16',
    eta: '2026-01-05',
    incoterm: 'FOB',
    paymentTerm: 'T/T 30% Deposit, 70% Before Shipment',
    destPort: 'Los Angeles',
    container: '40HQ x2',
    totalValue: 125000,
    currency: 'USD',
    lastUpdate: '2025-12-11 14:23',
    daysRemaining: -1,
    documents: {
      D01: { 
        docId: 'D01',
        status: 'pending', 
        version: 0,
        files: [],
        urgency: 'high',
        history: []
      },
      D02: { 
        docId: 'D02',
        status: 'approved', 
        uploadDate: '2025-12-01', 
        uploadBy: '张伟', 
        reviewer: '财务部', 
        reviewDate: '2025-12-01',
        approveDate: '2025-12-01',
        version: 2,
        files: [
          { fileId: 'F001', fileName: 'SC-NA-20251201-001.pdf', fileSize: '1.8MB', fileType: 'pdf', uploadDate: '2025-12-01' }
        ],
        history: [
          { action: '生成合同', operator: '系统', timestamp: '2025-12-01 10:00' },
          { action: '审核通过', operator: '财务部', timestamp: '2025-12-01 10:30', comment: '合同条款无误' }
        ]
      },
      D03: { 
        docId: 'D03',
        status: 'na',
        version: 0,
        files: [],
        history: []
      },
      D04: { 
        docId: 'D04',
        status: 'auto_generated', 
        uploadDate: '2025-12-01',
        uploadBy: '系统',
        version: 1,
        files: [
          { fileId: 'F004', fileName: 'Domestic_Freight_Waiver_FOB.pdf', fileSize: '156KB', fileType: 'pdf', uploadDate: '2025-12-01' }
        ],
        remarks: '根据FOB条款自动生成',
        history: [
          { action: '自动生成', operator: '系统', timestamp: '2025-12-01 10:00', comment: 'Incoterm: FOB，自动生成国内运费免责声明' }
        ]
      },
      D05: { 
        docId: 'D05',
        status: 'overdue', 
        urgency: 'critical',
        version: 0,
        files: [],
        history: [
          { action: '报关完成', operator: '报关行', timestamp: '2025-12-14 16:00', comment: '已完成报关，等待单据' }
        ]
      },
      D06: { 
        docId: 'D06',
        status: 'uploaded', 
        uploadDate: '2025-12-10', 
        uploadBy: '报关行',
        version: 1,
        files: [
          { fileId: 'F006', fileName: 'Customs_Agency_Contract.pdf', fileSize: '1.2MB', fileType: 'pdf', uploadDate: '2025-12-10' }
        ],
        urgency: 'medium',
        history: [
          { action: '上传文件', operator: '报关行', timestamp: '2025-12-10 14:00' }
        ]
      },
      D07: { 
        docId: 'D07',
        status: 'approved', 
        uploadDate: '2025-12-06', 
        uploadBy: '采购部', 
        reviewer: '财务部', 
        reviewDate: '2025-12-07',
        approveDate: '2025-12-08',
        version: 1,
        files: [
          { fileId: 'F007', fileName: 'PC-20251205-001.pdf', fileSize: '2.1MB', fileType: 'pdf', uploadDate: '2025-12-06' },
          { fileId: 'F007B', fileName: 'Payment_Voucher.jpg', fileSize: '890KB', fileType: 'image', uploadDate: '2025-12-07' }
        ],
        history: [
          { action: '生成采购合同', operator: '系统', timestamp: '2025-12-05 09:00' },
          { action: '上传付款凭证', operator: '财务部', timestamp: '2025-12-07 11:00' },
          { action: '审核通过', operator: '财务部', timestamp: '2025-12-08 10:00' }
        ]
      },
      D08: { 
        docId: 'D08',
        status: 'na',
        version: 0,
        files: [],
        history: []
      },
      D09: { 
        docId: 'D09',
        status: 'na',
        version: 0,
        files: [],
        history: []
      },
      D10: { 
        docId: 'D10',
        status: 'auto_generated', 
        uploadDate: '2025-12-01',
        uploadBy: '系统',
        version: 1,
        files: [
          { fileId: 'F010', fileName: 'Intl_Freight_Waiver_FOB.pdf', fileSize: '145KB', fileType: 'pdf', uploadDate: '2025-12-01' }
        ],
        remarks: '根据FOB条款自动生成',
        history: [
          { action: '自动生成', operator: '系统', timestamp: '2025-12-01 10:00', comment: 'Incoterm: FOB，自动生成国际运费免责声明' }
        ]
      },
      D11: { 
        docId: 'D11',
        status: 'pending', 
        urgency: 'critical',
        version: 0,
        files: [],
        history: []
      },
      D12: { 
        docId: 'D12',
        status: 'pending',
        version: 0,
        files: [],
        history: []
      },
      D13: { 
        docId: 'D13',
        status: 'pending',
        version: 0,
        files: [],
        history: []
      },
    },
    alerts: [
      { alertType: 'overdue', docId: 'D05', message: 'D05报关单已超期2天未上传', severity: 'critical' },
      { alertType: 'missing', docId: 'D11', message: 'D11收汇水单尚未收到客户付款', severity: 'high' },
      { alertType: 'dependency', docId: 'D01', message: 'D01依赖D05/D11/D12/D13，暂无法生成', severity: 'high' }
    ]
  },
  // ... 更多订单数据省略
];

export function DocumentationWorkbenchUltimate() {
  const [activeView, setActiveView] = useState<'order_detail' | 'document_library' | 'reports' | 'templates'>('document_library');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showAlertPanel, setShowAlertPanel] = useState(false);

  // 统计数据
  const stats = useMemo(() => {
    const total = mockOrders.length;
    const current = mockOrders.filter(o => o.status !== 'completed').length;
    const overdue = mockOrders.filter(o => o.status === 'overdue').length;
    const processing = mockOrders.filter(o => o.status === 'processing').length;
    const completed = mockOrders.filter(o => o.status === 'completed').length;
    const avgCompletion = Math.round(mockOrders.reduce((sum, o) => sum + o.completionRate, 0) / total);
    const totalMissing = mockOrders.reduce((sum, o) => sum + o.missingDocs, 0);
    const totalAlerts = mockOrders.reduce((sum, o) => sum + o.alerts.length, 0);
    const criticalAlerts = mockOrders.reduce((sum, o) => sum + o.alerts.filter(a => a.severity === 'critical').length, 0);
    
    return { total, current, overdue, processing, completed, avgCompletion, totalMissing, totalAlerts, criticalAlerts };
  }, []);

  // 紧急预警
  const criticalAlerts = useMemo(() => {
    const alerts: Array<{ orderId: string; alert: any }> = [];
    mockOrders.forEach(order => {
      order.alerts.filter(a => a.severity === 'critical').forEach(alert => {
        alerts.push({ orderId: order.orderId, alert });
      });
    });
    return alerts;
  }, []);

  // 🔥 监听：合同签订事件（实时刷新订单列表）
  useBusinessEvent('CONTRACT_SIGNED', (payload) => {
    console.log('📋 [单证系统UI] 检测到合同签订，刷新订单列表...', payload);
    toast.info(`订单 ${payload.orderId} 的单证任务已创建`);
    // TODO: 刷新订单列表
  });

  // 🔥 监听：单证齐全可退税
  useBusinessEvent('DOCS_READY_FOR_TAX_REFUND', (payload) => {
    console.log('📋 [单证系统UI] 检测到单证齐全，可提交退税...', payload);
    toast.success(`🎉 订单 ${payload.orderId} 的13项单证已齐全，可提交退税申报！`);
  });

  // 🔥 监听：报关完成
  useBusinessEvent('CUSTOMS_CLEARED', (payload) => {
    console.log('📋 [单证系统UI] 检测到报关完成...', payload);
    toast.info(`订单 ${payload.orderId} 报关完成，请上传D05报关单据`);
  });

  // 🔥 监听：收汇确认
  useBusinessEvent('PAYMENT_RECEIVED', (payload) => {
    console.log('📋 [单证系统UI] 检测到收汇确认...', payload);
    toast.success(`订单 ${payload.orderId} 收汇确认成功，D11已关联`);
  });

  // 🔥 监听：结汇完成
  useBusinessEvent('FX_SETTLED', (payload) => {
    console.log('📋 [单证系统UI] 检测到结汇完成...', payload);
    toast.success(`订单 ${payload.orderId} 结汇完成，D12已关联，D13已自动生成`);
  });



  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-gray-500',
      auto_generated: 'bg-blue-500',
      uploaded: 'bg-cyan-500',
      reviewing: 'bg-yellow-500',
      approved: 'bg-green-600',
      rejected: 'bg-red-600',
      overdue: 'bg-red-700',
      na: 'bg-gray-300'
    };
    const labels: Record<string, string> = {
      pending: '待处理',
      auto_generated: '自动生成',
      uploaded: '已上传',
      reviewing: '审核中',
      approved: '已批准',
      rejected: '已驳回',
      overdue: '超期',
      na: 'N/A'
    };
    return <Badge className={`${styles[status]} text-white text-[10px] px-1.5 py-0`}>{labels[status]}</Badge>;
  };

  const getDocStatusIcon = (status: DocStatus) => {
    switch (status) {
      case 'pending': return <Clock className="h-3.5 w-3.5 text-gray-500" />;
      case 'auto_generated': return <Zap className="h-3.5 w-3.5 text-blue-500" />;
      case 'uploaded': return <Upload className="h-3.5 w-3.5 text-cyan-500" />;
      case 'reviewing': return <Eye className="h-3.5 w-3.5 text-yellow-500" />;
      case 'approved': return <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />;
      case 'rejected': return <XCircle className="h-3.5 w-3.5 text-red-600" />;
      case 'overdue': return <AlertTriangle className="h-3.5 w-3.5 text-red-700" />;
      case 'na': return <span className="h-3.5 w-3.5 rounded-full bg-gray-300 inline-block" />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
      {/* 🔥 台湾大厂风格 - 顶部导航栏 */}
      <div className="border-b flex-shrink-0 w-full max-w-full overflow-hidden" style={{ 
        background: 'linear-gradient(to bottom, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
        borderColor: 'rgba(148, 163, 184, 0.1)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
      }}>
        <div className="px-6 py-3">
          <div className="flex items-center justify-between gap-4 min-w-0">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <div className="w-8 h-8 rounded flex items-center justify-center" style={{ 
                  background: 'linear-gradient(135deg, #F96302 0%, #FF8534 100%)',
                  boxShadow: '0 2px 8px rgba(249, 99, 2, 0.3)'
                }}>
                  <ClipboardList className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h1 className="text-white font-bold whitespace-nowrap" style={{ fontSize: '15px', letterSpacing: '-0.02em' }}>单证管理</h1>
                  <p className="text-slate-400 text-[10px] tracking-wide">Documentation Management System · B2B Export Full Process Control</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button 
                onClick={() => setShowAlertPanel(!showAlertPanel)}
                className="relative h-8 px-3 rounded text-xs transition-all flex items-center gap-2"
                style={{ 
                  background: showAlertPanel ? 'rgba(249, 99, 2, 0.2)' : 'rgba(51, 65, 85, 0.5)',
                  border: showAlertPanel ? '1px solid rgba(249, 99, 2, 0.5)' : '1px solid rgba(71, 85, 105, 0.5)',
                  color: showAlertPanel ? '#FED7AA' : '#CBD5E1'
                }}
              >
                <Bell className="h-3.5 w-3.5" />
                <span className="font-medium">预警</span>
                {stats.criticalAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[9px] flex items-center justify-center font-bold" style={{ 
                    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                    boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
                  }}>
                    {stats.criticalAlerts}
                  </span>
                )}
              </button>
              <button 
                className="h-8 px-3 rounded text-xs transition-all flex items-center gap-2"
                style={{ 
                  background: 'rgba(51, 65, 85, 0.5)',
                  border: '1px solid rgba(71, 85, 105, 0.5)',
                  color: '#CBD5E1'
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="font-medium">刷新</span>
              </button>
              <button 
                className="h-8 px-3 rounded text-xs transition-all flex items-center gap-2"
                style={{ 
                  background: 'rgba(51, 65, 85, 0.5)',
                  border: '1px solid rgba(71, 85, 105, 0.5)',
                  color: '#CBD5E1'
                }}
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 🔥 台湾大厂风格 - 统计看板 */}
        <div className="px-6 py-3 border-t" style={{ borderColor: 'rgba(148, 163, 184, 0.08)' }}>
          <div className="flex flex-wrap gap-2.5">
            {/* 总订单 */}
            <button 
              className="flex-1 min-w-[110px] rounded px-3 py-2 flex items-center justify-between transition-all hover:scale-[1.02] cursor-pointer"
              style={{ 
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.12) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)'
              }}
            >
              <div>
                <div className="text-[10px] font-medium mb-0.5" style={{ color: 'rgba(147, 197, 253, 0.9)' }}>总订单</div>
                <div className="text-2xl font-bold text-white leading-none tracking-tight">{stats.total}</div>
              </div>
              <Package className="h-5 w-5" style={{ color: '#60A5FA' }} />
            </button>

            {/* 当前任务 - 橙色主题 */}
            <button 
              className="flex-1 min-w-[110px] rounded px-3 py-2 flex items-center justify-between transition-all hover:scale-[1.02] cursor-pointer"
              style={{ 
                background: 'linear-gradient(135deg, rgba(249, 99, 2, 0.25) 0%, rgba(249, 99, 2, 0.18) 100%)',
                border: '1px solid rgba(249, 99, 2, 0.4)',
                boxShadow: '0 3px 10px rgba(249, 99, 2, 0.2)'
              }}
            >
              <div>
                <div className="text-[10px] font-medium mb-0.5" style={{ color: '#FED7AA' }}>当前任务</div>
                <div className="text-2xl font-bold leading-none tracking-tight" style={{ color: '#FFF7ED' }}>{stats.current}</div>
              </div>
              <PlayCircle className="h-5 w-5" style={{ color: '#FDBA74' }} />
            </button>

            {/* 超期 */}
            <button 
              className="flex-1 min-w-[110px] rounded px-3 py-2 flex items-center justify-between transition-all hover:scale-[1.02] cursor-pointer"
              style={{ 
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.15) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.15)'
              }}
            >
              <div>
                <div className="text-[10px] font-medium mb-0.5" style={{ color: '#FECACA' }}>超期</div>
                <div className="text-2xl font-bold leading-none tracking-tight" style={{ color: '#FEE2E2' }}>{stats.overdue}</div>
              </div>
              <AlertTriangle className="h-5 w-5" style={{ color: '#F87171' }} />
            </button>

            {/* 处理中 */}
            <button 
              className="flex-1 min-w-[110px] rounded px-3 py-2 flex items-center justify-between transition-all hover:scale-[1.02] cursor-pointer"
              style={{ 
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.12) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)'
              }}
            >
              <div>
                <div className="text-[10px] font-medium mb-0.5" style={{ color: 'rgba(147, 197, 253, 0.9)' }}>处理中</div>
                <div className="text-2xl font-bold text-white leading-none tracking-tight">{stats.processing}</div>
              </div>
              <Activity className="h-5 w-5" style={{ color: '#60A5FA' }} />
            </button>

            {/* 已完成 */}
            <button 
              className="flex-1 min-w-[110px] rounded px-3 py-2 flex items-center justify-between transition-all hover:scale-[1.02] cursor-pointer"
              style={{ 
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.18) 0%, rgba(22, 163, 74, 0.14) 100%)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                boxShadow: '0 2px 8px rgba(34, 197, 94, 0.12)'
              }}
            >
              <div>
                <div className="text-[10px] font-medium mb-0.5" style={{ color: '#BBF7D0' }}>已完成</div>
                <div className="text-2xl font-bold leading-none tracking-tight" style={{ color: '#D1FAE5' }}>{stats.completed}</div>
              </div>
              <CheckCircle2 className="h-5 w-5" style={{ color: '#4ADE80' }} />
            </button>

            {/* 平均进度 */}
            <button 
              className="flex-1 min-w-[110px] rounded px-3 py-2 flex items-center justify-between transition-all hover:scale-[1.02] cursor-pointer"
              style={{ 
                background: 'linear-gradient(135deg, rgba(100, 116, 139, 0.2) 0%, rgba(71, 85, 105, 0.15) 100%)',
                border: '1px solid rgba(100, 116, 139, 0.3)',
                boxShadow: '0 2px 6px rgba(100, 116, 139, 0.1)'
              }}
            >
              <div>
                <div className="text-[10px] font-medium mb-0.5" style={{ color: '#CBD5E1' }}>平均进度</div>
                <div className="text-2xl font-bold text-white leading-none tracking-tight">{stats.avgCompletion}<span className="text-sm">%</span></div>
              </div>
              <TrendingUp className="h-5 w-5" style={{ color: '#F96302' }} />
            </button>

            {/* 缺失单证 */}
            <button 
              className="flex-1 min-w-[110px] rounded px-3 py-2 flex items-center justify-between transition-all hover:scale-[1.02] cursor-pointer"
              style={{ 
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.18) 0%, rgba(202, 138, 4, 0.14) 100%)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                boxShadow: '0 2px 8px rgba(234, 179, 8, 0.12)'
              }}
            >
              <div>
                <div className="text-[10px] font-medium mb-0.5" style={{ color: '#FEF08A' }}>缺失单证</div>
                <div className="text-2xl font-bold leading-none tracking-tight" style={{ color: '#FEF9C3' }}>{stats.totalMissing}</div>
              </div>
              <FileText className="h-5 w-5" style={{ color: '#FACC15' }} />
            </button>

            {/* 总预警 */}
            <button 
              onClick={() => setShowAlertPanel(!showAlertPanel)}
              className="flex-1 min-w-[110px] rounded px-3 py-2 flex items-center justify-between transition-all hover:scale-[1.02] cursor-pointer"
              style={{ 
                background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.18) 0%, rgba(249, 115, 22, 0.14) 100%)',
                border: '1px solid rgba(251, 146, 60, 0.3)',
                boxShadow: '0 2px 8px rgba(251, 146, 60, 0.12)'
              }}
            >
              <div>
                <div className="text-[10px] font-medium mb-0.5" style={{ color: '#FED7AA' }}>总预警</div>
                <div className="text-2xl font-bold leading-none tracking-tight" style={{ color: '#FFEDD5' }}>{stats.totalAlerts}</div>
              </div>
              <Bell className="h-5 w-5" style={{ color: '#FB923C' }} />
            </button>

            {/* 严重预警 */}
            <button 
              onClick={() => setShowAlertPanel(!showAlertPanel)}
              className="flex-1 min-w-[110px] rounded px-3 py-2 flex items-center justify-between transition-all hover:scale-[1.02] cursor-pointer"
              style={{ 
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.18) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                boxShadow: '0 3px 10px rgba(239, 68, 68, 0.2)'
              }}
            >
              <div>
                <div className="text-[10px] font-medium mb-0.5" style={{ color: '#FECACA' }}>严重预警</div>
                <div className="text-2xl font-bold leading-none tracking-tight" style={{ color: '#FEE2E2' }}>{stats.criticalAlerts}</div>
              </div>
              <AlertCircle className="h-5 w-5" style={{ color: '#F87171' }} />
            </button>
          </div>
        </div>

        {/* 🔥 台湾大厂风格 - 视图切换Tab */}
        <div className="px-6 py-2.5 border-t" style={{ borderColor: 'rgba(148, 163, 184, 0.08)' }}>
          <div className="flex items-center gap-2">
            {[
              { id: 'document_library', label: '文档库', icon: FolderOpen },
              { id: 'order_detail', label: '订单单证详情', icon: FileCheck },
              { id: 'reports', label: '报表分析', icon: BarChart3 },
              { id: 'templates', label: '模板管理', icon: FileText },
            ].map(view => (
              <button
                key={view.id}
                onClick={() => {
                  setActiveView(view.id as any);
                  if (view.id === 'order_detail' && !selectedOrderId) {
                    setSelectedOrderId(mockOrders[0]?.orderId || null);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded text-xs font-medium transition-all"
                style={activeView === view.id ? { 
                  background: 'linear-gradient(135deg, rgba(249, 99, 2, 0.25) 0%, rgba(249, 99, 2, 0.18) 100%)',
                  border: '1px solid rgba(249, 99, 2, 0.4)',
                  color: '#FFF7ED',
                  boxShadow: '0 2px 6px rgba(249, 99, 2, 0.2)'
                } : {
                  background: 'transparent',
                  border: '1px solid transparent',
                  color: '#94A3B8'
                }}
              >
                <view.icon className="h-3.5 w-3.5" />
                <span>{view.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 🔥 主内容区 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-3 w-full max-w-full min-w-0">
          {/* 主工作区 */}
          <div className="space-y-3 min-w-0 max-w-full">
            {activeView === 'order_detail' && (
              <DocumentMatrixView 
                onBack={() => {
                  console.log('[DocumentationWorkbenchUltimate] 点击返回按钮');
                  setActiveView('document_library');
                }}
              />
            )}

            {activeView === 'order_detail_old' && !selectedOrderId && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <div className="text-center py-12">
                  <FileCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">订单单证详情</h3>
                  <p className="text-sm text-gray-500 mb-6">请从文档库选择一个订单查看详细的单证管理界面</p>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600 mb-3">或者快速选择最近的订单：</p>
                    <div className="grid grid-cols-3 gap-2 max-w-2xl mx-auto">
                      {mockOrders.slice(0, 6).map((order) => (
                        <button
                          key={order.orderId}
                          onClick={() => {
                            console.log('[DocumentationWorkbenchUltimate] 点击订单卡片:', order.orderId);
                            setSelectedOrderId(order.orderId);
                            console.log('[DocumentationWorkbenchUltimate] selectedOrderId已设置为:', order.orderId);
                          }}
                          className="p-3 border-2 border-gray-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-all text-left"
                        >
                          <div className="text-xs font-bold text-gray-900 mb-1">{order.orderId}</div>
                          <div className="text-[10px] text-gray-600 mb-1">{order.customerName}</div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-500">{order.completionRate}% 完成</span>
                            <Badge className={`text-[9px] px-1.5 py-0 ${
                              order.status === 'overdue' ? 'bg-red-600 text-white' :
                              order.status === 'processing' ? 'bg-yellow-500 text-white' :
                              'bg-green-600 text-white'
                            }`}>
                              {order.status === 'overdue' ? '超期' : 
                               order.status === 'processing' ? '处理中' : '完成'}
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveView('document_library')}
                    className="mt-6"
                  >
                    返回文档库
                  </Button>
                </div>
              </div>
            )}

            {activeView === 'document_library' && (
              <DocumentLibrary onBack={() => setActiveView('document_library')} />
            )}

            {activeView === 'reports' && (
              <DocumentationReports onBack={() => setActiveView('document_library')} />
            )}

            {activeView === 'templates' && (
              <DocumentTemplateSelector userRole="Documentation_Officer" mode="full" />
            )}
          </div>
        </div>
      </div>

      {/* 🔥 预警弹窗 Dialog */}
      <Dialog open={showAlertPanel} onOpenChange={setShowAlertPanel}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span>单证预警中心</span>
              <Badge className="bg-red-600 text-white ml-2">{criticalAlerts.length} 个严重预警</Badge>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2">
            {/* 严重预警列表 */}
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-lg">
                <div className="px-4 py-3 border-b border-red-200 bg-red-100">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-700" />
                    <span className="text-sm font-semibold text-red-900">严重预警</span>
                    <Badge className="bg-red-600 text-white text-xs ml-auto">{criticalAlerts.length}</Badge>
                  </div>
                </div>
                <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
                  {criticalAlerts.length === 0 ? (
                    <div className="text-center py-8 text-sm text-gray-400">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>暂无严重预警</p>
                    </div>
                  ) : (
                    criticalAlerts.map((item, idx) => (
                      <div key={idx} className="p-3 bg-white border border-red-300 rounded-lg hover:shadow-md transition-all cursor-pointer group">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-red-900">{item.orderId}</span>
                              <Badge className="bg-red-600 text-white text-xs px-2 py-0.5">{item.alert.docId}</Badge>
                            </div>
                            <p className="text-sm text-red-700">{item.alert.message}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-red-400 group-hover:text-red-600 transition-colors flex-shrink-0" />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>最后更新: 2 小时前</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 其他预警类型可以在这里添加 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="px-4 py-3 border-b border-yellow-200 bg-yellow-100">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-700" />
                    <span className="text-sm font-semibold text-yellow-900">高优先级预警</span>
                    <Badge className="bg-yellow-600 text-white text-xs ml-auto">0</Badge>
                  </div>
                </div>
                <div className="p-4 text-center text-sm text-gray-400">
                  暂无高优先级预警
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowAlertPanel(false)}>
              关闭
            </Button>
            <Button onClick={() => {
              toast.success('已标记所有预警为已读');
              setShowAlertPanel(false);
            }}>
              全部标记已读
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
