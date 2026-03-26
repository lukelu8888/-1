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
  useEffect,
  ReactNode,
} from 'react';
import { useUser } from './UserContext';
import { supplierOrganizationService, supplierPortalProfileService } from '../lib/supabaseService';

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
  updateOrg: (patch: Partial<Omit<OrgProfile, 'id'>>) => Promise<void>;
  uploadOrgLogo: (file: File) => Promise<void>;
  updateUserProfile: (patch: Partial<Omit<SupplierUserProfile, 'id' | 'email'>>) => Promise<void>;
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
  const { user } = useUser();
  const [org, setOrg] = useState<OrgProfile>(() =>
    load<OrgProfile>(ORG_KEY, DEFAULT_ORG)
  );

  const [userProfile, setUserProfile] = useState<SupplierUserProfile>(() =>
    load<SupplierUserProfile>(USER_KEY, DEFAULT_USER)
  );

  useEffect(() => {
    let cancelled = false;

    if (!user?.id || (user.type !== 'supplier' && user.type !== 'manufacturer')) {
      return undefined;
    }

    void (async () => {
      try {
        const [remoteOrg, remoteUser] = await Promise.all([
          supplierOrganizationService.getByAuthUser(user.id),
          supplierPortalProfileService.getByAuthUser(user.id),
        ]);

        if (cancelled) return;

        if (remoteOrg) {
          const nextOrg: OrgProfile = {
            id: remoteOrg.id || user.id,
            name: remoteOrg.nameCN || org.name,
            nameEn: remoteOrg.nameEN || org.nameEn,
            description: remoteOrg.description || org.description,
            phone: remoteOrg.phone || org.phone,
            address: remoteOrg.address || org.address,
            website: remoteOrg.website || org.website,
            contactPerson: remoteOrg.contactPerson || org.contactPerson,
            logoUrl: remoteOrg.logoUrl ?? org.logoUrl,
          };
          setOrg(nextOrg);
          save(ORG_KEY, nextOrg);
        } else {
          await supplierOrganizationService.saveByAuthUser(user.id, org);
        }

        if (remoteUser) {
          const nextUser: SupplierUserProfile = {
            id: remoteUser.id || user.id,
            name: remoteUser.displayName || userProfile.name || user.name || '',
            email: remoteUser.loginEmail || user.email || userProfile.email,
            role: remoteUser.roleLabel || userProfile.role || 'Supplier',
            avatarUrl: remoteUser.avatarUrl ?? userProfile.avatarUrl,
          };
          setUserProfile(nextUser);
          save(USER_KEY, nextUser);
        } else {
          await supplierPortalProfileService.saveByAuthUser(user.id, {
            displayName: userProfile.name || user.name || '',
            loginEmail: user.email || userProfile.email || '',
            portalRole: 'supplier',
            roleLabel: userProfile.role || 'Supplier',
            avatarUrl: userProfile.avatarUrl,
          });
        }
      } catch (error) {
        console.warn('[OrganizationContext] Supabase hydrate fallback to local cache:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.type]);

  const updateOrg = useCallback(async (patch: Partial<Omit<OrgProfile, 'id'>>) => {
    const next = { ...org, ...patch };
    setOrg(next);
    save(ORG_KEY, next);

    if (user?.id && (user.type === 'supplier' || user.type === 'manufacturer')) {
      await supplierOrganizationService.saveByAuthUser(user.id, {
        nameCN: next.name,
        nameEN: next.nameEn,
        description: next.description,
        phone: next.phone,
        address: next.address,
        website: next.website,
        contactPerson: next.contactPerson,
        logoUrl: next.logoUrl,
      });
    }
  }, [org, user?.id, user?.type]);

  const uploadOrgLogo = useCallback(async (file: File) => {
    const dataUri = await fileToDataUri(file);
    const next = { ...org, logoUrl: dataUri };
    setOrg(next);
    save(ORG_KEY, next);
    if (user?.id && (user.type === 'supplier' || user.type === 'manufacturer')) {
      await supplierOrganizationService.saveByAuthUser(user.id, {
        nameCN: next.name,
        nameEN: next.nameEn,
        description: next.description,
        phone: next.phone,
        address: next.address,
        website: next.website,
        contactPerson: next.contactPerson,
        logoUrl: next.logoUrl,
      });
    }
  }, [org, user?.id, user?.type]);

  const updateUserProfile = useCallback(
    async (patch: Partial<Omit<SupplierUserProfile, 'id' | 'email'>>) => {
      const next = { ...userProfile, ...patch };
      setUserProfile(next);
      save(USER_KEY, next);

      if (user?.id && (user.type === 'supplier' || user.type === 'manufacturer')) {
        await supplierPortalProfileService.saveByAuthUser(user.id, {
          displayName: next.name,
          loginEmail: user.email || userProfile.email || '',
          portalRole: 'supplier',
          roleLabel: next.role || 'Supplier',
          avatarUrl: next.avatarUrl,
        });
      }
    },
    [user?.email, user?.id, user?.type, userProfile]
  );

  const uploadUserAvatar = useCallback(async (file: File) => {
    const dataUri = await fileToDataUri(file);
    const next = { ...userProfile, avatarUrl: dataUri };
    setUserProfile(next);
    save(USER_KEY, next);
    if (user?.id && (user.type === 'supplier' || user.type === 'manufacturer')) {
      await supplierPortalProfileService.saveByAuthUser(user.id, {
        displayName: next.name,
        loginEmail: user.email || userProfile.email || '',
        portalRole: 'supplier',
        roleLabel: next.role || 'Supplier',
        avatarUrl: next.avatarUrl,
      });
    }
  }, [user?.email, user?.id, user?.type, userProfile]);

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
