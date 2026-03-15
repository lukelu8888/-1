import React, { useMemo, useState } from 'react';
import { Search, Filter, Eye, Download, Plus, FileText, Calendar, DollarSign, Package, MapPin, Send, Trash2, ChevronDown, CheckCircle, Clock, CheckCircle2, Edit, ExternalLink, Container, MessageCircle, Phone, Copy, Check, Printer, Workflow, CheckSquare, Square } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Checkbox } from '../ui/checkbox';
import { useInquiry } from '../../contexts/InquiryContext';
import { useUser } from '../../contexts/UserContext';
import { toast } from 'sonner@2.0.3';
import { REGION_CODES, type RegionType } from '../../utils/xjNumberGenerator';
import { getCurrentUser } from '../../data/authorizedUsers';
import { getCustomerProfile } from './CustomerProfile';
import { CustomerInquiryView } from './CustomerInquiryView';
import { UnifiedInquiryDialog } from './UnifiedInquiryDialog';
import { ContainerLoadPlanner } from './ContainerLoadPlanner';
import WorkflowStatusTracker from '../workflow/WorkflowStatusTracker';
import { filterNotDeleted } from '../../lib/erp-core/deletion-tombstone';
import { canDeleteInquiry } from '../../lib/erp-core/delete-guard';
import { resolveDisplayNumber } from '../../lib/erp-core/number-display';
import { adaptInquiryToDocumentData } from '../../utils/documentDataAdapters';
import { oemAttachmentStorage } from '../../lib/storageService';
import { aggregateInquiryOemFromProducts, normalizeOemData, serializeOemDataForPersistence } from '../../types/oem';

const withTimeout = async <T,>(task: Promise<T>, timeoutMs: number, message: string): Promise<T> => {
  return Promise.race([
    task,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
};

const MY_PRODUCTS_AUTO_OPEN_INQUIRY_KEY = 'my_products_open_new_inquiry';

export function InquiryManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isWeChatDialogOpen, setIsWeChatDialogOpen] = useState(false);
  const [copiedWeChat, setCopiedWeChat] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isSaveLocationDialogOpen, setIsSaveLocationDialogOpen] = useState(false);
  const [isContainerPlannerOpen, setIsContainerPlannerOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isNewInquiryOpen, setIsNewInquiryOpen] = useState(false);
  const [deleteInquiryId, setDeleteInquiryId] = useState<string | null>(null); // 🗑️ State for delete confirmation
  const [submitInquiryId, setSubmitInquiryId] = useState<string | null>(null); // 🚀 State for submit confirmation
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  // 🔥 批量删除功能的状态管理
  const [selectedInquiryIds, setSelectedInquiryIds] = useState<string[]>([]);
  
  const { user } = useUser();
  const { inquiries: contextInquiries, addInquiry, updateInquiry, deleteInquiry, submitInquiry, refreshInquiries } = useInquiry();

  const resolvedCurrentUser = useMemo(() => {
    const legacyUser = getCurrentUser() as any;
    if (legacyUser?.email && legacyUser?.companyId) {
      return legacyUser;
    }

    if (typeof window === 'undefined') {
      return legacyUser ?? null;
    }

    try {
      const backendUser = JSON.parse(localStorage.getItem('cosun_backend_user') || 'null');
      const authUser = JSON.parse(localStorage.getItem('cosun_auth_user') || 'null');
      const customerProfile = JSON.parse(localStorage.getItem('cosun_customer_profile') || 'null');

      return {
        ...legacyUser,
        email: legacyUser?.email || backendUser?.email || user?.email || authUser?.email || '',
        username: legacyUser?.username || backendUser?.username || authUser?.name || customerProfile?.contactPerson || '',
        company: legacyUser?.company || customerProfile?.companyName || backendUser?.company || '',
        companyId:
          legacyUser?.companyId ||
          backendUser?.companyId ||
          authUser?.companyId ||
          customerProfile?.companyId ||
          null,
        region: legacyUser?.region || user?.region || backendUser?.region || authUser?.region || 'North America',
      };
    } catch {
      return {
        ...legacyUser,
        email: legacyUser?.email || user?.email || '',
        username: legacyUser?.username || user?.name || '',
        companyId: legacyUser?.companyId || null,
        region: legacyUser?.region || user?.region || 'North America',
      };
    }
  }, [user]);

  React.useEffect(() => {
    void refreshInquiries().catch(() => {});
    // `refreshInquiries` is recreated by the provider on each render.
    // Depending on it here turns the page mount fetch into a render loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const tryOpenMyProductsInquiry = () => {
      try {
        if (localStorage.getItem(MY_PRODUCTS_AUTO_OPEN_INQUIRY_KEY) !== '1') {
          return;
        }
        localStorage.removeItem(MY_PRODUCTS_AUTO_OPEN_INQUIRY_KEY);
        setIsNewInquiryOpen(true);
      } catch {
        // Keep the flow resilient if storage is unavailable.
      }
    };

    tryOpenMyProductsInquiry();
    window.addEventListener('my-products-open-inquiry-dialog', tryOpenMyProductsInquiry as EventListener);
    window.addEventListener('storage', tryOpenMyProductsInquiry);
    return () => {
      window.removeEventListener('my-products-open-inquiry-dialog', tryOpenMyProductsInquiry as EventListener);
      window.removeEventListener('storage', tryOpenMyProductsInquiry);
    };
  }, []);

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

  const currentUser = resolvedCurrentUser;
  const inquiries = Array.isArray(contextInquiries) ? contextInquiries : [];
  
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

  const visibleInquiries = filterNotDeleted('ing', inquiries, (inquiry) => [
    String(inquiry?.id || ''),
  ]);

  const filteredInquiries = visibleInquiries.filter(inquiry => {
    // Get first product name for search
    const firstProductName = inquiry.products && inquiry.products.length > 0 
      ? inquiry.products[0].productName 
      : '';
    
    const matchesSearch = firstProductName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inquiry.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || inquiry.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const findInquiryByReference = (referenceId: string | null) => {
    if (!referenceId) return null;
    return inquiries.find((inquiry) => {
      const inquiryNumber = String((inquiry as any)?.inquiryNumber || '');
      return inquiry.id === referenceId || inquiryNumber === referenceId;
    }) || null;
  };

  const getInquiryDisplayReference = (referenceId: string | null) => {
    const inquiry = findInquiryByReference(referenceId);
    if (!inquiry) {
      return {
        internalNo: referenceId || '-',
        externalNo: null as string | null,
      };
    }

    const internalNo = String((inquiry as any)?.inquiryNumber || inquiry.id);
    const numberDisplay = resolveDisplayNumber({
      domain: 'ing',
      internalNo,
      companyId: currentUser?.companyId ? String(currentUser.companyId) : undefined,
    });

    return {
      internalNo,
      externalNo: numberDisplay.externalNo || null,
    };
  };

  const deleteInquiryDisplay = getInquiryDisplayReference(deleteInquiryId);
  const submitInquiryDisplay = getInquiryDisplayReference(submitInquiryId);

  const preparePersistedOemData = async (storageKey: string, oemInput?: any) => {
    if (!oemInput) return undefined;

    const normalizedOemData = normalizeOemData(oemInput);
    if (!normalizedOemData.enabled) {
      return serializeOemDataForPersistence(normalizedOemData);
    }

    const uploadedFiles = await Promise.all(
      normalizedOemData.files.map(async (file: any) => {
        if (!file.fileObject) {
          return {
            ...file,
            uploadStatus: file.storageUrl ? 'uploaded' : file.uploadStatus || 'local',
            fileObject: null,
          };
        }

        const uploadResult = await oemAttachmentStorage.upload(file.fileObject, storageKey, user?.email || 'unknown@customer');
        return {
          ...file,
          uploadStatus: 'uploaded' as const,
          storageBucket: 'oem-attachments',
          storagePath: uploadResult.path,
          storageUrl: uploadResult.url,
          uploadedAt: uploadResult.uploadedAt,
          fileObject: null,
        };
      }),
    );

    return serializeOemDataForPersistence({
      ...normalizedOemData,
      files: uploadedFiles,
    });
  };

  const preparePersistedProductsWithOem = async (storageKey: string, products: any[] = []) => {
    const persistedProducts = await Promise.all(
      (products || []).map(async (product) => {
        if (!product?.oem?.enabled) {
          return product;
        }

        const persistedOem = await preparePersistedOemData(storageKey, product.oem);
        return {
          ...product,
          oem: persistedOem,
        };
      }),
    );

    return persistedProducts;
  };

  const handleCreateInquiry = async (products: any[], additionalInfo?: any) => {
    if (!user) {
      toast.error('Please log in to create inquiry');
      return;
    }

    const currentUser = getCurrentUser();
    const userRegion: RegionType = currentUser?.region || 'North America';
    const regionCode = REGION_CODES[userRegion] || 'NA';
    const customerProfile = getCustomerProfile();

    const newInquiry = {
      id: crypto.randomUUID(),
      inquiryNumber: '',
      date: new Date().toISOString().split('T')[0],
      userEmail: user.email,
      companyId: currentUser?.companyId || null,
      region: regionCode,
      status: 'draft' as const,
      isSubmitted: false,
      products: products,
      totalPrice: products.reduce((sum, p) => sum + ((p.targetPrice || 0) * (p.quantity || 0)), 0),
      shippingInfo: {
        cartons: additionalInfo?.cartons || '0',
        cbm: additionalInfo?.cbm || '0',
        totalGrossWeight: additionalInfo?.totalGrossWeight || '0',
        totalNetWeight: additionalInfo?.totalNetWeight || '0',
      },
      requirements: additionalInfo?.requirements || undefined,
      oem: undefined,
      message: additionalInfo?.notes || '',
      createdAt: Date.now(),
      buyerInfo: customerProfile ? {
        companyName: customerProfile.companyName || currentUser?.company || user.email || 'N/A',
        contactPerson: customerProfile.contactPerson || currentUser?.username || user.email || 'N/A',
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
    (newInquiry as any).templateSnapshot = { pendingResolution: true };
    (newInquiry as any).documentRenderMeta = null;

    try {
      newInquiry.products = await preparePersistedProductsWithOem(newInquiry.id, products);
      newInquiry.oem = aggregateInquiryOemFromProducts(newInquiry.products);
      (newInquiry as any).documentDataSnapshot = adaptInquiryToDocumentData(newInquiry as any);
      const savedInquiry = await addInquiry(newInquiry as any);
      toast.success(`Inquiry ${savedInquiry.inquiryNumber || savedInquiry.id} created successfully!`);
      setIsNewInquiryOpen(false);
    } catch (err) {
      console.error('❌ handleCreateInquiry failed:', err);
      const message = err instanceof Error ? err.message : 'Failed to create inquiry — check console for details';
      toast.error(message);
    }
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
    const selectableInquiries = filteredInquiries.filter((inq) => canDeleteInquiry(inq));
    if (selectedInquiryIds.length === selectableInquiries.length && selectableInquiries.length > 0) {
      setSelectedInquiryIds([]);
    } else {
      setSelectedInquiryIds(selectableInquiries.map(inq => inq.id));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedInquiryIds.length === 0) {
      toast.error('Please select inquiries to delete');
      return;
    }

    const confirmMessage = `Hide ${selectedInquiryIds.length} selected inquiries from your current view? This will not remove the original inquiry record.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await Promise.all(selectedInquiryIds.map((id) => deleteInquiry(id)));
        toast.success(
          <div className="space-y-1">
            <p className="font-semibold">🗑️ Batch Delete Successful!</p>
            <p className="text-sm">Hidden {selectedInquiryIds.length} inquiries from your current view</p>
          </div>,
          { duration: 3000 }
        );
        setSelectedInquiryIds([]);
      } catch (error: any) {
        toast.error(error?.message || 'Failed to delete inquiries');
      }
    }
  };

  const handleFilterStatusChange = (status: string) => {
    setFilterStatus(status);
    setSelectedInquiryIds([]);
  };

  return (
    <div className="space-y-6 pb-6" style={{ fontFamily: 'var(--hd-font)' }}>
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
              {selectedInquiryIds.length > 0 && (
                <Button
                  variant="destructive"
                  className="gap-2"
                  onClick={handleBatchDelete}
                >
                  <Trash2 className="w-4 h-4" />
                  Batch Delete ({selectedInquiryIds.length})
                </Button>
              )}
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => handleFilterStatusChange('all')}
                className={filterStatus === 'all' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                All
              </Button>
              <Button
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                onClick={() => handleFilterStatusChange('pending')}
                className={filterStatus === 'pending' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                Pending
              </Button>
              <Button
                variant={filterStatus === 'quoted' ? 'default' : 'outline'}
                onClick={() => handleFilterStatusChange('quoted')}
                className={filterStatus === 'quoted' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                Quoted
              </Button>
              <Button
                variant={filterStatus === 'approved' ? 'default' : 'outline'}
                onClick={() => handleFilterStatusChange('approved')}
                className={filterStatus === 'approved' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                Approved
              </Button>
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        filteredInquiries.filter((inq) => canDeleteInquiry(inq)).length > 0 &&
                        selectedInquiryIds.length === filteredInquiries.filter((inq) => canDeleteInquiry(inq)).length
                      }
                      onCheckedChange={handleToggleSelectAll}
                      disabled={filteredInquiries.filter((inq) => canDeleteInquiry(inq)).length === 0}
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
                  
                  const inquiryNo = String((inquiry as any)?.inquiryNumber || inquiry.id);
                  const numberDisplay = resolveDisplayNumber({
                    domain: 'ing',
                    internalNo: inquiryNo,
                    companyId: currentUser?.companyId ? String(currentUser.companyId) : undefined,
                  });
                  
                  return (
                    <TableRow key={`${inquiry.id}-${index}`} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedInquiryIds.includes(inquiry.id)}
                          onCheckedChange={() => handleToggleSelectInquiry(inquiry.id)}
                          disabled={!canDeleteInquiry(inquiry)}
                        />
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-bold text-gray-900">
                          {inquiryNo}
                        </span>
                        {numberDisplay.externalNo && (
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            Customer ERP: {numberDisplay.externalNo}
                          </div>
                        )}
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
                          {/* 🚀 Submit Button - Always show as first action */}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => {
                              if (!inquiry.isSubmitted) {
                                setSubmitInquiryId(inquiry.id);
                              } else {
                                toast.info('Inquiry already submitted');
                              }
                            }}
                            title={inquiry.isSubmitted ? "Already Submitted" : "Submit Inquiry to Admin"}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
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
                          {canDeleteInquiry(inquiry) && (
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

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent
          className="w-[calc(210mm+56px)] max-w-[calc(100vw-2rem)] max-h-[95vh] overflow-hidden border-none bg-[#525659] p-0 gap-0 shadow-2xl [&>button]:hidden"
        >
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

          <div className="overflow-y-auto max-h-[95vh] bg-[#525659]">
            {selectedInquiry && (
              <CustomerInquiryView inquiry={selectedInquiry} audience="customer" />
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
                  await handlePrintInquiryDocument();
                  toast.success('Print dialog opened! Select "Save as PDF" and choose your local folder.');
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
        onSaveQuantities={async (updatedProducts) => {
          if (selectedInquiry) {
            const totalPrice = updatedProducts.reduce((sum, p) => sum + ((p.targetPrice || 0) * (p.quantity || 0)), 0);
            try {
              await updateInquiry(selectedInquiry.id, {
                products: updatedProducts,
                totalPrice,
              });
            } catch (error: any) {
              toast.error(error?.message || 'Failed to update inquiry');
            }
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
        onUpdateInquiry={async (updatedData) => {
          if (selectedInquiry) {
            const totalPrice = updatedData.products.reduce(
              (sum: number, p: any) => sum + ((p.targetPrice || 0) * (p.quantity || 0)), 
              0
            );

            try {
              const inquiryNumber = selectedInquiry.inquiryNumber || selectedInquiry.id;
              const persistedProducts = await preparePersistedProductsWithOem(inquiryNumber, updatedData.products);
              const persistedOemData = aggregateInquiryOemFromProducts(persistedProducts);
              await updateInquiry(selectedInquiry.id, {
                products: persistedProducts,
                requirements: updatedData.requirements,
                oem: persistedOemData,
                message: updatedData.notes,
                deliveryAddress: updatedData.deliveryAddress,
                totalPrice,
              });

              toast.success(`Inquiry ${inquiryNumber} updated successfully!`);
              setIsEditMode(false);
              setSelectedInquiry(null);
            } catch (error: any) {
              throw error instanceof Error ? error : new Error(error?.message || 'Failed to update inquiry');
            }
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
              Hide this inquiry from your current view? The original inquiry record will remain available.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-6">
            <p className="text-sm text-red-800">
              <strong>Inquiry No:</strong> {deleteInquiryDisplay.internalNo}
            </p>
            {deleteInquiryDisplay.externalNo && (
              <p className="mt-2 text-sm text-red-700">
                <strong>Customer ERP No:</strong> {deleteInquiryDisplay.externalNo}
              </p>
            )}
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteInquiryId(null)}>
              Cancel
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={async () => {
                if (deleteInquiryId) {
                  try {
                    await deleteInquiry(deleteInquiryId);
                    toast.success(`Inquiry hidden from current view!`);
                    setDeleteInquiryId(null);
                  } catch (error: any) {
                    toast.error(error?.message || 'Failed to hide inquiry');
                  }
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Hide
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
              <strong>Inquiry No:</strong> {submitInquiryDisplay.internalNo}
            </p>
            {submitInquiryDisplay.externalNo && (
              <p className="mt-2 text-sm text-blue-700">
                <strong>Customer ERP No:</strong> {submitInquiryDisplay.externalNo}
              </p>
            )}
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setSubmitInquiryId(null)}>
              Cancel
            </Button>
            <Button 
              disabled={isSubmittingInquiry}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={async () => {
                if (submitInquiryId) {
                  setIsSubmittingInquiry(true);
                  try {
                    const ok = await submitInquiry(submitInquiryId);
                    if (ok) {
                      toast.success(`Inquiry submitted successfully!`);
                      setSubmitInquiryId(null);
                    } else {
                      toast.error('Inquiry submit failed. Please try again.');
                    }
                  } catch (error: any) {
                    console.error('[InquiryManagement] submit inquiry failed:', error);
                    toast.error(error?.message || 'Inquiry submit failed. Please try again.');
                  } finally {
                    setIsSubmittingInquiry(false);
                  }
                }
              }}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmittingInquiry ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
