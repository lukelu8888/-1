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
    email: 'admin@cosun.com',
    role: 'Admin',
    region: 'all',
    department: 'IT部',
  },
  {
    id: 'ceo',
    username: 'ceo',
    name: '张明',
    email: 'ceo@cosun.com',
    role: 'CEO',
    region: 'all',
    department: '管理层',
    title: 'CEO',
  },
  {
    id: 'hr',
    username: 'hr',
    name: '卢招',
    email: 'hr@cosun.com',
    role: 'HR_Admin',
    region: 'all',
    department: '人力资源',
    title: '招聘经理',
  },
  {
    id: 'cfo',
    username: 'cfo',
    name: '李华',
    email: 'cfo@cosun.com',
    role: 'CFO',
    region: 'all',
    department: '财务部',
    title: 'CFO',
  },
  {
    id: 'external-accountant',
    username: 'finance_agent',
    name: '杨立',
    email: 'finance_agent@cosun.com',
    role: 'External_Accountant',
    region: 'all',
    department: '财务部',
    title: '财务专员',
  },
  {
    id: 'sales-director',
    username: 'sales.director',
    name: '王强',
    email: 'sales.director@cosun.com',
    role: 'Sales_Director',
    region: 'all',
    department: '销售部',
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
    id: 'sales-rep-sa',
    username: 'lifang',
    name: '李芳',
    email: 'lifang@cosun.com',
    role: 'Sales_Rep',
    region: 'SA',
    department: '销售部-南美',
    legacyEmails: ['ana.santos@cosun.com'],
  },
  {
    id: 'sales-rep-ea',
    username: 'wangfang',
    name: '王芳',
    email: 'wangfang@cosun.com',
    role: 'Sales_Rep',
    region: 'EA',
    department: '销售部-欧非',
    legacyEmails: ['emma.thompson@cosun.com'],
  },
  {
    id: 'finance',
    username: 'finance',
    name: '赵敏',
    email: 'finance@cosun.com',
    role: 'Finance',
    region: 'all',
    department: '财务部',
  },
  {
    id: 'procurement',
    username: 'procurement',
    name: '刘刚',
    email: 'procurement@cosun.com',
    role: 'Procurement',
    region: 'all',
    department: '采购部',
  },
  {
    id: 'marketing',
    username: 'marketing',
    name: '李娜',
    email: 'marketing@cosun.com',
    role: 'Marketing_Ops',
    region: 'all',
    department: '市场部',
  },
  {
    id: 'qc',
    username: 'luyi',
    name: 'Luyi',
    email: 'luyi@cosun.com',
    role: 'QC',
    region: 'all',
    department: '品控部',
  },
  {
    id: 'admin-ops',
    username: 'xingzheng',
    name: 'Xingzheng',
    email: 'xingzheng@cosunchina.com',
    role: 'Admin_Ops',
    region: 'all',
    department: '行政部',
  },
  {
    id: 'documentation-officer',
    username: 'zhanghui',
    name: '张晖',
    email: 'zhanghui@cosun.com',
    role: 'Documentation_Officer',
    region: 'all',
    department: '单证管理部',
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

// ─────────────────────────────────────────────────────────────────────────────
// Context type
// ─────────────────────────────────────────────────────────────────────────────
interface AdminOrganizationContextType {
  adminOrg: AdminOrgProfile;
  adminUserProfile: AdminUserProfile;
  updateAdminOrg: (patch: Partial<Omit<AdminOrgProfile, 'id'>>) => Promise<AdminOrgSaveResult>;
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
const ADMIN_ORG_REMOTE_SAVE_TIMEOUT_MS = 8000;

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

function generateManagedInternalPassword(seed = ''): string {
  const source = `${seed}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
  }

  const upperChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowerChars = 'abcdefghijkmnpqrstuvwxyz';
  const upper = upperChars[hash % upperChars.length];
  const lower = lowerChars[Math.floor(hash / upperChars.length) % lowerChars.length];
  const digits = String(hash % 100).padStart(2, '0');
  return `${upper}${lower}${digits}@cosun`;
}

function isManagedInternalPassword(value: string): boolean {
  return /^[A-Z][a-z]\d{2}@cosun$/.test(String(value || '').trim());
}

function resolveInternalStaffSeed(email?: string | null): InternalStaffSeed | null {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) return null;
  return INTERNAL_STAFF_SEED_BY_EMAIL.get(normalizedEmail) || null;
}

const INTERNAL_ACCOUNT_ROLE_OVERRIDES: Record<string, { role: string; region?: string }> = {
  'marketing@cosun.com': { role: 'Marketing_Ops', region: 'all' },
  'luyi@cosun.com': { role: 'QC', region: 'all' },
};

function normalizeRoleDepartment(role?: string, region?: string): { department: string; title: string } {
  const normalizedRegion = String(region || '').trim().toUpperCase();
  const regionLabel =
    normalizedRegion === 'NA' ? '北美' :
    normalizedRegion === 'SA' ? '南美' :
    normalizedRegion === 'EA' ? '欧非' :
    '';

  switch (role) {
    case 'CEO':
      return { department: '管理层', title: 'CEO' };
    case 'Admin':
      return { department: 'IT部', title: '系统管理员' };
    case 'CFO':
      return { department: '财务部', title: 'CFO' };
    case 'Finance':
      return { department: '财务部', title: '财务专员' };
    case 'Sales_Director':
      return { department: '销售部', title: '销售总监' };
    case 'Regional_Manager':
      return { department: regionLabel ? `销售部-${regionLabel}` : '销售部', title: '区域主管' };
    case 'Sales_Manager':
      return { department: regionLabel ? `销售部-${regionLabel}` : '销售部', title: '销售经理' };
    case 'Sales_Rep':
      return { department: regionLabel ? `销售部-${regionLabel}` : '销售部', title: '业务员' };
    case 'Procurement':
      return { department: '采购部', title: '采购经理' };
    case 'Marketing_Ops':
      return { department: '市场部', title: '运营专员' };
    case 'Admin_Ops':
      return { department: '行政部', title: '行政专员' };
    case 'HR_Admin':
      return { department: '人力资源', title: '人事主管' };
    case 'External_Accountant':
      return { department: '财务部', title: '代理记账财务' };
    case 'Procurement_Manager':
      return { department: '采购部', title: '采购主管' };
    case 'Documentation_Officer':
      return { department: '单证管理部', title: '单证员' };
    case 'QC':
      return { department: '品控部', title: '验货员' };
    default:
      return { department: role || '', title: role || '' };
  }
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
  const roleProfile = normalizeRoleDepartment(role, region);

  return {
    name: matchedStaff?.name || seededProfile?.name || fallbackNameFromEmail(email, user.username),
    department: seededProfile?.department || roleProfile.department,
    title: seededProfile?.title || roleProfile.title,
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
      loginPassword: generateManagedInternalPassword(seed.id || seed.email),
      role: profile.role || seed.role,
      region: profile.region || seed.region || 'all',
      department: profile.department || seed.department,
      accountStatus: 'active',
      canLogin: true,
      forcePasswordReset: false,
      lastLoginAt: '',
      notes: '',
    } satisfies InternalAccount;
  });
}

function normalizeInternalContactRecords(contacts: InternalContact[]): InternalContact[] {
  const normalized = contacts
    .map((contact) => {
      const seed = resolveInternalStaffSeed(contact.email);
      if (!seed) return contact;
      const roleProfile = normalizeRoleDepartment(seed.role, seed.region);
      return {
        ...contact,
        name: seed.name,
        email: seed.email,
        department: seed.department,
        title: seed.title || roleProfile.title,
      };
    })
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
    .map((account) => {
      const seed = resolveInternalStaffSeed(account.loginEmail);
      if (!seed) return account;
      return {
        ...account,
        authUserId: account.authUserId || seed.id,
        username: seed.username,
        loginEmail: seed.email,
        role: seed.role,
        region: seed.region,
        department: seed.department,
      };
    })
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
    next.internalContacts = normalizeInternalContactRecords(next.internalContacts).map((contact) => {
      const email = String(contact.email || '').trim().toLowerCase();
      const override = INTERNAL_ACCOUNT_ROLE_OVERRIDES[email];
      if (!override) return contact;

      const profile = normalizeRoleDepartment(override.role, override.region);
      const desiredDepartment = profile.department || contact.department;
      const desiredTitle = profile.title || contact.title;

      if (contact.department === desiredDepartment && contact.title === desiredTitle) {
        return contact;
      }

      changed = true;
      return {
        ...contact,
        department: desiredDepartment,
        title: desiredTitle,
      };
    });
  }

  if (Array.isArray(next.internalAccounts)) {
    next.internalAccounts = normalizeInternalAccountRecords(next.internalAccounts).map((account) => {
      const email = String(account.loginEmail || '').trim().toLowerCase();
      const override = INTERNAL_ACCOUNT_ROLE_OVERRIDES[email];
      if (!override) return account;

      const desiredRole = override.role;
      const desiredRegion = override.region || account.region || 'all';

      if (account.role === desiredRole && account.region === desiredRegion) {
        return account;
      }

      changed = true;
      return {
        ...account,
        role: desiredRole,
        region: desiredRegion,
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
  const internalContacts =
    Array.isArray(base.internalContacts) &&
    base.internalContacts.length > 0 &&
    !isBlankInternalContactList(base.internalContacts)
      ? mergeMissingInternalContacts(base.internalContacts, defaultContacts)
      : defaultContacts;
  const internalAccounts =
    Array.isArray(base.internalAccounts) && base.internalAccounts.length > 0
      ? mergeMissingInternalAccounts(base.internalAccounts, buildDefaultInternalAccounts(internalContacts))
      : buildDefaultInternalAccounts(internalContacts);
  const normalizedInternalAccounts = internalAccounts.map((account) => {
    if (isManagedInternalPassword(account.loginPassword)) return account;
    passwordChanged = true;
    return {
      ...account,
      loginPassword: generateManagedInternalPassword(account.employeeId || account.authUserId || account.id),
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

  const remoteIds = new Set(remote.map((item) => String(item?.id || '').trim()).filter(Boolean));
  const hasAllLocalItems = local.every((item) => {
    const id = String(item?.id || '').trim();
    return !id || remoteIds.has(id);
  });

  if (hasAllLocalItems && remote.length >= local.length) {
    return remote;
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
      try {
        const remote = await adminOrganizationService.get()
        if (cancelled) return

        if (remote) {
          const localSnapshot = loadAdminOrg()
          const candidate = {
            ...deepMerge(localSnapshot, remote as Partial<AdminOrgProfile>),
            internalContacts: pickPreferredAdminArray(localSnapshot.internalContacts, remote.internalContacts),
            internalAccounts: pickPreferredAdminArray(localSnapshot.internalAccounts, remote.internalAccounts),
            logoUrl: remote.logoUrl ?? localSnapshot.logoUrl,
          }
          const { next } = healAdminOrg(candidate)
          persistAdminOrgSnapshot(next)
          persistImage(ORG_LOGO_KEY, next.logoUrl)
          setAdminOrg(next)
        } else {
          await adminOrganizationService.save(adminOrg)
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
    async (patch: Partial<Omit<AdminOrgProfile, 'id'>>) => {
      const current = hasHydratedFromSupabase.current ? adminOrg : loadAdminOrg()
      const next = deepMerge(current, patch as Partial<AdminOrgProfile>)
      // Persist local cache first so refreshes never lose the draft, then sync cloud.
      const localSaved = persistAdminOrgSnapshot(next)
      if ('logoUrl' in patch) {
        persistImage(ORG_LOGO_KEY, patch.logoUrl ?? null)
      } else if (next.logoUrl !== current.logoUrl) {
        persistImage(ORG_LOGO_KEY, next.logoUrl ?? null)
      }

      let remoteSaved = false
      try {
        await withTimeout(
          adminOrganizationService.save(next),
          ADMIN_ORG_REMOTE_SAVE_TIMEOUT_MS,
          'admin organization save'
        )
        remoteSaved = true
      } catch (error) {
        console.warn('[AdminOrg] remote save timed out, local snapshot kept:', error)
      }
      setAdminOrg(next)
      hasHydratedFromSupabase.current = true
      return { localSaved, remoteSaved }
    },
    [adminOrg]
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
