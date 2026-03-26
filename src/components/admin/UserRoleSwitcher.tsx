import React, { useMemo } from 'react';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger } from '../ui/select';
import { Users, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getUserRoleLabel } from '../../lib/rbac-config'; // 🔥 导入getUserRoleLabel
import { PERMISSION_CENTER_ROLES } from '../../lib/services/permissionCenterService';
import { useAdminOrganization } from '../../contexts/AdminOrganizationContext';

type SwitchableUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  displayRoleName: string;
  region: string;
  avatar: string;
  employeeNo?: string;
};

const roleAvatarMap: Record<string, string> = {
  CEO: '👨‍💼',
  CFO: '💼',
  Sales_Director: '🎯',
  Regional_Manager: '👔',
  Sales_Manager: '👔',
  Sales_Rep: '👨‍💼',
  Sales_Assistant: '🙋',
  Finance: '💰',
  External_Accountant: '🧾',
  Procurement_Manager: '🛒',
  Procurement: '🛒',
  Documentation_Officer: '📄',
  Marketing_Ops: '📣',
  Marketing_Assistant: '📝',
  QC: '🧪',
  Warehouse_Ops: '📦',
  HR_Admin: '🧑‍💼',
  Admin_Ops: '🗂️',
  Admin: '🛡️',
};

const switcherRoleLabelMap: Record<string, string> = {
  Sales_Assistant: '业务助理',
  External_Accountant: '代理记账财务',
  Procurement_Manager: '采购主管',
  Procurement: '采购员',
  Marketing_Assistant: '运营助理',
  HR_Admin: '人事主管',
  Admin_Ops: '行政专员',
  QC: 'QC',
  Warehouse_Ops: '仓配运营',
};

const regionDisplayMap: Record<string, string> = {
  NA: '北美区',
  SA: '南美区',
  EA: '欧非区',
};

// 🔥 全局用户角色切换器（右上角显示）
export default function UserRoleSwitcher() {
  const { currentUser, switchUser } = useAuth();
  const { adminOrg } = useAdminOrganization();

  const normalizeRole = (source?: string): string => {
    const normalizedSource = String(source || '').trim();
    if (!normalizedSource) return '';
    const roleMap: Record<string, string> = {
      CEO: 'CEO',
      CFO: 'CFO',
      Admin: 'Admin',
      Sales_Director: 'Sales_Director',
      Regional_Manager: 'Regional_Manager',
      Sales_Manager: 'Sales_Manager',
      Sales_Rep: 'Sales_Rep',
      Sales_Assistant: 'Sales_Assistant',
      Finance: 'Finance',
      External_Accountant: 'External_Accountant',
      Procurement_Manager: 'Procurement_Manager',
      Procurement: 'Procurement',
      Documentation_Officer: 'Documentation_Officer',
      Marketing_Ops: 'Marketing_Ops',
      Marketing_Assistant: 'Marketing_Assistant',
      QC: 'QC',
      Warehouse_Ops: 'Warehouse_Ops',
      HR_Admin: 'HR_Admin',
      Admin_Ops: 'Admin_Ops',
      company_admin: 'CEO',
      standard_user: '',
      系统管理员: 'Admin',
      管理员: 'Admin',
      销售总监: 'Sales_Director',
      区域业务经理: 'Regional_Manager',
      区域主管: 'Regional_Manager',
      销售经理: 'Sales_Manager',
      业务员: 'Sales_Rep',
      业务助理: 'Sales_Assistant',
      财务专员: 'Finance',
      内部财务: 'Finance',
      代理记账财务: 'External_Accountant',
      采购经理: 'Procurement_Manager',
      采购主管: 'Procurement_Manager',
      采购专员: 'Procurement',
      采购员: 'Procurement',
      单证员: 'Documentation_Officer',
      Order_Coordinator: 'Documentation_Officer',
      跟单员: 'Documentation_Officer',
      运营专员: 'Marketing_Ops',
      运营助理: 'Marketing_Assistant',
      验货员: 'QC',
      质检: '',
      仓配运营: 'Warehouse_Ops',
      人事主管: 'HR_Admin',
      人力资源: 'HR_Admin',
      行政专员: 'Admin_Ops',
    };

    return roleMap[normalizedSource] ?? normalizedSource;
  };

  const normalizeRegion = (region?: string): string => {
    const value = String(region || '').trim();
    if (!value) return 'all';
    if (value === 'North America') return 'NA';
    if (value === 'South America') return 'SA';
    if (value === 'Europe & Africa') return 'EA';
    return value;
  };

  const permissionRoleMap = useMemo(
    () => Object.fromEntries(PERMISSION_CENTER_ROLES.map((role) => [role.id, role] as const)),
    [],
  );

  const getRegionalRoleDisplayName = (code: string, region?: string, fallbackName?: string) => {
    const normalizedRegion = normalizeRegion(region);
    const regionLabel = regionDisplayMap[normalizedRegion];
    if (!regionLabel) {
      return fallbackName || permissionRoleMap[code]?.name || code;
    }
    if (code === 'Sales_Rep') return `${regionLabel}业务员`;
    if (code === 'Regional_Manager') return `${regionLabel}区域主管`;
    if (code === 'Sales_Assistant') return `${regionLabel}业务助理`;
    return fallbackName || permissionRoleMap[code]?.name || code;
  };

  const resolvePermissionRole = (rawRole?: string, title?: string, department?: string, region?: string) => {
    const normalizedRole = normalizeRole(rawRole);
    if (normalizedRole && normalizedRole !== 'Unassigned') {
      return {
        code: normalizedRole,
        name: getRegionalRoleDisplayName(normalizedRole, region, permissionRoleMap[normalizedRole]?.name || normalizedRole),
      };
    }

    const normalizedTitle = normalizeRole(title);
    if (normalizedTitle && normalizedTitle !== 'Unassigned') {
      return {
        code: normalizedTitle,
        name: getRegionalRoleDisplayName(normalizedTitle, region, permissionRoleMap[normalizedTitle]?.name || normalizedTitle),
      };
    }

    const normalizedDepartment = String(department || '').trim();
    const departmentFallbackMap: Record<string, string> = {
      行政部: 'Admin_Ops',
      人力资源: 'HR_Admin',
      财务部: 'Finance',
      采购部: 'Procurement_Manager',
      销售部: 'Sales_Director',
    };
    const fallbackCode = departmentFallbackMap[normalizedDepartment] || '';
    if (fallbackCode) {
      return {
        code: fallbackCode,
        name: getRegionalRoleDisplayName(fallbackCode, region, permissionRoleMap[fallbackCode]?.name || fallbackCode),
      };
    }

    return {
      code: 'Unassigned',
      name: '未分配',
    };
  };

  const internalAccountUsers = useMemo(() => {
    if (!currentUser) return [];

    const contacts = adminOrg?.internalContacts || [];
    const activeAccounts = (adminOrg?.internalAccounts || []).filter(
      (account) => account.canLogin && account.accountStatus === 'active',
    );

    return contacts
      .map((contact) => {
        const linkedAccount = activeAccounts.find((account) => {
          if (account.employeeId === contact.id) return true;
          if (!account.employeeId && contact.email) {
            return String(account.loginEmail || '').trim().toLowerCase() === String(contact.email || '').trim().toLowerCase();
          }
          return false;
        });
        if (!linkedAccount) return null;

        const resolvedRole = resolvePermissionRole(linkedAccount.role, contact.title, contact.department, linkedAccount.region);
        if (!resolvedRole.code || resolvedRole.code === 'Unassigned') return null;

        return {
          id: linkedAccount.authUserId || linkedAccount.id || linkedAccount.loginEmail,
          name: contact.name || linkedAccount.username || linkedAccount.loginEmail,
          email: linkedAccount.loginEmail,
          role: resolvedRole.code,
          displayRoleName: resolvedRole.name,
          region: normalizeRegion(linkedAccount.region),
          avatar: roleAvatarMap[resolvedRole.code] || '👤',
          employeeNo: contact.employeeNo || '',
        } satisfies SwitchableUser;
      })
      .filter((user): user is SwitchableUser => Boolean(user))
      .sort((left, right) => {
        const leftNo = Number(String((left as SwitchableUser & { employeeNo?: string }).employeeNo || '').replace(/\D/g, '') || 9999);
        const rightNo = Number(String((right as SwitchableUser & { employeeNo?: string }).employeeNo || '').replace(/\D/g, '') || 9999);
        if (leftNo !== rightNo) return leftNo - rightNo;
        return left.name.localeCompare(right.name, 'zh-CN');
      });
  }, [adminOrg, currentUser]);

  const switchableUsers = useMemo(() => {
    if (!currentUser) return [];

    const users = [...internalAccountUsers];
    if (users.length > 0) return users;

    return [{
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role,
      displayRoleName: getUserRoleLabel(currentUser).zh,
      region: currentUser.region || 'all',
      avatar: currentUser.avatar || (roleAvatarMap[currentUser.role] || '👤'),
    }];
  }, [currentUser, internalAccountUsers]);

  const currentSwitchableUser = useMemo(() => {
    if (!currentUser) return null;

    const normalizedCurrentEmail = String(currentUser.email || '').trim().toLowerCase();
    return switchableUsers.find((user) => {
      if (user.id === currentUser.id) return true;
      return String(user.email || '').trim().toLowerCase() === normalizedCurrentEmail;
    }) || null;
  }, [currentUser.email, currentUser.id, switchableUsers]);

  if (!currentUser) return null;

  const getRoleColor = () => {
    const roleLabel = getUserRoleLabel(currentUser); // 🔥 使用新函数
    const colorMap: Record<string, string> = {
      purple: 'bg-purple-600',
      blue: 'bg-blue-600',
      green: 'bg-green-600',
      orange: 'bg-orange-600',
      cyan: 'bg-cyan-600',
      yellow: 'bg-yellow-600',
      red: 'bg-red-600',
    };
    return colorMap[roleLabel.color] || 'bg-gray-600';
  };

  const getDisplayRoleLabel = (user: SwitchableUser | typeof currentUser) => {
    if ('displayRoleName' in user && user.displayRoleName) {
      return user.displayRoleName;
    }
    const baseLabel = switcherRoleLabelMap[user.role] || getUserRoleLabel(user as any).zh;
    const regionLabel = regionDisplayMap[user.region || ''];

    if (regionLabel && user.role === 'Sales_Rep') {
      return `${regionLabel}业务员`;
    }
    if (regionLabel && user.role === 'Regional_Manager') {
      return `${regionLabel}区域主管`;
    }
    if (regionLabel && user.role === 'Sales_Assistant') {
      return `${regionLabel}业务助理`;
    }

    return baseLabel;
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg">
        <div className={`w-9 h-9 rounded-full ${getRoleColor()} flex items-center justify-center text-base`}>
          {currentSwitchableUser?.avatar || currentUser.avatar}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">
              {currentSwitchableUser?.name || currentUser.name}
            </p>
            <Badge variant="outline" className="h-4 px-1.5 text-xs">
              {getDisplayRoleLabel(currentSwitchableUser || currentUser)} {/* 🔥 显示区分后的角色名称 */}
            </Badge>
          </div>
          {(currentSwitchableUser?.region || currentUser.region) && (currentSwitchableUser?.region || currentUser.region) !== 'all' && (
            <p className="text-xs text-gray-500">
              {(currentSwitchableUser?.region || currentUser.region) === 'NA' ? '负责北美区' : 
               (currentSwitchableUser?.region || currentUser.region) === 'SA' ? '负责南美区' : 
               (currentSwitchableUser?.region || currentUser.region) === 'EA' ? '负责欧非区' : 
               `${currentSwitchableUser?.region || currentUser.region}区`}
            </p>
          )}
        </div>
      </div>

      <Select 
        value={switchableUsers.find((user) => user.email === currentUser.email)?.id || currentUser.id} 
        onValueChange={(id) => {
          const user = switchableUsers.find(u => u.id === id);
          if (user) switchUser(user);
        }}
      >
        <SelectTrigger className="h-8 w-[180px] text-xs border-gray-300 bg-white">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-gray-600" />
            <span>切换角色</span>
          </div>
        </SelectTrigger>
        <SelectContent>
          {switchableUsers.map(user => {
            const roleLabel = getDisplayRoleLabel(user); // 🔥 使用统一显示标签
            const displayText = `${user.avatar} ${user.name} - ${roleLabel}`;
            return (
              <SelectItem key={user.id} value={user.id} className="text-xs">
                {displayText}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

// 🔥 紧凑版用户信息显示（用于数据分析等页面）
export function CompactUserInfo() {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  const getRoleColor = () => {
    const roleLabel = getUserRoleLabel(currentUser); // 🔥 使用新函数
    const colorMap: Record<string, string> = {
      purple: 'bg-purple-100 text-purple-700 border-purple-300',
      blue: 'bg-blue-100 text-blue-700 border-blue-300',
      green: 'bg-green-100 text-green-700 border-green-300',
      orange: 'bg-orange-100 text-orange-700 border-orange-300',
      cyan: 'bg-cyan-100 text-cyan-700 border-cyan-300',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      red: 'bg-red-100 text-red-700 border-red-300',
    };
    return colorMap[roleLabel.color] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  return (
    <div className="flex items-center gap-2">
      <Users className="w-3.5 h-3.5 text-gray-500" />
      <span className="text-xs text-gray-600">当前登录：</span>
      <Badge className={`h-5 px-2 text-xs border ${getRoleColor()}`}>
        {currentUser.avatar} {getUserRoleLabel(currentUser).zh} {/* 🔥 显示区分后的角色名称 */}
      </Badge>
      {currentUser.region && currentUser.region !== 'all' && (
        <Badge variant="outline" className="h-5 px-2 text-xs">
          {currentUser.region}区
        </Badge>
      )}
    </div>
  );
}
