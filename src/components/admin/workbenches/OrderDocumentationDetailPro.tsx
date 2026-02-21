// 📋 订单单证详情页 - 专业版
// Order Documentation Detail - Professional Edition
// 基于单证管理最佳实践、B2B外贸业务流程、ERP设计原则

import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Package, DollarSign, Ship, Calendar, TrendingUp,
  FileText, Upload, Download, Eye, Trash2, CheckCircle2, Clock,
  AlertTriangle, XCircle, Zap, MessageSquare, CheckSquare, Bell,
  FileCheck, Users, Target, MoreHorizontal, ExternalLink, 
  GitBranch, Activity, Save, Send, Printer, RefreshCw, Flag,
  FileSignature, Truck, Plane, Edit, Link2, BarChart3, Filter,
  ChevronDown, ChevronRight, Search, Info, AlertCircle, Play,
  Pause, Settings, History, Paperclip, User, Building2, MapPin,
  CreditCard, Briefcase, Globe, Tag, Star, Clock3, Circle,
  CheckCircle, XCircleIcon, MinusCircle, PlayCircle
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';

interface OrderDocumentationDetailProProps {
  orderId: string;
  onBack: () => void;
}

// 单证状态类型
type DocStatus = 'pending' | 'auto_generated' | 'uploaded' | 'reviewing' | 'approved' | 'rejected' | 'na' | 'overdue' | 'blocked';

// 业务阶段枚举
type BusinessPhase = 'contract' | 'procurement' | 'shipment' | 'customs' | 'collection' | 'tax_refund';

// 单证分类
type DocCategory = 'tax' | 'trade' | 'customs' | 'logistics' | 'finance';

// 紧急度等级
type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low' | 'none';

// 单证定义接口
interface DocumentDef {
  id: string;
  code: string;
  name: string;
  nameEn: string;
  category: DocCategory;
  phase: BusinessPhase;
  required: boolean;
  triggerNode: string;
  responsible: string;
  generationType: 'auto' | 'external' | 'manual';
  dependencies: string[];
  deadline: number;
  deadlineUnit: string;
  icon: any;
  autoJudge?: string;
  description?: string;
}

// 单证实例接口
interface DocumentInstance {
  docId: string;
  status: DocStatus;
  urgency?: UrgencyLevel;
  version: number;
  files: any[];
  history: any[];
  deadline: string;
  daysRemaining: number;
  blockedBy?: string[];
  note?: string;
  uploadDate?: string;
  uploadBy?: string;
  reviewer?: string;
  reviewDate?: string;
  approveDate?: string;
  qualityScore?: number;
  reminders?: any[];
}

// ===== 13种单证完整定义（按业务流程分组） =====
const DOCUMENT_DEFINITIONS: DocumentDef[] = [
  // 阶段1：合同签订阶段（Contract Phase）
  {
    id: 'D02',
    code: 'D02',
    name: '购销合同/发票/付款凭证',
    nameEn: 'Sales Contract/Invoice/Payment',
    category: 'trade',
    phase: 'contract',
    required: true,
    triggerNode: '合同签订',
    responsible: '业务员',
    generationType: 'auto',
    dependencies: [],
    deadline: 0,
    deadlineUnit: 'immediate',
    icon: FileSignature,
    description: '出口退税的核心单证，自动生成销售合同及相关发票'
  },
  {
    id: 'D04',
    code: 'D04',
    name: '国内运费免责声明',
    nameEn: 'Domestic Freight Waiver',
    category: 'logistics',
    phase: 'contract',
    required: false,
    triggerNode: '合同签订',
    responsible: '系统自动',
    generationType: 'auto',
    dependencies: ['D02'],
    deadline: 0,
    deadlineUnit: 'immediate',
    icon: XCircle,
    autoJudge: 'incoterm',
    description: 'FOB/CIF条款下自动生成免责声明'
  },
  {
    id: 'D10',
    code: 'D10',
    name: '国际运费免责声明',
    nameEn: 'International Freight Waiver',
    category: 'logistics',
    phase: 'contract',
    required: false,
    triggerNode: '合同签订',
    responsible: '系统自动',
    generationType: 'auto',
    dependencies: ['D02'],
    deadline: 0,
    deadlineUnit: 'immediate',
    icon: XCircle,
    autoJudge: 'incoterm',
    description: 'FOB条款下自动生成国际运费免责'
  },

  // 阶段2：采购执行阶段（Procurement Phase）
  {
    id: 'D07',
    code: 'D07',
    name: '采购发票及付款凭证',
    nameEn: 'Purchase Invoice/Payment',
    category: 'trade',
    phase: 'procurement',
    required: true,
    triggerNode: '采购付款',
    responsible: '采购+财务',
    generationType: 'auto',
    dependencies: ['D02'],
    deadline: 15,
    deadlineUnit: 'days_after_purchase',
    icon: FileText,
    description: '采购合同及付款凭证，用于成本核算'
  },

  // 阶段3：出货报关阶段（Shipment & Customs Phase）
  {
    id: 'D03',
    code: 'D03',
    name: '国内运输单据及运费凭证',
    nameEn: 'Domestic Transport Documents',
    category: 'logistics',
    phase: 'shipment',
    required: false,
    triggerNode: '出货通知',
    responsible: '物流部',
    generationType: 'external',
    dependencies: [],
    deadline: 7,
    deadlineUnit: 'days_after_shipment',
    icon: Truck,
    autoJudge: 'incoterm',
    description: '国内运输单据和费用凭证'
  },
  {
    id: 'D05',
    code: 'D05',
    name: '报关单/装箱单/提运单',
    nameEn: 'Customs Declaration/Packing List/B/L',
    category: 'customs',
    phase: 'customs',
    required: true,
    triggerNode: '报关',
    responsible: '报关行',
    generationType: 'external',
    dependencies: ['D02'],
    deadline: 3,
    deadlineUnit: 'days_after_customs',
    icon: FileCheck,
    description: '海关报关三联单，退税核心单证'
  },
  {
    id: 'D06',
    code: 'D06',
    name: '委托报关合同及费用凭证',
    nameEn: 'Customs Brokerage Contract',
    category: 'customs',
    phase: 'customs',
    required: false,
    triggerNode: '报关',
    responsible: '报关行+财务',
    generationType: 'external',
    dependencies: ['D05'],
    deadline: 7,
    deadlineUnit: 'days_after_customs',
    icon: FileSignature,
    description: '报关委托合同及费用凭证'
  },
  {
    id: 'D08',
    code: 'D08',
    name: '报关费用免责声明',
    nameEn: 'Customs Fee Waiver',
    category: 'customs',
    phase: 'customs',
    required: false,
    triggerNode: '报关',
    responsible: '系统自动',
    generationType: 'auto',
    dependencies: ['D02'],
    deadline: 0,
    deadlineUnit: 'immediate',
    icon: XCircle,
    autoJudge: 'contract_terms',
    description: '报关费用由买方承担时自动生成'
  },
  {
    id: 'D09',
    code: 'D09',
    name: '国际运费发票及付款凭证',
    nameEn: 'International Freight Invoice',
    category: 'logistics',
    phase: 'shipment',
    required: false,
    triggerNode: '开船后',
    responsible: '货代+财务',
    generationType: 'external',
    dependencies: ['D05'],
    deadline: 15,
    deadlineUnit: 'days_after_shipment',
    icon: Plane,
    autoJudge: 'incoterm',
    description: '国际运费发票和付款凭证'
  },

  // 阶段4：收汇结汇阶段（Collection Phase）
  {
    id: 'D11',
    code: 'D11',
    name: '收汇水单',
    nameEn: 'Foreign Exchange Receipt',
    category: 'finance',
    phase: 'collection',
    required: true,
    triggerNode: '客户付款到账',
    responsible: '财务部',
    generationType: 'external',
    dependencies: ['D02', 'D05'],
    deadline: 90,
    deadlineUnit: 'days_after_shipment',
    icon: DollarSign,
    description: '银行收汇水单，退税必备单证'
  },
  {
    id: 'D12',
    code: 'D12',
    name: '结汇水单',
    nameEn: 'FX Settlement Certificate',
    category: 'finance',
    phase: 'collection',
    required: true,
    triggerNode: '收汇后',
    responsible: '财务部',
    generationType: 'external',
    dependencies: ['D11'],
    deadline: 5,
    deadlineUnit: 'days_after_collection',
    icon: DollarSign,
    description: '外汇结汇凭证'
  },

  // 阶段5：退税申报阶段（Tax Refund Phase）
  {
    id: 'D13',
    code: 'D13',
    name: '出口退税收汇凭证表',
    nameEn: 'Tax Refund FX Certificate',
    category: 'tax',
    phase: 'tax_refund',
    required: true,
    triggerNode: '结汇后',
    responsible: '单证员+财务',
    generationType: 'auto',
    dependencies: ['D12'],
    deadline: 5,
    deadlineUnit: 'days_after_settlement',
    icon: FileCheck,
    description: '出口退税收汇凭证表'
  },
  {
    id: 'D01',
    code: 'D01',
    name: '出口退税申报表',
    nameEn: 'Export Tax Refund Declaration',
    category: 'tax',
    phase: 'tax_refund',
    required: true,
    triggerNode: '出货+结汇完成',
    responsible: '单证员+财务',
    generationType: 'auto',
    dependencies: ['D05', 'D11', 'D12', 'D13'],
    deadline: 30,
    deadlineUnit: 'days_after_shipment',
    icon: FileText,
    description: '出口退税申报表，依赖所有关键单证'
  },
];

// 业务阶段定义
const BUSINESS_PHASES = [
  { 
    id: 'contract', 
    name: '合同签订', 
    nameEn: 'Contract',
    icon: FileSignature, 
    color: 'blue',
    description: '销售合同签订，明确交易条款'
  },
  { 
    id: 'procurement', 
    name: '采购执行', 
    nameEn: 'Procurement',
    icon: Package, 
    color: 'purple',
    description: '采购商品，准备货物'
  },
  { 
    id: 'shipment', 
    name: '出货物流', 
    nameEn: 'Shipment',
    icon: Truck, 
    color: 'green',
    description: '货物发运，物流追踪'
  },
  { 
    id: 'customs', 
    name: '报关出口', 
    nameEn: 'Customs',
    icon: FileCheck, 
    color: 'indigo',
    description: '海关报关，出口放行'
  },
  { 
    id: 'collection', 
    name: '收汇结汇', 
    nameEn: 'Collection',
    icon: DollarSign, 
    color: 'yellow',
    description: '客户付款，外汇结算'
  },
  { 
    id: 'tax_refund', 
    name: '退税完成', 
    nameEn: 'Tax Refund',
    icon: TrendingUp, 
    color: 'red',
    description: '退税申报，款项到账'
  },
];

// 单证分类配置
const CATEGORIES = {
  tax: { label: '税务', color: 'bg-red-50 border-red-200 text-red-800', icon: TrendingUp },
  trade: { label: '贸易', color: 'bg-blue-50 border-blue-200 text-blue-800', icon: FileSignature },
  customs: { label: '报关', color: 'bg-purple-50 border-purple-200 text-purple-800', icon: FileCheck },
  logistics: { label: '物流', color: 'bg-green-50 border-green-200 text-green-800', icon: Truck },
  finance: { label: '财务', color: 'bg-yellow-50 border-yellow-200 text-yellow-800', icon: DollarSign },
};

// 状态配置
const STATUS_CONFIG = {
  pending: { 
    label: '待处理', 
    color: 'bg-gray-500', 
    icon: Clock,
    description: '等待处理'
  },
  auto_generated: { 
    label: '自动生成', 
    color: 'bg-blue-500', 
    icon: Zap,
    description: '系统自动生成'
  },
  uploaded: { 
    label: '已上传', 
    color: 'bg-cyan-500', 
    icon: Upload,
    description: '已上传待审核'
  },
  reviewing: { 
    label: '审核中', 
    color: 'bg-yellow-500', 
    icon: Eye,
    description: '正在审核'
  },
  approved: { 
    label: '已批准', 
    color: 'bg-green-600', 
    icon: CheckCircle2,
    description: '审核通过'
  },
  rejected: { 
    label: '已驳回', 
    color: 'bg-red-600', 
    icon: XCircle,
    description: '审核驳回'
  },
  overdue: { 
    label: '超期', 
    color: 'bg-red-700', 
    icon: AlertTriangle,
    description: '已超过截止日期'
  },
  blocked: { 
    label: '阻塞', 
    color: 'bg-orange-600', 
    icon: MinusCircle,
    description: '前置单证未完成'
  },
  na: { 
    label: 'N/A', 
    color: 'bg-gray-300', 
    icon: XCircle,
    description: '不适用'
  }
};

// 紧急度配置
const URGENCY_CONFIG = {
  critical: { label: '严重', color: 'bg-red-600 text-white', icon: AlertTriangle },
  high: { label: '高', color: 'bg-orange-500 text-white', icon: AlertCircle },
  medium: { label: '中', color: 'bg-yellow-500 text-white', icon: Info },
  low: { label: '低', color: 'bg-blue-500 text-white', icon: Info },
  none: { label: '无', color: 'bg-gray-400 text-white', icon: Circle },
};

// 模拟订单数据
const mockOrderData = {
  orderId: 'SO-NA-20251210-001',
  contractNo: 'SC-NA-20251201-001',
  poNo: 'PO-HD-2025-1201',
  
  // 客户信息
  customer: {
    name: 'Home Depot Inc.',
    code: 'HD-001',
    country: 'USA',
    region: 'North America',
    contact: 'John Smith',
    email: 'john.smith@homedepot.com',
  },
  
  // 业务信息
  salesRep: '张伟',
  salesTeam: '北美业务一组',
  currentPhase: 'customs' as BusinessPhase,
  
  // 贸易条款
  incoterm: 'FOB',
  paymentTerm: 'T/T 30% Deposit, 70% Before Shipment',
  currency: 'USD',
  totalValue: 125000,
  deposit: 37500,
  balance: 87500,
  collectionProgress: 30, // 30%已收汇（仅定金）
  
  // 关键日期
  contractDate: '2025-12-01',
  procurementDate: '2025-12-05',
  shipmentDate: '2025-12-15',
  customsDate: '2025-12-14',
  etd: '2025-12-16',
  eta: '2026-01-05',
  expectedCollectionDate: '2026-01-10',
  taxRefundDeadline: '2026-01-14',
  
  // 物流信息
  originPort: 'Xiamen',
  destPort: 'Los Angeles',
  container: '40HQ x 2',
  forwarder: '中远海运',
  customsBroker: '厦门报关行',
  
  // 产品信息
  productCategory: '电气配件',
  skuCount: 15,
  totalQuantity: 5000,
  
  // 单证统计
  completionRate: 46,
  requiredDocs: 11,
  completedDocs: 5,
  pendingDocs: 4,
  overdueDocs: 2,
  blockedDocs: 2,
  
  // 业务阶段完成情况
  phaseStatus: {
    contract: 'completed',
    procurement: 'completed',
    shipment: 'completed',
    customs: 'warning',
    collection: 'pending',
    tax_refund: 'blocked',
  },
  
  // 单证实例数据
  documents: {
    D01: {
      docId: 'D01',
      status: 'blocked' as DocStatus,
      urgency: 'high' as UrgencyLevel,
      version: 0,
      files: [],
      history: [],
      deadline: '2026-01-14',
      daysRemaining: 33,
      blockedBy: ['D05', 'D11', 'D12', 'D13'],
      note: '等待前置单证完成'
    },
    D02: {
      docId: 'D02',
      status: 'approved' as DocStatus,
      urgency: 'none' as UrgencyLevel,
      uploadDate: '2025-12-01',
      uploadBy: '张伟',
      reviewer: '财务部-李明',
      reviewDate: '2025-12-01',
      approveDate: '2025-12-01',
      version: 2,
      files: [
        { fileId: 'F001', fileName: 'SC-NA-20251201-001.pdf', fileSize: '1.8MB', fileType: 'pdf', uploadDate: '2025-12-01 10:00' }
      ],
      history: [
        { action: '生成合同', operator: '系统', timestamp: '2025-12-01 10:00', comment: '自动生成销售合同' },
        { action: '审核通过', operator: '财务部-李明', timestamp: '2025-12-01 10:30', comment: '合同条款无误，金额核对正确' }
      ],
      deadline: '2025-12-01',
      daysRemaining: 0,
      qualityScore: 98
    },
    D03: {
      docId: 'D03',
      status: 'uploaded' as DocStatus,
      urgency: 'medium' as UrgencyLevel,
      uploadDate: '2025-12-16',
      uploadBy: '物流部-王芳',
      reviewer: '财务部-李明',
      version: 1,
      files: [
        { fileId: 'F003', fileName: '国内运输单据.pdf', fileSize: '850KB', fileType: 'pdf', uploadDate: '2025-12-16 09:00' }
      ],
      history: [
        { action: '上传单据', operator: '物流部-王芳', timestamp: '2025-12-16 09:00', comment: '已完成国内运输' }
      ],
      deadline: '2025-12-22',
      daysRemaining: 3,
    },
    D04: {
      docId: 'D04',
      status: 'auto_generated' as DocStatus,
      urgency: 'none' as UrgencyLevel,
      version: 1,
      files: [
        { fileId: 'F004', fileName: '国内运费免责声明.pdf', fileSize: '120KB', fileType: 'pdf', uploadDate: '2025-12-01 10:05' }
      ],
      history: [
        { action: '自动生成', operator: '系统', timestamp: '2025-12-01 10:05', comment: 'FOB条款自动生成国内运费免责声明' }
      ],
      deadline: '2025-12-01',
      daysRemaining: 0,
    },
    D05: {
      docId: 'D05',
      status: 'overdue' as DocStatus,
      urgency: 'critical' as UrgencyLevel,
      version: 0,
      files: [],
      history: [
        { action: '报关完成', operator: '厦门报关行', timestamp: '2025-12-14 16:00', comment: '已完成报关，等待纸质单据' },
        { action: '第1次催办', operator: '张伟', timestamp: '2025-12-18 10:00', comment: '催促报关行上传单据' },
        { action: '第2次催办', operator: '张伟', timestamp: '2025-12-19 14:00', comment: '加急！客户催货，需要提运单' }
      ],
      deadline: '2025-12-17',
      daysRemaining: -2,
      blockedBy: [],
      reminders: [
        { date: '2025-12-18', recipient: '厦门报关行', message: '第1次催办', status: 'sent' },
        { date: '2025-12-19', recipient: '厦门报关行', message: '第2次催办（加急）', status: 'sent' },
        { date: '2025-12-20', recipient: '厦门报关行+业务主管', message: '第3次催办（升级）', status: 'pending' }
      ],
      note: '⚠️ 已超期2天，严重影响退税进度！报关行表示单据正在盖章中，预计明天送达。'
    },
    D06: {
      docId: 'D06',
      status: 'uploaded' as DocStatus,
      urgency: 'medium' as UrgencyLevel,
      uploadDate: '2025-12-15',
      uploadBy: '厦门报关行',
      reviewer: '财务部-李明',
      version: 1,
      files: [
        { fileId: 'F006', fileName: '报关委托合同.pdf', fileSize: '650KB', fileType: 'pdf', uploadDate: '2025-12-15 14:00' }
      ],
      history: [
        { action: '上传单据', operator: '厦门报关行', timestamp: '2025-12-15 14:00', comment: '报关委托合同及费用凭证' }
      ],
      deadline: '2025-12-21',
      daysRemaining: 2,
    },
    D07: {
      docId: 'D07',
      status: 'approved' as DocStatus,
      urgency: 'none' as UrgencyLevel,
      uploadDate: '2025-12-05',
      uploadBy: '采购部-赵强',
      reviewer: '财务部-李明',
      reviewDate: '2025-12-08',
      approveDate: '2025-12-08',
      version: 1,
      files: [
        { fileId: 'F007', fileName: '采购发票.pdf', fileSize: '1.2MB', fileType: 'pdf', uploadDate: '2025-12-05 11:00' }
      ],
      history: [
        { action: '自动生成', operator: '系统', timestamp: '2025-12-05 14:30', comment: '采购合同生成' },
        { action: '上传发票', operator: '采购部-赵强', timestamp: '2025-12-05 15:00', comment: '供应商开具发票' },
        { action: '审核通过', operator: '财务部-李明', timestamp: '2025-12-08 10:00', comment: '采购发票已验证，金额无误' }
      ],
      deadline: '2025-12-20',
      daysRemaining: 1,
      qualityScore: 95
    },
    D08: {
      docId: 'D08',
      status: 'na' as DocStatus,
      urgency: 'none' as UrgencyLevel,
      version: 0,
      files: [],
      history: [],
      deadline: '',
      daysRemaining: 0,
      note: '根据合同条款，报关费用由买方承担（FOB条款），无需此文档'
    },
    D09: {
      docId: 'D09',
      status: 'reviewing' as DocStatus,
      urgency: 'medium' as UrgencyLevel,
      uploadDate: '2025-12-17',
      uploadBy: '中远海运',
      reviewer: '财务部-李明',
      version: 1,
      files: [
        { fileId: 'F009', fileName: '国际运费发票.pdf', fileSize: '920KB', fileType: 'pdf', uploadDate: '2025-12-17 16:00' }
      ],
      history: [
        { action: '上传单据', operator: '中远海运', timestamp: '2025-12-17 16:00', comment: '海运费发票' }
      ],
      deadline: '2025-12-31',
      daysRemaining: 12,
    },
    D10: {
      docId: 'D10',
      status: 'auto_generated' as DocStatus,
      urgency: 'none' as UrgencyLevel,
      version: 1,
      files: [
        { fileId: 'F010', fileName: '国际运费免责声明.pdf', fileSize: '115KB', fileType: 'pdf', uploadDate: '2025-12-01 10:05' }
      ],
      history: [
        { action: '自动生成', operator: '系统', timestamp: '2025-12-01 10:05', comment: 'FOB条款自动生成国际运费免责' }
      ],
      deadline: '2025-12-01',
      daysRemaining: 0,
    },
    D11: {
      docId: 'D11',
      status: 'pending' as DocStatus,
      urgency: 'high' as UrgencyLevel,
      version: 0,
      files: [],
      history: [
        { action: '发送催款邮件', operator: '张伟', timestamp: '2025-12-10 09:00', comment: '提醒客户尽快付款' },
        { action: '客户回复', operator: '系统', timestamp: '2025-12-11 15:00', comment: '客户表示将在1月5日前完成付款' }
      ],
      deadline: '2026-03-15',
      daysRemaining: 93,
      blockedBy: [],
      note: '⏳ 等待客户付款（尾款70%），预计2026-01-05到账。已发催款邮件，客户确认付款计划。'
    },
    D12: {
      docId: 'D12',
      status: 'blocked' as DocStatus,
      urgency: 'medium' as UrgencyLevel,
      version: 0,
      files: [],
      history: [],
      deadline: '2026-03-20',
      daysRemaining: 98,
      blockedBy: ['D11'],
      note: '依赖D11收汇水单，等待客户付款后办理结汇'
    },
    D13: {
      docId: 'D13',
      status: 'blocked' as DocStatus,
      urgency: 'medium' as UrgencyLevel,
      version: 0,
      files: [],
      history: [],
      deadline: '2026-03-25',
      daysRemaining: 103,
      blockedBy: ['D12'],
      note: '依赖D12结汇水单，结汇后自动生成'
    },
  },
  
  // 风险提示
  risks: [
    {
      id: 'R001',
      level: 'critical',
      type: 'overdue',
      title: 'D05报关单已超期2天',
      description: '报关单/装箱单/提运单超过截止日期2天未上传，严重影响退税申报进度',
      docId: 'D05',
      deadline: '2025-12-17',
      responsible: '厦门报关行',
      suggestedAction: '立即联系报关行加急处理，必要时升级至业务主管协调'
    },
    {
      id: 'R002',
      level: 'high',
      type: 'dependency',
      title: 'D11收汇水单影响退税闭环',
      description: '客户尾款未到账，无法办理结汇和退税申报，距离退税截止日期仅剩33天',
      docId: 'D11',
      deadline: '2026-03-15',
      responsible: '张伟（催款）',
      suggestedAction: '加强催款力度，考虑提供付款折扣或调整付款计划'
    },
    {
      id: 'R003',
      level: 'medium',
      type: 'warning',
      title: 'D03国内运输单据待审核',
      description: '国内运输单据已上传3天，财务部尚未完成审核',
      docId: 'D03',
      deadline: '2025-12-22',
      responsible: '财务部-李明',
      suggestedAction: '提醒财务部加快审核进度'
    }
  ],
  
  // 待办任务
  todos: [
    {
      id: 'T001',
      title: '催促报关行上传D05（紧急！）',
      priority: 'critical',
      assignee: '张伟',
      dueDate: '2025-12-19',
      status: 'open',
      relatedDoc: 'D05'
    },
    {
      id: 'T002',
      title: '跟进客户付款进度',
      priority: 'high',
      assignee: '张伟',
      dueDate: '2025-12-25',
      status: 'open',
      relatedDoc: 'D11'
    },
    {
      id: 'T003',
      title: '审核D03国内运输单据',
      priority: 'medium',
      assignee: '财务部-李明',
      dueDate: '2025-12-20',
      status: 'open',
      relatedDoc: 'D03'
    },
    {
      id: 'T004',
      title: '准备D13退税凭证材料',
      priority: 'low',
      assignee: '单证员-孙丽',
      dueDate: '2026-01-05',
      status: 'open',
      relatedDoc: 'D13'
    }
  ],
  
  // 智能建议
  suggestions: [
    {
      id: 'S001',
      type: 'optimization',
      title: '建议先催收客户付款',
      description: 'D11收汇水单到位后才能生成D12、D13和D01，建议优先跟进客户付款以保证退税闭环顺利完成',
      priority: 'high',
      icon: DollarSign
    },
    {
      id: 'S002',
      type: 'warning',
      title: '距离退税截止日期还剩33天',
      description: '请加快单证收集进度，确保在退税期限内完成所有单证的收集和审核',
      priority: 'high',
      icon: Clock
    },
    {
      id: 'S003',
      type: 'info',
      title: '单证完成率46%，低于平均水平',
      description: '当前订单单证完成率为46%，低于公司平均水平（72%），建议重点关注阻塞项和超期项',
      priority: 'medium',
      icon: BarChart3
    },
    {
      id: 'S004',
      type: 'optimization',
      title: '可启用自动催办功能',
      description: '针对D05超期项，系统可自动发送催办邮件和短信，提高响应效率',
      priority: 'low',
      icon: Bell
    }
  ],
  
  // 协作记录
  activities: [
    { time: '2025-12-19 14:00', user: '张伟', action: '第2次催办报关行上传D05', type: 'reminder', docId: 'D05' },
    { time: '2025-12-18 10:00', user: '张伟', action: '第1次催办报关行上传D05', type: 'reminder', docId: 'D05' },
    { time: '2025-12-17 16:00', user: '中远海运', action: '上传D09国际运费发票', type: 'upload', docId: 'D09' },
    { time: '2025-12-16 09:00', user: '物流部-王芳', action: '上传D03国内运输单据', type: 'upload', docId: 'D03' },
    { time: '2025-12-15 14:00', user: '厦门报关行', action: '上传D06报关委托合同', type: 'upload', docId: 'D06' },
    { time: '2025-12-14 16:00', user: '厦门报关行', action: '完成报关，等待D05单据', type: 'info', docId: 'D05' },
    { time: '2025-12-11 15:00', user: '系统', action: '客户回复付款计划（D11）', type: 'info', docId: 'D11' },
    { time: '2025-12-10 09:00', user: '张伟', action: '发送催款邮件给客户（D11）', type: 'reminder', docId: 'D11' },
    { time: '2025-12-08 10:00', user: '财务部-李明', action: '批准D07采购发票', type: 'approve', docId: 'D07' },
    { time: '2025-12-05 15:00', user: '采购部-赵强', action: '上传D07采购发票', type: 'upload', docId: 'D07' },
    { time: '2025-12-05 14:30', user: '系统', action: '自动生成D07采购合同', type: 'auto', docId: 'D07' },
    { time: '2025-12-01 10:30', user: '财务部-李明', action: '审核通过D02销售合同', type: 'approve', docId: 'D02' },
    { time: '2025-12-01 10:05', user: '系统', action: '自动生成D04/D10免责声明', type: 'auto', docId: 'D04' },
    { time: '2025-12-01 10:00', user: '系统', action: '自动生成D02销售合同', type: 'auto', docId: 'D02' },
  ]
};

export function OrderDocumentationDetailPro({ orderId, onBack }: OrderDocumentationDetailProProps) {
  const [activeTab, setActiveTab] = useState<'matrix' | 'timeline' | 'dependency' | 'list'>('matrix');
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPhase, setFilterPhase] = useState<string>('all');
  const [showAlertBanner, setShowAlertBanner] = useState(true);
  const [showDocDetail, setShowDocDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedPhases, setCollapsedPhases] = useState<Set<string>>(new Set());

  // 获取订单数据
  const order = {
    ...mockOrderData,
    orderId: orderId,
  };

  // 计算统计数据
  const stats = useMemo(() => {
    const docs = Object.values(order.documents);
    const critical = docs.filter(d => d.urgency === 'critical').length;
    const overdue = docs.filter(d => d.status === 'overdue').length;
    const blocked = docs.filter(d => d.status === 'blocked').length;
    const pending = docs.filter(d => d.status === 'pending').length;
    
    return {
      critical,
      overdue,
      blocked,
      pending,
      totalRisks: critical + overdue + blocked
    };
  }, [order.documents]);

  // 按业务阶段分组单证
  const documentsByPhase = useMemo(() => {
    const groups: Record<BusinessPhase, DocumentDef[]> = {
      contract: [],
      procurement: [],
      shipment: [],
      customs: [],
      collection: [],
      tax_refund: []
    };
    
    DOCUMENT_DEFINITIONS.forEach(def => {
      groups[def.phase].push(def);
    });
    
    return groups;
  }, []);

  // 筛选单证
  const filteredDocuments = useMemo(() => {
    return DOCUMENT_DEFINITIONS.filter(def => {
      const instance = order.documents[def.id as keyof typeof order.documents];
      if (!instance) return false;
      
      // 状态筛选
      if (filterStatus !== 'all' && instance.status !== filterStatus) return false;
      
      // 分类筛选
      if (filterCategory !== 'all' && def.category !== filterCategory) return false;
      
      // 阶段筛选
      if (filterPhase !== 'all' && def.phase !== filterPhase) return false;
      
      // 搜索筛选
      if (searchQuery && !def.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !def.code.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [filterStatus, filterCategory, filterPhase, searchQuery, order.documents]);

  // 获取状态Badge
  const getStatusBadge = (status: DocStatus, size: 'sm' | 'md' = 'sm') => {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;
    const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5';
    
    return (
      <Badge className={`${config.color} text-white ${sizeClasses} flex items-center gap-1`}>
        <Icon className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
        {config.label}
      </Badge>
    );
  };

  // 获取紧急度Badge
  const getUrgencyBadge = (urgency: UrgencyLevel) => {
    if (urgency === 'none') return null;
    const config = URGENCY_CONFIG[urgency];
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} text-[9px] px-1 py-0 flex items-center gap-0.5`}>
        <Icon className="h-2.5 w-2.5" />
        {config.label}
      </Badge>
    );
  };

  // 切换阶段折叠状态
  const togglePhase = (phaseId: string) => {
    const newCollapsed = new Set(collapsedPhases);
    if (newCollapsed.has(phaseId)) {
      newCollapsed.delete(phaseId);
    } else {
      newCollapsed.add(phaseId);
    }
    setCollapsedPhases(newCollapsed);
  };

  // 渲染单证卡片
  const renderDocumentCard = (def: DocumentDef, instance: DocumentInstance) => {
    const Icon = def.icon;
    const category = CATEGORIES[def.category];
    const CategoryIcon = category.icon;
    
    return (
      <div
        key={def.id}
        className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:shadow-lg ${
          instance.status === 'approved' ? 'bg-green-50 border-green-300' :
          instance.status === 'auto_generated' ? 'bg-blue-50 border-blue-300' :
          instance.status === 'uploaded' || instance.status === 'reviewing' ? 'bg-cyan-50 border-cyan-300' :
          instance.status === 'overdue' ? 'bg-red-50 border-red-400 ring-2 ring-red-300' :
          instance.status === 'blocked' ? 'bg-orange-50 border-orange-400' :
          instance.status === 'pending' ? 'bg-yellow-50 border-yellow-300' :
          instance.status === 'rejected' ? 'bg-red-50 border-red-300' :
          'bg-gray-50 border-gray-200'
        } ${selectedDoc === def.id ? 'ring-2 ring-offset-2 ring-orange-500' : ''}`}
        onClick={() => {
          setSelectedDoc(def.id);
          setShowDocDetail(true);
        }}
      >
        {/* 卡片头部：图标 + 紧急度 */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${
              instance.status === 'approved' ? 'text-green-600' :
              instance.status === 'auto_generated' ? 'text-blue-600' :
              instance.status === 'uploaded' || instance.status === 'reviewing' ? 'text-cyan-600' :
              instance.status === 'overdue' ? 'text-red-700' :
              instance.status === 'blocked' ? 'text-orange-600' :
              instance.status === 'pending' ? 'text-yellow-600' :
              instance.status === 'rejected' ? 'text-red-600' :
              'text-gray-400'
            }`} />
          </div>
          <div className="flex flex-col items-end gap-1">
            {instance.urgency && getUrgencyBadge(instance.urgency)}
            {instance.status === 'overdue' && (
              <Badge className="bg-red-600 text-white text-[9px] px-1 py-0">
                超期{Math.abs(instance.daysRemaining)}天
              </Badge>
            )}
          </div>
        </div>
        
        {/* 单证编号 + 分类 */}
        <div className="mb-2">
          <div className="text-xs font-bold text-gray-900 mb-1">{def.code}</div>
          <Badge className={`${category.color} text-[9px] px-1.5 py-0 flex items-center gap-1 w-fit`}>
            <CategoryIcon className="h-2.5 w-2.5" />
            {category.label}
          </Badge>
        </div>
        
        {/* 单证名称 */}
        <div className="text-[10px] font-semibold text-gray-800 mb-2 line-clamp-2 min-h-[32px]">
          {def.name}
        </div>
        
        {/* 状态 */}
        <div className="mb-2">
          {getStatusBadge(instance.status, 'sm')}
        </div>
        
        {/* 文件信息 */}
        {instance.files && instance.files.length > 0 ? (
          <div className="text-[9px] text-gray-600 mb-2 flex items-center gap-1">
            <Paperclip className="h-3 w-3" />
            {instance.files.length}个文件 · v{instance.version}
          </div>
        ) : (
          <div className="text-[9px] text-gray-400 mb-2 flex items-center gap-1">
            <Paperclip className="h-3 w-3" />
            无文件
          </div>
        )}
        
        {/* 依赖/阻塞信息 */}
        {instance.blockedBy && instance.blockedBy.length > 0 && (
          <div className="text-[9px] text-orange-700 mb-2 flex items-start gap-1 bg-orange-100 rounded px-1.5 py-1">
            <Link2 className="h-3 w-3 flex-shrink-0 mt-0.5" />
            <span>依赖: {instance.blockedBy.join(', ')}</span>
          </div>
        )}
        
        {/* 负责人 */}
        <div className="text-[9px] text-gray-500 mb-2 flex items-center gap-1">
          <User className="h-3 w-3" />
          {def.responsible}
        </div>
        
        {/* 截止日期 */}
        {instance.deadline && (
          <div className={`text-[9px] mb-2 flex items-center gap-1 ${
            instance.daysRemaining < 0 ? 'text-red-700 font-bold' :
            instance.daysRemaining <= 3 ? 'text-orange-600 font-semibold' :
            'text-gray-600'
          }`}>
            <Clock3 className="h-3 w-3" />
            {instance.deadline}
            {instance.daysRemaining !== 0 && (
              <span className="ml-1">
                ({instance.daysRemaining > 0 ? `剩${instance.daysRemaining}天` : `超${Math.abs(instance.daysRemaining)}天`})
              </span>
            )}
          </div>
        )}
        
        {/* 操作按钮 */}
        <div className="flex items-center gap-1 pt-2 border-t border-gray-200">
          {instance.status === 'pending' || instance.status === 'overdue' || instance.status === 'blocked' ? (
            <Button 
              size="sm" 
              className="flex-1 h-6 text-[10px] text-white"
              style={{ background: '#F96302' }}
              onClick={(e) => {
                e.stopPropagation();
                // TODO: 打开上传对话框
              }}
            >
              <Upload className="h-3 w-3 mr-1" />
              上传
            </Button>
          ) : (
            <>
              <Button 
                size="sm" 
                variant="outline"
                className="flex-1 h-6 text-[10px]"
                onClick={(e) => e.stopPropagation()}
              >
                <Eye className="h-3 w-3" />
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="flex-1 h-6 text-[10px]"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* ========== 顶部固定操作栏 ========== */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* 左侧：导航 + 订单信息 */}
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="h-7 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              返回列表
            </Button>
            <div className="h-5 w-px bg-gray-300"></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">{order.orderId}</span>
                <Badge className="text-[10px]" style={{ background: '#F96302', color: 'white' }}>
                  {order.completionRate}% 完成
                </Badge>
                {stats.totalRisks > 0 && (
                  <Badge className="bg-red-600 text-white text-[10px] flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {stats.totalRisks}项风险
                  </Badge>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {order.customer.name} · {order.contractNo} · {order.salesRep}
              </div>
            </div>
          </div>
          
          {/* 右侧：快捷操作 */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs">
              <Printer className="h-3.5 w-3.5 mr-1" />
              打印
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              <Download className="h-3.5 w-3.5 mr-1" />
              打包下载
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              <Send className="h-3.5 w-3.5 mr-1" />
              发送客户
            </Button>
            <Button size="sm" className="h-7 text-xs text-white" style={{ background: '#F96302' }}>
              <Save className="h-3.5 w-3.5 mr-1" />
              保存
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ========== 智能预警横幅（可折叠） ========== */}
      {showAlertBanner && order.risks.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-b-2 border-red-300 px-4 py-3 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-sm font-bold text-red-900">⚠️ 关键风险预警</span>
                <Badge className="bg-red-600 text-white text-[10px]">
                  {order.risks.length}项
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {order.risks.slice(0, 3).map(risk => (
                  <div key={risk.id} className="bg-white border-l-4 border-red-500 rounded-r px-3 py-2">
                    <div className="flex items-start justify-between mb-1">
                      <Badge className={`text-[9px] ${
                        risk.level === 'critical' ? 'bg-red-600 text-white' :
                        risk.level === 'high' ? 'bg-orange-500 text-white' :
                        'bg-yellow-500 text-white'
                      }`}>
                        {risk.level === 'critical' ? '严重' : risk.level === 'high' ? '高' : '中'}
                      </Badge>
                      <button
                        onClick={() => {
                          setSelectedDoc(risk.docId);
                          setShowDocDetail(true);
                        }}
                        className="text-[10px] text-blue-600 hover:underline"
                      >
                        查看 →
                      </button>
                    </div>
                    <div className="text-xs font-semibold text-gray-900 mb-1">{risk.title}</div>
                    <div className="text-[10px] text-gray-600 line-clamp-2 mb-2">{risk.description}</div>
                    <div className="text-[9px] text-gray-500 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {risk.responsible}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setShowAlertBanner(false)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* ========== 主体三栏布局 ========== */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-12 gap-4 p-4">
          
          {/* ========== 左侧边栏（25%） ========== */}
          <div className="col-span-3 space-y-4 overflow-y-auto">
            
            {/* 订单快照卡片 */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
              <div className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                订单快照
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] text-gray-500 mb-1">客户信息</div>
                  <div className="text-xs font-semibold text-gray-900">{order.customer.name}</div>
                  <div className="text-[10px] text-gray-600 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {order.customer.country} · {order.customer.region}
                  </div>
                </div>
                
                <div className="border-t border-gray-100 pt-2">
                  <div className="text-[10px] text-gray-500 mb-1">合同金额</div>
                  <div className="text-xs font-semibold text-gray-900">
                    {order.currency} {order.totalValue.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-gray-600 mt-0.5">
                    {order.incoterm} · {order.paymentTerm.split(',')[0]}
                  </div>
                </div>
                
                <div className="border-t border-gray-100 pt-2">
                  <div className="text-[10px] text-gray-500 mb-1">业务员</div>
                  <div className="text-xs font-semibold text-gray-900 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {order.salesRep}
                  </div>
                  <div className="text-[10px] text-gray-600 mt-0.5">{order.salesTeam}</div>
                </div>
                
                <div className="border-t border-gray-100 pt-2">
                  <div className="text-[10px] text-gray-500 mb-1">当前阶段</div>
                  <Badge className="text-[10px]" style={{ background: '#F96302', color: 'white' }}>
                    {BUSINESS_PHASES.find(p => p.id === order.currentPhase)?.name}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* 业务里程碑 */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
              <div className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Flag className="h-4 w-4 text-purple-600" />
                业务里程碑
              </div>
              
              <div className="space-y-2">
                {BUSINESS_PHASES.map((phase, idx) => {
                  const PhaseIcon = phase.icon;
                  const status = order.phaseStatus[phase.id as BusinessPhase];
                  
                  return (
                    <div key={phase.id} className="relative">
                      {idx < BUSINESS_PHASES.length - 1 && (
                        <div className={`absolute left-3 top-7 bottom-0 w-0.5 ${
                          status === 'completed' ? 'bg-green-400' : 'bg-gray-300'
                        }`}></div>
                      )}
                      <div className="flex items-start gap-2 relative z-10">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          status === 'completed' ? 'bg-green-100 border-2 border-green-500' :
                          status === 'warning' ? 'bg-yellow-100 border-2 border-yellow-500' :
                          status === 'pending' ? 'bg-blue-100 border-2 border-blue-400' :
                          'bg-gray-100 border-2 border-gray-300'
                        }`}>
                          <PhaseIcon className={`h-3 w-3 ${
                            status === 'completed' ? 'text-green-600' :
                            status === 'warning' ? 'text-yellow-600' :
                            status === 'pending' ? 'text-blue-600' :
                            'text-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1 pb-3">
                          <div className="text-xs font-semibold text-gray-900">{phase.name}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">{phase.description}</div>
                          {status === 'completed' && (
                            <CheckCircle2 className="h-3 w-3 text-green-600 mt-1" />
                          )}
                          {status === 'warning' && (
                            <AlertTriangle className="h-3 w-3 text-yellow-600 mt-1" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* 单证完成度 */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg shadow-sm p-4">
              <div className="text-xs font-bold text-orange-900 mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-orange-600" />
                单证完成度
              </div>
              
              {/* 环形进度图（简化版） */}
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="#F96302"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 40 * order.completionRate / 100} ${2 * Math.PI * 40}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold" style={{ color: '#F96302' }}>
                        {order.completionRate}%
                      </div>
                      <div className="text-[9px] text-gray-600">完成率</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 统计信息 */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white rounded px-2 py-1.5 text-center">
                  <div className="text-xl font-bold text-green-600">{order.completedDocs}</div>
                  <div className="text-[9px] text-gray-600">已完成</div>
                </div>
                <div className="bg-white rounded px-2 py-1.5 text-center">
                  <div className="text-xl font-bold text-yellow-600">{order.pendingDocs}</div>
                  <div className="text-[9px] text-gray-600">待处理</div>
                </div>
                <div className="bg-white rounded px-2 py-1.5 text-center">
                  <div className="text-xl font-bold text-red-600">{order.overdueDocs}</div>
                  <div className="text-[9px] text-gray-600">超期</div>
                </div>
                <div className="bg-white rounded px-2 py-1.5 text-center">
                  <div className="text-xl font-bold text-orange-600">{order.blockedDocs}</div>
                  <div className="text-[9px] text-gray-600">阻塞</div>
                </div>
              </div>
            </div>
            
            {/* 快捷筛选器 */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
              <div className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-600" />
                快捷筛选
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] text-gray-500 mb-1.5">按状态</div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="all">全部状态</option>
                    <option value="pending">待处理</option>
                    <option value="overdue">超期</option>
                    <option value="blocked">阻塞</option>
                    <option value="reviewing">审核中</option>
                    <option value="approved">已批准</option>
                  </select>
                </div>
                
                <div>
                  <div className="text-[10px] text-gray-500 mb-1.5">按分类</div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="all">全部分类</option>
                    <option value="tax">税务</option>
                    <option value="trade">贸易</option>
                    <option value="customs">报关</option>
                    <option value="logistics">物流</option>
                    <option value="finance">财务</option>
                  </select>
                </div>
                
                <div>
                  <div className="text-[10px] text-gray-500 mb-1.5">按阶段</div>
                  <select
                    value={filterPhase}
                    onChange={(e) => setFilterPhase(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="all">全部阶段</option>
                    {BUSINESS_PHASES.map(phase => (
                      <option key={phase.id} value={phase.id}>{phase.name}</option>
                    ))}
                  </select>
                </div>
                
                {(filterStatus !== 'all' || filterCategory !== 'all' || filterPhase !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-6 text-[10px]"
                    onClick={() => {
                      setFilterStatus('all');
                      setFilterCategory('all');
                      setFilterPhase('all');
                    }}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    重置筛选
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {/* ========== 中间主内容区（50%） ========== */}
          <div className="col-span-6 flex flex-col overflow-hidden">
            
            {/* 搜索栏 + 视图切换 */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 mb-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                {/* 搜索框 */}
                <div className="flex-1 relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    placeholder="搜索单证编号或名称..."
                    className="h-7 text-xs pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {/* 视图切换 */}
                <div className="flex items-center gap-1 bg-gray-100 rounded p-1">
                  {[
                    { id: 'matrix', label: '网格', icon: FileText },
                    { id: 'timeline', label: '时间线', icon: Activity },
                    { id: 'dependency', label: '依赖图', icon: GitBranch },
                    { id: 'list', label: '列表', icon: CheckSquare },
                  ].map(view => (
                    <button
                      key={view.id}
                      onClick={() => setActiveTab(view.id as any)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all ${
                        activeTab === view.id
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <view.icon className="h-3 w-3" />
                      {view.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* 主内容区域 - 单证网格矩阵（按阶段分组） */}
            <div className="flex-1 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-sm">
              {activeTab === 'matrix' && (
                <div className="p-4 space-y-4">
                  {BUSINESS_PHASES.map(phase => {
                    const phaseDocs = documentsByPhase[phase.id as BusinessPhase];
                    const PhaseIcon = phase.icon;
                    const isCollapsed = collapsedPhases.has(phase.id);
                    
                    // 计算该阶段的单证统计
                    const phaseStats = phaseDocs.reduce((acc, def) => {
                      const instance = order.documents[def.id as keyof typeof order.documents];
                      if (!instance) return acc;
                      
                      if (instance.status === 'approved' || instance.status === 'auto_generated') acc.completed++;
                      if (instance.status === 'overdue') acc.overdue++;
                      if (instance.status === 'blocked') acc.blocked++;
                      acc.total++;
                      
                      return acc;
                    }, { completed: 0, overdue: 0, blocked: 0, total: 0 });
                    
                    return (
                      <div key={phase.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* 阶段标题 */}
                        <div
                          className={`px-4 py-3 cursor-pointer flex items-center justify-between ${
                            phase.id === order.currentPhase
                              ? 'bg-gradient-to-r from-orange-50 to-red-50 border-b-2 border-orange-300'
                              : 'bg-gray-50 border-b border-gray-200'
                          }`}
                          onClick={() => togglePhase(phase.id)}
                        >
                          <div className="flex items-center gap-3">
                            {isCollapsed ? (
                              <ChevronRight className="h-4 w-4 text-gray-600" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-600" />
                            )}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              phase.id === order.currentPhase ? 'bg-orange-100' : 'bg-gray-200'
                            }`}>
                              <PhaseIcon className={`h-4 w-4 ${
                                phase.id === order.currentPhase ? 'text-orange-600' : 'text-gray-600'
                              }`} />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900">{phase.name}</div>
                              <div className="text-[10px] text-gray-500">{phase.description}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="text-xs text-gray-600">
                              <span className="font-bold text-green-600">{phaseStats.completed}</span>/{phaseStats.total}
                            </div>
                            {phaseStats.overdue > 0 && (
                              <Badge className="bg-red-600 text-white text-[10px]">
                                {phaseStats.overdue}超期
                              </Badge>
                            )}
                            {phaseStats.blocked > 0 && (
                              <Badge className="bg-orange-500 text-white text-[10px]">
                                {phaseStats.blocked}阻塞
                              </Badge>
                            )}
                            {phase.id === order.currentPhase && (
                              <Badge style={{ background: '#F96302', color: 'white' }} className="text-[10px]">
                                当前阶段
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* 阶段单证卡片 */}
                        {!isCollapsed && (
                          <div className="p-3">
                            <div className="grid grid-cols-3 gap-3">
                              {phaseDocs.map(def => {
                                const instance = order.documents[def.id as keyof typeof order.documents];
                                if (!instance) return null;
                                return renderDocumentCard(def, instance);
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* TODO: 其他视图模式 */}
              {activeTab === 'timeline' && (
                <div className="p-6 text-center text-gray-500">
                  <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <div className="text-sm font-semibold">时间线视图</div>
                  <div className="text-xs mt-2">开发中...</div>
                </div>
              )}
              
              {activeTab === 'dependency' && (
                <div className="p-6 text-center text-gray-500">
                  <GitBranch className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <div className="text-sm font-semibold">依赖关系视图</div>
                  <div className="text-xs mt-2">开发中...</div>
                </div>
              )}
              
              {activeTab === 'list' && (
                <div className="p-6 text-center text-gray-500">
                  <CheckSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <div className="text-sm font-semibold">列表视图</div>
                  <div className="text-xs mt-2">开发中...</div>
                </div>
              )}
            </div>
          </div>
          
          {/* ========== 右侧边栏（25%） ========== */}
          <div className="col-span-3 space-y-4 overflow-y-auto">
            
            {/* 关键风险提示 */}
            {order.risks.filter(r => r.level === 'critical' || r.level === 'high').length > 0 && (
              <div className="bg-red-50 border border-red-300 rounded-lg shadow-sm p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-xs font-bold text-red-900">关键风险</span>
                </div>
                <div className="space-y-1.5">
                  {order.risks.filter(r => r.level === 'critical' || r.level === 'high').map(risk => (
                    <div key={risk.id} className="bg-white border border-red-200 rounded p-2">
                      <div className="text-[10px] font-semibold text-red-900 mb-0.5">{risk.title}</div>
                      <div className="text-[9px] text-red-600">{risk.deadline}</div>
                      <Button
                        size="sm"
                        className="w-full mt-1.5 h-5 text-[9px] bg-red-600 text-white hover:bg-red-700"
                        onClick={() => {
                          setSelectedDoc(risk.docId);
                          setShowDocDetail(true);
                        }}
                      >
                        立即处理
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 待办任务清单 */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckSquare className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-bold text-gray-900">待办任务</span>
                <Badge className="bg-blue-600 text-white text-[10px]">
                  {order.todos.filter(t => t.status === 'open').length}
                </Badge>
              </div>
              <div className="space-y-1.5">
                {order.todos.filter(t => t.status === 'open').slice(0, 4).map(todo => (
                  <label
                    key={todo.id}
                    className={`flex items-start gap-2 p-2 rounded cursor-pointer transition-colors ${
                      todo.priority === 'critical' ? 'bg-red-50 hover:bg-red-100' :
                      todo.priority === 'high' ? 'bg-yellow-50 hover:bg-yellow-100' :
                      todo.priority === 'medium' ? 'bg-blue-50 hover:bg-blue-100' :
                      'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <input type="checkbox" className="mt-0.5" />
                    <div className="flex-1">
                      <div className={`text-[10px] font-semibold ${
                        todo.priority === 'critical' ? 'text-red-900' :
                        todo.priority === 'high' ? 'text-yellow-900' :
                        todo.priority === 'medium' ? 'text-blue-900' :
                        'text-gray-900'
                      }`}>
                        {todo.title}
                      </div>
                      <div className={`text-[9px] ${
                        todo.priority === 'critical' ? 'text-red-600' :
                        todo.priority === 'high' ? 'text-yellow-600' :
                        todo.priority === 'medium' ? 'text-blue-600' :
                        'text-gray-600'
                      }`}>
                        {todo.assignee} · {todo.dueDate}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full mt-2 h-6 text-[10px]"
              >
                <Flag className="h-3 w-3 mr-1" />
                添加新任务
              </Button>
            </div>
            
            {/* 智能建议 */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg shadow-sm p-3">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-bold text-purple-900">智能建议</span>
              </div>
              <div className="space-y-1.5">
                {order.suggestions.slice(0, 3).map(suggestion => {
                  const Icon = suggestion.icon;
                  return (
                    <div key={suggestion.id} className="bg-white border border-purple-200 rounded p-2">
                      <div className="flex items-start gap-1.5">
                        <Icon className={`h-3.5 w-3.5 flex-shrink-0 mt-0.5 ${
                          suggestion.priority === 'high' ? 'text-red-600' :
                          suggestion.priority === 'medium' ? 'text-yellow-600' :
                          'text-blue-600'
                        }`} />
                        <div className="flex-1">
                          <div className="text-[10px] font-semibold text-purple-900 mb-0.5">
                            {suggestion.title}
                          </div>
                          <div className="text-[9px] text-purple-700 leading-tight">
                            {suggestion.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* 协作面板 */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-gray-600" />
                <span className="text-xs font-bold text-gray-900">最新动态</span>
              </div>
              <div className="space-y-2 mb-2 max-h-48 overflow-y-auto">
                {order.activities.slice(0, 5).map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-1.5 bg-gray-50 rounded text-[9px]">
                    <div className={`w-1 h-1 rounded-full mt-1.5 flex-shrink-0 ${
                      activity.type === 'upload' ? 'bg-blue-500' :
                      activity.type === 'approve' ? 'bg-green-500' :
                      activity.type === 'auto' ? 'bg-purple-500' :
                      activity.type === 'reminder' ? 'bg-orange-500' :
                      'bg-gray-400'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-semibold text-gray-900 truncate">{activity.user}</span>
                        <span className="text-gray-500 text-[8px] flex-shrink-0">{activity.time}</span>
                      </div>
                      <div className="text-gray-700 leading-tight">{activity.action}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <Input
                  placeholder="快速评论... (@提醒相关人员)"
                  className="h-7 text-xs"
                />
                <Button 
                  size="sm" 
                  className="w-full h-6 text-[10px] text-white"
                  style={{ background: '#F96302' }}
                >
                  <Send className="h-3 w-3 mr-1" />
                  发送
                </Button>
              </div>
            </div>
            
            {/* 相关文档 */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-gray-600" />
                <span className="text-xs font-bold text-gray-900">相关文档</span>
              </div>
              <div className="space-y-1">
                <button className="w-full text-left px-2 py-1.5 text-[10px] text-blue-600 hover:bg-blue-50 rounded flex items-center gap-1.5">
                  <Download className="h-3 w-3" />
                  单证模板下载
                </button>
                <button className="w-full text-left px-2 py-1.5 text-[10px] text-blue-600 hover:bg-blue-50 rounded flex items-center gap-1.5">
                  <FileCheck className="h-3 w-3" />
                  退税SOP文档
                </button>
                <button className="w-full text-left px-2 py-1.5 text-[10px] text-blue-600 hover:bg-blue-50 rounded flex items-center gap-1.5">
                  <Info className="h-3 w-3" />
                  帮助指南
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
