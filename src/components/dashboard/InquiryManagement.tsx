import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Download, Plus, FileText, Calendar, DollarSign, Package, MapPin, Send, Trash2, ChevronDown, CheckCircle, Clock, CheckCircle2, Edit, ExternalLink, Container, MessageCircle, Phone, Copy, Check, Printer, Workflow, CheckSquare, Square } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Checkbox } from '../ui/checkbox';
import { useInquiry } from '../../contexts/InquiryContext';
import { useUser } from '../../contexts/UserContext';
import { toast } from 'sonner@2.0.3';
import { generateRFQNumber, type RegionType } from '../../utils/rfqNumberGenerator';
import { getCurrentUser } from '../../data/authorizedUsers';
import { getCustomerProfile } from './CustomerProfile';
import { RFQDocumentView } from './RFQDocumentView';
import { CustomerInquiryView } from './CustomerInquiryView'; // 📋 使用文档中心的专业模板
import { UnifiedInquiryDialog } from './UnifiedInquiryDialog';
import { ContainerLoadPlanner } from './ContainerLoadPlanner';
import WorkflowStatusTracker from '../workflow/WorkflowStatusTracker';

export function InquiryManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isWeChatDialogOpen, setIsWeChatDialogOpen] = useState(false);
  const [copiedWeChat, setCopiedWeChat] = useState(false);
  const [rfqZoom, setRfqZoom] = useState(138); // 138% default zoom
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isSaveLocationDialogOpen, setIsSaveLocationDialogOpen] = useState(false);
  const [isContainerPlannerOpen, setIsContainerPlannerOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isNewInquiryOpen, setIsNewInquiryOpen] = useState(false);
  const [deleteInquiryId, setDeleteInquiryId] = useState<string | null>(null); // 🗑️ State for delete confirmation
  const [submitInquiryId, setSubmitInquiryId] = useState<string | null>(null); // 🚀 State for submit confirmation
  
  // 🔥 批量删除功能的状态管理
  const [selectedInquiryIds, setSelectedInquiryIds] = useState<string[]>([]);
  
  const { user } = useUser();
  const { getUserInquiries, getCompanyInquiries, addInquiry, updateInquiry, deleteInquiry, submitInquiry } = useInquiry();

  // Helper function for copying to clipboard
  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
      document.body.removeChild(textArea);
    }
  };

  // 🆕 Get inquiries by company ID (shared across all company users)
  const currentUser = getCurrentUser();
  const companyId = currentUser?.companyId;
  
  // Get inquiries (avoid missing items when companyId/userEmail are inconsistent)
  const byCompany = companyId ? getCompanyInquiries(companyId) : [];
  const byUser = user ? getUserInquiries(user.email) : [];
  const inquiries = (() => {
    const map = new Map<string, any>();
    for (const inq of [...byCompany, ...byUser]) {
      if (!inq?.id) continue;
      map.set(inq.id, inq);
    }
    return Array.from(map.values());
  })();
  
  console.log('🔍 InquiryManagement - 当前用户:', user?.email);
  console.log('🔍 InquiryManagement - 公司ID:', companyId);
  console.log('🔍 InquiryManagement - 公司询价列表:', inquiries);
  console.log('🔍 InquiryManagement - localStorage 数据:', localStorage.getItem('cosun_inquiries'));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-700 border border-gray-300">Draft</Badge>;
      case 'quoted':
        return <Badge className="bg-blue-500">Quoted</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredInquiries = inquiries.filter(inquiry => {
    // Get first product name for search
    const firstProductName = inquiry.products && inquiry.products.length > 0 
      ? inquiry.products[0].productName 
      : '';
    
    const matchesSearch = firstProductName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inquiry.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || inquiry.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleCreateInquiry = (products: any[], additionalInfo?: any) => {
    console.log('🚀 handleCreateInquiry 被调用');
    console.log('📦 产品数据:', products);
    console.log('📋 附加信息:', additionalInfo);
    console.log('👤 当前用户:', user);
    
    if (!user) {
      toast.error('Please log in to create inquiry');
      return;
    }

    // 🌍 Get user's region from logged-in user data
    const currentUser = getCurrentUser();
    const userRegion: RegionType = currentUser?.region || 'North America';

    // 📋 Get buyer info from Customer Profile
    const customerProfile = getCustomerProfile();
    
    // 🆕 Generate unified RFQ number with new format: RFQ-{REGION}-YYMMDD-XXXX
    const rfqNumber = generateRFQNumber(userRegion);
    
    const newInquiry = {
      id: rfqNumber,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      userEmail: user.email,
      companyId: currentUser?.companyId || 'unknown', // 🆕 Add company ID
      region: userRegion, // 🌍 Add region to inquiry
      status: 'draft' as const, // 🔥 未提交时status为draft
      isSubmitted: false, // 🚀 Default to draft (not submitted)
      products: products,
      totalPrice: products.reduce((sum, p) => sum + ((p.targetPrice || 0) * (p.quantity || 0)), 0),
      shippingInfo: {
        cartons: additionalInfo?.cartons || '0',
        cbm: additionalInfo?.cbm || '0',
        totalGrossWeight: additionalInfo?.totalGrossWeight || '0',
        totalNetWeight: additionalInfo?.totalNetWeight || '0',
      },
      message: additionalInfo?.notes || '',
      createdAt: Date.now(),
      // 🆕 Use Customer Profile data for buyer info
      buyerInfo: customerProfile ? {
        companyName: customerProfile.companyName || 'N/A',
        contactPerson: customerProfile.contactPerson || 'N/A',
        email: customerProfile.email || user.email || 'N/A',
        phone: customerProfile.phone || 'N/A',
        mobile: customerProfile.mobile,
        address: customerProfile.address || additionalInfo?.deliveryAddress || 'N/A',
        website: customerProfile.website,
        businessType: customerProfile.businessType || 'Retailer'
      } : {
        companyName: currentUser?.company || 'N/A',
        contactPerson: currentUser?.username || 'N/A',
        email: user.email || 'N/A',
        phone: 'N/A',
        address: additionalInfo?.deliveryAddress || 'N/A',
        businessType: 'Retailer'
      },
    };

    console.log('✅ 新建的询价对象 (使用新RFQ编号格式):', newInquiry);
    
    addInquiry(newInquiry);
    
    console.log('💾 addInquiry 调用完成');
    
    toast.success(`Inquiry ${rfqNumber} created successfully!`);
    setIsNewInquiryOpen(false);
  };

  // 🔥 批量删除功能
  const handleToggleSelectInquiry = (inquiryId: string) => {
    setSelectedInquiryIds(prev => 
      prev.includes(inquiryId) 
        ? prev.filter(id => id !== inquiryId)
        : [...prev, inquiryId]
    );
  };

  const handleToggleSelectAll = () => {
    // 🔥 允许选择所有状态的询价单（包括pending、draft、quoted等）
    // 只排除已经转化为订单的approved状态
    const selectableInquiries = filteredInquiries.filter(inq => inq.status !== 'approved');
    if (selectedInquiryIds.length === selectableInquiries.length && selectableInquiries.length > 0) {
      setSelectedInquiryIds([]);
    } else {
      setSelectedInquiryIds(selectableInquiries.map(inq => inq.id));
    }
  };

  const handleBatchDelete = () => {
    if (selectedInquiryIds.length === 0) {
      toast.error('Please select inquiries to delete');
      return;
    }

    const confirmMessage = `Delete ${selectedInquiryIds.length} selected inquiries? This action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      selectedInquiryIds.forEach(id => {
        deleteInquiry(id);
      });

      toast.success(
        <div className="space-y-1">
          <p className="font-semibold">🗑️ Batch Delete Successful!</p>
          <p className="text-sm">Deleted {selectedInquiryIds.length} inquiries</p>
        </div>,
        { duration: 3000 }
      );

      setSelectedInquiryIds([]);
    }
  };

  // 🔥 切换筛选时清空选中状态
  useEffect(() => {
    setSelectedInquiryIds([]);
  }, [filterStatus]);

  return (
    <div className="space-y-6 pb-6" style={{ fontFamily: 'var(--hd-font)' }}>
      {/* ========== Home Depot Style - Inquiry Statistics Cards ========== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inquiries */}
        <div className="bg-white border-2 border-gray-200 rounded-sm shadow-sm p-5 hover:border-[#F96302] transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="text-gray-600 uppercase tracking-wide mb-2 text-[10px]" style={{ fontWeight: 500, letterSpacing: '0.5px' }}>
                Total Inquiries
              </div>
              <div className="text-gray-900 text-3xl" style={{ fontWeight: 700, lineHeight: 1 }}>
                {inquiries.length}
              </div>
              <div className="text-gray-500 mt-1.5 text-[11px]" style={{ fontWeight: 400 }}>
                All inquiry records
              </div>
            </div>
            <div className="bg-[#0D3B66] w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0 group-hover:bg-[#0A2F52] transition-colors">
              <FileText className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white border-2 border-gray-200 rounded-sm shadow-sm p-5 hover:border-[#F96302] transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="text-gray-600 uppercase tracking-wide mb-2 text-[10px]" style={{ fontWeight: 500, letterSpacing: '0.5px' }}>
                Pending
              </div>
              <div className="text-gray-900 text-3xl" style={{ fontWeight: 700, lineHeight: 1 }}>
                {inquiries.filter(i => i.status === 'pending').length}
              </div>
              <div className="text-gray-500 mt-1.5 text-[11px]" style={{ fontWeight: 400 }}>
                Awaiting supplier response
              </div>
            </div>
            <div className="bg-[#F59E0B] w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0 group-hover:bg-[#D97706] transition-colors">
              <Clock className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Quoted */}
        <div className="bg-white border-2 border-gray-200 rounded-sm shadow-sm p-5 hover:border-[#F96302] transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="text-gray-600 uppercase tracking-wide mb-2 text-[10px]" style={{ fontWeight: 500, letterSpacing: '0.5px' }}>
                Quoted
              </div>
              <div className="text-gray-900 text-3xl" style={{ fontWeight: 700, lineHeight: 1 }}>
                {inquiries.filter(i => i.status === 'quoted').length}
              </div>
              <div className="text-gray-500 mt-1.5 text-[11px]" style={{ fontWeight: 400 }}>
                Received quotations
              </div>
            </div>
            <div className="bg-[#2E7D32] w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0 group-hover:bg-[#256428] transition-colors">
              <CheckCircle2 className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Approved */}
        <div className="bg-white border-2 border-gray-200 rounded-sm shadow-sm p-5 hover:border-[#F96302] transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="text-gray-600 uppercase tracking-wide mb-2 text-[10px]" style={{ fontWeight: 500, letterSpacing: '0.5px' }}>
                Approved
              </div>
              <div className="text-gray-900 text-3xl" style={{ fontWeight: 700, lineHeight: 1 }}>
                {inquiries.filter(i => i.status === 'approved').length}
              </div>
              <div className="text-gray-500 mt-1.5 text-[11px]" style={{ fontWeight: 400 }}>
                Converted to orders
              </div>
            </div>
            <div className="bg-[#6B46C1] w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0 group-hover:bg-[#5A3BA5] transition-colors">
              <Package className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>

      {/* Inquiries Table */}
      <div className="bg-white border-2 border-gray-200 rounded-sm shadow-sm">
        <div className="border-b-2 border-gray-200">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-[#F96302]" strokeWidth={2.5} />
              <h3 className="text-gray-900 uppercase tracking-wide" style={{ fontSize: '14px', fontWeight: 600 }}>Inquiry List</h3>
            </div>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => setIsNewInquiryOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Inquiry
            </Button>
          </div>
        </div>
        <div className="p-5">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search inquiries by ID or product name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
                className={filterStatus === 'all' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                All
              </Button>
              <Button
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('pending')}
                className={filterStatus === 'pending' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                Pending
              </Button>
              <Button
                variant={filterStatus === 'quoted' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('quoted')}
                className={filterStatus === 'quoted' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                Quoted
              </Button>
              <Button
                variant={filterStatus === 'approved' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('approved')}
                className={filterStatus === 'approved' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                Approved
              </Button>
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="overflow-x-auto">
            {/* 🔥 批量操作工具栏 */}
            {selectedInquiryIds.length > 0 && (
              <div className="mb-4 px-5 py-3 bg-blue-50 border border-blue-200 rounded-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-900" style={{ fontWeight: 500 }}>
                      Selected <span className="font-bold">{selectedInquiryIds.length}</span> inquiries
                    </span>
                    <button
                      onClick={() => setSelectedInquiryIds([])}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Clear Selection
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 gap-2"
                      onClick={handleBatchDelete}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Batch Delete ({selectedInquiryIds.length})
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={filteredInquiries.filter(inq => inq.status !== 'approved').length > 0 && selectedInquiryIds.length === filteredInquiries.filter(inq => inq.status !== 'approved').length}
                      onCheckedChange={handleToggleSelectAll}
                      disabled={filteredInquiries.filter(inq => inq.status !== 'approved').length === 0}
                    />
                  </TableHead>
                  <TableHead className="font-bold" style={{ fontSize: '14px' }}>Inquiry #</TableHead>
                  <TableHead className="font-bold" style={{ fontSize: '14px' }}>Date</TableHead>
                  <TableHead className="font-bold" style={{ fontSize: '14px' }}>Product</TableHead>
                  <TableHead className="font-bold" style={{ fontSize: '14px' }}>Quantity</TableHead>
                  <TableHead className="font-bold" style={{ fontSize: '14px' }}>Price</TableHead>
                  <TableHead className="font-bold" style={{ fontSize: '14px' }}>Status</TableHead>
                  <TableHead className="font-bold text-right" style={{ fontSize: '14px' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInquiries.map((inquiry, index) => {
                  // Calculate totals from products
                  const firstProduct = inquiry.products && inquiry.products[0];
                  const totalItems = inquiry.products?.reduce((sum: number, p: any) => sum + p.quantity, 0) || 0;
                  const productSummary = inquiry.products && inquiry.products.length > 1 
                    ? `${firstProduct?.productName} +${inquiry.products.length - 1} more`
                    : firstProduct?.productName || 'N/A';
                  
                  return (
                    <TableRow key={`${inquiry.id}-${index}`} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedInquiryIds.includes(inquiry.id)}
                          onCheckedChange={() => handleToggleSelectInquiry(inquiry.id)}
                          disabled={inquiry.status === 'approved'}
                        />
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-bold text-gray-900">
                          {inquiry.id}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700">{inquiry.date}</TableCell>
                      <TableCell className="text-xs font-medium text-gray-900 max-w-xs truncate">
                        {productSummary}
                      </TableCell>
                      <TableCell className="text-xs text-gray-700">{totalItems} pcs</TableCell>
                      <TableCell className="text-xs font-medium text-gray-900">${inquiry.totalPrice?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell className="text-xs">
                        {/* 🔥 只显示一个状态：未提交显示Draft，已提交显示实际状态 */}
                        {!inquiry.isSubmitted ? (
                          <Badge className="bg-gray-100 text-gray-700 border border-gray-300">
                            Draft
                          </Badge>
                        ) : (
                          getStatusBadge(inquiry.status)
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center justify-end gap-2">
                          {/* 🚀 Submit Button - Only show for draft inquiries */}
                          {!inquiry.isSubmitted && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => setSubmitInquiryId(inquiry.id)}
                              title="Submit Inquiry to Admin"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedInquiry(inquiry);
                              setIsDetailOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            onClick={() => {
                              setSelectedInquiry(inquiry);
                              setIsContainerPlannerOpen(true);
                            }}
                            title="Container Load Planner"
                          >
                            <Container className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedInquiry(inquiry);
                              setIsEditMode(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => setIsWeChatDialogOpen(true)}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 text-green-700 hover:text-green-800 hover:bg-green-50"
                            onClick={() => window.open('https://wa.me/+8618650185221', '_blank')}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          {/* 🗑️ Delete Button - Only show for draft inquiries */}
                          {!inquiry.isSubmitted && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setDeleteInquiryId(inquiry.id)}
                            >
                              <Trash2 className="h-4 w-4" />
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
      </div>

      {filteredInquiries.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">No inquiries found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </CardContent>
        </Card>
      )}

      {/* Inquiry Detail Dialog - 简化版：只显示询价单文档 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
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
                document.body.classList.add('printing-rfq');
                window.print();
                setTimeout(() => {
                  document.body.classList.remove('printing-rfq');
                }, 1000);
              }}
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>

          {/* Close Button */}
          <button
            onClick={() => setIsDetailOpen(false)}
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

          {/* RFQ Document - 仅展示询价单，无Tab、无工作流 */}
          <div className="overflow-y-auto max-h-[95vh] bg-gray-100">
            {selectedInquiry && (
              <CustomerInquiryView inquiry={selectedInquiry} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* WeChat Contact Dialog */}
      <Dialog open={isWeChatDialogOpen} onOpenChange={setIsWeChatDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              Contact via WeChat
            </DialogTitle>
            <DialogDescription>
              Add us on WeChat to discuss your inquiry
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {/* WeChat ID Section */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <Label className="text-gray-700 font-medium mb-2 block">WeChat ID</Label>
              <div className="flex items-center gap-2">
                <Input
                  value="COSUN_Building"
                  readOnly
                  className="bg-white font-mono text-lg"
                />
                <Button
                  variant={copiedWeChat ? "default" : "outline"}
                  className={copiedWeChat ? "bg-green-600 hover:bg-green-700" : ""}
                  onClick={() => {
                    copyToClipboard('COSUN_Building');
                    setCopiedWeChat(true);
                    toast.success('WeChat ID copied to clipboard!');
                    setTimeout(() => setCopiedWeChat(false), 2000);
                  }}
                >
                  {copiedWeChat ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                <strong className="text-gray-900">How to add us:</strong>
              </p>
              <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                <li>Open WeChat on your mobile device</li>
                <li>Tap the "+" icon in the top right corner</li>
                <li>Select "Add Contacts"</li>
                <li>Paste the WeChat ID: <span className="font-mono font-medium text-gray-900">COSUN_Building</span></li>
                <li>Send us a message about your inquiry</li>
              </ol>
            </div>

            {/* Quick Contact Info */}
            <div className="border-t pt-4">
              <p className="text-xs text-gray-500">
                Available: Monday - Friday, 9:00 AM - 6:00 PM (GMT+8)
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsWeChatDialogOpen(false)}>
                Close
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  copyToClipboard('COSUN_Building');
                  setCopiedWeChat(true);
                  toast.success('WeChat ID copied! Open WeChat to add us.');
                  setTimeout(() => setCopiedWeChat(false), 2000);
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy & Open WeChat
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Location Dialog */}
      <Dialog open={isSaveLocationDialogOpen} onOpenChange={setIsSaveLocationDialogOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Download className="h-5 w-5 text-red-600" />
              Choose Save Location
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Where would you like to save the PDF file?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-6 mb-4">
            {/* Local Save Option */}
            <button
              onClick={async () => {
                if (!selectedInquiry) return;
                
                setIsDownloadingPDF(true);
                setIsSaveLocationDialogOpen(false);
                
                try {
                  // Get the RFQ content
                  const rfqContent = document.querySelector('[data-rfq-content]');
                  if (!rfqContent) {
                    throw new Error('RFQ content not found');
                  }
                  
                  // Create a print-optimized clone
                  const printWindow = window.open('', '_blank', 'width=800,height=600');
                  if (!printWindow) {
                    throw new Error('Please allow pop-ups');
                  }
                  
                  // Get all stylesheets
                  const styles = Array.from(document.styleSheets)
                    .map(styleSheet => {
                      try {
                        return Array.from(styleSheet.cssRules)
                          .map(rule => rule.cssText)
                          .join('\n');
                      } catch (e) {
                        return '';
                      }
                    })
                    .join('\n');
                  
                  // Clone the content
                  const clone = rfqContent.cloneNode(true) as HTMLElement;
                  
                  // Remove print:hidden elements
                  const hiddenElements = clone.querySelectorAll('.print\\:hidden');
                  hiddenElements.forEach(el => el.remove());
                  
                  // Show print:block elements
                  const printBlockElements = clone.querySelectorAll('.print\\:block');
                  printBlockElements.forEach(el => {
                    (el as HTMLElement).style.display = 'block';
                  });
                  
                  // Write to print window
                  printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <meta charset="UTF-8">
                        <title>RFQ-${selectedInquiry.id}</title>
                        <style>
                          ${styles}
                          
                          @page {
                            size: A4;
                            margin: 15mm;
                          }
                          
                          body {
                            margin: 0;
                            padding: 20mm;
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            background: white;
                          }
                          
                          * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            color-adjust: exact !important;
                          }
                          
                          .print\\:hidden {
                            display: none !important;
                          }
                          
                          .print\\:block {
                            display: block !important;
                          }
                        </style>
                      </head>
                      <body>
                        ${clone.innerHTML}
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                  
                  // Wait for content to load
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  
                  // Trigger print (user can save as PDF)
                  printWindow.print();
                  
                  // Show success message
                  toast.success('Print dialog opened! Select "Save as PDF" and choose your local folder.');
                  
                  // Close window after print
                  printWindow.onafterprint = () => {
                    printWindow.close();
                  };
                  
                  // Auto close after 60 seconds if not printed
                  setTimeout(() => {
                    if (!printWindow.closed) {
                      printWindow.close();
                    }
                  }, 60000);
                  
                } catch (error) {
                  console.error('PDF generation error:', error);
                  toast.error('Failed to generate PDF. Please try again.');
                } finally {
                  setTimeout(() => setIsDownloadingPDF(false), 2000);
                }
              }}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-red-600 hover:bg-red-50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-red-100 flex-shrink-0">
                  <Download className="h-6 w-6 text-gray-600 group-hover:text-red-600" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-gray-900 group-hover:text-red-600 mb-1">Save to Local</h3>
                  <p className="text-sm text-gray-600">Download PDF to your computer's local storage</p>
                </div>
              </div>
            </button>

            {/* Cloud Save Option */}
            <button
              onClick={() => {
                toast.info('Cloud save feature coming soon! Please use "Save to Local" for now.');
                setIsSaveLocationDialogOpen(false);
              }}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-100 flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-600 group-hover:text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-gray-900 group-hover:text-blue-600 mb-1">Save to Cloud</h3>
                  <p className="text-sm text-gray-600">Upload to Google Drive, OneDrive, or Dropbox</p>
                </div>
              </div>
            </button>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setIsSaveLocationDialogOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Inquiry Method Selection Dialog */}
      <UnifiedInquiryDialog 
        isOpen={isNewInquiryOpen}
        onClose={() => setIsNewInquiryOpen(false)}
        onCreateInquiry={handleCreateInquiry}
      />

      {/* Container Load Planner Dialog */}
      <ContainerLoadPlanner 
        isOpen={isContainerPlannerOpen}
        onClose={() => setIsContainerPlannerOpen(false)}
        inquiry={selectedInquiry}
        onSaveQuantities={(updatedProducts) => {
          if (selectedInquiry) {
            const totalPrice = updatedProducts.reduce((sum, p) => sum + ((p.targetPrice || 0) * (p.quantity || 0)), 0);
            updateInquiry(selectedInquiry.id, {
              products: updatedProducts,
              totalPrice,
            });
          }
        }}
      />

      {/* Edit Inquiry Dialog - Uses UnifiedInquiryDialog in edit mode */}
      <UnifiedInquiryDialog 
        isOpen={isEditMode}
        onClose={() => {
          setIsEditMode(false);
          setSelectedInquiry(null);
        }}
        onCreateInquiry={handleCreateInquiry}
        editMode={true}
        existingInquiry={selectedInquiry}
        onUpdateInquiry={(updatedData) => {
          if (selectedInquiry) {
            const totalPrice = updatedData.products.reduce(
              (sum: number, p: any) => sum + ((p.targetPrice || 0) * (p.quantity || 0)), 
              0
            );
            
            updateInquiry(selectedInquiry.id, {
              products: updatedData.products,
              message: updatedData.notes,
              deliveryAddress: updatedData.deliveryAddress,
              totalPrice,
            });
            
            toast.success(`Inquiry ${selectedInquiry.id} updated successfully!`);
            setIsEditMode(false);
            setSelectedInquiry(null);
          }
        }}
      />

      {/* 🗑️ Delete Confirmation Dialog */}
      <Dialog open={!!deleteInquiryId} onOpenChange={(open) => !open && setDeleteInquiryId(null)}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete Inquiry
            </DialogTitle>
            <DialogDescription className="text-base">
              Delete this inquiry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-6">
            <p className="text-sm text-red-800">
              <strong>Inquiry ID:</strong> {deleteInquiryId}
            </p>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteInquiryId(null)}>
              Cancel
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (deleteInquiryId) {
                  deleteInquiry(deleteInquiryId);
                  toast.success(`Inquiry deleted successfully!`);
                  setDeleteInquiryId(null);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 🚀 Submit Confirmation Dialog */}
      <Dialog open={!!submitInquiryId} onOpenChange={(open) => !open && setSubmitInquiryId(null)}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Send className="h-5 w-5 text-blue-600" />
              Submit Inquiry
            </DialogTitle>
            <DialogDescription className="text-base">
              Submit this inquiry for quotation? Once submitted, it cannot be deleted or edited.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-6">
            <p className="text-sm text-blue-800">
              <strong>Inquiry ID:</strong> {submitInquiryId}
            </p>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setSubmitInquiryId(null)}>
              Cancel
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                if (submitInquiryId) {
                  submitInquiry(submitInquiryId);
                  toast.success(`Inquiry submitted successfully!`);
                  setSubmitInquiryId(null);
                }
              }}
            >
              <Send className="h-4 w-4 mr-2" />
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}