import { useState, useEffect } from 'react';
import { User, Building2, Phone, Mail, MapPin, Globe, Edit2, Save, X, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { getCurrentUser } from '../../data/authorizedUsers';
import { useUser } from '../../contexts/UserContext';
import {
  customerEnterpriseMemberService,
  customerOrganizationService,
  customerPortalProfileService,
} from '../../lib/supabaseService';
import type { CustomerMasterDataCopy } from './customerEnterpriseMasterDataI18n';
import {
  CustomerMasterSection,
  CustomerSingleRow,
  CustomerValue,
} from './customerEnterpriseMasterDataLayout';

export interface CustomerProfile {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  mobile?: string;
  address: string;
  website?: string;
  businessType: 'Retailer' | 'Importer' | 'Wholesaler' | 'Distributor' | 'E-commerce' | 'Other';
  logoUrl?: string | null;
}

interface CustomerProfileProps {
  forceEditToken?: number;
  forceSaveToken?: number;
  forceCancelToken?: number;
  embedded?: boolean;
  copy?: CustomerMasterDataCopy['profile'];
  rtl?: boolean;
  showActions?: boolean;
  externalLogoUrl?: string | null;
  onEditingChange?: (editing: boolean) => void;
}

const PENDING_CUSTOMER_ORG_SYNC_KEY = 'cosun_pending_customer_org_sync';
const PENDING_CUSTOMER_PORTAL_SYNC_KEY = 'cosun_pending_customer_portal_sync';
const CUSTOMER_LOGO_UPDATED_EVENT = 'cosun-customer-logo-updated';

const defaultProfileCopy: CustomerMasterDataCopy['profile'] = {
  title: 'Basic Information',
  description: 'Manage your company information and contact details',
  editEnterpriseInfo: 'Edit Basic Information',
  cancel: 'Cancel',
  saveChanges: 'Save Changes',
  companyInformation: 'Company Information',
  contactInformation: 'Contact Information',
  addressInformation: 'Address Information',
  companyName: 'Company Name',
  businessType: 'Business Type',
  website: 'Website',
  contactPerson: 'Contact Person',
  email: 'Email',
  phone: 'Phone',
  mobile: 'Mobile',
  businessAddress: 'Business Address',
  required: 'Required',
  notSet: 'Not set',
  enterCompanyName: 'Enter company name',
  enterContactPersonName: 'Enter contact person name',
  enterEmailAddress: 'email@example.com',
  enterPhoneNumber: '+1 (555) 123-4567',
  enterMobileNumber: '+1 (555) 987-6543',
  enterBusinessAddress: 'Enter complete business address',
  noteLabel: 'Note:',
  noteText: 'This information will be automatically used when you submit inquiries. Keep it up to date for accurate quotations.',
  validationRequired: 'Please fill in all required fields',
  validationEmail: 'Please enter a valid email address',
  saveSuccess: 'Profile updated successfully!',
  saveQueued: 'Profile saved locally and queued for cloud sync.',
  saveCloudError: 'Failed to save profile to cloud',
  businessTypes: {
    Retailer: 'Retailer',
    Importer: 'Importer',
    Wholesaler: 'Wholesaler',
    Distributor: 'Distributor',
    'E-commerce': 'E-commerce',
    Other: 'Other',
  },
};

export function CustomerProfile({
  forceEditToken,
  forceSaveToken,
  forceCancelToken,
  embedded = false,
  copy = defaultProfileCopy,
  rtl = false,
  showActions = true,
  externalLogoUrl,
  onEditingChange,
}: CustomerProfileProps) {
  const { user } = useUser();
  const [enterpriseAuthUserId, setEnterpriseAuthUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<CustomerProfile>({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    mobile: '',
    address: '',
    website: '',
    businessType: 'Importer',
    logoUrl: null,
  });

  useEffect(() => {
    let cancelled = false;

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

    if (!user?.id || user.type !== 'customer') return undefined;

    void (async () => {
      try {
        const resolvedEnterpriseAuthUserId =
          await customerEnterpriseMemberService.resolveEnterpriseAuthUserIdForUser(user.id, user.email) || user.id;
        if (cancelled) return;
        setEnterpriseAuthUserId(resolvedEnterpriseAuthUserId);

        const [remoteOrg, remotePortal] = await Promise.all([
          customerOrganizationService.getByAuthUser(resolvedEnterpriseAuthUserId),
          customerPortalProfileService.getByAuthUser(user.id),
        ]);
        if (cancelled) return;

        if (remoteOrg) {
          const nextProfile: CustomerProfile = {
            companyName: remoteOrg.companyName || '',
            contactPerson: remoteOrg.contactPerson || remotePortal?.displayName || '',
            email: remoteOrg.email || remotePortal?.loginEmail || user.email || '',
            phone: remoteOrg.phone || '',
            mobile: remoteOrg.mobile || '',
            address: remoteOrg.address || '',
            website: remoteOrg.website || '',
            businessType: (remoteOrg.businessType as CustomerProfile['businessType']) || 'Importer',
            logoUrl: remoteOrg.logoUrl || null,
          };
          setProfile(nextProfile);
          localStorage.setItem('cosun_customer_profile', JSON.stringify(nextProfile));
          if (nextProfile.logoUrl) {
            localStorage.setItem('cosun_customer_logo', nextProfile.logoUrl);
          }
        }

        if (!remotePortal) {
          const draftProfile = savedProfile ? JSON.parse(savedProfile) as Partial<CustomerProfile> : {};
          localStorage.setItem('cosun_customer_profile', JSON.stringify({
            companyName: draftProfile.companyName || profile.companyName || '',
            contactPerson: draftProfile.contactPerson || profile.contactPerson || user.name || '',
            email: draftProfile.email || profile.email || user.email || '',
            phone: draftProfile.phone || profile.phone || '',
            mobile: draftProfile.mobile || profile.mobile || '',
            address: draftProfile.address || profile.address || '',
            website: draftProfile.website || profile.website || '',
            businessType: draftProfile.businessType || profile.businessType || 'Importer',
            logoUrl: draftProfile.logoUrl || profile.logoUrl || null,
          }));
        }
      } catch (error) {
        console.warn('[CustomerProfile] Supabase hydrate fallback to local cache:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.type]);

  useEffect(() => {
    if (forceEditToken) {
      setIsEditing(true);
    }
  }, [forceEditToken]);

  useEffect(() => {
    if (forceSaveToken && isEditing) {
      void handleSave();
    }
  }, [forceSaveToken]);

  useEffect(() => {
    if (forceCancelToken && isEditing) {
      handleCancel();
    }
  }, [forceCancelToken]);

  useEffect(() => {
    onEditingChange?.(isEditing);
  }, [isEditing, onEditingChange]);

  useEffect(() => {
    if (typeof externalLogoUrl === 'undefined') return;
    setProfile((prev) => {
      if ((prev.logoUrl || null) === (externalLogoUrl || null)) return prev;
      return {
        ...prev,
        logoUrl: externalLogoUrl || null,
      };
    });
  }, [externalLogoUrl]);

  const persistProfileToCloud = async (nextProfile: CustomerProfile) => {
    if (!user?.id || user.type !== 'customer') return;
    const organizationAuthUserId = enterpriseAuthUserId || user.id;

    const organizationPayload = {
      ...nextProfile,
      email: nextProfile.email || user.email || '',
    };
    const portalPayload = {
      displayName: nextProfile.contactPerson || user.name || '',
      loginEmail: user.email || nextProfile.email || '',
      portalRole: 'customer',
      avatarUrl: nextProfile.logoUrl || null,
    };

    await customerOrganizationService.saveByAuthUser(organizationAuthUserId, organizationPayload);
    await customerPortalProfileService.saveByAuthUser(user.id, portalPayload);

    localStorage.removeItem(PENDING_CUSTOMER_ORG_SYNC_KEY);
    localStorage.removeItem(PENDING_CUSTOMER_PORTAL_SYNC_KEY);
  };

  const queuePendingProfileSync = (nextProfile: CustomerProfile) => {
    if (!user?.id || user.type !== 'customer') return;
    localStorage.setItem(PENDING_CUSTOMER_ORG_SYNC_KEY, JSON.stringify({
      authUserId: enterpriseAuthUserId || user.id,
      profile: {
        ...nextProfile,
        email: nextProfile.email || user.email || '',
      },
    }));
    localStorage.setItem(PENDING_CUSTOMER_PORTAL_SYNC_KEY, JSON.stringify({
      authUserId: user.id,
      profile: {
        displayName: nextProfile.contactPerson || user.name || '',
        loginEmail: user.email || nextProfile.email || '',
        portalRole: 'customer',
        avatarUrl: nextProfile.logoUrl || null,
      },
    }));
  };

  const flushPendingProfileSync = async () => {
    if (!user?.id || user.type !== 'customer') return;
    try {
      const orgRaw = localStorage.getItem(PENDING_CUSTOMER_ORG_SYNC_KEY);
      const portalRaw = localStorage.getItem(PENDING_CUSTOMER_PORTAL_SYNC_KEY);

      if (orgRaw) {
        const parsed = JSON.parse(orgRaw);
        if (parsed?.authUserId && parsed?.profile) {
          await customerOrganizationService.saveByAuthUser(parsed.authUserId, parsed.profile);
          localStorage.removeItem(PENDING_CUSTOMER_ORG_SYNC_KEY);
        }
      }

      if (portalRaw) {
        const parsed = JSON.parse(portalRaw);
        if (parsed?.authUserId === user.id && parsed?.profile) {
          await customerPortalProfileService.saveByAuthUser(user.id, parsed.profile);
          localStorage.removeItem(PENDING_CUSTOMER_PORTAL_SYNC_KEY);
        }
      }
    } catch (error) {
      console.warn('[CustomerProfile] Pending profile sync still waiting:', error);
    }
  };

  useEffect(() => {
    if (!user?.id || user.type !== 'customer') return undefined;

    void flushPendingProfileSync();

    const handleOnline = () => {
      void flushPendingProfileSync();
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [user?.id, user?.type]);

  const handleSave = async () => {
    // Validate required fields
    if (!profile.companyName || !profile.contactPerson || !profile.email || !profile.phone || !profile.address) {
      toast.error(copy.validationRequired);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profile.email)) {
      toast.error(copy.validationEmail);
      return;
    }

    const latestLocalLogo =
      (typeof externalLogoUrl === 'string' && externalLogoUrl.trim()) ||
      localStorage.getItem('cosun_customer_logo') ||
      profile.logoUrl ||
      null;

    const nextProfile: CustomerProfile = {
      ...profile,
      logoUrl: latestLocalLogo,
    };

    setProfile(nextProfile);
    localStorage.setItem('cosun_customer_profile', JSON.stringify(nextProfile));
    if (latestLocalLogo) {
      localStorage.setItem('cosun_customer_logo', latestLocalLogo);
      window.dispatchEvent(new CustomEvent(CUSTOMER_LOGO_UPDATED_EVENT, { detail: { logoUrl: latestLocalLogo } }));
    }

    if (!user?.id || user.type !== 'customer') {
      setIsEditing(false);
      toast.success(copy.saveSuccess);
      return;
    }

    try {
      await persistProfileToCloud(nextProfile);
      setIsEditing(false);
      toast.success(copy.saveSuccess);
    } catch (error) {
      console.error('[CustomerProfile] Failed to save profile to cloud, queueing retry:', error);
      queuePendingProfileSync(nextProfile);
      window.setTimeout(() => {
        void flushPendingProfileSync();
      }, 1200);
      setIsEditing(false);
      toast.success(copy.saveQueued);
    }
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

  const infoValueClass = 'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[14px] text-slate-800';

  const renderTextField = (
    id: string,
    value: string | undefined | null,
    onChange: (next: string) => void,
    placeholder: string,
    options?: { type?: string },
  ) => {
    if (!isEditing) return <CustomerValue value={value || copy.notSet} />;
    return (
      <Input
        id={id}
        type={options?.type || 'text'}
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={infoValueClass}
      />
    );
  };

  return (
    <div className="space-y-6 pb-6" style={{ fontFamily: 'var(--hd-font)' }} dir={rtl ? 'rtl' : 'ltr'}>
      {!embedded && showActions && (
        <div className={`flex items-center justify-between gap-4 ${rtl ? 'flex-row-reverse' : ''}`}>
          <div className={rtl ? 'text-right' : ''}>
            <h2 className="text-gray-900 uppercase tracking-wide" style={{ fontSize: '24px', fontWeight: 700 }}>
              {copy.title}
            </h2>
            <p className="text-gray-600 mt-1" style={{ fontSize: '14px' }}>
              {copy.description}
            </p>
          </div>
          {!isEditing ? (
            <Button 
              className="bg-[#F96302] hover:bg-[#E55A00] text-white"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className={`h-4 w-4 ${rtl ? 'ml-2' : 'mr-2'}`} />
              {copy.editEnterpriseInfo}
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={handleCancel}
              >
                <X className={`h-4 w-4 ${rtl ? 'ml-2' : 'mr-2'}`} />
                {copy.cancel}
              </Button>
              <Button 
                className="bg-[#2E7D32] hover:bg-[#256428] text-white"
                onClick={handleSave}
              >
                <Save className={`h-4 w-4 ${rtl ? 'ml-2' : 'mr-2'}`} />
                {copy.saveChanges}
              </Button>
            </div>
          )}
        </div>
      )}

      {embedded && showActions && (
        <div className={`flex items-center justify-end gap-3 ${rtl ? 'flex-row-reverse' : ''}`}>
          {!isEditing && showActions ? (
            <Button 
              className="bg-[#F96302] hover:bg-[#E55A00] text-white"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className={`h-4 w-4 ${rtl ? 'ml-2' : 'mr-2'}`} />
              {copy.editEnterpriseInfo}
            </Button>
          ) : isEditing ? (
            <>
              <Button 
                variant="outline"
                onClick={handleCancel}
              >
                <X className={`h-4 w-4 ${rtl ? 'ml-2' : 'mr-2'}`} />
                {copy.cancel}
              </Button>
              <Button 
                className="bg-[#2E7D32] hover:bg-[#256428] text-white"
                onClick={handleSave}
              >
                <Save className={`h-4 w-4 ${rtl ? 'ml-2' : 'mr-2'}`} />
                {copy.saveChanges}
              </Button>
            </>
          ) : null}
        </div>
      )}

      <CustomerMasterSection title={copy.title} titleEN={copy.title} icon={<FileText className="h-4 w-4" />}>
        <div className="mb-1 grid gap-4 border-b border-slate-100 pb-3 md:grid-cols-2">
          <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">{copy.companyColumnTitle}</p>
          <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">{copy.contactColumnTitle}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          <div>
            <CustomerSingleRow label={copy.companyName}>
              {renderTextField('companyName', profile.companyName, (next) => setProfile({ ...profile, companyName: next }), copy.enterCompanyName)}
            </CustomerSingleRow>

            <CustomerSingleRow label={copy.businessType}>
              {isEditing ? (
                <Select value={profile.businessType} onValueChange={(value: any) => setProfile({ ...profile, businessType: value })}>
                  <SelectTrigger className={infoValueClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Retailer">{copy.businessTypes.Retailer}</SelectItem>
                    <SelectItem value="Importer">{copy.businessTypes.Importer}</SelectItem>
                    <SelectItem value="Wholesaler">{copy.businessTypes.Wholesaler}</SelectItem>
                    <SelectItem value="Distributor">{copy.businessTypes.Distributor}</SelectItem>
                    <SelectItem value="E-commerce">{copy.businessTypes['E-commerce']}</SelectItem>
                    <SelectItem value="Other">{copy.businessTypes.Other}</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <CustomerValue value={copy.businessTypes[profile.businessType]} />
              )}
            </CustomerSingleRow>

            <CustomerSingleRow label={copy.businessAddress}>
              {renderTextField('address', profile.address, (next) => setProfile({ ...profile, address: next }), copy.enterBusinessAddress)}
            </CustomerSingleRow>

            <CustomerSingleRow label={copy.website}>
              {isEditing ? (
                <Input
                  id="website"
                  type="url"
                  value={profile.website || ''}
                  onChange={(event) => setProfile({ ...profile, website: event.target.value })}
                  placeholder="https://www.example.com"
                  className={infoValueClass}
                />
              ) : profile.website ? (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-[15px] leading-8 text-slate-700 hover:text-blue-600 hover:underline">
                  {profile.website}
                </a>
              ) : (
                <CustomerValue value={copy.notSet} />
              )}
            </CustomerSingleRow>
          </div>

          <div>
            <CustomerSingleRow label={copy.contactPerson}>
              {renderTextField('contactPerson', profile.contactPerson, (next) => setProfile({ ...profile, contactPerson: next }), copy.enterContactPersonName)}
            </CustomerSingleRow>

            <CustomerSingleRow label={copy.email}>
              {renderTextField('email', profile.email, (next) => setProfile({ ...profile, email: next }), copy.enterEmailAddress, { type: 'email' })}
            </CustomerSingleRow>

            <CustomerSingleRow label={copy.mobile}>
              {renderTextField('mobile', profile.mobile, (next) => setProfile({ ...profile, mobile: next }), copy.enterMobileNumber, { type: 'tel' })}
            </CustomerSingleRow>

            <CustomerSingleRow label={copy.phone}>
              {renderTextField('phone', profile.phone, (next) => setProfile({ ...profile, phone: next }), copy.enterPhoneNumber, { type: 'tel' })}
            </CustomerSingleRow>
          </div>
        </div>
      </CustomerMasterSection>

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
