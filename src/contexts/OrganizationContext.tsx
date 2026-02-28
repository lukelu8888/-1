/**
 * OrganizationContext
 * ──────────────────────────────────────────────────────────────────
 * Two independent layers:
 *   1. OrgProfile  – company-level: name, logo, address, phone, website
 *   2. UserProfile – user-level:    name, role, avatar
 *
 * Both are persisted to localStorage (no backend dependency).
 * Logo / avatar files are converted to data-URIs and stored inline
 * so they survive page reloads and are immediately available for
 * PDF / print exports without an external bucket.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface OrgProfile {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  phone: string;
  address: string;
  website: string;
  contactPerson: string;
  /** data-URI or public URL; null = show placeholder */
  logoUrl: string | null;
}

export interface SupplierUserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  /** data-URI or public URL; null = show initials */
  avatarUrl: string | null;
}

interface OrganizationContextType {
  org: OrgProfile;
  userProfile: SupplierUserProfile;
  updateOrg: (patch: Partial<Omit<OrgProfile, 'id'>>) => void;
  uploadOrgLogo: (file: File) => Promise<void>;
  updateUserProfile: (patch: Partial<Omit<SupplierUserProfile, 'id' | 'email'>>) => void;
  uploadUserAvatar: (file: File) => Promise<void>;
}

// ─────────────────────────────────────────────
// Storage keys
// ─────────────────────────────────────────────
const ORG_KEY  = 'cosun_org_profile';
const USER_KEY = 'cosun_supplier_user_profile';

// ─────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────
const DEFAULT_ORG: OrgProfile = {
  id:            'org-001',
  name:          '供应商公司',
  nameEn:        'Supplier Co.',
  description:   '',
  phone:         '',
  address:       '',
  website:       '',
  contactPerson: '',
  logoUrl:       null,
};

const DEFAULT_USER: SupplierUserProfile = {
  id:        'user-001',
  name:      '供应商账户',
  email:     '',
  role:      'Supplier',
  avatarUrl: null,
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

/** Convert File → data-URI string */
function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────
const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [org, setOrg] = useState<OrgProfile>(() =>
    load<OrgProfile>(ORG_KEY, DEFAULT_ORG)
  );

  const [userProfile, setUserProfile] = useState<SupplierUserProfile>(() =>
    load<SupplierUserProfile>(USER_KEY, DEFAULT_USER)
  );

  const updateOrg = useCallback((patch: Partial<Omit<OrgProfile, 'id'>>) => {
    setOrg(prev => {
      const next = { ...prev, ...patch };
      save(ORG_KEY, next);
      return next;
    });
  }, []);

  const uploadOrgLogo = useCallback(async (file: File) => {
    const dataUri = await fileToDataUri(file);
    setOrg(prev => {
      const next = { ...prev, logoUrl: dataUri };
      save(ORG_KEY, next);
      return next;
    });
  }, []);

  const updateUserProfile = useCallback(
    (patch: Partial<Omit<SupplierUserProfile, 'id' | 'email'>>) => {
      setUserProfile(prev => {
        const next = { ...prev, ...patch };
        save(USER_KEY, next);
        return next;
      });
    },
    []
  );

  const uploadUserAvatar = useCallback(async (file: File) => {
    const dataUri = await fileToDataUri(file);
    setUserProfile(prev => {
      const next = { ...prev, avatarUrl: dataUri };
      save(USER_KEY, next);
      return next;
    });
  }, []);

  return (
    <OrganizationContext.Provider
      value={{ org, userProfile, updateOrg, uploadOrgLogo, updateUserProfile, uploadUserAvatar }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization(): OrganizationContextType {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error('useOrganization must be used within OrganizationProvider');
  return ctx;
}
