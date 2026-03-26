import { useEffect, useState } from 'react';
import { useRouter } from '../contexts/RouterContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { User, Building2, Mail, Lock, Eye, EyeOff, Phone, MapPin, Building } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner@2.0.3';
import { upsertPortalPasswordMirror } from '../lib/portalPasswordMirror';
import { supabase } from '../lib/supabase';
import {
  customerEnterpriseInvitationService,
  customerOrganizationService,
  customerPortalProfileService,
} from '../lib/supabaseService';

export function Register() {
  const { navigateTo } = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [customerInvite, setCustomerInvite] = useState<null | {
    token: string;
    loginEmail: string;
    role: string;
    companyName: string;
  }>(null);
  
  const [customerData, setCustomerData] = useState({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  const [manufacturerData, setManufacturerData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    businessLicense: '',
    address: '',
    productCategories: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  useEffect(() => {
    const inviteToken = new URLSearchParams(window.location.search).get('invite');
    if (!inviteToken) return;

    setInviteLoading(true);
    void (async () => {
      try {
        const invitation = await customerEnterpriseInvitationService.getByToken(inviteToken);
        if (!invitation || invitation.status !== 'pending') {
          toast.error('This invitation is no longer available');
          return;
        }
        if (invitation.expiresAt && new Date(invitation.expiresAt).getTime() < Date.now()) {
          toast.error('This invitation has expired');
          return;
        }
        const enterpriseProfile = await customerOrganizationService.getByAuthUser(invitation.enterpriseAuthUserId);
        setCustomerInvite({
          token: inviteToken,
          loginEmail: invitation.loginEmail,
          role: invitation.role,
          companyName: enterpriseProfile?.companyName || '',
        });
        setCustomerData((prev) => ({
          ...prev,
          email: invitation.loginEmail || prev.email,
          companyName: enterpriseProfile?.companyName || prev.companyName,
        }));
      } catch (error) {
        toast.error(String((error as Error)?.message || error || 'Failed to load invitation'));
      } finally {
        setInviteLoading(false);
      }
    })();
  }, []);

  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (customerData.password !== customerData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (!customerData.agreeToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    if (customerInvite && customerData.email.trim().toLowerCase() !== customerInvite.loginEmail.toLowerCase()) {
      toast.error(`This invitation is assigned to ${customerInvite.loginEmail}`);
      return;
    }

    try {
      const email = customerData.email.trim().toLowerCase();
      const displayName = customerData.fullName || customerData.companyName || customerData.email;
      const { data, error } = await supabase.auth.signUp({
        email,
        password: customerData.password,
        options: {
          data: {
            portal_role: 'customer',
            name: displayName,
            company: customerInvite?.companyName || customerData.companyName || null,
            rbac_role: customerInvite?.role || null,
          },
        },
      });

      if (error) throw error;

      const authUserId = data.user?.id;
      if (authUserId) {
        const { error: profileError } = await supabase.from('user_profiles').upsert({
          id: authUserId,
          email,
          name: displayName,
          portal_role: 'customer',
          rbac_role: customerInvite?.role || null,
          company: customerInvite?.companyName || customerData.companyName || null,
          phone: customerData.phone || null,
          updated_at: new Date().toISOString(),
        });

        if (profileError) throw profileError;

        await customerPortalProfileService.saveByAuthUser(authUserId, {
          displayName,
          loginEmail: email,
          portalRole: 'customer',
          avatarUrl: null,
        });

        if (customerInvite?.token) {
          await customerEnterpriseInvitationService.acceptInvitation(customerInvite.token, authUserId);
        }
      }

      upsertPortalPasswordMirror({
        portalType: 'customer',
        loginEmail: customerData.email,
        displayName,
        password: customerData.password,
        source: customerInvite ? 'enterprise_invite_accept' : 'user_self_set',
      });

      toast.success(
        customerInvite
          ? 'Invitation accepted. Please check your email to confirm the account, then sign in.'
          : 'Registration successful! Please check your email to verify your account.',
      );

      setTimeout(() => {
        navigateTo('login');
      }, 2000);
    } catch (error) {
      toast.error(String((error as Error)?.message || error || 'Registration failed'));
    }
  };

  const handleManufacturerRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (manufacturerData.password !== manufacturerData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (!manufacturerData.agreeToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    console.log('Manufacturer registration:', manufacturerData);
    upsertPortalPasswordMirror({
      portalType: 'supplier',
      loginEmail: manufacturerData.email,
      displayName: manufacturerData.contactName || manufacturerData.companyName || manufacturerData.email,
      password: manufacturerData.password,
      source: 'user_self_set',
    });
    toast.success('Application submitted successfully! Our team will review and contact you within 24-48 hours.');
    
    // Redirect to login after 2 seconds
    setTimeout(() => {
      navigateTo('login');
    }, 2000);
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 py-16 px-4">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-gray-900 mb-4">Create Your Account</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Join our platform to access exclusive benefits and streamline your business operations
          </p>
        </div>

        {/* Registration Tabs */}
        <div className="max-w-2xl mx-auto">
          <Tabs defaultValue="customer" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="customer" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Registration
              </TabsTrigger>
              <TabsTrigger value="manufacturer" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Manufacturer Application
              </TabsTrigger>
            </TabsList>

            {/* Customer Registration */}
            <TabsContent value="customer">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    {customerInvite ? 'Accept Enterprise Invitation' : 'Customer Registration'}
                  </CardTitle>
                  <CardDescription>
                    {customerInvite
                      ? `Join ${customerInvite.companyName || 'your enterprise'} as ${customerInvite.role}.`
                      : 'Create your customer account to start ordering and tracking shipments'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCustomerRegister} className="space-y-4">
                    {customerInvite && (
                      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                        This invitation is reserved for <span className="font-semibold">{customerInvite.loginEmail}</span>.
                        Use this email to activate your enterprise access.
                      </div>
                    )}

                    {inviteLoading && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        Loading invitation details...
                      </div>
                    )}

                    {/* Full Name */}
                    <div className="space-y-2">
                      <Label htmlFor="customer-fullname">Full Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="customer-fullname"
                          type="text"
                          placeholder="John Doe"
                          className="pl-10"
                          value={customerData.fullName}
                          onChange={(e) => setCustomerData({ ...customerData, fullName: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="customer-email">Email Address *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="customer-email"
                          type="email"
                          placeholder="your.email@company.com"
                          className="pl-10"
                          disabled={Boolean(customerInvite)}
                          value={customerData.email}
                          onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="customer-phone">Phone Number *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="customer-phone"
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          className="pl-10"
                          value={customerData.phone}
                          onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {/* Company Name */}
                    <div className="space-y-2">
                      <Label htmlFor="customer-company">Company Name (Optional)</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="customer-company"
                          type="text"
                          placeholder="Your Company Ltd."
                          className="pl-10"
                          disabled={Boolean(customerInvite?.companyName)}
                          value={customerData.companyName}
                          onChange={(e) => setCustomerData({ ...customerData, companyName: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <Label htmlFor="customer-password">Password *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="customer-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a strong password"
                          className="pl-10 pr-10"
                          value={customerData.password}
                          onChange={(e) => setCustomerData({ ...customerData, password: e.target.value })}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">At least 8 characters with numbers and letters</p>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label htmlFor="customer-confirm-password">Confirm Password *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="customer-confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Re-enter your password"
                          className="pl-10 pr-10"
                          value={customerData.confirmPassword}
                          onChange={(e) => setCustomerData({ ...customerData, confirmPassword: e.target.value })}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Terms Agreement */}
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="customer-terms"
                        checked={customerData.agreeToTerms}
                        onCheckedChange={(checked) => 
                          setCustomerData({ ...customerData, agreeToTerms: checked as boolean })
                        }
                      />
                      <label
                        htmlFor="customer-terms"
                        className="text-sm text-gray-700 cursor-pointer leading-relaxed"
                      >
                        I agree to the{' '}
                        <a href="#" className="text-blue-600 hover:text-blue-700">Terms of Service</a>
                        {' '}and{' '}
                        <a href="#" className="text-blue-600 hover:text-blue-700">Privacy Policy</a>
                      </label>
                    </div>

                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={inviteLoading}>
                      {customerInvite ? 'Activate Enterprise Account' : 'Create Customer Account'}
                    </Button>

                    <div className="text-center text-sm text-gray-600">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => navigateTo('login')}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Sign in
                      </button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Manufacturer Registration */}
            <TabsContent value="manufacturer">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-orange-600" />
                    Manufacturer Application
                  </CardTitle>
                  <CardDescription>
                    Apply to become a verified manufacturer on our platform. Applications are reviewed within 24-48 hours.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleManufacturerRegister} className="space-y-4">
                    {/* Company Name */}
                    <div className="space-y-2">
                      <Label htmlFor="mfr-company">Company Name *</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="mfr-company"
                          type="text"
                          placeholder="Your Manufacturing Company Ltd."
                          className="pl-10"
                          value={manufacturerData.companyName}
                          onChange={(e) => setManufacturerData({ ...manufacturerData, companyName: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {/* Contact Name */}
                    <div className="space-y-2">
                      <Label htmlFor="mfr-contact">Contact Person *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="mfr-contact"
                          type="text"
                          placeholder="Full Name"
                          className="pl-10"
                          value={manufacturerData.contactName}
                          onChange={(e) => setManufacturerData({ ...manufacturerData, contactName: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="mfr-email">Business Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="mfr-email"
                          type="email"
                          placeholder="contact@manufacturer.com"
                          className="pl-10"
                          value={manufacturerData.email}
                          onChange={(e) => setManufacturerData({ ...manufacturerData, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="mfr-phone">Phone Number *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="mfr-phone"
                          type="tel"
                          placeholder="+86 138 0000 0000"
                          className="pl-10"
                          value={manufacturerData.phone}
                          onChange={(e) => setManufacturerData({ ...manufacturerData, phone: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {/* Business License */}
                    <div className="space-y-2">
                      <Label htmlFor="mfr-license">Business License Number *</Label>
                      <Input
                        id="mfr-license"
                        type="text"
                        placeholder="Enter your business license number"
                        value={manufacturerData.businessLicense}
                        onChange={(e) => setManufacturerData({ ...manufacturerData, businessLicense: e.target.value })}
                        required
                      />
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                      <Label htmlFor="mfr-address">Factory Address *</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="mfr-address"
                          type="text"
                          placeholder="Full factory address"
                          className="pl-10"
                          value={manufacturerData.address}
                          onChange={(e) => setManufacturerData({ ...manufacturerData, address: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {/* Product Categories */}
                    <div className="space-y-2">
                      <Label htmlFor="mfr-products">Product Categories *</Label>
                      <Input
                        id="mfr-products"
                        type="text"
                        placeholder="e.g., Building Materials, Hardware, Electrical"
                        value={manufacturerData.productCategories}
                        onChange={(e) => setManufacturerData({ ...manufacturerData, productCategories: e.target.value })}
                        required
                      />
                      <p className="text-xs text-gray-500">List the main product categories you manufacture</p>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <Label htmlFor="mfr-password">Password *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="mfr-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a strong password"
                          className="pl-10 pr-10"
                          value={manufacturerData.password}
                          onChange={(e) => setManufacturerData({ ...manufacturerData, password: e.target.value })}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label htmlFor="mfr-confirm-password">Confirm Password *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="mfr-confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Re-enter your password"
                          className="pl-10 pr-10"
                          value={manufacturerData.confirmPassword}
                          onChange={(e) => setManufacturerData({ ...manufacturerData, confirmPassword: e.target.value })}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Terms Agreement */}
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="mfr-terms"
                        checked={manufacturerData.agreeToTerms}
                        onCheckedChange={(checked) => 
                          setManufacturerData({ ...manufacturerData, agreeToTerms: checked as boolean })
                        }
                      />
                      <label
                        htmlFor="mfr-terms"
                        className="text-sm text-gray-700 cursor-pointer leading-relaxed"
                      >
                        I agree to the{' '}
                        <a href="#" className="text-orange-600 hover:text-orange-700">Manufacturer Terms</a>
                        {' '}and confirm that all information provided is accurate
                      </label>
                    </div>

                    <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
                      Submit Manufacturer Application
                    </Button>

                    <div className="text-center text-sm text-gray-600">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => navigateTo('login')}
                        className="text-orange-600 hover:text-orange-700 font-medium"
                      >
                        Sign in
                      </button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Application Process Info */}
              <div className="mt-8 p-6 bg-orange-50 rounded-lg">
                <h3 className="text-gray-900 mb-4">Application Review Process</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">1.</span>
                    <span>Submit your application with all required information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">2.</span>
                    <span>Our team reviews your application within 24-48 hours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">3.</span>
                    <span>We may contact you for additional documentation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">4.</span>
                    <span>Once approved, you'll receive access to the manufacturer portal</span>
                  </li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Security Notice */}
        <div className="mt-12 text-center text-sm text-gray-500 max-w-2xl mx-auto">
          <p>
            Your information is protected with industry-standard encryption. We never share your data with third parties.
          </p>
        </div>
      </div>
    </section>
  );
}
