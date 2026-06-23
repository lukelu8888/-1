import React from 'react';
import { Button } from '../../ui/button';
import type { TodoTaskRecord } from '../types/financeV2';

const statusLabel: Record<string, string> = {
  open: '待处理',
  in_progress: '处理中',
  blocked: '阻塞',
  done: '完成',
};

const priClass: Record<string, string> = {
  P0: 'bg-red-100 text-red-800 border-red-300',
  P1: 'bg-amber-100 text-amber-900 border-amber-300',
  P2: 'bg-slate-100 text-slate-700 border-slate-300',
  P3: 'bg-slate-50 text-slate-600 border-slate-200',
};

export function FinanceTaskList({
  tasks,
  /** 已按业务模块 Tab 过滤时隐藏「来源模块」列，避免与顶栏重复 */
  hideModuleColumn = false,
  /** 已通过外部横向 Tab 过滤时隐藏「类型」列，避免重复展示 */
  hideTypeColumn = false,
}: {
  tasks: TodoTaskRecord[];
  hideModuleColumn?: boolean;
  hideTypeColumn?: boolean;
}) {
  const minW = hideModuleColumn && hideTypeColumn ? 'min-w-[560px]' : hideModuleColumn || hideTypeColumn ? 'min-w-[640px]' : 'min-w-[720px]';

  return (
    <div className="min-w-0 overflow-x-auto border border-slate-300 bg-white">
      <table className={`w-full ${minW} table-fixed border-collapse text-left text-[12px] leading-[1.4]`}>
        <thead>
          <tr className="border-b border-slate-300 bg-slate-100">
            {!hideTypeColumn ? (
              <th
                className={`border-r border-slate-200 px-2 py-2.5 font-semibold text-slate-800 ${hideModuleColumn ? 'w-[12%]' : 'w-[10%]'}`}
              >
                类型
              </th>
            ) : null}
            <th
              className={`border-r border-slate-200 px-2 py-2.5 font-semibold text-slate-800 ${
                hideTypeColumn ? (hideModuleColumn ? 'w-[34%]' : 'w-[28%]') : hideModuleColumn ? 'w-[30%]' : 'w-[24%]'
              }`}
            >
              事项
            </th>
            {!hideModuleColumn ? (
              <th className="w-[12%] border-r border-slate-200 px-2 py-2.5 font-semibold text-slate-800">来源模块</th>
            ) : null}
            <th className="w-[9%] border-r border-slate-200 px-2 py-2.5 font-semibold text-slate-800">优先级</th>
            <th className="w-[10%] border-r border-slate-200 px-2 py-2.5 font-semibold text-slate-800">状态</th>
            <th className="w-[14%] border-r border-slate-200 px-2 py-2.5 font-semibold text-slate-800">截止</th>
            <th className="w-[13%] border-r border-slate-200 px-2 py-2.5 font-semibold text-slate-800">单号/金额</th>
            <th className="w-20 min-w-[5rem] px-2 py-2.5 font-semibold text-slate-800">操作</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id} className="border-b border-slate-200 hover:bg-slate-50/80">
              {!hideTypeColumn ? (
                <td className="border-r border-slate-100 px-2 py-2.5 align-top font-semibold text-slate-700">{t.type}</td>
              ) : null}
              <td className="border-r border-slate-100 px-2 py-2.5 align-top font-semibold break-words text-slate-900">
                {t.title}
              </td>
              {!hideModuleColumn ? (
                <td className="border-r border-slate-100 px-2 py-2.5 align-top break-words font-semibold text-slate-600">{t.module}</td>
              ) : null}
              <td className="border-r border-slate-100 px-2 py-2.5 align-top">
                <span className={`inline-block rounded border px-2 py-0.5 text-[11px] font-semibold leading-[1.25] ${priClass[t.priority]}`}>
                  {t.priority}
                </span>
              </td>
              <td className="border-r border-slate-100 px-2 py-2.5 align-top font-semibold text-slate-700">{statusLabel[t.status] || t.status}</td>
              <td className="whitespace-nowrap border-r border-slate-100 px-2 py-2.5 align-top font-mono font-normal text-slate-700">
                {t.dueAt}
              </td>
              <td className="border-r border-slate-100 px-2 py-2.5 align-top font-mono font-normal break-all text-slate-800">
                {t.refNo}
                {t.amount ? <span className="ml-1 text-slate-600">{t.amount}</span> : null}
              </td>
              <td className="px-2 py-2.5 align-top">
                <Button variant="outline" size="sm" className="h-8 shrink-0 rounded-lg border-slate-300 px-3 text-[12px] font-semibold">
                  处理
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
