import React from 'react';
import type { RiskSummaryItem } from '../types/financeV2';

const lvl: Record<RiskSummaryItem['level'], string> = {
  info: 'border-slate-300 bg-white text-slate-800',
  warn: 'border-amber-400 bg-amber-50 text-amber-950',
  risk: 'border-red-400 bg-red-50 text-red-950',
};

export function FinanceRiskPanel({
  items,
  footnote,
}: {
  items: RiskSummaryItem[];
  footnote?: string;
}) {
  return (
    <div className="border border-slate-300 bg-slate-50">
      <div className="border-b border-slate-300 bg-slate-200 px-2 py-2 text-[14px] font-semibold leading-[1.35] text-slate-800">
        风险摘要
      </div>
      <div className="grid gap-1 p-1.5 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((r) => (
          <div key={r.id} className={`rounded border px-2 py-1.5 ${lvl[r.level]}`}>
            <div className="text-[13px] font-semibold leading-[1.35] text-slate-700">{r.label}</div>
            <div className="mt-1 text-[15px] font-semibold leading-[1.35] tabular-nums sm:text-[16px]">{r.value}</div>
          </div>
        ))}
      </div>
      {footnote ? <p className="border-t border-slate-200 px-2 py-1 text-[11px] leading-[1.35] text-slate-500">{footnote}</p> : null}
    </div>
  );
}
