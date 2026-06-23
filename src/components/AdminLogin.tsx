import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Eye, EyeOff, Globe, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { useOptionalUser } from '../contexts/UserContext';
import { useRouter } from '../contexts/RouterContext';
import { signInWithEmail, fetchProfile, sendPhoneOtp, verifyPhoneOtp } from '../hooks/useSupabaseAuth';
import { adminOrganizationService } from '../lib/services/profileDirectoryServices';
import {
  getStoredAdminOrgProfile,
  recordStoredAdminAccountLastLogin,
} from '../contexts/AdminOrganizationContext';
import { adminLoginAuditService } from '../lib/supabaseService';
import {
  adminPortalPolicy,
  canUseTestAccounts,
  canUseLocalAdminPasswordFallback,
  isDualAuthMode,
  isProductionAuthMode,
  supportsIdentitySource,
} from '../config/adminPortalPolicy';
import { startEnterpriseWechatLogin } from '../lib/services/adminEnterpriseWechatService';

const PRIMARY_ADMIN_EMAIL = 'admin@cosunchina.com';
const PRIMARY_ADMIN_PASSWORD = 'Zi39@cosun';
const ADMIN_LOGIN_REMOTE_PROFILE_TIMEOUT_MS = 1500;
const LOCAL_ADMIN_AUTH_STORAGE_KEY = 'cosun_admin_local_auth';
const LOCAL_ADMIN_AUTH_EMAIL_STORAGE_KEY = 'cosun_admin_local_auth_email';
const LOCAL_ADMIN_AUTH_PASSWORD_STORAGE_KEY = 'cosun_admin_local_auth_password';

function promiseWithTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    }),
  ]);
}

type LoginAccount = {
  id: string;
  username: string;
  email: string;
  password: string;
  name: string;
  title: string;
  employeeNo: string;
  role: string;
  region: string;
  authMode: 'test' | 'dual' | 'production';
  activationStatus: 'draft' | 'invited' | 'email_verified' | 'phone_verified' | 'active' | 'disabled';
  primaryIdentitySource: 'email' | 'phone' | 'wechat' | 'enterprise_wechat' | 'whatsapp';
  emailVerified: boolean;
  phoneVerified: boolean;
  inviteExpiresAt: string;
  phoneLogin: string;
};

function mapAdminLoginAccounts(adminOrgProfile: ReturnType<typeof getStoredAdminOrgProfile>): LoginAccount[] {
  return adminOrgProfile.internalAccounts
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
        role: account.role || 'Admin',
        region: account.region || 'all',
        authMode: account.authMode === 'production' || account.authMode === 'dual' ? account.authMode : 'test',
        activationStatus: ['draft', 'invited', 'email_verified', 'phone_verified', 'active', 'disabled'].includes(String(account.activationStatus || ''))
          ? account.activationStatus
          : 'active',
        primaryIdentitySource: ['email', 'phone', 'wechat', 'enterprise_wechat', 'whatsapp'].includes(String(account.primaryIdentitySource || ''))
          ? account.primaryIdentitySource as LoginAccount['primaryIdentitySource']
          : 'email',
        emailVerified: Boolean(account.emailVerified),
        phoneVerified: Boolean(account.phoneVerified),
        inviteExpiresAt: String(account.inviteExpiresAt || '').trim(),
        phoneLogin: String(account.phoneLogin || '').trim(),
      };
    })
    .sort((left, right) => {
      const leftNo = Number(String(left.employeeNo || '').replace(/\D/g, '') || 0);
      const rightNo = Number(String(right.employeeNo || '').replace(/\D/g, '') || 0);
      if (leftNo !== rightNo) return leftNo - rightNo;
      return left.name.localeCompare(right.name, 'zh-CN');
    });
}

function buildUsernameMap(accounts: LoginAccount[]) {
  const entries: Array<[string, string]> = [];
  accounts.forEach((account) => {
    const emailPrefix = String(account.email || '').split('@')[0]?.trim().toLowerCase();
    const username = String(account.username || '').trim().toLowerCase();
    const name = String(account.name || '').trim().toLowerCase();
    if (emailPrefix) entries.push([emailPrefix, account.email]);
    if (username) entries.push([username, account.email]);
    if (name) entries.push([name, account.email]);
  });
  return new Map(entries);
}

function mergeAdminOrgProfiles(
  remoteProfile: ReturnType<typeof getStoredAdminOrgProfile> | null | undefined,
  localProfile: ReturnType<typeof getStoredAdminOrgProfile>,
) {
  if (!remoteProfile) return localProfile;

  const mergedContacts = [...remoteProfile.internalContacts];
  const contactKeys = new Set(
    mergedContacts.map((contact) => `${String(contact.id || '').trim()}::${String(contact.email || '').trim().toLowerCase()}`),
  );
  localProfile.internalContacts.forEach((contact) => {
    const key = `${String(contact.id || '').trim()}::${String(contact.email || '').trim().toLowerCase()}`;
    if (!contactKeys.has(key)) {
      mergedContacts.push(contact);
      contactKeys.add(key);
    }
  });

  const mergedAccounts = [...remoteProfile.internalAccounts];
  const accountKeys = new Set(
    mergedAccounts.map((account) => (
      String(account.authUserId || '').trim()
      || String(account.loginEmail || '').trim().toLowerCase()
      || String(account.id || '').trim()
    )),
  );
  localProfile.internalAccounts.forEach((account) => {
    const key =
      String(account.authUserId || '').trim()
      || String(account.loginEmail || '').trim().toLowerCase()
      || String(account.id || '').trim();
    if (!key || accountKeys.has(key)) return;
    mergedAccounts.push(account);
    accountKeys.add(key);
  });

  return {
    ...remoteProfile,
    internalContacts: mergedContacts,
    internalAccounts: mergedAccounts,
  };
}

function shouldSolidifyMergedAdminOrgProfile(params: {
  latestMatchedLoginAccount: LoginAccount | null;
  cachedMatchedLoginAccount: LoginAccount | null;
}) {
  return !params.latestMatchedLoginAccount && Boolean(params.cachedMatchedLoginAccount);
}

function solidifyMergedAdminOrgProfile(profile: ReturnType<typeof getStoredAdminOrgProfile>) {
  void adminOrganizationService.save(profile).catch((error) => {
    console.warn('[AdminLogin] failed to solidify merged admin org profile to remote.', error);
  });
}

async function loadLatestAdminOrgProfile() {
  const localProfile = getStoredAdminOrgProfile();
  try {
    const remote = await promiseWithTimeout(
      adminOrganizationService.get(),
      ADMIN_LOGIN_REMOTE_PROFILE_TIMEOUT_MS,
      'admin org profile request timed out',
    );
    if (remote) return mergeAdminOrgProfiles(remote, localProfile);
  } catch (error) {
    console.warn('[AdminLogin] load latest admin org profile failed, using cached snapshot.', error);
  }
  return localProfile;
}

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

async function syncFormalEmailVerification(loginEmail: string) {
  const normalizedEmail = String(loginEmail || '').trim().toLowerCase();
  if (!normalizedEmail) return false;

  const currentProfile = await loadLatestAdminOrgProfile();
  const nextAccounts = currentProfile.internalAccounts.map((account) => {
    const accountEmail = String(account.loginEmail || '').trim().toLowerCase();
    if (accountEmail !== normalizedEmail) return account;
    return {
      ...account,
      emailVerified: true,
      activationStatus:
        String(account.activationStatus || '').trim().toLowerCase() === 'active'
          ? 'active'
          : 'email_verified',
    };
  });

  if (JSON.stringify(nextAccounts) === JSON.stringify(currentProfile.internalAccounts)) {
    return false;
  }

  await promiseWithTimeout(
    adminOrganizationService.save({
      ...currentProfile,
      internalAccounts: nextAccounts,
    }),
    ADMIN_LOGIN_REMOTE_PROFILE_TIMEOUT_MS,
    'admin org profile save timed out',
  );
  return true;
}

function persistFallbackAdminState(params: {
  id: string;
  email: string;
  name: string;
  rbacRole?: string | null;
  region?: string | null;
  password?: string | null;
}) {
  localStorage.removeItem('cosun_switched_user');
  localStorage.setItem(LOCAL_ADMIN_AUTH_STORAGE_KEY, 'true');
  localStorage.setItem(LOCAL_ADMIN_AUTH_EMAIL_STORAGE_KEY, String(params.email || '').trim().toLowerCase());
  if (params.password) {
    sessionStorage.setItem(LOCAL_ADMIN_AUTH_PASSWORD_STORAGE_KEY, params.password);
  }
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

function persistLocalAdminAuthCredentials(email: string, password: string) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '').trim();
  if (!normalizedEmail || !normalizedPassword) return;

  localStorage.setItem(LOCAL_ADMIN_AUTH_STORAGE_KEY, 'true');
  localStorage.setItem(LOCAL_ADMIN_AUTH_EMAIL_STORAGE_KEY, normalizedEmail);
  sessionStorage.setItem(LOCAL_ADMIN_AUTH_PASSWORD_STORAGE_KEY, normalizedPassword);
}

function clearLocalAdminAuthCredentials() {
  localStorage.removeItem(LOCAL_ADMIN_AUTH_STORAGE_KEY);
  localStorage.removeItem(LOCAL_ADMIN_AUTH_EMAIL_STORAGE_KEY);
  sessionStorage.removeItem(LOCAL_ADMIN_AUTH_PASSWORD_STORAGE_KEY);
}

function validateFormalAuthReadiness(account: LoginAccount) {
  if (account.inviteExpiresAt) {
    const expiresAt = new Date(account.inviteExpiresAt);
    if (!Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() < Date.now() && account.activationStatus !== 'active') {
      return '正式账号激活邀请已过期，请联系管理员重新发放。';
    }
  }

  const needsEmailVerification =
    adminPortalPolicy.requireVerifiedEmailForProductionLogin &&
    account.primaryIdentitySource === 'email' &&
    !account.emailVerified;

  const needsPhoneVerification =
    adminPortalPolicy.requireVerifiedPhoneForProductionLogin &&
    account.primaryIdentitySource === 'phone' &&
    !account.phoneVerified;

  if (account.activationStatus === 'draft') {
    return '账号尚未发放，请先完成正式账号创建。';
  }

  if (account.activationStatus === 'invited') {
    return '账号已发放但尚未完成激活，请先完成邮件或手机验证。';
  }

  if (needsEmailVerification) {
    return '正式环境要求邮箱已验证后才能登录。';
  }

  if (needsPhoneVerification) {
    return '正式环境要求手机号已验证后才能登录。';
  }

  if (account.activationStatus === 'email_verified' || account.activationStatus === 'phone_verified') {
    return '账号已完成身份验证，等待管理员完成正式激活。';
  }

  if (account.activationStatus !== 'active') {
    return '账号尚未进入可登录状态，请联系管理员检查发放与激活流程。';
  }

  return '';
}

function canUseAccountAccessPassword(account: LoginAccount | null, password: string) {
  if (!account) return false;
  return String(account.password || '').trim().length > 0 &&
    String(account.password || '').trim() === String(password || '').trim();
}

export function AdminLoginPage({ fixedEntry = 'test' }: { fixedEntry?: 'test' | 'formal' }) {
  const userContext = useOptionalUser();
  const setUser = userContext?.setUser ?? (() => {});
  const currentUser = userContext?.user ?? null;
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
  const [phoneOtpLogin, setPhoneOtpLogin] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState<'enter_phone' | 'enter_code'>('enter_phone');
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem(REMEMBER_KEY));
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [loginMethod, setLoginMethod] = useState<'password' | 'phone_otp'>(fixedEntry === 'formal' ? 'password' : 'password');
  const [wechatLoading, setWechatLoading] = useState(false);

  const adminOrgProfile = getStoredAdminOrgProfile();
  const adminLoginAccounts = useMemo(
    () => mapAdminLoginAccounts(adminOrgProfile),
    [adminOrgProfile.internalAccounts, adminOrgProfile.internalContacts]
  );

  const usernameMap = useMemo(() => {
    return buildUsernameMap(adminLoginAccounts);
  }, [adminLoginAccounts]);

  const effectiveLoginEntry: 'test' | 'formal' = fixedEntry;
  const isFormalPortal = effectiveLoginEntry === 'formal';
  const phoneOtpAllowed = effectiveLoginEntry === 'formal' && supportsIdentitySource('phone');
  const enterpriseWechatAllowed = effectiveLoginEntry === 'formal' && supportsIdentitySource('enterprise_wechat');

  useEffect(() => {
    if (currentUser?.type === 'admin') {
      navigateTo('dashboard');
    }
  }, [currentUser?.type, navigateTo]);

  const resolveLoginAccount = (accounts: LoginAccount[], identifier: string) => {
    const trimmed = String(identifier || '').trim().toLowerCase();
    if (!trimmed) return null;

    return accounts.find((account) => {
      const accountEmail = String(account.email || '').trim().toLowerCase();
      const accountUsername = String(account.username || '').trim().toLowerCase();
      const accountName = String(account.name || '').trim().toLowerCase();
      const emailPrefix = accountEmail.split('@')[0] || '';
      return (
        trimmed === accountEmail ||
        trimmed === accountUsername ||
        trimmed === accountName ||
        trimmed === emailPrefix
      );
    }) || null;
  };

  const resolvePhoneLoginAccount = (accounts: LoginAccount[], phone: string) => {
    const trimmed = String(phone || '').trim();
    if (!trimmed) return null;
    return accounts.find((account) => String(account.phoneLogin || '').trim() === trimmed) || null;
  };

  const resolveEmail = (input: string): string => {
    const trimmed = input.trim().toLowerCase();
    if (trimmed.includes('@')) return trimmed;
    return usernameMap.get(trimmed) ?? trimmed;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const cachedLoginAccounts = adminLoginAccounts;
    const cachedUsernameMap = usernameMap;
    const latestAdminOrgProfile = await loadLatestAdminOrgProfile();
    const latestLoginAccounts = mapAdminLoginAccounts(latestAdminOrgProfile);
    const latestUnifiedAdminAccount = latestLoginAccounts.find((account) => {
      const normalizedAccountUsername = String(account.username || '').trim().toLowerCase();
      const normalizedAccountEmail = String(account.email || '').trim().toLowerCase();
      return normalizedAccountUsername === 'admin' || normalizedAccountEmail === PRIMARY_ADMIN_EMAIL;
    }) || null;
    const latestUsernameMap = buildUsernameMap(latestLoginAccounts);
    const resolveLatestEmail = (input: string): string => {
      const trimmed = input.trim().toLowerCase();
      if (trimmed.includes('@')) return trimmed;
      return latestUsernameMap.get(trimmed) ?? trimmed;
    };
    const resolveCachedEmail = (input: string): string => {
      const trimmed = input.trim().toLowerCase();
      if (trimmed.includes('@')) return trimmed;
      return cachedUsernameMap.get(trimmed) ?? trimmed;
    };

    const email = resolveLatestEmail(username);
    const cachedEmail = resolveCachedEmail(username);
    const normalizedUsername = username.trim().toLowerCase();
    const latestMatchedLoginAccount = resolveLoginAccount(latestLoginAccounts, username) ||
      latestLoginAccounts.find((account) => String(account.email || '').trim().toLowerCase() === email) ||
      null;
    const cachedMatchedLoginAccount = resolveLoginAccount(cachedLoginAccounts, username) ||
      cachedLoginAccounts.find((account) => String(account.email || '').trim().toLowerCase() === cachedEmail) ||
      null;
    // Test entry should remain resilient to remote roster drift and continue to accept
    // the password shown in the local Account Access snapshot during development.
    const matchedLoginAccount = latestMatchedLoginAccount || cachedMatchedLoginAccount;
    const shouldSolidifyMergedProfile = shouldSolidifyMergedAdminOrgProfile({
      latestMatchedLoginAccount,
      cachedMatchedLoginAccount,
    });
    const targetLoginEmail = String(matchedLoginAccount?.email || '').trim().toLowerCase();
    const normalizedLoginEmail = targetLoginEmail || email;
    const isPrimaryAdminLogin =
      normalizedUsername === 'admin' ||
      normalizedLoginEmail === String(latestUnifiedAdminAccount?.email || PRIMARY_ADMIN_EMAIL).trim().toLowerCase();
    const fallbackPasswordCandidates = Array.from(new Set([
      String(latestMatchedLoginAccount?.password || '').trim(),
      String(cachedMatchedLoginAccount?.password || '').trim(),
      ...(isPrimaryAdminLogin ? [PRIMARY_ADMIN_PASSWORD] : []),
    ].filter(Boolean)));
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
    const rosterGateMissing = !matchedLoginAccount;

    const usingAccountAccessPassword = matchedLoginAccount ? canUseAccountAccessPassword(matchedLoginAccount, password) : false;
    const shouldBypassPortalModeGuards = usingAccountAccessPassword;

    if (!rosterGateMissing && !shouldBypassPortalModeGuards) {
      if (effectiveLoginEntry === 'test' && matchedLoginAccount.authMode !== 'test') {
        void adminLoginAuditService.record({
          attemptedAt,
          enteredIdentifier: username,
          loginEmail: email,
          normalizedLoginEmail,
          status: 'failure',
          failureReason: 'formal_account_attempted_from_test_entry',
        });
        setError(language === 'zh'
          ? '当前是测试入口，只允许测试账号登录。正式账号请走正式入口。'
          : 'The test entry only accepts test accounts. Please use the formal entry for production accounts.');
        setIsLoading(false);
        return;
      }

      if (effectiveLoginEntry === 'formal' && matchedLoginAccount.authMode === 'test') {
        if (isProductionAuthMode() || !canUseTestAccounts()) {
          void adminLoginAuditService.record({
            attemptedAt,
            enteredIdentifier: username,
            loginEmail: email,
            normalizedLoginEmail,
            status: 'failure',
            failureReason: 'test_account_attempted_from_formal_entry',
          });
          setError(language === 'zh'
            ? '当前是正式入口，测试账号不能从这里登录。请切换到测试入口。'
            : 'The formal entry blocks test accounts. Please switch to the test entry.');
          setIsLoading(false);
          return;
        }

        setNotice(language === 'zh'
          ? '当前为本地/测试环境，正式入口已兼容测试账号登录。'
          : 'In local or test environments, the formal entry accepts test accounts.');
      }

      if (isProductionAuthMode()) {
        if (matchedLoginAccount.authMode === 'test' && !canUseTestAccounts()) {
          void adminLoginAuditService.record({
            attemptedAt,
            enteredIdentifier: username,
            loginEmail: email,
            normalizedLoginEmail,
            status: 'failure',
            failureReason: 'test_account_blocked_in_production_mode',
          });
          setError(language === 'zh'
            ? '当前为正式认证模式，测试账号已禁止登录。请使用已激活的正式账号。'
            : 'Production auth mode blocks test accounts. Please use an activated production account.');
          setIsLoading(false);
          return;
        }

        const readinessError = validateFormalAuthReadiness(matchedLoginAccount);
        if (readinessError) {
          void adminLoginAuditService.record({
            attemptedAt,
            enteredIdentifier: username,
            loginEmail: email,
            normalizedLoginEmail,
            status: 'failure',
            failureReason: `formal_auth_not_ready:${matchedLoginAccount.activationStatus}:${matchedLoginAccount.primaryIdentitySource}`,
          });
          setError(language === 'zh' ? readinessError : 'This production account is not ready for sign-in yet.');
          setIsLoading(false);
          return;
        }
      }

      if (isDualAuthMode() && matchedLoginAccount.authMode === 'production') {
        const readinessError = validateFormalAuthReadiness(matchedLoginAccount);
        if (readinessError) {
          void adminLoginAuditService.record({
            attemptedAt,
            enteredIdentifier: username,
            loginEmail: email,
            normalizedLoginEmail,
            status: 'failure',
            failureReason: `dual_mode_formal_auth_not_ready:${matchedLoginAccount.activationStatus}:${matchedLoginAccount.primaryIdentitySource}`,
          });
          setError(language === 'zh'
            ? `${readinessError} 当前为双轨模式，可继续使用测试账号，或先完成正式账号验证。`
            : 'Formal account is not ready yet in dual mode.');
          setIsLoading(false);
          return;
        }
      }
    }

    const canUseDirectLocalTestFallback =
      canUseLocalAdminPasswordFallback() &&
      (usingAccountAccessPassword || (effectiveLoginEntry === 'test' && fallbackPasswordCandidates.includes(password)));

    if (canUseDirectLocalTestFallback) {
      const fallbackName = matchedLoginAccount?.name || latestUnifiedAdminAccount?.name || '系统管理员';
      persistFallbackAdminState({
        id: matchedLoginAccount?.id || 'local-admin-fallback',
        email: normalizedLoginEmail,
        name: fallbackName,
        rbacRole: matchedLoginAccount?.role || 'Admin',
        region: matchedLoginAccount?.region || 'all',
        password,
      });
      setUser({
        id: matchedLoginAccount?.id || 'local-admin-fallback',
        email: normalizedLoginEmail,
        name: fallbackName,
        type: 'admin',
        role: matchedLoginAccount?.role || 'Admin',
        userRole: matchedLoginAccount?.role || 'Admin',
        region: matchedLoginAccount?.region || 'all',
      });
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, email);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
      if (shouldSolidifyMergedProfile) {
        solidifyMergedAdminOrgProfile(latestAdminOrgProfile);
      }
      void recordStoredAdminAccountLastLogin(normalizedLoginEmail, attemptedAt).catch((recordError) => {
        console.warn('[AdminLogin] failed to persist admin last login after direct local fallback.', recordError);
      });
      void adminLoginAuditService.record({
        attemptedAt,
        enteredIdentifier: username,
        loginEmail: normalizedLoginEmail,
        normalizedLoginEmail,
        authUserId: 'local-admin-fallback',
        adminName: fallbackName,
        portalRole: 'admin',
        rbacRole: matchedLoginAccount?.role || 'Admin',
        region: matchedLoginAccount?.region || 'all',
        status: 'success',
        failureReason: usingAccountAccessPassword
          ? 'account_access_password_local_fallback'
          : 'direct_test_entry_local_fallback',
      });
      setIsLoading(false);
      navigateTo('dashboard');
      return;
    }

    try {
      // Supabase Auth 登录
      const { session } = await signInWithEmail(normalizedLoginEmail, password);
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
          normalizedLoginEmail,
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
      if (matchedLoginAccount) {
        persistLocalAdminAuthCredentials(normalizedLoginEmail, password);
      } else {
        clearLocalAdminAuthCredentials();
      }

      persistFallbackAdminState({
        id: session.user.id,
        email: session.user.email!,
        name: profile?.name ?? matchedLoginAccount?.name ?? session.user.email!.split('@')[0],
        rbacRole: profile?.rbac_role ?? matchedLoginAccount?.role ?? 'Admin',
        region: profile?.region ?? matchedLoginAccount?.region ?? 'all',
      });
      // 更新 UserContext（onAuthStateChange 也会触发，这里做即时同步）
      setUser({
        id: session.user.id,
        email: session.user.email!,
        name: profile?.name ?? matchedLoginAccount?.name ?? session.user.email!.split('@')[0],
        type: 'admin',
        role: profile?.rbac_role ?? matchedLoginAccount?.role ?? 'Admin',
        userRole: profile?.rbac_role ?? matchedLoginAccount?.role ?? 'Admin',
        region: profile?.region ?? matchedLoginAccount?.region ?? 'all',
      });
      if (shouldSolidifyMergedProfile) {
        solidifyMergedAdminOrgProfile(latestAdminOrgProfile);
      }
      void recordStoredAdminAccountLastLogin(session.user.email!, attemptedAt).catch((recordError) => {
        console.warn('[AdminLogin] failed to persist admin last login after auth success.', recordError);
      });
      void adminLoginAuditService.record({
        attemptedAt,
        enteredIdentifier: username,
        loginEmail: session.user.email!,
        normalizedLoginEmail,
        authUserId: session.user.id,
        adminName: profile?.name ?? matchedLoginAccount?.name ?? session.user.email!.split('@')[0],
        portalRole: profile?.portal_role ?? 'admin',
        rbacRole: profile?.rbac_role ?? matchedLoginAccount?.role ?? 'Admin',
        region: profile?.region ?? matchedLoginAccount?.region ?? 'all',
        status: 'success',
        failureReason: degraded ? 'profile_lookup_degraded_to_cache' : '',
      });
      if (degraded) {
        console.warn('[AdminLogin] continuing with fallback admin profile state.');
      }

      // useAuth 会监听 onAuthStateChange 自动同步 RBAC 用户，无需手动写 localStorage
      setIsLoading(false);
      navigateTo('dashboard');
      return; // 登录成功，后面由 onAuthStateChange / setUser 触发页面跳转

    } catch (err: any) {
      const msg = err?.message || '';
      const canUsePrimaryAdminFallback =
        canUseLocalAdminPasswordFallback() &&
        Boolean(matchedLoginAccount) &&
        (usingAccountAccessPassword || fallbackPasswordCandidates.includes(password));

      if (canUsePrimaryAdminFallback) {
        const fallbackName = matchedLoginAccount?.name || latestUnifiedAdminAccount?.name || '系统管理员';
        persistFallbackAdminState({
          id: matchedLoginAccount?.id || 'local-admin-fallback',
          email: normalizedLoginEmail,
          name: fallbackName,
          rbacRole: matchedLoginAccount?.role || 'Admin',
          region: matchedLoginAccount?.region || 'all',
          password,
        });
        setUser({
          id: matchedLoginAccount?.id || 'local-admin-fallback',
          email: normalizedLoginEmail,
          name: fallbackName,
          type: 'admin',
          role: matchedLoginAccount?.role || 'Admin',
          userRole: matchedLoginAccount?.role || 'Admin',
          region: matchedLoginAccount?.region || 'all',
        });
        if (shouldSolidifyMergedProfile) {
          solidifyMergedAdminOrgProfile(latestAdminOrgProfile);
        }
        void recordStoredAdminAccountLastLogin(normalizedLoginEmail, attemptedAt).catch((recordError) => {
          console.warn('[AdminLogin] failed to persist admin last login after local fallback.', recordError);
        });
        void adminLoginAuditService.record({
          attemptedAt,
          enteredIdentifier: username,
          loginEmail: normalizedLoginEmail,
          normalizedLoginEmail,
          authUserId: 'local-admin-fallback',
          adminName: fallbackName,
          portalRole: 'admin',
          rbacRole: matchedLoginAccount?.role || 'Admin',
          region: matchedLoginAccount?.region || 'all',
          status: 'success',
          failureReason: usingAccountAccessPassword
            ? 'supabase_invalid_credentials_fallback_to_account_access_password'
            : isPrimaryAdminLogin
              ? 'supabase_invalid_credentials_fallback_to_primary_admin'
              : 'supabase_invalid_credentials_fallback_to_internal_account',
        });
        setIsLoading(false);
        navigateTo('dashboard');
        return;
      }

      void adminLoginAuditService.record({
        attemptedAt,
        enteredIdentifier: username,
        loginEmail: email,
        normalizedLoginEmail,
        status: 'failure',
        failureReason: msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')
          ? 'invalid_credentials'
          : (msg || 'login_failed'),
      });
      if (rosterGateMissing) {
        void adminLoginAuditService.record({
          attemptedAt,
          enteredIdentifier: username,
          loginEmail: email,
          normalizedLoginEmail,
          status: 'failure',
          failureReason: 'internal_account_not_found',
        });
        setError(language === 'zh'
          ? '未找到可登录的内部账号，请先在“账户与访问”中确认账号已开通。'
          : 'No active internal login account was found. Please check Account Access first.');
      } else if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
        setError(language === 'zh' ? '邮箱或密码错误' : 'Invalid email or password');
      } else {
        setError(msg || (language === 'zh' ? '登录失败，请重试' : 'Login failed, please try again'));
      }
    }

    setIsLoading(false);
  };

  const handlePhoneOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (effectiveLoginEntry !== 'formal') {
      setError(language === 'zh' ? '手机号 OTP 仅在正式入口开放。' : 'Phone OTP is only available in the formal entry.');
      setIsLoading(false);
      return;
    }

    const latestAdminOrgProfile = await loadLatestAdminOrgProfile();
    const latestLoginAccounts = mapAdminLoginAccounts(latestAdminOrgProfile);
    const matchedLoginAccount = resolvePhoneLoginAccount(latestLoginAccounts, phoneOtpLogin);
    const attemptedAt = new Date().toISOString();

    if (!matchedLoginAccount) {
      void adminLoginAuditService.record({
        attemptedAt,
        enteredIdentifier: phoneOtpLogin,
        loginEmail: '',
        normalizedLoginEmail: '',
        status: 'failure',
        failureReason: 'phone_account_not_found',
      });
      setError(language === 'zh' ? '未找到绑定该手机号的正式账号' : 'No formal account is bound to this phone number.');
      setIsLoading(false);
      return;
    }

    if (matchedLoginAccount.primaryIdentitySource !== 'phone') {
      setError(language === 'zh' ? '该账号未配置手机号作为主登录方式' : 'This account is not configured for phone OTP sign-in.');
      setIsLoading(false);
      return;
    }

    if (isProductionAuthMode()) {
      if (matchedLoginAccount.authMode === 'test' && !canUseTestAccounts()) {
        setError(language === 'zh' ? '当前为正式认证模式，测试账号已禁止登录。' : 'Production auth mode blocks test accounts.');
        setIsLoading(false);
        return;
      }
      const readinessError = validateFormalAuthReadiness(matchedLoginAccount);
      if (readinessError) {
        setError(language === 'zh' ? readinessError : 'This production account is not ready for sign-in yet.');
        setIsLoading(false);
        return;
      }
    }

    if (isDualAuthMode() && matchedLoginAccount.authMode === 'production') {
      const readinessError = validateFormalAuthReadiness(matchedLoginAccount);
      if (readinessError) {
        setError(language === 'zh'
          ? `${readinessError} 当前为双轨模式，可继续使用测试账号，或先完成正式账号验证。`
          : 'Formal account is not ready yet in dual mode.');
        setIsLoading(false);
        return;
      }
    }

    try {
      if (otpStep === 'enter_phone') {
        await sendPhoneOtp(phoneOtpLogin);
        setOtpStep('enter_code');
        void adminLoginAuditService.record({
          attemptedAt,
          enteredIdentifier: phoneOtpLogin,
          loginEmail: matchedLoginAccount.email,
          normalizedLoginEmail: matchedLoginAccount.email,
          authUserId: matchedLoginAccount.id,
          adminName: matchedLoginAccount.name,
          portalRole: 'admin',
          rbacRole: matchedLoginAccount.role,
          region: matchedLoginAccount.region,
          status: 'success',
          failureReason: 'phone_otp_sent',
        });
        setIsLoading(false);
        return;
      }

      const { data } = await verifyPhoneOtp(phoneOtpLogin, otpCode);
      const session = data.session;
      if (!session?.user) throw new Error('验证码校验失败，请重试');

      let degraded = false;
      let profile = null;
      try {
        profile = await fetchProfile(session.user.id);
      } catch (profileError) {
        degraded = true;
        profile = readCachedAdminProfile(session.user.email || matchedLoginAccount.email);
        console.warn('[AdminLogin] profile lookup failed after phone otp, using fallback session.', profileError);
      }

      if (profile && profile.portal_role !== 'admin' && profile.portal_role !== 'staff') {
        throw new Error(language === 'zh'
          ? '此账号无管理员权限，请使用客户/供应商入口登录'
          : 'This account has no admin access. Please use the customer/supplier portal.');
      }

      persistFallbackAdminState({
        id: session.user.id,
        email: session.user.email || matchedLoginAccount.email,
        name: profile?.name ?? matchedLoginAccount.name,
        rbacRole: profile?.rbac_role ?? matchedLoginAccount.role ?? 'Admin',
        region: profile?.region ?? matchedLoginAccount.region ?? 'all',
      });
      setUser({
        id: session.user.id,
        email: session.user.email || matchedLoginAccount.email,
        name: profile?.name ?? matchedLoginAccount.name,
        type: 'admin',
        role: profile?.rbac_role ?? matchedLoginAccount.role ?? 'Admin',
        userRole: profile?.rbac_role ?? matchedLoginAccount.role ?? 'Admin',
        region: profile?.region ?? matchedLoginAccount.region ?? 'all',
      });
      void recordStoredAdminAccountLastLogin(session.user.email || matchedLoginAccount.email, attemptedAt).catch((recordError) => {
        console.warn('[AdminLogin] failed to persist admin last login after phone otp success.', recordError);
      });
      void adminLoginAuditService.record({
        attemptedAt,
        enteredIdentifier: phoneOtpLogin,
        loginEmail: session.user.email || matchedLoginAccount.email,
        normalizedLoginEmail: session.user.email || matchedLoginAccount.email,
        authUserId: session.user.id,
        adminName: profile?.name ?? matchedLoginAccount.name,
        portalRole: profile?.portal_role ?? 'admin',
        rbacRole: profile?.rbac_role ?? matchedLoginAccount.role ?? 'Admin',
        region: profile?.region ?? matchedLoginAccount.region ?? 'all',
        status: 'success',
        failureReason: degraded ? 'phone_otp_profile_lookup_degraded_to_cache' : 'phone_otp_verified',
      });
      setIsLoading(false);
      navigateTo('dashboard');
      return;
    } catch (err: any) {
      setError(err?.message || (language === 'zh' ? '手机号登录失败，请重试' : 'Phone OTP sign-in failed, please try again.'));
      setIsLoading(false);
    }
  };

  const handleEnterpriseWechatLogin = async () => {
    setError('');
    setWechatLoading(true);
    if (effectiveLoginEntry !== 'formal') {
      setError(language === 'zh' ? '企业微信登录仅在正式入口开放。' : 'Enterprise WeChat is only available in the formal entry.');
      setWechatLoading(false);
      return;
    }
    try {
      const result = await startEnterpriseWechatLogin();
      if (!result.authorizeUrl) {
        throw new Error(language === 'zh' ? '企业微信授权地址为空' : 'Enterprise WeChat authorize URL is empty.');
      }
      window.location.href = result.authorizeUrl;
    } catch (err: any) {
      setError(err?.message || (language === 'zh' ? '企业微信登录暂不可用' : 'Enterprise WeChat sign-in is unavailable.'));
      setWechatLoading(false);
    }
  };

  const text = {
    zh: {
      title: '账密登录',
      testEntryTitle: '测试账号入口',
      formalEntryTitle: '正式账号入口',
      testEntryHint: '用于开发阶段角色流转、审批、单据与权限测试。',
      formalEntryHint: '用于真实邮箱、手机号、企业微信等正式身份登录。',
      currentMode: '当前认证模式',
      phoneOtpTitle: '手机号 OTP',
      username: '用户名',
      phone: '手机号',
      otpCode: '验证码',
      password: '密码',
      enterpriseWechat: '企业微信登录',
      rememberMe: '记住密码',
      forgotPassword: '找回密码',
      loginButton: '登录',
      sendOtpButton: '发送验证码',
      verifyOtpButton: '验证并登录',
      switchToPassword: '账密登录',
      switchToPhoneOtp: '手机 OTP',
      agreement: '登录即表示同意',
      terms: '《服务条款》',
      and: '和',
      privacy: '《隐私政策》',
      internalOnly: '仅限内部员工访问'
    },
    en: {
      title: 'Account Login',
      testEntryTitle: 'Test Account Entry',
      formalEntryTitle: 'Formal Account Entry',
      testEntryHint: 'Used for development-time flow, approval, document, and permission testing.',
      formalEntryHint: 'Used for real email, phone, and Enterprise WeChat sign-in.',
      currentMode: 'Current Auth Mode',
      phoneOtpTitle: 'Phone OTP',
      username: 'Username',
      phone: 'Phone',
      otpCode: 'OTP Code',
      password: 'Password',
      enterpriseWechat: 'Enterprise WeChat',
      rememberMe: 'Remember Me',
      forgotPassword: 'Forgot Password',
      loginButton: 'Login',
      sendOtpButton: 'Send OTP',
      verifyOtpButton: 'Verify & Login',
      switchToPassword: 'Password Login',
      switchToPhoneOtp: 'Phone OTP',
      agreement: 'By logging in, you agree to',
      terms: 'Terms of Service',
      and: 'and',
      privacy: 'Privacy Policy',
      internalOnly: 'Internal Staff Only'
    }
  };

  const t = text[language];
  useEffect(() => {
    if (fixedEntry !== 'formal') return;

    const hash = String(window.location.hash || '');
    const queryIndex = hash.indexOf('?');
    const hashQuery = queryIndex >= 0 ? hash.slice(queryIndex + 1) : '';
    const hashFragment = hash.startsWith('#') && !hash.startsWith('#/') ? hash.slice(1) : '';
    const rawQuery = hashQuery || hashFragment || String(window.location.search || '').replace(/^\?/, '');
    if (!rawQuery) return;

    const params = new URLSearchParams(rawQuery);
    const enterpriseWechatError = String(params.get('enterprise_wechat_error') || '').trim();
    const enterpriseWechatNotice = String(params.get('enterprise_wechat_notice') || '').trim();
    const supabaseError = String(params.get('error_description') || params.get('error') || '').trim();
    const authType = String(params.get('type') || '').trim().toLowerCase();
    const hasAccessToken = params.has('access_token');
    const emailFromQuery = String(params.get('email') || '').trim().toLowerCase();

    if (enterpriseWechatError) {
      setError(enterpriseWechatError);
    } else if (supabaseError) {
      setError(supabaseError);
    } else if (enterpriseWechatNotice) {
      setNotice(enterpriseWechatNotice);
    } else if (hasAccessToken && ['magiclink', 'invite', 'recovery'].includes(authType)) {
      void (async () => {
        try {
          const {
            data: { session },
          } = await import('../lib/supabase').then((mod) => mod.supabase.auth.getSession());
          const resolvedEmail = String(session?.user?.email || emailFromQuery || '').trim().toLowerCase();
          if (resolvedEmail) {
            await syncFormalEmailVerification(resolvedEmail);
          }
          setNotice(language === 'zh'
            ? '正式邮箱验证已通过，系统已同步邮箱验证状态，请通知管理员完成正式激活。'
            : 'Formal email verification passed. The email verification state has been synced. Please ask an administrator to finalize activation.');
        } catch (syncError) {
          console.warn('[AdminLogin] failed to sync formal email verification:', syncError);
          setNotice(language === 'zh'
            ? '正式邮箱验证已通过，请通知管理员完成正式激活。'
            : 'Formal email verification passed. Please ask an administrator to finalize activation.');
        }
      })();
    } else {
      return;
    }

    const nextHash = '#/admin-formal-login';
    window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}${nextHash}`);
  }, [fixedEntry, language]);

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 ${
        isFormalPortal
          ? 'bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-100'
          : 'bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100'
      }`}
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob ${
            isFormalPortal ? 'bg-emerald-100' : 'bg-red-100'
          }`}
        ></div>
        <div
          className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000 ${
            isFormalPortal ? 'bg-teal-100' : 'bg-slate-200'
          }`}
        ></div>
        <div
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000 ${
            isFormalPortal ? 'bg-emerald-200' : 'bg-blue-100'
          }`}
        ></div>
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
        <div
          className={`rounded-b-2xl shadow-2xl p-8 ${
            isFormalPortal ? 'bg-white/95 ring-1 ring-emerald-100' : 'bg-white'
          }`}
        >
          {/* Logo和标题 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl shadow-lg mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-red-600 mb-2" style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '2px' }}>
              COSUN
            </h1>
            <p className="text-slate-600 text-sm mb-1">
              {effectiveLoginEntry === 'formal'
                ? 'Formal Admin Portal · 正式认证系统'
                : 'Admin Portal · 内部管理系统'}
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Shield className="w-3.5 h-3.5" />
              <span>{t.internalOnly}</span>
            </div>
          </div>

          {/* 登录标题 */}
          <div className="mb-6">
            <h2 className="text-slate-800 flex items-center gap-2">
              <div className="w-1 h-6 bg-red-600 rounded-full"></div>
              {loginMethod === 'password' ? t.title : t.phoneOtpTitle}
            </h2>
          </div>

          {/* 登录表单 */}
          <form onSubmit={loginMethod === 'password' ? handleLogin : handlePhoneOtpSubmit} className="space-y-5">
            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {!error && notice && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">
                {notice}
              </div>
            )}

            {loginMethod === 'password' ? (
              <>
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
              </>
            ) : (
              <>
                <div>
                  <label className="flex items-center gap-1 text-sm text-slate-700 mb-2">
                    <span className="text-red-500">*</span>
                    {t.phone}
                  </label>
                  <input
                    type="text"
                    value={phoneOtpLogin}
                    onChange={(e) => setPhoneOtpLogin(e.target.value)}
                    placeholder={language === 'zh' ? '请输入已绑定的手机号' : 'Enter bound phone number'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all text-sm"
                    required
                  />
                </div>
                {otpStep === 'enter_code' && (
                  <div>
                    <label className="flex items-center gap-1 text-sm text-slate-700 mb-2">
                      <span className="text-red-500">*</span>
                      {t.otpCode}
                    </label>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder={language === 'zh' ? '请输入短信验证码' : 'Enter SMS OTP'}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all text-sm"
                      required
                    />
                  </div>
                )}
              </>
            )}

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
                loginMethod === 'password'
                  ? t.loginButton
                  : otpStep === 'enter_phone'
                    ? t.sendOtpButton
                    : t.verifyOtpButton
              )}
            </Button>

            {enterpriseWechatAllowed && (
              <button
                type="button"
                onClick={() => void handleEnterpriseWechatLogin()}
                disabled={wechatLoading}
                className="w-full rounded-lg border border-slate-200 bg-white py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {wechatLoading
                  ? (language === 'zh' ? '跳转企业微信中...' : 'Redirecting to Enterprise WeChat...')
                  : t.enterpriseWechat}
              </button>
            )}

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

export default function AdminLogin() {
  return <AdminLoginPage fixedEntry="test" />;
}
