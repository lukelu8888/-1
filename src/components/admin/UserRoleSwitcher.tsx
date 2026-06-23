import React, { useMemo } from 'react';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger } from '../ui/select';
import { Users, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getUserRoleLabel } from '../../lib/rbac-config'; // 🔥 导入getUserRoleLabel
import { PERMISSION_CENTER_ROLES } from '../../lib/services/permissionCenterService';
import { useAdminOrganization } from '../../contexts/AdminOrganizationContext';
import { canUseRoleSwitcherForUser } from '../../config/adminPortalPolicy';
import { buildLinkedPersonCenterRows } from './admin-organization-profile/peopleCenterShared';

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
  const contacts = adminOrg?.internalContacts || [];
  const internalAccounts = adminOrg?.internalAccounts || [];

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

  const linkedRows = useMemo(
    () => buildLinkedPersonCenterRows(contacts, internalAccounts, permissionRoleMap),
    [contacts, internalAccounts, permissionRoleMap],
  );

  const internalAccountUsers = useMemo(() => {
    if (!currentUser) return [];

    return linkedRows
      .map((row) => {
        const primaryAccount = row.linkedAccounts[0];
        if (!primaryAccount || !primaryAccount.canLogin || primaryAccount.accountStatus !== 'active') return null;
        if (!row.permissionRole.code || row.permissionRole.code === 'Unassigned') return null;

        return {
          id: primaryAccount.authUserId || primaryAccount.id || primaryAccount.loginEmail,
          name: row.name || primaryAccount.username || primaryAccount.loginEmail,
          email: primaryAccount.loginEmail,
          role: row.permissionRole.code,
          displayRoleName: row.permissionRole.name,
          region: normalizeRegion(primaryAccount.region || row.region),
          avatar: roleAvatarMap[row.permissionRole.code] || '👤',
          employeeNo: row.employeeNo || '',
        } satisfies SwitchableUser;
      })
      .filter((user): user is SwitchableUser => Boolean(user))
      .sort((left, right) => {
        const leftNo = Number(String((left as SwitchableUser & { employeeNo?: string }).employeeNo || '').replace(/\D/g, '') || 9999);
        const rightNo = Number(String((right as SwitchableUser & { employeeNo?: string }).employeeNo || '').replace(/\D/g, '') || 9999);
        if (leftNo !== rightNo) return leftNo - rightNo;
        return left.name.localeCompare(right.name, 'zh-CN');
      });
  }, [currentUser, linkedRows]);

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
  }, [currentUser?.email, currentUser?.id, switchableUsers]);

  if (!currentUser || !canUseRoleSwitcherForUser(currentUser.email)) return null;

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
        key={`${contacts.length}-${internalAccounts.length}-${switchableUsers.length}`}
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
