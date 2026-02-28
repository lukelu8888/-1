import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import { useRouter } from '../contexts/RouterContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { User, Building2, Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';
import { signInWithEmail, fetchProfile } from '../hooks/useSupabaseAuth';

const REMEMBER_CUSTOMER_KEY = 'cosun_remember_customer';
const REMEMBER_SUPPLIER_KEY = 'cosun_remember_supplier';

// 一次性迁移：清除所有旧版 remember 数据（版本号控制，只执行一次）
const MIGRATE_VERSION = 'v3';
function migrateRememberKeys() {
  if (localStorage.getItem('cosun_remember_migrated') === MIGRATE_VERSION) return;
  // 清除旧版共享 key 和可能被旧代码写入测试账号的新 key
  localStorage.removeItem('cosun_remember_user');
  localStorage.removeItem('cosun_remember_customer');
  localStorage.removeItem('cosun_remember_supplier');
  localStorage.removeItem('cosun_remember_admin');
  localStorage.setItem('cosun_remember_migrated', MIGRATE_VERSION);
}

export function Login() {
  const { t } = useLanguage();
  const { setUser } = useUser();
  const { navigateTo } = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  // 初始化：读本 Portal 专属 key，同时清除旧版共享 key
  const [customerData, setCustomerData] = useState(() => {
    migrateRememberKeys();
    const saved = localStorage.getItem(REMEMBER_CUSTOMER_KEY) ?? '';
    return { email: saved, password: '', rememberMe: !!saved };
  });
  const [manufacturerData, setManufacturerData] = useState(() => {
    const saved = localStorage.getItem(REMEMBER_SUPPLIER_KEY) ?? '';
    return { email: saved, password: '', rememberMe: !!saved };
  });

  // NOTE: Admin login is moved to a standalone page (`AdminLogin.tsx`).
  // The old embedded admin tab is kept hidden for now to avoid breaking large JSX chunks.
  const [adminData, setAdminData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  // Legacy helpers for hidden dev-only blocks (do not use in real login flow)
  const authenticateUser = (..._args: any[]) => null as any;
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigateTo('admin-login');
  };
  const handleTestLogin = (_username: string, _password: string) => {
    navigateTo('admin-login');
  };

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = customerData.email.trim();
    if (!email) { toast.error('Please enter your email'); return; }

    try {
      const { session } = await signInWithEmail(email, customerData.password);
      if (!session?.user) throw new Error('Login failed');

      const profile = await fetchProfile(session.user.id);

      if (profile && profile.portal_role !== 'customer') {
        await import('../hooks/useSupabaseAuth').then(m => m.signOut());
        throw new Error(
          profile.portal_role === 'admin'
            ? 'This is an admin account. Please use the Admin Portal.'
            : 'This is a supplier account. Please use the Manufacturer tab.'
        );
      }

      setUser({
        type: 'customer',
        email: session.user.email!,
        id: session.user.id,
        name: profile?.name ?? session.user.email!.split('@')[0],
        region: profile?.region ?? undefined,
      });

      if (customerData.rememberMe) {
        localStorage.setItem(REMEMBER_CUSTOMER_KEY, email);
      } else {
        localStorage.removeItem(REMEMBER_CUSTOMER_KEY);
      }

      toast.success('Login successful');
      navigateTo('dashboard');
    } catch (err: any) {
      const msg = err?.message || '';
      toast.error(
        msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')
          ? 'Invalid email or password'
          : msg || 'Login failed'
      );
    }
  };

  const handleManufacturerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = manufacturerData.email.trim();
    if (!email) { toast.error('Please enter your email'); return; }

    try {
      const { session } = await signInWithEmail(email, manufacturerData.password);
      if (!session?.user) throw new Error('Login failed');

      const profile = await fetchProfile(session.user.id);

      if (profile && profile.portal_role !== 'supplier') {
        await import('../hooks/useSupabaseAuth').then(m => m.signOut());
        throw new Error(
          profile.portal_role === 'admin'
            ? 'This is an admin account. Please use the Admin Portal.'
            : 'This is a customer account. Please use the Customer tab.'
        );
      }

      setUser({
        type: 'supplier',
        email: session.user.email!,
        id: session.user.id,
        name: profile?.name ?? session.user.email!.split('@')[0],
        region: profile?.region ?? undefined,
      });

      if (manufacturerData.rememberMe) {
        localStorage.setItem(REMEMBER_SUPPLIER_KEY, email);
      } else {
        localStorage.removeItem(REMEMBER_SUPPLIER_KEY);
      }

      toast.success('Login successful');
    } catch (err: any) {
      const msg = err?.message || '';
      toast.error(
        msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')
          ? 'Invalid email or password'
          : msg || 'Login failed'
      );
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 py-16 px-4">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-gray-900 mb-4">
            {t.login?.title || 'Welcome Back'}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t.login?.subtitle || 'Sign in to access your account and manage your business operations'}
          </p>
        </div>

        {/* Login Tabs */}
        <div className="max-w-md mx-auto">
          <Tabs defaultValue="customer" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="customer" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t.login?.customerTab || 'Customer'}
              </TabsTrigger>
              <TabsTrigger value="manufacturer" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {t.login?.manufacturerTab || 'Manufacturer'}
              </TabsTrigger>
            </TabsList>

            {/* Customer Login */}
            <TabsContent value="customer">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    {t.login?.customerTitle || 'Customer Login'}
                  </CardTitle>
                  <CardDescription>
                    {t.login?.customerDesc || 'Access your account to view orders, track shipments, and manage purchases'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCustomerLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="customer-email">
                        {t.login?.email || 'Email Address'}
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="customer-email"
                          type="email"
                          placeholder={t.login?.emailPlaceholder || 'your.email@company.com'}
                          className="pl-10"
                          value={customerData.email}
                          onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customer-password">
                        {t.login?.password || 'Password'}
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="customer-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder={t.login?.passwordPlaceholder || 'Enter your password'}
                          className="pl-10 pr-10"
                          value={customerData.password}
                          onChange={(e) => setCustomerData({ ...customerData, password: e.target.value })}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="customer-remember"
                          checked={customerData.rememberMe}
                          onCheckedChange={(checked) => 
                            setCustomerData({ ...customerData, rememberMe: checked as boolean })
                          }
                        />
                        <label
                          htmlFor="customer-remember"
                          className="text-sm text-gray-700 cursor-pointer"
                        >
                          {t.login?.rememberMe || 'Remember me'}
                        </label>
                      </div>
                      <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
                        {t.login?.forgotPassword || 'Forgot password?'}
                      </a>
                    </div>

                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                      {t.login?.signIn || 'Sign In'}
                    </Button>

                    <div className="text-center text-sm text-gray-600">
                      {t.login?.noAccount || "Don't have an account?"}{' '}
                      <button
                        type="button"
                        onClick={() => navigateTo('register')}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {t.login?.signUp || 'Sign up'}
                      </button>
                    </div>
                  </form>

                  {/* Customer test quick-login removed (real login only) */}
                </CardContent>
              </Card>

              {/* Customer Benefits */}
              <div className="mt-8 p-6 bg-blue-50 rounded-lg">
                <h3 className="text-gray-900 mb-4">
                  {t.login?.customerBenefitsTitle || 'Customer Benefits'}
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span>{t.login?.customerBenefit1 || 'Track orders in real-time'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span>{t.login?.customerBenefit2 || 'Access exclusive pricing and discounts'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span>{t.login?.customerBenefit3 || 'View order history and reorder easily'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span>{t.login?.customerBenefit4 || 'Direct communication with support team'}</span>
                  </li>
                </ul>
              </div>
            </TabsContent>

            {/* Manufacturer Login */}
            <TabsContent value="manufacturer">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-orange-600" />
                    {t.login?.manufacturerTitle || 'Manufacturer Login'}
                  </CardTitle>
                  <CardDescription>
                    {t.login?.manufacturerDesc || 'Access your manufacturer portal to manage products, orders, and business operations'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleManufacturerLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="manufacturer-email">
                        {t.login?.email || 'Email Address'}
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="manufacturer-email"
                          type="email"
                          placeholder={t.login?.emailPlaceholder || 'manufacturer@company.com'}
                          className="pl-10"
                          value={manufacturerData.email}
                          onChange={(e) => setManufacturerData({ ...manufacturerData, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="manufacturer-password">
                        {t.login?.password || 'Password'}
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="manufacturer-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder={t.login?.passwordPlaceholder || 'Enter your password'}
                          className="pl-10 pr-10"
                          value={manufacturerData.password}
                          onChange={(e) => setManufacturerData({ ...manufacturerData, password: e.target.value })}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="manufacturer-remember"
                          checked={manufacturerData.rememberMe}
                          onCheckedChange={(checked) => 
                            setManufacturerData({ ...manufacturerData, rememberMe: checked as boolean })
                          }
                        />
                        <label
                          htmlFor="manufacturer-remember"
                          className="text-sm text-gray-700 cursor-pointer"
                        >
                          {t.login?.rememberMe || 'Remember me'}
                        </label>
                      </div>
                      <a href="#" className="text-sm text-orange-600 hover:text-orange-700">
                        {t.login?.forgotPassword || 'Forgot password?'}
                      </a>
                    </div>

                    <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
                      {t.login?.signIn || 'Sign In'}
                    </Button>

                    <div className="text-center text-sm text-gray-600">
                      {t.login?.noAccount || "Don't have an account?"}{' '}
                      <a href="#" className="text-orange-600 hover:text-orange-700 font-medium">
                        {t.login?.applyNow || 'Apply now'}
                      </a>
                    </div>
                  </form>

                  {false && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="mb-4">
                      <p className="text-xs text-orange-600 flex items-center gap-2 font-medium">
                        <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                        Quick Login (Development Test)
                      </p>
                    </div>
                    
                    {/* 🏭 供应商账号 */}
                    <div>
                      <p className="text-[10px] text-gray-500 mb-2 font-medium">🏭 Supplier Portal - Test Accounts</p>
                      <div className="space-y-2">
                        {/* 真实供应商账户 - A级 */}
                        <button
                          type="button"
                          onClick={() => {
                            const username = 'zhang';
                            const password = 'Cosun123!';
                            const user = authenticateUser(username, password);
                            
                            if (user && user.role === 'supplier') {
                              saveSession(user);
                              setUser({ type: 'supplier', email: user.email });
                              toast.success(`Welcome back, ${user.company}!`);
                              navigateTo('manufacturer');
                            } else {
                              toast.error('Invalid credentials');
                            }
                          }}
                          className="w-full px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs transition-colors border border-blue-200 font-medium text-left"
                        >
                          <div className="flex items-center justify-between">
                            <span>🏭 东莞市华盛电器</span>
                            <span className="text-[10px] text-blue-600 font-semibold">A级</span>
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1">电气设备 • 128订单</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">zhang / Cosun123!</div>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            const username = 'li';
                            const password = 'Cosun123!';
                            const user = authenticateUser(username, password);
                            
                            if (user && user.role === 'supplier') {
                              saveSession(user);
                              setUser({ type: 'supplier', email: user.email });
                              toast.success(`Welcome back, ${user.company}!`);
                              navigateTo('manufacturer');
                            } else {
                              toast.error('Invalid credentials');
                            }
                          }}
                          className="w-full px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs transition-colors border border-blue-200 font-medium text-left"
                        >
                          <div className="flex items-center justify-between">
                            <span>🏭 佛山市鑫达卫浴</span>
                            <span className="text-[10px] text-blue-600 font-semibold">A级</span>
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1">卫浴产品 • 96订单</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">li / Cosun123!</div>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            const username = 'chen';
                            const password = 'Cosun123!';
                            const user = authenticateUser(username, password);
                            
                            if (user && user.role === 'supplier') {
                              saveSession(user);
                              setUser({ type: 'supplier', email: user.email });
                              toast.success(`Welcome back, ${user.company}!`);
                              navigateTo('manufacturer');
                            } else {
                              toast.error('Invalid credentials');
                            }
                          }}
                          className="w-full px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs transition-colors border border-blue-200 font-medium text-left"
                        >
                          <div className="flex items-center justify-between">
                            <span>🏭 上海明辉建材</span>
                            <span className="text-[10px] text-blue-600 font-semibold">A级</span>
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1">建筑材料 • 156订单</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">chen / Cosun123!</div>
                        </button>
                        
                        {/* 真实供应商账户 - B级 */}
                        <button
                          type="button"
                          onClick={() => {
                            const username = 'wang';
                            const password = 'Cosun123!';
                            const user = authenticateUser(username, password);
                            
                            if (user && user.role === 'supplier') {
                              saveSession(user);
                              setUser({ type: 'supplier', email: user.email });
                              toast.success(`Welcome back, ${user.company}!`);
                              navigateTo('manufacturer');
                            } else {
                              toast.error('Invalid credentials');
                            }
                          }}
                          className="w-full px-3 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs transition-colors border border-amber-200 font-medium text-left"
                        >
                          <div className="flex items-center justify-between">
                            <span>🏭 温州精工五金</span>
                            <span className="text-[10px] text-amber-600 font-semibold">B级</span>
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1">门窗配件 • 64订单</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">wang / Cosun123!</div>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            const username = 'zhao';
                            const password = 'Cosun123!';
                            const user = authenticateUser(username, password);
                            
                            if (user && user.role === 'supplier') {
                              saveSession(user);
                              setUser({ type: 'supplier', email: user.email });
                              toast.success(`Welcome back, ${user.company}!`);
                              navigateTo('manufacturer');
                            } else {
                              toast.error('Invalid credentials');
                            }
                          }}
                          className="w-full px-3 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs transition-colors border border-amber-200 font-medium text-left"
                        >
                          <div className="flex items-center justify-between">
                            <span>🏭 济南安全劳保</span>
                            <span className="text-[10px] text-amber-600 font-semibold">B级</span>
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1">劳保用品 • 45订单</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">zhao / Cosun123!</div>
                        </button>
                        
                        {/* 真实供应商账户 - C级 */}
                        <button
                          type="button"
                          onClick={() => {
                            const username = 'liu';
                            const password = 'Cosun123!';
                            const user = authenticateUser(username, password);
                            
                            if (user && user.role === 'supplier') {
                              saveSession(user);
                              setUser({ type: 'supplier', email: user.email });
                              toast.success(`Welcome back, ${user.company}!`);
                              navigateTo('manufacturer');
                            } else {
                              toast.error('Invalid credentials');
                            }
                          }}
                          className="w-full px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs transition-colors border border-gray-200 font-medium text-left"
                        >
                          <div className="flex items-center justify-between">
                            <span>🏭 宁波创新电器</span>
                            <span className="text-[10px] text-gray-600 font-semibold">C级</span>
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1">电气设备 • 18订单</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">liu / Cosun123!</div>
                        </button>
                        
                        {/* 🔥 新增询价供应商 */}
                        <button type="button" onClick={() => { const user = authenticateUser('supplier_b', 'Cosun123!'); if (user && user.role === 'supplier') { saveSession(user); setUser({ type: 'supplier', email: user.email }); toast.success(`Welcome, ${user.company}!`); navigateTo('manufacturer'); } }} className="w-full px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs transition-colors border border-gray-200 font-medium text-left"><div className="flex items-center justify-between"><span>🏭 广州优质五金</span><span className="text-[10px] text-orange-600 font-semibold">新</span></div><div className="text-[10px] text-gray-500 mt-1">五金配件 • 已收到询价</div><div className="text-[10px] text-gray-500 mt-0.5">supplier_b / Cosun123!</div></button>
                        
                        <button type="button" onClick={() => { const user = authenticateUser('supplier_c', 'Cosun123!'); if (user && user.role === 'supplier') { saveSession(user); setUser({ type: 'supplier', email: user.email }); toast.success(`Welcome, ${user.company}!`); navigateTo('manufacturer'); } }} className="w-full px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs transition-colors border border-gray-200 font-medium text-left"><div className="flex items-center justify-between"><span>🏭 东莞精工卫浴</span><span className="text-[10px] text-orange-600 font-semibold">新</span></div><div className="text-[10px] text-gray-500 mt-1">卫浴产品 • 已收到询价</div><div className="text-[10px] text-gray-500 mt-0.5">supplier_c / Cosun123!</div></button>
                        
                        <button type="button" onClick={() => { const user = authenticateUser('supplier_d', 'Cosun123!'); if (user && user.role === 'supplier') { saveSession(user); setUser({ type: 'supplier', email: user.email }); toast.success(`Welcome, ${user.company}!`); navigateTo('manufacturer'); } }} className="w-full px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs transition-colors border border-gray-200 font-medium text-left"><div className="flex items-center justify-between"><span>🏭 佛山安全劳保</span><span className="text-[10px] text-orange-600 font-semibold">新</span></div><div className="text-[10px] text-gray-500 mt-1">劳保用品 • 已收到询价</div><div className="text-[10px] text-gray-500 mt-0.5">supplier_d / Cosun123!</div></button>
                        
                        <button type="button" onClick={() => { const user = authenticateUser('supplier_e', 'Cosun123!'); if (user && user.role === 'supplier') { saveSession(user); setUser({ type: 'supplier', email: user.email }); toast.success(`Welcome, ${user.company}!`); navigateTo('manufacturer'); } }} className="w-full px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs transition-colors border border-gray-200 font-medium text-left"><div className="flex items-center justify-between"><span>🏭 中山照明电器</span><span className="text-[10px] text-orange-600 font-semibold">新</span></div><div className="text-[10px] text-gray-500 mt-1">LED照明 • 已收到询价</div><div className="text-[10px] text-gray-500 mt-0.5">supplier_e / Cosun123!</div></button>
                        
                        <button type="button" onClick={() => { const user = authenticateUser('supplier_f', 'Cosun123!'); if (user && user.role === 'supplier') { saveSession(user); setUser({ type: 'supplier', email: user.email }); toast.success(`Welcome, ${user.company}!`); navigateTo('manufacturer'); } }} className="w-full px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs transition-colors border border-gray-200 font-medium text-left"><div className="flex items-center justify-between"><span>🏭 温州五金配件</span><span className="text-[10px] text-orange-600 font-semibold">新</span></div><div className="text-[10px] text-gray-500 mt-1">五金建材 • 已收到询价</div><div className="text-[10px] text-gray-500 mt-0.5">supplier_f / Cosun123!</div></button>
                        
                        <button type="button" onClick={() => { const user = authenticateUser('supplier_g', 'Cosun123!'); if (user && user.role === 'supplier') { saveSession(user); setUser({ type: 'supplier', email: user.email }); toast.success(`Welcome, ${user.company}!`); navigateTo('manufacturer'); } }} className="w-full px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs transition-colors border border-gray-200 font-medium text-left"><div className="flex items-center justify-between"><span>🏭 宁波电气设备</span><span className="text-[10px] text-orange-600 font-semibold">新</span></div><div className="text-[10px] text-gray-500 mt-1">开关插座 • 已收到询价</div><div className="text-[10px] text-gray-500 mt-0.5">supplier_g / Cosun123!</div></button>
                        
                        <button type="button" onClick={() => { const user = authenticateUser('supplier_h', 'Cosun123!'); if (user && user.role === 'supplier') { saveSession(user); setUser({ type: 'supplier', email: user.email }); toast.success(`Welcome, ${user.company}!`); navigateTo('manufacturer'); } }} className="w-full px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs transition-colors border border-gray-200 font-medium text-left"><div className="flex items-center justify-between"><span>🏭 杭州智能家居</span><span className="text-[10px] text-orange-600 font-semibold">新</span></div><div className="text-[10px] text-gray-500 mt-1">智能设备 • 已收到询价</div><div className="text-[10px] text-gray-500 mt-0.5">supplier_h / Cosun123!</div></button>
                      </div>
                    </div>
                  </div>
                  )}
                </CardContent>
              </Card>

              {/* Manufacturer Benefits */}
              <div className="mt-8 p-6 bg-orange-50 rounded-lg">
                <h3 className="text-gray-900 mb-4">
                  {t.login?.manufacturerBenefitsTitle || 'Manufacturer Benefits'}
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">✓</span>
                    <span>{t.login?.manufacturerBenefit1 || 'Manage product catalog and inventory'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">✓</span>
                    <span>{t.login?.manufacturerBenefit2 || 'Access to large customer base'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">✓</span>
                    <span>{t.login?.manufacturerBenefit3 || 'Real-time order management and fulfillment'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">✓</span>
                    <span>{t.login?.manufacturerBenefit4 || 'Analytics and business insights'}</span>
                  </li>
                </ul>
              </div>
            </TabsContent>

            {false && (
            <TabsContent value="admin">
              <Card className="border-2 border-red-200">
                <CardHeader className="bg-red-50">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    COSUN Admin Portal
                  </CardTitle>
                  <CardDescription>
                    Access the COSUN administrative dashboard to manage the entire platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-email">
                        Admin Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="admin-email"
                          type="email"
                          placeholder="admin@cosun.com"
                          className="pl-10"
                          value={adminData.email}
                          onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admin-password">
                        Admin Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="admin-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter admin password"
                          className="pl-10 pr-10"
                          value={adminData.password}
                          onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="admin-remember"
                          checked={adminData.rememberMe}
                          onCheckedChange={(checked) => 
                            setAdminData({ ...adminData, rememberMe: checked as boolean })
                          }
                        />
                        <label
                          htmlFor="admin-remember"
                          className="text-sm text-gray-700 cursor-pointer"
                        >
                          Remember me
                        </label>
                      </div>
                      <a href="#" className="text-sm text-red-600 hover:text-red-700">
                        Need access?
                      </a>
                    </div>

                    <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                      <Shield className="w-4 h-4 mr-2" />
                      Sign In to Admin Portal
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* 🔥 Quick Login Test Accounts */}
              <Card className="mt-6 bg-gradient-to-br from-gray-50 to-white border-2 border-dashed border-gray-300">
                <CardContent className="pt-6">
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Quick Login (Development Test)
                    </p>
                  </div>
                  
                  {/* 🔧 系统管理员 - 移到最上面 */}
                  <div className="mb-3">
                    <p className="text-[10px] text-gray-500 mb-2 font-medium">🔧 System Administrator</p>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        onClick={() => handleTestLogin('admin', 'admin123')}
                        className="w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs transition-colors border border-slate-200 font-medium"
                      >
                        🔧 System Admin
                      </button>
                    </div>
                  </div>

                  {/* 📱 Marketing - 单独一行 */}
                  <div className="mb-3">
                    <p className="text-[10px] text-gray-500 mb-2 font-medium">📱 Marketing</p>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        onClick={() => handleTestLogin('marketing', 'cosun2024')}
                        className="w-full px-3 py-2.5 bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700 rounded-lg text-xs transition-colors border border-fuchsia-200 font-medium"
                      >
                        📱 Marketing
                      </button>
                    </div>
                  </div>
                  
                  {/* 🏢 Executive Team */}
                  <div className="mb-4">
                    <p className="text-[10px] text-gray-400 mb-2 font-medium">🏢 Executive Team</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleTestLogin('ceo', 'cosun2024')}
                        className="px-3 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs transition-colors border border-purple-200 font-medium"
                      >
                        👨‍💼 CEO
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTestLogin('cfo', 'cosun2024')}
                        className="px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs transition-colors border border-blue-200 font-medium"
                      >
                        💼 CFO
                      </button>
                    </div>
                  </div>
                  
                  {/* 📊 销售团队 */}
                  <div className="mb-3">
                    <p className="text-[10px] text-gray-500 mb-2 font-medium">📊 Sales Team</p>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        onClick={() => handleTestLogin('sales.director', 'cosun2024')}
                        className="w-full px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs transition-colors border border-blue-200 font-medium"
                      >
                        📊 Sales Director
                      </button>
                    </div>
                  </div>

                  {/* 🎯 运营人员 - 只保留Finance和Procurement */}
                  <div className="mb-3">
                    <p className="text-[10px] text-gray-500 mb-2 font-medium">🎯 Operations Team</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleTestLogin('finance', 'cosun2024')}
                        className="w-full px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs transition-colors border border-emerald-200 font-medium"
                      >
                        💰 Finance
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTestLogin('procurement', 'cosun2024')}
                        className="w-full px-3 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs transition-colors border border-indigo-200 font-medium"
                      >
                        🛒 Procurement
                      </button>
                    </div>
                  </div>

                  {/* 🌐 区域主管 */}
                  <div className="mb-4">
                    <p className="text-[10px] text-gray-400 mb-2 font-medium">🌎 Regional Managers</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleTestLogin('john.smith', 'cosun2024')}
                        className="px-2 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] transition-colors border border-rose-200 font-medium leading-tight"
                      >
                        🇺🇸 NA
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTestLogin('carlos.silva', 'cosun2024')}
                        className="px-2 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-[10px] transition-colors border border-amber-200 font-medium leading-tight"
                      >
                        🇧🇷 SA
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTestLogin('hans.mueller', 'cosun2024')}
                        className="px-2 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-[10px] transition-colors border border-sky-200 font-medium leading-tight"
                      >
                        🇪🇺 EMEA
                      </button>
                    </div>
                  </div>
                  
                  {/* 👔 Sales Representatives */}
                  <div>
                    <p className="text-[10px] text-gray-400 mb-2 font-medium">👔 Sales Representatives</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleTestLogin('zhangwei', 'cosun123')}
                        className="px-2 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-[10px] transition-colors border border-orange-200 font-medium leading-tight"
                      >
                        👨‍💼 张伟
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTestLogin('lifang', 'cosun2024')}
                        className="px-2 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-[10px] transition-colors border border-teal-200 font-medium leading-tight"
                      >
                        👩‍💼 李芳
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTestLogin('wangfang', 'cosun2024')}
                        className="px-2 py-2 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-lg text-[10px] transition-colors border border-pink-200 font-medium leading-tight"
                      >
                        👩‍💼 王芳
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Portal Features */}
              <div className="mt-8 p-6 bg-red-50 rounded-lg border border-red-200">
                <h3 className="text-gray-900 mb-4">
                  Admin Portal Features
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">✓</span>
                    <span>Complete customer and manufacturer management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">✓</span>
                    <span>Inquiry and quotation system control</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">✓</span>
                    <span>Order tracking and fulfillment oversight</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">✓</span>
                    <span>Advanced analytics and business insights</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">✓</span>
                    <span>Product management and push notifications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">✓</span>
                    <span>Internal messaging and communication center</span>
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-white rounded border border-red-200">
                  <p className="text-xs text-gray-600">
                    <strong className="text-red-600">Security Notice:</strong> This portal is restricted to authorized COSUN staff only. All access is monitored and logged.
                  </p>
                </div>
              </div>
            </TabsContent>
            )}

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => navigateTo('admin-login')}
                className="text-xs text-gray-500 hover:text-red-600 underline underline-offset-4"
              >
                Internal staff? Go to Admin Login
              </button>
            </div>
          </Tabs>
        </div>

        {/* Security Notice */}
        <div className="mt-12 text-center text-sm text-gray-500 max-w-2xl mx-auto">
          <p>
            {t.login?.securityNotice || 'Your information is protected with industry-standard encryption. We never share your data with third parties.'}
          </p>
        </div>
      </div>
    </section>
  );
}