import React from 'react';
import { useUser } from '../contexts/UserContext';
import { useCart } from '../contexts/CartContext';
import { useInquiry } from '../contexts/InquiryContext';
import { useRegion } from '../contexts/RegionContext';
import { useRouter } from '../contexts/RouterContext';
import { Building2, Mail, Phone, Globe, User, CheckCircle2, Download, Printer, HardDrive, Cloud } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel } from './ui/alert-dialog';
import { nextInquiryNumber } from '../lib/supabaseService';

interface InquiryPreviewDialogProps {
  cartItems: any[];
  totalShipping: {
    cartons: string;
    cbm: string;
    totalGrossWeight: string;
    totalNetWeight: string;
  };
  planningMode: 'automatic' | 'custom';
  recommendedContainer?: any;
  customContainers?: any[];
  containerSpecs: any;
  getTotalPrice: () => number;
  calculateItemShipping: (item: any) => any;
  calculateContainerUtilization: (containerType: any, totalCbm: number, totalWeight: number) => any;
  getUtilizationColor: (utilization: number) => string;
  getUtilizationBgColor: (utilization: number) => string;
  getUtilizationTip: (spaceUtil: number, weightUtil: number) => string;
  onClose?: () => void;
  isOpen?: boolean;
}

export function InquiryPreviewDialog({
  cartItems,
  totalShipping,
  planningMode,
  recommendedContainer,
  customContainers,
  containerSpecs,
  getTotalPrice,
  calculateItemShipping,
  calculateContainerUtilization,
  getUtilizationColor,
  getUtilizationBgColor,
  getUtilizationTip,
  onClose,
  isOpen
}: InquiryPreviewDialogProps) {
  const { userInfo, setUserInfo, generateInquiryNumber, peekInquiryNumber, user } = useUser();
  const { addInquiry } = useInquiry();
  const { clearCart } = useCart();
  const { navigateTo } = useRouter();
  const { selectedRegion } = useRegion(); // 🔥 获取当前区域
  const [showForm, setShowForm] = React.useState(!user);
  const [showSuccessDialog, setShowSuccessDialog] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    companyName: userInfo?.companyName || '',
    address: userInfo?.address || '',
    contactPerson: userInfo?.contactPerson || '',
    phone: userInfo?.phone || '',
    email: user?.email || userInfo?.email || '',
    website: userInfo?.website || '',
    businessType: userInfo?.businessType || 'Importer' as 'Retailer' | 'Importer' | 'Wholesaler' | 'Distributor' | 'E-commerce' | 'Other'
  });

  React.useEffect(() => {
    if (user) {
      const updatedFormData = {
        email: user.email,
        companyName: userInfo?.companyName || '',
        address: userInfo?.address || '',
        contactPerson: userInfo?.contactPerson || '',
        phone: userInfo?.phone || '',
        website: userInfo?.website || '',
        businessType: userInfo?.businessType || 'Importer' as 'Retailer' | 'Importer' | 'Wholesaler' | 'Distributor' | 'E-commerce' | 'Other'
      };
      
      setFormData(updatedFormData);
      
      // Check if all required fields are filled
      const hasAllRequiredFields = !!(
        updatedFormData.companyName && 
        updatedFormData.contactPerson && 
        updatedFormData.email && 
        updatedFormData.phone && 
        updatedFormData.address
      );
      
      // Only hide form if all required fields are present
      setShowForm(!hasAllRequiredFields);
    }
  }, [user, userInfo]);

  const handleFormChange = (field: string, value: string) => {
    const updatedFormData = { ...formData, [field]: value };
    setFormData(updatedFormData);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('cosun_inquiry_draft', JSON.stringify(updatedFormData));
    }
  };

  const handleSaveInfo = () => {
    setUserInfo({
      ...formData,
      inquiryCount: userInfo?.inquiryCount || 0
    });
    setShowForm(false);
  };

  const [inquiryNumber, setInquiryNumber] = React.useState(peekInquiryNumber(selectedRegion?.code || 'NA'));
  
  React.useEffect(() => {
    if (isOpen) {
      const previewNumber = peekInquiryNumber(selectedRegion?.code || 'NA');
      setInquiryNumber(previewNumber);
      console.log('🔢 预览 INQ 编号:', previewNumber);
    }
  }, [isOpen, peekInquiryNumber, selectedRegion?.code]);

  const totalCbm = parseFloat(totalShipping.cbm);
  const totalWeight = parseFloat(totalShipping.totalGrossWeight);
  const rfqContentRef = React.useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = React.useState(false);

  const downloadPDF = async () => {
    setIsDownloading(true);
    toast.info('Generating PDF...');

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      if (!rfqContentRef.current) {
        toast.error('Inquiry content not found');
        setIsDownloading(false);
        return;
      }

      const content = rfqContentRef.current;
      const clonedContent = content.cloneNode(true) as HTMLElement;
      
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = content.offsetWidth + 'px';
      document.body.appendChild(tempContainer);
      tempContainer.appendChild(clonedContent);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(clonedContent, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: clonedContent.scrollWidth,
        windowHeight: clonedContent.scrollHeight
      });
      
      document.body.removeChild(tempContainer);

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const filename = `INQ_${inquiryNumber}_${formData.companyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      pdf.save(filename);
      
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please login first to submit your inquiry.');
      navigateTo('login');
      return;
    }

    if (!formData.companyName || !formData.contactPerson || !formData.email || !formData.phone || !formData.address) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const regionCode = selectedRegion?.code || 'NA';

      // Generate number from Supabase DB (atomic, concurrency-safe)
      let finalInquiryNumber: string;
      try {
        finalInquiryNumber = await nextInquiryNumber(regionCode);
      } catch (numErr) {
        console.error('[Submit] Failed to generate inquiry number:', numErr);
        toast.error('Failed to generate inquiry number. Please try again.');
        setIsSubmitting(false);
        return;
      }
      console.log('✅ [Submit] DB-generated INQ number:', finalInquiryNumber);

      const date = new Date();
      const customerInquiry = {
        id: finalInquiryNumber,
        inquiryNumber: finalInquiryNumber,
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        userEmail: user?.email || formData.email,
        products: cartItems,
        status: 'pending' as const,
        isSubmitted: true,
        submittedAt: Date.now(),
        totalPrice: getTotalPrice(),
        buyerInfo: {
          companyName: formData.companyName,
          contactPerson: formData.contactPerson,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          website: formData.website || '',
          businessType: formData.businessType || 'Retailer'
        },
        shippingInfo: totalShipping,
        containerInfo: {
          planningMode,
          recommendedContainer: planningMode === 'automatic' ? recommendedContainer : undefined,
          customContainers: planningMode === 'custom' ? customContainers : undefined,
        },
        region: regionCode,
        createdAt: Date.now(),
      };

      // Save directly to Supabase (Supabase-first)
      await addInquiry(customerInquiry);
      console.log('✅ [Submit] Inquiry saved to Supabase:', customerInquiry.id);

      toast.success(`Inquiry ${finalInquiryNumber} submitted successfully!`, {
        description: 'We will review your inquiry and get back to you soon.',
        duration: 4000
      });
      
      clearCart();
      setShowSuccessDialog(true);
      
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      toast.error('Failed to submit inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showForm) {
    return (
      <div className="space-y-6 py-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Please provide your company information to generate a formal inquiry document.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="companyName">Company Name *</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => handleFormChange('companyName', e.target.value)}
                placeholder="Enter your company name"
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="contactPerson">Contact Person *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => handleFormChange('contactPerson', e.target.value)}
                placeholder="Enter contact person name"
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  placeholder="email@company.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Phone *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleFormChange('phone', e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="address">Company Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleFormChange('address', e.target.value)}
              placeholder="Street, City, State, Country"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleFormChange('website', e.target.value)}
                  placeholder="www.company.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="businessType">Business Type *</Label>
              <Select
                value={formData.businessType}
                onValueChange={(value) => handleFormChange('businessType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Retailer">Retailer</SelectItem>
                  <SelectItem value="Importer">Importer</SelectItem>
                  <SelectItem value="Wholesaler">Wholesaler</SelectItem>
                  <SelectItem value="Distributor">Distributor</SelectItem>
                  <SelectItem value="E-commerce">E-commerce</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleSaveInfo}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            disabled={!formData.companyName || !formData.contactPerson || !formData.email || !formData.phone || !formData.address}
          >
            Continue to Preview
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 py-4">
        {/* 🎨 A4 Format Inquiry Document - Home Depot Style - Scaled for better viewing */}
        <div className="flex justify-center overflow-auto">
          <div 
            ref={rfqContentRef} 
            className="bg-white shadow-lg origin-top"
            style={{ 
              width: '210mm', 
              minHeight: '297mm', 
              padding: '15mm 20mm',
              boxSizing: 'border-box',
              transform: 'scale(1.3)',
              marginBottom: '100px'
            }}
          >
            
            {/* 🏢 Professional Header - Home Depot Style */}
            <div className="border-b-4 border-orange-600 pb-6 mb-6">
              <div className="flex justify-between items-start">
                {/* Company Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-orange-600 rounded flex items-center justify-center">
                      <Building2 className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl text-gray-900 tracking-tight font-bold">COSUN BUILDING MATERIALS</h1>
                      <p className="text-xs text-gray-600">Fujian Gaoshengda Fu Building Materials Co., Ltd.</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 space-y-0.5 ml-15">
                    <p>📍 Fujian Province, China</p>
                    <p>📧 services@cosunchina.com</p>
                    <p>🌐 www.cosunchina.com</p>
                  </div>
                </div>
                
                {/* INQ Number Badge */}
                <div className="text-right">
                  <div className="bg-orange-600 text-white px-6 py-3 rounded-lg shadow-lg mb-2">
                    <p className="text-xs uppercase tracking-wide opacity-90">INQ Number</p>
                    <p className="text-xl tracking-wider font-bold">{inquiryNumber}</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date().toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Document Title */}
            <div className="mb-6">
              <h2 className="text-2xl text-gray-900 tracking-tight mb-1 font-bold">REQUEST FOR QUOTATION</h2>
              <p className="text-sm text-gray-600">We kindly request your best pricing and terms for the following items</p>
            </div>

            {/* 👤 Buyer Information Section */}
            <div className="mb-6">
              <div className="bg-orange-600 text-white px-4 py-2 mb-3">
                <h3 className="text-sm uppercase tracking-wide font-semibold">BUYER INFORMATION</h3>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 px-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">Company Name</p>
                  <p className="text-sm text-gray-900">{formData.companyName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">Business Type</p>
                  <p className="text-sm text-gray-900">{formData.businessType}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">Address</p>
                  <p className="text-sm text-gray-900">{formData.address}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">Contact Person</p>
                  <p className="text-sm text-gray-900">{formData.contactPerson}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">Phone</p>
                  <p className="text-sm text-gray-900">{formData.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">Email</p>
                  <p className="text-sm text-gray-900">{formData.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">Website</p>
                  <p className="text-sm text-gray-900">{formData.website || 'N/A'}</p>
                </div>
              </div>
              {/* Edit button - hide on print */}
              <div className="mt-3 px-4 text-right print-hide">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowForm(true)}
                  className="text-orange-600 hover:text-orange-700 text-xs"
                >
                  Edit Information
                </Button>
              </div>
            </div>

            {/* 📦 Product Details Section */}
            <div className="mb-6">
              <div className="bg-orange-600 text-white px-4 py-2 mb-3">
                <h3 className="text-sm uppercase tracking-wide font-semibold">PRODUCT DETAILS</h3>
              </div>
              <div className="border border-gray-300">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-orange-600">
                      <th className="text-center px-2 py-2.5 text-xs uppercase tracking-wide text-gray-700 font-semibold" style={{ width: '3%' }}>NO.</th>
                      <th className="text-left px-2 py-2.5 text-xs uppercase tracking-wide text-gray-700 font-semibold" style={{ width: '7%' }}>Code</th>
                      <th className="text-center px-2 py-2.5 text-xs uppercase tracking-wide text-gray-700 font-semibold" style={{ width: '8%' }}>Image</th>
                      <th className="text-left px-3 py-2.5 text-xs uppercase tracking-wide text-gray-700 font-semibold" style={{ width: '52%' }}>Product Description</th>
                      <th className="text-right px-2 py-2.5 text-xs uppercase tracking-wide text-gray-700 font-semibold" style={{ width: '10%' }}>Quantity</th>
                      <th className="text-right px-2 py-2.5 text-xs uppercase tracking-wide text-gray-700 font-semibold" style={{ width: '10%' }}>Unit Price</th>
                      <th className="text-right px-2 py-2.5 text-xs uppercase tracking-wide text-gray-700 font-semibold" style={{ width: '10%' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item, index) => {
                      const shipping = calculateItemShipping(item);
                      const subtotal = item.quantity * (item.unitPrice || 0);
                      return (
                        <tr key={`${item.productName}-${item.color}-${item.specification}-${index}`} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-2 py-3 text-xs text-gray-600 align-top text-center">{index + 1}</td>
                          <td className="px-2 py-3 text-xs text-gray-900 align-top font-mono break-all">{item.sku || item.productCode || `SKU-${String(index + 1).padStart(4, '0')}`}</td>
                          {/* Product Image - Separate Column */}
                          <td className="px-2 py-3 align-top">
                            <div className="flex justify-center">
                              <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200 flex-shrink-0 overflow-hidden">
                                <img 
                                  src={item.image} 
                                  alt={item.productName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                          </td>
                          {/* Product Description - More Space */}
                          <td className="px-3 py-3 align-top">
                            <div className="mb-1 font-semibold text-xs text-gray-900 leading-tight">{item.productName}</div>
                            <div className="text-xs text-gray-600 leading-tight space-y-0.5">
                              <div><span className="text-gray-500">Material:</span> {item.material}</div>
                              <div><span className="text-gray-500">Color:</span> {item.color}</div>
                              <div><span className="text-gray-500">Spec:</span> {item.specification}</div>
                            </div>
                          </td>
                          <td className="px-1.5 py-3 text-right text-xs text-gray-900 align-top whitespace-nowrap">{item.quantity} pcs</td>
                          <td className="px-1.5 py-3 text-right text-xs text-gray-900 align-top whitespace-nowrap">${(item.unitPrice || 0).toFixed(2)}</td>
                          <td className="px-1.5 py-3 text-right text-xs text-gray-900 align-top font-semibold whitespace-nowrap">${subtotal.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                    {/* Total Row */}
                    <tr className="bg-orange-50 border-t-2 border-orange-600">
                      <td colSpan={4} className="px-3 py-3 text-right text-xs uppercase tracking-wide text-gray-700 font-bold">TOTAL</td>
                      <td className="px-1.5 py-3 text-right text-xs text-gray-900 font-bold whitespace-nowrap">{cartItems.reduce((sum, item) => sum + item.quantity, 0)} pcs</td>
                      <td className="px-1.5 py-3 text-right text-xs text-gray-900 font-bold">-</td>
                      <td className="px-1.5 py-3 text-right text-xs text-orange-600 font-bold whitespace-nowrap" style={{ fontSize: '14px' }}>${getTotalPrice().toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 🚢 Shipping Summary */}
            <div className="mb-6">
              <div className="bg-orange-600 text-white px-4 py-2 mb-3">
                <h3 className="text-sm uppercase tracking-wide font-semibold">SHIPPING REQUIREMENTS</h3>
              </div>
              <div className="grid grid-cols-4 gap-4 px-4">
                <div className="border-2 border-gray-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 font-semibold">Total Cartons</p>
                  <p className="text-2xl text-orange-600 font-bold">{totalShipping.cartons}</p>
                </div>
                <div className="border-2 border-gray-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 font-semibold">Total Volume</p>
                  <p className="text-2xl text-orange-600 font-bold">{totalShipping.cbm}</p>
                  <p className="text-xs text-gray-500">m³</p>
                </div>
                <div className="border-2 border-gray-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 font-semibold">Gross Weight</p>
                  <p className="text-2xl text-orange-600 font-bold">{(parseFloat(totalShipping.totalGrossWeight) / 1000).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Tons</p>
                </div>
                <div className="border-2 border-gray-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 font-semibold">Net Weight</p>
                  <p className="text-2xl text-orange-600 font-bold">{(parseFloat(totalShipping.totalNetWeight) / 1000).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Tons</p>
                </div>
              </div>
            </div>

            {/* 📐 Container Planning */}
            <div className="mb-6">
              <div className="bg-orange-600 text-white px-4 py-2 mb-3">
                <h3 className="text-sm uppercase tracking-wide font-semibold">CONTAINER PLANNING</h3>
              </div>
              {planningMode === 'automatic' && recommendedContainer ? (
                <div className="px-4">
                  {(() => {
                    const util = calculateContainerUtilization(recommendedContainer, totalCbm, totalWeight);
                    return (
                      <div className="border-2 border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm text-gray-700 font-semibold">Recommended Container:</span>
                          <span className="bg-orange-600 text-white px-5 py-2 rounded text-sm font-bold">
                            1 × {util.spec.name}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                          {/* Space Utilization */}
                          <div>
                            <div className="flex justify-between text-xs mb-2">
                              <span className="text-gray-600 uppercase tracking-wide font-semibold">Space Utilization</span>
                              <span className={`${getUtilizationColor(util.spaceUtilization)} font-bold`}>
                                {util.spaceUtilization.toFixed(1)}%
                              </span>
                            </div>
                            <Progress 
                              value={Math.min(util.spaceUtilization, 100)} 
                              className="h-3 bg-gray-200"
                              indicatorClassName={getUtilizationBgColor(util.spaceUtilization)}
                            />
                            <p className="text-xs text-gray-500 mt-1.5">
                              {util.spaceUsed.toFixed(2)} / {util.spec.volume} m³ used
                            </p>
                          </div>
                          
                          {/* Weight Utilization */}
                          <div>
                            <div className="flex justify-between text-xs mb-2">
                              <span className="text-gray-600 uppercase tracking-wide font-semibold">Weight Utilization</span>
                              <span className={`${getUtilizationColor(util.weightUtilization)} font-bold`}>
                                {util.weightUtilization.toFixed(1)}%
                              </span>
                            </div>
                            <Progress 
                              value={Math.min(util.weightUtilization, 100)} 
                              className="h-3 bg-gray-200"
                              indicatorClassName={getUtilizationBgColor(util.weightUtilization)}
                            />
                            <p className="text-xs text-gray-500 mt-1.5">
                              {(util.weightUsed / 1000).toFixed(2)} / {(util.spec.maxPayload / 1000).toFixed(0)} T used
                            </p>
                          </div>
                        </div>
                        
                        {/* Recommendation Tip */}
                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-3">
                          <p className="text-xs text-blue-800">
                            💡 <span className="font-semibold">Tip:</span> {getUtilizationTip(util.spaceUtilization, util.weightUtilization)}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : customContainers && customContainers.length > 0 ? (
                <div className="px-4 space-y-3">
                  {customContainers.map((container, idx) => {
                    const containerType = container.type;
                    const spec = containerSpecs[containerType];
                    const totalCapacity = spec.volume * container.quantity;
                    const totalWeightCapacity = spec.maxPayload * container.quantity;
                    const spaceUtil = (totalCbm / totalCapacity) * 100;
                    const weightUtil = (totalWeight / totalWeightCapacity) * 100;
                    
                    return (
                      <div key={container.id} className="border-2 border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-gray-700 font-semibold">Container {idx + 1}:</span>
                          <span className="bg-orange-600 text-white px-5 py-2 rounded text-sm font-bold">
                            {container.quantity} × {spec.name}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <div className="flex justify-between text-xs mb-2">
                              <span className="text-gray-600 uppercase tracking-wide font-semibold">Space</span>
                              <span className={`${getUtilizationColor(spaceUtil)} font-bold`}>
                                {spaceUtil.toFixed(1)}%
                              </span>
                            </div>
                            <Progress 
                              value={Math.min(spaceUtil, 100)} 
                              className="h-2.5 bg-gray-200"
                              indicatorClassName={getUtilizationBgColor(spaceUtil)}
                            />
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-2">
                              <span className="text-gray-600 uppercase tracking-wide font-semibold">Weight</span>
                              <span className={`${getUtilizationColor(weightUtil)} font-bold`}>
                                {weightUtil.toFixed(1)}%
                              </span>
                            </div>
                            <Progress 
                              value={Math.min(weightUtil, 100)} 
                              className="h-2.5 bg-gray-200"
                              indicatorClassName={getUtilizationBgColor(weightUtil)}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {/* 📄 Footer */}
            <div className="border-t-2 border-gray-300 pt-4 mt-8">
              <div className="grid grid-cols-3 gap-6 text-xs">
                <div>
                  <p className="text-gray-500 uppercase tracking-wide mb-2 font-semibold">Terms</p>
                  <p className="text-gray-600 leading-relaxed">FOB prices requested. Payment terms negotiable upon quotation receipt.</p>
                </div>
                <div>
                  <p className="text-gray-500 uppercase tracking-wide mb-2 font-semibold">Validity</p>
                  <p className="text-gray-600 leading-relaxed">Please provide quotation validity period and estimated delivery time.</p>
                </div>
                <div>
                  <p className="text-gray-500 uppercase tracking-wide mb-2 font-semibold">Contact</p>
                  <p className="text-gray-600 leading-relaxed">For questions, contact us at services@cosunchina.com</p>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-400">
                  This inquiry is generated automatically by COSUN B2B Platform | Document ID: {inquiryNumber}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Not included in PDF */}
        <div className="flex gap-3 justify-end mt-6 print-hide">
          <Button
            variant="outline"
            onClick={downloadPDF}
            disabled={isDownloading}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isDownloading ? 'Generating PDF...' : 'Download PDF'}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
          </Button>
        </div>
      </div>

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <AlertDialogTitle>Inquiry Submitted Successfully!</AlertDialogTitle>
                <AlertDialogDescription>
                  Inquiry #{inquiryNumber} has been sent to our team.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <div className="text-sm text-gray-600 space-y-2">
            <p>✅ Your inquiry has been received</p>
            <p>✅ We'll review it and get back to you within 24 hours</p>
            <p>✅ You can track your inquiry status in the Customer Dashboard</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => {
              setShowSuccessDialog(false);
              if (onClose) onClose();
            }}>
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}