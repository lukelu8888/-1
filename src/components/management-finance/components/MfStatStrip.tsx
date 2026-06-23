import React from 'react';

export interface MfStatItem {
  id: string;
  label: string;
  value: string;
  sub?: string;
  tone?: 'default' | 'ok' | 'warn' | 'danger' | 'info';
}

const TONE: Record<NonNullable<MfStatItem['tone']>, string> = {
  default: 'border-slate-200 bg-white text-slate-900',
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warn: 'border-amber-200 bg-amber-50 text-amber-900',
  danger: 'border-rose-200 bg-rose-50 text-rose-900',
  info: 'border-indigo-200 bg-indigo-50 text-indigo-900',
};

/**
 * KPI strip: 可读性优先（标注 ≥12px，主数值略放大），仍保持并排密度。
 */
export function MfStatStrip({ items }: { items: MfStatItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3 xl:grid-cols-6">
      {items.map((s) => (
        <div
          key={s.id}
          className={`rounded border px-3 py-2.5 ${TONE[s.tone || 'default']}`}
        >
          <div className="text-[12px] font-semibold leading-tight text-slate-600">{s.label}</div>
          <div className="mt-1.5 text-[16px] font-bold leading-none tabular-nums">{s.value}</div>
          {s.sub ? (
            <div className="mt-1 text-[12px] leading-snug tabular-nums text-slate-600">{s.sub}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
