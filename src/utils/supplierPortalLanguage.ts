import { inferSupplierDocumentLanguage } from './documentDataAdapters';

type SupplierPortalLanguageParams = {
  org?: {
    name?: string;
    nameEn?: string;
    address?: string;
    countryCode?: string;
    locale?: string;
    isDomesticSupplier?: boolean;
  } | null;
  user?: {
    name?: string;
    company?: string;
    address?: string;
    type?: string;
    role?: string;
    userRole?: string;
  } | null;
  supplier?: {
    name?: string;
    company?: string;
    address?: string;
    countryCode?: string;
    locale?: string;
    region?: string;
    isDomesticSupplier?: boolean;
  } | null;
};

export const resolveSupplierPortalLanguage = ({
  org,
  user,
  supplier,
}: SupplierPortalLanguageParams): 'zh' | 'en' => inferSupplierDocumentLanguage({
  supplierCountryCode: supplier?.countryCode || org?.countryCode,
  supplierLocale: supplier?.locale || org?.locale,
  supplierRegion: supplier?.region,
  supplierAddress: supplier?.address || org?.address || user?.address,
  supplierName: supplier?.name || supplier?.company || org?.name || user?.company || user?.name,
  isDomesticSupplier: supplier?.isDomesticSupplier ?? org?.isDomesticSupplier,
  supplierProfile: supplier || org,
  supplier: supplier || org,
});

const ROLE_LABEL_MAP_ZH: Record<string, string> = {
  supplier: '供应商',
  manufacturer: '制造商',
  admin: '管理员',
  company_admin: '组织管理员',
  supplier_admin: '供应商管理员',
  supplier_user: '供应商成员',
};

export const resolveSupplierPortalRoleLabel = (role: string | undefined, language: 'zh' | 'en'): string => {
  const normalized = String(role || '').trim();
  if (!normalized) return language === 'zh' ? '供应商' : 'Supplier';
  if (language !== 'zh') return normalized;
  return ROLE_LABEL_MAP_ZH[normalized.toLowerCase()] || normalized;
};

export const resolveSupplierPortalTypeLabel = (type: string | undefined, language: 'zh' | 'en'): string => {
  const normalized = String(type || '').trim().toLowerCase();
  if (normalized === 'supplier' || normalized === 'manufacturer') {
    return language === 'zh' ? '供应商门户' : 'Supplier Portal';
  }
  if (!normalized) {
    return language === 'zh' ? '供应商门户' : 'Supplier Portal';
  }
  return language === 'zh'
    ? resolveSupplierPortalRoleLabel(normalized, language)
    : normalized;
};
