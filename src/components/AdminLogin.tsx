import React, { useMemo, useState } from 'react';
import { Building2, Eye, EyeOff, Globe, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { useOptionalUser } from '../contexts/UserContext';
import { useRouter } from '../contexts/RouterContext';
import { signInWithEmail, fetchProfile } from '../hooks/useSupabaseAuth';
import {
  getStoredAdminOrgProfile,
  recordStoredAdminAccountLastLogin,
} from '../contexts/AdminOrganizationContext';
import { adminLoginAuditService } from '../lib/supabaseService';

function readCachedAdminProfile(email: string) {
  try {
    const backendUserRaw = localStorage.getItem('cosun_backend_user');
    if (!backendUserRaw) return null;
    const backendUser = JSON.parse(backendUserRaw);
    if (String(backendUser?.email || '').toLowerCase() !== email.toLowerCase()) return null;
    if (backendUser?.portal_role !== 'admin' && backendUser?.portal_role !== 'staff') return null;
    return {
      name: backendUser.username as string | undefined,
      rbac_role: backendUser.rbac_role as string | null | undefined,
      region: backendUser.region as string | null | undefined,
      portal_role: (backendUser.portal_role === 'staff' ? 'staff' : 'admin') as 'admin' | 'staff',
    };
  } catch {
    return null;
  }
}

function persistFallbackAdminState(params: {
  id: string;
  email: string;
  name: string;
  rbacRole?: string | null;
  region?: string | null;
}) {
  localStorage.removeItem('cosun_switched_user');
  localStorage.setItem('cosun_auth_user', JSON.stringify({
    id: params.id,
    email: params.email,
    name: params.name,
    type: 'admin',
    role: params.rbacRole ?? 'Admin',
    userRole: params.rbacRole ?? 'Admin',
    region: params.region ?? 'all',
  }));

  localStorage.setItem('cosun_current_user', JSON.stringify({
    id: params.id,
    email: params.email,
    name: params.name,
    role: params.rbacRole ?? 'Admin',
    region: params.region ?? 'all',
    type: 'admin',
  }));

  localStorage.setItem('cosun_backend_user', JSON.stringify({
    id: params.id,
    email: params.email,
    username: params.name,
    portal_role: 'admin',
    rbac_role: params.rbacRole ?? 'Admin',
    region: params.region ?? 'all',
  }));
}

export default function AdminLogin() {
  const userContext = useOptionalUser();
  const setUser = userContext?.setUser ?? (() => {});
  const { navigateTo } = useRouter();
  const REMEMBER_KEY = 'cosun_remember_admin';
  const MIGRATE_VERSION = 'v3';
  const [username, setUsername] = useState(() => {
    // 同步迁移：如果 Login.tsx 的迁移未执行（直接访问 admin-login），这里也清一次
    if (localStorage.getItem('cosun_remember_migrated') !== MIGRATE_VERSION) {
      localStorage.removeItem('cosun_remember_user');
      localStorage.removeItem('cosun_remember_customer');
      localStorage.removeItem('cosun_remember_supplier');
      localStorage.removeItem('cosun_remember_admin');
      localStorage.setItem('cosun_remember_migrated', MIGRATE_VERSION);
    }
    return localStorage.getItem(REMEMBER_KEY) ?? '';
  });
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem(REMEMBER_KEY));
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');

  const adminOrgProfile = getStoredAdminOrgProfile();
  const adminLoginAccounts = useMemo(() => adminOrgProfile.internalAccounts
    .filter((account) => {
      if (!account.canLogin || account.accountStatus !== 'active') return false;
      return Boolean(account.loginEmail && account.loginPassword);
    })
    .map((account) => {
      const linkedContact = adminOrgProfile.internalContacts.find((contact) => contact.id === account.employeeId);
      return {
        id: account.id,
        username: account.username || account.loginEmail.split('@')[0],
        email: account.loginEmail,
        password: account.loginPassword,
        name: linkedContact?.name || account.username || '内部账号',
        title: linkedContact?.title || account.role || '内部岗位',
        employeeNo: linkedContact?.employeeNo || '',
      };
    })
    .sort((left, right) => {
      const leftNo = Number(String(left.employeeNo || '').replace(/\D/g, '') || 0);
      const rightNo = Number(String(right.employeeNo || '').replace(/\D/g, '') || 0);
      if (leftNo !== rightNo) return leftNo - rightNo;
      return left.name.localeCompare(right.name, 'zh-CN');
    }), [adminOrgProfile.internalAccounts, adminOrgProfile.internalContacts]);

  const unifiedAdminAccount = useMemo(() => {
    return adminLoginAccounts.find((account) => {
      const username = String(account.username || '').trim().toLowerCase();
      const email = String(account.email || '').trim().toLowerCase();
      return username === 'admin' || email === 'admin@cosun.com';
    }) || null;
  }, [adminLoginAccounts]);

  const usernameMap = useMemo(() => {
    const entries: Array<[string, string]> = [];
    adminLoginAccounts.forEach((account) => {
      const emailPrefix = String(account.email || '').split('@')[0]?.trim().toLowerCase();
      const username = String(account.username || '').trim().toLowerCase();
      const name = String(account.name || '').trim().toLowerCase();
      if (emailPrefix) entries.push([emailPrefix, account.email]);
      if (username) entries.push([username, account.email]);
      if (name) entries.push([name, account.email]);
    });
    return new Map(entries);
  }, [adminLoginAccounts]);

  const resolveEmail = (input: string): string => {
    const trimmed = input.trim().toLowerCase();
    if (trimmed.includes('@')) return trimmed;
    return usernameMap.get(trimmed) ?? trimmed;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const email = resolveEmail(username);
    const normalizedUsername = username.trim().toLowerCase();
    const unifiedAdminEmail = String(unifiedAdminAccount?.email || 'admin@cosun.com').trim().toLowerCase();
    const isUnifiedAdminLogin = normalizedUsername === 'admin' || email === unifiedAdminEmail;
    const attemptedAt = new Date().toISOString();
    if (!email) {
      void adminLoginAuditService.record({
        attemptedAt,
        enteredIdentifier: username,
        loginEmail: '',
        normalizedLoginEmail: '',
        status: 'failure',
        failureReason: 'missing_identifier',
      });
      setError(language === 'zh' ? '请输入有效的用户名或邮箱' : 'Please enter a valid username or email');
      setIsLoading(false);
      return;
    }
    if (!isUnifiedAdminLogin) {
      void adminLoginAuditService.record({
        attemptedAt,
        enteredIdentifier: username,
        loginEmail: email,
        normalizedLoginEmail: unifiedAdminEmail,
        status: 'failure',
        failureReason: 'non_unified_admin_login_blocked',
      });
      setError(language === 'zh'
        ? '内部员工请统一使用 admin 主账号登录，登录后再通过右上角“切换角色”进入对应身份。'
        : 'Please use the admin master account to sign in, then switch identity from the role dropdown.');
      setIsLoading(false);
      return;
    }

    try {
      // Supabase Auth 登录
      const { session } = await signInWithEmail(unifiedAdminEmail, password);
      if (!session?.user) throw new Error('登录失败，请重试');

      // 获取用户 profile（portal_role / rbac_role / region）
      let degraded = false;
      let profile = null;
      try {
        profile = await fetchProfile(session.user.id);
      } catch (profileError) {
        degraded = true;
        profile = readCachedAdminProfile(session.user.email!);
        console.warn('[AdminLogin] profile lookup failed, using fallback session.', profileError);
      }

      // 允许 admin / staff 进入内部管理门户
      if (profile && profile.portal_role !== 'admin' && profile.portal_role !== 'staff') {
        void adminLoginAuditService.record({
          attemptedAt,
          enteredIdentifier: username,
          loginEmail: session.user.email!,
          normalizedLoginEmail: unifiedAdminEmail,
          authUserId: session.user.id,
          adminName: profile?.name ?? session.user.email!.split('@')[0],
          portalRole: profile.portal_role,
          rbacRole: profile.rbac_role ?? '',
          region: profile.region ?? '',
          status: 'failure',
          failureReason: 'portal_role_not_admin',
        });
        await import('../hooks/useSupabaseAuth').then(m => m.signOut());
        throw new Error(language === 'zh'
          ? '此账号无管理员权限，请使用客户/供应商入口登录'
          : 'This account has no admin access. Please use the customer/supplier portal.');
      }

      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, email);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }

      // 更新 UserContext（onAuthStateChange 也会触发，这里做即时同步）
      setUser({
        id: session.user.id,
        email: session.user.email!,
        name: profile?.name ?? session.user.email!.split('@')[0],
        type: 'admin',
        role: profile?.rbac_role ?? 'Admin',
        userRole: profile?.rbac_role ?? 'Admin',
        region: profile?.region ?? 'all',
      });
      persistFallbackAdminState({
        id: session.user.id,
        email: session.user.email!,
        name: profile?.name ?? session.user.email!.split('@')[0],
        rbacRole: profile?.rbac_role,
        region: profile?.region,
      });
      await recordStoredAdminAccountLastLogin(session.user.email!, attemptedAt);
      void adminLoginAuditService.record({
        attemptedAt,
        enteredIdentifier: username,
        loginEmail: session.user.email!,
        normalizedLoginEmail: unifiedAdminEmail,
        authUserId: session.user.id,
        adminName: profile?.name ?? session.user.email!.split('@')[0],
        portalRole: profile?.portal_role ?? 'admin',
        rbacRole: profile?.rbac_role ?? 'Admin',
        region: profile?.region ?? 'all',
        status: 'success',
        failureReason: degraded ? 'profile_lookup_degraded_to_cache' : '',
      });
      if (degraded) {
        console.warn('[AdminLogin] continuing with fallback admin profile state.');
      }

      // useAuth 会监听 onAuthStateChange 自动同步 RBAC 用户，无需手动写 localStorage
      setIsLoading(false);
      return; // 登录成功，后面由 onAuthStateChange / setUser 触发页面跳转

    } catch (err: any) {
      const msg = err?.message || '';
      void adminLoginAuditService.record({
        attemptedAt,
        enteredIdentifier: username,
        loginEmail: email,
        normalizedLoginEmail: unifiedAdminEmail,
        status: 'failure',
        failureReason: msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')
          ? 'invalid_credentials'
          : (msg || 'login_failed'),
      });
      if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
        setError(language === 'zh' ? '邮箱或密码错误' : 'Invalid email or password');
      } else {
        setError(msg || (language === 'zh' ? '登录失败，请重试' : 'Login failed, please try again'));
      }
    }

    setIsLoading(false);
  };

  // 快速登录（开发模式）：直接用传入的账密，绕过 state 异步问题
  const quickLogin = async (identifier: string, pass: string) => {
    const email = resolveEmail(identifier);
    setUsername(identifier);
    setPassword(pass);
    setError('');
    setIsLoading(true);
    const attemptedAt = new Date().toISOString();
    try {
      const { signInWithEmail: signIn, fetchProfile: getProfile } = await import('../hooks/useSupabaseAuth');
      const { session } = await signIn(email, pass);
      if (!session?.user) throw new Error('登录失败，请重试');
      let profile = null;
      try {
        profile = await getProfile(session.user.id);
      } catch {
        profile = readCachedAdminProfile(session.user.email!);
      }
      if (profile && profile.portal_role !== 'admin' && profile.portal_role !== 'staff') {
        void adminLoginAuditService.record({
          attemptedAt,
          enteredIdentifier: identifier,
          loginEmail: session.user.email!,
          normalizedLoginEmail: email,
          authUserId: session.user.id,
          adminName: profile?.name ?? session.user.email!.split('@')[0],
          portalRole: profile.portal_role,
          rbacRole: profile.rbac_role ?? '',
          region: profile.region ?? '',
          status: 'failure',
          failureReason: 'portal_role_not_admin',
        });
        const { signOut } = await import('../hooks/useSupabaseAuth');
        await signOut();
        throw new Error('此账号无管理员权限');
      }
      persistFallbackAdminState({
        id: session.user.id,
        email: session.user.email!,
        name: profile?.name ?? session.user.email!.split('@')[0],
        rbacRole: profile?.rbac_role,
        region: profile?.region,
      });
      await recordStoredAdminAccountLastLogin(session.user.email!, attemptedAt);
      void adminLoginAuditService.record({
        attemptedAt,
        enteredIdentifier: identifier,
        loginEmail: session.user.email!,
        normalizedLoginEmail: email,
        authUserId: session.user.id,
        adminName: profile?.name ?? session.user.email!.split('@')[0],
        portalRole: profile?.portal_role ?? 'admin',
        rbacRole: profile?.rbac_role ?? 'Admin',
        region: profile?.region ?? 'all',
        status: 'success',
      });
      // useAuth 监听 onAuthStateChange 自动同步 RBAC 用户
    } catch (err: any) {
      void adminLoginAuditService.record({
        attemptedAt,
        enteredIdentifier: identifier,
        loginEmail: email,
        normalizedLoginEmail: email,
        status: 'failure',
        failureReason: String(err?.message || 'quick_login_failed'),
      });
      setError(err?.message || '快速登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  const text = {
    zh: {
      title: '账密登录',
      username: '用户名',
      password: '密码',
      rememberMe: '记住密码',
      forgotPassword: '找回密码',
      loginButton: '登录',
      agreement: '登录即表示同意',
      terms: '《服务条款》',
      and: '和',
      privacy: '《隐私政策》',
      quickLogin: '快速登录（开发测试）',
      internalOnly: '仅限内部员工访问'
    },
    en: {
      title: 'Account Login',
      username: 'Username',
      password: 'Password',
      rememberMe: 'Remember Me',
      forgotPassword: 'Forgot Password',
      loginButton: 'Login',
      agreement: 'By logging in, you agree to',
      terms: 'Terms of Service',
      and: 'and',
      privacy: 'Privacy Policy',
      quickLogin: 'Quick Login (Dev Mode)',
      internalOnly: 'Internal Staff Only'
    }
  };

  const t = text[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex items-center justify-center p-4">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* 登录卡片 */}
      <div className="relative w-full max-w-md">
        {/* macOS风格窗口头 */}
        <div className="bg-white rounded-t-2xl border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          
          {/* 语言切换 */}
          <button
            onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700"
          >
            <Globe className="w-4 h-4" />
            {language === 'zh' ? '中文简体' : 'English'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* 主要内容区 */}
        <div className="bg-white rounded-b-2xl shadow-2xl p-8">
          {/* Logo和标题 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl shadow-lg mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-red-600 mb-2" style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '2px' }}>
              COSUN
            </h1>
            <p className="text-slate-600 text-sm mb-1">Admin Portal · 内部管理系统</p>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Shield className="w-3.5 h-3.5" />
              <span>{t.internalOnly}</span>
            </div>
          </div>

          {/* 登录标题 */}
          <div className="mb-6">
            <h2 className="text-slate-800 flex items-center gap-2">
              <div className="w-1 h-6 bg-red-600 rounded-full"></div>
              {t.title}
            </h2>
          </div>

          {/* 登录表单 */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* 用户名输入 */}
            <div>
              <label className="flex items-center gap-1 text-sm text-slate-700 mb-2">
                <span className="text-red-500">*</span>
                {t.username}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={language === 'zh' ? '请输入用户名或邮箱' : 'Enter username or email'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all text-sm"
                required
              />
            </div>

            {/* 密码输入 */}
            <div>
              <label className="flex items-center gap-1 text-sm text-slate-700 mb-2">
                <span className="text-red-500">*</span>
                {t.password}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={language === 'zh' ? '请输入密码' : 'Enter password'}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* 记住密码和找回密码 */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <Checkbox
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  className="border-gray-300"
                />
                <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">
                  {t.rememberMe}
                </span>
              </label>
              <button
                type="button"
                className="text-sm text-red-600 hover:text-red-700 transition-colors"
              >
                {t.forgotPassword}
              </button>
            </div>

            {/* 登录按钮 */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-6 rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{language === 'zh' ? '登录中...' : 'Logging in...'}</span>
                </div>
              ) : (
                t.loginButton
              )}
            </Button>

            {/* 服务条款 */}
            <p className="text-xs text-center text-slate-500">
              {t.agreement}{' '}
              <a href="#" className="text-red-600 hover:text-red-700">
                {t.terms}
              </a>
              {t.and}
              <a href="#" className="text-red-600 hover:text-red-700">
                {t.privacy}
              </a>
            </p>
          </form>

          {/* 开发测试：快速登录 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-slate-500 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                {t.quickLogin}
              </p>
              
              {/* 🔥 数据库初始化按钮 */}
              <button
                type="button"
                onClick={() => {
                  console.log('🚀 跳转到数据库初始化页面');
                  navigateTo('init-database');
                }}
                className="w-full mb-4 px-4 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-lg text-sm font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <span>🚀</span>
                <span>{language === 'zh' ? '初始化数据库（首次使用）' : 'Initialize Database (First Time)'}</span>
              </button>
              
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-slate-400 mb-1.5 font-medium flex items-center gap-1">
                    <span>🔐</span>
                    <span>统一登录入口</span>
                  </p>
                  {unifiedAdminAccount ? (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => quickLogin(unifiedAdminAccount.username, unifiedAdminAccount.password)}
                        className="w-full rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white px-3 py-3 text-left text-xs text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
                      >
                        <div className="font-semibold text-slate-800">{unifiedAdminAccount.name}</div>
                        <div className="mt-0.5 text-[10px] text-slate-500">{unifiedAdminAccount.title}</div>
                        <div className="mt-1 text-[10px] text-slate-400">{unifiedAdminAccount.username} · {unifiedAdminAccount.email}</div>
                      </button>
                      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] leading-5 text-amber-700">
                        旧内部账号不再单独登录。统一先用 `admin` 进入，再从右上角 `切换角色` 下拉切换到对应人员身份。
                      </p>
                    </div>
                  ) : (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] leading-5 text-amber-700">
                      未找到 `admin` 主账号，请先在企业主数据中心检查内部账号配置。
                    </p>
                  )}
                  <p className="mt-2 text-[10px] text-slate-400">
                    数据来源：企业主数据中心中的内部账号。人员账号已统一并入右上角“切换角色”下拉框。
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部版权 */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-500">
            © 2024 COSUN Building Materials Co., Ltd. All rights reserved.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -20px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(20px, 20px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
