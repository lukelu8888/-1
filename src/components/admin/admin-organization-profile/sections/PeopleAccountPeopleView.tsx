import React from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, GripVertical, Pencil, Search, X } from 'lucide-react';
import { INPUT } from '../sharedStyles';
import { formatPersonRegion } from '../peopleCenterShared';

const PERSON_REGION_OPTIONS = [
  { value: '', label: '全部 / 未指定' },
  { value: 'all', label: '全部 / 未指定' },
  { value: 'NA', label: '北美区' },
  { value: 'SA', label: '南美区' },
  { value: 'EA', label: '欧非区' },
];

type PeopleAccountPeopleViewProps = {
  peopleViewMode: 'list' | 'org';
  setPeopleViewMode: (value: 'list' | 'org') => void;
  peopleSearch: string;
  setPeopleSearch: (value: string) => void;
  peopleDepartmentFilter: string;
  setPeopleDepartmentFilter: (value: string) => void;
  peopleStatusFilter: string;
  setPeopleStatusFilter: (value: string) => void;
  peopleDepartmentOptions: string[];
  canEdit: boolean;
  isEdit: boolean;
  onCancelEdit: () => void;
  onSave: () => void;
  saving: boolean;
  onAddContact: () => Promise<string | void>;
  setSelectedPersonId: (id: string) => void;
  onEnterEdit: () => void;
  peopleTableContainerRef: React.RefObject<HTMLDivElement | null>;
  setPeopleSortKey: (value: any) => void;
  setDraggingPersonId: (value: string | null) => void;
  draggingPersonId: string | null;
  draggingToTop: boolean;
  isPeopleDragEnabled: boolean;
  isPointerDraggingPeople: boolean;
  setIsPointerDraggingPeople: (value: boolean) => void;
  setDraggingToTop: (value: boolean) => void;
  setDragOverPersonId: (value: string | null) => void;
  handlePeopleDropToTop: () => void;
  peopleTableMinWidth: number;
  getPeopleColumnStyle: (key: any) => React.CSSProperties;
  togglePeopleSort: (key: any) => void;
  renderPeopleSortIcon: (key: any) => React.ReactNode;
  renderPeopleColumnResizeHandle: (key: any) => React.ReactNode;
  peopleOrgRows: any[];
  editablePeopleRows: any[];
  peopleListHierarchyRows: any[];
  directHierarchyMap: Map<string, any>;
  orgHierarchyMap: Map<string, any>;
  visibleListHierarchyMap: Map<string, any>;
  peopleOrgFamilyStyles: Map<string, any>;
  fallbackFamilyStyle: any;
  peopleDepartmentSelectOptions: string[];
  peopleTitleOptionsByDepartment: Record<string, string[]>;
  peopleDescendantIdMap: Map<string, Set<string>>;
  dragOverPersonId: string | null;
  dragOverMode: string;
  selectedPersonId: string;
  resolvePeopleDropMode: (clientY: number, rowRect: DOMRect, canHostChildren: boolean, currentMode: any) => any;
  setDragOverMode: (value: any) => void;
  handlePeopleDrop: (event: React.DragEvent<HTMLTableRowElement>, targetId: string, level: number, canHostChildren: boolean, managerId: string) => void;
  commitPeopleDrop: (targetId: string, level: number, canHostChildren: boolean, managerId: string, clientY: number, rowRect: DOMRect, forcedDropMode?: any) => void;
  resetPeopleDragState: () => void;
  onUpdateContact: (id: string, key: string, value: string | boolean) => void;
  peopleManagerSelectOptions: Array<{ id: string; label: string }>;
  renderHierarchyDots: (level: number, hasHierarchy: boolean, dotClass: string, dotColor: string) => React.ReactNode;
  onRemoveContact: (id: string) => void;
  setPersonDrawerOpen: (open: boolean) => void;
  sortedPeopleRows: any[];
  personDrawerOpen: boolean;
  selectedPerson: any;
  personDialogOffset: { x: number; y: number };
  dragStartRef: React.MutableRefObject<any>;
  peopleManagerLabelMap: Map<string, string>;
};

export function PeopleAccountPeopleView({
  peopleViewMode,
  setPeopleViewMode,
  peopleSearch,
  setPeopleSearch,
  peopleDepartmentFilter,
  setPeopleDepartmentFilter,
  peopleStatusFilter,
  setPeopleStatusFilter,
  peopleDepartmentOptions,
  canEdit,
  isEdit,
  onCancelEdit,
  onSave,
  saving,
  onAddContact,
  setSelectedPersonId,
  onEnterEdit,
  peopleTableContainerRef,
  setPeopleSortKey,
  setDraggingPersonId,
  draggingPersonId,
  draggingToTop,
  isPeopleDragEnabled,
  isPointerDraggingPeople,
  setIsPointerDraggingPeople,
  setDraggingToTop,
  setDragOverPersonId,
  handlePeopleDropToTop,
  peopleTableMinWidth,
  getPeopleColumnStyle,
  togglePeopleSort,
  renderPeopleSortIcon,
  renderPeopleColumnResizeHandle,
  peopleOrgRows,
  editablePeopleRows,
  peopleListHierarchyRows,
  directHierarchyMap,
  orgHierarchyMap,
  visibleListHierarchyMap,
  peopleOrgFamilyStyles,
  fallbackFamilyStyle,
  peopleDepartmentSelectOptions,
  peopleTitleOptionsByDepartment,
  peopleDescendantIdMap,
  dragOverPersonId,
  dragOverMode,
  selectedPersonId,
  resolvePeopleDropMode,
  setDragOverMode,
  handlePeopleDrop,
  commitPeopleDrop,
  resetPeopleDragState,
  onUpdateContact,
  peopleManagerSelectOptions,
  renderHierarchyDots,
  onRemoveContact,
  setPersonDrawerOpen,
  sortedPeopleRows,
  personDrawerOpen,
  selectedPerson,
  personDialogOffset,
  dragStartRef,
  peopleManagerLabelMap,
}: PeopleAccountPeopleViewProps) {
  const [portalReady, setPortalReady] = React.useState(false);

  React.useEffect(() => {
    setPortalReady(true);
    return () => setPortalReady(false);
  }, []);

  const getFluidPeopleColumnStyle = (key: any) => {
    const width = Number.parseFloat(String(getPeopleColumnStyle(key).width || 0));
    const safeTotal = Math.max(peopleTableMinWidth, 1);
    return { width: `${(width / safeTotal) * 100}%` };
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            {[
              { key: 'list', label: '列表视图' },
              { key: 'org', label: '组织视图' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setPeopleViewMode(item.key as 'list' | 'org')}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  peopleViewMode === item.key
                    ? 'bg-red-50 text-red-600'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex min-w-[220px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              value={peopleSearch}
              onChange={(event) => setPeopleSearch(event.target.value)}
              className="w-full bg-transparent text-[12px] text-slate-700 outline-none placeholder:text-slate-400"
              placeholder="搜索姓名 / 工号 / 邮箱 / 部门"
            />
          </div>
          <div className="relative">
            <select
              value={peopleDepartmentFilter}
              onChange={(event) => setPeopleDepartmentFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 pr-8 text-[11px] text-slate-600 outline-none transition-colors hover:border-slate-300 focus:border-red-300"
            >
              <option value="all">部门筛选</option>
              {peopleDepartmentOptions.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>
          <div className="relative">
            <select
              value={peopleStatusFilter}
              onChange={(event) => setPeopleStatusFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 pr-8 text-[11px] text-slate-600 outline-none transition-colors hover:border-slate-300 focus:border-red-300"
            >
              <option value="all">状态筛选</option>
              <option value="在职">在职</option>
              <option value="离职">离职</option>
              <option value="停用">停用</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-slate-500">
            保留人员基础属性，适合给单据、审批、人员目录和组织架构复用。
          </span>
          {canEdit && (
            isEdit ? (
              <>
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  {saving ? '保存中…' : '保存'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const newContactId = await onAddContact();
                    if (newContactId) {
                      setSelectedPersonId(newContactId);
                    }
                  }}
                  disabled={saving}
                  className="inline-flex items-center rounded-lg bg-red-600 px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-red-700"
                >
                  新增人员
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onEnterEdit}
                className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                编辑 · Edit
              </button>
            )
          )}
        </div>
      </div>
      <div ref={peopleTableContainerRef} className="relative overflow-x-hidden rounded-xl border border-slate-200">
        {peopleViewMode === 'org' && (
          <div
            className={`pointer-events-none absolute left-3 right-3 top-10 z-10 transition-all ${
              draggingPersonId ? 'pointer-events-auto' : ''
            }`}
          >
            <div
              className={`text-center text-[11px] font-medium transition-all ${
                draggingPersonId
                  ? `rounded-lg border border-dashed px-3 py-2 ${
                      draggingToTop
                        ? 'border-blue-400 bg-blue-50 text-blue-600'
                        : 'border-slate-200 bg-slate-50/90 text-slate-400'
                    }`
                  : 'h-0 overflow-hidden border-0 px-0 py-0 opacity-0'
              }`}
              onDragOver={(event) => {
                if (!isPeopleDragEnabled || !draggingPersonId) return;
                event.preventDefault();
                setDraggingToTop(true);
                setDragOverPersonId(null);
              }}
              onMouseEnter={() => {
                if (!isPointerDraggingPeople || !draggingPersonId) return;
                setDraggingToTop(true);
                setDragOverPersonId(null);
              }}
              onMouseLeave={() => {
                if (!isPointerDraggingPeople) return;
                setDraggingToTop(false);
              }}
              onDragLeave={() => setDraggingToTop(false)}
              onDrop={(event) => {
                event.preventDefault();
                handlePeopleDropToTop();
              }}
              onMouseUp={() => {
                if (!isPointerDraggingPeople || !draggingPersonId) return;
                handlePeopleDropToTop();
              }}
            >
              {draggingToTop ? '松手后将此人员置于第一位' : '拖到这里可置顶到第一位'}
            </div>
          </div>
        )}
        <table className="w-full table-fixed border-collapse text-[11px]">
          <colgroup>
            <col style={getFluidPeopleColumnStyle('employeeNo')} />
            <col style={getFluidPeopleColumnStyle('name')} />
            <col style={getFluidPeopleColumnStyle('department')} />
            <col style={getFluidPeopleColumnStyle('title')} />
            <col style={getFluidPeopleColumnStyle('region')} />
            <col style={getFluidPeopleColumnStyle('phone')} />
            <col style={getFluidPeopleColumnStyle('email')} />
            <col style={getFluidPeopleColumnStyle('wechat')} />
            <col style={getFluidPeopleColumnStyle('status')} />
            <col style={getFluidPeopleColumnStyle('visibleInDocuments')} />
            <col style={getFluidPeopleColumnStyle('actions')} />
          </colgroup>
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="group relative border-b border-slate-200 px-3 py-2 text-left" style={getFluidPeopleColumnStyle('employeeNo')}><button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => togglePeopleSort('employeeNo')}>工号 {renderPeopleSortIcon('employeeNo')}</button>{!personDrawerOpen && renderPeopleColumnResizeHandle('employeeNo')}</th>
              <th className="group relative border-b border-slate-200 px-3 py-2 text-left" style={getFluidPeopleColumnStyle('name')}><button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => togglePeopleSort('name')}>姓名 {renderPeopleSortIcon('name')}</button>{!personDrawerOpen && renderPeopleColumnResizeHandle('name')}</th>
              <th className="group relative border-b border-slate-200 px-3 py-2 text-left" style={getFluidPeopleColumnStyle('department')}><button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => togglePeopleSort('department')}>部门 {renderPeopleSortIcon('department')}</button>{!personDrawerOpen && renderPeopleColumnResizeHandle('department')}</th>
              <th className="group relative border-b border-slate-200 px-3 py-2 text-left" style={getFluidPeopleColumnStyle('title')}><button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => togglePeopleSort('title')}>岗位 {renderPeopleSortIcon('title')}</button>{!personDrawerOpen && renderPeopleColumnResizeHandle('title')}</th>
              <th className="group relative border-b border-slate-200 px-3 py-2 text-left" style={getFluidPeopleColumnStyle('region')}><button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => togglePeopleSort('region')}>区域 {renderPeopleSortIcon('region')}</button>{!personDrawerOpen && renderPeopleColumnResizeHandle('region')}</th>
              <th className="group relative border-b border-slate-200 px-3 py-2 text-left" style={getFluidPeopleColumnStyle('phone')}><button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => togglePeopleSort('phone')}>手机 {renderPeopleSortIcon('phone')}</button>{!personDrawerOpen && renderPeopleColumnResizeHandle('phone')}</th>
              <th className="group relative border-b border-slate-200 px-3 py-2 text-left" style={getFluidPeopleColumnStyle('email')}><button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => togglePeopleSort('email')}>邮箱 {renderPeopleSortIcon('email')}</button>{!personDrawerOpen && renderPeopleColumnResizeHandle('email')}</th>
              <th className="group relative border-b border-slate-200 px-3 py-2 text-left" style={getFluidPeopleColumnStyle('wechat')}>微信 / WhatsApp{!personDrawerOpen && renderPeopleColumnResizeHandle('wechat')}</th>
              <th className="group relative border-b border-slate-200 px-3 py-2 text-left" style={getFluidPeopleColumnStyle('status')}><button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => togglePeopleSort('status')}>状态 {renderPeopleSortIcon('status')}</button>{!personDrawerOpen && renderPeopleColumnResizeHandle('status')}</th>
              <th className="group relative border-b border-slate-200 px-3 py-2 text-left" style={getFluidPeopleColumnStyle('visibleInDocuments')}><button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => togglePeopleSort('visibleInDocuments')}>单据默认 {renderPeopleSortIcon('visibleInDocuments')}</button>{!personDrawerOpen && renderPeopleColumnResizeHandle('visibleInDocuments')}</th>
              <th className="group relative border-b border-slate-200 px-3 py-2 text-left" style={getFluidPeopleColumnStyle('actions')}>操作{!personDrawerOpen && renderPeopleColumnResizeHandle('actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {(peopleViewMode === 'org'
              ? peopleOrgRows
              : (isEdit ? editablePeopleRows : peopleListHierarchyRows).map((row) => ('row' in row
                ? row
                : { row, level: 0, isParent: false, parentLabel: '', managerId: '', canHostChildren: false, displayEmployeeNo: row.employeeNo, familyRootId: row.id }))
            ).map(({ row, level, isParent, canHostChildren, parentLabel, managerId, displayEmployeeNo, familyRootId }) => {
              const hierarchyMeta = directHierarchyMap.get(row.id)
                || (peopleViewMode === 'org'
                  ? orgHierarchyMap.get(row.id)
                  : visibleListHierarchyMap.get(row.id) || orgHierarchyMap.get(row.id));
              const effectiveLevel = hierarchyMeta?.level ?? level;
              const effectiveIsParent = hierarchyMeta?.isParent ?? isParent;
              const effectiveFamilyRootId = hierarchyMeta?.familyRootId ?? familyRootId;
              const effectiveHasHierarchy = hierarchyMeta?.hasHierarchy ?? Boolean(level > 0 || isParent);
              const familyStyle = peopleOrgFamilyStyles.get(effectiveFamilyRootId) || fallbackFamilyStyle;
              const orgRowTone = peopleViewMode === 'org'
                ? effectiveLevel === 0
                  ? familyStyle.rootRow
                  : familyStyle.childRow
                : 'odd:bg-white even:bg-slate-50/35 hover:bg-slate-50';
              const departmentSelectOptions = Array.from(new Set([
                ...peopleDepartmentSelectOptions,
                String(row.departmentRaw || '').trim(),
              ].filter(Boolean))).sort((a, b) => a.localeCompare(b, 'zh-CN'));
              const titleSelectOptions = Array.from(new Set([
                ...(peopleTitleOptionsByDepartment[row.departmentRaw] || []),
                String(row.titleRaw || '').trim(),
              ].filter(Boolean))).sort((a, b) => a.localeCompare(b, 'zh-CN'));
              const disabledManagerIds = peopleDescendantIdMap.get(row.id) || new Set<string>();
              return (
                <tr
                  key={row.id}
                  className={`transition-colors ${
                    dragOverPersonId === row.id && draggingPersonId !== row.id
                      ? dragOverMode === 'after'
                        ? 'bg-white ring-1 ring-inset ring-blue-200 border-b-2 border-blue-500'
                        : 'bg-blue-50/80 ring-1 ring-inset ring-blue-300'
                      : selectedPersonId === row.id
                        ? 'bg-red-50/60'
                        : orgRowTone
                  } ${draggingPersonId === row.id ? 'opacity-60' : ''}`}
                  onDragOver={(event) => {
                    if (!isPeopleDragEnabled || draggingPersonId === row.id) return;
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                    setDragOverPersonId(row.id);
                    if (peopleViewMode === 'org') {
                      const rowRect = event.currentTarget.getBoundingClientRect();
                      const nextMode = resolvePeopleDropMode(event.clientY, rowRect, canHostChildren, dragOverMode);
                      setDragOverMode(nextMode);
                    } else {
                      setDragOverMode('after');
                    }
                  }}
                  onMouseMove={(event) => {
                    if (!isPointerDraggingPeople || draggingPersonId === row.id) return;
                    setDraggingToTop(false);
                    setDragOverPersonId(row.id);
                    if (peopleViewMode === 'org') {
                      const rowRect = event.currentTarget.getBoundingClientRect();
                      const nextMode = resolvePeopleDropMode(event.clientY, rowRect, canHostChildren, dragOverMode);
                      setDragOverMode(nextMode);
                    } else {
                      setDragOverMode('after');
                    }
                  }}
                  onDrop={(event) => handlePeopleDrop(event, row.id, level, canHostChildren, managerId)}
                  onMouseUp={(event) => {
                    if (!isPointerDraggingPeople || draggingPersonId === row.id) return;
                    commitPeopleDrop(
                      row.id,
                      level,
                      canHostChildren,
                      managerId,
                      event.clientY,
                      event.currentTarget.getBoundingClientRect(),
                      dragOverPersonId === row.id ? dragOverMode : undefined,
                    );
                  }}
                  onDragEnd={() => {
                    resetPeopleDragState();
                  }}
                >
                  <td className="border-b border-slate-100 px-2.5 py-1 text-slate-600">
                    {isEdit ? (
                      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] font-medium text-slate-500">
                        {row.employeeNoRaw || row.employeeNo}
                      </div>
                    ) : peopleViewMode === 'org' ? displayEmployeeNo : row.employeeNo}
                  </td>
                  <td className="border-b border-slate-100 px-2.5 py-1 font-medium text-slate-800">
                    {isEdit ? (
                      <div className="space-y-2">
                        <input
                          className={INPUT}
                          value={row.nameRaw}
                          onChange={(event) => onUpdateContact(row.id, 'name', event.target.value)}
                          placeholder="请输入人员姓名"
                        />
                        <div className="relative">
                          <select
                            className={`${INPUT} appearance-none pr-8`}
                            value={row.managerId || ''}
                            onChange={(event) => onUpdateContact(row.id, 'managerId', event.target.value)}
                          >
                            <option value="">直属上级：无（平级 / 顶层）</option>
                            {peopleManagerSelectOptions.map((option) => (
                              <option
                                key={option.id}
                                value={option.id}
                                disabled={option.id === row.id || disabledManagerIds.has(option.id)}
                              >
                                {option.label}
                                {option.id === row.id ? '（本人）' : disabledManagerIds.has(option.id) ? '（当前下级，不可选）' : ''}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {dragOverPersonId === row.id && draggingPersonId !== row.id && peopleViewMode === 'org' && (
                          <span
                            className={`mb-0.5 inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              dragOverMode === 'after'
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-sky-50 text-sky-600'
                            }`}
                          >
                            {dragOverMode === 'after' ? '将排在此节点后面' : '将挂到此节点下面'}
                          </span>
                        )}
                        {peopleViewMode === 'org' ? (
                          <div className="flex flex-col gap-0">
                            <div
                              className={`flex items-center gap-1.5 ${level === 0 ? 'min-h-[20px]' : 'min-h-[18px]'}`}
                              style={{ paddingLeft: `${level * 18}px` }}
                            >
                              {level > 0 && <span className="font-semibold leading-none text-slate-300">└</span>}
                              <span className={isParent ? 'font-semibold text-slate-900' : 'font-medium text-slate-800'}>
                                {row.name}
                              </span>
                            </div>
                            {level > 0 && parentLabel && (
                              <div
                                className="text-[10px] leading-3.5 text-slate-400"
                                style={{ paddingLeft: `${level * 18 + 18}px` }}
                              >
                                {parentLabel}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>{row.name}</span>
                            {renderHierarchyDots(effectiveLevel, effectiveHasHierarchy, familyStyle.dot, familyStyle.dotColor)}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="border-b border-slate-100 px-2.5 py-1 text-slate-600">
                    {isEdit ? (
                      <div className="relative">
                        <select
                          className={`${INPUT} appearance-none pr-8`}
                          value={row.departmentRaw}
                          onChange={(event) => onUpdateContact(row.id, 'department', event.target.value)}
                        >
                          <option value="">请选择部门</option>
                          {departmentSelectOptions.map((department) => (
                            <option key={department} value={department}>
                              {department}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      </div>
                    ) : row.department}
                  </td>
                  <td className="border-b border-slate-100 px-2.5 py-1 text-slate-600">
                    {isEdit ? (
                      <div className="relative">
                        <select
                          className={`${INPUT} appearance-none pr-8`}
                          value={row.titleRaw}
                          onChange={(event) => onUpdateContact(row.id, 'title', event.target.value)}
                        >
                          <option value="">{row.departmentRaw ? '请选择岗位' : '请先选择部门'}</option>
                          {titleSelectOptions.map((title) => (
                            <option key={title} value={title}>
                              {title}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      </div>
                    ) : row.title}
                  </td>
                  <td className="border-b border-slate-100 px-2.5 py-1 text-slate-600">
                    {isEdit ? (
                      <div className="relative">
                        <select
                          className={`${INPUT} appearance-none pr-8`}
                          value={row.regionRaw || row.region || ''}
                          onChange={(event) => onUpdateContact(row.id, 'region', event.target.value)}
                        >
                          {PERSON_REGION_OPTIONS.map((option) => (
                            <option key={option.value || 'empty'} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      </div>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        {formatPersonRegion(row.region)}
                      </span>
                    )}
                  </td>
                  <td className="border-b border-slate-100 px-2.5 py-1 text-slate-600">
                    {isEdit ? (
                      <input
                        className={INPUT}
                        value={row.phoneRaw}
                        onChange={(event) => onUpdateContact(row.id, 'phone', event.target.value)}
                        placeholder="+86 137..."
                      />
                    ) : row.phone}
                  </td>
                  <td className="border-b border-slate-100 px-2.5 py-1 text-slate-700">
                    {isEdit ? (
                      <input
                        className={INPUT}
                        value={row.emailRaw}
                        onChange={(event) => onUpdateContact(row.id, 'email', event.target.value)}
                        placeholder="buyer@example.com"
                      />
                    ) : row.email}
                  </td>
                  <td className="border-b border-slate-100 px-2.5 py-1 text-slate-600">
                    {isEdit ? (
                      <input
                        className={INPUT}
                        value={row.wechatRaw}
                        onChange={(event) => onUpdateContact(row.id, 'wechat', event.target.value)}
                        placeholder="wechat-id / whatsapp"
                      />
                    ) : row.wechat}
                  </td>
                  <td className="border-b border-slate-100 px-2.5 py-1 text-slate-600">
                    {isEdit ? (
                      <input
                        className={INPUT}
                        value={row.status}
                        onChange={(event) => onUpdateContact(row.id, 'status', event.target.value)}
                        placeholder="在职"
                      />
                    ) : row.status}
                  </td>
                  <td className="border-b border-slate-100 px-2.5 py-1">
                    {isEdit ? (
                      <label className="inline-flex items-center gap-2 text-[12px] text-slate-600">
                        <input
                          type="checkbox"
                          checked={row.visibleInDocuments}
                          onChange={(event) => onUpdateContact(row.id, 'visibleInDocuments', event.target.checked)}
                        />
                        <span>{row.visibleInDocuments ? '是' : '否'}</span>
                      </label>
                    ) : (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${row.visibleInDocuments ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {row.visibleInDocuments ? '是' : '否'}
                      </span>
                    )}
                  </td>
                  <td className="border-b border-slate-100 px-2.5 py-1">
                    <div className={`flex items-center gap-2 ${draggingPersonId ? 'pointer-events-none' : ''}`}>
                      {((isEdit && peopleViewMode === 'list') || (!isEdit && peopleViewMode === 'org' && canEdit)) && (
                        <div
                          role="button"
                          tabIndex={0}
                          draggable={isEdit && peopleViewMode === 'list'}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            if (!isEdit && peopleViewMode === 'org' && canEdit && !saving) {
                              setPeopleSortKey('manual');
                              setDraggingPersonId(row.id);
                              setDragOverPersonId(row.id);
                              setDragOverMode('child');
                              setDraggingToTop(false);
                              setIsPointerDraggingPeople(true);
                            }
                          }}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                          }}
                          onDragStart={(event) => {
                            if (!isEdit && peopleViewMode === 'org') {
                              event.preventDefault();
                              return;
                            }
                            setPeopleSortKey('manual');
                            setDraggingPersonId(row.id);
                            setDragOverPersonId(row.id);
                            event.dataTransfer.effectAllowed = 'move';
                            event.dataTransfer.setData('text/plain', row.id);
                          }}
                          onDragEnd={() => {
                            resetPeopleDragState();
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                            }
                          }}
                          className="inline-flex h-7 w-7 cursor-grab items-center justify-center rounded-md border border-slate-200 text-slate-400 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600 active:cursor-grabbing"
                          title={peopleViewMode === 'org' ? '拖拽调整组织位置并自动保存' : '拖拽调整顺序'}
                          aria-label={peopleViewMode === 'org' ? '拖拽调整组织位置并自动保存' : '拖拽调整顺序'}
                        >
                          <GripVertical className="h-3.5 w-3.5" />
                        </div>
                      )}
                      {!isEdit && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedPersonId(row.id);
                            setPersonDrawerOpen(true);
                          }}
                          className="inline-flex items-center rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        >
                          查看
                        </button>
                      )}
                      {isEdit && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onRemoveContact(row.id);
                            if (selectedPersonId === row.id) {
                              setPersonDrawerOpen(false);
                            }
                          }}
                          className="text-[12px] text-red-500 hover:text-red-600"
                        >
                          删除
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {(peopleViewMode === 'org' ? peopleOrgRows.length === 0 : sortedPeopleRows.length === 0) && (
              <tr>
                <td colSpan={11} className="px-3 py-8 text-center text-[12px] text-slate-400">
                  当前筛选条件下暂无匹配人员
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {portalReady && !isEdit && personDrawerOpen && selectedPerson && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-900/45 p-4">
          <div
            className="relative isolate overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]"
            style={{
              width: '920px',
              maxWidth: 'calc(100vw - 2rem)',
              transform: `translate(${personDialogOffset.x}px, ${personDialogOffset.y}px)`,
            }}
          >
            <div
              className="flex cursor-move items-center justify-between border-b border-slate-200 bg-slate-100 px-6 py-4"
              onMouseDown={(event) => {
                if ((event.target as HTMLElement).closest('button')) return;
                dragStartRef.current = {
                  x: event.clientX,
                  y: event.clientY,
                  offsetX: personDialogOffset.x,
                  offsetY: personDialogOffset.y,
                };
              }}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-[22px] font-semibold text-red-600">
                  {(selectedPerson.name || '人').slice(0, 1)}
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">人员详情</p>
                  <h3 className="mt-1 text-[22px] font-semibold text-slate-900">{selectedPerson.name || '未命名人员'}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
                    <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">{selectedPerson.employeeNo || '未设工号'}</span>
                    <span>{selectedPerson.department || '未设置部门'}</span>
                    <span>/</span>
                    <span>{selectedPerson.title || '未设置岗位'}</span>
                    <span>/</span>
                    <span>{formatPersonRegion(selectedPerson.region)}</span>
                    <span>/</span>
                    <span>{selectedPerson.status || '未设状态'}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPersonDrawerOpen(false)}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[min(68vh,640px)] overflow-y-auto p-6">
              <div className="rounded-2xl border border-slate-200 bg-white">
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 p-5 md:grid-cols-2">
                  <div className="space-y-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">基础信息</p>
                    <div className="grid grid-cols-[88px_minmax(0,1fr)] items-start gap-x-3 gap-y-3">
                      <span className="text-[12px] text-slate-400">工号</span>
                      <span className="text-[14px] font-medium text-slate-800">{selectedPerson.employeeNo || '—'}</span>
                      <span className="text-[12px] text-slate-400">姓名</span>
                      <span className="text-[14px] font-medium text-slate-800">{selectedPerson.name || '—'}</span>
                      <span className="text-[12px] text-slate-400">部门</span>
                      <span className="text-[14px] font-medium text-slate-800">{selectedPerson.department || '—'}</span>
                      <span className="text-[12px] text-slate-400">岗位</span>
                      <span className="text-[14px] font-medium text-slate-800">{selectedPerson.title || '—'}</span>
                      <span className="text-[12px] text-slate-400">区域</span>
                      <span className="text-[14px] font-medium text-slate-800">{formatPersonRegion(selectedPerson.region)}</span>
                      <span className="text-[12px] text-slate-400">直属上级</span>
                      <span className="text-[14px] font-medium text-slate-800">
                        {selectedPerson.managerId ? peopleManagerLabelMap.get(selectedPerson.managerId) || '未匹配到上级档案' : '无（平级 / 顶层）'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">联系方式</p>
                    <div className="grid grid-cols-[88px_minmax(0,1fr)] items-start gap-x-3 gap-y-3">
                      <span className="text-[12px] text-slate-400">手机</span>
                      <span className="text-[14px] font-medium text-slate-800">{selectedPerson.phone || '—'}</span>
                      <span className="text-[12px] text-slate-400">分机</span>
                      <span className="text-[14px] font-medium text-slate-800">{selectedPerson.extension || '—'}</span>
                      <span className="text-[12px] text-slate-400">邮箱</span>
                      <span className="break-all text-[14px] font-medium text-slate-800">{selectedPerson.email || '—'}</span>
                      <span className="text-[12px] text-slate-400">微信 / WhatsApp</span>
                      <span className="text-[14px] font-medium text-slate-800">{selectedPerson.wechat || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 px-5 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">业务设置</p>
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-[12px] text-slate-400">状态</p>
                      <p className="mt-1 text-[16px] font-semibold text-slate-900">{selectedPerson.status || '—'}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-[12px] text-slate-400">单据默认</p>
                      <p className="mt-1 text-[16px] font-semibold text-slate-900">{selectedPerson.visibleInDocuments ? '是' : '否'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-white px-5 py-3">
              <button
                type="button"
                onClick={() => setPersonDrawerOpen(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                关闭
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
