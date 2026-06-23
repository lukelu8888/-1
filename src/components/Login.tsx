import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useOptionalUser } from '../contexts/UserContext';
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
import { upsertPortalPasswordMirror } from '../lib/portalPasswordMirror';
import { supabase, supabaseAnonKey, supabaseUrl } from '../lib/supabase';
import { getProtectedAdminLoginPage } from '../config/adminPortalPolicy';
import { isCurrentLocalDevHost } from '../lib/localDevHost';

const REMEMBER_CUSTOMER_KEY = 'cosun_remember_customer';
const REMEMBER_SUPPLIER_KEY = 'cosun_remember_supplier';

function promiseWithTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    }),
  ]);
}

function normalizeErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    const candidate = (error as any).message || (error as any).error_description || (error as any).error || (error as any).msg;
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
    try {
      return JSON.stringify(error);
    } catch {
      return 'Login failed';
    }
  }
  return 'Login failed';
}

function shouldUseSupabaseProxy() {
  return isCurrentLocalDevHost();
}

function getSupabaseRestBase() {
  return shouldUseSupabaseProxy() ? '/__supabase_rest__' : `${supabaseUrl}/rest/v1`;
}

async function fetchRestRows<T>(path: string, accessToken: string, timeoutMs = 3000): Promise<T[]> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${getSupabaseRestBase()}${path}`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`REST fetch failed with status ${response.status}`);
    }

    const payload = await response.json().catch(() => []);
    return Array.isArray(payload) ? payload as T[] : [];
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('REST fetch timed out');
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function readCachedProfile(email: string) {
  try {
    const backendUserRaw = localStorage.getItem('cosun_backend_user');
    if (!backendUserRaw) return null;
    const backendUser = JSON.parse(backendUserRaw);
    if (String(backendUser?.email || '').toLowerCase() !== email.toLowerCase()) return null;
    return {
      id: backendUser.id as string | undefined,
      email: backendUser.email as string,
      name: backendUser.username as string | undefined,
      portal_role: backendUser.portal_role as 'admin' | 'customer' | 'supplier' | undefined,
      rbac_role: backendUser.rbac_role as string | null | undefined,
      region: backendUser.region as string | null | undefined,
    };
  } catch {
    return null;
  }
}

function normalizePortalRole(value: unknown): 'customer' | 'supplier' | 'admin' | null {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'customer' || normalized === 'supplier' || normalized === 'admin') return normalized;
  if (normalized === 'staff') return 'admin';
  return null;
}

async function lookupPortalRoleByPortalProfiles(userId: string, email: string, accessToken?: string) {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  const trySupplierByRest = async () => {
    if (!accessToken || !userId) return null;
    const rows = await fetchRestRows<{ portal_role?: string | null }>(
      `/supplier_portal_profiles?select=portal_role&auth_user_id=eq.${encodeURIComponent(userId)}`,
      accessToken,
    );
    return normalizePortalRole(rows[0]?.portal_role);
  };

  const trySupplierByEmailRest = async () => {
    if (!accessToken || !normalizedEmail) return null;
    const rows = await fetchRestRows<{ portal_role?: string | null }>(
      `/supplier_portal_profiles?select=portal_role&login_email=eq.${encodeURIComponent(normalizedEmail)}`,
      accessToken,
    );
    return normalizePortalRole(rows[0]?.portal_role) ?? (rows.length > 0 ? 'supplier' : null);
  };

  const tryCustomerByRest = async () => {
    if (!accessToken || !userId) return null;
    const rows = await fetchRestRows<{ portal_role?: string | null }>(
      `/customer_portal_profiles?select=portal_role&auth_user_id=eq.${encodeURIComponent(userId)}`,
      accessToken,
    );
    return normalizePortalRole(rows[0]?.portal_role);
  };

  const tryCustomerByEmailRest = async () => {
    if (!accessToken || !normalizedEmail) return null;
    const rows = await fetchRestRows<{ portal_role?: string | null }>(
      `/customer_portal_profiles?select=portal_role&login_email=eq.${encodeURIComponent(normalizedEmail)}`,
      accessToken,
    );
    return normalizePortalRole(rows[0]?.portal_role) ?? (rows.length > 0 ? 'customer' : null);
  };

  const trySupplierByAuthUser = async () => {
    const { data, error } = await supabase
      .from('supplier_portal_profiles')
      .select('portal_role')
      .eq('auth_user_id', userId)
      .maybeSingle();
    if (!error) return normalizePortalRole(data?.portal_role);
    return null;
  };

  const trySupplierByEmail = async () => {
    if (!normalizedEmail) return null;
    const { data, error } = await supabase
      .from('supplier_portal_profiles')
      .select('portal_role')
      .eq('login_email', normalizedEmail)
      .maybeSingle();
    if (!error) return normalizePortalRole(data?.portal_role) ?? 'supplier';
    return null;
  };

  const tryCustomerByAuthUser = async () => {
    const { data, error } = await supabase
      .from('customer_portal_profiles')
      .select('portal_role')
      .eq('auth_user_id', userId)
      .maybeSingle();
    if (!error) return normalizePortalRole(data?.portal_role);
    return null;
  };

  const tryCustomerByEmail = async () => {
    if (!normalizedEmail) return null;
    const { data, error } = await supabase
      .from('customer_portal_profiles')
      .select('portal_role')
      .eq('login_email', normalizedEmail)
      .maybeSingle();
    if (!error) return normalizePortalRole(data?.portal_role) ?? 'customer';
    return null;
  };

  return (
    await trySupplierByRest()
    || await trySupplierByEmailRest()
    || await tryCustomerByRest()
    || await tryCustomerByEmailRest()
    || await trySupplierByAuthUser()
    || await trySupplierByEmail()
    || await tryCustomerByAuthUser()
    || await tryCustomerByEmail()
    || null
  );
}

async function resolvePortalRoleForSession(params: {
  sessionUser: any;
  profile: { portal_role?: string | null } | null;
  fallbackEmail: string;
  accessToken?: string;
}) {
  const profilePortalRole = normalizePortalRole(params.profile?.portal_role);
  if (profilePortalRole) return profilePortalRole;

  const metadataPortalRole =
    normalizePortalRole(params.sessionUser?.user_metadata?.portal_role)
    || normalizePortalRole(params.sessionUser?.app_metadata?.portal_role);
  if (metadataPortalRole) return metadataPortalRole;

  const cachedPortalRole = normalizePortalRole(readCachedProfile(params.fallbackEmail)?.portal_role);
  if (cachedPortalRole) return cachedPortalRole;

  return lookupPortalRoleByPortalProfiles(params.sessionUser?.id || '', params.fallbackEmail, params.accessToken);
}

function persistFallbackAuthState(params: {
  id: string;
  email: string;
  name: string;
  portalRole: 'customer' | 'supplier' | 'admin';
  rbacRole?: string | null;
  region?: string | null;
}) {
  const authUser = {
    id: params.id,
    email: params.email,
    name: params.name,
    type: params.portalRole,
    role: params.rbacRole ?? params.portalRole,
    userRole: params.rbacRole ?? params.portalRole,
    region: params.region ?? undefined,
  };

  localStorage.setItem('cosun_auth_user', JSON.stringify(authUser));
  localStorage.setItem('cosun_backend_user', JSON.stringify({
    id: params.id,
    email: params.email,
    username: params.name,
    portal_role: params.portalRole,
    rbac_role: params.rbacRole ?? null,
    region: params.region ?? null,
  }));

  if (params.portalRole === 'admin') {
    localStorage.setItem('cosun_current_user', JSON.stringify({
      id: params.id,
      email: params.email,
      name: params.name,
      role: params.rbacRole ?? 'Admin',
      region: params.region ?? 'all',
      type: 'admin',
    }));
  } else {
    localStorage.removeItem('cosun_current_user');
  }
}

function completeLoginNavigation(
  navigateTo: (page: string) => void,
  portalRole: 'customer' | 'supplier' | 'admin'
) {
  const targetPage = portalRole === 'supplier'
    ? 'supplier'
    : portalRole === 'admin'
      ? 'admin-login'
      : 'dashboard';

  navigateTo(targetPage);
  window.dispatchEvent(new CustomEvent('userChanged'));

  const targetHash = `#/${targetPage}`;
  if (window.location.hash !== targetHash) {
    window.location.hash = targetHash;
  }

  // In local dev we occasionally see the in-page auth/session transition stall
  // after a successful external-portal login. Reloading after we have already
  // persisted the resolved portal identity makes the redirect deterministic.
  if (portalRole === 'customer' || portalRole === 'supplier') {
    window.setTimeout(() => {
      window.location.reload();
    }, 60);
  }
}

async function resolveProfileWithFallback(
  userId: string,
  email: string,
  portalRole: 'customer' | 'supplier' | 'admin',
  accessToken?: string,
) {
  const cachedProfile = readCachedProfile(email);

  try {
    if (accessToken) {
      const rows = await fetchRestRows<{
        id: string;
        email: string;
        name: string;
        portal_role: 'admin' | 'customer' | 'supplier';
        rbac_role: string | null;
        region: string | null;
        company?: string | null;
        phone?: string | null;
      }>(
        `/user_profiles?select=*&id=eq.${encodeURIComponent(userId)}`,
        accessToken,
        3000,
      );

      if (rows[0]) {
        return {
          profile: rows[0],
          degraded: false,
        };
      }
    }

    const profile = await promiseWithTimeout(
      fetchProfile(userId),
      5000,
      'Profile lookup timed out. Please try again.',
    );
    return {
      profile,
      degraded: false,
    };
  } catch (error) {
    console.warn(`[Login] profile lookup failed for ${portalRole}, using fallback session.`, error);
    return {
      profile: cachedProfile,
      degraded: true,
    };
  }
}

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
  const userContext = useOptionalUser();
  const setUser = userContext?.setUser ?? (() => {});
  const { navigateTo } = useRouter();
  const adminLoginPage = getProtectedAdminLoginPage();
  const [showPassword, setShowPassword] = useState(false);
  const [isCustomerSubmitting, setIsCustomerSubmitting] = useState(false);
  const [isManufacturerSubmitting, setIsManufacturerSubmitting] = useState(false);

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

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigateTo(adminLoginPage);
  };
  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = customerData.email.trim();
    if (!email) { toast.error('Please enter your email'); return; }

    try {
      setIsCustomerSubmitting(true);
      const { session } = await signInWithEmail(email, customerData.password);
      if (!session?.user) throw new Error('Login failed');

      const { profile, degraded } = await resolveProfileWithFallback(
        session.user.id,
        session.user.email!,
        'customer',
        session.access_token,
      );

      const resolvedPortalRole = await promiseWithTimeout(
        resolvePortalRoleForSession({
          sessionUser: session.user,
          profile,
          fallbackEmail: session.user.email!,
          accessToken: session.access_token,
        }),
        4000,
        'Portal role lookup timed out. Please try again.',
      );

      if (!resolvedPortalRole) {
        await import('../hooks/useSupabaseAuth').then(m => m.signOut());
        throw new Error('Unable to determine this account role. Please contact admin to complete portal role setup.');
      }

      if (resolvedPortalRole !== 'customer') {
        await import('../hooks/useSupabaseAuth').then(m => m.signOut());
        throw new Error(
          resolvedPortalRole === 'admin'
            ? 'This is an admin account. Please use the Admin Portal.'
            : 'This is a supplier account. Please use the Manufacturer tab.'
        );
      }

      persistFallbackAuthState({
        id: session.user.id,
        email: session.user.email!,
        name: profile?.name ?? session.user.email!.split('@')[0],
        portalRole: resolvedPortalRole,
        rbacRole: profile?.rbac_role,
        region: profile?.region,
      });
      setUser({
        type: 'customer',
        email: session.user.email!,
        id: session.user.id,
        name: profile?.name ?? session.user.email!.split('@')[0],
        region: profile?.region ?? undefined,
      });
      upsertPortalPasswordMirror({
        portalType: 'customer',
        loginEmail: session.user.email!,
        displayName: profile?.name ?? session.user.email!.split('@')[0],
        password: customerData.password,
        source: 'login_capture',
      });

      if (customerData.rememberMe) {
        localStorage.setItem(REMEMBER_CUSTOMER_KEY, email);
      } else {
        localStorage.removeItem(REMEMBER_CUSTOMER_KEY);
      }

      toast.success(degraded ? 'Login successful. Some profile data will load later.' : 'Login successful');
      completeLoginNavigation(navigateTo, 'customer');
    } catch (err: any) {
      const msg = normalizeErrorMessage(err);
      console.error('[Login] customer login failed:', err);
      toast.error(
        msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')
          ? 'Invalid email or password'
          : msg || 'Login failed'
      );
    } finally {
      setIsCustomerSubmitting(false);
    }
  };

  const handleManufacturerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = manufacturerData.email.trim();
    if (!email) { toast.error('Please enter your email'); return; }

    try {
      setIsManufacturerSubmitting(true);
      const { session } = await signInWithEmail(email, manufacturerData.password);
      if (!session?.user) throw new Error('Login failed');

      const { profile, degraded } = await resolveProfileWithFallback(
        session.user.id,
        session.user.email!,
        'supplier',
        session.access_token,
      );

      const resolvedPortalRole = await promiseWithTimeout(
        resolvePortalRoleForSession({
          sessionUser: session.user,
          profile,
          fallbackEmail: session.user.email!,
          accessToken: session.access_token,
        }),
        4000,
        'Portal role lookup timed out. Please try again.',
      );

      if (!resolvedPortalRole) {
        await import('../hooks/useSupabaseAuth').then(m => m.signOut());
        throw new Error('Unable to determine this account role. Please contact admin to complete portal role setup.');
      }

      if (resolvedPortalRole !== 'supplier') {
        await import('../hooks/useSupabaseAuth').then(m => m.signOut());
        throw new Error(
          resolvedPortalRole === 'admin'
            ? 'This is an admin account. Please use the Admin Portal.'
            : 'This is a customer account. Please use the Customer tab.'
        );
      }

      persistFallbackAuthState({
        id: session.user.id,
        email: session.user.email!,
        name: profile?.name ?? session.user.email!.split('@')[0],
        portalRole: resolvedPortalRole,
        rbacRole: profile?.rbac_role,
        region: profile?.region,
      });
      setUser({
        type: 'supplier',
        email: session.user.email!,
        id: session.user.id,
        name: profile?.name ?? session.user.email!.split('@')[0],
        region: profile?.region ?? undefined,
      });
      upsertPortalPasswordMirror({
        portalType: 'supplier',
        loginEmail: session.user.email!,
        displayName: profile?.name ?? session.user.email!.split('@')[0],
        password: manufacturerData.password,
        source: 'login_capture',
      });

      if (manufacturerData.rememberMe) {
        localStorage.setItem(REMEMBER_SUPPLIER_KEY, email);
      } else {
        localStorage.removeItem(REMEMBER_SUPPLIER_KEY);
      }

      toast.success(degraded ? 'Login successful. Some profile data will load later.' : 'Login successful');
      completeLoginNavigation(navigateTo, 'supplier');
    } catch (err: any) {
      const msg = normalizeErrorMessage(err);
      console.error('[Login] supplier login failed:', err);
      toast.error(
        msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')
          ? 'Invalid email or password'
          : msg || 'Login failed'
      );
    } finally {
      setIsManufacturerSubmitting(false);
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
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="customer" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t.login?.customerTab || 'Customer'}
              </TabsTrigger>
              <TabsTrigger value="manufacturer" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {t.login?.manufacturerTab || 'Supplier'}
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admin
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

                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={isCustomerSubmitting}
                    >
                      {isCustomerSubmitting ? 'Signing In...' : (t.login?.signIn || 'Sign In')}
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

            {/* Supplier Login */}
            <TabsContent value="manufacturer">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-orange-600" />
                    {t.login?.manufacturerTitle || 'Supplier Login'}
                  </CardTitle>
                  <CardDescription>
                    {t.login?.manufacturerDesc || 'Access your supplier portal to manage products, orders, and business operations'}
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

                    <Button
                      type="submit"
                      className="w-full bg-orange-600 hover:bg-orange-700"
                      disabled={isManufacturerSubmitting}
                    >
                      {isManufacturerSubmitting ? 'Signing In...' : (t.login?.signIn || 'Sign In')}
                    </Button>

                    <div className="text-center text-sm text-gray-600">
                      {t.login?.noAccount || "Don't have an account?"}{' '}
                      <a href="#" className="text-orange-600 hover:text-orange-700 font-medium">
                        {t.login?.applyNow || 'Apply now'}
                      </a>
                    </div>
                  </form>

                </CardContent>
              </Card>

              {/* Supplier Benefits */}
              <div className="mt-8 p-6 bg-orange-50 rounded-lg">
                <h3 className="text-gray-900 mb-4">
                  {t.login?.manufacturerBenefitsTitle || 'Supplier Benefits'}
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

            <TabsContent value="admin">
              <Card className="border-2 border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    COSUN Admin Login
                  </CardTitle>
                  <CardDescription>
                    Authorized internal staff access for catalog publishing, inquiry operations, users, and platform controls.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    type="button"
                    onClick={() => navigateTo(adminLoginPage)}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Continue to Admin Portal
                  </Button>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                    Admin is a separate protected portal. Customer and supplier credentials cannot enter the admin dashboard.
                  </div>
                </CardContent>
              </Card>
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
