import React, { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogClose } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Search, Filter, Eye, Reply, CheckCircle, XCircle, Clock, FileText, AlertCircle, TestTube, ChevronDown, ChevronUp, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { CustomerInquiryView } from '../dashboard/CustomerInquiryView'; // 📋 使用文档中心的专业模板
import { useInquiry } from '../../contexts/InquiryContext'; // 🚀 Use unified context
import { generateDocumentNumber, type RegionType } from '../../utils/xjNumberGenerator';
import { CompactStatCard } from './CompactStatCard'; // 🎨 导入紧凑型统计卡片
import { MultiDimensionFilters } from './MultiDimensionFilters'; // 🎯 多维度筛选组件
import { CreateXJFromInquiryDialog } from './CreateXJFromInquiryDialog'; // 🔥 导入创建XJ对话框
import { CreateQuotationRequestDialog } from './CreateQuotationRequestDialog'; // 🔥 导入报价请求对话框
import { useQuotationRequests } from '../../contexts/QuotationRequestContext'; // 🔥 导入QuotationRequest Context
import { usePurchaseRequirements } from '../../contexts/PurchaseRequirementContext'; // 🔥 导入采购需求Context
import { generateQRNumber } from '../../utils/xjNumberGenerator'; // 🔥 导入QR编号生成
import { useUser } from '../../contexts/UserContext'; // 🔥 从 Supabase Auth 读取当前用户

interface AdminInquiryManagementProps {
  onCreateQuotation?: (inquiry: any) => void;
  onSwitchToCostInquiry?: () => void; // 🔥 新增：切换到成本询报模块的回调
}

export default function AdminInquiryManagement({ onCreateQuotation, onSwitchToCostInquiry }: AdminInquiryManagementProps = {}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState('');
  
  // 🔥 创建供应商XJ对话框状态
  const [showXJDialog, setShowXJDialog] = useState(false);
  const [xjInquiry, setXJInquiry] = useState<any>(null);
  
  // 🎯 多维度筛选状态 (老板角色专用)
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterSalesRep, setFilterSalesRep] = useState('all');
  const [filterCustomer, setFilterCustomer] = useState('all');
  const [filterProduct, setFilterProduct] = useState('all');
  
  // 🚀 Use unified InquiryContext - only show submitted inquiries
  const { addInquiry, getSubmittedInquiries } = useInquiry();
  const inquiries = getSubmittedInquiries();
  
  // 🔥 获取QuotationRequest数据，用于检查是否已下推
  const { getQuotationRequestsByInquiry } = useQuotationRequests();
  
  // 🔥 获取采购需求Context，用于下推成本询报
  const { requirements: purchaseRequirements, addRequirement: addPurchaseRequirement } = usePurchaseRequirements();
  const { user: currentUser } = useUser();
  
  // 🔥 下推成本询报：从INQ创建QR
  const handlePushToCostInquiry = (inquiry: any) => {
    
    const newQR = {
      id: `qr_${Date.now()}`,
      requirementNo: generateQRNumber(inquiry.region || 'North America'),
      source: '销售订单',
      sourceInquiryNumber: inquiry.inquiryNumber || inquiry.id,
      requiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      urgency: 'medium' as const,
      status: 'pending' as const,
      createdBy: currentUser?.email || '',
      createdDate: new Date().toISOString(),
      region: inquiry.region,
      // 🔥 同步客户信息（优先使用buyerInfo，其次使用customer）
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
      // 🔥 同步产品信息（包括图片）
      items: inquiry.products.map((p: any) => ({
        id: p.id,
        productName: p.name,
        modelNo: p.model || '-',
        specification: p.specification || '-',
        quantity: p.quantity,
        unit: p.unit || 'PCS',
        targetPrice: p.price || 0,
        targetCurrency: 'USD',
        hsCode: p.hsCode || '',
        imageUrl: p.image || '', // 🔥 同步产品图片
        remarks: p.notes || ''
      })),
      specialRequirements: inquiry.message || ''
    };
    
    console.log('✅ [下推成本询报] 新建的QR:', newQR);
    console.log('  - customer:', newQR.customer);
    console.log('  - items[0]:', newQR.items[0]);
    
    addPurchaseRequirement(newQR);
    toast.success(`✅ 成功下推到成本询报！采购需求单号：${newQR.requirementNo}`);
    
    // 🔥 新增：下推成功后自动切换到成本询报模块
    if (onSwitchToCostInquiry) {
      setTimeout(() => {
        onSwitchToCostInquiry();
      }, 500); // 延迟500ms，让用户看到toast提示
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
      'EA': 'Europe & Africa',  // ✅ 修正：EA而不是EMEA
      'EMEA': 'Europe & Africa', // 兼容旧数据
      'all': 'all'
    };
    return mapping[code] || code; // Return original if no mapping found
  };

  // 从 Supabase Auth (useUser) 同步用户区域和角色，不依赖 localStorage
  useEffect(() => {
    if (currentUser) {
      const fullRegionName = regionCodeToFullName(currentUser.region || '');
      setCurrentUserRegion(fullRegionName);
      setCurrentUserRole(currentUser.role || currentUser.userRole || null);
    }
  }, [currentUser]);

  // 🧪 Create Test Inquiry Function
  const createTestInquiry = (region: RegionType, customerEmail: string, companyName: string) => {
    const regionCode = region === 'North America' ? 'NA' : region === 'South America' ? 'SA' : 'EA';
    const xjId = generateDocumentNumber('XJ', region);

    const inquiry = {
      id: xjId,
      date: new Date().toISOString().split('T')[0],
      userEmail: customerEmail,
      companyId: `company_${regionCode}_001`,
      products: [
        {
          id: '1',
          name: 'Test Product',
          image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837',
          category: 'Electrical',
          price: 100,
          inStock: true,
          description: 'Test product description',
          quantity: 10,
          totalPrice: 1000
        }
      ],
      status: 'pending' as const,
      isSubmitted: true,
      totalPrice: 1000,
      region: region,
      buyerInfo: {
        companyName: companyName,
        contactPerson: 'Test Contact',
        email: customerEmail,
        phone: '+1234567890',
        address: 'Test Address',
        businessType: 'Retailer'
      },
      shippingInfo: {
        cartons: '10',
        cbm: '2.5',
        totalGrossWeight: '250',
        totalNetWeight: '200'
      },
      message: `Test inquiry from ${region}`,
      createdAt: Date.now(),
      submittedAt: Date.now()
    };

    addInquiry(inquiry);
    return xjId;
  };

  // 🌍 Filter inquiries by user region (for Sales_Rep AND Regional_Manager roles)
  const regionFilteredInquiries = (currentUserRole === 'Sales_Rep' || currentUserRole === 'Regional_Manager') && currentUserRegion && currentUserRegion !== 'all'
    ? inquiries.filter(inq => {
        const inquiryRegion = inq.region;
        const matches = inquiryRegion === currentUserRegion;
        console.log(`🔍 询价 ${inq.id} | 询价区域: \"${inquiryRegion}\" | 用户区域: \"${currentUserRegion}\" | 匹配: ${matches ? '✅' : '❌'}`);
        return matches;
      })
    : inquiries; // CEO, CFO, and Sales_Director can see all inquiries

  console.log(`📊 [区域过滤] 总询价数: ${inquiries.length} | 过滤后: ${regionFilteredInquiries.length} | 用户角色: ${currentUserRole} | 用户区域: ${currentUserRegion}`);

  // 🔥 调试：打印询价单的userEmail信息
  console.log('\n📊 [AdminInquiryManagement] === 询价单userEmail调试 ===');
  regionFilteredInquiries.forEach(inq => {
    console.log(`  - ${inq.id}: userEmail="${inq.userEmail || '❌ 未设置'}" | buyerInfo.email="${inq.buyerInfo?.email || '❌ 未设置'}"`);
  });
  console.log('='.repeat(60) + '\n');

  // Use real inquiries (no fallback sample data needed)
  const displayInquiries = regionFilteredInquiries
    .map(inq => ({
      ...inq,
      inquiryNumber: inq.inquiryNumber || inq.id,
      customer: {
        name: inq.buyerInfo?.companyName || 'N/A',
        email: inq.userEmail || inq.buyerInfo?.email || 'N/A',
        company: inq.buyerInfo?.companyName || 'N/A'
      },
      customerName: inq.buyerInfo?.companyName || 'N/A',
      customerEmail: inq.userEmail || 'N/A',
      subject: `询价 - ${inq.products?.length || 0} 个产品`,
      inquiryDate: inq.date,
      priority: 'Medium' // Default priority
    }));

  // 🔍 调试：检查是否有数据以及region字段
  console.log('🔍 [数据检查] displayInquiries数量:', displayInquiries.length);
  if (displayInquiries.length > 0) {
    console.log('🔍 [数据检查] 第一条询价示例:', {
      id: displayInquiries[0].id,
      region: displayInquiries[0].region,
      customer: displayInquiries[0].customer.name,
      products: displayInquiries[0].products?.map((p: any) => p.name)
    });
  } else {
    console.warn('⚠️ [数据检查] 当前没有询价数据，请先创建测试询价！');
  }

  // 🎯 从数据中提取唯一值用于筛选选项
  const uniqueRegions = [...new Set(displayInquiries.map(inq => inq.region).filter(Boolean))];
  const uniqueCustomers = [...new Set(displayInquiries.map(inq => inq.customer.name).filter(Boolean))];
  const uniqueProducts = [...new Set(
    displayInquiries.flatMap(inq => inq.products?.map((p: any) => p.name) || [])
  )].filter(Boolean);
  const uniqueSalesReps = [...new Set(
    displayInquiries.map(inq => inq.assignedTo).filter(Boolean)
  )]; // 可能为空，因为询价可能未分配

  const filteredInquiries = displayInquiries.filter((inquiry) => {
    const matchesSearch = searchTerm === '' || 
      inquiry.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inquiry.inquiryNumber || inquiry.id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || inquiry.status === filterStatus;
    const matchesRegion = filterRegion === 'all' || inquiry.region === filterRegion;
    const matchesCustomer = filterCustomer === 'all' || inquiry.customer.name === filterCustomer;
    const matchesProduct = filterProduct === 'all' || 
      inquiry.products?.some((p: any) => p.name === filterProduct);
    return matchesSearch && matchesFilter && matchesRegion && matchesCustomer && matchesProduct;
  });

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

  const handleCreateQuotation = () => {
    if (onCreateQuotation && selectedInquiry) {
      onCreateQuotation(selectedInquiry);
    } else {
      toast.success('正在跳转到报价创建页面...');
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: any = {
      // 🔥 修复：使用实际的状态值（来自InquiryContext）
      draft: { label: '草稿', color: 'bg-slate-100 text-slate-800 border-slate-300' },
      pending: { label: '待处理', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      processing: { label: '处理中', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      quoted: { label: '已报价', color: 'bg-green-100 text-green-800 border-green-300' },
      approved: { label: '已批准', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
      rejected: { label: '已拒绝', color: 'bg-red-100 text-red-800 border-red-300' },
      // 兼容旧状态
      New: { label: '新询价', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      Reviewing: { label: '审核中', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      Quoted: { label: '已报价', color: 'bg-green-100 text-green-800 border-green-300' },
      Rejected: { label: '已拒绝', color: 'bg-red-100 text-red-800 border-red-300' },
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

  return (
    <div className="space-y-4">

      {/* 🎨 方案A：台湾大厂原汁原味风格 - SAP/Oracle单行紧凑摘要栏 */}
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
          {/* 🎯 紧凑型单行筛选栏 - 老板角色显示全部筛选，其他角色显示基础筛选 */}
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

              {/* 清除筛选按钮 - 固定位置 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterRegion('all');
                  setFilterCustomer('all');
                }}
                disabled={searchTerm === '' && filterStatus === 'all' && filterRegion === 'all' && filterCustomer === 'all'}
                className="h-9 px-3 text-gray-600 hover:text-orange-600 disabled:opacity-40"
                style={{ fontSize: '12px' }}
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                清除
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
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
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
              {filteredInquiries.map((inquiry) => {
                const statusConfig = getStatusConfig(inquiry.status);
                const priorityConfig = getPriorityConfig(inquiry.priority);
                
                // 🔥 检查该询价是否已下推到QR（创建了报价请求单）
                const qrs = getQuotationRequestsByInquiry(inquiry.id);
                const hasXJ = qrs.length > 0; // 只要存在QR，就表示已下推
                
                // 🔥 检查是否已创建采购需求（成本询报）
                const hasQR = purchaseRequirements.some(qr => 
                  qr.sourceInquiryNumber === (inquiry.inquiryNumber || inquiry.id)
                );
                
                return (
                  <TableRow key={inquiry.id} className="hover:bg-gray-50">
                    <TableCell className="py-3" style={{ fontSize: '13px' }}>
                      {/* 🔥 修复：让询价单号可以点击打开详情 */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                            onClick={() => setSelectedInquiry(inquiry)}
                          >
                            {inquiry.inquiryNumber || inquiry.id}
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden p-0 gap-0 [&>button]:hidden">
                          {/* Hidden Title and Description for accessibility */}
                          <DialogTitle className="sr-only">询价单详情</DialogTitle>
                          <DialogDescription className="sr-only">
                            查看完整的询价单信息和产品详情
                          </DialogDescription>
                          
                          {/* Header with Print button only - Floating on top */}
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

                          {/* Close Button */}
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

                          {/* INQ Document - Full Screen - 仅展示询价单，无管理操作 */}
                          <div className="overflow-y-auto max-h-[95vh] bg-gray-100">
                            {selectedInquiry && (
                              <CustomerInquiryView inquiry={selectedInquiry} />
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
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
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => setSelectedInquiry(inquiry)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              查看
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden p-0 gap-0 [&>button]:hidden">
                            {/* Hidden Title and Description for accessibility */}
                            <DialogTitle className="sr-only">询价单详情</DialogTitle>
                            <DialogDescription className="sr-only">
                              查看完整的询价单信息和产品详情
                            </DialogDescription>
                            
                            {/* Header with Print button - Floating on top */}
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

                            {/* Close Button */}
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

                            {/* INQ Document - Full Screen - 仅展示询价单 */}
                            <div className="overflow-y-auto max-h-[95vh] bg-gray-100">
                              {selectedInquiry && (
                                <CustomerInquiryView inquiry={selectedInquiry} />
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        
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