import { useState, useEffect } from 'react';
import { User, Building2, Phone, Mail, MapPin, Globe, Briefcase, Edit2, Save, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { getCurrentUser } from '../../data/authorizedUsers';

export interface CustomerProfile {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  mobile?: string;
  address: string;
  website?: string;
  businessType: 'Retailer' | 'Importer' | 'Wholesaler' | 'Distributor' | 'E-commerce' | 'Other';
}

export function CustomerProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<CustomerProfile>({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    mobile: '',
    address: '',
    website: '',
    businessType: 'Importer'
  });

  // Load profile data from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('cosun_customer_profile');
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    } else {
      // Initialize with user registration data
      const currentUser = getCurrentUser();
      if (currentUser) {
        setProfile(prev => ({
          ...prev,
          companyName: currentUser.company || '',
          email: currentUser.email || '',
          contactPerson: currentUser.username || '',
        }));
      }
    }
  }, []);

  const handleSave = () => {
    // Validate required fields
    if (!profile.companyName || !profile.contactPerson || !profile.email || !profile.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profile.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Save to localStorage
    localStorage.setItem('cosun_customer_profile', JSON.stringify(profile));
    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  const handleCancel = () => {
    // Reload from localStorage
    const savedProfile = localStorage.getItem('cosun_customer_profile');
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (error) {
        console.error('Failed to reload profile:', error);
      }
    }
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 pb-6" style={{ fontFamily: 'var(--hd-font)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 uppercase tracking-wide" style={{ fontSize: '24px', fontWeight: 700 }}>
            Customer Profile
          </h2>
          <p className="text-gray-600 mt-1" style={{ fontSize: '14px' }}>
            Manage your company information and contact details
          </p>
        </div>
        {!isEditing ? (
          <Button 
            className="bg-[#F96302] hover:bg-[#E55A00] text-white"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={handleCancel}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              className="bg-[#2E7D32] hover:bg-[#256428] text-white"
              onClick={handleSave}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Profile Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Information */}
        <Card className="border-2 border-gray-200 rounded-sm shadow-sm">
          <CardHeader className="border-b-2 border-gray-200 bg-gray-50">
            <CardTitle className="flex items-center gap-2 text-gray-900 uppercase tracking-wide" style={{ fontSize: '14px', fontWeight: 600 }}>
              <Building2 className="h-5 w-5 text-[#F96302]" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-gray-700 font-medium">
                Company Name <span className="text-red-600">*</span>
              </Label>
              {isEditing ? (
                <Input
                  id="companyName"
                  value={profile.companyName}
                  onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                  placeholder="Enter company name"
                  className="border-2"
                />
              ) : (
                <p className="text-gray-900 py-2 px-3 bg-gray-50 border-2 border-gray-200 rounded-sm">
                  {profile.companyName || 'Not set'}
                </p>
              )}
            </div>

            {/* Business Type */}
            <div className="space-y-2">
              <Label htmlFor="businessType" className="text-gray-700 font-medium">
                Business Type <span className="text-red-600">*</span>
              </Label>
              {isEditing ? (
                <Select 
                  value={profile.businessType} 
                  onValueChange={(value: any) => setProfile({ ...profile, businessType: value })}
                >
                  <SelectTrigger className="border-2">
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
              ) : (
                <p className="text-gray-900 py-2 px-3 bg-gray-50 border-2 border-gray-200 rounded-sm">
                  {profile.businessType}
                </p>
              )}
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website" className="text-gray-700 font-medium flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-500" />
                Website
              </Label>
              {isEditing ? (
                <Input
                  id="website"
                  type="url"
                  value={profile.website}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  placeholder="https://www.example.com"
                  className="border-2"
                />
              ) : (
                <p className="text-gray-900 py-2 px-3 bg-gray-50 border-2 border-gray-200 rounded-sm">
                  {profile.website ? (
                    <a 
                      href={profile.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {profile.website}
                    </a>
                  ) : (
                    'Not set'
                  )}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="border-2 border-gray-200 rounded-sm shadow-sm">
          <CardHeader className="border-b-2 border-gray-200 bg-gray-50">
            <CardTitle className="flex items-center gap-2 text-gray-900 uppercase tracking-wide" style={{ fontSize: '14px', fontWeight: 600 }}>
              <User className="h-5 w-5 text-[#F96302]" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Contact Person */}
            <div className="space-y-2">
              <Label htmlFor="contactPerson" className="text-gray-700 font-medium">
                Contact Person <span className="text-red-600">*</span>
              </Label>
              {isEditing ? (
                <Input
                  id="contactPerson"
                  value={profile.contactPerson}
                  onChange={(e) => setProfile({ ...profile, contactPerson: e.target.value })}
                  placeholder="Enter contact person name"
                  className="border-2"
                />
              ) : (
                <p className="text-gray-900 py-2 px-3 bg-gray-50 border-2 border-gray-200 rounded-sm">
                  {profile.contactPerson || 'Not set'}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                Email <span className="text-red-600">*</span>
              </Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="email@example.com"
                  className="border-2"
                />
              ) : (
                <p className="text-gray-900 py-2 px-3 bg-gray-50 border-2 border-gray-200 rounded-sm">
                  {profile.email || 'Not set'}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-700 font-medium flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                Phone <span className="text-red-600">*</span>
              </Label>
              {isEditing ? (
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="border-2"
                />
              ) : (
                <p className="text-gray-900 py-2 px-3 bg-gray-50 border-2 border-gray-200 rounded-sm">
                  {profile.phone || 'Not set'}
                </p>
              )}
            </div>

            {/* Mobile (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="mobile" className="text-gray-700 font-medium flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                Mobile
              </Label>
              {isEditing ? (
                <Input
                  id="mobile"
                  type="tel"
                  value={profile.mobile}
                  onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                  placeholder="+1 (555) 987-6543"
                  className="border-2"
                />
              ) : (
                <p className="text-gray-900 py-2 px-3 bg-gray-50 border-2 border-gray-200 rounded-sm">
                  {profile.mobile || 'Not set'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Address Information - Full Width */}
        <Card className="border-2 border-gray-200 rounded-sm shadow-sm lg:col-span-2">
          <CardHeader className="border-b-2 border-gray-200 bg-gray-50">
            <CardTitle className="flex items-center gap-2 text-gray-900 uppercase tracking-wide" style={{ fontSize: '14px', fontWeight: 600 }}>
              <MapPin className="h-5 w-5 text-[#F96302]" />
              Address Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-gray-700 font-medium">
                Business Address <span className="text-red-600">*</span>
              </Label>
              {isEditing ? (
                <Input
                  id="address"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  placeholder="Enter complete business address"
                  className="border-2"
                />
              ) : (
                <p className="text-gray-900 py-2 px-3 bg-gray-50 border-2 border-gray-200 rounded-sm">
                  {profile.address || 'Not set'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Notice */}
      {!isEditing && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-sm p-4">
          <p className="text-blue-800 text-sm">
            <strong>Note:</strong> This information will be automatically used when you submit inquiries. Keep it up to date for accurate quotations.
          </p>
        </div>
      )}
    </div>
  );
}

// Export function to get current profile
export function getCustomerProfile(): CustomerProfile | null {
  if (typeof window !== 'undefined') {
    const savedProfile = localStorage.getItem('cosun_customer_profile');
    if (savedProfile) {
      try {
        return JSON.parse(savedProfile);
      } catch (error) {
        console.error('Failed to load profile:', error);
        return null;
      }
    }
  }
  return null;
}
