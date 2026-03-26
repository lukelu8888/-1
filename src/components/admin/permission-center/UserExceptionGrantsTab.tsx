import React from 'react';
import { AlertCircle, Plus, Search } from 'lucide-react';
import type {
  PermissionActionId,
  PermissionScopeId,
  PermissionUserException,
} from '../../../lib/services/permissionCenterService';
import { PERMISSION_CENTER_MODULES } from '../../../lib/services/permissionCenterService';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';

interface UserExceptionGrantsTabProps {
  exceptionSearch: string;
  onExceptionSearchChange: (value: string) => void;
  exceptionTypeFilter: 'all' | PermissionUserException['type'];
  onExceptionTypeFilterChange: (value: 'all' | PermissionUserException['type']) => void;
  onOpenCreateException: () => void;
  availableAccountsCount: number;
  exceptionsCount: number;
  filteredExceptions: PermissionUserException[];
  availableAccountMap: Record<string, { employeeId?: string } | undefined>;
  exceptionTypeLabel: Record<PermissionUserException['type'], string>;
  actionShortLabel: Record<PermissionActionId, string>;
  scopeLabel: Record<PermissionScopeId, string>;
  formatDateTime: (value?: string) => string;
  onRemoveException: (exceptionId: string) => void;
}

export function UserExceptionGrantsTab({
  exceptionSearch,
  onExceptionSearchChange,
  exceptionTypeFilter,
  onExceptionTypeFilterChange,
  onOpenCreateException,
  filteredExceptions,
  availableAccountMap,
  actionShortLabel,
  scopeLabel,
  formatDateTime,
  onRemoveException,
}: UserExceptionGrantsTabProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-amber-100 bg-amber-50 px-5 py-3 text-sm text-amber-800">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>例外授权说明：优先基于 RBAC 角色进行授权。人员例外授权仅用于应对紧急或特殊的场景。人员与组织架构数据来源于企业主数据中心。</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/50 px-5 py-2.5">
        <div className="flex items-center gap-3">
          <div className="relative w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={exceptionSearch}
              onChange={(event) => onExceptionSearchChange(event.target.value)}
              className="h-12 border-slate-200 bg-white pl-9 shadow-sm"
              placeholder="搜索人员姓名/账号..."
            />
          </div>
          <Select value={exceptionTypeFilter} onValueChange={onExceptionTypeFilterChange}>
            <SelectTrigger className="h-12 w-48 border-slate-200 bg-white shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="grant">仅附加权限 (+)</SelectItem>
              <SelectItem value="revoke">仅阻断权限 (-)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" className="h-12 border-slate-300 bg-white px-5 text-slate-800 shadow-sm" onClick={onOpenCreateException}>
          <Plus className="mr-2 h-4 w-4" />
          新增例外名单
        </Button>
      </div>

      <div className="bg-slate-50/30">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-200 bg-white shadow-[0_1px_0_0_#e5e7eb]">
              <TableHead className="px-4 py-2.5 text-xs font-semibold tracking-wider text-slate-600">目标人员</TableHead>
              <TableHead className="px-4 py-2.5 text-xs font-semibold tracking-wider text-slate-600">基础角色</TableHead>
              <TableHead className="px-4 py-2.5 text-xs font-semibold tracking-wider text-slate-600">例外类型</TableHead>
              <TableHead className="px-4 py-2.5 text-xs font-semibold tracking-wider text-slate-600">目标模块</TableHead>
              <TableHead className="px-4 py-2.5 text-xs font-semibold tracking-wider text-slate-600">作用权限范围</TableHead>
              <TableHead className="px-4 py-2.5 text-xs font-semibold tracking-wider text-slate-600">授权原因与创建信息</TableHead>
              <TableHead className="px-4 py-2.5 text-right text-xs font-semibold tracking-wider text-slate-600">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-200 bg-white">
            {filteredExceptions.length ? (
              filteredExceptions.map((item) => {
                const account = availableAccountMap[item.accountId];
                return (
                  <TableRow key={item.id} className="transition-colors hover:bg-blue-50/30">
                    <TableCell className="px-4 py-2.5">
                      <div className="font-medium text-slate-900">{item.displayName}</div>
                      <div className="mt-0.5 text-xs text-slate-400">{account?.employeeId || item.email}</div>
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-sm text-slate-700">{item.role}</TableCell>
                    <TableCell className="px-4 py-2.5">
                      <Badge
                        variant="outline"
                        className={item.type === 'grant' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}
                      >
                        {item.type === 'grant' ? '附加权限 (+)' : '阻断权限 (-)'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-sm font-medium text-slate-800">
                      {PERMISSION_CENTER_MODULES.find((module) => module.id === item.moduleId)?.name || item.moduleId}
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      <div className="text-xs text-slate-600">
                        <span className="text-slate-400">动作：</span>
                        {item.actions.length ? item.actions.map((action) => actionShortLabel[action]).join('、') : '无'}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        <span className="text-slate-400">范围：</span>
                        {scopeLabel[item.scope]}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      <div className="max-w-[220px] truncate text-sm text-slate-700" title={item.reason || '—'}>
                        {item.reason || '—'}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-400">
                        {formatDateTime(item.createdAt)} By {item.createdBy}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-700"
                        onClick={() => onRemoveException(item.id)}
                      >
                        撤销例外
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <AlertCircle className="mb-2 h-8 w-8 opacity-50" />
                    <p className="mb-1 text-sm font-medium text-slate-600">无例外授权记录</p>
                    <p className="text-xs">当前系统内没有任何生效的人员级别例外权限配置。</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
