import type {
  AdminOrgProfile,
  InternalAccount,
  InternalContact,
} from '../../../contexts/AdminOrganizationContext';
import type { AdminAuthIdentitySource } from '../../../config/adminPortalPolicy';
import {
  getDepartmentAndTitleForRole,
  getRegionDisplayLabel,
  getRegionalRoleDisplayName,
  inferRegionCode,
  resolvePermissionRole,
} from './roleMappingEngine';
import type { PermissionRoleDefinition, PermissionRoleMap } from './roleMappingRules';
export {
  getDepartmentAndTitleForRole,
  getRegionDisplayLabel,
  getRegionalRoleDisplayName,
  inferRegionCode,
  resolvePermissionRole,
} from './roleMappingEngine';
export type { PermissionRoleDefinition, PermissionRoleMap } from './roleMappingRules';

export type PeopleColumnKey = 'employeeNo' | 'name' | 'department' | 'title' | 'region' | 'phone' | 'email' | 'wechat' | 'status' | 'visibleInDocuments' | 'actions';
export type AccessColumnKey = 'name' | 'employeeNo' | 'department' | 'title' | 'region' | 'username' | 'email' | 'accountStatus' | 'security' | 'role' | 'lastLoginAt' | 'actions';
export type RoleColumnKey = 'name' | 'employeeNo' | 'department' | 'title' | 'roleName' | 'roleCode' | 'description' | 'actions';

export const PEOPLE_COLUMN_KEYS: PeopleColumnKey[] = ['employeeNo', 'name', 'department', 'title', 'region', 'phone', 'email', 'wechat', 'status', 'visibleInDocuments', 'actions'];
export const ACCESS_COLUMN_KEYS: AccessColumnKey[] = ['name', 'employeeNo', 'department', 'title', 'region', 'username', 'email', 'accountStatus', 'security', 'role', 'lastLoginAt', 'actions'];
export const ROLE_COLUMN_KEYS: RoleColumnKey[] = ['name', 'employeeNo', 'department', 'title', 'roleName', 'roleCode', 'description', 'actions'];

export const TABLE_COLUMN_MIN_WIDTH = 72;
export const PEOPLE_TABLE_COLUMN_WIDTHS_KEY = 'cosun_people_center_people_table_column_widths_v2';
export const ACCESS_TABLE_COLUMN_WIDTHS_KEY = 'cosun_people_center_access_table_column_widths_v2';
export const ROLE_TABLE_COLUMN_WIDTHS_KEY = 'cosun_people_center_role_table_column_widths_v2';
export const PEOPLE_TABLE_UI_PREFERENCE_KEY = 'admin_company_profile_people_table_column_widths_v2';
export const ACCESS_TABLE_UI_PREFERENCE_KEY = 'admin_company_profile_access_table_column_widths_v2';
export const ROLE_TABLE_UI_PREFERENCE_KEY = 'admin_company_profile_role_table_column_widths_v2';

export const PEOPLE_TABLE_DEFAULT_WIDTHS: Record<PeopleColumnKey, number> = {
  employeeNo: 160,
  name: 170,
  department: 170,
  title: 170,
  region: 100,
  phone: 150,
  email: 220,
  wechat: 200,
  status: 110,
  visibleInDocuments: 110,
  actions: 96,
};

export const ACCESS_TABLE_DEFAULT_WIDTHS: Record<AccessColumnKey, number> = {
  name: 140,
  employeeNo: 110,
  department: 120,
  title: 140,
  region: 90,
  username: 170,
  email: 170,
  accountStatus: 110,
  security: 140,
  role: 150,
  lastLoginAt: 90,
  actions: 420,
};

export const ROLE_TABLE_DEFAULT_WIDTHS: Record<RoleColumnKey, number> = {
  name: 140,
  employeeNo: 110,
  department: 130,
  title: 130,
  roleName: 140,
  roleCode: 140,
  description: 240,
  actions: 120,
};

export const PEOPLE_DEPARTMENT_TITLE_PRESETS: Record<string, string[]> = {
  IT部: ['系统管理员'],
  管理层: ['CEO'],
  人力资源: ['招聘经理', '人事主管'],
  财务部: ['CFO', '财务专员', '代理记账财务'],
  销售部: ['销售总监', '销售经理', '业务员', '业务助理', '跟单员', '跟单/单证员'],
  '销售部-北美': ['区域主管', '销售经理', '业务员', '业务助理', '跟单员', '跟单/单证员'],
  '销售部-南美': ['区域主管', '销售经理', '业务员', '业务助理', '跟单员', '跟单/单证员'],
  '销售部-欧非': ['区域主管', '销售经理', '业务员', '业务助理', '跟单员', '跟单/单证员'],
  采购部: ['采购主管', '采购经理', '采购员', '采购专员'],
  市场部: ['运营专员', '运营助理'],
  品控部: ['验货员', 'QC'],
  行政部: ['行政专员'],
  单证管理部: ['单证员', '船务专员', '跟单/单证员'],
};

export const ORG_FAMILY_COLOR_PALETTE = [
  {
    rootRow: 'bg-rose-100/85 hover:bg-rose-200/80',
    childRow: 'bg-rose-50/55 hover:bg-rose-100/70',
    rootBlock: 'border-rose-300 bg-rose-100/95',
    childBlock: 'border-rose-200 bg-rose-50/95',
    rail: 'bg-rose-500',
    badge: 'bg-rose-100 text-rose-700',
    dot: 'bg-rose-500',
    dotColor: '#f43f5e',
  },
  {
    rootRow: 'bg-amber-100/85 hover:bg-amber-200/80',
    childRow: 'bg-amber-50/60 hover:bg-amber-100/70',
    rootBlock: 'border-amber-300 bg-amber-100/95',
    childBlock: 'border-amber-200 bg-amber-50/95',
    rail: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
    dotColor: '#f59e0b',
  },
  {
    rootRow: 'bg-emerald-100/85 hover:bg-emerald-200/80',
    childRow: 'bg-emerald-50/60 hover:bg-emerald-100/70',
    rootBlock: 'border-emerald-300 bg-emerald-100/95',
    childBlock: 'border-emerald-200 bg-emerald-50/95',
    rail: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
    dotColor: '#10b981',
  },
  {
    rootRow: 'bg-sky-100/85 hover:bg-sky-200/80',
    childRow: 'bg-sky-50/60 hover:bg-sky-100/70',
    rootBlock: 'border-sky-300 bg-sky-100/95',
    childBlock: 'border-sky-200 bg-sky-50/95',
    rail: 'bg-sky-500',
    badge: 'bg-sky-100 text-sky-700',
    dot: 'bg-sky-500',
    dotColor: '#0ea5e9',
  },
  {
    rootRow: 'bg-violet-100/85 hover:bg-violet-200/80',
    childRow: 'bg-violet-50/60 hover:bg-violet-100/70',
    rootBlock: 'border-violet-300 bg-violet-100/95',
    childBlock: 'border-violet-200 bg-violet-50/95',
    rail: 'bg-violet-500',
    badge: 'bg-violet-100 text-violet-700',
    dot: 'bg-violet-500',
    dotColor: '#8b5cf6',
  },
  {
    rootRow: 'bg-fuchsia-100/85 hover:bg-fuchsia-200/80',
    childRow: 'bg-fuchsia-50/60 hover:bg-fuchsia-100/70',
    rootBlock: 'border-fuchsia-300 bg-fuchsia-100/95',
    childBlock: 'border-fuchsia-200 bg-fuchsia-50/95',
    rail: 'bg-fuchsia-500',
    badge: 'bg-fuchsia-100 text-fuchsia-700',
    dot: 'bg-fuchsia-500',
    dotColor: '#d946ef',
  },
] as const;

export type OrgStructureItem = {
  id: string;
  employeeNo: string;
  name: string;
  department: string;
  title: string;
  managerId?: string;
};

export type OrgDropMode = 'child' | 'after';

export type LinkedPersonCenterRow = {
  id: string;
  name: string;
  nameRaw: string;
  employeeNo: string;
  employeeNoRaw: string;
  managerId: string;
  department: string;
  departmentRaw: string;
  title: string;
  titleRaw: string;
  regionRaw: string;
  phone: string;
  phoneRaw: string;
  extension: string;
  extensionRaw: string;
  wechat: string;
  wechatRaw: string;
  region: string;
  email: string;
  emailRaw: string;
  lastLoginAt: string;
  accountStatus: string;
  permissionRole: {
    code: string;
    name: string;
  };
  roleDefinition: PermissionRoleDefinition | undefined;
  status: string;
  visibleInDocuments?: boolean;
  linkedAccounts: InternalAccount[];
};

type AccessLinkedAccountLike = Pick<InternalAccount, 'role' | 'accountStatus' | 'canLogin' | 'activationStatus' | 'inviteExpiresAt'>;

type AccessRowLike = {
  name: string;
  employeeNo: string;
  email: string;
  department: string;
  title: string;
  region: string;
  accountStatus: string;
  linkedAccounts: AccessLinkedAccountLike[];
  permissionRole: {
    code?: string;
  };
};

export function buildAdminOrgPatch(
  draft: AdminOrgProfile,
  {
    internalContacts = draft.internalContacts,
    internalAccounts = draft.internalAccounts,
    logoUrl,
  }: {
    internalContacts?: InternalContact[];
    internalAccounts?: InternalAccount[];
    logoUrl?: string | null;
  } = {},
) {
  return {
    nameCN: draft.nameCN,
    nameEN: draft.nameEN,
    descriptionCN: draft.descriptionCN,
    descriptionEN: draft.descriptionEN,
    phone: draft.phone,
    email: draft.email,
    contactPerson: draft.contactPerson,
    website: draft.website,
    addressCN: draft.addressCN,
    addressEN: draft.addressEN,
    taxId: draft.taxId,
    defaultCurrencyCN: draft.defaultCurrencyCN,
    defaultCurrencyEN: draft.defaultCurrencyEN,
    defaultCurrency: draft.defaultCurrencyCN,
    timezone: draft.timezone,
    bankRMB: draft.bankRMB,
    bankUSD: draft.bankUSD,
    bankPrivate: draft.bankPrivate,
    internalContacts,
    internalAccounts,
    documentDefaults: draft.documentDefaults,
    ...(logoUrl !== undefined ? { logoUrl } : {}),
  };
}

export function buildLinkedPersonCenterRows(
  contacts: InternalContact[],
  accounts: InternalAccount[],
  permissionRoleMap: PermissionRoleMap,
): LinkedPersonCenterRow[] {
  return contacts.map((contact) => {
    const linkedAccounts = accounts.filter((account) => account.employeeId === contact.id);
    const primaryAccount = linkedAccounts[0];
    const resolvedRole = resolvePermissionRole(
      permissionRoleMap,
      primaryAccount?.role,
      contact.title,
      contact.department,
      primaryAccount?.region,
    );
    const roleDefinition = permissionRoleMap[resolvedRole.code];

    return {
      id: contact.id,
      name: contact.name || '未命名人员',
      nameRaw: contact.name || '',
      employeeNo: contact.employeeNo || '—',
      employeeNoRaw: contact.employeeNo || '',
      managerId: contact.managerId || '',
      department: contact.department || '未设置部门',
      departmentRaw: contact.department || '',
      title: contact.title || '未设置岗位',
      titleRaw: contact.title || '',
      phone: contact.phone || '—',
      phoneRaw: contact.phone || '',
      extension: contact.extension || '—',
      extensionRaw: contact.extension || '',
      wechat: contact.wechat || '—',
      wechatRaw: contact.wechat || '',
      region: inferRegionCode(primaryAccount?.region || contact.region, contact.department || ''),
      regionRaw: String(contact.region || '').trim(),
      email: contact.email || primaryAccount?.loginEmail || '—',
      emailRaw: contact.email || '',
      lastLoginAt: primaryAccount?.lastLoginAt || '—',
      accountStatus: primaryAccount?.accountStatus || '未开通',
      permissionRole: resolvedRole,
      roleDefinition,
      status: contact.status || '在职',
      visibleInDocuments: contact.visibleInDocuments,
      linkedAccounts,
    };
  });
}

export function formatPersonRegion(region?: string) {
  return getRegionDisplayLabel(region) || '全部';
}

export function preserveLatestAuthFieldsForUntouchedAccounts(
  nextAccounts: InternalAccount[],
  liveAccounts: InternalAccount[],
  changedAccountIds: string[] = [],
) {
  const changedIdSet = new Set(changedAccountIds);
  const liveById = new Map(
    liveAccounts.map((account) => [String(account.id || '').trim(), account] as const),
  );

  return nextAccounts.map((account) => {
    const accountId = String(account.id || '').trim();
    const liveAccount = liveById.get(accountId);
    if (!liveAccount || changedIdSet.has(accountId)) return account;

    return {
      ...account,
      authUserId: liveAccount.authUserId,
      loginPassword: liveAccount.loginPassword,
      authMode: liveAccount.authMode,
      activationStatus: liveAccount.activationStatus,
      primaryIdentitySource: liveAccount.primaryIdentitySource,
      phoneLogin: liveAccount.phoneLogin,
      phoneVerified: liveAccount.phoneVerified,
      emailVerified: liveAccount.emailVerified,
      wechatOpenId: liveAccount.wechatOpenId,
      enterpriseWechatUserId: liveAccount.enterpriseWechatUserId,
      whatsappAccount: liveAccount.whatsappAccount,
      invitedAt: liveAccount.invitedAt,
      inviteExpiresAt: liveAccount.inviteExpiresAt,
      lastInviteChannel: liveAccount.lastInviteChannel,
      activatedAt: liveAccount.activatedAt,
      lastLoginAt: liveAccount.lastLoginAt,
    };
  });
}

export function distributeColumnWidths<T extends string>(keys: T[], containerWidth: number) {
  const baseWidth = TABLE_COLUMN_MIN_WIDTH;
  const totalMinWidth = keys.length * baseWidth;
  if (containerWidth <= totalMinWidth) {
    return Object.fromEntries(keys.map((key) => [key, baseWidth])) as Record<T, number>;
  }
  const extraWidth = containerWidth - totalMinWidth;
  const evenExtra = Math.floor(extraWidth / keys.length);
  const remainder = extraWidth % keys.length;
  return Object.fromEntries(
    keys.map((key, index) => [key, baseWidth + evenExtra + (index < remainder ? 1 : 0)]),
  ) as Record<T, number>;
}

export function mergeStoredColumnWidths<T extends string>(
  defaults: Record<T, number>,
  parsed: Partial<Record<T, number>> | null | undefined,
): Record<T, number> {
  return {
    ...defaults,
    ...Object.fromEntries(
      Object.entries(parsed || {}).filter((entry): entry is [T, number] => (
        Object.prototype.hasOwnProperty.call(defaults, entry[0]) &&
        typeof entry[1] === 'number' &&
        entry[1] >= TABLE_COLUMN_MIN_WIDTH
      )),
    ),
  };
}

function parseEmployeeNoNumber(value: string): number {
  const match = String(value || '').trim().match(/CS-(\d+)/i);
  return match ? Number(match[1]) : 0;
}

export function formatEmployeeNo(value: number): string {
  return `CS-${String(value).padStart(3, '0')}`;
}

export function getNextEmployeeNo(contacts: InternalContact[]): string {
  const maxNo = contacts.reduce((max, contact) => Math.max(max, parseEmployeeNoNumber(contact.employeeNo)), 0);
  return formatEmployeeNo(maxNo + 1);
}

export function formatDateTime(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', { hour12: false });
}

export function buildInviteExpiry(hours = 168) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export function generateTemporaryPassword(seed = ''): string {
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

export function buildAccountUsername(contact: Pick<InternalContact, 'employeeNo' | 'name' | 'email'>): string {
  const emailPrefix = String(contact.email || '').split('@')[0]?.trim();
  if (emailPrefix) return emailPrefix;
  const employeeNo = String(contact.employeeNo || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  if (employeeNo) return employeeNo;
  const namePrefix = String(contact.name || '').trim().toLowerCase().replace(/\s+/g, '');
  return namePrefix || `user${Date.now()}`;
}

export function getAccountStatusMeta(status?: string, canLogin = true) {
  if (!status || status === '未开通') {
    return {
      label: '未开通',
      className: 'border-slate-200 bg-slate-50 text-slate-500',
    };
  }

  if (status === 'active') {
    return canLogin
      ? {
          label: '已启用',
          className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        }
      : {
          label: '已停用',
          className: 'border-amber-200 bg-amber-50 text-amber-700',
        };
  }

  if (status === 'disabled') {
    return {
      label: '已停用',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
    };
  }

  if (status === 'locked') {
    return {
      label: '已锁定',
      className: 'border-red-200 bg-red-50 text-red-700',
    };
  }

  if (status === 'deleted') {
    return {
      label: '已删除',
      className: 'border-slate-200 bg-slate-100 text-slate-500',
    };
  }

  return {
    label: status,
    className: 'border-slate-200 bg-slate-50 text-slate-600',
  };
}

export function getAuthModeMeta(authMode?: InternalAccount['authMode']) {
  if (authMode === 'production') {
    return {
      label: '正式轨',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    };
  }
  if (authMode === 'dual') {
    return {
      label: '双轨',
      className: 'border-sky-200 bg-sky-50 text-sky-700',
    };
  }
  return {
    label: '测试轨',
    className: 'border-slate-200 bg-slate-50 text-slate-600',
  };
}

export function getIdentitySourceLabel(source?: AdminAuthIdentitySource) {
  if (source === 'phone') return '手机号';
  if (source === 'wechat') return '微信';
  if (source === 'enterprise_wechat') return '企业微信';
  if (source === 'whatsapp') return 'WhatsApp';
  return '邮箱';
}

export function getActivationStatusMeta(account?: InternalAccount | null) {
  if (!account) {
    return {
      label: '未发放',
      className: 'border-slate-200 bg-slate-50 text-slate-500',
    };
  }

  if (account.activationStatus === 'disabled') {
    return {
      label: '已停用',
      className: 'border-slate-200 bg-slate-100 text-slate-500',
    };
  }

  if (account.activationStatus === 'active') {
    return {
      label: '已激活',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    };
  }

  if (account.activationStatus === 'email_verified') {
    return {
      label: '邮箱已验证',
      className: 'border-blue-200 bg-blue-50 text-blue-700',
    };
  }

  if (account.activationStatus === 'phone_verified') {
    return {
      label: '手机已验证',
      className: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    };
  }

  if (account.activationStatus === 'invited') {
    return {
      label: '已邀请待激活',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
    };
  }

  return {
    label: '待发放',
    className: 'border-slate-200 bg-slate-50 text-slate-500',
  };
}

export function getAccessLifecycleStatus(account?: InternalAccount | null) {
  if (!account) return '未开通';

  if (account.accountStatus === 'locked') return 'locked';
  if (account.accountStatus === 'disabled' || !account.canLogin) return 'disabled';
  if (account.activationStatus === 'active') return 'activated';

  const inviteExpiresAt = String(account.inviteExpiresAt || '').trim();
  if (inviteExpiresAt) {
    const expiresAt = new Date(inviteExpiresAt);
    if (!Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() < Date.now() && account.activationStatus !== 'active') {
      return 'expired';
    }
    if (!Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() - Date.now() <= 72 * 60 * 60 * 1000 && account.activationStatus !== 'active') {
      return 'expiring';
    }
  }

  if (account.activationStatus === 'invited' || account.activationStatus === 'email_verified' || account.activationStatus === 'phone_verified') {
    return 'pending_activation';
  }

  return account.accountStatus === 'active' ? 'active' : '未开通';
}

export function getNextSortState<T extends string>(
  currentKey: T,
  currentDirection: 'asc' | 'desc',
  nextKey: T,
) {
  if (currentKey === nextKey) {
    return {
      key: currentKey,
      direction: currentDirection === 'asc' ? 'desc' : 'asc',
    };
  }

  return {
    key: nextKey,
    direction: 'asc' as const,
  };
}

type ActivationExportAccountLike = Pick<
  InternalAccount,
  'username' | 'authMode' | 'primaryIdentitySource' | 'activationStatus' | 'invitedAt' | 'inviteExpiresAt'
>;

type ActivationExportRowLike = {
  name: string;
  employeeNo: string;
  department: string;
  title: string;
  email: string;
  emailRaw?: string;
  linkedAccounts: ActivationExportAccountLike[];
};

function escapeCsvValue(value: unknown) {
  return `"${String(value || '').replace(/"/g, '""')}"`;
}

export function buildFormalActivationCsv(rows: ActivationExportRowLike[]) {
  const header = ['姓名', '工号', '部门', '岗位', '登录账号', '登录邮箱', '认证轨道', '主认证方式', '激活状态', '发放时间', '失效时间'];
  const lines = rows.map((row) => {
    const primaryAccount = row.linkedAccounts[0];
    return [
      row.name,
      row.employeeNo,
      row.department,
      row.title,
      primaryAccount?.username || '',
      row.emailRaw || row.email,
      getAuthModeMeta(primaryAccount?.authMode).label,
      getIdentitySourceLabel(primaryAccount?.primaryIdentitySource),
      getActivationStatusMeta(primaryAccount).label,
      formatDateTime(primaryAccount?.invitedAt),
      formatDateTime(primaryAccount?.inviteExpiresAt),
    ].map(escapeCsvValue).join(',');
  });

  return [header.join(','), ...lines].join('\n');
}

export function buildSortedUniqueOptions(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

export function filterAccessRows(
  rows: AccessRowLike[],
  filters: {
    accessSearch: string;
    accessDepartmentFilter: string;
    accessRegionFilter: string;
    accessStatusFilter: string;
  },
) {
  const keyword = filters.accessSearch.trim().toLowerCase();
  return rows.filter((row) => {
    const primaryRoles = row.linkedAccounts.map((account) => account.role).join(' ');
    const primaryAccount = row.linkedAccounts[0];
    const lifecycleStatus = getAccessLifecycleStatus(primaryAccount);
    const matchesKeyword =
      !keyword ||
      `${row.name} ${row.employeeNo} ${row.email} ${row.department} ${row.title} ${primaryRoles}`.toLowerCase().includes(keyword);
    const matchesDepartment = filters.accessDepartmentFilter === 'all' || row.department === filters.accessDepartmentFilter;
    const matchesRegion = filters.accessRegionFilter === 'all' || row.region === filters.accessRegionFilter;
    const matchesStatus =
      filters.accessStatusFilter === 'all' ||
      (
        filters.accessStatusFilter === 'active'
          ? row.accountStatus === 'active'
          : filters.accessStatusFilter === 'disabled'
            ? row.accountStatus === 'disabled'
            : filters.accessStatusFilter === 'locked'
              ? row.accountStatus === 'locked'
              : filters.accessStatusFilter === '未开通'
                ? row.accountStatus === '未开通'
                : lifecycleStatus === filters.accessStatusFilter
      );
    return matchesKeyword && matchesDepartment && matchesRegion && matchesStatus;
  });
}

export function getInviteActionRows<T extends AccessRowLike>(rows: T[]) {
  return rows.filter((row) => {
    const primaryAccount = row.linkedAccounts[0];
    const lifecycleStatus = getAccessLifecycleStatus(primaryAccount);
    return Boolean(primaryAccount) && ['pending_activation', 'expiring', 'expired'].includes(lifecycleStatus);
  });
}

export function getActivatedRows<T extends AccessRowLike>(rows: T[]) {
  return rows.filter((row) => getAccessLifecycleStatus(row.linkedAccounts[0]) === 'activated');
}

export function sortAccessRows<T extends AccessRowLike>(
  rows: T[],
  accessSortKey: 'name' | 'employeeNo' | 'department' | 'title' | 'region' | 'email' | 'accountCount' | 'role' | 'lastLoginAt',
  accessSortDirection: 'asc' | 'desc',
) {
  const sortedRows = [...rows];
  sortedRows.sort((a, b) => {
    const valueA =
      accessSortKey === 'accountCount' ? a.linkedAccounts.length :
      accessSortKey === 'role' ? (a.permissionRole.code || '') :
      (a as Record<string, unknown>)[accessSortKey];
    const valueB =
      accessSortKey === 'accountCount' ? b.linkedAccounts.length :
      accessSortKey === 'role' ? (b.permissionRole.code || '') :
      (b as Record<string, unknown>)[accessSortKey];

    const normalizedA = typeof valueA === 'number' ? valueA : String(valueA || '').toLowerCase();
    const normalizedB = typeof valueB === 'number' ? valueB : String(valueB || '').toLowerCase();
    if (normalizedA < normalizedB) return accessSortDirection === 'asc' ? -1 : 1;
    if (normalizedA > normalizedB) return accessSortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  return sortedRows;
}

export function resolvePeopleDropMode(
  clientY: number,
  rowRect: DOMRect,
  canHostChildren: boolean,
  currentMode: OrgDropMode = 'child',
): OrgDropMode {
  if (!canHostChildren) return 'after';
  const relativeY = clientY - rowRect.top;
  const childBoundary = rowRect.height * 0.58;
  const afterBoundary = rowRect.height * 0.82;
  if (relativeY <= childBoundary) return 'child';
  if (relativeY >= afterBoundary) return 'after';
  return currentMode;
}

export function buildOrgStructureEntries<T extends OrgStructureItem>(rows: T[]) {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const childrenByManager = new Map<string, T[]>();
  const roots: T[] = [];

  rows.forEach((row) => {
    const resolvedManagerId = row.managerId && row.managerId !== row.id && byId.has(row.managerId) ? row.managerId : '';

    if (resolvedManagerId && resolvedManagerId !== row.id && byId.has(resolvedManagerId)) {
      const current = childrenByManager.get(resolvedManagerId) || [];
      current.push(row);
      childrenByManager.set(resolvedManagerId, current);
    } else {
      roots.push(row);
    }
  });

  const visited = new Set<string>();
  const flattenTree = (
    row: T,
    level: number,
    parentLabel: string,
    parentId: string,
    familyRootId: string,
  ): Array<{
    row: T;
    level: number;
    isParent: boolean;
    canHostChildren: boolean;
    parentLabel: string;
    managerId: string;
    familyRootId: string;
  }> => {
    if (visited.has(row.id)) return [];
    visited.add(row.id);
    const children = childrenByManager.get(row.id) || [];
    return [
      {
        row,
        level,
        isParent: children.length > 0,
        canHostChildren: true,
        parentLabel,
        managerId: parentId,
        familyRootId,
      },
      ...children.flatMap((child) => flattenTree(child, level + 1, `${row.name} / ${row.title}`, row.id, familyRootId)),
    ];
  };

  const entries = roots.flatMap((row) => flattenTree(row, 0, '', '', row.id));
  rows.forEach((row) => {
    if (!visited.has(row.id)) {
      entries.push(...flattenTree(row, 0, '', '', row.id));
    }
  });
  return entries;
}

export function buildDescendantIdMap<T extends OrgStructureItem>(rows: T[]) {
  const childrenByManager = new Map<string, string[]>();

  rows.forEach((row) => {
    const managerId = String(row.managerId || '').trim();
    if (!managerId || managerId === row.id) return;
    const current = childrenByManager.get(managerId) || [];
    current.push(row.id);
    childrenByManager.set(managerId, current);
  });

  const cache = new Map<string, Set<string>>();
  const resolve = (id: string): Set<string> => {
    if (cache.has(id)) return cache.get(id)!;
    const descendants = new Set<string>();
    const children = childrenByManager.get(id) || [];
    children.forEach((childId) => {
      if (childId === id) return;
      descendants.add(childId);
      resolve(childId).forEach((nestedId) => descendants.add(nestedId));
    });
    cache.set(id, descendants);
    return descendants;
  };

  rows.forEach((row) => {
    resolve(row.id);
  });

  return cache;
}

export function normalizeContactEmployeeNos<T extends OrgStructureItem>(contacts: T[]): T[] {
  const orderedIds = buildOrgStructureEntries(contacts).map((entry) => entry.row.id);
  const byId = new Map(contacts.map((contact) => [contact.id, contact]));
  return orderedIds.map((id, index) => ({
    ...byId.get(id)!,
    employeeNo: formatEmployeeNo(index + 1),
  }));
}

export function buildReorderedContacts(
  contacts: InternalContact[],
  draggedId: string,
  targetId: string,
  dropMode: OrgDropMode = 'child',
  managerId?: string,
): InternalContact[] {
  if (draggedId === targetId) return contacts;
  const current = [...contacts];
  const draggedIndex = current.findIndex((contact) => contact.id === draggedId);
  const targetIndex = current.findIndex((contact) => contact.id === targetId);
  if (draggedIndex < 0 || targetIndex < 0) return contacts;
  const [dragged] = current.splice(draggedIndex, 1);
  const targetRow = contacts.find((contact) => contact.id === targetId);
  const nextManagerId =
    dropMode === 'child'
      ? targetId
      : (managerId !== undefined ? managerId : targetRow?.managerId || '');
  const nextDragged = { ...dragged, managerId: nextManagerId };
  const orderedEntries = buildOrgStructureEntries(current);
  const targetEntryIndex = orderedEntries.findIndex((entry) => entry.row.id === targetId);
  if (targetEntryIndex < 0) return contacts;
  let branchEndIndex = targetEntryIndex;
  const targetLevel = orderedEntries[targetEntryIndex].level;
  for (let index = targetEntryIndex + 1; index < orderedEntries.length; index += 1) {
    if (orderedEntries[index].level <= targetLevel) break;
    branchEndIndex = index;
  }
  const anchorId = orderedEntries[branchEndIndex]?.row.id || targetId;
  const adjustedTargetIndex = current.findIndex((contact) => contact.id === anchorId);
  if (adjustedTargetIndex < 0) return contacts;
  current.splice(adjustedTargetIndex + 1, 0, nextDragged);
  return normalizeContactEmployeeNos(current);
}

export function buildTopInsertedContacts(
  contacts: InternalContact[],
  draggedId: string,
): InternalContact[] {
  const current = [...contacts];
  const draggedIndex = current.findIndex((contact) => contact.id === draggedId);
  if (draggedIndex < 0) return contacts;
  const [dragged] = current.splice(draggedIndex, 1);
  current.unshift({ ...dragged, managerId: '' });
  return normalizeContactEmployeeNos(current);
}
