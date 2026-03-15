import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Plus, 
  X, 
  Globe, 
  PlusCircle, 
  Package, 
  Save, 
  Eye, 
  Send,
  ShoppingCart,
  Edit,
  Trash2,
  History,
  List,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '../../contexts/UserContext';
import { useInquiry } from '../../contexts/InquiryContext';
import { adaptInquiryToDocumentData } from '../../utils/documentDataAdapters';
import { InquiryProductBrowser } from './InquiryProductBrowser';
import { InquiryProductHome } from './InquiryProductHome';
import { REGION_CODES, type RegionType } from '../../utils/xjNumberGenerator';
import { nextInquiryNumber } from '../../lib/supabaseService';
import { getCurrentUser } from '../../data/authorizedUsers';
import {
  buildCustomerInquiryRequirementText,
  CUSTOMER_INQUIRY_REQUIREMENT_FIELDS,
  DEFAULT_CUSTOMER_INQUIRY_REQUIREMENT_FIELDS,
  type CustomerInquiryRequirementFormFields,
} from '../documents/templates/CustomerInquiryDocument';

interface ProductItem {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
  targetPrice?: number;
  specifications?: string;
  image?: string;
  source: 'website' | 'manual' | 'history';
}

interface CreateInquiryPageProps {
  isOpen: boolean;
  onClose: () => void;
  initialMethod?: 'history' | 'website' | 'manual';
  onNavigateToShop?: () => void;
}

export function CreateInquiryPage({ 
  isOpen, 
  onClose, 
  initialMethod,
  onNavigateToShop 
}: CreateInquiryPageProps) {
  const { user, userInfo } = useUser();
  const { addInquiry, getUserInquiries } = useInquiry();
  
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [isSelectingHistory, setIsSelectingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'browse'>('products');
  const [browseView, setBrowseView] = useState<'home' | 'category'>('home');
  const [selectedBrowseCategory, setSelectedBrowseCategory] = useState<string>('all');
  
  // Manual product form
  const [manualForm, setManualForm] = useState({
    productName: '',
    quantity: '',
    unit: 'pcs',
    targetPrice: '',
    specifications: ''
  });
  const [customerRequirement, setCustomerRequirement] = useState<CustomerInquiryRequirementFormFields>({
    ...DEFAULT_CUSTOMER_INQUIRY_REQUIREMENT_FIELDS,
  });

  // Get user's inquiry history
  const inquiryHistory = user ? getUserInquiries(user.email) : [];

  // Track added product IDs for the browser
  const addedProductIds = new Set(products.map(p => p.id));

  // Initialize with method if provided
  useEffect(() => {
    if (isOpen && initialMethod === 'manual') {
      setIsAddingManual(true);
    } else if (isOpen && initialMethod === 'history') {
      setIsSelectingHistory(true);
    } else if (isOpen && initialMethod === 'website') {
      setActiveTab('browse');
    }
  }, [isOpen, initialMethod]);

  const addProductFromBrowser = (product: ProductItem) => {
    setProducts([...products, product]);
  };

  const addManualProduct = () => {
    if (!manualForm.productName || !manualForm.quantity) {
      toast.error('Please fill in product name and quantity');
      return;
    }

    const newProduct: ProductItem = {
      id: `manual-${Date.now()}`,
      productName: manualForm.productName,
      quantity: parseInt(manualForm.quantity.replace(/[^\d]/g, ''), 10) || 0,
      unit: manualForm.unit,
      targetPrice: parseFloat(manualForm.targetPrice.replace(/[^\d.]/g, '')) || 0,
      specifications: manualForm.specifications,
      source: 'manual'
    };

    setProducts([...products, newProduct]);
    
    // Reset form
    setManualForm({
      productName: '',
      quantity: '',
      unit: 'pcs',
      targetPrice: '',
      specifications: ''
    });
    
    setIsAddingManual(false);
    toast.success('Product added successfully');
  };

  const copyFromHistory = (inquiry: any) => {
    const historyProducts: ProductItem[] = inquiry.products.map((p: any) => ({
      id: `history-${Date.now()}-${Math.random()}`,
      productName: p.productName,
      quantity: p.quantity,
      unit: p.unit || 'pcs',
      targetPrice: p.price,
      specifications: p.specifications,
      image: p.image,
      source: 'history' as const
    }));

    setProducts([...products, ...historyProducts]);
    setIsSelectingHistory(false);
    toast.success(`${historyProducts.length} products added from history`);
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    toast.success('Product removed');
  };

  const saveDraft = () => {
    if (products.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    // Save to localStorage as draft
    localStorage.setItem('inquiry_draft', JSON.stringify({
      products,
      requirements: customerRequirement,
      timestamp: Date.now()
    }));
    
    toast.success('Draft saved successfully');
    onClose();
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please log in to submit an inquiry');
      return;
    }

    if (products.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    const currentUser = getCurrentUser();
    const userRegion: RegionType = currentUser?.region || 'North America';
    const regionCode = REGION_CODES[userRegion] || 'NA';

    let inquiryNumber: string;
    try {
      inquiryNumber = await nextInquiryNumber(regionCode, user?.id ?? undefined);
    } catch (err) {
      console.error('Failed to generate inquiry number:', err);
      toast.error('Failed to generate inquiry number');
      return;
    }

    const now = Date.now();
    const totalPrice = products.reduce((sum, p) => sum + (p.targetPrice || 0) * p.quantity, 0);

    const newInquiry = {
      id: crypto.randomUUID(),
      inquiryNumber,
      date: new Date().toISOString().split('T')[0],
      userEmail: user.email,
      region: regionCode, // 存区域代码 NA/SA/EA，不存全名
      products: products.map(p => ({
        id: p.id,
        productName: p.productName,
        quantity: p.quantity,
        unit: p.unit,
        price: p.targetPrice || 0,
        specifications: p.specifications || '',
        image: p.image || '/placeholder.jpg'
      })),
      totalPrice,
      status: 'pending' as const,
      isSubmitted: false, // 🚀 Draft state - not submitted to admin yet
      buyerInfo: {
        companyName: userInfo?.companyName || currentUser?.company || 'N/A',
        contactPerson: userInfo?.contactPerson || currentUser?.email.split('@')[0] || 'N/A',
        email: user.email,
        phone: userInfo?.phone || 'N/A',
        address: userInfo?.address || 'N/A',
        website: userInfo?.website || '',
        businessType: userInfo?.businessType || ''
      },
      shippingInfo: {
        cartons: '0',
        cbm: '0',
        totalGrossWeight: '0',
        totalNetWeight: '0'
      },
      requirements: { ...customerRequirement },
      message: buildCustomerInquiryRequirementText(customerRequirement),
      createdAt: now
    };
    (newInquiry as any).templateSnapshot = { pendingResolution: true };
    (newInquiry as any).documentRenderMeta = null;
    (newInquiry as any).documentDataSnapshot = adaptInquiryToDocumentData(newInquiry as any);

    console.log('🔵 提交新询价:', newInquiry);
    try {
      await addInquiry(newInquiry);
    } catch (saveErr) {
      console.error('Failed to save inquiry:', saveErr);
      toast.error('Failed to save inquiry. Please try again.');
      return;
    }

    localStorage.removeItem('inquiry_draft');
    toast.success(`Inquiry ${inquiryNumber} created successfully!`);
    setProducts([]);
    onClose();
  };

  const getTotalPrice = () => {
    return products.reduce((sum, p) => sum + (p.targetPrice || 0) * p.quantity, 0);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col" style={{ fontFamily: 'var(--hd-font)' }}>
          <DialogHeader>
            <DialogTitle className="text-gray-900 uppercase tracking-wide flex items-center gap-2" style={{ fontSize: '18px', fontWeight: 700 }}>
              <Package className="w-5 h-5 text-[#F96302]" strokeWidth={2.5} />
              CREATE NEW INQUIRY
            </DialogTitle>
            <DialogDescription style={{ fontSize: '13px', fontWeight: 400 }}>
              Add products and submit your inquiry for quotation
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 py-4">
            {/* Tabs for Product List and Browser */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'products' | 'browse')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-sm h-auto">
                <TabsTrigger 
                  value="products"
                  className="data-[state=active]:bg-[#F96302] data-[state=active]:text-white rounded-sm py-3"
                  style={{ fontSize: '13px', fontWeight: 600 }}
                >
                  <List className="w-4 h-4 mr-2" strokeWidth={2.5} />
                  SELECTED PRODUCTS ({products.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="browse"
                  className="data-[state=active]:bg-[#F96302] data-[state=active]:text-white rounded-sm py-3"
                  style={{ fontSize: '13px', fontWeight: 600 }}
                >
                  <Globe className="w-4 h-4 mr-2" strokeWidth={2.5} />
                  BROWSE WEBSITE
                </TabsTrigger>
              </TabsList>

              {/* Selected Products Tab */}
              <TabsContent value="products" className="mt-6 space-y-4">
                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button
                    onClick={() => setIsSelectingHistory(true)}
                    className="h-auto py-3 bg-white hover:bg-[#FFF4ED] text-gray-900 border-2 border-gray-200 hover:border-[#F96302] rounded-sm justify-start"
                  >
                    <History className="w-5 h-5 mr-3 text-[#0D3B66]" strokeWidth={2.5} />
                    <div className="text-left">
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>COPY FROM HISTORY</div>
                      <div className="text-[11px] text-gray-600" style={{ fontWeight: 400 }}>Use previous inquiry</div>
                    </div>
                  </Button>

                  <Button
                    onClick={() => setActiveTab('browse')}
                    className="h-auto py-3 bg-white hover:bg-[#FFF4ED] text-gray-900 border-2 border-gray-200 hover:border-[#F96302] rounded-sm justify-start"
                  >
                    <Globe className="w-5 h-5 mr-3 text-[#0D3B66]" strokeWidth={2.5} />
                    <div className="text-left">
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>SELECT FROM WEBSITE</div>
                      <div className="text-[11px] text-gray-600" style={{ fontWeight: 400 }}>Browse products</div>
                    </div>
                  </Button>

                  <Button
                    onClick={() => setIsAddingManual(true)}
                    className="h-auto py-3 bg-white hover:bg-[#FFF4ED] text-gray-900 border-2 border-gray-200 hover:border-[#F96302] rounded-sm justify-start"
                  >
                    <PlusCircle className="w-5 h-5 mr-3 text-[#0D3B66]" strokeWidth={2.5} />
                    <div className="text-left">
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>ADD YOUR ITEMS</div>
                      <div className="text-[11px] text-gray-600" style={{ fontWeight: 400 }}>Manual entry</div>
                    </div>
                  </Button>
                </div>

                {/* Products List */}
                <div className="bg-white border-2 border-gray-200 rounded-sm">
                  <div className="border-b-2 border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-gray-900 uppercase tracking-wide" style={{ fontSize: '14px', fontWeight: 600 }}>
                        SELECTED PRODUCTS ({products.length})
                      </h3>
                      {products.length > 0 && (
                        <div className="text-gray-900" style={{ fontSize: '16px', fontWeight: 700 }}>
                          Total: ${getTotalPrice().toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6">
                    {products.length === 0 ? (
                      <div className="text-center py-12">
                        <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={2} />
                        <p className="text-gray-600" style={{ fontSize: '14px', fontWeight: 400 }}>
                          No products added yet. Use the buttons above to add products.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {products.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-start gap-4 p-4 bg-gray-50 border-2 border-gray-200 rounded-sm hover:border-[#F96302] transition-all"
                          >
                            <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-sm flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" strokeWidth={2} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="text-gray-900 truncate" style={{ fontSize: '14px', fontWeight: 600 }}>
                                    {product.productName}
                                  </h4>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-gray-600" style={{ fontSize: '12px', fontWeight: 400 }}>
                                      Qty: {product.quantity} {product.unit}
                                    </span>
                                    {product.targetPrice && product.targetPrice > 0 && (
                                      <>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-gray-600" style={{ fontSize: '12px', fontWeight: 400 }}>
                                          ${product.targetPrice.toFixed(2)}/{product.unit}
                                        </span>
                                      </>
                                    )}
                                    <span className="text-gray-400">•</span>
                                    <span className="text-[#F96302] uppercase" style={{ fontSize: '10px', fontWeight: 600 }}>
                                      {product.source}
                                    </span>
                                  </div>
                                  {product.specifications && (
                                    <p className="text-gray-500 mt-2 text-[12px] line-clamp-2" style={{ fontWeight: 400 }}>
                                      {product.specifications}
                                    </p>
                                  )}
                                </div>
                                
                                {product.targetPrice && product.targetPrice > 0 && (
                                  <div className="text-right ml-4">
                                    <div className="text-gray-900" style={{ fontSize: '16px', fontWeight: 700 }}>
                                      ${(product.targetPrice * product.quantity).toFixed(2)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => removeProduct(product.id)}
                            >
                              <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Browse Website Tab */}
              <TabsContent value="browse" className="mt-6">
                {browseView === 'home' ? (
                  <InquiryProductHome 
                    onAddProduct={addProductFromBrowser}
                    addedProductIds={addedProductIds}
                    onSelectCategory={(categoryId) => {
                      setSelectedBrowseCategory(categoryId);
                      setBrowseView('category');
                    }}
                  />
                ) : (
                  <div>
                    <Button
                      variant="ghost"
                      onClick={() => setBrowseView('home')}
                      className="mb-4 text-[#F96302] hover:text-[#E05502] hover:bg-[#FFF4ED]"
                      style={{ fontSize: '13px', fontWeight: 600 }}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" strokeWidth={2.5} />
                      BACK TO HOME
                    </Button>
                    <InquiryProductBrowser 
                      onAddProduct={addProductFromBrowser}
                      addedProductIds={addedProductIds}
                      onBackToHome={() => setBrowseView('home')}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="rounded-sm border-2 border-gray-200 bg-white">
              <div className="border-b-2 border-gray-200 px-6 py-4">
                <h3 className="text-gray-900 uppercase tracking-wide" style={{ fontSize: '14px', fontWeight: 600 }}>
                  TRADING REQUIREMENTS
                </h3>
                <p className="mt-1 text-gray-600" style={{ fontSize: '12px', fontWeight: 400 }}>
                  These terms will be written into the inquiry document and flow into the ING template directly.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
                {CUSTOMER_INQUIRY_REQUIREMENT_FIELDS.map((field) => (
                  <div
                    key={field.key}
                    className={field.type === 'textarea' && field.key === 'otherRequirements' ? 'md:col-span-2' : ''}
                  >
                    <Label htmlFor={`create-inquiry-${field.key}`} style={{ fontSize: '13px', fontWeight: 600 }}>
                      {field.sourceLabel}
                    </Label>
                    <p className="mt-1 text-[12px] text-gray-500">{field.description}</p>
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={`create-inquiry-${field.key}`}
                        placeholder={field.placeholder}
                        rows={field.rows || 3}
                        value={customerRequirement[field.key] || ''}
                        onChange={(e) => setCustomerRequirement((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        className="mt-2"
                      />
                    ) : (
                      <Input
                        id={`create-inquiry-${field.key}`}
                        placeholder={field.placeholder}
                        value={customerRequirement[field.key] || ''}
                        onChange={(e) => setCustomerRequirement((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        className="mt-2"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t-2 border-gray-200 pt-4 flex items-center justify-between gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              style={{ fontSize: '13px', fontWeight: 600 }}
            >
              CANCEL
            </Button>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={saveDraft}
                disabled={products.length === 0}
                style={{ fontSize: '13px', fontWeight: 600 }}
              >
                <Save className="w-4 h-4 mr-2" strokeWidth={2.5} />
                SAVE DRAFT
              </Button>
              
              <Button
                variant="outline"
                disabled
                className="border-[#0D3B66] text-[#0D3B66] hover:bg-[#0D3B66] hover:text-white"
                style={{ fontSize: '13px', fontWeight: 600 }}
              >
                <Eye className="w-4 h-4 mr-2" strokeWidth={2.5} />
                PREVIEW SOON
              </Button>
              
              <Button
                onClick={handleSubmit}
                disabled={products.length === 0}
                className="bg-[#F96302] hover:bg-[#E05502] text-white"
                style={{ fontSize: '13px', fontWeight: 600 }}
              >
                <Send className="w-4 h-4 mr-2" strokeWidth={2.5} />
                SUBMIT INQUIRY
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Product Entry Dialog */}
      <Dialog open={isAddingManual} onOpenChange={setIsAddingManual}>
        <DialogContent className="max-w-2xl" style={{ fontFamily: 'var(--hd-font)' }}>
          <DialogHeader>
            <DialogTitle className="text-gray-900 uppercase tracking-wide" style={{ fontSize: '16px', fontWeight: 700 }}>
              ADD PRODUCT MANUALLY
            </DialogTitle>
            <DialogDescription style={{ fontSize: '13px', fontWeight: 400 }}>
              Enter product details for your inquiry
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="manual-product-name" style={{ fontSize: '13px', fontWeight: 600 }}>
                Product Name *
              </Label>
              <Input
                id="manual-product-name"
                placeholder="Enter product name"
                value={manualForm.productName}
                onChange={(e) => setManualForm({ ...manualForm, productName: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="manual-quantity" style={{ fontSize: '13px', fontWeight: 600 }}>
                  Quantity *
                </Label>
                <Input
                  id="manual-quantity"
                  placeholder="e.g., 5000"
                  value={manualForm.quantity}
                  onChange={(e) => setManualForm({ ...manualForm, quantity: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="manual-unit" style={{ fontSize: '13px', fontWeight: 600 }}>
                  Unit
                </Label>
                <Input
                  id="manual-unit"
                  placeholder="e.g., pcs, kg, box"
                  value={manualForm.unit}
                  onChange={(e) => setManualForm({ ...manualForm, unit: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="manual-price" style={{ fontSize: '13px', fontWeight: 600 }}>
                Target Price (Optional)
              </Label>
              <Input
                id="manual-price"
                placeholder="e.g., 2.50"
                value={manualForm.targetPrice}
                onChange={(e) => setManualForm({ ...manualForm, targetPrice: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="manual-specs" style={{ fontSize: '13px', fontWeight: 600 }}>
                Specifications (Optional)
              </Label>
              <Textarea
                id="manual-specs"
                placeholder="Describe product specifications, materials, dimensions, etc."
                rows={4}
                value={manualForm.specifications}
                onChange={(e) => setManualForm({ ...manualForm, specifications: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setIsAddingManual(false)}
              style={{ fontSize: '13px', fontWeight: 600 }}
            >
              CANCEL
            </Button>
            <Button
              onClick={addManualProduct}
              className="bg-[#F96302] hover:bg-[#E05502] text-white"
              style={{ fontSize: '13px', fontWeight: 600 }}
            >
              <Plus className="w-4 h-4 mr-2" strokeWidth={2.5} />
              ADD PRODUCT
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Selection Dialog */}
      <Dialog open={isSelectingHistory} onOpenChange={setIsSelectingHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col" style={{ fontFamily: 'var(--hd-font)' }}>
          <DialogHeader>
            <DialogTitle className="text-gray-900 uppercase tracking-wide" style={{ fontSize: '16px', fontWeight: 700 }}>
              SELECT FROM INQUIRY HISTORY
            </DialogTitle>
            <DialogDescription style={{ fontSize: '13px', fontWeight: 400 }}>
              Choose a previous inquiry to copy products from
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 mt-4">
            {inquiryHistory.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={2} />
                <p className="text-gray-600" style={{ fontSize: '14px', fontWeight: 400 }}>
                  No inquiry history found
                </p>
              </div>
            ) : (
              inquiryHistory.map((inquiry) => (
                <div
                  key={inquiry.id}
                  className="p-4 border-2 border-gray-200 rounded-sm hover:border-[#F96302] hover:bg-[#FFF4ED] transition-all cursor-pointer"
                  onClick={() => copyFromHistory(inquiry)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-gray-900" style={{ fontSize: '14px', fontWeight: 600 }}>
                          {inquiry.id}
                        </span>
                        <span className="text-gray-500" style={{ fontSize: '12px', fontWeight: 400 }}>
                          {inquiry.date}
                        </span>
                      </div>
                      <div className="text-gray-600" style={{ fontSize: '12px', fontWeight: 400 }}>
                        {inquiry.products?.length || 0} products • ${inquiry.totalPrice?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-[#F96302] hover:bg-[#E05502] text-white"
                      style={{ fontSize: '12px', fontWeight: 600 }}
                    >
                      COPY
                    </Button>
                  </div>
                  <div className="text-gray-500 text-[11px] truncate" style={{ fontWeight: 400 }}>
                    {inquiry.products?.map((p: any) => p.productName).join(', ')}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t-2 border-gray-200 pt-4 flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => setIsSelectingHistory(false)}
              style={{ fontSize: '13px', fontWeight: 600 }}
            >
              CANCEL
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
