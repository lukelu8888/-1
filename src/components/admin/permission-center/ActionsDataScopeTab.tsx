import React from 'react';
import { ChevronDown, ChevronRight, Folder, Layers, Lock, Search, Shield } from 'lucide-react';
import type {
  PermissionActionId,
  PermissionCenterRoleId,
  PermissionModuleDefinition,
  PermissionModuleId,
  PermissionScopeId,
} from '../../../lib/services/permissionCenterService';
import { Input } from '../../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';

interface ActionsDataScopeTabProps {
  matrixSearch: string;
  onMatrixSearchChange: (value: string) => void;
  moduleCategoryOrder: readonly string[];
  filteredModuleCategories: Record<string, PermissionModuleDefinition[]>;
  collapsedActionCategories: Record<string, boolean>;
  onToggleCategoryCollapse: (category: string) => void;
  selectedModuleId: PermissionModuleId;
  onSelectModule: (moduleId: PermissionModuleId) => void;
  selectedModule: PermissionModuleDefinition;
  selectedRoleId: PermissionCenterRoleId;
  onSelectRole: (roleId: PermissionCenterRoleId) => void;
  roleDefinitions: Array<{ id: PermissionCenterRoleId; name: string }>;
  permissionActionOptions: PermissionActionId[];
  actionLabel: Record<PermissionActionId, string>;
  actionShortLabel: Record<PermissionActionId, string>;
  actionMatrix: Record<string, Partial<Record<PermissionModuleId, PermissionActionId[]>>>;
  onToggleAction: (roleId: PermissionCenterRoleId, moduleId: PermissionModuleId, actionId: PermissionActionId) => void;
  selectedRoleDefinition: { id: PermissionCenterRoleId; name: string };
  selectedModuleActions: PermissionActionId[];
  scopeMatrix: Record<string, Partial<Record<PermissionModuleId, PermissionScopeId>>>;
  scopeLabel: Record<PermissionScopeId, string>;
  scopeDescription: Record<PermissionScopeId, string>;
  permissionScopeOptions: PermissionScopeId[];
  onSetScopeForRole: (roleId: PermissionCenterRoleId, moduleId: PermissionModuleId, scopeId: PermissionScopeId) => void;
}

export function ActionsDataScopeTab({
  matrixSearch,
  onMatrixSearchChange,
  moduleCategoryOrder,
  filteredModuleCategories,
  collapsedActionCategories,
  onToggleCategoryCollapse,
  selectedModuleId,
  onSelectModule,
  selectedModule,
  selectedRoleId,
  onSelectRole,
  roleDefinitions,
  permissionActionOptions,
  actionLabel,
  actionShortLabel,
  actionMatrix,
  onToggleAction,
  selectedRoleDefinition,
  selectedModuleActions,
  scopeMatrix,
  scopeLabel,
  scopeDescription,
  permissionScopeOptions,
  onSetScopeForRole,
}: ActionsDataScopeTabProps) {
  const currentScope = (scopeMatrix[selectedRoleId]?.[selectedModule.id] || 'assigned') as PermissionScopeId;

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex min-w-0 divide-x divide-slate-200">
        <div className="flex w-[324px] min-w-[324px] flex-col bg-white">
          <div className="flex min-h-[74px] items-center border-b border-slate-200 px-4">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={matrixSearch}
                onChange={(event) => onMatrixSearchChange(event.target.value)}
                className="h-9 rounded-md border-slate-300 bg-white pl-9 text-[13px] shadow-sm"
                placeholder="搜索业务模块..."
              />
            </div>
          </div>
          <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
            <div className="space-y-1 p-4 pt-2">
              {moduleCategoryOrder.filter((category) => filteredModuleCategories[category]?.length).map((category) => {
                const collapsed = !!collapsedActionCategories[category];
                return (
                  <div key={category}>
                    <button
                      type="button"
                      onClick={() => onToggleCategoryCollapse(category)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[14px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      {collapsed ? <ChevronRight className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                      <Folder className="h-4 w-4 text-blue-500" />
                      <span>{category}</span>
                    </button>
                    {!collapsed && (
                      <div className="ml-6 mt-1 space-y-1">
                        {filteredModuleCategories[category].map((module) => (
                          <button
                            key={module.id}
                            type="button"
                            onClick={() => onSelectModule(module.id)}
                            className={`flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-[13px] transition-colors ${
                              selectedModuleId === module.id
                                ? 'border-blue-200 bg-blue-100 text-blue-800 shadow-sm'
                                : 'border-transparent text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <div className="w-4 shrink-0" />
                            <Layers className={`h-4 w-4 shrink-0 ${selectedModuleId === module.id ? 'text-blue-600' : 'text-slate-400'}`} />
                            <span className="truncate">{module.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col bg-white">
          <div className="flex min-h-[74px] items-center justify-between gap-4 border-b border-slate-200 bg-white px-5">
            <div className="flex min-w-0 items-center gap-2">
              <Shield className="h-4 w-4 shrink-0 text-blue-600" />
              <h2 className="truncate text-[14px] font-semibold text-slate-800">{selectedModule.name} - 动作操作权限</h2>
            </div>
            <span className="shrink-0 text-[12px] text-slate-500">
              已选中: <span className="font-semibold text-blue-700">{selectedRoleDefinition.name}</span>
            </span>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-0">
              <Table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[22%]" />
                  {permissionActionOptions.map((action) => (
                    <col key={action} className="w-[9.75%]" />
                  ))}
                </colgroup>
                <TableHeader className="bg-[#f3f4f6]">
                  <TableRow className="border-b border-slate-200">
                    <TableHead className="border-r border-slate-200 px-4 py-2.5 text-left text-[12px] font-semibold text-slate-700">
                      角色名称
                    </TableHead>
                    {permissionActionOptions.map((action) => (
                      <TableHead
                        key={action}
                        className="border-r border-slate-200 px-1.5 py-2.5 text-center text-[12px] font-semibold leading-tight text-slate-700"
                      >
                        {actionLabel[action]}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roleDefinitions.map((role) => {
                    const enabledActions = actionMatrix[role.id]?.[selectedModule.id] || [];
                    const isSelected = selectedRoleId === role.id;

                    return (
                      <TableRow
                        key={`${selectedModule.id}-${role.id}`}
                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50'}`}
                        onClick={() => onSelectRole(role.id)}
                      >
                        <TableCell
                          className={`border-r border-slate-200 px-4 py-2.5 text-[13px] ${
                            isSelected ? 'border-l-2 border-l-blue-600 font-semibold text-blue-800' : 'font-medium text-slate-700'
                          }`}
                        >
                          <span className="block truncate">{role.name}</span>
                        </TableCell>
                        {permissionActionOptions.map((action) => (
                          <TableCell
                            key={`${role.id}-${action}`}
                            className="border-r border-slate-200 py-2.5 text-center"
                            onClick={(event) => {
                              event.stopPropagation();
                              onSelectRole(role.id);
                              onToggleAction(role.id, selectedModule.id, action);
                            }}
                          >
                            <div className="flex justify-center">
                              <input
                                type="checkbox"
                                readOnly
                                checked={enabledActions.includes(action)}
                                className="h-[18px] w-[18px] cursor-pointer rounded border border-gray-300 accent-[#67b84b] focus:ring-[#67b84b]"
                              />
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <div className="flex w-[340px] min-w-[340px] flex-col bg-white">
          <div className="flex min-h-[74px] items-center border-b border-slate-200 bg-white px-5 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-blue-600" />
                <h3 className="text-[14px] font-semibold text-slate-800">行级数据范围控制</h3>
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500">
                配置角色 [<span className="font-semibold text-blue-700">{selectedRoleDefinition.name}</span>] 在当前模块能看到哪些数据。
              </p>
            </div>
          </div>
          <div className="space-y-3 p-5">
            <div className="space-y-3">
              <label className="text-[12px] font-semibold text-slate-400">标准数据维度</label>
              <div className="space-y-2">
                {permissionScopeOptions.map((scope) => {
                  const checked = currentScope === scope;
                  return (
                    <button
                      type="button"
                      key={scope}
                      onClick={() => onSetScopeForRole(selectedRoleId, selectedModule.id, scope)}
                      className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                        checked ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="radio"
                        readOnly
                        checked={checked}
                        className="mt-1 h-[18px] w-[18px] accent-[#67b84b] focus:ring-[#67b84b]"
                      />
                      <div>
                        <div className={`text-[14px] ${checked ? 'font-semibold text-blue-900' : 'font-semibold text-slate-800'}`}>{scopeLabel[scope]}</div>
                        <div className={`mt-0.5 text-[12px] ${checked ? 'text-blue-700/80' : 'text-slate-500'}`}>{scopeDescription[scope]}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
