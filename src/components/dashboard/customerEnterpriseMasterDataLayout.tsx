import type React from 'react';

export function CustomerMasterSection({
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
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-6 py-3">
        {icon ? <span className="text-slate-400">{icon}</span> : null}
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold tracking-tight text-slate-700">{title}</span>
          {titleEN ? (
            <span className="text-[12px] font-medium uppercase tracking-wide text-slate-300">
              · {titleEN}
            </span>
          ) : null}
        </div>
      </div>
      <div className="px-6 py-4">{children}</div>
    </div>
  );
}

export function CustomerSingleRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-50 py-3 last:border-0">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      {children}
    </div>
  );
}

export function CustomerDualRow({
  leftLabel,
  rightLabel,
  leftNode,
  rightNode,
}: {
  leftLabel: string;
  rightLabel: string;
  leftNode: React.ReactNode;
  rightNode: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-50 py-3 last:border-0">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{leftLabel}</p>
          {leftNode}
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{rightLabel}</p>
          {rightNode}
        </div>
      </div>
    </div>
  );
}

export function CustomerValue({ value, mono = false }: { value?: string | null; mono?: boolean }) {
  if (!value) {
    return <span className="text-sm text-slate-300">—</span>;
  }
  return (
    <span className={`text-[14px] leading-7 text-slate-800 ${mono ? 'font-mono tracking-[0.02em]' : ''}`}>
      {value}
    </span>
  );
}
