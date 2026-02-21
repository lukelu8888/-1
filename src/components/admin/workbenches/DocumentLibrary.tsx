// 📚 文档库 - Document Library
// 以文档类型为维度的集中管理和检索中心

import React, { useState, useMemo } from 'react';
import { 
  FolderOpen, Search, Filter, Download, Archive, Calendar,
  FileText, Package, TrendingUp, BarChart3, Eye, Star,
  ChevronRight, ChevronDown, File, Folder, User, Clock,
  CheckCircle2, AlertTriangle, XCircle, Upload, Send,
  Grid3X3, List, Globe, DollarSign, Award, Target,
  Settings, RefreshCw, Printer, Share2, Trash2, Edit,
  FileCheck, Ship, Users, Table, Layers, BookOpen, FileStack
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { DocumentMatrixView } from './DocumentMatrixView';

interface DocumentLibraryProps {
  onBack: () => void;
}

// 单证类型定义（与业务流程对应）
const DOCUMENT_TYPES = [
  { 
    id: 'D02', 
    code: 'D02',
    name: '销售合同/发票', 
    stage: '合同阶段',
    color: '#3B82F6',
    icon: FileText,
    count: 458, 
    totalSize: '1.2GB',
    avgSize: '2.6MB',
    approvedRate: 92,
    description: '与客户签订的销售合同及相关发票'
  },
  { 
    id: 'D07', 
    code: 'D07',
    name: '采购发票凭证', 
    stage: '合同阶段',
    color: '#3B82F6',
    icon: FileText,
    count: 445, 
    totalSize: '1.1GB',
    avgSize: '2.5MB',
    approvedRate: 89,
    description: '供应商采购发票及付款凭证'
  },
  { 
    id: 'D03', 
    code: 'D03',
    name: '国内运输单据', 
    stage: '国内运输',
    color: '#8B5CF6',
    icon: Package,
    count: 156, 
    totalSize: '420MB',
    avgSize: '2.7MB',
    approvedRate: 95,
    description: '国内物流运输单据及签收凭证'
  },
  { 
    id: 'D04', 
    code: 'D04',
    name: '国内运费免责', 
    stage: '国内运输',
    color: '#8B5CF6',
    icon: FileCheck,
    count: 342, 
    totalSize: '52MB',
    avgSize: '152KB',
    approvedRate: 98,
    description: '国内运输费用免责声明'
  },
  { 
    id: 'D05', 
    code: 'D05',
    name: '报关单/提运单', 
    stage: '报关出口',
    color: '#F59E0B',
    icon: Ship,
    count: 432, 
    totalSize: '1.8GB',
    avgSize: '4.2MB',
    approvedRate: 85,
    description: '海关报关单及货物提运单据'
  },
  { 
    id: 'D06', 
    code: 'D06',
    name: '报关合同费用', 
    stage: '报关出口',
    color: '#F59E0B',
    icon: DollarSign,
    count: 398, 
    totalSize: '680MB',
    avgSize: '1.7MB',
    approvedRate: 91,
    description: '报关代理合同及费用清单'
  },
  { 
    id: 'D08', 
    code: 'D08',
    name: '报关费用免责', 
    stage: '报关出口',
    color: '#F59E0B',
    icon: FileCheck,
    count: 128, 
    totalSize: '18MB',
    avgSize: '140KB',
    approvedRate: 97,
    description: '报关费用免责声明'
  },
  { 
    id: 'D09', 
    code: 'D09',
    name: '国际运费发票', 
    stage: '国际运输',
    color: '#10B981',
    icon: Globe,
    count: 389, 
    totalSize: '245MB',
    avgSize: '630KB',
    approvedRate: 93,
    description: '国际货运代理费用发票'
  },
  { 
    id: 'D10', 
    code: 'D10',
    name: '国际运费免责', 
    stage: '国际运输',
    color: '#10B981',
    icon: FileCheck,
    count: 367, 
    totalSize: '48MB',
    avgSize: '130KB',
    approvedRate: 99,
    description: '国际运输费用免责声明'
  },
  { 
    id: 'D11', 
    code: 'D11',
    name: '收汇水单', 
    stage: '收汇结汇',
    color: '#EC4899',
    icon: DollarSign,
    count: 412, 
    totalSize: '520MB',
    avgSize: '1.3MB',
    approvedRate: 88,
    description: '银行外汇收款水单'
  },
  { 
    id: 'D12', 
    code: 'D12',
    name: '结汇水单', 
    stage: '收汇结汇',
    color: '#EC4899',
    icon: DollarSign,
    count: 405, 
    totalSize: '485MB',
    avgSize: '1.2MB',
    approvedRate: 90,
    description: '银行外汇结算水单'
  },
  { 
    id: 'D01', 
    code: 'D01',
    name: '退税申报表', 
    stage: '退税阶段',
    color: '#EF4444',
    icon: Award,
    count: 245, 
    totalSize: '285MB',
    avgSize: '1.2MB',
    approvedRate: 82,
    description: '出口退税申报表及相关材料'
  },
  { 
    id: 'D13', 
    code: 'D13',
    name: '退税收汇凭证', 
    stage: '退税阶段',
    color: '#EF4444',
    icon: FileCheck,
    count: 389, 
    totalSize: '420MB',
    avgSize: '1.1MB',
    approvedRate: 86,
    description: '退税所需的收汇凭证材料'
  },
];

// 文档模板
const DOCUMENT_TEMPLATES = [
  { id: 'T01', name: '销售合同模板（中英文）', type: 'D02', format: 'DOCX', size: '85KB', downloads: 342 },
  { id: 'T02', name: '商业发票模板', type: 'D02', format: 'XLSX', size: '45KB', downloads: 458 },
  { id: 'T03', name: '装箱单模板', type: 'D05', format: 'XLSX', size: '38KB', downloads: 289 },
  { id: 'T04', name: '报关委托书模板', type: 'D05', format: 'PDF', size: '120KB', downloads: 567 },
  { id: 'T05', name: '费用免责声明模板', type: 'D04', format: 'DOCX', size: '32KB', downloads: 234 },
  { id: 'T06', name: '出口退税申报表模板', type: 'D01', format: 'XLSX', size: '156KB', downloads: 678 },
];

// 单证类型统计数据（用于按类型视图）
const DOCUMENT_STATS = [
  { id: 'D01', name: '退税申报表', count: 245, totalSize: '285MB', avgQuality: 88 },
  { id: 'D02', name: '销售合同/发票', count: 458, totalSize: '1.2GB', avgQuality: 92 },
  { id: 'D03', name: '国内运输单据', count: 156, totalSize: '420MB', avgQuality: 85 },
  { id: 'D04', name: '国内运费免责', count: 342, totalSize: '52MB', avgQuality: 96 },
  { id: 'D05', name: '报关单/提运单', count: 432, totalSize: '1.8GB', avgQuality: 89 },
  { id: 'D06', name: '报关合同费用', count: 398, totalSize: '680MB', avgQuality: 91 },
  { id: 'D07', name: '采购发票凭证', count: 445, totalSize: '1.1GB', avgQuality: 90 },
  { id: 'D08', name: '报关费用免责', count: 128, totalSize: '18MB', avgQuality: 97 },
  { id: 'D09', name: '国际运费发票', count: 389, totalSize: '245MB', avgQuality: 93 },
  { id: 'D10', name: '国际运费免责', count: 367, totalSize: '48MB', avgQuality: 98 },
  { id: 'D11', name: '收汇水单', count: 412, totalSize: '520MB', avgQuality: 87 },
  { id: 'D12', name: '结汇水单', count: 405, totalSize: '485MB', avgQuality: 88 },
  { id: 'D13', name: '退税收汇凭证', count: 389, totalSize: '420MB', avgQuality: 86 },
];

// 模拟订单归档数据
const ARCHIVED_ORDERS = [
  {
    orderId: 'SO-NA-20251201-001',
    contractNo: 'SC-NA-20251201-001',
    customer: 'Home Depot Inc.',
    region: 'North America',
    totalValue: 125000,
    currency: 'USD',
    totalDocs: 13,
    completedDocs: 13,
    shipmentDate: '2025-12-15',
    taxRefundDate: '2025-12-20',
    status: 'approved' as const,
    documents: [
      { docId: 'D01', fileName: 'Tax_Refund_001.pdf', size: '1.2MB', uploadDate: '2025-12-20', quality: 95 },
      { docId: 'D02', fileName: 'SC-NA-20251201-001.pdf', size: '2.1MB', uploadDate: '2025-12-01', quality: 98 },
      { docId: 'D03', fileName: 'Domestic_Transport_001.pdf', size: '1.5MB', uploadDate: '2025-12-10', quality: 92 },
      { docId: 'D04', fileName: 'Domestic_Waiver_001.pdf', size: '450KB', uploadDate: '2025-12-10', quality: 100 },
      { docId: 'D05', fileName: 'Customs_Declaration_001.pdf', size: '2.8MB', uploadDate: '2025-12-15', quality: 89 },
      { docId: 'D06', fileName: 'Customs_Contract_001.pdf', size: '1.2MB', uploadDate: '2025-12-15', quality: 93 },
      { docId: 'D07', fileName: 'Purchase_Invoice_001.pdf', size: '2.1MB', uploadDate: '2025-12-06', quality: 96 },
      { docId: 'D08', fileName: 'Customs_Waiver_001.pdf', size: '380KB', uploadDate: '2025-12-15', quality: 100 },
      { docId: 'D09', fileName: 'Intl_Freight_001.pdf', size: '890KB', uploadDate: '2025-12-18', quality: 91 },
      { docId: 'D10', fileName: 'Intl_Waiver_001.pdf', size: '320KB', uploadDate: '2025-12-18', quality: 100 },
      { docId: 'D11', fileName: 'FX_Receipt_001.jpg', size: '890KB', uploadDate: '2025-12-28', quality: 85 },
      { docId: 'D12', fileName: 'FX_Settlement_001.jpg', size: '750KB', uploadDate: '2026-01-02', quality: 87 },
      { docId: 'D13', fileName: 'Tax_FX_Certificate_001.pdf', size: '650KB', uploadDate: '2026-01-05', quality: 92 },
    ]
  },
  {
    orderId: 'SO-NA-20251210-005',
    contractNo: 'SC-NA-20251210-005',
    customer: 'Lowe\'s Inc.',
    region: 'North America',
    totalValue: 89500,
    currency: 'USD',
    totalDocs: 13,
    completedDocs: 8,
    shipmentDate: '2025-12-18',
    status: 'pending' as const,
    documents: [
      { docId: 'D02', fileName: 'SC-NA-20251210-005.pdf', size: '2.2MB', uploadDate: '2025-12-10', quality: 90 },
      { docId: 'D03', fileName: 'Domestic_Transport_005.pdf', size: '1.6MB', uploadDate: '2025-12-12', quality: 88 },
      { docId: 'D05', fileName: 'Customs_Declaration_005.pdf', size: '2.5MB', uploadDate: '2025-12-18', quality: 85 },
      { docId: 'D06', fileName: 'Customs_Contract_005.pdf', size: '1.3MB', uploadDate: '2025-12-18', quality: 91 },
      { docId: 'D07', fileName: 'Purchase_Invoice_005.pdf', size: '1.9MB', uploadDate: '2025-12-12', quality: 93 },
      { docId: 'D08', fileName: 'Customs_Waiver_005.pdf', size: '420KB', uploadDate: '2025-12-18', quality: 100 },
      { docId: 'D09', fileName: 'Intl_Freight_005.pdf', size: '780KB', uploadDate: '2025-12-20', quality: 89 },
      { docId: 'D10', fileName: 'Intl_Waiver_005.pdf', size: '290KB', uploadDate: '2025-12-20', quality: 100 },
    ],
    missingDocs: ['D01', 'D04', 'D11', 'D12', 'D13']
  },
  {
    orderId: 'SO-EU-20251120-007',
    contractNo: 'SC-EU-20251120-007',
    customer: 'Decathlon SA',
    region: 'Europe',
    totalValue: 56000,
    currency: 'EUR',
    totalDocs: 13,
    completedDocs: 6,
    shipmentDate: '2025-11-28',
    status: 'rejected' as const,
    documents: [
      { docId: 'D02', fileName: 'SC-EU-20251120-007.pdf', size: '1.8MB', uploadDate: '2025-11-20', quality: 95 },
      { docId: 'D03', fileName: 'Domestic_Transport_007.pdf', size: '1.4MB', uploadDate: '2025-11-25', quality: 86 },
      { docId: 'D05', fileName: 'Customs_Declaration_007.pdf', size: '2.3MB', uploadDate: '2025-11-28', quality: 65 },
      { docId: 'D06', fileName: 'Customs_Contract_007.pdf', size: '1.1MB', uploadDate: '2025-11-28', quality: 88 },
      { docId: 'D07', fileName: 'Purchase_Invoice_007.pdf', size: '2.0MB', uploadDate: '2025-11-22', quality: 72 },
      { docId: 'D11', fileName: 'FX_Receipt_007.jpg', size: '650KB', uploadDate: '2025-12-05', quality: 68 },
    ],
    missingDocs: ['D01', 'D04', 'D08', 'D09', 'D10', 'D12', 'D13']
  },
  {
    orderId: 'SO-SA-20251115-003',
    contractNo: 'SC-SA-20251115-003',
    customer: 'Construtora Brasil Ltda',
    region: 'South America',
    totalValue: 76500,
    currency: 'USD',
    totalDocs: 13,
    completedDocs: 11,
    shipmentDate: '2025-11-25',
    status: 'approved' as const,
    documents: [
      { docId: 'D01', fileName: 'Tax_Refund_003.pdf', size: '1.1MB', uploadDate: '2025-12-08', quality: 91 },
      { docId: 'D02', fileName: 'SC-SA-20251115-003.pdf', size: '2.3MB', uploadDate: '2025-11-15', quality: 94 },
      { docId: 'D03', fileName: 'Domestic_Transport_003.pdf', size: '1.7MB', uploadDate: '2025-11-20', quality: 90 },
      { docId: 'D04', fileName: 'Domestic_Waiver_003.pdf', size: '380KB', uploadDate: '2025-11-20', quality: 100 },
      { docId: 'D05', fileName: 'Customs_Declaration_003.pdf', size: '2.9MB', uploadDate: '2025-11-25', quality: 87 },
      { docId: 'D06', fileName: 'Customs_Contract_003.pdf', size: '1.4MB', uploadDate: '2025-11-25', quality: 92 },
      { docId: 'D07', fileName: 'Purchase_Invoice_003.pdf', size: '2.2MB', uploadDate: '2025-11-18', quality: 95 },
      { docId: 'D08', fileName: 'Customs_Waiver_003.pdf', size: '350KB', uploadDate: '2025-11-25', quality: 100 },
      { docId: 'D09', fileName: 'Intl_Freight_003.pdf', size: '820KB', uploadDate: '2025-11-28', quality: 93 },
      { docId: 'D11', fileName: 'FX_Receipt_003.jpg', size: '950KB', uploadDate: '2025-12-12', quality: 89 },
      { docId: 'D13', fileName: 'Tax_FX_Certificate_003.pdf', size: '680KB', uploadDate: '2025-12-15', quality: 91 },
    ],
    missingDocs: ['D10', 'D12']
  },
];

export function DocumentLibrary({ onBack }: DocumentLibraryProps) {
  const [activeTab, setActiveTab] = useState<'by_order' | 'by_type'>('by_order');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('2025');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all'); // 🔥 三状态筛选
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);

  // 统计数据
  const stats = useMemo(() => {
    const totalDocs = DOCUMENT_STATS.reduce((sum, d) => sum + d.count, 0);
    const totalSize = '12.8GB';
    const monthlyNew = 187;
    const avgCompletion = 89;
    const avgProcessing = 5.2;
    const pendingCount = ARCHIVED_ORDERS.filter(o => o.status === 'pending').length;
    const rejectedCount = ARCHIVED_ORDERS.filter(o => o.status === 'rejected').length;
    
    return { totalDocs, totalSize, monthlyNew, avgCompletion, avgProcessing, pendingCount, rejectedCount };
  }, []);

  // 筛选订单
  const filteredOrders = useMemo(() => {
    let orders = ARCHIVED_ORDERS;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      orders = orders.filter(o => 
        o.orderId.toLowerCase().includes(query) ||
        o.contractNo.toLowerCase().includes(query) ||
        o.customer.toLowerCase().includes(query)
      );
    }
    
    if (selectedRegion !== 'all') {
      orders = orders.filter(o => o.region === selectedRegion);
    }
    
    if (selectedStatus !== 'all') {
      orders = orders.filter(o => o.status === selectedStatus);
    }
    
    return orders;
  }, [searchQuery, selectedRegion, selectedStatus]);

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-50 w-full max-w-full overflow-hidden">
      {/* 顶部导航栏 - 固定 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0 shadow-sm w-full max-w-full overflow-hidden">
        <div className="flex items-center justify-between gap-4 min-w-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="h-7 text-xs mr-2 flex-shrink-0"
            >
              ← 返回
            </Button>
            <FolderOpen className="h-5 w-5 flex-shrink-0" style={{ color: '#F96302' }} />
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-gray-900 truncate">文档库 · Document Library</h1>
              <div className="text-xs text-gray-500 truncate">智能归档和检索中心</div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <Button variant="outline" size="sm" className="h-7 text-xs">
              <Upload className="h-3.5 w-3.5 mr-1" />
              批量上传
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              <Download className="h-3.5 w-3.5 mr-1" />
              批量导出
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              <Printer className="h-3.5 w-3.5 mr-1" />
              打印报表
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              <Settings className="h-3.5 w-3.5 mr-1" />
              归档设置
            </Button>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-4 space-y-4 max-w-full">
          {/* 🔥 统一功能区 - 极简设计（合并搜索+筛选+视图切换）*/}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
            <div className="flex items-center gap-2">
              {/* 搜索框 */}
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  placeholder="🔍 搜索订单号、合同号、客户名称..."
                  className="pl-8 h-8 text-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* 年份筛选 */}
              <select 
                className="w-32 border border-gray-300 rounded px-2 py-1.5 text-xs h-8"
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
              >
                <option value="2025">📅 2025年</option>
                <option value="2024">📅 2024年</option>
                <option value="2023">📅 2023年</option>
              </select>
              
              {/* 市场筛选 */}
              <select 
                className="w-32 border border-gray-300 rounded px-2 py-1.5 text-xs h-8"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                <option value="all">🌍 全部市场</option>
                <option value="North America">北美</option>
                <option value="South America">南美</option>
                <option value="Europe">欧非</option>
              </select>
              
              {/* 状态筛选 */}
              <select 
                className="w-32 border border-gray-300 rounded px-2 py-1.5 text-xs h-8"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
              >
                <option value="all">全部状态</option>
                <option value="pending">待审核</option>
                <option value="approved">已通过</option>
                <option value="rejected">已驳回</option>
              </select>
              
              {/* 视图切换 */}
              <div className="flex items-center gap-1 border border-gray-300 rounded px-1 py-0.5">
                <span className="text-[10px] text-gray-500 px-2">📊</span>
                {[
                  { id: 'by_order', label: '订单', icon: Package },
                  { id: 'by_type', label: '单证', icon: FileText },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                      activeTab === tab.id
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon className="h-3 w-3" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 🔥 数据展示区 - 按选定的视图模式显示 */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4">
              {/* 📂 按订单分组视图 */}
              {activeTab === 'by_order' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs text-gray-600">
                      找到 <span className="font-bold text-gray-900">{filteredOrders.length}</span> 个订单
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-6 text-[10px]">
                        <Download className="h-3 w-3 mr-1" />
                        批量下载选中
                      </Button>
                    </div>
                  </div>

                  {filteredOrders.map((order) => {
                    const isExpanded = expandedOrders.includes(order.orderId);
                    
                    return (
                      <div key={order.orderId} className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors">
                        {/* 订单头部 */}
                        <div 
                          className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                            order.status === 'approved' ? 'bg-green-50/30' : 
                            order.status === 'pending' ? 'bg-blue-50/30' : 
                            'bg-red-50/30'
                          }`}
                          onClick={() => toggleOrderExpand(order.orderId)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <button className="text-gray-400 hover:text-gray-600">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                              
                              {order.status === 'approved' ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : order.status === 'pending' ? (
                                <Clock className="h-4 w-4 text-blue-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-xs font-bold text-gray-900">{order.orderId}</span>
                                  <Badge className={`text-[9px] px-1.5 py-0 ${
                                    order.status === 'approved' ? 'bg-green-600 text-white' : 
                                    order.status === 'pending' ? 'bg-blue-600 text-white' :
                                    'bg-red-600 text-white'
                                  }`}>
                                    {order.status === 'approved' ? '✅ 已通过' : 
                                     order.status === 'pending' ? '⏳ 待审核' : 
                                     '❌ 已驳回'}
                                  </Badge>
                                  {order.missingDocs && order.missingDocs.length > 0 && (
                                    <Badge className="bg-yellow-100 text-yellow-800 text-[9px] px-1.5 py-0">
                                      缺{order.missingDocs.length}份
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-gray-600">
                                  <span className="font-medium text-gray-900">{order.customer}</span>
                                  <span>{order.contractNo}</span>
                                  <span>{order.currency} {order.totalValue.toLocaleString()}</span>
                                  <span>出货: {order.shipmentDate}</span>
                                  {order.taxRefundDate && (
                                    <span className="text-green-600">✅ 退税: {order.taxRefundDate}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="text-right mr-3">
                                <div className="text-xs font-bold text-gray-900">{order.completedDocs}/{order.totalDocs} 份</div>
                                <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-0.5">
                                  <div 
                                    className={`h-1.5 rounded-full ${
                                      order.completedDocs === order.totalDocs ? 'bg-green-500' : 'bg-yellow-500'
                                    }`}
                                    style={{ width: `${(order.completedDocs / order.totalDocs) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                              
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-6 text-[10px]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                打包下载
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-6 text-[10px]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                查看
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* 展开的单证列表 */}
                        {isExpanded && (
                          <div className="bg-white border-t border-gray-200 p-3">
                            <div className="space-y-1.5">
                              {order.documents.map((doc, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-blue-50 transition-colors group">
                                  <File className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <Badge className="bg-blue-100 text-blue-800 text-[9px] px-1.5 py-0">
                                        {doc.docId}
                                      </Badge>
                                      <span className="text-xs font-medium text-gray-900 truncate">{doc.fileName}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 text-[10px] text-gray-500">
                                    <span>{doc.size}</span>
                                    <span>{doc.uploadDate}</span>
                                    <div className="flex items-center gap-0.5">
                                      <Award className="h-3 w-3 text-yellow-600" />
                                      <span className="font-semibold text-yellow-700">{doc.quality}分</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                                      <Download className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                                      <Share2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              
                              {order.missingDocs && order.missingDocs.length > 0 && (
                                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                  <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-3.5 w-3.5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-[10px] text-yellow-800">
                                      <span className="font-semibold">缺失单证:</span> {order.missingDocs.join(', ')}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 📋 按单证类型视图 */}
              {activeTab === 'by_type' && (
                <div className="space-y-2">
                  <div className="text-xs text-gray-600 mb-3">
                    共 <span className="font-bold text-gray-900">{DOCUMENT_STATS.length}</span> 种单证类型
                  </div>

                  {DOCUMENT_STATS.map((docType) => (
                    <div key={docType.id} className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-bold text-gray-900">{docType.id}</span>
                              <span className="text-xs font-medium text-gray-800">{docType.name}</span>
                              <Badge className="bg-blue-100 text-blue-800 text-[9px] px-1.5 py-0">
                                {docType.count} 份
                              </Badge>
                              <div className="flex items-center gap-0.5">
                                <Award className="h-3 w-3 text-yellow-600" />
                                <span className="text-[10px] font-semibold text-yellow-700">{docType.avgQuality}分</span>
                              </div>
                            </div>
                            <div className="text-[10px] text-gray-500">
                              总大小: {docType.totalSize}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="h-6 text-[10px]">
                            <Eye className="h-3 w-3 mr-1" />
                            查看全部
                          </Button>
                          <Button variant="outline" size="sm" className="h-6 text-[10px]">
                            <Download className="h-3 w-3 mr-1" />
                            下载
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}