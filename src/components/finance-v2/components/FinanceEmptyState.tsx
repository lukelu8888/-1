import React from 'react';

export function FinanceEmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-slate-300 bg-slate-50 py-10 text-center">
      <p className="text-[13px] font-semibold leading-[1.35] text-slate-700">{title}</p>
      {hint ? <p className="mt-1 max-w-md text-[11px] font-semibold leading-[1.35] text-slate-500">{hint}</p> : null}
    </div>
  );
}
