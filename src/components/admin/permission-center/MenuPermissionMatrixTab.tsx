import React from 'react';
import { Check, ChevronDown, ChevronRight, Minus } from 'lucide-react';
import type {
  PermissionCenterRoleId,
  PermissionModuleDefinition,
  PermissionModuleId,
} from '../../../lib/services/permissionCenterService';

interface MenuPermissionMatrixTabProps {
  matrixSearch: string;
  onMatrixSearchChange: (value: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  visibleModuleCount: number;
  roleCount: number;
  roleDefinitions: Array<{ id: PermissionCenterRoleId; name: string; regionScoped?: boolean }>;
  filteredModuleCategories: Record<string, PermissionModuleDefinition[]>;
  moduleCategoryOrder: readonly string[];
  collapsedMatrixCategories: Record<string, boolean>;
  onToggleCategoryCollapse: (category: string) => void;
  getCategoryState: (roleId: PermissionCenterRoleId, modules: PermissionModuleDefinition[]) => 'none' | 'partial' | 'all';
  onToggleCategoryAccess: (roleId: PermissionCenterRoleId, category: string) => void;
  menuMatrix: Record<string, PermissionModuleId[]>;
  onToggleModuleAccess: (roleId: PermissionCenterRoleId, moduleId: PermissionModuleId) => void;
}

const FIRST_COLUMN_WIDTH = '20%';

export function MenuPermissionMatrixTab({
  onExpandAll,
  onCollapseAll,
  roleDefinitions,
  filteredModuleCategories,
  moduleCategoryOrder,
  collapsedMatrixCategories,
  onToggleCategoryCollapse,
  getCategoryState,
  onToggleCategoryAccess,
  menuMatrix,
  onToggleModuleAccess,
}: MenuPermissionMatrixTabProps) {
  const roleColumnWidth = `${80 / Math.max(roleDefinitions.length, 1)}%`;

  const getRoleHeaderText = (role: { id: PermissionCenterRoleId; name: string; regionScoped?: boolean }) => {
    if (role.id === 'Sales_Rep') return '业务员\n按区域生效';
    if (role.id === 'Regional_Manager') return '区域主管\n按区域生效';
    if (role.id === 'Sales_Assistant') return '业务助理\n按区域生效';
    return role.regionScoped ? `${role.name}\n按区域生效` : role.name;
  };

  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 bg-white">
      <div className="shrink-0 flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <h2 className="text-sm font-medium text-slate-800">菜单权限配置矩阵</h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExpandAll}
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm transition-colors hover:bg-slate-100"
          >
            全部展开
          </button>
          <button
            type="button"
            onClick={onCollapseAll}
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm transition-colors hover:bg-slate-100"
          >
            全部折叠
          </button>
        </div>
      </div>

      <div className="shrink-0 overflow-hidden border-b border-slate-200 bg-slate-100">
        <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
          <colgroup>
            <col style={{ width: FIRST_COLUMN_WIDTH }} />
            {roleDefinitions.map((role) => (
              <col key={role.id} style={{ width: roleColumnWidth }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="border-r border-slate-200 bg-slate-100 px-4 py-2.5 text-left text-sm font-semibold text-slate-700">
                系统菜单节点
              </th>
              {roleDefinitions.map((role) => (
                <th
                  key={role.id}
                  className="border-r border-slate-200 bg-slate-100 px-1.5 py-2 text-center text-[11px] font-medium text-slate-700"
                >
                  <div className="whitespace-pre-line break-words leading-[1.25]">{getRoleHeaderText(role)}</div>
                </th>
              ))}
            </tr>
          </thead>
        </table>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
          <colgroup>
            <col style={{ width: FIRST_COLUMN_WIDTH }} />
            {roleDefinitions.map((role) => (
              <col key={role.id} style={{ width: roleColumnWidth }} />
            ))}
          </colgroup>
          <tbody>
            {moduleCategoryOrder.filter((category) => filteredModuleCategories[category]?.length).map((category) => {
              const modules = filteredModuleCategories[category];
              const collapsed = !!collapsedMatrixCategories[category];

              return (
                <React.Fragment key={category}>
                  <tr className="group transition-colors hover:bg-blue-50/30">
                    <td className="border-r border-b border-slate-200 bg-slate-50 px-4 py-2 font-medium text-slate-900 group-hover:bg-blue-50/30">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onToggleCategoryCollapse(category)}
                          className="rounded p-0.5 text-slate-400 transition-colors hover:text-slate-800"
                        >
                          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                        <span className="text-sm">{category}</span>
                      </div>
                    </td>
                    {roleDefinitions.map((role) => {
                      const state = getCategoryState(role.id, modules);
                      return (
                        <td
                          key={`${category}-${role.id}`}
                          className={`cursor-pointer border-r border-b border-slate-100 px-2 py-2 text-center transition-colors hover:bg-blue-50/50 ${
                            state !== 'none' ? 'bg-blue-50/10' : ''
                          }`}
                          onClick={() => onToggleCategoryAccess(role.id, category)}
                        >
                          <div className="flex justify-center">
                            <div
                              className={`flex h-4 w-4 items-center justify-center rounded border ${
                                state === 'all'
                                  ? 'border-blue-600 bg-blue-600'
                                  : state === 'partial'
                                    ? 'border-blue-600 bg-blue-600'
                                    : 'border-slate-300 bg-white'
                              }`}
                            >
                              {state === 'all' && <Check className="h-3 w-3 text-white" />}
                              {state === 'partial' && <Minus className="h-3 w-3 text-white" />}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {!collapsed &&
                    modules.map((module) => (
                      <tr key={module.id} className="group transition-colors hover:bg-blue-50/30">
                        <td className="border-r border-b border-slate-200 bg-white px-4 py-2 group-hover:bg-blue-50/30">
                          <div className="pl-6 text-sm text-slate-600">{module.name}</div>
                        </td>
                        {roleDefinitions.map((role) => {
                          const checked = (menuMatrix[role.id] || []).includes(module.id);
                          return (
                            <td
                              key={`${module.id}-${role.id}`}
                              className={`cursor-pointer border-r border-b border-slate-100 px-2 py-2 text-center transition-colors hover:bg-blue-50/50 ${
                                checked ? 'bg-blue-50/10' : ''
                              }`}
                              onClick={() => onToggleModuleAccess(role.id, module.id)}
                            >
                              <div className="flex justify-center">
                                <div
                                  className={`flex h-4 w-4 items-center justify-center rounded border ${
                                    checked ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                                  }`}
                                >
                                  {checked && <Check className="h-3 w-3 text-white" />}
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
