import { useEffect, useMemo, useState } from 'react';
import { Lock, Mail, Search, Shield, UserPlus, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '../../contexts/UserContext';
import {
  customerEnterpriseInvitationService,
  customerEnterpriseMemberService,
} from '../../lib/supabaseService';
import type { CustomerMasterDataCopy } from './customerEnterpriseMasterDataI18n';

type CustomerAccountRole = 'Owner' | 'Purchaser' | 'Finance' | 'Viewer';
type CustomerAccountStatus = 'active' | 'invited' | 'suspended';

type CustomerTeamMember = {
  id: string;
  name: string;
  title: string;
  businessEmail: string;
  loginEmail: string;
  role: CustomerAccountRole;
  status: CustomerAccountStatus;
  canLogin: boolean;
  lastLogin: string;
  permissions: string[];
};

type CustomerInvitationRecord = {
  id: string;
  memberId: string;
  inviteUrl: string;
  lastSentAt: string | null;
  expiresAt: string | null;
  status: string;
};

const STORAGE_KEY = 'cosun_customer_contacts_accounts_v1';
const PENDING_SYNC_KEY = 'cosun_pending_customer_contacts_accounts_sync_v1';

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
  return {
    Owner: [
      copy.permissionLabels.manageEnterpriseProfile,
      copy.permissionLabels.manageMembers,
      copy.permissionLabels.createInquiries,
      copy.permissionLabels.viewPrices,
      copy.permissionLabels.placeOrders,
      copy.permissionLabels.viewFinanceDocs,
    ],
    Purchaser: [
      copy.permissionLabels.createInquiries,
      copy.permissionLabels.viewPrices,
      copy.permissionLabels.placeOrders,
    ],
    Finance: [
      copy.permissionLabels.viewFinanceDocs,
      copy.permissionLabels.uploadPaymentProof,
      copy.permissionLabels.viewBillingDetails,
    ],
    Viewer: [copy.permissionLabels.readOnlyAccess],
  };
}

function buildSeedMember(
  user: ReturnType<typeof useUser>['user'],
  copy: CustomerMasterDataCopy['contacts'],
): CustomerTeamMember | null {
  if (!user?.email) return null;
  const permissionMap = getRolePermissionMap(copy);
  return {
    id: `member-${user.id || user.email}`,
    name: user.name || user.email.split('@')[0] || copy.messages.teamMemberFallback,
    title: copy.messages.enterpriseOwnerTitle,
    businessEmail: user.email,
    loginEmail: user.email,
    role: 'Owner',
    status: 'active',
    canLogin: true,
    lastLogin: copy.messages.currentSession,
    permissions: permissionMap.Owner,
  };
}

function roleBadge(role: CustomerAccountRole) {
  const cls: Record<CustomerAccountRole, string> = {
    Owner: 'bg-amber-50 text-amber-700 border-amber-200',
    Purchaser: 'bg-blue-50 text-blue-700 border-blue-200',
    Finance: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Viewer: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return cls[role];
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

export default function CustomerContactsAndAccountsCenter({
  copy = defaultCopy,
  rtl = false,
}: {
  copy?: CustomerMasterDataCopy['contacts'];
  rtl?: boolean;
}) {
  const { user } = useUser();
  const permissionMap = useMemo(() => getRolePermissionMap(copy), [copy]);
  const [members, setMembers] = useState<CustomerTeamMember[]>([]);
  const [invitations, setInvitations] = useState<Record<string, CustomerInvitationRecord>>({});
  const [activeSubTab, setActiveSubTab] = useState<'people' | 'access' | 'roles'>('people');
  const [peopleViewMode, setPeopleViewMode] = useState<'list' | 'org'>('list');
  const [showInvite, setShowInvite] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | CustomerAccountRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | CustomerAccountStatus>('all');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [detailView, setDetailView] = useState<'people' | 'access' | null>(null);
  const [roleEditorMemberId, setRoleEditorMemberId] = useState('');
  const [roleEditorCode, setRoleEditorCode] = useState<CustomerAccountRole | ''>('');
  const [draft, setDraft] = useState({
    name: '',
    title: '',
    businessEmail: '',
    loginEmail: '',
    role: 'Purchaser' as CustomerAccountRole,
  });

  const persistMembersLocally = (nextMembers: CustomerTeamMember[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextMembers));
  };

  const mergeSeedMember = (nextMembers: CustomerTeamMember[], seed: CustomerTeamMember | null) => {
    if (!seed) return nextMembers;
    const hasSeed = nextMembers.some((member) => member.loginEmail === seed.loginEmail);
    return hasSeed ? nextMembers : [seed, ...nextMembers];
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
      members: nextMembers,
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
    options?: { successMessage?: string; pendingMessage?: string },
  ) => {
    setMembers(nextMembers);
    persistMembersLocally(nextMembers);

    if (!user?.id || user.type !== 'customer') {
      if (options?.successMessage) toast.success(options.successMessage);
      return;
    }

    setSyncing(true);
    try {
      await customerEnterpriseMemberService.replaceAllByEnterpriseAuthUser(user.id, nextMembers);
      clearPendingMemberSync();
      if (options?.successMessage) toast.success(options.successMessage);
    } catch (error) {
      const message = String((error as Error)?.message || error || '');
      const isAbortError = message.includes('AbortError') || (error as Error)?.name === 'AbortError';
      if (isAbortError) {
        queuePendingMemberSync(user.id, nextMembers);
        toast.success(options?.pendingMessage || copy.messages.accessUpdatedQueued);
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
        setMembers(mergeSeedMember([...parsed] as CustomerTeamMember[], seed));
        return;
      }
    } catch (error) {
      console.warn('[CustomerContactsAndAccountsCenter] Failed to read cache:', error);
    }

    setMembers(seed ? [seed] : []);
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
        const nextMembers = mergeSeedMember(remoteMembers as CustomerTeamMember[], seed);
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

  const inviteMember = () => {
    if (!draft.name.trim() || !draft.loginEmail.trim()) {
      toast.error(copy.messages.nameAndLoginRequired);
      return;
    }

    const nextMember: CustomerTeamMember = {
      id: `member-${Date.now()}`,
      name: draft.name.trim(),
      title: draft.title.trim() || copy.messages.teamMemberFallback,
      businessEmail: draft.businessEmail.trim() || draft.loginEmail.trim(),
      loginEmail: draft.loginEmail.trim().toLowerCase(),
      role: draft.role,
      status: 'invited',
      canLogin: true,
      lastLogin: copy.messages.invitationPending,
      permissions: permissionMap[draft.role],
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
      role: 'Purchaser',
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

  const filteredMembers = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    return members.filter((member) => {
      const matchesTerm = !term || `${member.name} ${member.title} ${member.businessEmail} ${member.loginEmail} ${member.role}`.toLowerCase().includes(term);
      const matchesRole = roleFilter === 'all' || member.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
      return matchesTerm && matchesRole && matchesStatus;
    });
  }, [keyword, members, roleFilter, statusFilter]);

  const orgGroups = useMemo(() => (
    ['Owner', 'Purchaser', 'Finance', 'Viewer'].map((role) => ({
      role: role as CustomerAccountRole,
      members: filteredMembers.filter((member) => member.role === role),
    })).filter((group) => group.members.length > 0)
  ), [filteredMembers]);

  const getEmployeeNo = (member: CustomerTeamMember) => {
    const index = members.findIndex((item) => item.id === member.id);
    return `CS-${String(index + 1).padStart(3, '0')}`;
  };

  const getLoginAccount = (member: CustomerTeamMember) => member.loginEmail.split('@')[0] || member.loginEmail;
  const selectedMember = members.find((member) => member.id === selectedMemberId) || null;
  const roleEditorMember = members.find((member) => member.id === roleEditorMemberId) || null;
  const openRoleEditor = (member: CustomerTeamMember) => {
    setRoleEditorMemberId(member.id);
    setRoleEditorCode(member.role);
  };

  const saveRoleEditor = () => {
    if (!roleEditorMember || !roleEditorCode) return;
    updateMember(roleEditorMember.id, { role: roleEditorCode });
    setRoleEditorMemberId('');
    setRoleEditorCode('');
  };

  return (
    <div className="space-y-4" dir={rtl ? 'rtl' : 'ltr'}>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6">
            <div className="grid w-full grid-cols-3 items-stretch gap-0 overflow-x-auto">
              {[
                { key: 'people' as const, label: copy.subTabs.people, icon: <Users className="h-4 w-4" /> },
                { key: 'access' as const, label: copy.subTabs.access, icon: <Lock className="h-4 w-4" /> },
                { key: 'roles' as const, label: copy.subTabs.roles, icon: <Shield className="h-4 w-4" /> },
              ].map((item) => {
                const active = activeSubTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveSubTab(item.key)}
                    className="flex min-w-[220px] items-center justify-center gap-2 border-b-[3px] px-4 py-3 text-[14px] font-semibold transition-colors"
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
          <div className="space-y-4 p-4">
            <div className={`flex flex-wrap items-center justify-between gap-3 ${rtl ? 'flex-row-reverse' : ''}`}>
              <div className="flex flex-wrap items-center gap-3">
                {activeSubTab === 'people' && (
                  <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
                    {[
                      { key: 'list' as const, label: copy.viewModes.list },
                      { key: 'org' as const, label: copy.viewModes.org },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setPeopleViewMode(item.key)}
                        className={`rounded-md px-3 py-1 text-[12px] font-medium transition-colors ${
                          peopleViewMode === item.key ? 'bg-red-50 text-red-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex min-w-[260px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                  <input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    className="w-full bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-slate-400"
                    placeholder={
                      activeSubTab === 'people'
                        ? copy.filters.searchPeople
                        : activeSubTab === 'access'
                          ? copy.filters.searchAccess
                          : copy.filters.searchRoles
                    }
                  />
                </div>
                <div className="relative">
                  <select
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value as 'all' | CustomerAccountRole)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[12px] text-slate-600 outline-none transition-colors hover:border-slate-300"
                  >
                    <option value="all">{copy.filters.roleFilter}</option>
                    <option value="Owner">{copy.roleLabels.Owner}</option>
                    <option value="Purchaser">{copy.roleLabels.Purchaser}</option>
                    <option value="Finance">{copy.roleLabels.Finance}</option>
                    <option value="Viewer">{copy.roleLabels.Viewer}</option>
                  </select>
                </div>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as 'all' | CustomerAccountStatus)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[12px] text-slate-600 outline-none transition-colors hover:border-slate-300"
                  >
                    <option value="all">{copy.filters.statusFilter}</option>
                    <option value="active">{copy.statusLabels.active}</option>
                    <option value="invited">{copy.statusLabels.invited}</option>
                    <option value="suspended">{copy.statusLabels.suspended}</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => setShowInvite((prev) => !prev)}
                disabled={syncing}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <UserPlus className="h-4 w-4" />
                {syncing ? copy.syncing : showInvite ? copy.closeInviteForm : copy.inviteMember}
              </button>
            </div>

            <div className={`flex flex-wrap items-center justify-end gap-2 px-1 text-[12px] text-slate-500 ${rtl ? 'text-right' : ''}`}>
              <span>
                {activeSubTab === 'people'
                  ? copy.helperTexts.people
                  : activeSubTab === 'access'
                    ? copy.helperTexts.access
                    : copy.helperTexts.roles}
              </span>
            </div>

            {showInvite && (
              <div className="grid gap-4 rounded-[18px] border border-red-100 bg-white p-4 md:grid-cols-2 xl:grid-cols-5">
                <input
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  placeholder={copy.fields.fullName}
                  disabled={syncing}
                  value={draft.name}
                  onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                />
                <input
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  placeholder={copy.fields.title}
                  disabled={syncing}
                  value={draft.title}
                  onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                />
                <input
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  placeholder={copy.fields.businessEmail}
                  disabled={syncing}
                  value={draft.businessEmail}
                  onChange={(event) => setDraft((prev) => ({ ...prev, businessEmail: event.target.value }))}
                />
                <input
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  placeholder={copy.fields.loginEmail}
                  disabled={syncing}
                  value={draft.loginEmail}
                  onChange={(event) => setDraft((prev) => ({ ...prev, loginEmail: event.target.value }))}
                />
                <div className="flex gap-3">
                  <select
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                    disabled={syncing}
                    value={draft.role}
                    onChange={(event) => setDraft((prev) => ({ ...prev, role: event.target.value as CustomerAccountRole }))}
                  >
                    <option value="Owner">{copy.roleLabels.Owner}</option>
                    <option value="Purchaser">{copy.roleLabels.Purchaser}</option>
                    <option value="Finance">{copy.roleLabels.Finance}</option>
                    <option value="Viewer">{copy.roleLabels.Viewer}</option>
                  </select>
                  <button
                    onClick={inviteMember}
                    disabled={syncing}
                    className="rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700"
                  >
                    {copy.actions.invite}
                  </button>
                </div>
              </div>
            )}

            {activeSubTab === 'people' && (
              peopleViewMode === 'list' ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full min-w-[980px] table-fixed border-collapse text-[12px]">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="border-b border-slate-200 px-5 py-4 text-left font-semibold">{copy.table.employeeNo}</th>
                        <th className="border-b border-slate-200 px-5 py-4 text-left font-semibold">{copy.table.contact}</th>
                        <th className="border-b border-slate-200 px-5 py-4 text-left font-semibold">{copy.table.title}</th>
                        <th className="border-b border-slate-200 px-5 py-4 text-left font-semibold">{copy.table.businessEmail}</th>
                        <th className="border-b border-slate-200 px-5 py-4 text-left font-semibold">{copy.table.status}</th>
                        <th className="border-b border-slate-200 px-5 py-4 text-left font-semibold">{copy.table.role}</th>
                        <th className="border-b border-slate-200 px-5 py-4 text-left font-semibold">{copy.table.actions}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {filteredMembers.map((member) => (
                        <tr key={`people-${member.id}`} className="border-b border-slate-100 last:border-0">
                          <td className="px-5 py-4 font-medium text-slate-600">{getEmployeeNo(member)}</td>
                          <td className="px-5 py-4 font-semibold text-slate-800">{member.name}</td>
                          <td className="px-5 py-4 text-slate-600">{member.title}</td>
                          <td className="px-5 py-4 text-slate-600">{member.businessEmail}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${statusBadge(member.status)}`}>
                              {copy.statusLabels[member.status]}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${roleBadge(member.role)}`}>
                              {copy.roleLabels[member.role]}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <button
                              onClick={() => {
                                setSelectedMemberId(member.id);
                                setDetailView('people');
                              }}
                              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                            >
                              {copy.actions.viewDetails}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {orgGroups.map((group) => (
                    <div key={group.role} className="rounded-xl border border-slate-200 bg-slate-50/30 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${roleBadge(group.role)}`}>
                          {copy.roleLabels[group.role]}
                        </span>
                        <span className="text-xs text-slate-400">{group.members.length}</span>
                      </div>
                      <div className="space-y-3">
                        {group.members.map((member) => (
                          <div key={`org-${member.id}`} className="rounded-lg border border-white bg-white p-3 shadow-sm">
                            <p className="text-sm font-semibold text-slate-800">{member.name}</p>
                            <p className="mt-1 text-xs text-slate-500">{member.title}</p>
                            <p className="mt-2 text-xs text-slate-500">{member.businessEmail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeSubTab === 'access' && (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full min-w-[1420px] table-fixed border-collapse text-[12px]">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="border-b border-slate-200 px-5 py-4 text-left font-semibold">{copy.table.employeeNo}</th>
                      <th className="border-b border-slate-200 px-5 py-4 text-left font-semibold">{copy.table.contact}</th>
                      <th className="border-b border-slate-200 px-5 py-4 text-left font-semibold">{copy.table.title}</th>
                      <th className="border-b border-slate-200 px-5 py-4 text-left font-semibold">{copy.table.loginEmail}</th>
                      <th className="border-b border-slate-200 px-5 py-4 text-left font-semibold">{copy.table.status}</th>
                      <th className="border-b border-slate-200 px-5 py-4 text-left font-semibold">{copy.dialogs.securityInfo}</th>
                      <th className="border-b border-slate-200 px-5 py-4 text-left font-semibold">{copy.table.loginAccess}</th>
                      <th className="border-b border-slate-200 px-5 py-4 text-left font-semibold">{copy.table.roleSummary}</th>
                      <th className="border-b border-slate-200 px-5 py-4 text-left font-semibold">{copy.table.lastLogin}</th>
                      <th className="border-b border-slate-200 px-5 py-4 text-left font-semibold">{copy.table.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filteredMembers.map((member) => (
                      <tr key={`access-${member.id}`} className="border-b border-slate-100 last:border-0">
                        <td className="px-5 py-4 font-medium text-slate-600">{getEmployeeNo(member)}</td>
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-semibold text-slate-800">{member.name}</p>
                            <p className="mt-1 text-xs text-slate-400">{getLoginAccount(member)}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-600">{member.title}</td>
                        <td className="px-5 py-4 text-slate-600">{member.loginEmail}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${statusBadge(member.status)}`}>
                            {copy.statusLabels[member.status]}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          <div className="space-y-1">
                            <p>{resolveSecuritySummary(member, copy)}</p>
                            <p className="text-xs text-slate-400">{member.canLogin ? member.loginEmail : copy.dialogs.notOpened}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => updateMember(member.id, { canLogin: !member.canLogin })}
                            disabled={syncing}
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                              member.canLogin ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {member.canLogin ? copy.table.enabled : copy.table.disabled}
                          </button>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          <div className="space-y-1">
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${roleBadge(member.role)}`}>
                              {copy.roleLabels[member.role]}
                            </span>
                            <p className="text-xs text-slate-400">{resolveRoleDescription(member, copy)}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-500">{member.lastLogin}</td>
                        <td className="px-5 py-4 align-top">
                          <div className="flex min-w-[132px] flex-col items-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedMemberId(member.id);
                                setDetailView('access');
                              }}
                              className="inline-flex w-full items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                            >
                              {copy.actions.viewDetails}
                            </button>
                            <button
                              onClick={() => openRoleEditor(member)}
                              className="inline-flex w-full items-center justify-center gap-1 rounded-xl border border-blue-200 px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50"
                            >
                              {copy.actions.updateRole}
                            </button>
                            <button
                              onClick={() => updateMember(member.id, { status: member.status === 'suspended' ? 'active' : 'suspended' })}
                              disabled={syncing}
                              className={`inline-flex w-full items-center justify-center gap-1 rounded-xl border px-3 py-2 text-xs font-medium ${
                                member.status === 'suspended'
                                  ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                  : 'border-amber-200 text-amber-700 hover:bg-amber-50'
                              }`}
                            >
                              {member.status === 'suspended' ? copy.actions.activate : copy.actions.suspend}
                            </button>
                            <button
                              onClick={() => resendInvitation(member)}
                              disabled={syncing}
                              className="inline-flex w-full items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                            >
                              <Mail className="h-3.5 w-3.5" />
                              {copy.actions.resendInvite}
                            </button>
                            <button
                              onClick={() => copyInvitationLink(member.id)}
                              disabled={syncing || !invitations[member.id]?.inviteUrl}
                              className="inline-flex w-full items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                            >
                              {copy.actions.copyInviteLink}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeSubTab === 'roles' && (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full min-w-[1100px] table-fixed border-collapse text-[12px]">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="border-b border-slate-200 px-5 py-4 text-left font-semibold">{copy.table.contact}</th>
                      <th className="border-b border-slate-200 px-5 py-4 text-left font-semibold">{copy.table.employeeNo}</th>
                      <th className="border-b border-slate-200 px-5 py-4 text-left font-semibold">{copy.table.title}</th>
                      <th className="border-b border-slate-200 px-5 py-4 text-left font-semibold">{copy.table.role}</th>
                      <th className="border-b border-slate-200 px-5 py-4 text-left font-semibold">{copy.table.roleCode}</th>
                      <th className="border-b border-slate-200 px-5 py-4 text-left font-semibold">{copy.table.roleSummary}</th>
                      <th className="border-b border-slate-200 px-5 py-4 text-left font-semibold">{copy.table.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filteredMembers.map((member) => (
                      <tr key={`role-${member.id}`} className="border-b border-slate-100 last:border-0">
                        <td className="px-5 py-4 font-semibold text-slate-800">{member.name}</td>
                        <td className="px-5 py-4 text-slate-600">{getEmployeeNo(member)}</td>
                        <td className="px-5 py-4 text-slate-600">{member.title}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${roleBadge(member.role)}`}>
                            {copy.roleLabels[member.role]}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600">{member.role}</td>
                        <td className="px-5 py-4 text-slate-600">{member.permissions.join(' · ')}</td>
                        <td className="px-5 py-4 align-top">
                          <div className="flex min-w-[190px] flex-col items-end gap-2">
                            <button
                              onClick={() => openRoleEditor(member)}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                            >
                              {copy.actions.updateRole}
                            </button>
                            <button
                              onClick={() => {
                                toast.info(copy.actions.openPermissionCenter);
                              }}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                            >
                              {copy.actions.openPermissionCenter}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
                  </div>
                  <div className="space-y-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{copy.dialogs.contactInfo}</p>
                    <div className="grid grid-cols-[88px_minmax(0,1fr)] items-start gap-x-3 gap-y-3">
                      <span className="text-[12px] text-slate-400">{copy.table.businessEmail}</span><span className="break-all text-[14px] font-medium text-slate-800">{selectedMember.businessEmail}</span>
                      <span className="text-[12px] text-slate-400">{copy.table.loginEmail}</span><span className="break-all text-[14px] font-medium text-slate-800">{selectedMember.loginEmail}</span>
                      <span className="text-[12px] text-slate-400">{copy.table.lastLogin}</span><span className="text-[14px] font-medium text-slate-800">{selectedMember.lastLogin}</span>
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

      {detailView === 'access' && selectedMember && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-[760px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{copy.dialogs.accountDetails}</p>
                <h3 className="mt-2 text-[22px] font-semibold text-slate-900">{selectedMember.name}</h3>
                <p className="mt-1 text-[13px] text-slate-500">
                  {getEmployeeNo(selectedMember)} / {selectedMember.title} / {copy.roleLabels[selectedMember.role]}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailView(null)}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-white hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[72vh] overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-[12px] font-semibold text-slate-400">{copy.dialogs.loginInfo}</p>
                  <div className="mt-3 space-y-3 text-[13px]">
                    <div><span className="text-slate-400">{copy.table.contact}</span><p className="mt-1 font-semibold text-slate-800">{getLoginAccount(selectedMember)}</p></div>
                    <div><span className="text-slate-400">{copy.table.loginEmail}</span><p className="mt-1 font-semibold text-slate-800">{selectedMember.loginEmail}</p></div>
                    <div><span className="text-slate-400">{copy.table.role}</span><p className="mt-1 font-semibold text-slate-800">{copy.roleLabels[selectedMember.role]}</p></div>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-[12px] font-semibold text-slate-400">{copy.dialogs.securityInfo}</p>
                  <div className="mt-3 space-y-3 text-[13px]">
                    <div><span className="text-slate-400">{copy.table.status}</span><p className="mt-1 font-semibold text-slate-800">{copy.statusLabels[selectedMember.status]}</p></div>
                    <div><span className="text-slate-400">{copy.table.loginAccess}</span><p className="mt-1 font-semibold text-slate-800">{selectedMember.canLogin ? copy.table.enabled : copy.table.disabled}</p></div>
                    <div><span className="text-slate-400">{copy.table.lastLogin}</span><p className="mt-1 font-semibold text-slate-800">{selectedMember.lastLogin}</p></div>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
                  <p className="text-[12px] font-semibold text-slate-400">{copy.dialogs.permissionInfo}</p>
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-[11px] text-slate-400">{copy.dialogs.currentRole}</p>
                      <p className="mt-1 font-semibold text-slate-800">{copy.roleLabels[selectedMember.role]}</p>
                      <p className="text-[11px] text-slate-400">{selectedMember.role}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-[11px] text-slate-400">{copy.table.roleSummary}</p>
                      <p className="mt-1 font-semibold text-slate-800">{selectedMember.permissions.length}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-[11px] text-slate-400">{copy.dialogs.roleDescription}</p>
                      <p className="mt-1 font-semibold text-slate-800">{selectedMember.permissions.slice(0, 2).join(' · ') || copy.dialogs.notOpened}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => openRoleEditor(selectedMember)}
                  className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[12px] font-medium text-blue-700 transition-colors hover:bg-blue-100"
                >
                  {copy.actions.updateRole}
                </button>
                <button
                  type="button"
                  onClick={() => setDetailView(null)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  {copy.actions.close}
                </button>
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
                      <p className="mt-1 text-[12px] leading-5 text-slate-700">
                        {(permissionMap[roleEditorCode] || []).join(' · ')}
                      </p>
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
                    <option value="Owner">{copy.roleLabels.Owner}</option>
                    <option value="Purchaser">{copy.roleLabels.Purchaser}</option>
                    <option value="Finance">{copy.roleLabels.Finance}</option>
                    <option value="Viewer">{copy.roleLabels.Viewer}</option>
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
