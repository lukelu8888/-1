import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Building2, Languages, Landmark, Pencil, Save, Shield, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { CustomerProfile } from './CustomerProfile';
import CustomerContactsAndAccountsCenter from './CustomerContactsAndAccountsCenter';
import CustomerBankAccountsCenter from './CustomerBankAccountsCenter';
import {
  customerMasterDataCopy,
  CUSTOMER_MASTER_DATA_LOCALE_EVENT,
  CUSTOMER_MASTER_DATA_LOCALE_STORAGE_KEY,
  resolveCustomerMasterDataLocale,
  type CustomerMasterDataLocale,
} from './customerEnterpriseMasterDataI18n';
import type { CustomerThemePalette } from '../../utils/logoTheme';

type MasterTab = 'basic' | 'bank' | 'people-center';
const CUSTOMER_LOGO_UPDATED_EVENT = 'cosun-customer-logo-updated';

function TabButton({
  active,
  label,
  description,
  icon,
  onClick,
  theme,
}: {
  active: boolean;
  label: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  theme?: CustomerThemePalette;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[72px] w-full rounded-lg border px-5 py-4 text-left transition-colors ${
        active
          ? 'shadow-sm'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
      }`}
      style={active ? {
        borderColor: theme?.primaryBorder ?? '#c7d5e8',
        backgroundColor: theme?.primarySoft ?? '#f5f9ff',
        color: theme?.primaryText ?? '#1e3a5f',
      } : undefined}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 shrink-0 ${active ? '' : 'text-slate-400'}`}
          style={active ? { color: theme?.primaryText ?? '#34557a' } : undefined}
        >
          {icon}
        </div>
        <div>
          <p className="text-[13px] font-semibold leading-none tracking-tight">{label}</p>
          <p className="mt-1.5 text-[12px] leading-5 opacity-80">{description}</p>
        </div>
      </div>
    </button>
  );
}

export function CustomerEnterpriseMasterDataCenter({
  forceEditToken,
  onBack,
  locale: controlledLocale,
  onLocaleChange,
  theme,
}: {
  forceEditToken?: number;
  onBack?: () => void;
  locale?: CustomerMasterDataLocale;
  onLocaleChange?: (locale: CustomerMasterDataLocale) => void;
  theme?: CustomerThemePalette;
}) {
  const [activeTab, setActiveTab] = useState<MasterTab>('basic');
  const [logoPreview, setLogoPreview] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('cosun_customer_logo') || localStorage.getItem('cosun_admin_org_logo');
  });
  const [internalLocale, setInternalLocale] = useState<CustomerMasterDataLocale>(() => {
    if (typeof window === 'undefined') return 'en';
    const saved = localStorage.getItem(CUSTOMER_MASTER_DATA_LOCALE_STORAGE_KEY);
    return resolveCustomerMasterDataLocale(saved || navigator.language);
  });
  const [profileEditToken, setProfileEditToken] = useState(0);
  const [profileSaveToken, setProfileSaveToken] = useState(0);
  const [profileCancelToken, setProfileCancelToken] = useState(0);
  const [bankEditToken, setBankEditToken] = useState(0);
  const [bankSaveToken, setBankSaveToken] = useState(0);
  const [bankCancelToken, setBankCancelToken] = useState(0);
  const [isBasicEditing, setIsBasicEditing] = useState(false);
  const [isBankEditing, setIsBankEditing] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const locale = controlledLocale ?? internalLocale;

  useEffect(() => {
    localStorage.setItem(CUSTOMER_MASTER_DATA_LOCALE_STORAGE_KEY, locale);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CUSTOMER_MASTER_DATA_LOCALE_EVENT, { detail: { locale } }));
    }
  }, [locale]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncLogo = () => {
      setLogoPreview(localStorage.getItem('cosun_customer_logo') || localStorage.getItem('cosun_admin_org_logo'));
    };
    const syncLogoFromEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ logoUrl?: string | null }>).detail;
      if (typeof detail?.logoUrl === 'string') {
        setLogoPreview(detail.logoUrl || null);
        return;
      }
      syncLogo();
    };
    syncLogo();
    window.addEventListener('storage', syncLogo);
    window.addEventListener('focus', syncLogo);
    window.addEventListener(CUSTOMER_LOGO_UPDATED_EVENT, syncLogoFromEvent as EventListener);
    return () => {
      window.removeEventListener('storage', syncLogo);
      window.removeEventListener('focus', syncLogo);
      window.removeEventListener(CUSTOMER_LOGO_UPDATED_EVENT, syncLogoFromEvent as EventListener);
    };
  }, []);

  useEffect(() => {
    if (forceEditToken) {
      setProfileEditToken((prev) => prev + 1);
    }
  }, [forceEditToken]);

  const copy = customerMasterDataCopy[locale];
  const rtl = locale === 'ar';
  const updateLocale = (value: CustomerMasterDataLocale) => {
    if (onLocaleChange) {
      onLocaleChange(value);
      return;
    }
    setInternalLocale(value);
  };

  const tabs = useMemo(() => ([
    { id: 'basic' as const, label: copy.tabs.basic.label, description: copy.tabs.basic.description, icon: <Building2 className="w-4 h-4" /> },
    { id: 'bank' as const, label: copy.tabs.bank.label, description: copy.tabs.bank.description, icon: <Landmark className="w-4 h-4" /> },
    { id: 'people-center' as const, label: copy.tabs.people.label, description: copy.tabs.people.description, icon: <Shield className="w-4 h-4" /> },
  ]), [copy]);

  const triggerEdit = () => {
    if (activeTab === 'basic') {
      setProfileEditToken((prev) => prev + 1);
    }
    if (activeTab === 'bank') {
      setBankEditToken((prev) => prev + 1);
    }
  };

  const triggerSave = () => {
    if (activeTab === 'basic' && isBasicEditing) {
      setProfileSaveToken((prev) => prev + 1);
    }
    if (activeTab === 'bank' && isBankEditing) {
      setBankSaveToken((prev) => prev + 1);
    }
  };

  const triggerCancel = () => {
    if (activeTab === 'basic' && isBasicEditing) {
      setProfileCancelToken((prev) => prev + 1);
    }
    if (activeTab === 'bank' && isBankEditing) {
      setBankCancelToken((prev) => prev + 1);
    }
  };

  const handleLogoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (!result) return;
      setLogoPreview(result);
      localStorage.setItem('cosun_customer_logo', result);
      window.dispatchEvent(new CustomEvent(CUSTOMER_LOGO_UPDATED_EVENT, { detail: { logoUrl: result } }));
      const savedProfile = localStorage.getItem('cosun_customer_profile');
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          localStorage.setItem('cosun_customer_profile', JSON.stringify({
            ...parsed,
            logoUrl: result,
          }));
        } catch {
          localStorage.setItem('cosun_customer_profile', JSON.stringify({ logoUrl: result }));
        }
      } else {
        localStorage.setItem('cosun_customer_profile', JSON.stringify({ logoUrl: result }));
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  return (
    <div className="customer-enterprise-center mx-auto w-full max-w-[1880px] space-y-4 px-4 pb-8 xl:px-6 2xl:px-8" style={{ fontFamily: 'var(--hd-font)' }} dir={rtl ? 'rtl' : 'ltr'}>
      <div className={`relative z-20 flex items-center justify-between gap-4 border-b border-slate-200 pb-4 ${rtl ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-3 ${rtl ? 'flex-row-reverse' : ''}`}>
          {onBack && (
            <>
              <button
                onClick={onBack}
                className={`flex items-center gap-1.5 text-[13px] text-slate-500 transition-colors group hover:text-slate-800 ${rtl ? 'flex-row-reverse' : ''}`}
              >
                <ArrowLeft className={`w-4 h-4 ${rtl ? 'rotate-180 group-hover:translate-x-0.5' : 'group-hover:-translate-x-0.5'} transition-transform`} />
                {copy.actions.back}
              </button>
              <div className="w-px h-5 bg-slate-200" />
            </>
          )}
          <div className={`flex items-center gap-2.5 ${rtl ? 'flex-row-reverse' : ''}`}>
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'basic' && isBasicEditing) {
                  logoInputRef.current?.click();
                }
              }}
              className={`relative flex items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm ${
                activeTab === 'basic' && isBasicEditing ? 'cursor-pointer hover:border-slate-300' : 'cursor-default'
              }`}
              style={{ width: 40, height: 40, minWidth: 40, minHeight: 40, maxWidth: 40, maxHeight: 40 }}
              aria-label="Customer logo"
            >
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Company Logo"
                  className="block p-1"
                  style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-red-50 to-rose-100 text-[16px] font-bold text-red-400">
                  CI
                </div>
              )}
              {activeTab === 'basic' && isBasicEditing && (
                <div className="pointer-events-none absolute inset-0 flex items-end justify-end bg-slate-900/5 p-0.5">
                  <div className="rounded-sm bg-white/95 p-[2px] text-slate-500 shadow-sm">
                    <Pencil className="h-2.5 w-2.5" />
                  </div>
                </div>
              )}
            </button>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoSelect}
            />
            <div className={rtl ? 'text-right' : ''}>
              <div className={`flex items-center gap-1.5 ${rtl ? 'flex-row-reverse justify-end' : ''}`}>
                <h1 className="text-[16px] font-semibold text-slate-800 leading-tight">{copy.pageTitle}</h1>
              </div>
              <div className={`mt-0.5 flex items-center gap-1 ${rtl ? 'flex-row-reverse justify-end' : ''}`}>
                <Languages className="w-3 h-3 text-slate-300" />
                <p className="text-[11px] text-slate-400">
                  {[
                    copy.tabs.basic.label,
                    copy.tabs.bank.label,
                    copy.tabs.people.label,
                  ].join(' / ')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={`relative z-30 flex items-center gap-3 pointer-events-auto ${rtl ? 'flex-row-reverse' : ''}`}>
          <div className="w-[148px] relative z-30 pointer-events-auto">
            <Select value={locale} onValueChange={(value) => updateLocale(value as CustomerMasterDataLocale)}>
            <SelectTrigger className="h-9 rounded-md border-slate-200 bg-white text-[13px] text-slate-600">
                <div className={`flex items-center gap-2 ${rtl ? 'flex-row-reverse' : ''}`}>
                  <Languages className="h-3.5 w-3.5 text-slate-400" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(copy.languageNames) as Array<[CustomerMasterDataLocale, string]>).map(([lang, label]) => (
                  <SelectItem key={lang} value={lang}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {activeTab !== 'people-center' && (
            ((activeTab === 'basic' && isBasicEditing) || (activeTab === 'bank' && isBankEditing)) ? (
              <>
                <button
                  type="button"
                  onClick={triggerCancel}
                  className={`relative z-30 pointer-events-auto flex items-center gap-1.5 rounded-md border border-slate-200 px-4 py-1.5 text-[13px] font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 ${rtl ? 'flex-row-reverse' : ''}`}
                >
                  <X className="h-3.5 w-3.5" />
                  {copy.profile.cancel}
                </button>
                <button
                  type="button"
                  onClick={triggerSave}
                  className={`relative z-30 pointer-events-auto flex items-center gap-1.5 rounded-md border border-[#16325c] bg-[#16325c] px-4 py-1.5 text-[13px] font-medium text-white ${rtl ? 'flex-row-reverse' : ''}`}
                  style={{
                    backgroundColor: '#16325c',
                    color: '#ffffff',
                  }}
                >
                  <Save className="h-3.5 w-3.5" />
                  {copy.profile.saveChanges}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={triggerEdit}
                className={`relative z-30 pointer-events-auto flex items-center gap-1.5 rounded-md border border-slate-200 px-4 py-1.5 text-[13px] font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 ${rtl ? 'flex-row-reverse' : ''}`}
              >
                <Pencil className="w-3.5 h-3.5" />
                {copy.actions.edit}
              </button>
            )
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            active={activeTab === tab.id}
            label={tab.label}
            description={tab.description}
            icon={tab.icon}
            onClick={() => setActiveTab(tab.id)}
            theme={theme}
          />
        ))}
        </div>
      </div>

      {activeTab === 'basic' && (
        <CustomerProfile
          forceEditToken={profileEditToken}
          forceSaveToken={profileSaveToken}
          forceCancelToken={profileCancelToken}
          embedded
          copy={copy.profile}
          rtl={rtl}
          showActions={false}
          externalLogoUrl={logoPreview}
          onEditingChange={setIsBasicEditing}
        />
      )}

      {activeTab === 'bank' && (
        <CustomerBankAccountsCenter
          copy={copy}
          rtl={rtl}
          forceEditToken={bankEditToken}
          forceSaveToken={bankSaveToken}
          forceCancelToken={bankCancelToken}
          showActions={false}
          onEditingChange={setIsBankEditing}
        />
      )}

      {activeTab === 'people-center' && (
        <CustomerContactsAndAccountsCenter copy={copy.contacts} rtl={rtl} locale={locale} />
      )}
    </div>
  );
}

export default CustomerEnterpriseMasterDataCenter;
