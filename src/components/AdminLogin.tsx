import React, { useState } from 'react';
import { Building2, Eye, EyeOff, Globe, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { useUser } from '../contexts/UserContext';
import { useRouter } from '../contexts/RouterContext';
import { signInWithEmail, fetchProfile } from '../hooks/useSupabaseAuth';

export default function AdminLogin() {
  const { setUser } = useUser();
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

  // 将用户名/短名映射为邮箱（开发快捷登录用）
  const USERNAME_MAP: Record<string, string> = {
    admin: 'admin@cosun.com',
    ceo: 'ceo@cosun.com',
    cfo: 'cfo@cosun.com',
    'sales.director': 'sales.director@cosun.com',
    'john.smith': 'john.smith@cosun.com',
    'carlos.silva': 'carlos.silva@cosun.com',
    'hans.mueller': 'hans.mueller@cosun.com',
    zhangwei: 'zhangwei@cosun.com',
    lifang: 'lifang@cosun.com',
    wangfang: 'wangfang@cosun.com',
    finance: 'finance@cosun.com',
    procurement: 'procurement@cosun.com',
    marketing: 'marketing@cosun.com',
    supplier: 'gd.supplier@test.com',
  };

  const resolveEmail = (input: string): string => {
    const trimmed = input.trim().toLowerCase();
    if (trimmed.includes('@')) return trimmed;
    return USERNAME_MAP[trimmed] ?? trimmed;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const email = resolveEmail(username);
    if (!email) {
      setError(language === 'zh' ? '请输入有效的用户名或邮箱' : 'Please enter a valid username or email');
      setIsLoading(false);
      return;
    }

    try {
      // Supabase Auth 登录
      const { session } = await signInWithEmail(email, password);
      if (!session?.user) throw new Error('登录失败，请重试');

      // 获取用户 profile（portal_role / rbac_role / region）
      const profile = await fetchProfile(session.user.id);

      // 仅允许 admin portal_role 登录此页面
      if (profile && profile.portal_role !== 'admin') {
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

      // 触发 userChanged 让 RBAC 系统同步
      const rbacUser = {
        id: session.user.id,
        email: session.user.email!,
        name: profile?.name ?? session.user.email!.split('@')[0],
        role: profile?.rbac_role ?? 'Admin',
        region: profile?.region ?? 'all',
      };
      localStorage.setItem('cosun_current_user', JSON.stringify(rbacUser));
      window.dispatchEvent(new CustomEvent('userChanged', { detail: rbacUser }));

    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
        setError(language === 'zh' ? '邮箱或密码错误' : 'Invalid email or password');
      } else {
        setError(msg || (language === 'zh' ? '登录失败，请重试' : 'Login failed, please try again'));
      }
    }

    setIsLoading(false);
  };

  // 快速登录（开发模式）：直接用传入的账密，绕过 state 异步问题
  const quickLogin = async (email: string, pass: string) => {
    setUsername(email);
    setPassword(pass);
    setError('');
    setIsLoading(true);
    try {
      const { signInWithEmail: signIn, fetchProfile: getProfile } = await import('../hooks/useSupabaseAuth');
      const { session } = await signIn(email, pass);
      if (!session?.user) throw new Error('登录失败，请重试');
      const profile = await getProfile(session.user.id);
      if (profile && profile.portal_role !== 'admin') {
        const { signOut } = await import('../hooks/useSupabaseAuth');
        await signOut();
        throw new Error('此账号无管理员权限');
      }
      const { setUser } = await import('../contexts/UserContext').then(m => ({ setUser: null }));
      // UserContext via onAuthStateChange will handle state update
      // Force navigate to admin dashboard
      const rbacUser = {
        id: session.user.id,
        email: session.user.email!,
        name: profile?.name ?? session.user.email!.split('@')[0],
        role: profile?.rbac_role ?? 'Admin',
        region: profile?.region ?? 'all',
      };
      localStorage.setItem('cosun_current_user', JSON.stringify(rbacUser));
      window.dispatchEvent(new CustomEvent('userChanged', { detail: rbacUser }));
    } catch (err: any) {
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
              
              {/* 核心角色快速登录 */}
              <div className="space-y-3">
                {/* 🏢 最高层级 */}
                <div>
                  <p className="text-[10px] text-slate-400 mb-1.5 font-medium flex items-center gap-1">
                    <span>👑</span>
                    <span>最高层级</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => quickLogin('ceo', 'Cosun2024!')}
                      className="px-3 py-2.5 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-700 rounded-lg text-xs transition-all border border-purple-200 font-semibold shadow-sm hover:shadow"
                    >
                      👨‍💼 CEO
                    </button>
                    <button
                      type="button"
                      onClick={() => quickLogin('cfo', 'Cosun2024!')}
                      className="px-3 py-2.5 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 rounded-lg text-xs transition-all border border-blue-200 font-semibold shadow-sm hover:shadow"
                    >
                      💼 CFO
                    </button>
                  </div>
                </div>
                
                {/* 📊 销售团队 */}
                <div>
                  <p className="text-[10px] text-slate-400 mb-1.5 font-medium flex items-center gap-1">
                    <span>📊</span>
                    <span>销售团队</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => quickLogin('sales.director', 'Cosun2024!')}
                    className="w-full px-3 py-2.5 bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 text-indigo-700 rounded-lg text-xs transition-all border border-indigo-200 font-semibold shadow-sm hover:shadow"
                  >
                    📊 销售总监
                  </button>
                </div>
                
                {/* 🌎 区域主管（3个区域） */}
                <div>
                  <p className="text-[10px] text-slate-400 mb-1.5 font-medium flex items-center gap-1">
                    <span>🌍</span>
                    <span>区域主管</span>
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => quickLogin('john.smith', 'Cosun2024!')}
                      className="px-2 py-2 bg-gradient-to-br from-rose-50 to-rose-100 hover:from-rose-100 hover:to-rose-200 text-rose-700 rounded-lg text-[10px] transition-all border border-rose-200 font-semibold leading-tight shadow-sm hover:shadow"
                    >
                      🇺🇸 北美
                    </button>
                    <button
                      type="button"
                      onClick={() => quickLogin('carlos.silva', 'Cosun2024!')}
                      className="px-2 py-2 bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 text-amber-700 rounded-lg text-[10px] transition-all border border-amber-200 font-semibold leading-tight shadow-sm hover:shadow"
                    >
                      🇧🇷 南美
                    </button>
                    <button
                      type="button"
                      onClick={() => quickLogin('hans.mueller', 'Cosun2024!')}
                      className="px-2 py-2 bg-gradient-to-br from-sky-50 to-sky-100 hover:from-sky-100 hover:to-sky-200 text-sky-700 rounded-lg text-[10px] transition-all border border-sky-200 font-semibold leading-tight shadow-sm hover:shadow"
                    >
                      🇪🇺 欧非
                    </button>
                  </div>
                </div>
                
                {/* 👔 区域业务员（3个区域） */}
                <div>
                  <p className="text-[10px] text-slate-400 mb-1.5 font-medium flex items-center gap-1">
                    <span>👔</span>
                    <span>区域业务员</span>
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => quickLogin('zhangwei', 'Cosun2024!')}
                      className="px-2 py-2 bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 text-orange-700 rounded-lg text-[10px] transition-all border border-orange-200 font-semibold leading-tight shadow-sm hover:shadow"
                    >
                      👨‍💼 张伟
                    </button>
                    <button
                      type="button"
                      onClick={() => quickLogin('lifang', 'Cosun2024!')}
                      className="px-2 py-2 bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 text-yellow-700 rounded-lg text-[10px] transition-all border border-yellow-200 font-semibold leading-tight shadow-sm hover:shadow"
                    >
                      👩 李芳
                    </button>
                    <button
                      type="button"
                      onClick={() => quickLogin('wangfang', 'Cosun2024!')}
                      className="px-2 py-2 bg-gradient-to-br from-teal-50 to-teal-100 hover:from-teal-100 hover:to-teal-200 text-teal-700 rounded-lg text-[10px] transition-all border border-teal-200 font-semibold leading-tight shadow-sm hover:shadow"
                    >
                      👩‍💻 王芳
                    </button>
                  </div>
                </div>
                
                {/* 💼 职能部门 */}
                <div>
                  <p className="text-[10px] text-slate-400 mb-1.5 font-medium flex items-center gap-1">
                    <span>💼</span>
                    <span>职能部门</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => quickLogin('finance', 'Cosun2024!')}
                      className="px-3 py-2.5 bg-gradient-to-br from-cyan-50 to-cyan-100 hover:from-cyan-100 hover:to-cyan-200 text-cyan-700 rounded-lg text-xs transition-all border border-cyan-200 font-semibold shadow-sm hover:shadow"
                    >
                      💰 财务
                    </button>
                    <button
                      type="button"
                      onClick={() => quickLogin('procurement', 'Cosun2024!')}
                      className="px-3 py-2.5 bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 text-emerald-700 rounded-lg text-xs transition-all border border-emerald-200 font-semibold shadow-sm hover:shadow"
                    >
                      🛒 采购
                    </button>
                  </div>
                </div>
                
                {/* 🔧 系统管理 */}
                <div>
                  <p className="text-[10px] text-slate-400 mb-1.5 font-medium flex items-center gap-1">
                    <span>🔧</span>
                    <span>系统管理</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => quickLogin('admin', 'Cosun2024!')}
                      className="px-3 py-2.5 bg-gradient-to-br from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 text-slate-700 rounded-lg text-xs transition-all border border-slate-200 font-semibold shadow-sm hover:shadow"
                    >
                      🛠️ 系统管理员
                    </button>
                    <button
                      type="button"
                      onClick={() => quickLogin('marketing', 'Cosun2024!')}
                      className="px-3 py-2.5 bg-gradient-to-br from-pink-50 to-pink-100 hover:from-pink-100 hover:to-pink-200 text-pink-700 rounded-lg text-xs transition-all border border-pink-200 font-semibold shadow-sm hover:shadow"
                    >
                      📱 运营专员
                    </button>
                  </div>
                </div>
                
                {/* 🏭 供应商（测试用） */}
                <div>
                  <p className="text-[10px] text-slate-400 mb-1.5 font-medium flex items-center gap-1">
                    <span>🏭</span>
                    <span>供应商测试</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => quickLogin('supplier', 'Supplier123!')}
                    className="w-full px-3 py-2.5 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-700 rounded-lg text-xs transition-all border border-green-200 font-semibold shadow-sm hover:shadow"
                  >
                    🏭 张涛 - 供应商
                  </button>
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