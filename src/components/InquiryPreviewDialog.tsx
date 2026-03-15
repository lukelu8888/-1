import React from 'react';
import { useUser } from '../contexts/UserContext';
import { useCart } from '../contexts/CartContext';
import { useInquiry } from '../contexts/InquiryContext';
import { adaptInquiryToDocumentData } from '../utils/documentDataAdapters';
import { useRegion } from '../contexts/RegionContext';
import { nextInquiryNumber } from '../lib/supabaseService';
import { Building2, Mail, Phone, Globe, User, CheckCircle2, Download, Printer, HardDrive, Cloud } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel } from './ui/alert-dialog';
import { Textarea } from './ui/textarea';
import {
  buildCustomerInquiryRequirementText,
  CUSTOMER_INQUIRY_REQUIREMENT_FIELDS,
  DEFAULT_CUSTOMER_INQUIRY_REQUIREMENT_FIELDS,
  type CustomerInquiryRequirementFormFields,
} from './documents/templates/CustomerInquiryDocument';

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
  const { selectedRegion } = useRegion(); // 🔥 获取当前区域
  
  // 🌍 Get current logged-in user's region from localStorage
  const [currentUserRegion, setCurrentUserRegion] = React.useState<string>('North America');
  
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSession = localStorage.getItem('cosun_user_session');
      console.log('🔍 [InquiryPreview] localStorage中的session数据:', savedSession);
      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          console.log('🔍 [InquiryPreview] 解析后的session对象:', session);
          // session是一个包含user的对象：{ user: {...}, loginTime, expiryTime }
          if (session.user && session.user.region) {
            setCurrentUserRegion(session.user.region);
            console.log('✅ [InquiryPreview] 从localStorage获取用户区域:', session.user.region);
          } else {
            console.error('❌ [InquiryPreview] session中没有user.region字段');
          }
        } catch (e) {
          console.error('❌ [InquiryPreview] Failed to parse user session:', e);
        }
      } else {
        console.error('❌ [InquiryPreview] localStorage中没有cosun_user_session');
      }
    }
  }, []);
  
  // If user is logged in, don't show form - use their email
  const [showForm, setShowForm] = React.useState(!user);
  const [showSuccessDialog, setShowSuccessDialog] = React.useState(false);
  const [showSaveDialog, setShowSaveDialog] = React.useState(false);
  const [showLocalDownloadSuccess, setShowLocalDownloadSuccess] = React.useState(false);
  const [showCloudSelector, setShowCloudSelector] = React.useState(false);
  const [showCloudUploadProgress, setShowCloudUploadProgress] = React.useState(false);
  const [showCloudUploadSuccess, setShowCloudUploadSuccess] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [downloadedFileName, setDownloadedFileName] = React.useState('');
  const [downloadedFileSize, setDownloadedFileSize] = React.useState('');
  const [selectedCloudService, setSelectedCloudService] = React.useState<'google' | 'dropbox' | 'onedrive' | null>(null);
  const [cloudFileUrl, setCloudFileUrl] = React.useState('');
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [formData, setFormData] = React.useState({
    companyName: userInfo?.companyName || '',
    address: userInfo?.address || '',
    contactPerson: userInfo?.contactPerson || '',
    phone: userInfo?.phone || '',
    email: user?.email || userInfo?.email || '',
    website: userInfo?.website || '',
    businessType: userInfo?.businessType || 'Importer' as 'Retailer' | 'Importer' | 'Wholesaler' | 'Distributor' | 'E-commerce' | 'Other'
  });
  const [customerRequirement, setCustomerRequirement] = React.useState<CustomerInquiryRequirementFormFields>({
    ...DEFAULT_CUSTOMER_INQUIRY_REQUIREMENT_FIELDS,
  });

  // Sync showForm state with user login status
  React.useEffect(() => {
    // If user is logged in, don't show the form
    if (user) {
      setShowForm(false);
      // Update formData with user's email
      setFormData(prev => ({
        ...prev,
        email: user.email,
        companyName: userInfo?.companyName || '',
        address: userInfo?.address || '',
        contactPerson: userInfo?.contactPerson || '',
        phone: userInfo?.phone || '',
        website: userInfo?.website || '',
        businessType: userInfo?.businessType || 'Importer'
      }));
    }
  }, [user, userInfo]);

  // Send email function using Web3Forms
  const sendInquiryEmail = async () => {
    // Check if access key is configured
    const accessKey = 'YOUR_WEB3FORMS_ACCESS_KEY';
    if (accessKey === 'YOUR_WEB3FORMS_ACCESS_KEY') {
      // Silently skip email sending if not configured
      // Email setup is optional - users can still download PDF locally
      return true;
    }

    try {
      // Prepare product details
      const productList = cartItems.map((item, index) => {
        const shipping = calculateItemShipping(item);
        return `
${index + 1}. ${item.productName}
   - Material: ${item.material || 'N/A'}
   - Color: ${item.color || 'N/A'}
   - Specification: ${item.specification || 'N/A'}
   - Unit Price: $${item.unitPrice.toFixed(2)}
   - Quantity: ${item.quantity} pcs
   - Cartons: ${shipping.cartons}
   - CBM: ${shipping.cbm} m³
   - Gross Weight: ${shipping.totalGrossWeight} kg
   - Net Weight: ${shipping.totalNetWeight} kg
   - Subtotal: $${(item.unitPrice * item.quantity).toFixed(2)}
        `;
      }).join('\n');

      // Prepare container info
      let containerInfo = '';
      if (planningMode === 'automatic' && recommendedContainer) {
        const utilization = calculateContainerUtilization(
          recommendedContainer,
          totalCbm,
          totalWeight
        );
        containerInfo = `
Recommended Container: ${recommendedContainer.name}
- Capacity: ${recommendedContainer.capacity} m³
- Max Weight: ${recommendedContainer.maxWeight} kg
- Space Utilization: ${utilization.spaceUtilization.toFixed(1)}%
- Weight Utilization: ${utilization.weightUtilization.toFixed(1)}%
        `;
      } else if (planningMode === 'custom' && customContainers) {
        containerInfo = customContainers.map((container, index) => `
Container ${index + 1}: ${container.type.name}
- Capacity: ${container.type.capacity} m³
- Max Weight: ${container.type.maxWeight} kg
- Space Utilization: ${container.utilization.spaceUtilization.toFixed(1)}%
- Weight Utilization: ${container.utilization.weightUtilization.toFixed(1)}%
        `).join('\n');
      }

      // Prepare email content
      const emailContent = `
NEW REQUEST FOR QUOTATION - ${inquiryNumber}
=============================================

CUSTOMER INFORMATION:
---------------------
Company Name: ${formData.companyName}
Contact Person: ${formData.contactPerson}
Business Type: ${formData.businessType}
Email: ${formData.email}
Phone: ${formData.phone}
Address: ${formData.address}
Website: ${formData.website || 'N/A'}

INQUIRY DETAILS:
----------------
Inquiry Number: ${inquiryNumber}
Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
Total Items: ${cartItems.length}

PRODUCTS REQUESTED:
-------------------
${productList}

SHIPPING SUMMARY:
-----------------
Total Cartons: ${totalShipping.cartons}
Total CBM: ${totalShipping.cbm} m³
Total Gross Weight: ${totalShipping.totalGrossWeight} kg
Total Net Weight: ${totalShipping.totalNetWeight} kg

CONTAINER PLANNING:
-------------------
Planning Mode: ${planningMode === 'automatic' ? 'Automatic' : 'Custom'}
${containerInfo}

PRICING:
--------
Total Product Value: $${getTotalPrice().toFixed(2)}

=============================================
This inquiry was submitted via COSUN Building Materials B2B Platform
      `.trim();

      // Send email via Web3Forms
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_key: accessKey,
          subject: `New INQ ${inquiryNumber} from ${formData.companyName}`,
          from_name: formData.companyName,
          email: formData.email,
          to_email: 'gousllc0604@gmail.com',
          message: emailContent,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        return true;
      } else {
        console.error('Email send failed:', data);
        return false;
      }
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  };

  const handleFormChange = (field: string, value: string) => {
    const updatedFormData = { ...formData, [field]: value };
    setFormData(updatedFormData);
    
    // Auto-save to localStorage as user types
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

  // 🔥 Preview inquiry number (without incrementing counter)
  // 🌍 Use current user's region for INQ number
  const [inquiryNumber, setInquiryNumber] = React.useState(() => {
    const regionCode = currentUserRegion === 'North America' ? 'NA' : 
                      currentUserRegion === 'South America' ? 'SA' : 'EA';
    return peekInquiryNumber(regionCode);
  });
  
  // Update preview number when dialog opens or region changes
  React.useEffect(() => {
    if (isOpen) {
      const regionCode = currentUserRegion === 'North America' ? 'NA' : 
                        currentUserRegion === 'South America' ? 'SA' : 'EA';
      const previewNumber = peekInquiryNumber(regionCode);
      setInquiryNumber(previewNumber);
      console.log('🔢 预览 INQ 编号:', previewNumber, '用户区域:', currentUserRegion);
    }
  }, [isOpen, peekInquiryNumber, currentUserRegion]);

  const totalCbm = parseFloat(totalShipping.cbm);
  const totalWeight = parseFloat(totalShipping.totalGrossWeight);
  const rfqContentRef = React.useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = React.useState(false);

  // Download inquiry as PDF using html2canvas and jsPDF
  const downloadPDF = async () => {
    setIsDownloading(true);
    toast.info('Generating PDF...');

    try {
      // Import libraries dynamically
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      if (!rfqContentRef.current) {
        toast.error('Inquiry content not found');
        setIsDownloading(false);
        return;
      }

      const content = rfqContentRef.current;
      
      // Clone the content to avoid modifying the original
      const clonedContent = content.cloneNode(true) as HTMLElement;
      
      // Create a temporary container
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = content.offsetWidth + 'px';
      document.body.appendChild(tempContainer);
      tempContainer.appendChild(clonedContent);
      
      // Force all oklch colors to be replaced with rgb equivalents
      // This is a workaround for html2canvas not supporting oklch
      const allElements = clonedContent.querySelectorAll('*');
      allElements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        const computedStyle = window.getComputedStyle(htmlElement);
        
        // Convert oklch colors in common properties
        const colorProperties = [
          'color', 'backgroundColor', 'borderColor', 
          'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor'
        ];
        
        colorProperties.forEach(prop => {
          const value = computedStyle.getPropertyValue(prop);
          if (value && value.includes('oklch')) {
            // Get the computed RGB value by creating a temporary element
            const temp = document.createElement('div');
            temp.style[prop as any] = value;
            document.body.appendChild(temp);
            const computedValue = window.getComputedStyle(temp).getPropertyValue(prop);
            document.body.removeChild(temp);
            
            // Apply the RGB value directly
            if (prop === 'backgroundColor') {
              htmlElement.style.backgroundColor = computedValue;
            } else if (prop === 'color') {
              htmlElement.style.color = computedValue;
            } else if (prop.includes('border')) {
              htmlElement.style[prop as any] = computedValue;
            }
          }
        });
      });
      
      // Wait a bit to ensure all styles are applied
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Capture the cloned content as canvas
      const canvas = await html2canvas(clonedContent, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: clonedContent.scrollWidth,
        windowHeight: clonedContent.scrollHeight
      });
      
      // Clean up temporary container
      document.body.removeChild(tempContainer);

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      // Add first page
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename
      const filename = `INQ_${inquiryNumber}_${formData.companyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      
      // Download the PDF
      pdf.save(filename);
      
      toast.success('PDF downloaded successfully!');
      setDownloadedFileName(filename);
      setDownloadedFileSize((pdf.output('blob').size / 1024).toFixed(2) + ' KB');
      setShowLocalDownloadSuccess(true);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDownloading(false);
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

          <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-4">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Trading Requirements</h3>
              <p className="mt-1 text-xs text-gray-600">
                These terms become structured ING data instead of staying in free-form notes.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {CUSTOMER_INQUIRY_REQUIREMENT_FIELDS.map((field) => (
                <div
                  key={field.key}
                  className={field.type === 'textarea' && field.key === 'otherRequirements' ? 'md:col-span-2' : ''}
                >
                  <Label htmlFor={`preview-legacy-${field.key}`}>{field.sourceLabel}</Label>
                  <p className="mt-1 text-xs text-gray-500">{field.description}</p>
                  {field.type === 'textarea' ? (
                    <Textarea
                      id={`preview-legacy-${field.key}`}
                      rows={field.rows || 3}
                      value={customerRequirement[field.key] || ''}
                      onChange={(e) => setCustomerRequirement((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="mt-2"
                    />
                  ) : (
                    <Input
                      id={`preview-legacy-${field.key}`}
                      value={customerRequirement[field.key] || ''}
                      onChange={(e) => setCustomerRequirement((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="mt-2"
                    />
                  )}
                </div>
              ))}
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
    <div className="space-y-6 py-4">
      {/* Inquiry Content - This will be printed/exported */}
      <div ref={rfqContentRef}>
      {/* Inquiry Header */}
      <div className="border-b-2 border-gray-800 pb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl mb-2">CUSTOMER INQUIRY</h1>
            <p className="text-sm text-gray-600">Fujian Gaoshengda Fu Building Materials Co., Ltd.</p>
          </div>
          <div className="text-right">
            <div className="bg-red-600 text-white px-4 py-2 rounded-lg mb-2">
              <p className="text-xs">INQ No.</p>
              <p className="text-lg">{inquiryNumber}</p>
            </div>
            <p className="text-xs text-gray-600">
              {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Buyer Information */}
      <div>
        <h2 className="text-lg mb-3 bg-gray-100 px-3 py-2 rounded">BUYER INFORMATION</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <p className="text-gray-600 text-xs mb-1">Company Name:</p>
            <p className="">{formData.companyName}</p>
          </div>
          <div>
            <p className="text-gray-600 text-xs mb-1">Business Type:</p>
            <p className="">{formData.businessType}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-600 text-xs mb-1">Address:</p>
            <p className="">{formData.address}</p>
          </div>
          <div>
            <p className="text-gray-600 text-xs mb-1">Contact Person:</p>
            <p className="">{formData.contactPerson}</p>
          </div>
          <div>
            <p className="text-gray-600 text-xs mb-1">Phone:</p>
            <p className="">{formData.phone}</p>
          </div>
          <div>
            <p className="text-gray-600 text-xs mb-1">Email:</p>
            <p className="">{formData.email}</p>
          </div>
          <div>
            <p className="text-gray-600 text-xs mb-1">Website:</p>
            <p className="">{formData.website || 'N/A'}</p>
          </div>
        </div>
        {/* Edit button - hide on print */}
        <div className="mt-3 text-right print-hide">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowForm(true)}
            className="text-blue-600 hover:text-blue-700 text-xs"
          >
            Edit Information
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-lg mb-3 bg-gray-100 px-3 py-2 rounded">TRADING REQUIREMENTS</h2>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {CUSTOMER_INQUIRY_REQUIREMENT_FIELDS
                .map((field) => ({
                  label: field.previewLabel,
                  value: customerRequirement[field.key]?.trim() || '',
                }))
                .filter((row) => row.value)
                .map((row) => (
                  <tr key={row.label} className="border-b last:border-b-0">
                    <td className="w-[30%] bg-gray-50 px-3 py-2 font-medium">{row.label}</td>
                    <td className="px-3 py-2">{row.value}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Details */}
      <div>
        <h2 className="text-lg mb-3 bg-gray-100 px-3 py-2 rounded">PRODUCT DETAILS</h2>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 border-b text-xs">No.</th>
                <th className="text-left px-3 py-2 border-b text-xs">Product Description</th>
                <th className="text-right px-3 py-2 border-b text-xs">Quantity</th>
                <th className="text-right px-3 py-2 border-b text-xs">Cartons</th>
                <th className="text-right px-3 py-2 border-b text-xs">CBM</th>
                <th className="text-right px-3 py-2 border-b text-xs">G.W. (kg)</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item, index) => {
                const shipping = calculateItemShipping(item);
                return (
                  <tr key={`${item.productName}-${item.color}-${item.specification}-${index}`} className="border-b">
                    <td className="px-3 py-2 text-xs text-gray-600">{index + 1}</td>
                    <td className="px-3 py-2">
                      <p className="text-xs mb-0.5">{item.productName}</p>
                      <p className="text-xs text-gray-500">
                        {item.material} | {item.color} | {item.specification}
                      </p>
                    </td>
                    <td className="px-3 py-2 text-right text-xs">{item.quantity} pcs</td>
                    <td className="px-3 py-2 text-right text-xs">{shipping.cartons.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right text-xs">{shipping.cbm} m³</td>
                    <td className="px-3 py-2 text-right text-xs">{shipping.totalGrossWeight} kg</td>
                  </tr>
                );
              })}
              <tr className="bg-gray-50">
                <td colSpan={3} className="px-3 py-2 text-right text-xs">TOTAL:</td>
                <td className="px-3 py-2 text-right text-xs">{totalShipping.cartons}</td>
                <td className="px-3 py-2 text-right text-xs">{totalShipping.cbm} m³</td>
                <td className="px-3 py-2 text-right text-xs">{totalShipping.totalGrossWeight} kg</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Shipping Summary */}
      <div>
        <h2 className="text-lg mb-3 bg-gray-100 px-3 py-2 rounded">SHIPPING REQUIREMENTS</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
            <p className="text-xs text-gray-600 mb-1">Total Cartons</p>
            <p className="text-lg text-orange-600">{totalShipping.cartons}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
            <p className="text-xs text-gray-600 mb-1">Total Volume</p>
            <p className="text-lg text-orange-600">{totalShipping.cbm} m³</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
            <p className="text-xs text-gray-600 mb-1">Gross Weight</p>
            <p className="text-lg text-orange-600">{(parseFloat(totalShipping.totalGrossWeight) / 1000).toFixed(2)} T</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
            <p className="text-xs text-gray-600 mb-1">Net Weight</p>
            <p className="text-lg text-orange-600">{(parseFloat(totalShipping.totalNetWeight) / 1000).toFixed(2)} T</p>
          </div>
        </div>
      </div>

      {/* Container Planning */}
      <div>
        <h2 className="text-lg mb-3 bg-gray-100 px-3 py-2 rounded">CONTAINER PLANNING</h2>
        {planningMode === 'automatic' && recommendedContainer ? (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            {(() => {
              const util = calculateContainerUtilization(recommendedContainer, totalCbm, totalWeight);
              return (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm">Recommended Container:</span>
                    <span className="bg-blue-600 text-white px-4 py-1 rounded text-sm">
                      1 × {util.spec.name}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">Space Utilization</span>
                        <span className={getUtilizationColor(util.spaceUtilization)}>
                          {util.spaceUtilization.toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(util.spaceUtilization, 100)} 
                        className="h-2"
                        indicatorClassName={getUtilizationBgColor(util.spaceUtilization)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {util.spaceUsed.toFixed(2)} / {util.spec.volume} m³
                      </p>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">Weight Utilization</span>
                        <span className={getUtilizationColor(util.weightUtilization)}>
                          {util.weightUtilization.toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(util.weightUtilization, 100)} 
                        className="h-2"
                        indicatorClassName={getUtilizationBgColor(util.weightUtilization)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {(util.weightUsed / 1000).toFixed(2)} / {(util.spec.maxPayload / 1000).toFixed(0)} T
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded p-3 text-xs">
                    <p className="text-gray-600 mb-1">Container Specifications:</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-gray-500">Internal Dim:</span>
                        <p>{util.spec.internalDim}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Max Volume:</span>
                        <p>{util.spec.volume} m³</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Max Payload:</span>
                        <p>{(util.spec.maxPayload / 1000).toFixed(0)} T</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-blue-200 text-xs text-gray-600">
                    💡 {getUtilizationTip(util.spaceUtilization, util.weightUtilization)}
                  </div>
                </>
              );
            })()}
          </div>
        ) : customContainers && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm mb-3">Custom Container Configuration:</p>
            <div className="space-y-2">
              {customContainers.map((container) => {
                const spec = containerSpecs[container.type];
                return (
                  <div key={container.id} className="flex items-center justify-between bg-white rounded p-2 border text-sm">
                    <span>{spec.name}</span>
                    <span className="text-gray-600">Quantity: {container.quantity}</span>
                    <span className="text-xs text-gray-500">
                      {(spec.volume * container.quantity).toFixed(0)} m³ | {(spec.maxPayload * container.quantity / 1000).toFixed(0)} T
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t text-sm">
              {(() => {
                const totalCapacity = customContainers.reduce((sum, c) => sum + (containerSpecs[c.type].volume * c.quantity), 0);
                const totalWeightCapacity = customContainers.reduce((sum, c) => sum + (containerSpecs[c.type].maxPayload * c.quantity), 0);
                const spaceUtil = (totalCbm / totalCapacity) * 100;
                const weightUtil = (totalWeight / totalWeightCapacity) * 100;
                return (
                  <div className="grid grid-cols-2 gap-3 bg-white rounded p-3">
                    <div>
                      <p className="text-gray-600 text-xs mb-1">Total Capacity</p>
                      <p>{totalCapacity.toFixed(0)} m³</p>
                      <p className={`text-xs ${getUtilizationColor(spaceUtil)}`}>
                        Space: {spaceUtil.toFixed(1)}% utilized
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs mb-1">Total Weight Capacity</p>
                      <p>{(totalWeightCapacity / 1000).toFixed(0)} T</p>
                      <p className={`text-xs ${getUtilizationColor(weightUtil)}`}>
                        Weight: {weightUtil.toFixed(1)}% utilized
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Order Total */}
      <div>
        <h2 className="text-lg mb-3 bg-gray-100 px-3 py-2 rounded">ESTIMATED VALUE</h2>
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-600 mb-1">Total Estimated FOB Value</p>
              <p className="text-sm text-gray-500">
                ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} pieces in {totalShipping.cartons} cartons)
              </p>
            </div>
            <p className="text-3xl text-orange-600">${getTotalPrice().toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Terms & Conditions */}
      <div>
        <h2 className="text-lg mb-3 bg-gray-100 px-3 py-2 rounded">TERMS & CONDITIONS</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <ul className="text-xs space-y-2 text-gray-700">
            <li>• This inquiry is valid for 30 days from the date of issue.</li>
            <li>• All prices are estimated FOB values and subject to confirmation.</li>
            <li>• Final pricing, shipping costs, payment terms, and delivery schedule will be negotiated separately.</li>
            <li>• Lead time will be confirmed upon order confirmation.</li>
            <li>• Product specifications and availability are subject to change without notice.</li>
            <li>• Quality control and inspection standards will be agreed upon before shipment.</li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-gray-800 pt-4 text-center text-xs text-gray-500">
        <p>This document was generated automatically by the COSUN Building Materials Online Inquiry System.</p>
        <p>For questions or clarifications, please contact our sales team at sales@cosunbm.com</p>
        <p className="mt-2">© {new Date().getFullYear()} Fujian Gaoshengda Fu Building Materials Co., Ltd. All rights reserved.</p>
      </div>
      </div>

      {/* Action Buttons - Hidden on Print */}
      <div className="print-hide mt-6 pt-6 border-t-2 border-gray-300">
        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.print()}
            className="px-8"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Inquiry
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowSaveDialog(true)}
            disabled={isDownloading}
            className="px-8 border-green-600 text-green-600 hover:bg-green-50"
          >
            <Download className="h-4 w-4 mr-2" />
            {isDownloading ? 'Generating...' : 'Save Inquiry'}
          </Button>
          <Button
            size="lg"
            className="bg-orange-600 hover:bg-orange-700 text-white px-12"
            disabled={isSubmitting}
            onClick={async () => {
              setIsSubmitting(true);
              
              console.log('🚀 [Preview] 开始提交询价...');
              console.log('👤 [Preview] 当前用户:', user);
              console.log('📧 [Preview] 用户邮箱:', formData.email);
              
              try {
                // 🔥 Generate inquiry number from Supabase DB (atomic, concurrency-safe)
                const regionCode = currentUserRegion === 'North America' ? 'NA' :
                                  currentUserRegion === 'South America' ? 'SA' : 'EA';
                let finalInquiryNumber: string;
                try {
                  finalInquiryNumber = await nextInquiryNumber(regionCode, user?.id ?? undefined);
                } catch (numErr) {
                  console.error('[Submit] Failed to generate inquiry number:', numErr);
                  toast.error('Failed to generate inquiry number. Please try again.');
                  setIsSubmitting(false);
                  return;
                }
                console.log('✅ [Submit] DB-generated INQ number:', finalInquiryNumber, 'region:', regionCode);

                // Send email (non-blocking — don't gate inquiry creation on email)
                sendInquiryEmail().catch(e => console.warn('[Submit] Email send failed (non-critical):', e));

                const date = new Date();
                const customerInquiry = {
                  id: finalInquiryNumber,
                  inquiryNumber: finalInquiryNumber,
                  date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
                  userEmail: user?.email || formData.email,
                  products: cartItems,
                  status: 'pending' as const,
                  isSubmitted: true,
                  totalPrice: getTotalPrice(),
                  shippingInfo: totalShipping,
                  containerInfo: {
                    planningMode,
                    recommendedContainer: planningMode === 'automatic' ? recommendedContainer?.name : undefined,
                    customContainers: planningMode === 'custom' ? customContainers : undefined,
                  },
                  buyerInfo: {
                    companyName: formData.companyName,
                    contactPerson: formData.contactPerson,
                    email: formData.email,
                    phone: formData.phone,
                    mobile: formData.mobile || '',
                    address: formData.address,
                    website: formData.website || '',
                    businessType: formData.businessType || ''
                  },
                  region: regionCode,
                  requirements: { ...customerRequirement },
                  message: buildCustomerInquiryRequirementText(customerRequirement),
                  createdAt: Date.now(),
                  submittedAt: Date.now(),
                };
                (customerInquiry as any).templateSnapshot = { pendingResolution: true };
                (customerInquiry as any).documentRenderMeta = null;
                (customerInquiry as any).documentDataSnapshot = adaptInquiryToDocumentData(customerInquiry as any);

                // Save to Supabase (awaited — failure surfaces to user)
                await addInquiry(customerInquiry);
                console.log('✅ [Preview] Inquiry saved to Supabase:', customerInquiry.id);

                clearCart();
                setShowSuccessDialog(true);
                toast.success(`Inquiry ${finalInquiryNumber} submitted successfully!`);
              } catch (error) {
                console.error('Error submitting inquiry:', error);
                toast.error('An error occurred while submitting your inquiry.');
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
          </Button>
        </div>
        <p className="text-center text-xs text-gray-500 mt-3">
          By submitting this inquiry, you agree to our terms and conditions.
        </p>
      </div>

      {/* Success Confirmation Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-xl">
              Inquiry Received!
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-center space-y-3">
                <div className="text-base">
                  We have successfully received your inquiry <span className="font-semibold text-orange-600">{inquiryNumber}</span>.
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-left">
                  <div className="text-blue-900 mb-2">📧 <strong>What happens next?</strong></div>
                  <ul className="space-y-1 text-blue-800 text-xs">
                    <li>• Our sales team will review your request carefully</li>
                    <li>• You will receive a detailed quotation within 24 hours</li>
                    <li>• We'll contact you via email: <strong>{formData.email}</strong></li>
                    <li>• Check your inbox and spam folder regularly</li>
                  </ul>
                </div>
                <div className="text-sm text-gray-600">
                  Thank you for choosing <strong>COSUN Building Materials</strong>!
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction
              onClick={() => {
                setShowSuccessDialog(false);
                setTimeout(() => {
                  if (onClose) onClose();
                }, 300);
              }}
              className="bg-orange-600 hover:bg-orange-700 px-8"
            >
              Got it, Thanks!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save Options Dialog */}
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-xl">
              Choose Save Location
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 py-4">
                <p className="text-center text-sm text-gray-600">
                  Where would you like to save your inquiry document?
                </p>
                
                {/* Save Options */}
                <div className="grid grid-cols-1 gap-3">
                  {/* Save to Local Computer */}
                  <button
                    onClick={async () => {
                      setShowSaveDialog(false);
                      await downloadPDF();
                    }}
                    className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200">
                      <HardDrive className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-gray-900">Save to Local Computer</h3>
                      <p className="text-sm text-gray-600">Choose where to save on your computer</p>
                    </div>
                    <Download className="h-5 w-5 text-gray-400 group-hover:text-green-600" />
                  </button>

                  {/* Save to Cloud - Google Drive */}
                  <button
                    onClick={() => {
                      setShowSaveDialog(false);
                      setShowCloudSelector(true);
                    }}
                    className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group relative"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200">
                      <Cloud className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-gray-900">Save to Cloud Storage</h3>
                      <p className="text-sm text-gray-600">Google Drive, Dropbox, OneDrive</p>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded">
                        Coming Soon
                      </span>
                    </div>
                  </button>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
                  <p className="flex items-start gap-2">
                    <span className="text-blue-600">ℹ️</span>
                    <span>
                      <strong>Note:</strong> Cloud storage integration requires authentication with your cloud provider. 
                      The local download option is immediately available and recommended.
                    </span>
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowSaveDialog(false)}>
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Local Download Success Dialog */}
      <AlertDialog open={showLocalDownloadSuccess} onOpenChange={setShowLocalDownloadSuccess}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-xl">
              Download Complete
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-center space-y-3">
                <div className="text-base">
                  Your inquiry document <span className="font-semibold text-orange-600">{downloadedFileName}</span> has been successfully downloaded to your local computer.
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-left">
                  <div className="text-gray-900 mb-2">💾 <strong>File Details:</strong></div>
                  <ul className="space-y-1 text-gray-800 text-xs">
                    <li>• File Name: {downloadedFileName}</li>
                    <li>• File Size: {downloadedFileSize}</li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction
              onClick={() => {
                setShowLocalDownloadSuccess(false);
                if (onClose) onClose();
              }}
              className="bg-orange-600 hover:bg-orange-700 px-8"
            >
              Got it, Thanks!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cloud Service Selector Dialog */}
      <AlertDialog open={showCloudSelector} onOpenChange={setShowCloudSelector}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-xl">
              Select Cloud Service
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 py-4">
                <p className="text-center text-sm text-gray-600">
                  Choose a cloud service to save your inquiry document.
                </p>
                
                {/* Cloud Service Options */}
                <div className="grid grid-cols-1 gap-3">
                  {/* Google Drive */}
                  <button
                    onClick={() => {
                      setSelectedCloudService('google');
                      setShowCloudSelector(false);
                      setShowCloudUploadProgress(true);
                      toast.info('Cloud storage integration coming soon! For now, please download to local computer.');
                    }}
                    className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200">
                      <Cloud className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-gray-900">Google Drive</h3>
                      <p className="text-sm text-gray-600">Save to Google Drive</p>
                    </div>
                    <Download className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                  </button>

                  {/* Dropbox */}
                  <button
                    onClick={() => {
                      setSelectedCloudService('dropbox');
                      setShowCloudSelector(false);
                      setShowCloudUploadProgress(true);
                      toast.info('Cloud storage integration coming soon! For now, please download to local computer.');
                    }}
                    className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200">
                      <Cloud className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-gray-900">Dropbox</h3>
                      <p className="text-sm text-gray-600">Save to Dropbox</p>
                    </div>
                    <Download className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                  </button>

                  {/* OneDrive */}
                  <button
                    onClick={() => {
                      setSelectedCloudService('onedrive');
                      setShowCloudSelector(false);
                      setShowCloudUploadProgress(true);
                      toast.info('Cloud storage integration coming soon! For now, please download to local computer.');
                    }}
                    className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200">
                      <Cloud className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-gray-900">OneDrive</h3>
                      <p className="text-sm text-gray-600">Save to OneDrive</p>
                    </div>
                    <Download className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                  </button>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
                  <p className="flex items-start gap-2">
                    <span className="text-blue-600">ℹ️</span>
                    <span>
                      <strong>Note:</strong> Cloud storage integration requires authentication with your cloud provider. 
                      The local download option is immediately available and recommended.
                    </span>
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowCloudSelector(false)}>
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cloud Upload Progress Dialog */}
      <AlertDialog open={showCloudUploadProgress} onOpenChange={setShowCloudUploadProgress}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Download className="h-10 w-10 text-blue-600" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-xl">
              Uploading Inquiry
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-center space-y-3">
                <div className="text-base">
                  Your inquiry document is being uploaded to {selectedCloudService?.charAt(0).toUpperCase() + selectedCloudService?.slice(1)}.
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-left">
                  <div className="text-gray-900 mb-2">🔄 <strong>Progress:</strong></div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction
              onClick={() => {
                setShowCloudUploadProgress(false);
                if (onClose) onClose();
              }}
              className="bg-gray-600 hover:bg-gray-700 px-8"
            >
              Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cloud Upload Success Dialog */}
      <AlertDialog open={showCloudUploadSuccess} onOpenChange={setShowCloudUploadSuccess}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-xl">
              Upload Complete
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-center space-y-3">
                <div className="text-base">
                  Your inquiry document <span className="font-semibold text-orange-600">{downloadedFileName}</span> has been successfully uploaded to {selectedCloudService?.charAt(0).toUpperCase() + selectedCloudService?.slice(1)}.
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-left">
                  <div className="text-gray-900 mb-2">💾 <strong>File Details:</strong></div>
                  <ul className="space-y-1 text-gray-800 text-xs">
                    <li>• File Name: {downloadedFileName}</li>
                    <li>• File Size: {downloadedFileSize}</li>
                    <li>• File URL: <a href={cloudFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">Open in {selectedCloudService?.charAt(0).toUpperCase() + selectedCloudService?.slice(1)}</a></li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction
              onClick={() => {
                setShowCloudUploadSuccess(false);
                if (onClose) onClose();
              }}
              className="bg-orange-600 hover:bg-orange-700 px-8"
            >
              Got it, Thanks!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
