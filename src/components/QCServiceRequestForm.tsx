import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Building2, User, Mail, Phone, Calendar, Package, FileCheck, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface QCServiceRequestFormProps {
  trigger?: React.ReactNode;
}

export function QCServiceRequestForm({ trigger }: QCServiceRequestFormProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    requirements: '',
    inspectionFrequency: '',
    productCategories: [] as string[],
    qualityStandards: [] as string[],
    expectedInspectionDate: '',
    urgency: '',
    additionalNotes: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: 'productCategories' | 'qualityStandards', value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.companyName || !formData.contactName || !formData.email || !formData.phone) {
      toast.error(t.qcServiceForm?.validationError || 'Please fill in all required fields');
      return;
    }

    // In a real application, this would send the data to a backend
    console.log('QC Service Request:', formData);
    
    setSubmitted(true);
    toast.success(t.qcServiceForm?.submitSuccess || 'Request submitted successfully');

    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
      setOpen(false);
      setFormData({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        requirements: '',
        inspectionFrequency: '',
        productCategories: [],
        qualityStandards: [],
        expectedInspectionDate: '',
        urgency: '',
        additionalNotes: '',
      });
    }, 3000);
  };

  const productCategoryOptions = [
    'Toys',
    'Electronics',
    'Appliances',
    'Lighting',
    'Textiles & Garments',
    'Shoes',
    'Furniture',
    'Packaging',
  ];

  const qualityStandardOptions = [
    'ISO 9001',
    'ASTM Standards',
    'EN Standards',
    'GB Standards',
    'ANSI Standards',
    'CE Certification',
    'Other',
  ];

  const frequencyOptions = [
    { value: '1-5', label: t.qcServiceForm?.frequency1to5 || '1-5 inspections/month' },
    { value: '6-10', label: t.qcServiceForm?.frequency6to10 || '6-10 inspections/month' },
    { value: '11-20', label: t.qcServiceForm?.frequency11to20 || '11-20 inspections/month' },
    { value: '20+', label: t.qcServiceForm?.frequency20plus || '20+ inspections/month' },
  ];

  const urgencyOptions = [
    { value: 'low', label: t.qcServiceForm?.urgencyLow || 'Low - Within 2 weeks' },
    { value: 'medium', label: t.qcServiceForm?.urgencyMedium || 'Medium - Within 1 week' },
    { value: 'high', label: t.qcServiceForm?.urgencyHigh || 'High - Within 3 days' },
    { value: 'urgent', label: t.qcServiceForm?.urgencyUrgent || 'Urgent - ASAP' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
            {t.qcMaster?.ctaButton || 'Request QC Service'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" lang="en">
        {!submitted ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <FileCheck className="h-6 w-6 text-blue-600" />
                {t.qcServiceForm?.title || 'Request Quality Control Service'}
              </DialogTitle>
              <DialogDescription>
                {t.qcServiceForm?.description || 'Fill out the form below and our QC experts will contact you within 24 hours'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              {/* Company Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    {t.qcServiceForm?.companyInfoTitle || 'Company Information'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="flex items-center gap-1">
                        {t.qcServiceForm?.companyName || 'Company Name'} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                        placeholder={t.qcServiceForm?.companyNamePlaceholder || 'Enter your company name'}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactName" className="flex items-center gap-1">
                        {t.qcServiceForm?.contactName || 'Contact Person'} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="contactName"
                        value={formData.contactName}
                        onChange={(e) => handleInputChange('contactName', e.target.value)}
                        placeholder={t.qcServiceForm?.contactNamePlaceholder || 'Enter contact person name'}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-1">
                        {t.qcServiceForm?.email || 'Email Address'} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder={t.qcServiceForm?.emailPlaceholder || 'your.email@company.com'}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-1">
                        {t.qcServiceForm?.phone || 'Phone Number'} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder={t.qcServiceForm?.phonePlaceholder || '+86 138 0000 0000'}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Service Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    {t.qcServiceForm?.serviceRequirementsTitle || 'Service Requirements'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="requirements">
                      {t.qcServiceForm?.specificRequirements || 'Specific Requirements'}
                    </Label>
                    <Textarea
                      id="requirements"
                      value={formData.requirements}
                      onChange={(e) => handleInputChange('requirements', e.target.value)}
                      placeholder={t.qcServiceForm?.requirementsPlaceholder || 'Describe your specific QC requirements, inspection scope, and any special concerns'}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="inspectionFrequency">
                        {t.qcServiceForm?.inspectionFrequency || 'Monthly Inspection Frequency'}
                      </Label>
                      <Select value={formData.inspectionFrequency} onValueChange={(value) => handleInputChange('inspectionFrequency', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder={t.qcServiceForm?.selectFrequency || 'Select frequency'} />
                        </SelectTrigger>
                        <SelectContent>
                          {frequencyOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="urgency">
                        {t.qcServiceForm?.urgency || 'Urgency Level'}
                      </Label>
                      <Select value={formData.urgency} onValueChange={(value) => handleInputChange('urgency', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder={t.qcServiceForm?.selectUrgency || 'Select urgency level'} />
                        </SelectTrigger>
                        <SelectContent>
                          {urgencyOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expectedInspectionDate">
                        {t.qcServiceForm?.expectedDate || 'Expected Inspection Date'} <span className="text-gray-500 text-sm">(YYYY-MM-DD)</span>
                      </Label>
                      <Input
                        id="expectedInspectionDate"
                        type="date"
                        lang="en-US"
                        value={formData.expectedInspectionDate}
                        onChange={(e) => handleInputChange('expectedInspectionDate', e.target.value)}
                        placeholder="YYYY-MM-DD"
                        className="[&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>{t.qcServiceForm?.productCategories || 'Product Categories'}</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {productCategoryOptions.map((category) => (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${category}`}
                            checked={formData.productCategories.includes(category)}
                            onCheckedChange={(checked) => handleCheckboxChange('productCategories', category, checked as boolean)}
                          />
                          <Label
                            htmlFor={`category-${category}`}
                            className="text-sm cursor-pointer"
                          >
                            {category}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>{t.qcServiceForm?.qualityStandards || 'Quality Standards Required'}</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {qualityStandardOptions.map((standard) => (
                        <div key={standard} className="flex items-center space-x-2">
                          <Checkbox
                            id={`standard-${standard}`}
                            checked={formData.qualityStandards.includes(standard)}
                            onCheckedChange={(checked) => handleCheckboxChange('qualityStandards', standard, checked as boolean)}
                          />
                          <Label
                            htmlFor={`standard-${standard}`}
                            className="text-sm cursor-pointer"
                          >
                            {standard}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="additionalNotes">
                      {t.qcServiceForm?.additionalNotes || 'Additional Notes'}
                    </Label>
                    <Textarea
                      id="additionalNotes"
                      value={formData.additionalNotes}
                      onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                      placeholder={t.qcServiceForm?.additionalNotesPlaceholder || 'Any other information you would like to share'}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="flex-1"
                >
                  {t.qcServiceForm?.cancel || 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {t.qcServiceForm?.submit || 'Submit Request'}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="py-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-2xl mb-2 text-gray-900">
              {t.qcServiceForm?.successTitle || 'Request Submitted Successfully!'}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {t.qcServiceForm?.successMessage || 'Thank you for your request. Our QC experts will review your requirements and contact you within 24 hours.'}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}