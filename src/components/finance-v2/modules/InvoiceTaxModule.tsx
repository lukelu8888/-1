import React, { useMemo, useState } from 'react';
import { FinanceStatStrip } from '../components/FinanceStatStrip';
import { FinanceFilterBar } from '../components/FinanceFilterBar';
import { invoiceRecords } from '../data/financeV2MockData';
import type { WorkbenchStatItem } from '../types/financeV2';

type Sub = 'output' | 'input' | 'tax';

export function InvoiceTaxModule() {
  const [sub, setSub] = useState<Sub>('output');

  const rows = useMemo(() => {
    const kind = sub === 'output' ? 'output' : sub === 'input' ? 'input' : 'tax_doc';
    return invoiceRecords.filter((i) => i.kind === kind);
  }, [sub]);

  const strip: WorkbenchStatItem[] = [
    { id: 'i1', label: '销项待开', value: '1', sub: '笔', tone: 'warn' },
    { id: 'i2', label: '进项已认证', value: '1', sub: '笔', tone: 'ok' },
    { id: 'i3', label: '税务资料待补', value: '1', sub: '包', tone: 'default' },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5 bg-slate-100/50">
      <div className="px-2 pb-2 pt-1.5">
        <FinanceStatStrip items={strip} />
        <div className="mt-1.5 flex flex-wrap gap-0.5 border border-slate-300 bg-slate-200 p-0.5">
          {(
            [
              ['output', '销项发票'],
              ['input', '进项发票'],
              ['tax', '税务资料'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setSub(k)}
              className={`rounded-md px-3 py-1.5 text-[12px] font-semibold leading-[1.4] ${
                sub === k ? 'border border-slate-300 bg-white text-slate-900 shadow-sm' : 'border border-transparent text-slate-700 hover:border-slate-200 hover:bg-white/70'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-1.5">
          <FinanceFilterBar placeholder="发票号 / 往来单位…" />
        </div>
        <div className="mt-1.5 overflow-auto border border-slate-300 bg-white">
          <table className="w-full border-collapse text-left text-[12px] leading-[1.4]">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100">
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">票号/编号</th>
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">往来单位</th>
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">关联单</th>
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">金额</th>
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">税率</th>
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">日期</th>
                <th className="px-2 py-2.5 font-semibold">状态</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal">{r.invNo}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{r.counterparty}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal">{r.relatedOrder || '—'}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal tabular-nums text-slate-800">
                    {r.amount.toLocaleString()} {r.currency}
                  </td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{r.taxRate}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal tabular-nums">{r.issueDate}</td>
                  <td className="px-2 py-2.5 font-semibold text-slate-700">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
