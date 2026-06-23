// 用户认证和权限管理 Hook
// 改造后：从 UserContext 读取 Supabase session，不再独立依赖 localStorage
// switchUser 保留用于 Admin 内部 RBAC 角色切换

import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { User, hasPermission, Permission } from '../lib/rbac-config';
import { normalizeManagedAdminIdentity } from '../lib/internalAdminIdentity';
import { canUseRoleSwitcherForUser, shouldAuditImpersonation } from '../config/adminPortalPolicy';
import { roleSwitcherAuditService } from '../lib/services/roleSwitcherAuditService';

const RBAC_USER_KEY = 'cosun_current_user';
const SWITCHED_RBAC_USER_KEY = 'cosun_switched_user';

function buildRbacUser(stored: any): User | null {
  if (!stored?.email) return null;
  return normalizeManagedAdminIdentity({
    id: stored.id ?? stored.email,
    name: stored.name ?? stored.email.split('@')[0],
    email: stored.email,
    role: stored.role ?? 'Admin',
    region: stored.region ?? 'all',
  });
}

function readPersistedRbacUser(authEmail?: string | null): User | null {
  if (!canUseRoleSwitcherForUser(authEmail)) {
    try {
      localStorage.removeItem(SWITCHED_RBAC_USER_KEY);
    } catch {
      // ignore
    }
    return null;
  }

  try {
    const switchedRaw = localStorage.getItem(SWITCHED_RBAC_USER_KEY);
    if (switchedRaw) {
      const switched = buildRbacUser(JSON.parse(switchedRaw));
      if (switched) {
        return switched;
      }
    }
  } catch {
    // ignore
  }

  try {
    const stored = localStorage.getItem(RBAC_USER_KEY);
    if (stored) return buildRbacUser(JSON.parse(stored));
  } catch {
    // ignore
  }

  return null;
}

export function useAuth() {
  const { user: authUser } = useUser();

  // RBAC 角色状态：初始从 localStorage 读取（用于 Admin 内部角色切换）
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return readPersistedRbacUser();
  });
  const [isLoading, setIsLoading] = useState(false);

  // 当 Supabase session 变化时，同步 RBAC 用户
  // 只在没有手动切换过角色（或切换角色的人与当前 session 不同）时覆盖
  useEffect(() => {
    if (!authUser) {
      // 登出时清空 RBAC 用户
      setCurrentUser(null);
      localStorage.removeItem(RBAC_USER_KEY);
      localStorage.removeItem(SWITCHED_RBAC_USER_KEY);
      return;
    }

    if (authUser.type === 'admin') {
      if (!canUseRoleSwitcherForUser(authUser.email)) {
        try {
          localStorage.removeItem(SWITCHED_RBAC_USER_KEY);
        } catch {
          // ignore
        }
      }
      const persisted = readPersistedRbacUser(authUser.email);
      if (persisted) {
        setCurrentUser(persisted);
        return;
      }

      // 新登录：用 Supabase session 数据初始化 RBAC 用户
      const rbacUser: User = normalizeManagedAdminIdentity({
        id: authUser.id ?? authUser.email,
        name: authUser.name ?? authUser.email.split('@')[0],
        email: authUser.email,
        role: (authUser.role as any) ?? 'Admin',
        region: (authUser.region as any) ?? 'all',
      });
      setCurrentUser(rbacUser);
      localStorage.setItem(RBAC_USER_KEY, JSON.stringify(rbacUser));
    }
  }, [authUser?.email, authUser?.type]);

  // 监听 RBAC 角色切换事件（UserRoleSwitcher 发出）
  useEffect(() => {
    const handleUserChange = (event: CustomEvent) => {
      const rbacUser = buildRbacUser(event.detail) || readPersistedRbacUser(authUser?.email || null);
      if (rbacUser) setCurrentUser(rbacUser);
    };
    window.addEventListener('userChanged', handleUserChange as EventListener);
    return () => window.removeEventListener('userChanged', handleUserChange as EventListener);
  }, [authUser?.email]);

  // Admin 内部角色切换（不触发 Supabase 重新登录）
  const switchUser = (user: User) => {
    if (!canUseRoleSwitcherForUser(authUser?.email)) return;

    const previousUser = currentUser;
    setCurrentUser(user);
    localStorage.setItem(RBAC_USER_KEY, JSON.stringify(user));
    localStorage.setItem(SWITCHED_RBAC_USER_KEY, JSON.stringify(user));
    if (shouldAuditImpersonation()) {
      roleSwitcherAuditService.record({
        authenticatedUser: authUser?.type === 'admin'
          ? normalizeManagedAdminIdentity({
              id: authUser.id ?? authUser.email,
              name: authUser.name ?? authUser.email.split('@')[0],
              email: authUser.email,
              role: (authUser.role as any) ?? 'Admin',
              region: (authUser.region as any) ?? 'all',
            })
          : null,
        previousUser,
        nextUser: user,
      });
    }
    window.dispatchEvent(new CustomEvent('userChanged', { detail: user }));
  };

  const checkPermission = (permission: Permission): boolean => {
    if (!currentUser) return false;
    return hasPermission(currentUser, permission);
  };

  return {
    currentUser,
    isLoading,
    switchUser,
    checkPermission,
  };
}
