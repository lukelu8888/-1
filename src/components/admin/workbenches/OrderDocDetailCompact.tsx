// 📋 订单单证详情页 - 台湾大厂风格
// Taiwan Enterprise Professional Style

import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Package, DollarSign, Ship, AlertTriangle, FileText, 
  Upload, Download, Eye, CheckCircle2, Clock, XCircle, Zap, 
  MessageSquare, CheckSquare, Bell, FileCheck, User, MapPin,
  FileSignature, Truck, Plane, Link2, BarChart3, Filter, Search,
  ChevronDown, ChevronRight, Paperclip, History, Send, Save,
  Printer, RefreshCw, TrendingUp, Info, AlertCircle, Circle,
  MinusCircle, Flag, Edit, MoreHorizontal, ExternalLink, Star,
  Home, Clipboard, FileSpreadsheet, Building
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';

interface OrderDocDetailCompactProps {
  orderId: string;
  onBack: () => void;
}

// 单证状态
type DocStatus = 'pending' | 'auto_generated' | 'uploaded' | 'reviewing' | 'approved' | 'rejected' | 'na' | 'overdue' | 'blocked';

// 业务阶段
type BusinessPhase = 'contract' | 'procurement' | 'shipment' | 'customs' | 'collection' | 'tax_refund';

// 单证分类
type DocCategory = 'tax' | 'trade' | 'customs' | 'logistics' | 'finance';

// 单证定义
interface DocDef {
  id: string;
  name: string;
  nameEn: string;
  category: DocCategory;
  phase: BusinessPhase;
  required: boolean;
  responsible: string;
  generationType: 'auto' | 'external' | 'manual';
  dependencies: string[];
  icon: any;
}

// 单证实例
interface DocInstance {
  docId: string;
  status: DocStatus;
  urgency?: 'critical' | 'high' | 'medium' | 'low' | 'none';
  version: number;
  files: any[];
  deadline: string;
  daysRemaining: number;
  blockedBy?: string[];
  note?: string;
  uploadDate?: string;
  uploadBy?: string;
  reviewer?: string;
  approveDate?: string;
  qualityScore?: number;
}

// 13种单证定义
const DOCS: DocDef[] = [
  { id: 'D01', name: '出口退税申报表', nameEn: 'Tax Refund Declaration', category: 'tax', phase: 'tax_refund', required: true, responsible: '单证员+财务', generationType: 'auto', dependencies: ['D05','D11','D12','D13'], icon: FileText },
  { id: 'D02', name: '购销合同/发票/付款凭证', nameEn: 'Sales Contract', category: 'trade', phase: 'contract', required: true, responsible: '业务员', generationType: 'auto', dependencies: [], icon: FileSignature },
  { id: 'D03', name: '国内运输单据及运费凭证', nameEn: 'Domestic Transport', category: 'logistics', phase: 'shipment', required: false, responsible: '物流部', generationType: 'external', dependencies: [], icon: Truck },
  { id: 'D04', name: '国内运费免责声明', nameEn: 'Domestic Freight Waiver', category: 'logistics', phase: 'contract', required: false, responsible: '系统', generationType: 'auto', dependencies: ['D02'], icon: XCircle },
  { id: 'D05', name: '报关单/装箱单/提运单', nameEn: 'Customs Declaration/B/L', category: 'customs', phase: 'customs', required: true, responsible: '报关行', generationType: 'external', dependencies: ['D02'], icon: FileCheck },
  { id: 'D06', name: '委托报关合同及费用凭证', nameEn: 'Customs Brokerage', category: 'customs', phase: 'customs', required: false, responsible: '报关行+财务', generationType: 'external', dependencies: ['D05'], icon: FileSignature },
  { id: 'D07', name: '采购发票及付款凭证', nameEn: 'Purchase Invoice', category: 'trade', phase: 'procurement', required: true, responsible: '采购+财务', generationType: 'auto', dependencies: ['D02'], icon: FileText },
  { id: 'D08', name: '报关费用免责声明', nameEn: 'Customs Fee Waiver', category: 'customs', phase: 'customs', required: false, responsible: '系统', generationType: 'auto', dependencies: ['D02'], icon: XCircle },
  { id: 'D09', name: '国际运费发票及付款凭证', nameEn: 'Intl Freight Invoice', category: 'logistics', phase: 'shipment', required: false, responsible: '货代+财务', generationType: 'external', dependencies: ['D05'], icon: Plane },
  { id: 'D10', name: '国际运费免责声明', nameEn: 'Intl Freight Waiver', category: 'logistics', phase: 'contract', required: false, responsible: '系统', generationType: 'auto', dependencies: ['D02'], icon: XCircle },
  { id: 'D11', name: '收汇水单', nameEn: 'FX Receipt', category: 'finance', phase: 'collection', required: true, responsible: '财务部', generationType: 'external', dependencies: ['D02','D05'], icon: DollarSign },
  { id: 'D12', name: '结汇水单', nameEn: 'FX Settlement', category: 'finance', phase: 'collection', required: true, responsible: '财务部', generationType: 'external', dependencies: ['D11'], icon: DollarSign },
  { id: 'D13', name: '出口退税收汇凭证表', nameEn: 'Tax Refund FX Cert', category: 'tax', phase: 'tax_refund', required: true, responsible: '单证员+财务', generationType: 'auto', dependencies: ['D12'], icon: FileCheck },
];

// 业务阶段
const PHASES = [
  { id: 'contract', name: '合同阶段', icon: FileSignature, color: 'blue' },
  { id: 'procurement', name: '采购阶段', icon: Package, color: 'purple' },
  { id: 'shipment', name: '出货阶段', icon: Truck, color: 'green' },
  { id: 'customs', name: '报关阶段', icon: FileCheck, color: 'indigo' },
  { id: 'collection', name: '收汇阶段', icon: DollarSign, color: 'yellow' },
  { id: 'tax_refund', name: '退税阶段', icon: TrendingUp, color: 'red' },
];

// 分类配置
const CATS = {
  tax: { label: '税', color: 'bg-red-500', textColor: 'text-red-700' },
  trade: { label: '贸', color: 'bg-blue-500', textColor: 'text-blue-700' },
  customs: { label: '关', color: 'bg-purple-500', textColor: 'text-purple-700' },
  logistics: { label: '运', color: 'bg-green-500', textColor: 'text-green-700' },
  finance: { label: '财', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
};

// 状态配置
const STATUS = {
  pending: { label: '待处理', color: 'bg-gray-400', icon: Clock },
  auto_generated: { label: '自动生成', color: 'bg-blue-500', icon: Zap },
  uploaded: { label: '已上传', color: 'bg-cyan-500', icon: Upload },
  reviewing: { label: '审核中', color: 'bg-yellow-500', icon: Eye },
  approved: { label: '已批准', color: 'bg-green-600', icon: CheckCircle2 },
  rejected: { label: '已驳回', color: 'bg-red-600', icon: XCircle },
  overdue: { label: '超期', color: 'bg-red-700', icon: AlertTriangle },
  blocked: { label: '阻塞', color: 'bg-orange-600', icon: MinusCircle },
  na: { label: 'N/A', color: 'bg-gray-300', icon: Circle },
};

// Mock数据
const mockData = {
  orderId: 'SO-NA-20251210-001',
  contractNo: 'SC-NA-20251201-001',
  customer: { name: 'Home Depot Inc.', code: 'HD-001', country: 'USA', region: 'North America' },
  salesRep: '张伟',
  salesTeam: '北美业务一组',
  currentPhase: 'contract' as BusinessPhase,
  incoterm: 'FOB',
  paymentTerm: 'T/T 30% Deposit, 70% Before Shipment',
  currency: 'USD',
  totalValue: 125000,
  collectionProgress: 30,
  contractDate: '2025-12-01',
  shipmentDate: '2025-12-15',
  customsDate: '2025-12-14',
  etd: '2025-12-16',
  eta: '2026-01-05',
  originPort: 'Xiamen',
  destPort: 'Los Angeles',
  container: '40HQ x 2',
  completionRate: 46,
  requiredDocs: 11,
  completedDocs: 5,
  overdueDocs: 2,
  blockedDocs: 2,
  
  documents: {
    D01: { docId: 'D01', status: 'blocked' as DocStatus, urgency: 'high' as const, version: 0, files: [], deadline: '2026-01-14', daysRemaining: 33, blockedBy: ['D05','D11','D12','D13'] },
    D02: { docId: 'D02', status: 'approved' as DocStatus, urgency: 'none' as const, uploadDate: '2025-12-01', uploadBy: '张伟', reviewer: '财务部-李明', approveDate: '2025-12-01', version: 2, files: [{fileId:'F001',fileName:'SC-NA-20251201-001.pdf',fileSize:'1.8MB'}], deadline: '2025-12-01', daysRemaining: 0, qualityScore: 98 },
    D03: { docId: 'D03', status: 'uploaded' as DocStatus, urgency: 'medium' as const, uploadDate: '2025-12-16', uploadBy: '物流部-王芳', version: 1, files: [{fileId:'F003',fileName:'国内运输单据.pdf',fileSize:'850KB'}], deadline: '2025-12-22', daysRemaining: 3 },
    D04: { docId: 'D04', status: 'auto_generated' as DocStatus, urgency: 'none' as const, version: 1, files: [{fileId:'F004',fileName:'国内运费免责声明.pdf',fileSize:'120KB'}], deadline: '2025-12-01', daysRemaining: 0 },
    D05: { docId: 'D05', status: 'overdue' as DocStatus, urgency: 'critical' as const, version: 0, files: [], deadline: '2025-12-17', daysRemaining: -2, note: '已超期2天，严重影响退税！' },
    D06: { docId: 'D06', status: 'uploaded' as DocStatus, urgency: 'medium' as const, uploadDate: '2025-12-15', uploadBy: '厦门报关行', version: 1, files: [{fileId:'F006',fileName:'报关委托合同.pdf',fileSize:'650KB'}], deadline: '2025-12-21', daysRemaining: 2 },
    D07: { docId: 'D07', status: 'approved' as DocStatus, urgency: 'none' as const, uploadDate: '2025-12-05', uploadBy: '采购部-赵强', reviewer: '财务部-李明', approveDate: '2025-12-08', version: 1, files: [{fileId:'F007',fileName:'采购发票.pdf',fileSize:'1.2MB'}], deadline: '2025-12-20', daysRemaining: 1, qualityScore: 95 },
    D08: { docId: 'D08', status: 'na' as DocStatus, urgency: 'none' as const, version: 0, files: [], deadline: '', daysRemaining: 0, note: 'FOB条款，报关费用由买方承担' },
    D09: { docId: 'D09', status: 'reviewing' as DocStatus, urgency: 'medium' as const, uploadDate: '2025-12-17', uploadBy: '中远海运', reviewer: '财务部-李明', version: 1, files: [{fileId:'F009',fileName:'国际运费发票.pdf',fileSize:'920KB'}], deadline: '2025-12-31', daysRemaining: 12 },
    D10: { docId: 'D10', status: 'auto_generated' as DocStatus, urgency: 'none' as const, version: 1, files: [{fileId:'F010',fileName:'国际运费免责声明.pdf',fileSize:'115KB'}], deadline: '2025-12-01', daysRemaining: 0 },
    D11: { docId: 'D11', status: 'pending' as DocStatus, urgency: 'high' as const, version: 0, files: [], deadline: '2026-03-15', daysRemaining: 93, note: '等待客户付款（尾款70%）' },
    D12: { docId: 'D12', status: 'blocked' as DocStatus, urgency: 'medium' as const, version: 0, files: [], deadline: '2026-03-20', daysRemaining: 98, blockedBy: ['D11'] },
    D13: { docId: 'D13', status: 'blocked' as DocStatus, urgency: 'medium' as const, version: 0, files: [], deadline: '2026-03-25', daysRemaining: 103, blockedBy: ['D12'] },
  }
};

export function OrderDocDetailCompact({ orderId, onBack }: OrderDocDetailCompactProps) {
  const [selectedPhase, setSelectedPhase] = useState<BusinessPhase | 'all'>('all');
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  
  const order = { ...mockData, orderId };
  
  // 按阶段分组
  const docsByPhase = useMemo(() => {
    const groups: Record<BusinessPhase, DocDef[]> = {
      contract: [], procurement: [], shipment: [], customs: [], collection: [], tax_refund: []
    };
    DOCS.forEach(def => groups[def.phase].push(def));
    return groups;
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      
      {/* ========== 顶部深色导航栏 ========== */}
      <div className="bg-slate-800 px-4 py-3 flex items-center justify-between shadow-lg" style={{ fontSize: '14px' }}>
        {/* 左：返回按钮 */}
        <Button 
          variant="ghost" 
          onClick={onBack} 
          className="h-9 px-3 text-white hover:bg-slate-700"
          style={{ fontSize: '14px' }}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          返回
        </Button>
        
        {/* 中：订单信息 */}
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-orange-400" />
          <span className="text-white font-bold" style={{ fontSize: '16px' }}>{order.orderId}</span>
          <Badge 
            className="px-3 py-1 font-bold" 
            style={{ background: '#F96302', color: 'white', fontSize: '14px' }}
          >
            {order.completionRate}% 完成
          </Badge>
          <span className="text-white" style={{ fontSize: '14px' }}>{order.customer.name}</span>
          <span className="text-slate-400" style={{ fontSize: '14px' }}>·</span>
          <span className="text-slate-300" style={{ fontSize: '14px' }}>{order.salesRep}</span>
        </div>
        
        {/* 右：操作按钮 */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-9 px-3 text-white hover:bg-slate-700" style={{ fontSize: '14px' }}>
            <Printer className="h-4 w-4 mr-1.5" />
            打印
          </Button>
          <Button variant="ghost" size="sm" className="h-9 px-3 text-white hover:bg-slate-700" style={{ fontSize: '14px' }}>
            <Download className="h-4 w-4 mr-1.5" />
            导出
          </Button>
          <Button 
            size="sm" 
            className="h-9 px-4 text-white font-semibold" 
            style={{ background: '#F96302', fontSize: '14px' }}
          >
            <Save className="h-4 w-4 mr-1.5" />
            保存
          </Button>
        </div>
      </div>

      {/* ========== 白色指标栏 ========== */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          
          {/* 左：进度条 + 关键指标 */}
          <div className="flex items-center gap-6">
            {/* 进度条 */}
            <div className="flex items-center gap-3">
              <div className="relative w-24 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 rounded-full transition-all" 
                  style={{ 
                    width: `${order.completionRate}%`, 
                    background: 'linear-gradient(to right, #F96302, #ff8534)' 
                  }}
                ></div>
              </div>
              <span className="font-bold" style={{ color: '#F96302', fontSize: '14px' }}>
                {order.completionRate}%
              </span>
            </div>
            
            {/* 已完成 */}
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div style={{ fontSize: '12px' }}>
                <span className="text-gray-600">已完成</span>
                <span className="ml-1.5 font-bold text-green-600">{order.completedDocs}/{order.requiredDocs}</span>
              </div>
            </div>
            
            {/* 超期 */}
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div style={{ fontSize: '12px' }}>
                <span className="text-gray-600">超期</span>
                <span className="ml-1.5 font-bold text-red-600">{order.overdueDocs}</span>
              </div>
            </div>
            
            {/* 阻塞 */}
            <div className="flex items-center gap-2">
              <MinusCircle className="h-5 w-5 text-orange-600" />
              <div style={{ fontSize: '12px' }}>
                <span className="text-gray-600">阻塞</span>
                <span className="ml-1.5 font-bold text-orange-600">{order.blockedDocs}</span>
              </div>
            </div>
            
            {/* 关键风险标记 */}
            {order.overdueDocs > 0 && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-300 rounded-lg px-3 py-1.5 ml-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="font-bold text-red-700" style={{ fontSize: '12px' }}>
                  D05报关关超期2天
                </span>
              </div>
            )}
          </div>
          
          {/* 右：快捷入口 */}
          <div className="flex items-center gap-1">
            <button className="flex flex-col items-center justify-center w-12 h-12 rounded hover:bg-gray-100 transition-colors">
              <MessageSquare className="h-5 w-5 text-gray-600" />
              <span className="text-gray-600" style={{ fontSize: '10px' }}>咨询</span>
            </button>
            <button className="flex flex-col items-center justify-center w-12 h-12 rounded hover:bg-gray-100 transition-colors">
              <Clipboard className="h-5 w-5 text-gray-600" />
              <span className="text-gray-600" style={{ fontSize: '10px' }}>采购</span>
            </button>
            <button className="flex flex-col items-center justify-center w-12 h-12 rounded hover:bg-gray-100 transition-colors">
              <DollarSign className="h-5 w-5 text-gray-600" />
              <span className="text-gray-600" style={{ fontSize: '10px' }}>出资</span>
            </button>
            <button className="flex flex-col items-center justify-center w-12 h-12 rounded hover:bg-gray-100 transition-colors">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="text-blue-600" style={{ fontSize: '10px' }}>原文</span>
            </button>
            <button className="flex flex-col items-center justify-center w-12 h-12 rounded hover:bg-gray-100 transition-colors">
              <Star className="h-5 w-5 text-yellow-500 fill-current" />
              <span className="text-gray-600" style={{ fontSize: '10px' }}>收藏</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========== 主内容区域 ========== */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-12 gap-4 p-4">
          
          {/* ========== 中栏：单证列表（80%） ========== */}
          <div className="col-span-9 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                
                {/* 按阶段分组 */}
                {PHASES.map(phase => {
                  const phaseDocs = docsByPhase[phase.id as BusinessPhase];
                  const PhaseIcon = phase.icon;
                  
                  // 过滤阶段
                  if (selectedPhase !== 'all' && selectedPhase !== phase.id) return null;
                  
                  // 统计
                  const phaseStats = phaseDocs.reduce((acc, def) => {
                    const inst = order.documents[def.id as keyof typeof order.documents];
                    if (!inst) return acc;
                    if (inst.status === 'approved' || inst.status === 'auto_generated') acc.completed++;
                    acc.total++;
                    return acc;
                  }, { completed: 0, total: 0 });
                  
                  return (
                    <div key={phase.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                      
                      {/* 阶段标题 */}
                      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <PhaseIcon className="h-4 w-4 text-gray-700" />
                          <span className="font-bold text-gray-900" style={{ fontSize: '13px' }}>
                            {phase.name}
                          </span>
                        </div>
                        <span className="text-gray-600" style={{ fontSize: '12px' }}>
                          完成 {phaseStats.completed}/{phaseStats.total}
                        </span>
                      </div>
                      
                      {/* 单证卡片 - 2列网格 */}
                      <div className="grid grid-cols-2 gap-3 p-3">
                        {phaseDocs.map(def => {
                          const inst = order.documents[def.id as keyof typeof order.documents];
                          if (!inst) return null;
                          
                          const Icon = def.icon;
                          const cfg = CATS[def.category];
                          const statusCfg = STATUS[inst.status];
                          const StatusIcon = statusCfg.icon;
                          
                          // 卡片背景色
                          let bgColor = 'bg-white';
                          let borderColor = 'border-gray-200';
                          if (inst.status === 'approved') {
                            bgColor = 'bg-green-50';
                            borderColor = 'border-green-200';
                          } else if (inst.status === 'auto_generated') {
                            bgColor = 'bg-blue-50';
                            borderColor = 'border-blue-200';
                          } else if (inst.status === 'overdue') {
                            bgColor = 'bg-red-50';
                            borderColor = 'border-red-300';
                          }
                          
                          return (
                            <div
                              key={def.id}
                              className={`${bgColor} border ${borderColor} rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                                selectedDoc === def.id ? 'ring-2 ring-orange-500' : ''
                              }`}
                              onClick={() => setSelectedDoc(def.id)}
                            >
                              {/* 顶部：编号+名称+分类 */}
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span 
                                      className="font-bold text-white px-2 py-0.5 rounded" 
                                      style={{ background: '#3B82F6', fontSize: '12px' }}
                                    >
                                      {def.id}
                                    </span>
                                  </div>
                                  <div className="font-semibold text-gray-900" style={{ fontSize: '14px', lineHeight: '1.3' }}>
                                    {def.name}
                                  </div>
                                </div>
                                <span 
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded text-white font-bold flex-shrink-0 ml-2 ${cfg.color}`} 
                                  style={{ fontSize: '12px' }}
                                >
                                  {cfg.label}
                                </span>
                              </div>
                              
                              {/* 状态 */}
                              <div className="mb-2">
                                <Badge 
                                  className={`${statusCfg.color} text-white px-2 py-0.5 flex items-center gap-1 w-fit`} 
                                  style={{ fontSize: '12px' }}
                                >
                                  <StatusIcon className="h-3 w-3" />
                                  {statusCfg.label}
                                </Badge>
                              </div>
                              
                              {/* 文件信息 */}
                              <div className="mb-2 flex items-center gap-1.5" style={{ fontSize: '12px' }}>
                                <Paperclip className="h-3 w-3 text-gray-500" />
                                {inst.files?.length > 0 ? (
                                  <span className="text-gray-700">
                                    {inst.files.length} 个文件 · v{inst.version}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">暂无文件</span>
                                )}
                              </div>
                              
                              {/* 负责人 */}
                              <div className="mb-2 flex items-center gap-1.5 text-gray-600" style={{ fontSize: '12px' }}>
                                <User className="h-3 w-3" />
                                {def.responsible}
                              </div>
                              
                              {/* 截止日期 */}
                              {inst.deadline && (
                                <div 
                                  className={`mb-2 flex items-center gap-1.5 ${
                                    inst.daysRemaining < 0 ? 'text-red-700 font-bold' :
                                    inst.daysRemaining <= 3 ? 'text-orange-600' :
                                    'text-gray-600'
                                  }`} 
                                  style={{ fontSize: '12px' }}
                                >
                                  <Clock className="h-3 w-3" />
                                  截止: {inst.deadline}
                                </div>
                              )}
                              
                              {/* 操作按钮 */}
                              <div className="flex items-center gap-1.5 pt-2 border-t border-gray-200">
                                <Button 
                                  variant="outline" 
                                  className="flex-1 h-7 px-2"
                                  style={{ fontSize: '12px' }}
                                  onClick={(e) => { e.stopPropagation(); }}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  查看
                                </Button>
                                <Button 
                                  variant="outline" 
                                  className="flex-1 h-7 px-2"
                                  style={{ fontSize: '12px' }}
                                  onClick={(e) => { e.stopPropagation(); }}
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  下载
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* ========== 右栏：关键风险+待办任务（20%） ========== */}
          <div className="col-span-3 space-y-3 overflow-y-auto">
            
            {/* 关键风险 */}
            <div className="bg-white rounded-lg border-2 border-red-300 shadow-sm overflow-hidden">
              <div className="bg-red-50 border-b border-red-300 px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="font-bold text-red-900" style={{ fontSize: '13px' }}>关键风险</span>
                </div>
                <Badge className="bg-red-600 text-white px-2 py-0.5" style={{ fontSize: '11px' }}>
                  {order.overdueDocs}
                </Badge>
              </div>
              <div className="p-3 space-y-2">
                <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
                  <div className="font-semibold text-red-900 mb-1" style={{ fontSize: '14px' }}>
                    D05报关单超期2天
                  </div>
                  <div className="text-red-600 mb-2" style={{ fontSize: '12px' }}>
                    截止日期: 2025-12-17
                  </div>
                  <Button 
                    className="w-full h-7 bg-red-600 text-white hover:bg-red-700"
                    style={{ fontSize: '12px' }}
                    onClick={() => setSelectedDoc('D05')}
                  >
                    立即处理
                  </Button>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2.5">
                  <div className="font-semibold text-yellow-900 mb-1" style={{ fontSize: '14px' }}>
                    D11收汇水单待确认
                  </div>
                  <div className="text-yellow-700" style={{ fontSize: '12px' }}>
                    等待客户付款（尾款70%）
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}