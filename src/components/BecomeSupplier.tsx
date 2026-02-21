import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { 
  Building2, 
  Upload, 
  CheckCircle2, 
  Mail, 
  Phone, 
  MapPin, 
  Globe,
  Users,
  TrendingUp,
  Shield,
  Zap,
  Package
} from 'lucide-react';
import { Badge } from './ui/badge';

export function BecomeSupplier() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    country: '',
    website: '',
    productCategory: '',
    annualCapacity: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Supplier application:', formData);
    // Add your form submission logic here
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 py-16 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-600 hover:bg-blue-700">
            {t.becomeSupplier?.badge || 'Partnership Opportunity'}
          </Badge>
          <h1 className="text-gray-900 mb-6">
            {t.becomeSupplier?.title || 'Become Our Supplier Partner'}
          </h1>
          <p className="text-orange-600 max-w-3xl mx-auto text-xl mb-4">
            {t.becomeSupplier?.openingLine || 'Choosing us means you are among the best.'}
          </p>
          <p className="text-gray-600 max-w-3xl mx-auto text-lg">
            {t.becomeSupplier?.subtitle || 'Join our global supplier network and gain access to thousands of potential customers. Once approved, you\'ll manage your own product catalog on our platform.'}
          </p>
        </div>

        {/* Key Benefits */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-gray-900 mb-2">
                {t.becomeSupplier?.benefit1Title || 'Large Customer Base'}
              </h3>
              <p className="text-sm text-gray-600">
                {t.becomeSupplier?.benefit1Desc || 'Access to our extensive network of international buyers'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-4">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-gray-900 mb-2">
                {t.becomeSupplier?.benefit2Title || 'Business Growth'}
              </h3>
              <p className="text-sm text-gray-600">
                {t.becomeSupplier?.benefit2Desc || 'Expand your market reach and increase sales volume'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-600 mb-4">
                <Upload className="h-6 w-6" />
              </div>
              <h3 className="text-gray-900 mb-2">
                {t.becomeSupplier?.benefit3Title || 'Self-Management'}
              </h3>
              <p className="text-sm text-gray-600">
                {t.becomeSupplier?.benefit3Desc || 'Full control over your product listings and updates'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-600 mb-4">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-gray-900 mb-2">
                {t.becomeSupplier?.benefit4Title || 'Secure Platform'}
              </h3>
              <p className="text-sm text-gray-600">
                {t.becomeSupplier?.benefit4Desc || 'Reliable and secure business environment'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Process Section */}
          <div>
            <h2 className="text-gray-900 mb-8">
              {t.becomeSupplier?.processTitle || 'How It Works'}
            </h2>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white">
                    1
                  </div>
                </div>
                <div>
                  <h3 className="text-gray-900 mb-2">
                    {t.becomeSupplier?.step1Title || 'Submit Application'}
                  </h3>
                  <p className="text-gray-600">
                    {t.becomeSupplier?.step1Desc || 'Fill out the application form with your company details and product information'}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white">
                    2
                  </div>
                </div>
                <div>
                  <h3 className="text-gray-900 mb-2">
                    {t.becomeSupplier?.step2Title || 'Verification Process'}
                  </h3>
                  <p className="text-gray-600">
                    {t.becomeSupplier?.step2Desc || 'Our team will review your application and verify your credentials'}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white">
                    3
                  </div>
                </div>
                <div>
                  <h3 className="text-gray-900 mb-2">
                    {t.becomeSupplier?.step3Title || 'Account Approval'}
                  </h3>
                  <p className="text-gray-600">
                    {t.becomeSupplier?.step3Desc || 'Once approved, you\'ll receive login credentials for your supplier portal'}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-600 text-white">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-gray-900 mb-2">
                    {t.becomeSupplier?.step4Title || 'Upload Your Products'}
                  </h3>
                  <p className="text-gray-600">
                    {t.becomeSupplier?.step4Desc || 'Start uploading and managing your product catalog independently'}
                  </p>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="mt-8 p-6 bg-amber-50 border-2 border-amber-200 rounded-lg">
              <div className="flex gap-3">
                <Package className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-amber-900 mb-2">
                    {t.becomeSupplier?.noticeTitle || 'Important: Product Management'}
                  </h4>
                  <p className="text-sm text-amber-800">
                    {t.becomeSupplier?.noticeDesc || 'Once approved as our supplier, you will be responsible for uploading and maintaining your own product listings. This includes product descriptions, specifications, images, pricing, and inventory updates.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Application Form */}
          <div>
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  {t.becomeSupplier?.formTitle || 'Supplier Application Form'}
                </CardTitle>
                <CardDescription>
                  {t.becomeSupplier?.formDesc || 'Fill in the details below and our team will contact you soon'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">
                      {t.becomeSupplier?.companyName || 'Company Name'} *
                    </Label>
                    <Input
                      id="companyName"
                      placeholder={t.becomeSupplier?.companyNamePlaceholder || 'Your company name'}
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">
                      {t.becomeSupplier?.contactPerson || 'Contact Person'} *
                    </Label>
                    <Input
                      id="contactPerson"
                      placeholder={t.becomeSupplier?.contactPersonPlaceholder || 'Full name'}
                      value={formData.contactPerson}
                      onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        {t.becomeSupplier?.email || 'Email'} *
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          className="pl-10"
                          placeholder="email@company.com"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        {t.becomeSupplier?.phone || 'Phone'} *
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="phone"
                          type="tel"
                          className="pl-10"
                          placeholder="+86 XXX XXXX XXXX"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country">
                        {t.becomeSupplier?.country || 'Country/Region'} *
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="country"
                          className="pl-10"
                          placeholder={t.becomeSupplier?.countryPlaceholder || 'Your country'}
                          value={formData.country}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">
                        {t.becomeSupplier?.website || 'Website'}
                      </Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="website"
                          type="url"
                          className="pl-10"
                          placeholder="https://www.yourcompany.com"
                          value={formData.website}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productCategory">
                      {t.becomeSupplier?.productCategory || 'Product Category'} *
                    </Label>
                    <Input
                      id="productCategory"
                      placeholder={t.becomeSupplier?.productCategoryPlaceholder || 'e.g., Steel sheets, Building materials'}
                      value={formData.productCategory}
                      onChange={(e) => handleInputChange('productCategory', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="annualCapacity">
                      {t.becomeSupplier?.annualCapacity || 'Annual Production Capacity'}
                    </Label>
                    <Input
                      id="annualCapacity"
                      placeholder={t.becomeSupplier?.annualCapacityPlaceholder || 'e.g., 10,000 tons/year'}
                      value={formData.annualCapacity}
                      onChange={(e) => handleInputChange('annualCapacity', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">
                      {t.becomeSupplier?.message || 'Additional Information'}
                    </Label>
                    <Textarea
                      id="message"
                      placeholder={t.becomeSupplier?.messagePlaceholder || 'Tell us more about your company and products...'}
                      rows={4}
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                    />
                  </div>

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                    <Zap className="h-4 w-4 mr-2" />
                    {t.becomeSupplier?.submitButton || 'Submit Application'}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    {t.becomeSupplier?.privacyNote || 'By submitting this form, you agree to our terms and conditions. We will review your application within 3-5 business days.'}
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact Alternative */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-12 text-center text-white">
          <h2 className="text-white mb-4">
            {t.becomeSupplier?.ctaTitle || 'Have Questions?'}
          </h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            {t.becomeSupplier?.ctaDesc || 'Our team is ready to answer any questions about the supplier partnership program'}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="secondary" size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              <Mail className="h-5 w-5 mr-2" />
              services@cosunchina.com
            </Button>
            <Button variant="secondary" size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              <Phone className="h-5 w-5 mr-2" />
              +86 13799993509
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
