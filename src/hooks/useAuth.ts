// 用户认证和权限管理 Hook
// 改造后：从 UserContext 读取 Supabase session，不再独立依赖 localStorage
// switchUser 保留用于 Admin 内部 RBAC 角色切换

import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { User, hasPermission, Permission } from '../lib/rbac-config';

const INTERNAL_ROLES = [
  'CEO', 'CFO', 'Sales_Director', 'Regional_Manager', 'Sales_Manager',
  'Sales_Rep', 'Finance', 'Procurement', 'Admin', 'Marketing_Ops',
  'Documentation_Officer',
] as const;

function buildRbacUser(stored: any): User | null {
  if (!stored?.email) return null;
  return {
    id: stored.id ?? stored.email,
    name: stored.name ?? stored.email.split('@')[0],
    email: stored.email,
    role: stored.role ?? 'Admin',
    region: stored.region ?? 'all',
  };
}

export function useAuth() {
  const { user: authUser } = useUser();

  // RBAC 角色状态：初始从 localStorage 读取（用于 Admin 内部角色切换）
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('cosun_current_user');
      if (stored) return buildRbacUser(JSON.parse(stored));
    } catch { /* ignore */ }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  // 当 Supabase session 变化时，同步 RBAC 用户
  // 只在没有手动切换过角色（或切换角色的人与当前 session 不同）时覆盖
  useEffect(() => {
    if (!authUser) {
      // 登出时清空 RBAC 用户
      setCurrentUser(null);
      localStorage.removeItem('cosun_current_user');
      return;
    }

    if (authUser.type === 'admin') {
      // 检查 localStorage 里是否已有同一账号的 RBAC 角色记录
      try {
        const stored = localStorage.getItem('cosun_current_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          // 同一账号：保留已有的 RBAC 角色，不重复 setCurrentUser 避免循环
          if (parsed.email === authUser.email) return;
        }
      } catch { /* ignore */ }

      // 新登录：用 Supabase session 数据初始化 RBAC 用户
      const rbacUser: User = {
        id: authUser.id ?? authUser.email,
        name: authUser.name ?? authUser.email.split('@')[0],
        email: authUser.email,
        role: (authUser.role as any) ?? 'Admin',
        region: (authUser.region as any) ?? 'all',
      };
      setCurrentUser(rbacUser);
      localStorage.setItem('cosun_current_user', JSON.stringify(rbacUser));
      localStorage.setItem('cosun_auth_user', JSON.stringify({ email: authUser.email, type: 'admin' }));
    }
  }, [authUser?.email, authUser?.type]);

  // 监听 RBAC 角色切换事件（UserRoleSwitcher 发出）
  useEffect(() => {
    const handleUserChange = (event: CustomEvent) => {
      const rbacUser = buildRbacUser(event.detail);
      if (rbacUser) setCurrentUser(rbacUser);
    };
    window.addEventListener('userChanged', handleUserChange as EventListener);
    return () => window.removeEventListener('userChanged', handleUserChange as EventListener);
  }, []);

  // Admin 内部角色切换（不触发 Supabase 重新登录）
  const switchUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('cosun_current_user', JSON.stringify(user));
    localStorage.setItem('cosun_auth_user', JSON.stringify({
      email: user.email,
      type: INTERNAL_ROLES.includes(user.role as any) ? 'admin' : 'customer',
    }));
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
