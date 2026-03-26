import React from 'react';
import type {
  PermissionActionId,
  PermissionModuleId,
  PermissionScopeId,
  PermissionUserException,
} from '../../../lib/services/permissionCenterService';
import {
  PERMISSION_ACTION_OPTIONS,
  PERMISSION_CENTER_MODULES,
  PERMISSION_SCOPE_OPTIONS,
} from '../../../lib/services/permissionCenterService';
import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

interface AccountOption {
  id: string;
  username: string;
  department: string;
}

interface ExceptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingExceptionId: string | null;
  draftException: PermissionUserException | null;
  availableAccounts: AccountOption[];
  availableAccountMap: Record<string, { username: string; loginEmail: string; role: string } | undefined>;
  actionShortLabel: Record<PermissionActionId, string>;
  scopeLabel: Record<PermissionScopeId, string>;
  onDraftChange: (updater: (previous: PermissionUserException | null) => PermissionUserException | null) => void;
  onSave: () => void;
}

export function ExceptionDialog({
  open,
  onOpenChange,
  editingExceptionId,
  draftException,
  availableAccounts,
  availableAccountMap,
  actionShortLabel,
  scopeLabel,
  onDraftChange,
  onSave,
}: ExceptionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingExceptionId ? '编辑人员例外授权' : '配置人员例外特权'}</DialogTitle>
        </DialogHeader>
        {draftException && (
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">目标人员</label>
              <Select
                value={draftException.accountId}
                onValueChange={(value) => {
                  const account = availableAccountMap[value];
                  if (!account) return;
                  onDraftChange((prev) =>
                    prev
                      ? {
                          ...prev,
                          accountId: value,
                          displayName: account.username,
                          email: account.loginEmail,
                          role: account.role,
                        }
                      : prev,
                  );
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.username} · {account.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">例外类型</label>
                <Select
                  value={draftException.type}
                  onValueChange={(value: PermissionUserException['type']) =>
                    onDraftChange((prev) => (prev ? { ...prev, type: value } : prev))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grant">附加权限 (+)</SelectItem>
                    <SelectItem value="revoke">阻断权限 (-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">作用模块</label>
                <Select
                  value={draftException.moduleId}
                  onValueChange={(value: PermissionModuleId) =>
                    onDraftChange((prev) => (prev ? { ...prev, moduleId: value } : prev))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERMISSION_CENTER_MODULES.map((module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">动作授权点</label>
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-4">
                {PERMISSION_ACTION_OPTIONS.map((action) => {
                  const checked = draftException.actions.includes(action);
                  return (
                    <label key={action} className="flex items-center gap-2 text-sm text-slate-700">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() =>
                          onDraftChange((prev) => {
                            if (!prev) return prev;
                            const set = new Set(prev.actions);
                            if (set.has(action)) {
                              set.delete(action);
                            } else {
                              set.add(action);
                            }
                            return { ...prev, actions: Array.from(set) };
                          })
                        }
                      />
                      {actionShortLabel[action]}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">数据范围</label>
              <Select
                value={draftException.scope}
                onValueChange={(value: PermissionScopeId) =>
                  onDraftChange((prev) => (prev ? { ...prev, scope: value } : prev))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERMISSION_SCOPE_OPTIONS.map((scope) => (
                    <SelectItem key={scope} value={scope}>
                      {scopeLabel[scope]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">授权/阻断原因</label>
              <Input
                value={draftException.reason}
                onChange={(event) =>
                  onDraftChange((prev) => (prev ? { ...prev, reason: event.target.value } : prev))
                }
                placeholder="请输入人员例外授权的业务原因..."
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={onSave}>{editingExceptionId ? '保存修改' : '确认创建'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
