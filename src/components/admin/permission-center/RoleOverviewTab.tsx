import React from 'react';
import type { PermissionCenterRoleId, PermissionRoleDefinition } from '../../../lib/services/permissionCenterService';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../../ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { BriefcaseBusiness, Layers3, MapPinned, Plus, Search, ShieldCheck, UserCog } from 'lucide-react';

interface RoleOverviewTabProps {
  roleSearch: string;
  onRoleSearchChange: (value: string) => void;
  roleCategoryFilter: 'all' | string;
  onRoleCategoryFilterChange: (value: 'all' | string) => void;
  categoryOrder: readonly string[];
  roleCategoryLabel: Record<string, string>;
  roleCategoryBadge: Record<string, string>;
  filteredRoles: PermissionRoleDefinition[];
  selectedRoleId: PermissionCenterRoleId;
  onSelectRole: (roleId: PermissionCenterRoleId) => void;
  roleDrawerOpen: boolean;
  onRoleDrawerOpenChange: (open: boolean) => void;
  selectedRoleDefinition: PermissionRoleDefinition;
  selectedRoleName: string;
  selectedRoleModuleCount: number;
  selectedRoleExceptionCount: number;
  selectedRoleModules: Array<{ id: string; name: string; category: string }>;
  onOpenCreateRole: () => void;
  onOpenEditRole: (roleId: string) => void;
  onOpenCloneRole: (roleId: string) => void;
  onRemoveRole: (roleId: string) => void;
}

export function RoleOverviewTab({
  roleSearch,
  onRoleSearchChange,
  roleCategoryFilter,
  onRoleCategoryFilterChange,
  categoryOrder,
  roleCategoryLabel,
  roleCategoryBadge,
  filteredRoles,
  selectedRoleId,
  onSelectRole,
  roleDrawerOpen,
  onRoleDrawerOpenChange,
  selectedRoleDefinition,
  selectedRoleName,
  selectedRoleModuleCount,
  selectedRoleExceptionCount,
  selectedRoleModules,
  onOpenCreateRole,
  onOpenEditRole,
  onOpenCloneRole,
  onRemoveRole,
}: RoleOverviewTabProps) {
  const getRoleDisplayName = (role: PermissionRoleDefinition) => {
    if (role.id === 'Sales_Rep') return '业务员（按区域生效）';
    if (role.id === 'Regional_Manager') return '区域主管（按区域生效）';
    if (role.id === 'Sales_Assistant') return '业务助理（按区域生效）';
    return role.name;
  };

  return (
    <Sheet open={roleDrawerOpen} onOpenChange={onRoleDrawerOpenChange}>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={roleSearch}
                  onChange={(event) => onRoleSearchChange(event.target.value)}
                  className="h-10 border-slate-300 bg-white pl-9 shadow-sm"
                  placeholder="搜索角色名称/编码..."
                />
              </div>
              <Select value={roleCategoryFilter} onValueChange={onRoleCategoryFilterChange}>
                <SelectTrigger className="h-10 w-36 border-slate-300 bg-white shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类别</SelectItem>
                  {categoryOrder.map((category) => (
                    <SelectItem key={category} value={category}>
                      {roleCategoryLabel[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="h-10 rounded-md bg-blue-600 px-4 text-sm font-medium hover:bg-blue-700" onClick={onOpenCreateRole}>
              <Plus className="mr-2 h-4 w-4" />
              新建角色
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-200 bg-slate-50/80 shadow-[0_1px_0_0_#e5e7eb]">
              <TableHead className="w-12 px-4 py-2.5 text-xs font-medium text-slate-500"><Checkbox checked={false} /></TableHead>
              <TableHead className="w-60 px-4 py-2.5 text-xs font-medium tracking-wider text-slate-600">角色名称</TableHead>
              <TableHead className="w-56 px-4 py-2.5 text-xs font-medium tracking-wider text-slate-600">角色编码</TableHead>
              <TableHead className="w-52 px-4 py-2.5 text-xs font-medium tracking-wider text-slate-600">类别</TableHead>
              <TableHead className="w-52 px-4 py-2.5 text-xs font-medium tracking-wider text-slate-600">特殊控制</TableHead>
              <TableHead className="px-4 py-2.5 text-xs font-medium tracking-wider text-slate-600">职责描述</TableHead>
              <TableHead className="w-44 px-4 py-2.5 text-right text-xs font-medium tracking-wider text-slate-600">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-200 bg-white">
            {filteredRoles.map((role) => (
              <TableRow
                key={role.id}
                className={`group cursor-pointer transition-colors hover:bg-blue-50/40 ${selectedRoleId === role.id ? 'bg-blue-50/60' : ''}`}
                onClick={() => onSelectRole(role.id)}
              >
                <TableCell className="px-4 py-2.5"><Checkbox checked={false} /></TableCell>
                <TableCell className="px-4 py-2.5 font-medium text-slate-900">{getRoleDisplayName(role)}</TableCell>
                <TableCell className="px-4 py-2.5 font-mono text-xs text-slate-500">{role.id}</TableCell>
                <TableCell className="px-4 py-2.5">
                  <Badge variant="outline" className={roleCategoryBadge[role.category]}>
                    {roleCategoryLabel[role.category]}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-2.5">
                  {role.regionScoped ? (
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-xs text-amber-700">
                      需要区域字段（北美/南美/欧非）
                    </Badge>
                  ) : (
                    <span className="text-xs text-slate-400">-</span>
                  )}
                </TableCell>
                <TableCell className="max-w-sm truncate px-4 py-2.5 text-xs text-slate-500" title={role.description}>{role.description}</TableCell>
                <TableCell className="px-4 py-2.5 text-right">
                  <div className="flex justify-end gap-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto px-0 py-0 text-xs font-medium text-blue-600 hover:bg-transparent hover:text-blue-800"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenEditRole(role.id);
                      }}
                    >
                      配置
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto px-0 py-0 text-xs font-medium text-blue-600 hover:bg-transparent hover:text-blue-800"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenCloneRole(role.id);
                      }}
                    >
                      克隆
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto px-0 py-0 text-xs font-medium text-red-600 hover:bg-transparent hover:text-red-700"
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemoveRole(role.id);
                      }}
                    >
                      删除
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          共找到 {filteredRoles.length} 条角色记录
        </div>
      </div>

      <SheetContent side="right" className="w-[420px] overflow-y-auto sm:w-[520px]">
        <SheetHeader className="border-b border-slate-200 pb-4 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <Badge variant="outline" className={roleCategoryBadge[selectedRoleDefinition.category]}>
                {roleCategoryLabel[selectedRoleDefinition.category]}
              </Badge>
              <SheetTitle className="text-xl font-semibold text-slate-900">{getRoleDisplayName(selectedRoleDefinition)}</SheetTitle>
              <SheetDescription className="font-mono text-xs text-slate-500">
                {selectedRoleDefinition.id}
              </SheetDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => onOpenEditRole(selectedRoleDefinition.id)}>
              配置角色
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-6 py-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Layers3 className="h-4 w-4" />
                已开通模块
              </div>
              <div className="mt-3 text-2xl font-semibold text-slate-900">{selectedRoleModuleCount}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <UserCog className="h-4 w-4" />
                例外授权
              </div>
              <div className="mt-3 text-2xl font-semibold text-slate-900">{selectedRoleExceptionCount}</div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <BriefcaseBusiness className="h-4 w-4 text-slate-500" />
              角色职责
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{selectedRoleDefinition.description}</p>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <ShieldCheck className="h-4 w-4 text-slate-500" />
                权限特征
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                  类别: {roleCategoryLabel[selectedRoleDefinition.category]}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    selectedRoleDefinition.regionScoped
                      ? 'border-amber-200 bg-amber-50 text-amber-700'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  }
                >
                  <MapPinned className="mr-1 h-3.5 w-3.5" />
                  {selectedRoleDefinition.regionScoped ? '需要区域字段（北美/南美/欧非）' : '无区域限制字段'}
                </Badge>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-900">已授权模块清单</div>
                <div className="text-xs text-slate-500">{selectedRoleModules.length} 个模块</div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedRoleModules.length > 0 ? (
                  selectedRoleModules.map((module) => (
                    <Badge key={module.id} variant="outline" className="border-slate-200 bg-white px-2.5 py-1 text-slate-700">
                      {module.name}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">当前角色尚未分配模块，可在“菜单权限矩阵”页签中补充配置。</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
