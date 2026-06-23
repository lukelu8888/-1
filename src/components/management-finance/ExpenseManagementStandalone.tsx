import React from 'react';
import { ClipboardList, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ManagementFinanceProvider } from './context/ManagementFinanceContext';
import { useManagementFinance } from './context/ManagementFinanceContext';
import { ManagementFinanceFiltersBar } from './ManagementFinanceFiltersBar';
import { ExpenseManagementModule } from './modules/ExpenseManagementModule';

function ExpenseManagementStandaloneInner() {
  const { tenant, dataSource, refreshAll, loading } = useManagementFinance();

  return (
    <div className="space-y-3 px-4 py-3 text-slate-900">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-2 text-[17px] font-semibold leading-tight tracking-tight">
            <ClipboardList className="h-4 w-4 shrink-0 text-emerald-600" />
            费用管理中心
            <Badge className="h-7 border-emerald-200 bg-emerald-50 px-2.5 text-[12px] font-medium text-emerald-800">
              独立模块
            </Badge>
          </h1>
          <p className="mt-1 text-[12px] leading-snug text-slate-600">
            {tenant?.name ?? '—'} · 差旅、办公、招待等报销审批与付款闭环；与「内部管理财务中心」数据同源
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {dataSource === 'fallback' ? (
            <Badge className="h-7 border-amber-200 bg-amber-50 px-2.5 text-[12px] font-medium text-amber-800">
              FALLBACK SEED · 待执行 20260514_management_finance_center.sql
            </Badge>
          ) : dataSource === 'supabase' ? (
            <Badge className="h-7 border-emerald-200 bg-emerald-50 px-2.5 text-[12px] font-medium text-emerald-800">
              SUPABASE LIVE
            </Badge>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 border-slate-200 text-[13px]"
            onClick={() => refreshAll()}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            刷新数据
          </Button>
        </div>
      </div>

      <ManagementFinanceFiltersBar />

      <div className="rounded border border-slate-200 bg-white">
        <ExpenseManagementModule />
      </div>
    </div>
  );
}

/** 左侧栏独立入口：费用管理中心（与业财中心子页内容一致，单独挂菜单） */
export default function ExpenseManagementStandalone() {
  return (
    <ManagementFinanceProvider>
      <ExpenseManagementStandaloneInner />
    </ManagementFinanceProvider>
  );
}
