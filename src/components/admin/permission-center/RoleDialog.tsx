import React from 'react';
import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRoleId: string | null;
  draftRole: {
    id: string;
    name: string;
    description: string;
    category: 'management' | 'sales' | 'support' | 'external' | 'operations';
    regionScoped: boolean;
  } | null;
  categoryOrder: readonly string[];
  roleCategoryLabel: Record<string, string>;
  onDraftChange: (
    updater: (
      previous: {
        id: string;
        name: string;
        description: string;
        category: 'management' | 'sales' | 'support' | 'external' | 'operations';
        regionScoped: boolean;
      } | null,
    ) => {
      id: string;
      name: string;
      description: string;
      category: 'management' | 'sales' | 'support' | 'external' | 'operations';
      regionScoped: boolean;
    } | null,
  ) => void;
  onSave: () => void;
}

export function RoleDialog({
  open,
  onOpenChange,
  editingRoleId,
  draftRole,
  categoryOrder,
  roleCategoryLabel,
  onDraftChange,
  onSave,
}: RoleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingRoleId ? '编辑角色信息' : '新建自定义角色'}</DialogTitle>
        </DialogHeader>
        {draftRole && (
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">角色名称</label>
                <Input
                  value={draftRole.name}
                  onChange={(event) => onDraftChange((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
                  placeholder="例如：高级财务审核员"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">角色编码</label>
                <Input
                  value={draftRole.id}
                  onChange={(event) => onDraftChange((prev) => (prev ? { ...prev, id: event.target.value } : prev))}
                  placeholder="例如：FINANCE_AUDITOR"
                  disabled={!!editingRoleId}
                />
                {editingRoleId && <p className="text-xs text-slate-400">角色编码一旦创建不可修改，它用于系统底层的权限映射。</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">角色类别</label>
                <Select
                  value={draftRole.category}
                  onValueChange={(value: 'management' | 'sales' | 'support' | 'external' | 'operations') =>
                    onDraftChange((prev) => (prev ? { ...prev, category: value } : prev))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOrder.map((category) => (
                      <SelectItem key={category} value={category}>
                        {roleCategoryLabel[category]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                <Checkbox
                  checked={draftRole.regionScoped}
                  onCheckedChange={(checked) =>
                    onDraftChange((prev) => (prev ? { ...prev, regionScoped: checked === true } : prev))
                  }
                />
                需要区域字段
              </label>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">描述说明</label>
              <Input
                value={draftRole.description}
                onChange={(event) =>
                  onDraftChange((prev) => (prev ? { ...prev, description: event.target.value } : prev))
                }
                placeholder="请输入角色描述"
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={onSave}>{editingRoleId ? '保存修改' : '确认创建'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
