import type { AdminAuthIdentitySource } from '../../config/adminPortalPolicy';

export type ProvisionIdentityDraft = {
  loginEmail: string;
  primaryIdentitySource: AdminAuthIdentitySource;
  phoneLogin: string;
  wechatOpenId: string;
  enterpriseWechatUserId: string;
  whatsappAccount: string;
};

export type IdentityEditorDraft = {
  username: string;
  loginEmail: string;
  reason: string;
  approvalChecked: boolean;
  authSyncChecked: boolean;
  passwordResetChecked: boolean;
};

export type ManualPasswordEditorDraft = {
  rowId: string;
  accountId: string;
  password: string;
};

export type RoleEditorDraft = {
  rowId: string;
  code: string;
};

type LinkedAccountLike = {
  id?: string;
  username?: string;
  loginEmail?: string;
  loginPassword?: string;
};

type LinkedRowLike = {
  id: string;
  emailRaw?: string;
  phoneRaw?: string;
  wechatRaw?: string;
  linkedAccounts: LinkedAccountLike[];
};

export const EMPTY_IDENTITY_EDITOR_DRAFT: IdentityEditorDraft = {
  username: '',
  loginEmail: '',
  reason: '',
  approvalChecked: false,
  authSyncChecked: false,
  passwordResetChecked: false,
};

export const EMPTY_PROVISION_IDENTITY_DRAFT: ProvisionIdentityDraft = {
  loginEmail: '',
  primaryIdentitySource: 'email',
  phoneLogin: '',
  wechatOpenId: '',
  enterpriseWechatUserId: '',
  whatsappAccount: '',
};

export const EMPTY_MANUAL_PASSWORD_EDITOR_DRAFT: ManualPasswordEditorDraft = {
  rowId: '',
  accountId: '',
  password: '',
};

export const EMPTY_ROLE_EDITOR_DRAFT: RoleEditorDraft = {
  rowId: '',
  code: '',
};

export function buildIdentityEditorDraft<T extends LinkedRowLike>(rows: T[], rowId: string) {
  const row = rows.find((item) => item.id === rowId);
  const primaryAccount = row?.linkedAccounts[0];

  if (!row || !primaryAccount) {
    return {
      errorMessage: '请先开通账号后再变更账号标识',
      draft: null,
    };
  }

  return {
    errorMessage: '',
    draft: {
      username: primaryAccount.username || '',
      loginEmail: primaryAccount.loginEmail || row.emailRaw || '',
      reason: '',
      approvalChecked: false,
      authSyncChecked: false,
      passwordResetChecked: false,
    } satisfies IdentityEditorDraft,
  };
}

export function buildProvisionIdentityDraft<T extends LinkedRowLike>(rows: T[], rowId: string) {
  const row = rows.find((item) => item.id === rowId);
  if (!row) {
    return {
      errorMessage: '',
      infoMessage: '',
      draft: null,
    };
  }

  if (row.linkedAccounts[0]) {
    return {
      errorMessage: '',
      infoMessage: '该人员已有账号',
      draft: null,
    };
  }

  return {
    errorMessage: '',
    infoMessage: '',
    draft: {
      loginEmail: row.emailRaw || '',
      primaryIdentitySource: 'email',
      phoneLogin: row.phoneRaw || '',
      wechatOpenId: row.wechatRaw || '',
      enterpriseWechatUserId: '',
      whatsappAccount: row.wechatRaw || '',
    } satisfies ProvisionIdentityDraft,
  };
}

export function buildManualPasswordEditorDraft<T extends LinkedRowLike>(row: T | null | undefined) {
  const primaryAccount = row?.linkedAccounts[0];
  if (!row || !primaryAccount) {
    return null;
  }

  return {
    rowId: row.id,
    accountId: String(primaryAccount.id || ''),
    password: String(primaryAccount.loginPassword || '').trim(),
  } satisfies ManualPasswordEditorDraft;
}

export function buildRoleEditorDraft<T extends LinkedRowLike>(row: T | null | undefined) {
  return {
    rowId: row?.id || '',
    code: String(row?.permissionRole?.code || '').trim(),
  } satisfies RoleEditorDraft;
}
