import React from 'react';
import { Badge } from '../../ui/badge';

function formatMoney(amount: number, currency: string) {
  return `${currency} ${Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString('zh-CN');
}

interface ReceivableDetailStageSummaryProps {
  row: {
    remainingAmount: number;
    receivedAmount: number;
    currency: string;
    balanceDueDate?: string;
    currentStageDueDate?: string;
    dueDate?: string;
    nextAction: string;
    depositStageLabel: string;
    balanceStageLabel: string;
  };
}

export function ReceivableDetailStageSummary({ row }: ReceivableDetailStageSummaryProps) {
  return (
    <>
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-2.5">
          <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400">应收余额</div>
          <div className="mt-1 font-mono text-[14px] font-semibold tabular-nums text-amber-900">
            {formatMoney(row.remainingAmount, row.currency)}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-2.5">
          <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400">已确认回款</div>
          <div className="mt-1 font-mono text-[14px] font-semibold tabular-nums text-emerald-700">
            {formatMoney(row.receivedAmount, row.currency)}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-2.5">
          <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400">下一笔应收到期日</div>
          <div className="mt-1 font-mono text-[14px] font-semibold tabular-nums text-slate-900">
            {row.remainingAmount <= 0 ? '已结清' : formatDate(row.balanceDueDate || row.currentStageDueDate || row.dueDate)}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-2.5">
          <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400">当前待办</div>
          <div className="mt-1 text-[12px] font-semibold text-slate-900">{row.nextAction}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge className="border border-emerald-300 bg-emerald-50 text-emerald-700">
          定金：{row.depositStageLabel}
        </Badge>
        <Badge className="border border-sky-300 bg-sky-50 text-sky-700">
          余款：{row.balanceStageLabel}
        </Badge>
      </div>
    </>
  );
}
