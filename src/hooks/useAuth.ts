// 🔥 用户认证和权限管理 Hook
import { useState, useEffect } from 'react';
import { User, DEMO_USERS, hasPermission, Permission } from '../lib/rbac-config';

// 从 localStorage 获取当前用户
export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔥 从localStorage加载用户
  const loadUserFromStorage = () => {
    const storedUser = localStorage.getItem('cosun_current_user');
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        console.log('✅ 已加载用户:', user.name, '角色:', user.role);
        
        // 🔥 同步更新 cosun_auth_user（确保数据隔离逻辑正常工作）
        // 内部员工（所有RBAC角色）都是admin类型，外部用户才是customer类型
        const internalRoles = ['CEO', 'CFO', 'Sales_Director', 'Regional_Manager', 'Sales_Manager', 'Sales_Rep', 'Finance', 'Procurement', 'Admin', 'Marketing_Ops', 'Documentation_Officer'];
        const authUser = {
          email: user.email,
          type: internalRoles.includes(user.role) ? 'admin' : 'customer'
        };
        localStorage.setItem('cosun_auth_user', JSON.stringify(authUser));
      } catch (error) {
        console.error('Failed to parse user from localStorage', error);
        setCurrentUser(null);
      }
    } else {
      // ✅ 真实登录：未登录时保持空，不再默认注入 DEMO 用户
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    // 初始加载
    loadUserFromStorage();
    setIsLoading(false);

    // 🔥 监听自定义事件（用于同一页面内的切换）
    const handleUserChange = (event: CustomEvent) => {
      console.log('🔄 检测到用户切换事件:', event.detail);
      setCurrentUser(event.detail);
    };

    // 🔥 监听storage事件（用于跨标签页同步）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cosun_current_user' && e.newValue) {
        try {
          const user = JSON.parse(e.newValue);
          console.log('🔄 检测到localStorage变化:', user.name);
          setCurrentUser(user);
        } catch (error) {
          console.error('Failed to parse user from storage event', error);
        }
      }
    };

    window.addEventListener('userChanged', handleUserChange as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('userChanged', handleUserChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 切换用户
  const switchUser = (user: User) => {
    console.log('🔄 切换用户到:', user.name, '角色:', user.role);
    setCurrentUser(user);
    localStorage.setItem('cosun_current_user', JSON.stringify(user));
    
    // 🔥 同步更新 cosun_auth_user（用于QuotationContext等数据隔离逻辑）
    // 内部员工（所有RBAC角色）都是admin类型，外部用户才是customer类型
    const internalRoles = ['CEO', 'CFO', 'Sales_Director', 'Regional_Manager', 'Sales_Manager', 'Sales_Rep', 'Finance', 'Procurement', 'Admin', 'Marketing_Ops', 'Documentation_Officer'];
    const authUser = {
      email: user.email,
      type: internalRoles.includes(user.role) ? 'admin' : 'customer'
    };
    localStorage.setItem('cosun_auth_user', JSON.stringify(authUser));
    console.log('✅ 已同步更新 cosun_auth_user:', authUser);
    
    // 🔥 触发自定义事件，通知其他组件
    window.dispatchEvent(new CustomEvent('userChanged', { detail: user }));
  };

  // 检查权限
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