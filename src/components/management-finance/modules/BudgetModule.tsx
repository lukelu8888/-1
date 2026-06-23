import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Brain,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';
import { Progress } from '../../ui/progress';
import { MfModuleHeader } from '../components/MfModuleHeader';
import { MfStatStrip } from '../components/MfStatStrip';
import { formatMoney, formatPercent } from '../components/MfCurrency';
import { useManagementFinance } from '../context/ManagementFinanceContext';

export function BudgetModule() {
  const { budgets, budgetLines, budgetAlerts, enqueueAiJob } = useManagementFinance();
  const budget = budgets[0];

  const totals = useMemo(() => {
    const planned = budgetLines.reduce((s, l) => s + l.planned_amount, 0);
    const actual = budgetLines.reduce((s, l) => s + l.actual_amount, 0);
    const variance = actual - planned;
    const overBudget = budgetLines.filter((l) => (l.variance_pct ?? 0) > 0).length;
    return { planned, actual, variance, overBudget };
  }, [budgetLines]);

  const onAiForecast = async () => {
    await enqueueAiJob('budget_forecast', { budget_id: budget?.id, fiscal_year: budget?.fiscal_year });
  };

  if (!budget) {
    return (
      <div className="p-8 text-center text-[12px] text-slate-400">
        尚未创建预算。请先在 mf_budgets 表创建当期预算。
      </div>
    );
  }

  return (
    <div>
      <MfModuleHeader
        title={`预算管理 · ${budget.fiscal_year}`}
        subtitle={`${budget.scope_label ?? ''} · 颗粒度 ${granularityLabel(budget.granularity)} · 状态 ${statusLabel(budget.status)}`}
        badge={<Badge className="h-7 border-amber-200 bg-amber-50 px-2.5 text-[12px] text-amber-700">超预算预警已启用</Badge>}
        actions={
          <>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 border-slate-200 text-[13px]">
              <FileText className="h-3 w-3" /> 导出
            </Button>
            <Button size="sm" className="h-8 gap-1.5 bg-indigo-600 text-[13px] hover:bg-indigo-500" onClick={onAiForecast}>
              <Brain className="h-3 w-3" /> AI 预算预测
            </Button>
          </>
        }
      />

      <div className="space-y-3 p-3">
        <MfStatStrip
          items={[
            { id: 'planned', label: '本期计划',    value: formatMoney(totals.planned, budget.currency, { compact: true, decimals: 0 }), sub: `${budgetLines.length} 个子项` },
            { id: 'actual',  label: '本期实际',    value: formatMoney(totals.actual,  budget.currency, { compact: true, decimals: 0 }), sub: '凭证账面回算' },
            { id: 'variance',label: '差异',        value: formatMoney(totals.variance, budget.currency, { compact: true, decimals: 0 }), sub: totals.variance >= 0 ? '超支' : '节余', tone: totals.variance > 0 ? 'danger' : 'ok' },
            { id: 'usage',   label: '执行率',      value: formatPercent(totals.actual / Math.max(totals.planned, 1)), sub: '实际/计划', tone: totals.actual / totals.planned > 1.05 ? 'danger' : 'default' },
            { id: 'over',    label: '超预算项',    value: `${totals.overBudget}`, sub: '需复核', tone: totals.overBudget > 0 ? 'warn' : 'ok' },
            { id: 'alerts',  label: '未解决预警',  value: `${budgetAlerts.length}`, sub: '含 AI 提示', tone: budgetAlerts.length > 0 ? 'warn' : 'default' },
          ]}
        />

        <div className="overflow-x-auto rounded border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="h-10 text-[12px] font-semibold text-slate-800">预算项</TableHead>
                <TableHead className="h-10 text-[12px] font-semibold text-slate-800">期间</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">计划</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">实际</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">差异</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">差异率</TableHead>
                <TableHead className="h-10 text-[12px] font-semibold text-slate-800">执行进度</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgetLines.map((l) => {
                const pct = (l.variance_pct ?? 0) * 100;
                const usage = (l.actual_amount / Math.max(l.planned_amount, 1)) * 100;
                const isOver = pct > 0;
                return (
                  <TableRow key={l.id} className="hover:bg-slate-50">
                    <TableCell className="py-2.5 text-[13px] font-medium text-slate-800">{l.category}</TableCell>
                    <TableCell className="py-2.5 text-[13px] text-slate-500">{l.period_year}-{l.period_month}</TableCell>
                    <TableCell className="py-2.5 text-right text-[13px] tabular-nums">{l.planned_amount.toLocaleString()}</TableCell>
                    <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-slate-700">{l.actual_amount.toLocaleString()}</TableCell>
                    <TableCell className={`py-2.5 text-right text-[13px] tabular-nums ${isOver ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {isOver ? <ArrowUp className="mr-0.5 inline h-3 w-3" /> : <ArrowDown className="mr-0.5 inline h-3 w-3" />}
                      {Math.abs(l.variance_amount).toLocaleString()}
                    </TableCell>
                    <TableCell className={`py-2.5 text-right text-[13px] font-semibold tabular-nums ${Math.abs(pct) > 10 ? (isOver ? 'text-rose-700' : 'text-emerald-700') : 'text-slate-600'}`}>
                      {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                    </TableCell>
                    <TableCell className="py-2">
                      <Progress value={Math.min(usage, 100)} className="h-1.5" />
                      <div className="mt-0.5 text-[12px] text-slate-500">{usage.toFixed(0)}%</div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="rounded border border-amber-200 bg-amber-50/50">
          <div className="flex items-center justify-between border-b border-amber-200 px-3 py-2">
            <span className="flex items-center gap-1.5 text-[12px] font-semibold text-amber-900">
              <AlertTriangle className="h-3.5 w-3.5" />
              预算预警 ({budgetAlerts.length})
            </span>
            <Button variant="ghost" size="sm" className="h-8 gap-0.5 px-3 text-[13px] text-amber-800">
              <CheckCircle2 className="h-3 w-3" /> 全部标记已读
            </Button>
          </div>
          <div className="divide-y divide-amber-100">
            {budgetAlerts.length === 0 ? (
              <div className="px-3 py-3 text-center text-[12px] text-slate-500">暂无预警</div>
            ) : (
              budgetAlerts.map((a) => (
                <div key={a.id} className="flex items-start gap-2 px-3 py-2 text-[13px]">
                  <Badge className={`h-7 border-0 px-2.5 text-[12px] ${a.severity === 'danger' ? 'bg-rose-100 text-rose-700' : a.severity === 'warn' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                    {a.severity.toUpperCase()}
                  </Badge>
                  <p className="flex-1 leading-snug text-slate-800">{a.message}</p>
                  <span className="text-[12px] text-slate-400">{new Date(a.triggered_at).toLocaleDateString('zh-CN')}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function granularityLabel(g: string): string {
  return { annual: '年度', quarterly: '季度', monthly: '月度' }[g] ?? g;
}
function statusLabel(s: string): string {
  return { draft: '草稿', submitted: '已提交', approved: '已审批', locked: '已锁定', closed: '已关闭' }[s] ?? s;
}
