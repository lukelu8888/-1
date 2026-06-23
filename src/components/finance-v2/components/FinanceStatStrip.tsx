import React from 'react';
import type { WorkbenchStatItem } from '../types/financeV2';

const toneClass: Record<NonNullable<WorkbenchStatItem['tone']>, string> = {
  default: 'border-slate-300 bg-slate-50',
  ok: 'border-emerald-300 bg-emerald-50/80',
  warn: 'border-amber-300 bg-amber-50/80',
  danger: 'border-red-300 bg-red-50/80',
};

export function FinanceStatStrip({ items }: { items: WorkbenchStatItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-1.5 border border-slate-300 bg-slate-100/80 p-1.5 md:grid-cols-3 xl:grid-cols-6">
      {items.map((s) => (
        <div
          key={s.id}
          className={`rounded border px-2 py-1.5 ${toneClass[s.tone || 'default']}`}
        >
          <div className="text-[13px] font-semibold leading-[1.35] text-slate-700">{s.label}</div>
          <div className="mt-1 text-[15px] font-semibold leading-[1.35] tabular-nums text-slate-900 sm:text-[16px]">{s.value}</div>
          {s.sub ? <div className="mt-0.5 text-[11px] leading-[1.35] tabular-nums text-slate-500">{s.sub}</div> : null}
        </div>
      ))}
    </div>
  );
}
