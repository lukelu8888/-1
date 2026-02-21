import { useState } from 'react';
import { ArrowLeft, Building2, User, Mail, Phone, Package, Calendar, FileText, Send, MapPin, Ship, DollarSign } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';
import type { FreightRate } from '../data/freightRatesData';

interface FreightQuoteFormProps {
  selectedRate: FreightRate;
  origin: string;
  destination: string;
  containerType: '20GP' | '40GP' | '40HC';
  onBack: () => void;
}

export function FreightQuoteForm({ selectedRate, origin, destination, containerType, onBack }: FreightQuoteFormProps) {
  const [formData, setFormData] = useState({
    // Company Information
    companyName: '',
    businessType: '',
    
    // Contact Information
    contactName: '',
    email: '',
    phone: '',
    position: '',
    
    // Shipment Details
    cargoDescription: '',
    hsCode: '',
    quantity: '1',
    totalWeight: '',
    totalVolume: '',
    
    // Shipping Preferences
    estimatedShipDate: '',
    incoterms: 'FOB',
    insuranceRequired: 'yes',
    customsClearance: 'yes',
    
    // Additional Information
    specialRequirements: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.companyName || !formData.contactName || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    // Simulate API submission
    setTimeout(() => {
      toast.success('Quote request submitted successfully! We will contact you within 24 hours.');
      setIsSubmitting(false);
      
      // Here you would typically send the data to your backend
      console.log('Quote Request Data:', {
        ...formData,
        selectedRate,
        origin,
        destination,
        containerType,
      });
    }, 1500);
  };

  const getPrice = () => {
    switch (containerType) {
      case '20GP':
        return selectedRate.rate20GP;
      case '40GP':
        return selectedRate.rate40GP;
      case '40HC':
        return selectedRate.rate40HC;
      default:
        return selectedRate.rate40HC;
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        onClick={onBack}
        variant="outline"
        className="gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Rates
      </Button>

      {/* Selected Quote Summary */}
      <Card className="border-2 border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-md">
                <Ship className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">{selectedRate.carrier}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {origin} → {destination}
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    {containerType}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {selectedRate.transitTime}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Quote Price</div>
              <div className="text-3xl font-bold text-red-600">
                ${getPrice().toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">per {containerType}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Information Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Company & Contact Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-red-600" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="companyName">
                      Company Name <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      placeholder="Enter your company name"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="businessType">Business Type</Label>
                    <Select
                      value={formData.businessType}
                      onValueChange={(value) => handleInputChange('businessType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manufacturer">Manufacturer</SelectItem>
                        <SelectItem value="trading">Trading Company</SelectItem>
                        <SelectItem value="distributor">Distributor</SelectItem>
                        <SelectItem value="retailer">Retailer</SelectItem>
                        <SelectItem value="freight-forwarder">Freight Forwarder</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-red-600" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactName">
                      Contact Name <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="contactName"
                      value={formData.contactName}
                      onChange={(e) => handleInputChange('contactName', e.target.value)}
                      placeholder="Enter contact name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      placeholder="e.g., Purchasing Manager"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">
                      Email Address <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="email@company.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">
                      Phone Number <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-red-600" />
                  Shipment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="cargoDescription">Cargo Description</Label>
                    <Input
                      id="cargoDescription"
                      value={formData.cargoDescription}
                      onChange={(e) => handleInputChange('cargoDescription', e.target.value)}
                      placeholder="e.g., Building materials, tiles"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hsCode">HS Code (if known)</Label>
                    <Input
                      id="hsCode"
                      value={formData.hsCode}
                      onChange={(e) => handleInputChange('hsCode', e.target.value)}
                      placeholder="e.g., 6907.21"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantity">Number of Containers</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', e.target.value)}
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalWeight">Total Weight (kg)</Label>
                    <Input
                      id="totalWeight"
                      value={formData.totalWeight}
                      onChange={(e) => handleInputChange('totalWeight', e.target.value)}
                      placeholder="e.g., 20000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalVolume">Total Volume (CBM)</Label>
                    <Input
                      id="totalVolume"
                      value={formData.totalVolume}
                      onChange={(e) => handleInputChange('totalVolume', e.target.value)}
                      placeholder="e.g., 55"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-600" />
                  Shipping Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="estimatedShipDate">Estimated Ship Date</Label>
                    <Input
                      id="estimatedShipDate"
                      type="date"
                      value={formData.estimatedShipDate}
                      onChange={(e) => handleInputChange('estimatedShipDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="incoterms">Incoterms</Label>
                    <Select
                      value={formData.incoterms}
                      onValueChange={(value) => handleInputChange('incoterms', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FOB">FOB - Free on Board</SelectItem>
                        <SelectItem value="CIF">CIF - Cost, Insurance & Freight</SelectItem>
                        <SelectItem value="CFR">CFR - Cost and Freight</SelectItem>
                        <SelectItem value="EXW">EXW - Ex Works</SelectItem>
                        <SelectItem value="DDP">DDP - Delivered Duty Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="insuranceRequired">Insurance Required?</Label>
                    <Select
                      value={formData.insuranceRequired}
                      onValueChange={(value) => handleInputChange('insuranceRequired', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="customsClearance">Customs Clearance Service?</Label>
                    <Select
                      value={formData.customsClearance}
                      onValueChange={(value) => handleInputChange('customsClearance', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes, please arrange</SelectItem>
                        <SelectItem value="no">No, we will handle it</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="specialRequirements">Special Requirements or Notes</Label>
                    <Textarea
                      id="specialRequirements"
                      value={formData.specialRequirements}
                      onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                      placeholder="Any special handling requirements, documents needed, or other notes..."
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary & Submit */}
          <div className="space-y-6">
            {/* Quote Summary */}
            <Card className="sticky top-6 border-2 border-red-200">
              <CardHeader className="bg-gray-50">
                <CardTitle className="text-lg">Quote Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-2">Carrier</div>
                  <div className="font-semibold">{selectedRate.carrier}</div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm text-gray-600 mb-2">Route</div>
                  <div className="font-medium text-sm">
                    <div>{origin}</div>
                    <div className="text-gray-400 my-1">↓</div>
                    <div>{destination}</div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm text-gray-600 mb-2">Container</div>
                  <div className="font-semibold">{containerType}</div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm text-gray-600 mb-2">Transit Time</div>
                  <div className="font-semibold">{selectedRate.transitTime}</div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm text-gray-600 mb-2">Service Level</div>
                  <div className="font-semibold">{selectedRate.service}</div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm text-gray-600 mb-2">Quantity</div>
                  <div className="font-semibold">{formData.quantity} container(s)</div>
                </div>

                <div className="border-t pt-4 bg-red-50 -mx-6 -mb-6 p-6 rounded-b-lg">
                  <div className="text-sm text-gray-600 mb-1">Total Estimated Cost</div>
                  <div className="text-3xl font-bold text-red-600">
                    ${(getPrice() * parseInt(formData.quantity || '1')).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Valid until {selectedRate.validUntil}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-red-600 hover:bg-red-700 text-lg"
            >
              {isSubmitting ? (
                <>Processing...</>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Quote Request
                </>
              )}
            </Button>

            {/* Help Card */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-blue-900 mb-2 text-sm">Need Assistance?</h4>
                <p className="text-xs text-blue-800 mb-3">
                  Our freight specialists are here to help you with your shipment.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3 text-blue-600" />
                    <a href="mailto:freight@cosun.com" className="text-blue-600 hover:underline">
                      freight@cosun.com
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-blue-600" />
                    <a href="tel:+86-123-4567-8900" className="text-blue-600 hover:underline">
                      +86-123-4567-8900
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
