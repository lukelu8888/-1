import React from 'react';
import { FinanceStatStrip } from '../components/FinanceStatStrip';
import { FinanceFilterBar } from '../components/FinanceFilterBar';
import { bankAccounts, bankTransactions, workbenchStats } from '../data/financeV2MockData';

const strip = [workbenchStats[5], workbenchStats[0], workbenchStats[1]];

export function BankCashModule() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5 bg-slate-100/50">
      <div className="px-2 pb-2 pt-1.5">
        <FinanceStatStrip items={strip} />
        <div className="mt-1.5 border border-slate-300 bg-white p-2">
          <div className="text-[12px] font-semibold leading-[1.4] text-slate-800">现金流预测摘要（占位）</div>
          <p className="mt-1 text-[12px] font-semibold leading-[1.4] text-slate-600">
            未来 7 日净现金流预估：<span className="font-mono font-normal tabular-nums text-slate-900">+USD 182,000</span>
            （基于未确认 PR 与应收回款假设，演示用）
          </p>
        </div>
        <div className="mt-1.5">
          <FinanceFilterBar placeholder="流水关键字…" />
        </div>
        <div className="mt-1.5 text-[12px] font-semibold leading-[1.4] text-slate-800">银行账户</div>
        <div className="mt-0.5 overflow-auto border border-slate-300 bg-white">
          <table className="w-full border-collapse text-left text-[12px] leading-[1.4]">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100">
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">银行</th>
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">账号</th>
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">币种</th>
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">账面余额</th>
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">可用</th>
                <th className="px-2 py-2.5 font-semibold">同步时间</th>
              </tr>
            </thead>
            <tbody>
              {bankAccounts.map((b) => (
                <tr key={b.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{b.bankName}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal">{b.accountMask}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{b.currency}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal tabular-nums text-slate-800">{b.balance.toLocaleString()}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal tabular-nums text-slate-800">{b.available.toLocaleString()}</td>
                  <td className="px-2 py-2.5 font-mono font-normal tabular-nums">{b.lastSync}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-1.5 text-[12px] font-semibold leading-[1.4] text-slate-800">银行流水</div>
        <div className="mt-0.5 overflow-auto border border-slate-300 bg-white">
          <table className="w-full border-collapse text-left text-[12px] leading-[1.4]">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100">
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">时间</th>
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">方向</th>
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">对手方</th>
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">摘要</th>
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">金额</th>
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">余额后</th>
                <th className="px-2 py-2.5 font-semibold">状态</th>
              </tr>
            </thead>
            <tbody>
              {bankTransactions.map((t) => (
                <tr key={t.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal tabular-nums">{t.txnDate}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{t.direction === 'in' ? '收入' : '支出'}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{t.counterparty}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{t.memo}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal tabular-nums text-slate-800">
                    {t.amount.toLocaleString()} {t.currency}
                  </td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal tabular-nums text-slate-800">{t.balanceAfter.toLocaleString()}</td>
                  <td className="px-2 py-2.5 font-semibold text-slate-700">{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
