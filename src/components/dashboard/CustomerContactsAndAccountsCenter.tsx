import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, GripVertical, Lock, Mail, Pencil, Search, Shield, UserPlus, Users, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { useUser } from '../../contexts/UserContext';
import {
  customerEnterpriseInvitationService,
  customerEnterpriseMemberService,
} from '../../lib/supabaseService';
import {
  CUSTOMER_ENTERPRISE_ROLES,
  CUSTOMER_ENTERPRISE_ROLE_PERMISSION_KEYS,
  CUSTOMER_ENTERPRISE_ROLE_TONES,
  DEFAULT_CUSTOMER_ENTERPRISE_ROLE,
  type CustomerEnterprisePermissionKey,
  type CustomerEnterpriseRole,
  type CustomerEnterpriseStatus,
} from '../../lib/customerEnterpriseRoles';
import type { CustomerMasterDataCopy } from './customerEnterpriseMasterDataI18n';
import { INPUT } from '../admin/admin-organization-profile/sharedStyles';
import {
  ACCESS_COLUMN_KEYS,
  ACCESS_TABLE_DEFAULT_WIDTHS,
  PEOPLE_COLUMN_KEYS,
  PEOPLE_TABLE_DEFAULT_WIDTHS,
  ROLE_COLUMN_KEYS,
  ROLE_TABLE_DEFAULT_WIDTHS,
  TABLE_COLUMN_MIN_WIDTH,
  buildOrgStructureEntries,
  type AccessColumnKey,
  type PeopleColumnKey,
  type RoleColumnKey,
  distributeColumnWidths,
  mergeStoredColumnWidths,
} from '../admin/admin-organization-profile/peopleCenterShared';
import { getColumnStyle, renderColumnResizeHandle } from '../admin/admin-organization-profile/peopleCenterVisuals';

type CustomerAccountRole = CustomerEnterpriseRole;
type CustomerAccountStatus = CustomerEnterpriseStatus;
type CustomerAccessStatusCode =
  | 'active'
  | 'disabled'
  | 'locked'
  | 'pending_activation'
  | 'expiring'
  | 'expired'
  | 'activated'
  | '未开通';

type CustomerTeamMember = {
  id: string;
  employeeNo?: string;
  name: string;
  managerId?: string;
  department?: string;
  title: string;
  region?: string;
  phone?: string;
  businessEmail: string;
  wechat?: string;
  loginEmail: string;
  role: CustomerAccountRole;
  status: CustomerAccountStatus;
  visibleInDocuments?: boolean;
  canLogin: boolean;
  lastLogin: string;
  permissions: string[];
  loginAccount?: string;
  authMode?: 'test' | 'formal';
  primaryIdentitySource?: 'email' | 'phone';
  loginPassword?: string;
  forcePasswordReset?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  inviteSentAt?: string;
  inviteExpiresAt?: string;
  activatedAt?: string;
  notes?: string;
};

type CustomerInvitationRecord = {
  id: string;
  memberId: string;
  inviteUrl: string;
  lastSentAt: string | null;
  expiresAt: string | null;
  status: string;
};

type CustomerLinkedCenterRow = {
  id: string;
  member: CustomerTeamMember;
  employeeNo: string;
  department: string;
  title: string;
  regionCode: string;
  regionLabel: string;
  phone: string;
  email: string;
  wechat: string;
  statusLabel: string;
  username: string;
  loginEmail: string;
  lastLoginAt: string;
  accountStatusCode: CustomerAccessStatusCode;
  lifecycleStatusCode: CustomerAccessStatusCode;
  permissionRole: {
    code: CustomerAccountRole;
    name: string;
  };
};

const STORAGE_KEY = 'cosun_customer_contacts_accounts_v1';
const PENDING_SYNC_KEY = 'cosun_pending_customer_contacts_accounts_sync_v1';
const CUSTOMER_PEOPLE_COLUMN_WIDTHS_KEY = 'cosun_customer_people_table_column_widths_v1';
const CUSTOMER_ACCESS_COLUMN_WIDTHS_KEY = 'cosun_customer_access_table_column_widths_v1';
const CUSTOMER_ROLE_COLUMN_WIDTHS_KEY = 'cosun_customer_role_table_column_widths_v1';

const defaultCopy: CustomerMasterDataCopy['contacts'] = {
  metrics: {
    total: 'Team Members',
    totalDesc: 'Contacts linked to this enterprise',
    active: 'Active Accounts',
    activeDesc: 'Members currently active',
    loginEnabled: 'Login Enabled',
    loginEnabledDesc: 'Accounts allowed to sign in',
    owners: 'Enterprise Owners',
    ownersDesc: 'Members who can manage the enterprise',
  },
  title: 'People & Accounts Center',
  description: 'Manage enterprise contacts, login access, and business roles separately from company master data.',
  syncing: 'Syncing...',
  closeInviteForm: 'Close Invite Form',
  inviteMember: 'Invite Member',
  fields: {
    fullName: 'Full name',
    title: 'Title / Position',
    businessEmail: 'Business email',
    loginEmail: 'Login email',
  },
  subTabs: {
    people: 'People Directory',
    access: 'Account Access',
    roles: 'Role Permissions',
  },
  viewModes: {
    list: 'List View',
    org: 'Org View',
  },
  filters: {
    searchPeople: 'Search name / title / email / role',
    searchAccess: 'Search account / login email / role',
    searchRoles: 'Search member / role / permission',
    roleFilter: 'Role Filter',
    statusFilter: 'Status Filter',
    allRoles: 'All Roles',
    allStatuses: 'All Statuses',
  },
  actions: {
    invite: 'Invite',
    activate: 'Activate',
    suspend: 'Suspend',
    resendInvite: 'Resend Invite',
    copyInviteLink: 'Copy Invite Link',
    viewDetails: 'Details',
    updateRole: 'Update Role',
    openPermissionCenter: 'Open Permission Center',
  },
  table: {
    contact: 'Contact',
    emails: 'Emails',
    role: 'Role',
    status: 'Status',
    loginAccess: 'Login Access',
    actions: 'Actions',
    lastLogin: 'Last login',
    inviteSent: 'Invite sent',
    enabled: 'Enabled',
    disabled: 'Disabled',
    title: 'Title',
    businessEmail: 'Business Email',
    loginEmail: 'Login Email',
    roleCode: 'Role Code',
    roleSummary: 'Role Summary',
    employeeNo: 'No.',
  },
  helperTexts: {
    people: 'Keep member records reusable for orders, approvals, directories, and customer-side collaboration.',
    access: 'Manage login availability, invitation links, and account security from one list.',
    roles: 'Align customer-side responsibilities and permissions clearly by business role.',
  },
  identityTitle: 'Current Account Identity',
  identityDescription: 'Keep the current signed-in user profile separate from enterprise contacts and permissions.',
  roleLabels: {
    Owner: 'Owner',
    'Purchase Manager': 'Purchase Manager',
    Purchaser: 'Purchaser',
    Finance: 'Finance',
    Viewer: 'Viewer',
  },
  permissionLabels: {
    manageEnterpriseProfile: 'Manage enterprise profile',
    manageMembers: 'Manage members',
    createInquiries: 'Create inquiries',
    viewPrices: 'View prices',
    placeOrders: 'Place orders',
    managePurchaseRequests: 'Manage purchase requests',
    viewFinanceDocs: 'View finance docs',
    uploadPaymentProof: 'Upload payment proof',
    viewBillingDetails: 'View billing details',
    readOnlyAccess: 'Read-only access',
  },
  statusLabels: {
    active: 'Active',
    invited: 'Invited',
    suspended: 'Suspended',
  },
  messages: {
    nameAndLoginRequired: 'Name and login email are required',
    memberInvited: 'Member invited to enterprise account center',
    memberInvitedQueued: 'Member invited locally and queued for cloud sync',
    invitationCopied: 'Invitation link copied. Share it with the new member to activate the account.',
    invitationCreateFailed: 'Failed to create invitation link',
    accessUpdated: 'Member access updated',
    accessUpdatedQueued: 'Member changes saved locally and queued for cloud sync',
    resendRequiresCustomer: 'Customer account context is required to resend invitations',
    resendCopied: 'Fresh invite link copied for',
    resendFailed: 'Failed to resend invite',
    inviteLinkNotReady: 'Invite link is not ready yet',
    inviteLinkCopied: 'Invite link copied',
    teamMemberFallback: 'Team Member',
    invitationPending: 'Invitation pending',
    currentSession: 'Current session',
    enterpriseOwnerTitle: 'Enterprise Owner',
  },
};

function getRolePermissionMap(copy: CustomerMasterDataCopy['contacts']): Record<CustomerAccountRole, string[]> {
  return Object.fromEntries(
    CUSTOMER_ENTERPRISE_ROLES.map((role) => [
      role,
      CUSTOMER_ENTERPRISE_ROLE_PERMISSION_KEYS[role].map(
        (permissionKey) => copy.permissionLabels[permissionKey as CustomerEnterprisePermissionKey],
      ),
    ]),
  ) as Record<CustomerAccountRole, string[]>;
}

function readCustomerCompanyNameFromProfile() {
  if (typeof window === 'undefined') return '';
  try {
    const raw = window.localStorage.getItem('cosun_customer_profile');
    if (!raw) return '';
    const parsed = JSON.parse(raw) as {
      companyName?: string;
      legalCompanyName?: string;
      name?: string;
    };
    return String(parsed.companyName || parsed.legalCompanyName || parsed.name || '').trim();
  } catch {
    return '';
  }
}

function formatCustomerCompanyToken(rawCompanyName: string, fallbackEmail?: string) {
  const source = String(rawCompanyName || '').trim();
  const fallbackDomain = String(fallbackEmail || '')
    .split('@')[1]
    ?.split('.')
    ?.filter(Boolean)?.[0] || '';
  const normalized = (source || fallbackDomain || 'Customer')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim();

  const token = normalized
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => `${segment.slice(0, 1).toUpperCase()}${segment.slice(1)}`)
    .join('')
    .replace(/[^a-zA-Z0-9]/g, '');

  return token || 'Customer';
}

function buildCustomerAccountPassword(member: Pick<CustomerTeamMember, 'name' | 'employeeNo' | 'loginEmail' | 'businessEmail'>) {
  const companyToken = formatCustomerCompanyToken(
    readCustomerCompanyNameFromProfile(),
    member.loginEmail || member.businessEmail,
  );
  const letterSource = String(member.name || '')
    .replace(/[^a-zA-Z]/g, '')
    .trim();
  const upper = (letterSource.slice(0, 1) || 'A').toUpperCase();
  const lower = (letterSource.slice(1, 2) || letterSource.slice(0, 1) || 'a').toLowerCase();
  const numericSeed = String(member.employeeNo || '')
    .replace(/\D/g, '')
    .slice(-2)
    .padStart(2, '0');

  return `${upper}${lower}${numericSeed}@${companyToken}`;
}

function buildSeedMember(
  user: ReturnType<typeof useUser>['user'],
  copy: CustomerMasterDataCopy['contacts'],
): CustomerTeamMember | null {
  if (!user?.email) return null;
  const permissionMap = getRolePermissionMap(copy);
  const employeeNo = '001';
  return {
    id: `member-${user.id || user.email}`,
    employeeNo,
    name: user.name || user.email.split('@')[0] || copy.messages.teamMemberFallback,
    managerId: '',
    department: '管理层',
    title: copy.messages.enterpriseOwnerTitle,
    region: 'all',
    phone: '',
    businessEmail: user.email,
    wechat: '',
    loginEmail: user.email,
    role: 'Owner',
    status: 'active',
    visibleInDocuments: true,
    canLogin: true,
    lastLogin: copy.messages.currentSession,
    permissions: permissionMap.Owner,
    loginAccount: user.email.split('@')[0] || user.email,
    authMode: 'formal',
    primaryIdentitySource: 'email',
    loginPassword: buildCustomerAccountPassword({
      name: user.name || user.email.split('@')[0] || copy.messages.teamMemberFallback,
      employeeNo,
      loginEmail: user.email,
      businessEmail: user.email,
    }),
    forcePasswordReset: false,
    emailVerified: true,
    phoneVerified: false,
    activatedAt: new Date().toISOString(),
    notes: '',
  };
}

function roleBadge(role: CustomerAccountRole) {
  return CUSTOMER_ENTERPRISE_ROLE_TONES[role];
}

function statusBadge(status: CustomerAccountStatus) {
  const cls: Record<CustomerAccountStatus, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    invited: 'bg-orange-50 text-orange-700 border-orange-200',
    suspended: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return cls[status];
}

function resolveRoleDescription(member: CustomerTeamMember, copy: CustomerMasterDataCopy['contacts']) {
  if (member.role === 'Owner') return `${copy.permissionLabels.manageEnterpriseProfile} / ${copy.permissionLabels.manageMembers}`;
  if (member.role === 'Purchase Manager') return `${copy.permissionLabels.placeOrders} / ${copy.permissionLabels.managePurchaseRequests}`;
  if (member.role === 'Purchaser') return `${copy.permissionLabels.createInquiries} / ${copy.permissionLabels.placeOrders}`;
  if (member.role === 'Finance') return `${copy.permissionLabels.viewFinanceDocs} / ${copy.permissionLabels.uploadPaymentProof}`;
  return copy.permissionLabels.readOnlyAccess;
}

function resolveSecuritySummary(member: CustomerTeamMember, copy: CustomerMasterDataCopy['contacts']) {
  if (!member.canLogin) return copy.table.disabled;
  if (member.status === 'invited') return copy.messages.invitationPending;
  if (member.status === 'suspended') return copy.statusLabels.suspended;
  return copy.statusLabels.active;
}

function getRoleOptions(copy: CustomerMasterDataCopy['contacts']) {
  return CUSTOMER_ENTERPRISE_ROLES.map((role) => ({
    value: role,
    label: copy.roleLabels[role],
  }));
}

function renderPermissionPills(permissions: string[]) {
  return permissions.map((permission) => (
    <span
      key={permission}
      className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600"
    >
      {permission}
    </span>
  ));
}

const PEOPLE_REGION_OPTIONS = [
  { value: '', label: '全部 / 未指定' },
  { value: 'all', label: '全部 / 未指定' },
  { value: 'NA', label: '北美区' },
  { value: 'SA', label: '南美区' },
  { value: 'EA', label: '欧非区' },
];

const PEOPLE_DEPARTMENT_OPTIONS = ['管理层', '采购管理', '采购部', '财务部', '观察席'];

const PEOPLE_TITLES_BY_DEPARTMENT: Record<string, string[]> = {
  管理层: ['Owner', 'Enterprise Owner'],
  采购管理: ['Purchase Manager'],
  采购部: ['Purchaser'],
  财务部: ['Finance'],
  观察席: ['Viewer'],
};

function formatPersonRegion(region?: string) {
  if (!region || region === 'all') return '全部';
  if (region === 'NA') return '北美区';
  if (region === 'SA') return '南美区';
  if (region === 'EA') return '欧非区';
  return region;
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const ROLE_DEFAULTS: Record<CustomerAccountRole, { department: string; title: string; region: string }> = {
  Owner: { department: '管理层', title: 'Owner', region: 'all' },
  'Purchase Manager': { department: '采购管理', title: 'Purchase Manager', region: 'all' },
  Purchaser: { department: '采购部', title: 'Purchaser', region: 'all' },
  Finance: { department: '财务部', title: 'Finance', region: 'all' },
  Viewer: { department: '观察席', title: 'Viewer', region: 'all' },
};

function getDefaultEmployeeNo(index: number) {
  return String(index + 1).padStart(3, '0');
}

function formatEmployeeNo(value: string | undefined, index: number) {
  const raw = String(value || '').trim();
  const digits = raw.replace(/\D/g, '');
  if (digits.length > 0) {
    return digits.slice(-3).padStart(3, '0');
  }
  return getDefaultEmployeeNo(index);
}

function normalizeCustomerMember(member: CustomerTeamMember, index: number): CustomerTeamMember {
  const roleDefaults = ROLE_DEFAULTS[member.role] || ROLE_DEFAULTS[DEFAULT_CUSTOMER_ENTERPRISE_ROLE];
  const businessEmail = String(member.businessEmail || member.loginEmail || '').trim().toLowerCase();
  const loginEmail = String(member.loginEmail || member.businessEmail || '').trim().toLowerCase();
  const employeeNo = formatEmployeeNo(member.employeeNo, index);

  return {
    ...member,
    employeeNo,
    department: String(member.department || '').trim() || roleDefaults.department,
    title: String(member.title || '').trim() || roleDefaults.title,
    region: String(member.region || '').trim() || roleDefaults.region,
    businessEmail,
    loginEmail,
    loginAccount:
      String(member.loginAccount || '').trim() ||
      loginEmail.split('@')[0] ||
      businessEmail.split('@')[0] ||
      employeeNo.toLowerCase(),
    loginPassword:
      String(member.loginPassword || '').trim() ||
      buildCustomerAccountPassword({
        name: member.name,
        employeeNo,
        loginEmail,
        businessEmail,
      }),
    visibleInDocuments: member.visibleInDocuments ?? member.role !== 'Viewer',
    permissions:
      Array.isArray(member.permissions) && member.permissions.length > 0
        ? member.permissions
        : CUSTOMER_ENTERPRISE_ROLE_PERMISSION_KEYS[member.role],
  };
}

function normalizeCustomerMembers(members: CustomerTeamMember[]) {
  return members.map((member, index) => normalizeCustomerMember(member, index));
}

function getCustomerAccessLifecycleStatus(member: CustomerTeamMember): CustomerAccessStatusCode {
  if (!member.canLogin) return member.status === 'suspended' ? 'disabled' : '未开通';
  if (member.status === 'suspended') return 'disabled';

  const inviteExpiresAt = member.inviteExpiresAt ? new Date(member.inviteExpiresAt) : null;
  if (inviteExpiresAt && !Number.isNaN(inviteExpiresAt.getTime()) && member.status === 'invited') {
    if (inviteExpiresAt.getTime() <= Date.now()) return 'expired';
    if (inviteExpiresAt.getTime() - Date.now() <= 72 * 60 * 60 * 1000) return 'expiring';
  }

  if (member.status === 'invited') return 'pending_activation';
  if (member.activatedAt || member.status === 'active') return 'activated';
  return 'active';
}

function getCustomerAccessStatusCode(member: CustomerTeamMember): CustomerAccessStatusCode {
  if (!member.canLogin) return member.status === 'suspended' ? 'disabled' : '未开通';
  if (member.status === 'invited') return 'pending_activation';
  if (member.status === 'suspended') return 'disabled';
  return 'active';
}

function buildCustomerLinkedCenterRows(
  members: CustomerTeamMember[],
  copy: CustomerMasterDataCopy['contacts'],
): CustomerLinkedCenterRow[] {
  return normalizeCustomerMembers(members).map((member) => ({
    id: member.id,
    member,
    employeeNo: member.employeeNo || '—',
    department: member.department || '未设置部门',
    title: member.title || '未设置岗位',
    regionCode: member.region || 'all',
    regionLabel: formatPersonRegion(member.region),
    phone: member.phone || '—',
    email: member.businessEmail || member.loginEmail || '—',
    wechat: member.wechat || '—',
    statusLabel: member.status === 'suspended' ? '停用' : '在职',
    username:
      member.loginAccount ||
      member.loginEmail.split('@')[0] ||
      member.businessEmail.split('@')[0] ||
      '未开通',
    loginEmail: member.loginEmail || '—',
    lastLoginAt: member.lastLogin || '—',
    accountStatusCode: getCustomerAccessStatusCode(member),
    lifecycleStatusCode: getCustomerAccessLifecycleStatus(member),
    permissionRole: {
      code: member.role,
      name: copy.roleLabels[member.role],
    },
  }));
}

function compareText(a: string, b: string) {
  return String(a || '').localeCompare(String(b || ''), 'zh-CN');
}

function sortRows<T>(
  rows: T[],
  getValue: (row: T) => string | number | boolean,
  direction: 'asc' | 'desc',
) {
  const factor = direction === 'asc' ? 1 : -1;
  return [...rows].sort((left, right) => {
    const leftValue = getValue(left);
    const rightValue = getValue(right);
    if (typeof leftValue === 'number' && typeof rightValue === 'number') return (leftValue - rightValue) * factor;
    if (typeof leftValue === 'boolean' && typeof rightValue === 'boolean') return (Number(leftValue) - Number(rightValue)) * factor;
    return compareText(String(leftValue), String(rightValue)) * factor;
  });
}

function mergeCustomerMemberCollections(
  primaryMembers: CustomerTeamMember[],
  fallbackMembers: CustomerTeamMember[],
) {
  const fallbackByKey = new Map<string, CustomerTeamMember>();
  fallbackMembers.forEach((member) => {
    const key = String(member.id || member.loginEmail || '').trim().toLowerCase();
    if (key) fallbackByKey.set(key, member);
  });

  return normalizeCustomerMembers(
    primaryMembers.map((member, index) => {
      const fallback =
        fallbackByKey.get(String(member.id || '').trim().toLowerCase()) ||
        fallbackByKey.get(String(member.loginEmail || '').trim().toLowerCase());

      if (!fallback) return normalizeCustomerMember(member, index);

      return normalizeCustomerMember(
        {
          ...fallback,
          ...member,
          employeeNo: member.employeeNo || fallback.employeeNo,
          managerId: member.managerId || fallback.managerId,
          department: member.department || fallback.department,
          title: member.title || fallback.title,
          region: member.region || fallback.region,
          phone: member.phone || fallback.phone,
          businessEmail: member.businessEmail || fallback.businessEmail,
          wechat: member.wechat || fallback.wechat,
          visibleInDocuments: member.visibleInDocuments ?? fallback.visibleInDocuments,
          loginAccount: member.loginAccount || fallback.loginAccount,
          authMode: member.authMode || fallback.authMode,
          primaryIdentitySource: member.primaryIdentitySource || fallback.primaryIdentitySource,
          loginPassword: member.loginPassword || fallback.loginPassword,
          forcePasswordReset: member.forcePasswordReset ?? fallback.forcePasswordReset,
          emailVerified: member.emailVerified ?? fallback.emailVerified,
          phoneVerified: member.phoneVerified ?? fallback.phoneVerified,
          inviteSentAt: member.inviteSentAt || fallback.inviteSentAt,
          inviteExpiresAt: member.inviteExpiresAt || fallback.inviteExpiresAt,
          activatedAt: member.activatedAt || fallback.activatedAt,
          notes: member.notes || fallback.notes,
        },
        index,
      );
    }),
  );
}

export default function CustomerContactsAndAccountsCenter({
  copy = defaultCopy,
  rtl = false,
}: {
  copy?: CustomerMasterDataCopy['contacts'];
  rtl?: boolean;
}) {
  const { user } = useUser();
  const permissionMap = useMemo(() => getRolePermissionMap(copy), [copy]);
  const roleOptions = useMemo(() => getRoleOptions(copy), [copy]);
  const [members, setMembers] = useState<CustomerTeamMember[]>([]);
  const [invitations, setInvitations] = useState<Record<string, CustomerInvitationRecord>>({});
  const [activeSubTab, setActiveSubTab] = useState<'people' | 'access' | 'roles'>('people');
  const [peopleViewMode, setPeopleViewMode] = useState<'list' | 'org'>('list');
  const [isPeopleEdit, setIsPeopleEdit] = useState(false);
  const [isPeopleSaving, setIsPeopleSaving] = useState(false);
  const [draggingMemberId, setDraggingMemberId] = useState<string | null>(null);
  const [dragOverMemberId, setDragOverMemberId] = useState<string | null>(null);
  const [peopleDraftRows, setPeopleDraftRows] = useState<CustomerTeamMember[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [peopleSearch, setPeopleSearch] = useState('');
  const [peopleDepartmentFilter, setPeopleDepartmentFilter] = useState('all');
  const [peopleStatusFilter, setPeopleStatusFilter] = useState<'all' | '在职' | '离职' | '停用'>('all');
  const [accessSearch, setAccessSearch] = useState('');
  const [accessDepartmentFilter, setAccessDepartmentFilter] = useState('all');
  const [accessRegionFilter, setAccessRegionFilter] = useState('all');
  const [accessStatusFilter, setAccessStatusFilter] = useState<'all' | CustomerAccessStatusCode>('all');
  const [roleSearch, setRoleSearch] = useState('');
  const [roleDepartmentFilter, setRoleDepartmentFilter] = useState('all');
  const [roleStatusFilter, setRoleStatusFilter] = useState<'all' | '在职' | '离职' | '停用'>('all');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [detailView, setDetailView] = useState<'people' | 'access' | null>(null);
  const [roleEditorMemberId, setRoleEditorMemberId] = useState('');
  const [roleEditorCode, setRoleEditorCode] = useState<CustomerAccountRole | ''>('');
  const [identityEditorOpen, setIdentityEditorOpen] = useState(false);
  const [identityDraft, setIdentityDraft] = useState({ loginAccount: '', loginEmail: '' });
  const [manualPasswordOpen, setManualPasswordOpen] = useState(false);
  const [manualPasswordDraft, setManualPasswordDraft] = useState('');
  const peopleTableContainerRef = useRef<HTMLDivElement | null>(null);
  const peopleColumnResizeRef = useRef<{ key: PeopleColumnKey; startX: number; startWidth: number } | null>(null);
  const accessTableContainerRef = useRef<HTMLDivElement | null>(null);
  const accessColumnResizeRef = useRef<{ key: AccessColumnKey; startX: number; startWidth: number } | null>(null);
  const roleTableContainerRef = useRef<HTMLDivElement | null>(null);
  const roleColumnResizeRef = useRef<{ key: RoleColumnKey; startX: number; startWidth: number } | null>(null);
  const [peopleColumnWidths, setPeopleColumnWidths] = useState<Record<PeopleColumnKey, number>>(() => {
    if (typeof window === 'undefined') return PEOPLE_TABLE_DEFAULT_WIDTHS;
    try {
      const stored = window.localStorage.getItem(CUSTOMER_PEOPLE_COLUMN_WIDTHS_KEY);
      if (!stored) return PEOPLE_TABLE_DEFAULT_WIDTHS;
      const parsed = JSON.parse(stored) as Partial<Record<PeopleColumnKey, number>>;
      return mergeStoredColumnWidths(PEOPLE_TABLE_DEFAULT_WIDTHS, parsed);
    } catch {
      return PEOPLE_TABLE_DEFAULT_WIDTHS;
    }
  });
  const [peopleHasCustomWidths, setPeopleHasCustomWidths] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return Boolean(window.localStorage.getItem(CUSTOMER_PEOPLE_COLUMN_WIDTHS_KEY));
    } catch {
      return false;
    }
  });
  const [accessColumnWidths, setAccessColumnWidths] = useState<Record<AccessColumnKey, number>>(() => {
    if (typeof window === 'undefined') return ACCESS_TABLE_DEFAULT_WIDTHS;
    try {
      const stored = window.localStorage.getItem(CUSTOMER_ACCESS_COLUMN_WIDTHS_KEY);
      if (!stored) return ACCESS_TABLE_DEFAULT_WIDTHS;
      const parsed = JSON.parse(stored) as Partial<Record<AccessColumnKey, number>>;
      return mergeStoredColumnWidths(ACCESS_TABLE_DEFAULT_WIDTHS, parsed);
    } catch {
      return ACCESS_TABLE_DEFAULT_WIDTHS;
    }
  });
  const [accessHasCustomWidths, setAccessHasCustomWidths] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return Boolean(window.localStorage.getItem(CUSTOMER_ACCESS_COLUMN_WIDTHS_KEY));
    } catch {
      return false;
    }
  });
  const [roleColumnWidths, setRoleColumnWidths] = useState<Record<RoleColumnKey, number>>(() => {
    if (typeof window === 'undefined') return ROLE_TABLE_DEFAULT_WIDTHS;
    try {
      const stored = window.localStorage.getItem(CUSTOMER_ROLE_COLUMN_WIDTHS_KEY);
      if (!stored) return ROLE_TABLE_DEFAULT_WIDTHS;
      const parsed = JSON.parse(stored) as Partial<Record<RoleColumnKey, number>>;
      return mergeStoredColumnWidths(ROLE_TABLE_DEFAULT_WIDTHS, parsed);
    } catch {
      return ROLE_TABLE_DEFAULT_WIDTHS;
    }
  });
  const [roleHasCustomWidths, setRoleHasCustomWidths] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return Boolean(window.localStorage.getItem(CUSTOMER_ROLE_COLUMN_WIDTHS_KEY));
    } catch {
      return false;
    }
  });
  const [draft, setDraft] = useState({
    name: '',
    title: '',
    businessEmail: '',
    loginEmail: '',
    role: DEFAULT_CUSTOMER_ENTERPRISE_ROLE as CustomerAccountRole,
  });
  const [peopleSortKey, setPeopleSortKey] = useState<PeopleColumnKey>('employeeNo');
  const [peopleSortDirection, setPeopleSortDirection] = useState<'asc' | 'desc'>('asc');
  const [accessSortKey, setAccessSortKey] = useState<AccessColumnKey>('employeeNo');
  const [accessSortDirection, setAccessSortDirection] = useState<'asc' | 'desc'>('asc');
  const [roleSortKey, setRoleSortKey] = useState<RoleColumnKey>('employeeNo');
  const [roleSortDirection, setRoleSortDirection] = useState<'asc' | 'desc'>('asc');

  const persistMembersLocally = (nextMembers: CustomerTeamMember[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeCustomerMembers(nextMembers)));
  };

  const mergeSeedMember = (nextMembers: CustomerTeamMember[], seed: CustomerTeamMember | null) => {
    if (!seed) return nextMembers;
    const hasSeed = nextMembers.some((member) => member.loginEmail === seed.loginEmail);
    return hasSeed ? normalizeCustomerMembers(nextMembers) : normalizeCustomerMembers([seed, ...nextMembers]);
  };

  const loadInvitationsForMembers = async (nextMembers: CustomerTeamMember[]) => {
    const inviteEntries = await Promise.all(
      nextMembers.map(async (member) => {
        try {
          const invitation = await customerEnterpriseInvitationService.getPendingByMemberId(member.id);
          if (!invitation) return null;
          return [
            member.id,
            {
              id: invitation.id,
              memberId: invitation.memberId,
              inviteUrl: invitation.inviteUrl,
              lastSentAt: invitation.lastSentAt,
              expiresAt: invitation.expiresAt,
              status: invitation.status,
            } satisfies CustomerInvitationRecord,
          ] as const;
        } catch (error) {
          console.warn('[CustomerContactsAndAccountsCenter] Failed to load invitation:', error);
          return null;
        }
      }),
    );

    const nextMap = Object.fromEntries(inviteEntries.filter(Boolean) as Array<readonly [string, CustomerInvitationRecord]>);
    setInvitations(nextMap);
  };

  const queuePendingMemberSync = (enterpriseAuthUserId: string, nextMembers: CustomerTeamMember[]) => {
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify({
      enterpriseAuthUserId,
      members: normalizeCustomerMembers(nextMembers),
      queuedAt: new Date().toISOString(),
    }));
  };

  const clearPendingMemberSync = () => {
    localStorage.removeItem(PENDING_SYNC_KEY);
  };

  const flushPendingMemberSync = async () => {
    if (!user?.id || user.type !== 'customer') return;
    const raw = localStorage.getItem(PENDING_SYNC_KEY);
    if (!raw) return;

    const pending = JSON.parse(raw) as {
      enterpriseAuthUserId?: string;
      members?: CustomerTeamMember[];
    };

    if (pending.enterpriseAuthUserId !== user.id || !Array.isArray(pending.members)) {
      return;
    }

    await customerEnterpriseMemberService.replaceAllByEnterpriseAuthUser(user.id, pending.members);
    clearPendingMemberSync();
  };

  const saveMembers = async (
    nextMembers: CustomerTeamMember[],
    options?: { successMessage?: string; pendingMessage?: string; silentTimeout?: boolean; silentSuccess?: boolean },
  ) => {
    const normalizedMembers = normalizeCustomerMembers(nextMembers);
    setMembers(normalizedMembers);
    persistMembersLocally(normalizedMembers);

    if (!user?.id || user.type !== 'customer') {
      if (options?.successMessage && !options?.silentSuccess) toast.success(options.successMessage);
      return;
    }

    setSyncing(true);
    try {
      await customerEnterpriseMemberService.replaceAllByEnterpriseAuthUser(user.id, normalizedMembers);
      clearPendingMemberSync();
      if (options?.successMessage) toast.success(options.successMessage);
    } catch (error) {
      const message = String((error as Error)?.message || error || '');
      const isAbortError = message.includes('AbortError') || (error as Error)?.name === 'AbortError';
      const isTimeoutError = message.includes('timed out');
      if (isAbortError || isTimeoutError) {
        queuePendingMemberSync(user.id, normalizedMembers);
        if (!options?.silentTimeout) {
          toast.success(options?.pendingMessage || copy.messages.accessUpdatedQueued);
        }
        return;
      }
      toast.error(message || copy.messages.accessUpdatedQueued);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const seed = buildSeedMember(user, copy);

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setMembers(mergeSeedMember(normalizeCustomerMembers([...parsed] as CustomerTeamMember[]), seed));
        return;
      }
    } catch (error) {
      console.warn('[CustomerContactsAndAccountsCenter] Failed to read cache:', error);
    }

    setMembers(seed ? normalizeCustomerMembers([seed]) : []);
  }, [copy, user?.id, user?.email, user?.name]);

  useEffect(() => {
    let cancelled = false;
    const seed = buildSeedMember(user, copy);

    if (!user?.id || user.type !== 'customer') return undefined;

    void (async () => {
      try {
        await flushPendingMemberSync();
        const remoteMembers = await customerEnterpriseMemberService.listByEnterpriseAuthUser(user.id);
        if (cancelled) return;
        let cachedMembers: CustomerTeamMember[] = [];
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          const parsed = raw ? JSON.parse(raw) : [];
          cachedMembers = Array.isArray(parsed) ? (parsed as CustomerTeamMember[]) : [];
        } catch {
          cachedMembers = [];
        }
        const mergedRemoteMembers = mergeCustomerMemberCollections(
          normalizeCustomerMembers(remoteMembers as CustomerTeamMember[]),
          cachedMembers,
        );
        const nextMembers = mergeSeedMember(mergedRemoteMembers, seed);
        if (nextMembers.length > 0) {
          setMembers(nextMembers);
          persistMembersLocally(nextMembers);
          await loadInvitationsForMembers(nextMembers);
        }
      } catch (error) {
        console.warn('[CustomerContactsAndAccountsCenter] Failed to load cloud members:', error);
      }
    })();

    const handleOnline = () => {
      void flushPendingMemberSync().catch((error) => {
        console.warn('[CustomerContactsAndAccountsCenter] Pending member sync failed:', error);
      });
    };

    window.addEventListener('online', handleOnline);
    return () => {
      cancelled = true;
      window.removeEventListener('online', handleOnline);
    };
  }, [copy, user?.id, user?.type, user?.email, user?.name]);

  useEffect(() => {
    if (!peopleHasCustomWidths || typeof window === 'undefined') return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(CUSTOMER_PEOPLE_COLUMN_WIDTHS_KEY, JSON.stringify(peopleColumnWidths));
      } catch {
        // Ignore local preference persistence failures.
      }
    }, 200);
    return () => window.clearTimeout(timer);
  }, [peopleColumnWidths, peopleHasCustomWidths]);

  useEffect(() => {
    if (!accessHasCustomWidths || typeof window === 'undefined') return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(CUSTOMER_ACCESS_COLUMN_WIDTHS_KEY, JSON.stringify(accessColumnWidths));
      } catch {
        // Ignore local preference persistence failures.
      }
    }, 200);
    return () => window.clearTimeout(timer);
  }, [accessColumnWidths, accessHasCustomWidths]);

  useEffect(() => {
    if (!roleHasCustomWidths || typeof window === 'undefined') return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(CUSTOMER_ROLE_COLUMN_WIDTHS_KEY, JSON.stringify(roleColumnWidths));
      } catch {
        // Ignore local preference persistence failures.
      }
    }, 200);
    return () => window.clearTimeout(timer);
  }, [roleColumnWidths, roleHasCustomWidths]);

  useEffect(() => {
    if (peopleHasCustomWidths || !peopleTableContainerRef.current || typeof ResizeObserver === 'undefined') return;
    const element = peopleTableContainerRef.current;
    const applyAutoWidths = (width: number) => {
      setPeopleColumnWidths((current) => {
        const next = distributeColumnWidths(PEOPLE_COLUMN_KEYS, Math.max(width, PEOPLE_COLUMN_KEYS.length * TABLE_COLUMN_MIN_WIDTH));
        return JSON.stringify(current) === JSON.stringify(next) ? current : next;
      });
    };
    applyAutoWidths(element.clientWidth);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      applyAutoWidths(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [peopleHasCustomWidths]);

  useEffect(() => {
    if (accessHasCustomWidths || !accessTableContainerRef.current || typeof ResizeObserver === 'undefined') return;
    const element = accessTableContainerRef.current;
    const applyAutoWidths = (width: number) => {
      setAccessColumnWidths((current) => {
        const next = distributeColumnWidths(ACCESS_COLUMN_KEYS, Math.max(width, ACCESS_COLUMN_KEYS.length * TABLE_COLUMN_MIN_WIDTH));
        return JSON.stringify(current) === JSON.stringify(next) ? current : next;
      });
    };
    applyAutoWidths(element.clientWidth);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      applyAutoWidths(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [accessHasCustomWidths]);

  useEffect(() => {
    if (roleHasCustomWidths || !roleTableContainerRef.current || typeof ResizeObserver === 'undefined') return;
    const element = roleTableContainerRef.current;
    const applyAutoWidths = (width: number) => {
      setRoleColumnWidths((current) => {
        const next = distributeColumnWidths(ROLE_COLUMN_KEYS, Math.max(width, ROLE_COLUMN_KEYS.length * TABLE_COLUMN_MIN_WIDTH));
        return JSON.stringify(current) === JSON.stringify(next) ? current : next;
      });
    };
    applyAutoWidths(element.clientWidth);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      applyAutoWidths(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [roleHasCustomWidths]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (peopleColumnResizeRef.current) {
        const { key, startX, startWidth } = peopleColumnResizeRef.current;
        const nextWidth = Math.max(TABLE_COLUMN_MIN_WIDTH, Math.round(startWidth + (event.clientX - startX)));
        setPeopleColumnWidths((current) => (
          current[key] === nextWidth ? current : { ...current, [key]: nextWidth }
        ));
        return;
      }

      if (accessColumnResizeRef.current) {
        const { key, startX, startWidth } = accessColumnResizeRef.current;
        const nextWidth = Math.max(TABLE_COLUMN_MIN_WIDTH, Math.round(startWidth + (event.clientX - startX)));
        setAccessColumnWidths((current) => (
          current[key] === nextWidth ? current : { ...current, [key]: nextWidth }
        ));
        return;
      }

      if (roleColumnResizeRef.current) {
        const { key, startX, startWidth } = roleColumnResizeRef.current;
        const nextWidth = Math.max(TABLE_COLUMN_MIN_WIDTH, Math.round(startWidth + (event.clientX - startX)));
        setRoleColumnWidths((current) => (
          current[key] === nextWidth ? current : { ...current, [key]: nextWidth }
        ));
      }
    };

    const stopResize = () => {
      peopleColumnResizeRef.current = null;
      accessColumnResizeRef.current = null;
      roleColumnResizeRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResize);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResize);
    };
  }, []);

  const inviteMember = () => {
    if (!draft.name.trim() || !draft.loginEmail.trim()) {
      toast.error(copy.messages.nameAndLoginRequired);
      return;
    }

    const employeeNo = String(members.length + 1).padStart(3, '0');
    const loginEmail = draft.loginEmail.trim().toLowerCase();
    const businessEmail = draft.businessEmail.trim() || loginEmail;
    const nextMember: CustomerTeamMember = {
      id: `member-${Date.now()}`,
      employeeNo,
      name: draft.name.trim(),
      managerId: '',
      department: '采购部',
      title: draft.title.trim() || copy.messages.teamMemberFallback,
      region: 'all',
      phone: '',
      businessEmail,
      wechat: '',
      loginEmail,
      role: draft.role,
      status: 'invited',
      visibleInDocuments: draft.role !== 'Viewer',
      canLogin: true,
      lastLogin: copy.messages.invitationPending,
      permissions: permissionMap[draft.role],
      loginAccount: loginEmail.split('@')[0] || loginEmail,
      authMode: 'formal',
      primaryIdentitySource: 'email',
      loginPassword: buildCustomerAccountPassword({
        name: draft.name.trim(),
        employeeNo,
        loginEmail,
        businessEmail,
      }),
      forcePasswordReset: false,
      emailVerified: false,
      phoneVerified: false,
      inviteSentAt: new Date().toISOString(),
      inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      notes: '',
    };

    const nextMembers = [nextMember, ...members];
    void saveMembers(nextMembers, {
      successMessage: copy.messages.memberInvited,
      pendingMessage: copy.messages.memberInvitedQueued,
    });

    if (user?.id && user.type === 'customer') {
      void (async () => {
        try {
          const invitation = await customerEnterpriseInvitationService.createOrRefreshInvitation({
            enterpriseAuthUserId: user.id,
            memberId: nextMember.id,
            loginEmail: nextMember.loginEmail,
            businessEmail: nextMember.businessEmail,
            role: nextMember.role,
            invitedByEmail: user.email || '',
          });
          setInvitations((prev) => ({
            ...prev,
            [nextMember.id]: {
              id: invitation.id,
              memberId: invitation.memberId,
              inviteUrl: invitation.inviteUrl,
              lastSentAt: invitation.lastSentAt,
              expiresAt: invitation.expiresAt,
              status: invitation.status,
            },
          }));
          await navigator.clipboard.writeText(invitation.inviteUrl);
          toast.success(copy.messages.invitationCopied);
        } catch (error) {
          console.warn('[CustomerContactsAndAccountsCenter] Failed to create invitation:', error);
          toast.error(String((error as Error)?.message || error || copy.messages.invitationCreateFailed));
        }
      })();
    }

    setDraft({
      name: '',
      title: '',
      businessEmail: '',
      loginEmail: '',
      role: DEFAULT_CUSTOMER_ENTERPRISE_ROLE,
    });
    setShowInvite(false);
  };

  const updateMember = (memberId: string, patch: Partial<CustomerTeamMember>) => {
    const nextMembers = members.map((member) => (
      member.id === memberId
        ? {
            ...member,
            ...patch,
            permissions: patch.role ? permissionMap[patch.role] : member.permissions,
          }
        : member
    ));

    void saveMembers(nextMembers, {
      successMessage: copy.messages.accessUpdated,
      pendingMessage: copy.messages.accessUpdatedQueued,
    });
  };

  const resendInvitation = (member: CustomerTeamMember) => {
    if (!user?.id || user.type !== 'customer') {
      toast.error(copy.messages.resendRequiresCustomer);
      return;
    }

    void (async () => {
      try {
        const invitation = await customerEnterpriseInvitationService.createOrRefreshInvitation({
          enterpriseAuthUserId: user.id,
          memberId: member.id,
          loginEmail: member.loginEmail,
          businessEmail: member.businessEmail,
          role: member.role,
          invitedByEmail: user.email || '',
        });
        setInvitations((prev) => ({
          ...prev,
          [member.id]: {
            id: invitation.id,
            memberId: invitation.memberId,
            inviteUrl: invitation.inviteUrl,
            lastSentAt: invitation.lastSentAt,
            expiresAt: invitation.expiresAt,
            status: invitation.status,
          },
        }));
        await navigator.clipboard.writeText(invitation.inviteUrl);
        toast.success(`${copy.messages.resendCopied} ${member.loginEmail}`);
      } catch (error) {
        toast.error(String((error as Error)?.message || error || copy.messages.resendFailed));
      }
    })();
  };

  const copyInvitationLink = async (memberId: string) => {
    const invitation = invitations[memberId];
    if (!invitation?.inviteUrl) {
      toast.error(copy.messages.inviteLinkNotReady);
      return;
    }
    await navigator.clipboard.writeText(invitation.inviteUrl);
    toast.success(copy.messages.inviteLinkCopied);
  };

  const linkedRows = useMemo(() => buildCustomerLinkedCenterRows(members, copy), [copy, members]);

  const peopleDepartmentOptions = useMemo(
    () => Array.from(new Set(linkedRows.map((row) => row.department).filter(Boolean))),
    [linkedRows],
  );
  const accessDepartmentOptions = peopleDepartmentOptions;
  const accessRegionOptions = useMemo(
    () => Array.from(new Set(linkedRows.map((row) => row.regionCode).filter(Boolean))),
    [linkedRows],
  );
  const roleDepartmentOptions = peopleDepartmentOptions;

  const filteredPeopleRows = useMemo(() => {
    const term = peopleSearch.trim().toLowerCase();
    return linkedRows.filter((row) => {
      const matchesTerm =
        !term ||
        `${row.member.name} ${row.employeeNo} ${row.email} ${row.department}`.toLowerCase().includes(term);
      const matchesDepartment = peopleDepartmentFilter === 'all' || row.department === peopleDepartmentFilter;
      const matchesStatus = peopleStatusFilter === 'all' || row.statusLabel === peopleStatusFilter;
      return matchesTerm && matchesDepartment && matchesStatus;
    });
  }, [linkedRows, peopleDepartmentFilter, peopleSearch, peopleStatusFilter]);

  const filteredAccessRows = useMemo(() => {
    const term = accessSearch.trim().toLowerCase();
    return linkedRows.filter((row) => {
      const matchesTerm =
        !term ||
        `${row.member.name} ${row.employeeNo} ${row.loginEmail} ${row.department} ${row.title} ${row.permissionRole.code} ${row.permissionRole.name}`.toLowerCase().includes(term);
      const matchesDepartment = accessDepartmentFilter === 'all' || row.department === accessDepartmentFilter;
      const matchesRegion = accessRegionFilter === 'all' || row.regionCode === accessRegionFilter;
      const matchesStatus =
        accessStatusFilter === 'all' ||
        (
          accessStatusFilter === 'active'
            ? row.accountStatusCode === 'active'
            : accessStatusFilter === 'disabled'
              ? row.accountStatusCode === 'disabled'
              : accessStatusFilter === 'locked'
                ? row.accountStatusCode === 'locked'
                : accessStatusFilter === '未开通'
                  ? row.accountStatusCode === '未开通'
                  : row.lifecycleStatusCode === accessStatusFilter
        );
      return matchesTerm && matchesDepartment && matchesRegion && matchesStatus;
    });
  }, [accessDepartmentFilter, accessRegionFilter, accessSearch, accessStatusFilter, linkedRows]);

  const filteredRoleRows = useMemo(() => {
    const term = roleSearch.trim().toLowerCase();
    return linkedRows.filter((row) => {
      const matchesTerm =
        !term ||
        `${row.member.name} ${row.employeeNo} ${row.permissionRole.code} ${row.department}`.toLowerCase().includes(term);
      const matchesDepartment = roleDepartmentFilter === 'all' || row.department === roleDepartmentFilter;
      const matchesStatus = roleStatusFilter === 'all' || row.statusLabel === roleStatusFilter;
      return matchesTerm && matchesDepartment && matchesStatus;
    });
  }, [linkedRows, roleDepartmentFilter, roleSearch, roleStatusFilter]);

  const sortedPeopleRows = useMemo(() => {
    return sortRows(filteredPeopleRows, (row) => {
      switch (peopleSortKey) {
        case 'employeeNo': return row.employeeNo;
        case 'name': return row.member.name;
        case 'department': return row.department;
        case 'title': return row.title;
        case 'region': return row.regionLabel;
        case 'phone': return row.phone;
        case 'email': return row.email;
        case 'status': return row.statusLabel;
        case 'visibleInDocuments': return row.member.visibleInDocuments ?? true;
        default: return row.employeeNo;
      }
    }, peopleSortDirection);
  }, [filteredPeopleRows, peopleSortDirection, peopleSortKey]);

  const sortedAccessRows = useMemo(() => {
    return sortRows(filteredAccessRows, (row) => {
      switch (accessSortKey) {
        case 'name': return row.member.name;
        case 'employeeNo': return row.employeeNo;
        case 'department': return row.department;
        case 'title': return row.title;
        case 'region': return row.regionLabel;
        case 'username': return row.username;
        case 'email': return row.loginEmail;
        case 'accountStatus': return row.accountStatusCode;
        case 'security': return row.member.loginPassword || '';
        case 'role': return row.permissionRole.name;
        case 'lastLoginAt': return row.lastLoginAt;
        default: return row.employeeNo;
      }
    }, accessSortDirection);
  }, [accessSortDirection, accessSortKey, filteredAccessRows]);

  const sortedRoleRows = useMemo(() => {
    return sortRows(filteredRoleRows, (row) => {
      switch (roleSortKey) {
        case 'name': return row.member.name;
        case 'employeeNo': return row.employeeNo;
        case 'department': return row.department;
        case 'title': return row.title;
        case 'roleName': return row.permissionRole.name;
        case 'roleCode': return row.permissionRole.code;
        case 'description': return resolveRoleDescription(row.member, copy);
        default: return row.employeeNo;
      }
    }, roleSortDirection);
  }, [copy, filteredRoleRows, roleSortDirection, roleSortKey]);

  const metrics = useMemo(() => {
    const total = members.length;
    const active = members.filter((member) => member.status === 'active').length;
    const loginEnabled = members.filter((member) => member.canLogin).length;
    const owners = members.filter((member) => member.role === 'Owner').length;
    return { total, active, loginEnabled, owners };
  }, [members]);

  const accessMetrics = useMemo(() => {
    const pendingInvites = members.filter((member) => member.status === 'invited').length;
    const suspended = members.filter((member) => member.status === 'suspended').length;
    const sessionBound = members.filter((member) => member.loginEmail === user?.email).length;
    return { pendingInvites, suspended, sessionBound };
  }, [members, user?.email]);

  const peopleOrgRows = useMemo(() => (
    buildOrgStructureEntries(
      sortedPeopleRows.map((row) => ({
        id: row.id,
        employeeNo: row.employeeNo,
        name: row.member.name,
        department: row.department,
        title: row.title,
        managerId: row.member.managerId || '',
        member: row.member,
        regionLabel: row.regionLabel,
        phone: row.phone,
        email: row.email,
        wechat: row.wechat,
        statusLabel: row.statusLabel,
        visibleInDocuments: row.member.visibleInDocuments ?? true,
      })),
    ).map((entry) => ({
      ...entry,
      displayEmployeeNo: entry.row.employeeNo,
    }))
  ), [sortedPeopleRows]);

  const getLinkedRow = (member: CustomerTeamMember) => linkedRows.find((row) => row.id === member.id);
  const getEmployeeNo = (member: CustomerTeamMember) => getLinkedRow(member)?.employeeNo || getDefaultEmployeeNo(members.findIndex((item) => item.id === member.id));
  const getLoginAccount = (member: CustomerTeamMember) => getLinkedRow(member)?.username || member.loginAccount || member.loginEmail.split('@')[0] || member.loginEmail;
  const getMemberDepartment = (member: CustomerTeamMember) => getLinkedRow(member)?.department || ROLE_DEFAULTS[member.role].department;
  const getMemberRegion = (member: CustomerTeamMember) => getLinkedRow(member)?.regionLabel || formatPersonRegion(member.region);
  const getMemberPhone = (member: CustomerTeamMember) => getLinkedRow(member)?.phone || '—';
  const getMemberWechat = (member: CustomerTeamMember) => getLinkedRow(member)?.wechat || '—';
  const getMemberStatusText = (member: CustomerTeamMember) => getLinkedRow(member)?.statusLabel || '在职';
  const isVisibleInDocuments = (member: CustomerTeamMember) => normalizeCustomerMember(member, members.findIndex((item) => item.id === member.id)).visibleInDocuments ?? true;
  const filteredInviteActionRows = useMemo(
    () => sortedAccessRows.filter((row) => ['pending_activation', 'expiring', 'expired'].includes(row.lifecycleStatusCode)),
    [sortedAccessRows],
  );
  const filteredActivatedRows = useMemo(
    () => sortedAccessRows.filter((row) => row.lifecycleStatusCode === 'activated'),
    [sortedAccessRows],
  );
  const toggleSortState = <T extends string>(
    key: T,
    currentKey: T,
    currentDirection: 'asc' | 'desc',
    setKey: (value: T) => void,
    setDirection: (value: 'asc' | 'desc') => void,
  ) => {
    if (key === currentKey) {
      setDirection(currentDirection === 'asc' ? 'desc' : 'asc');
      return;
    }
    setKey(key);
    setDirection('asc');
  };
  const renderSortHint = (active: boolean, direction: 'asc' | 'desc') => (
    <span className={active ? 'text-red-400' : 'text-slate-300'}>{active ? (direction === 'asc' ? '↑' : '↓') : '↑↓'}</span>
  );
  const peopleManagerOptions = members.map((member) => ({ id: member.id, label: `${member.name} / ${getEmployeeNo(member)}` }));
  const peopleTableMinWidth = useMemo(
    () => PEOPLE_COLUMN_KEYS.reduce((sum, key) => sum + peopleColumnWidths[key], 0),
    [peopleColumnWidths],
  );
  const startPeopleColumnResize = (key: PeopleColumnKey, event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setPeopleHasCustomWidths(true);
    peopleColumnResizeRef.current = {
      key,
      startX: event.clientX,
      startWidth: peopleColumnWidths[key],
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };
  const shrinkPeopleColumnToMinimum = (key: PeopleColumnKey, event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setPeopleHasCustomWidths(true);
    setPeopleColumnWidths((current) => (
      current[key] === TABLE_COLUMN_MIN_WIDTH ? current : { ...current, [key]: TABLE_COLUMN_MIN_WIDTH }
    ));
  };
  const renderPeopleColumnResizeHandle = (key: PeopleColumnKey) => renderColumnResizeHandle(
    key,
    startPeopleColumnResize,
    shrinkPeopleColumnToMinimum,
  );
  const getPeopleColumnStyle = (key: PeopleColumnKey) => getColumnStyle(peopleColumnWidths, key);
  const accessTableMinWidth = useMemo(
    () => ACCESS_COLUMN_KEYS.reduce((sum, key) => sum + accessColumnWidths[key], 0),
    [accessColumnWidths],
  );
  const startAccessColumnResize = (key: AccessColumnKey, event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setAccessHasCustomWidths(true);
    accessColumnResizeRef.current = {
      key,
      startX: event.clientX,
      startWidth: accessColumnWidths[key],
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };
  const shrinkAccessColumnToMinimum = (key: AccessColumnKey, event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setAccessHasCustomWidths(true);
    setAccessColumnWidths((current) => (
      current[key] === TABLE_COLUMN_MIN_WIDTH ? current : { ...current, [key]: TABLE_COLUMN_MIN_WIDTH }
    ));
  };
  const renderAccessColumnResizeHandle = (key: AccessColumnKey) => renderColumnResizeHandle(
    key,
    startAccessColumnResize,
    shrinkAccessColumnToMinimum,
  );
  const getAccessColumnStyle = (key: AccessColumnKey) => getColumnStyle(accessColumnWidths, key);
  const roleTableMinWidth = useMemo(
    () => ROLE_COLUMN_KEYS.reduce((sum, key) => sum + roleColumnWidths[key], 0),
    [roleColumnWidths],
  );
  const startRoleColumnResize = (key: RoleColumnKey, event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setRoleHasCustomWidths(true);
    roleColumnResizeRef.current = {
      key,
      startX: event.clientX,
      startWidth: roleColumnWidths[key],
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };
  const shrinkRoleColumnToMinimum = (key: RoleColumnKey, event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setRoleHasCustomWidths(true);
    setRoleColumnWidths((current) => (
      current[key] === TABLE_COLUMN_MIN_WIDTH ? current : { ...current, [key]: TABLE_COLUMN_MIN_WIDTH }
    ));
  };
  const renderRoleColumnResizeHandle = (key: RoleColumnKey) => renderColumnResizeHandle(
    key,
    startRoleColumnResize,
    shrinkRoleColumnToMinimum,
    {
      hidden: key === 'actions',
      lineHoverClassName: 'group-hover:bg-slate-500',
      showKnob: true,
      knobHoverClassName: 'group-hover:bg-slate-500',
    },
  );
  const getRoleColumnStyle = (key: RoleColumnKey) => getColumnStyle(roleColumnWidths, key);
  const selectedMember = members.find((member) => member.id === selectedMemberId) || null;
  const roleEditorMember = members.find((member) => member.id === roleEditorMemberId) || null;
  const signedInMember = members.find((member) => member.loginEmail === user?.email) || null;
  const selectedInvitation = selectedMember ? invitations[selectedMember.id] : null;
  const openRoleEditor = (member: CustomerTeamMember) => {
    setRoleEditorMemberId(member.id);
    setRoleEditorCode(member.role);
  };

  const closeAccessDetail = () => {
    setDetailView(null);
    setIdentityEditorOpen(false);
    setManualPasswordOpen(false);
    setManualPasswordDraft('');
  };

  const openIdentityEditor = (member: CustomerTeamMember) => {
    setIdentityDraft({
      loginAccount: getLoginAccount(member),
      loginEmail: member.loginEmail,
    });
    setIdentityEditorOpen(true);
  };

  const saveIdentityEditor = () => {
    if (!selectedMember) return;
    const loginAccount = identityDraft.loginAccount.trim();
    const loginEmail = identityDraft.loginEmail.trim().toLowerCase();
    if (!loginAccount || !loginEmail) {
      toast.error('登录账号和登录邮箱不能为空');
      return;
    }
    updateMember(selectedMember.id, { loginAccount, loginEmail });
    setIdentityEditorOpen(false);
    toast.success('账号标识已更新');
  };

  const openManualPasswordDialog = (member: CustomerTeamMember) => {
    setManualPasswordDraft(member.loginPassword || '');
    setManualPasswordOpen(true);
  };

  const saveManualPassword = () => {
    if (!selectedMember) return;
    const nextPassword = manualPasswordDraft.trim();
    if (!nextPassword) {
      toast.error('请输入密码');
      return;
    }
    updateMember(selectedMember.id, { loginPassword: nextPassword });
    setManualPasswordOpen(false);
    toast.success('已手动设定密码');
  };

  const activateMemberAccount = (member: CustomerTeamMember) => {
    const loginPassword = buildCustomerAccountPassword({
      name: member.name,
      employeeNo: getEmployeeNo(member),
      loginEmail: member.loginEmail,
      businessEmail: member.businessEmail,
    });
    updateMember(member.id, {
      canLogin: true,
      status: member.status === 'suspended' ? 'active' : member.status,
      loginAccount: getLoginAccount(member),
      authMode: member.authMode || 'formal',
      loginPassword,
    });
    toast.success(`已开通 ${member.name} 的账号`);
  };

  const issueFormalActivation = (member: CustomerTeamMember) => {
    const issuedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const loginPassword = buildCustomerAccountPassword({
      name: member.name,
      employeeNo: getEmployeeNo(member),
      loginEmail: member.loginEmail,
      businessEmail: member.businessEmail,
    });
    updateMember(member.id, {
      canLogin: true,
      status: 'invited',
      inviteSentAt: issuedAt,
      inviteExpiresAt: expiresAt,
      primaryIdentitySource: member.primaryIdentitySource || 'email',
      loginPassword,
    });
    setInvitations((prev) => ({
      ...prev,
      [member.id]: {
        ...(prev[member.id] || {
          id: `invite-${member.id}`,
          memberId: member.id,
          inviteUrl: '',
        }),
        lastSentAt: issuedAt,
        expiresAt,
        status: 'pending',
      },
    }));
    resendInvitation(member);
  };

  const markIdentityVerified = (member: CustomerTeamMember, channel: 'email' | 'phone') => {
    if (!member.canLogin) {
      toast.info('请先开通账号，再标记认证状态');
      return;
    }
    updateMember(member.id, channel === 'email' ? { emailVerified: true } : { phoneVerified: true });
    toast.success(channel === 'email' ? '已标记邮箱为已验证' : '已标记手机为已验证');
  };

  const finalizeActivation = (member: CustomerTeamMember) => {
    if (!member.canLogin) {
      toast.info('请先开通账号，再完成正式激活');
      return;
    }
    const activatedAt = new Date().toISOString();
    updateMember(member.id, {
      status: 'active',
      activatedAt,
    });
    void (async () => {
      try {
        const invitation = await customerEnterpriseInvitationService.updateStatusByMemberId(member.id, 'accepted', {
          acceptedAt: activatedAt,
          linkedAuthUserId: member.linkedAuthUserId || null,
        });
        setInvitations((prev) => ({
          ...prev,
          [member.id]: invitation
            ? {
                id: invitation.id,
                memberId: invitation.memberId,
                inviteUrl: invitation.inviteUrl,
                lastSentAt: invitation.lastSentAt,
                expiresAt: invitation.expiresAt,
                status: invitation.status,
              }
            : prev[member.id],
        }));
      } catch (error) {
        console.warn('[CustomerContactsAndAccountsCenter] Failed to finalize customer invitation:', error);
      }
    })();
    toast.success(`已完成 ${member.name} 的正式激活`);
  };

  const invalidateActivationInvite = (member: CustomerTeamMember) => {
    updateMember(member.id, {
      status: 'suspended',
      canLogin: false,
      inviteExpiresAt: new Date().toISOString(),
    });
    const expiredAt = new Date().toISOString();
    setInvitations((prev) => ({
      ...prev,
      [member.id]: prev[member.id]
        ? { ...prev[member.id], status: 'expired', expiresAt: expiredAt }
        : prev[member.id],
    }));
    void (async () => {
      try {
        const invitation = await customerEnterpriseInvitationService.updateStatusByMemberId(member.id, 'expired');
        setInvitations((prev) => ({
          ...prev,
          [member.id]: invitation
            ? {
                id: invitation.id,
                memberId: invitation.memberId,
                inviteUrl: invitation.inviteUrl,
                lastSentAt: invitation.lastSentAt,
                expiresAt: invitation.expiresAt,
                status: invitation.status,
              }
            : prev[member.id],
        }));
      } catch (error) {
        console.warn('[CustomerContactsAndAccountsCenter] Failed to expire customer invitation:', error);
      }
    })();
    toast.success(`已使 ${member.name} 的邀请失效`);
  };

  const resetPassword = (member: CustomerTeamMember) => {
    if (!member.canLogin) {
      toast.info('请先开通账号，再重置密码');
      return;
    }
    const nextPassword = buildCustomerAccountPassword({
      name: member.name,
      employeeNo: getEmployeeNo(member),
      loginEmail: member.loginEmail,
      businessEmail: member.businessEmail,
    });
    updateMember(member.id, {
      loginPassword: nextPassword,
      forcePasswordReset: true,
    });
    toast.success('密码已重置，并要求下次登录改密');
  };

  const toggleForcePasswordReset = (member: CustomerTeamMember) => {
    updateMember(member.id, {
      forcePasswordReset: !member.forcePasswordReset,
    });
    toast.success(member.forcePasswordReset ? '已取消强制下次登录改密' : '已开启强制下次登录改密');
  };

  const batchResendActivation = async () => {
    if (!filteredInviteActionRows.length) {
      toast.info('当前没有待处理正式账号');
      return;
    }
    await Promise.all(filteredInviteActionRows.map(async (row) => resendInvitation(row.member)));
  };

  const batchInvalidateActivation = async () => {
    if (!filteredInviteActionRows.length) {
      toast.info('当前没有待失效的邀请');
      return;
    }
    filteredInviteActionRows.forEach((row) => invalidateActivationInvite(row.member));
  };

  const exportAccessList = () => {
    const header = ['姓名', '工号', '部门', '岗位', '登录账号', '登录邮箱', '认证轨道', '主认证方式', '激活状态', '发放时间', '失效时间'];
    const rows = sortedAccessRows.map((row) => [
      row.member.name,
      row.employeeNo,
      row.department,
      row.title,
      row.username,
      row.loginEmail,
      row.member.authMode === 'test' ? '测试轨' : '正式轨',
      row.member.primaryIdentitySource === 'phone' ? '手机' : '邮箱',
      row.lifecycleStatusCode,
      formatDateTime(invitations[row.id]?.lastSentAt || row.member.inviteSentAt),
      formatDateTime(invitations[row.id]?.expiresAt || row.member.inviteExpiresAt),
    ]);
    const csv = [header, ...rows]
      .map((line) => line.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'customer-access-list.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const accessStatusMeta = (member: CustomerTeamMember) => {
    const statusCode = getCustomerAccessStatusCode(member);
    if (statusCode === 'disabled') return { label: '已停用', className: 'border-rose-200 bg-rose-50 text-rose-700' };
    if (statusCode === '未开通') return { label: '未开通', className: 'border-amber-200 bg-amber-50 text-amber-700' };
    return { label: '已启用', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
  };

  const activationStatusMeta = (member: CustomerTeamMember) => {
    const lifecycleStatus = getCustomerAccessLifecycleStatus(member);
    if (lifecycleStatus === 'activated') return { label: '已激活', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
    if (lifecycleStatus === 'pending_activation') return { label: '待激活', className: 'border-sky-200 bg-sky-50 text-sky-700' };
    if (lifecycleStatus === 'expiring') return { label: '即将过期', className: 'border-amber-200 bg-amber-50 text-amber-700' };
    if (lifecycleStatus === 'expired') return { label: '已过期', className: 'border-rose-200 bg-rose-50 text-rose-700' };
    return { label: '待处理', className: 'border-slate-200 bg-slate-50 text-slate-600' };
  };

  const saveRoleEditor = () => {
    if (!roleEditorMember || !roleEditorCode) return;
    updateMember(roleEditorMember.id, { role: roleEditorCode });
    toast.success(`已将 ${roleEditorMember.name} 的角色更新为 ${copy.roleLabels[roleEditorCode]}`);
    setRoleEditorMemberId('');
    setRoleEditorCode('');
  };

  const editablePeopleRows = isPeopleEdit ? peopleDraftRows : sortedPeopleRows.map((row) => row.member);

  const enterPeopleEdit = () => {
    setPeopleDraftRows(members.map((member) => ({ ...member, permissions: [...member.permissions] })));
    setIsPeopleEdit(true);
  };

  const cancelPeopleEdit = () => {
    setPeopleDraftRows([]);
    setIsPeopleEdit(false);
  };

  const savePeopleEdit = () => {
    const nextRows = peopleDraftRows.map((member) => ({ ...member, permissions: [...member.permissions] }));
    setIsPeopleSaving(true);
    setIsPeopleEdit(false);
    setMembers(nextRows);
    persistMembersLocally(nextRows);
    void saveMembers(nextRows, {
      successMessage: copy.messages.accessUpdated,
      pendingMessage: copy.messages.accessUpdatedQueued,
    }).finally(() => {
      setIsPeopleSaving(false);
    });
  };

  const updatePeopleDraft = (memberId: string, patch: Partial<CustomerTeamMember>) => {
    setPeopleDraftRows((prev) => prev.map((member) => (
      member.id === memberId
        ? {
            ...member,
            ...patch,
            permissions: patch.role ? permissionMap[patch.role] : member.permissions,
          }
        : member
    )));
  };

  const addPeopleDraftRow = () => {
    const nextId = `draft-member-${Date.now()}`;
    const nextMember: CustomerTeamMember = {
      id: nextId,
      employeeNo: String(peopleDraftRows.length + 1).padStart(3, '0'),
      name: '新成员',
      managerId: '',
      department: '采购部',
      title: '成员',
      region: 'all',
      phone: '',
      businessEmail: '',
      wechat: '',
      loginEmail: '',
      role: DEFAULT_CUSTOMER_ENTERPRISE_ROLE,
      status: 'active',
      visibleInDocuments: true,
      canLogin: true,
      lastLogin: '',
      permissions: permissionMap[DEFAULT_CUSTOMER_ENTERPRISE_ROLE],
      loginAccount: '',
      authMode: 'formal',
      primaryIdentitySource: 'email',
      loginPassword: '',
      forcePasswordReset: false,
      emailVerified: false,
      phoneVerified: false,
      notes: '',
    };
    setPeopleDraftRows((prev) => [...prev, nextMember]);
  };

  const removePeopleDraftRow = (memberId: string) => {
    setPeopleDraftRows((prev) => prev.filter((member) => member.id !== memberId));
  };

  const reorderRows = (rows: CustomerTeamMember[], sourceId: string, targetId: string) => {
    if (sourceId === targetId) return rows;
    const sourceIndex = rows.findIndex((member) => member.id === sourceId);
    const targetIndex = rows.findIndex((member) => member.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return rows;
    const next = [...rows];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    return next.map((member, index) => ({
      ...member,
      employeeNo: String(index + 1).padStart(3, '0'),
    }));
  };

  const moveRowToTop = (rows: CustomerTeamMember[], sourceId: string) => {
    const sourceIndex = rows.findIndex((member) => member.id === sourceId);
    if (sourceIndex < 0) return rows;
    const next = [...rows];
    const [moved] = next.splice(sourceIndex, 1);
    next.unshift({ ...moved, managerId: '' });
    return next.map((member, index) => ({
      ...member,
      employeeNo: String(index + 1).padStart(3, '0'),
    }));
  };

  const handleOrgDropToTop = () => {
    if (!draggingMemberId) return;
    const nextRows = moveRowToTop(members, draggingMemberId);
    setDraggingMemberId(null);
    setDragOverMemberId(null);
    setMembers(nextRows);
    persistMembersLocally(nextRows);
    void saveMembers(nextRows, {
      pendingMessage: copy.messages.accessUpdatedQueued,
      silentTimeout: true,
      silentSuccess: true,
    });
  };

  const handleOrgDrop = (targetId: string) => {
    if (!draggingMemberId || draggingMemberId === targetId) {
      setDraggingMemberId(null);
      setDragOverMemberId(null);
      return;
    }

    const nextRows = reorderRows(members, draggingMemberId, targetId);
    setDraggingMemberId(null);
    setDragOverMemberId(null);
    setMembers(nextRows);
    persistMembersLocally(nextRows);
    void saveMembers(nextRows, {
      pendingMessage: copy.messages.accessUpdatedQueued,
      silentTimeout: true,
      silentSuccess: true,
    });
  };

  return (
    <div className="space-y-4" dir={rtl ? 'rtl' : 'ltr'}>
      <div className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4">
            <div className="flex w-full items-stretch justify-between gap-6 overflow-x-auto">
              {[
                { key: 'people' as const, label: '人员主档', icon: <Users className="h-4 w-4" /> },
                { key: 'access' as const, label: '账号与访问', icon: <Lock className="h-4 w-4" /> },
                { key: 'roles' as const, label: '角色权限', icon: <Shield className="h-4 w-4" /> },
              ].map((item) => {
                const active = activeSubTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveSubTab(item.key)}
                    className="flex min-w-[220px] flex-1 items-center justify-center gap-2 border-b-2 px-4 py-2.5 text-[14px] font-semibold transition-colors"
                    style={{
                      borderBottomColor: active ? '#ef4444' : 'transparent',
                      color: active ? '#dc2626' : '#475569',
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3.5">
            {activeSubTab === 'people' && (
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
                      {[
                        { key: 'list' as const, label: '列表视图' },
                        { key: 'org' as const, label: '组织视图' },
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setPeopleViewMode(item.key)}
                          className={`rounded-md px-3 py-1 text-[12px] font-medium transition-colors ${
                            peopleViewMode === item.key ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex min-w-[240px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                      <Search className="h-3.5 w-3.5 text-slate-400" />
                      <input
                        value={peopleSearch}
                        onChange={(event) => setPeopleSearch(event.target.value)}
                        className="w-full bg-transparent text-[12px] text-slate-700 outline-none placeholder:text-slate-400"
                        placeholder="搜索姓名 / 工号 / 邮箱 / 部门"
                      />
                    </div>
                    <div className="relative">
                      <select
                        value={peopleDepartmentFilter}
                        onChange={(event) => setPeopleDepartmentFilter(event.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 pr-8 text-[11px] text-slate-600 outline-none transition-colors hover:border-slate-300 focus:border-red-300"
                      >
                        <option value="all">部门筛选</option>
                        {peopleDepartmentOptions.map((department) => (
                          <option key={department} value={department}>{department}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    </div>
                    <div className="relative">
                      <select
                        value={peopleStatusFilter}
                        onChange={(event) => setPeopleStatusFilter(event.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 pr-8 text-[11px] text-slate-600 outline-none transition-colors hover:border-slate-300 focus:border-red-300"
                      >
                        <option value="all">状态筛选</option>
                        <option value="在职">在职</option>
                        <option value="离职">离职</option>
                        <option value="停用">停用</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[12px] text-slate-500">保留人员基础属性，适合给单据、审批、人员目录和组织架构复用。</span>
                    {isPeopleEdit ? (
                      <>
                        <button
                          type="button"
                          onClick={cancelPeopleEdit}
                          disabled={isPeopleSaving}
                          className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
                        >
                          取消
                        </button>
                        <button
                          type="button"
                          onClick={savePeopleEdit}
                          disabled={isPeopleSaving}
                          className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-1.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Check className="h-3.5 w-3.5" />
                          {isPeopleSaving ? '保存中…' : '保存'}
                        </button>
                        <button
                          type="button"
                          onClick={addPeopleDraftRow}
                          disabled={isPeopleSaving}
                          className="inline-flex items-center rounded-lg bg-red-600 px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-red-700"
                        >
                          新增人员
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={enterPeopleEdit}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-1.5 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:border-slate-300"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        编辑 · Edit
                      </button>
                    )}
                  </div>
                </div>

                <div ref={peopleTableContainerRef} className="relative overflow-x-hidden rounded-xl border border-slate-200">
                  {peopleViewMode === 'org' && !isPeopleEdit && (
                    <div className={`pointer-events-none absolute left-3 right-3 top-10 z-10 transition-all ${draggingMemberId ? 'pointer-events-auto' : ''}`}>
                      <div
                        className={`text-center text-[11px] font-medium transition-all ${
                          draggingMemberId
                            ? 'rounded-lg border border-dashed border-slate-200 bg-slate-50/90 px-3 py-2 text-slate-400 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600'
                            : 'h-0 overflow-hidden border-0 px-0 py-0 opacity-0'
                        }`}
                        onDragOver={(event) => {
                          if (!draggingMemberId) return;
                          event.preventDefault();
                          setDragOverMemberId(null);
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          handleOrgDropToTop();
                        }}
                      >
                        拖到这里可置顶到第一位
                      </div>
                    </div>
                  )}
                  <table className="w-full table-fixed border-collapse text-[11px]">
                    <colgroup>
                      <col style={{ width: `${(peopleColumnWidths.employeeNo / Math.max(peopleTableMinWidth, 1)) * 100}%` }} />
                      <col style={{ width: `${(peopleColumnWidths.name / Math.max(peopleTableMinWidth, 1)) * 100}%` }} />
                      <col style={{ width: `${(peopleColumnWidths.department / Math.max(peopleTableMinWidth, 1)) * 100}%` }} />
                      <col style={{ width: `${(peopleColumnWidths.title / Math.max(peopleTableMinWidth, 1)) * 100}%` }} />
                      <col style={{ width: `${(peopleColumnWidths.region / Math.max(peopleTableMinWidth, 1)) * 100}%` }} />
                      <col style={{ width: `${(peopleColumnWidths.phone / Math.max(peopleTableMinWidth, 1)) * 100}%` }} />
                      <col style={{ width: `${(peopleColumnWidths.email / Math.max(peopleTableMinWidth, 1)) * 100}%` }} />
                      <col style={{ width: `${(peopleColumnWidths.wechat / Math.max(peopleTableMinWidth, 1)) * 100}%` }} />
                      <col style={{ width: `${(peopleColumnWidths.status / Math.max(peopleTableMinWidth, 1)) * 100}%` }} />
                      <col style={{ width: `${(peopleColumnWidths.visibleInDocuments / Math.max(peopleTableMinWidth, 1)) * 100}%` }} />
                      <col style={{ width: `${(peopleColumnWidths.actions / Math.max(peopleTableMinWidth, 1)) * 100}%` }} />
                    </colgroup>
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th style={getPeopleColumnStyle('employeeNo')} className="group relative border-b border-slate-200 px-3 py-2 text-left"><button type="button" onClick={() => toggleSortState('employeeNo', peopleSortKey, peopleSortDirection, setPeopleSortKey, setPeopleSortDirection)} className="inline-flex items-center gap-1 font-semibold text-slate-600">工号 {renderSortHint(peopleSortKey === 'employeeNo', peopleSortDirection)}</button>{renderPeopleColumnResizeHandle('employeeNo')}</th>
                        <th style={getPeopleColumnStyle('name')} className="group relative border-b border-slate-200 px-3 py-2 text-left"><button type="button" onClick={() => toggleSortState('name', peopleSortKey, peopleSortDirection, setPeopleSortKey, setPeopleSortDirection)} className="inline-flex items-center gap-1 font-semibold text-slate-600">姓名 {renderSortHint(peopleSortKey === 'name', peopleSortDirection)}</button>{renderPeopleColumnResizeHandle('name')}</th>
                        <th style={getPeopleColumnStyle('department')} className="group relative border-b border-slate-200 px-3 py-2 text-left"><button type="button" onClick={() => toggleSortState('department', peopleSortKey, peopleSortDirection, setPeopleSortKey, setPeopleSortDirection)} className="inline-flex items-center gap-1 font-semibold text-slate-600">部门 {renderSortHint(peopleSortKey === 'department', peopleSortDirection)}</button>{renderPeopleColumnResizeHandle('department')}</th>
                        <th style={getPeopleColumnStyle('title')} className="group relative border-b border-slate-200 px-3 py-2 text-left"><button type="button" onClick={() => toggleSortState('title', peopleSortKey, peopleSortDirection, setPeopleSortKey, setPeopleSortDirection)} className="inline-flex items-center gap-1 font-semibold text-slate-600">岗位 {renderSortHint(peopleSortKey === 'title', peopleSortDirection)}</button>{renderPeopleColumnResizeHandle('title')}</th>
                        <th style={getPeopleColumnStyle('region')} className="group relative border-b border-slate-200 px-3 py-2 text-left"><button type="button" onClick={() => toggleSortState('region', peopleSortKey, peopleSortDirection, setPeopleSortKey, setPeopleSortDirection)} className="inline-flex items-center gap-1 font-semibold text-slate-600">区域 {renderSortHint(peopleSortKey === 'region', peopleSortDirection)}</button>{renderPeopleColumnResizeHandle('region')}</th>
                        <th style={getPeopleColumnStyle('phone')} className="group relative border-b border-slate-200 px-3 py-2 text-left"><button type="button" onClick={() => toggleSortState('phone', peopleSortKey, peopleSortDirection, setPeopleSortKey, setPeopleSortDirection)} className="inline-flex items-center gap-1 font-semibold text-slate-600">手机 {renderSortHint(peopleSortKey === 'phone', peopleSortDirection)}</button>{renderPeopleColumnResizeHandle('phone')}</th>
                        <th style={getPeopleColumnStyle('email')} className="group relative border-b border-slate-200 px-3 py-2 text-left"><button type="button" onClick={() => toggleSortState('email', peopleSortKey, peopleSortDirection, setPeopleSortKey, setPeopleSortDirection)} className="inline-flex items-center gap-1 font-semibold text-slate-600">邮箱 {renderSortHint(peopleSortKey === 'email', peopleSortDirection)}</button>{renderPeopleColumnResizeHandle('email')}</th>
                        <th style={getPeopleColumnStyle('wechat')} className="group relative border-b border-slate-200 px-3 py-2 text-left">微信 / WhatsApp{renderPeopleColumnResizeHandle('wechat')}</th>
                        <th style={getPeopleColumnStyle('status')} className="group relative border-b border-slate-200 px-3 py-2 text-left"><button type="button" onClick={() => toggleSortState('status', peopleSortKey, peopleSortDirection, setPeopleSortKey, setPeopleSortDirection)} className="inline-flex items-center gap-1 font-semibold text-slate-600">状态 {renderSortHint(peopleSortKey === 'status', peopleSortDirection)}</button>{renderPeopleColumnResizeHandle('status')}</th>
                        <th style={getPeopleColumnStyle('visibleInDocuments')} className="group relative border-b border-slate-200 px-3 py-2 text-left"><button type="button" onClick={() => toggleSortState('visibleInDocuments', peopleSortKey, peopleSortDirection, setPeopleSortKey, setPeopleSortDirection)} className="inline-flex items-center gap-1 font-semibold text-slate-600">单据默认 {renderSortHint(peopleSortKey === 'visibleInDocuments', peopleSortDirection)}</button>{renderPeopleColumnResizeHandle('visibleInDocuments')}</th>
                        <th style={getPeopleColumnStyle('actions')} className="group relative border-b border-slate-200 px-3 py-2 text-left">操作{renderPeopleColumnResizeHandle('actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {(peopleViewMode === 'org' && !isPeopleEdit
                        ? peopleOrgRows.map((entry) => ({
                            member: entry.row.member as CustomerTeamMember,
                            level: entry.level,
                            parentLabel: entry.parentLabel,
                            canHostChildren: entry.canHostChildren,
                            displayEmployeeNo: entry.displayEmployeeNo,
                          }))
                        : editablePeopleRows.map((member) => ({
                            member,
                            level: 0,
                            parentLabel: '',
                            canHostChildren: false,
                            displayEmployeeNo: getEmployeeNo(member),
                          }))).map(({ member, level, parentLabel, canHostChildren, displayEmployeeNo }) => (
                        <tr
                          key={`people-${member.id}`}
                          className={`odd:bg-white even:bg-slate-50/35 hover:bg-slate-50 ${
                            dragOverMemberId === member.id && !isPeopleEdit && peopleViewMode === 'org' ? 'bg-blue-50/70 ring-1 ring-inset ring-blue-300' : ''
                          }`}
                          onDragOver={(event) => {
                            if (isPeopleEdit || peopleViewMode !== 'org' || !draggingMemberId) return;
                            event.preventDefault();
                            setDragOverMemberId(member.id);
                          }}
                          onDragLeave={() => {
                            if (isPeopleEdit || peopleViewMode !== 'org') return;
                            setDragOverMemberId((current) => (current === member.id ? null : current));
                          }}
                          onDrop={(event) => {
                            if (isPeopleEdit || peopleViewMode !== 'org') return;
                            event.preventDefault();
                            handleOrgDrop(member.id);
                          }}
                        >
                          <td className="border-b border-slate-100 px-2.5 py-1 text-slate-600">
                            {isPeopleEdit ? (
                              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] font-medium text-slate-500">
                                {getEmployeeNo(member)}
                              </div>
                            ) : peopleViewMode === 'org' ? displayEmployeeNo : getEmployeeNo(member)}
                          </td>
                          <td className="border-b border-slate-100 px-2.5 py-1 font-medium text-slate-800">
                            {isPeopleEdit ? (
                              <div className="space-y-2">
                                <input
                                  className={INPUT}
                                  value={member.name}
                                  onChange={(event) => updatePeopleDraft(member.id, { name: event.target.value })}
                                  placeholder="请输入人员姓名"
                                />
                                <div className="relative">
                                  <select
                                    className={`${INPUT} appearance-none pr-8`}
                                    value={member.managerId || ''}
                                    onChange={(event) => updatePeopleDraft(member.id, { managerId: event.target.value })}
                                  >
                                    <option value="">直属上级：无（平级 / 顶层）</option>
                                    {peopleManagerOptions.map((option) => (
                                      <option key={option.id} value={option.id} disabled={option.id === member.id}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                </div>
                              </div>
                            ) : peopleViewMode === 'org' ? (
                              <div className="flex flex-col gap-0">
                                <div
                                  className={`flex items-center gap-1.5 ${level === 0 ? 'min-h-[20px]' : 'min-h-[18px]'}`}
                                  style={{ paddingLeft: `${level * 18}px` }}
                                >
                                  {level > 0 && <span className="font-semibold leading-none text-slate-300">└</span>}
                                  <span className={canHostChildren ? 'font-semibold text-slate-900' : 'font-medium text-slate-800'}>
                                    {member.name}
                                  </span>
                                </div>
                                {level > 0 && parentLabel && (
                                  <div
                                    className="text-[10px] leading-3.5 text-slate-400"
                                    style={{ paddingLeft: `${level * 18 + 18}px` }}
                                  >
                                    {parentLabel}
                                  </div>
                                )}
                              </div>
                            ) : member.name}
                          </td>
                          <td className="border-b border-slate-100 px-2.5 py-1 text-slate-600">
                            {isPeopleEdit ? (
                              <div className="relative">
                                <select
                                  className={`${INPUT} appearance-none pr-8`}
                                  value={member.department || getMemberDepartment(member)}
                                  onChange={(event) => updatePeopleDraft(member.id, { department: event.target.value })}
                                >
                                  <option value="">请选择部门</option>
                                  {PEOPLE_DEPARTMENT_OPTIONS.map((department) => (
                                    <option key={department} value={department}>{department}</option>
                                  ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                              </div>
                            ) : getMemberDepartment(member)}
                          </td>
                          <td className="border-b border-slate-100 px-2.5 py-1 text-slate-600">
                            {isPeopleEdit ? (
                              <div className="relative">
                                <select
                                  className={`${INPUT} appearance-none pr-8`}
                                  value={member.title}
                                  onChange={(event) => updatePeopleDraft(member.id, { title: event.target.value })}
                                >
                                  <option value="">{(member.department || getMemberDepartment(member)) ? '请选择岗位' : '请先选择部门'}</option>
                                  {(PEOPLE_TITLES_BY_DEPARTMENT[member.department || getMemberDepartment(member)] || [member.title]).map((title) => (
                                    <option key={title} value={title}>{title}</option>
                                  ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                              </div>
                            ) : member.title}
                          </td>
                          <td className="border-b border-slate-100 px-3 py-2 text-slate-600">
                            {isPeopleEdit ? (
                              <div className="relative">
                                <select
                                  className={`${INPUT} appearance-none pr-8`}
                                  value={member.region || 'all'}
                                  onChange={(event) => updatePeopleDraft(member.id, { region: event.target.value })}
                                >
                                  {PEOPLE_REGION_OPTIONS.map((option) => (
                                    <option key={option.value || 'empty'} value={option.value}>{option.label}</option>
                                  ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                              </div>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{getMemberRegion(member)}</span>
                            )}
                          </td>
                          <td className="border-b border-slate-100 px-2.5 py-1 text-slate-600">
                            {isPeopleEdit ? (
                              <input
                                className={INPUT}
                                value={member.phone || ''}
                                onChange={(event) => updatePeopleDraft(member.id, { phone: event.target.value })}
                                placeholder="+86 137..."
                              />
                            ) : getMemberPhone(member)}
                          </td>
                          <td className="border-b border-slate-100 px-2.5 py-1 text-slate-700">
                            {isPeopleEdit ? (
                              <input
                                className={INPUT}
                                value={member.businessEmail}
                                onChange={(event) => updatePeopleDraft(member.id, { businessEmail: event.target.value })}
                                placeholder="buyer@example.com"
                              />
                            ) : member.businessEmail}
                          </td>
                          <td className="border-b border-slate-100 px-2.5 py-1 text-slate-600">
                            {isPeopleEdit ? (
                              <input
                                className={INPUT}
                                value={member.wechat || ''}
                                onChange={(event) => updatePeopleDraft(member.id, { wechat: event.target.value })}
                                placeholder="wechat-id / whatsapp"
                              />
                            ) : getMemberWechat(member)}
                          </td>
                          <td className="border-b border-slate-100 px-2.5 py-1 text-slate-600">
                            {isPeopleEdit ? (
                              <input
                                className={INPUT}
                                value={getMemberStatusText(member)}
                                onChange={(event) => updatePeopleDraft(member.id, {
                                  status: event.target.value.includes('停') ? 'suspended' : event.target.value.includes('激活') ? 'invited' : 'active',
                                })}
                                placeholder="在职"
                              />
                            ) : getMemberStatusText(member)}
                          </td>
                          <td className="border-b border-slate-100 px-3 py-2">
                            {isPeopleEdit ? (
                              <label className="inline-flex items-center gap-2 text-[12px] text-slate-600">
                                <input
                                  type="checkbox"
                                  checked={isVisibleInDocuments(member)}
                                  onChange={(event) => updatePeopleDraft(member.id, { visibleInDocuments: event.target.checked })}
                                />
                                <span>{isVisibleInDocuments(member) ? '是' : '否'}</span>
                              </label>
                            ) : (
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${isVisibleInDocuments(member) ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                {isVisibleInDocuments(member) ? '是' : '否'}
                              </span>
                            )}
                          </td>
                          <td className="border-b border-slate-100 px-2.5 py-1">
                            <div className="flex items-center gap-2">
                              {((isPeopleEdit && peopleViewMode === 'list') || (!isPeopleEdit && peopleViewMode === 'org')) && (
                                <button
                                  type="button"
                                  draggable={!isPeopleEdit && peopleViewMode === 'org'}
                                  onDragStart={(event) => {
                                    if (isPeopleEdit || peopleViewMode !== 'org') return;
                                    setDraggingMemberId(member.id);
                                    setDragOverMemberId(member.id);
                                    event.dataTransfer.effectAllowed = 'move';
                                    event.dataTransfer.setData('text/plain', member.id);
                                  }}
                                  onDragEnd={() => {
                                    setDraggingMemberId(null);
                                    setDragOverMemberId(null);
                                  }}
                                  className="inline-flex h-9 w-9 cursor-grab items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 active:cursor-grabbing"
                                >
                                  <GripVertical className="h-4 w-4" />
                                </button>
                              )}
                              {!isPeopleEdit ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedMemberId(member.id);
                                    setDetailView('people');
                                  }}
                                  className="inline-flex items-center rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                >
                                  查看
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => removePeopleDraftRow(member.id)}
                                  className="text-[12px] text-red-500 hover:text-red-600"
                                >
                                  删除
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeSubTab === 'access' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex min-w-[240px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5">
                    <Search className="h-3.5 w-3.5 text-slate-400" />
                    <input
                      value={accessSearch}
                      onChange={(event) => setAccessSearch(event.target.value)}
                      className="w-full bg-transparent text-[11px] text-slate-700 outline-none placeholder:text-slate-400"
                      placeholder="搜索姓名 / 工号 / 邮箱 / 部门"
                    />
                  </div>
                  <div className="relative">
                    <select value={accessDepartmentFilter} onChange={(event) => setAccessDepartmentFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 pr-8 text-[11px] text-slate-600 outline-none transition-colors hover:border-slate-300">
                      <option value="all">部门筛选</option>
                      {accessDepartmentOptions.map((department) => (
                        <option key={department} value={department}>{department}</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <select value={accessRegionFilter} onChange={(event) => setAccessRegionFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 pr-8 text-[11px] text-slate-600 outline-none transition-colors hover:border-slate-300">
                      <option value="all">区域筛选</option>
                      {accessRegionOptions.map((region) => (
                        <option key={region} value={region}>{formatPersonRegion(region)}</option>
                      ))}
                    </select>
                  </div>
                    <div className="relative">
                      <select value={accessStatusFilter} onChange={(event) => setAccessStatusFilter(event.target.value as 'all' | CustomerAccessStatusCode)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 pr-8 text-[11px] text-slate-600 outline-none transition-colors hover:border-slate-300">
                        <option value="all">账号状态筛选</option>
                        <option value="active">已启用</option>
                        <option value="disabled">已停用</option>
                        <option value="locked">已锁定</option>
                        <option value="pending_activation">待激活</option>
                        <option value="expiring">即将过期</option>
                        <option value="expired">已过期</option>
                        <option value="activated">已激活</option>
                        <option value="未开通">未开通</option>
                      </select>
                    </div>
                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-slate-400">当前可批量处理 {filteredInviteActionRows.length} 个待处理正式账号</span>
                    <button type="button" disabled={!filteredInviteActionRows.length} onClick={() => void batchResendActivation()} className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-[11px] font-medium text-sky-700 transition-colors hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50">
                      批量重发激活
                    </button>
                    <button type="button" disabled={!filteredInviteActionRows.length} onClick={() => void batchInvalidateActivation()} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50">
                      批量使邀请失效
                    </button>
                    <button type="button" disabled={!filteredInviteActionRows.length && !filteredActivatedRows.length} onClick={exportAccessList} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                      导出名单
                    </button>
                  </div>
                </div>

                <div ref={accessTableContainerRef} className="overflow-x-hidden rounded-xl border border-slate-200 bg-white">
                  <table className="w-full table-fixed border-collapse text-[11px]">
                    <colgroup>
                      <col style={{ width: `${(accessColumnWidths.employeeNo / Math.max(accessTableMinWidth, 1)) * 100}%` }} />
                      <col style={{ width: `${(accessColumnWidths.name / Math.max(accessTableMinWidth, 1)) * 100}%` }} />
                      <col style={{ width: `${(accessColumnWidths.department / Math.max(accessTableMinWidth, 1)) * 100}%` }} />
                      <col style={{ width: `${(accessColumnWidths.title / Math.max(accessTableMinWidth, 1)) * 100}%` }} />
                      <col style={{ width: `${(accessColumnWidths.region / Math.max(accessTableMinWidth, 1)) * 100}%` }} />
                      <col style={{ width: `${(accessColumnWidths.username / Math.max(accessTableMinWidth, 1)) * 100}%` }} />
                      <col style={{ width: `${(accessColumnWidths.email / Math.max(accessTableMinWidth, 1)) * 100}%` }} />
                      <col style={{ width: `${(accessColumnWidths.accountStatus / Math.max(accessTableMinWidth, 1)) * 100}%` }} />
                      <col style={{ width: `${(accessColumnWidths.security / Math.max(accessTableMinWidth, 1)) * 100}%` }} />
                      <col style={{ width: `${(accessColumnWidths.role / Math.max(accessTableMinWidth, 1)) * 100}%` }} />
                      <col style={{ width: `${(accessColumnWidths.lastLoginAt / Math.max(accessTableMinWidth, 1)) * 100}%` }} />
                      <col style={{ width: `${(accessColumnWidths.actions / Math.max(accessTableMinWidth, 1)) * 100}%` }} />
                    </colgroup>
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th style={getAccessColumnStyle('employeeNo')} className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left"><button type="button" onClick={() => toggleSortState('employeeNo', accessSortKey, accessSortDirection, setAccessSortKey, setAccessSortDirection)} className="inline-flex items-center gap-1 font-semibold text-slate-600">工号 {renderSortHint(accessSortKey === 'employeeNo', accessSortDirection)}</button>{renderAccessColumnResizeHandle('employeeNo')}</th>
                        <th style={getAccessColumnStyle('name')} className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left"><button type="button" onClick={() => toggleSortState('name', accessSortKey, accessSortDirection, setAccessSortKey, setAccessSortDirection)} className="inline-flex items-center gap-1 font-semibold text-slate-600">姓名 {renderSortHint(accessSortKey === 'name', accessSortDirection)}</button>{renderAccessColumnResizeHandle('name')}</th>
                        <th style={getAccessColumnStyle('department')} className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left"><button type="button" onClick={() => toggleSortState('department', accessSortKey, accessSortDirection, setAccessSortKey, setAccessSortDirection)} className="inline-flex items-center gap-1 font-semibold text-slate-600">部门 {renderSortHint(accessSortKey === 'department', accessSortDirection)}</button>{renderAccessColumnResizeHandle('department')}</th>
                        <th style={getAccessColumnStyle('title')} className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left"><button type="button" onClick={() => toggleSortState('title', accessSortKey, accessSortDirection, setAccessSortKey, setAccessSortDirection)} className="inline-flex items-center gap-1 font-semibold text-slate-600">岗位 {renderSortHint(accessSortKey === 'title', accessSortDirection)}</button>{renderAccessColumnResizeHandle('title')}</th>
                        <th style={getAccessColumnStyle('region')} className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left"><button type="button" onClick={() => toggleSortState('region', accessSortKey, accessSortDirection, setAccessSortKey, setAccessSortDirection)} className="inline-flex items-center gap-1 font-semibold text-slate-600">区域 {renderSortHint(accessSortKey === 'region', accessSortDirection)}</button>{renderAccessColumnResizeHandle('region')}</th>
                        <th style={getAccessColumnStyle('username')} className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left">登录账号{renderAccessColumnResizeHandle('username')}</th>
                        <th style={getAccessColumnStyle('email')} className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left">登录邮箱{renderAccessColumnResizeHandle('email')}</th>
                        <th style={getAccessColumnStyle('accountStatus')} className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left">账号状态{renderAccessColumnResizeHandle('accountStatus')}</th>
                        <th style={getAccessColumnStyle('security')} className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left">安全摘要{renderAccessColumnResizeHandle('security')}</th>
                        <th style={getAccessColumnStyle('role')} className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left">角色摘要{renderAccessColumnResizeHandle('role')}</th>
                        <th style={getAccessColumnStyle('lastLoginAt')} className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left">最近登录{renderAccessColumnResizeHandle('lastLoginAt')}</th>
                        <th style={getAccessColumnStyle('actions')} className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left">操作{renderAccessColumnResizeHandle('actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {sortedAccessRows.map((row) => {
                        const member = row.member;
                        const lifecycleStatus = row.lifecycleStatusCode;
                        return (
                        <tr key={`access-${member.id}`} className="odd:bg-white even:bg-slate-50/35 hover:bg-slate-50">
                          <td className="border-b border-slate-100 px-2.5 py-1.5 text-slate-600">{row.employeeNo}</td>
                          <td className="border-b border-slate-100 px-2.5 py-1.5 font-medium text-slate-800">{member.name}</td>
                          <td className="border-b border-slate-100 px-2.5 py-1.5 text-slate-600">{row.department}</td>
                          <td className="border-b border-slate-100 px-2.5 py-1.5 text-slate-600">{row.title}</td>
                          <td className="border-b border-slate-100 px-2.5 py-1.5 text-slate-600">{row.regionLabel}</td>
                          <td className="border-b border-slate-100 px-2.5 py-1.5">
                            <div className="space-y-1">
                              <p className="font-semibold text-slate-800">{row.username}</p>
                              <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">{row.accountStatusCode === 'pending_activation' ? '测试轨' : '正式账号'}</span>
                            </div>
                          </td>
                          <td className="border-b border-slate-100 px-2.5 py-1.5 text-slate-600">{row.loginEmail}</td>
                          <td className="border-b border-slate-100 px-2.5 py-1.5">
                            <div className="space-y-1">
                              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${row.accountStatusCode === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : row.accountStatusCode === 'disabled' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                                {row.accountStatusCode === 'active' ? '已启用' : row.accountStatusCode === 'disabled' ? '已停用' : '未开通'}
                              </span>
                              {lifecycleStatus !== 'active' && lifecycleStatus !== 'disabled' && lifecycleStatus !== '未开通' && (
                                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${lifecycleStatus === 'activated' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : lifecycleStatus === 'pending_activation' ? 'border-sky-200 bg-sky-50 text-sky-700' : lifecycleStatus === 'expiring' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                                  {lifecycleStatus === 'activated' ? '已激活' : lifecycleStatus === 'pending_activation' ? '待激活' : lifecycleStatus === 'expiring' ? '即将过期' : '已过期'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="border-b border-slate-100 px-2.5 py-1.5 text-[10px] leading-5 text-slate-600">
                            <div>密码正常</div>
                            <div className="text-slate-400">{member.canLogin ? (member.loginPassword || '未设置密码') : '未开通'}</div>
                            <div className="text-slate-400">主认证：邮箱 / {member.emailVerified ? '邮箱已验' : '邮箱未验'}</div>
                          </td>
                          <td className="border-b border-slate-100 px-2.5 py-1.5">
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${roleBadge(member.role)}`}>
                              {row.permissionRole.name}
                            </span>
                            <div className="mt-1 text-[10px] text-slate-400">{row.permissionRole.code}</div>
                          </td>
                          <td className="border-b border-slate-100 px-2.5 py-1.5 text-slate-600">{row.lastLoginAt}</td>
                          <td className="border-b border-slate-100 px-2.5 py-1.5">
                            <div className="flex flex-wrap gap-2">
                              <button type="button" onClick={() => { setSelectedMemberId(member.id); setDetailView('access'); }} className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50">详情</button>
                              <button type="button" onClick={() => { setSelectedMemberId(member.id); openIdentityEditor(member); }} className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50">变更账号标识</button>
                              <button type="button" onClick={() => openRoleEditor(member)} className="rounded-lg border border-blue-200 px-2.5 py-1 text-[11px] font-medium text-blue-600 hover:bg-blue-50">更改角色</button>
                              <button type="button" onClick={() => updateMember(member.id, { status: member.status === 'suspended' ? 'active' : 'suspended', canLogin: member.status === 'suspended' })} className="rounded-lg border border-amber-200 px-2.5 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-50">{member.status === 'suspended' ? '启用' : '停用'}</button>
                              <button type="button" onClick={() => resetPassword(member)} className="rounded-lg border border-rose-200 px-2.5 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50">重置密码</button>
                              <button type="button" onClick={() => toggleForcePasswordReset(member)} className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50">强制改密</button>
                            </div>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeSubTab === 'roles' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex min-w-[220px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                      <Search className="h-3.5 w-3.5 text-slate-400" />
                      <input
                        value={roleSearch}
                        onChange={(event) => setRoleSearch(event.target.value)}
                        className="w-full bg-transparent text-[11px] text-slate-700 outline-none placeholder:text-slate-400"
                        placeholder="搜索姓名 / 工号 / 角色 / 部门"
                      />
                    </div>
                    <div className="relative">
                      <select value={roleDepartmentFilter} onChange={(event) => setRoleDepartmentFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 pr-8 text-[11px] text-slate-600 outline-none transition-colors hover:border-slate-300">
                        <option value="all">部门筛选</option>
                        {roleDepartmentOptions.map((department) => (
                          <option key={department} value={department}>{department}</option>
                        ))}
                      </select>
                    </div>
                    <div className="relative">
                      <select value={roleStatusFilter} onChange={(event) => setRoleStatusFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 pr-8 text-[11px] text-slate-600 outline-none transition-colors hover:border-slate-300">
                        <option value="all">人员状态筛选</option>
                        <option value="在职">在职</option>
                        <option value="离职">离职</option>
                        <option value="停用">停用</option>
                      </select>
                    </div>
                  </div>

                  <div ref={roleTableContainerRef} className="mt-4 overflow-x-hidden rounded-xl border border-slate-200">
                  <table className="w-full table-fixed border-collapse text-[11px]">
                    <colgroup>
                        <col style={{ width: `${(roleColumnWidths.employeeNo / Math.max(roleTableMinWidth, 1)) * 100}%` }} />
                        <col style={{ width: `${(roleColumnWidths.name / Math.max(roleTableMinWidth, 1)) * 100}%` }} />
                        <col style={{ width: `${(roleColumnWidths.department / Math.max(roleTableMinWidth, 1)) * 100}%` }} />
                        <col style={{ width: `${(roleColumnWidths.title / Math.max(roleTableMinWidth, 1)) * 100}%` }} />
                        <col style={{ width: `${(roleColumnWidths.roleName / Math.max(roleTableMinWidth, 1)) * 100}%` }} />
                        <col style={{ width: `${(roleColumnWidths.roleCode / Math.max(roleTableMinWidth, 1)) * 100}%` }} />
                        <col style={{ width: `${(roleColumnWidths.description / Math.max(roleTableMinWidth, 1)) * 100}%` }} />
                        <col style={{ width: `${(roleColumnWidths.actions / Math.max(roleTableMinWidth, 1)) * 100}%` }} />
                      </colgroup>
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th style={getRoleColumnStyle('employeeNo')} className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left"><button type="button" onClick={() => toggleSortState('employeeNo', roleSortKey, roleSortDirection, setRoleSortKey, setRoleSortDirection)} className="inline-flex items-center gap-1 font-semibold text-slate-600">工号 {renderSortHint(roleSortKey === 'employeeNo', roleSortDirection)}</button>{renderRoleColumnResizeHandle('employeeNo')}</th>
                          <th style={getRoleColumnStyle('name')} className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left"><button type="button" onClick={() => toggleSortState('name', roleSortKey, roleSortDirection, setRoleSortKey, setRoleSortDirection)} className="inline-flex items-center gap-1 font-semibold text-slate-600">姓名 {renderSortHint(roleSortKey === 'name', roleSortDirection)}</button>{renderRoleColumnResizeHandle('name')}</th>
                          <th style={getRoleColumnStyle('department')} className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left"><button type="button" onClick={() => toggleSortState('department', roleSortKey, roleSortDirection, setRoleSortKey, setRoleSortDirection)} className="inline-flex items-center gap-1 font-semibold text-slate-600">部门 {renderSortHint(roleSortKey === 'department', roleSortDirection)}</button>{renderRoleColumnResizeHandle('department')}</th>
                          <th style={getRoleColumnStyle('title')} className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left"><button type="button" onClick={() => toggleSortState('title', roleSortKey, roleSortDirection, setRoleSortKey, setRoleSortDirection)} className="inline-flex items-center gap-1 font-semibold text-slate-600">岗位 {renderSortHint(roleSortKey === 'title', roleSortDirection)}</button>{renderRoleColumnResizeHandle('title')}</th>
                          <th style={getRoleColumnStyle('roleName')} className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left"><button type="button" onClick={() => toggleSortState('roleName', roleSortKey, roleSortDirection, setRoleSortKey, setRoleSortDirection)} className="inline-flex items-center gap-1 font-semibold text-slate-600">当前角色 {renderSortHint(roleSortKey === 'roleName', roleSortDirection)}</button>{renderRoleColumnResizeHandle('roleName')}</th>
                          <th style={getRoleColumnStyle('roleCode')} className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left"><button type="button" onClick={() => toggleSortState('roleCode', roleSortKey, roleSortDirection, setRoleSortKey, setRoleSortDirection)} className="inline-flex items-center gap-1 font-semibold text-slate-600">角色编码 {renderSortHint(roleSortKey === 'roleCode', roleSortDirection)}</button>{renderRoleColumnResizeHandle('roleCode')}</th>
                          <th style={getRoleColumnStyle('description')} className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left">角色说明{renderRoleColumnResizeHandle('description')}</th>
                          <th style={getRoleColumnStyle('actions')} className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left">操作{renderRoleColumnResizeHandle('actions')}</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {sortedRoleRows.map((row) => {
                          const member = row.member;
                        return (
                          <tr key={`role-${member.id}`} className="odd:bg-white even:bg-slate-50/35 hover:bg-slate-50">
                            <td className="border-b border-slate-100 px-2.5 py-1.5 text-slate-600">{row.employeeNo}</td>
                            <td className="border-b border-slate-100 px-2.5 py-1.5 font-medium text-slate-800">{member.name}</td>
                            <td className="border-b border-slate-100 px-2.5 py-1.5 text-slate-600">{row.department}</td>
                            <td className="border-b border-slate-100 px-2.5 py-1.5 text-slate-600">{row.title}</td>
                            <td className="border-b border-slate-100 px-2.5 py-1.5">
                              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${roleBadge(member.role)}`}>
                                {row.permissionRole.name}
                              </span>
                            </td>
                            <td className="border-b border-slate-100 px-2.5 py-1.5 text-[10px] text-slate-500">{row.permissionRole.code}</td>
                            <td className="border-b border-slate-100 px-2.5 py-1.5 text-[10px] leading-4 text-slate-600">{resolveRoleDescription(member, copy)}</td>
                            <td className="border-b border-slate-100 px-2.5 py-1.5">
                              <button type="button" onClick={() => openRoleEditor(member)} className="inline-flex items-center rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600">
                                去权限中心
                              </button>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {detailView === 'people' && selectedMember && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-[920px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-6 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{copy.dialogs.peopleDetails}</p>
                <h3 className="mt-1 text-[22px] font-semibold text-slate-900">{selectedMember.name}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
                  <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">{getEmployeeNo(selectedMember)}</span>
                  <span>{selectedMember.title}</span>
                  <span>/</span>
                  <span>{copy.roleLabels[selectedMember.role]}</span>
                  <span>/</span>
                  <span>{copy.statusLabels[selectedMember.status]}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailView(null)}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6">
              <div className="rounded-2xl border border-slate-200 bg-white">
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 p-5 md:grid-cols-2">
                  <div className="space-y-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{copy.dialogs.basicInfo}</p>
                    <div className="grid grid-cols-[88px_minmax(0,1fr)] items-start gap-x-3 gap-y-3">
                      <span className="text-[12px] text-slate-400">{copy.table.employeeNo}</span><span className="text-[14px] font-medium text-slate-800">{getEmployeeNo(selectedMember)}</span>
                      <span className="text-[12px] text-slate-400">{copy.table.contact}</span><span className="text-[14px] font-medium text-slate-800">{selectedMember.name}</span>
                      <span className="text-[12px] text-slate-400">{copy.table.title}</span><span className="text-[14px] font-medium text-slate-800">{selectedMember.title}</span>
                      <span className="text-[12px] text-slate-400">{copy.table.role}</span><span className="text-[14px] font-medium text-slate-800">{copy.roleLabels[selectedMember.role]}</span>
                    </div>
                    <div className="mt-4 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600">
                      {copy.sourceLabels.memberDirectory}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{copy.dialogs.contactInfo}</p>
                    <div className="grid grid-cols-[88px_minmax(0,1fr)] items-start gap-x-3 gap-y-3">
                      <span className="text-[12px] text-slate-400">{copy.table.businessEmail}</span><span className="break-all text-[14px] font-medium text-slate-800">{selectedMember.businessEmail}</span>
                      <span className="text-[12px] text-slate-400">{copy.table.loginEmail}</span><span className="break-all text-[14px] font-medium text-slate-800">{selectedMember.loginEmail}</span>
                      <span className="text-[12px] text-slate-400">{copy.table.lastLogin}</span><span className="text-[14px] font-medium text-slate-800">{selectedMember.lastLogin}</span>
                    </div>
                    <div className="mt-4 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600">
                      {selectedMember.loginEmail === user?.email ? copy.sourceLabels.sessionUser : copy.sourceLabels.memberDirectory}
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-100 px-5 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{copy.dialogs.businessSetup}</p>
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-[12px] text-slate-400">{copy.table.status}</p>
                      <p className="mt-1 text-[16px] font-semibold text-slate-900">{copy.statusLabels[selectedMember.status]}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-[12px] text-slate-400">{copy.table.loginAccess}</p>
                      <p className="mt-1 text-[16px] font-semibold text-slate-900">{selectedMember.canLogin ? copy.table.enabled : copy.table.disabled}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-white px-5 py-3">
              <button
                type="button"
                onClick={() => setDetailView(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                {copy.actions.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailView === 'access' && selectedMember && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/20 px-4 py-8 backdrop-blur-[1px]">
          <div className="flex h-[760px] w-[686px] max-h-[calc(100vh-4rem)] max-w-[calc(100vw-2rem)] min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{copy.dialogs.accountDetails}</p>
                <h3 className="mt-2 text-[22px] font-semibold text-slate-900">{selectedMember.name}</h3>
                <p className="mt-1 truncate whitespace-nowrap text-[13px] text-slate-500">
                  {getEmployeeNo(selectedMember)} / {getMemberDepartment(selectedMember)} / {selectedMember.title}
                </p>
              </div>
              <button
                type="button"
                onClick={closeAccessDetail}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-white hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 lg:min-h-[320px]">
                  <p className="text-[12px] font-semibold text-slate-400">登录信息</p>
                  <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] leading-5 text-slate-600">
                    <p>登录账号：平台访问账号</p>
                    <p className="mt-1">登录邮箱：{selectedMember.loginEmail}</p>
                    <p className="mt-1">变更要求：审批通过后执行，并保留审计记录。</p>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-x-3 gap-y-2 text-[13px] sm:grid-cols-2">
                    <div><span className="text-slate-400">登录账号</span><p className="mt-0.5 font-semibold text-slate-800">{getLoginAccount(selectedMember) || '未开通'}</p></div>
                    <div><span className="text-slate-400">登录邮箱</span><p className="mt-0.5 font-semibold text-slate-800 break-all">{selectedMember.loginEmail}</p></div>
                    <div><span className="text-slate-400">账号类型</span><p className="mt-0.5 font-semibold text-slate-800">平台访问账号</p></div>
                    <div>
                      <span className="text-slate-400">认证轨道</span>
                      <p className="mt-0.5">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${selectedMember.authMode === 'test' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-sky-200 bg-sky-50 text-sky-700'}`}>
                          {selectedMember.authMode === 'test' ? '测试轨' : '正式轨'}
                        </span>
                      </p>
                    </div>
                    <div><span className="text-slate-400">主认证方式</span><p className="mt-0.5 font-semibold text-slate-800">{selectedMember.primaryIdentitySource === 'phone' ? '手机' : '邮箱'}</p></div>
                    <div><span className="text-slate-400">区域</span><p className="mt-0.5 font-semibold text-slate-800">{selectedMember.region || 'all'}</p></div>
                  </div>
                </div>
                <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 lg:min-h-[320px]">
                  <p className="text-[12px] font-semibold text-slate-400">安全信息</p>
                  <div className="mt-3 grid grid-cols-1 gap-x-3 gap-y-2 text-[13px] sm:grid-cols-2">
                    <div>
                      <span className="text-slate-400">账号状态</span>
                      <p className="mt-0.5">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${accessStatusMeta(selectedMember).className}`}>
                          {accessStatusMeta(selectedMember).label}
                        </span>
                      </p>
                    </div>
                    <div><span className="text-slate-400">当前密码</span><p className="mt-0.5 font-semibold text-slate-800">{selectedMember.loginPassword || '未设置密码'}</p></div>
                    <div><span className="text-slate-400">强制改密</span><p className="mt-0.5 font-semibold text-slate-800">{selectedMember.forcePasswordReset ? '是' : '否'}</p></div>
                    <div><span className="text-slate-400">邮箱验证</span><p className="mt-0.5 font-semibold text-slate-800">{selectedMember.emailVerified ? '已验证' : '未验证'}</p></div>
                    <div><span className="text-slate-400">手机验证</span><p className="mt-0.5 font-semibold text-slate-800">{selectedMember.phoneVerified ? '已验证' : '未验证'}</p></div>
                    <div className="sm:col-span-2"><span className="text-slate-400">最近登录</span><p className="mt-0.5 font-semibold text-slate-800">{selectedMember.lastLogin || '—'}</p></div>
                  </div>
                </div>
                <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 lg:min-h-[320px]">
                  <p className="text-[12px] font-semibold text-slate-400">激活信息</p>
                  <div className="mt-3 grid grid-cols-1 gap-x-3 gap-y-2 text-[13px] sm:grid-cols-2">
                    <div>
                      <span className="text-slate-400">激活状态</span>
                      <p className="mt-0.5">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${activationStatusMeta(selectedMember).className}`}>
                          {activationStatusMeta(selectedMember).label}
                        </span>
                      </p>
                    </div>
                    <div><span className="text-slate-400">发放时间</span><p className="mt-0.5 font-semibold text-slate-800">{formatDateTime(selectedInvitation?.lastSentAt || selectedMember.inviteSentAt)}</p></div>
                    <div><span className="text-slate-400">失效时间</span><p className="mt-0.5 font-semibold text-slate-800">{formatDateTime(selectedInvitation?.expiresAt || selectedMember.inviteExpiresAt)}</p></div>
                    <div><span className="text-slate-400">最近发放通道</span><p className="mt-0.5 font-semibold text-slate-800">{selectedMember.primaryIdentitySource === 'phone' ? '手机' : '邮箱'}</p></div>
                    <div><span className="text-slate-400">正式激活时间</span><p className="mt-0.5 font-semibold text-slate-800">{formatDateTime(selectedMember.activatedAt)}</p></div>
                  </div>
                </div>
              </div>
              <div className="mt-3 w-full rounded-[22px] border border-slate-200 bg-white p-4">
                <p className="text-[12px] font-semibold text-slate-400">权限信息</p>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-[18px] bg-slate-50 px-5 py-4 md:min-h-[108px]">
                    <p className="text-[11px] text-slate-400">当前角色</p>
                    <p className="mt-2 truncate whitespace-nowrap text-[14px] font-medium text-slate-800">{copy.roleLabels[selectedMember.role]}</p>
                    <p className="truncate whitespace-nowrap text-[14px] font-medium text-slate-400">{selectedMember.role}</p>
                  </div>
                  <div className="rounded-[18px] bg-slate-50 px-5 py-4 md:min-h-[108px]">
                    <p className="text-[11px] text-slate-400">账号数量</p>
                    <p className="mt-2 text-[14px] font-medium text-slate-800">1 个账号</p>
                  </div>
                  <div className="rounded-[18px] bg-slate-50 px-5 py-4 md:min-h-[108px]">
                    <p className="text-[11px] text-slate-400">管理备注</p>
                    <p className="mt-2 text-[14px] font-medium text-slate-800">{selectedMember.notes || '—'}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => openIdentityEditor(selectedMember)}
                  className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-[12px] font-medium text-violet-700 transition-colors hover:bg-violet-100"
                >
                  变更账号标识
                </button>
                <button
                  type="button"
                  onClick={() => openRoleEditor(selectedMember)}
                  className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[12px] font-medium text-blue-700 transition-colors hover:bg-blue-100"
                >
                  更改角色
                </button>
                <button
                  type="button"
                  onClick={closeAccessDetail}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  关闭
                </button>
                <button
                  type="button"
                  onClick={() => activateMemberAccount(selectedMember)}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  开通账号
                </button>
                <button
                  type="button"
                  onClick={() => issueFormalActivation(selectedMember)}
                  className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[12px] font-medium text-sky-700 transition-colors hover:bg-sky-100"
                >
                  发放正式激活
                </button>
                <button
                  type="button"
                  onClick={() => markIdentityVerified(selectedMember, 'email')}
                  className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[12px] font-medium text-blue-700 transition-colors hover:bg-blue-100"
                >
                  标记邮箱已验证
                </button>
                <button
                  type="button"
                  onClick={() => markIdentityVerified(selectedMember, 'phone')}
                  className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-[12px] font-medium text-cyan-700 transition-colors hover:bg-cyan-100"
                >
                  标记手机已验证
                </button>
                <button
                  type="button"
                  onClick={() => finalizeActivation(selectedMember)}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                >
                  完成正式激活
                </button>
                <button
                  type="button"
                  onClick={() => invalidateActivationInvite(selectedMember)}
                  className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-700 transition-colors hover:bg-amber-100"
                >
                  使邀请失效
                </button>
                <button
                  type="button"
                  onClick={() => resetPassword(selectedMember)}
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-600 transition-colors hover:bg-red-100"
                >
                  重置密码
                </button>
                <button
                  type="button"
                  onClick={() => openManualPasswordDialog(selectedMember)}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-700 transition-colors hover:bg-rose-100"
                >
                  手动设定密码
                </button>
                <button
                  type="button"
                  onClick={() => toggleForcePasswordReset(selectedMember)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  {selectedMember.forcePasswordReset ? '取消强制改密' : '强制下次登录改密'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {selectedMember && identityEditorOpen && (
        <div className="fixed inset-0 z-[121] flex items-center justify-center bg-slate-950/35 p-4">
          <div className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">账号详情</p>
                <h3 className="mt-2 text-[20px] font-semibold text-slate-900">变更账号标识</h3>
                <p className="mt-1 text-[13px] text-slate-500">{selectedMember.name} / {getEmployeeNo(selectedMember)}</p>
              </div>
              <button type="button" onClick={() => setIdentityEditorOpen(false)} className="rounded-xl border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-white hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <label className="block space-y-1.5">
                <span className="text-[12px] font-medium text-slate-500">登录账号</span>
                <input className={INPUT} value={identityDraft.loginAccount} onChange={(event) => setIdentityDraft((current) => ({ ...current, loginAccount: event.target.value }))} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[12px] font-medium text-slate-500">登录邮箱</span>
                <input className={INPUT} value={identityDraft.loginEmail} onChange={(event) => setIdentityDraft((current) => ({ ...current, loginEmail: event.target.value }))} />
              </label>
              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
                <button type="button" onClick={() => setIdentityEditorOpen(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50">关闭</button>
                <button type="button" onClick={saveIdentityEditor} className="rounded-lg bg-blue-600 px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-blue-700">保存</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedMember && manualPasswordOpen && (
        <div className="fixed inset-0 z-[121] flex items-center justify-center bg-slate-950/35 p-4">
          <div className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">账号详情</p>
                <h3 className="mt-2 text-[20px] font-semibold text-slate-900">手动设定密码</h3>
                <p className="mt-1 text-[13px] text-slate-500">{selectedMember.name} / {getEmployeeNo(selectedMember)}</p>
              </div>
              <button type="button" onClick={() => setManualPasswordOpen(false)} className="rounded-xl border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-white hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <label className="block space-y-1.5">
                <span className="text-[12px] font-medium text-slate-500">新密码</span>
                <input className={INPUT} value={manualPasswordDraft} onChange={(event) => setManualPasswordDraft(event.target.value)} placeholder="请输入新密码" />
              </label>
              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
                <button type="button" onClick={() => setManualPasswordOpen(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50">关闭</button>
                <button type="button" onClick={saveManualPassword} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-700 transition-colors hover:bg-rose-100">保存密码</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {roleEditorMember && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/45 p-4">
          <div className="relative flex-none overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" style={{ width: 392, maxWidth: 'calc(100vw - 32px)' }}>
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{copy.dialogs.changeRole}</p>
                <h3 className="mt-1 text-[15px] font-semibold text-slate-900">{roleEditorMember.name}</h3>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {getEmployeeNo(roleEditorMember)} / {roleEditorMember.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRoleEditorMemberId('');
                  setRoleEditorCode('');
                }}
                className="rounded-xl border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-white hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2.5 p-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400">{copy.dialogs.currentRole}</p>
                      <p className="mt-0.5 truncate text-[13px] font-semibold text-slate-800">{copy.roleLabels[roleEditorMember.role]}</p>
                      <p className="truncate text-[11px] text-slate-400">{roleEditorMember.role}</p>
                    </div>
                    <div className="shrink-0 pt-4 text-slate-300">→</div>
                    <div className="min-w-0 text-right">
                      <p className="text-[11px] text-slate-400">{copy.dialogs.changedRole}</p>
                      <p className="mt-0.5 truncate text-[13px] font-semibold text-slate-800">
                        {roleEditorCode ? copy.roleLabels[roleEditorCode] : copy.dialogs.notSelected}
                      </p>
                      <p className="truncate text-[11px] text-slate-400">{roleEditorCode || copy.dialogs.notSelected}</p>
                    </div>
                  </div>
                  {roleEditorCode && (
                    <div className="rounded-lg bg-white px-3 py-2">
                      <p className="text-[11px] text-slate-400">{copy.dialogs.roleDescription}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {renderPermissionPills(permissionMap[roleEditorCode] || [])}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                <p className="text-[12px] font-semibold text-slate-400">{copy.dialogs.selectRole}</p>
                <div className="relative mt-2">
                  <select
                    value={roleEditorCode}
                    onChange={(event) => setRoleEditorCode(event.target.value as CustomerAccountRole)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-9 text-[13px] text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-red-300"
                  >
                    <option value="">{copy.dialogs.notSelected}</option>
                    {roleOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setRoleEditorMemberId('');
                    setRoleEditorCode('');
                  }}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  {copy.cancel || copy.actions.close}
                </button>
                <button
                  type="button"
                  onClick={saveRoleEditor}
                  disabled={!roleEditorCode}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {copy.actions.saveRole}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
