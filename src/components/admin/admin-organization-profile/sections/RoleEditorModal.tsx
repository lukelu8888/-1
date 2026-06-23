import React from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X } from 'lucide-react';

import { PERMISSION_CENTER_ROLES } from '../../../../lib/services/permissionCenterService';

type Props = {
  open: boolean;
  row: any;
  roleCode: string;
  permissionRoleMap: Record<string, any>;
  roleUnchanged?: boolean;
  saving: boolean;
  onChangeRoleCode: (code: string) => void;
  onClose: () => void;
  onSave: () => Promise<void>;
};

export function RoleEditorModal({
  open,
  row,
  roleCode,
  permissionRoleMap,
  roleUnchanged = false,
  saving,
  onChangeRoleCode,
  onClose,
  onSave,
}: Props) {
  if (!open || !row) return null;

  return createPortal(
    <div className="fixed inset-0 z-[260] bg-slate-950/20 backdrop-blur-[1px]" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center px-4 py-8">
        <form
          className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          style={{ maxWidth: 420 }}
          onClick={(event) => event.stopPropagation()}
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!roleCode || saving || roleUnchanged) return;
            void onSave();
          }}
        >
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">更改角色</p>
              <h3 className="mt-2 text-[20px] font-semibold text-slate-900">{row?.name || '未选择人员'}</h3>
              <p className="mt-1 text-[13px] text-slate-500">
                {row?.employeeNo || '未设工号'} / {row?.department || '未设部门'} / {row?.title || '未设岗位'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-white hover:text-slate-700"
              disabled={saving}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4 p-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-400">当前角色</p>
                  <p className="mt-1 truncate text-[13px] font-semibold text-slate-800">{row?.permissionRole?.name || '未分配'}</p>
                  <p className="truncate text-[11px] text-slate-400">
                    {row?.permissionRole?.code && row.permissionRole.code !== 'Unassigned'
                      ? row.permissionRole.code
                      : 'Unassigned'}
                  </p>
                </div>
                <div className="shrink-0 pt-5 text-slate-300">→</div>
                <div className="min-w-0 text-right">
                  <p className="text-[11px] text-slate-400">变更后</p>
                  <p className="mt-1 truncate text-[13px] font-semibold text-slate-800">
                    {roleCode ? permissionRoleMap[roleCode]?.name || roleCode : '尚未选择'}
                  </p>
                  <p className="truncate text-[11px] text-slate-400">{roleCode || '未选择'}</p>
                </div>
              </div>
              {roleCode && (
                <div className="mt-3 rounded-lg bg-white px-3 py-2">
                  <p className="text-[11px] text-slate-400">角色说明</p>
                  <p className="mt-1 text-[12px] leading-5 text-slate-700">
                    {permissionRoleMap[roleCode]?.description || '暂无角色说明'}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5">
              <p className="text-[12px] font-semibold text-slate-400">选择新角色</p>
              <div className="relative mt-2">
                <select
                  value={roleCode}
                  onChange={(event) => onChangeRoleCode(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-9 text-[13px] text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-red-300"
                >
                  <option value="">请选择角色</option>
                  {PERMISSION_CENTER_ROLES.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} / {role.id}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
              disabled={saving}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!roleCode || saving || roleUnchanged}
              className="cursor-pointer rounded-lg bg-blue-600 px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {saving ? '保存中…' : roleUnchanged ? '角色未变化' : '保存角色'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
