import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiLogout, clearBackendUser } from '../api/backend-auth';
import { supabase } from '../lib/supabase';
import { fetchProfile } from '../hooks/useSupabaseAuth';

export interface UserInfo {
  companyName: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  website: string;
  businessType: 'Retailer' | 'Importer' | 'Wholesaler' | 'Distributor' | 'E-commerce' | 'Other';
  inquiryCount: number;
}

export interface AuthUser {
  email: string;
  // NOTE: 历史上这里有 'manufacturer'，但实际业务里大量代码使用 'supplier'
  // 为保持兼容，这里同时支持 'supplier' 与 'manufacturer'
  type: 'customer' | 'supplier' | 'manufacturer' | 'admin'; // 🔥 添加 admin 类型
  id?: string; // 🔥 添加 id 字段
  name?: string; // 🔥 添加 name 字段
  role?: string; // 🔥 添加 role 字段（RBAC角色）
  userRole?: string; // 🔥 添加 userRole 字段（兼容性）
  region?: string; // 🔥 添加 region 字段
}

interface UserContextType {
  userInfo: UserInfo | null;
  setUserInfo: (info: UserInfo) => void;
  incrementInquiryCount: () => void;
  generateInquiryNumber: (region: string) => string; // 🔥 Updated: 需要传入区域代码
  peekInquiryNumber: (region: string) => string; // 🔥 Updated: 需要传入区域代码
  user: AuthUser | null;
  authLoading: boolean;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
  logout: () => Promise<void>;
}

const defaultUserInfo: UserInfo = {
  companyName: '',
  address: '',
  contactPerson: '',
  phone: '',
  email: '',
  website: '',
  businessType: 'Importer',
  inquiryCount: 0
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  // Load user info from localStorage on initialization
  const [userInfo, setUserInfo] = useState<UserInfo | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cosun_user_info');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved user info:', e);
          return null;
        }
      }
    }
    return null;
  });

  // Authentication user state
  // 初始值为 null，必须等 Supabase session 验证后才设置
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Save to localStorage whenever userInfo changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (userInfo) {
        localStorage.setItem('cosun_user_info', JSON.stringify(userInfo));
      } else {
        localStorage.removeItem('cosun_user_info');
      }
    }
  }, [userInfo]);

  // Save to localStorage whenever user changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('cosun_auth_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('cosun_auth_user');
      }
    }
  }, [user]);

  // 监听 Supabase Auth 状态变化（登录/登出/刷新）
  useEffect(() => {
    const applySession = async (session: any) => {
      if (!session?.user) { setUserState(null); return; }
      const profile = await fetchProfile(session.user.id);
      if (profile) {
        setUserState({
          id: session.user.id,
          email: session.user.email!,
          name: profile.name,
          type: profile.portal_role === 'admin' ? 'admin'
              : profile.portal_role === 'supplier' ? 'supplier'
              : 'customer',
          role: profile.rbac_role ?? undefined,
          userRole: profile.rbac_role ?? undefined,
          region: profile.region ?? undefined,
        });
      } else {
        // profile 查不到时，用 user_metadata 兜底
        const meta = session.user.user_metadata ?? {};
        const portalRole = meta.portal_role ?? 'customer';
        setUserState({
          id: session.user.id,
          email: session.user.email!,
          name: meta.name ?? session.user.email!.split('@')[0],
          type: portalRole === 'admin' ? 'admin'
              : portalRole === 'supplier' ? 'supplier'
              : 'customer',
          role: meta.rbac_role ?? undefined,
          userRole: meta.rbac_role ?? undefined,
          region: meta.region ?? undefined,
        });
      }
    };

    // 页面刷新时主动检查已有 session
    supabase.auth.getSession().then(({ data: { session } }) => {
      void applySession(session).finally(() => setAuthLoading(false));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setAuthLoading(true);
          await applySession(session);
          setAuthLoading(false);
        }
        if (event === 'SIGNED_OUT') {
          setUserState(null);
          setAuthLoading(false);
          localStorage.removeItem('cosun_auth_user');
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  // 监听角色切换事件（RBAC 内部角色切换，保持兼容）
  useEffect(() => {
    const handleUserChanged = (e: Event) => {
      const rbacUser = (e as CustomEvent).detail;
      if (!rbacUser?.email) return;
      const internalRoles = ['CEO', 'CFO', 'Sales_Director', 'Regional_Manager', 'Sales_Manager', 'Sales_Rep', 'Finance', 'Procurement', 'Admin', 'Marketing_Ops', 'Documentation_Officer'];
      const authUser = {
        email: rbacUser.email,
        type: (internalRoles.includes(rbacUser.role) ? 'admin' : 'customer') as 'admin' | 'customer',
        name: rbacUser.name,
        role: rbacUser.role,
      };
      setUserState(authUser);
    };
    window.addEventListener('userChanged', handleUserChanged);
    return () => window.removeEventListener('userChanged', handleUserChanged);
  }, []);

  const setUser = (authUser: AuthUser) => {
    console.log('🚨🚨🚨 [UserContext] setUser 被调用！');
    console.log('🚨🚨🚨 [UserContext] 调用栈:', new Error().stack);
    console.log('🚨🚨🚨 [UserContext] 设置的用户数据:', JSON.stringify(authUser, null, 2));
    setUserState(authUser);
  };

  const clearUser = () => {
    // 清理 API token / mock session / RBAC 用户
    try {
      localStorage.removeItem('cosun_api_token');
      clearBackendUser();
      localStorage.removeItem('cosun_user_session');
      localStorage.removeItem('cosun_session_expiry');
      localStorage.removeItem('cosun_current_user');
    } catch {
      // ignore
    }
    setUserState(null);
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch { /* 静默 */ }
    try {
      await supabase.auth.signOut();
    } catch { /* 静默 */ }
    clearUser();
  };

  const incrementInquiryCount = () => {
    if (userInfo) {
      setUserInfo({
        ...userInfo,
        inquiryCount: userInfo.inquiryCount + 1
      });
    }
  };

  const generateInquiryNumber = (region: string) => {
    const date = new Date();
    const yy = String(date.getFullYear()).slice(2); // 🔥 YY instead of YYYY
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dateStr = `${yy}${mm}${dd}`;
    
    // 🔥 使用区域化计数器：统计今天同区域的询价数量
    if (typeof window !== 'undefined') {
      const counterKey = `cosun_inquiry_counter_${region}_${dateStr}`;
      let counter = 1;
      const saved = localStorage.getItem(counterKey);
      if (saved) {
        counter = parseInt(saved, 10) + 1;
      }
      // 保存递增后的计数器
      localStorage.setItem(counterKey, String(counter));
      
      const sequence = String(counter).padStart(4, '0');
      return `RFQ-${region}-${dateStr}-${sequence}`; // 🔥 RFQ instead of INQ
    }
    
    return `RFQ-${region}-${dateStr}-0001`;
  };

  const peekInquiryNumber = (region: string) => {
    const date = new Date();
    const yy = String(date.getFullYear()).slice(2); // 🔥 YY instead of YYYY
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dateStr = `${yy}${mm}${dd}`;
    
    // 🔥 预览下一个编号而不递增计数器
    if (typeof window !== 'undefined') {
      const counterKey = `cosun_inquiry_counter_${region}_${dateStr}`;
      let counter = 1;
      const saved = localStorage.getItem(counterKey);
      if (saved) {
        counter = parseInt(saved, 10) + 1;
      }
      
      const sequence = String(counter).padStart(4, '0');
      return `RFQ-${region}-${dateStr}-${sequence}`; // 🔥 RFQ instead of INQ
    }
    
    return `RFQ-${region}-${dateStr}-0001`;
  };

  return (
    <UserContext.Provider
      value={{
        userInfo,
        setUserInfo,
        incrementInquiryCount,
        generateInquiryNumber,
        peekInquiryNumber, // 🔥 New: Preview next number without incrementing
        user,
        authLoading,
        setUser,
        clearUser,
        logout
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}