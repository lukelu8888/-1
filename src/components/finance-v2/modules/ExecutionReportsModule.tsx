import React from 'react';
import { FinanceFilterBar } from '../components/FinanceFilterBar';
import { Button } from '../../ui/button';
import { reportCatalog } from '../data/financeV2MockData';

export function ExecutionReportsModule() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5 bg-slate-100/50">
      <div className="px-2 pb-2 pt-1.5">
        <FinanceFilterBar placeholder="报表名称…" />
        <div className="mt-1.5 overflow-auto border border-slate-300 bg-white">
          <table className="w-full border-collapse text-left text-[12px] leading-[1.4]">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100">
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">报表名称</th>
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">说明</th>
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">最近更新</th>
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">格式</th>
                <th className="px-2 py-2.5 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {reportCatalog.map((r) => (
                <tr key={r.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-900">{r.name}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{r.description}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal tabular-nums">{r.lastUpdated}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{r.format}</td>
                  <td className="px-2 py-2.5">
                    <Button variant="outline" size="sm" className="h-8 border-slate-300 px-3 text-[12px] font-semibold">
                      导出
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
