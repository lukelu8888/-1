import React from 'react';

import { INPUT, MONO, NONE } from './sharedStyles';

export function Section({
  title,
  titleEN,
  icon,
  children,
}: {
  title: string;
  titleEN?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
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

export function DualRow({
  labelCN,
  labelEN,
  leftNode,
  rightNode,
}: {
  labelCN: string;
  labelEN: string;
  leftNode: React.ReactNode;
  rightNode: React.ReactNode;
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

export function SingleRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-2.5 border-b border-slate-50 last:border-0">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
        {label}
      </p>
      {children}
    </div>
  );
}

export function BankRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
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

export function BankCard({
  flag,
  title,
  subtitle,
  accentColor,
  children,
}: {
  flag: string;
  title: string;
  subtitle: string;
  accentColor: 'red' | 'blue' | 'amber';
  children: React.ReactNode;
}) {
  const headerCls: Record<string, string> = {
    red: 'bg-red-50   border-red-100   text-red-700',
    blue: 'bg-blue-50  border-blue-100  text-blue-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
  };
  const badgeCls: Record<string, string> = {
    red: 'bg-red-100   text-red-600',
    blue: 'bg-blue-100  text-blue-600',
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

export function MonoField({
  isEdit,
  value,
  onChange,
  placeholder,
}: {
  isEdit: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  if (!isEdit) {
    return value ? <span className={MONO}>{value}</span> : <span className={NONE}>—</span>;
  }

  return (
    <input
      className={INPUT}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode="numeric"
    />
  );
}

export function LogoPlaceholder({ name }: { name: string }) {
  const initials = (name || 'CO').replace(/\s+/g, '').slice(0, 2).toUpperCase();

  return (
    <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-red-50 to-rose-100 border-2 border-dashed border-red-200 flex flex-col items-center justify-center select-none">
      <span className="text-2xl font-bold text-red-400">{initials}</span>
      <span className="text-[9px] text-red-300 mt-0.5">暂无LOGO</span>
    </div>
  );
}

export function TabButton({
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

export function PreviewMetricCard({
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
