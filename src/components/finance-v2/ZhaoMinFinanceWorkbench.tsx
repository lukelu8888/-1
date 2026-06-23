import React from 'react';
import { Button } from '../ui/button';
import { FinancePageHeader } from './components/FinancePageHeader';
import { FinanceStatStrip } from './components/FinanceStatStrip';
import { FinanceRiskPanel } from './components/FinanceRiskPanel';
import { FinanceTaskList } from './components/FinanceTaskList';
import { riskSummary, todoTasks, workbenchStats } from './data/financeV2MockData';
import {
  FINANCE_V2_MANAGEMENT_TAB_STORAGE_KEY,
  type FinanceManagementTabId,
} from './types/financeV2';

export type FinanceV2WorkbenchNavigate = (
  target: 'finance-v2-todo-center' | 'finance-v2-management-center',
  managementTab?: FinanceManagementTabId
) => void;

export default function ZhaoMinFinanceWorkbench({ onNavigateTo }: { onNavigateTo: FinanceV2WorkbenchNavigate }) {
  const top10 = todoTasks.slice(0, 10);
  const taskTypes = Array.from(new Set(top10.map((task) => task.type)));
  const [activeTaskType, setActiveTaskType] = React.useState(taskTypes[0] ?? '');
  const visibleTasks = activeTaskType ? top10.filter((task) => task.type === activeTaskType) : top10;

  const goCenter = (managementTab: FinanceManagementTabId) => {
    sessionStorage.setItem(FINANCE_V2_MANAGEMENT_TAB_STORAGE_KEY, managementTab);
    onNavigateTo('finance-v2-management-center');
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-100">
      <FinancePageHeader
        title="赵敏财务工作台（新）"
        subtitle="个人首页 · 今日重点 / 风险摘要 / Top 待办 / 业务中心快捷入口（mock）"
        right={
          <span className="rounded border border-slate-400 bg-white px-2 py-0.5 text-[11px] font-semibold leading-[1.35] text-slate-600">
            MOCK DATA
          </span>
        }
      />
      <div className="min-h-0 min-w-0 flex-1 space-y-1.5 overflow-auto p-2">
        <FinanceStatStrip items={workbenchStats} />
        {/* minmax(0,fr)+min-w-0：避免嵌套在 Admin 主内容 flex 里时右侧列被压成一条竖缝 */}
        <div className="grid min-w-0 gap-1.5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="min-w-0">
            <FinanceRiskPanel
              items={riskSummary}
              footnote="指标均为演示数据，用于验证布局与信息层级。"
            />
          </div>
          <div className="min-w-0">
            <div className="mb-1 text-[14px] font-semibold leading-[1.35] text-slate-800">今日待办 Top 10</div>
            <div className="border border-slate-300 bg-slate-100 p-1">
              <div className="flex flex-wrap gap-x-1.5 gap-y-1">
                {taskTypes.map((type) => {
                  const isActive = type === activeTaskType;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setActiveTaskType(type)}
                      className={`rounded-md border px-4 py-2 text-[13px] font-semibold leading-[1.35] transition-colors ${
                        isActive
                          ? 'border-slate-300 bg-white text-slate-900 shadow-sm'
                          : 'border-transparent bg-transparent text-slate-700 hover:border-slate-200 hover:bg-white/70'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>
            <FinanceTaskList tasks={visibleTasks} hideTypeColumn />
          </div>
        </div>
        <div className="border border-slate-300 bg-slate-50 p-2">
          <div className="text-[14px] font-semibold leading-[1.35] text-slate-800">快捷入口</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-lg border-slate-300 px-3 text-[13px] font-semibold leading-[1.35]"
              onClick={() => onNavigateTo('finance-v2-todo-center')}
            >
              财务待办中心
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-9 rounded-lg border-slate-300 px-3 text-[13px] font-semibold leading-[1.35]" onClick={() => goCenter('collection')}>
              收款与核销
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-9 rounded-lg border-slate-300 px-3 text-[13px] font-semibold leading-[1.35]" onClick={() => goCenter('receivables')}>
              应收账款
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-9 rounded-lg border-slate-300 px-3 text-[13px] font-semibold leading-[1.35]" onClick={() => goCenter('payment_request')}>
              付款申请
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-9 rounded-lg border-slate-300 px-3 text-[13px] font-semibold leading-[1.35]" onClick={() => goCenter('payables')}>
              应付账款
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-9 rounded-lg border-slate-300 px-3 text-[13px] font-semibold leading-[1.35]" onClick={() => goCenter('invoice')}>
              发票与税务
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-9 rounded-lg border-slate-300 px-3 text-[13px] font-semibold leading-[1.35]" onClick={() => goCenter('bank')}>
              资金与银行
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-9 rounded-lg border-slate-300 px-3 text-[13px] font-semibold leading-[1.35]" onClick={() => goCenter('risk')}>
              财务风控
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-9 rounded-lg border-slate-300 px-3 text-[13px] font-semibold leading-[1.35]" onClick={() => goCenter('reports')}>
              执行报表
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
