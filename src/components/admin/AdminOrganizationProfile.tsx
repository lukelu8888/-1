/**
 * AdminOrganizationProfile
 * ─────────────────────────────────────────────────────────────────────────────
 * State machine:
 *   'view' ──[编辑 · Edit]──▶ 'edit' ──[保存 · Save]──▶ 'view'
 *                                      ──[取消 · Cancel]─▶ 'view'  (rollback)
 *
 * Layout:
 *   • Basic Info  — left/right dual-column (CN | EN)
 *   • Bank Accounts — two equal side-by-side cards:
 *       Left  = 公账 人民币 CNY  (Chinese fields only)
 *       Right = USD Public Account (English fields only)
 *   • Private Account — single card below
 *
 * Permission: all internal Admin Portal roles may edit.
 */
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft, Building2, Camera, Check, Globe,
  MapPin, Pencil, Phone, Upload, FileText, X,
  CreditCard, DollarSign, User, Lock, Languages, ContactRound, Landmark, FileBadge2, Users, Shield, Search, Clock3,
  ArrowUpDown, ChevronDown, GripVertical, Copy, RefreshCcw, Trash2, Ban, Eye,
} from 'lucide-react';
import {
  appendManualRoleOverrideTag,
  useAdminOrganization,
  type AdminOrgProfile,
  type BankAccountRMB,
  type BankAccountUSD,
  type BankAccountPrivate,
  type InternalContact,
  type InternalAccount,
} from '../../contexts/AdminOrganizationContext';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';
import { PERMISSION_CENTER_ROLES } from '../../lib/services/permissionCenterService';
import { externalPortalDirectoryService, uiPreferenceService, type ExternalPortalDirectoryEntry } from '../../lib/supabaseService';
import {
  clearPortalPasswordMirror,
  invalidatePortalPasswordMirror,
  listPortalPasswordMirrors,
  markPortalPasswordMirrorNotified,
  resyncPortalPasswordMirror,
  type ExternalPortalType,
  type PortalPasswordMirrorRecord,
} from '../../lib/portalPasswordMirror';
import {
  adminPortalPolicy,
  getAdminAuthMode,
  supportsIdentitySource,
  type AdminAuthIdentitySource,
  isInternalAccountLoginEmailLocked,
  isInternalAccountUsernameLocked,
} from '../../config/adminPortalPolicy';
import {
  adminAccountIdentityAuditService,
  type AdminAccountIdentityAuditRecord,
} from '../../lib/services/adminAccountIdentityAuditService';
import {
  adminAccountPasswordAuditService,
  type AdminAccountPasswordAuditRecord,
} from '../../lib/services/adminAccountPasswordAuditService';
import { updateAdminAccountPassword } from '../../lib/services/adminAccountPasswordService';
import { syncAdminAccountIdentity } from '../../lib/services/adminAccountIdentitySyncService';
import { ensureAdminTestAccount } from '../../lib/services/adminTestAccountSyncService';
import { sendAdminEmailInvite } from '../../lib/services/adminFormalAuthService';
import { sendAdminWhatsappAssist } from '../../lib/services/adminWhatsappAssistService';
import {
  BankCard,
  BankRow,
  DualRow,
  LogoPlaceholder,
  MonoField,
  PreviewMetricCard,
  Section,
  SingleRow,
  TabButton,
} from './admin-organization-profile/components';
import { useTextField } from './admin-organization-profile/hooks/useTextField';
import {
  ACCESS_COLUMN_KEYS,
  ACCESS_TABLE_COLUMN_WIDTHS_KEY,
  ACCESS_TABLE_DEFAULT_WIDTHS,
  ACCESS_TABLE_UI_PREFERENCE_KEY,
  ORG_FAMILY_COLOR_PALETTE,
  PEOPLE_COLUMN_KEYS,
  PEOPLE_DEPARTMENT_TITLE_PRESETS,
  PEOPLE_TABLE_COLUMN_WIDTHS_KEY,
  PEOPLE_TABLE_DEFAULT_WIDTHS,
  PEOPLE_TABLE_UI_PREFERENCE_KEY,
  ROLE_COLUMN_KEYS,
  ROLE_TABLE_COLUMN_WIDTHS_KEY,
  ROLE_TABLE_DEFAULT_WIDTHS,
  ROLE_TABLE_UI_PREFERENCE_KEY,
  TABLE_COLUMN_MIN_WIDTH,
  type AccessColumnKey,
  type OrgDropMode,
  type OrgStructureItem,
  type PeopleColumnKey,
  type RoleColumnKey,
  buildAccountUsername,
  buildAdminOrgPatch,
  buildDescendantIdMap,
  buildFormalActivationCsv,
  buildInviteExpiry,
  buildLinkedPersonCenterRows,
  buildOrgStructureEntries,
  buildReorderedContacts,
  buildSortedUniqueOptions,
  buildTopInsertedContacts,
  distributeColumnWidths,
  filterAccessRows,
  formatEmployeeNo,
  formatDateTime,
  generateTemporaryPassword,
  getActivatedRows,
  getAccessLifecycleStatus,
  getAccountStatusMeta,
  getActivationStatusMeta,
  getAuthModeMeta,
  getDepartmentAndTitleForRole,
  getInviteActionRows,
  getNextSortState,
  getNextEmployeeNo,
  getIdentitySourceLabel,
  getRegionalRoleDisplayName,
  mergeStoredColumnWidths,
  normalizeContactEmployeeNos,
  preserveLatestAuthFieldsForUntouchedAccounts,
  resolvePermissionRole,
  resolvePeopleDropMode,
  sortAccessRows,
} from './admin-organization-profile/peopleCenterShared';
import { BankAccountsSection } from './admin-organization-profile/sections/BankAccountsSection';
import { BasicInfoSection } from './admin-organization-profile/sections/BasicInfoSection';
import {
  buildIdentityEditorDraft,
  buildManualPasswordEditorDraft,
  buildProvisionIdentityDraft,
  buildRoleEditorDraft,
  EMPTY_IDENTITY_EDITOR_DRAFT,
  EMPTY_MANUAL_PASSWORD_EDITOR_DRAFT,
  EMPTY_PROVISION_IDENTITY_DRAFT,
  EMPTY_ROLE_EDITOR_DRAFT,
  type ProvisionIdentityDraft,
} from './admin-organization-profile/peopleCenterEditorHelpers';
import { DocumentDefaultsSection } from './admin-organization-profile/sections/DocumentDefaultsSection';
import { PeopleAccountAccessAuditPanels } from './admin-organization-profile/sections/PeopleAccountAccessAuditPanels';
import { PeopleAccountAccessTableView } from './admin-organization-profile/sections/PeopleAccountAccessTableView';
import { PeopleAccountCenterContent } from './admin-organization-profile/sections/PeopleAccountCenterContent';
import { PeopleAccountPeopleView } from './admin-organization-profile/sections/PeopleAccountPeopleView';
import { ExternalPortalPasswordMirrorModule } from './admin-organization-profile/sections/ExternalPortalPasswordMirrorModule';
import { PeopleAccountCenterOverlays } from './admin-organization-profile/sections/PeopleAccountCenterOverlays';
import { PeopleAccountRolesView } from './admin-organization-profile/sections/PeopleAccountRolesView';
import { getColumnStyle, renderColumnResizeHandle, renderHierarchyDots, renderSortIcon } from './admin-organization-profile/peopleCenterVisuals';
import { deriveAccountRoleDefaults } from './admin-organization-profile/roleMappingEngine';
import { INPUT, MONO, NONE, TEXTAREA, VAL } from './admin-organization-profile/sharedStyles';

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────────────────────
type Mode = 'view' | 'edit';
type MasterTab = 'basic' | 'bank' | 'people-center' | 'portal-mirror' | 'documents';
type ProvisionAccountPayload = ProvisionIdentityDraft & {
  initialRole?: string;
};


type AccountIdentityChangePayload = {
  rowId: string;
  accountId: string;
  nextUsername: string;
  nextLoginEmail: string;
  reason: string;
};

function PeopleAccountCenterModule({
  contacts,
  accounts,
  canEdit,
  isEdit,
  saving,
  onUpdateContact,
  onAutoPatchAccount,
  onBatchPatchAccounts,
  onPersistRoleEditorChange,
  onAutoProvisionAccount,
  onAutoResetAccountPassword,
  onApplyAccountIdentityChange,
  onAddContact,
  onReorderContact,
  onAutoReorderContact,
  onRemoveContact,
  onEnterEdit,
  onCancelEdit,
  onSave,
}: {
  contacts: InternalContact[];
  accounts: InternalAccount[];
  canEdit: boolean;
  isEdit: boolean;
  saving: boolean;
  onUpdateContact: (id: string, key: keyof InternalContact, value: string | boolean) => void;
  onAutoPatchAccount: (id: string, patch: Partial<InternalAccount>, successMessage?: string) => Promise<void>;
  onBatchPatchAccounts: (
    ids: string[],
    patcher: (account: InternalAccount) => Partial<InternalAccount>,
    successMessage: string,
    rollbackMessage?: string,
  ) => Promise<void>;
  onPersistRoleEditorChange: (payload: {
    rowId: string;
    primaryAccountId: string;
    roleCode: string;
    targetRegion: string;
    department?: string;
    title?: string;
  }) => Promise<boolean>;
  onAutoProvisionAccount: (contactId: string, options?: ProvisionAccountPayload) => Promise<void>;
  onAutoResetAccountPassword: (accountId: string) => Promise<void>;
  onApplyAccountIdentityChange: (payload: AccountIdentityChangePayload) => Promise<void>;
  onAddContact: () => Promise<string | void>;
  onReorderContact: (draggedId: string, targetId: string, dropMode: OrgDropMode, managerId?: string) => void;
  onAutoReorderContact: (draggedId: string, targetId: string, dropMode: OrgDropMode, managerId?: string) => Promise<void>;
  onRemoveContact: (id: string) => void;
  onEnterEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
}) {
  const permissionRoleMap = useMemo(
    () => Object.fromEntries(PERMISSION_CENTER_ROLES.map((role) => [role.id, role])),
    [],
  );

  const [activeView, setActiveView] = useState<'people' | 'access' | 'roles'>('people');
  const [peopleSearch, setPeopleSearch] = useState('');
  const [peopleDepartmentFilter, setPeopleDepartmentFilter] = useState('all');
  const [peopleStatusFilter, setPeopleStatusFilter] = useState('all');
  const [peopleViewMode, setPeopleViewMode] = useState<'list' | 'org'>('list');
  const [peopleSortKey, setPeopleSortKey] = useState<'manual' | 'name' | 'employeeNo' | 'department' | 'title' | 'region' | 'phone' | 'email' | 'status' | 'visibleInDocuments'>('manual');
  const [peopleSortDirection, setPeopleSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [personDrawerOpen, setPersonDrawerOpen] = useState(false);
  const [personDialogOffset, setPersonDialogOffset] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const peopleTableContainerRef = useRef<HTMLDivElement | null>(null);
  const accessTableContainerRef = useRef<HTMLDivElement | null>(null);
  const roleTableContainerRef = useRef<HTMLDivElement | null>(null);
  const peopleColumnResizeRef = useRef<{ key: PeopleColumnKey; startX: number; startWidth: number } | null>(null);
  const accessColumnResizeRef = useRef<{ key: AccessColumnKey; startX: number; startWidth: number } | null>(null);
  const roleColumnResizeRef = useRef<{ key: RoleColumnKey; startX: number; startWidth: number } | null>(null);
  const [draggingPersonId, setDraggingPersonId] = useState<string | null>(null);
  const [dragOverPersonId, setDragOverPersonId] = useState<string | null>(null);
  const [dragOverMode, setDragOverMode] = useState<OrgDropMode>('child');
  const [draggingToTop, setDraggingToTop] = useState(false);
  const [isPointerDraggingPeople, setIsPointerDraggingPeople] = useState(false);
  const [peopleColumnWidths, setPeopleColumnWidths] = useState<Record<PeopleColumnKey, number>>(() => {
    if (typeof window === 'undefined') return PEOPLE_TABLE_DEFAULT_WIDTHS;
    try {
      const stored = window.localStorage.getItem(PEOPLE_TABLE_COLUMN_WIDTHS_KEY);
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
      return Boolean(window.localStorage.getItem(PEOPLE_TABLE_COLUMN_WIDTHS_KEY));
    } catch {
      return false;
    }
  });
  const [accessSearch, setAccessSearch] = useState('');
  const [accessDepartmentFilter, setAccessDepartmentFilter] = useState('all');
  const [accessRegionFilter, setAccessRegionFilter] = useState('all');
  const [accessStatusFilter, setAccessStatusFilter] = useState('all');
  const [accessSortKey, setAccessSortKey] = useState<'name' | 'employeeNo' | 'department' | 'title' | 'region' | 'email' | 'accountCount' | 'role' | 'lastLoginAt'>('employeeNo');
  const [accessSortDirection, setAccessSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedAccessRowId, setSelectedAccessRowId] = useState('');
  const [accessDrawerOpen, setAccessDrawerOpen] = useState(false);
  const [identityEditorOpen, setIdentityEditorOpen] = useState(false);
  const [identityEditorUsername, setIdentityEditorUsername] = useState('');
  const [identityEditorLoginEmail, setIdentityEditorLoginEmail] = useState('');
  const [identityEditorReason, setIdentityEditorReason] = useState('');
  const [identityApprovalChecked, setIdentityApprovalChecked] = useState(false);
  const [identityAuthSyncChecked, setIdentityAuthSyncChecked] = useState(false);
  const [identityPasswordResetChecked, setIdentityPasswordResetChecked] = useState(false);
  const [manualPasswordEditorOpen, setManualPasswordEditorOpen] = useState(false);
  const [manualPasswordEditorRowId, setManualPasswordEditorRowId] = useState('');
  const [manualPasswordEditorAccountId, setManualPasswordEditorAccountId] = useState('');
  const [manualPasswordEditorValue, setManualPasswordEditorValue] = useState('');
  const [provisionEditorOpen, setProvisionEditorOpen] = useState(false);
  const [provisionEditorRowId, setProvisionEditorRowId] = useState('');
  const [provisionIdentityDraft, setProvisionIdentityDraft] = useState<ProvisionIdentityDraft>({
    ...EMPTY_PROVISION_IDENTITY_DRAFT,
  });
  const [identityAuditRecords, setIdentityAuditRecords] = useState<AdminAccountIdentityAuditRecord[]>([]);
  const [identityAuditLoading, setIdentityAuditLoading] = useState(false);
  const [identityAuditLoaded, setIdentityAuditLoaded] = useState(false);
  const [passwordAuditRecords, setPasswordAuditRecords] = useState<AdminAccountPasswordAuditRecord[]>([]);
  const [passwordAuditLoading, setPasswordAuditLoading] = useState(false);
  const [passwordAuditLoaded, setPasswordAuditLoaded] = useState(false);
  const [roleEditorSaving, setRoleEditorSaving] = useState(false);
  const [accessColumnWidths, setAccessColumnWidths] = useState<Record<AccessColumnKey, number>>(() => {
    if (typeof window === 'undefined') return ACCESS_TABLE_DEFAULT_WIDTHS;
    try {
      const stored = window.localStorage.getItem(ACCESS_TABLE_COLUMN_WIDTHS_KEY);
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
      return Boolean(window.localStorage.getItem(ACCESS_TABLE_COLUMN_WIDTHS_KEY));
    } catch {
      return false;
    }
  });
  const [roleColumnWidths, setRoleColumnWidths] = useState<Record<RoleColumnKey, number>>(() => {
    if (typeof window === 'undefined') return ROLE_TABLE_DEFAULT_WIDTHS;
    try {
      const stored = window.localStorage.getItem(ROLE_TABLE_COLUMN_WIDTHS_KEY);
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
      return Boolean(window.localStorage.getItem(ROLE_TABLE_COLUMN_WIDTHS_KEY));
    } catch {
      return false;
    }
  });
  const [peoplePreferenceHydrated, setPeoplePreferenceHydrated] = useState(false);
  const [accessPreferenceHydrated, setAccessPreferenceHydrated] = useState(false);
  const [rolePreferenceHydrated, setRolePreferenceHydrated] = useState(false);
  const [roleSearch, setRoleSearch] = useState('');
  const [roleDepartmentFilter, setRoleDepartmentFilter] = useState('all');
  const [roleStatusFilter, setRoleStatusFilter] = useState('all');
  const [roleSortKey, setRoleSortKey] = useState<'name' | 'employeeNo' | 'department' | 'title' | 'roleName' | 'roleCode'>('department');
  const [roleSortDirection, setRoleSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRoleRowId, setSelectedRoleRowId] = useState<string>('');
  const [roleEditorRowId, setRoleEditorRowId] = useState<string>('');
  const [roleEditorCode, setRoleEditorCode] = useState<string>('');
  const linkedRows = useMemo(
    () => buildLinkedPersonCenterRows(contacts, accounts, permissionRoleMap),
    [accounts, contacts, permissionRoleMap],
  );

  const roleSummary = useMemo(() => {
    const counts = new Map<string, number>();
    linkedRows.forEach((row) => {
      const key = ['Sales_Rep', 'Regional_Manager', 'Sales_Assistant'].includes(row.permissionRole.code)
        ? `${row.permissionRole.code}::${row.region}`
        : row.permissionRole.code;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([role, count]) => ({
        role,
        count,
        name: getRegionalRoleDisplayName(
          permissionRoleMap,
          role.split('::')[0],
          role.split('::')[1],
          permissionRoleMap[role.split('::')[0]]?.name || role.split('::')[0],
        ),
        description: permissionRoleMap[role.split('::')[0]]?.description || '暂无权限说明',
      }))
      .sort((a, b) => b.count - a.count);
  }, [linkedRows, permissionRoleMap]);

  const peopleDepartmentOptions = useMemo(
    () => Array.from(new Set(linkedRows.map((row) => row.department).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'zh-CN')),
    [linkedRows],
  );

  const peopleDepartmentSelectOptions = useMemo(
    () => Array.from(new Set([
      ...Object.keys(PEOPLE_DEPARTMENT_TITLE_PRESETS),
      ...linkedRows.map((row) => row.department).filter(Boolean),
    ])).sort((a, b) => a.localeCompare(b, 'zh-CN')),
    [linkedRows],
  );

  const peopleTitleOptionsByDepartment = useMemo(() => {
    const optionMap = new Map<string, Set<string>>();

    Object.entries(PEOPLE_DEPARTMENT_TITLE_PRESETS).forEach(([department, titles]) => {
      optionMap.set(department, new Set(titles.filter(Boolean)));
    });

    linkedRows.forEach((row) => {
      const department = String(row.departmentRaw || row.department || '').trim();
      const title = String(row.titleRaw || row.title || '').trim();
      if (!department || !title) return;
      const current = optionMap.get(department) || new Set<string>();
      current.add(title);
      optionMap.set(department, current);
    });

    return Object.fromEntries(
      Array.from(optionMap.entries()).map(([department, titles]) => [
        department,
        Array.from(titles).sort((a, b) => a.localeCompare(b, 'zh-CN')),
      ]),
    ) as Record<string, string[]>;
  }, [linkedRows]);

  const filteredPeopleRows = useMemo(() => {
    const keyword = peopleSearch.trim().toLowerCase();
    return linkedRows.filter((row) => {
      const status = contacts.find((contact) => contact.id === row.id)?.status || '';
      const matchesKeyword =
        !keyword ||
        `${row.name} ${row.employeeNo} ${row.department} ${row.title} ${row.region} ${row.phone} ${row.email}`.toLowerCase().includes(keyword);
      const matchesDepartment = peopleDepartmentFilter === 'all' || row.department === peopleDepartmentFilter;
      const matchesStatus = peopleStatusFilter === 'all' || status === peopleStatusFilter;
      return matchesKeyword && matchesDepartment && matchesStatus;
    });
  }, [contacts, linkedRows, peopleDepartmentFilter, peopleSearch, peopleStatusFilter]);

  const sortedPeopleRows = useMemo(() => {
    const rows = [...filteredPeopleRows];
    if (peopleSortKey === 'manual') {
      return rows;
    }
    rows.sort((a, b) => {
      const valueA = peopleSortKey === 'visibleInDocuments' ? (a.visibleInDocuments ? 1 : 0) : a[peopleSortKey];
      const valueB = peopleSortKey === 'visibleInDocuments' ? (b.visibleInDocuments ? 1 : 0) : b[peopleSortKey];
      const normalizedA = String(valueA || '').toLowerCase();
      const normalizedB = String(valueB || '').toLowerCase();
      if (normalizedA < normalizedB) return peopleSortDirection === 'asc' ? -1 : 1;
      if (normalizedA > normalizedB) return peopleSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [filteredPeopleRows, peopleSortDirection, peopleSortKey]);

  const editablePeopleRows = useMemo(() => filteredPeopleRows, [filteredPeopleRows]);

  const peopleManagerLabelMap = useMemo(
    () => new Map(linkedRows.map((row) => [
      row.id,
      `${row.name}${row.title ? ` / ${row.title}` : ''}${row.department ? ` / ${row.department}` : ''}`,
    ])),
    [linkedRows],
  );

  const peopleDescendantIdMap = useMemo(
    () => buildDescendantIdMap(linkedRows),
    [linkedRows],
  );

  const peopleManagerSelectOptions = useMemo(
    () => linkedRows.map((row) => ({
      id: row.id,
      label: `${row.name}${row.title ? ` / ${row.title}` : ''}${row.department ? ` / ${row.department}` : ''}`,
    })),
    [linkedRows],
  );

  useEffect(() => {
    if (!sortedPeopleRows.length) {
      setSelectedPersonId('');
      setPersonDrawerOpen(false);
      return;
    }
    if (!selectedPersonId || !sortedPeopleRows.some((row) => row.id === selectedPersonId)) {
      setSelectedPersonId(sortedPeopleRows[0].id);
    }
  }, [selectedPersonId, sortedPeopleRows]);

  useEffect(() => {
    if (isEdit) {
      setPersonDrawerOpen(false);
    }
  }, [isEdit]);

  useEffect(() => {
    if (activeView !== 'people') {
      setPersonDrawerOpen(false);
    }
  }, [activeView]);

  useEffect(() => {
    if (!personDrawerOpen || isEdit) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (!dragStartRef.current) return;
      setPersonDialogOffset({
        x: dragStartRef.current.offsetX + (event.clientX - dragStartRef.current.x),
        y: dragStartRef.current.offsetY + (event.clientY - dragStartRef.current.y),
      });
    };

    const handleMouseUp = () => {
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isEdit, personDrawerOpen]);

  useEffect(() => {
    if (personDrawerOpen) {
      setPersonDialogOffset({ x: 0, y: 0 });
    }
  }, [personDrawerOpen, selectedPersonId]);

  useEffect(() => {
    if (!peopleHasCustomWidths) return;
    try {
      window.localStorage.setItem(PEOPLE_TABLE_COLUMN_WIDTHS_KEY, JSON.stringify(peopleColumnWidths));
    } catch {
      // Ignore persistence failures and keep the in-memory widths.
    }
  }, [peopleColumnWidths, peopleHasCustomWidths]);

  useEffect(() => {
    if (!accessHasCustomWidths) return;
    try {
      window.localStorage.setItem(ACCESS_TABLE_COLUMN_WIDTHS_KEY, JSON.stringify(accessColumnWidths));
    } catch {
      // Ignore persistence failures and keep the in-memory widths.
    }
  }, [accessColumnWidths, accessHasCustomWidths]);

  useEffect(() => {
    if (!roleHasCustomWidths) return;
    try {
      window.localStorage.setItem(ROLE_TABLE_COLUMN_WIDTHS_KEY, JSON.stringify(roleColumnWidths));
    } catch {
      // Ignore persistence failures and keep the in-memory widths.
    }
  }, [roleColumnWidths, roleHasCustomWidths]);

  useEffect(() => {
    let cancelled = false;
    const loadRemotePreference = async () => {
      try {
        const value = await uiPreferenceService.get(PEOPLE_TABLE_UI_PREFERENCE_KEY);
        if (cancelled) return;
        if (value) {
          setPeopleColumnWidths(mergeStoredColumnWidths(PEOPLE_TABLE_DEFAULT_WIDTHS, value as Partial<Record<PeopleColumnKey, number>>));
          setPeopleHasCustomWidths(true);
        }
      } catch {
        // fall back to local cache silently
      } finally {
        if (!cancelled) setPeoplePreferenceHydrated(true);
      }
    };
    void loadRemotePreference();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadRemotePreference = async () => {
      try {
        const value = await uiPreferenceService.get(ACCESS_TABLE_UI_PREFERENCE_KEY);
        if (cancelled) return;
        if (value) {
          setAccessColumnWidths(mergeStoredColumnWidths(ACCESS_TABLE_DEFAULT_WIDTHS, value as Partial<Record<AccessColumnKey, number>>));
          setAccessHasCustomWidths(true);
        }
      } catch {
        // fall back to local cache silently
      } finally {
        if (!cancelled) setAccessPreferenceHydrated(true);
      }
    };
    void loadRemotePreference();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadRemotePreference = async () => {
      try {
        const value = await uiPreferenceService.get(ROLE_TABLE_UI_PREFERENCE_KEY);
        if (cancelled) return;
        if (value) {
          setRoleColumnWidths(mergeStoredColumnWidths(ROLE_TABLE_DEFAULT_WIDTHS, value as Partial<Record<RoleColumnKey, number>>));
          setRoleHasCustomWidths(true);
        }
      } catch {
        // fall back to local cache silently
      } finally {
        if (!cancelled) setRolePreferenceHydrated(true);
      }
    };
    void loadRemotePreference();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!peopleHasCustomWidths || !peoplePreferenceHydrated) return;
    const timer = window.setTimeout(() => {
      void uiPreferenceService.save(PEOPLE_TABLE_UI_PREFERENCE_KEY, peopleColumnWidths).catch(() => {
        // keep local cache as fallback
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [peopleColumnWidths, peopleHasCustomWidths, peoplePreferenceHydrated]);

  useEffect(() => {
    if (!accessHasCustomWidths || !accessPreferenceHydrated) return;
    const timer = window.setTimeout(() => {
      void uiPreferenceService.save(ACCESS_TABLE_UI_PREFERENCE_KEY, accessColumnWidths).catch(() => {
        // keep local cache as fallback
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [accessColumnWidths, accessHasCustomWidths, accessPreferenceHydrated]);

  useEffect(() => {
    if (!roleHasCustomWidths || !rolePreferenceHydrated) return;
    const timer = window.setTimeout(() => {
      void uiPreferenceService.save(ROLE_TABLE_UI_PREFERENCE_KEY, roleColumnWidths).catch(() => {
        // keep local cache as fallback
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [roleColumnWidths, roleHasCustomWidths, rolePreferenceHydrated]);

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

  useEffect(() => {
    if (!isPointerDraggingPeople) return;

    const stopPointerDrag = () => {
      setIsPointerDraggingPeople(false);
      setDraggingPersonId(null);
      setDragOverPersonId(null);
      setDragOverMode('child');
      setDraggingToTop(false);
    };

    window.addEventListener('mouseup', stopPointerDrag);
    window.addEventListener('blur', stopPointerDrag);
    return () => {
      window.removeEventListener('mouseup', stopPointerDrag);
      window.removeEventListener('blur', stopPointerDrag);
    };
  }, [isPointerDraggingPeople]);

  const selectedPerson = contacts.find((contact) => contact.id === selectedPersonId) || null;
  const editablePeopleRowIds = useMemo(() => editablePeopleRows.map((row) => row.id), [editablePeopleRows]);
  const isPeopleDragEnabled = (isEdit && peopleViewMode === 'list') || (!isEdit && peopleViewMode === 'org' && canEdit && !saving);
  const peopleTableMinWidth = useMemo(
    () => Object.values(peopleColumnWidths).reduce((sum, width) => sum + width, 0),
    [peopleColumnWidths],
  );
  const accessTableMinWidth = useMemo(
    () => Object.values(accessColumnWidths).reduce((sum, width) => sum + width, 0),
    [accessColumnWidths],
  );
  const roleTableMinWidth = useMemo(
    () => Object.values(roleColumnWidths).reduce((sum, width) => sum + width, 0),
    [roleColumnWidths],
  );

  const orgHierarchyEntries = useMemo(
    () => buildOrgStructureEntries(linkedRows),
    [linkedRows],
  );

  const peopleListHierarchyRows = useMemo(() => {
    const filteredIds = new Set(sortedPeopleRows.map((row) => row.id));
    return orgHierarchyEntries
      .filter((entry) => filteredIds.has(entry.row.id))
      .map((entry) => ({
        ...entry,
        displayEmployeeNo: entry.row.employeeNo,
      }));
  }, [orgHierarchyEntries, sortedPeopleRows]);

  const visibleListHierarchyMap = useMemo(
    () => new Map(peopleListHierarchyRows.map((entry) => [
      entry.row.id,
      {
        level: entry.level,
        isParent: entry.isParent,
        familyRootId: entry.familyRootId,
        hasHierarchy: entry.level > 0 || entry.isParent,
      },
    ])),
    [peopleListHierarchyRows],
  );

  const orgHierarchyMap = useMemo(
    () => new Map(orgHierarchyEntries.map((entry) => [
      entry.row.id,
      {
        level: entry.level,
        isParent: entry.isParent,
        familyRootId: entry.familyRootId,
        parentLabel: entry.parentLabel,
        managerId: entry.managerId,
        hasHierarchy: entry.level > 0 || entry.isParent,
      },
    ])),
    [orgHierarchyEntries],
  );

  const directHierarchyMap = useMemo(() => {
    const byId = new Map(linkedRows.map((row) => [row.id, row]));
    const childrenByManager = new Map<string, string[]>();

    linkedRows.forEach((row) => {
      const managerId = row.managerId && row.managerId !== row.id && byId.has(row.managerId) ? row.managerId : '';
      if (!managerId) return;
      const current = childrenByManager.get(managerId) || [];
      current.push(row.id);
      childrenByManager.set(managerId, current);
    });

    const cache = new Map<string, { level: number; familyRootId: string }>();
    const resolve = (rowId: string, visiting = new Set<string>()): { level: number; familyRootId: string } => {
      const cached = cache.get(rowId);
      if (cached) return cached;
      if (visiting.has(rowId)) {
        const fallback = { level: 0, familyRootId: rowId };
        cache.set(rowId, fallback);
        return fallback;
      }

      const row = byId.get(rowId);
      const managerId = row?.managerId && row.managerId !== row.id && byId.has(row.managerId) ? row.managerId : '';
      if (!managerId) {
        const rootMeta = { level: 0, familyRootId: rowId };
        cache.set(rowId, rootMeta);
        return rootMeta;
      }

      visiting.add(rowId);
      const parentMeta = resolve(managerId, visiting);
      visiting.delete(rowId);
      const nextMeta = {
        level: parentMeta.level + 1,
        familyRootId: parentMeta.familyRootId || managerId,
      };
      cache.set(rowId, nextMeta);
      return nextMeta;
    };

    return new Map(
      linkedRows.map((row) => {
        const resolved = resolve(row.id);
        const isParent = (childrenByManager.get(row.id) || []).length > 0;
        return [
          row.id,
          {
            level: resolved.level,
            familyRootId: resolved.familyRootId,
            isParent,
            hasHierarchy: resolved.level > 0 || isParent,
          },
        ] as const;
      }),
    );
  }, [linkedRows]);

  const peopleOrgRows = useMemo(() => {
    const filteredIds = new Set(sortedPeopleRows.map((row) => row.id));
    let visibleIndex = 0;
    return orgHierarchyEntries
      .filter((entry) => filteredIds.has(entry.row.id))
      .map((entry) => {
        visibleIndex += 1;
        return {
          ...entry,
          displayEmployeeNo: formatEmployeeNo(visibleIndex),
        };
      });
  }, [orgHierarchyEntries, sortedPeopleRows]);

  const peopleOrgFamilyStyles = useMemo(() => {
    const rootIds = Array.from(new Set(
      orgHierarchyEntries
        .filter((entry) => entry.level === 0)
        .map((entry) => entry.familyRootId),
    ));
    return new Map(
      rootIds.map((rootId, index) => [
        rootId,
        ORG_FAMILY_COLOR_PALETTE[index % ORG_FAMILY_COLOR_PALETTE.length],
      ]),
    );
  }, [orgHierarchyEntries]);

  const resetPeopleDragState = () => {
    setDraggingPersonId(null);
    setDragOverPersonId(null);
    setDragOverMode('child');
    setDraggingToTop(false);
    setIsPointerDraggingPeople(false);
  };

  const commitPeopleDrop = (
    targetId: string,
    level: number,
    canHostChildren: boolean,
    managerId: string | undefined,
    clientY: number,
    rowRect: DOMRect,
    forcedDropMode?: OrgDropMode,
  ) => {
    if (!isPeopleDragEnabled || !draggingPersonId || draggingPersonId === targetId) return;
    setPeopleSortKey('manual');
    const dropMode: OrgDropMode =
      forcedDropMode || (peopleViewMode === 'org'
        ? resolvePeopleDropMode(clientY, rowRect, canHostChildren, dragOverMode)
        : 'child');
    const nextManagerId =
      peopleViewMode === 'org'
        ? (dropMode === 'child' ? targetId : level > 0 ? (managerId || '') : '')
        : targetId;
    if (isEdit) {
      onReorderContact(draggingPersonId, targetId, dropMode, nextManagerId);
    } else {
      void onAutoReorderContact(draggingPersonId, targetId, dropMode, nextManagerId);
    }
    resetPeopleDragState();
  };

  const handlePeopleDrop = (
    event: React.DragEvent<HTMLTableRowElement>,
    targetId: string,
    level: number,
    canHostChildren: boolean,
    managerId?: string,
  ) => {
    if (!isPeopleDragEnabled || !draggingPersonId || draggingPersonId === targetId) return;
    event.preventDefault();
    commitPeopleDrop(
      targetId,
      level,
      canHostChildren,
      managerId,
      event.clientY,
      event.currentTarget.getBoundingClientRect(),
      dragOverPersonId === targetId ? dragOverMode : undefined,
    );
  };

  const handlePeopleDropToTop = () => {
    if (!isPeopleDragEnabled || !draggingPersonId) return;
    setPeopleSortKey('manual');
    if (isEdit) {
      onReorderContact(draggingPersonId, draggingPersonId, 'after', '__TOP__');
    } else {
      void onAutoReorderContact(draggingPersonId, draggingPersonId, 'after', '__TOP__');
    }
    resetPeopleDragState();
  };

  const togglePeopleSort = (key: 'name' | 'employeeNo' | 'department' | 'title' | 'region' | 'phone' | 'email' | 'status' | 'visibleInDocuments') => {
    const next = getNextSortState(peopleSortKey, peopleSortDirection, key);
    setPeopleSortKey(next.key);
    setPeopleSortDirection(next.direction);
  };

  const renderPeopleSortIcon = (key: 'name' | 'employeeNo' | 'department' | 'title' | 'region' | 'phone' | 'email' | 'status' | 'visibleInDocuments') => {
    return renderSortIcon(peopleSortKey, key, peopleSortDirection);
  };

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

  const getPeopleColumnStyle = (key: PeopleColumnKey) => getColumnStyle(peopleColumnWidths, key);

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

  const renderPeopleColumnResizeHandle = (key: PeopleColumnKey) => renderColumnResizeHandle(
    key,
    startPeopleColumnResize,
    shrinkPeopleColumnToMinimum,
  );

  const renderAccessColumnResizeHandle = (key: AccessColumnKey) => renderColumnResizeHandle(
    key,
    startAccessColumnResize,
    shrinkAccessColumnToMinimum,
  );

  const getAccessColumnStyle = (key: AccessColumnKey) => getColumnStyle(accessColumnWidths, key);

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

  const accessDepartmentOptions = useMemo(
    () => buildSortedUniqueOptions(linkedRows.map((row) => row.department)),
    [linkedRows],
  );

  const accessRegionOptions = useMemo(
    () => buildSortedUniqueOptions(linkedRows.map((row) => row.region)),
    [linkedRows],
  );

  const filteredAccessRows = useMemo(() => filterAccessRows(linkedRows, {
    accessSearch,
    accessDepartmentFilter,
    accessRegionFilter,
    accessStatusFilter,
  }), [accessDepartmentFilter, accessRegionFilter, accessSearch, accessStatusFilter, linkedRows]);

  const filteredInviteActionRows = useMemo(() => getInviteActionRows(filteredAccessRows), [filteredAccessRows]);

  const filteredActivatedRows = useMemo(() => getActivatedRows(filteredAccessRows), [filteredAccessRows]);

  const sortedAccessRows = useMemo(
    () => sortAccessRows(filteredAccessRows, accessSortKey, accessSortDirection),
    [accessSortDirection, accessSortKey, filteredAccessRows],
  );

  useEffect(() => {
    if (!sortedAccessRows.length) {
      setSelectedAccessRowId('');
      setAccessDrawerOpen(false);
      return;
    }
    if (!selectedAccessRowId || !sortedAccessRows.some((row) => row.id === selectedAccessRowId)) {
      setSelectedAccessRowId(sortedAccessRows[0].id);
    }
  }, [selectedAccessRowId, sortedAccessRows]);

  const selectedAccessRow = sortedAccessRows.find((row) => row.id === selectedAccessRowId) || sortedAccessRows[0] || null;

  useEffect(() => {
    if (activeView !== 'access') {
      setAccessDrawerOpen(false);
    }
  }, [activeView]);

  const loadIdentityAuditRecords = async () => {
    setIdentityAuditLoading(true);
    try {
      const rows = await adminAccountIdentityAuditService.listRecent(12);
      setIdentityAuditRecords(rows);
    } finally {
      setIdentityAuditLoading(false);
      setIdentityAuditLoaded(true);
    }
  };

  const loadPasswordAuditRecords = async () => {
    setPasswordAuditLoading(true);
    try {
      const rows = await adminAccountPasswordAuditService.listRecent(12);
      setPasswordAuditRecords(rows);
    } finally {
      setPasswordAuditLoading(false);
      setPasswordAuditLoaded(true);
    }
  };

  useEffect(() => {
    if (activeView === 'access' && !identityAuditLoaded && !identityAuditLoading) {
      void loadIdentityAuditRecords();
    }
  }, [activeView, identityAuditLoaded, identityAuditLoading]);

  useEffect(() => {
    if (activeView === 'access' && !passwordAuditLoaded && !passwordAuditLoading) {
      void loadPasswordAuditRecords();
    }
  }, [activeView, passwordAuditLoaded, passwordAuditLoading]);

  const selectedAccessAuditRecords = useMemo(() => (
    selectedAccessRow
      ? identityAuditRecords.filter((record) => (
        record.employeeId === selectedAccessRow.id ||
        record.accountId === selectedAccessRow.linkedAccounts[0]?.id
      ))
      : []
  ), [identityAuditRecords, selectedAccessRow]);

  const selectedAccessPasswordAuditRecords = useMemo(() => (
    selectedAccessRow
      ? passwordAuditRecords.filter((record) => (
        record.employeeId === selectedAccessRow.id ||
        record.accountId === selectedAccessRow.linkedAccounts[0]?.id
      ))
      : []
  ), [passwordAuditRecords, selectedAccessRow]);

  const closeIdentityEditor = () => {
    setIdentityEditorOpen(false);
    setIdentityEditorUsername(EMPTY_IDENTITY_EDITOR_DRAFT.username);
    setIdentityEditorLoginEmail(EMPTY_IDENTITY_EDITOR_DRAFT.loginEmail);
    setIdentityEditorReason(EMPTY_IDENTITY_EDITOR_DRAFT.reason);
    setIdentityApprovalChecked(EMPTY_IDENTITY_EDITOR_DRAFT.approvalChecked);
    setIdentityAuthSyncChecked(EMPTY_IDENTITY_EDITOR_DRAFT.authSyncChecked);
    setIdentityPasswordResetChecked(EMPTY_IDENTITY_EDITOR_DRAFT.passwordResetChecked);
  };

  const openIdentityEditorForRow = (rowId: string) => {
    const result = buildIdentityEditorDraft(linkedRows, rowId);
    if (result.errorMessage || !result.draft) {
      if (result.errorMessage) toast.error(result.errorMessage);
      return;
    }
    setSelectedAccessRowId(rowId);
    setAccessDrawerOpen(false);
    setIdentityEditorUsername(result.draft.username);
    setIdentityEditorLoginEmail(result.draft.loginEmail);
    setIdentityEditorReason(result.draft.reason);
    setIdentityApprovalChecked(result.draft.approvalChecked);
    setIdentityAuthSyncChecked(result.draft.authSyncChecked);
    setIdentityPasswordResetChecked(result.draft.passwordResetChecked);
    setIdentityEditorOpen(true);
  };

  const closeProvisionEditor = () => {
    setProvisionEditorOpen(false);
    setProvisionEditorRowId('');
    setProvisionIdentityDraft(EMPTY_PROVISION_IDENTITY_DRAFT);
  };

  const openProvisionEditorForRow = (rowId: string) => {
    const result = buildProvisionIdentityDraft(linkedRows, rowId);
    if (result.infoMessage) {
      toast.info(result.infoMessage);
      return;
    }
    if (result.errorMessage || !result.draft) {
      return;
    }
    setSelectedAccessRowId(rowId);
    setProvisionEditorRowId(rowId);
    setProvisionIdentityDraft(result.draft);
    setProvisionEditorOpen(true);
  };

  const toggleAccessSort = (key: 'name' | 'employeeNo' | 'department' | 'title' | 'region' | 'email' | 'accountCount' | 'role' | 'lastLoginAt') => {
    const next = getNextSortState(accessSortKey, accessSortDirection, key);
    setAccessSortKey(next.key);
    setAccessSortDirection(next.direction);
  };

  const renderAccessSortIcon = (key: 'name' | 'employeeNo' | 'department' | 'title' | 'region' | 'email' | 'accountCount' | 'role' | 'lastLoginAt') => {
    return renderSortIcon(accessSortKey, key, accessSortDirection);
  };

  const handleProvisionAccount = async (contactId: string, options?: ProvisionAccountPayload) => {
    await onAutoProvisionAccount(contactId, options);
    setSelectedAccessRowId(contactId);
  };

  const handleToggleAccountStatus = async (row: typeof sortedAccessRows[number]) => {
    const primaryAccount = row.linkedAccounts[0];
    if (!primaryAccount) return;
    const nextActive = !(primaryAccount.accountStatus === 'active' && primaryAccount.canLogin);
    await onAutoPatchAccount(
      primaryAccount.id,
      {
        accountStatus: nextActive ? 'active' : 'disabled',
        canLogin: nextActive,
      },
      nextActive ? '账号已启用' : '账号已停用',
    );
    setSelectedAccessRowId(row.id);
  };

  const handleToggleForcePasswordReset = async (row: typeof sortedAccessRows[number]) => {
    const primaryAccount = row.linkedAccounts[0];
    if (!primaryAccount) return;
    await onAutoPatchAccount(
      primaryAccount.id,
      {
        forcePasswordReset: !primaryAccount.forcePasswordReset,
      },
      !primaryAccount.forcePasswordReset ? '已设为下次登录强制改密' : '已取消强制改密',
    );
    setSelectedAccessRowId(row.id);
  };

  const handleSetManualPassword = async (row: typeof sortedAccessRows[number]) => {
    const draftValue = buildManualPasswordEditorDraft(row);
    if (!draftValue) return;
    setSelectedAccessRowId(row.id);
    setAccessDrawerOpen(false);
    setManualPasswordEditorRowId(draftValue.rowId);
    setManualPasswordEditorAccountId(draftValue.accountId);
    setManualPasswordEditorValue(draftValue.password);
    setManualPasswordEditorOpen(true);
  };

  const closeManualPasswordEditor = () => {
    if (saving) return;
    const shouldRestoreDrawer = Boolean(manualPasswordEditorRowId);
    setManualPasswordEditorOpen(false);
    setManualPasswordEditorRowId(EMPTY_MANUAL_PASSWORD_EDITOR_DRAFT.rowId);
    setManualPasswordEditorAccountId(EMPTY_MANUAL_PASSWORD_EDITOR_DRAFT.accountId);
    setManualPasswordEditorValue(EMPTY_MANUAL_PASSWORD_EDITOR_DRAFT.password);
    if (shouldRestoreDrawer) {
      setAccessDrawerOpen(true);
    }
  };

  const submitManualPasswordEditor = async () => {
    const normalizedPassword = String(manualPasswordEditorValue || '').trim();
    if (!normalizedPassword) {
      toast.error('密码不能为空');
      return;
    }

    const targetRow = sortedAccessRows.find((row) => row.id === manualPasswordEditorRowId) || null;
    const primaryAccount = targetRow?.linkedAccounts.find((account) => account.id === manualPasswordEditorAccountId)
      || targetRow?.linkedAccounts[0]
      || null;
    if (!targetRow || !primaryAccount) {
      toast.error('未找到要更新的账号，请关闭后重试');
      return;
    }

    const changeNote = [
      `密码于${new Date().toLocaleString('zh-CN', { hour12: false })}手动设定`,
      `操作人：${currentUser?.name || '系统管理员'}`,
      '来源：账号与访问唯一登录源',
    ].join('；');

    const previousAccounts = draft.internalAccounts;
    setSaving(true);
    let savedAccount: InternalAccount | null = null;
    try {
      const result = await updateAdminAccountPassword({
        accountId: primaryAccount.id,
        nextPassword: normalizedPassword,
        forcePasswordReset: Boolean(primaryAccount.forcePasswordReset),
      });
      const returnedAccount = (result.account || {}) as Partial<InternalAccount>;
      savedAccount = {
        ...primaryAccount,
        ...returnedAccount,
        loginPassword: normalizedPassword,
        notes: returnedAccount.notes || (primaryAccount.notes ? `${primaryAccount.notes}；${changeNote}` : changeNote),
      };
      setDraft((current) => ({
        ...current,
        internalAccounts: current.internalAccounts.map((account) => (
          account.id === primaryAccount.id ? savedAccount as InternalAccount : account
        )),
      }));
      toast.success('密码已手动设定，并将以账号与访问为唯一同步源');
    } catch (error) {
      console.error('Manual password update failed', error);
      toast.error(`账号更新失败：${String((error as Error)?.message || error || '请重试')}`);
      setDraft((current) => ({ ...current, internalAccounts: previousAccounts }));
      return;
    } finally {
      setSaving(false);
    }
    if (!savedAccount) return;

    await recordPasswordAudit(
      {
        ...savedAccount,
        loginPassword: normalizedPassword,
        notes: savedAccount.notes,
      },
      'manual_set',
      '人工手动设定密码',
      Boolean(savedAccount.forcePasswordReset),
    );
    await loadPasswordAuditRecords();
    setSelectedAccessRowId(targetRow.id);
    closeManualPasswordEditor();
  };

  const handleIssueFormalActivation = async (row: typeof sortedAccessRows[number]) => {
    const primaryAccount = row.linkedAccounts[0];
    if (!primaryAccount) {
      toast.info('请先开通账号，再发放正式激活');
      return;
    }
    const loadingToastId = toast.loading('正在发放正式激活…');
    try {
      let invitedAt = new Date().toISOString();
      let inviteExpiresAt = buildInviteExpiry();
      let nextAuthUserId = primaryAccount.authUserId || '';
      let inviteNote = `正式激活已于${new Date(invitedAt).toLocaleString('zh-CN', { hour12: false })}发放`;

      if (primaryAccount.primaryIdentitySource === 'email') {
        const inviteResult = await sendAdminEmailInvite({
          authUserId: primaryAccount.authUserId || '',
          loginEmail: primaryAccount.loginEmail || row.emailRaw || '',
          employeeId: row.id,
          employeeName: row.name,
          role: primaryAccount.role || row.permissionRole.code,
          region: primaryAccount.region || row.region,
        });
        invitedAt = inviteResult.invitedAt || invitedAt;
        inviteExpiresAt = inviteResult.inviteExpiresAt || inviteExpiresAt;
        nextAuthUserId = inviteResult.authUserId || nextAuthUserId;
        inviteNote = inviteResult.deliveryMode === 'magiclink'
          ? `正式邮箱登录链接已于${new Date(invitedAt).toLocaleString('zh-CN', { hour12: false })}重新发送`
          : `正式邮箱邀请已于${new Date(invitedAt).toLocaleString('zh-CN', { hour12: false })}发送`;

        if (inviteResult.deliveryMode === 'magiclink') {
          if (inviteResult.inviteUrl) {
            try {
              await navigator.clipboard.writeText(inviteResult.inviteUrl);
              toast.success('正式激活链接已复制。当前为已存在认证账号，系统生成登录链接但不会自动发邮件。');
            } catch {
              window.prompt('当前不会自动发邮件，请复制正式激活链接：', inviteResult.inviteUrl);
              toast.info('正式激活链接已生成，请手动复制并打开。');
            }
          } else {
            toast.warning('当前为已存在认证账号。本次未自动发邮件，请改为手动打开正式激活链接。');
          }
        }
      } else if (primaryAccount.primaryIdentitySource === 'whatsapp') {
        const whatsappResult = await sendAdminWhatsappAssist({
          employeeId: row.id,
          employeeName: row.name,
          whatsappAccount: primaryAccount.whatsappAccount || '',
          loginEmail: primaryAccount.loginEmail || row.emailRaw || '',
        });
        invitedAt = whatsappResult.sentAt || invitedAt;
        inviteExpiresAt = whatsappResult.expiresAt || inviteExpiresAt;
        inviteNote = `WhatsApp 辅助触达已于${new Date(invitedAt).toLocaleString('zh-CN', { hour12: false })}发送`;
      }

      await onAutoPatchAccount(
        primaryAccount.id,
        {
          authMode: primaryAccount.authMode === 'test' ? 'production' : primaryAccount.authMode,
          activationStatus: 'invited',
          authUserId: nextAuthUserId,
          invitedAt,
          inviteExpiresAt,
          lastInviteChannel: primaryAccount.primaryIdentitySource || 'email',
          activatedAt: '',
          notes: primaryAccount.notes ? `${primaryAccount.notes}；${inviteNote}` : inviteNote,
        },
        primaryAccount.primaryIdentitySource === 'email'
          ? '正式邮箱邀请已发送，等待完成激活'
          : primaryAccount.primaryIdentitySource === 'whatsapp'
            ? 'WhatsApp 辅助触达已发送，等待完成激活'
            : '正式账号已发放，等待完成激活',
      );
      setSelectedAccessRowId(row.id);
    } catch (error) {
      console.error('Issue formal activation failed', error);
      const message = String((error as Error)?.message || error || '').trim();
      toast.error(message ? `发放正式激活失败：${message}` : '发放正式激活失败，请重试');
    } finally {
      toast.dismiss(loadingToastId);
    }
  };

  const handleMarkIdentityVerified = async (
    row: typeof sortedAccessRows[number],
    source: 'email' | 'phone',
  ) => {
    const primaryAccount = row.linkedAccounts[0];
    if (!primaryAccount) {
      toast.info('请先开通账号，再标记认证状态');
      return;
    }

    if (source === 'email') {
      await onAutoPatchAccount(
        primaryAccount.id,
        {
          emailVerified: true,
          activationStatus: 'email_verified',
          inviteExpiresAt: primaryAccount.inviteExpiresAt || buildInviteExpiry(),
        },
        '已标记邮箱验证完成',
      );
    } else {
      await onAutoPatchAccount(
        primaryAccount.id,
        {
          phoneVerified: true,
          activationStatus: 'phone_verified',
          inviteExpiresAt: primaryAccount.inviteExpiresAt || buildInviteExpiry(),
        },
        '已标记手机验证完成',
      );
    }
    setSelectedAccessRowId(row.id);
  };

  const handleFinalizeActivation = async (row: typeof sortedAccessRows[number]) => {
    const primaryAccount = row.linkedAccounts[0];
    if (!primaryAccount) {
      toast.info('请先开通账号，再完成正式激活');
      return;
    }

    if (primaryAccount.primaryIdentitySource === 'email' && !primaryAccount.emailVerified) {
      toast.error('请先完成邮箱验证，再执行正式激活');
      return;
    }

    if (primaryAccount.primaryIdentitySource === 'phone' && !primaryAccount.phoneVerified) {
      toast.error('请先完成手机验证，再执行正式激活');
      return;
    }

    await onAutoPatchAccount(
      primaryAccount.id,
        {
          activationStatus: 'active',
          accountStatus: 'active',
          canLogin: true,
          activatedAt: new Date().toISOString(),
        },
        '正式账号已激活',
    );
    setSelectedAccessRowId(row.id);
  };

  const handleInvalidateActivationInvite = async (row: typeof sortedAccessRows[number]) => {
    const primaryAccount = row.linkedAccounts[0];
    if (!primaryAccount) {
      toast.info('当前没有可失效的激活邀请');
      return;
    }
    await onAutoPatchAccount(
      primaryAccount.id,
      {
        activationStatus: 'draft',
        inviteExpiresAt: '',
      },
      '已使当前激活邀请失效',
    );
    setSelectedAccessRowId(row.id);
  };

  const handleResetPassword = async (row: typeof sortedAccessRows[number]) => {
    const primaryAccount = row.linkedAccounts[0];
    if (!primaryAccount) {
      toast.info('请先开通账号，再重置密码');
      return;
    }
    await onAutoResetAccountPassword(primaryAccount.id);
    setSelectedAccessRowId(row.id);
  };

  const handleBatchResendActivation = async () => {
    const targetIds = filteredInviteActionRows
      .map((row) => row.linkedAccounts[0]?.id)
      .filter(Boolean) as string[];
    if (!targetIds.length) {
      toast.info('当前筛选结果里没有可重发激活的账号');
      return;
    }

    const invitedAt = new Date().toISOString();
    await onBatchPatchAccounts(
      targetIds,
      (account) => ({
        authMode: account.authMode === 'test' ? 'production' : account.authMode,
        activationStatus: 'invited',
        invitedAt,
        inviteExpiresAt: buildInviteExpiry(),
        lastInviteChannel: account.primaryIdentitySource || 'email',
        activatedAt: '',
      }),
      `已批量重发 ${targetIds.length} 个正式账号激活邀请`,
      '批量重发激活失败，请重试',
    );
  };

  const handleBatchInvalidateActivation = async () => {
    const targetIds = filteredInviteActionRows
      .map((row) => row.linkedAccounts[0]?.id)
      .filter(Boolean) as string[];
    if (!targetIds.length) {
      toast.info('当前筛选结果里没有可失效的激活邀请');
      return;
    }

    await onBatchPatchAccounts(
      targetIds,
      () => ({
        activationStatus: 'draft',
        inviteExpiresAt: '',
      }),
      `已批量使 ${targetIds.length} 个激活邀请失效`,
      '批量使邀请失效失败，请重试',
    );
  };

  const handleExportActivationList = () => {
    const targetRows = filteredInviteActionRows.length ? filteredInviteActionRows : filteredActivatedRows;
    if (!targetRows.length) {
      toast.info('当前筛选结果里没有可导出的正式账号名单');
      return;
    }

    const csv = buildFormalActivationCsv(targetRows);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `formal-account-activation-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    toast.success(`已导出 ${targetRows.length} 条正式账号名单`);
  };

  const submitIdentityEditor = async () => {
    if (!selectedAccessRow) return;
    const primaryAccount = selectedAccessRow.linkedAccounts[0];
    if (!primaryAccount) {
      toast.error('当前人员尚未开通账号');
      return;
    }

    const nextUsername = identityEditorUsername.trim();
    const nextLoginEmail = identityEditorLoginEmail.trim().toLowerCase();
    const reason = identityEditorReason.trim();

    if (!nextUsername) {
      toast.error('登录账号不能为空');
      return;
    }
    if (!nextLoginEmail) {
      toast.error('登录邮箱不能为空');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextLoginEmail)) {
      toast.error('请输入有效的登录邮箱');
      return;
    }
    if (!reason) {
      toast.error('请填写变更原因');
      return;
    }
    if (adminPortalPolicy.requireApprovalForIdentityChange && !identityApprovalChecked) {
      toast.error('请先确认变更已审批');
      return;
    }
    if (adminPortalPolicy.requireAuthSyncForIdentityChange && !identityAuthSyncChecked) {
      toast.error('请确认将同步认证系统');
      return;
    }
    if (adminPortalPolicy.requirePasswordResetAfterIdentityChange && !identityPasswordResetChecked) {
      toast.error('请确认变更后强制改密');
      return;
    }
    if (
      nextUsername === String(primaryAccount.username || '').trim() &&
      nextLoginEmail === String(primaryAccount.loginEmail || '').trim().toLowerCase()
    ) {
      toast.info('账号标识未发生变化');
      return;
    }

    await onApplyAccountIdentityChange({
      rowId: selectedAccessRow.id,
      accountId: primaryAccount.id,
      nextUsername,
      nextLoginEmail,
      reason,
    });
    closeIdentityEditor();
    setSelectedAccessRowId(selectedAccessRow.id);
    void loadIdentityAuditRecords();
  };

  const submitProvisionEditor = async () => {
    if (!provisionEditorRowId) return;
    const primaryIdentitySource = provisionIdentityDraft.primaryIdentitySource;
    const loginEmail = provisionIdentityDraft.loginEmail.trim().toLowerCase();
    const phoneLogin = provisionIdentityDraft.phoneLogin.trim();
    const wechatOpenId = provisionIdentityDraft.wechatOpenId.trim();
    const enterpriseWechatUserId = provisionIdentityDraft.enterpriseWechatUserId.trim();
    const whatsappAccount = provisionIdentityDraft.whatsappAccount.trim();

    if (primaryIdentitySource === 'email') {
      if (!loginEmail) {
        toast.error('请选择邮箱登录时，登录邮箱不能为空');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail)) {
        toast.error('请输入有效的登录邮箱');
        return;
      }
    }

    if (primaryIdentitySource === 'phone' && !phoneLogin) {
      toast.error('请选择手机号登录时，请填写手机号');
      return;
    }

    if (primaryIdentitySource === 'wechat' && !wechatOpenId) {
      toast.error('请选择微信登录时，请填写微信绑定标识');
      return;
    }

    if (primaryIdentitySource === 'enterprise_wechat' && !enterpriseWechatUserId) {
      toast.error('请选择企业微信登录时，请填写企业微信用户标识');
      return;
    }

    if (primaryIdentitySource === 'whatsapp' && !whatsappAccount) {
      toast.error('请选择 WhatsApp 辅助登录时，请填写 WhatsApp 账号');
      return;
    }

    await handleProvisionAccount(provisionEditorRowId, {
      ...provisionIdentityDraft,
      loginEmail,
      phoneLogin,
      wechatOpenId,
      enterpriseWechatUserId,
      whatsappAccount,
    });
    closeProvisionEditor();
  };

  const openRoleEditorForRow = (rowId: string) => {
    const row = linkedRows.find((item) => item.id === rowId);
    if (!row) return;
    const draftValue = buildRoleEditorDraft(row);
    setSelectedRoleRowId(rowId);
    setSelectedAccessRowId(rowId);
    setAccessDrawerOpen(false);
    setRoleEditorRowId(draftValue.rowId);
    setRoleEditorCode(draftValue.code);
  };

  const closeRoleEditor = () => {
    setRoleEditorRowId(EMPTY_ROLE_EDITOR_DRAFT.rowId);
    setRoleEditorCode(EMPTY_ROLE_EDITOR_DRAFT.code);
    setRoleEditorSaving(false);
  };

  const selectedRoleEditorRow = roleEditorRowId
    ? linkedRows.find((item) => item.id === roleEditorRowId) || null
    : null;
  const roleEditorUnchanged = Boolean(
    selectedRoleEditorRow &&
    roleEditorCode &&
    String(selectedRoleEditorRow.permissionRole?.code || selectedRoleEditorRow.linkedAccounts?.[0]?.role || '').trim() ===
      String(roleEditorCode || '').trim(),
  );

  const saveRoleEditor = async () => {
    try {
      if (roleEditorUnchanged) {
        toast.info('角色未发生变化');
        closeRoleEditor();
        return;
      }
      if (!roleEditorRowId || !roleEditorCode) {
        toast.error('请选择角色');
        return;
      }
      const row = linkedRows.find((item) => item.id === roleEditorRowId);
      if (!row) {
        toast.error('未找到当前人员记录');
        return;
      }
      const primaryAccount = row.linkedAccounts[0];
      const targetRegion = primaryAccount?.region || row.regionRaw || row.region || 'all';
      const currentRoleCode = row.permissionRole.code || primaryAccount?.role || '';
      if (primaryAccount && currentRoleCode === roleEditorCode && targetRegion === (primaryAccount.region || targetRegion)) {
        toast.info('角色未发生变化');
        closeRoleEditor();
        return;
      }
      const roleProfile = getDepartmentAndTitleForRole(roleEditorCode, targetRegion);
      setRoleEditorSaving(true);
      if (primaryAccount) {
        const didPersist = await onPersistRoleEditorChange({
          rowId: row.id,
          primaryAccountId: primaryAccount.id,
          roleCode: roleEditorCode,
          targetRegion,
          department: roleProfile.department,
          title: roleProfile.title,
        });
        if (didPersist) {
          closeRoleEditor();
        }
      } else {
        closeRoleEditor();
        await onAutoProvisionAccount(roleEditorRowId, roleEditorCode);
      }
    } catch (error) {
      console.error('saveRoleEditor outer catch', error);
      toast.error(`保存角色失败：${String((error as Error)?.message || error || 'unknown error')}`);
    } finally {
      setRoleEditorSaving(false);
    }
  };

  const roleDepartmentOptions = useMemo(
    () => Array.from(new Set(linkedRows.map((row) => row.department).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'zh-CN')),
    [linkedRows],
  );

  const filteredRoleRows = useMemo(() => {
    const keyword = roleSearch.trim().toLowerCase();
    return linkedRows.filter((row) => {
      const matchesKeyword =
        !keyword ||
        `${row.name} ${row.employeeNo} ${row.department} ${row.title} ${row.permissionRole.name} ${row.permissionRole.code}`.toLowerCase().includes(keyword);
      const matchesDepartment = roleDepartmentFilter === 'all' || row.department === roleDepartmentFilter;
      const matchesStatus = roleStatusFilter === 'all' || row.status === roleStatusFilter;
      return matchesKeyword && matchesDepartment && matchesStatus;
    });
  }, [linkedRows, roleDepartmentFilter, roleSearch, roleStatusFilter]);

  const sortedRoleRows = useMemo(() => {
    const rows = [...filteredRoleRows];
    rows.sort((a, b) => {
      const valueA =
        roleSortKey === 'roleName' ? a.permissionRole.name :
        roleSortKey === 'roleCode' ? a.permissionRole.code :
        a[roleSortKey];
      const valueB =
        roleSortKey === 'roleName' ? b.permissionRole.name :
        roleSortKey === 'roleCode' ? b.permissionRole.code :
        b[roleSortKey];
      const normalizedA = String(valueA || '').toLowerCase();
      const normalizedB = String(valueB || '').toLowerCase();
      if (normalizedA < normalizedB) return roleSortDirection === 'asc' ? -1 : 1;
      if (normalizedA > normalizedB) return roleSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [filteredRoleRows, roleSortDirection, roleSortKey]);

  useEffect(() => {
    if (!sortedRoleRows.length) {
      setSelectedRoleRowId('');
      return;
    }
    if (!selectedRoleRowId || !sortedRoleRows.some((row) => row.id === selectedRoleRowId)) {
      setSelectedRoleRowId(sortedRoleRows[0].id);
    }
  }, [selectedRoleRowId, sortedRoleRows]);

  const selectedRoleRow = sortedRoleRows.find((row) => row.id === selectedRoleRowId) || sortedRoleRows[0] || null;

  const toggleRoleSort = (key: 'name' | 'employeeNo' | 'department' | 'title' | 'roleName' | 'roleCode') => {
    const next = getNextSortState(roleSortKey, roleSortDirection, key);
    setRoleSortKey(next.key);
    setRoleSortDirection(next.direction);
  };

  const renderRoleSortIcon = (key: 'name' | 'employeeNo' | 'department' | 'title' | 'roleName' | 'roleCode') => {
    return renderSortIcon(roleSortKey, key, roleSortDirection);
  };

  const roleMetrics = useMemo(() => ({
    assignedPeople: linkedRows.filter((row) => row.permissionRole.code !== 'Unassigned').length,
    roleKinds: roleSummary.filter((item) => item.role !== 'Unassigned').length,
    unmappedPeople: linkedRows.filter((row) => row.permissionRole.code === 'Unassigned').length,
  }), [linkedRows, roleSummary]);

  const openPermissionCenter = () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'permission-center' } }));
  };

  return (
    <PeopleAccountCenterContent
      activeView={activeView}
      setActiveView={setActiveView}
      peopleViewProps={{
        peopleViewMode,
        setPeopleViewMode,
        peopleSearch,
        setPeopleSearch,
        peopleDepartmentFilter,
        setPeopleDepartmentFilter,
        peopleStatusFilter,
        setPeopleStatusFilter,
        peopleDepartmentOptions,
        canEdit,
        isEdit,
        onCancelEdit,
        onSave,
        saving,
        onAddContact,
        setSelectedPersonId,
        onEnterEdit,
        peopleTableContainerRef,
        setPeopleSortKey,
        setDraggingPersonId,
        draggingPersonId,
        draggingToTop,
        isPeopleDragEnabled,
        isPointerDraggingPeople,
        setIsPointerDraggingPeople,
        setDraggingToTop,
        setDragOverPersonId,
        handlePeopleDropToTop,
        peopleTableMinWidth,
        getPeopleColumnStyle,
        togglePeopleSort,
        renderPeopleSortIcon,
        renderPeopleColumnResizeHandle,
        peopleOrgRows,
        editablePeopleRows,
        peopleListHierarchyRows,
        directHierarchyMap,
        orgHierarchyMap,
        visibleListHierarchyMap,
        peopleOrgFamilyStyles,
        fallbackFamilyStyle: ORG_FAMILY_COLOR_PALETTE[0],
        peopleDepartmentSelectOptions,
        peopleTitleOptionsByDepartment,
        peopleDescendantIdMap,
        dragOverPersonId,
        dragOverMode,
        selectedPersonId,
        resolvePeopleDropMode,
        setDragOverMode,
        handlePeopleDrop,
        commitPeopleDrop,
        resetPeopleDragState,
        onUpdateContact,
        peopleManagerSelectOptions,
        renderHierarchyDots,
        onRemoveContact,
        setPersonDrawerOpen,
        sortedPeopleRows,
        personDrawerOpen,
        selectedPerson,
        personDialogOffset,
        dragStartRef,
        peopleManagerLabelMap,
      }}
      accessTableProps={{
        accessSearch,
        setAccessSearch,
        accessDepartmentFilter,
        setAccessDepartmentFilter,
        accessDepartmentOptions,
        accessRegionFilter,
        setAccessRegionFilter,
        accessRegionOptions,
        accessStatusFilter,
        setAccessStatusFilter,
        filteredInviteActionRows,
        filteredActivatedRows,
        handleBatchResendActivation,
        handleBatchInvalidateActivation,
        handleExportActivationList,
        accessTableContainerRef,
        accessTableMinWidth,
        getAccessColumnStyle,
        toggleAccessSort,
        renderAccessSortIcon,
        renderAccessColumnResizeHandle,
        sortedAccessRows,
        selectedAccessRow,
        setSelectedAccessRowId,
        setAccessDrawerOpen,
        getAccountStatusMeta,
        getAuthModeMeta,
        getActivationStatusMeta,
        getIdentitySourceLabel,
        formatDateTime,
        openIdentityEditorForRow,
        openRoleEditorForRow,
        handleToggleAccountStatus,
        onAutoResetAccountPassword,
        handleToggleForcePasswordReset,
        openProvisionEditorForRow,
        isInternalAccountUsernameLocked,
        isInternalAccountLoginEmailLocked,
      }}
      accessAuditProps={{
        selectedAccessRow,
        selectedAccessAuditRecords,
        selectedAccessPasswordAuditRecords,
        identityAuditRecords,
        passwordAuditRecords,
        identityAuditLoading,
        passwordAuditLoading,
        loadIdentityAuditRecords,
        loadPasswordAuditRecords,
        formatDateTime,
      }}
      overlaysProps={{
        accessDrawerOpen,
        selectedAccessRow,
        setAccessDrawerOpen,
        getAuthModeMeta,
        getAccountStatusMeta,
        getActivationStatusMeta,
        getIdentitySourceLabel,
        formatDateTime,
        openIdentityEditorForRow,
        openRoleEditorForRow,
        openProvisionEditorForRow,
        handleIssueFormalActivation,
        handleMarkIdentityVerified,
        handleFinalizeActivation,
        handleInvalidateActivationInvite,
        handleResetPassword,
        handleSetManualPassword,
        handleToggleForcePasswordReset,
        provisionEditorOpen,
        provisionEditorRowId,
        linkedRows,
        closeProvisionEditor,
        provisionIdentityDraft,
        setProvisionIdentityDraft,
        submitProvisionEditor,
        identityEditorOpen,
        closeIdentityEditor,
        identityEditorUsername,
        setIdentityEditorUsername,
        identityEditorLoginEmail,
        setIdentityEditorLoginEmail,
        identityEditorReason,
        setIdentityEditorReason,
        identityApprovalChecked,
        setIdentityApprovalChecked,
        identityAuthSyncChecked,
        setIdentityAuthSyncChecked,
        identityPasswordResetChecked,
        setIdentityPasswordResetChecked,
        submitIdentityEditor,
        manualPasswordEditorOpen,
        sortedAccessRows,
        manualPasswordEditorRowId,
        closeManualPasswordEditor,
        manualPasswordEditorValue,
        setManualPasswordEditorValue,
        submitManualPasswordEditor,
        roleEditorRowId,
        selectedRoleEditorRow,
        closeRoleEditor,
        roleEditorCode,
        setRoleEditorCode,
        permissionRoleMap,
        roleEditorUnchanged,
        saveRoleEditor,
        saving,
        roleEditorSaving,
      }}
      roleViewProps={{
        roleSearch,
        setRoleSearch,
        roleDepartmentFilter,
        setRoleDepartmentFilter,
        roleStatusFilter,
        setRoleStatusFilter,
        roleDepartmentOptions,
        roleTableContainerRef,
        roleTableMinWidth,
        getRoleColumnStyle,
        toggleRoleSort,
        renderRoleSortIcon,
        renderRoleColumnResizeHandle,
        sortedRoleRows,
        selectedRoleRow,
        setSelectedRoleRowId,
        openPermissionCenter,
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Permission
// ─────────────────────────────────────────────────────────────────────────────
const INTERNAL_ROLES = new Set([
  'Admin', 'CEO', 'CFO',
  'Sales_Director', 'Regional_Manager', 'Sales_Manager', 'Sales_Rep', 'Sales_Assistant',
  'Finance', 'External_Accountant',
  'Procurement_Manager', 'Procurement',
  'Marketing_Ops', 'Marketing_Assistant', 'Documentation_Officer',
  'QC', 'Warehouse_Ops', 'HR_Admin', 'Admin_Ops',
]);

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
interface Props { onBack?: () => void; }

export default function AdminOrganizationProfile({ onBack }: Props) {
  const { adminOrg, updateAdminOrg, restoreLatestAdminOrgSnapshot, uploadAdminLogo } = useAdminOrganization();
  const { currentUser } = useAuth();
  const canEdit = !currentUser || INTERNAL_ROLES.has(currentUser.role ?? '');

  // ── State machine ─────────────────────────────────────────────────────────
  const [mode,        setMode]        = useState<Mode>('view');
  const [activeTab,   setActiveTab]   = useState<MasterTab>('basic');
  const [draft,       setDraft]       = useState<AdminOrgProfile>({ ...adminOrg });
  const [restoringSnapshot, setRestoringSnapshot] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(adminOrg.logoUrl);
  const [logoFile,    setLogoFile]    = useState<File | null>(null);
  const [saving,      setSaving]      = useState(false);
  const [remoteSyncStatus, setRemoteSyncStatus] = useState<string | null>(null);
  const [backExitArmed, setBackExitArmed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const remoteSyncTimerRef = useRef<number | null>(null);
  const draftRef = useRef<AdminOrgProfile>(draft);
  const adminOrgRef = useRef(adminOrg);
  const logoPreviewRef = useRef<string | null>(logoPreview);
  const reorderPendingContactsRef = useRef<InternalContact[] | null>(null);
  const reorderSaveTimerRef = useRef<number | null>(null);
  const reorderSaveInFlightRef = useRef(false);

  useEffect(() => {
    if (mode === 'view') {
      setDraft({ ...adminOrg });
      setLogoPreview(adminOrg.logoUrl);
    }
  }, [adminOrg, mode]);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    adminOrgRef.current = adminOrg;
  }, [adminOrg]);

  useEffect(() => {
    logoPreviewRef.current = logoPreview;
  }, [logoPreview]);

  useEffect(() => () => {
    if (remoteSyncTimerRef.current !== null) {
      window.clearTimeout(remoteSyncTimerRef.current);
    }
  }, []);

  const markRemoteSyncPending = useCallback((message: string) => {
    if (remoteSyncTimerRef.current !== null) {
      window.clearTimeout(remoteSyncTimerRef.current);
    }
    setRemoteSyncStatus(message);
    remoteSyncTimerRef.current = window.setTimeout(() => {
      setRemoteSyncStatus(null);
      remoteSyncTimerRef.current = null;
    }, 8000);
  }, []);

  const clearRemoteSyncPending = useCallback(() => {
    if (remoteSyncTimerRef.current !== null) {
      window.clearTimeout(remoteSyncTimerRef.current);
      remoteSyncTimerRef.current = null;
    }
    setRemoteSyncStatus(null);
  }, []);

  const announceRemoteSaveResult = useCallback((
    result: { remoteSaved: boolean; localSaved: boolean },
    successMessage: string,
    pendingMessage: string,
  ) => {
    if (result.remoteSaved) {
      clearRemoteSyncPending();
      toast.success(successMessage);
      return;
    }

    if (result.localSaved) {
      markRemoteSyncPending(pendingMessage);
      toast.warning(`${pendingMessage}，系统正在后台继续同步。`);
      return;
    }

    toast.error('本地缓存保存失败，请检查浏览器存储空间。');
  }, [clearRemoteSyncPending, markRemoteSyncPending]);

  useEffect(() => {
    if (!backExitArmed) return undefined;
    const timer = window.setTimeout(() => setBackExitArmed(false), 1800);
    return () => window.clearTimeout(timer);
  }, [backExitArmed]);

  useEffect(() => () => {
    if (reorderSaveTimerRef.current !== null) {
      window.clearTimeout(reorderSaveTimerRef.current);
    }
  }, []);

  // ── Draft field setters ───────────────────────────────────────────────────
  type TopKey = keyof Omit<
    AdminOrgProfile,
    'id' | 'logoUrl' | 'bankRMB' | 'bankUSD' | 'bankPrivate' | 'internalContacts' | 'internalAccounts' | 'documentDefaults'
  >;
  const set     = (k: TopKey, v: string)                       => setDraft(p => ({ ...p, [k]: v }));
  const setRMB  = (k: keyof BankAccountRMB, v: string)         => setDraft(p => ({ ...p, bankRMB:     { ...p.bankRMB,     [k]: v } }));
  const setUSD  = (k: keyof BankAccountUSD, v: string)         => setDraft(p => ({ ...p, bankUSD:     { ...p.bankUSD,     [k]: v } }));
  const setPriv = (k: keyof BankAccountPrivate, v: string)     => setDraft(p => ({ ...p, bankPrivate: { ...p.bankPrivate, [k]: v } }));
  const setDocDefault = (k: keyof AdminOrgProfile['documentDefaults'], v: string) =>
    setDraft(p => ({ ...p, documentDefaults: { ...p.documentDefaults, [k]: v } }));
  const setContact = (id: string, key: keyof InternalContact, value: string | boolean) =>
    setDraft(p => ({
      ...p,
      internalContacts: p.internalContacts.map(contact =>
        contact.id === id ? { ...contact, [key]: value } : contact
      ),
    }));
  const addContact = async () => {
    const nextContact: InternalContact = {
      id: `contact-${Date.now()}`,
      employeeNo: getNextEmployeeNo(draft.internalContacts),
      name: '',
      department: '',
      title: '',
      region: '',
      managerId: '',
      extension: '',
      phone: '',
      email: '',
      wechat: '',
      status: '在职',
      visibleInDocuments: true,
    };
    const nextContacts = normalizeContactEmployeeNos([
      ...draft.internalContacts,
      nextContact,
    ]);

    const previousContacts = draft.internalContacts;
    setDraft((p) => ({ ...p, internalContacts: nextContacts }));
    setSaving(true);
    try {
      const saveResult = await updateAdminOrg(
        buildAdminOrgPatch(draft, {
          internalContacts: nextContacts,
          internalAccounts: adminOrg.internalAccounts,
          ...(logoPreview !== adminOrg.logoUrl ? { logoUrl: logoPreview } : {}),
        }),
      );
      announceRemoteSaveResult(saveResult, '人员已新增，并已同步云端', '人员已新增，已保存到本地');
      return nextContact.id;
    } catch (error) {
      console.error('Add contact failed', error);
      toast.error('新增人员失败，请重试');
      setDraft((p) => ({ ...p, internalContacts: previousContacts }));
      return undefined;
    } finally {
      setSaving(false);
    }
  };
  const removeContact = (id: string) =>
    setDraft((p) => {
      if (p.internalContacts.length <= 1) return p;

      const nextContacts = normalizeContactEmployeeNos(
        p.internalContacts.filter((contact) => contact.id !== id),
      );
      const nextAccounts = p.internalAccounts.map((account) => (
        account.employeeId === id
          ? {
              ...account,
              accountStatus: 'deleted',
              canLogin: false,
              forcePasswordReset: false,
              notes: account.notes
                ? `${account.notes}；人员主档已删除，账号已归档停用`
                : '人员主档已删除，账号已归档停用',
            }
          : account
      ));

      return {
        ...p,
        internalContacts: nextContacts,
        internalAccounts: nextAccounts,
      };
    });
  const reorderContact = (draggedId: string, targetId: string, dropMode: OrgDropMode, managerId?: string) =>
    setDraft(p => {
      const nextContacts = managerId === '__TOP__'
        ? buildTopInsertedContacts(p.internalContacts, draggedId)
        : buildReorderedContacts(p.internalContacts, draggedId, targetId, dropMode, managerId);
      return nextContacts === p.internalContacts ? p : { ...p, internalContacts: nextContacts };
    });
  const autoReorderContact = async (draggedId: string, targetId: string, dropMode: OrgDropMode, managerId?: string) => {
    const nextContacts = managerId === '__TOP__'
      ? buildTopInsertedContacts(draft.internalContacts, draggedId)
      : buildReorderedContacts(draft.internalContacts, draggedId, targetId, dropMode, managerId);
    if (nextContacts === draft.internalContacts) return;
    setDraft((p) => ({ ...p, internalContacts: nextContacts }));
    reorderPendingContactsRef.current = nextContacts;
    if (reorderSaveTimerRef.current !== null) {
      window.clearTimeout(reorderSaveTimerRef.current);
    }
    const flushReorderSave = async () => {
      if (reorderSaveInFlightRef.current) return;
      const pendingContacts = reorderPendingContactsRef.current;
      if (!pendingContacts) return;
      reorderPendingContactsRef.current = null;
      reorderSaveInFlightRef.current = true;
      try {
        const baseDraft = draftRef.current;
        const currentAdminOrg = adminOrgRef.current;
        const currentLogoPreview = logoPreviewRef.current;
        const result = await updateAdminOrg(
          buildAdminOrgPatch(baseDraft, {
            internalContacts: pendingContacts,
            internalAccounts: baseDraft.internalAccounts,
            ...(currentLogoPreview !== currentAdminOrg.logoUrl ? { logoUrl: currentLogoPreview } : {}),
          }),
        );
        announceRemoteSaveResult(result, '组织顺序已自动保存并同步云端', '组织顺序已自动保存到本地');
      } catch (error) {
        console.error('Auto save reorder failed', error);
        toast.error('组织顺序自动保存失败，请重试');
      } finally {
        reorderSaveInFlightRef.current = false;
        if (reorderPendingContactsRef.current) {
          void flushReorderSave();
        }
      }
    };
    reorderSaveTimerRef.current = window.setTimeout(() => {
      reorderSaveTimerRef.current = null;
      void flushReorderSave();
    }, 180);
  };
  const recordPasswordAudit = async (
    account: InternalAccount,
    action: 'manual_set' | 'reset',
    reason: string,
    forcePasswordReset: boolean,
  ) => {
    const linkedContact = draft.internalContacts.find((contact) => contact.id === account.employeeId);
    await adminAccountPasswordAuditService.record({
      action,
      accountId: account.id,
      employeeId: account.employeeId || '',
      employeeNo: linkedContact?.employeeNo || '',
      employeeName: linkedContact?.name || '',
      username: account.username || '',
      loginEmail: account.loginEmail || '',
      actorName: currentUser?.name || '系统管理员',
      actorEmail: currentUser?.email || '',
      forcePasswordReset,
      reason,
    });
  };
  const persistAccounts = async (
    nextAccounts: InternalAccount[],
    successMessage: string,
    rollbackMessage = '账号更新失败，请重试',
    options?: {
      changedAccountIds?: string[];
      allowPasswordWriteAccountIds?: string[];
    },
  ) => {
    const reconciledAccounts = preserveLatestAuthFieldsForUntouchedAccounts(
      nextAccounts,
      adminOrg.internalAccounts,
      options?.changedAccountIds || [],
    );
    const previousAccounts = draft.internalAccounts;
    setDraft((p) => ({ ...p, internalAccounts: reconciledAccounts }));
    setSaving(true);
    try {
      const result = await updateAdminOrg(
        buildAdminOrgPatch(draft, {
          internalContacts: draft.internalContacts,
          internalAccounts: reconciledAccounts,
          ...(logoPreview !== adminOrg.logoUrl ? { logoUrl: logoPreview } : {}),
        }),
        {
          allowPasswordWriteAccountIds: options?.allowPasswordWriteAccountIds || [],
        },
      );
      announceRemoteSaveResult(result, `${successMessage}，并已同步云端`, `${successMessage}，已保存到本地`);
      return true;
    } catch (error) {
      console.error('Persist accounts failed', error);
      toast.error(rollbackMessage);
      setDraft((p) => ({ ...p, internalAccounts: previousAccounts }));
      return false;
    } finally {
      setSaving(false);
    }
  };
  const syncAdminTestAccountInBackground = (
    payload: {
      accountId: string;
      account: InternalAccount;
      contactName: string;
      successNote?: string;
      warningPrefix: string;
    },
  ) => {
    void (async () => {
      try {
        const syncResult = await ensureAdminTestAccount({
          authUserId: payload.account.authUserId || '',
          loginEmail: payload.account.loginEmail,
          loginPassword: payload.account.loginPassword,
          employeeId: payload.account.employeeId,
          employeeName: payload.contactName || payload.account.username || '',
          role: payload.account.role || '',
          region: payload.account.region || 'all',
          forcePasswordReset: payload.account.forcePasswordReset,
        });

        const syncedAuthUserId = String(syncResult.authUserId || '').trim();
        if (!syncedAuthUserId || syncedAuthUserId === String(payload.account.authUserId || '').trim()) {
          return;
        }

        const syncedAccounts = draftRef.current.internalAccounts.map((account) => (
          account.id === payload.accountId
            ? {
                ...account,
                authUserId: syncedAuthUserId,
                notes: account.notes?.includes(payload.successNote || '已同步测试认证账号')
                  ? account.notes
                  : `${account.notes ? `${account.notes}；` : ''}${payload.successNote || `已同步测试认证账号 ${syncedAuthUserId}`}`,
              }
            : account
        ));

        setDraft((current) => ({
          ...current,
          internalAccounts: syncedAccounts,
        }));

        await updateAdminOrg(
          buildAdminOrgPatch(draftRef.current, {
            internalContacts: draftRef.current.internalContacts,
            internalAccounts: syncedAccounts,
            ...(logoPreviewRef.current !== adminOrgRef.current.logoUrl ? { logoUrl: logoPreviewRef.current } : {}),
          }),
        );
      } catch (syncError) {
        console.error(payload.warningPrefix, syncError);
        toast.warning(`${payload.warningPrefix}：${String((syncError as Error)?.message || syncError || '请稍后重试')}`);
      }
    })();
  };
  const persistRoleEditorChange = async (payload: {
    rowId: string;
    primaryAccountId: string;
    roleCode: string;
    targetRegion: string;
    department?: string;
    title?: string;
  }) => {
    const nextContacts = draft.internalContacts.map((contact) => (
      contact.id === payload.rowId
        ? {
            ...contact,
            department: payload.department || contact.department,
            title: payload.title || contact.title,
            region: payload.targetRegion || contact.region,
          }
        : contact
    ));
    const nextAccounts = preserveLatestAuthFieldsForUntouchedAccounts(
      draft.internalAccounts.map((account) => (
        account.id === payload.primaryAccountId
          ? {
              ...account,
              role: payload.roleCode,
              region: payload.targetRegion || account.region,
              department: payload.department || account.department,
              notes: appendManualRoleOverrideTag(account.notes),
            }
          : account
      )),
      adminOrg.internalAccounts,
      [payload.primaryAccountId],
    );
    const nextDraft = {
      ...draft,
      internalContacts: nextContacts,
      internalAccounts: nextAccounts,
    };
    const previousContacts = draft.internalContacts;
    const previousAccounts = draft.internalAccounts;
    setDraft(nextDraft);
    setSaving(true);
    try {
      const result = await updateAdminOrg(
        buildAdminOrgPatch(nextDraft, {
          ...(logoPreview !== adminOrg.logoUrl ? { logoUrl: logoPreview } : {}),
        }),
      );

      const targetAccount = nextAccounts.find((account) => account.id === payload.primaryAccountId);
      const targetContact = nextContacts.find((contact) => contact.id === payload.rowId);
      if (targetAccount?.loginEmail) {
        syncAdminTestAccountInBackground({
          accountId: payload.primaryAccountId,
          account: targetAccount,
          contactName: targetContact?.name || targetAccount.username || '',
          warningPrefix: '角色已更新，但远端测试身份同步失败',
        });
      }

      announceRemoteSaveResult(result, '角色已更新，并已同步云端', '角色已更新，已保存到本地');
      return true;
    } catch (error) {
      console.error('Persist role editor change failed', error);
      const message = String((error as Error)?.message || error || '');
      const isValidationError =
        message.includes('admin roster validation failed') ||
        message.includes('Duplicate internal contact email') ||
        message.includes('Duplicate internal account email') ||
        message.includes('Invalid internal account role') ||
        message.includes('is not linked to any internal contact') ||
        message.includes('Legacy internal roster artifacts detected');

      if (isValidationError) {
        toast.error('角色更新失败，请检查名单数据后重试');
        setDraft((current) => ({
          ...current,
          internalContacts: previousContacts,
          internalAccounts: previousAccounts,
        }));
        return false;
      }

      toast.warning('角色已更新到当前页面，本地已保留；云端同步暂时失败');
      return true;
    } finally {
      setSaving(false);
    }
  };
  const autoPatchAccount = async (id: string, patch: Partial<InternalAccount>, successMessage = '账号已更新') => {
    const nextAccounts = draft.internalAccounts.map((account) => (
      account.id === id ? { ...account, ...patch } : account
    ));
    if (nextAccounts === draft.internalAccounts) return;
    await persistAccounts(nextAccounts, successMessage, '账号更新失败，请重试', { changedAccountIds: [id] });
  };
  const batchPatchAccounts = async (
    ids: string[],
    patcher: (account: InternalAccount) => Partial<InternalAccount>,
    successMessage = '账号已批量更新',
    rollbackMessage = '批量账号更新失败，请重试',
  ) => {
    const idSet = new Set(ids);
    const nextAccounts = draft.internalAccounts.map((account) => (
      idSet.has(account.id) ? { ...account, ...patcher(account) } : account
    ));
    if (nextAccounts === draft.internalAccounts) return;
    await persistAccounts(nextAccounts, successMessage, rollbackMessage, { changedAccountIds: ids });
  };
  const applyAccountIdentityChange = async (payload: AccountIdentityChangePayload) => {
    const targetAccount = draft.internalAccounts.find((account) => account.id === payload.accountId);
    const targetContact = draft.internalContacts.find((contact) => contact.id === payload.rowId);
    const liveTargetAccount = adminOrg.internalAccounts.find((account) => account.id === payload.accountId);
    if (!targetAccount || !targetContact) {
      toast.error('未找到要变更的账号记录');
      return;
    }

    const normalizedUsername = payload.nextUsername.trim();
    const normalizedLoginEmail = payload.nextLoginEmail.trim().toLowerCase();
    const normalizedReason = payload.reason.trim();

    const duplicatedUsername = draft.internalAccounts.some((account) => (
      account.id !== payload.accountId &&
      String(account.username || '').trim().toLowerCase() === normalizedUsername.toLowerCase()
    ));
    if (duplicatedUsername) {
      toast.error('登录账号已存在，请更换后重试');
      return;
    }

    const duplicatedEmail = draft.internalAccounts.some((account) => (
      account.id !== payload.accountId &&
      String(account.loginEmail || '').trim().toLowerCase() === normalizedLoginEmail
    ));
    if (duplicatedEmail) {
      toast.error('登录邮箱已存在，请更换后重试');
      return;
    }

    const changeNote = [
      `账号标识于${new Date().toLocaleString('zh-CN', { hour12: false })}变更`,
      `账号：${targetAccount.username || '—'} -> ${normalizedUsername}`,
      `邮箱：${targetAccount.loginEmail || '—'} -> ${normalizedLoginEmail}`,
      `原因：${normalizedReason}`,
      adminPortalPolicy.requireAuthSyncForIdentityChange ? '待同步认证系统邮箱' : '',
      adminPortalPolicy.requirePasswordResetAfterIdentityChange ? '已要求下次登录强制改密' : '',
    ].filter(Boolean).join('；');

    let nextAccounts = draft.internalAccounts.map((account) => (
      account.id === payload.accountId
        ? {
            ...account,
            username: normalizedUsername,
            loginEmail: normalizedLoginEmail,
            authUserId: liveTargetAccount?.authUserId || account.authUserId,
            loginPassword: liveTargetAccount?.loginPassword || account.loginPassword,
            authMode: liveTargetAccount?.authMode || account.authMode,
            activationStatus: liveTargetAccount?.activationStatus || account.activationStatus,
            primaryIdentitySource: liveTargetAccount?.primaryIdentitySource || account.primaryIdentitySource,
            phoneLogin: liveTargetAccount?.phoneLogin || account.phoneLogin,
            phoneVerified: liveTargetAccount?.phoneVerified ?? account.phoneVerified,
            emailVerified: liveTargetAccount?.emailVerified ?? account.emailVerified,
            wechatOpenId: liveTargetAccount?.wechatOpenId || account.wechatOpenId,
            enterpriseWechatUserId: liveTargetAccount?.enterpriseWechatUserId || account.enterpriseWechatUserId,
            whatsappAccount: liveTargetAccount?.whatsappAccount || account.whatsappAccount,
            invitedAt: liveTargetAccount?.invitedAt || account.invitedAt,
            inviteExpiresAt: liveTargetAccount?.inviteExpiresAt || account.inviteExpiresAt,
            lastInviteChannel: liveTargetAccount?.lastInviteChannel || account.lastInviteChannel,
            activatedAt: liveTargetAccount?.activatedAt || account.activatedAt,
            lastLoginAt: liveTargetAccount?.lastLoginAt || account.lastLoginAt,
            forcePasswordReset: adminPortalPolicy.requirePasswordResetAfterIdentityChange ? true : account.forcePasswordReset,
            notes: account.notes ? `${account.notes}；${changeNote}` : changeNote,
          }
        : account
    ));
    nextAccounts = preserveLatestAuthFieldsForUntouchedAccounts(
      nextAccounts,
      adminOrg.internalAccounts,
      [payload.accountId],
    );

    const nextContacts = draft.internalContacts.map((contact) => (
      contact.id === payload.rowId
        ? { ...contact, email: normalizedLoginEmail }
        : contact
    ));

    const previousAccounts = draft.internalAccounts;
    const previousContacts = draft.internalContacts;
    let remoteSaveSucceeded = false;
    setDraft((current) => ({
      ...current,
      internalAccounts: nextAccounts,
      internalContacts: nextContacts,
    }));
    setSaving(true);
    try {
      const result = await updateAdminOrg(
        buildAdminOrgPatch(draft, {
          internalContacts: nextContacts,
          internalAccounts: nextAccounts,
          ...(logoPreview !== adminOrg.logoUrl ? { logoUrl: logoPreview } : {}),
        }),
      );
      remoteSaveSucceeded = Boolean(result.remoteSaved);

      let syncResult: Awaited<ReturnType<typeof syncAdminAccountIdentity>> | null = null;
      if (adminPortalPolicy.requireAuthSyncForIdentityChange) {
        syncResult = await syncAdminAccountIdentity({
          authUserId: targetAccount.authUserId || '',
          previousLoginEmail: targetAccount.loginEmail || '',
          nextLoginEmail: normalizedLoginEmail,
          nextUsername: normalizedUsername,
          employeeName: targetContact.name || '',
          role: targetAccount.role || '',
          region: targetAccount.region || 'all',
        });

        const localEmail = normalizedLoginEmail;
        const authEmail = String(syncResult.email || '').trim().toLowerCase();
        const profileEmail = String(syncResult.profileEmail || '').trim().toLowerCase();
        if (!syncResult.consistent || authEmail !== localEmail || profileEmail !== localEmail) {
          throw new Error(
            `账号标识保存后校验失败：internalAccounts=${localEmail} / auth.users=${authEmail || '空'} / user_profiles=${profileEmail || '空'}`,
          );
        }

        const syncedAuthUserId = String(syncResult.authUserId || '').trim();
        if (syncedAuthUserId && syncedAuthUserId !== String(targetAccount.authUserId || '').trim()) {
          nextAccounts = nextAccounts.map((account) => (
            account.id === payload.accountId
              ? {
                  ...account,
                  authUserId: syncedAuthUserId,
                  notes: account.notes?.includes('已认领认证账号')
                    ? account.notes
                    : `${account.notes ? `${account.notes}；` : ''}已认领认证账号 ${syncedAuthUserId}`,
                }
              : account
          ));
          setDraft((current) => ({
            ...current,
            internalAccounts: nextAccounts,
          }));
          const authUserPersistResult = await updateAdminOrg(
            buildAdminOrgPatch(draft, {
              internalContacts: nextContacts,
              internalAccounts: nextAccounts,
              ...(logoPreview !== adminOrg.logoUrl ? { logoUrl: logoPreview } : {}),
            }),
          );
          remoteSaveSucceeded = remoteSaveSucceeded || Boolean(authUserPersistResult.remoteSaved);
        }
      }

      void adminAccountIdentityAuditService.record({
        accountId: targetAccount.id,
        employeeId: targetContact.id,
        employeeNo: targetContact.employeeNo,
        employeeName: targetContact.name,
        actorName: currentUser?.name || '系统管理员',
        actorEmail: currentUser?.email || '',
        previousUsername: targetAccount.username || '',
        nextUsername: normalizedUsername,
        previousLoginEmail: targetAccount.loginEmail || '',
        nextLoginEmail: normalizedLoginEmail,
        reason: normalizedReason,
        authSyncRequired: adminPortalPolicy.requireAuthSyncForIdentityChange,
        passwordResetRequired: adminPortalPolicy.requirePasswordResetAfterIdentityChange,
      });

      announceRemoteSaveResult(
        result,
        '账号标识已变更，且三处邮箱已校验一致',
        '账号标识已变更，本地已保存且 Auth 一致性已校验',
      );
    } catch (error) {
      console.error('Apply account identity change failed', error);
      const message = String((error as Error)?.message || error || '').trim();
      if (remoteSaveSucceeded) {
        toast.error(`账号标识已保存，但认证同步失败${message ? `：${message}` : ''}`);
        return;
      }
      toast.error(message ? `账号标识变更失败：${message}` : '账号标识变更失败，请重试');
      setDraft((current) => ({
        ...current,
        internalAccounts: previousAccounts,
        internalContacts: previousContacts,
      }));
    } finally {
      setSaving(false);
    }
  };
  const autoProvisionAccount = async (contactId: string, options?: ProvisionAccountPayload) => {
    const contact = draft.internalContacts.find((item) => item.id === contactId);
    if (!contact) return;
    const existingAccount = draft.internalAccounts.find((account) => account.employeeId === contactId);
    if (existingAccount) {
      toast.info('该人员已有账号');
      return;
    }
    const temporaryPassword = generateTemporaryPassword(contact.employeeNo || contact.id);
    const runtimeAuthMode = getAdminAuthMode();
    const authMode = runtimeAuthMode === 'test' ? 'test' : 'production';
    const primaryIdentitySource = options?.primaryIdentitySource || 'email';
    const defaultRoleProfile = deriveAccountRoleDefaults({
      rawRole: options?.initialRole,
      title: contact.title,
      department: contact.department,
      region: contact.region,
    });
    const nextLoginEmail = String(options?.loginEmail || contact.email || '').trim().toLowerCase();
    const nextPhoneLogin = String(options?.phoneLogin || contact.phone || '').trim();
    const nextWechatOpenId = String(options?.wechatOpenId || contact.wechat || '').trim();
    const nextEnterpriseWechatUserId = String(options?.enterpriseWechatUserId || '').trim();
    const nextWhatsappAccount = String(options?.whatsappAccount || contact.wechat || '').trim();
    let nextAccounts = [
      ...draft.internalAccounts,
      {
        id: `account-${Date.now()}`,
        employeeId: contact.id,
        authUserId: '',
        username: buildAccountUsername(contact),
        loginEmail: nextLoginEmail,
        loginPassword: temporaryPassword,
        role: defaultRoleProfile.role || options?.initialRole || '',
        region: defaultRoleProfile.region,
        department: contact.department || '',
        accountStatus: 'active',
        canLogin: true,
        forcePasswordReset: true,
        lastLoginAt: '',
        notes: '系统自动开通，首次登录需修改密码',
        authMode,
        activationStatus: authMode === 'production' ? 'invited' : 'active',
        primaryIdentitySource,
        phoneLogin: nextPhoneLogin,
        phoneVerified: false,
        emailVerified: false,
        wechatOpenId: nextWechatOpenId,
        enterpriseWechatUserId: nextEnterpriseWechatUserId,
        whatsappAccount: nextWhatsappAccount,
        invitedAt: authMode === 'production' ? new Date().toISOString() : '',
        inviteExpiresAt: authMode === 'production' ? buildInviteExpiry() : '',
        lastInviteChannel: primaryIdentitySource,
        activatedAt: authMode === 'production' ? '' : new Date().toISOString(),
      },
    ];
    const createdAccountId = nextAccounts[nextAccounts.length - 1]?.id || '';
    const persisted = await persistAccounts(
      nextAccounts,
      `账号已开通，临时密码：${temporaryPassword}`,
      '账号更新失败，请重试',
      {
        changedAccountIds: [createdAccountId],
        allowPasswordWriteAccountIds: [createdAccountId],
      },
    );
    if (!persisted) return;

    const createdAccount = nextAccounts.find((account) => account.id === createdAccountId);
    if (!createdAccount) return;

    syncAdminTestAccountInBackground({
      accountId: createdAccountId,
      account: createdAccount,
      contactName: contact.name || createdAccount.username || '',
      warningPrefix: '账号已开通，但远端测试身份同步失败',
    });
  };
  const autoResetAccountPassword = async (accountId: string) => {
    const target = draft.internalAccounts.find((account) => account.id === accountId);
    if (!target) return;
    const temporaryPassword = generateTemporaryPassword(target.employeeId || target.id);
    const previousAccounts = draft.internalAccounts;
    setSaving(true);
    let savedAccount: InternalAccount | null = null;
    try {
      const result = await updateAdminAccountPassword({
        accountId,
        nextPassword: temporaryPassword,
        forcePasswordReset: true,
      });
      const returnedAccount = (result.account || {}) as Partial<InternalAccount>;
      savedAccount = {
        ...target,
        ...returnedAccount,
        loginPassword: temporaryPassword,
        forcePasswordReset: true,
      };
      setDraft((current) => ({
        ...current,
        internalAccounts: current.internalAccounts.map((account) => (
          account.id === accountId ? savedAccount as InternalAccount : account
        )),
      }));
      toast.success(`密码已重置，临时密码：${temporaryPassword}`);
    } catch (error) {
      console.error('Reset password failed', error);
      toast.error(`账号更新失败：${String((error as Error)?.message || error || '请重试')}`);
      setDraft((current) => ({ ...current, internalAccounts: previousAccounts }));
      return;
    } finally {
      setSaving(false);
    }
    if (!savedAccount) return;

    await recordPasswordAudit(
      {
        ...savedAccount,
        loginPassword: temporaryPassword,
        forcePasswordReset: true,
      },
      'reset',
      '人工点击重置密码，生成新的临时密码',
      true,
    );
    await loadPasswordAuditRecords();
  };
  // ── Mode transitions ──────────────────────────────────────────────────────
  const enterEdit = () => {
    setDraft({ ...adminOrg });
    setLogoPreview(adminOrg.logoUrl);
    setLogoFile(null);
    setMode('edit');
  };
  const cancelEdit = () => {
    setDraft({ ...adminOrg });
    setLogoPreview(adminOrg.logoUrl);
    setLogoFile(null);
    if (fileRef.current) fileRef.current.value = '';
    setMode('view');
  };

  // ── Logo handlers ─────────────────────────────────────────────────────────
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error('图片不能超过 3 MB'); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };
  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!draft.nameCN.trim()) { toast.error('公司中文名不能为空'); return; }
    setSaving(true);
    try {
      // 1. Upload logo if a new file was selected; returns false on quota exceeded
      let logoQuotaHit = false;
      let nextLogoUrl = logoPreview;
      if (logoFile) {
        const saved = await uploadAdminLogo(logoFile);
        if (!saved) logoQuotaHit = true;
        nextLogoUrl = localStorage.getItem('cosun_admin_org_logo') || logoPreview;
      }

      // 2. Save all text fields (never includes the logo data-URI — stored separately)
      const saveResult = await updateAdminOrg(
        buildAdminOrgPatch(draft, {
          internalContacts: normalizeContactEmployeeNos(draft.internalContacts),
          internalAccounts: draft.internalAccounts,
          ...(logoFile || logoPreview !== adminOrg.logoUrl ? { logoUrl: nextLogoUrl } : {}),
        }),
      );

      setLogoFile(null);
      setMode('view');

      if (logoQuotaHit) {
        toast.warning(
          'LOGO 因浏览器存储空间不足无法永久保存（当前会话可见）。其他信息已成功保存。',
          { duration: 6000 }
        );
      } else {
        announceRemoteSaveResult(saveResult, '公司信息已保存，并已同步云端', '公司信息已保存到本地');
      }
    } catch {
      toast.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreLatestSnapshot = async () => {
    if (!window.confirm('确认恢复到最近一次稳定版本吗？当前未保存的人员与账号修改会被覆盖。')) return;
    setRestoringSnapshot(true);
    try {
      const restored = await restoreLatestAdminOrgSnapshot();
      if (!restored) {
        toast.info('当前没有可恢复的稳定版本。');
        return;
      }

      setLogoFile(null);
      setMode('view');

      const restoredAt = new Date(restored.restoredAt);
      const restoredAtLabel = Number.isNaN(restoredAt.getTime())
        ? restored.restoredAt
        : restoredAt.toLocaleString('zh-CN', { hour12: false });

      announceRemoteSaveResult(
        restored,
        `已恢复最近稳定版本（${restored.summary}，${restoredAtLabel}）。`,
        `已恢复最近稳定版本（${restored.summary}，${restoredAtLabel}），本地已保存`,
      );
    } catch (error) {
      const message = String((error as Error)?.message || error || '');
      toast.error(message || '恢复最近稳定版本失败');
    } finally {
      setRestoringSnapshot(false);
    }
  };

  const handleBackClick = () => {
    if (!onBack) return;
    if (backExitArmed) {
      setBackExitArmed(false);
      onBack();
      return;
    }
    setBackExitArmed(true);
    toast.info('再点一次“返回”将回到工作台', { duration: 1600 });
  };

  const isEdit = mode === 'edit';
  const tf     = useTextField(isEdit);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-4 px-4 pb-8 xl:px-6 2xl:px-8">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <>
              <button
                onClick={handleBackClick}
                className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] transition-colors group ${
                  backExitArmed
                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
                title={backExitArmed ? '再点一次返回工作台' : '返回工作台'}
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                {backExitArmed ? '确认返回' : '返回'}
              </button>
              <div className="w-px h-5 bg-slate-200" />
            </>
          )}
          <div className="flex items-center gap-2.5">
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (isEdit && canEdit) fileRef.current?.click();
                }}
                disabled={!isEdit || !canEdit}
                className={`flex items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm transition-colors ${
                  isEdit && canEdit ? 'cursor-pointer hover:border-red-300 hover:bg-red-50/40' : 'cursor-default'
                }`}
                style={{ width: 40, height: 40, minWidth: 40, minHeight: 40, maxWidth: 40, maxHeight: 40 }}
                title={isEdit && canEdit ? '上传LOGO' : '公司LOGO'}
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
                    {(draft.nameCN || 'CO').replace(/\s+/g, '').slice(0, 2).toUpperCase()}
                  </div>
                )}
              </button>
              {isEdit && canEdit && (
                <span className="pointer-events-none absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 shadow-sm">
                  <Camera className="h-3 w-3 text-white" />
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-[15px] font-semibold text-slate-800 leading-tight">企业主数据中心</h1>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Languages className="w-3 h-3 text-slate-300" />
                <p className="text-[11px] text-slate-400">基础信息 / 银行账户 / 人员与账号中心 / 文档默认信息</p>
              </div>
            </div>
          </div>
        </div>

        {canEdit && activeTab === 'people-center' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleRestoreLatestSnapshot}
              disabled={saving || restoringSnapshot}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-[13px] font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${restoringSnapshot ? 'animate-spin' : ''}`} />
              {restoringSnapshot ? '恢复中…' : '恢复最近稳定版本'}
            </button>
          </div>
        )}

        {canEdit && activeTab !== 'people-center' && activeTab !== 'portal-mirror' && (
          <div className="flex items-center gap-2">
            {isEdit ? (
              <>
                <button
                  onClick={cancelEdit}
                  className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  {saving ? '保存中…' : '保存'}
                </button>
              </>
            ) : (
              <button
                onClick={enterEdit}
                className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                编辑 · Edit
              </button>
            )}
          </div>
        )}
      </div>

      {canEdit && (
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={handleLogoChange}
        />
      )}

      <div className="flex flex-nowrap gap-3 overflow-x-auto pb-1">
        <TabButton
          active={activeTab === 'basic'}
          label="基础信息"
          description="公司名称、地址、邮箱、联系人、税号等"
          icon={<Building2 className="w-4 h-4" />}
          onClick={() => setActiveTab('basic')}
        />
        <TabButton
          active={activeTab === 'bank'}
          label="银行账户"
          description="国内公账、美元账户、私人账户"
          icon={<Landmark className="w-4 h-4" />}
          onClick={() => setActiveTab('bank')}
        />
        <TabButton
          active={activeTab === 'people-center'}
          label="人员与账号中心"
          description="统一管理人员主档、账号与访问、角色权限"
          icon={<Shield className="w-4 h-4" />}
          onClick={() => setActiveTab('people-center')}
        />
        <TabButton
          active={activeTab === 'portal-mirror'}
          label="外部门户账号映射中心"
          description="我方侧中枢拖挂客户 / 供应商 / 第三方多账号池"
          icon={<Globe className="w-4 h-4" />}
          onClick={() => setActiveTab('portal-mirror')}
        />
        <TabButton
          active={activeTab === 'documents'}
          label="文档默认信息"
          description="默认签字人、页脚、币种、时区"
          icon={<FileBadge2 className="w-4 h-4" />}
          onClick={() => setActiveTab('documents')}
        />
      </div>

      {remoteSyncStatus && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          <RefreshCcw className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-amber-600" />
          <div className="min-w-0">
            <div className="font-medium">云端正在后台同步</div>
            <div className="mt-0.5 text-amber-700">
              {remoteSyncStatus}。当前页面内容已经保留，无需重复点击保存。
            </div>
          </div>
          <button
            type="button"
            onClick={clearRemoteSyncPending}
            className="ml-auto shrink-0 text-[12px] font-medium text-amber-700 hover:text-amber-900"
          >
            知道了
          </button>
        </div>
      )}

      {activeTab === 'basic' && (
        <BasicInfoSection
          isEdit={isEdit}
          adminOrg={adminOrg}
          draft={draft}
          tf={tf}
          onFieldChange={set}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          Section 3 — Bank Accounts
          Two equal-width cards side by side on desktop, stacked on mobile.
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'bank' && (
        <BankAccountsSection
          isEdit={isEdit}
          adminOrg={adminOrg}
          draft={draft}
          tf={tf}
          setRMB={setRMB}
          setUSD={setUSD}
          setPriv={setPriv}
        />
      )}

      {activeTab === 'people-center' && (
        <PeopleAccountCenterModule
          contacts={draft.internalContacts}
          accounts={draft.internalAccounts}
          canEdit={canEdit}
          isEdit={isEdit}
          saving={saving}
          onUpdateContact={setContact}
          onAutoPatchAccount={autoPatchAccount}
          onBatchPatchAccounts={batchPatchAccounts}
          onPersistRoleEditorChange={persistRoleEditorChange}
          onAutoProvisionAccount={autoProvisionAccount}
          onAutoResetAccountPassword={autoResetAccountPassword}
          onApplyAccountIdentityChange={applyAccountIdentityChange}
          onAddContact={addContact}
          onReorderContact={reorderContact}
          onAutoReorderContact={autoReorderContact}
          onRemoveContact={removeContact}
          onEnterEdit={enterEdit}
          onCancelEdit={cancelEdit}
          onSave={handleSave}
        />
      )}

      {activeTab === 'portal-mirror' && (
        <ExternalPortalPasswordMirrorModule />
      )}

      {activeTab === 'documents' && (
        <DocumentDefaultsSection
          isEdit={isEdit}
          documentDefaults={draft.documentDefaults}
          onChange={setDocDefault}
        />
      )}
    </div>
  );
}
