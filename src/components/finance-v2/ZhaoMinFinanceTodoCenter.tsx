import React, { useMemo, useState } from 'react';
import { FinancePageHeader } from './components/FinancePageHeader';
import { FinanceFilterBar } from './components/FinanceFilterBar';
import { FinanceModuleTabs, financeModuleLabelToTabId } from './components/FinanceModuleTabs';
import { FinanceTaskList } from './components/FinanceTaskList';
import { FinanceEmptyState } from './components/FinanceEmptyState';
import { todoTasks } from './data/financeV2MockData';
import type { FinanceManagementTabId } from './types/financeV2';

/**
 * 待办中心：与「财务管理中心」一致的横向模块 Tab；每模块单一列表，避免重复表头分组。
 */
export default function ZhaoMinFinanceTodoCenter() {
  const [tab, setTab] = useState<FinanceManagementTabId>('collection');
  const [query, setQuery] = useState('');

  const filteredByQuery = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return todoTasks;
    return todoTasks.filter((t) =>
      [t.title, t.refNo ?? '', t.module, t.type].some((x) => x.toLowerCase().includes(q)),
    );
  }, [query]);

  const tabCounts = useMemo(() => {
    const acc: Partial<Record<FinanceManagementTabId, number>> = {};
    for (const t of filteredByQuery) {
      const id = financeModuleLabelToTabId(t.module);
      if (!id) continue;
      acc[id] = (acc[id] ?? 0) + 1;
    }
    return acc;
  }, [filteredByQuery]);

  const tasksForTab = useMemo(
    () => filteredByQuery.filter((t) => financeModuleLabelToTabId(t.module) === tab),
    [filteredByQuery, tab],
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-100">
      <FinancePageHeader
        title="财务待办中心（新）"
        subtitle="跨模块任务队列 · 先看优先级和截止时间，再进入对应业务模块处理（mock）"
        right={
          <span className="rounded border border-slate-400 bg-white px-2 py-0.5 text-[11px] font-semibold leading-[1.35] text-slate-600">
            MOCK DATA
          </span>
        }
      />
      <div className="border-b border-slate-300 bg-slate-100 px-2 py-1.5">
        <FinanceModuleTabs active={tab} onChange={setTab} counts={tabCounts} />
      </div>
      <div className="min-h-0 min-w-0 flex-1 space-y-2 overflow-auto p-2">
        <FinanceFilterBar
          placeholder="任务标题 / 单号 / 类型 / 模块…"
          value={query}
          onChange={setQuery}
          onReset={() => setQuery('')}
        />
        {tasksForTab.length === 0 ? (
          <FinanceEmptyState
            title="当前模块暂无待办"
            hint="可切换上方模块查看其它待办，或清空筛选关键字。"
          />
        ) : (
          <FinanceTaskList tasks={tasksForTab} hideModuleColumn />
        )}
      </div>
    </div>
  );
}
