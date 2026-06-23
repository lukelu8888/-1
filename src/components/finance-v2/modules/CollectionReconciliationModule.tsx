import React, { useMemo, useState } from 'react';
import { FinanceStatStrip } from '../components/FinanceStatStrip';
import { FinanceFilterBar } from '../components/FinanceFilterBar';
import { collectionRecords, workbenchStats } from '../data/financeV2MockData';

const strip = workbenchStats.slice(0, 4);

export function CollectionReconciliationModule() {
  const [search, setSearch] = useState('');

  const filteredRecords = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return collectionRecords;
    return collectionRecords.filter((record) =>
      [
        record.skNo,
        record.ysNo,
        record.orderNo,
        record.customer,
        record.currency,
        record.recvDate,
        record.method,
        record.matchStatus,
        record.writeoffStatus,
      ]
        .join(' ')
        .toLowerCase()
        .includes(keyword),
    );
  }, [search]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5 bg-slate-100/50">
      <div className="px-2 pb-2 pt-1.5">
        <FinanceStatStrip items={strip} />
        <div className="mt-1.5">
          <FinanceFilterBar
            placeholder="收款号 / 客户 / 订单…"
            value={search}
            onChange={setSearch}
            onReset={() => setSearch('')}
          />
        </div>
        <div className="mt-1.5 overflow-auto border border-slate-300 bg-white">
          <table className="w-full border-collapse text-left text-[12px] leading-[1.4]">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100">
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">收款号</th>
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">应收号</th>
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">订单</th>
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">客户</th>
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">金额</th>
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">收款日</th>
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">方式</th>
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">匹配</th>
                <th className="px-2 py-2.5 font-semibold">核销</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((r) => (
                <tr key={r.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal">{r.skNo}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal">{r.ysNo}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal">{r.orderNo}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{r.customer}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal tabular-nums text-slate-800">
                    {r.amount.toLocaleString()} {r.currency}
                  </td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal tabular-nums">{r.recvDate}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{r.method}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{r.matchStatus}</td>
                  <td className="px-2 py-2.5 font-semibold text-slate-700">{r.writeoffStatus}</td>
                </tr>
              ))}
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-2 py-8 text-center text-[12px] text-slate-500">
                    未找到匹配的收款与核销记录
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
