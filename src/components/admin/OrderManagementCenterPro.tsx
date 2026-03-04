// 🔥 THE COSUN BM - 订单管理中心 Pro版
// B2B全流程订单管理：询价 → 报价 → 合同 → 订单 → 收款

import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { 
  FileText, Package, DollarSign, Bell, Wallet, Search, Filter, 
  Eye, Plus, Download, FileCheck, Loader2, CheckCircle2,
  Container, TrendingUp, Clock, ArrowRight, X, Send,
  ClipboardList, Receipt, Truck, CreditCard
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import AdminInquiryManagement from './AdminInquiryManagementNew'; // 🔥 导入新的询价管理组件
import QuotationManagement from './QuotationManagement'; // 📋 导入独立的报价管理组件
import { Inquiry as CustomerInquiry } from '../../contexts/InquiryContext';
import OrderTracking from './OrderTracking';
import CollectionManagement from './CollectionManagement';
import OrderOverviewDashboard from './OrderOverviewDashboard'; // 🔥 订单全盘
import { CostInquiryQuotationManagement } from './CostInquiryQuotationManagement'; // 🔥 成本询报
import { SalesQuotationManagement } from '../salesperson/SalesQuotationManagement'; // 🔥 QT销售报价管理
import { SalesContractManagement } from '../salesperson/SalesContractManagement'; // 🔥 SC销售合同管理（业务员订单）
import { ApprovalCenter } from './ApprovalCenter'; // 🔥 审批中心
import { useNotifications } from '../../contexts/NotificationContext';
import { useSalesQuotations } from '../../contexts/SalesQuotationContext'; // 🔥 新增：获取待审批数量
import { getCurrentUser } from '../../utils/dataIsolation'; // 🔥 新增：获取当前用户
import { QuotationPDFTemplate } from './QuotationPDFTemplate';
import { SalesContractTemplate } from './SalesContractTemplate';
import { SalesContractDocumentPaginated } from '../documents/SalesContractDocumentPaginated'; // 🔥 分页版销售合同
import { SalesContractData } from '../documents/templates/SalesContractDocument'; // 🔥 销售合同数据类型
import { exportToPDF, generatePDFFilename } from '../../utils/pdfExport';
import { apiFetchJson } from '../../api/backend-auth';
const APPROVAL_CENTER_CACHE_PREFIX = 'approval_center_cache_v1';
const getApprovalCenterCacheKey = (email: string) => `${APPROVAL_CENTER_CACHE_PREFIX}:${email || 'anonymous'}`;

// 🔥 增强的报价产品接口
interface QuotationProduct {
  name: string;
  quantity: number;
  unitPrice: number;
  pcsPerCarton: number;
  cartonLength: number;
  cartonWidth: number;
  cartonHeight: number;
  grossWeight: number;
  netWeight: number;
  specification?: string;
  hsCode?: string; // HS编码
  moq?: number; // 最小起订量
  leadTime?: number; // 交付周期（天）
}

// 🔥 增强的报价接口
interface Quotation {
  id: string;
  inquiryId: string;
  customer: string;
  contactPerson?: string;
  email?: string;
  date: string;
  validUntil: string;
  totalAmount: number;
  status: 'Draft' | 'Sent' | 'Negotiating' | 'Accepted' | 'Rejected' | 'Expired' | 'Contract Generated';
  products: QuotationProduct[];
  paymentTerms?: string;
  deliveryTerms?: string;
  portOfLoading?: string;
  portOfDestination?: string;
  containerType?: '20GP' | '40GP' | '40HQ';
  contractGenerated?: boolean;
  contractNo?: string;
  region?: 'NA' | 'SA' | 'EMEA';
  currency?: 'USD' | 'EUR' | 'GBP';
  shippingMethod?: 'Sea' | 'Air' | 'Express';
  remarks?: string;
}

export default function OrderManagementCenterPro() {
  const [activeTab, setActiveTab] = useState<'overview' | 'inquiries' | 'cost-inquiry' | 'quotations' | 'orders' | 'collections' | 'approvals'>('overview');
  const [selectedInquiry, setSelectedInquiry] = useState<CustomerInquiry | null>(null);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isFromInquiry, setIsFromInquiry] = useState(false);
  
  // 🔥 高亮QT报价单号（用于下推报价管理后高亮显示）
  const [highlightQtNumber, setHighlightQtNumber] = useState<string | undefined>(undefined);
  
  // 🔥 高亮SC销售合同号（用于下推订单管理后高亮显示）
  const [highlightScNumber, setHighlightScNumber] = useState<string | undefined>(undefined);
  
  // 🔒 获取当前用户角色
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
    const pendingTargetTab = localStorage.getItem('orderManagementCenterActiveTab');
    if (!pendingTargetTab) return;
    if (['overview', 'inquiries', 'cost-inquiry', 'quotations', 'orders', 'collections', 'approvals'].includes(pendingTargetTab)) {
      setActiveTab(pendingTargetTab as any);
    }
    localStorage.removeItem('orderManagementCenterActiveTab');
  }, []);
  
  useEffect(() => {
    const currentUserStr = localStorage.getItem('cosun_current_user');
    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr);
        setCurrentUserRole(currentUser.role || null);
      } catch (e) {
        console.error('❌ [OrderManagementCenter] Failed to parse current user:', e);
      }
    }
  }, []);
  
  // 报价管理状态
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRegion, setFilterRegion] = useState('all');
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [showContractDialog, setShowContractDialog] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [generatingContract, setGeneratingContract] = useState(false);
  const [showQuoteDetail, setShowQuoteDetail] = useState(false);
  
  const quotationPDFRef = useRef<HTMLDivElement>(null);
  const contractPDFRef = useRef<HTMLDivElement>(null);
  
  const { notifications, unreadCount, addNotification } = useNotifications();
  
  // 🔥 计算当前用户的待审批数量
  const currentUser = getCurrentUser();
  const currentUserEmail = currentUser?.email || '';
  const [myPendingCount, setMyPendingCount] = useState(() => {
    if (!currentUserEmail) return 0;
    try {
      const raw = localStorage.getItem(getApprovalCenterCacheKey(currentUserEmail));
      const parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed?.pending) ? parsed.pending.length : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    if (!currentUserEmail) {
      setMyPendingCount(0);
      return;
    }

    // 先显示缓存值，避免切角色后红点先显示 0
    try {
      const raw = localStorage.getItem(getApprovalCenterCacheKey(currentUserEmail));
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed?.pending)) {
        setMyPendingCount(parsed.pending.length);
      }
    } catch {}

    // 待审批数量从 localStorage 缓存读取，避免调用已禁用的后端 API

    const handlePendingChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{ count?: number }>;
      const next = Number(customEvent?.detail?.count ?? 0);
      if (Number.isFinite(next)) {
        setMyPendingCount(next);
      }
    };

    window.addEventListener('approvalPendingCountChanged', handlePendingChanged as EventListener);
    return () => {
      window.removeEventListener('approvalPendingCountChanged', handlePendingChanged as EventListener);
    };
  }, [currentUserEmail]);

  // 初始化模拟数据
  useEffect(() => {
    setQuotations([
      {
        id: 'QUO-2025-0234',
        inquiryId: 'INQ-2025-0156',
        customer: 'ABC Trading Ltd.',
        contactPerson: 'John Smith',
        email: 'john@abctrading.com',
        date: '2025-10-27',
        validUntil: '2025-11-27',
        totalAmount: 87500,
        status: 'Sent',
        region: 'NA',
        currency: 'USD',
        paymentTerms: '30% T/T in advance, 70% before shipment',
        deliveryTerms: 'FOB Xiamen',
        portOfLoading: 'Xiamen',
        portOfDestination: 'Los Angeles',
        containerType: '40HQ',
        shippingMethod: 'Sea',
        contractGenerated: false,
        products: [
          {
            name: 'Cylindrical Door Lock',
            specification: 'Material: Zinc Alloy, Finish: Satin Nickel',
            quantity: 5000,
            unitPrice: 12.50,
            pcsPerCarton: 20,
            cartonLength: 45,
            cartonWidth: 35,
            cartonHeight: 30,
            grossWeight: 18.5,
            netWeight: 17.0,
            hsCode: '8301.40',
            moq: 1000,
            leadTime: 30,
          },
          {
            name: 'Lever Handle Set',
            specification: 'Material: Stainless Steel, Finish: Brushed',
            quantity: 3000,
            unitPrice: 8.75,
            pcsPerCarton: 25,
            cartonLength: 40,
            cartonWidth: 38,
            cartonHeight: 25,
            grossWeight: 15.2,
            netWeight: 14.0,
            hsCode: '8301.40',
            moq: 500,
            leadTime: 25,
          },
        ],
      },
      {
        id: 'QUO-2025-0233',
        inquiryId: 'INQ-2025-0155',
        customer: 'XYZ Construction Inc.',
        contactPerson: 'Maria Garcia',
        email: 'maria@xyzconstruction.com',
        date: '2025-10-25',
        validUntil: '2025-11-25',
        totalAmount: 156200,
        status: 'Accepted',
        region: 'SA',
        currency: 'USD',
        paymentTerms: 'L/C at sight',
        deliveryTerms: 'CIF Santos',
        portOfLoading: 'Shanghai',
        portOfDestination: 'Santos',
        containerType: '40GP',
        shippingMethod: 'Sea',
        contractGenerated: true,
        contractNo: 'SC-2025-0101',
        products: [
          {
            name: 'Window Hinge',
            specification: 'Heavy Duty, Stainless Steel 304',
            quantity: 8000,
            unitPrice: 6.20,
            pcsPerCarton: 50,
            cartonLength: 42,
            cartonWidth: 32,
            cartonHeight: 28,
            grossWeight: 22.0,
            netWeight: 20.5,
            hsCode: '8302.10',
            moq: 2000,
            leadTime: 35,
          },
        ],
      },
      {
        id: 'QUO-2025-0232',
        inquiryId: 'INQ-2025-0154',
        customer: 'Euro Hardware GmbH',
        contactPerson: 'Hans Mueller',
        email: 'hans@eurohardware.de',
        date: '2025-10-23',
        validUntil: '2025-11-23',
        totalAmount: 94800,
        status: 'Negotiating',
        region: 'EMEA',
        currency: 'EUR',
        paymentTerms: '50% deposit, 50% before shipment',
        deliveryTerms: 'FOB Ningbo',
        portOfLoading: 'Ningbo',
        portOfDestination: 'Hamburg',
        containerType: '20GP',
        shippingMethod: 'Sea',
        contractGenerated: false,
        products: [
          {
            name: 'Cabinet Handle',
            specification: 'Aluminum Alloy, Anodized',
            quantity: 12000,
            unitPrice: 7.90,
            pcsPerCarton: 100,
            cartonLength: 50,
            cartonWidth: 40,
            cartonHeight: 35,
            grossWeight: 25.0,
            netWeight: 23.5,
            hsCode: '8302.41',
            moq: 3000,
            leadTime: 28,
          },
        ],
      },
    ]);
  }, []);

  // 处理从询价创建报价
  const handleCreateQuotation = (inquiry: CustomerInquiry) => {
    console.log('🔄 创建报价流转被触发！');
    setSelectedInquiry(inquiry);
    setActiveTab('quotations');
    setIsFromInquiry(true);
    
    const customerName = inquiry.buyerInfo?.companyName || inquiry.buyerInfo?.contactPerson || 'N/A';
    
    addNotification({
      type: 'inquiry_processing',
      title: '准备创建报价',
      message: `正在为 ${customerName} 创建报价单`,
      relatedId: inquiry.id,
      relatedType: 'inquiry',
      recipient: 'admin@cosun.com',
      sender: 'system'
    });

    toast.success('进入报价创建', {
      description: `询价编号: ${inquiry.id}`,
      duration: 2000
    });
    
    // 自动打开报价创建对话框
    setShowQuoteDialog(true);
  };

  // 处理报价创建完成
  const handleQuotationCreated = () => {
    setTimeout(() => {
      setSelectedInquiry(null);
      setIsFromInquiry(false);
      setShowQuoteDialog(false);
    }, 100);
  };

  // 导出报价PDF
  const handleExportQuotationPDF = async () => {
    if (!quotationPDFRef.current || !selectedQuotation) return;
    
    setExportingPDF(true);
    const filename = generatePDFFilename('Quotation', selectedQuotation.id);
    await exportToPDF(quotationPDFRef.current, filename);
    setExportingPDF(false);
    toast.success('报价单PDF导出成功！');
  };

  // 生成销售合同
  const handleGenerateContract = async (quotation: Quotation) => {
    setGeneratingContract(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const contractNo = `SC-${new Date().getFullYear()}-${String(quotations.filter(q => q.contractGenerated).length + 101).padStart(4, '0')}`;
    
    setQuotations(quotations.map(q => 
      q.id === quotation.id 
        ? { 
            ...q, 
            status: 'Contract Generated', 
            contractGenerated: true,
            contractNo 
          }
        : q
    ));
    
    setSelectedQuotation({
      ...quotation,
      status: 'Contract Generated',
      contractGenerated: true,
      contractNo
    });
    
    setGeneratingContract(false);
    setShowContractDialog(true);
    
    addNotification({
      type: 'contract_generated',
      title: '销售合同已生成',
      message: `合同编号: ${contractNo}`,
      relatedId: contractNo,
      relatedType: 'contract',
      recipient: 'admin@cosun.com',
      sender: 'system'
    });
    
    toast.success('销售合同生成成功！', {
      description: `合同编号: ${contractNo}`
    });
  };

  // 导出合同PDF
  const handleExportContractPDF = async () => {
    if (!contractPDFRef.current || !selectedQuotation) return;
    
    setExportingPDF(true);
    const filename = generatePDFFilename('Sales_Contract', selectedQuotation.contractNo || selectedQuotation.id);
    await exportToPDF(contractPDFRef.current, filename);
    setExportingPDF(false);
    toast.success('合同PDF导出成功！');
  };

  // 发送报价
  const handleSendQuotation = (quotation: Quotation) => {
    setQuotations(quotations.map(q => 
      q.id === quotation.id ? { ...q, status: 'Sent' as const } : q
    ));
    
    addNotification({
      type: 'quotation_sent',
      title: '报价单已发送',
      message: `报价单 ${quotation.id} 已发送给 ${quotation.customer}`,
      relatedId: quotation.id,
      relatedType: 'quotation',
      recipient: 'admin@cosun.com',
      sender: 'system'
    });
    
    toast.success('报价单已发送！', {
      description: `已发送至 ${quotation.email}`
    });
  };

  // 更新报价状态
  const handleUpdateQuotationStatus = (quotationId: string, newStatus: Quotation['status']) => {
    setQuotations(quotations.map(q => 
      q.id === quotationId ? { ...q, status: newStatus } : q
    ));
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-500';
      case 'Sent': return 'bg-blue-500';
      case 'Negotiating': return 'bg-yellow-500';
      case 'Accepted': return 'bg-green-500';
      case 'Rejected': return 'bg-red-500';
      case 'Expired': return 'bg-orange-500';
      case 'Contract Generated': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  // 获取区域标签
  const getRegionLabel = (region?: string) => {
    switch (region) {
      case 'NA': return '北美';
      case 'SA': return '南美';
      case 'EMEA': return '欧非';
      default: return '未知';
    }
  };

  // 过滤报价
  const filteredQuotations = quotations.filter(q => {
    const matchesSearch = searchTerm === '' || 
      q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.inquiryId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || q.status === filterStatus;
    const matchesRegion = filterRegion === 'all' || q.region === filterRegion;
    
    return matchesSearch && matchesStatus && matchesRegion;
  });

  // 统计数据
  const stats = {
    total: quotations.length,
    draft: quotations.filter(q => q.status === 'Draft').length,
    sent: quotations.filter(q => q.status === 'Sent').length,
    negotiating: quotations.filter(q => q.status === 'Negotiating').length,
    accepted: quotations.filter(q => q.status === 'Accepted').length,
    contracted: quotations.filter(q => q.contractGenerated).length,
    totalValue: quotations.reduce((sum, q) => sum + q.totalAmount, 0),
    acceptedValue: quotations.filter(q => q.status === 'Accepted' || q.status === 'Contract Generated').reduce((sum, q) => sum + q.totalAmount, 0),
  };

  return (
    <div className="h-full flex flex-col bg-[#F5F5F5]">
      {/* 🔥 专门的打印样式 - 打印时只显示合同内容 */}
      <style>{`
        @media print {
          /* 隐藏所有页面内容 */
          body > div:not(.print-contract-content),
          .print-hide,
          [role="dialog"]:not(.print-contract-dialog) {
            display: none !important;
          }
          
          /* 确保打印的合同内容可见 */
          .print-contract-content {
            display: block !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 99999 !important;
            background: white !important;
          }
          
          /* 隐藏对话框的边框和背景 */
          .print-contract-dialog {
            max-width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
          }
          
          /* 隐藏对话框的头部和底部 */
          .print-contract-dialog > div:not(.print-contract-content) {
            display: none !important;
          }
        }
      `}</style>
      
      {/* 🎨 方案A：台湾大厂原汁原味风格 - SAP/Oracle单行紧凑摘要栏 */}
      {/* 🔒 只对非业务员角色显示统计栏 - 移除CEO、销售总监、区域经理和业务员的统计 */}
      {!['CEO', 'Sales_Director', 'Sales_Manager', 'Sales_Rep'].includes(currentUserRole || '') && (
        <div className="bg-white border border-gray-300 rounded print-hide">
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">报价统计</h3>
          </div>
          <div className="px-5 py-3 flex items-center gap-8 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">报价总数:</span>
              <span className="font-semibold text-gray-900">{stats.total}</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">待发送:</span>
              <span className="font-semibold text-gray-900">{stats.draft}</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">协商中:</span>
              <span className="font-semibold text-gray-900">{stats.negotiating}</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">已成交:</span>
              <span className="font-semibold text-orange-600">{stats.accepted}</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">转化率:</span>
              <span className="font-semibold text-gray-900">{stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0}%</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">生成合同:</span>
              <span className="font-semibold text-gray-900">{stats.contracted}</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">报价金额:</span>
              <span className="font-semibold text-gray-900">${(stats.totalValue / 1000).toFixed(0)}K</span>
            </div>
          </div>
        </div>
      )}
      
      {/* 主标签页 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
        <div className="bg-[#F3F4F6] border-b border-gray-300">
          <div className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`relative px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'overview'
                  ? 'border-[#F96302] text-[#F96302] bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              订单全盘
              <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-[#F96302] text-white rounded">NEW</span>
            </button>
            
            <button
              onClick={() => setActiveTab('inquiries')}
              className={`relative px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'inquiries'
                  ? 'border-[#F96302] text-[#F96302] bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              询价管理
            </button>
            
            <button
              onClick={() => setActiveTab('cost-inquiry')}
              className={`relative px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'cost-inquiry'
                  ? 'border-[#F96302] text-[#F96302] bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              成本询报
            </button>
            
            <button
              onClick={() => setActiveTab('quotations')}
              className={`relative px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'quotations'
                  ? 'border-[#F96302] text-[#F96302] bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              报价管理
            </button>
            
            <button
              onClick={() => setActiveTab('orders')}
              className={`relative px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'orders'
                  ? 'border-[#F96302] text-[#F96302] bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Package className="w-4 h-4" />
              订单管理
            </button>
            
            <button
              onClick={() => setActiveTab('collections')}
              className={`relative px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'collections'
                  ? 'border-[#F96302] text-[#F96302] bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Wallet className="w-4 h-4" />
              收款管理
            </button>
            
            {/* 🔥 审批中心 - 仅主管、总监、CEO可见 */}
            {['Regional_Manager', 'Sales_Manager', 'Sales_Director', 'CEO'].includes(currentUserRole || '') && (
              <button
                onClick={() => setActiveTab('approvals')}
                className={`relative px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${
                  activeTab === 'approvals'
                    ? 'border-[#F96302] text-[#F96302] bg-white'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Bell className="w-4 h-4" />
                审批中心
                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded">{myPendingCount}</span>
              </button>
            )}
          </div>
        </div>

        {/* 订单全盘标签页 - NEW */}
        <TabsContent value="overview" className="mt-6">
          <OrderOverviewDashboard />
        </TabsContent>

        {/* 询价管理标签页 */}
        <TabsContent value="inquiries" className="mt-6">
          <AdminInquiryManagement 
            onCreateQuotation={handleCreateQuotation}
            onSwitchToCostInquiry={() => setActiveTab('cost-inquiry')} // 🔥 下推成本询报后自动切换标签页
          />
        </TabsContent>

        {/* 成本询报标签页 */}
        <TabsContent value="cost-inquiry" className="mt-6">
          <CostInquiryQuotationManagement 
            onSwitchToQuotationManagement={(qtNumber) => {
              // 🔥 下推报价管理：切换到报价管理页面并高亮指定QT
              setHighlightQtNumber(qtNumber);
              setActiveTab('quotations');
              // 3秒后清除高亮参数
              setTimeout(() => setHighlightQtNumber(undefined), 3500);
            }}
          />
        </TabsContent>

        {/* 报价管理标签页 */}
        <TabsContent value="quotations" className="mt-6">
          {/* 🔥 使用SalesQuotationManagement组件，管理QT销售报价单 */}
          <SalesQuotationManagement 
            highlightQtNumber={highlightQtNumber} 
            onNavigateToOrders={() => setActiveTab('orders')} 
            onNavigateToOrdersWithHighlight={(scNumber) => {
              // 🔥 下推订单管理：切换到订单管理页面并高亮指定SC
              console.log('🔍 [OrderManagementCenterPro] 下推到订单管理并高亮SC:', scNumber);
              setHighlightScNumber(scNumber);
              setActiveTab('orders');
              // 3秒后清除高亮参数
              setTimeout(() => setHighlightScNumber(undefined), 3500);
            }}
          />
        </TabsContent>

        {/* 订单管理标签页 - 🔥 使用SalesContractManagement组件 */}
        <TabsContent value="orders" className="mt-6">
          <SalesContractManagement highlightScNumber={highlightScNumber} />
        </TabsContent>

        {/* 收款管理标签页 */}
        <TabsContent value="collections" className="mt-6">
          <CollectionManagement />
        </TabsContent>

        {/* 审批中心标签页 */}
        <TabsContent value="approvals" className="mt-6">
          <ApprovalCenter />
        </TabsContent>
      </Tabs>

      {/* 报价详情对话框 */}
      <Dialog open={showQuoteDetail} onOpenChange={setShowQuoteDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>报价单详情 - {selectedQuotation?.id}</DialogTitle>
            <DialogDescription>
              查看报价单详细信息
            </DialogDescription>
          </DialogHeader>
          
          {selectedQuotation && (
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">客户名称</Label>
                  <div className="font-semibold mt-1">{selectedQuotation.customer}</div>
                </div>
                <div>
                  <Label className="text-gray-600">联系人</Label>
                  <div className="font-semibold mt-1">{selectedQuotation.contactPerson}</div>
                </div>
                <div>
                  <Label className="text-gray-600">报价日期</Label>
                  <div className="font-semibold mt-1">{selectedQuotation.date}</div>
                </div>
                <div>
                  <Label className="text-gray-600">有效期至</Label>
                  <div className="font-semibold mt-1">{selectedQuotation.validUntil}</div>
                </div>
                <div>
                  <Label className="text-gray-600">区域</Label>
                  <Badge variant="outline" className="mt-1">{getRegionLabel(selectedQuotation.region)}</Badge>
                </div>
                <div>
                  <Label className="text-gray-600">状态</Label>
                  <Badge className={`${getStatusColor(selectedQuotation.status)} mt-1`}>
                    {selectedQuotation.status}
                  </Badge>
                </div>
              </div>

              {/* 贸易条款 */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">贸易条款</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">付款条款</Label>
                    <div className="mt-1">{selectedQuotation.paymentTerms}</div>
                  </div>
                  <div>
                    <Label className="text-gray-600">交货条款</Label>
                    <div className="mt-1">{selectedQuotation.deliveryTerms}</div>
                  </div>
                  <div>
                    <Label className="text-gray-600">起运港</Label>
                    <div className="mt-1">{selectedQuotation.portOfLoading}</div>
                  </div>
                  <div>
                    <Label className="text-gray-600">目的港</Label>
                    <div className="mt-1">{selectedQuotation.portOfDestination}</div>
                  </div>
                  <div>
                    <Label className="text-gray-600">运输方式</Label>
                    <div className="mt-1">{selectedQuotation.shippingMethod}</div>
                  </div>
                  <div>
                    <Label className="text-gray-600">柜型</Label>
                    <div className="mt-1">{selectedQuotation.containerType}</div>
                  </div>
                </div>
              </div>

              {/* 产品列表 */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">产品明细</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>产品名称</TableHead>
                      <TableHead>规格</TableHead>
                      <TableHead className="text-right">数量</TableHead>
                      <TableHead className="text-right">单价</TableHead>
                      <TableHead className="text-right">总价</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedQuotation.products.map((product, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-sm">{product.specification}</TableCell>
                        <TableCell className="text-right">{product.quantity.toLocaleString()}</TableCell>
                        <TableCell className="text-right">${product.unitPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ${(product.quantity * product.unitPrice).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4} className="text-right font-semibold">总计:</TableCell>
                      <TableCell className="text-right font-bold text-lg">
                        {selectedQuotation.currency} ${selectedQuotation.totalAmount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuoteDetail(false)}>
              关闭
            </Button>
            <Button onClick={handleExportQuotationPDF} disabled={exportingPDF}>
              {exportingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  导出中...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  导出PDF
                </>
              )}
            </Button>
            {selectedQuotation?.status === 'Accepted' && !selectedQuotation?.contractGenerated && (
              <Button 
                onClick={() => selectedQuotation && handleGenerateContract(selectedQuotation)}
                disabled={generatingContract}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {generatingContract ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4 mr-2" />
                    生成合同
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 合同查看对话框 */}
      <Dialog open={showContractDialog} onOpenChange={setShowContractDialog} className="print-contract-dialog">
        <DialogContent className="max-w-[67.2rem] max-h-[90vh] overflow-y-auto print:hidden"> {/* 🔥 打印时隐藏对话框 */}
          <DialogHeader className="print-hide"> {/* 🔥 打印时隐藏头部 */}
            <DialogTitle>销售合同 - {selectedQuotation?.contractNo}</DialogTitle>
            <DialogDescription>
              Sales Contract
            </DialogDescription>
          </DialogHeader>
          
          <div ref={contractPDFRef} className="print-contract-content">
            {selectedQuotation && (
              <SalesContractDocumentPaginated
                data={{
                  // 合同基本信息
                  contractNo: selectedQuotation.contractNo || `SC-${selectedQuotation.id}`,
                  contractDate: selectedQuotation.date,
                  quotationNo: selectedQuotation.id,
                  region: selectedQuotation.region === 'EMEA' ? 'EU' : selectedQuotation.region || 'NA',
                  
                  // 卖方（公司）信息
                  seller: {
                    name: '福建高盛达富建材有限公司',
                    nameEn: 'Fujian Cosun Dafu Building Materials Co., Ltd.',
                    address: '福建省厦门市湖里区湖里大道',
                    addressEn: 'Huli Avenue, Huli District, Xiamen, Fujian Province, China',
                    tel: '+86-591-8888-8888',
                    fax: '+86-591-8888-8889',
                    email: 'export@cosun.com',
                    legalRepresentative: 'Zhang San',
                    bankInfo: {
                      bankName: 'Bank of China, Xiamen Branch',
                      accountName: 'Fujian Cosun Dafu Building Materials Co., Ltd.',
                      accountNumber: '1234 5678 9012 3456',
                      swiftCode: 'BKCHCNBJ950',
                      bankAddress: 'Xiamen, Fujian Province, China',
                      currency: selectedQuotation.currency || 'USD'
                    }
                  },
                  
                  // 买方（客户）信息
                  buyer: {
                    companyName: selectedQuotation.customer,
                    address: 'N/A',
                    country: selectedQuotation.region === 'NA' ? 'United States' : selectedQuotation.region === 'SA' ? 'Brazil' : 'Germany',
                    contactPerson: selectedQuotation.contactPerson || 'N/A',
                    tel: 'N/A',
                    email: selectedQuotation.email || 'N/A'
                  },
                  
                  // 产品清单
                  products: selectedQuotation.products.map((p, index) => ({
                    no: index + 1,
                    modelNo: p.hsCode || '-',
                    description: p.name,
                    specification: p.specification || '-',
                    hsCode: p.hsCode,
                    unit: 'pcs',
                    quantity: p.quantity,
                    unitPrice: p.unitPrice,
                    currency: selectedQuotation.currency || 'USD',
                    amount: p.quantity * p.unitPrice
                  })),
                  
                  // 合同条款
                  terms: {
                    totalAmount: selectedQuotation.totalAmount,
                    currency: selectedQuotation.currency || 'USD',
                    tradeTerms: selectedQuotation.deliveryTerms || 'FOB Xiamen',
                    paymentTerms: selectedQuotation.paymentTerms || '30% T/T in advance, 70% before shipment',
                    depositAmount: selectedQuotation.totalAmount * 0.3,
                    balanceAmount: selectedQuotation.totalAmount * 0.7,
                    deliveryTime: '42 days after deposit received',
                    portOfLoading: selectedQuotation.portOfLoading || 'Xiamen, China',
                    portOfDestination: selectedQuotation.portOfDestination || 'Los Angeles, USA',
                    packing: 'Export standard carton',
                    inspection: 'Buyer has the right to inspect goods before shipment',
                    warranty: '12 months warranty'
                  },
                  
                  // 违约责任条款
                  liabilityTerms: {
                    sellerDefault: 'If Seller fails to deliver on time without valid reason, Buyer may cancel the order and claim full refund plus 5% compensation.',
                    buyerDefault: 'If Buyer fails to pay balance within agreed time, deposit will be forfeited as liquidated damages.',
                    forceMajeure: 'Neither party liable for delays due to force majeure events (natural disasters, wars, epidemics, government actions). Affected party must notify within 15 days with official documentation.'
                  },
                  
                  // 争议解决
                  disputeResolution: {
                    governingLaw: 'This contract shall be governed by the laws of the People\'s Republic of China.',
                    arbitration: 'Disputes shall be resolved through friendly negotiation. If failed, submit to China International Economic and Trade Arbitration Commission (CIETAC) in Xiamen. Arbitration award is final and binding.'
                  },
                  
                  // 签章
                  signature: {
                    sellerSignatory: 'Zhang San (Legal Representative)',
                    buyerSignatory: selectedQuotation.contactPerson || 'Buyer Representative',
                    signDate: selectedQuotation.date
                  }
                }}
              />
            )}
          </div>

          <DialogFooter className="print-hide"> {/* 🔥 打印时隐藏底部按钮 */}
            <Button variant="outline" onClick={() => setShowContractDialog(false)}>
              关闭
            </Button>
            <Button onClick={handleExportContractPDF} disabled={exportingPDF}>
              {exportingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  导出中...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  导出PDF
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 隐藏的PDF模板（用于导出） */}
      <div style={{ position: 'absolute', left: '-9999px' }} className="print-hide">
        <div ref={quotationPDFRef}>
          {selectedQuotation && (
            <QuotationPDFTemplate quotation={selectedQuotation} />
          )}
        </div>
      </div>
    </div>
  );
}
