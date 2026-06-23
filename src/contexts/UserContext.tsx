import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { fetchProfile, signInWithEmail } from '../hooks/useSupabaseAuth';
import { nextInquiryNumber } from '../lib/supabaseService';
import { normalizeManagedAdminIdentity } from '../lib/internalAdminIdentity';

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
  generateInquiryNumber: (region: string, customerId?: string) => Promise<string>; // 调用 Supabase RPC next_inquiry_number（并发安全）
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
const LOCAL_ADMIN_AUTH_STORAGE_KEY = 'cosun_admin_local_auth';
const LOCAL_ADMIN_AUTH_EMAIL_STORAGE_KEY = 'cosun_admin_local_auth_email';
const LOCAL_ADMIN_AUTH_PASSWORD_STORAGE_KEY = 'cosun_admin_local_auth_password';

const buildLocalFallbackInquiryNumber = (region: string) => {
  const date = new Date();
  const dateStr = String(date.getFullYear()).slice(2)
    + String(date.getMonth() + 1).padStart(2, '0')
    + String(date.getDate()).padStart(2, '0');
  const normalizedRegion = String(region || 'NA').trim().toUpperCase() || 'NA';
  const prefix = `ING-${normalizedRegion}-${dateStr}-`;
  const storageKey = `ing_local_fallback_counter_v4:${prefix}`;
  const legacyStorageKeyV3 = `ing_local_fallback_counter_v3:${normalizedRegion}`;
  const legacyStorageKeyV2 = `ing_local_fallback_counter_v2:${prefix}`;
  const legacyStorageKeyV1 = `ing_local_fallback_counter:${prefix}`;
  let nextSuffix = 1;

  if (typeof window !== 'undefined') {
    try {
      const stored = Number.parseInt(String(window.localStorage.getItem(storageKey) || '0'), 10);
      const legacyStoredV2 = Number.parseInt(String(window.localStorage.getItem(legacyStorageKeyV2) || '0'), 10);
      const legacyStoredV1 = Number.parseInt(String(window.localStorage.getItem(legacyStorageKeyV1) || '0'), 10);
      const seededCounter =
        Number.isFinite(stored) && stored > 0 && stored < 9000
          ? stored
          : (
              Number.isFinite(legacyStoredV2) && legacyStoredV2 > 0 && legacyStoredV2 < 9000
                ? legacyStoredV2
                : (Number.isFinite(legacyStoredV1) && legacyStoredV1 > 0 && legacyStoredV1 < 9000 ? legacyStoredV1 : 0)
            );
      nextSuffix = seededCounter > 0 ? seededCounter + 1 : 1;
      window.localStorage.setItem(storageKey, String(nextSuffix));
      window.localStorage.removeItem(legacyStorageKeyV3);
      window.localStorage.removeItem(legacyStorageKeyV2);
      window.localStorage.removeItem(legacyStorageKeyV1);
    } catch {
      nextSuffix = 1;
    }
  }

  return `${prefix}${String(nextSuffix).padStart(4, '0')}`;
};

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

  const readCachedAuthUser = (): AuthUser | null => {
    if (typeof window === 'undefined') return null;
    try {
      const cachedRaw = localStorage.getItem('cosun_auth_user');
      if (!cachedRaw) return null;
      const cached = JSON.parse(cachedRaw);
      if (
        cached?.email &&
        (cached?.type === 'admin' || cached?.type === 'supplier' || cached?.type === 'customer')
      ) {
        return normalizeManagedAdminIdentity(cached as AuthUser);
      }
    } catch {
      // ignore parse failures
    }
    return null;
  };

  const normalizePortalRole = (value: unknown): 'admin' | 'supplier' | 'customer' | null => {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'admin' || normalized === 'staff') return 'admin';
    if (normalized === 'supplier') return 'supplier';
    if (normalized === 'customer') return 'customer';
    return null;
  };

  const readCachedPortalRole = (sessionUser: any): 'admin' | 'supplier' | 'customer' | null => {
    if (typeof window === 'undefined') return null;
    try {
      const authUserRaw = localStorage.getItem('cosun_auth_user');
      if (authUserRaw) {
        const authUser = JSON.parse(authUserRaw);
        const sameIdentity =
          (authUser?.id && sessionUser?.id && authUser.id === sessionUser.id) ||
          (authUser?.email && sessionUser?.email && String(authUser.email).toLowerCase() === String(sessionUser.email).toLowerCase());
        const cachedType = normalizePortalRole(authUser?.type);
        if (sameIdentity && cachedType) {
          return cachedType;
        }
      }

      const backendUserRaw = localStorage.getItem('cosun_backend_user');
      if (backendUserRaw) {
        const backendUser = JSON.parse(backendUserRaw);
        const sameIdentity =
          (backendUser?.id && sessionUser?.id && backendUser.id === sessionUser.id) ||
          (backendUser?.email && sessionUser?.email && String(backendUser.email).toLowerCase() === String(sessionUser.email).toLowerCase());
        const cachedRole = normalizePortalRole(backendUser?.portal_role);
        if (sameIdentity && cachedRole) {
          return cachedRole;
        }
      }
    } catch {
      // ignore cache parse failures and fall back to session metadata
    }

    return null;
  };

  const preserveResolvedSessionUser = (
    prev: AuthUser | null,
    sessionUser: any,
    resolvedUser: AuthUser | null,
  ): AuthUser | null => {
    if (resolvedUser) return resolvedUser;
    if (!prev) return null;

    const sessionId = String(sessionUser?.id || '').trim();
    const sessionEmail = String(sessionUser?.email || '').trim().toLowerCase();
    const prevId = String(prev.id || '').trim();
    const prevEmail = String(prev.email || '').trim().toLowerCase();
    const sameIdentity =
      (prevId && sessionId && prevId === sessionId) ||
      (prevEmail && sessionEmail && prevEmail === sessionEmail);

    // Keep an already-resolved portal user for the same account if the fresh
    // SIGNED_IN payload is still missing portal_role metadata.
    return sameIdentity ? prev : null;
  };

  const tryRestoreLocalAdminSession = async (cachedUser?: AuthUser | null) => {
    if (typeof window === 'undefined') return false;
    try {
      const localAdminEnabled = localStorage.getItem(LOCAL_ADMIN_AUTH_STORAGE_KEY) === 'true';
      if (!localAdminEnabled) return false;

      const storedEmail = String(localStorage.getItem(LOCAL_ADMIN_AUTH_EMAIL_STORAGE_KEY) || '').trim().toLowerCase();
      const storedPassword = String(sessionStorage.getItem(LOCAL_ADMIN_AUTH_PASSWORD_STORAGE_KEY) || '').trim();
      const targetEmail = String(cachedUser?.email || storedEmail || '').trim().toLowerCase();
      if (!targetEmail || !storedPassword) return false;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const sessionEmail = String(session?.user?.email || '').trim().toLowerCase();
      if (session?.user && sessionEmail === targetEmail) return true;

      console.info('[UserContext] restoring Supabase session for local admin fallback user:', targetEmail);
      const { session: restoredSession } = await signInWithEmail(targetEmail, storedPassword);
      return Boolean(restoredSession?.user);
    } catch (error) {
      console.warn('[UserContext] failed to restore local admin Supabase session:', error);
      return false;
    }
  };

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
      } else if (!authLoading) {
        localStorage.removeItem('cosun_auth_user');
      }
    }
  }, [authLoading, user]);

  // 监听 Supabase Auth 状态变化（登录/登出/刷新）
  useEffect(() => {
    const cachedUser = readCachedAuthUser();
    if (cachedUser) {
      setUserState(cachedUser);
      setAuthLoading(false);
      void tryRestoreLocalAdminSession(cachedUser);
    }

    // 从 session.user_metadata 立即构建用户对象（无需网络请求）
    const userFromMeta = (sessionUser: any): AuthUser | null => {
      const meta = sessionUser.user_metadata ?? {};
      const portalRole =
        normalizePortalRole(meta.portal_role)
        ?? normalizePortalRole(sessionUser?.app_metadata?.portal_role)
        ?? readCachedPortalRole(sessionUser);
      if (!portalRole) {
        return null;
      }
      return normalizeManagedAdminIdentity({
        id: sessionUser.id,
        email: sessionUser.email!,
        name: meta.name ?? sessionUser.email!.split('@')[0],
        type: portalRole === 'admin' ? 'admin'
            : portalRole === 'supplier' ? 'supplier'
            : 'customer',
        role: meta.rbac_role ?? undefined,
        userRole: meta.rbac_role ?? undefined,
        region: meta.region ?? undefined,
      });
    };

    // 后台静默拉取 profile 并更新（不阻塞 UI）
    const enrichFromProfile = async (sessionUser: any) => {
      try {
        const profileTimeout = new Promise<null>(r => setTimeout(() => r(null), 3000));
        const profilePromise = fetchProfile(sessionUser.id).catch(() => null);
        const profile = await Promise.race([profilePromise, profileTimeout]);
        if (!profile) return;
        setUserState(prev => prev ? normalizeManagedAdminIdentity({
          ...prev,
          name: profile.name ?? prev.name,
          type: profile.portal_role === 'admin' ? 'admin'
              : profile.portal_role === 'staff' ? 'admin'
              : profile.portal_role === 'supplier' ? 'supplier'
              : 'customer',
          role: profile.rbac_role ?? prev.role,
          userRole: profile.rbac_role ?? prev.userRole,
          region: profile.region ?? prev.region,
        }) : prev);
      } catch {
        // 静默失败，保持 user_metadata 的值
      }
    };

    let initialDone = false;

    // getSession() 通常 < 10ms（读本地），但 token 过期时需网络刷新（可能 2-5s）
    // 已有本地缓存时先秒开；无缓存时只给很短窗口，避免 dashboard 首屏长期 Loading
    const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), 1200));
    const sessionPromise = supabase.auth.getSession()
      .then(({ data }) => data?.session ?? null)
      .catch(() => null);

    Promise.race([sessionPromise, timeout]).then((session) => {
      if (initialDone) return;
      if (session?.user) {
        // 有 session：立即解锁 UI
        initialDone = true;
        setUserState((prev) => preserveResolvedSessionUser(prev, session.user, userFromMeta(session.user)));
        void enrichFromProfile(session.user);
        setAuthLoading(false);
      } else if (!cachedUser) {
        initialDone = true;
        setUserState(null);
        setAuthLoading(false);
      }
      // 若 session 暂时不可用：
      // - 有缓存时继续保持已解锁状态，等待后续 onAuthStateChange 静默校正
      // - 无缓存时尽快解锁，由路由层决定是否跳转登录
    });

    // 硬兜底：8s 强制解锁，覆盖极端网络故障场景
    // Supabase 不可达（休眠/断网）时，优先用 localStorage 缓存的身份恢复会话，
    // 避免用户被强制登出。只有在完全没有缓存时才清空 user。
    const hardTimeout = setTimeout(() => {
      if (!initialDone) {
        initialDone = true;
        try {
          const cachedRaw = localStorage.getItem('cosun_auth_user');
          if (cachedRaw) {
            const cached = JSON.parse(cachedRaw);
            if (cached?.email && (cached?.type === 'admin' || cached?.type === 'supplier' || cached?.type === 'customer')) {
              console.warn('[Auth] hard timeout — Supabase unreachable, restored from localStorage cache');
              setUserState(cached as AuthUser);
              setAuthLoading(false);
              void tryRestoreLocalAdminSession(cached as AuthUser);
              return;
            }
          }
        } catch { /* ignore parse errors */ }
        console.warn('[Auth] hard timeout — no cache, forcing unlock');
        setUserState(null);
        setAuthLoading(false);
      }
    }, 8000);

    // 监听后续状态变化（登录/登出/token刷新）
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            setUserState((prev) => preserveResolvedSessionUser(prev, session.user, userFromMeta(session.user)));
            void enrichFromProfile(session.user);
          } else {
            const cachedUser = readCachedAuthUser();
            setUserState(cachedUser);
          }
          setAuthLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setUserState(null);
          setAuthLoading(false);
          localStorage.removeItem('cosun_auth_user');
        }
      }
    );

    return () => {
      clearTimeout(hardTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const setUser = (authUser: AuthUser) => {
    setUserState(authUser);
  };

  const clearUser = () => {
    // 清理 API token / mock session / RBAC 用户
    try {
      localStorage.removeItem('cosun_admin_local_auth');
      localStorage.removeItem('cosun_admin_local_auth_email');
      sessionStorage.removeItem('cosun_admin_local_auth_password');
      localStorage.removeItem('cosun_api_token');
      localStorage.removeItem('backend_user');
      localStorage.removeItem('cosun_user_session');
      localStorage.removeItem('cosun_session_expiry');
      localStorage.removeItem('cosun_current_user');
      localStorage.removeItem('cosun_switched_user');
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
  const generateInquiryNumber = async (region: string, customerId?: string): Promise<string> => {
    try {
      return await nextInquiryNumber(region, customerId ?? user?.id ?? undefined);
    } catch (err) {
      // RPC 失败时本地降级，仍按当天前缀递增，避免出现随机尾号。
      console.error('[UserContext] next_inquiry_number RPC failed, falling back to local:', err);
      return buildLocalFallbackInquiryNumber(region);
    }
  };

  // UI 预览专用：本地构造编号格式，不消耗 Supabase 序号
  // 仅用于对话框展示"预计编号"，提交时以 RPC 返回值为准
  const peekInquiryNumber = (region: string): string => {
    const date = new Date();
    const dateStr = String(date.getFullYear()).slice(2)
      + String(date.getMonth() + 1).padStart(2, '0')
      + String(date.getDate()).padStart(2, '0');
    return `ING-${region}-${dateStr}-????`;
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

export function useOptionalUser() {
  return useContext(UserContext);
}
