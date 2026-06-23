import React from 'react';
import { FinanceStatStrip } from '../components/FinanceStatStrip';
import { FinanceFilterBar } from '../components/FinanceFilterBar';
import { Button } from '../../ui/button';
import { releaseBlocks, riskEvents, riskSummary } from '../data/financeV2MockData';
import type { WorkbenchStatItem } from '../types/financeV2';

const strip: WorkbenchStatItem[] = riskSummary.map((r) => ({
  id: r.id,
  label: r.label,
  value: r.value,
  tone: r.level === 'risk' ? 'danger' : r.level === 'warn' ? 'warn' : 'default',
}));

export function RiskControlModule() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5 bg-slate-100/50">
      <div className="px-2 pb-2 pt-1.5">
        <FinanceStatStrip items={strip} />
        <div className="mt-1.5">
          <FinanceFilterBar placeholder="风险事件…" />
        </div>
        <div className="mt-1.5 text-[12px] font-semibold leading-[1.4] text-slate-800">风险事件</div>
        <div className="mt-0.5 overflow-auto border border-slate-300 bg-white">
          <table className="w-full border-collapse text-left text-[12px] leading-[1.4]">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100">
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">类别</th>
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">标题</th>
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">对象</th>
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">发现时间</th>
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">严重度</th>
                <th className="px-2 py-2.5 font-semibold">状态</th>
              </tr>
            </thead>
            <tbody>
              {riskEvents.map((e) => (
                <tr key={e.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{e.category}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-900">{e.title}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal">{e.entity}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal tabular-nums">{e.detectedAt}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{e.severity}</td>
                  <td className="px-2 py-2.5 font-semibold text-slate-700">{e.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-1.5 text-[12px] font-semibold leading-[1.4] text-slate-800">放单阻断列表</div>
        <div className="mt-0.5 overflow-auto border border-slate-300 bg-white">
          <table className="w-full border-collapse text-left text-[12px] leading-[1.4]">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100">
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">订单</th>
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">客户</th>
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">原因</th>
                <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">阻断时间</th>
                <th className="px-2 py-2.5 font-semibold">跟进人</th>
              </tr>
            </thead>
            <tbody>
              {releaseBlocks.map((b) => (
                <tr key={b.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal">{b.orderNo}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{b.customer}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{b.reason}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal tabular-nums">{b.blockedSince}</td>
                  <td className="px-2 py-2.5 font-semibold text-slate-700">{b.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-1.5 border border-slate-300 bg-slate-50 p-2">
          <div className="text-[12px] font-semibold leading-[1.4] text-slate-800">建议动作区</div>
          <ul className="mt-1 list-inside list-disc text-[12px] font-semibold leading-[1.5] text-slate-700">
            <li>优先处理 P0 收款认领与放单阻断关联订单</li>
            <li>对逾期应收启动催收工单并同步销售</li>
            <li>对差异来款与银行流水发起调账复核</li>
          </ul>
          <div className="mt-2 flex flex-wrap gap-1">
            <Button size="sm" className="h-9 text-[12px] font-semibold" variant="outline">
              生成风控日报（占位）
            </Button>
            <Button size="sm" className="h-9 text-[12px] font-semibold" variant="outline">
              指派处理人（占位）
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
