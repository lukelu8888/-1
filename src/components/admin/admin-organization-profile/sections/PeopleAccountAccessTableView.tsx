import React, { useState } from 'react';
import { Check, ChevronDown, Copy, Search } from 'lucide-react';

type AccessSortKey = 'name' | 'employeeNo' | 'department' | 'title' | 'region' | 'email' | 'role' | 'lastLoginAt';
type AccessColumnKey = 'name' | 'employeeNo' | 'department' | 'title' | 'region' | 'username' | 'email' | 'accountStatus' | 'security' | 'role' | 'lastLoginAt' | 'actions';

type AccessAccount = {
  id: string;
  username?: string;
  accountStatus?: string;
  canLogin?: boolean;
  authMode?: string;
  forcePasswordReset?: boolean;
  loginPassword?: string;
  primaryIdentitySource?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  inviteExpiresAt?: string;
};

type AccessRole = {
  name: string;
  code: string;
};

type AccessRow = {
  id: string;
  name: string;
  employeeNo: string;
  department: string;
  title: string;
  region: string;
  email: string;
  accountStatus: string;
  lastLoginAt?: string;
  linkedAccounts: AccessAccount[];
  permissionRole: AccessRole;
};

type StatusMeta = {
  label: string;
  className: string;
};

type PeopleAccountAccessTableViewProps = {
  accessSearch: string;
  setAccessSearch: (value: string) => void;
  accessDepartmentFilter: string;
  setAccessDepartmentFilter: (value: string) => void;
  accessDepartmentOptions: string[];
  accessRegionFilter: string;
  setAccessRegionFilter: (value: string) => void;
  accessRegionOptions: string[];
  accessStatusFilter: string;
  setAccessStatusFilter: (value: string) => void;
  filteredInviteActionRows: AccessRow[];
  filteredActivatedRows: AccessRow[];
  handleBatchResendActivation: () => Promise<void>;
  handleBatchInvalidateActivation: () => Promise<void>;
  handleExportActivationList: () => void;
  accessTableContainerRef: React.RefObject<HTMLDivElement | null>;
  accessTableMinWidth: number;
  getAccessColumnStyle: (key: AccessColumnKey) => React.CSSProperties;
  toggleAccessSort: (key: AccessSortKey) => void;
  renderAccessSortIcon: (key: AccessSortKey) => React.ReactNode;
  renderAccessColumnResizeHandle: (key: AccessColumnKey) => React.ReactNode;
  sortedAccessRows: AccessRow[];
  selectedAccessRow: AccessRow | null;
  setSelectedAccessRowId: (id: string) => void;
  setAccessDrawerOpen: (open: boolean) => void;
  getAccountStatusMeta: (status: string, canLogin: boolean) => StatusMeta;
  getAuthModeMeta: (authMode?: string) => StatusMeta;
  getActivationStatusMeta: (account?: AccessAccount) => StatusMeta;
  getIdentitySourceLabel: (source?: string) => string;
  formatDateTime: (value?: string | null) => string;
  openIdentityEditorForRow: (rowId: string) => void;
  openRoleEditorForRow: (rowId: string) => void;
  handleToggleAccountStatus: (row: AccessRow) => Promise<void>;
  onAutoResetAccountPassword: (accountId: string) => Promise<void>;
  handleToggleForcePasswordReset: (row: AccessRow) => Promise<void>;
  openProvisionEditorForRow: (rowId: string) => void;
  isInternalAccountUsernameLocked: () => boolean;
  isInternalAccountLoginEmailLocked: () => boolean;
};

export function PeopleAccountAccessTableView({
  accessSearch,
  setAccessSearch,
  accessDepartmentFilter,
  setAccessDepartmentFilter,
  accessDepartmentOptions,
  accessRegionFilter,
  setAccessRegionFilter,
  accessRegionOptions,
  accessStatusFilter,
  setAccessStatusFilter,
  filteredInviteActionRows,
  filteredActivatedRows,
  handleBatchResendActivation,
  handleBatchInvalidateActivation,
  handleExportActivationList,
  accessTableContainerRef,
  accessTableMinWidth,
  getAccessColumnStyle,
  toggleAccessSort,
  renderAccessSortIcon,
  renderAccessColumnResizeHandle,
  sortedAccessRows,
  selectedAccessRow,
  setSelectedAccessRowId,
  setAccessDrawerOpen,
  getAccountStatusMeta,
  getAuthModeMeta,
  getActivationStatusMeta,
  getIdentitySourceLabel,
  formatDateTime,
  openIdentityEditorForRow,
  openRoleEditorForRow,
  handleToggleAccountStatus,
  onAutoResetAccountPassword,
  handleToggleForcePasswordReset,
  openProvisionEditorForRow,
  isInternalAccountUsernameLocked,
  isInternalAccountLoginEmailLocked,
}: PeopleAccountAccessTableViewProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const getFluidAccessColumnStyle = (key: AccessColumnKey) => {
    const width = Number.parseFloat(String(getAccessColumnStyle(key).width || 0));
    const safeTotal = Math.max(accessTableMinWidth, 1);
    return { width: `${(width / safeTotal) * 100}%` };
  };

  const handleCopy = async (value: string, key: string) => {
    const text = String(value || '').trim();
    if (!text || text === '未设置密码' || text === '未开通') return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current));
      }, 1500);
    } catch (error) {
      console.warn('[PeopleAccountAccessTableView] copy failed:', error);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-[240px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5">
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <input
            value={accessSearch}
            onChange={(event) => setAccessSearch(event.target.value)}
            className="w-full bg-transparent text-[11px] text-slate-700 outline-none placeholder:text-slate-400"
            placeholder="搜索姓名 / 工号 / 邮箱 / 部门"
          />
        </div>
        <div className="relative">
          <select
            value={accessDepartmentFilter}
            onChange={(event) => setAccessDepartmentFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 pr-8 text-[11px] text-slate-600 outline-none transition-colors hover:border-slate-300 focus:border-red-300"
          >
            <option value="all">部门筛选</option>
            {accessDepartmentOptions.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        </div>
        <div className="relative">
          <select
            value={accessRegionFilter}
            onChange={(event) => setAccessRegionFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 pr-8 text-[11px] text-slate-600 outline-none transition-colors hover:border-slate-300 focus:border-red-300"
          >
            <option value="all">区域筛选</option>
            {accessRegionOptions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        </div>
        <div className="relative">
          <select
            value={accessStatusFilter}
            onChange={(event) => setAccessStatusFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 pr-8 text-[11px] text-slate-600 outline-none transition-colors hover:border-slate-300 focus:border-red-300"
          >
            <option value="all">账号状态筛选</option>
            <option value="active">已启用</option>
            <option value="disabled">已停用</option>
            <option value="locked">已锁定</option>
            <option value="pending_activation">待激活</option>
            <option value="expiring">即将过期</option>
            <option value="expired">已过期</option>
            <option value="activated">已激活</option>
            <option value="未开通">未开通</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-slate-400">
            当前可批量处理 {filteredInviteActionRows.length} 个待处理正式账号
          </span>
          <button
            type="button"
            onClick={() => void handleBatchResendActivation()}
            disabled={!filteredInviteActionRows.length}
            className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-[11px] font-medium text-sky-700 transition-colors hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            批量重发激活
          </button>
          <button
            type="button"
            onClick={() => void handleBatchInvalidateActivation()}
            disabled={!filteredInviteActionRows.length}
            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            批量使邀请失效
          </button>
          <button
            type="button"
            onClick={handleExportActivationList}
            disabled={!filteredInviteActionRows.length && !filteredActivatedRows.length}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            导出名单
          </button>
        </div>
      </div>

      <div
        ref={accessTableContainerRef}
        className="overflow-x-hidden rounded-xl border border-slate-200 bg-white"
      >
        <table className="w-full table-fixed border-collapse text-[11px]">
          <colgroup>
            <col style={getFluidAccessColumnStyle('name')} />
            <col style={getFluidAccessColumnStyle('employeeNo')} />
            <col style={getFluidAccessColumnStyle('department')} />
            <col style={getFluidAccessColumnStyle('title')} />
            <col style={getFluidAccessColumnStyle('region')} />
            <col style={getFluidAccessColumnStyle('username')} />
            <col style={getFluidAccessColumnStyle('email')} />
            <col style={getFluidAccessColumnStyle('accountStatus')} />
            <col style={getFluidAccessColumnStyle('security')} />
            <col style={getFluidAccessColumnStyle('role')} />
            <col style={getFluidAccessColumnStyle('lastLoginAt')} />
            <col style={getFluidAccessColumnStyle('actions')} />
          </colgroup>
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th style={getFluidAccessColumnStyle('name')} className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left">
                <button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => toggleAccessSort('name')}>
                  姓名 {renderAccessSortIcon('name')}
                </button>
                {renderAccessColumnResizeHandle('name')}
              </th>
              <th style={getFluidAccessColumnStyle('employeeNo')} className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left">
                <button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => toggleAccessSort('employeeNo')}>
                  工号 {renderAccessSortIcon('employeeNo')}
                </button>
                {renderAccessColumnResizeHandle('employeeNo')}
              </th>
              <th style={getFluidAccessColumnStyle('department')} className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left">
                <button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => toggleAccessSort('department')}>
                  部门 {renderAccessSortIcon('department')}
                </button>
                {renderAccessColumnResizeHandle('department')}
              </th>
              <th style={getFluidAccessColumnStyle('title')} className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left">
                <button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => toggleAccessSort('title')}>
                  岗位 {renderAccessSortIcon('title')}
                </button>
                {renderAccessColumnResizeHandle('title')}
              </th>
              <th style={getFluidAccessColumnStyle('region')} className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left">
                <button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => toggleAccessSort('region')}>
                  区域 {renderAccessSortIcon('region')}
                </button>
                {renderAccessColumnResizeHandle('region')}
              </th>
              <th style={getFluidAccessColumnStyle('username')} className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left">
                <span className="font-semibold text-slate-600">登录账号</span>
                {renderAccessColumnResizeHandle('username')}
              </th>
              <th style={getFluidAccessColumnStyle('email')} className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left">
                <button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => toggleAccessSort('email')}>
                  登录邮箱 {renderAccessSortIcon('email')}
                </button>
                {renderAccessColumnResizeHandle('email')}
              </th>
              <th style={getFluidAccessColumnStyle('accountStatus')} className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left">
                <span className="font-semibold text-slate-600">账号状态</span>
                {renderAccessColumnResizeHandle('accountStatus')}
              </th>
              <th style={getFluidAccessColumnStyle('security')} className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left">
                <span className="font-semibold text-slate-600">安全摘要</span>
                {renderAccessColumnResizeHandle('security')}
              </th>
              <th style={getFluidAccessColumnStyle('role')} className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left">
                <button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => toggleAccessSort('role')}>
                  角色摘要 {renderAccessSortIcon('role')}
                </button>
                {renderAccessColumnResizeHandle('role')}
              </th>
              <th style={getFluidAccessColumnStyle('lastLoginAt')} className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left">
                <button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => toggleAccessSort('lastLoginAt')}>
                  最近登录 {renderAccessSortIcon('lastLoginAt')}
                </button>
                {renderAccessColumnResizeHandle('lastLoginAt')}
              </th>
              <th style={getFluidAccessColumnStyle('actions')} className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left">
                <span className="font-semibold text-slate-600">操作</span>
                {renderAccessColumnResizeHandle('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {sortedAccessRows.map((row) => {
              const primaryAccount = row.linkedAccounts[0];
              const accountStatusMeta = getAccountStatusMeta(primaryAccount?.accountStatus || row.accountStatus, primaryAccount?.canLogin ?? false);
              const authModeMeta = getAuthModeMeta(primaryAccount?.authMode);
              const activationStatusMeta = getActivationStatusMeta(primaryAccount);
              const securityPassword = primaryAccount?.loginPassword || '未设置密码';
              const securitySummary = primaryAccount
                ? `${primaryAccount.forcePasswordReset ? '下次改密' : '密码正常'}`
                : '未开通';

              return (
                <tr
                  key={row.id}
                  className={`cursor-pointer transition-colors ${selectedAccessRow?.id === row.id ? 'bg-red-50/40' : 'odd:bg-white even:bg-slate-50/35 hover:bg-slate-50'}`}
                  onClick={() => {
                    setSelectedAccessRowId(row.id);
                    setAccessDrawerOpen(true);
                  }}
                >
                  <td style={getFluidAccessColumnStyle('name')} className="border-b border-slate-100 px-2.5 py-1 align-top">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="block truncate font-semibold text-slate-800">{row.name}</span>
                    </div>
                  </td>
                  <td style={getFluidAccessColumnStyle('employeeNo')} className="border-b border-slate-100 px-2.5 py-1 align-top text-slate-600">{row.employeeNo}</td>
                  <td style={getFluidAccessColumnStyle('department')} className="border-b border-slate-100 px-2.5 py-1 align-top text-slate-600">{row.department}</td>
                  <td style={getFluidAccessColumnStyle('title')} className="border-b border-slate-100 px-2.5 py-1 align-top text-slate-600">{row.title}</td>
                  <td style={getFluidAccessColumnStyle('region')} className="border-b border-slate-100 px-2.5 py-1 align-top text-slate-600">{row.region}</td>
                  <td style={getFluidAccessColumnStyle('username')} className="border-b border-slate-100 px-2.5 py-1 align-top font-semibold text-slate-800">
                    <span className="block truncate">{primaryAccount?.username || '未开通'}</span>
                    {primaryAccount && (
                      <span className={`mt-0.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold ${authModeMeta.className}`}>
                        {authModeMeta.label}
                      </span>
                    )}
                  </td>
                  <td style={getFluidAccessColumnStyle('email')} className="border-b border-slate-100 px-2.5 py-1 align-top text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="block min-w-0 flex-1 truncate">{row.email}</span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleCopy(row.email, `email-${row.id}`);
                        }}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                        title={copiedKey === `email-${row.id}` ? '已复制' : '复制邮箱'}
                        aria-label={copiedKey === `email-${row.id}` ? '已复制邮箱' : '复制邮箱'}
                      >
                        {copiedKey === `email-${row.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </td>
                  <td style={getFluidAccessColumnStyle('accountStatus')} className="border-b border-slate-100 px-2.5 py-1 align-top">
                    <div className="space-y-1">
                      <span className={`inline-flex whitespace-nowrap items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${accountStatusMeta.className}`}>
                        {accountStatusMeta.label}
                      </span>
                      {primaryAccount && (
                        <span className={`inline-flex whitespace-nowrap items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold ${activationStatusMeta.className}`}>
                          {activationStatusMeta.label}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={getFluidAccessColumnStyle('security')} className="border-b border-slate-100 px-2.5 py-1 align-top">
                    <div className="space-y-0">
                      <p className="truncate text-[11px] font-medium text-slate-700">{securitySummary}</p>
                      <div className="flex items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-[10px] text-slate-400">{securityPassword}</p>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleCopy(securityPassword, `password-${row.id}`);
                          }}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                          title={copiedKey === `password-${row.id}` ? '已复制' : '复制密码'}
                          aria-label={copiedKey === `password-${row.id}` ? '已复制密码' : '复制密码'}
                        >
                          {copiedKey === `password-${row.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      {primaryAccount && (
                        <p className="line-clamp-2 text-[10px] leading-4 text-slate-400">
                          主认证：{getIdentitySourceLabel(primaryAccount.primaryIdentitySource)}
                          {primaryAccount.primaryIdentitySource === 'email' ? ` / ${primaryAccount.emailVerified ? '邮箱已验' : '邮箱未验'}` : ''}
                          {primaryAccount.primaryIdentitySource === 'phone' ? ` / ${primaryAccount.phoneVerified ? '手机已验' : '手机未验'}` : ''}
                          {primaryAccount.inviteExpiresAt ? ` / 邀请至 ${formatDateTime(primaryAccount.inviteExpiresAt)}` : ''}
                        </p>
                      )}
                    </div>
                  </td>
                  <td style={getFluidAccessColumnStyle('role')} className="border-b border-slate-100 px-2.5 py-1 align-top">
                    <div className="space-y-0">
                      <span className="inline-flex whitespace-nowrap items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                        {row.permissionRole.name}
                      </span>
                      <p className="truncate text-[10px] text-slate-400">{row.permissionRole.code}</p>
                    </div>
                  </td>
                  <td style={getFluidAccessColumnStyle('lastLoginAt')} className="border-b border-slate-100 px-2.5 py-1 align-top text-[10px] text-slate-600">
                    {row.lastLoginAt || '—'}
                  </td>
                  <td style={getFluidAccessColumnStyle('actions')} className="border-b border-slate-100 px-2.5 py-1 align-top">
                    <div className="flex flex-wrap items-center gap-1.5" onClick={(event) => event.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAccessRowId(row.id);
                          setAccessDrawerOpen(true);
                        }}
                        className="rounded-full border border-slate-200 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
                      >
                        详情
                      </button>
                      <button
                        type="button"
                        onClick={() => openIdentityEditorForRow(row.id)}
                        className="rounded-full border border-violet-200 px-2.5 py-0.5 text-[11px] font-medium text-violet-700 transition-colors hover:bg-violet-50"
                      >
                        变更账号标识
                      </button>
                      <button
                        type="button"
                        onClick={() => openRoleEditorForRow(row.id)}
                        className="rounded-full border border-blue-200 px-2.5 py-0.5 text-[11px] font-medium text-blue-600 transition-colors hover:bg-blue-50"
                      >
                        更改角色
                      </button>
                      {primaryAccount ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void handleToggleAccountStatus(row)}
                            className="rounded-full border border-amber-200 px-2.5 py-0.5 text-[11px] font-medium text-amber-600 transition-colors hover:bg-amber-50"
                          >
                            {primaryAccount.accountStatus === 'active' && primaryAccount.canLogin ? '停用' : '启用'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void onAutoResetAccountPassword(primaryAccount.id)}
                            className="rounded-full border border-red-200 px-2.5 py-0.5 text-[11px] font-medium text-red-600 transition-colors hover:bg-red-50"
                          >
                            重置密码
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleToggleForcePasswordReset(row)}
                            className="rounded-full border border-slate-200 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
                          >
                            强制改密
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openProvisionEditorForRow(row.id)}
                          className="rounded-full border border-blue-200 px-2.5 py-0.5 text-[11px] font-medium text-blue-600 transition-colors hover:bg-blue-50"
                        >
                          开通账号
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {sortedAccessRows.length === 0 && (
              <tr>
                <td colSpan={12} className="px-4 py-10 text-center text-[12px] text-slate-400">
                  当前筛选条件下暂无匹配账号
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
