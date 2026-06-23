import React from 'react';
import { RefreshCcw } from 'lucide-react';

type AccessRow = {
  id: string;
  linkedAccounts: Array<{
    id: string;
  }>;
};

type IdentityAuditRecord = {
  id: string;
  employeeId?: string | null;
  accountId?: string | null;
  employeeName?: string | null;
  employeeNo?: string | null;
  changedAt: string;
  previousUsername?: string | null;
  nextUsername?: string | null;
  previousLoginEmail?: string | null;
  nextLoginEmail?: string | null;
  authSyncRequired: boolean;
  passwordResetRequired: boolean;
  actorName?: string | null;
  actorEmail?: string | null;
  reason?: string | null;
};

type PasswordAuditRecord = {
  id: string;
  employeeId?: string | null;
  accountId?: string | null;
  employeeName?: string | null;
  employeeNo?: string | null;
  changedAt: string;
  username?: string | null;
  loginEmail?: string | null;
  action: 'manual_set' | 'reset';
  forcePasswordReset: boolean;
  actorName?: string | null;
  actorEmail?: string | null;
  reason?: string | null;
};

type PeopleAccountAccessAuditPanelsProps = {
  selectedAccessRow: AccessRow | null;
  selectedAccessAuditRecords: IdentityAuditRecord[];
  selectedAccessPasswordAuditRecords: PasswordAuditRecord[];
  identityAuditRecords: IdentityAuditRecord[];
  passwordAuditRecords: PasswordAuditRecord[];
  identityAuditLoading: boolean;
  passwordAuditLoading: boolean;
  loadIdentityAuditRecords: () => Promise<void>;
  loadPasswordAuditRecords: () => Promise<void>;
  formatDateTime: (value?: string | null) => string;
};

export function PeopleAccountAccessAuditPanels({
  selectedAccessRow,
  selectedAccessAuditRecords,
  selectedAccessPasswordAuditRecords,
  identityAuditRecords,
  passwordAuditRecords,
  identityAuditLoading,
  passwordAuditLoading,
  loadIdentityAuditRecords,
  loadPasswordAuditRecords,
  formatDateTime,
}: PeopleAccountAccessAuditPanelsProps) {
  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-[13px] font-semibold text-slate-900">账号标识变更审计</p>
            <p className="mt-1 text-[12px] text-slate-500">
              展示最近 12 条账号 / 邮箱变更记录，便于交付后核对审批、Auth 同步和强制改密执行情况。
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedAccessRow && selectedAccessAuditRecords.length > 0 && (
              <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-700">
                当前人员 {selectedAccessAuditRecords.length} 条
              </span>
            )}
            <button
              type="button"
              onClick={() => void loadIdentityAuditRecords()}
              disabled={identityAuditLoading}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${identityAuditLoading ? 'animate-spin' : ''}`} />
              {identityAuditLoading ? '刷新中…' : '刷新记录'}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 border-b border-slate-100 px-4 py-3 md:grid-cols-3">
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-[11px] text-slate-400">最近变更总数</p>
            <p className="mt-1 text-[18px] font-semibold text-slate-900">{identityAuditRecords.length}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-[11px] text-slate-400">要求同步 Auth</p>
            <p className="mt-1 text-[18px] font-semibold text-slate-900">
              {identityAuditRecords.filter((record) => record.authSyncRequired).length}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-[11px] text-slate-400">要求强制改密</p>
            <p className="mt-1 text-[18px] font-semibold text-slate-900">
              {identityAuditRecords.filter((record) => record.passwordResetRequired).length}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] table-fixed border-collapse text-[12px]">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="border-b border-slate-200 px-4 py-2 text-left font-semibold text-slate-600">变更时间</th>
                <th className="border-b border-slate-200 px-4 py-2 text-left font-semibold text-slate-600">人员</th>
                <th className="border-b border-slate-200 px-4 py-2 text-left font-semibold text-slate-600">账号变更</th>
                <th className="border-b border-slate-200 px-4 py-2 text-left font-semibold text-slate-600">邮箱变更</th>
                <th className="border-b border-slate-200 px-4 py-2 text-left font-semibold text-slate-600">变更要求</th>
                <th className="border-b border-slate-200 px-4 py-2 text-left font-semibold text-slate-600">操作人</th>
                <th className="border-b border-slate-200 px-4 py-2 text-left font-semibold text-slate-600">原因</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {identityAuditRecords.map((record) => {
                const isCurrentRow = Boolean(
                  selectedAccessRow && (
                    record.employeeId === selectedAccessRow.id ||
                    record.accountId === selectedAccessRow.linkedAccounts[0]?.id
                  )
                );

                return (
                  <tr
                    key={record.id}
                    className={isCurrentRow ? 'bg-violet-50/40' : 'odd:bg-white even:bg-slate-50/30'}
                  >
                    <td className="border-b border-slate-100 px-4 py-3 align-top text-slate-600">
                      {formatDateTime(record.changedAt)}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 align-top">
                      <p className="font-semibold text-slate-800">{record.employeeName || '未命名人员'}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {record.employeeNo || '未设工号'}
                        {record.employeeId ? ` / ${record.employeeId}` : ''}
                      </p>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 align-top text-slate-600">
                      <p className="font-medium text-slate-700">{record.previousUsername || '—'}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">→ {record.nextUsername || '—'}</p>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 align-top text-slate-600">
                      <p className="font-medium text-slate-700">{record.previousLoginEmail || '—'}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">→ {record.nextLoginEmail || '—'}</p>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 align-top">
                      <div className="flex flex-wrap gap-1.5">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                          record.authSyncRequired
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-slate-50 text-slate-500'
                        }`}>
                          {record.authSyncRequired ? '同步 Auth' : '未要求同步'}
                        </span>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                          record.passwordResetRequired
                            ? 'border-amber-200 bg-amber-50 text-amber-700'
                            : 'border-slate-200 bg-slate-50 text-slate-500'
                        }`}>
                          {record.passwordResetRequired ? '强制改密' : '未要求改密'}
                        </span>
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 align-top text-slate-600">
                      <p className="font-medium text-slate-700">{record.actorName || '系统管理员'}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">{record.actorEmail || '—'}</p>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 align-top text-slate-600">
                      <p className="line-clamp-2 leading-5">{record.reason || '—'}</p>
                    </td>
                  </tr>
                );
              })}
              {!identityAuditLoading && identityAuditRecords.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[12px] text-slate-400">
                    暂无账号标识变更审计记录
                  </td>
                </tr>
              )}
              {identityAuditLoading && identityAuditRecords.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[12px] text-slate-400">
                    正在加载审计记录…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-[13px] font-semibold text-slate-900">密码变更审计</p>
            <p className="mt-1 text-[12px] text-slate-500">
              仅记录人工触发的密码动作，区分“重置密码”和“手动设定密码”，用于核对是否存在非人工变更。
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedAccessRow && selectedAccessPasswordAuditRecords.length > 0 && (
              <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700">
                当前人员 {selectedAccessPasswordAuditRecords.length} 条
              </span>
            )}
            <button
              type="button"
              onClick={() => void loadPasswordAuditRecords()}
              disabled={passwordAuditLoading}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${passwordAuditLoading ? 'animate-spin' : ''}`} />
              {passwordAuditLoading ? '刷新中…' : '刷新记录'}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 border-b border-slate-100 px-4 py-3 md:grid-cols-3">
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-[11px] text-slate-400">最近变更总数</p>
            <p className="mt-1 text-[18px] font-semibold text-slate-900">{passwordAuditRecords.length}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-[11px] text-slate-400">手动设定</p>
            <p className="mt-1 text-[18px] font-semibold text-slate-900">
              {passwordAuditRecords.filter((record) => record.action === 'manual_set').length}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-[11px] text-slate-400">重置密码</p>
            <p className="mt-1 text-[18px] font-semibold text-slate-900">
              {passwordAuditRecords.filter((record) => record.action === 'reset').length}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] table-fixed border-collapse text-[12px]">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="border-b border-slate-200 px-4 py-2 text-left font-semibold text-slate-600">变更时间</th>
                <th className="border-b border-slate-200 px-4 py-2 text-left font-semibold text-slate-600">人员</th>
                <th className="border-b border-slate-200 px-4 py-2 text-left font-semibold text-slate-600">账号</th>
                <th className="border-b border-slate-200 px-4 py-2 text-left font-semibold text-slate-600">动作</th>
                <th className="border-b border-slate-200 px-4 py-2 text-left font-semibold text-slate-600">强制改密</th>
                <th className="border-b border-slate-200 px-4 py-2 text-left font-semibold text-slate-600">操作人</th>
                <th className="border-b border-slate-200 px-4 py-2 text-left font-semibold text-slate-600">说明</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {passwordAuditRecords.map((record) => {
                const isCurrentRow = Boolean(
                  selectedAccessRow && (
                    record.employeeId === selectedAccessRow.id ||
                    record.accountId === selectedAccessRow.linkedAccounts[0]?.id
                  )
                );

                return (
                  <tr
                    key={record.id}
                    className={isCurrentRow ? 'bg-rose-50/40' : 'odd:bg-white even:bg-slate-50/30'}
                  >
                    <td className="border-b border-slate-100 px-4 py-3 align-top text-slate-600">
                      {formatDateTime(record.changedAt)}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 align-top">
                      <p className="font-semibold text-slate-800">{record.employeeName || '未命名人员'}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {record.employeeNo || '未设工号'}
                        {record.employeeId ? ` / ${record.employeeId}` : ''}
                      </p>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 align-top text-slate-600">
                      <p className="font-medium text-slate-700">{record.username || '—'}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">{record.loginEmail || '—'}</p>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 align-top">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                        record.action === 'manual_set'
                          ? 'border-rose-200 bg-rose-50 text-rose-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                      }`}>
                        {record.action === 'manual_set' ? '手动设定密码' : '重置密码'}
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 align-top">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                        record.forcePasswordReset
                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                          : 'border-slate-200 bg-slate-50 text-slate-500'
                      }`}>
                        {record.forcePasswordReset ? '是' : '否'}
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 align-top text-slate-600">
                      <p className="font-medium text-slate-700">{record.actorName || '系统管理员'}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">{record.actorEmail || '—'}</p>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 align-top text-slate-600">
                      <p className="line-clamp-2 leading-5">{record.reason || '—'}</p>
                    </td>
                  </tr>
                );
              })}
              {!passwordAuditLoading && passwordAuditRecords.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[12px] text-slate-400">
                    暂无密码变更审计记录
                  </td>
                </tr>
              )}
              {passwordAuditLoading && passwordAuditRecords.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[12px] text-slate-400">
                    正在加载密码审计记录…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
