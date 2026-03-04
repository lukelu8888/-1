import React, { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Checkbox } from '../ui/checkbox';
import { Search, Filter, Eye, Reply, CheckCircle, XCircle, Clock, FileText, AlertCircle, TestTube, ChevronDown, ChevronUp, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { CustomerInquiryView } from '../dashboard/CustomerInquiryView';
import { useInquiry } from '../../contexts/InquiryContext';
import type { RegionType } from '../../utils/xjNumberGenerator';
import { CompactStatCard } from './CompactStatCard';
import { MultiDimensionFilters } from './MultiDimensionFilters';
import { CreateXJFromInquiryDialog } from './CreateXJFromInquiryDialog';
import { CreateQuotationRequestDialog } from './CreateQuotationRequestDialog';
import { useQuotationRequests } from '../../contexts/QuotationRequestContext';
import { usePurchaseRequirements } from '../../contexts/PurchaseRequirementContext';
import { generateQRNumber } from '../../utils/xjNumberGenerator';
import { getCurrentUser } from '../../utils/dataIsolation';
import { extractModelNo, extractSpecification } from '../../utils/productDataExtractor';
import { apiFetchJson } from '../../api/backend-auth';

interface AdminInquiryManagementProps {
  onCreateQuotation?: (inquiry: any) => void;
  onSwitchToCostInquiry?: () => void; // 🔥 新增：切换到成本询报模块的回调
}

export default function AdminInquiryManagement({ onCreateQuotation, onSwitchToCostInquiry }: AdminInquiryManagementProps = {}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [isInquiryDetailOpen, setIsInquiryDetailOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  
  // 🔥 批量选择和删除状态
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // 🔥 创建供应商XJ对话框状态
  const [showXJDialog, setShowXJDialog] = useState(false);
  const [xjInquiry, setXJInquiry] = useState<any>(null);
  
  // 🎯 多维度筛选状态 (老板角色专用)
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterSalesRep, setFilterSalesRep] = useState('all');
  const [filterCustomer, setFilterCustomer] = useState('all');
  const [filterProduct, setFilterProduct] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all'); // 🔥 新增：国家筛选
  const [filterDateRange, setFilterDateRange] = useState('all'); // 🔥 新增：时间段筛选
  
  // 🚀 Use unified InquiryContext - only show submitted inquiries
  const { addInquiry, getSubmittedInquiries, deleteInquiry, refreshInquiries } = useInquiry();
  const inquiries = getSubmittedInquiries();
  
  // 🔍 Debug: Log inquiries data
  useEffect(() => {
    console.log('🔍 [AdminInquiryManagementNew] Current inquiries:', {
      count: inquiries.length,
      inquiries: inquiries.map(inq => ({
        id: inq.id,
        region: inq.region,
        isSubmitted: inq.isSubmitted,
        status: inq.status
      }))
    });
  }, [inquiries]);
  
  // 🔄 组件挂载时主动刷新数据（确保业务员能看到最新数据）
  useEffect(() => {
    console.log('🔄 [AdminInquiryManagementNew] Component mounted, refreshing inquiries...');
    void refreshInquiries().catch(err => {
      console.error('❌ [AdminInquiryManagementNew] Failed to refresh:', err);
    });
  }, [refreshInquiries]);
  
  // 🔥 获取QuotationRequest数据，用于检查是否已下推
  const { getQuotationRequestsByInquiry } = useQuotationRequests();
  
  // 🔥 获取采购需求Context，用于下推成本询报
  const { requirements: purchaseRequirements, addRequirement: addPurchaseRequirement } = usePurchaseRequirements();
  const currentUser = getCurrentUser();
  
  // 🔥 批量删除处理函数
  const handleBulkDelete = () => {
    const visibleSelectedIds = Array.from(selectedIds).filter((id) =>
      filteredInquiries.some((inquiry) => inquiry.id === id),
    );

    if (visibleSelectedIds.length === 0) {
      toast.error('请先选择要删除的询价单');
      return;
    }

    if (window.confirm(`确认要删除选中的 ${visibleSelectedIds.length} 条询价单吗？此操作无法撤销！`)) {
      visibleSelectedIds.forEach(id => {
        deleteInquiry(id);
      });
      setSelectedIds(new Set());
      toast.success(`✅ 已成功删除 ${visibleSelectedIds.length} 条询价单`);
    }
  };

  // 🔥 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredInquiries.map(inq => inq.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  // 🔥 单选处理
  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };
  
  // 🔥 下推成本询报：从INQ创建QR（调用后端API）
  const handlePushToCostInquiry = async (inquiry: any) => {
    console.log('🔽 下推成本询报，询价单号:', inquiry.inquiryNumber);
    
    try {
      // 🔍 调试：检查产品字段
      if (inquiry.products && inquiry.products.length > 0) {
        const firstProduct = inquiry.products[0];
        console.log('📦 第一个产品完整对象:', firstProduct);
        console.log('   - 所有字段名:', Object.keys(firstProduct));
      }
      
      // 准备请求数据
      const requestData = {
        source_inquiry_number: inquiry.inquiryNumber || inquiry.id,
        region: inquiry.region || 'North America',
        required_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        urgency: 'medium',
        special_requirements: inquiry.message || '',
        customer: {
          companyName: inquiry.buyerInfo?.companyName || inquiry.customer?.name || 'N/A',
          contactPerson: inquiry.buyerInfo?.contactPerson || inquiry.customer?.name || 'N/A',
          email: inquiry.buyerInfo?.email || inquiry.customer?.email || inquiry.userEmail || 'N/A',
          phone: inquiry.buyerInfo?.phone || inquiry.customer?.phone || 'N/A',
          mobile: inquiry.buyerInfo?.mobile || '',
          address: inquiry.buyerInfo?.address || inquiry.customer?.address || 'N/A',
          website: inquiry.buyerInfo?.website || '',
          businessType: inquiry.buyerInfo?.businessType || ''
        },
        items: inquiry.products.map((p: any, idx: number) => {
          // 🔥 智能提取 modelNo（与CustomerInquiryView.tsx保持一致）
          const modelNo = extractModelNo(p, idx);
          
          // 🔥 智能提取 specification（支持多种字段名）
          const specification = extractSpecification(p);
          
          return {
            productName: p.productName || p.name || 'Unnamed Product',
            modelNo: modelNo,
            specification: specification,
            quantity: p.quantity || 0,
            unit: p.unit || 'PCS',
            targetPrice: p.unitPrice || p.price || p.targetPrice || 0,
            targetCurrency: 'USD',
            hsCode: p.hsCode || '',
            imageUrl: p.image || p.imageUrl || '',
            remarks: p.notes || p.remarks || ''
          };
        })
      };
      
      console.log('📤 [下推成本询报] 发送请求:', requestData);
      
      // 调用后端API
      const response = await apiFetchJson<{
        id: string;
        requirementNo: string;
        [key: string]: any;
      }>('/api/purchase-requirements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      console.log('✅ [下推成本询报] API响应:', response);
      
      // 同步到本地Context（用于前端显示）
      const newQR = {
        id: response.id,
        requirementNo: response.requirementNo,
        source: response.source || '销售订单',
        sourceInquiryNumber: response.sourceInquiryNumber,
        requiredDate: response.requiredDate,
        urgency: response.urgency || 'medium',
        status: response.status || 'pending',
        createdBy: response.createdBy || currentUser?.email || '',
        createdDate: response.createdDate || new Date().toISOString(),
        region: response.region,
        customer: response.customer,
        items: response.items || [],
        specialRequirements: response.specialRequirements || ''
      };
      
      addPurchaseRequirement(newQR);
      toast.success(`✅ 成功下推到成本询报！采购需求单号：${response.requirementNo}`);
      
      // 🔥 新增：下推成功后自动切换到成本询报模块
      if (onSwitchToCostInquiry) {
        setTimeout(() => {
          onSwitchToCostInquiry();
        }, 500); // 延迟500ms，让用户看到toast提示
      }
    } catch (error: any) {
      console.error('❌ [下推成本询报] 失败:', error);
      toast.error(`❌ 下推失败: ${error.message || '未知错误'}`);
    }
  };

  // 🌍 Get current user region from localStorage
  const [currentUserRegion, setCurrentUserRegion] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  // 🗺️ Region mapping: convert short codes to full names
  const regionCodeToFullName = (code: string | null): string | null => {
    if (!code) return null;
    const mapping: Record<string, string> = {
      'NA': 'North America',
      'SA': 'South America',
      'EA': 'Europe & Africa',
      'EMEA': 'Europe & Africa',
      'north_america': 'North America',
      'south_america': 'South America',
      'europe_africa': 'Europe & Africa',
      '北美': 'North America',
      '南美': 'South America',
      '欧非': 'Europe & Africa',
      'all': 'all'
    };
    return mapping[code] || code;
  };

  useEffect(() => {
    const loadUserInfo = () => {
      const currentUserStr = localStorage.getItem('cosun_current_user');
      if (currentUserStr) {
        try {
          const currentUser = JSON.parse(currentUserStr);
          const fullRegionName = regionCodeToFullName(currentUser.region);
          setCurrentUserRegion(fullRegionName);
          setCurrentUserRole(currentUser.userRole || currentUser.role || null);
        } catch (e) {
          console.error('❌ [AdminInquiry] Failed to parse current user:', e);
        }
      }
    };

    loadUserInfo();

    const handleUserChange = () => {
      loadUserInfo();
    };

    window.addEventListener('userChanged', handleUserChange);
    window.addEventListener('storage', handleUserChange);

    return () => {
      window.removeEventListener('userChanged', handleUserChange);
      window.removeEventListener('storage', handleUserChange);
    };
  }, []);

  // Helper: normalize region for matching (supports both codes and full names)
  const normalizeRegionForMatch = (r: string | null | undefined): string[] => {
    if (!r) return [];
    const s = String(r).trim();
    if (!s || s === 'all') return [];
    
    const variants = [s];
    const map: Record<string, string[]> = {
      'NA': ['North America', 'north-america', 'north_america', '北美'],
      'North America': ['NA', 'north-america', 'north_america', '北美'],
      'north-america': ['NA', 'North America', 'north_america', '北美'],
      'north_america': ['NA', 'North America', 'north-america', '北美'],
      '北美': ['NA', 'North America', 'north-america', 'north_america'],
      'SA': ['South America', 'south-america', 'south_america', '南美'],
      'South America': ['SA', 'south-america', 'south_america', '南美'],
      'south-america': ['SA', 'South America', 'south_america', '南美'],
      'south_america': ['SA', 'South America', 'south-america', '南美'],
      '南美': ['SA', 'South America', 'south-america', 'south_america'],
      'EA': ['Europe & Africa', 'EMEA', 'europe-africa', 'europe_africa', '欧非'],
      'EMEA': ['Europe & Africa', 'EA', 'europe-africa', 'europe_africa', '欧非'],
      'Europe & Africa': ['EA', 'EMEA', 'europe-africa', 'europe_africa', '欧非'],
      'europe-africa': ['EA', 'EMEA', 'Europe & Africa', 'europe_africa', '欧非'],
      'europe_africa': ['EA', 'EMEA', 'Europe & Africa', 'europe-africa', '欧非'],
      '欧非': ['EA', 'EMEA', 'Europe & Africa', 'europe-africa', 'europe_africa'],
    };
    
    const mapped = map[s] || [];
    return [...new Set([...variants, ...mapped])];
  };

  // 🌍 Filter inquiries by user region (supports region code/full name matching)
  const regionFilteredInquiries = (currentUserRole === 'Sales_Rep' || currentUserRole === 'Regional_Manager') && currentUserRegion && currentUserRegion !== 'all'
    ? (() => {
        const userRegionVariants = normalizeRegionForMatch(currentUserRegion);
        return inquiries.filter(inq => {
          // 如果询价的 region 是 null/undefined，允许显示（可能是旧数据或未设置区域）
          if (!inq.region) return true;
          
          // 如果有区域，则进行匹配
          if (!userRegionVariants.length) return true; // no region filter
          const inqRegionVariants = normalizeRegionForMatch(inq.region);
          return userRegionVariants.some(v => inqRegionVariants.includes(v));
        });
      })()
    : inquiries;

  // 🔍 Debug: Log filtering steps
  useEffect(() => {
    console.log('📊 [AdminInquiryManagementNew] Data flow:', {
      '1. inquiries (from getSubmittedInquiries)': inquiries.length,
      '2. regionFilteredInquiries': regionFilteredInquiries.length,
      '3. currentUserRole': currentUserRole,
      '4. currentUserRegion': currentUserRegion,
      '5. sample inquiry ids': inquiries.slice(0, 3).map(inq => inq.id)
    });
  }, [inquiries, regionFilteredInquiries, currentUserRole, currentUserRegion]);

  // Map inquiries to display format
  const displayInquiries = regionFilteredInquiries
    .filter(inq => {
      if (!inq.id) {
        console.warn('⚠️ [AdminInquiryManagementNew] Inquiry missing id:', inq);
        return false;
      }
      const parts = inq.id.split('-');
      const isValid = parts.length >= 4;
      if (!isValid) {
        console.warn('⚠️ [AdminInquiryManagementNew] Inquiry id format invalid:', inq.id, 'parts:', parts.length);
      }
      return isValid;
    })
    .map(inq => ({
      ...inq,
      inquiryNumber: inq.id,
      customer: {
        name: inq.buyerInfo?.companyName || 'N/A',
        email: inq.userEmail || inq.buyerInfo?.email || 'N/A',
        company: inq.buyerInfo?.companyName || 'N/A'
      },
      customerName: inq.buyerInfo?.companyName || 'N/A',
      customerEmail: inq.userEmail || 'N/A',
      subject: `询价 - ${inq.products?.length || 0} 个产品`,
      inquiryDate: inq.date,
      priority: 'Medium'
    }));

  // 🔍 Debug: Log displayInquiries count
  useEffect(() => {
    console.log('📋 [AdminInquiryManagementNew] displayInquiries count:', displayInquiries.length);
  }, [displayInquiries.length]);

  // 🎯 从数据中提取唯一值
  const uniqueRegions = [...new Set(displayInquiries.map(inq => inq.region).filter(Boolean))];
  const uniqueCustomers = [...new Set(displayInquiries.map(inq => inq.customer.name).filter(Boolean))];
  // 🔥 新增：提取业务员和国家列表
  const uniqueSalesReps = [...new Set(displayInquiries.map(inq => inq.salesRepEmail || inq.assignedTo).filter(Boolean))];
  const uniqueCountries = [...new Set(displayInquiries.map(inq => inq.country).filter(Boolean))];

  // Filter logic
  const filteredInquiries = displayInquiries.filter((inquiry) => {
    const matchesSearch = searchTerm === '' || 
      inquiry.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || inquiry.status === filterStatus;
    const matchesRegion = filterRegion === 'all' || inquiry.region === filterRegion;
    const matchesCustomer = filterCustomer === 'all' || inquiry.customer.name === filterCustomer;
    // 🔥 新增：业务员和国家筛选
    const matchesSalesRep = filterSalesRep === 'all' || inquiry.salesRepEmail === filterSalesRep || inquiry.assignedTo === filterSalesRep;
    const matchesCountry = filterCountry === 'all' || inquiry.country === filterCountry;
    
    // 🔥 新增：时间段筛选
    let matchesDateRange = true;
    if (filterDateRange !== 'all' && inquiry.date) {
      const inquiryDate = new Date(inquiry.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch (filterDateRange) {
        case 'today':
          matchesDateRange = inquiryDate >= today;
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          matchesDateRange = inquiryDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          matchesDateRange = inquiryDate >= monthAgo;
          break;
        case 'quarter':
          const quarterAgo = new Date(today);
          quarterAgo.setMonth(quarterAgo.getMonth() - 3);
          matchesDateRange = inquiryDate >= quarterAgo;
          break;
        case 'year':
          const yearAgo = new Date(today);
          yearAgo.setFullYear(yearAgo.getFullYear() - 1);
          matchesDateRange = inquiryDate >= yearAgo;
          break;
      }
    }
    
    return matchesSearch && matchesFilter && matchesRegion && matchesCustomer && matchesSalesRep && matchesCountry && matchesDateRange;
  });

  // 🔍 Debug: Log final filtered count
  useEffect(() => {
    console.log('✅ [AdminInquiryManagementNew] Final filteredInquiries count:', filteredInquiries.length, {
      searchTerm,
      filterStatus,
      filterRegion,
      filterCustomer,
      filterSalesRep,
      filterCountry,
      filterDateRange
    });
  }, [filteredInquiries.length, searchTerm, filterStatus, filterRegion, filterCustomer, filterSalesRep, filterCountry, filterDateRange]);

  const handleStatusChange = (newStatus: string) => {
    if (!selectedInquiry) return;
    toast.success(`询价 ${selectedInquiry.id} 状态已更新为 ${newStatus}`);
  };

  const handleSendReply = () => {
    if (!replyMessage.trim()) {
      toast.error('请输入回复内容');
      return;
    }
    toast.success('回复已发送');
    setReplyMessage('');
  };

  const openInquiryDetail = (inquiry: any) => {
    setSelectedInquiry(inquiry);
    setIsInquiryDetailOpen(true);
  };

  const handleCreateQuotation = () => {
    if (onCreateQuotation && selectedInquiry) {
      onCreateQuotation(selectedInquiry);
    } else {
      toast.success('正在跳转到报价创建页面...');
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: any = {
      draft: { label: '草稿', color: 'bg-slate-100 text-slate-800 border-slate-300' },
      pending: { label: '待处理', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      processing: { label: '处理中', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      quoted: { label: '已报价', color: 'bg-green-100 text-green-800 border-green-300' },
      approved: { label: '已批准', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
      rejected: { label: '已拒绝', color: 'bg-red-100 text-red-800 border-red-300' },
    };
    return configs[status] || { label: status, color: 'bg-gray-100 text-gray-800 border-gray-300' };
  };

  const getPriorityConfig = (priority: string) => {
    const configs: any = {
      High: { label: '高', color: 'bg-red-100 text-red-800 border-red-300' },
      Medium: { label: '中', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      Low: { label: '低', color: 'bg-green-100 text-green-800 border-green-300' },
    };
    return configs[priority] || { label: priority, color: 'bg-gray-100 text-gray-800 border-gray-300' };
  };

  // 计算全选状态
  const isAllSelected = filteredInquiries.length > 0 && selectedIds.size === filteredInquiries.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < filteredInquiries.length;

  useEffect(() => {
    const visibleIds = new Set(filteredInquiries.map((inquiry) => inquiry.id));
    const nextSelected = new Set(Array.from(selectedIds).filter((id) => visibleIds.has(id)));
    if (nextSelected.size !== selectedIds.size) {
      setSelectedIds(nextSelected);
    }
  }, [filteredInquiries, selectedIds]);

  return (
    <div className="space-y-4">
      {/* 🎨 业务统计 */}
      {currentUserRole !== 'Sales_Rep' && (
        <div className="bg-white border border-gray-300 rounded">
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-700 uppercase tracking-wide" style={{ fontSize: '14px' }}>业务统计</h3>
          </div>
          <div className="px-5 py-3 flex items-center gap-8" style={{ fontSize: '12px' }}>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">总询价数:</span>
              <span className="font-semibold text-gray-900">{displayInquiries.length}</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">待处理:</span>
              <span className="font-semibold text-gray-900">{displayInquiries.filter(i => i.status === 'pending').length}</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">处理中:</span>
              <span className="font-semibold text-gray-900">{displayInquiries.filter(i => i.status === 'processing').length}</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">已报价:</span>
              <span className="font-semibold text-orange-600">{displayInquiries.filter(i => i.status === 'quoted').length}</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">完成率:</span>
              <span className="font-semibold text-gray-900">
                {displayInquiries.length > 0 
                  ? Math.round((displayInquiries.filter(i => i.status === 'quoted').length / displayInquiries.length) * 100) 
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 询价表格 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200">
          {/* 🎯 紧凑型单行筛选栏 */}
          <div className="px-5 py-3 bg-gray-50">
            <div className="flex gap-3 items-center">
              {/* 搜索框 */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <Input
                  placeholder="搜索询价单号、客户名称或主题..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              {/* 🔥 批量删除按钮 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkDelete}
                disabled={selectedIds.size === 0}
                className="h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-40"
                style={{ fontSize: '12px' }}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                批量删除 {selectedIds.size > 0 && `(${selectedIds.size})`}
              </Button>

              {/* 状态筛选 */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px] h-9 text-xs bg-white">
                  <SelectValue placeholder="全部状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" style={{ fontSize: '12px' }}>全部状态</SelectItem>
                  <SelectItem value="pending" style={{ fontSize: '12px' }}>待处理</SelectItem>
                  <SelectItem value="processing" style={{ fontSize: '12px' }}>处理中</SelectItem>
                  <SelectItem value="quoted" style={{ fontSize: '12px' }}>已报价</SelectItem>
                  <SelectItem value="rejected" style={{ fontSize: '12px' }}>已拒绝</SelectItem>
                </SelectContent>
              </Select>

              {/* 🎯 老板角色显示额外筛选维度 */}
              {(currentUserRole === 'Boss' || currentUserRole === 'CEO' || currentUserRole === 'Sales_Director') && (
                <>
                  {/* 区域筛选 */}
                  <Select value={filterRegion} onValueChange={setFilterRegion}>
                    <SelectTrigger className="w-[120px] h-9 text-xs bg-white">
                      <SelectValue placeholder="全部区域" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" style={{ fontSize: '12px' }}>全部区域</SelectItem>
                      <SelectItem value="North America" style={{ fontSize: '12px' }}>北美区域</SelectItem>
                      <SelectItem value="South America" style={{ fontSize: '12px' }}>南美区域</SelectItem>
                      <SelectItem value="Europe & Africa" style={{ fontSize: '12px' }}>欧非区域</SelectItem>
                      <SelectItem value="Other" style={{ fontSize: '12px' }}>其它区域</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* 客户筛选 */}
                  <Select value={filterCustomer} onValueChange={setFilterCustomer}>
                    <SelectTrigger className="w-[140px] h-9 text-xs bg-white">
                      <SelectValue placeholder="全部客户" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" style={{ fontSize: '12px' }}>全部客户</SelectItem>
                      {uniqueCustomers.slice(0, 30).map((customer) => (
                        <SelectItem key={customer} value={customer as string} style={{ fontSize: '12px' }}>
                          {customer}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
              
              {/* 🔥 新增：区域主管显示业务员和国家筛选 */}
              {currentUserRole === 'Regional_Manager' && (
                <>
                  {/* 业务员筛选 */}
                  <Select value={filterSalesRep} onValueChange={setFilterSalesRep}>
                    <SelectTrigger className="w-[140px] h-9 text-xs bg-white">
                      <SelectValue placeholder="全部业务员" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" style={{ fontSize: '12px' }}>全部业务员</SelectItem>
                      {uniqueSalesReps.map((salesRep) => (
                        <SelectItem key={salesRep} value={salesRep as string} style={{ fontSize: '12px' }}>
                          {salesRep}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* 国家筛选 */}
                  {uniqueCountries.length > 0 && (
                    <Select value={filterCountry} onValueChange={setFilterCountry}>
                      <SelectTrigger className="w-[120px] h-9 text-xs bg-white">
                        <SelectValue placeholder="全部国家" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" style={{ fontSize: '12px' }}>全部国家</SelectItem>
                        {uniqueCountries.map((country) => (
                          <SelectItem key={country} value={country as string} style={{ fontSize: '12px' }}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {/* 🔥 时间段筛选 */}
                  <Select value={filterDateRange} onValueChange={setFilterDateRange}>
                    <SelectTrigger className="w-[110px] h-9 text-xs bg-white">
                      <SelectValue placeholder="全部时间" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" style={{ fontSize: '12px' }}>全部时间</SelectItem>
                      <SelectItem value="today" style={{ fontSize: '12px' }}>今天</SelectItem>
                      <SelectItem value="week" style={{ fontSize: '12px' }}>近7天</SelectItem>
                      <SelectItem value="month" style={{ fontSize: '12px' }}>近1月</SelectItem>
                      <SelectItem value="quarter" style={{ fontSize: '12px' }}>近3月</SelectItem>
                      <SelectItem value="year" style={{ fontSize: '12px' }}>近1年</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="h-9 w-[60px]" style={{ fontSize: '12px' }}>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="全选"
                    />
                    <span>序号</span>
                  </div>
                </TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>询价单号</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>客户信息</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>主题</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>日期</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>优先级</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>状态</TableHead>
                <TableHead className="h-9 text-center" style={{ fontSize: '12px' }}>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInquiries.map((inquiry, index) => {
                const statusConfig = getStatusConfig(inquiry.status);
                const priorityConfig = getPriorityConfig(inquiry.priority);
                
                const qrs = getQuotationRequestsByInquiry(inquiry.id);
                const hasXJ = qrs.length > 0;
                
                const hasQR = purchaseRequirements.some(qr => 
                  qr.sourceInquiryNumber === (inquiry.inquiryNumber || inquiry.id)
                );
                
                const isSelected = selectedIds.has(inquiry.id);
                
                return (
                  <TableRow key={inquiry.id} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                    <TableCell className="py-3" style={{ fontSize: '12px' }}>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectOne(inquiry.id, checked as boolean)}
                          aria-label={`选择 ${inquiry.id}`}
                        />
                        <span className="text-gray-500">{index + 1}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3" style={{ fontSize: '13px' }}>
                      <button
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                        onClick={() => openInquiryDetail(inquiry)}
                      >
                        {inquiry.id}
                      </button>
                    </TableCell>
                    <TableCell className="py-3" style={{ fontSize: '12px' }}>
                      <div>
                        <p className="font-medium text-gray-900">{inquiry.customer.name}</p>
                        <p className="text-gray-500">{inquiry.customer.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 max-w-xs" style={{ fontSize: '13px' }}>
                      <p className="truncate text-gray-700">{inquiry.subject}</p>
                    </TableCell>
                    <TableCell className="py-3" style={{ fontSize: '12px' }}>
                      <span className="text-gray-600">{inquiry.date}</span>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge className={`h-5 px-2 text-xs border ${priorityConfig.color}`}>
                        {priorityConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge className={`h-5 px-2 text-xs border ${statusConfig.color}`}>
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => openInquiryDetail(inquiry)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          查看
                        </Button>
                        
                        {/* 下推成本询报按钮 */}
                        {hasQR ? (
                          <Button
                            size="sm"
                            className="h-7 px-2 text-xs bg-gray-300 text-gray-500 cursor-not-allowed"
                            disabled
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            已下推成本询报
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700"
                            onClick={() => handlePushToCostInquiry(inquiry)}
                          >
                            <Send className="w-3 h-3 mr-1" />
                            下推成本询报
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isInquiryDetailOpen} onOpenChange={setIsInquiryDetailOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden p-0 gap-0 [&>button]:hidden">
          <DialogTitle className="sr-only">询价单详情</DialogTitle>
          <DialogDescription className="sr-only">
            查看完整的询价单信息和产品详情
          </DialogDescription>
          
          <div className="absolute top-4 right-16 z-50 flex gap-2 print:hidden">
            <Button 
              variant="outline" 
              size="sm"
              className="h-9 text-sm bg-white shadow-lg hover:bg-gray-50"
              onClick={() => {
                document.body.classList.add('printing-inq');
                window.print();
                setTimeout(() => {
                  document.body.classList.remove('printing-inq');
                }, 1000);
              }}
            >
              <FileText className="w-4 h-4 mr-2" />
              打印
            </Button>
          </div>

          <DialogClose asChild>
            <button
              className="absolute right-4 top-4 z-50 w-8 h-8 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition-colors print:hidden"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </DialogClose>

          <div className="overflow-y-auto max-h-[95vh] bg-gray-100">
            {selectedInquiry && (
              <CustomerInquiryView inquiry={selectedInquiry} />
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 🔥 报价请求对话框 */}
      <CreateQuotationRequestDialog
        open={showXJDialog}
        onClose={() => {
          setShowXJDialog(false);
          setXJInquiry(null);
        }}
        inquiry={xjInquiry}
      />
    </div>
  );
}
