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
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-5 py-3">
        {icon ? <span className="text-slate-500">{icon}</span> : null}
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold tracking-tight text-slate-800">{title}</span>
          {titleEN ? (
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
              · {titleEN}
            </span>
          ) : null}
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
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
    <div className="border-b border-slate-200 py-3 last:border-0">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
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
    <div className="border-b border-slate-200 py-3 last:border-0">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{leftLabel}</p>
          {leftNode}
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{rightLabel}</p>
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
