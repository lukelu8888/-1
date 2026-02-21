import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { 
  FileText, Download, Send, Eye, Filter, Calendar,
  Search, Globe, Building2, Package, Ship, FileCheck,
  Clock, CheckCircle2, MailCheck, FolderOpen,
  Archive, Users, X, ChevronDown, ChevronRight,
  Layers, AlertCircle, ExternalLink, MoreVertical
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

// 单证类型
type DocumentType = 'SC' | 'CI' | 'PL' | 'BL';

// 单证状态
type DocumentStatus = 'draft' | 'generated' | 'sent' | 'confirmed' | 'missing';

// 单证信息接口
interface Document {
  id: string;
  documentNumber: string;
  documentType: DocumentType;
  contractNumber: string;
  customerName: string;
  customerEmail: string;
  region: 'NA' | 'EU' | 'SA';
  shipmentDate: string;
  generatedDate: string;
  status: DocumentStatus;
  fileUrl?: string;
  fileSize?: number;
  sentHistory: {
    sentAt: string;
    sentTo: string;
    sentBy: string;
    status: 'success' | 'failed';
  }[];
  metadata?: {
    portOfLoading?: string;
    portOfDischarge?: string;
    vessel?: string;
    containerNo?: string;
    blNumber?: string;
  };
}

// 订单分组接口
interface OrderGroup {
  contractNumber: string;
  salesContract: Document;
  documents: {
    SC?: Document;
    CI?: Document;
    PL?: Document;
    BL?: Document;
  };
  customerName: string;
  customerEmail: string;
  region: 'NA' | 'EU' | 'SA';
  shipmentDate: string;
  totalDocuments: number;
  completedDocuments: number;
  portOfLoading?: string;
  portOfDischarge?: string;
}

interface DocumentCenterProps {
  userRole?: 'admin' | 'finance' | 'customer';
  userEmail?: string;
}

export default function DocumentCenter({ userRole = 'admin', userEmail }: DocumentCenterProps) {
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  // 模拟单证数据
  const mockDocuments: Document[] = [
    // SC-NA-251121-0001 订单（完整）
    {
      id: 'doc-001', documentNumber: 'SC-NA-251121-0001', documentType: 'SC', contractNumber: 'SC-NA-251121-0001',
      customerName: 'ABC Trading Ltd.', customerEmail: 'purchasing@abctrading.com', region: 'NA',
      shipmentDate: '2025-12-25', generatedDate: '2025-11-21', status: 'sent', fileSize: 156,
      sentHistory: [{ sentAt: '2025-11-21 14:30', sentTo: 'purchasing@abctrading.com', sentBy: 'admin', status: 'success' }],
      metadata: { portOfLoading: 'XIAMEN', portOfDischarge: 'LOS ANGELES' }
    },
    {
      id: 'doc-002', documentNumber: 'CI-NA-251220-0001', documentType: 'CI', contractNumber: 'SC-NA-251121-0001',
      customerName: 'ABC Trading Ltd.', customerEmail: 'purchasing@abctrading.com', region: 'NA',
      shipmentDate: '2025-12-25', generatedDate: '2025-12-20', status: 'sent', fileSize: 89,
      sentHistory: [
        { sentAt: '2025-12-20 10:15', sentTo: 'purchasing@abctrading.com', sentBy: 'admin', status: 'success' },
        { sentAt: '2025-12-21 09:30', sentTo: 'purchasing@abctrading.com', sentBy: 'admin', status: 'success' }
      ]
    },
    {
      id: 'doc-003', documentNumber: 'PL-NA-251220-0001', documentType: 'PL', contractNumber: 'SC-NA-251121-0001',
      customerName: 'ABC Trading Ltd.', customerEmail: 'purchasing@abctrading.com', region: 'NA',
      shipmentDate: '2025-12-25', generatedDate: '2025-12-20', status: 'sent', fileSize: 67,
      sentHistory: [{ sentAt: '2025-12-20 10:20', sentTo: 'purchasing@abctrading.com', sentBy: 'admin', status: 'success' }]
    },
    {
      id: 'doc-004', documentNumber: 'MAEU123456789', documentType: 'BL', contractNumber: 'SC-NA-251121-0001',
      customerName: 'ABC Trading Ltd.', customerEmail: 'purchasing@abctrading.com', region: 'NA',
      shipmentDate: '2025-12-25', generatedDate: '2025-12-25', status: 'sent', fileSize: 234,
      sentHistory: [{ sentAt: '2025-12-25 16:45', sentTo: 'purchasing@abctrading.com', sentBy: 'admin', status: 'success' }]
    },

    // SC-EU-251101-0001 订单（完整）
    {
      id: 'doc-005', documentNumber: 'SC-EU-251101-0001', documentType: 'SC', contractNumber: 'SC-EU-251101-0001',
      customerName: 'EuroHome GmbH', customerEmail: 'logistics@eurohome.de', region: 'EU',
      shipmentDate: '2025-11-15', generatedDate: '2025-11-01', status: 'confirmed', fileSize: 142,
      sentHistory: [{ sentAt: '2025-11-01 11:20', sentTo: 'logistics@eurohome.de', sentBy: 'admin', status: 'success' }],
      metadata: { portOfLoading: 'NINGBO', portOfDischarge: 'HAMBURG' }
    },
    {
      id: 'doc-006', documentNumber: 'CI-EU-251110-0001', documentType: 'CI', contractNumber: 'SC-EU-251101-0001',
      customerName: 'EuroHome GmbH', customerEmail: 'logistics@eurohome.de', region: 'EU',
      shipmentDate: '2025-11-15', generatedDate: '2025-11-10', status: 'confirmed', fileSize: 78,
      sentHistory: [{ sentAt: '2025-11-10 14:30', sentTo: 'logistics@eurohome.de', sentBy: 'admin', status: 'success' }]
    },
    {
      id: 'doc-007', documentNumber: 'PL-EU-251110-0001', documentType: 'PL', contractNumber: 'SC-EU-251101-0001',
      customerName: 'EuroHome GmbH', customerEmail: 'logistics@eurohome.de', region: 'EU',
      shipmentDate: '2025-11-15', generatedDate: '2025-11-10', status: 'confirmed', fileSize: 54,
      sentHistory: [{ sentAt: '2025-11-10 14:35', sentTo: 'logistics@eurohome.de', sentBy: 'admin', status: 'success' }]
    },
    {
      id: 'doc-008', documentNumber: 'COSU7654321', documentType: 'BL', contractNumber: 'SC-EU-251101-0001',
      customerName: 'EuroHome GmbH', customerEmail: 'logistics@eurohome.de', region: 'EU',
      shipmentDate: '2025-11-15', generatedDate: '2025-11-15', status: 'sent', fileSize: 198,
      sentHistory: [{ sentAt: '2025-11-15 09:00', sentTo: 'logistics@eurohome.de', sentBy: 'admin', status: 'success' }]
    },

    // SC-SA-251110-0001 订单（完整）
    {
      id: 'doc-009', documentNumber: 'SC-SA-251110-0001', documentType: 'SC', contractNumber: 'SC-SA-251110-0001',
      customerName: 'BrasilPro Importadora', customerEmail: 'compras@brasilpro.com.br', region: 'SA',
      shipmentDate: '2025-12-01', generatedDate: '2025-11-10', status: 'sent', fileSize: 168,
      sentHistory: [{ sentAt: '2025-11-10 09:15', sentTo: 'compras@brasilpro.com.br', sentBy: 'admin', status: 'success' }],
      metadata: { portOfLoading: 'GUANGZHOU', portOfDischarge: 'SANTOS' }
    },
    {
      id: 'doc-010', documentNumber: 'CI-SA-251125-0001', documentType: 'CI', contractNumber: 'SC-SA-251110-0001',
      customerName: 'BrasilPro Importadora', customerEmail: 'compras@brasilpro.com.br', region: 'SA',
      shipmentDate: '2025-12-01', generatedDate: '2025-11-25', status: 'sent', fileSize: 95,
      sentHistory: [{ sentAt: '2025-11-25 15:15', sentTo: 'compras@brasilpro.com.br', sentBy: 'admin', status: 'success' }]
    },
    {
      id: 'doc-011', documentNumber: 'PL-SA-251125-0001', documentType: 'PL', contractNumber: 'SC-SA-251110-0001',
      customerName: 'BrasilPro Importadora', customerEmail: 'compras@brasilpro.com.br', region: 'SA',
      shipmentDate: '2025-12-01', generatedDate: '2025-11-25', status: 'sent', fileSize: 61,
      sentHistory: [{ sentAt: '2025-11-25 15:20', sentTo: 'compras@brasilpro.com.br', sentBy: 'admin', status: 'success' }]
    },

    // SC-NA-251115-0001 订单（部分缺失）
    {
      id: 'doc-012', documentNumber: 'SC-NA-251115-0001', documentType: 'SC', contractNumber: 'SC-NA-251115-0001',
      customerName: 'Industrial Supply Hub', customerEmail: 'orders@industrialhub.com', region: 'NA',
      shipmentDate: '2025-12-05', generatedDate: '2025-11-15', status: 'sent', fileSize: 178,
      sentHistory: [{ sentAt: '2025-11-15 16:00', sentTo: 'orders@industrialhub.com', sentBy: 'admin', status: 'success' }],
      metadata: { portOfLoading: 'SHANGHAI', portOfDischarge: 'NEW YORK' }
    },
    {
      id: 'doc-013', documentNumber: 'CI-NA-251130-0002', documentType: 'CI', contractNumber: 'SC-NA-251115-0001',
      customerName: 'Industrial Supply Hub', customerEmail: 'orders@industrialhub.com', region: 'NA',
      shipmentDate: '2025-12-05', generatedDate: '2025-11-30', status: 'generated', fileSize: 92,
      sentHistory: []
    },

    // SC-EU-251118-0001 订单（只有SC）
    {
      id: 'doc-014', documentNumber: 'SC-EU-251118-0001', documentType: 'SC', contractNumber: 'SC-EU-251118-0001',
      customerName: 'Nordic Imports AB', customerEmail: 'orders@nordicimports.se', region: 'EU',
      shipmentDate: '2025-12-10', generatedDate: '2025-11-18', status: 'sent', fileSize: 145,
      sentHistory: [{ sentAt: '2025-11-18 10:30', sentTo: 'orders@nordicimports.se', sentBy: 'admin', status: 'success' }],
      metadata: { portOfLoading: 'SHENZHEN', portOfDischarge: 'ROTTERDAM' }
    }
  ];

  // 数据隔离
  const filteredDocumentsByRole = userRole === 'customer' && userEmail
    ? mockDocuments.filter(doc => doc.customerEmail === userEmail)
    : mockDocuments;

  // 按销售合同分组
  const groupDocumentsByContract = (documents: Document[]): OrderGroup[] => {
    const grouped = new Map<string, OrderGroup>();

    documents.forEach(doc => {
      const contractNumber = doc.contractNumber;
      
      if (!grouped.has(contractNumber)) {
        const salesContract = documents.find(
          d => d.contractNumber === contractNumber && d.documentType === 'SC'
        );
        
        if (salesContract) {
          grouped.set(contractNumber, {
            contractNumber,
            salesContract,
            documents: {},
            customerName: salesContract.customerName,
            customerEmail: salesContract.customerEmail,
            region: salesContract.region,
            shipmentDate: salesContract.shipmentDate,
            totalDocuments: 0,
            completedDocuments: 0,
            portOfLoading: salesContract.metadata?.portOfLoading,
            portOfDischarge: salesContract.metadata?.portOfDischarge
          });
        }
      }

      const group = grouped.get(contractNumber);
      if (group) {
        group.documents[doc.documentType] = doc;
      }
    });

    // 计算统计
    grouped.forEach(group => {
      const docTypes: DocumentType[] = ['SC', 'CI', 'PL', 'BL'];
      group.totalDocuments = docTypes.filter(type => group.documents[type]).length;
      group.completedDocuments = docTypes.filter(
        type => group.documents[type] && group.documents[type]!.sentHistory.length > 0
      ).length;
    });

    return Array.from(grouped.values());
  };

  const uniqueCustomers = Array.from(new Set(filteredDocumentsByRole.map(doc => doc.customerName)));

  // 筛选逻辑
  const filteredDocuments = filteredDocumentsByRole.filter(doc => {
    const matchesSearch = 
      doc.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.contractNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRegion = regionFilter === 'all' || doc.region === regionFilter;
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesCustomer = customerFilter === 'all' || doc.customerName === customerFilter;
    
    const matchesDateRange = 
      (!dateRange.start || doc.shipmentDate >= dateRange.start) &&
      (!dateRange.end || doc.shipmentDate <= dateRange.end);
    
    return matchesSearch && matchesRegion && matchesStatus && matchesCustomer && matchesDateRange;
  });

  const orderGroups = groupDocumentsByContract(filteredDocuments);

  // 切换行展开
  const toggleRow = (contractNumber: string) => {
    setExpandedRows(prev =>
      prev.includes(contractNumber)
        ? prev.filter(c => c !== contractNumber)
        : [...prev, contractNumber]
    );
  };

  // 选择整个订单
  const toggleOrderSelection = (group: OrderGroup) => {
    const allDocIds = Object.values(group.documents).filter(Boolean).map(d => d!.id);
    const allSelected = allDocIds.every(id => selectedDocuments.includes(id));
    
    if (allSelected) {
      setSelectedDocuments(prev => prev.filter(id => !allDocIds.includes(id)));
    } else {
      setSelectedDocuments(prev => [...new Set([...prev, ...allDocIds])]);
    }
  };

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const openSendDialog = (doc: Document) => {
    setSelectedDoc(doc);
    setSendDialogOpen(true);
  };

  // 获取单证状态徽章
  const getDocumentBadge = (doc: Document | undefined, type: DocumentType) => {
    const typeConfigs = {
      SC: { bg: 'bg-blue-500', text: 'SC', icon: FileText },
      CI: { bg: 'bg-emerald-500', text: 'CI', icon: FileText },
      PL: { bg: 'bg-orange-500', text: 'PL', icon: Package },
      BL: { bg: 'bg-purple-500', text: 'BL', icon: Ship }
    };
    const config = typeConfigs[type];
    const Icon = config.icon;

    if (!doc) {
      return (
        <Tooltip>
          <TooltipTrigger>
            <div className="relative w-11 h-8 bg-gray-100 border border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-help">
              <Icon className="w-3 h-3 text-gray-400 mb-0.5" />
              <span className="text-[9px] text-gray-400 font-medium">{config.text}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p className="font-semibold">{config.text} 未生成</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    const statusIcons = {
      draft: { icon: Clock, color: 'text-gray-500' },
      generated: { icon: FileCheck, color: 'text-blue-500' },
      sent: { icon: MailCheck, color: 'text-red-500' },
      confirmed: { icon: CheckCircle2, color: 'text-emerald-600' }
    };
    const StatusIcon = statusIcons[doc.status]?.icon || Clock;
    const statusColor = statusIcons[doc.status]?.color || 'text-gray-500';

    return (
      <Tooltip>
        <TooltipTrigger>
          <div 
            className={`relative w-11 h-8 ${config.bg} rounded flex flex-col items-center justify-center cursor-pointer hover:opacity-90 transition-opacity`}
            onClick={() => toggleDocumentSelection(doc.id)}
          >
            {selectedDocuments.includes(doc.id) && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-2 h-2 text-white" />
              </div>
            )}
            <Icon className="w-3 h-3 text-white mb-0.5" />
            <span className="text-[9px] text-white font-bold">{config.text}</span>
            <StatusIcon className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${statusColor} bg-white rounded-full`} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p className="font-semibold">{doc.documentNumber}</p>
          <p className="text-[11px] text-gray-400">生成: {doc.generatedDate}</p>
          {doc.sentHistory.length > 0 && (
            <p className="text-[11px] text-green-600">已发送 {doc.sentHistory.length} 次</p>
          )}
          <p className="text-[11px] text-gray-400">{doc.fileSize}KB</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  const getRegionName = (region: string) => {
    const regions = { NA: '北美', EU: '欧非', SA: '南美' };
    return regions[region as keyof typeof regions] || region;
  };

  // 获取订单整体发送状态
  const getOrderSendStatus = (group: OrderGroup) => {
    const allDocs = Object.values(group.documents).filter(Boolean) as Document[];
    if (allDocs.length === 0) return { sent: 0, total: 0, lastSentTime: null };
    
    const sentDocs = allDocs.filter(doc => doc.sentHistory.length > 0);
    const lastSentDoc = allDocs
      .filter(doc => doc.sentHistory.length > 0)
      .sort((a, b) => {
        const aTime = a.sentHistory[a.sentHistory.length - 1].sentAt;
        const bTime = b.sentHistory[b.sentHistory.length - 1].sentAt;
        return bTime.localeCompare(aTime);
      })[0];
    
    return {
      sent: sentDocs.length,
      total: allDocs.length,
      lastSentTime: lastSentDoc?.sentHistory[lastSentDoc.sentHistory.length - 1]?.sentAt || null
    };
  };

  // 统计数据
  const stats = {
    total: filteredDocumentsByRole.length,
    orders: orderGroups.length,
    SC: filteredDocumentsByRole.filter(d => d.documentType === 'SC').length,
    CI: filteredDocumentsByRole.filter(d => d.documentType === 'CI').length,
    PL: filteredDocumentsByRole.filter(d => d.documentType === 'PL').length,
    BL: filteredDocumentsByRole.filter(d => d.documentType === 'BL').length,
    sent: filteredDocumentsByRole.filter(d => d.status === 'sent' || d.status === 'confirmed').length
  };

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {/* 头部 */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900" style={{ fontSize: '15px' }}>单证中心</h3>
              {userRole === 'customer' && (
                <Badge className="h-5 px-2 text-[10px] bg-amber-50 text-amber-700 border-amber-200">客户视图</Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">超紧凑表格视图，一屏显示更多订单</p>
          </div>
          {selectedDocuments.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">已选择 {selectedDocuments.length} 项</span>
              <Button size="sm" variant="outline" className="h-7 text-xs">
                <Download className="w-3 h-3 mr-1" />批量下载
              </Button>
              <Button size="sm" className="h-7 text-xs bg-[#F96302] hover:bg-[#E55A02]">
                <Send className="w-3 h-3 mr-1" />批量发送
              </Button>
            </div>
          )}
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-7 gap-2">
          {[
            { label: '订单数', value: stats.orders, color: 'indigo', icon: Layers },
            { label: '全部单证', value: stats.total, color: 'gray', icon: Archive },
            { label: 'SC', value: stats.SC, color: 'blue', icon: FileText },
            { label: 'CI', value: stats.CI, color: 'emerald', icon: FileText },
            { label: 'PL', value: stats.PL, color: 'orange', icon: Package },
            { label: 'BL', value: stats.BL, color: 'purple', icon: Ship },
            { label: '已发送', value: stats.sent, color: 'green', icon: MailCheck }
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className={`border-l-4 border-l-${stat.color}-500`}>
                <CardContent className="p-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] text-gray-500">{stat.label}</p>
                      <p className={`text-lg font-bold text-${stat.color}-600`}>{stat.value}</p>
                    </div>
                    <Icon className={`w-5 h-5 text-${stat.color}-500`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 筛选栏 */}
        <Card>
          <CardContent className="p-3">
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-4 relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input 
                  placeholder="搜索单证编号、合同编号、客户..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
              <div className="col-span-2">
                <Input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="h-8 text-xs" />
              </div>
              <div className="col-span-2">
                <Input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="h-8 text-xs" />
              </div>
              <div className="col-span-1">
                <Select value={regionFilter} onValueChange={setRegionFilter}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="区域" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" style={{ fontSize: '11px' }}>全部</SelectItem>
                    <SelectItem value="NA" style={{ fontSize: '11px' }}>北美</SelectItem>
                    <SelectItem value="EU" style={{ fontSize: '11px' }}>欧非</SelectItem>
                    <SelectItem value="SA" style={{ fontSize: '11px' }}>南美</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="状态" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" style={{ fontSize: '11px' }}>全部</SelectItem>
                    <SelectItem value="sent" style={{ fontSize: '11px' }}>已发送</SelectItem>
                    <SelectItem value="generated" style={{ fontSize: '11px' }}>已生成</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {userRole !== 'customer' && (
                <div className="col-span-2">
                  <Select value={customerFilter} onValueChange={setCustomerFilter}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="客户" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" style={{ fontSize: '11px' }}>全部客户</SelectItem>
                      {uniqueCustomers.map(customer => (
                        <SelectItem key={customer} value={customer} style={{ fontSize: '11px' }}>{customer}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 表格 */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="text-left p-2 text-sm font-semibold text-gray-600 w-8"></th>
                    <th className="text-left p-2 text-sm font-semibold text-gray-600 w-8"></th>
                    <th className="text-left p-2 text-sm font-semibold text-gray-600">合同编号</th>
                    <th className="text-left p-2 text-sm font-semibold text-gray-600">客户名称</th>
                    <th className="text-left p-2 text-sm font-semibold text-gray-600 w-16">区域</th>
                    <th className="text-left p-2 text-sm font-semibold text-gray-600 w-24">出货日期</th>
                    <th className="text-center p-2 text-sm font-semibold text-gray-600">单证状态</th>
                    <th className="text-center p-2 text-sm font-semibold text-gray-600 w-24">发送状态</th>
                    <th className="text-center p-2 text-sm font-semibold text-gray-600 w-20">完成度</th>
                    <th className="text-right p-2 text-sm font-semibold text-gray-600 w-20">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orderGroups.map((group) => {
                    const isExpanded = expandedRows.includes(group.contractNumber);
                    const allDocIds = Object.values(group.documents).filter(Boolean).map(d => d!.id);
                    const allSelected = allDocIds.every(id => selectedDocuments.includes(id));
                    const completionRate = group.totalDocuments > 0 
                      ? Math.round((group.completedDocuments / group.totalDocuments) * 100) 
                      : 0;

                    return (
                      <React.Fragment key={group.contractNumber}>
                        {/* 主行 */}
                        <tr className="hover:bg-blue-50/30 transition-colors">
                          <td className="p-2">
                            <button onClick={() => toggleRow(group.contractNumber)} className="hover:bg-gray-200 rounded p-0.5">
                              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                          <td className="p-2">
                            <Checkbox checked={allSelected} onCheckedChange={() => toggleOrderSelection(group)} className="h-3.5 w-3.5" />
                          </td>
                          <td className="p-2">
                            <p className="text-xs font-semibold text-blue-600 font-mono">{group.contractNumber}</p>
                          </td>
                          <td className="p-2">
                            <p className="text-xs text-gray-900 truncate max-w-[200px]">{group.customerName}</p>
                          </td>
                          <td className="p-2">
                            <Badge variant="outline" className="h-5 px-1.5 text-xs">{getRegionName(group.region)}</Badge>
                          </td>
                          <td className="p-2">
                            <p className="text-xs text-gray-600">{group.shipmentDate}</p>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center justify-center gap-1">
                              {getDocumentBadge(group.documents.SC, 'SC')}
                              {getDocumentBadge(group.documents.CI, 'CI')}
                              {getDocumentBadge(group.documents.PL, 'PL')}
                              {getDocumentBadge(group.documents.BL, 'BL')}
                            </div>
                          </td>
                          <td className="p-2">
                            {(() => {
                              const sendStatus = getOrderSendStatus(group);
                              if (sendStatus.sent === 0) {
                                return (
                                  <div className="text-center">
                                    <p className="text-[11px] text-gray-400">未发送</p>
                                  </div>
                                );
                              }
                              return (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <div className="flex flex-col items-center gap-0.5">
                                      <div className="flex items-center gap-1">
                                        <MailCheck className="w-3 h-3 text-green-600" />
                                        <span className={`text-[11px] font-medium ${
                                          sendStatus.sent === sendStatus.total ? 'text-green-600' : 'text-orange-600'
                                        }`}>
                                          {sendStatus.sent}/{sendStatus.total}
                                        </span>
                                      </div>
                                      {sendStatus.lastSentTime && (
                                        <span className="text-[11px] text-gray-500">
                                          {sendStatus.lastSentTime.slice(5, 16).replace(' ', ' ')}
                                        </span>
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-xs">
                                    <p className="font-semibold">发送状态</p>
                                    <p className="text-[11px] text-gray-400">
                                      已发送: {sendStatus.sent}/{sendStatus.total} 份单证
                                    </p>
                                    {sendStatus.lastSentTime && (
                                      <p className="text-[11px] text-green-600">
                                        最后发送: {sendStatus.lastSentTime}
                                      </p>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })()}
                          </td>
                          <td className="p-2">
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all ${
                                    completionRate === 100 ? 'bg-green-500' : 
                                    completionRate >= 50 ? 'bg-blue-500' : 'bg-orange-500'
                                  }`}
                                  style={{ width: `${completionRate}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-semibold text-gray-700">{group.completedDocuments}/{group.totalDocuments}</span>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center justify-end gap-0.5">
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Eye className="w-3 h-3" /></Button>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Download className="w-3 h-3" /></Button>
                              {userRole !== 'customer' && (
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Send className="w-3 h-3" /></Button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* 展开行 */}
                        {isExpanded && (
                          <tr className="bg-gray-50">
                            <td colSpan={9} className="p-3">
                              <div className="space-y-2">
                                {(['SC', 'CI', 'PL', 'BL'] as DocumentType[]).map((docType) => {
                                  const doc = group.documents[docType];
                                  if (!doc) return null;

                                  return (
                                    <div key={doc.id} className="flex items-center gap-3 bg-white p-2 rounded border border-gray-200">
                                      <Checkbox 
                                        checked={selectedDocuments.includes(doc.id)}
                                        onCheckedChange={() => toggleDocumentSelection(doc.id)}
                                        className="h-3.5 w-3.5"
                                      />
                                      <Badge className={`h-5 px-2 text-xs ${
                                        docType === 'SC' ? 'bg-blue-500' :
                                        docType === 'CI' ? 'bg-emerald-500' :
                                        docType === 'PL' ? 'bg-orange-500' : 'bg-purple-500'
                                      }`}>
                                        {docType}
                                      </Badge>
                                      <p className="text-xs font-mono flex-1">{doc.documentNumber}</p>
                                      <p className="text-[11px] text-gray-500">生成: {doc.generatedDate}</p>
                                      <p className="text-[11px] text-gray-500">{doc.fileSize}KB</p>
                                      {doc.sentHistory.length > 0 && (
                                        <p className="text-[11px] text-green-600 font-medium">已发 {doc.sentHistory.length}次</p>
                                      )}
                                      <div className="flex gap-0.5">
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Eye className="w-3 h-3" /></Button>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Download className="w-3 h-3" /></Button>
                                        {userRole !== 'customer' && (
                                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => openSendDialog(doc)}>
                                            <Send className="w-3 h-3" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 底部统计 */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
          <span>共 {orderGroups.length} 个订单</span>
          <span>共 {filteredDocuments.length} 份单证</span>
        </div>

        {/* 发送对话框 */}
        <SendDocumentDialog open={sendDialogOpen} onOpenChange={setSendDialogOpen} document={selectedDoc} />
      </div>
    </TooltipProvider>
  );
}

// 发送单证对话框
function SendDocumentDialog({ open, onOpenChange, document }: any) {
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  React.useEffect(() => {
    if (open && document) {
      setEmailTo(document.customerEmail);
      setEmailSubject(`【高盛达富】${document.documentNumber}`);
      setEmailBody(`尊敬的 ${document.customerName}：\n\n您好！\n\n附件为您的订单 ${document.contractNumber} 的相关单证，请查收。\n\n此致\n敬礼\n\n福建高盛达富建材有限公司`);
    }
  }, [open, document]);

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" />发送单证给客户
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-xs font-medium text-blue-900 mb-2">单证信息</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
              <div>单证编号: {document.documentNumber}</div>
              <div>客户名称: {document.customerName}</div>
            </div>
          </div>
          <div>
            <Label className="text-xs">收件人 *</Label>
            <Input value={emailTo} onChange={(e) => setEmailTo(e.target.value)} className="h-9 text-xs mt-1" />
          </div>
          <div>
            <Label className="text-xs">邮件主题 *</Label>
            <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="h-9 text-xs mt-1" />
          </div>
          <div>
            <Label className="text-xs">邮件正文 *</Label>
            <Textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} className="text-xs mt-1 min-h-[150px]" />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>取消</Button>
            <Button size="sm" className="bg-[#F96302] hover:bg-[#E55A02]">
              <Send className="w-3.5 h-3.5 mr-1.5" />发送邮件
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}