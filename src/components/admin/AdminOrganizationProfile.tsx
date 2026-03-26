/**
 * AdminOrganizationProfile
 * ─────────────────────────────────────────────────────────────────────────────
 * State machine:
 *   'view' ──[编辑 · Edit]──▶ 'edit' ──[保存 · Save]──▶ 'view'
 *                                      ──[取消 · Cancel]─▶ 'view'  (rollback)
 *
 * Layout:
 *   • Basic Info  — left/right dual-column (CN | EN)
 *   • Bank Accounts — two equal side-by-side cards:
 *       Left  = 公账 人民币 CNY  (Chinese fields only)
 *       Right = USD Public Account (English fields only)
 *   • Private Account — single card below
 *
 * Permission: all internal Admin Portal roles may edit.
 */
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft, Building2, Camera, Check, Globe,
  MapPin, Pencil, Phone, Upload, FileText, X,
  CreditCard, DollarSign, User, Lock, Languages, ContactRound, Landmark, FileBadge2, Users, Shield, Search, Clock3,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, GripVertical, Copy, RefreshCcw, Trash2, Ban, Eye,
} from 'lucide-react';
import {
  useAdminOrganization,
  type AdminOrgProfile,
  type BankAccountRMB,
  type BankAccountUSD,
  type BankAccountPrivate,
  type InternalContact,
  type InternalAccount,
} from '../../contexts/AdminOrganizationContext';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';
import { PERMISSION_CENTER_ROLES } from '../../lib/services/permissionCenterService';
import { externalPortalDirectoryService, uiPreferenceService, type ExternalPortalDirectoryEntry } from '../../lib/supabaseService';
import {
  clearPortalPasswordMirror,
  invalidatePortalPasswordMirror,
  listPortalPasswordMirrors,
  markPortalPasswordMirrorNotified,
  resyncPortalPasswordMirror,
  type ExternalPortalType,
  type PortalPasswordMirrorRecord,
} from '../../lib/portalPasswordMirror';

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────────────────────
type Mode = 'view' | 'edit';
type MasterTab = 'basic' | 'bank' | 'people-center' | 'portal-mirror' | 'documents';
type PeopleColumnKey = 'employeeNo' | 'name' | 'department' | 'title' | 'phone' | 'email' | 'wechat' | 'status' | 'visibleInDocuments' | 'actions';
type AccessColumnKey = 'name' | 'employeeNo' | 'department' | 'title' | 'region' | 'username' | 'email' | 'accountStatus' | 'security' | 'role' | 'lastLoginAt' | 'actions';
type RoleColumnKey = 'name' | 'employeeNo' | 'department' | 'title' | 'roleName' | 'roleCode' | 'description' | 'actions';
const PEOPLE_COLUMN_KEYS: PeopleColumnKey[] = ['employeeNo', 'name', 'department', 'title', 'phone', 'email', 'wechat', 'status', 'visibleInDocuments', 'actions'];
const ACCESS_COLUMN_KEYS: AccessColumnKey[] = ['name', 'employeeNo', 'department', 'title', 'region', 'username', 'email', 'accountStatus', 'security', 'role', 'lastLoginAt', 'actions'];
const ROLE_COLUMN_KEYS: RoleColumnKey[] = ['name', 'employeeNo', 'department', 'title', 'roleName', 'roleCode', 'description', 'actions'];

const INPUT =
  'w-full border border-slate-200 rounded-md px-3 py-2 text-[13px] leading-[20px] text-slate-800 ' +
  'focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 ' +
  'transition-colors placeholder:text-slate-300 bg-white';

const TEXTAREA = `${INPUT} resize-none`;
const VAL  = 'text-[13px] text-slate-800 leading-relaxed py-0.5';
const NONE = 'text-[13px] text-slate-300 py-0.5';
const MONO = 'text-[13px] font-mono text-slate-700 tracking-wider py-0.5';
const TABLE_COLUMN_MIN_WIDTH = 72;
const PEOPLE_TABLE_COLUMN_WIDTHS_KEY = 'cosun_people_center_people_table_column_widths_v2';
const ACCESS_TABLE_COLUMN_WIDTHS_KEY = 'cosun_people_center_access_table_column_widths_v2';
const ROLE_TABLE_COLUMN_WIDTHS_KEY = 'cosun_people_center_role_table_column_widths_v2';
const PEOPLE_TABLE_UI_PREFERENCE_KEY = 'admin_company_profile_people_table_column_widths_v2';
const ACCESS_TABLE_UI_PREFERENCE_KEY = 'admin_company_profile_access_table_column_widths_v2';
const ROLE_TABLE_UI_PREFERENCE_KEY = 'admin_company_profile_role_table_column_widths_v2';
const PEOPLE_TABLE_DEFAULT_WIDTHS: Record<PeopleColumnKey, number> = {
  employeeNo: 160,
  name: 170,
  department: 170,
  title: 170,
  phone: 150,
  email: 220,
  wechat: 200,
  status: 110,
  visibleInDocuments: 110,
  actions: 96,
};
const ACCESS_TABLE_DEFAULT_WIDTHS: Record<AccessColumnKey, number> = {
  name: 140,
  employeeNo: 110,
  department: 120,
  title: 140,
  region: 90,
  username: 170,
  email: 170,
  accountStatus: 110,
  security: 140,
  role: 150,
  lastLoginAt: 90,
  actions: 420,
};
const ROLE_TABLE_DEFAULT_WIDTHS: Record<RoleColumnKey, number> = {
  name: 140,
  employeeNo: 110,
  department: 130,
  title: 130,
  roleName: 140,
  roleCode: 140,
  description: 240,
  actions: 120,
};

const renderHierarchyDots = (level: number, hasHierarchy: boolean, dotClassName: string, dotColor?: string) => {
  if (!hasHierarchy) return null;
  const count = Math.max(level + 1, 1);

  return (
    <span
      className="inline-flex flex-row items-center justify-center gap-1"
      aria-label={`层级 ${count}`}
      title={`层级 ${count}`}
    >
      {Array.from({ length: count }).map((_, index) => (
        <span
          key={`${level}-dot-${index}`}
          className={`block h-1.5 w-1.5 rounded-full ${dotClassName}`}
          style={dotColor ? { backgroundColor: dotColor } : undefined}
        />
      ))}
    </span>
  );
};

const distributeColumnWidths = <T extends string>(keys: T[], containerWidth: number) => {
  const baseWidth = TABLE_COLUMN_MIN_WIDTH;
  const totalMinWidth = keys.length * baseWidth;
  if (containerWidth <= totalMinWidth) {
    return Object.fromEntries(keys.map((key) => [key, baseWidth])) as Record<T, number>;
  }
  const extraWidth = containerWidth - totalMinWidth;
  const evenExtra = Math.floor(extraWidth / keys.length);
  const remainder = extraWidth % keys.length;
  return Object.fromEntries(
    keys.map((key, index) => [key, baseWidth + evenExtra + (index < remainder ? 1 : 0)]),
  ) as Record<T, number>;
};

function mergeStoredColumnWidths<T extends string>(
  defaults: Record<T, number>,
  parsed: Partial<Record<T, number>> | null | undefined,
): Record<T, number> {
  return {
    ...defaults,
    ...Object.fromEntries(
      Object.entries(parsed || {}).filter((entry): entry is [T, number] => (
        Object.prototype.hasOwnProperty.call(defaults, entry[0]) &&
        typeof entry[1] === 'number' &&
        entry[1] >= TABLE_COLUMN_MIN_WIDTH
      )),
    ),
  };
}

const ORG_FAMILY_COLOR_PALETTE = [
  {
    rootRow: 'bg-rose-100/85 hover:bg-rose-200/80',
    childRow: 'bg-rose-50/55 hover:bg-rose-100/70',
    rootBlock: 'border-rose-300 bg-rose-100/95',
    childBlock: 'border-rose-200 bg-rose-50/95',
    rail: 'bg-rose-500',
    badge: 'bg-rose-100 text-rose-700',
    dot: 'bg-rose-500',
    dotColor: '#f43f5e',
  },
  {
    rootRow: 'bg-amber-100/85 hover:bg-amber-200/80',
    childRow: 'bg-amber-50/60 hover:bg-amber-100/70',
    rootBlock: 'border-amber-300 bg-amber-100/95',
    childBlock: 'border-amber-200 bg-amber-50/95',
    rail: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
    dotColor: '#f59e0b',
  },
  {
    rootRow: 'bg-emerald-100/85 hover:bg-emerald-200/80',
    childRow: 'bg-emerald-50/60 hover:bg-emerald-100/70',
    rootBlock: 'border-emerald-300 bg-emerald-100/95',
    childBlock: 'border-emerald-200 bg-emerald-50/95',
    rail: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
    dotColor: '#10b981',
  },
  {
    rootRow: 'bg-sky-100/85 hover:bg-sky-200/80',
    childRow: 'bg-sky-50/60 hover:bg-sky-100/70',
    rootBlock: 'border-sky-300 bg-sky-100/95',
    childBlock: 'border-sky-200 bg-sky-50/95',
    rail: 'bg-sky-500',
    badge: 'bg-sky-100 text-sky-700',
    dot: 'bg-sky-500',
    dotColor: '#0ea5e9',
  },
  {
    rootRow: 'bg-violet-100/85 hover:bg-violet-200/80',
    childRow: 'bg-violet-50/60 hover:bg-violet-100/70',
    rootBlock: 'border-violet-300 bg-violet-100/95',
    childBlock: 'border-violet-200 bg-violet-50/95',
    rail: 'bg-violet-500',
    badge: 'bg-violet-100 text-violet-700',
    dot: 'bg-violet-500',
    dotColor: '#8b5cf6',
  },
  {
    rootRow: 'bg-fuchsia-100/85 hover:bg-fuchsia-200/80',
    childRow: 'bg-fuchsia-50/60 hover:bg-fuchsia-100/70',
    rootBlock: 'border-fuchsia-300 bg-fuchsia-100/95',
    childBlock: 'border-fuchsia-200 bg-fuchsia-50/95',
    rail: 'bg-fuchsia-500',
    badge: 'bg-fuchsia-100 text-fuchsia-700',
    dot: 'bg-fuchsia-500',
    dotColor: '#d946ef',
  },
] as const;

function parseEmployeeNoNumber(value: string): number {
  const match = String(value || '').trim().match(/CS-(\d+)/i);
  return match ? Number(match[1]) : 0;
}

function formatEmployeeNo(value: number): string {
  return `CS-${String(value).padStart(3, '0')}`;
}

function getNextEmployeeNo(contacts: InternalContact[]): string {
  const maxNo = contacts.reduce((max, contact) => Math.max(max, parseEmployeeNoNumber(contact.employeeNo)), 0);
  return formatEmployeeNo(maxNo + 1);
}

function generateTemporaryPassword(seed = ''): string {
  const source = `${seed}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
  }

  const upperChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowerChars = 'abcdefghijkmnpqrstuvwxyz';
  const upper = upperChars[hash % upperChars.length];
  const lower = lowerChars[Math.floor(hash / upperChars.length) % lowerChars.length];
  const digits = String(hash % 100).padStart(2, '0');
  return `${upper}${lower}${digits}@cosun`;
}

function buildAccountUsername(contact: Pick<InternalContact, 'employeeNo' | 'name' | 'email'>): string {
  const emailPrefix = String(contact.email || '').split('@')[0]?.trim();
  if (emailPrefix) return emailPrefix;
  const employeeNo = String(contact.employeeNo || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  if (employeeNo) return employeeNo;
  const namePrefix = String(contact.name || '').trim().toLowerCase().replace(/\s+/g, '');
  return namePrefix || `user${Date.now()}`;
}

function getAccountStatusMeta(status?: string, canLogin = true) {
  if (!status || status === '未开通') {
    return {
      label: '未开通',
      className: 'border-slate-200 bg-slate-50 text-slate-500',
    };
  }

  if (status === 'active') {
    return canLogin
      ? {
          label: '已启用',
          className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        }
      : {
          label: '已停用',
          className: 'border-amber-200 bg-amber-50 text-amber-700',
        };
  }

  if (status === 'disabled') {
    return {
      label: '已停用',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
    };
  }

  if (status === 'locked') {
    return {
      label: '已锁定',
      className: 'border-red-200 bg-red-50 text-red-700',
    };
  }

  if (status === 'deleted') {
    return {
      label: '已删除',
      className: 'border-slate-200 bg-slate-100 text-slate-500',
    };
  }

  return {
    label: status,
    className: 'border-slate-200 bg-slate-50 text-slate-600',
  };
}

type OrgStructureItem = {
  id: string;
  employeeNo: string;
  name: string;
  department: string;
  title: string;
  managerId?: string;
};
type OrgDropMode = 'child' | 'after';

function resolvePeopleDropMode(
  clientY: number,
  rowRect: DOMRect,
  canHostChildren: boolean,
  currentMode: OrgDropMode = 'child',
): OrgDropMode {
  if (!canHostChildren) return 'after';
  const relativeY = clientY - rowRect.top;
  const childBoundary = rowRect.height * 0.58;
  const afterBoundary = rowRect.height * 0.82;
  if (relativeY <= childBoundary) return 'child';
  if (relativeY >= afterBoundary) return 'after';
  return currentMode;
}

function buildOrgStructureEntries<T extends OrgStructureItem>(rows: T[]) {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const childrenByManager = new Map<string, T[]>();
  const roots: T[] = [];

  rows.forEach((row) => {
    const resolvedManagerId = row.managerId && row.managerId !== row.id && byId.has(row.managerId) ? row.managerId : '';

    if (resolvedManagerId && resolvedManagerId !== row.id && byId.has(resolvedManagerId)) {
      const current = childrenByManager.get(resolvedManagerId) || [];
      current.push(row);
      childrenByManager.set(resolvedManagerId, current);
    } else {
      roots.push(row);
    }
  });

  const visited = new Set<string>();
  const flattenTree = (
    row: T,
    level: number,
    parentLabel: string,
    parentId: string,
    familyRootId: string,
  ): Array<{
    row: T;
    level: number;
    isParent: boolean;
    canHostChildren: boolean;
    parentLabel: string;
    managerId: string;
    familyRootId: string;
  }> => {
    if (visited.has(row.id)) return [];
    visited.add(row.id);
    const children = childrenByManager.get(row.id) || [];
    return [
      {
        row,
        level,
        isParent: children.length > 0,
        canHostChildren: true,
        parentLabel,
        managerId: parentId,
        familyRootId,
      },
      ...children.flatMap((child) => flattenTree(child, level + 1, `${row.name} / ${row.title}`, row.id, familyRootId)),
    ];
  };

  const entries = roots.flatMap((row) => flattenTree(row, 0, '', '', row.id));
  rows.forEach((row) => {
    if (!visited.has(row.id)) {
      entries.push(...flattenTree(row, 0, '', '', row.id));
    }
  });
  return entries;
}

function normalizeContactEmployeeNos<T extends OrgStructureItem>(contacts: T[]): T[] {
  const orderedIds = buildOrgStructureEntries(contacts).map((entry) => entry.row.id);
  const byId = new Map(contacts.map((contact) => [contact.id, contact]));
  return orderedIds.map((id, index) => ({
    ...byId.get(id)!,
    employeeNo: formatEmployeeNo(index + 1),
  }));
}

function buildReorderedContacts(
  contacts: InternalContact[],
  draggedId: string,
  targetId: string,
  dropMode: OrgDropMode = 'child',
  managerId?: string,
): InternalContact[] {
  if (draggedId === targetId) return contacts;
  const current = [...contacts];
  const draggedIndex = current.findIndex((contact) => contact.id === draggedId);
  const targetIndex = current.findIndex((contact) => contact.id === targetId);
  if (draggedIndex < 0 || targetIndex < 0) return contacts;
  const [dragged] = current.splice(draggedIndex, 1);
  const targetRow = contacts.find((contact) => contact.id === targetId);
  const nextManagerId =
    dropMode === 'child'
      ? targetId
      : (managerId !== undefined ? managerId : targetRow?.managerId || '');
  const nextDragged = { ...dragged, managerId: nextManagerId };
  const orderedEntries = buildOrgStructureEntries(current);
  const targetEntryIndex = orderedEntries.findIndex((entry) => entry.row.id === targetId);
  if (targetEntryIndex < 0) return contacts;
  let branchEndIndex = targetEntryIndex;
  const targetLevel = orderedEntries[targetEntryIndex].level;
  for (let index = targetEntryIndex + 1; index < orderedEntries.length; index += 1) {
    if (orderedEntries[index].level <= targetLevel) break;
    branchEndIndex = index;
  }
  const anchorId = orderedEntries[branchEndIndex]?.row.id || targetId;
  const adjustedTargetIndex = current.findIndex((contact) => contact.id === anchorId);
  if (adjustedTargetIndex < 0) return contacts;
  current.splice(adjustedTargetIndex + 1, 0, nextDragged);
  return normalizeContactEmployeeNos(current);
}

function buildTopInsertedContacts(
  contacts: InternalContact[],
  draggedId: string,
): InternalContact[] {
  const current = [...contacts];
  const draggedIndex = current.findIndex((contact) => contact.id === draggedId);
  if (draggedIndex < 0) return contacts;
  const [dragged] = current.splice(draggedIndex, 1);
  current.unshift({ ...dragged, managerId: '' });
  return normalizeContactEmployeeNos(current);
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout primitives
// ─────────────────────────────────────────────────────────────────────────────

/** Full-width white card section */
function Section({
  title, titleEN, icon, children,
}: {
  title: string; titleEN?: string; icon?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2">
        {icon && <span className="text-slate-400">{icon}</span>}
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-slate-700 tracking-tight">
            {title}
          </span>
          {titleEN && (
            <span className="text-[12px] font-medium text-slate-300 uppercase tracking-wide">
              · {titleEN}
            </span>
          )}
        </div>
      </div>
      <div className="px-6 py-4">{children}</div>
    </div>
  );
}

/**
 * Bilingual dual-column row — left = CN label/field, right = EN label/field.
 * Used for company name, description, address.
 */
function DualRow({
  labelCN, labelEN, leftNode, rightNode,
}: {
  labelCN: string; labelEN: string;
  leftNode: React.ReactNode; rightNode: React.ReactNode;
}) {
  return (
    <div className="py-2 border-b border-slate-50 last:border-0">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex items-start gap-2">
          <p className="w-[112px] shrink-0 pt-1.5 text-[12px] font-medium text-slate-400">
            🇨🇳 {labelCN}：
          </p>
          <div className="min-w-0 flex-1 [&_input]:h-[34px] [&_input]:py-1 [&_textarea]:min-h-[70px] [&_textarea]:py-2">
            {leftNode}
          </div>
        </div>
        <div className="flex items-start gap-2">
          <p className="w-[150px] shrink-0 pt-1.5 text-[12px] font-medium text-slate-400">
            🇺🇸 {labelEN}:
          </p>
          <div className="min-w-0 flex-1 [&_input]:h-[34px] [&_input]:py-1 [&_textarea]:min-h-[70px] [&_textarea]:py-2">
            {rightNode}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Single-column shared row (phone, website — language-neutral) */
function SingleRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-2.5 border-b border-slate-50 last:border-0">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
        {label}
      </p>
      {children}
    </div>
  );
}

/**
 * Bank field row — label + value/input, used inside each bank card.
 */
function BankRow({
  label, children,
}: {
  label: string; children: React.ReactNode;
}) {
  return (
    <div className="py-2 border-b border-slate-50 last:border-0">
      <div className="flex items-start gap-2">
        <p className="w-[104px] shrink-0 pt-1.5 text-[12px] font-medium text-slate-400">
          {label}：
        </p>
        <div className="min-w-0 flex-1 [&_input]:h-[34px] [&_input]:py-1 [&_textarea]:min-h-[70px] [&_textarea]:py-2">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Bank card — a bordered inner card for one bank account block.
 * accent: 'red' for CNY, 'blue' for USD, 'amber' for private
 */
function BankCard({
  flag, title, subtitle, accentColor, children,
}: {
  flag: string; title: string; subtitle: string;
  accentColor: 'red' | 'blue' | 'amber';
  children: React.ReactNode;
}) {
  const headerCls: Record<string, string> = {
    red:   'bg-red-50   border-red-100   text-red-700',
    blue:  'bg-blue-50  border-blue-100  text-blue-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
  };
  const badgeCls: Record<string, string> = {
    red:   'bg-red-100   text-red-600',
    blue:  'bg-blue-100  text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
  };
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className={`px-4 py-3 border-b flex items-center gap-2 ${headerCls[accentColor]}`}>
        <span className="text-lg leading-none">{flag}</span>
        <div>
          <p className="text-[12px] font-bold leading-tight">{title}</p>
          <p className={`text-[10px] font-medium mt-0.5 ${badgeCls[accentColor]} inline-block px-1.5 py-0.5 rounded`}>
            {subtitle}
          </p>
        </div>
      </div>
      <div className="px-4 py-2 bg-white">{children}</div>
    </div>
  );
}

/** Mono account number */
function MonoField({
  isEdit, value, onChange, placeholder,
}: {
  isEdit: boolean; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  if (!isEdit) {
    return value ? <span className={MONO}>{value}</span> : <span className={NONE}>—</span>;
  }
  return (
    <input
      className={INPUT}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode="numeric"
    />
  );
}

/** Logo placeholder showing company initials */
function LogoPlaceholder({ name }: { name: string }) {
  const initials = (name || 'CO').replace(/\s+/g, '').slice(0, 2).toUpperCase();
  return (
    <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-red-50 to-rose-100 border-2 border-dashed border-red-200 flex flex-col items-center justify-center select-none">
      <span className="text-2xl font-bold text-red-400">{initials}</span>
      <span className="text-[9px] text-red-300 mt-0.5">暂无LOGO</span>
    </div>
  );
}

function TabButton({
  active,
  label,
  description,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ minWidth: 220 }}
      className={`min-h-[78px] flex-none rounded-xl border px-4 py-3 text-left transition-colors ${
        active
          ? 'border-red-200 bg-red-50/70 text-red-700 shadow-sm'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 shrink-0 ${active ? 'text-red-600' : 'text-slate-400'}`}>{icon}</div>
        <div>
          <p className="text-[14px] font-semibold leading-none tracking-tight">{label}</p>
          <p className="mt-1.5 text-[11px] leading-5 opacity-80">{description}</p>
        </div>
      </div>
    </button>
  );
}

function PreviewMetricCard({
  label,
  value,
  hint,
  accent = 'slate',
}: {
  label: string;
  value: string | number;
  hint: string;
  accent?: 'slate' | 'blue' | 'green' | 'amber';
}) {
  const accents = {
    slate: 'border-slate-200 bg-white',
    blue: 'border-blue-200 bg-blue-50/60',
    green: 'border-emerald-200 bg-emerald-50/60',
    amber: 'border-amber-200 bg-amber-50/60',
  };

  return (
    <div className={`rounded-lg border px-4 py-3 ${accents[accent]}`}>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
          <p className="mt-1 truncate text-[11px] text-slate-500">{hint}</p>
        </div>
        <div className="shrink-0 text-[22px] font-bold leading-none text-slate-800">{value}</div>
      </div>
    </div>
  );
}

function PeopleAccountCenterModule({
  contacts,
  accounts,
  canEdit,
  isEdit,
  saving,
  onUpdateContact,
  onAutoPatchAccount,
  onAutoProvisionAccount,
  onAutoResetAccountPassword,
  onAddContact,
  onReorderContact,
  onAutoReorderContact,
  onRemoveContact,
  onEnterEdit,
  onCancelEdit,
  onSave,
}: {
  contacts: InternalContact[];
  accounts: InternalAccount[];
  canEdit: boolean;
  isEdit: boolean;
  saving: boolean;
  onUpdateContact: (id: string, key: keyof InternalContact, value: string | boolean) => void;
  onAutoPatchAccount: (id: string, patch: Partial<InternalAccount>, successMessage?: string) => Promise<void>;
  onAutoProvisionAccount: (contactId: string, initialRole?: string) => Promise<void>;
  onAutoResetAccountPassword: (accountId: string) => Promise<void>;
  onAddContact: () => Promise<string | void>;
  onReorderContact: (draggedId: string, targetId: string, dropMode: OrgDropMode, managerId?: string) => void;
  onAutoReorderContact: (draggedId: string, targetId: string, dropMode: OrgDropMode, managerId?: string) => Promise<void>;
  onRemoveContact: (id: string) => void;
  onEnterEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
}) {
  const permissionRoleMap = useMemo(
    () => Object.fromEntries(PERMISSION_CENTER_ROLES.map((role) => [role.id, role])),
    [],
  );

  const getRegionalRoleDisplayName = (code: string, region?: string, fallbackName?: string) => {
    const regionMap: Record<string, string> = {
      NA: '北美区',
      SA: '南美区',
      EA: '欧非区',
    };
    const regionLabel = regionMap[String(region || '').trim()];

    if (!regionLabel) {
      return fallbackName || permissionRoleMap[code]?.name || code;
    }

    if (code === 'Sales_Rep') return `${regionLabel}业务员`;
    if (code === 'Regional_Manager') return `${regionLabel}区域主管`;
    if (code === 'Sales_Assistant') return `${regionLabel}业务助理`;

    return fallbackName || permissionRoleMap[code]?.name || code;
  };

  const resolvePermissionRole = (rawRole?: string, title?: string, department?: string, region?: string) => {
    const role = String(rawRole || '').trim();
    const normalizedTitle = String(title || '').trim();
    const normalizedDepartment = String(department || '').trim();

    const directMap: Record<string, string> = {
      CEO: 'CEO',
      CFO: 'CFO',
      Sales_Director: 'Sales_Director',
      Regional_Manager: 'Regional_Manager',
      Sales_Manager: 'Regional_Manager',
      Sales_Rep: 'Sales_Rep',
      Sales_Assistant: 'Sales_Assistant',
      Order_Coordinator: 'Order_Coordinator',
      Finance: 'Finance',
      External_Accountant: 'External_Accountant',
      Procurement_Manager: 'Procurement_Manager',
      Procurement: 'Procurement',
      Documentation_Officer: 'Documentation_Officer',
      Marketing_Ops: 'Marketing_Ops',
      Marketing_Assistant: 'Marketing_Assistant',
      QC: 'QC',
      Warehouse_Ops: 'Warehouse_Ops',
      HR_Admin: 'HR_Admin',
      Admin_Ops: 'Admin_Ops',
      Admin: 'Admin',
    };

    if (directMap[role]) {
      const code = directMap[role];
      return { code, name: getRegionalRoleDisplayName(code, region, permissionRoleMap[code]?.name || code) };
    }

    const titleMap: Array<{ match: RegExp; code: string }> = [
      { match: /CEO/i, code: 'CEO' },
      { match: /CFO/i, code: 'CFO' },
      { match: /系统管理员|管理员/i, code: 'Admin' },
      { match: /销售总监/i, code: 'Sales_Director' },
      { match: /区域业务经理|区域主管|销售经理/i, code: 'Regional_Manager' },
      { match: /业务员/i, code: 'Sales_Rep' },
      { match: /业务助理/i, code: 'Sales_Assistant' },
      { match: /跟单员/i, code: 'Order_Coordinator' },
      { match: /财务专员|内部财务|财务/i, code: 'Finance' },
      { match: /代理记账/i, code: 'External_Accountant' },
      { match: /采购经理|采购主管/i, code: 'Procurement_Manager' },
      { match: /采购专员|采购员/i, code: 'Procurement' },
      { match: /单证员/i, code: 'Documentation_Officer' },
      { match: /运营专员|市场/i, code: 'Marketing_Ops' },
      { match: /运营助理/i, code: 'Marketing_Assistant' },
      { match: /验货员|QC/i, code: 'QC' },
      { match: /仓配|仓储/i, code: 'Warehouse_Ops' },
      { match: /人事/i, code: 'HR_Admin' },
      { match: /行政/i, code: 'Admin_Ops' },
    ];

    const titleHit = titleMap.find((item) => item.match.test(normalizedTitle));
    if (titleHit) {
      return {
        code: titleHit.code,
        name: getRegionalRoleDisplayName(titleHit.code, region, permissionRoleMap[titleHit.code]?.name || titleHit.code),
      };
    }

    if (role === 'company_admin') {
      const code = normalizedDepartment.includes('IT') ? 'Admin' : 'CEO';
      return { code, name: getRegionalRoleDisplayName(code, region, permissionRoleMap[code]?.name || code) };
    }

    if (role === 'standard_user') {
      const deptFallback =
        normalizedDepartment.includes('财务') ? 'Finance' :
        normalizedDepartment.includes('采购') ? 'Procurement' :
        normalizedDepartment.includes('单证') ? 'Documentation_Officer' :
        normalizedDepartment.includes('市场') ? 'Marketing_Ops' :
        normalizedDepartment.includes('品控') ? 'QC' :
        normalizedDepartment.includes('销售') ? 'Sales_Rep' :
        '';
      if (deptFallback) {
        return {
          code: deptFallback,
          name: getRegionalRoleDisplayName(deptFallback, region, permissionRoleMap[deptFallback]?.name || deptFallback),
        };
      }
    }

    return {
      code: role || 'Unassigned',
      name: getRegionalRoleDisplayName(role || 'Unassigned', region, permissionRoleMap[role]?.name || role || '未分配'),
    };
  };

  const [activeView, setActiveView] = useState<'people' | 'access' | 'roles'>('people');
  const [peopleSearch, setPeopleSearch] = useState('');
  const [peopleDepartmentFilter, setPeopleDepartmentFilter] = useState('all');
  const [peopleStatusFilter, setPeopleStatusFilter] = useState('all');
  const [peopleViewMode, setPeopleViewMode] = useState<'list' | 'org'>('list');
  const [peopleSortKey, setPeopleSortKey] = useState<'manual' | 'name' | 'employeeNo' | 'department' | 'title' | 'phone' | 'email' | 'status' | 'visibleInDocuments'>('manual');
  const [peopleSortDirection, setPeopleSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [personDrawerOpen, setPersonDrawerOpen] = useState(false);
  const [personDialogOffset, setPersonDialogOffset] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const peopleTableContainerRef = useRef<HTMLDivElement | null>(null);
  const accessTableContainerRef = useRef<HTMLDivElement | null>(null);
  const roleTableContainerRef = useRef<HTMLDivElement | null>(null);
  const peopleColumnResizeRef = useRef<{ key: PeopleColumnKey; startX: number; startWidth: number } | null>(null);
  const accessColumnResizeRef = useRef<{ key: AccessColumnKey; startX: number; startWidth: number } | null>(null);
  const roleColumnResizeRef = useRef<{ key: RoleColumnKey; startX: number; startWidth: number } | null>(null);
  const [draggingPersonId, setDraggingPersonId] = useState<string | null>(null);
  const [dragOverPersonId, setDragOverPersonId] = useState<string | null>(null);
  const [dragOverMode, setDragOverMode] = useState<OrgDropMode>('child');
  const [draggingToTop, setDraggingToTop] = useState(false);
  const [isPointerDraggingPeople, setIsPointerDraggingPeople] = useState(false);
  const [peopleColumnWidths, setPeopleColumnWidths] = useState<Record<PeopleColumnKey, number>>(() => {
    if (typeof window === 'undefined') return PEOPLE_TABLE_DEFAULT_WIDTHS;
    try {
      const stored = window.localStorage.getItem(PEOPLE_TABLE_COLUMN_WIDTHS_KEY);
      if (!stored) return PEOPLE_TABLE_DEFAULT_WIDTHS;
      const parsed = JSON.parse(stored) as Partial<Record<PeopleColumnKey, number>>;
      return mergeStoredColumnWidths(PEOPLE_TABLE_DEFAULT_WIDTHS, parsed);
    } catch {
      return PEOPLE_TABLE_DEFAULT_WIDTHS;
    }
  });
  const [peopleHasCustomWidths, setPeopleHasCustomWidths] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return Boolean(window.localStorage.getItem(PEOPLE_TABLE_COLUMN_WIDTHS_KEY));
    } catch {
      return false;
    }
  });
  const [accessSearch, setAccessSearch] = useState('');
  const [accessDepartmentFilter, setAccessDepartmentFilter] = useState('all');
  const [accessRegionFilter, setAccessRegionFilter] = useState('all');
  const [accessStatusFilter, setAccessStatusFilter] = useState('all');
  const [accessSortKey, setAccessSortKey] = useState<'name' | 'employeeNo' | 'department' | 'title' | 'region' | 'email' | 'accountCount' | 'role' | 'lastLoginAt'>('employeeNo');
  const [accessSortDirection, setAccessSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedAccessRowId, setSelectedAccessRowId] = useState('');
  const [accessDrawerOpen, setAccessDrawerOpen] = useState(false);
  const [accessColumnWidths, setAccessColumnWidths] = useState<Record<AccessColumnKey, number>>(() => {
    if (typeof window === 'undefined') return ACCESS_TABLE_DEFAULT_WIDTHS;
    try {
      const stored = window.localStorage.getItem(ACCESS_TABLE_COLUMN_WIDTHS_KEY);
      if (!stored) return ACCESS_TABLE_DEFAULT_WIDTHS;
      const parsed = JSON.parse(stored) as Partial<Record<AccessColumnKey, number>>;
      return mergeStoredColumnWidths(ACCESS_TABLE_DEFAULT_WIDTHS, parsed);
    } catch {
      return ACCESS_TABLE_DEFAULT_WIDTHS;
    }
  });
  const [accessHasCustomWidths, setAccessHasCustomWidths] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return Boolean(window.localStorage.getItem(ACCESS_TABLE_COLUMN_WIDTHS_KEY));
    } catch {
      return false;
    }
  });
  const [roleColumnWidths, setRoleColumnWidths] = useState<Record<RoleColumnKey, number>>(() => {
    if (typeof window === 'undefined') return ROLE_TABLE_DEFAULT_WIDTHS;
    try {
      const stored = window.localStorage.getItem(ROLE_TABLE_COLUMN_WIDTHS_KEY);
      if (!stored) return ROLE_TABLE_DEFAULT_WIDTHS;
      const parsed = JSON.parse(stored) as Partial<Record<RoleColumnKey, number>>;
      return mergeStoredColumnWidths(ROLE_TABLE_DEFAULT_WIDTHS, parsed);
    } catch {
      return ROLE_TABLE_DEFAULT_WIDTHS;
    }
  });
  const [roleHasCustomWidths, setRoleHasCustomWidths] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return Boolean(window.localStorage.getItem(ROLE_TABLE_COLUMN_WIDTHS_KEY));
    } catch {
      return false;
    }
  });
  const [peoplePreferenceHydrated, setPeoplePreferenceHydrated] = useState(false);
  const [accessPreferenceHydrated, setAccessPreferenceHydrated] = useState(false);
  const [rolePreferenceHydrated, setRolePreferenceHydrated] = useState(false);
  const [roleSearch, setRoleSearch] = useState('');
  const [roleDepartmentFilter, setRoleDepartmentFilter] = useState('all');
  const [roleStatusFilter, setRoleStatusFilter] = useState('all');
  const [roleSortKey, setRoleSortKey] = useState<'name' | 'employeeNo' | 'department' | 'title' | 'roleName' | 'roleCode'>('department');
  const [roleSortDirection, setRoleSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRoleRowId, setSelectedRoleRowId] = useState<string>('');
  const [roleEditorRowId, setRoleEditorRowId] = useState<string>('');
  const [roleEditorCode, setRoleEditorCode] = useState<string>('');
  const linkedRows = useMemo(() => contacts.map((contact) => {
    const linkedAccounts = accounts.filter((account) => account.employeeId === contact.id);
    const primaryAccount = linkedAccounts[0];
    const resolvedRole = resolvePermissionRole(primaryAccount?.role, contact.title, contact.department, primaryAccount?.region);
    const roleDefinition = permissionRoleMap[resolvedRole.code];
    return {
      id: contact.id,
      name: contact.name || '未命名人员',
      nameRaw: contact.name || '',
      employeeNo: contact.employeeNo || '—',
      employeeNoRaw: contact.employeeNo || '',
      managerId: contact.managerId || '',
      department: contact.department || '未设置部门',
      departmentRaw: contact.department || '',
      title: contact.title || '未设置岗位',
      titleRaw: contact.title || '',
      phone: contact.phone || '—',
      phoneRaw: contact.phone || '',
      extension: contact.extension || '—',
      extensionRaw: contact.extension || '',
      wechat: contact.wechat || '—',
      wechatRaw: contact.wechat || '',
      region: primaryAccount?.region || 'all',
      email: contact.email || primaryAccount?.loginEmail || '—',
      emailRaw: contact.email || '',
      lastLoginAt: primaryAccount?.lastLoginAt || '—',
      accountStatus: primaryAccount?.accountStatus || '未开通',
      permissionRole: resolvedRole,
      roleDefinition,
      status: contact.status || '在职',
      visibleInDocuments: contact.visibleInDocuments,
      linkedAccounts,
    };
  }), [accounts, contacts, permissionRoleMap]);

  const roleSummary = useMemo(() => {
    const counts = new Map<string, number>();
    linkedRows.forEach((row) => {
      const key = ['Sales_Rep', 'Regional_Manager', 'Sales_Assistant'].includes(row.permissionRole.code)
        ? `${row.permissionRole.code}::${row.region}`
        : row.permissionRole.code;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([role, count]) => ({
        role,
        count,
        name: getRegionalRoleDisplayName(
          role.split('::')[0],
          role.split('::')[1],
          permissionRoleMap[role.split('::')[0]]?.name || role.split('::')[0],
        ),
        description: permissionRoleMap[role.split('::')[0]]?.description || '暂无权限说明',
      }))
      .sort((a, b) => b.count - a.count);
  }, [linkedRows, permissionRoleMap]);

  const peopleDepartmentOptions = useMemo(
    () => Array.from(new Set(linkedRows.map((row) => row.department).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'zh-CN')),
    [linkedRows],
  );

  const filteredPeopleRows = useMemo(() => {
    const keyword = peopleSearch.trim().toLowerCase();
    return linkedRows.filter((row) => {
      const status = contacts.find((contact) => contact.id === row.id)?.status || '';
      const matchesKeyword =
        !keyword ||
        `${row.name} ${row.employeeNo} ${row.department} ${row.title} ${row.phone} ${row.email}`.toLowerCase().includes(keyword);
      const matchesDepartment = peopleDepartmentFilter === 'all' || row.department === peopleDepartmentFilter;
      const matchesStatus = peopleStatusFilter === 'all' || status === peopleStatusFilter;
      return matchesKeyword && matchesDepartment && matchesStatus;
    });
  }, [contacts, linkedRows, peopleDepartmentFilter, peopleSearch, peopleStatusFilter]);

  const sortedPeopleRows = useMemo(() => {
    const rows = [...filteredPeopleRows];
    if (peopleSortKey === 'manual') {
      return rows;
    }
    rows.sort((a, b) => {
      const valueA = peopleSortKey === 'visibleInDocuments' ? (a.visibleInDocuments ? 1 : 0) : a[peopleSortKey];
      const valueB = peopleSortKey === 'visibleInDocuments' ? (b.visibleInDocuments ? 1 : 0) : b[peopleSortKey];
      const normalizedA = String(valueA || '').toLowerCase();
      const normalizedB = String(valueB || '').toLowerCase();
      if (normalizedA < normalizedB) return peopleSortDirection === 'asc' ? -1 : 1;
      if (normalizedA > normalizedB) return peopleSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [filteredPeopleRows, peopleSortDirection, peopleSortKey]);

  const editablePeopleRows = useMemo(() => filteredPeopleRows, [filteredPeopleRows]);

  useEffect(() => {
    if (!sortedPeopleRows.length) {
      setSelectedPersonId('');
      setPersonDrawerOpen(false);
      return;
    }
    if (!selectedPersonId || !sortedPeopleRows.some((row) => row.id === selectedPersonId)) {
      setSelectedPersonId(sortedPeopleRows[0].id);
    }
  }, [selectedPersonId, sortedPeopleRows]);

  useEffect(() => {
    if (isEdit) {
      setPersonDrawerOpen(false);
    }
  }, [isEdit]);

  useEffect(() => {
    if (activeView !== 'people') {
      setPersonDrawerOpen(false);
    }
  }, [activeView]);

  useEffect(() => {
    if (!personDrawerOpen || isEdit) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (!dragStartRef.current) return;
      setPersonDialogOffset({
        x: dragStartRef.current.offsetX + (event.clientX - dragStartRef.current.x),
        y: dragStartRef.current.offsetY + (event.clientY - dragStartRef.current.y),
      });
    };

    const handleMouseUp = () => {
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isEdit, personDrawerOpen]);

  useEffect(() => {
    if (personDrawerOpen) {
      setPersonDialogOffset({ x: 0, y: 0 });
    }
  }, [personDrawerOpen, selectedPersonId]);

  useEffect(() => {
    if (!peopleHasCustomWidths) return;
    try {
      window.localStorage.setItem(PEOPLE_TABLE_COLUMN_WIDTHS_KEY, JSON.stringify(peopleColumnWidths));
    } catch {
      // Ignore persistence failures and keep the in-memory widths.
    }
  }, [peopleColumnWidths, peopleHasCustomWidths]);

  useEffect(() => {
    if (!accessHasCustomWidths) return;
    try {
      window.localStorage.setItem(ACCESS_TABLE_COLUMN_WIDTHS_KEY, JSON.stringify(accessColumnWidths));
    } catch {
      // Ignore persistence failures and keep the in-memory widths.
    }
  }, [accessColumnWidths, accessHasCustomWidths]);

  useEffect(() => {
    if (!roleHasCustomWidths) return;
    try {
      window.localStorage.setItem(ROLE_TABLE_COLUMN_WIDTHS_KEY, JSON.stringify(roleColumnWidths));
    } catch {
      // Ignore persistence failures and keep the in-memory widths.
    }
  }, [roleColumnWidths, roleHasCustomWidths]);

  useEffect(() => {
    let cancelled = false;
    const loadRemotePreference = async () => {
      try {
        const value = await uiPreferenceService.get(PEOPLE_TABLE_UI_PREFERENCE_KEY);
        if (cancelled) return;
        if (value) {
          setPeopleColumnWidths(mergeStoredColumnWidths(PEOPLE_TABLE_DEFAULT_WIDTHS, value as Partial<Record<PeopleColumnKey, number>>));
          setPeopleHasCustomWidths(true);
        }
      } catch {
        // fall back to local cache silently
      } finally {
        if (!cancelled) setPeoplePreferenceHydrated(true);
      }
    };
    void loadRemotePreference();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadRemotePreference = async () => {
      try {
        const value = await uiPreferenceService.get(ACCESS_TABLE_UI_PREFERENCE_KEY);
        if (cancelled) return;
        if (value) {
          setAccessColumnWidths(mergeStoredColumnWidths(ACCESS_TABLE_DEFAULT_WIDTHS, value as Partial<Record<AccessColumnKey, number>>));
          setAccessHasCustomWidths(true);
        }
      } catch {
        // fall back to local cache silently
      } finally {
        if (!cancelled) setAccessPreferenceHydrated(true);
      }
    };
    void loadRemotePreference();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadRemotePreference = async () => {
      try {
        const value = await uiPreferenceService.get(ROLE_TABLE_UI_PREFERENCE_KEY);
        if (cancelled) return;
        if (value) {
          setRoleColumnWidths(mergeStoredColumnWidths(ROLE_TABLE_DEFAULT_WIDTHS, value as Partial<Record<RoleColumnKey, number>>));
          setRoleHasCustomWidths(true);
        }
      } catch {
        // fall back to local cache silently
      } finally {
        if (!cancelled) setRolePreferenceHydrated(true);
      }
    };
    void loadRemotePreference();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!peopleHasCustomWidths || !peoplePreferenceHydrated) return;
    const timer = window.setTimeout(() => {
      void uiPreferenceService.save(PEOPLE_TABLE_UI_PREFERENCE_KEY, peopleColumnWidths).catch(() => {
        // keep local cache as fallback
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [peopleColumnWidths, peopleHasCustomWidths, peoplePreferenceHydrated]);

  useEffect(() => {
    if (!accessHasCustomWidths || !accessPreferenceHydrated) return;
    const timer = window.setTimeout(() => {
      void uiPreferenceService.save(ACCESS_TABLE_UI_PREFERENCE_KEY, accessColumnWidths).catch(() => {
        // keep local cache as fallback
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [accessColumnWidths, accessHasCustomWidths, accessPreferenceHydrated]);

  useEffect(() => {
    if (!roleHasCustomWidths || !rolePreferenceHydrated) return;
    const timer = window.setTimeout(() => {
      void uiPreferenceService.save(ROLE_TABLE_UI_PREFERENCE_KEY, roleColumnWidths).catch(() => {
        // keep local cache as fallback
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [roleColumnWidths, roleHasCustomWidths, rolePreferenceHydrated]);

  useEffect(() => {
    if (peopleHasCustomWidths || !peopleTableContainerRef.current || typeof ResizeObserver === 'undefined') return;
    const element = peopleTableContainerRef.current;
    const applyAutoWidths = (width: number) => {
      setPeopleColumnWidths((current) => {
        const next = distributeColumnWidths(PEOPLE_COLUMN_KEYS, Math.max(width, PEOPLE_COLUMN_KEYS.length * TABLE_COLUMN_MIN_WIDTH));
        return JSON.stringify(current) === JSON.stringify(next) ? current : next;
      });
    };
    applyAutoWidths(element.clientWidth);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      applyAutoWidths(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [peopleHasCustomWidths]);

  useEffect(() => {
    if (accessHasCustomWidths || !accessTableContainerRef.current || typeof ResizeObserver === 'undefined') return;
    const element = accessTableContainerRef.current;
    const applyAutoWidths = (width: number) => {
      setAccessColumnWidths((current) => {
        const next = distributeColumnWidths(ACCESS_COLUMN_KEYS, Math.max(width, ACCESS_COLUMN_KEYS.length * TABLE_COLUMN_MIN_WIDTH));
        return JSON.stringify(current) === JSON.stringify(next) ? current : next;
      });
    };
    applyAutoWidths(element.clientWidth);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      applyAutoWidths(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [accessHasCustomWidths]);

  useEffect(() => {
    if (roleHasCustomWidths || !roleTableContainerRef.current || typeof ResizeObserver === 'undefined') return;
    const element = roleTableContainerRef.current;
    const applyAutoWidths = (width: number) => {
      setRoleColumnWidths((current) => {
        const next = distributeColumnWidths(ROLE_COLUMN_KEYS, Math.max(width, ROLE_COLUMN_KEYS.length * TABLE_COLUMN_MIN_WIDTH));
        return JSON.stringify(current) === JSON.stringify(next) ? current : next;
      });
    };
    applyAutoWidths(element.clientWidth);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      applyAutoWidths(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [roleHasCustomWidths]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (peopleColumnResizeRef.current) {
        const { key, startX, startWidth } = peopleColumnResizeRef.current;
        const nextWidth = Math.max(TABLE_COLUMN_MIN_WIDTH, Math.round(startWidth + (event.clientX - startX)));
        setPeopleColumnWidths((current) => (
          current[key] === nextWidth ? current : { ...current, [key]: nextWidth }
        ));
        return;
      }

      if (accessColumnResizeRef.current) {
        const { key, startX, startWidth } = accessColumnResizeRef.current;
        const nextWidth = Math.max(TABLE_COLUMN_MIN_WIDTH, Math.round(startWidth + (event.clientX - startX)));
        setAccessColumnWidths((current) => (
          current[key] === nextWidth ? current : { ...current, [key]: nextWidth }
        ));
        return;
      }

      if (roleColumnResizeRef.current) {
        const { key, startX, startWidth } = roleColumnResizeRef.current;
        const nextWidth = Math.max(TABLE_COLUMN_MIN_WIDTH, Math.round(startWidth + (event.clientX - startX)));
        setRoleColumnWidths((current) => (
          current[key] === nextWidth ? current : { ...current, [key]: nextWidth }
        ));
      }
    };

    const stopResize = () => {
      peopleColumnResizeRef.current = null;
      accessColumnResizeRef.current = null;
      roleColumnResizeRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResize);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResize);
    };
  }, []);

  useEffect(() => {
    if (!isPointerDraggingPeople) return;

    const stopPointerDrag = () => {
      setIsPointerDraggingPeople(false);
      setDraggingPersonId(null);
      setDragOverPersonId(null);
      setDragOverMode('child');
      setDraggingToTop(false);
    };

    window.addEventListener('mouseup', stopPointerDrag);
    window.addEventListener('blur', stopPointerDrag);
    return () => {
      window.removeEventListener('mouseup', stopPointerDrag);
      window.removeEventListener('blur', stopPointerDrag);
    };
  }, [isPointerDraggingPeople]);

  const selectedPerson = contacts.find((contact) => contact.id === selectedPersonId) || null;
  const editablePeopleRowIds = useMemo(() => editablePeopleRows.map((row) => row.id), [editablePeopleRows]);
  const isPeopleDragEnabled = (isEdit && peopleViewMode === 'list') || (!isEdit && peopleViewMode === 'org' && canEdit && !saving);
  const peopleTableMinWidth = useMemo(
    () => Object.values(peopleColumnWidths).reduce((sum, width) => sum + width, 0),
    [peopleColumnWidths],
  );
  const accessTableMinWidth = useMemo(
    () => Object.values(accessColumnWidths).reduce((sum, width) => sum + width, 0),
    [accessColumnWidths],
  );
  const roleTableMinWidth = useMemo(
    () => Object.values(roleColumnWidths).reduce((sum, width) => sum + width, 0),
    [roleColumnWidths],
  );

  const orgHierarchyEntries = useMemo(
    () => buildOrgStructureEntries(linkedRows),
    [linkedRows],
  );

  const peopleListHierarchyRows = useMemo(() => {
    const filteredIds = new Set(sortedPeopleRows.map((row) => row.id));
    return orgHierarchyEntries
      .filter((entry) => filteredIds.has(entry.row.id))
      .map((entry) => ({
        ...entry,
        displayEmployeeNo: entry.row.employeeNo,
      }));
  }, [orgHierarchyEntries, sortedPeopleRows]);

  const visibleListHierarchyMap = useMemo(
    () => new Map(peopleListHierarchyRows.map((entry) => [
      entry.row.id,
      {
        level: entry.level,
        isParent: entry.isParent,
        familyRootId: entry.familyRootId,
        hasHierarchy: entry.level > 0 || entry.isParent,
      },
    ])),
    [peopleListHierarchyRows],
  );

  const orgHierarchyMap = useMemo(
    () => new Map(orgHierarchyEntries.map((entry) => [
      entry.row.id,
      {
        level: entry.level,
        isParent: entry.isParent,
        familyRootId: entry.familyRootId,
        parentLabel: entry.parentLabel,
        managerId: entry.managerId,
        hasHierarchy: entry.level > 0 || entry.isParent,
      },
    ])),
    [orgHierarchyEntries],
  );

  const directHierarchyMap = useMemo(() => {
    const byId = new Map(linkedRows.map((row) => [row.id, row]));
    const childrenByManager = new Map<string, string[]>();

    linkedRows.forEach((row) => {
      const managerId = row.managerId && row.managerId !== row.id && byId.has(row.managerId) ? row.managerId : '';
      if (!managerId) return;
      const current = childrenByManager.get(managerId) || [];
      current.push(row.id);
      childrenByManager.set(managerId, current);
    });

    const cache = new Map<string, { level: number; familyRootId: string }>();
    const resolve = (rowId: string, visiting = new Set<string>()): { level: number; familyRootId: string } => {
      const cached = cache.get(rowId);
      if (cached) return cached;
      if (visiting.has(rowId)) {
        const fallback = { level: 0, familyRootId: rowId };
        cache.set(rowId, fallback);
        return fallback;
      }

      const row = byId.get(rowId);
      const managerId = row?.managerId && row.managerId !== row.id && byId.has(row.managerId) ? row.managerId : '';
      if (!managerId) {
        const rootMeta = { level: 0, familyRootId: rowId };
        cache.set(rowId, rootMeta);
        return rootMeta;
      }

      visiting.add(rowId);
      const parentMeta = resolve(managerId, visiting);
      visiting.delete(rowId);
      const nextMeta = {
        level: parentMeta.level + 1,
        familyRootId: parentMeta.familyRootId || managerId,
      };
      cache.set(rowId, nextMeta);
      return nextMeta;
    };

    return new Map(
      linkedRows.map((row) => {
        const resolved = resolve(row.id);
        const isParent = (childrenByManager.get(row.id) || []).length > 0;
        return [
          row.id,
          {
            level: resolved.level,
            familyRootId: resolved.familyRootId,
            isParent,
            hasHierarchy: resolved.level > 0 || isParent,
          },
        ] as const;
      }),
    );
  }, [linkedRows]);

  const peopleOrgRows = useMemo(() => {
    const filteredIds = new Set(sortedPeopleRows.map((row) => row.id));
    let visibleIndex = 0;
    return orgHierarchyEntries
      .filter((entry) => filteredIds.has(entry.row.id))
      .map((entry) => {
        visibleIndex += 1;
        return {
          ...entry,
          displayEmployeeNo: formatEmployeeNo(visibleIndex),
        };
      });
  }, [orgHierarchyEntries, sortedPeopleRows]);

  const peopleOrgFamilyStyles = useMemo(() => {
    const rootIds = Array.from(new Set(
      orgHierarchyEntries
        .filter((entry) => entry.level === 0)
        .map((entry) => entry.familyRootId),
    ));
    return new Map(
      rootIds.map((rootId, index) => [
        rootId,
        ORG_FAMILY_COLOR_PALETTE[index % ORG_FAMILY_COLOR_PALETTE.length],
      ]),
    );
  }, [orgHierarchyEntries]);

  const resetPeopleDragState = () => {
    setDraggingPersonId(null);
    setDragOverPersonId(null);
    setDragOverMode('child');
    setDraggingToTop(false);
    setIsPointerDraggingPeople(false);
  };

  const commitPeopleDrop = (
    targetId: string,
    level: number,
    canHostChildren: boolean,
    managerId: string | undefined,
    clientY: number,
    rowRect: DOMRect,
    forcedDropMode?: OrgDropMode,
  ) => {
    if (!isPeopleDragEnabled || !draggingPersonId || draggingPersonId === targetId) return;
    setPeopleSortKey('manual');
    const dropMode: OrgDropMode =
      forcedDropMode || (peopleViewMode === 'org'
        ? resolvePeopleDropMode(clientY, rowRect, canHostChildren, dragOverMode)
        : 'child');
    const nextManagerId =
      peopleViewMode === 'org'
        ? (dropMode === 'child' ? targetId : level > 0 ? (managerId || '') : '')
        : targetId;
    if (isEdit) {
      onReorderContact(draggingPersonId, targetId, dropMode, nextManagerId);
    } else {
      void onAutoReorderContact(draggingPersonId, targetId, dropMode, nextManagerId);
    }
    resetPeopleDragState();
  };

  const handlePeopleDrop = (
    event: React.DragEvent<HTMLTableRowElement>,
    targetId: string,
    level: number,
    canHostChildren: boolean,
    managerId?: string,
  ) => {
    if (!isPeopleDragEnabled || !draggingPersonId || draggingPersonId === targetId) return;
    event.preventDefault();
    commitPeopleDrop(
      targetId,
      level,
      canHostChildren,
      managerId,
      event.clientY,
      event.currentTarget.getBoundingClientRect(),
      dragOverPersonId === targetId ? dragOverMode : undefined,
    );
  };

  const handlePeopleDropToTop = () => {
    if (!isPeopleDragEnabled || !draggingPersonId) return;
    setPeopleSortKey('manual');
    if (isEdit) {
      onReorderContact(draggingPersonId, draggingPersonId, 'after', '__TOP__');
    } else {
      void onAutoReorderContact(draggingPersonId, draggingPersonId, 'after', '__TOP__');
    }
    resetPeopleDragState();
  };

  const togglePeopleSort = (key: 'name' | 'employeeNo' | 'department' | 'title' | 'phone' | 'email' | 'status' | 'visibleInDocuments') => {
    if (peopleSortKey === key) {
      setPeopleSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setPeopleSortKey(key);
    setPeopleSortDirection('asc');
  };

  const renderPeopleSortIcon = (key: 'name' | 'employeeNo' | 'department' | 'title' | 'phone' | 'email' | 'status' | 'visibleInDocuments') => {
    if (peopleSortKey !== key) return <ArrowUpDown className="h-3.5 w-3.5 text-slate-300" />;
    return peopleSortDirection === 'asc'
      ? <ArrowUp className="h-3.5 w-3.5 text-red-500" />
      : <ArrowDown className="h-3.5 w-3.5 text-red-500" />;
  };

  const startPeopleColumnResize = (key: PeopleColumnKey, event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setPeopleHasCustomWidths(true);
    peopleColumnResizeRef.current = {
      key,
      startX: event.clientX,
      startWidth: peopleColumnWidths[key],
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const shrinkPeopleColumnToMinimum = (key: PeopleColumnKey, event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setPeopleHasCustomWidths(true);
    setPeopleColumnWidths((current) => (
      current[key] === TABLE_COLUMN_MIN_WIDTH ? current : { ...current, [key]: TABLE_COLUMN_MIN_WIDTH }
    ));
  };

  const getPeopleColumnStyle = (key: PeopleColumnKey) => ({
    width: `${peopleColumnWidths[key]}px`,
    minWidth: `${peopleColumnWidths[key]}px`,
  });

  const startAccessColumnResize = (key: AccessColumnKey, event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setAccessHasCustomWidths(true);
    accessColumnResizeRef.current = {
      key,
      startX: event.clientX,
      startWidth: accessColumnWidths[key],
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const shrinkAccessColumnToMinimum = (key: AccessColumnKey, event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setAccessHasCustomWidths(true);
    setAccessColumnWidths((current) => (
      current[key] === TABLE_COLUMN_MIN_WIDTH ? current : { ...current, [key]: TABLE_COLUMN_MIN_WIDTH }
    ));
  };

  const startRoleColumnResize = (key: RoleColumnKey, event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setRoleHasCustomWidths(true);
    roleColumnResizeRef.current = {
      key,
      startX: event.clientX,
      startWidth: roleColumnWidths[key],
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const shrinkRoleColumnToMinimum = (key: RoleColumnKey, event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setRoleHasCustomWidths(true);
    setRoleColumnWidths((current) => (
      current[key] === TABLE_COLUMN_MIN_WIDTH ? current : { ...current, [key]: TABLE_COLUMN_MIN_WIDTH }
    ));
  };

  const renderPeopleColumnResizeHandle = (key: PeopleColumnKey) => (
    <div
      className="absolute right-0 top-0 z-20 h-full w-3 cursor-col-resize select-none"
      onMouseDown={(event) => startPeopleColumnResize(key, event)}
      onDoubleClick={(event) => shrinkPeopleColumnToMinimum(key, event)}
      title="拖动调整列宽，双击缩到最小"
    >
      <span className="pointer-events-none absolute left-1/2 top-1/2 h-6 w-px -translate-x-1/2 -translate-y-1/2 bg-slate-300 transition-colors group-hover:bg-slate-400" />
    </div>
  );

  const renderAccessColumnResizeHandle = (key: AccessColumnKey) => (
    <div
      className="absolute right-0 top-0 z-20 h-full w-3 cursor-col-resize select-none"
      onMouseDown={(event) => startAccessColumnResize(key, event)}
      onDoubleClick={(event) => shrinkAccessColumnToMinimum(key, event)}
      title="拖动调整列宽，双击缩到最小"
    >
      <span className="pointer-events-none absolute left-1/2 top-1/2 h-6 w-px -translate-x-1/2 -translate-y-1/2 bg-slate-300 transition-colors group-hover:bg-slate-400" />
    </div>
  );

  const getAccessColumnStyle = (key: AccessColumnKey) => ({
    width: `${accessColumnWidths[key]}px`,
    minWidth: `${accessColumnWidths[key]}px`,
  });

  const renderRoleColumnResizeHandle = (key: RoleColumnKey) => (
    <div
      className={`absolute right-0 top-0 z-20 h-full w-3 cursor-col-resize select-none ${key === 'actions' ? 'hidden' : ''}`}
      onMouseDown={(event) => startRoleColumnResize(key, event)}
      onDoubleClick={(event) => shrinkRoleColumnToMinimum(key, event)}
      title="拖动调整列宽，双击缩到最小"
    >
      <span className="pointer-events-none absolute left-1/2 top-1/2 h-6 w-px -translate-x-1/2 -translate-y-1/2 bg-slate-300 transition-colors group-hover:bg-slate-500" />
      <span className="pointer-events-none absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-slate-300 shadow-sm transition-colors group-hover:bg-slate-500" />
    </div>
  );

  const getRoleColumnStyle = (key: RoleColumnKey) => ({
    width: `${roleColumnWidths[key]}px`,
    minWidth: `${roleColumnWidths[key]}px`,
  });

  const accessDepartmentOptions = useMemo(
    () => Array.from(new Set(linkedRows.map((row) => row.department).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'zh-CN')),
    [linkedRows],
  );

  const accessRegionOptions = useMemo(
    () => Array.from(new Set(linkedRows.map((row) => row.region).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'zh-CN')),
    [linkedRows],
  );

  const filteredAccessRows = useMemo(() => {
    const keyword = accessSearch.trim().toLowerCase();
    return linkedRows.filter((row) => {
      const primaryRoles = row.linkedAccounts.map((account) => account.role).join(' ');
      const matchesKeyword =
        !keyword ||
        `${row.name} ${row.employeeNo} ${row.email} ${row.department} ${row.title} ${primaryRoles}`.toLowerCase().includes(keyword);
      const matchesDepartment = accessDepartmentFilter === 'all' || row.department === accessDepartmentFilter;
      const matchesRegion = accessRegionFilter === 'all' || row.region === accessRegionFilter;
      const matchesStatus = accessStatusFilter === 'all' || row.accountStatus === accessStatusFilter;
      return matchesKeyword && matchesDepartment && matchesRegion && matchesStatus;
    });
  }, [accessDepartmentFilter, accessRegionFilter, accessSearch, accessStatusFilter, linkedRows]);

  const sortedAccessRows = useMemo(() => {
    const rows = [...filteredAccessRows];
    rows.sort((a, b) => {
      const valueA =
        accessSortKey === 'accountCount' ? a.linkedAccounts.length :
        accessSortKey === 'role' ? (a.permissionRole.code || '') :
        a[accessSortKey];
      const valueB =
        accessSortKey === 'accountCount' ? b.linkedAccounts.length :
        accessSortKey === 'role' ? (b.permissionRole.code || '') :
        b[accessSortKey];

      const normalizedA = typeof valueA === 'number' ? valueA : String(valueA || '').toLowerCase();
      const normalizedB = typeof valueB === 'number' ? valueB : String(valueB || '').toLowerCase();
      if (normalizedA < normalizedB) return accessSortDirection === 'asc' ? -1 : 1;
      if (normalizedA > normalizedB) return accessSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [accessSortDirection, accessSortKey, filteredAccessRows]);

  useEffect(() => {
    if (!sortedAccessRows.length) {
      setSelectedAccessRowId('');
      setAccessDrawerOpen(false);
      return;
    }
    if (!selectedAccessRowId || !sortedAccessRows.some((row) => row.id === selectedAccessRowId)) {
      setSelectedAccessRowId(sortedAccessRows[0].id);
    }
  }, [selectedAccessRowId, sortedAccessRows]);

  const selectedAccessRow = sortedAccessRows.find((row) => row.id === selectedAccessRowId) || sortedAccessRows[0] || null;

  useEffect(() => {
    if (activeView !== 'access') {
      setAccessDrawerOpen(false);
    }
  }, [activeView]);

  const toggleAccessSort = (key: 'name' | 'employeeNo' | 'department' | 'title' | 'region' | 'email' | 'accountCount' | 'role' | 'lastLoginAt') => {
    if (accessSortKey === key) {
      setAccessSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setAccessSortKey(key);
    setAccessSortDirection('asc');
  };

  const renderAccessSortIcon = (key: 'name' | 'employeeNo' | 'department' | 'title' | 'region' | 'email' | 'accountCount' | 'role' | 'lastLoginAt') => {
    if (accessSortKey !== key) return <ArrowUpDown className="h-3.5 w-3.5 text-slate-300" />;
    return accessSortDirection === 'asc'
      ? <ArrowUp className="h-3.5 w-3.5 text-red-500" />
      : <ArrowDown className="h-3.5 w-3.5 text-red-500" />;
  };

  const handleProvisionAccount = async (contactId: string) => {
    await onAutoProvisionAccount(contactId);
    setSelectedAccessRowId(contactId);
  };

  const handleToggleAccountStatus = async (row: typeof sortedAccessRows[number]) => {
    const primaryAccount = row.linkedAccounts[0];
    if (!primaryAccount) return;
    const nextActive = !(primaryAccount.accountStatus === 'active' && primaryAccount.canLogin);
    await onAutoPatchAccount(
      primaryAccount.id,
      {
        accountStatus: nextActive ? 'active' : 'disabled',
        canLogin: nextActive,
      },
      nextActive ? '账号已启用' : '账号已停用',
    );
    setSelectedAccessRowId(row.id);
  };

  const handleToggleForcePasswordReset = async (row: typeof sortedAccessRows[number]) => {
    const primaryAccount = row.linkedAccounts[0];
    if (!primaryAccount) return;
    await onAutoPatchAccount(
      primaryAccount.id,
      {
        forcePasswordReset: !primaryAccount.forcePasswordReset,
      },
      !primaryAccount.forcePasswordReset ? '已设为下次登录强制改密' : '已取消强制改密',
    );
    setSelectedAccessRowId(row.id);
  };

  const openRoleEditorForRow = (rowId: string) => {
    const row = linkedRows.find((item) => item.id === rowId);
    if (!row) return;
    setSelectedRoleRowId(rowId);
    setSelectedAccessRowId(rowId);
    setAccessDrawerOpen(false);
    setRoleEditorRowId(rowId);
    setRoleEditorCode('');
  };

  const closeRoleEditor = () => {
    setRoleEditorRowId('');
    setRoleEditorCode('');
  };

  const selectedRoleEditorRow = roleEditorRowId
    ? linkedRows.find((item) => item.id === roleEditorRowId) || null
    : null;

  const saveRoleEditor = async () => {
    if (!roleEditorRowId || !roleEditorCode) {
      toast.error('请选择角色');
      return;
    }
    const row = linkedRows.find((item) => item.id === roleEditorRowId);
    if (!row) return;
    const primaryAccount = row.linkedAccounts[0];
    if (primaryAccount) {
      await onAutoPatchAccount(primaryAccount.id, { role: roleEditorCode }, '角色已更新');
    } else {
      await onAutoProvisionAccount(roleEditorRowId, roleEditorCode);
    }
    closeRoleEditor();
  };

  const roleDepartmentOptions = useMemo(
    () => Array.from(new Set(linkedRows.map((row) => row.department).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'zh-CN')),
    [linkedRows],
  );

  const filteredRoleRows = useMemo(() => {
    const keyword = roleSearch.trim().toLowerCase();
    return linkedRows.filter((row) => {
      const matchesKeyword =
        !keyword ||
        `${row.name} ${row.employeeNo} ${row.department} ${row.title} ${row.permissionRole.name} ${row.permissionRole.code}`.toLowerCase().includes(keyword);
      const matchesDepartment = roleDepartmentFilter === 'all' || row.department === roleDepartmentFilter;
      const matchesStatus = roleStatusFilter === 'all' || row.status === roleStatusFilter;
      return matchesKeyword && matchesDepartment && matchesStatus;
    });
  }, [linkedRows, roleDepartmentFilter, roleSearch, roleStatusFilter]);

  const sortedRoleRows = useMemo(() => {
    const rows = [...filteredRoleRows];
    rows.sort((a, b) => {
      const valueA =
        roleSortKey === 'roleName' ? a.permissionRole.name :
        roleSortKey === 'roleCode' ? a.permissionRole.code :
        a[roleSortKey];
      const valueB =
        roleSortKey === 'roleName' ? b.permissionRole.name :
        roleSortKey === 'roleCode' ? b.permissionRole.code :
        b[roleSortKey];
      const normalizedA = String(valueA || '').toLowerCase();
      const normalizedB = String(valueB || '').toLowerCase();
      if (normalizedA < normalizedB) return roleSortDirection === 'asc' ? -1 : 1;
      if (normalizedA > normalizedB) return roleSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [filteredRoleRows, roleSortDirection, roleSortKey]);

  useEffect(() => {
    if (!sortedRoleRows.length) {
      setSelectedRoleRowId('');
      return;
    }
    if (!selectedRoleRowId || !sortedRoleRows.some((row) => row.id === selectedRoleRowId)) {
      setSelectedRoleRowId(sortedRoleRows[0].id);
    }
  }, [selectedRoleRowId, sortedRoleRows]);

  const selectedRoleRow = sortedRoleRows.find((row) => row.id === selectedRoleRowId) || sortedRoleRows[0] || null;

  const toggleRoleSort = (key: 'name' | 'employeeNo' | 'department' | 'title' | 'roleName' | 'roleCode') => {
    if (roleSortKey === key) {
      setRoleSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setRoleSortKey(key);
    setRoleSortDirection('asc');
  };

  const renderRoleSortIcon = (key: 'name' | 'employeeNo' | 'department' | 'title' | 'roleName' | 'roleCode') => {
    if (roleSortKey !== key) return <ArrowUpDown className="h-3.5 w-3.5 text-slate-300" />;
    return roleSortDirection === 'asc'
      ? <ArrowUp className="h-3.5 w-3.5 text-red-500" />
      : <ArrowDown className="h-3.5 w-3.5 text-red-500" />;
  };

  const roleMetrics = useMemo(() => ({
    assignedPeople: linkedRows.filter((row) => row.permissionRole.code !== 'Unassigned').length,
    roleKinds: roleSummary.filter((item) => item.role !== 'Unassigned').length,
    unmappedPeople: linkedRows.filter((row) => row.permissionRole.code === 'Unassigned').length,
  }), [linkedRows, roleSummary]);

  const openPermissionCenter = () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'permission-center' } }));
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4">
          <div className="flex w-full items-stretch justify-between gap-6 overflow-x-auto">
            {[
              { key: 'people', label: '人员主档', icon: <ContactRound className="h-4 w-4" /> },
              { key: 'access', label: '账号与访问', icon: <Lock className="h-4 w-4" /> },
              { key: 'roles', label: '角色权限', icon: <Shield className="h-4 w-4" /> },
            ].map((item) => {
              const active = activeView === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveView(item.key as 'people' | 'access' | 'roles')}
                  className="flex min-w-[220px] flex-1 items-center justify-center gap-2 border-b-2 px-4 py-2.5 text-[14px] font-semibold transition-colors"
                  style={{
                    borderBottomColor: active ? '#ef4444' : 'transparent',
                    color: active ? '#dc2626' : '#475569',
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3.5">
          {activeView === 'people' && (
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
                  {[
                    { key: 'list', label: '列表视图' },
                    { key: 'org', label: '组织视图' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setPeopleViewMode(item.key as 'list' | 'org')}
                      className={`rounded-md px-3 py-1 text-[12px] font-medium transition-colors ${
                        peopleViewMode === item.key
                          ? 'bg-red-50 text-red-600'
                          : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="flex min-w-[240px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
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
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-[12px] text-slate-600 outline-none transition-colors hover:border-slate-300 focus:border-red-300"
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
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-[12px] text-slate-600 outline-none transition-colors hover:border-slate-300 focus:border-red-300"
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
              <div ref={peopleTableContainerRef} className="relative overflow-x-auto rounded-xl border border-slate-200">
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
                <table
                  className="w-full table-fixed border-collapse text-[12px]"
                  style={{ minWidth: `${peopleTableMinWidth}px` }}
                >
                  <colgroup>
                    <col style={getPeopleColumnStyle('employeeNo')} />
                    <col style={getPeopleColumnStyle('name')} />
                    <col style={getPeopleColumnStyle('department')} />
                    <col style={getPeopleColumnStyle('title')} />
                    <col style={getPeopleColumnStyle('phone')} />
                    <col style={getPeopleColumnStyle('email')} />
                    <col style={getPeopleColumnStyle('wechat')} />
                    <col style={getPeopleColumnStyle('status')} />
                    <col style={getPeopleColumnStyle('visibleInDocuments')} />
                    <col style={getPeopleColumnStyle('actions')} />
                  </colgroup>
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="group relative border-b border-slate-200 px-3 py-2 text-left" style={getPeopleColumnStyle('employeeNo')}><button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => togglePeopleSort('employeeNo')}>工号 {renderPeopleSortIcon('employeeNo')}</button>{renderPeopleColumnResizeHandle('employeeNo')}</th>
                      <th className="group relative border-b border-slate-200 px-3 py-2 text-left" style={getPeopleColumnStyle('name')}><button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => togglePeopleSort('name')}>姓名 {renderPeopleSortIcon('name')}</button>{renderPeopleColumnResizeHandle('name')}</th>
                      <th className="group relative border-b border-slate-200 px-3 py-2 text-left" style={getPeopleColumnStyle('department')}><button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => togglePeopleSort('department')}>部门 {renderPeopleSortIcon('department')}</button>{renderPeopleColumnResizeHandle('department')}</th>
                      <th className="group relative border-b border-slate-200 px-3 py-2 text-left" style={getPeopleColumnStyle('title')}><button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => togglePeopleSort('title')}>岗位 {renderPeopleSortIcon('title')}</button>{renderPeopleColumnResizeHandle('title')}</th>
                      <th className="group relative border-b border-slate-200 px-3 py-2 text-left" style={getPeopleColumnStyle('phone')}><button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => togglePeopleSort('phone')}>手机 {renderPeopleSortIcon('phone')}</button>{renderPeopleColumnResizeHandle('phone')}</th>
                      <th className="group relative border-b border-slate-200 px-3 py-2 text-left" style={getPeopleColumnStyle('email')}><button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => togglePeopleSort('email')}>邮箱 {renderPeopleSortIcon('email')}</button>{renderPeopleColumnResizeHandle('email')}</th>
                      <th className="group relative border-b border-slate-200 px-3 py-2 text-left" style={getPeopleColumnStyle('wechat')}>微信 / WhatsApp{renderPeopleColumnResizeHandle('wechat')}</th>
                      <th className="group relative border-b border-slate-200 px-3 py-2 text-left" style={getPeopleColumnStyle('status')}><button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => togglePeopleSort('status')}>状态 {renderPeopleSortIcon('status')}</button>{renderPeopleColumnResizeHandle('status')}</th>
                      <th className="group relative border-b border-slate-200 px-3 py-2 text-left" style={getPeopleColumnStyle('visibleInDocuments')}><button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => togglePeopleSort('visibleInDocuments')}>单据默认 {renderPeopleSortIcon('visibleInDocuments')}</button>{renderPeopleColumnResizeHandle('visibleInDocuments')}</th>
                      <th className="group relative border-b border-slate-200 px-3 py-2 text-left" style={getPeopleColumnStyle('actions')}>操作{renderPeopleColumnResizeHandle('actions')}</th>
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
                      const familyStyle = peopleOrgFamilyStyles.get(effectiveFamilyRootId) || ORG_FAMILY_COLOR_PALETTE[0];
                      const orgRowTone = peopleViewMode === 'org'
                        ? effectiveLevel === 0
                          ? familyStyle.rootRow
                          : familyStyle.childRow
                        : 'odd:bg-white even:bg-slate-50/35 hover:bg-slate-50';
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
                        <td className="border-b border-slate-100 px-3 py-1.5 text-slate-600">
                          {isEdit ? (
                            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] font-medium text-slate-500">
                              {row.employeeNoRaw || row.employeeNo}
                            </div>
                          ) : peopleViewMode === 'org' ? displayEmployeeNo : row.employeeNo}
                        </td>
                        <td className="border-b border-slate-100 px-3 py-1.5 font-medium text-slate-800">
                          {isEdit ? (
                            <input
                              className={INPUT}
                              value={row.nameRaw}
                              onChange={(event) => onUpdateContact(row.id, 'name', event.target.value)}
                              placeholder="请输入人员姓名"
                            />
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
                        <td className="border-b border-slate-100 px-3 py-1.5 text-slate-600">
                          {isEdit ? (
                            <input
                              className={INPUT}
                              value={row.departmentRaw}
                              onChange={(event) => onUpdateContact(row.id, 'department', event.target.value)}
                              placeholder="采购部"
                            />
                          ) : row.department}
                        </td>
                        <td className="border-b border-slate-100 px-3 py-1.5 text-slate-600">
                          {isEdit ? (
                            <input
                              className={INPUT}
                              value={row.titleRaw}
                              onChange={(event) => onUpdateContact(row.id, 'title', event.target.value)}
                              placeholder="采购经理"
                            />
                          ) : row.title}
                        </td>
                        <td className="border-b border-slate-100 px-3 py-1.5 text-slate-600">
                          {isEdit ? (
                            <input
                              className={INPUT}
                              value={row.phoneRaw}
                              onChange={(event) => onUpdateContact(row.id, 'phone', event.target.value)}
                              placeholder="+86 137..."
                            />
                          ) : row.phone}
                        </td>
                        <td className="border-b border-slate-100 px-3 py-1.5 text-slate-700">
                          {isEdit ? (
                            <input
                              className={INPUT}
                              value={row.emailRaw}
                              onChange={(event) => onUpdateContact(row.id, 'email', event.target.value)}
                              placeholder="buyer@example.com"
                            />
                          ) : row.email}
                        </td>
                        <td className="border-b border-slate-100 px-3 py-1.5 text-slate-600">
                          {isEdit ? (
                            <input
                              className={INPUT}
                              value={row.wechatRaw}
                              onChange={(event) => onUpdateContact(row.id, 'wechat', event.target.value)}
                              placeholder="wechat-id / whatsapp"
                            />
                          ) : row.wechat}
                        </td>
                        <td className="border-b border-slate-100 px-3 py-1.5 text-slate-600">
                          {isEdit ? (
                            <input
                              className={INPUT}
                              value={row.status}
                              onChange={(event) => onUpdateContact(row.id, 'status', event.target.value)}
                              placeholder="在职"
                            />
                          ) : row.status}
                        </td>
                        <td className="border-b border-slate-100 px-3 py-1.5">
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
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${row.visibleInDocuments ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                              {row.visibleInDocuments ? '是' : '否'}
                            </span>
                          )}
                        </td>
                        <td className="border-b border-slate-100 px-3 py-1.5">
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
                                  setDraggingPersonId(null);
                                  setDragOverPersonId(null);
                                  setDragOverMode('child');
                                  setDraggingToTop(false);
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
                        <td colSpan={10} className="px-3 py-8 text-center text-[12px] text-slate-400">
                          当前筛选条件下暂无匹配人员
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {!isEdit && personDrawerOpen && selectedPerson && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/45 p-4">
                  <div
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]"
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
                </div>
              )}
            </div>
          )}

          {activeView === 'access' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex min-w-[280px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                  <input
                    value={accessSearch}
                    onChange={(event) => setAccessSearch(event.target.value)}
                    className="w-full bg-transparent text-[12px] text-slate-700 outline-none placeholder:text-slate-400"
                    placeholder="搜索姓名 / 工号 / 邮箱 / 部门"
                  />
                </div>
                <div className="relative">
                  <select
                    value={accessDepartmentFilter}
                    onChange={(event) => setAccessDepartmentFilter(event.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-[12px] text-slate-600 outline-none transition-colors hover:border-slate-300 focus:border-red-300"
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
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-[12px] text-slate-600 outline-none transition-colors hover:border-slate-300 focus:border-red-300"
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
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-[12px] text-slate-600 outline-none transition-colors hover:border-slate-300 focus:border-red-300"
                  >
                    <option value="all">账号状态筛选</option>
                    <option value="active">已启用</option>
                    <option value="disabled">已停用</option>
                    <option value="locked">已锁定</option>
                    <option value="未开通">未开通</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div
                ref={accessTableContainerRef}
                className="overflow-x-auto rounded-xl border border-slate-200 bg-white"
              >
                <table
                  className="w-full table-fixed border-collapse text-[12px]"
                  style={{ minWidth: `${accessTableMinWidth}px` }}
                >
                  <colgroup>
                    <col style={getAccessColumnStyle('name')} />
                    <col style={getAccessColumnStyle('employeeNo')} />
                    <col style={getAccessColumnStyle('department')} />
                    <col style={getAccessColumnStyle('title')} />
                    <col style={getAccessColumnStyle('region')} />
                    <col style={getAccessColumnStyle('username')} />
                    <col style={getAccessColumnStyle('email')} />
                    <col style={getAccessColumnStyle('accountStatus')} />
                    <col style={getAccessColumnStyle('security')} />
                    <col style={getAccessColumnStyle('role')} />
                    <col style={getAccessColumnStyle('lastLoginAt')} />
                    <col style={getAccessColumnStyle('actions')} />
                  </colgroup>
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th style={getAccessColumnStyle('name')} className="group relative border-b border-slate-200 px-3 py-2 text-left">
                        <button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => toggleAccessSort('name')}>
                          姓名 {renderAccessSortIcon('name')}
                        </button>
                        {renderAccessColumnResizeHandle('name')}
                      </th>
                      <th style={getAccessColumnStyle('employeeNo')} className="group relative border-b border-slate-200 px-3 py-2 text-left">
                        <button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => toggleAccessSort('employeeNo')}>
                          工号 {renderAccessSortIcon('employeeNo')}
                        </button>
                        {renderAccessColumnResizeHandle('employeeNo')}
                      </th>
                      <th style={getAccessColumnStyle('department')} className="group relative border-b border-slate-200 px-3 py-2 text-left">
                        <button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => toggleAccessSort('department')}>
                          部门 {renderAccessSortIcon('department')}
                        </button>
                        {renderAccessColumnResizeHandle('department')}
                      </th>
                      <th style={getAccessColumnStyle('title')} className="group relative border-b border-slate-200 px-3 py-2 text-left">
                        <button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => toggleAccessSort('title')}>
                          岗位 {renderAccessSortIcon('title')}
                        </button>
                        {renderAccessColumnResizeHandle('title')}
                      </th>
                      <th style={getAccessColumnStyle('region')} className="group relative border-b border-slate-200 px-3 py-2 text-left">
                        <button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => toggleAccessSort('region')}>
                          区域 {renderAccessSortIcon('region')}
                        </button>
                        {renderAccessColumnResizeHandle('region')}
                      </th>
                      <th style={getAccessColumnStyle('username')} className="group relative border-b border-slate-200 px-3 py-2 text-left">
                        <span className="font-semibold text-slate-600">登录账号</span>
                        {renderAccessColumnResizeHandle('username')}
                      </th>
                      <th style={getAccessColumnStyle('email')} className="group relative border-b border-slate-200 px-3 py-2 text-left">
                        <button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => toggleAccessSort('email')}>
                          登录邮箱 {renderAccessSortIcon('email')}
                        </button>
                        {renderAccessColumnResizeHandle('email')}
                      </th>
                      <th style={getAccessColumnStyle('accountStatus')} className="group relative border-b border-slate-200 px-3 py-2 text-left">
                        <span className="font-semibold text-slate-600">账号状态</span>
                        {renderAccessColumnResizeHandle('accountStatus')}
                      </th>
                      <th style={getAccessColumnStyle('security')} className="group relative border-b border-slate-200 px-3 py-2 text-left">
                        <span className="font-semibold text-slate-600">安全摘要</span>
                        {renderAccessColumnResizeHandle('security')}
                      </th>
                      <th style={getAccessColumnStyle('role')} className="group relative border-b border-slate-200 px-3 py-2 text-left">
                        <button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => toggleAccessSort('role')}>
                          角色摘要 {renderAccessSortIcon('role')}
                        </button>
                        {renderAccessColumnResizeHandle('role')}
                      </th>
                      <th style={getAccessColumnStyle('lastLoginAt')} className="group relative border-b border-slate-200 px-3 py-2 text-left">
                        <button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => toggleAccessSort('lastLoginAt')}>
                          最近登录 {renderAccessSortIcon('lastLoginAt')}
                        </button>
                        {renderAccessColumnResizeHandle('lastLoginAt')}
                      </th>
                      <th style={getAccessColumnStyle('actions')} className="group relative border-b border-slate-200 px-3 py-2 text-left">
                        <span className="font-semibold text-slate-600">操作</span>
                        {renderAccessColumnResizeHandle('actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {sortedAccessRows.map((row) => {
                      const primaryAccount = row.linkedAccounts[0];
                      const accountStatusMeta = getAccountStatusMeta(primaryAccount?.accountStatus || row.accountStatus, primaryAccount?.canLogin ?? false);
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
                          <td style={getAccessColumnStyle('name')} className="border-b border-slate-100 px-4 py-1.5 align-top">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="block truncate font-semibold text-slate-800">{row.name}</span>
                            </div>
                          </td>
                          <td style={getAccessColumnStyle('employeeNo')} className="border-b border-slate-100 px-4 py-1.5 align-top text-slate-600">{row.employeeNo}</td>
                          <td style={getAccessColumnStyle('department')} className="border-b border-slate-100 px-4 py-1.5 align-top text-slate-600">{row.department}</td>
                          <td style={getAccessColumnStyle('title')} className="border-b border-slate-100 px-4 py-1.5 align-top text-slate-600">{row.title}</td>
                          <td style={getAccessColumnStyle('region')} className="border-b border-slate-100 px-4 py-1.5 align-top text-slate-600">{row.region}</td>
                          <td style={getAccessColumnStyle('username')} className="border-b border-slate-100 px-4 py-1.5 align-top font-semibold text-slate-800">
                            <span className="block truncate">{primaryAccount?.username || '未开通'}</span>
                          </td>
                          <td style={getAccessColumnStyle('email')} className="border-b border-slate-100 px-4 py-1.5 align-top text-slate-600">
                            <span className="block truncate">{row.email}</span>
                          </td>
                          <td style={getAccessColumnStyle('accountStatus')} className="border-b border-slate-100 px-4 py-1.5 align-top">
                            <span className={`inline-flex whitespace-nowrap items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${accountStatusMeta.className}`}>
                              {accountStatusMeta.label}
                            </span>
                          </td>
                          <td style={getAccessColumnStyle('security')} className="border-b border-slate-100 px-4 py-1.5 align-top">
                            <div className="space-y-0">
                              <p className="truncate text-[12px] font-medium text-slate-700">{securitySummary}</p>
                              <p className="truncate text-[11px] text-slate-400">{securityPassword}</p>
                            </div>
                          </td>
                          <td style={getAccessColumnStyle('role')} className="border-b border-slate-100 px-4 py-1.5 align-top">
                            <div className="space-y-0">
                              <span className="inline-flex whitespace-nowrap items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                                {row.permissionRole.name}
                              </span>
                              <p className="truncate text-[11px] text-slate-400">{row.permissionRole.code}</p>
                            </div>
                          </td>
                          <td style={getAccessColumnStyle('lastLoginAt')} className="border-b border-slate-100 px-4 py-1.5 align-top text-slate-600">
                            {row.lastLoginAt || '—'}
                          </td>
                          <td style={getAccessColumnStyle('actions')} className="border-b border-slate-100 px-4 py-1.5 align-top">
                            <div className="flex min-w-max flex-nowrap items-center gap-2" onClick={(event) => event.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAccessRowId(row.id);
                                  setAccessDrawerOpen(true);
                                }}
                                className="whitespace-nowrap rounded-full border border-slate-200 px-3 py-0 text-[12px] font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
                              >
                                详情
                              </button>
                              <button
                                type="button"
                                onClick={() => openRoleEditorForRow(row.id)}
                                className="whitespace-nowrap rounded-full border border-blue-200 px-3 py-0 text-[12px] font-medium text-blue-600 transition-colors hover:bg-blue-50"
                              >
                                更改角色
                              </button>
                              {primaryAccount ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => void handleToggleAccountStatus(row)}
                                    className="whitespace-nowrap rounded-full border border-amber-200 px-3 py-0 text-[12px] font-medium text-amber-600 transition-colors hover:bg-amber-50"
                                  >
                                    {primaryAccount.accountStatus === 'active' && primaryAccount.canLogin ? '停用' : '启用'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void onAutoResetAccountPassword(primaryAccount.id)}
                                    className="whitespace-nowrap rounded-full border border-red-200 px-3 py-0 text-[12px] font-medium text-red-600 transition-colors hover:bg-red-50"
                                  >
                                    重置密码
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleToggleForcePasswordReset(row)}
                                    className="whitespace-nowrap rounded-full border border-slate-200 px-3 py-0 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
                                  >
                                    强制改密
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => void handleProvisionAccount(row.id)}
                                  className="whitespace-nowrap rounded-full border border-blue-200 px-3 py-0 text-[12px] font-medium text-blue-600 transition-colors hover:bg-blue-50"
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

              {accessDrawerOpen && selectedAccessRow && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/20 px-4 py-8 backdrop-blur-[1px]">
                  <div className="w-full max-w-[760px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                    <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">账号详情</p>
                        <h3 className="mt-2 text-[22px] font-semibold text-slate-900">{selectedAccessRow.name}</h3>
                        <p className="mt-1 text-[13px] text-slate-500">
                          {selectedAccessRow.employeeNo} / {selectedAccessRow.department} / {selectedAccessRow.title}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAccessDrawerOpen(false)}
                        className="rounded-xl border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-white hover:text-slate-700"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="max-h-[72vh] overflow-y-auto p-5">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <p className="text-[12px] font-semibold text-slate-400">登录信息</p>
                          <div className="mt-3 space-y-3 text-[13px]">
                            <div><span className="text-slate-400">登录账号</span><p className="mt-1 font-semibold text-slate-800">{selectedAccessRow.linkedAccounts[0]?.username || '未开通'}</p></div>
                            <div><span className="text-slate-400">登录邮箱</span><p className="mt-1 font-semibold text-slate-800">{selectedAccessRow.email}</p></div>
                            <div><span className="text-slate-400">账号类型</span><p className="mt-1 font-semibold text-slate-800">平台访问账号</p></div>
                            <div><span className="text-slate-400">区域</span><p className="mt-1 font-semibold text-slate-800">{selectedAccessRow.region}</p></div>
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <p className="text-[12px] font-semibold text-slate-400">安全信息</p>
                          <div className="mt-3 space-y-3 text-[13px]">
                            <div>
                              <span className="text-slate-400">账号状态</span>
                              <p className="mt-1">
                                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                                  getAccountStatusMeta(selectedAccessRow.linkedAccounts[0]?.accountStatus || selectedAccessRow.accountStatus, selectedAccessRow.linkedAccounts[0]?.canLogin ?? false).className
                                }`}>
                                  {getAccountStatusMeta(selectedAccessRow.linkedAccounts[0]?.accountStatus || selectedAccessRow.accountStatus, selectedAccessRow.linkedAccounts[0]?.canLogin ?? false).label}
                                </span>
                              </p>
                            </div>
                            <div><span className="text-slate-400">当前密码</span><p className="mt-1 font-semibold text-slate-800">{selectedAccessRow.linkedAccounts[0]?.loginPassword || '未设置密码'}</p></div>
                            <div><span className="text-slate-400">强制改密</span><p className="mt-1 font-semibold text-slate-800">{selectedAccessRow.linkedAccounts[0]?.forcePasswordReset ? '是' : '否'}</p></div>
                            <div><span className="text-slate-400">最近登录</span><p className="mt-1 font-semibold text-slate-800">{selectedAccessRow.lastLoginAt || '—'}</p></div>
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
                          <p className="text-[12px] font-semibold text-slate-400">权限信息</p>
                          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                            <div className="rounded-lg bg-slate-50 px-3 py-2">
                              <p className="text-[11px] text-slate-400">当前角色</p>
                              <p className="mt-1 font-semibold text-slate-800">{selectedAccessRow.permissionRole.name}</p>
                              <p className="text-[11px] text-slate-400">{selectedAccessRow.permissionRole.code}</p>
                            </div>
                            <div className="rounded-lg bg-slate-50 px-3 py-2">
                              <p className="text-[11px] text-slate-400">账号数量</p>
                              <p className="mt-1 font-semibold text-slate-800">{selectedAccessRow.linkedAccounts.length || 0} 个账号</p>
                            </div>
                            <div className="rounded-lg bg-slate-50 px-3 py-2">
                              <p className="text-[11px] text-slate-400">管理备注</p>
                              <p className="mt-1 font-semibold text-slate-800">{selectedAccessRow.linkedAccounts[0]?.notes || '—'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-4">
                        <button
                          type="button"
                          onClick={() => openRoleEditorForRow(selectedAccessRow.id)}
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[12px] font-medium text-blue-700 transition-colors hover:bg-blue-100"
                        >
                          更改角色
                        </button>
                        <button
                          type="button"
                          onClick={() => setAccessDrawerOpen(false)}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
                        >
                          关闭
                        </button>
                        {selectedAccessRow.linkedAccounts[0] ? (
                          <>
                            <button
                              type="button"
                              onClick={() => void onAutoResetAccountPassword(selectedAccessRow.linkedAccounts[0]!.id)}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-600 transition-colors hover:bg-red-100"
                            >
                              重置密码
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleToggleForcePasswordReset(selectedAccessRow)}
                              className="rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
                            >
                              {selectedAccessRow.linkedAccounts[0]!.forcePasswordReset ? '取消强制改密' : '强制下次登录改密'}
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void handleProvisionAccount(selectedAccessRow.id)}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-blue-700"
                          >
                            开通账号
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {roleEditorRowId && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/20 px-4 py-8 backdrop-blur-[1px]">
                  <div
                    className="relative flex-none overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                    style={{ width: 392, maxWidth: 'calc(100vw - 32px)' }}
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">更改角色</p>
                        <h3 className="mt-1 text-[15px] font-semibold text-slate-900">
                          {selectedRoleEditorRow?.name || '未选择人员'}
                        </h3>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {selectedRoleEditorRow?.employeeNo || '未设工号'} / {selectedRoleEditorRow?.department || '未设部门'} / {selectedRoleEditorRow?.title || '未设岗位'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={closeRoleEditor}
                        className="rounded-xl border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-white hover:text-slate-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-2.5 p-4">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[11px] text-slate-400">当前角色</p>
                              <p className="mt-0.5 truncate text-[13px] font-semibold text-slate-800">
                                {selectedRoleEditorRow?.permissionRole.name || '未分配'}
                              </p>
                              <p className="truncate text-[11px] text-slate-400">
                                {selectedRoleEditorRow?.permissionRole.code && selectedRoleEditorRow.permissionRole.code !== 'Unassigned'
                                  ? selectedRoleEditorRow.permissionRole.code
                                  : 'Unassigned'}
                              </p>
                            </div>
                            <div className="shrink-0 pt-4 text-slate-300">→</div>
                            <div className="min-w-0 text-right">
                              <p className="text-[11px] text-slate-400">变更后</p>
                              <p className="mt-0.5 truncate text-[13px] font-semibold text-slate-800">
                                {roleEditorCode ? permissionRoleMap[roleEditorCode]?.name || roleEditorCode : '尚未选择'}
                              </p>
                              <p className="truncate text-[11px] text-slate-400">
                                {roleEditorCode || '未选择'}
                              </p>
                            </div>
                          </div>
                          {roleEditorCode && (
                            <div className="rounded-lg bg-white px-3 py-2">
                              <p className="text-[11px] text-slate-400">角色说明</p>
                              <p className="mt-1 text-[12px] leading-5 text-slate-700">
                                {permissionRoleMap[roleEditorCode]?.description || '暂无角色说明'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                        <p className="text-[12px] font-semibold text-slate-400">选择新角色</p>
                        <div className="relative mt-2">
                          <select
                            value={roleEditorCode}
                            onChange={(event) => setRoleEditorCode(event.target.value)}
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
                      <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-2.5">
                        <button
                          type="button"
                          onClick={closeRoleEditor}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
                        >
                          取消
                        </button>
                        <button
                          type="button"
                          onClick={() => void saveRoleEditor()}
                          disabled={!roleEditorCode}
                          className="rounded-lg bg-blue-600 px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          保存角色
                        </button>
                      </div>
                    </div>
                  </div>
                </div>,
                document.body,
              )}
            </div>
          )}

          {activeView === 'roles' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex min-w-[260px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <Search className="h-3.5 w-3.5 text-slate-400" />
                      <input
                        value={roleSearch}
                        onChange={(event) => setRoleSearch(event.target.value)}
                        className="w-full bg-transparent text-[12px] text-slate-700 outline-none placeholder:text-slate-400"
                        placeholder="搜索姓名 / 工号 / 角色 / 部门"
                      />
                    </div>
                    <div className="relative">
                      <select
                        value={roleDepartmentFilter}
                        onChange={(event) => setRoleDepartmentFilter(event.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-[12px] text-slate-600 outline-none transition-colors hover:border-slate-300 focus:border-red-300"
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
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-[12px] text-slate-600 outline-none transition-colors hover:border-slate-300 focus:border-red-300"
                      >
                        <option value="all">人员状态筛选</option>
                        <option value="在职">在职</option>
                        <option value="离职">离职</option>
                        <option value="停用">停用</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  <div ref={roleTableContainerRef} className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full table-fixed border-collapse text-[12px]" style={{ minWidth: `${roleTableMinWidth}px` }}>
                      <colgroup>
                        <col style={getRoleColumnStyle('name')} />
                        <col style={getRoleColumnStyle('employeeNo')} />
                        <col style={getRoleColumnStyle('department')} />
                        <col style={getRoleColumnStyle('title')} />
                        <col style={getRoleColumnStyle('roleName')} />
                        <col style={getRoleColumnStyle('roleCode')} />
                        <col style={getRoleColumnStyle('description')} />
                        <col style={getRoleColumnStyle('actions')} />
                      </colgroup>
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="group relative border-b border-slate-200 px-3 py-2 text-left" style={getRoleColumnStyle('name')}><button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => toggleRoleSort('name')}>姓名 {renderRoleSortIcon('name')}</button>{renderRoleColumnResizeHandle('name')}</th>
                          <th className="group relative border-b border-slate-200 px-3 py-2 text-left" style={getRoleColumnStyle('employeeNo')}><button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => toggleRoleSort('employeeNo')}>工号 {renderRoleSortIcon('employeeNo')}</button>{renderRoleColumnResizeHandle('employeeNo')}</th>
                          <th className="group relative border-b border-slate-200 px-3 py-2 text-left" style={getRoleColumnStyle('department')}><button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => toggleRoleSort('department')}>部门 {renderRoleSortIcon('department')}</button>{renderRoleColumnResizeHandle('department')}</th>
                          <th className="group relative border-b border-slate-200 px-3 py-2 text-left" style={getRoleColumnStyle('title')}><button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => toggleRoleSort('title')}>岗位 {renderRoleSortIcon('title')}</button>{renderRoleColumnResizeHandle('title')}</th>
                          <th className="group relative border-b border-slate-200 px-3 py-2 text-left" style={getRoleColumnStyle('roleName')}><button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => toggleRoleSort('roleName')}>当前角色 {renderRoleSortIcon('roleName')}</button>{renderRoleColumnResizeHandle('roleName')}</th>
                          <th className="group relative border-b border-slate-200 px-3 py-2 text-left" style={getRoleColumnStyle('roleCode')}><button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900" onClick={() => toggleRoleSort('roleCode')}>角色编码 {renderRoleSortIcon('roleCode')}</button>{renderRoleColumnResizeHandle('roleCode')}</th>
                          <th className="group relative border-b border-slate-200 px-3 py-2 text-left" style={getRoleColumnStyle('description')}>角色说明{renderRoleColumnResizeHandle('description')}</th>
                          <th className="group relative border-b border-slate-200 px-3 py-2 text-left" style={getRoleColumnStyle('actions')}>操作{renderRoleColumnResizeHandle('actions')}</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {sortedRoleRows.map((row) => (
                          <tr
                            key={row.id}
                            className={`cursor-pointer transition-colors ${selectedRoleRow?.id === row.id ? 'bg-red-50/60' : 'odd:bg-white even:bg-slate-50/35 hover:bg-slate-50'}`}
                            onClick={() => setSelectedRoleRowId(row.id)}
                          >
                            <td className="border-b border-slate-100 px-3 py-2 font-medium text-slate-800">{row.name}</td>
                            <td className="border-b border-slate-100 px-3 py-2 text-slate-600">{row.employeeNo}</td>
                            <td className="border-b border-slate-100 px-3 py-2 text-slate-600">{row.department}</td>
                            <td className="border-b border-slate-100 px-3 py-2 text-slate-600">{row.title}</td>
                            <td className="border-b border-slate-100 px-3 py-2">
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${row.roleDefinition?.colorClass || 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                                {row.permissionRole.name}
                              </span>
                            </td>
                            <td className="border-b border-slate-100 px-3 py-2 text-slate-500">{row.permissionRole.code}</td>
                            <td className="border-b border-slate-100 px-3 py-2 text-slate-600">
                              {row.roleDefinition?.description || '暂无对应权限中心角色说明'}
                            </td>
                            <td className="border-b border-slate-100 px-3 py-2">
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
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Text-field factory (returns view text or edit input/textarea)
// ─────────────────────────────────────────────────────────────────────────────
function useTextField(isEdit: boolean) {
  return function tf(
    value: string,
    onChange: (v: string) => void,
    placeholder = '',
    type: 'input' | 'textarea' = 'input',
  ): React.ReactNode {
    if (!isEdit) {
      return value ? <span className={VAL}>{value}</span> : <span className={NONE}>—</span>;
    }
    if (type === 'textarea') {
      return (
        <textarea
          className={`${TEXTAREA} min-h-[88px]`}
          rows={3}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
      );
    }
    return (
      <input
        className={INPUT}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    );
  };
}

function ExternalPortalPasswordMirrorModule() {
  const [records, setRecords] = useState<PortalPasswordMirrorRecord[]>(() => listPortalPasswordMirrors());
  const [directoryEntries, setDirectoryEntries] = useState<ExternalPortalDirectoryEntry[]>([]);
  const [selectedHubId, setSelectedHubId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');

  const reloadRecords = React.useCallback(() => {
    setRecords(listPortalPasswordMirrors());
  }, []);

  useEffect(() => {
    reloadRecords();
    const handleStorage = () => reloadRecords();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [reloadRecords]);

  useEffect(() => {
    let cancelled = false;

    const loadDirectory = async () => {
      try {
        const entries = await externalPortalDirectoryService.listAll();
        if (cancelled) return;
        setDirectoryEntries(entries);
      } catch (error) {
        if (cancelled) return;
        console.warn('[ExternalPortalPasswordMirrorModule] directory fallback to local cache', error);
        const localFallback: ExternalPortalDirectoryEntry[] = [];
        try {
          const customerRaw = window.localStorage.getItem('cosun_customer_profile');
          const supplierRaw = window.localStorage.getItem('cosun_org_profile');
          if (customerRaw) {
            const customer = JSON.parse(customerRaw);
            if (customer?.email) {
              localFallback.push({
                id: 'local-customer-profile',
                email: String(customer.email).toLowerCase(),
                name: String(customer.contactPerson || customer.companyName || customer.email),
                portalRole: 'customer',
                company: String(customer.companyName || ''),
                phone: String(customer.phone || ''),
                region: '',
              });
            }
          }
          if (supplierRaw) {
            const supplier = JSON.parse(supplierRaw);
            if (supplier?.contactPerson || supplier?.name) {
              localFallback.push({
                id: 'local-supplier-profile',
                email: '',
                name: String(supplier.contactPerson || supplier.name || ''),
                portalRole: 'supplier',
                company: String(supplier.name || ''),
                phone: String(supplier.phone || ''),
                region: '',
              });
            }
          }
        } catch {
          // ignore malformed local cache
        }
        setDirectoryEntries(localFallback);
      }
    };

    void loadDirectory();
    return () => {
      cancelled = true;
    };
  }, []);

  const isDemoMode = records.length === 0;

  const portalMeta: Record<ExternalPortalType, { label: string; description: string }> = {
    customer: { label: '客户侧账号池', description: '客户门户账号群' },
    supplier: { label: '供应商侧账号池', description: '供应商门户账号群' },
    third_party: { label: '第三方侧账号池', description: '服务商 / 协同机构账号群' },
  };

  const sourceLabelMap: Record<string, string> = {
    user_self_set: '用户自设',
    login_capture: '登录抓取',
    manual_sync: '人工重同步',
    directory_pending: '目录待建',
  };

  const statusMeta: Record<string, { label: string; className: string }> = {
    active: { label: '有效', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    notified: { label: '已通知', className: 'border-blue-200 bg-blue-50 text-blue-700' },
    invalid: { label: '已失效', className: 'border-amber-200 bg-amber-50 text-amber-700' },
    cleared: { label: '已清除', className: 'border-slate-200 bg-slate-100 text-slate-500' },
    pending_sync: { label: '未建镜像', className: 'border-violet-200 bg-violet-50 text-violet-700' },
  };

  const formatTimestamp = (value?: string) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('zh-CN', { hour12: false });
  };

  const maskPassword = (password: string) => {
    if (!password) return '已清除';
    if (password.length <= 4) return password;
    return `${password.slice(0, 2)}••••${password.slice(-2)}`;
  };

  const extractOrganizationName = (record: PortalPasswordMirrorRecord) => {
    const emailDomain = String(record.loginEmail || '').split('@')[1] || '';
    const segments = emailDomain.split('.').filter(Boolean);
    if (segments.length > 1) return segments[0].replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
    if (segments.length === 1) return segments[0];
    return record.displayName || '未命名对象';
  };

  const buildHubKey = (value: string) =>
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') || 'hub';

  const effectiveRecords = useMemo(() => {
    if (!isDemoMode) return records;
    return [
      {
        id: 'demo-customer-home-depot-1',
        portalType: 'customer' as const,
        loginEmail: 'buyer.cn@homedepot.com',
        displayName: 'Home Depot CN Buyer',
        password: 'HdBuyer@2026',
        updatedAt: '2026-03-24T08:30:00.000Z',
        source: 'manual_sync' as const,
        status: 'notified' as const,
        notifiedAt: '2026-03-24T09:00:00.000Z',
      },
      {
        id: 'demo-customer-home-depot-2',
        portalType: 'customer' as const,
        loginEmail: 'qa.apac@homedepot.com',
        displayName: 'Home Depot APAC QA',
        password: 'HdQa@2026',
        updatedAt: '2026-03-23T04:20:00.000Z',
        source: 'login_capture' as const,
        status: 'active' as const,
      },
      {
        id: 'demo-supplier-home-depot-1',
        portalType: 'supplier' as const,
        loginEmail: 'fuzhou.plant01@cosun-supplier.com',
        displayName: 'Fuzhou Plant 01',
        password: 'Plant01@2026',
        updatedAt: '2026-03-24T07:10:00.000Z',
        source: 'user_self_set' as const,
        status: 'active' as const,
      },
      {
        id: 'demo-supplier-home-depot-2',
        portalType: 'supplier' as const,
        loginEmail: 'xiamen.plant02@cosun-supplier.com',
        displayName: 'Xiamen Plant 02',
        password: 'Plant02@2026',
        updatedAt: '2026-03-23T11:45:00.000Z',
        source: 'manual_sync' as const,
        status: 'invalid' as const,
      },
      {
        id: 'demo-third-home-depot-1',
        portalType: 'third_party' as const,
        loginEmail: 'ops@sgs-fuzhou.com',
        displayName: 'SGS Fuzhou Witness',
        password: 'SgsOps@2026',
        updatedAt: '2026-03-24T06:15:00.000Z',
        source: 'manual_sync' as const,
        status: 'active' as const,
      },
      {
        id: 'demo-customer-target-1',
        portalType: 'customer' as const,
        loginEmail: 'sourcing@target.com',
        displayName: 'Target Sourcing',
        password: 'Target@2026',
        updatedAt: '2026-03-22T03:10:00.000Z',
        source: 'user_self_set' as const,
        status: 'cleared' as const,
        clearedAt: '2026-03-23T02:30:00.000Z',
      },
      {
        id: 'demo-supplier-target-1',
        portalType: 'supplier' as const,
        loginEmail: 'ningbo.partner@cosun-supplier.com',
        displayName: 'Ningbo Partner',
        password: 'NbPartner@2026',
        updatedAt: '2026-03-21T09:40:00.000Z',
        source: 'login_capture' as const,
        status: 'notified' as const,
        notifiedAt: '2026-03-21T10:10:00.000Z',
      },
    ];
  }, [isDemoMode, records]);

  type HubAccount = {
    id: string;
    portalType: ExternalPortalType;
    loginEmail: string;
    displayName: string;
    password: string;
    updatedAt: string;
    source: string;
    status: string;
    notifiedAt?: string;
    clearedAt?: string;
    hubId: string;
    organizationName: string;
    phone?: string;
    fromDirectoryOnly?: boolean;
  };

  type MappingHub = {
    id: string;
    hubName: string;
    hubCode: string;
    owner: string;
    region: string;
    riskCount: number;
    pendingNotifyCount: number;
    totalAccounts: number;
    customerCount: number;
    supplierCount: number;
    thirdPartyCount: number;
    latestSyncAt: string;
    primarySide: ExternalPortalType;
    accounts: HubAccount[];
  };

  const hubs = useMemo<MappingHub[]>(() => {
    const grouped = new Map<string, HubAccount[]>();

    effectiveRecords.forEach((record) => {
      const organizationName = extractOrganizationName(record);
      const hubKey = buildHubKey(organizationName);
      const nextRecord: HubAccount = {
        ...record,
        hubId: hubKey,
        organizationName,
        fromDirectoryOnly: false,
      };
      const current = grouped.get(hubKey) || [];
      current.push(nextRecord);
      grouped.set(hubKey, current);
    });

    directoryEntries.forEach((entry) => {
      const baseName = String(entry.company || entry.name || entry.email || '').trim();
      if (!baseName) return;
      const hubId = buildHubKey(baseName);
      const current = grouped.get(hubId) || [];
      const normalizedEmail = String(entry.email || '').trim().toLowerCase();
      const existingAccount = current.find((account) => (
        account.portalType === entry.portalRole &&
        normalizedEmail &&
        String(account.loginEmail || '').trim().toLowerCase() === normalizedEmail
      ));
      if (existingAccount) return;

      current.push({
        id: `directory-${entry.portalRole}-${entry.id}`,
        portalType: entry.portalRole,
        loginEmail: normalizedEmail,
        displayName: String(entry.name || entry.company || entry.email || '未命名账号'),
        password: '',
        updatedAt: '',
        source: 'directory_pending',
        status: 'pending_sync',
        hubId,
        organizationName: baseName,
        phone: entry.phone || '',
        fromDirectoryOnly: true,
      });
      grouped.set(hubId, current);
    });

    return Array.from(grouped.entries())
      .map(([hubId, accounts]) => {
        const latestSyncAt = [...accounts]
          .sort((left, right) => new Date(right.updatedAt || 0).getTime() - new Date(left.updatedAt || 0).getTime())[0]?.updatedAt || '';
        const customerCount = accounts.filter((item) => item.portalType === 'customer').length;
        const supplierCount = accounts.filter((item) => item.portalType === 'supplier').length;
        const thirdPartyCount = accounts.filter((item) => item.portalType === 'third_party').length;
        const riskCount = accounts.filter((item) => item.status === 'invalid' || item.status === 'cleared').length;
        const pendingNotifyCount = accounts.filter((item) => item.status === 'active' || item.status === 'pending_sync').length;
        const primarySide = customerCount > 0 ? 'customer' : supplierCount > 0 ? 'supplier' : 'third_party';

        return {
          id: hubId,
          hubName: accounts[0]?.organizationName || '未命名中枢对象',
          hubCode: `HUB-${hubId.slice(0, 8).toUpperCase()}`,
          owner: primarySide === 'customer' ? '销售中台' : primarySide === 'supplier' ? '采购中台' : '协同服务中台',
          region: customerCount > 0 && supplierCount > 0 ? '跨侧协同' : primarySide === 'customer' ? '客户协同' : primarySide === 'supplier' ? '供应协同' : '第三方协同',
          riskCount,
          pendingNotifyCount,
          totalAccounts: accounts.length,
          customerCount,
          supplierCount,
          thirdPartyCount,
          latestSyncAt,
          primarySide,
          accounts: accounts.sort((left, right) => {
            const rightTime = right.updatedAt ? new Date(right.updatedAt).getTime() : 0;
            const leftTime = left.updatedAt ? new Date(left.updatedAt).getTime() : 0;
            if (rightTime !== leftTime) return rightTime - leftTime;
            return left.displayName.localeCompare(right.displayName, 'zh-CN');
          }),
        };
      })
      .sort((left, right) => {
      const rightTime = right.latestSyncAt ? new Date(right.latestSyncAt).getTime() : 0;
      const leftTime = left.latestSyncAt ? new Date(left.latestSyncAt).getTime() : 0;
      if (rightTime !== leftTime) return rightTime - leftTime;
      return left.hubName.localeCompare(right.hubName, 'zh-CN');
    });
  }, [directoryEntries, effectiveRecords]);

  useEffect(() => {
    if (!hubs.length) {
      setSelectedHubId('');
      return;
    }
    if (!selectedHubId || !hubs.some((hub) => hub.id === selectedHubId)) {
      setSelectedHubId(hubs[0].id);
    }
  }, [hubs, selectedHubId]);

  const selectedHub = hubs.find((hub) => hub.id === selectedHubId) || null;
  const selectedHubAccounts = selectedHub?.accounts || [];

  useEffect(() => {
    if (!selectedHubAccounts.length) {
      setSelectedAccountId('');
      return;
    }
    if (!selectedAccountId || !selectedHubAccounts.some((account) => account.id === selectedAccountId)) {
      setSelectedAccountId(selectedHubAccounts[0].id);
    }
  }, [selectedAccountId, selectedHubAccounts]);

  const selectedAccount = selectedHubAccounts.find((account) => account.id === selectedAccountId) || null;

  const getPoolAccounts = (portalType: ExternalPortalType) =>
    selectedHubAccounts.filter((account) => account.portalType === portalType);

  const summary = useMemo(() => ({
    hubCount: hubs.length,
    totalAccounts: hubs.reduce((sum, hub) => sum + hub.totalAccounts, 0),
    pendingNotifyCount: hubs.reduce((sum, hub) => sum + hub.pendingNotifyCount, 0),
    riskCount: hubs.reduce((sum, hub) => sum + hub.riskCount, 0),
  }), [hubs]);

  const handleCopyPassword = async (record: Pick<HubAccount, 'password'>) => {
    if (!record.password) {
      toast.info('该镜像已清除，无可复制密码');
      return;
    }
    try {
      await navigator.clipboard.writeText(record.password);
      toast.success('镜像密码已复制');
    } catch {
      toast.error('复制失败，请检查浏览器权限');
    }
  };

  const runRecordAction = (action: () => void, successMessage: string) => {
    if (isDemoMode) {
      toast.info('当前为示意结构，接入真实镜像数据后可执行操作');
      return;
    }
    if (selectedAccount?.fromDirectoryOnly) {
      toast.info('该账号仅存在于目录，尚未建立镜像，请先执行建镜像/同步');
      return;
    }
    action();
    reloadRecords();
    toast.success(successMessage);
  };

  const poolHeaderClass: Record<ExternalPortalType, string> = {
    customer: 'border-blue-200 bg-blue-50/70 text-blue-700',
    supplier: 'border-emerald-200 bg-emerald-50/70 text-emerald-700',
    third_party: 'border-amber-200 bg-amber-50/70 text-amber-700',
  };

  return (
    <div className="space-y-5">
      <Section title="外部门户账号映射中心" titleEN="External Portal Account Mapping Hub" icon={<Globe className="w-3.5 h-3.5" />}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[13px] font-semibold text-slate-800">以我方 ERP 中枢为主轴，统一拖拽客户侧 / 供应商侧 / 第三方侧账号池</p>
              {isDemoMode && (
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                  结构示意
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              页面主语不再是“单条密码”，而是“我方侧主对象下面挂接的多外侧账号池”。适合一主拖多侧、多账号并行协同的 ERP 结构。
            </p>
          </div>
          <button
            type="button"
            onClick={reloadRecords}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            刷新镜像
          </button>
        </div>
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <PreviewMetricCard label="中枢对象" value={summary.hubCount} hint="我方侧主对象数" accent="slate" />
        <PreviewMetricCard label="外侧账号" value={summary.totalAccounts} hint="客户 / 供应商 / 第三方合计" accent="blue" />
        <PreviewMetricCard label="待通知" value={summary.pendingNotifyCount} hint="已同步但仍待业务通知" accent="amber" />
        <PreviewMetricCard label="风险镜像" value={summary.riskCount} hint="失效 / 已清除 / 单侧异常" accent="green" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)] gap-5">
        <Section title="我方侧中枢对象" titleEN="Hub Objects" icon={<Building2 className="w-3.5 h-3.5" />}>
          <div className="space-y-3">
            {hubs.map((hub) => (
              <button
                key={hub.id}
                type="button"
                onClick={() => setSelectedHubId(hub.id)}
                className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                  selectedHubId === hub.id
                    ? 'border-red-200 bg-red-50/70'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-slate-800">{hub.hubName}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{hub.hubCode} · {hub.owner}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {hub.totalAccounts}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">客 {hub.customerCount}</span>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">供 {hub.supplierCount}</span>
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">三 {hub.thirdPartyCount}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span>待通知 {hub.pendingNotifyCount}</span>
                  <span>风险 {hub.riskCount}</span>
                </div>
              </button>
            ))}
            {hubs.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-[12px] text-slate-400">
                暂无中枢对象
              </div>
            )}
          </div>
        </Section>

        <div className="space-y-5">
          <Section title="中枢映射总览" titleEN="Hub Mapping Overview" icon={<Shield className="w-3.5 h-3.5" />}>
            {selectedHub ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white">
                      我方侧 ERP 中枢
                    </span>
                    <span className="text-[13px] font-semibold text-slate-800">{selectedHub.hubName}</span>
                    <span className="text-[11px] text-slate-400">{selectedHub.hubCode}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <p className="text-slate-400">中枢归属</p>
                      <p className="mt-1 font-medium text-slate-800">{selectedHub.owner}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <p className="text-slate-400">协同区域</p>
                      <p className="mt-1 font-medium text-slate-800">{selectedHub.region}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <p className="text-slate-400">最近同步</p>
                      <p className="mt-1 font-medium text-slate-800">{formatTimestamp(selectedHub.latestSyncAt)}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <p className="text-slate-400">外侧挂接</p>
                      <p className="mt-1 font-medium text-slate-800">{selectedHub.totalAccounts} 个账号</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">一主拖多侧</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
                    <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-white">{selectedHub.hubName}</span>
                    <span className="text-slate-300">→</span>
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-blue-700">客户侧 {selectedHub.customerCount}</span>
                    <span className="text-slate-300">→</span>
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">供应商侧 {selectedHub.supplierCount}</span>
                    <span className="text-slate-300">→</span>
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-amber-700">第三方侧 {selectedHub.thirdPartyCount}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-[12px] text-slate-400">
                选中一个我方侧中枢对象后，查看其拖挂的多外侧账号池。
              </div>
            )}
          </Section>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {(Object.keys(portalMeta) as ExternalPortalType[]).map((portalType) => {
              const poolAccounts = getPoolAccounts(portalType);
              return (
                <Section key={portalType} title={portalMeta[portalType].label} titleEN="Account Pool" icon={<Users className="w-3.5 h-3.5" />}>
                  <div className={`rounded-xl border px-4 py-3 ${poolHeaderClass[portalType]}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-semibold">{portalMeta[portalType].label}</p>
                        <p className="mt-1 text-[11px] opacity-80">{portalMeta[portalType].description}</p>
                      </div>
                      <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold">{poolAccounts.length}</span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {poolAccounts.map((account) => {
                      const meta = statusMeta[account.status] || statusMeta.active;
                      return (
                        <button
                          key={account.id}
                          type="button"
                          onClick={() => setSelectedAccountId(account.id)}
                          className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                            selectedAccountId === account.id
                              ? 'border-red-200 bg-red-50/50'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-semibold text-slate-800">{account.displayName || account.loginEmail}</p>
                              <p className="mt-1 truncate text-[11px] text-slate-500">{account.loginEmail}</p>
                            </div>
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.className}`}>
                              {meta.label}
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                            <span>密码 {maskPassword(account.password)}</span>
                            <span>来源 {sourceLabelMap[account.source] || account.source}</span>
                            <span>同步 {formatTimestamp(account.updatedAt)}</span>
                            <span>{account.status === 'pending_sync' ? '待建镜像' : account.notifiedAt ? `通知 ${formatTimestamp(account.notifiedAt)}` : '待通知'}</span>
                          </div>
                        </button>
                      );
                    })}
                    {poolAccounts.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-[12px] text-slate-400">
                        当前中枢对象下暂无该侧账号
                      </div>
                    )}
                  </div>
                </Section>
              );
            })}
          </div>

          <Section title="选中账号详情" titleEN="Selected External Account" icon={<Eye className="w-3.5 h-3.5" />}>
            {selectedAccount ? (
              <div className="space-y-4 text-[12px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">账号映射</p>
                    <div className="mt-3 grid grid-cols-2 gap-y-2">
                      <span className="text-slate-400">我方侧中枢</span><span className="text-slate-800">{selectedHub?.hubName || '—'}</span>
                      <span className="text-slate-400">对象名称</span><span className="text-slate-800">{selectedAccount.displayName || '未命名'}</span>
                      <span className="text-slate-400">组织归属</span><span className="text-slate-800">{selectedAccount.organizationName}</span>
                      <span className="text-slate-400">账号池</span><span className="text-slate-800">{portalMeta[selectedAccount.portalType].label}</span>
                      <span className="text-slate-400">登录邮箱</span><span className="text-slate-800">{selectedAccount.loginEmail}</span>
                      <span className="text-slate-400">镜像密码</span><span className="font-mono text-slate-800">{selectedAccount.status === 'pending_sync' ? '尚未建立镜像' : (selectedAccount.password || '已清除')}</span>
                      <span className="text-slate-400">联系电话</span><span className="text-slate-800">{selectedAccount.phone || '—'}</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">同步与通知</p>
                    <div className="mt-3 grid grid-cols-2 gap-y-2">
                      <span className="text-slate-400">当前状态</span><span className="text-slate-800">{statusMeta[selectedAccount.status]?.label || selectedAccount.status}</span>
                      <span className="text-slate-400">同步来源</span><span className="text-slate-800">{sourceLabelMap[selectedAccount.source] || selectedAccount.source}</span>
                      <span className="text-slate-400">最近同步时间</span><span className="text-slate-800">{formatTimestamp(selectedAccount.updatedAt)}</span>
                      <span className="text-slate-400">最近通知时间</span><span className="text-slate-800">{formatTimestamp(selectedAccount.notifiedAt)}</span>
                      <span className="text-slate-400">清除时间</span><span className="text-slate-800">{formatTimestamp(selectedAccount.clearedAt)}</span>
                      <span className="text-slate-400">中枢建议动作</span><span className="text-slate-800">{selectedAccount.status === 'pending_sync' ? '先建镜像并同步首个凭证' : selectedAccount.status === 'active' ? '优先通知' : selectedAccount.status === 'invalid' ? '重新同步或更换账号' : '维持留痕'}</span>
                    </div>
                  </div>
                </div>

                {selectedAccount.fromDirectoryOnly ? (
                  <div className="rounded-xl border border-violet-200 bg-violet-50/60 px-4 py-4 text-[12px] text-violet-800">
                    该账号已存在于外部门户目录，但尚未建立密码镜像。
                    建议下一步接入“建镜像 / 首次同步”动作，把目录账号转成可管理的镜像账号。
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <button type="button" onClick={() => void handleCopyPassword(selectedAccount)} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-medium text-slate-700 hover:bg-slate-50">
                      <Copy className="h-3.5 w-3.5" />
                      复制密码
                    </button>
                    <button type="button" onClick={() => runRecordAction(() => markPortalPasswordMirrorNotified(selectedAccount.id), '已标记为已通知')} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-medium text-slate-700 hover:bg-slate-50">
                      <Check className="h-3.5 w-3.5" />
                      标记已通知
                    </button>
                    <button type="button" onClick={() => runRecordAction(() => resyncPortalPasswordMirror(selectedAccount.id), '镜像已重新同步')} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-medium text-slate-700 hover:bg-slate-50">
                      <RefreshCcw className="h-3.5 w-3.5" />
                      重新同步
                    </button>
                    <button type="button" onClick={() => runRecordAction(() => invalidatePortalPasswordMirror(selectedAccount.id), '镜像已标记失效')} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-200 px-3 py-2 text-[12px] font-medium text-amber-700 hover:bg-amber-50">
                      <Ban className="h-3.5 w-3.5" />
                      标记失效
                    </button>
                    <button type="button" onClick={() => runRecordAction(() => clearPortalPasswordMirror(selectedAccount.id), '镜像已清除')} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-[12px] font-medium text-red-600 hover:bg-red-50">
                      <Trash2 className="h-3.5 w-3.5" />
                      清除镜像
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-[12px] text-slate-400">
                选中某个外侧账号后，可执行单账号级通知 / 同步 / 清理操作。
              </div>
            )}
          </Section>

          <Section title="设计原则" titleEN="Why This Layout" icon={<Lock className="w-3.5 h-3.5" />}>
            <div className="space-y-3 text-[12px] leading-6 text-slate-600">
              <div>
                <p className="font-semibold text-slate-800">1. 主语改成“我方侧中枢对象”</p>
                <p>先看我方侧拖挂了哪些外部对象，再看每个对象下面挂了哪些客户、供应商、第三方账号。</p>
              </div>
              <div>
                <p className="font-semibold text-slate-800">2. 从“单条密码”升级为“多账号池”</p>
                <p>客户侧、供应商侧、第三方侧都可能同时挂很多账号，所以必须按池管理，而不是切成三张孤立列表。</p>
              </div>
              <div>
                <p className="font-semibold text-slate-800">3. 操作分层</p>
                <p>中枢级看总览与风险，账号池级看挂接规模，单账号级执行复制、通知、同步、失效和清理。</p>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Permission
// ─────────────────────────────────────────────────────────────────────────────
const INTERNAL_ROLES = new Set([
  'Admin', 'CEO', 'CFO',
  'Sales_Director', 'Regional_Manager', 'Sales_Manager', 'Sales_Rep', 'Sales_Assistant',
  'Finance', 'External_Accountant',
  'Procurement_Manager', 'Procurement',
  'Marketing_Ops', 'Marketing_Assistant', 'Documentation_Officer',
  'QC', 'Warehouse_Ops', 'HR_Admin', 'Admin_Ops',
]);

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
interface Props { onBack?: () => void; }

export default function AdminOrganizationProfile({ onBack }: Props) {
  const { adminOrg, updateAdminOrg, uploadAdminLogo } = useAdminOrganization();
  const { currentUser } = useAuth();
  const canEdit = !currentUser || INTERNAL_ROLES.has(currentUser.role ?? '');

  // ── State machine ─────────────────────────────────────────────────────────
  const [mode,        setMode]        = useState<Mode>('view');
  const [activeTab,   setActiveTab]   = useState<MasterTab>('basic');
  const [draft,       setDraft]       = useState<AdminOrgProfile>({ ...adminOrg });
  const [logoPreview, setLogoPreview] = useState<string | null>(adminOrg.logoUrl);
  const [logoFile,    setLogoFile]    = useState<File | null>(null);
  const [saving,      setSaving]      = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === 'view') {
      setDraft({ ...adminOrg });
      setLogoPreview(adminOrg.logoUrl);
    }
  }, [adminOrg, mode]);

  // ── Draft field setters ───────────────────────────────────────────────────
  type TopKey = keyof Omit<
    AdminOrgProfile,
    'id' | 'logoUrl' | 'bankRMB' | 'bankUSD' | 'bankPrivate' | 'internalContacts' | 'internalAccounts' | 'documentDefaults'
  >;
  const set     = (k: TopKey, v: string)                       => setDraft(p => ({ ...p, [k]: v }));
  const setRMB  = (k: keyof BankAccountRMB, v: string)         => setDraft(p => ({ ...p, bankRMB:     { ...p.bankRMB,     [k]: v } }));
  const setUSD  = (k: keyof BankAccountUSD, v: string)         => setDraft(p => ({ ...p, bankUSD:     { ...p.bankUSD,     [k]: v } }));
  const setPriv = (k: keyof BankAccountPrivate, v: string)     => setDraft(p => ({ ...p, bankPrivate: { ...p.bankPrivate, [k]: v } }));
  const setDocDefault = (k: keyof AdminOrgProfile['documentDefaults'], v: string) =>
    setDraft(p => ({ ...p, documentDefaults: { ...p.documentDefaults, [k]: v } }));
  const setContact = (id: string, key: keyof InternalContact, value: string | boolean) =>
    setDraft(p => ({
      ...p,
      internalContacts: p.internalContacts.map(contact =>
        contact.id === id ? { ...contact, [key]: value } : contact
      ),
    }));
  const addContact = async () => {
    const nextContact: InternalContact = {
      id: `contact-${Date.now()}`,
      employeeNo: getNextEmployeeNo(draft.internalContacts),
      name: '',
      department: '',
      title: '',
      managerId: '',
      extension: '',
      phone: '',
      email: '',
      wechat: '',
      status: '在职',
      visibleInDocuments: true,
    };
    const nextContacts = normalizeContactEmployeeNos([
      ...draft.internalContacts,
      nextContact,
    ]);

    const previousContacts = draft.internalContacts;
    setDraft((p) => ({ ...p, internalContacts: nextContacts }));
    setSaving(true);
    try {
      const saveResult = await updateAdminOrg({
        nameCN: draft.nameCN,
        nameEN: draft.nameEN,
        descriptionCN: draft.descriptionCN,
        descriptionEN: draft.descriptionEN,
        phone: draft.phone,
        email: draft.email,
        contactPerson: draft.contactPerson,
        website: draft.website,
        addressCN: draft.addressCN,
        addressEN: draft.addressEN,
        taxId: draft.taxId,
        defaultCurrencyCN: draft.defaultCurrencyCN,
        defaultCurrencyEN: draft.defaultCurrencyEN,
        defaultCurrency: draft.defaultCurrencyCN,
        timezone: draft.timezone,
        bankRMB: draft.bankRMB,
        bankUSD: draft.bankUSD,
        bankPrivate: draft.bankPrivate,
        internalContacts: nextContacts,
        internalAccounts: draft.internalAccounts,
        documentDefaults: draft.documentDefaults,
        ...(logoPreview !== adminOrg.logoUrl ? { logoUrl: logoPreview } : {}),
      });
      toast.success(saveResult.remoteSaved ? '人员已新增，并已自动保存' : '人员已新增，已自动保存到本地');
      return nextContact.id;
    } catch (error) {
      console.error('Add contact failed', error);
      toast.error('新增人员失败，请重试');
      setDraft((p) => ({ ...p, internalContacts: previousContacts }));
      return undefined;
    } finally {
      setSaving(false);
    }
  };
  const removeContact = (id: string) =>
    setDraft((p) => {
      if (p.internalContacts.length <= 1) return p;

      const nextContacts = normalizeContactEmployeeNos(
        p.internalContacts.filter((contact) => contact.id !== id),
      );
      const nextAccounts = p.internalAccounts.map((account) => (
        account.employeeId === id
          ? {
              ...account,
              accountStatus: 'deleted',
              canLogin: false,
              forcePasswordReset: false,
              notes: account.notes
                ? `${account.notes}；人员主档已删除，账号已归档停用`
                : '人员主档已删除，账号已归档停用',
            }
          : account
      ));

      return {
        ...p,
        internalContacts: nextContacts,
        internalAccounts: nextAccounts,
      };
    });
  const reorderContact = (draggedId: string, targetId: string, dropMode: OrgDropMode, managerId?: string) =>
    setDraft(p => {
      const nextContacts = managerId === '__TOP__'
        ? buildTopInsertedContacts(p.internalContacts, draggedId)
        : buildReorderedContacts(p.internalContacts, draggedId, targetId, dropMode, managerId);
      return nextContacts === p.internalContacts ? p : { ...p, internalContacts: nextContacts };
    });
  const autoReorderContact = async (draggedId: string, targetId: string, dropMode: OrgDropMode, managerId?: string) => {
    const nextContacts = managerId === '__TOP__'
      ? buildTopInsertedContacts(draft.internalContacts, draggedId)
      : buildReorderedContacts(draft.internalContacts, draggedId, targetId, dropMode, managerId);
    if (nextContacts === draft.internalContacts) return;
    setDraft((p) => ({ ...p, internalContacts: nextContacts }));
    setSaving(true);
    try {
      const syncPromise = updateAdminOrg({
        nameCN: draft.nameCN,
        nameEN: draft.nameEN,
        descriptionCN: draft.descriptionCN,
        descriptionEN: draft.descriptionEN,
        phone: draft.phone,
        email: draft.email,
        contactPerson: draft.contactPerson,
        website: draft.website,
        addressCN: draft.addressCN,
        addressEN: draft.addressEN,
        taxId: draft.taxId,
        defaultCurrencyCN: draft.defaultCurrencyCN,
        defaultCurrencyEN: draft.defaultCurrencyEN,
        defaultCurrency: draft.defaultCurrencyCN,
        timezone: draft.timezone,
        bankRMB: draft.bankRMB,
        bankUSD: draft.bankUSD,
        bankPrivate: draft.bankPrivate,
        internalContacts: nextContacts,
        internalAccounts: draft.internalAccounts,
        documentDefaults: draft.documentDefaults,
        ...(logoPreview !== adminOrg.logoUrl ? { logoUrl: logoPreview } : {}),
      });
      void syncPromise.then((result) => {
        toast.success(result.remoteSaved ? '组织顺序已自动保存并同步云端' : '组织顺序已自动保存到本地，云端同步稍后重试');
      });
    } catch (error) {
      console.error('Auto save reorder failed', error);
      toast.error('自动保存失败，请重试');
      setDraft((p) => ({ ...p, internalContacts: adminOrg.internalContacts }));
    } finally {
      setSaving(false);
    }
  };
  const persistAccounts = async (
    nextAccounts: InternalAccount[],
    successMessage: string,
    rollbackMessage = '账号更新失败，请重试',
  ) => {
    const previousAccounts = draft.internalAccounts;
    setDraft((p) => ({ ...p, internalAccounts: nextAccounts }));
    setSaving(true);
    try {
      const syncPromise = updateAdminOrg({
        nameCN: draft.nameCN,
        nameEN: draft.nameEN,
        descriptionCN: draft.descriptionCN,
        descriptionEN: draft.descriptionEN,
        phone: draft.phone,
        email: draft.email,
        contactPerson: draft.contactPerson,
        website: draft.website,
        addressCN: draft.addressCN,
        addressEN: draft.addressEN,
        taxId: draft.taxId,
        defaultCurrencyCN: draft.defaultCurrencyCN,
        defaultCurrencyEN: draft.defaultCurrencyEN,
        defaultCurrency: draft.defaultCurrencyCN,
        timezone: draft.timezone,
        bankRMB: draft.bankRMB,
        bankUSD: draft.bankUSD,
        bankPrivate: draft.bankPrivate,
        internalContacts: draft.internalContacts,
        internalAccounts: nextAccounts,
        documentDefaults: draft.documentDefaults,
        ...(logoPreview !== adminOrg.logoUrl ? { logoUrl: logoPreview } : {}),
      });
      void syncPromise.then((result) => {
        toast.success(result.remoteSaved ? `${successMessage}，并已同步云端` : `${successMessage}，已保存到本地`);
      });
    } catch (error) {
      console.error('Persist accounts failed', error);
      toast.error(rollbackMessage);
      setDraft((p) => ({ ...p, internalAccounts: previousAccounts }));
    } finally {
      setSaving(false);
    }
  };
  const autoPatchAccount = async (id: string, patch: Partial<InternalAccount>, successMessage = '账号已更新') => {
    const nextAccounts = draft.internalAccounts.map((account) => (
      account.id === id ? { ...account, ...patch } : account
    ));
    if (nextAccounts === draft.internalAccounts) return;
    await persistAccounts(nextAccounts, successMessage);
  };
  const autoProvisionAccount = async (contactId: string, initialRole = '') => {
    const contact = draft.internalContacts.find((item) => item.id === contactId);
    if (!contact) return;
    const existingAccount = draft.internalAccounts.find((account) => account.employeeId === contactId);
    if (existingAccount) {
      toast.info('该人员已有账号');
      return;
    }
    const temporaryPassword = generateTemporaryPassword(contact.employeeNo || contact.id);
    const nextAccounts = [
      ...draft.internalAccounts,
      {
        id: `account-${Date.now()}`,
        employeeId: contact.id,
        authUserId: '',
        username: buildAccountUsername(contact),
        loginEmail: contact.email || '',
        loginPassword: temporaryPassword,
        role: initialRole,
        region: 'all',
        department: contact.department || '',
        accountStatus: 'active',
        canLogin: true,
        forcePasswordReset: true,
        lastLoginAt: '',
        notes: '系统自动开通，首次登录需修改密码',
      },
    ];
    await persistAccounts(nextAccounts, `账号已开通，临时密码：${temporaryPassword}`);
  };
  const autoResetAccountPassword = async (accountId: string) => {
    const target = draft.internalAccounts.find((account) => account.id === accountId);
    if (!target) return;
    const temporaryPassword = generateTemporaryPassword(target.employeeId || target.id);
    await autoPatchAccount(
      accountId,
      {
        loginPassword: temporaryPassword,
        forcePasswordReset: true,
      },
      `密码已重置，临时密码：${temporaryPassword}`,
    );
  };
  // ── Mode transitions ──────────────────────────────────────────────────────
  const enterEdit = () => {
    setDraft({ ...adminOrg });
    setLogoPreview(adminOrg.logoUrl);
    setLogoFile(null);
    setMode('edit');
  };
  const cancelEdit = () => {
    setDraft({ ...adminOrg });
    setLogoPreview(adminOrg.logoUrl);
    setLogoFile(null);
    if (fileRef.current) fileRef.current.value = '';
    setMode('view');
  };

  // ── Logo handlers ─────────────────────────────────────────────────────────
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error('图片不能超过 3 MB'); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };
  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!draft.nameCN.trim()) { toast.error('公司中文名不能为空'); return; }
    setSaving(true);
    try {
      // 1. Upload logo if a new file was selected; returns false on quota exceeded
      let logoQuotaHit = false;
      let nextLogoUrl = logoPreview;
      if (logoFile) {
        const saved = await uploadAdminLogo(logoFile);
        if (!saved) logoQuotaHit = true;
        nextLogoUrl = localStorage.getItem('cosun_admin_org_logo') || logoPreview;
      }

      // 2. Save all text fields (never includes the logo data-URI — stored separately)
      const saveResult = await updateAdminOrg({
        nameCN:        draft.nameCN,
        nameEN:        draft.nameEN,
        descriptionCN: draft.descriptionCN,
        descriptionEN: draft.descriptionEN,
        phone:         draft.phone,
        email:         draft.email,
        contactPerson: draft.contactPerson,
        website:       draft.website,
        addressCN:     draft.addressCN,
        addressEN:     draft.addressEN,
        taxId:         draft.taxId,
        defaultCurrencyCN: draft.defaultCurrencyCN,
        defaultCurrencyEN: draft.defaultCurrencyEN,
        defaultCurrency: draft.defaultCurrencyCN,
        timezone:      draft.timezone,
        bankRMB:       draft.bankRMB,
        bankUSD:       draft.bankUSD,
        bankPrivate:   draft.bankPrivate,
        internalContacts: normalizeContactEmployeeNos(draft.internalContacts),
        internalAccounts: draft.internalAccounts,
        documentDefaults: draft.documentDefaults,
        // Persist the effective logo for both new uploads and removals.
        ...(logoFile || logoPreview !== adminOrg.logoUrl ? { logoUrl: nextLogoUrl } : {}),
      });

      setLogoFile(null);
      setMode('view');

      if (logoQuotaHit) {
        toast.warning(
          'LOGO 因浏览器存储空间不足无法永久保存（当前会话可见）。其他信息已成功保存。',
          { duration: 6000 }
        );
      } else if (!saveResult.remoteSaved && saveResult.localSaved) {
        toast.warning('公司信息已保存到本地，云端同步暂未完成。', { duration: 5000 });
      } else if (!saveResult.localSaved) {
        toast.error('本地缓存保存失败，请检查浏览器存储空间。');
      } else {
        toast.success('公司信息已保存，并已同步云端');
      }
    } catch {
      toast.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const isEdit = mode === 'edit';
  const tf     = useTextField(isEdit);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-4 px-4 pb-8 xl:px-6 2xl:px-8">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <>
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-800 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                返回
              </button>
              <div className="w-px h-5 bg-slate-200" />
            </>
          )}
          <div className="flex items-center gap-2.5">
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (isEdit && canEdit) fileRef.current?.click();
                }}
                disabled={!isEdit || !canEdit}
                className={`flex items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm transition-colors ${
                  isEdit && canEdit ? 'cursor-pointer hover:border-red-300 hover:bg-red-50/40' : 'cursor-default'
                }`}
                style={{ width: 40, height: 40, minWidth: 40, minHeight: 40, maxWidth: 40, maxHeight: 40 }}
                title={isEdit && canEdit ? '上传LOGO' : '公司LOGO'}
              >
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Company Logo"
                    className="block p-1"
                    style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-red-50 to-rose-100 text-[16px] font-bold text-red-400">
                    {(draft.nameCN || 'CO').replace(/\s+/g, '').slice(0, 2).toUpperCase()}
                  </div>
                )}
              </button>
              {isEdit && canEdit && (
                <span className="pointer-events-none absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 shadow-sm">
                  <Camera className="h-3 w-3 text-white" />
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-[15px] font-semibold text-slate-800 leading-tight">企业主数据中心</h1>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Languages className="w-3 h-3 text-slate-300" />
                <p className="text-[11px] text-slate-400">基础信息 / 银行账户 / 人员与账号中心 / 文档默认信息</p>
              </div>
            </div>
          </div>
        </div>

        {canEdit && activeTab !== 'people-center' && activeTab !== 'portal-mirror' && (
          <div className="flex items-center gap-2">
            {isEdit ? (
              <>
                <button
                  onClick={cancelEdit}
                  className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  {saving ? '保存中…' : '保存'}
                </button>
              </>
            ) : (
              <button
                onClick={enterEdit}
                className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                编辑 · Edit
              </button>
            )}
          </div>
        )}
      </div>

      {canEdit && (
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={handleLogoChange}
        />
      )}

      <div className="flex flex-nowrap gap-3 overflow-x-auto pb-1">
        <TabButton
          active={activeTab === 'basic'}
          label="基础信息"
          description="公司名称、地址、邮箱、联系人、税号等"
          icon={<Building2 className="w-4 h-4" />}
          onClick={() => setActiveTab('basic')}
        />
        <TabButton
          active={activeTab === 'bank'}
          label="银行账户"
          description="国内公账、美元账户、私人账户"
          icon={<Landmark className="w-4 h-4" />}
          onClick={() => setActiveTab('bank')}
        />
        <TabButton
          active={activeTab === 'people-center'}
          label="人员与账号中心"
          description="统一管理人员主档、账号与访问、角色权限"
          icon={<Shield className="w-4 h-4" />}
          onClick={() => setActiveTab('people-center')}
        />
        <TabButton
          active={activeTab === 'portal-mirror'}
          label="外部门户账号映射中心"
          description="我方侧中枢拖挂客户 / 供应商 / 第三方多账号池"
          icon={<Globe className="w-4 h-4" />}
          onClick={() => setActiveTab('portal-mirror')}
        />
        <TabButton
          active={activeTab === 'documents'}
          label="文档默认信息"
          description="默认签字人、页脚、币种、时区"
          icon={<FileBadge2 className="w-4 h-4" />}
          onClick={() => setActiveTab('documents')}
        />
      </div>

      {activeTab === 'basic' && (
      <>
      {/* ══════════════════════════════════════════════════════════════════════
          Section 2 — Basic Info (dual-column)
      ══════════════════════════════════════════════════════════════════════ */}
      <Section title="基本信息" titleEN="Basic Information" icon={<FileText className="w-3.5 h-3.5" />}>

        {/* Column guide */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-1 pb-2 border-b border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">🇨🇳 中文信息</p>
          <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">🇺🇸 English Information</p>
        </div>

        <DualRow
          labelCN="公司名称"
          labelEN="Company Name"
          leftNode={tf(draft.nameCN, v => set('nameCN', v), '请输入公司中文名称')}
          rightNode={tf(draft.nameEN, v => set('nameEN', v), 'Enter company name in English')}
        />
        <DualRow
          labelCN="公司简介"
          labelEN="Company Description"
          leftNode={tf(draft.descriptionCN, v => set('descriptionCN', v), '专注建材供应链…', 'textarea')}
          rightNode={tf(draft.descriptionEN, v => set('descriptionEN', v), 'Focused on building materials supply chain…', 'textarea')}
        />
        <DualRow
          labelCN="公司地址"
          labelEN="Company Address"
          leftNode={tf(draft.addressCN, v => set('addressCN', v), '福建省厦门市思明区…')}
          rightNode={tf(draft.addressEN, v => set('addressEN', v), 'Siming District, Xiamen, Fujian, China')}
        />
        <DualRow
          labelCN="统一社会信用代码"
          labelEN="Tax ID"
          leftNode={isEdit ? (
            <input className={INPUT} value={draft.taxId} onChange={e => set('taxId', e.target.value)} placeholder="9135XXXXXXXXXXXXXX" />
          ) : adminOrg.taxId ? <span className={MONO}>{adminOrg.taxId}</span> : <span className={NONE}>—</span>}
          rightNode={isEdit ? (
            <input className={INPUT} value={draft.taxId} onChange={e => set('taxId', e.target.value)} placeholder="9135XXXXXXXXXXXXXX" />
          ) : adminOrg.taxId ? <span className={MONO}>{adminOrg.taxId}</span> : <span className={NONE}>—</span>}
        />
        <DualRow
          labelCN="联系电话"
          labelEN="Phone"
          leftNode={isEdit ? (
            <input className={INPUT} value={draft.phone} onChange={e => set('phone', e.target.value)} placeholder="+86 592 1234567" />
          ) : draft.phone ? <span className={VAL}>{adminOrg.phone}</span> : <span className={NONE}>—</span>}
          rightNode={isEdit ? (
            <input className={INPUT} value={draft.phone} onChange={e => set('phone', e.target.value)} placeholder="+86 592 1234567" />
          ) : draft.phone ? <span className={VAL}>{adminOrg.phone}</span> : <span className={NONE}>—</span>}
        />
        <DualRow
          labelCN="邮箱"
          labelEN="Email"
          leftNode={isEdit ? (
            <input className={INPUT} value={draft.email} onChange={e => set('email', e.target.value)} placeholder="purchase@example.com" type="email" />
          ) : adminOrg.email ? <span className={VAL}>{adminOrg.email}</span> : <span className={NONE}>—</span>}
          rightNode={isEdit ? (
            <input className={INPUT} value={draft.email} onChange={e => set('email', e.target.value)} placeholder="purchase@example.com" type="email" />
          ) : adminOrg.email ? <span className={VAL}>{adminOrg.email}</span> : <span className={NONE}>—</span>}
        />
        <DualRow
          labelCN="联系人"
          labelEN="Contact Person"
          leftNode={isEdit ? (
            <input className={INPUT} value={draft.contactPerson} onChange={e => set('contactPerson', e.target.value)} placeholder="请输入联系人" />
          ) : adminOrg.contactPerson ? <span className={VAL}>{adminOrg.contactPerson}</span> : <span className={NONE}>—</span>}
          rightNode={isEdit ? (
            <input className={INPUT} value={draft.contactPerson} onChange={e => set('contactPerson', e.target.value)} placeholder="Enter contact person" />
          ) : adminOrg.contactPerson ? <span className={VAL}>{adminOrg.contactPerson}</span> : <span className={NONE}>—</span>}
        />
        <DualRow
          labelCN="官网"
          labelEN="Website"
          leftNode={isEdit ? (
            <input className={INPUT} value={draft.website} onChange={e => set('website', e.target.value)} placeholder="https://www.example.com" type="url" />
          ) : adminOrg.website ? (
            <a href={adminOrg.website} target="_blank" rel="noreferrer" className="text-[13px] text-blue-600 hover:underline underline-offset-2">
              {adminOrg.website}
            </a>
          ) : <span className={NONE}>—</span>}
          rightNode={isEdit ? (
            <input className={INPUT} value={draft.website} onChange={e => set('website', e.target.value)} placeholder="https://www.example.com" type="url" />
          ) : adminOrg.website ? (
            <a href={adminOrg.website} target="_blank" rel="noreferrer" className="text-[13px] text-blue-600 hover:underline underline-offset-2">
              {adminOrg.website}
            </a>
          ) : <span className={NONE}>—</span>}
        />
        <DualRow
          labelCN="默认结算币种"
          labelEN="Default Currency"
          leftNode={isEdit ? (
            <input className={INPUT} value={draft.defaultCurrencyCN} onChange={e => set('defaultCurrencyCN', e.target.value.toUpperCase())} placeholder="CNY" />
          ) : adminOrg.defaultCurrencyCN ? <span className={VAL}>{adminOrg.defaultCurrencyCN}</span> : <span className={NONE}>—</span>}
          rightNode={isEdit ? (
            <input className={INPUT} value={draft.defaultCurrencyEN} onChange={e => set('defaultCurrencyEN', e.target.value.toUpperCase())} placeholder="USD" />
          ) : adminOrg.defaultCurrencyEN ? <span className={VAL}>{adminOrg.defaultCurrencyEN}</span> : <span className={NONE}>—</span>}
        />
        <DualRow
          labelCN="时区"
          labelEN="Timezone"
          leftNode={isEdit ? (
            <input className={INPUT} value={draft.timezone} onChange={e => set('timezone', e.target.value)} placeholder="Asia/Shanghai" />
          ) : adminOrg.timezone ? <span className={VAL}>{adminOrg.timezone}</span> : <span className={NONE}>—</span>}
          rightNode={isEdit ? (
            <input className={INPUT} value={draft.timezone} onChange={e => set('timezone', e.target.value)} placeholder="Asia/Shanghai" />
          ) : adminOrg.timezone ? <span className={VAL}>{adminOrg.timezone}</span> : <span className={NONE}>—</span>}
        />
      </Section>
      </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          Section 3 — Bank Accounts
          Two equal-width cards side by side on desktop, stacked on mobile.
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'bank' && (
      <>
      <Section title="银行账户信息" titleEN="Bank Accounts" icon={<CreditCard className="w-3.5 h-3.5" />}>

        {/* ── RMB + USD side by side ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

          {/* Left: RMB CNY — Chinese fields only */}
          <BankCard flag="🇨🇳" title="公账 — 人民币" subtitle="CNY · 国内付款" accentColor="red">
            <BankRow label="开户行">
              {tf(draft.bankRMB.bankName, v => setRMB('bankName', v), '中国工商银行厦门分行')}
            </BankRow>
            <BankRow label="银行地址">
              {tf(draft.bankRMB.bankAddress, v => setRMB('bankAddress', v), '福建省厦门市思明区…')}
            </BankRow>
            <BankRow label="账户名称">
              {tf(draft.bankRMB.accountName, v => setRMB('accountName', v), '请输入人民币账户名称')}
            </BankRow>
            <BankRow label="银行账号">
              <MonoField
                isEdit={isEdit}
                value={draft.bankRMB.accountNumber}
                onChange={v => setRMB('accountNumber', v)}
                placeholder="1234 5678 9012 3456"
              />
            </BankRow>
            <BankRow label="SWIFT Code（可选）">
              {isEdit ? (
                <input
                  className={INPUT}
                  value={draft.bankRMB.swift}
                  onChange={e => setRMB('swift', e.target.value)}
                  placeholder="ICBKCNBJXMN"
                />
              ) : draft.bankRMB.swift ? (
                <span className={MONO}>{adminOrg.bankRMB.swift}</span>
              ) : (
                <span className={NONE}>—</span>
              )}
            </BankRow>
            <BankRow label="收款备注">
              {tf(draft.bankRMB.paymentNote, v => setRMB('paymentNote', v), '例：付款时请备注合同号 / 发票号')}
            </BankRow>
          </BankCard>

          {/* Right: USD — English fields only */}
          <BankCard flag="🇺🇸" title="USD Public Account" subtitle="USD · International" accentColor="blue">
            <BankRow label="Bank Name">
              {tf(draft.bankUSD.bankName, v => setUSD('bankName', v), 'Bank of China Xiamen Branch')}
            </BankRow>
            <BankRow label="Bank Address">
              {tf(draft.bankUSD.bankAddress, v => setUSD('bankAddress', v), 'Xiamen, Fujian, China')}
            </BankRow>
            <BankRow label="Account Name">
              {tf(draft.bankUSD.accountName, v => setUSD('accountName', v), 'Enter USD account name')}
            </BankRow>
            <BankRow label="Account Number">
              <MonoField
                isEdit={isEdit}
                value={draft.bankUSD.accountNumber}
                onChange={v => setUSD('accountNumber', v)}
                placeholder="USD account number"
              />
            </BankRow>
            <BankRow label="SWIFT Code">
              {isEdit ? (
                <input
                  className={INPUT}
                  value={draft.bankUSD.swift}
                  onChange={e => setUSD('swift', e.target.value)}
                  placeholder="BKCHCNBJ820"
                />
              ) : draft.bankUSD.swift ? (
                <span className={MONO}>{adminOrg.bankUSD.swift}</span>
              ) : (
                <span className={NONE}>—</span>
              )}
            </BankRow>
            <BankRow label="Payment Note">
              {tf(draft.bankUSD.paymentNote, v => setUSD('paymentNote', v), 'Please mention QT / invoice number in remittance')}
            </BankRow>
          </BankCard>
        </div>

        {/* ── Private Account ─────────────────────────────────────────────── */}
        <BankCard flag="🔒" title="私人账户" subtitle="内部使用 · Internal Only" accentColor="amber">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <div>
              <BankRow label="账户姓名">
                {tf(draft.bankPrivate.accountName, v => setPriv('accountName', v), '张三')}
              </BankRow>
              <BankRow label="开户银行">
                {tf(draft.bankPrivate.bankName, v => setPriv('bankName', v), '招商银行')}
              </BankRow>
              <BankRow label="银行地址">
                {tf(draft.bankPrivate.bankAddress, v => setPriv('bankAddress', v), '福建省福州市…')}
              </BankRow>
            </div>
            <div>
              <BankRow label="银行账号">
                <MonoField
                  isEdit={isEdit}
                  value={draft.bankPrivate.accountNumber}
                  onChange={v => setPriv('accountNumber', v)}
                  placeholder="个人银行卡号"
                />
              </BankRow>
              <BankRow label="备注">
                {tf(draft.bankPrivate.remark, v => setPriv('remark', v), '例：日常采购付款专用')}
              </BankRow>
              <BankRow label="收款备注">
                {tf(draft.bankPrivate.paymentNote, v => setPriv('paymentNote', v), '例：转账时请备注用途')}
              </BankRow>
            </div>
          </div>
        </BankCard>

      </Section>

      {/* Quotation language hint */}
      <div className="flex items-start gap-2 text-[11px] text-slate-400 px-1">
        <Languages className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-300" />
        <span>
          中文报价单自动读取人民币公账字段；英文报价单自动读取 USD Public Account 字段。
          CN quotations use RMB account · EN quotations use USD account.
        </span>
      </div>
      </>
      )}

      {activeTab === 'people-center' && (
        <PeopleAccountCenterModule
          contacts={draft.internalContacts}
          accounts={draft.internalAccounts}
          canEdit={canEdit}
          isEdit={isEdit}
          saving={saving}
          onUpdateContact={setContact}
          onAutoPatchAccount={autoPatchAccount}
          onAutoProvisionAccount={autoProvisionAccount}
          onAutoResetAccountPassword={autoResetAccountPassword}
          onAddContact={addContact}
          onReorderContact={reorderContact}
          onAutoReorderContact={autoReorderContact}
          onRemoveContact={removeContact}
          onEnterEdit={enterEdit}
          onCancelEdit={cancelEdit}
          onSave={handleSave}
        />
      )}

      {activeTab === 'portal-mirror' && (
        <ExternalPortalPasswordMirrorModule />
      )}

      {activeTab === 'documents' && (
        <Section title="文档默认信息" titleEN="Document Defaults" icon={<FileBadge2 className="w-3.5 h-3.5" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">默认签字人</p>
              {isEdit ? (
                <input className={INPUT} value={draft.documentDefaults.defaultSignatory} onChange={e => setDocDefault('defaultSignatory', e.target.value)} placeholder="张明" />
              ) : draft.documentDefaults.defaultSignatory ? <span className={VAL}>{draft.documentDefaults.defaultSignatory}</span> : <span className={NONE}>—</span>}
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">默认邮箱</p>
              {isEdit ? (
                <input className={INPUT} value={draft.documentDefaults.defaultEmail} onChange={e => setDocDefault('defaultEmail', e.target.value)} placeholder="docs@example.com" />
              ) : draft.documentDefaults.defaultEmail ? <span className={VAL}>{draft.documentDefaults.defaultEmail}</span> : <span className={NONE}>—</span>}
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">默认电话</p>
              {isEdit ? (
                <input className={INPUT} value={draft.documentDefaults.defaultPhone} onChange={e => setDocDefault('defaultPhone', e.target.value)} placeholder="+86 591..." />
              ) : draft.documentDefaults.defaultPhone ? <span className={VAL}>{draft.documentDefaults.defaultPhone}</span> : <span className={NONE}>—</span>}
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">默认币种</p>
              {isEdit ? (
                <input className={INPUT} value={draft.documentDefaults.defaultCurrency} onChange={e => setDocDefault('defaultCurrency', e.target.value.toUpperCase())} placeholder="CNY" />
              ) : draft.documentDefaults.defaultCurrency ? <span className={VAL}>{draft.documentDefaults.defaultCurrency}</span> : <span className={NONE}>—</span>}
            </div>
            <div className="md:col-span-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">默认页脚说明</p>
              {isEdit ? (
                <textarea className={TEXTAREA} rows={3} value={draft.documentDefaults.defaultFooterNote} onChange={e => setDocDefault('defaultFooterNote', e.target.value)} placeholder="Thank you for your business." />
              ) : draft.documentDefaults.defaultFooterNote ? <span className={VAL}>{draft.documentDefaults.defaultFooterNote}</span> : <span className={NONE}>—</span>}
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">默认时区</p>
              {isEdit ? (
                <input className={INPUT} value={draft.documentDefaults.defaultTimezone} onChange={e => setDocDefault('defaultTimezone', e.target.value)} placeholder="Asia/Shanghai" />
              ) : draft.documentDefaults.defaultTimezone ? <span className={VAL}>{draft.documentDefaults.defaultTimezone}</span> : <span className={NONE}>—</span>}
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}
