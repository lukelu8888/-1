import { runtimeStagePolicy } from './runtime/runtimeStage';

export const PRIMARY_ADMIN_LOGIN_EMAIL = 'admin@cosunchina.com';
export type AdminAuthMode = 'test' | 'dual' | 'production';
export type AdminAuthIdentitySource = 'email' | 'phone' | 'wechat' | 'enterprise_wechat' | 'whatsapp';

function resolvePolicyFlag(envKey: string, fallback: boolean) {
  const explicit = runtimeStagePolicy.readBooleanEnv(import.meta.env[envKey]);
  return explicit ?? fallback;
}

function resolveAuthMode(): AdminAuthMode {
  const explicitMode = String(import.meta.env.VITE_ADMIN_AUTH_MODE || '').trim().toLowerCase();
  if (explicitMode === 'production') return 'production';
  if (explicitMode === 'dual') return 'dual';
  if (explicitMode === 'test' || explicitMode === 'testing') return 'test';
  return runtimeStagePolicy.isProductionLike ? 'production' : 'test';
}

const defaultTestingFlag = !runtimeStagePolicy.isProductionLike;
const adminAuthMode = resolveAuthMode();

export const adminPortalPolicy = {
  runtimeStage: runtimeStagePolicy.stage,
  authMode: adminAuthMode,
  enableAdminMasterLogin: resolvePolicyFlag('VITE_ENABLE_ADMIN_MASTER_LOGIN', defaultTestingFlag),
  enableRoleSwitcher: resolvePolicyFlag('VITE_ENABLE_ROLE_SWITCHER', defaultTestingFlag),
  enableImpersonationAudit: resolvePolicyFlag('VITE_ENABLE_IMPERSONATION_AUDIT', true),
  allowLocalPasswordFallback: resolvePolicyFlag('VITE_ALLOW_LOCAL_ADMIN_PASSWORD_FALLBACK', defaultTestingFlag),
  lockInternalAccountUsername: resolvePolicyFlag('VITE_LOCK_INTERNAL_ACCOUNT_USERNAME', true),
  lockInternalAccountLoginEmail: resolvePolicyFlag('VITE_LOCK_INTERNAL_ACCOUNT_LOGIN_EMAIL', true),
  requireApprovalForIdentityChange: resolvePolicyFlag('VITE_REQUIRE_ACCOUNT_IDENTITY_CHANGE_APPROVAL', true),
  requireAuthSyncForIdentityChange: resolvePolicyFlag('VITE_REQUIRE_ACCOUNT_IDENTITY_AUTH_SYNC', true),
  requirePasswordResetAfterIdentityChange: resolvePolicyFlag('VITE_REQUIRE_ACCOUNT_IDENTITY_PASSWORD_RESET', true),
  allowTestAccounts: resolvePolicyFlag('VITE_ALLOW_TEST_ACCOUNTS', adminAuthMode !== 'production'),
  requireVerifiedEmailForProductionLogin: resolvePolicyFlag('VITE_REQUIRE_VERIFIED_EMAIL_FOR_PRODUCTION_LOGIN', adminAuthMode === 'production'),
  requireVerifiedPhoneForProductionLogin: resolvePolicyFlag('VITE_REQUIRE_VERIFIED_PHONE_FOR_PRODUCTION_LOGIN', false),
  enableRealEmailActivation: resolvePolicyFlag('VITE_ENABLE_REAL_EMAIL_ACTIVATION', adminAuthMode !== 'test'),
  enablePhoneOtpLogin: resolvePolicyFlag('VITE_ENABLE_PHONE_OTP_LOGIN', adminAuthMode !== 'test'),
  enableWechatLogin: resolvePolicyFlag('VITE_ENABLE_WECHAT_LOGIN', false),
  enableEnterpriseWechatLogin: resolvePolicyFlag('VITE_ENABLE_ENTERPRISE_WECHAT_LOGIN', false),
  enableWhatsappAssistLogin: resolvePolicyFlag('VITE_ENABLE_WHATSAPP_ASSIST_LOGIN', false),
  supportedIdentitySources: (
    [
      'email',
      ...(resolvePolicyFlag('VITE_ENABLE_PHONE_OTP_LOGIN', adminAuthMode !== 'test') ? ['phone'] as const : []),
      ...(resolvePolicyFlag('VITE_ENABLE_WECHAT_LOGIN', false) ? ['wechat'] as const : []),
      ...(resolvePolicyFlag('VITE_ENABLE_ENTERPRISE_WECHAT_LOGIN', false) ? ['enterprise_wechat'] as const : []),
      ...(resolvePolicyFlag('VITE_ENABLE_WHATSAPP_ASSIST_LOGIN', false) ? ['whatsapp'] as const : []),
    ]
  ) as AdminAuthIdentitySource[],
  showAdminQuickLogin: import.meta.env.DEV && resolvePolicyFlag('VITE_ENABLE_ADMIN_MASTER_LOGIN', defaultTestingFlag),
} as const;

export function getAdminAuthMode() {
  return adminPortalPolicy.authMode;
}

export function isProductionAuthMode() {
  return adminPortalPolicy.authMode === 'production';
}

export function isDualAuthMode() {
  return adminPortalPolicy.authMode === 'dual';
}

export function canUseTestAccounts() {
  return adminPortalPolicy.allowTestAccounts;
}

export function supportsIdentitySource(source: AdminAuthIdentitySource) {
  return adminPortalPolicy.supportedIdentitySources.includes(source);
}

export function canUseAdminMasterLogin() {
  return adminPortalPolicy.enableAdminMasterLogin;
}

export function canUseRoleSwitcher() {
  return adminPortalPolicy.enableRoleSwitcher;
}

export function canUseRoleSwitcherForUser(email?: string | null) {
  if (!adminPortalPolicy.enableRoleSwitcher) return false;
  return String(email || '').trim().toLowerCase() === PRIMARY_ADMIN_LOGIN_EMAIL;
}

export function shouldAuditImpersonation() {
  return adminPortalPolicy.enableImpersonationAudit;
}

export function canUseLocalAdminPasswordFallback() {
  return adminPortalPolicy.allowLocalPasswordFallback;
}

export function isInternalAccountUsernameLocked() {
  return adminPortalPolicy.lockInternalAccountUsername;
}

export function isInternalAccountLoginEmailLocked() {
  return adminPortalPolicy.lockInternalAccountLoginEmail;
}

export function getTestAdminLoginPage() {
  return 'admin-login';
}

export function getFormalAdminLoginPage() {
  return 'admin-formal-login';
}

export function getDefaultAdminLoginPage() {
  return adminPortalPolicy.authMode === 'production' ? getFormalAdminLoginPage() : getTestAdminLoginPage();
}

export function getProtectedAdminLoginPage() {
  return adminPortalPolicy.authMode === 'test' ? getTestAdminLoginPage() : getFormalAdminLoginPage();
}
