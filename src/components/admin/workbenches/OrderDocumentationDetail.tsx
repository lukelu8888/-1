// 📋 订单单证详情页
// Order Documentation Detail - Single Order Documentation Management Center

import React, { useState } from 'react';
import { 
  ArrowLeft, Package, DollarSign, Ship, Calendar, TrendingUp,
  FileText, Upload, Download, Eye, Trash2, CheckCircle2, Clock,
  AlertTriangle, XCircle, Zap, MessageSquare, CheckSquare, Bell,
  FileCheck, Users, Target, MoreHorizontal, ExternalLink, 
  GitBranch, Activity, Save, Send, Printer, RefreshCw, Flag,
  FileSignature, Truck, Plane, Edit, Link2, BarChart3, Grid3X3
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';

interface OrderDocumentationDetailProps {
  orderId: string;
  onBack: () => void;
}

// 单证状态类型
type DocStatus = 'pending' | 'auto_generated' | 'uploaded' | 'reviewing' | 'approved' | 'rejected' | 'na' | 'overdue';

// 单证定义（与Ultimate保持一致）
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
    icon: Truck,
    autoJudge: 'incoterm'
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
    icon: FileCheck
  },
];

// 单证分类
const CATEGORIES = {
  tax: { label: '税务', color: 'bg-red-50 border-red-200 text-red-800' },
  trade: { label: '贸易', color: 'bg-blue-50 border-blue-200 text-blue-800' },
  customs: { label: '报关', color: 'bg-purple-50 border-purple-200 text-purple-800' },
  logistics: { label: '物流', color: 'bg-green-50 border-green-200 text-green-800' },
  finance: { label: '财务', color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
};

// 业务阶段定义
const BUSINESS_MILESTONES = [
  { id: 'contract', name: '合同签订', date: '12/01', status: 'completed', icon: FileSignature },
  { id: 'procurement', name: '采购完成', date: '12/05', status: 'completed', icon: Package },
  { id: 'shipment', name: '出货', date: '12/15', status: 'completed', icon: Truck },
  { id: 'customs', name: '报关', date: '12/14', status: 'warning', icon: FileCheck },
  { id: 'collection', name: '收汇', date: '待确认', status: 'pending', icon: DollarSign },
  { id: 'tax_refund', name: '退税', date: '', status: 'blocked', icon: TrendingUp },
];

// 模拟订单数据
const mockOrderDetail = {
  orderId: 'SO-NA-20251210-001',
  contractNo: 'SC-NA-20251201-001',
  customer: {
    name: 'Home Depot Inc.',
    country: 'USA',
    region: 'North America',
  },
  salesRep: '张伟',
  businessStage: 'customs',
  incoterm: 'FOB',
  paymentTerm: 'T/T 30% Deposit, 70% Before Shipment',
  currency: 'USD',
  totalValue: 125000,
  deposit: 37500,
  balance: 87500,
  collectionProgress: 60, // 60%已收汇
  
  contractDate: '2025-12-01',
  procurementDate: '2025-12-05',
  shipmentDate: '2025-12-15',
  customsDate: '2025-12-14',
  etd: '2025-12-16',
  eta: '2026-01-05',
  
  destPort: 'Los Angeles',
  container: '40HQ x 2',
  
  completionRate: 54,
  requiredDocs: 11,
  completedDocs: 6,
  missingDocs: 5,
  overdueItems: 2,
  
  documents: {
    D01: { 
      docId: 'D01',
      status: 'pending' as DocStatus, 
      version: 0,
      files: [],
      urgency: 'high',
      history: [],
      deadline: '2026-01-14',
      daysRemaining: 33,
      blockedBy: ['D05', 'D11', 'D12', 'D13']
    },
    D02: { 
      docId: 'D02',
      status: 'approved' as DocStatus, 
      uploadDate: '2025-12-01', 
      uploadBy: '张伟', 
      reviewer: '财务部', 
      reviewDate: '2025-12-01',
      approveDate: '2025-12-01',
      version: 2,
      files: [
        { fileId: 'F001', fileName: 'SC-NA-20251201-001.pdf', fileSize: '1.8MB', fileType: 'pdf', uploadDate: '2025-12-01 10:00' }
      ],
      history: [
        { action: '生成合同', operator: '系统', timestamp: '2025-12-01 10:00', comment: '自动生成销售合同' },
        { action: '审核通过', operator: '财务部', timestamp: '2025-12-01 10:30', comment: '合同条款无误' }
      ],
      deadline: '2025-12-01',
      daysRemaining: 0,
      qualityScore: 98
    },
    D03: {
      docId: 'D03',
      status: 'uploaded' as DocStatus,
      uploadDate: '2025-12-16',
      uploadBy: '物流部',
      version: 1,
      files: [
        { fileId: 'F003', fileName: '国内运输单据.pdf', fileSize: '850KB', fileType: 'pdf', uploadDate: '2025-12-16 09:00' }
      ],
      history: [
        { action: '上传单据', operator: '物流部', timestamp: '2025-12-16 09:00', comment: '已完成国内运输' }
      ],
      deadline: '2025-12-22',
      daysRemaining: 3,
      urgency: 'medium'
    },
    D04: {
      docId: 'D04',
      status: 'auto_generated' as DocStatus,
      version: 1,
      files: [
        { fileId: 'F004', fileName: '国内运费免责声明.pdf', fileSize: '120KB', fileType: 'pdf', uploadDate: '2025-12-01 10:05' }
      ],
      history: [
        { action: '自动生成', operator: '系统', timestamp: '2025-12-01 10:05', comment: 'FOB条款自动生成' }
      ],
      deadline: '2025-12-01',
      daysRemaining: 0,
      urgency: 'low'
    },
    D05: { 
      docId: 'D05',
      status: 'overdue' as DocStatus, 
      urgency: 'critical',
      version: 0,
      files: [],
      history: [
        { action: '报关完成', operator: '报关行', timestamp: '2025-12-14 16:00', comment: '已完成报关，等待单据' }
      ],
      deadline: '2025-12-17',
      daysRemaining: -2,
      blockedBy: [],
      reminders: [
        { date: '2025-12-18', recipient: '报关行', message: '第1次催办' },
        { date: '2025-12-19', recipient: '报关行', message: '第2次催办（加急）' },
      ]
    },
    D06: {
      docId: 'D06',
      status: 'uploaded' as DocStatus,
      uploadDate: '2025-12-15',
      uploadBy: '报关行',
      reviewer: '财务部',
      version: 1,
      files: [
        { fileId: 'F006', fileName: '报关委托合同.pdf', fileSize: '650KB', fileType: 'pdf', uploadDate: '2025-12-15 14:00' }
      ],
      history: [
        { action: '上传单据', operator: '报关行', timestamp: '2025-12-15 14:00', comment: '报关委托合同及费用凭证' }
      ],
      deadline: '2025-12-21',
      daysRemaining: 2,
      urgency: 'medium'
    },
    D07: {
      docId: 'D07',
      status: 'approved' as DocStatus,
      uploadDate: '2025-12-05',
      uploadBy: '采购部',
      reviewer: '财务部',
      reviewDate: '2025-12-08',
      approveDate: '2025-12-08',
      version: 1,
      files: [
        { fileId: 'F007', fileName: '采购发票.pdf', fileSize: '1.2MB', fileType: 'pdf', uploadDate: '2025-12-05 11:00' }
      ],
      history: [
        { action: '自动生成', operator: '系统', timestamp: '2025-12-05 14:30', comment: '采购合同生成' },
        { action: '审核通过', operator: '财务部', timestamp: '2025-12-08 10:00', comment: '采购发票已验证' }
      ],
      deadline: '2025-12-20',
      daysRemaining: 1,
      qualityScore: 95
    },
    D08: {
      docId: 'D08',
      status: 'na' as DocStatus,
      version: 0,
      files: [],
      history: [],
      deadline: '',
      daysRemaining: 0,
      note: '根据合同条款，报关费用由买方承担，无需此文档'
    },
    D09: {
      docId: 'D09',
      status: 'reviewing' as DocStatus,
      uploadDate: '2025-12-17',
      uploadBy: '货代公司',
      reviewer: '财务部',
      version: 1,
      files: [
        { fileId: 'F009', fileName: '国际运费发票.pdf', fileSize: '920KB', fileType: 'pdf', uploadDate: '2025-12-17 16:00' }
      ],
      history: [
        { action: '上传单据', operator: '货代公司', timestamp: '2025-12-17 16:00', comment: '海运费发票' }
      ],
      deadline: '2025-12-31',
      daysRemaining: 12,
      urgency: 'medium'
    },
    D10: {
      docId: 'D10',
      status: 'auto_generated' as DocStatus,
      version: 1,
      files: [
        { fileId: 'F010', fileName: '国际运费免责声明.pdf', fileSize: '115KB', fileType: 'pdf', uploadDate: '2025-12-01 10:05' }
      ],
      history: [
        { action: '自动生成', operator: '系统', timestamp: '2025-12-01 10:05', comment: 'FOB条款自动生成' }
      ],
      deadline: '2025-12-01',
      daysRemaining: 0,
      urgency: 'low'
    },
    D11: { 
      docId: 'D11',
      status: 'pending' as DocStatus, 
      urgency: 'high',
      version: 0,
      files: [],
      history: [],
      deadline: '2026-03-15',
      daysRemaining: 93,
      blockedBy: [],
      note: '等待客户付款，已发催款邮件'
    },
    D12: {
      docId: 'D12',
      status: 'pending' as DocStatus,
      urgency: 'medium',
      version: 0,
      files: [],
      history: [],
      deadline: '2026-03-20',
      daysRemaining: 98,
      blockedBy: ['D11'],
      note: '依赖D11收汇水单'
    },
    D13: {
      docId: 'D13',
      status: 'pending' as DocStatus,
      urgency: 'medium',
      version: 0,
      files: [],
      history: [],
      deadline: '2026-03-25',
      daysRemaining: 103,
      blockedBy: ['D12'],
      note: '依赖D12结汇水单'
    },
  }
};

export function OrderDocumentationDetail({ orderId, onBack }: OrderDocumentationDetailProps) {
  const [activeTab, setActiveTab] = useState<'grid' | 'matrix' | 'gantt' | 'dependency' | 'collaboration'>('grid');
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [comment, setComment] = useState('');

  console.log('[OrderDocumentationDetail] 正在渲染，orderId:', orderId);

  // 根据 orderId 获取订单数据（当前仅支持示例订单，其他订单使用相同模板）
  const order = {
    ...mockOrderDetail,
    orderId: orderId, // 使用传入的 orderId
  };

  const getStatusBadge = (status: DocStatus) => {
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

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
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
                  进度 {order.completionRate}%
                </Badge>
              </div>
              <div className="text-xs text-gray-500">{order.customer.name} · {order.contractNo}</div>
            </div>
          </div>
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
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-6 bg-gray-50">
        <div className="grid grid-cols-12 gap-4">
          {/* 左侧主内容区 */}
          <div className="col-span-9 space-y-4">
            {/* 订单全景概览卡片 */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div className="flex items-start gap-2">
                  <Package className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <div className="text-[10px] text-gray-500 mb-0.5">客户信息</div>
                    <div className="text-xs font-semibold text-gray-900">{order.customer.name}</div>
                    <div className="text-[10px] text-gray-500">{order.customer.country}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <DollarSign className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <div className="text-[10px] text-gray-500 mb-0.5">合同金额</div>
                    <div className="text-xs font-semibold text-gray-900">{order.currency} {order.totalValue.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-500">{order.incoterm} · {order.destPort}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Ship className="h-4 w-4 text-indigo-600 mt-0.5" />
                  <div>
                    <div className="text-[10px] text-gray-500 mb-0.5">出货信息</div>
                    <div className="text-xs font-semibold text-gray-900">{order.shipmentDate}</div>
                    <div className="text-[10px] text-gray-500">{order.container}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600 mt-0.5" />
                  <div>
                    <div className="text-[10px] text-gray-500 mb-0.5">收汇进度</div>
                    <div className="text-xs font-semibold text-gray-900">{order.collectionProgress}% 已收汇</div>
                    <div className="text-[10px] text-gray-500">{order.currency} {(order.totalValue * order.collectionProgress / 100).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* 业务时间线 */}
              <div className="border-t border-gray-200 pt-3">
                <div className="text-[10px] text-gray-500 mb-2">业务时间线</div>
                <div className="flex items-center justify-between">
                  {BUSINESS_MILESTONES.map((milestone, idx) => {
                    const Icon = milestone.icon;
                    return (
                      <React.Fragment key={milestone.id}>
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                            milestone.status === 'completed' ? 'bg-green-100 border-2 border-green-500' :
                            milestone.status === 'warning' ? 'bg-yellow-100 border-2 border-yellow-500' :
                            milestone.status === 'pending' ? 'bg-blue-100 border-2 border-blue-400' :
                            'bg-gray-100 border-2 border-gray-300'
                          }`}>
                            <Icon className={`h-3.5 w-3.5 ${
                              milestone.status === 'completed' ? 'text-green-600' :
                              milestone.status === 'warning' ? 'text-yellow-600' :
                              milestone.status === 'pending' ? 'text-blue-600' :
                              'text-gray-400'
                            }`} />
                          </div>
                          <div className="text-[10px] font-semibold text-gray-700 text-center">{milestone.name}</div>
                          <div className="text-[9px] text-gray-500">{milestone.date}</div>
                          {milestone.status === 'completed' && (
                            <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5" />
                          )}
                          {milestone.status === 'warning' && (
                            <AlertTriangle className="h-3 w-3 text-yellow-600 mt-0.5" />
                          )}
                          {milestone.status === 'blocked' && (
                            <XCircle className="h-3 w-3 text-gray-400 mt-0.5" />
                          )}
                        </div>
                        {idx < BUSINESS_MILESTONES.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-2 ${
                            milestone.status === 'completed' ? 'bg-green-400' : 'bg-gray-300'
                          }`}></div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 单证进度仪表盘 */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg shadow-sm p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-orange-600" />
                  <span className="text-xs font-bold text-orange-900">单证进度仪表盘</span>
                </div>
                <div className="text-xl font-bold" style={{ color: '#F96302' }}>{order.completionRate}%</div>
              </div>
              <div className="w-full bg-white rounded-full h-3 mb-2 border border-orange-200">
                <div 
                  className="h-3 rounded-full transition-all"
                  style={{ 
                    width: `${order.completionRate}%`,
                    background: 'linear-gradient(to right, #F96302, #ff8534)'
                  }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-3">
                  <span className="text-gray-700">
                    <span className="font-bold text-green-700">{order.completedDocs}</span> / {order.requiredDocs} 完成
                  </span>
                  <span className="text-gray-700">
                    <span className="font-bold text-yellow-700">{order.missingDocs}</span> 项缺失
                  </span>
                  <span className="text-gray-700">
                    <span className="font-bold text-red-700">{order.overdueItems}</span> 项超期
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-red-600" />
                  <span className="text-red-700 font-semibold">D05报关单已超期2天</span>
                </div>
              </div>
            </div>

            {/* Tab切换 */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="border-b border-gray-200 bg-gray-50 px-3 py-2">
                <div className="flex items-center gap-1">
                  {[
                    { id: 'grid', label: '单证网格视图', icon: FileText },
                    { id: 'matrix', label: '矩阵视图', icon: Grid3X3 },
                    { id: 'gantt', label: '甘特图时间线', icon: Activity },
                    { id: 'dependency', label: '依赖关系图', icon: GitBranch },
                    { id: 'collaboration', label: '协作与历史', icon: MessageSquare },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <tab.icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4">
                {/* 📁 单证网格视图 */}
                {activeTab === 'grid' && (
                  <div className="grid grid-cols-4 gap-3">
                    {DOCUMENT_CHECKLIST.map((doc) => {
                      const docInstance = order.documents[doc.id as keyof typeof order.documents];
                      if (!docInstance) return null;
                      
                      const Icon = doc.icon;
                      const category = CATEGORIES[doc.category as keyof typeof CATEGORIES];
                      
                      return (
                        <div
                          key={doc.id}
                          className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                            docInstance.status === 'approved' ? 'bg-green-50 border-green-300' :
                            docInstance.status === 'auto_generated' ? 'bg-blue-50 border-blue-300' :
                            docInstance.status === 'uploaded' || docInstance.status === 'reviewing' ? 'bg-cyan-50 border-cyan-300' :
                            docInstance.status === 'overdue' ? 'bg-red-50 border-red-400' :
                            docInstance.status === 'pending' ? 'bg-yellow-50 border-yellow-300' :
                            docInstance.status === 'rejected' ? 'bg-orange-50 border-orange-300' :
                            'bg-gray-50 border-gray-200'
                          } ${selectedDoc === doc.id ? 'ring-2 ring-offset-2' : ''}`}
                          style={selectedDoc === doc.id ? { ringColor: '#F96302' } : {}}
                          onClick={() => setSelectedDoc(doc.id)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <Icon className={`h-5 w-5 ${
                              docInstance.status === 'approved' ? 'text-green-600' :
                              docInstance.status === 'auto_generated' ? 'text-blue-600' :
                              docInstance.status === 'uploaded' || docInstance.status === 'reviewing' ? 'text-cyan-600' :
                              docInstance.status === 'overdue' ? 'text-red-700' :
                              docInstance.status === 'pending' ? 'text-yellow-600' :
                              docInstance.status === 'rejected' ? 'text-orange-600' :
                              'text-gray-400'
                            }`} />
                            {docInstance.status === 'overdue' && (
                              <Badge className="bg-red-600 text-white text-[9px] px-1 py-0">
                                超期{Math.abs(docInstance.daysRemaining || 0)}天
                              </Badge>
                            )}
                          </div>
                          
                          <div className="mb-1">
                            <div className="text-xs font-bold text-gray-900 mb-0.5">{doc.id}</div>
                            <Badge className={`${category.color} text-[9px] px-1.5 py-0`}>{category.label}</Badge>
                          </div>
                          
                          <div className="text-[10px] font-semibold text-gray-800 mb-1 line-clamp-2">
                            {doc.name}
                          </div>
                          
                          <div className="mb-2">
                            {getStatusBadge(docInstance.status)}
                          </div>
                          
                          {docInstance.files && docInstance.files.length > 0 ? (
                            <div className="text-[9px] text-gray-600 mb-2">
                              📎 {docInstance.files.length}个文件 · v{docInstance.version}
                            </div>
                          ) : (
                            <div className="text-[9px] text-gray-400 mb-2">
                              📎 无文件
                            </div>
                          )}
                          
                          {docInstance.blockedBy && docInstance.blockedBy.length > 0 && (
                            <div className="text-[9px] text-orange-700 mb-2 flex items-start gap-1">
                              <Link2 className="h-3 w-3 flex-shrink-0" />
                              <span>依赖: {docInstance.blockedBy.join(', ')}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1 pt-2 border-t border-gray-200">
                            {docInstance.status === 'pending' || docInstance.status === 'overdue' ? (
                              <Button 
                                size="sm" 
                                className="flex-1 h-6 text-[10px] text-white"
                                style={{ background: '#F96302' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowUploadDialog(true);
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
                    })}
                  </div>
                )}

                {/* 📊 甘特图时间线 */}
                {activeTab === 'gantt' && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-gray-700 mb-3">单证处理时间线</div>
                    {DOCUMENT_CHECKLIST.filter(d => d.required).map((doc) => {
                      const docInstance = order.documents[doc.id as keyof typeof order.documents];
                      if (!docInstance) return null;
                      
                      const progress = docInstance.status === 'approved' ? 100 :
                                     docInstance.status === 'uploaded' || docInstance.status === 'reviewing' ? 70 :
                                     docInstance.status === 'auto_generated' ? 100 :
                                     docInstance.status === 'overdue' ? 60 : 0;
                      
                      return (
                        <div key={doc.id} className="flex items-center gap-3">
                          <div className="w-32 text-xs font-medium text-gray-700 flex items-center gap-1">
                            <span className="font-bold text-gray-900">{doc.id}</span>
                            <span className="text-[10px] text-gray-500 truncate">{doc.name}</span>
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                            <div 
                              className={`h-4 rounded-full transition-all ${
                                docInstance.status === 'approved' ? 'bg-green-500' :
                                docInstance.status === 'auto_generated' ? 'bg-blue-500' :
                                docInstance.status === 'uploaded' || docInstance.status === 'reviewing' ? 'bg-cyan-500' :
                                docInstance.status === 'overdue' ? 'bg-red-500' :
                                'bg-yellow-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            >
                              <span className="absolute left-2 top-0.5 text-[9px] font-bold text-white">
                                {progress}%
                              </span>
                            </div>
                          </div>
                          <div className="w-24 text-[10px] text-gray-600">
                            {docInstance.deadline ? `⏰ ${docInstance.deadline}` : ''}
                          </div>
                          {getStatusBadge(docInstance.status)}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 📊 矩阵视图 - 按业务阶段排列的一目了然单证表*/}
                {activeTab === 'matrix' && (
                  <div className="overflow-x-auto -mx-4 -mb-4">
                    <div className="min-w-[800px] p-4">
                      {/* 业务阶段分组 */}
                      {[
                        {
                          stage: '合同阶段',
                          color: '#3B82F6',
                          docs: ['D02', 'D07']
                        },
                        {
                          stage: '国内运输',
                          color: '#8B5CF6',
                          docs: ['D03', 'D04']
                        },
                        {
                          stage: '报关出口',
                          color: '#F59E0B',
                          docs: ['D05', 'D06', 'D08']
                        },
                        {
                          stage: '国际运输',
                          color: '#10B981',
                          docs: ['D09', 'D10']
                        },
                        {
                          stage: '收汇结汇',
                          color: '#EC4899',
                          docs: ['D11', 'D12']
                        },
                        {
                          stage: '退税阶段',
                          color: '#EF4444',
                          docs: ['D01', 'D13']
                        },
                      ].map((stageGroup, groupIdx) => (
                        <div key={groupIdx} className="mb-4">
                          {/* 阶段标题 */}
                          <div 
                            className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg" 
                            style={{ backgroundColor: `${stageGroup.color}15`, borderLeft: `4px solid ${stageGroup.color}` }}
                          >
                            <span className="text-sm font-bold" style={{ color: stageGroup.color }}>
                              {stageGroup.stage}
                            </span>
                            <Badge className="text-[9px]" style={{ backgroundColor: stageGroup.color, color: 'white' }}>
                              {stageGroup.docs.length}份
                            </Badge>
                          </div>

                          {/* 单证卡片网格 */}
                          <div className="grid grid-cols-6 gap-2">
                            {stageGroup.docs.map((docId) => {
                              const doc = DOCUMENT_CHECKLIST.find(d => d.id === docId);
                              if (!doc) return null;
                              
                              const docInstance = order.documents[docId as keyof typeof order.documents];
                              if (!docInstance) return null;
                              
                              const Icon = doc.icon;
                              
                              return (
                                <div
                                  key={docId}
                                  className={`border-2 rounded p-2 cursor-pointer transition-all hover:shadow-md ${
                                    docInstance.status === 'approved' ? 'bg-green-50 border-green-400' :
                                    docInstance.status === 'auto_generated' ? 'bg-blue-50 border-blue-400' :
                                    docInstance.status === 'uploaded' || docInstance.status === 'reviewing' ? 'bg-cyan-50 border-cyan-400' :
                                    docInstance.status === 'overdue' ? 'bg-red-50 border-red-500' :
                                    docInstance.status === 'pending' ? 'bg-gray-50 border-gray-300 border-dashed' :
                                    docInstance.status === 'na' ? 'bg-gray-100 border-gray-200 opacity-50' :
                                    'bg-orange-50 border-orange-400'
                                  }`}
                                  onClick={() => setSelectedDoc(docId)}
                                >
                                  <div className="flex items-start justify-between mb-1">
                                    <Icon className={`h-4 w-4 ${
                                      docInstance.status === 'approved' ? 'text-green-600' :
                                      docInstance.status === 'auto_generated' ? 'text-blue-600' :
                                      docInstance.status === 'uploaded' || docInstance.status === 'reviewing' ? 'text-cyan-600' :
                                      docInstance.status === 'overdue' ? 'text-red-700' :
                                      docInstance.status === 'pending' ? 'text-gray-400' :
                                      docInstance.status === 'na' ? 'text-gray-300' :
                                      'text-orange-600'
                                    }`} />
                                    {docInstance.status === 'overdue' && (
                                      <AlertTriangle className="h-3 w-3 text-red-700" />
                                    )}
                                    {docInstance.status === 'approved' && (
                                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                                    )}
                                    {docInstance.status === 'pending' && (
                                      <Clock className="h-3 w-3 text-gray-400" />
                                    )}
                                  </div>
                                  
                                  <div className="text-xs font-bold text-gray-900 mb-0.5">{docId}</div>
                                  <div className="text-[9px] text-gray-700 mb-1 line-clamp-2 leading-tight">
                                    {doc.name}
                                  </div>
                                  
                                  {getStatusBadge(docInstance.status)}
                                  
                                  {docInstance.files && docInstance.files.length > 0 ? (
                                    <div className="text-[8px] text-gray-600 mt-1">
                                      📎 {docInstance.files.length}个文件
                                    </div>
                                  ) : docInstance.status === 'pending' ? (
                                    <div className="text-[8px] text-gray-400 mt-1">
                                      ⏳ 待上传
                                    </div>
                                  ) : docInstance.status === 'na' ? (
                                    <div className="text-[8px] text-gray-400 mt-1">
                                      ⊘ 不适用
                                    </div>
                                  ) : null}
                                  
                                  {docInstance.status === 'pending' || docInstance.status === 'overdue' ? (
                                    <Button 
                                      size="sm" 
                                      className="w-full h-5 text-[8px] mt-1 text-white"
                                      style={{ background: '#F96302' }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowUploadDialog(true);
                                      }}
                                    >
                                      <Upload className="h-2.5 w-2.5 mr-0.5" />
                                      上传
                                    </Button>
                                  ) : docInstance.status !== 'na' ? (
                                    <div className="flex gap-0.5 mt-1">
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        className="flex-1 h-5 text-[8px] p-0"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Eye className="h-2.5 w-2.5" />
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        className="flex-1 h-5 text-[8px] p-0"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Download className="h-2.5 w-2.5" />
                                      </Button>
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 🔗 依赖关系图 */}
                {activeTab === 'dependency' && (
                  <div className="text-center py-12">
                    <GitBranch className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <div className="text-sm font-semibold text-gray-700 mb-2">依赖关系可视化图谱</div>
                    <div className="text-xs text-gray-500 mb-4">展示13项单证之间的依赖关系</div>
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-left max-w-md mx-auto">
                      <div className="font-semibold text-blue-900 mb-2">依赖链示例：</div>
                      <div className="space-y-1 text-blue-800 font-mono text-[10px]">
                        <div>D02 (合同)</div>
                        <div className="ml-4">↓</div>
                        <div className="ml-4">D07 (采购) + D05 (报关单) ← ⚠️超期阻塞</div>
                        <div className="ml-8">↓</div>
                        <div className="ml-8">D11 (收汇) ← 等待客户付款</div>
                        <div className="ml-12">↓</div>
                        <div className="ml-12">D12 (结汇)</div>
                        <div className="ml-16">↓</div>
                        <div className="ml-16">D13 + D01 (退税) ← 最终目标</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 💬 协作与历史 */}
                {activeTab === 'collaboration' && (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-gray-700 mb-2">📝 操作历史</div>
                    <div className="space-y-2">
                      {[
                        { time: '2025-12-11 14:23', user: '张伟', action: '上传D02销售合同 v2', type: 'upload' },
                        { time: '2025-12-10 16:00', user: '报关行', action: '完成报关，等待D05单据', type: 'info' },
                        { time: '2025-12-08 10:00', user: '财务部', action: '批准D07采购发票', type: 'approve' },
                        { time: '2025-12-05 14:30', user: '系统', action: '生成D07采购合同', type: 'auto' },
                        { time: '2025-12-01 10:30', user: '财务部', action: '审核通过D02销售合同', type: 'approve' },
                        { time: '2025-12-01 10:00', user: '系统', action: '自动生成D04/D10免责声明', type: 'auto' },
                      ].map((log, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                            log.type === 'upload' ? 'bg-blue-500' :
                            log.type === 'approve' ? 'bg-green-500' :
                            log.type === 'auto' ? 'bg-purple-500' :
                            'bg-gray-400'
                          }`}></div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-semibold text-gray-900">{log.user}</span>
                              <span className="text-[10px] text-gray-500">{log.time}</span>
                            </div>
                            <div className="text-xs text-gray-700">{log.action}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右侧协作面板 */}
          <div className="col-span-3 space-y-4">
            {/* 严重预警 */}
            <div className="bg-red-50 border border-red-300 rounded-lg shadow-sm p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-xs font-bold text-red-900">⚠️ 严重预警</span>
              </div>
              <div className="space-y-1.5">
                <div className="bg-white border border-red-200 rounded p-2 text-[10px] text-red-800">
                  <div className="font-semibold mb-0.5">D05 报关单已超期2天</div>
                  <div className="text-red-600">截止日期: 2025-12-17</div>
                </div>
                <div className="bg-white border border-orange-200 rounded p-2 text-[10px] text-orange-800">
                  <div className="font-semibold mb-0.5">D11 收汇水单待确认</div>
                  <div className="text-orange-600">等待客户付款到账</div>
                </div>
              </div>
            </div>

            {/* 待办任务 */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckSquare className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-bold text-gray-900">📌 待办任务</span>
              </div>
              <div className="space-y-1.5">
                <label className="flex items-start gap-2 p-2 bg-red-50 rounded cursor-pointer hover:bg-red-100">
                  <input type="checkbox" className="mt-0.5" />
                  <div className="flex-1">
                    <div className="text-[10px] font-semibold text-red-900">催促报关行上传D05（紧急！）</div>
                    <div className="text-[9px] text-red-600">负责人: 张伟</div>
                  </div>
                </label>
                <label className="flex items-start gap-2 p-2 bg-yellow-50 rounded cursor-pointer hover:bg-yellow-100">
                  <input type="checkbox" className="mt-0.5" />
                  <div className="flex-1">
                    <div className="text-[10px] font-semibold text-yellow-900">跟进客户付款进度</div>
                    <div className="text-[9px] text-yellow-600">负责人: 财务部</div>
                  </div>
                </label>
                <label className="flex items-start gap-2 p-2 bg-blue-50 rounded cursor-pointer hover:bg-blue-100">
                  <input type="checkbox" className="mt-0.5" />
                  <div className="flex-1">
                    <div className="text-[10px] font-semibold text-blue-900">准备D13退税凭证材料</div>
                    <div className="text-[9px] text-blue-600">负责人: 单证员</div>
                  </div>
                </label>
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

            {/* 智能提醒 */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg shadow-sm p-3">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-bold text-purple-900">🔔 智能提醒</span>
              </div>
              <div className="space-y-1.5 text-[10px] text-purple-800">
                <div className="bg-white border border-purple-200 rounded p-2">
                  💡 建议先催收客户付款，D11到位后才能生成D13和D01
                </div>
                <div className="bg-white border border-purple-200 rounded p-2">
                  ⏰ 距离退税截止日期还剩33天，请加快单证收集
                </div>
                <div className="bg-white border border-purple-200 rounded p-2">
                  📊 该订单单证完成率54%，低于平均水平（72%）
                </div>
              </div>
            </div>

            {/* 评论区 */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-gray-600" />
                <span className="text-xs font-bold text-gray-900">💬 备注与评论</span>
              </div>
              <div className="space-y-2 mb-2">
                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-[10px] font-bold text-blue-900">张伟</span>
                    <span className="text-[9px] text-blue-600">@报关行</span>
                    <span className="text-[9px] text-gray-500 ml-auto">12/11 14:30</span>
                  </div>
                  <div className="text-[10px] text-blue-800">D05报关单请加急，客户催货</div>
                </div>
              </div>
              <div className="space-y-1">
                <Input
                  placeholder="输入评论内容... (@提醒相关人员)"
                  className="h-7 text-xs"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <Button 
                  size="sm" 
                  className="w-full h-6 text-[10px] text-white"
                  style={{ background: '#F96302' }}
                >
                  <Send className="h-3 w-3 mr-1" />
                  发送评论
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}