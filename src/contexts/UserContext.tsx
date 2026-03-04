import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { fetchProfile } from '../hooks/useSupabaseAuth';
import { nextInquiryNumber } from '../lib/supabaseService';

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
  generateInquiryNumber: (region: string) => Promise<string>; // 调用 Supabase RPC next_inquiry_number（并发安全）
  peekInquiryNumber: (region: string) => string; // 本地预览格式，仅用于 UI 展示，不消耗序号
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
      let profile: any = null;
      try {
        profile = await fetchProfile(session.user.id);
      } catch (err) {
        console.warn('fetchProfile failed, falling back to user_metadata:', err);
      }
      if (profile) {
        setUserState({
          id: session.user.id,
          email: session.user.email!,
          name: profile.name,
          type: profile.portal_role === 'admin' ? 'admin'
              : profile.portal_role === 'staff' ? 'admin'
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
              : portalRole === 'staff' ? 'admin'
              : portalRole === 'supplier' ? 'supplier'
              : 'customer',
          role: meta.rbac_role ?? undefined,
          userRole: meta.rbac_role ?? undefined,
          region: meta.region ?? undefined,
        });
      }
    };

    // 兜底超时：若 INITIAL_SESSION 长时间未触发（网络异常），15秒后认为未登录
    let resolved = false;
    const sessionTimeout = setTimeout(() => {
      if (!resolved) {
        console.warn('Auth init timeout, treating as logged-out');
        setUserState(null);
        setAuthLoading(false);
      }
    }, 15000);

    // 注册 onAuthStateChange（先注册确保不错过事件）
    // INITIAL_SESSION 事件在页面加载时触发，携带当前本地 session（无需网络）
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') {
          resolved = true;
          clearTimeout(sessionTimeout);
          await applySession(session);
          setAuthLoading(false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setAuthLoading(true);
          await applySession(session);
          setAuthLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setUserState(null);
          setAuthLoading(false);
          localStorage.removeItem('cosun_auth_user');
        }
      }
    );

    return () => {
      clearTimeout(sessionTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const setUser = (authUser: AuthUser) => {
    setUserState(authUser);
  };

  const clearUser = () => {
    // 清理 API token / mock session / RBAC 用户
    try {
      localStorage.removeItem('cosun_api_token');
      localStorage.removeItem('backend_user');
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

  // 并发安全的编号生成：调用 Supabase RPC next_inquiry_number
  // number_sequences 表原子递增，多用户同时提交不会重号
  const generateInquiryNumber = async (region: string): Promise<string> => {
    try {
      return await nextInquiryNumber(region);
    } catch (err) {
      // RPC 失败时本地降级（极端网络异常兜底，格式一致但序号可能重复）
      console.error('[UserContext] next_inquiry_number RPC failed, falling back to local:', err);
      const date = new Date();
      const dateStr = String(date.getFullYear()).slice(2)
        + String(date.getMonth() + 1).padStart(2, '0')
        + String(date.getDate()).padStart(2, '0');
      return `INQ-${region}-${dateStr}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
    }
  };

  // UI 预览专用：本地构造编号格式，不消耗 Supabase 序号
  // 仅用于对话框展示"预计编号"，提交时以 RPC 返回值为准
  const peekInquiryNumber = (region: string): string => {
    const date = new Date();
    const dateStr = String(date.getFullYear()).slice(2)
      + String(date.getMonth() + 1).padStart(2, '0')
      + String(date.getDate()).padStart(2, '0');
    return `INQ-${region}-${dateStr}-????`;
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