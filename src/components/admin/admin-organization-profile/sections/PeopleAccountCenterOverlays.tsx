import React from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, RefreshCcw, X } from 'lucide-react';

import { PERMISSION_CENTER_ROLES } from '../../../../lib/services/permissionCenterService';
import {
  adminPortalPolicy,
  supportsIdentitySource,
  type AdminAuthIdentitySource,
} from '../../../../config/adminPortalPolicy';
import { INPUT, TEXTAREA } from '../sharedStyles';
import { RoleEditorModal } from './RoleEditorModal';

export function PeopleAccountCenterOverlays({
  accessDrawerOpen,
  selectedAccessRow,
  setAccessDrawerOpen,
  getAuthModeMeta,
  getAccountStatusMeta,
  getActivationStatusMeta,
  getIdentitySourceLabel,
  formatDateTime,
  openIdentityEditorForRow,
  openRoleEditorForRow,
  openProvisionEditorForRow,
  handleIssueFormalActivation,
  handleMarkIdentityVerified,
  handleFinalizeActivation,
  handleInvalidateActivationInvite,
  handleResetPassword,
  handleSetManualPassword,
  handleToggleForcePasswordReset,
  provisionEditorOpen,
  provisionEditorRowId,
  linkedRows,
  closeProvisionEditor,
  provisionIdentityDraft,
  setProvisionIdentityDraft,
  submitProvisionEditor,
  identityEditorOpen,
  closeIdentityEditor,
  identityEditorUsername,
  setIdentityEditorUsername,
  identityEditorLoginEmail,
  setIdentityEditorLoginEmail,
  identityEditorReason,
  setIdentityEditorReason,
  identityApprovalChecked,
  setIdentityApprovalChecked,
  identityAuthSyncChecked,
  setIdentityAuthSyncChecked,
  identityPasswordResetChecked,
  setIdentityPasswordResetChecked,
  submitIdentityEditor,
  manualPasswordEditorOpen,
  sortedAccessRows,
  manualPasswordEditorRowId,
  closeManualPasswordEditor,
  manualPasswordEditorValue,
  setManualPasswordEditorValue,
  submitManualPasswordEditor,
  roleEditorRowId,
  selectedRoleEditorRow,
  closeRoleEditor,
  roleEditorCode,
  setRoleEditorCode,
  permissionRoleMap,
  roleEditorUnchanged,
  saveRoleEditor,
  saving,
  roleEditorSaving,
}: {
  accessDrawerOpen: boolean;
  selectedAccessRow: any;
  setAccessDrawerOpen: (open: boolean) => void;
  getAuthModeMeta: (authMode?: string) => { label: string; className: string };
  getAccountStatusMeta: (status?: string, canLogin?: boolean) => { label: string; className: string };
  getActivationStatusMeta: (account?: any) => { label: string; className: string };
  getIdentitySourceLabel: (source?: string) => string;
  formatDateTime: (value?: string) => string;
  openIdentityEditorForRow: (rowId: string) => void;
  openRoleEditorForRow: (rowId: string) => void;
  openProvisionEditorForRow: (rowId: string) => void;
  handleIssueFormalActivation: (row: any) => Promise<void>;
  handleMarkIdentityVerified: (row: any, channel: 'email' | 'phone') => Promise<void>;
  handleFinalizeActivation: (row: any) => Promise<void>;
  handleInvalidateActivationInvite: (row: any) => Promise<void>;
  handleResetPassword: (row: any) => Promise<void>;
  handleSetManualPassword: (row: any) => Promise<void>;
  handleToggleForcePasswordReset: (row: any) => Promise<void>;
  provisionEditorOpen: boolean;
  provisionEditorRowId: string;
  linkedRows: any[];
  closeProvisionEditor: () => void;
  provisionIdentityDraft: {
    loginEmail: string;
    primaryIdentitySource: AdminAuthIdentitySource;
    phoneLogin: string;
    wechatOpenId: string;
    enterpriseWechatUserId: string;
    whatsappAccount: string;
  };
  setProvisionIdentityDraft: React.Dispatch<React.SetStateAction<{
    loginEmail: string;
    primaryIdentitySource: AdminAuthIdentitySource;
    phoneLogin: string;
    wechatOpenId: string;
    enterpriseWechatUserId: string;
    whatsappAccount: string;
  }>>;
  submitProvisionEditor: () => Promise<void>;
  identityEditorOpen: boolean;
  closeIdentityEditor: () => void;
  identityEditorUsername: string;
  setIdentityEditorUsername: (value: string) => void;
  identityEditorLoginEmail: string;
  setIdentityEditorLoginEmail: (value: string) => void;
  identityEditorReason: string;
  setIdentityEditorReason: (value: string) => void;
  identityApprovalChecked: boolean;
  setIdentityApprovalChecked: (checked: boolean) => void;
  identityAuthSyncChecked: boolean;
  setIdentityAuthSyncChecked: (checked: boolean) => void;
  identityPasswordResetChecked: boolean;
  setIdentityPasswordResetChecked: (checked: boolean) => void;
  submitIdentityEditor: () => Promise<void>;
  manualPasswordEditorOpen: boolean;
  sortedAccessRows: any[];
  manualPasswordEditorRowId: string;
  closeManualPasswordEditor: () => void;
  manualPasswordEditorValue: string;
  setManualPasswordEditorValue: (value: string) => void;
  submitManualPasswordEditor: () => Promise<void>;
  roleEditorRowId: string;
  selectedRoleEditorRow: any;
  closeRoleEditor: () => void;
  roleEditorCode: string;
  setRoleEditorCode: (code: string) => void;
  permissionRoleMap: Record<string, any>;
  roleEditorUnchanged: boolean;
  saveRoleEditor: () => Promise<void>;
  saving: boolean;
  roleEditorSaving: boolean;
}) {
  return (
    <>
      {accessDrawerOpen && selectedAccessRow && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/20 px-4 py-8 backdrop-blur-[1px]">
          <div className="w-full max-w-[530px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">账号详情</p>
                <h3 className="mt-2 text-[22px] font-semibold text-slate-900">{selectedAccessRow.name}</h3>
                <p className="mt-1 text-[13px] text-slate-500">
                  {selectedAccessRow.employeeNo} / {selectedAccessRow.department} / {selectedAccessRow.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAccessDrawerOpen(false)}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-white hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[72vh] overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-[12px] font-semibold text-slate-400">登录信息</p>
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-600">
                    <p>登录账号：平台访问账号</p>
                    <p className="mt-1">登录邮箱：{selectedAccessRow.email}</p>
                    {adminPortalPolicy.requireApprovalForIdentityChange && (
                      <p className="mt-1">变更要求：审批通过后执行，并保留审计记录。</p>
                    )}
                  </div>
                  <div className="mt-3 space-y-3 text-[13px]">
                    <div><span className="text-slate-400">登录账号</span><p className="mt-1 font-semibold text-slate-800">{selectedAccessRow.linkedAccounts[0]?.username || '未开通'}</p></div>
                    <div><span className="text-slate-400">登录邮箱</span><p className="mt-1 font-semibold text-slate-800">{selectedAccessRow.email}</p></div>
                    <div><span className="text-slate-400">账号类型</span><p className="mt-1 font-semibold text-slate-800">平台访问账号</p></div>
                    <div>
                      <span className="text-slate-400">认证轨道</span>
                      <p className="mt-1">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getAuthModeMeta(selectedAccessRow.linkedAccounts[0]?.authMode).className}`}>
                          {getAuthModeMeta(selectedAccessRow.linkedAccounts[0]?.authMode).label}
                        </span>
                      </p>
                    </div>
                    <div><span className="text-slate-400">主认证方式</span><p className="mt-1 font-semibold text-slate-800">{getIdentitySourceLabel(selectedAccessRow.linkedAccounts[0]?.primaryIdentitySource)}</p></div>
                    <div><span className="text-slate-400">区域</span><p className="mt-1 font-semibold text-slate-800">{selectedAccessRow.region}</p></div>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-[12px] font-semibold text-slate-400">安全信息</p>
                  <div className="mt-3 space-y-3 text-[13px]">
                    <div>
                      <span className="text-slate-400">账号状态</span>
                      <p className="mt-1">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getAccountStatusMeta(selectedAccessRow.linkedAccounts[0]?.accountStatus || selectedAccessRow.accountStatus, selectedAccessRow.linkedAccounts[0]?.canLogin ?? false).className}`}>
                          {getAccountStatusMeta(selectedAccessRow.linkedAccounts[0]?.accountStatus || selectedAccessRow.accountStatus, selectedAccessRow.linkedAccounts[0]?.canLogin ?? false).label}
                        </span>
                      </p>
                    </div>
                    <div><span className="text-slate-400">当前密码</span><p className="mt-1 font-semibold text-slate-800">{selectedAccessRow.linkedAccounts[0]?.loginPassword || '未设置密码'}</p></div>
                    <div><span className="text-slate-400">强制改密</span><p className="mt-1 font-semibold text-slate-800">{selectedAccessRow.linkedAccounts[0]?.forcePasswordReset ? '是' : '否'}</p></div>
                    <div>
                      <span className="text-slate-400">激活状态</span>
                      <p className="mt-1">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getActivationStatusMeta(selectedAccessRow.linkedAccounts[0]).className}`}>
                          {getActivationStatusMeta(selectedAccessRow.linkedAccounts[0]).label}
                        </span>
                      </p>
                    </div>
                    <div><span className="text-slate-400">发放时间</span><p className="mt-1 font-semibold text-slate-800">{formatDateTime(selectedAccessRow.linkedAccounts[0]?.invitedAt)}</p></div>
                    <div><span className="text-slate-400">失效时间</span><p className="mt-1 font-semibold text-slate-800">{formatDateTime(selectedAccessRow.linkedAccounts[0]?.inviteExpiresAt)}</p></div>
                    <div><span className="text-slate-400">最近发放通道</span><p className="mt-1 font-semibold text-slate-800">{getIdentitySourceLabel(selectedAccessRow.linkedAccounts[0]?.lastInviteChannel || selectedAccessRow.linkedAccounts[0]?.primaryIdentitySource)}</p></div>
                    <div><span className="text-slate-400">正式激活时间</span><p className="mt-1 font-semibold text-slate-800">{formatDateTime(selectedAccessRow.linkedAccounts[0]?.activatedAt)}</p></div>
                    <div><span className="text-slate-400">邮箱验证</span><p className="mt-1 font-semibold text-slate-800">{selectedAccessRow.linkedAccounts[0]?.emailVerified ? '已验证' : '未验证'}</p></div>
                    <div><span className="text-slate-400">手机验证</span><p className="mt-1 font-semibold text-slate-800">{selectedAccessRow.linkedAccounts[0]?.phoneVerified ? '已验证' : '未验证'}</p></div>
                    <div><span className="text-slate-400">最近登录</span><p className="mt-1 font-semibold text-slate-800">{selectedAccessRow.lastLoginAt || '—'}</p></div>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
                  <p className="text-[12px] font-semibold text-slate-400">权限信息</p>
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-[11px] text-slate-400">当前角色</p>
                      <p className="mt-1 font-semibold text-slate-800">{selectedAccessRow.permissionRole.name}</p>
                      <p className="text-[11px] text-slate-400">{selectedAccessRow.permissionRole.code}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-[11px] text-slate-400">账号数量</p>
                      <p className="mt-1 font-semibold text-slate-800">{selectedAccessRow.linkedAccounts.length || 0} 个账号</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-[11px] text-slate-400">管理备注</p>
                      <p className="mt-1 font-semibold text-slate-800">{selectedAccessRow.linkedAccounts[0]?.notes || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-4">
                <button type="button" onClick={() => openIdentityEditorForRow(selectedAccessRow.id)} className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-[12px] font-medium text-violet-700 transition-colors hover:bg-violet-100">变更账号标识</button>
                <button type="button" onClick={() => openRoleEditorForRow(selectedAccessRow.id)} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[12px] font-medium text-blue-700 transition-colors hover:bg-blue-100">更改角色</button>
                <button type="button" onClick={() => setAccessDrawerOpen(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50">关闭</button>
                <button type="button" onClick={() => openProvisionEditorForRow(selectedAccessRow.id)} className="rounded-lg bg-blue-600 px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-blue-700">开通账号</button>
                <button type="button" onClick={() => void handleIssueFormalActivation(selectedAccessRow)} className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[12px] font-medium text-sky-700 transition-colors hover:bg-sky-100">发放正式激活</button>
                <button type="button" onClick={() => void handleMarkIdentityVerified(selectedAccessRow, 'email')} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[12px] font-medium text-blue-700 transition-colors hover:bg-blue-100">标记邮箱已验证</button>
                <button type="button" onClick={() => void handleMarkIdentityVerified(selectedAccessRow, 'phone')} className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-[12px] font-medium text-cyan-700 transition-colors hover:bg-cyan-100">标记手机已验证</button>
                <button type="button" onClick={() => void handleFinalizeActivation(selectedAccessRow)} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100">完成正式激活</button>
                <button type="button" onClick={() => void handleInvalidateActivationInvite(selectedAccessRow)} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-700 transition-colors hover:bg-amber-100">使邀请失效</button>
                <button type="button" onClick={() => void handleResetPassword(selectedAccessRow)} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-600 transition-colors hover:bg-red-100">重置密码</button>
                <button type="button" onClick={() => void handleSetManualPassword(selectedAccessRow)} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-700 transition-colors hover:bg-rose-100">手动设定密码</button>
                <button type="button" onClick={() => void handleToggleForcePasswordReset(selectedAccessRow)} className="rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50">{selectedAccessRow.linkedAccounts[0]?.forcePasswordReset ? '取消强制改密' : '强制下次登录改密'}</button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {provisionEditorOpen && provisionEditorRowId && createPortal(
        <div className="fixed inset-0 z-[105] flex items-center justify-center bg-slate-950/30 px-4 py-8 backdrop-blur-[1px]">
          <div className="w-full max-w-[680px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">账号发放</p>
                <h3 className="mt-2 text-[20px] font-semibold text-slate-900">开通账号</h3>
                <p className="mt-1 text-[13px] text-slate-500">
                  {linkedRows.find((row) => row.id === provisionEditorRowId)?.name || '未选择人员'} / 当前模式 {adminPortalPolicy.authMode}
                </p>
              </div>
              <button type="button" onClick={closeProvisionEditor} className="rounded-xl border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-white hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div className="rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-3 text-[12px] text-blue-900">
                {adminPortalPolicy.authMode === 'test'
                  ? '当前为测试模式：允许直接开通测试账号，同时保留未来正式认证因子字段。'
                  : adminPortalPolicy.authMode === 'dual'
                    ? '当前为双轨模式：既可继续使用测试账号，也可按正式发布要求填写真实认证因子。'
                    : '当前为正式认证模式：建议填写真实邮箱、手机号或第三方绑定标识，并走后续验证流程。'}
              </div>
              <label className="space-y-1.5">
                <span className="text-[12px] font-medium text-slate-500">主登录方式</span>
                <div className="relative">
                  <select
                    className={`${INPUT} appearance-none pr-8`}
                    value={provisionIdentityDraft.primaryIdentitySource}
                    onChange={(event) => setProvisionIdentityDraft((current) => ({
                      ...current,
                      primaryIdentitySource: event.target.value as AdminAuthIdentitySource,
                    }))}
                  >
                    <option value="email">公司邮箱</option>
                    {supportsIdentitySource('phone') && <option value="phone">手机号 OTP</option>}
                    {supportsIdentitySource('wechat') && <option value="wechat">微信绑定</option>}
                    {supportsIdentitySource('enterprise_wechat') && <option value="enterprise_wechat">企业微信绑定</option>}
                    {supportsIdentitySource('whatsapp') && <option value="whatsapp">WhatsApp 辅助登录</option>}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </label>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-[12px] font-medium text-slate-500">登录邮箱</span>
                  <input className={INPUT} value={provisionIdentityDraft.loginEmail} onChange={(event) => setProvisionIdentityDraft((current) => ({ ...current, loginEmail: event.target.value }))} placeholder="name@cosunchina.com" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-[12px] font-medium text-slate-500">手机号</span>
                  <input className={INPUT} value={provisionIdentityDraft.phoneLogin} onChange={(event) => setProvisionIdentityDraft((current) => ({ ...current, phoneLogin: event.target.value }))} placeholder="+86 137..." />
                </label>
                <label className="space-y-1.5">
                  <span className="text-[12px] font-medium text-slate-500">微信绑定标识</span>
                  <input className={INPUT} value={provisionIdentityDraft.wechatOpenId} onChange={(event) => setProvisionIdentityDraft((current) => ({ ...current, wechatOpenId: event.target.value }))} placeholder="wechat-openid / unionid" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-[12px] font-medium text-slate-500">企业微信用户标识</span>
                  <input className={INPUT} value={provisionIdentityDraft.enterpriseWechatUserId} onChange={(event) => setProvisionIdentityDraft((current) => ({ ...current, enterpriseWechatUserId: event.target.value }))} placeholder="enterprise-wechat-userid" />
                </label>
                <label className="space-y-1.5 md:col-span-2">
                  <span className="text-[12px] font-medium text-slate-500">WhatsApp 账号</span>
                  <input className={INPUT} value={provisionIdentityDraft.whatsappAccount} onChange={(event) => setProvisionIdentityDraft((current) => ({ ...current, whatsappAccount: event.target.value }))} placeholder="+1 555... / whatsapp business account" />
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4">
              <button type="button" onClick={closeProvisionEditor} className="rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50">取消</button>
              <button type="button" onClick={() => void submitProvisionEditor()} disabled={saving} className="rounded-lg bg-blue-600 px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50">{saving ? '开通中…' : '确认开通'}</button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {identityEditorOpen && selectedAccessRow?.linkedAccounts[0] && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/30 px-4 py-8 backdrop-blur-[1px]">
          <div className="w-full max-w-[450px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">受控变更</p>
                <h3 className="mt-2 text-[20px] font-semibold text-slate-900">变更账号标识</h3>
                <p className="mt-1 text-[13px] text-slate-500">{selectedAccessRow.name} / {selectedAccessRow.employeeNo} / {selectedAccessRow.department}</p>
              </div>
              <button type="button" onClick={closeIdentityEditor} className="rounded-xl border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-white hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-[12px] text-amber-900">
                该操作按正式交付规则执行：变更需审批、需同步认证系统、联动人员邮箱，并在保存后强制改密。
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-[12px] font-medium text-slate-500">登录账号</span>
                  <input className={INPUT} value={identityEditorUsername} onChange={(event) => setIdentityEditorUsername(event.target.value)} placeholder="例如 salesmanager-na" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-[12px] font-medium text-slate-500">登录邮箱</span>
                  <input className={INPUT} value={identityEditorLoginEmail} onChange={(event) => setIdentityEditorLoginEmail(event.target.value)} placeholder="name@cosunchina.com" />
                </label>
              </div>
              <label className="space-y-1.5">
                <span className="text-[12px] font-medium text-slate-500">变更原因</span>
                <textarea className={TEXTAREA} rows={4} value={identityEditorReason} onChange={(event) => setIdentityEditorReason(event.target.value)} placeholder="请填写正式变更原因，例如：域名切换 / 员工邮箱更换 / 统一账号命名规范" />
              </label>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[12px] text-slate-700">
                <label className="flex items-start gap-2">
                  <input type="checkbox" checked={identityApprovalChecked} onChange={(event) => setIdentityApprovalChecked(event.target.checked)} />
                  <span>我确认该账号标识变更已完成审批。</span>
                </label>
                <label className="mt-2 flex items-start gap-2">
                  <input type="checkbox" checked={identityAuthSyncChecked} onChange={(event) => setIdentityAuthSyncChecked(event.target.checked)} />
                  <span>我确认需要同步 Supabase Auth / 认证系统登录邮箱。</span>
                </label>
                <label className="mt-2 flex items-start gap-2">
                  <input type="checkbox" checked={identityPasswordResetChecked} onChange={(event) => setIdentityPasswordResetChecked(event.target.checked)} />
                  <span>我确认保存后将强制该账号下次登录修改密码。</span>
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4">
              <button type="button" onClick={closeIdentityEditor} className="rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50">取消</button>
              <button type="button" onClick={() => void submitIdentityEditor()} disabled={saving} className="rounded-lg bg-violet-600 px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-50">{saving ? '保存中…' : '确认变更'}</button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {manualPasswordEditorOpen && createPortal(
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/35 px-4 py-8 backdrop-blur-[1px]">
          <div className="pointer-events-auto relative z-10 w-full max-w-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">受控变更</p>
                <h3 className="mt-2 text-[20px] font-semibold text-slate-900">手动设定密码</h3>
                <p className="mt-1 text-[13px] text-slate-500">{sortedAccessRows.find((row) => row.id === manualPasswordEditorRowId)?.name || '未选择账号'}</p>
              </div>
              <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); closeManualPasswordEditor(); }} className="rounded-xl border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-white hover:text-slate-700" disabled={saving}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div className="rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-[12px] text-rose-900">该操作只会改当前账号密码，并以账号与访问为唯一登录源同步。</div>
              <label className="space-y-1.5">
                <span className="text-[12px] font-medium text-slate-500">新密码</span>
                <input className={INPUT} value={manualPasswordEditorValue} onChange={(event) => setManualPasswordEditorValue(event.target.value)} placeholder="请输入要设置的密码" autoFocus />
              </label>
            </div>
            <div className="relative z-20 flex items-center justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4">
              <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); closeManualPasswordEditor(); }} className="rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50" disabled={saving}>取消</button>
              <button type="button" onMouseDown={(event) => { event.preventDefault(); event.stopPropagation(); }} onClick={(event) => { event.preventDefault(); event.stopPropagation(); void submitManualPasswordEditor(); }} disabled={saving} className="cursor-pointer rounded-lg bg-rose-600 px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50">{saving ? '保存中…' : '确认保存'}</button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      <RoleEditorModal
        open={Boolean(roleEditorRowId)}
        row={selectedRoleEditorRow}
        roleCode={roleEditorCode}
        permissionRoleMap={permissionRoleMap}
        roleUnchanged={roleEditorUnchanged}
        saving={roleEditorSaving}
        onChangeRoleCode={setRoleEditorCode}
        onClose={closeRoleEditor}
        onSave={saveRoleEditor}
      />
    </>
  );
}
