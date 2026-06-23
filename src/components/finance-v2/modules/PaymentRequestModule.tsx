import React, { useState } from 'react';
import { FinanceStatStrip } from '../components/FinanceStatStrip';
import { FinanceFilterBar } from '../components/FinanceFilterBar';
import { Button } from '../../ui/button';
import { paymentRequestRecords, workbenchStats } from '../data/financeV2MockData';

const strip = [workbenchStats[4], workbenchStats[1]];

export function PaymentRequestModule() {
  const [sel, setSel] = useState<string | null>(paymentRequestRecords[0]?.id ?? null);
  const row = paymentRequestRecords.find((p) => p.id === sel);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5 bg-slate-100/50">
      <div className="flex min-h-0 flex-1 gap-1.5 px-2 pb-2 pt-1.5">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <FinanceStatStrip items={strip} />
          <FinanceFilterBar placeholder="PR 号 / 供应商…" />
          <div className="min-h-0 flex-1 overflow-auto border border-slate-300 bg-white">
            <table className="w-full border-collapse text-left text-[12px] leading-[1.4]">
              <thead>
                <tr className="border-b border-slate-300 bg-slate-100">
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">PR 号</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">申请人</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">收款方</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">用途</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">金额</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">提交时间</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">审批</th>
                  <th className="px-2 py-2.5 font-semibold">执行</th>
                </tr>
              </thead>
              <tbody>
                {paymentRequestRecords.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSel(p.id)}
                    className={`cursor-pointer border-b border-slate-200 hover:bg-slate-50 ${
                      sel === p.id ? 'bg-slate-100' : ''
                    }`}
                  >
                    <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal">{p.prNo}</td>
                    <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{p.applicant}</td>
                    <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{p.payee}</td>
                    <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{p.purpose}</td>
                    <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal tabular-nums text-slate-800">
                      {p.amount.toLocaleString()} {p.currency}
                    </td>
                    <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal tabular-nums">{p.submitAt}</td>
                    <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{p.approveStatus}</td>
                    <td className="px-2 py-2.5 font-semibold text-slate-700">{p.execStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <aside className="hidden w-[280px] flex-shrink-0 border border-slate-300 bg-white md:flex md:flex-col">
          <div className="border-b border-slate-300 bg-slate-200 px-2 py-1.5 text-[12px] font-semibold leading-[1.4]">详情侧栏（占位）</div>
          <div className="flex-1 space-y-1.5 p-2 text-[12px] font-semibold leading-[1.4] text-slate-700">
            {row ? (
              <>
                <div>
                  <span className="text-slate-500">PR：</span>
                  <span className="font-mono font-normal">{row.prNo}</span>
                </div>
                <div>
                  <span className="text-slate-500">金额：</span>
                  <span className="font-mono font-normal tabular-nums">{row.amount.toLocaleString()} {row.currency}</span>
                </div>
                <div>
                  <span className="text-slate-500">审批：</span>
                  {row.approveStatus}
                </div>
                <div className="pt-2">
                  <Button size="sm" className="h-9 w-full text-[12px] font-semibold" variant="outline">
                    打开审批弹层（占位）
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-slate-500">请选择一行</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
