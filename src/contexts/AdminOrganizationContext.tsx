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
 *   name_cn                 TEXT NOT NULL DEFAULT '',
 *   name_en                 TEXT NOT NULL DEFAULT '',
 *   description_cn          TEXT DEFAULT '',
 *   description_en          TEXT DEFAULT '',
 *   phone                   TEXT DEFAULT '',
 *   email                   TEXT DEFAULT '',
 *   contact_person          TEXT DEFAULT '',
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
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import { adminOrganizationService, staffDirectoryService } from '../lib/supabaseService';
import { canonicalizePersonnelEmail } from '../lib/personnelEmail';
import { adminOrganizationSnapshotService } from '../lib/services/adminOrganizationSnapshotService';
import { getAdminAuthMode, type AdminAuthIdentitySource } from '../config/adminPortalPolicy';
import {
  hasLegacyAdminRosterArtifacts as hasSharedLegacyAdminRosterArtifacts,
  normalizeAdminRosterAccounts,
  normalizeAdminRosterContacts,
} from '../lib/services/adminRosterNormalizer';
import {
  deriveAccountRoleDefaults,
  getDepartmentAndTitleForRole,
  inferRegionCode,
} from '../components/admin/admin-organization-profile/roleMappingEngine';

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
  /** 银行地址 */
  bankAddress: string;
  /** 账户名称 */
  accountName: string;
  /** 银行账号 */
  accountNumber: string;
  /** Swift Code (optional) */
  swift: string;
  /** 收款备注 */
  paymentNote: string;
}

/** USD Public Account — English fields only (international payments) */
export interface BankAccountUSD {
  /** Bank Name */
  bankName: string;
  /** Bank Address */
  bankAddress: string;
  /** Account Name */
  accountName: string;
  /** Account Number */
  accountNumber: string;
  /** SWIFT Code */
  swift: string;
  /** Payment Note */
  paymentNote: string;
}

/** 私人账户 — Chinese fields */
export interface BankAccountPrivate {
  /** 账户姓名 */
  accountName: string;
  /** 开户银行 */
  bankName: string;
  /** 银行地址 */
  bankAddress: string;
  /** 银行账号 */
  accountNumber: string;
  /** 备注 */
  remark: string;
  /** 收款备注 */
  paymentNote: string;
}

export interface InternalContact {
  id: string;
  employeeNo: string;
  name: string;
  department: string;
  title: string;
  region: string;
  managerId?: string;
  extension: string;
  phone: string;
  email: string;
  wechat: string;
  status: string;
  visibleInDocuments: boolean;
}

export interface InternalAccount {
  id: string;
  employeeId: string;
  authUserId: string;
  username: string;
  loginEmail: string;
  loginPassword: string;
  role: string;
  region: string;
  department: string;
  accountStatus: 'active' | 'disabled' | 'locked' | 'deleted';
  canLogin: boolean;
  forcePasswordReset: boolean;
  lastLoginAt: string;
  notes: string;
  authMode?: 'test' | 'dual' | 'production';
  activationStatus?: 'draft' | 'invited' | 'email_verified' | 'phone_verified' | 'active' | 'disabled';
  primaryIdentitySource?: AdminAuthIdentitySource;
  phoneLogin?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  wechatOpenId?: string;
  enterpriseWechatUserId?: string;
  whatsappAccount?: string;
  invitedAt?: string;
  inviteExpiresAt?: string;
  lastInviteChannel?: AdminAuthIdentitySource;
  activatedAt?: string;
}

export interface DocumentDefaults {
  defaultSignatory: string;
  defaultEmail: string;
  defaultPhone: string;
  defaultFooterNote: string;
  defaultCurrency: string;
  defaultTimezone: string;
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
  /** 公司邮箱 (shared) */
  email: string;
  /** 公司联系人 (shared) */
  contactPerson: string;
  /** 官网 (shared) */
  website: string;
  /** 公司地址（中文） */
  addressCN: string;
  /** Company address (English) */
  addressEN: string;
  /** 统一社会信用代码 / Tax ID */
  taxId: string;
  /** 默认结算币种（中文侧） */
  defaultCurrencyCN: string;
  /** Default settlement currency (English side) */
  defaultCurrencyEN: string;
  /** 默认结算币种 */
  defaultCurrency: string;
  /** 时区 */
  timezone: string;
  /** data-URI or remote URL; null = show placeholder */
  logoUrl: string | null;
  bankRMB: BankAccountRMB;
  bankUSD: BankAccountUSD;
  bankPrivate: BankAccountPrivate;
  internalContacts: InternalContact[];
  internalAccounts: InternalAccount[];
  documentDefaults: DocumentDefaults;
}

export interface AdminUserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  /** data-URI or URL; null = show initials */
  avatarUrl: string | null;
}

type InternalStaffSeed = {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  region: string;
  department: string;
  title?: string;
  legacyEmails?: string[];
};

const INTERNAL_STAFF_SEEDS: InternalStaffSeed[] = [
  {
    id: 'admin',
    username: 'admin',
    name: '系统管理员',
    email: 'admin@cosunchina.com',
    role: 'Admin',
    region: 'all',
    department: 'IT部',
    legacyEmails: ['admin@cosun.com'],
  },
  {
    id: 'ceo',
    username: 'ceo',
    name: '张明',
    email: 'ceo@cosunchina.com',
    role: 'CEO',
    region: 'all',
    department: '管理层',
    title: 'CEO',
    legacyEmails: ['ceo@cosun.com'],
  },
  {
    id: 'hr',
    username: 'hr',
    name: '卢招',
    email: 'hr@cosunchina.com',
    role: 'HR_Admin',
    region: 'all',
    department: '人力资源',
    title: '招聘经理',
    legacyEmails: ['hr@cosun.com'],
  },
  {
    id: 'cfo',
    username: 'cfo',
    name: '李华',
    email: 'cfo@cosunchina.com',
    role: 'CFO',
    region: 'all',
    department: '财务部',
    title: 'CFO',
    legacyEmails: ['cfo@cosun.com'],
  },
  {
    id: 'external-accountant',
    username: 'finance_agency',
    name: '杨立',
    email: 'finance_agency@cosunchina.com',
    role: 'External_Accountant',
    region: 'all',
    department: '财务部',
    title: '代理记账财务',
    legacyEmails: ['finance_agent@cosun.com'],
  },
  {
    id: 'sales-director',
    username: 'sales.director',
    name: '王强',
    email: 'sales.director@cosunchina.com',
    role: 'Sales_Director',
    region: 'all',
    department: '销售部',
    legacyEmails: ['sales.director@cosun.com'],
  },
  {
    id: 'regional-manager-na',
    username: 'salesmanager-na',
    name: '刘建国',
    email: 'salesmanager-na@cosunchina.com',
    role: 'Regional_Manager',
    region: 'NA',
    department: '销售部-北美',
    legacyEmails: ['john.smith@cosun.com'],
  },
  {
    id: 'regional-manager-sa',
    username: 'salesmanager-sa',
    name: '陈明华',
    email: 'salesmanager-sa@cosunchina.com',
    role: 'Regional_Manager',
    region: 'SA',
    department: '销售部-南美',
    legacyEmails: ['carlos.silva@cosun.com'],
  },
  {
    id: 'regional-manager-ea',
    username: 'salesmanager-ea',
    name: '赵国强',
    email: 'salesmanager-ea@cosunchina.com',
    role: 'Regional_Manager',
    region: 'EA',
    department: '销售部-欧非',
    legacyEmails: ['hans.mueller@cosun.com'],
  },
  {
    id: 'sales-rep-na',
    username: 'maria.garcia',
    name: '马里奥',
    email: 'sales01-na@cosunchina.com',
    role: 'Sales_Rep',
    region: 'NA',
    department: '销售部-北美',
    title: '业务员',
    legacyEmails: ['maria.garcia@cosun.com', 'maria@cosun.com', 'zhangwei@cosun.com'],
  },
  {
    id: 'sales-rep-na-2',
    username: 'sales02-na',
    name: '艾青',
    email: 'sales02-na@cosunchina.com',
    role: 'Sales_Rep',
    region: 'NA',
    department: '销售部-北美',
    title: '业务员',
    legacyEmails: [],
  },
  {
    id: 'sales-rep-sa',
    username: 'sales01-sa',
    name: '安娜',
    email: 'sales01-sa@cosunchina.com',
    role: 'Sales_Rep',
    region: 'SA',
    department: '销售部-南美',
    title: '业务员',
    legacyEmails: ['ana.santos@cosun.com', 'lifang@cosun.com'],
  },
  {
    id: 'sales-rep-ea',
    username: 'sales02-ea',
    name: '艾玛',
    email: 'sales02-ea@cosunchina.com',
    role: 'Sales_Rep',
    region: 'EA',
    department: '销售部-欧非',
    title: '业务员',
    legacyEmails: ['emma.thompson@cosun.com', 'wangfang@cosun.com'],
  },
  {
    id: 'finance',
    username: 'finance',
    name: '赵敏',
    email: 'finance@cosunchina.com',
    role: 'Finance',
    region: 'all',
    department: '财务部',
    legacyEmails: ['finance@cosun.com'],
  },
  {
    id: 'procurement-manager',
    username: 'procurement.manager',
    name: '王芳',
    email: 'procurement.manager@cosunchina.com',
    role: 'Procurement_Manager',
    region: 'all',
    department: '采购部',
    title: '采购主管',
    legacyEmails: ['procurement.manager@cosun.com'],
  },
  {
    id: 'procurement',
    username: 'procurement',
    name: '刘刚',
    email: 'procurement@cosunchina.com',
    role: 'Procurement',
    region: 'all',
    department: '采购部',
    title: '采购员',
    legacyEmails: ['procurement@cosun.com'],
  },
  {
    id: 'marketing',
    username: 'marketing',
    name: '李娜',
    email: 'marketing@cosunchina.com',
    role: 'Marketing_Ops',
    region: 'all',
    department: '市场部',
    title: '运营专员',
    legacyEmails: ['marketing@cosun.com'],
  },
  {
    id: 'marketing-assistant',
    username: 'marketing.assistance',
    name: '王市',
    email: 'marketing.assistance@cosunchina.com',
    role: 'Marketing_Assistant',
    region: 'all',
    department: '市场部',
    title: '运营助理',
    legacyEmails: ['marketing.assistant@cosunchina.com', 'marketing.assistance@cosun.com'],
  },
  {
    id: 'qc',
    username: 'qc',
    name: '卢毅',
    email: 'qc@cosunchina.com',
    role: 'QC',
    region: 'all',
    department: '品控部',
    title: '验货员',
    legacyEmails: ['luyi@cosun.com', 'qc@cosun.com'],
  },
  {
    id: 'admin-ops',
    username: 'xingzheng',
    name: '邢政',
    email: 'xingzheng@cosunchina.com',
    role: 'Admin_Ops',
    region: 'all',
    department: '行政部',
    title: '行政专员',
  },
  {
    id: 'documentation-officer-track',
    username: 'track',
    name: '李根',
    role: 'Order_Coordinator',
    email: 'track@cosunchina.com',
    region: 'all',
    department: '销售部',
    title: '跟单员',
    legacyEmails: ['track@cosun.com'],
  },
  {
    id: 'documentation-officer-docs',
    username: 'documents',
    name: '李敏',
    email: 'documents@cosunchina.com',
    role: 'Documentation_Officer',
    region: 'all',
    department: '单证管理部',
    title: '单证员',
    legacyEmails: ['documents@cosun.com', 'zhanghui@cosun.com'],
  },
];

const INTERNAL_STAFF_SEED_BY_EMAIL = new Map<string, InternalStaffSeed>();
INTERNAL_STAFF_SEEDS.forEach((seed) => {
  INTERNAL_STAFF_SEED_BY_EMAIL.set(seed.email.toLowerCase(), seed);
  (seed.legacyEmails || []).forEach((legacyEmail) => {
    INTERNAL_STAFF_SEED_BY_EMAIL.set(legacyEmail.toLowerCase(), seed);
  });
});

export interface AdminOrgSaveResult {
  localSaved: boolean;
  remoteSaved: boolean;
}

export interface UpdateAdminOrgOptions {
  allowPasswordWriteAccountIds?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Context type
// ─────────────────────────────────────────────────────────────────────────────
interface AdminOrganizationContextType {
  adminOrg: AdminOrgProfile;
  adminUserProfile: AdminUserProfile;
  updateAdminOrg: (patch: Partial<Omit<AdminOrgProfile, 'id'>>, options?: UpdateAdminOrgOptions) => Promise<AdminOrgSaveResult>;
  restoreLatestAdminOrgSnapshot: () => Promise<(AdminOrgSaveResult & { restoredAt: string; source: string; summary: string }) | null>;
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
const ORG_BAK_KEY  = 'cosun_admin_org_profile_v3_backup';
const ORG_LOGO_KEY = 'cosun_admin_org_logo';       // separate key for logo data-URI
const USER_KEY     = 'cosun_admin_user_profile';
const USER_AVT_KEY = 'cosun_admin_user_avatar';    // separate key for avatar data-URI
const ADMIN_ORG_REMOTE_SAVE_TIMEOUT_MS = 4500;
const LOCAL_ADMIN_AUTH_STORAGE_KEY = 'cosun_admin_local_auth';

const ORG_MASTER_SEED = {
  nameCN: '福建高盛达富建材有限公司',
  nameEN: 'Fujian Cosun Tuff Building Materials Co., Ltd.',
  descriptionCN: '',
  descriptionEN: '',
  phone: '+86-13799993509',
  email: 'sales@cosunchina.com',
  contactPerson: '张明',
  website: 'www.cosunchina.com',
  addressCN: '福建省福州市仓山区万达广场C1栋1807单元',
  addressEN: 'Unit 1807, C1 Building, Wanda Plaza, Cangshan Dist., Fuzhou, Fujian, China.',
  taxId: '91350104671933717N',
  defaultCurrencyCN: 'CNY',
  defaultCurrencyEN: 'USD',
  defaultCurrency: 'CNY',
  timezone: 'Asia/Shanghai',
  bankRMB: {
    bankName: '中国银行福建省分行',
    bankAddress: '福建省福州市鼓楼区西二环中路136号',
    accountName: '福建高盛达富建材有限公司',
    accountNumber: '4208583481447',
    swift: 'BKCHCNBJ720',
    paymentNote: '',
  },
  bankUSD: {
    bankName: 'Bank of China Fujian Branch',
    bankAddress: 'No.136, West Rd. Gulou Dist., Fuzhou City, Fujian Province, PRC',
    accountName: 'Fujian Cosun Tuff Building Materials Co., Ltd.',
    accountNumber: '4208583481447',
    swift: 'BKCHCNBJ720',
    paymentNote: '',
  },
  bankPrivate: {
    accountName: '',
    bankName: '',
    bankAddress: '',
    accountNumber: '',
    remark: '',
    paymentNote: '',
  },
  documentDefaults: {
    defaultSignatory: '张明',
    defaultEmail: 'sales@cosunchina.com',
    defaultPhone: '+86-13799993509',
    defaultFooterNote: '',
    defaultCurrency: 'CNY',
    defaultTimezone: 'Asia/Shanghai',
  },
} as const;

function fallbackNameFromEmail(email: string, username: string): string {
  const base = (email || username || '').split('@')[0].replace(/[._-]+/g, ' ').trim();
  if (!base) return '';
  return base
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function dedupeBy<T>(items: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getKey(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseEmployeeNoNumber(value: string): number {
  const match = String(value || '').trim().match(/CS-(\d+)/i);
  return match ? Number(match[1]) : 0;
}

function formatEmployeeNo(value: number): string {
  return `CS-${String(value).padStart(3, '0')}`;
}

function getNextEmployeeNo(contacts: InternalContact[]): string {
  const maxNo = contacts.reduce((max, contact) => Math.max(max, parseEmployeeNoNumber(contact.employeeNo)), 0);
  return formatEmployeeNo(maxNo + 1);
}

const PRIMARY_ADMIN_EMAIL = 'admin@cosunchina.com';
const PRIMARY_ADMIN_MANAGED_PASSWORD = 'Zi39@cosun';

function isManagedSeededInternalAccount(account: Partial<InternalAccount>): boolean {
  const normalizedEmail = canonicalizePersonnelEmail(account.loginEmail, account.region) || String(account.loginEmail || '').trim().toLowerCase();
  const normalizedAuthUserId = String(account.authUserId || '').trim().toLowerCase();
  const normalizedUsername = String(account.username || '').trim().toLowerCase();

  return INTERNAL_STAFF_SEEDS.some((seed) => {
    const seededEmail = canonicalizePersonnelEmail(seed.email, seed.region || 'all');
    return (
      normalizedEmail === seededEmail ||
      normalizedAuthUserId === String(seed.id || '').trim().toLowerCase() ||
      normalizedUsername === String(seed.username || '').trim().toLowerCase()
    );
  });
}

function generateManagedInternalPassword(seed = ''): string {
  const normalizedSeed = String(seed || '').trim().toLowerCase();
  if (normalizedSeed === 'admin' || normalizedSeed === 'user_admin') {
    return PRIMARY_ADMIN_MANAGED_PASSWORD;
  }

  let hash = 0;
  for (let index = 0; index < normalizedSeed.length; index += 1) {
    hash = (hash * 31 + normalizedSeed.charCodeAt(index)) >>> 0;
  }

  const upperChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowerChars = 'abcdefghijkmnpqrstuvwxyz';
  const upper = upperChars[hash % upperChars.length];
  const lower = lowerChars[Math.floor(hash / upperChars.length) % lowerChars.length];
  const digits = String(hash % 100).padStart(2, '0');
  return `${upper}${lower}${digits}@cosun`;
}

function getManagedInternalPasswordSeed(account: Partial<InternalAccount>) {
  return (
    String(account.username || '').trim()
    || String(account.loginEmail || '').trim().toLowerCase()
    || String(account.employeeId || '').trim()
    || String(account.authUserId || '').trim()
    || String(account.id || '').trim()
  );
}

function buildDefaultIdentityProfile() {
  const authMode = getAdminAuthMode();
  return {
    authMode,
    activationStatus: authMode === 'production' ? ('invited' as const) : ('active' as const),
    primaryIdentitySource: 'email' as const,
    emailVerified: false,
    phoneLogin: '',
    phoneVerified: false,
    wechatOpenId: '',
    enterpriseWechatUserId: '',
    whatsappAccount: '',
    invitedAt: '',
    inviteExpiresAt: '',
    lastInviteChannel: 'email' as const,
    activatedAt: '',
  };
}

function resolveInternalStaffSeed(email?: string | null): InternalStaffSeed | null {
  const normalizedEmail = canonicalizePersonnelEmail(email).trim().toLowerCase();
  if (!normalizedEmail) return null;
  return INTERNAL_STAFF_SEED_BY_EMAIL.get(normalizedEmail) || null;
}

const INTERNAL_ACCOUNT_ROLE_OVERRIDES: Record<string, { role: string; region?: string }> = {
  'marketing@cosun.com': { role: 'Marketing_Ops', region: 'all' },
  'luyi@cosun.com': { role: 'QC', region: 'all' },
  'track@cosunchina.com': { role: 'Order_Coordinator', region: 'all' },
  'track@cosun.com': { role: 'Order_Coordinator', region: 'all' },
};

export const MANUAL_ROLE_OVERRIDE_TAG = '[manual-role-override]';

export function hasManualRoleOverride(account: Pick<InternalAccount, 'notes'>) {
  return String(account.notes || '').includes(MANUAL_ROLE_OVERRIDE_TAG);
}

export function appendManualRoleOverrideTag(notes?: string) {
  const normalized = String(notes || '').trim();
  if (normalized.includes(MANUAL_ROLE_OVERRIDE_TAG)) return normalized;
  return normalized ? `${normalized}\n${MANUAL_ROLE_OVERRIDE_TAG}` : MANUAL_ROLE_OVERRIDE_TAG;
}

function getInternalAccountProfile(user: { id: string; email: string; username: string; userRole?: string; region?: string }) {
  const email = String(user.email || '').trim().toLowerCase();
  const seededProfile = resolveInternalStaffSeed(email);
  const cachedStaff = staffDirectoryService.getCachedSalesStaff();
  const matchedStaff = cachedStaff.find((row) => {
    const rowSeed = resolveInternalStaffSeed(row.email);
    return row.email === email || (seededProfile && rowSeed?.email === seededProfile.email);
  });
  const override = INTERNAL_ACCOUNT_ROLE_OVERRIDES[email];
  const role = matchedStaff?.rbacRole || override?.role || seededProfile?.role || user.userRole || '';
  const region = matchedStaff?.region || override?.region || seededProfile?.region || user.region || '';
  const roleProfile = getDepartmentAndTitleForRole(role, region);
  const fallbackRoleProfile = roleProfile.department || roleProfile.title
    ? roleProfile
    : { department: role || '', title: role || '' };

  return {
    name: matchedStaff?.name || seededProfile?.name || fallbackNameFromEmail(email, user.username),
    department: seededProfile?.department || fallbackRoleProfile.department,
    title: seededProfile?.title || fallbackRoleProfile.title,
    employeeNo: '',
    role,
    region,
    email: seededProfile?.email || email,
  };
}

function mergeMissingInternalContacts(current: InternalContact[], defaults: InternalContact[]): InternalContact[] {
  const byEmployeeNo = new Set(current.map((contact) => String(contact.employeeNo || '').trim()).filter(Boolean));
  const byEmail = new Set(current.map((contact) => String(contact.email || '').trim().toLowerCase()).filter(Boolean));
  const missing = defaults.filter((contact) => {
    const employeeNo = String(contact.employeeNo || '').trim();
    const email = String(contact.email || '').trim().toLowerCase();
    return !(employeeNo && byEmployeeNo.has(employeeNo)) && !(email && byEmail.has(email));
  });
  return dedupeBy([...current, ...missing], (contact) => contact.employeeNo || contact.email || contact.id);
}

function mergeMissingInternalAccounts(current: InternalAccount[], defaults: InternalAccount[]): InternalAccount[] {
  const byAuthUserId = new Set(current.map((account) => String(account.authUserId || '').trim()).filter(Boolean));
  const byEmail = new Set(current.map((account) => String(account.loginEmail || '').trim().toLowerCase()).filter(Boolean));
  const missing = defaults.filter((account) => {
    const authUserId = String(account.authUserId || '').trim();
    const email = String(account.loginEmail || '').trim().toLowerCase();
    return !(authUserId && byAuthUserId.has(authUserId)) && !(email && byEmail.has(email));
  });
  return dedupeBy([...current, ...missing], (account) => account.authUserId || account.loginEmail || account.id);
}

const REQUIRED_INTERNAL_STAFF_EMAILS = [
  'xingzheng@cosunchina.com',
];

function mergeRequiredInternalContacts(current: InternalContact[], defaults: InternalContact[]): InternalContact[] {
  const requiredDefaults = defaults.filter((contact) =>
    REQUIRED_INTERNAL_STAFF_EMAILS.includes(String(contact.email || '').trim().toLowerCase()),
  );
  return mergeMissingInternalContacts(current, requiredDefaults);
}

function mergeRequiredInternalAccounts(current: InternalAccount[], defaults: InternalAccount[]): InternalAccount[] {
  const requiredDefaults = defaults.filter((account) =>
    REQUIRED_INTERNAL_STAFF_EMAILS.includes(String(account.loginEmail || '').trim().toLowerCase()),
  );
  return mergeMissingInternalAccounts(current, requiredDefaults);
}

function isBlankInternalContactList(contacts: InternalContact[] | undefined): boolean {
  if (!Array.isArray(contacts) || contacts.length === 0) return true;
  return contacts.every((contact) => ![
    contact.name,
    contact.email,
    contact.phone,
    contact.department,
    contact.title,
  ].some((value) => String(value || '').trim()));
}

function buildDefaultInternalContacts(): InternalContact[] {
  const contacts = INTERNAL_STAFF_SEEDS.map((seed) => {
    const profile = getInternalAccountProfile({
      id: seed.id,
      email: seed.email,
      username: seed.username,
      userRole: seed.role,
      region: seed.region,
    });
    return {
      id: `contact-${seed.id}`,
      employeeNo: '',
      name: profile.name,
      department: profile.department,
      title: profile.title,
      region: profile.region || '',
      managerId: '',
      extension: '',
      phone: '',
      email: profile.email,
      wechat: '',
      status: '在职',
      visibleInDocuments: true,
    } satisfies InternalContact;
  });
  const deduped = dedupeBy(contacts, (contact) => contact.email || contact.id);
  return deduped.map((contact, index) => ({
    ...contact,
    employeeNo: formatEmployeeNo(index + 1),
  }));
}

function buildDefaultInternalAccounts(contacts: InternalContact[]): InternalAccount[] {
  const employeeIdByEmail = new Map(
    contacts.map((contact) => [contact.email.toLowerCase(), contact.id] as const),
  );

  return INTERNAL_STAFF_SEEDS.map((seed) => {
    const profile = getInternalAccountProfile({
      id: seed.id,
      email: seed.email,
      username: seed.username,
      userRole: seed.role,
      region: seed.region,
    });
    return {
      id: `account-${seed.id}`,
      employeeId: employeeIdByEmail.get(profile.email.toLowerCase()) || '',
      authUserId: seed.id,
      username: seed.username,
      loginEmail: profile.email,
      loginPassword: generateManagedInternalPassword(seed.username || seed.id || seed.email),
      role: profile.role || seed.role,
      region: profile.region || seed.region || 'all',
      department: profile.department || seed.department,
      accountStatus: 'active',
      canLogin: true,
      forcePasswordReset: false,
      lastLoginAt: '',
      notes: '',
      ...buildDefaultIdentityProfile(),
    } satisfies InternalAccount;
  });
}

function normalizeInternalContactRecords(contacts: InternalContact[]): InternalContact[] {
  const normalized = contacts
    .map((contact) => ({
      ...contact,
      name: String(contact.name || '').trim(),
      email: canonicalizePersonnelEmail(contact.email) || String(contact.email || '').trim(),
      department: String(contact.department || '').trim(),
      title: String(contact.title || '').trim(),
      region: String(contact.region || '').trim(),
    }))
    .filter((contact, index, array) =>
      array.findIndex((candidate) => String(candidate.email || '').trim().toLowerCase() === String(contact.email || '').trim().toLowerCase()) === index,
    );

  return normalized.map((contact, index) => ({
    ...contact,
    employeeNo: String(contact.employeeNo || '').trim() || formatEmployeeNo(index + 1),
  }));
}

function normalizeInternalAccountRecords(accounts: InternalAccount[]): InternalAccount[] {
  return accounts
    .map((account) => ({
      ...account,
      authUserId: String(account.authUserId || '').trim(),
      username: String(account.username || '').trim(),
      loginEmail: canonicalizePersonnelEmail(account.loginEmail, account.region) || String(account.loginEmail || '').trim(),
      role: String(account.role || '').trim(),
      region: String(account.region || '').trim(),
      department: String(account.department || '').trim(),
      authMode: account.authMode === 'production' || account.authMode === 'dual' ? account.authMode : 'test',
      activationStatus: ['draft', 'invited', 'email_verified', 'phone_verified', 'active', 'disabled'].includes(String(account.activationStatus || ''))
        ? account.activationStatus
        : 'active',
      primaryIdentitySource: ['email', 'phone', 'wechat', 'enterprise_wechat', 'whatsapp'].includes(String(account.primaryIdentitySource || ''))
        ? account.primaryIdentitySource
        : 'email',
      phoneLogin: String(account.phoneLogin || '').trim(),
      phoneVerified: Boolean(account.phoneVerified),
      emailVerified: Boolean(account.emailVerified),
      wechatOpenId: String(account.wechatOpenId || '').trim(),
      enterpriseWechatUserId: String(account.enterpriseWechatUserId || '').trim(),
      whatsappAccount: String(account.whatsappAccount || '').trim(),
      invitedAt: String(account.invitedAt || '').trim(),
      inviteExpiresAt: String(account.inviteExpiresAt || '').trim(),
      lastInviteChannel: ['email', 'phone', 'wechat', 'enterprise_wechat', 'whatsapp'].includes(String(account.lastInviteChannel || ''))
        ? account.lastInviteChannel
        : 'email',
      activatedAt: String(account.activatedAt || '').trim(),
    }))
    .filter((account, index, array) =>
      array.findIndex((candidate) => String(candidate.loginEmail || '').trim().toLowerCase() === String(account.loginEmail || '').trim().toLowerCase()) === index,
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_ORG: AdminOrgProfile = {
  id:            'admin-org-001',
  nameCN:        ORG_MASTER_SEED.nameCN,
  nameEN:        ORG_MASTER_SEED.nameEN,
  descriptionCN: ORG_MASTER_SEED.descriptionCN,
  descriptionEN: ORG_MASTER_SEED.descriptionEN,
  phone:         ORG_MASTER_SEED.phone,
  email:         ORG_MASTER_SEED.email,
  contactPerson: ORG_MASTER_SEED.contactPerson,
  website:       ORG_MASTER_SEED.website,
  addressCN:     ORG_MASTER_SEED.addressCN,
  addressEN:     ORG_MASTER_SEED.addressEN,
  taxId:         ORG_MASTER_SEED.taxId,
  defaultCurrencyCN: ORG_MASTER_SEED.defaultCurrencyCN,
  defaultCurrencyEN: ORG_MASTER_SEED.defaultCurrencyEN,
  defaultCurrency: ORG_MASTER_SEED.defaultCurrency,
  timezone:      ORG_MASTER_SEED.timezone,
  logoUrl:       null,
  bankRMB: {
    ...ORG_MASTER_SEED.bankRMB,
  },
  bankUSD: {
    ...ORG_MASTER_SEED.bankUSD,
  },
  bankPrivate: {
    ...ORG_MASTER_SEED.bankPrivate,
  },
  internalContacts: buildDefaultInternalContacts(),
  internalAccounts: [],
  documentDefaults: {
    ...ORG_MASTER_SEED.documentDefaults,
  },
};

DEFAULT_ORG.internalAccounts = buildDefaultInternalAccounts(DEFAULT_ORG.internalContacts);

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

function loadFromStorageOptional<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function isBlank(value: unknown): boolean {
  return String(value ?? '').trim() === '';
}

function healAdminOrg(base: AdminOrgProfile): { next: AdminOrgProfile; changed: boolean } {
  let changed = false;

  const next: AdminOrgProfile = {
    ...base,
    bankRMB: { ...base.bankRMB },
    bankUSD: { ...base.bankUSD },
    bankPrivate: { ...base.bankPrivate },
    documentDefaults: { ...base.documentDefaults },
  };

  const fillTopLevel = <K extends keyof AdminOrgProfile>(key: K, value: AdminOrgProfile[K]) => {
    if (typeof value === 'string' && isBlank(next[key])) {
      (next as AdminOrgProfile)[key] = value;
      changed = true;
    }
  };

  fillTopLevel('nameCN', ORG_MASTER_SEED.nameCN);
  fillTopLevel('nameEN', ORG_MASTER_SEED.nameEN);
  fillTopLevel('phone', ORG_MASTER_SEED.phone);
  fillTopLevel('email', ORG_MASTER_SEED.email);
  fillTopLevel('contactPerson', ORG_MASTER_SEED.contactPerson);
  fillTopLevel('website', ORG_MASTER_SEED.website);
  fillTopLevel('addressCN', ORG_MASTER_SEED.addressCN);
  fillTopLevel('addressEN', ORG_MASTER_SEED.addressEN);
  fillTopLevel('taxId', ORG_MASTER_SEED.taxId);
  fillTopLevel('defaultCurrencyCN', next.defaultCurrency || ORG_MASTER_SEED.defaultCurrencyCN);
  fillTopLevel('defaultCurrencyEN', ORG_MASTER_SEED.defaultCurrencyEN);
  fillTopLevel('defaultCurrency', ORG_MASTER_SEED.defaultCurrency);
  fillTopLevel('timezone', ORG_MASTER_SEED.timezone);

  (Object.keys(ORG_MASTER_SEED.bankRMB) as Array<keyof typeof ORG_MASTER_SEED.bankRMB>).forEach((key) => {
    if (isBlank(next.bankRMB[key])) {
      next.bankRMB[key] = ORG_MASTER_SEED.bankRMB[key];
      changed = true;
    }
  });

  (Object.keys(ORG_MASTER_SEED.bankUSD) as Array<keyof typeof ORG_MASTER_SEED.bankUSD>).forEach((key) => {
    if (isBlank(next.bankUSD[key])) {
      next.bankUSD[key] = ORG_MASTER_SEED.bankUSD[key];
      changed = true;
    }
  });

  (Object.keys(ORG_MASTER_SEED.documentDefaults) as Array<keyof typeof ORG_MASTER_SEED.documentDefaults>).forEach((key) => {
    if (isBlank(next.documentDefaults[key])) {
      next.documentDefaults[key] = ORG_MASTER_SEED.documentDefaults[key];
      changed = true;
    }
  });

  if (Array.isArray(next.internalContacts)) {
    const primaryAccountByEmployeeId = new Map(
      (Array.isArray(next.internalAccounts) ? next.internalAccounts : []).map((account) => [account.employeeId, account] as const),
    );

    next.internalContacts = normalizeInternalContactRecords(next.internalContacts).map((contact) => {
      const email = String(contact.email || '').trim().toLowerCase();
      const override = INTERNAL_ACCOUNT_ROLE_OVERRIDES[email];
      const linkedAccount = primaryAccountByEmployeeId.get(contact.id);
      const derivedRegion = override?.region
        || inferRegionCode(contact.region || linkedAccount?.region, contact.department || '');

      if (override) {
        const profile = getDepartmentAndTitleForRole(override.role, override.region);
        const desiredDepartment = profile.department;
        const desiredTitle = profile.title;

        if (
          contact.department === desiredDepartment
          && contact.title === desiredTitle
          && String(contact.region || '').trim() === derivedRegion
        ) {
          return contact;
        }

        changed = true;
        return {
          ...contact,
          department: desiredDepartment,
          title: desiredTitle,
          region: derivedRegion,
        };
      }

      if (String(contact.region || '').trim() === derivedRegion) return contact;

      changed = true;
      return {
        ...contact,
        region: derivedRegion,
      };
    });
  }

  if (Array.isArray(next.internalAccounts)) {
    const contactById = new Map(
      (Array.isArray(next.internalContacts) ? next.internalContacts : []).map((contact) => [contact.id, contact] as const),
    );

    next.internalAccounts = normalizeInternalAccountRecords(next.internalAccounts).map((account) => {
      const email = String(account.loginEmail || '').trim().toLowerCase();
      const override = INTERNAL_ACCOUNT_ROLE_OVERRIDES[email];
      if (override) {
        const desiredRole = override.role;
        const desiredRegion = override.region || String(account.region || '').trim() || 'all';

        if (account.role === desiredRole && account.region === desiredRegion) {
          return account;
        }

        changed = true;
        return {
          ...account,
          role: desiredRole,
          region: desiredRegion,
        };
      }

      const linkedContact = contactById.get(account.employeeId);
      if (!linkedContact || hasManualRoleOverride(account)) return account;

      const inferredDefaults = deriveAccountRoleDefaults({
        rawRole: account.role,
        title: linkedContact.title,
        department: linkedContact.department,
        region: account.region,
      });
      const desiredRole = inferredDefaults.role;
      const desiredRegion = inferredDefaults.region;
      const desiredDepartment = String(linkedContact.department || '').trim();

      if (
        (!desiredRole || account.role === desiredRole)
        && (!desiredRegion || account.region === desiredRegion)
        && (!desiredDepartment || account.department === desiredDepartment)
      ) {
        return account;
      }

      changed = true;
      return {
        ...account,
        role: desiredRole || account.role,
        region: desiredRegion || account.region,
        department: desiredDepartment || account.department,
      };
    });
  }

  return { next, changed };
}

/** Load AdminOrgProfile, merging the separately-stored logo back in. */
function loadAdminOrg(): AdminOrgProfile {
  const primary = loadFromStorageOptional<AdminOrgProfile>(ORG_KEY);
  const backup = loadFromStorageOptional<AdminOrgProfile>(ORG_BAK_KEY);
  const base = deepMerge(DEFAULT_ORG, primary ?? backup ?? DEFAULT_ORG);
  const logo = loadRaw(ORG_LOGO_KEY);
  let passwordChanged = false;
  const defaultContacts = buildDefaultInternalContacts();
  const defaultAccounts = buildDefaultInternalAccounts(defaultContacts);
  const baseContacts = normalizeAdminRosterContacts(base.internalContacts) as InternalContact[];
  const baseAccounts = normalizeAdminRosterAccounts(base.internalAccounts) as InternalAccount[];
  const shouldRestoreCuratedRoster = hasSharedLegacyAdminRosterArtifacts(
    baseContacts,
    baseAccounts,
    INTERNAL_STAFF_SEEDS.map((seed) => canonicalizePersonnelEmail(seed.email, seed.region || 'all')),
  );
  const internalContacts =
    Array.isArray(baseContacts) &&
    baseContacts.length > 0 &&
    !isBlankInternalContactList(baseContacts) &&
    !shouldRestoreCuratedRoster
      ? mergeRequiredInternalContacts(baseContacts, defaultContacts)
      : defaultContacts;
  const internalAccounts =
    Array.isArray(baseAccounts) &&
    baseAccounts.length > 0 &&
    !shouldRestoreCuratedRoster
      ? mergeRequiredInternalAccounts(baseAccounts, buildDefaultInternalAccounts(internalContacts))
      : buildDefaultInternalAccounts(internalContacts);
  const normalizedInternalAccounts = internalAccounts.map((account) => {
    const normalizedPassword = String(account.loginPassword || '').trim();
    const passwordSeed = getManagedInternalPasswordSeed(account);
    const shouldNormalizeManagedTestPassword =
      isManagedSeededInternalAccount(account) &&
      String(account.authMode || 'test').trim().toLowerCase() === 'test' &&
      normalizedPassword !== generateManagedInternalPassword(passwordSeed);

    if (normalizedPassword && !shouldNormalizeManagedTestPassword) return account;
    passwordChanged = true;
    return {
      ...account,
      loginPassword: generateManagedInternalPassword(passwordSeed),
    };
  });
  // Logo key wins over any logoUrl that might be embedded in the JSON blob
  const hydrated = {
    ...base,
    internalContacts,
    internalAccounts: normalizedInternalAccounts.length > 0 ? normalizedInternalAccounts : defaultAccounts,
    logoUrl: logo ?? base.logoUrl,
  };
  const { next, changed } = healAdminOrg(hydrated);
  if (changed || passwordChanged) {
    persistAdminOrgSnapshot(next);
  }
  return next;
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

function pickPreferredAdminArray<T extends { id?: string }>(localList: T[] | undefined, remoteList: T[] | undefined): T[] {
  const local = Array.isArray(localList) ? localList : [];
  const remote = Array.isArray(remoteList) ? remoteList : [];

  if (remote.length === 0) return local;
  if (local.length === 0) return remote;

  const remoteById = new Map(
    remote
      .map((item) => [String(item?.id || '').trim(), item] as const)
      .filter(([id]) => Boolean(id)),
  );
  const remoteIds = new Set(remote.map((item) => String(item?.id || '').trim()).filter(Boolean));
  const hasAllLocalItems = local.every((item) => {
    const id = String(item?.id || '').trim();
    return !id || remoteIds.has(id);
  });

  if (hasAllLocalItems) {
    const merged = local.map((item) => {
      const id = String(item?.id || '').trim();
      if (!id || !remoteById.has(id)) return item;
      return {
        ...remoteById.get(id)!,
        ...item,
      };
    });

    const localIds = new Set(local.map((item) => String(item?.id || '').trim()).filter(Boolean));
    const remoteOnly = remote.filter((item) => {
      const id = String(item?.id || '').trim();
      return id && !localIds.has(id);
    });

    return [...merged, ...remoteOnly];
  }

  return local;
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

function persistAdminOrgSnapshot(value: AdminOrgProfile): boolean {
  const { logoUrl: _logo, ...withoutLogo } = value;
  const primarySaved = persist(ORG_KEY, withoutLogo);
  const backupSaved = persist(ORG_BAK_KEY, withoutLogo);
  return primarySaved && backupSaved;
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

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

function isRecoverableAdminOrgRemoteSaveError(error: unknown) {
  const message = String((error as Error)?.message || error || '').toLowerCase();
  const isValidationError =
    message.includes('admin roster validation failed') ||
    message.includes('legacy internal roster artifacts detected') ||
    message.includes('duplicate internal contact email') ||
    message.includes('duplicate internal account email') ||
    message.includes('invalid internal account role') ||
    message.includes('is not linked to any internal contact');
  if (isValidationError) return false;

  return (
    message.includes('timed out after') ||
    message.includes('not authenticated') ||
    message.includes('jwt') ||
    message.includes('permission denied') ||
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('load failed') ||
    message.includes('fetch failed')
  );
}

function enqueueAdminOrgRemoteSave(next: AdminOrgProfile, context: string) {
  void adminOrganizationService.save(next).catch((error) => {
    console.warn(`[AdminOrg] deferred remote save failed after ${context}:`, error);
  });
}

function preserveProtectedAccountFields(
  currentAccounts: InternalAccount[] | undefined,
  nextAccounts: InternalAccount[] | undefined,
  options?: UpdateAdminOrgOptions,
): InternalAccount[] {
  const current = Array.isArray(currentAccounts) ? currentAccounts : [];
  const next = Array.isArray(nextAccounts) ? nextAccounts : [];
  const allowPasswordWriteIds = new Set(
    (options?.allowPasswordWriteAccountIds || []).map((value) => String(value || '').trim()).filter(Boolean),
  );
  const currentById = new Map(
    current.map((account) => [String(account.id || '').trim(), account] as const).filter(([id]) => Boolean(id)),
  );

  return next.map((account) => {
    const accountId = String(account.id || '').trim();
    const currentAccount = currentById.get(accountId);
    if (!currentAccount) return account;
    if (allowPasswordWriteIds.has(accountId)) return account;

    return {
      ...account,
      loginPassword: currentAccount.loginPassword,
    };
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
  const hasHydratedFromSupabase = useRef(false);

  useEffect(() => {
    let cancelled = false

    void (async () => {
      if (typeof window !== 'undefined' && localStorage.getItem(LOCAL_ADMIN_AUTH_STORAGE_KEY) === 'true') {
        hasHydratedFromSupabase.current = true
        return
      }
      try {
        const remote = await adminOrganizationService.get()
        if (cancelled) return

        if (remote) {
          const localSnapshot = loadAdminOrg()
          const remoteContacts = normalizeAdminRosterContacts(remote.internalContacts) as InternalContact[]
          const remoteAccounts = normalizeAdminRosterAccounts(remote.internalAccounts) as InternalAccount[]
          const remoteHasLegacyArtifacts = hasSharedLegacyAdminRosterArtifacts(
            remoteContacts,
            remoteAccounts,
            INTERNAL_STAFF_SEEDS.map((seed) => canonicalizePersonnelEmail(seed.email, seed.region || 'all')),
          )
          const sanitizedRemote = {
            ...remote,
            internalContacts: remoteHasLegacyArtifacts
              ? buildDefaultInternalContacts()
              : mergeRequiredInternalContacts(
                  remoteContacts,
                  buildDefaultInternalContacts(),
                ),
            internalAccounts: remoteHasLegacyArtifacts
              ? buildDefaultInternalAccounts(buildDefaultInternalContacts())
              : mergeRequiredInternalAccounts(
                  remoteAccounts,
                  buildDefaultInternalAccounts(
                    remoteContacts.length > 0
                      ? mergeRequiredInternalContacts(remoteContacts, buildDefaultInternalContacts())
                      : buildDefaultInternalContacts(),
                  ),
                ),
          }
          const mergedContacts = pickPreferredAdminArray(
            normalizeAdminRosterContacts(localSnapshot.internalContacts) as InternalContact[],
            sanitizedRemote.internalContacts,
          )
          const mergedAccounts = pickPreferredAdminArray(
            normalizeAdminRosterAccounts(localSnapshot.internalAccounts) as InternalAccount[],
            sanitizedRemote.internalAccounts,
          )
          const candidate = {
            ...deepMerge(localSnapshot, sanitizedRemote as Partial<AdminOrgProfile>),
            internalContacts: mergedContacts,
            internalAccounts: mergedAccounts,
            logoUrl: sanitizedRemote.logoUrl ?? localSnapshot.logoUrl,
          }
          const { next } = healAdminOrg(candidate)
          persistAdminOrgSnapshot(next)
          persistImage(ORG_LOGO_KEY, next.logoUrl)
          adminOrganizationSnapshotService.save('auto_heal', next)
          setAdminOrg(next)
          if (
            JSON.stringify(sanitizedRemote.internalContacts || []) !== JSON.stringify(next.internalContacts || []) ||
            JSON.stringify(sanitizedRemote.internalAccounts || []) !== JSON.stringify(next.internalAccounts || [])
          ) {
            void adminOrganizationService.save(next).catch((saveError) => {
              console.warn('[AdminOrg] failed to persist healed roster to Supabase:', saveError)
            })
          }
        } else {
          await adminOrganizationService.save(adminOrg)
          adminOrganizationSnapshotService.save('bootstrap', adminOrg)
        }

        hasHydratedFromSupabase.current = true
      } catch (error) {
        console.warn('[AdminOrg] Supabase hydrate fallback to local cache:', error)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  // ── Org ──────────────────────────────────────────────────────────────────
  const updateAdminOrg = useCallback(
    async (patch: Partial<Omit<AdminOrgProfile, 'id'>>, options?: UpdateAdminOrgOptions) => {
      const current = hasHydratedFromSupabase.current ? adminOrg : loadAdminOrg()
      const protectedPatch = patch.internalAccounts
        ? {
            ...patch,
            internalAccounts: preserveProtectedAccountFields(
              current.internalAccounts,
              patch.internalAccounts as InternalAccount[],
              options,
            ),
          }
        : patch
      const next = deepMerge(current, protectedPatch as Partial<AdminOrgProfile>)
      // Persist local cache first so refreshes never lose the draft, then sync cloud.
      const localSaved = persistAdminOrgSnapshot(next)
      adminOrganizationSnapshotService.save('manual_save', next)
      if ('logoUrl' in patch) {
        persistImage(ORG_LOGO_KEY, patch.logoUrl ?? null)
      } else if (next.logoUrl !== current.logoUrl) {
        persistImage(ORG_LOGO_KEY, next.logoUrl ?? null)
      }

      let remoteSaved = false
      const isLocalAdminAuth = typeof window !== 'undefined' && localStorage.getItem(LOCAL_ADMIN_AUTH_STORAGE_KEY) === 'true'
      setAdminOrg(next)
      hasHydratedFromSupabase.current = true
      try {
        await withTimeout(
          adminOrganizationService.save(next),
          ADMIN_ORG_REMOTE_SAVE_TIMEOUT_MS,
          'admin organization save'
        )
        remoteSaved = true
      } catch (error) {
        if (!isRecoverableAdminOrgRemoteSaveError(error)) {
          setAdminOrg(current)
          hasHydratedFromSupabase.current = true
          throw error
        }
        console.warn('[AdminOrg] remote save skipped, local snapshot kept:', error)
        enqueueAdminOrgRemoteSave(next, 'recoverable save error')
      }
      return { localSaved, remoteSaved }
    },
    [adminOrg]
  );

  const restoreLatestAdminOrgSnapshot = useCallback(async () => {
    const latestSnapshot = adminOrganizationSnapshotService.latest();
    if (!latestSnapshot?.payload) return null;

    const restored = deepMerge(DEFAULT_ORG, latestSnapshot.payload as Partial<AdminOrgProfile>);
    const { next } = healAdminOrg(restored);
    const localSaved = persistAdminOrgSnapshot(next);
    persistImage(ORG_LOGO_KEY, next.logoUrl ?? null);
    setAdminOrg(next);
    hasHydratedFromSupabase.current = true;

    let remoteSaved = false;
    try {
      await withTimeout(
        adminOrganizationService.save(next),
        ADMIN_ORG_REMOTE_SAVE_TIMEOUT_MS,
        'admin organization snapshot restore'
      );
      remoteSaved = true;
    } catch (error) {
      const message = String((error as Error)?.message || error || '');
      if (!message.includes('timed out after')) {
        throw error;
      }
      console.warn('[AdminOrg] snapshot restore remote save timed out, local snapshot kept:', error);
      enqueueAdminOrgRemoteSave(next, 'snapshot restore recoverable save error');
    }

    adminOrganizationSnapshotService.save('manual_save', next);

    return {
      localSaved,
      remoteSaved,
      restoredAt: latestSnapshot.createdAt,
      source: latestSnapshot.source,
      summary: latestSnapshot.summary,
    };
  }, []);

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
        restoreLatestAdminOrgSnapshot,
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

export function getStoredAdminOrgProfile(): AdminOrgProfile {
  return loadAdminOrg();
}

export function getStoredAdminUserProfile(): AdminUserProfile {
  return loadAdminUser();
}

export async function recordStoredAdminAccountLastLogin(loginEmail: string, attemptedAt = new Date().toISOString()): Promise<void> {
  const normalizedEmail = String(loginEmail || '').trim().toLowerCase();
  if (!normalizedEmail) return;

  const current = loadAdminOrg();
  let changed = false;
  const nextAccounts = current.internalAccounts.map((account) => {
    if (String(account.loginEmail || '').trim().toLowerCase() !== normalizedEmail) {
      return account;
    }
    if (account.lastLoginAt === attemptedAt) return account;
    changed = true;
    return {
      ...account,
      lastLoginAt: attemptedAt,
    };
  });

  if (!changed) return;

  const next = {
    ...current,
    internalAccounts: nextAccounts,
  };

  persistAdminOrgSnapshot(next);

  try {
    await adminOrganizationService.save(next);
  } catch (error) {
    console.warn('[AdminOrg] recordStoredAdminAccountLastLogin remote save fallback to local snapshot:', error);
  }
}
