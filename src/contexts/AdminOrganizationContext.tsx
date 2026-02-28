/**
 * AdminOrganizationContext  —  Bilingual Edition
 * ─────────────────────────────────────────────────────────────────────────────
 * Platform/Admin company profile. Completely separate from Supplier context.
 *
 * Bilingual SQL schema (admin_organizations):
 * ─────────────────────────────────────────────────────────────────────────────
 * CREATE TABLE admin_organizations (
 *   id                      TEXT PRIMARY KEY DEFAULT 'admin-org-001',
 *   -- Identity (bilingual)
 *   name_cn                 TEXT NOT NULL DEFAULT '高盛达富',
 *   name_en                 TEXT NOT NULL DEFAULT '',
 *   description_cn          TEXT DEFAULT '',
 *   description_en          TEXT DEFAULT '',
 *   phone                   TEXT DEFAULT '',
 *   website                 TEXT DEFAULT '',
 *   address_cn              TEXT DEFAULT '',
 *   address_en              TEXT DEFAULT '',
 *   logo_url                TEXT,
 *   -- RMB Public Account (Chinese fields only — domestic payments)
 *   rmb_bank_name           TEXT DEFAULT '',
 *   rmb_account_name        TEXT DEFAULT '',
 *   rmb_account_number      TEXT DEFAULT '',
 *   rmb_swift               TEXT DEFAULT '',
 *   -- USD Public Account (English fields only — international payments)
 *   usd_bank_name           TEXT DEFAULT '',
 *   usd_account_name        TEXT DEFAULT '',
 *   usd_account_number      TEXT DEFAULT '',
 *   usd_swift               TEXT DEFAULT '',
 *   -- Private Account (Chinese fields)
 *   private_account_name    TEXT DEFAULT '',
 *   private_bank_name       TEXT DEFAULT '',
 *   private_account_number  TEXT DEFAULT '',
 *   private_remark          TEXT DEFAULT '',
 *   created_at              TIMESTAMPTZ DEFAULT now(),
 *   updated_at              TIMESTAMPTZ DEFAULT now()
 * );
 *
 * CREATE TABLE admin_users (
 *   id         TEXT PRIMARY KEY,
 *   name       TEXT,
 *   email      TEXT,
 *   role       TEXT,
 *   avatar_url TEXT,
 *   created_at TIMESTAMPTZ DEFAULT now()
 * );
 *
 * Storage bucket: admin-assets
 * Logo path:      /org/{organization_id}/logo.png
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Quotation document usage:
 *   const lang: 'cn' | 'en' = quotation.language ?? 'cn';
 *   const name    = lang === 'cn' ? adminOrg.nameCN    : adminOrg.nameEN;
 *   const address = lang === 'cn' ? adminOrg.addressCN : adminOrg.addressEN;
 *   const rmbBank = lang === 'cn' ? adminOrg.bankRMB.bankNameCN
 *                                 : adminOrg.bankRMB.bankNameEN;
 */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Bank account sub-types
//
// Design rationale:
//   RMB account  → Chinese-only fields  (domestic CNY payments)
//   USD account  → English-only fields  (international USD payments)
//   Private      → Chinese fields
// ─────────────────────────────────────────────────────────────────────────────

/** 人民币公账 — Chinese fields only (domestic payments) */
export interface BankAccountRMB {
  /** 开户行 */
  bankName: string;
  /** 账户名称 */
  accountName: string;
  /** 银行账号 */
  accountNumber: string;
  /** Swift Code (optional) */
  swift: string;
}

/** USD Public Account — English fields only (international payments) */
export interface BankAccountUSD {
  /** Bank Name */
  bankName: string;
  /** Account Name */
  accountName: string;
  /** Account Number */
  accountNumber: string;
  /** SWIFT Code */
  swift: string;
}

/** 私人账户 — Chinese fields */
export interface BankAccountPrivate {
  /** 账户姓名 */
  accountName: string;
  /** 开户银行 */
  bankName: string;
  /** 银行账号 */
  accountNumber: string;
  /** 备注 */
  remark: string;
}

export interface AdminOrgProfile {
  id: string;
  /** 公司中文名 */
  nameCN: string;
  /** Company English name */
  nameEN: string;
  /** 公司简介（中文） */
  descriptionCN: string;
  /** Company description (English) */
  descriptionEN: string;
  /** 联系电话 (shared) */
  phone: string;
  /** 官网 (shared) */
  website: string;
  /** 公司地址（中文） */
  addressCN: string;
  /** Company address (English) */
  addressEN: string;
  /** data-URI or remote URL; null = show placeholder */
  logoUrl: string | null;
  bankRMB: BankAccountRMB;
  bankUSD: BankAccountUSD;
  bankPrivate: BankAccountPrivate;
}

export interface AdminUserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  /** data-URI or URL; null = show initials */
  avatarUrl: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context type
// ─────────────────────────────────────────────────────────────────────────────
interface AdminOrganizationContextType {
  adminOrg: AdminOrgProfile;
  adminUserProfile: AdminUserProfile;
  updateAdminOrg: (patch: Partial<Omit<AdminOrgProfile, 'id'>>) => void;
  /** Returns true if logo saved to disk; false = quota exceeded (still visible this session) */
  uploadAdminLogo: (file: File) => Promise<boolean>;
  updateAdminUserProfile: (patch: Partial<Omit<AdminUserProfile, 'id' | 'email'>>) => void;
  /** Returns true if avatar saved to disk; false = quota exceeded */
  uploadAdminAvatar: (file: File) => Promise<boolean>;
  /** Helper: resolve company name by language */
  orgName: (lang: 'cn' | 'en') => string;
  /** Helper: resolve address by language */
  orgAddress: (lang: 'cn' | 'en') => string;
  /** Helper: resolve description by language */
  orgDescription: (lang: 'cn' | 'en') => string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage keys
// Logo is stored separately so a large data-URI never blocks text-field saves.
// ─────────────────────────────────────────────────────────────────────────────
const ORG_KEY      = 'cosun_admin_org_profile_v3'; // v3 = rmb CN-only / usd EN-only
const ORG_LOGO_KEY = 'cosun_admin_org_logo';       // separate key for logo data-URI
const USER_KEY     = 'cosun_admin_user_profile';
const USER_AVT_KEY = 'cosun_admin_user_avatar';    // separate key for avatar data-URI

// ─────────────────────────────────────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_ORG: AdminOrgProfile = {
  id:            'admin-org-001',
  nameCN:        '高盛达富',
  nameEN:        'Gaoshengdafu Building Materials Co., Ltd.',
  descriptionCN: '',
  descriptionEN: '',
  phone:         '',
  website:       '',
  addressCN:     '',
  addressEN:     '',
  logoUrl:       null,
  bankRMB: {
    bankName:      '',
    accountName:   '',
    accountNumber: '',
    swift:         '',
  },
  bankUSD: {
    bankName:      '',
    accountName:   '',
    accountNumber: '',
    swift:         '',
  },
  bankPrivate: {
    accountName:   '',
    bankName:      '',
    accountNumber: '',
    remark:        '',
  },
};

const DEFAULT_USER: AdminUserProfile = {
  id:        'admin-user-001',
  name:      '管理员',
  email:     '',
  role:      'Admin',
  avatarUrl: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return deepMerge(fallback, JSON.parse(raw)) as T;
  } catch {
    return fallback;
  }
}

/** Load AdminOrgProfile, merging the separately-stored logo back in. */
function loadAdminOrg(): AdminOrgProfile {
  const base = loadFromStorage<AdminOrgProfile>(ORG_KEY, DEFAULT_ORG);
  const logo = loadRaw(ORG_LOGO_KEY);
  // Logo key wins over any logoUrl that might be embedded in the JSON blob
  return { ...base, logoUrl: logo ?? base.logoUrl };
}

/** Load AdminUserProfile, merging the separately-stored avatar back in. */
function loadAdminUser(): AdminUserProfile {
  const base = loadFromStorage<AdminUserProfile>(USER_KEY, DEFAULT_USER);
  const avatar = loadRaw(USER_AVT_KEY);
  return { ...base, avatarUrl: avatar ?? base.avatarUrl };
}

function deepMerge<T>(target: T, source: Partial<T>): T {
  const result = { ...target };
  for (const key in source) {
    const sv = source[key];
    const tv = (target as any)[key];
    if (
      sv !== null &&
      typeof sv === 'object' &&
      !Array.isArray(sv) &&
      typeof tv === 'object'
    ) {
      (result as any)[key] = deepMerge(tv, sv);
    } else if (sv !== undefined) {
      (result as any)[key] = sv;
    }
  }
  return result;
}

/**
 * Persist JSON to localStorage.
 * Returns true if saved, false if quota was exceeded.
 * Never throws — callers check the return value instead.
 */
function persist(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    console.warn(`[AdminOrg] localStorage quota exceeded for key "${key}"`);
    return false;
  }
}

/**
 * Persist a potentially large string (logo/avatar data-URI) to its own key.
 * On quota exceeded: logs a warning but does NOT throw — the image is still
 * visible in React state for the current session; it just won't survive a
 * page reload.  Returns true if saved, false if quota was hit.
 */
function persistImage(key: string, dataUri: string | null): boolean {
  try {
    if (dataUri === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, dataUri);
    }
    return true;
  } catch {
    console.warn(
      `[AdminOrg] localStorage quota exceeded for key "${key}". ` +
      'Image visible this session but will not persist across reloads. ' +
      'Consider using Supabase Storage for production.'
    );
    return false;
  }
}

/** Load a raw string value (not JSON) from localStorage. */
function loadRaw(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

/**
 * Storage upload simulation.
 * In production: replace with Supabase Storage upload:
 *   const { data, error } = await supabase.storage
 *     .from('admin-assets')
 *     .upload(`/org/${orgId}/logo.png`, file, { upsert: true });
 *   return supabase.storage.from('admin-assets').getPublicUrl(data.path).data.publicUrl;
 */
function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Context + Provider
// ─────────────────────────────────────────────────────────────────────────────
const AdminOrganizationContext = createContext<AdminOrganizationContextType | undefined>(
  undefined
);

export function AdminOrganizationProvider({ children }: { children: ReactNode }) {
  // Use dedicated loaders that merge separately-stored logo/avatar back in
  const [adminOrg, setAdminOrg] = useState<AdminOrgProfile>(loadAdminOrg);
  const [adminUserProfile, setAdminUserProfile] = useState<AdminUserProfile>(loadAdminUser);

  // ── Org ──────────────────────────────────────────────────────────────────
  const updateAdminOrg = useCallback(
    (patch: Partial<Omit<AdminOrgProfile, 'id'>>) => {
      setAdminOrg(prev => {
        const next = deepMerge(prev, patch as Partial<AdminOrgProfile>);
        // Persist text fields only — logo lives in its own key
        const { logoUrl: _logo, ...withoutLogo } = next;
        persist(ORG_KEY, withoutLogo);
        // If patch explicitly clears/sets logo, sync the image key too
        if ('logoUrl' in patch) {
          persistImage(ORG_LOGO_KEY, patch.logoUrl ?? null);
        }
        return next;
      });
    },
    []
  );

  const uploadAdminLogo = useCallback(async (file: File): Promise<boolean> => {
    const dataUri = await fileToDataUri(file);
    setAdminOrg(prev => ({ ...prev, logoUrl: dataUri }));
    return persistImage(ORG_LOGO_KEY, dataUri);
  }, []);

  // ── User ─────────────────────────────────────────────────────────────────
  const updateAdminUserProfile = useCallback(
    (patch: Partial<Omit<AdminUserProfile, 'id' | 'email'>>) => {
      setAdminUserProfile(prev => {
        const next = { ...prev, ...patch };
        const { avatarUrl: _av, ...withoutAvatar } = next;
        persist(USER_KEY, withoutAvatar);
        if ('avatarUrl' in patch) {
          persistImage(USER_AVT_KEY, patch.avatarUrl ?? null);
        }
        return next;
      });
    },
    []
  );

  const uploadAdminAvatar = useCallback(async (file: File): Promise<boolean> => {
    const dataUri = await fileToDataUri(file);
    setAdminUserProfile(prev => ({ ...prev, avatarUrl: dataUri }));
    return persistImage(USER_AVT_KEY, dataUri);
  }, []);

  // ── Language helpers (for quotation documents) ────────────────────────────
  const orgName = useCallback(
    (lang: 'cn' | 'en') =>
      (lang === 'cn' ? adminOrg.nameCN : adminOrg.nameEN) || adminOrg.nameCN,
    [adminOrg]
  );

  const orgAddress = useCallback(
    (lang: 'cn' | 'en') =>
      (lang === 'cn' ? adminOrg.addressCN : adminOrg.addressEN) || adminOrg.addressCN,
    [adminOrg]
  );

  const orgDescription = useCallback(
    (lang: 'cn' | 'en') =>
      (lang === 'cn' ? adminOrg.descriptionCN : adminOrg.descriptionEN) ||
      adminOrg.descriptionCN,
    [adminOrg]
  );

  return (
    <AdminOrganizationContext.Provider
      value={{
        adminOrg,
        adminUserProfile,
        updateAdminOrg,
        uploadAdminLogo,
        updateAdminUserProfile,
        uploadAdminAvatar,
        orgName,
        orgAddress,
        orgDescription,
      }}
    >
      {children}
    </AdminOrganizationContext.Provider>
  );
}

export function useAdminOrganization(): AdminOrganizationContextType {
  const ctx = useContext(AdminOrganizationContext);
  if (!ctx) {
    throw new Error('useAdminOrganization must be used inside <AdminOrganizationProvider>');
  }
  return ctx;
}
