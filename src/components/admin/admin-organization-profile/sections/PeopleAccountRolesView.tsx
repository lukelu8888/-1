import React from 'react';
import { ChevronDown, Search } from 'lucide-react';

type RoleSortKey = 'name' | 'employeeNo' | 'department' | 'title' | 'roleName' | 'roleCode';
type RoleColumnKey = RoleSortKey | 'description' | 'actions';

type RoleRow = {
  id: string;
  name: string;
  employeeNo: string;
  department: string;
  title: string;
  permissionRole: {
    name: string;
    code: string;
  };
  roleDefinition?: {
    colorClass?: string;
    description?: string;
  } | null;
};

type PeopleAccountRolesViewProps = {
  roleSearch: string;
  setRoleSearch: (value: string) => void;
  roleDepartmentFilter: string;
  setRoleDepartmentFilter: (value: string) => void;
  roleStatusFilter: string;
  setRoleStatusFilter: (value: string) => void;
  roleDepartmentOptions: string[];
  roleTableContainerRef: React.RefObject<HTMLDivElement | null>;
  roleTableMinWidth: number;
  getRoleColumnStyle: (key: RoleColumnKey) => React.CSSProperties;
  toggleRoleSort: (key: RoleSortKey) => void;
  renderRoleSortIcon: (key: RoleSortKey) => React.ReactNode;
  renderRoleColumnResizeHandle: (key: RoleColumnKey) => React.ReactNode;
  sortedRoleRows: RoleRow[];
  selectedRoleRow: RoleRow | null;
  setSelectedRoleRowId: (id: string) => void;
  openPermissionCenter: () => void;
};

export function PeopleAccountRolesView({
  roleSearch,
  setRoleSearch,
  roleDepartmentFilter,
  setRoleDepartmentFilter,
  roleStatusFilter,
  setRoleStatusFilter,
  roleDepartmentOptions,
  roleTableContainerRef,
  roleTableMinWidth,
  getRoleColumnStyle,
  toggleRoleSort,
  renderRoleSortIcon,
  renderRoleColumnResizeHandle,
  sortedRoleRows,
  selectedRoleRow,
  setSelectedRoleRowId,
  openPermissionCenter,
}: PeopleAccountRolesViewProps) {
  const getFluidRoleColumnStyle = (key: RoleColumnKey) => {
    const width = Number.parseFloat(String(getRoleColumnStyle(key).width || 0));
    const safeTotal = Math.max(roleTableMinWidth, 1);
    return { width: `${(width / safeTotal) * 100}%` };
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex min-w-[220px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input
                value={roleSearch}
                onChange={(event) => setRoleSearch(event.target.value)}
                className="w-full bg-transparent text-[11px] text-slate-700 outline-none placeholder:text-slate-400"
                placeholder="搜索姓名 / 工号 / 角色 / 部门"
              />
            </div>
            <div className="relative">
              <select
                value={roleDepartmentFilter}
                onChange={(event) => setRoleDepartmentFilter(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 pr-8 text-[11px] text-slate-600 outline-none transition-colors hover:border-slate-300 focus:border-red-300"
              >
                <option value="all">部门筛选</option>
                {roleDepartmentOptions.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
            <div className="relative">
              <select
                value={roleStatusFilter}
                onChange={(event) => setRoleStatusFilter(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 pr-8 text-[11px] text-slate-600 outline-none transition-colors hover:border-slate-300 focus:border-red-300"
              >
                <option value="all">人员状态筛选</option>
                <option value="在职">在职</option>
                <option value="离职">离职</option>
                <option value="停用">停用</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div ref={roleTableContainerRef} className="mt-4 overflow-x-hidden rounded-xl border border-slate-200">
            <table className="w-full table-fixed border-collapse text-[11px]">
              <colgroup>
                <col style={getFluidRoleColumnStyle('name')} />
                <col style={getFluidRoleColumnStyle('employeeNo')} />
                <col style={getFluidRoleColumnStyle('department')} />
                <col style={getFluidRoleColumnStyle('title')} />
                <col style={getFluidRoleColumnStyle('roleName')} />
                <col style={getFluidRoleColumnStyle('roleCode')} />
                <col style={getFluidRoleColumnStyle('description')} />
                <col style={getFluidRoleColumnStyle('actions')} />
              </colgroup>
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left" style={getFluidRoleColumnStyle('name')}><button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => toggleRoleSort('name')}>姓名 {renderRoleSortIcon('name')}</button>{renderRoleColumnResizeHandle('name')}</th>
                  <th className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left" style={getFluidRoleColumnStyle('employeeNo')}><button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => toggleRoleSort('employeeNo')}>工号 {renderRoleSortIcon('employeeNo')}</button>{renderRoleColumnResizeHandle('employeeNo')}</th>
                  <th className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left" style={getFluidRoleColumnStyle('department')}><button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => toggleRoleSort('department')}>部门 {renderRoleSortIcon('department')}</button>{renderRoleColumnResizeHandle('department')}</th>
                  <th className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left" style={getFluidRoleColumnStyle('title')}><button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => toggleRoleSort('title')}>岗位 {renderRoleSortIcon('title')}</button>{renderRoleColumnResizeHandle('title')}</th>
                  <th className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left" style={getFluidRoleColumnStyle('roleName')}><button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => toggleRoleSort('roleName')}>当前角色 {renderRoleSortIcon('roleName')}</button>{renderRoleColumnResizeHandle('roleName')}</th>
                  <th className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left" style={getFluidRoleColumnStyle('roleCode')}><button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => toggleRoleSort('roleCode')}>角色编码 {renderRoleSortIcon('roleCode')}</button>{renderRoleColumnResizeHandle('roleCode')}</th>
                  <th className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left" style={getFluidRoleColumnStyle('description')}>角色说明{renderRoleColumnResizeHandle('description')}</th>
                  <th className="group relative border-b border-slate-200 px-2.5 py-1.5 text-left" style={getFluidRoleColumnStyle('actions')}>操作{renderRoleColumnResizeHandle('actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {sortedRoleRows.map((row) => (
                  <tr
                    key={row.id}
                    className={`cursor-pointer transition-colors ${selectedRoleRow?.id === row.id ? 'bg-red-50/60' : 'odd:bg-white even:bg-slate-50/35 hover:bg-slate-50'}`}
                    onClick={() => setSelectedRoleRowId(row.id)}
                  >
                    <td className="border-b border-slate-100 px-2.5 py-1.5 font-medium text-slate-800">{row.name}</td>
                    <td className="border-b border-slate-100 px-2.5 py-1.5 text-slate-600">{row.employeeNo}</td>
                    <td className="border-b border-slate-100 px-2.5 py-1.5 text-slate-600">{row.department}</td>
                    <td className="border-b border-slate-100 px-2.5 py-1.5 text-slate-600">{row.title}</td>
                    <td className="border-b border-slate-100 px-2.5 py-1.5">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${row.roleDefinition?.colorClass || 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                        {row.permissionRole.name}
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-2.5 py-1.5 text-[10px] text-slate-500">{row.permissionRole.code}</td>
                    <td className="border-b border-slate-100 px-2.5 py-1.5 text-[10px] leading-4 text-slate-600">
                      {row.roleDefinition?.description || '暂无对应权限中心角色说明'}
                    </td>
                    <td className="border-b border-slate-100 px-2.5 py-1.5">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openPermissionCenter();
                        }}
                        className="inline-flex items-center rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      >
                        去权限中心
                      </button>
                    </td>
                  </tr>
                ))}
                {sortedRoleRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-[12px] text-slate-400">
                      当前筛选条件下暂无匹配角色分配记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
