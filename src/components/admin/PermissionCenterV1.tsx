import React, { useEffect, useMemo, useState } from 'react';
import {
  History,
  KeyRound,
  Lock,
  Plus,
  RefreshCcw,
  Save,
  Shield,
  UserCog,
  Users,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useAdminOrganization } from '../../contexts/AdminOrganizationContext';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  PERMISSION_ACTION_OPTIONS,
  PERMISSION_CENTER_MODULES,
  PERMISSION_SCOPE_OPTIONS,
  mapRuntimeUserToPermissionRole,
  type PermissionActionId,
  type PermissionCenterRoleId,
  type PermissionModuleDefinition,
  type PermissionModuleId,
  type PermissionScopeId,
  type PermissionUserException,
  permissionCenterService,
} from '../../lib/services/permissionCenterService';
import { RoleOverviewTab } from './permission-center/RoleOverviewTab';
import { ChangeLogTab } from './permission-center/ChangeLogTab';
import { MenuPermissionMatrixTab } from './permission-center/MenuPermissionMatrixTab';
import { ActionsDataScopeTab } from './permission-center/ActionsDataScopeTab';
import { UserExceptionGrantsTab } from './permission-center/UserExceptionGrantsTab';
import { RoleDialog } from './permission-center/RoleDialog';
import { ExceptionDialog } from './permission-center/ExceptionDialog';

const TAB_VALUE = {
  roles: 'roles',
  matrix: 'matrix',
  actions: 'actions',
  exceptions: 'exceptions',
  logs: 'logs',
} as const;

type PermissionCenterTab = (typeof TAB_VALUE)[keyof typeof TAB_VALUE];

const CATEGORY_ORDER = ['management', 'sales', 'support', 'external', 'operations'] as const;
const MODULE_CATEGORY_ORDER = ['核心模块', '业务模块', '履约模块', '财务模块', '供应链模块', '运营模块', '系统管理', '决策模块'] as const;

const ROLE_CATEGORY_LABEL: Record<string, string> = {
  management: '管理层',
  sales: '业务线',
  support: '职能支持',
  external: '外部协作',
  operations: '运营/履约',
};

const ROLE_CATEGORY_BADGE: Record<string, string> = {
  management: 'bg-violet-50 text-violet-700 border-violet-200',
  sales: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  support: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  external: 'bg-orange-50 text-orange-700 border-orange-200',
  operations: 'bg-cyan-50 text-cyan-700 border-cyan-200',
};

const ACTION_LABEL: Record<PermissionActionId, string> = {
  view: '查看 (View)',
  create: '新建 (Create)',
  edit: '修改 (Edit)',
  delete: '删除 (Delete)',
  approve: '审批 (Approve)',
  assign: '分配 (Assign)',
  export: '导出 (Export)',
  manage_accounts: '管理账号',
};

const ACTION_SHORT_LABEL: Record<PermissionActionId, string> = {
  view: '查看',
  create: '新建',
  edit: '修改',
  delete: '删除',
  approve: '审批',
  assign: '分配',
  export: '导出',
  manage_accounts: '账号',
};

const SCOPE_LABEL: Record<PermissionScopeId, string> = {
  all: '全部数据 (All Data)',
  region: '区域数据 (Region)',
  department: '本部门及下属部门',
  self: '仅本人 (Self)',
  assigned: '已分配的数据 (Assigned)',
};

const SCOPE_DESCRIPTION: Record<PermissionScopeId, string> = {
  all: '无限制，可访问系统全量流水',
  region: '按区域隔离的数据范围',
  department: '包含子机构产生的数据',
  self: '只能查看本人创建的单据',
  assigned: '只能查看被专门分配跟进的数据',
};

const EXCEPTION_TYPE_LABEL: Record<PermissionUserException['type'], string> = {
  grant: '附加权限',
  revoke: '阻断权限',
};

const LOG_TYPE_LABEL: Record<string, string> = {
  role_matrix: '角色配置变更',
  menu_matrix: '菜单可见性变更',
  action_matrix: '操作动作权变更',
  scope_matrix: '数据范围变更',
  user_exception: '人员例外授权变更',
};

const PERMISSION_CENTER_EVENT = {
  publish: 'app_publish_permissions',
  reset: 'app_reset_permissions',
  rolesChanged: 'app_roles_changed',
  logsChanged: 'app_logs_changed',
} as const;

const PERMISSION_TABS = [
  { value: TAB_VALUE.roles, label: '角色总览', icon: Users },
  { value: TAB_VALUE.matrix, label: '菜单权限矩阵', icon: KeyRound },
  { value: TAB_VALUE.actions, label: '动作与数据范围', icon: Lock },
  { value: TAB_VALUE.exceptions, label: '人员例外授权', icon: UserCog },
  { value: TAB_VALUE.logs, label: '变更日志', icon: History },
] as const;

function formatDateTime(value?: string) {
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

function formatDateInput(date: Date) {
  return date.toISOString().split('T')[0];
}

function getDefaultLogDateRange() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 30);
  return {
    from: formatDateInput(start),
    to: formatDateInput(end),
  };
}

function dispatchPermissionCenterEvent(eventName: (typeof PERMISSION_CENTER_EVENT)[keyof typeof PERMISSION_CENTER_EVENT]) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(eventName));
}

export default function PermissionCenterV1() {
  const { currentUser } = useAuth();
  const { adminOrg } = useAdminOrganization();
  const safeAdminOrg = adminOrg ?? ({} as typeof adminOrg);
  const organizationName =
    safeAdminOrg?.nameCN ||
    safeAdminOrg?.nameEN ||
    (safeAdminOrg as { basicInfo?: { companyName?: string } })?.basicInfo?.companyName ||
    '企业主数据中心';
  const internalAccounts = safeAdminOrg?.internalAccounts ?? [];

  const [roleDefinitions, setRoleDefinitions] = useState(permissionCenterService.getRoles());
  const [activeTab, setActiveTab] = useState<PermissionCenterTab>(TAB_VALUE.actions);
  const [menuMatrix, setMenuMatrix] = useState(permissionCenterService.getMenuMatrix());
  const [actionMatrix, setActionMatrix] = useState(permissionCenterService.getActionMatrix());
  const [scopeMatrix, setScopeMatrix] = useState(permissionCenterService.getScopeMatrix());
  const [exceptions, setExceptions] = useState(permissionCenterService.getUserExceptions());
  const [logs, setLogs] = useState(permissionCenterService.getChangeLogs());

  const [roleSearch, setRoleSearch] = useState('');
  const [roleCategoryFilter, setRoleCategoryFilter] = useState<'all' | string>('all');
  const [matrixSearch, setMatrixSearch] = useState('');
  const [exceptionSearch, setExceptionSearch] = useState('');
  const [exceptionTypeFilter, setExceptionTypeFilter] = useState<'all' | PermissionUserException['type']>('all');
  const [logSearch, setLogSearch] = useState('');
  const [logDateFrom, setLogDateFrom] = useState(() => getDefaultLogDateRange().from);
  const [logDateTo, setLogDateTo] = useState(() => getDefaultLogDateRange().to);

  const [selectedModuleId, setSelectedModuleId] = useState<PermissionModuleId>('order-management-center');
  const [selectedRoleId, setSelectedRoleId] = useState<PermissionCenterRoleId>('Sales_Director');
  const [roleDrawerOpen, setRoleDrawerOpen] = useState(false);
  const [collapsedMatrixCategories, setCollapsedMatrixCategories] = useState<Record<string, boolean>>({});
  const [collapsedActionCategories, setCollapsedActionCategories] = useState<Record<string, boolean>>({});

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [draftRole, setDraftRole] = useState<{
    id: string;
    name: string;
    description: string;
    category: 'management' | 'sales' | 'support' | 'external' | 'operations';
    regionScoped: boolean;
  } | null>(null);
  const [exceptionDialogOpen, setExceptionDialogOpen] = useState(false);
  const [editingExceptionId, setEditingExceptionId] = useState<string | null>(null);
  const [draftException, setDraftException] = useState<PermissionUserException | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const changedBy = currentUser?.email || currentUser?.name || 'system';

  const moduleCategories = useMemo(() => {
    return PERMISSION_CENTER_MODULES.reduce<Record<string, PermissionModuleDefinition[]>>((acc, module) => {
      if (!acc[module.category]) acc[module.category] = [];
      acc[module.category].push(module);
      return acc;
    }, {});
  }, []);

  const availableAccounts = useMemo(() => {
    return internalAccounts
      .filter((account) => account.accountStatus !== 'deleted' && account.canLogin)
      .sort((a, b) => {
        const deptCompare = a.department.localeCompare(b.department, 'zh-CN');
        if (deptCompare !== 0) return deptCompare;
        return a.username.localeCompare(b.username, 'zh-CN');
      });
  }, [internalAccounts]);

  const availableAccountMap = useMemo(
    () => Object.fromEntries(availableAccounts.map((account) => [account.id, account])),
    [availableAccounts],
  );

  const roleCount = roleDefinitions.length;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleReset = () => {
      setRoleDefinitions(permissionCenterService.getRoles());
      setMenuMatrix(permissionCenterService.getMenuMatrix());
      setActionMatrix(permissionCenterService.getActionMatrix());
      setScopeMatrix(permissionCenterService.getScopeMatrix());
      setExceptions(permissionCenterService.getUserExceptions());
      setLogs(permissionCenterService.getChangeLogs());
    };

    const handleRolesChanged = () => {
      setRoleDefinitions(permissionCenterService.getRoles());
      setMenuMatrix(permissionCenterService.getMenuMatrix());
      setActionMatrix(permissionCenterService.getActionMatrix());
      setScopeMatrix(permissionCenterService.getScopeMatrix());
    };

    const handleLogsChanged = () => {
      setLogs(permissionCenterService.getChangeLogs());
    };

    window.addEventListener(PERMISSION_CENTER_EVENT.reset, handleReset);
    window.addEventListener(PERMISSION_CENTER_EVENT.rolesChanged, handleRolesChanged);
    window.addEventListener(PERMISSION_CENTER_EVENT.logsChanged, handleLogsChanged);

    return () => {
      window.removeEventListener(PERMISSION_CENTER_EVENT.reset, handleReset);
      window.removeEventListener(PERMISSION_CENTER_EVENT.rolesChanged, handleRolesChanged);
      window.removeEventListener(PERMISSION_CENTER_EVENT.logsChanged, handleLogsChanged);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      const snapshot = await permissionCenterService.hydrateFromSupabase();
      if (!mounted || !snapshot) return;

      setRoleDefinitions(snapshot.roles);
      setMenuMatrix(snapshot.menuMatrix);
      setActionMatrix(snapshot.actionMatrix);
      setScopeMatrix(snapshot.scopeMatrix);
      setExceptions(snapshot.userExceptions);
      setLogs(snapshot.changeLogs);
    };

    void hydrate();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredRoles = useMemo(() => {
    const keyword = roleSearch.trim().toLowerCase();
    return roleDefinitions.filter((role) => {
      const matchesKeyword =
        !keyword ||
        `${role.name} ${role.id} ${role.description}`.toLowerCase().includes(keyword);
      const matchesCategory = roleCategoryFilter === 'all' || role.category === roleCategoryFilter;
      return matchesKeyword && matchesCategory;
    });
  }, [roleCategoryFilter, roleDefinitions, roleSearch]);

  const filteredModuleCategories = useMemo(() => {
    const keyword = matrixSearch.trim().toLowerCase();
    if (!keyword) return moduleCategories;
    return Object.fromEntries(
      Object.entries(moduleCategories)
        .map(([category, modules]) => [
          category,
          modules.filter((module) => `${module.name} ${module.description}`.toLowerCase().includes(keyword)),
        ])
        .filter(([, modules]) => modules.length > 0),
    ) as Record<string, PermissionModuleDefinition[]>;
  }, [matrixSearch, moduleCategories]);

  const selectedModule = PERMISSION_CENTER_MODULES.find((module) => module.id === selectedModuleId) || PERMISSION_CENTER_MODULES[0];

  const filteredExceptions = useMemo(() => {
    const keyword = exceptionSearch.trim().toLowerCase();
    return exceptions.filter((item) => {
      const account = availableAccountMap[item.accountId];
      const text = `${item.displayName} ${item.email} ${item.reason} ${item.moduleId} ${account?.department || ''}`.toLowerCase();
      const matchesKeyword = !keyword || text.includes(keyword);
      const matchesType = exceptionTypeFilter === 'all' || item.type === exceptionTypeFilter;
      return matchesKeyword && matchesType;
    });
  }, [availableAccountMap, exceptionSearch, exceptionTypeFilter, exceptions]);

  const filteredLogs = useMemo(() => {
    const keyword = logSearch.trim().toLowerCase();
    return logs.filter((log) => {
      const textMatches =
        !keyword ||
        `${log.title} ${log.detail} ${log.changedBy} ${LOG_TYPE_LABEL[log.type] || log.type}`.toLowerCase().includes(keyword);
      const ts = new Date(log.changedAt).getTime();
      const fromMatches = !logDateFrom || Number.isNaN(ts) || ts >= new Date(`${logDateFrom}T00:00:00`).getTime();
      const toMatches = !logDateTo || Number.isNaN(ts) || ts <= new Date(`${logDateTo}T23:59:59`).getTime();
      return textMatches && fromMatches && toMatches;
    });
  }, [logDateFrom, logDateTo, logSearch, logs]);

  const refreshState = async () => {
    const remoteSnapshot = await permissionCenterService.hydrateFromSupabase();
    setRoleDefinitions(permissionCenterService.getRoles());
    setMenuMatrix(permissionCenterService.getMenuMatrix());
    setActionMatrix(permissionCenterService.getActionMatrix());
    setScopeMatrix(permissionCenterService.getScopeMatrix());
    setExceptions(permissionCenterService.getUserExceptions());
    setLogs(permissionCenterService.getChangeLogs());
    toast.success('已刷新权限中心', {
      description: remoteSnapshot ? '已重新读取当前 Supabase 中的权限配置。' : '已重新读取当前浏览器中的权限配置。',
    });
  };

  const resetChanges = () => {
    setRoleDefinitions(permissionCenterService.getRoles());
    setMenuMatrix(permissionCenterService.getMenuMatrix());
    setActionMatrix(permissionCenterService.getActionMatrix());
    setScopeMatrix(permissionCenterService.getScopeMatrix());
    setExceptions(permissionCenterService.getUserExceptions());
    dispatchPermissionCenterEvent(PERMISSION_CENTER_EVENT.reset);
    toast.success('已重置未发布更改');
  };

  const publishChanges = async () => {
    if (isPublishing) return;
    setIsPublishing(true);
    try {
      permissionCenterService.saveRoles(roleDefinitions, changedBy, `当前角色定义数：${roleDefinitions.length}`);
      permissionCenterService.saveMenuMatrix(menuMatrix, changedBy);
      permissionCenterService.saveActionMatrix(actionMatrix, changedBy);
      permissionCenterService.saveScopeMatrix(scopeMatrix, changedBy);
      permissionCenterService.saveUserExceptions(exceptions, changedBy);
      const synced = await permissionCenterService.syncToSupabase(changedBy);
      setLogs(permissionCenterService.getChangeLogs());
      dispatchPermissionCenterEvent(PERMISSION_CENTER_EVENT.publish);
      dispatchPermissionCenterEvent(PERMISSION_CENTER_EVENT.logsChanged);
      toast.success('权限中心已发布生效', {
        description: synced
          ? '菜单矩阵、动作权限、数据范围与例外授权已保存到 Supabase。'
          : '菜单矩阵、动作权限、数据范围与例外授权已保存到本地，Supabase 同步失败。',
      });
    } catch (error) {
      console.error('Publish permission center changes failed', error);
      toast.error('发布失败，请重试');
    } finally {
      setIsPublishing(false);
    }
  };

  const toggleModuleAccess = (roleId: PermissionCenterRoleId, moduleId: PermissionModuleId) => {
    setMenuMatrix((prev) => {
      const current = new Set(prev[roleId] || []);
      if (current.has(moduleId)) {
        current.delete(moduleId);
      } else {
        current.add(moduleId);
      }
      return {
        ...prev,
        [roleId]: Array.from(current),
      };
    });
  };

  const getCategoryState = (roleId: PermissionCenterRoleId, modules: PermissionModuleDefinition[]) => {
    const enabled = modules.filter((module) => (menuMatrix[roleId] || []).includes(module.id)).length;
    if (enabled === 0) return 'none';
    if (enabled === modules.length) return 'all';
    return 'partial';
  };

  const toggleCategoryAccess = (roleId: PermissionCenterRoleId, category: string) => {
    const modules = moduleCategories[category] || [];
    const state = getCategoryState(roleId, modules);
    setMenuMatrix((prev) => {
      const current = new Set(prev[roleId] || []);
      if (state === 'all') {
        modules.forEach((module) => current.delete(module.id));
      } else {
        modules.forEach((module) => current.add(module.id));
      }
      return {
        ...prev,
        [roleId]: Array.from(current),
      };
    });
  };

  const toggleAction = (roleId: PermissionCenterRoleId, moduleId: PermissionModuleId, actionId: PermissionActionId) => {
    setActionMatrix((prev) => {
      const currentRole = prev[roleId] || {};
      const currentActions = new Set(currentRole[moduleId] || []);
      if (currentActions.has(actionId)) {
        currentActions.delete(actionId);
      } else {
        currentActions.add(actionId);
      }
      return {
        ...prev,
        [roleId]: {
          ...currentRole,
          [moduleId]: Array.from(currentActions),
        },
      };
    });
  };

  const setScopeForRole = (roleId: PermissionCenterRoleId, moduleId: PermissionModuleId, scopeId: PermissionScopeId) => {
    setScopeMatrix((prev) => ({
      ...prev,
      [roleId]: {
        ...(prev[roleId] || {}),
        [moduleId]: scopeId,
      },
    }));
  };

  const ensureRoleSupportData = (roleId: PermissionCenterRoleId) => {
    setMenuMatrix((prev) => ({
      ...prev,
      [roleId]: prev[roleId] || [],
    }));
    setActionMatrix((prev) => ({
      ...prev,
      [roleId]: prev[roleId] || {},
    }));
    setScopeMatrix((prev) => ({
      ...prev,
      [roleId]: prev[roleId] || {},
    }));
  };

  const openCreateRole = () => {
    setEditingRoleId(null);
    setDraftRole({
      id: '',
      name: '',
      description: '',
      category: 'management',
      regionScoped: false,
    });
    setRoleDialogOpen(true);
  };

  const openEditRole = (roleId: string) => {
    const role = roleDefinitions.find((item) => item.id === roleId);
    if (!role) return;
    setEditingRoleId(role.id);
    setDraftRole({
      id: role.id,
      name: role.name,
      description: role.description,
      category: role.category,
      regionScoped: !!role.regionScoped,
    });
    setRoleDialogOpen(true);
  };

  const openCloneRole = (roleId: string) => {
    const role = roleDefinitions.find((item) => item.id === roleId);
    if (!role) return;
    setEditingRoleId(null);
    setDraftRole({
      id: `${role.id}_Copy`,
      name: `${role.name} 副本`,
      description: role.description,
      category: role.category,
      regionScoped: !!role.regionScoped,
    });
    setRoleDialogOpen(true);
    toast.info(`正在克隆角色 ${role.name}，请修改编码后保存`);
  };

  const removeRole = (roleId: string) => {
    const protectedRoles = new Set(['CEO', 'CFO', 'Sales_Director']);
    if (protectedRoles.has(roleId)) {
      toast.error('核心基线角色禁止在权限中心直接删除');
      return;
    }
    const role = roleDefinitions.find((item) => item.id === roleId);
    if (!role) return;

    const nextRoles = roleDefinitions.filter((item) => item.id !== roleId);
    const nextMenuMatrix = { ...(menuMatrix as Record<string, PermissionModuleId[]>) };
    delete nextMenuMatrix[roleId];
    const nextActionMatrix = {
      ...(actionMatrix as Record<string, Partial<Record<PermissionModuleId, PermissionActionId[]>>>),
    };
    delete nextActionMatrix[roleId];
    const nextScopeMatrix = {
      ...(scopeMatrix as Record<string, Partial<Record<PermissionModuleId, PermissionScopeId>>>),
    };
    delete nextScopeMatrix[roleId];

    setRoleDefinitions(nextRoles);
    setMenuMatrix(nextMenuMatrix);
    setActionMatrix(nextActionMatrix);
    setScopeMatrix(nextScopeMatrix);

    permissionCenterService.saveRoles(nextRoles, changedBy, `删除了自定义角色 [${role.name}]`);
    permissionCenterService.saveMenuMatrix(nextMenuMatrix, changedBy);
    permissionCenterService.saveActionMatrix(nextActionMatrix, changedBy);
    permissionCenterService.saveScopeMatrix(nextScopeMatrix, changedBy);

    if (selectedRoleId === roleId) {
      const fallback = nextRoles[0];
      if (fallback) setSelectedRoleId(fallback.id as PermissionCenterRoleId);
    }
    dispatchPermissionCenterEvent(PERMISSION_CENTER_EVENT.rolesChanged);
    dispatchPermissionCenterEvent(PERMISSION_CENTER_EVENT.logsChanged);
    toast.success(`角色 ${role.name} 已从当前草稿移除`);
  };

  const saveRoleDraft = () => {
    if (!draftRole) return;
    const nextId = draftRole.id.trim();
    const nextName = draftRole.name.trim();
    if (!nextId || !nextName) {
      toast.error('请填写完整的角色名称和编码');
      return;
    }

    const duplicated = roleDefinitions.find((item) => item.id === nextId && item.id !== editingRoleId);
    if (duplicated) {
      toast.error('该角色编码已存在，请更换');
      return;
    }

    const normalized = {
      id: nextId as PermissionCenterRoleId,
      name: nextName,
      description: draftRole.description.trim() || '未填写职责描述',
      category: draftRole.category,
      regionScoped: draftRole.regionScoped,
      colorClass:
        roleDefinitions.find((item) => item.id === nextId)?.colorClass ||
        'bg-gray-50 text-gray-700 border-gray-200',
    };

    const nextRoles = editingRoleId
      ? roleDefinitions.map((item) => (item.id === editingRoleId ? normalized : item))
      : [...roleDefinitions, normalized];

    const nextMenuMatrix = editingRoleId
      ? menuMatrix
      : {
          ...menuMatrix,
          [normalized.id]: menuMatrix[normalized.id] || [],
        };
    const nextActionMatrix = editingRoleId
      ? actionMatrix
      : {
          ...actionMatrix,
          [normalized.id]: actionMatrix[normalized.id] || {},
        };
    const nextScopeMatrix = editingRoleId
      ? scopeMatrix
      : {
          ...scopeMatrix,
          [normalized.id]: scopeMatrix[normalized.id] || {},
        };

    setRoleDefinitions(nextRoles);
    setMenuMatrix(nextMenuMatrix);
    setActionMatrix(nextActionMatrix);
    setScopeMatrix(nextScopeMatrix);

    permissionCenterService.saveRoles(
      nextRoles,
      changedBy,
      editingRoleId ? `更新了角色 [${normalized.name}] 的基本信息` : `新增了自定义角色 [${normalized.name}]`,
    );
    if (!editingRoleId) {
      permissionCenterService.saveMenuMatrix(nextMenuMatrix, changedBy);
      permissionCenterService.saveActionMatrix(nextActionMatrix, changedBy);
      permissionCenterService.saveScopeMatrix(nextScopeMatrix, changedBy);
    }

    setSelectedRoleId(normalized.id);
    setRoleDialogOpen(false);
    dispatchPermissionCenterEvent(PERMISSION_CENTER_EVENT.rolesChanged);
    dispatchPermissionCenterEvent(PERMISSION_CENTER_EVENT.logsChanged);
    toast.success(editingRoleId ? '角色信息已更新到草稿' : '角色已加入当前草稿');
  };

  const openCreateException = () => {
    if (!availableAccounts.length) {
      toast.error('暂无可配置的内部账号');
      return;
    }
    const account = availableAccounts[0];
    setEditingExceptionId(null);
    setDraftException({
      id: `exception-${Date.now()}`,
      accountId: account.id,
      displayName: account.username,
      email: account.loginEmail,
      role: account.role,
      moduleId: selectedModuleId,
      type: 'grant',
      actions: ['view'],
      scope: 'assigned',
      reason: '',
      createdAt: new Date().toISOString(),
      createdBy: changedBy,
    });
    setExceptionDialogOpen(true);
  };

  const openEditException = (exception: PermissionUserException) => {
    setEditingExceptionId(exception.id);
    setDraftException({ ...exception });
    setExceptionDialogOpen(true);
  };

  const removeException = (exceptionId: string) => {
    setExceptions((prev) => prev.filter((item) => item.id !== exceptionId));
    dispatchPermissionCenterEvent(PERMISSION_CENTER_EVENT.logsChanged);
    toast.success('例外授权已从草稿中移除');
  };

  const saveExceptionDraft = () => {
    if (!draftException) return;
    if (!draftException.reason.trim()) {
      toast.error('请填写授权/阻断原因');
      return;
    }
    const account = availableAccountMap[draftException.accountId];
    if (!account) {
      toast.error('目标账号不存在或已不可用');
      return;
    }

    const normalized: PermissionUserException = {
      ...draftException,
      displayName: account.username,
      email: account.loginEmail,
      role: account.role,
      actions: Array.from(new Set(draftException.actions)),
    };

    setExceptions((prev) => {
      if (editingExceptionId) {
        return prev.map((item) => (item.id === editingExceptionId ? normalized : item));
      }
      return [normalized, ...prev];
    });
    setExceptionDialogOpen(false);
    dispatchPermissionCenterEvent(PERMISSION_CENTER_EVENT.logsChanged);
    toast.success(editingExceptionId ? '例外授权已更新' : '例外授权已加入草稿');
  };

  const selectedRoleDefinition = roleDefinitions.find((role) => role.id === selectedRoleId) || roleDefinitions[0];
  const selectedModuleActions = actionMatrix[selectedRoleId]?.[selectedModule.id] || [];
  const selectedRoleModuleCount = (menuMatrix[selectedRoleId] || []).length;
  const selectedRoleExceptionCount = exceptions.filter((item) => {
    const account = availableAccountMap[item.accountId];
    const mappedRoleId = mapRuntimeUserToPermissionRole({
      role: account?.role || item.role,
      region: account?.region || null,
    });
    return mappedRoleId === selectedRoleId;
  }).length;
  const selectedRoleModules = (menuMatrix[selectedRoleId] || [])
    .map((moduleId) => PERMISSION_CENTER_MODULES.find((module) => module.id === moduleId))
    .filter((module): module is PermissionModuleDefinition => Boolean(module));
  const visibleModuleCount = Object.values(filteredModuleCategories).reduce((total, modules) => total + modules.length, 0);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-7 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-[14px] bg-blue-600 p-2 shadow-inner">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-[18px] font-semibold leading-tight text-slate-900">权限中心 (Permission Center)</h1>
            <p className="mt-0.5 text-[13px] text-slate-500">管理企业角色、系统菜单与数据范围</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Button type="button" variant="outline" className="h-10 rounded-xl border-slate-300 px-5 text-[15px] font-medium text-slate-700" onClick={resetChanges} disabled={isPublishing}>
            重置更改
          </Button>
          <Button type="button" className="h-10 rounded-xl bg-blue-600 px-6 text-[15px] font-medium hover:bg-blue-700 disabled:bg-blue-400" onClick={publishChanges} disabled={isPublishing}>
            {isPublishing ? '发布中…' : '发布变更生效'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PermissionCenterTab)} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="border-b border-slate-200 px-3">
          <TabsList className="h-auto w-full justify-start gap-4 rounded-none bg-transparent p-0">
            {PERMISSION_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;

              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="!flex-none !h-auto !rounded-none !border-0 !bg-transparent !shadow-none px-0 py-[13px] text-[14px] font-semibold transition-none"
                  style={{
                    color: isActive ? '#E1251B' : '#64748b',
                    borderBottom: isActive ? '2px solid #E1251B' : '2px solid transparent',
                  }}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

          <TabsContent value={TAB_VALUE.roles} className="m-0 flex-1 overflow-y-auto p-4">
            <RoleOverviewTab
              roleSearch={roleSearch}
              onRoleSearchChange={setRoleSearch}
              roleCategoryFilter={roleCategoryFilter}
              onRoleCategoryFilterChange={setRoleCategoryFilter}
              categoryOrder={CATEGORY_ORDER}
              roleCategoryLabel={ROLE_CATEGORY_LABEL}
              roleCategoryBadge={ROLE_CATEGORY_BADGE}
              filteredRoles={filteredRoles}
              selectedRoleId={selectedRoleId}
              onSelectRole={(roleId) => {
                setSelectedRoleId(roleId);
                setRoleDrawerOpen(true);
              }}
              roleDrawerOpen={roleDrawerOpen}
              onRoleDrawerOpenChange={setRoleDrawerOpen}
              selectedRoleDefinition={selectedRoleDefinition}
              selectedRoleName={selectedRoleDefinition.name}
              selectedRoleModuleCount={selectedRoleModuleCount}
              selectedRoleExceptionCount={selectedRoleExceptionCount}
              selectedRoleModules={selectedRoleModules}
              onOpenCreateRole={openCreateRole}
              onOpenEditRole={openEditRole}
              onOpenCloneRole={openCloneRole}
              onRemoveRole={removeRole}
            />
          </TabsContent>

          <TabsContent
            value={TAB_VALUE.matrix}
            className="m-0 flex-1 min-h-0 overflow-hidden p-4"
            style={{ transform: 'none', backfaceVisibility: 'visible' }}
          >
            <MenuPermissionMatrixTab
              matrixSearch={matrixSearch}
              onMatrixSearchChange={setMatrixSearch}
              onExpandAll={() => setCollapsedMatrixCategories({})}
              onCollapseAll={() =>
                setCollapsedMatrixCategories(
                  Object.fromEntries(MODULE_CATEGORY_ORDER.map((category) => [category, true])),
                )
              }
              visibleModuleCount={visibleModuleCount}
              roleCount={roleCount}
              roleDefinitions={roleDefinitions}
              filteredModuleCategories={filteredModuleCategories}
              moduleCategoryOrder={MODULE_CATEGORY_ORDER}
              collapsedMatrixCategories={collapsedMatrixCategories}
              onToggleCategoryCollapse={(category) =>
                setCollapsedMatrixCategories((prev) => ({ ...prev, [category]: !prev[category] }))
              }
              getCategoryState={getCategoryState}
              onToggleCategoryAccess={toggleCategoryAccess}
              menuMatrix={menuMatrix}
              onToggleModuleAccess={toggleModuleAccess}
            />
          </TabsContent>

          <TabsContent value={TAB_VALUE.actions} className="m-0 flex-1 min-h-0 overflow-hidden p-3">
            <ActionsDataScopeTab
              matrixSearch={matrixSearch}
              onMatrixSearchChange={setMatrixSearch}
              moduleCategoryOrder={MODULE_CATEGORY_ORDER}
              filteredModuleCategories={filteredModuleCategories}
              collapsedActionCategories={collapsedActionCategories}
              onToggleCategoryCollapse={(category) =>
                setCollapsedActionCategories((prev) => ({ ...prev, [category]: !prev[category] }))
              }
              selectedModuleId={selectedModuleId}
              onSelectModule={setSelectedModuleId}
              selectedModule={selectedModule}
              selectedRoleId={selectedRoleId}
              onSelectRole={setSelectedRoleId}
              roleDefinitions={roleDefinitions}
              permissionActionOptions={PERMISSION_ACTION_OPTIONS}
              actionLabel={ACTION_LABEL}
              actionShortLabel={ACTION_SHORT_LABEL}
              actionMatrix={actionMatrix}
              onToggleAction={toggleAction}
              selectedRoleDefinition={selectedRoleDefinition}
              selectedModuleActions={selectedModuleActions}
              scopeMatrix={scopeMatrix}
              scopeLabel={SCOPE_LABEL}
              scopeDescription={SCOPE_DESCRIPTION}
              permissionScopeOptions={PERMISSION_SCOPE_OPTIONS}
              onSetScopeForRole={setScopeForRole}
            />
          </TabsContent>

          <TabsContent value={TAB_VALUE.exceptions} className="m-0 flex-1 overflow-y-auto p-4">
            <UserExceptionGrantsTab
              exceptionSearch={exceptionSearch}
              onExceptionSearchChange={setExceptionSearch}
              exceptionTypeFilter={exceptionTypeFilter}
              onExceptionTypeFilterChange={setExceptionTypeFilter}
              onOpenCreateException={openCreateException}
              availableAccountsCount={availableAccounts.length}
              exceptionsCount={exceptions.length}
              filteredExceptions={filteredExceptions}
              availableAccountMap={availableAccountMap}
              exceptionTypeLabel={EXCEPTION_TYPE_LABEL}
              actionShortLabel={ACTION_SHORT_LABEL}
              scopeLabel={SCOPE_LABEL}
              formatDateTime={formatDateTime}
              onRemoveException={removeException}
            />
          </TabsContent>

          <TabsContent value={TAB_VALUE.logs} className="m-0 flex-1 overflow-y-auto p-4">
            <ChangeLogTab
              logDateFrom={logDateFrom}
              onLogDateFromChange={setLogDateFrom}
              logDateTo={logDateTo}
              onLogDateToChange={setLogDateTo}
              logSearch={logSearch}
              onLogSearchChange={setLogSearch}
              onApplyFilters={() =>
                toast.success('已应用高级过滤条件', {
                  description: `日期范围: ${logDateFrom} 至 ${logDateTo}`,
                })
              }
              onResetFilters={() => {
                const nextRange = getDefaultLogDateRange();
                setLogDateFrom(nextRange.from);
                setLogDateTo(nextRange.to);
                setLogSearch('');
              }}
              onExportLogs={() =>
                toast.success('审计日志导出已排队', {
                  description: `当前筛选结果 ${filteredLogs.length} 条，后续可接正式导出能力。`,
                })
              }
              filteredLogs={filteredLogs}
              logTypeLabel={LOG_TYPE_LABEL}
              formatDateTime={formatDateTime}
            />
          </TabsContent>
        </Tabs>

      <RoleDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        editingRoleId={editingRoleId}
        draftRole={draftRole}
        categoryOrder={CATEGORY_ORDER}
        roleCategoryLabel={ROLE_CATEGORY_LABEL}
        onDraftChange={setDraftRole}
        onSave={saveRoleDraft}
      />

      <ExceptionDialog
        open={exceptionDialogOpen}
        onOpenChange={setExceptionDialogOpen}
        editingExceptionId={editingExceptionId}
        draftException={draftException}
        availableAccounts={availableAccounts}
        availableAccountMap={availableAccountMap}
        actionShortLabel={ACTION_SHORT_LABEL}
        scopeLabel={SCOPE_LABEL}
        onDraftChange={setDraftException}
        onSave={saveExceptionDraft}
      />
    </div>
  );
}
