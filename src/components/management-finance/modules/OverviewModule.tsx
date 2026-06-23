import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  ChevronRight,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Progress } from '../../ui/progress';
import { MfModuleHeader } from '../components/MfModuleHeader';
import { MfStatStrip, type MfStatItem } from '../components/MfStatStrip';
import { formatMoney, formatPercent } from '../components/MfCurrency';
import { useManagementFinance } from '../context/ManagementFinanceContext';
import type { ManagementFinanceTabId } from '../types';

interface OverviewModuleProps {
  onNavigate: (tab: ManagementFinanceTabId) => void;
}

export function OverviewModule({ onNavigate }: OverviewModuleProps) {
  const {
    payslipRun,
    expenseClaims,
    assets,
    deptProfits,
    orderProfits,
    budgetLines,
    budgetAlerts,
    aiJobs,
    vouchers,
  } = useManagementFinance();

  const totalExpense = useMemo(
    () =>
      expenseClaims
        .filter((c) => c.status === 'approved' || c.status === 'paid')
        .reduce((sum, c) => sum + c.total_amount * (c.exchange_rate || 1), 0),
    [expenseClaims],
  );
  const assetNbv = useMemo(() => assets.reduce((s, a) => s + a.net_book_value, 0), [assets]);
  const monthlyDepr = useMemo(() => {
    return assets.reduce((s, a) => {
      const m = (a.acquisition_cost - a.salvage_value) / a.useful_life_months;
      return s + (a.status === 'in_use' ? m : 0);
    }, 0);
  }, [assets]);
  const totalRevenue = useMemo(
    () => deptProfits.reduce((s, p) => s + p.revenue, 0),
    [deptProfits],
  );
  const totalProfit = useMemo(
    () => deptProfits.reduce((s, p) => s + p.gross_profit, 0),
    [deptProfits],
  );
  const overallMargin = totalRevenue === 0 ? 0 : totalProfit / totalRevenue;

  const totalPlanned = budgetLines.reduce((s, l) => s + l.planned_amount, 0);
  const totalActual = budgetLines.reduce((s, l) => s + l.actual_amount, 0);
  const budgetUtilization = totalPlanned === 0 ? 0 : totalActual / totalPlanned;

  const draftVoucherCount = vouchers.filter((v) => v.status === 'draft').length;
  const aiSuccess = aiJobs.filter((j) => j.status === 'succeeded').length;
  const aiTotal = aiJobs.length;

  const stats: MfStatItem[] = [
    {
      id: 'payroll',
      label: '本月工资 (Gross)',
      value: formatMoney(payslipRun?.total_gross ?? 0, 'CNY', { compact: true, decimals: 0 }),
      sub: `净发 ${formatMoney(payslipRun?.total_net ?? 0, 'CNY', { compact: true, decimals: 0 })} · ${payslipRun?.employee_count ?? 0} 人`,
      tone: 'info',
    },
    {
      id: 'expense',
      label: '本月费用',
      value: formatMoney(totalExpense, 'CNY', { compact: true, decimals: 0 }),
      sub: `${expenseClaims.filter((c) => c.status === 'submitted').length} 待审批`,
      tone: 'default',
    },
    {
      id: 'asset',
      label: '固定资产净值',
      value: formatMoney(assetNbv, 'CNY', { compact: true, decimals: 0 }),
      sub: `本月折旧 ${formatMoney(monthlyDepr, 'CNY', { compact: true, decimals: 0 })}`,
      tone: 'default',
    },
    {
      id: 'revenue',
      label: '本月营收',
      value: formatMoney(totalRevenue, 'CNY', { compact: true, decimals: 0 }),
      sub: `毛利 ${formatMoney(totalProfit, 'CNY', { compact: true, decimals: 0 })}`,
      tone: 'ok',
    },
    {
      id: 'margin',
      label: '综合毛利率',
      value: formatPercent(overallMargin),
      sub: '基于成本中心 + 部门归集',
      tone: overallMargin >= 0.25 ? 'ok' : overallMargin >= 0.15 ? 'warn' : 'danger',
    },
    {
      id: 'budget',
      label: '预算执行率',
      value: formatPercent(budgetUtilization),
      sub: `计划 ${formatMoney(totalPlanned, 'CNY', { compact: true, decimals: 0 })} · 实际 ${formatMoney(totalActual, 'CNY', { compact: true, decimals: 0 })}`,
      tone: budgetUtilization > 1.05 ? 'danger' : budgetUtilization > 0.9 ? 'warn' : 'ok',
    },
  ];

  return (
    <div>
      <MfModuleHeader
        title="经营驾驶舱 · CEO / CFO 视角"
        subtitle="实时聚合 — 工资 + 费用 + 资产 + 利润 + 预算 + AI 异常。所有数字由凭证账面回算，不来自前端模拟。"
        badge={<Badge className="h-7 border-indigo-200 bg-indigo-50 px-2.5 text-[12px] text-indigo-700">AI Ready</Badge>}
        actions={
          <Button size="sm" className="h-8 gap-1.5 bg-indigo-600 text-[13px] hover:bg-indigo-500" onClick={() => onNavigate('ai_analytics')}>
            <Brain className="h-3 w-3" />
            进入 AI 经营分析
          </Button>
        }
      />

      <div className="space-y-4 p-3">
        <MfStatStrip items={stats} />

        {/* Departments + Orders side-by-side */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded border border-slate-200 bg-slate-50/40">
            <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
              <span className="text-[12px] font-semibold text-slate-800">部门利润分布 · TOP6</span>
              <button
                className="flex items-center gap-0.5 text-[13px] text-indigo-600 hover:underline"
                onClick={() => onNavigate('department_profit')}
              >
                查看全部 <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {[...deptProfits]
                .sort((a, b) => b.gross_profit - a.gross_profit)
                .slice(0, 6)
                .map((p) => {
                  const isPositive = p.gross_profit >= 0;
                  const pct = totalRevenue === 0 ? 0 : (p.revenue / totalRevenue) * 100;
                  return (
                    <div key={p.id} className="grid grid-cols-12 items-center gap-2 px-3 py-1.5">
                      <div className="col-span-3 truncate text-[13px] font-medium text-slate-800">
                        {p.scope_label}
                      </div>
                      <div className="col-span-3 text-right text-[13px] tabular-nums text-slate-600">
                        营收 {formatMoney(p.revenue, p.currency, { compact: true, decimals: 0 })}
                      </div>
                      <div className="col-span-3">
                        <Progress value={Math.min(pct, 100)} className="h-1.5" />
                      </div>
                      <div className={`col-span-3 text-right text-[13px] font-semibold tabular-nums ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isPositive ? <TrendingUp className="mr-0.5 inline h-3 w-3" /> : <TrendingDown className="mr-0.5 inline h-3 w-3" />}
                        {formatMoney(p.gross_profit, p.currency, { compact: true, decimals: 0 })}
                        <span className="ml-1 text-[12px] text-slate-400">
                          ({formatPercent(p.margin_pct ?? 0, 0)})
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="rounded border border-slate-200 bg-slate-50/40">
            <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
              <span className="text-[12px] font-semibold text-slate-800">订单真实利润 · TOP4</span>
              <button
                className="flex items-center gap-0.5 text-[13px] text-indigo-600 hover:underline"
                onClick={() => onNavigate('project_profit')}
              >
                查看全部 <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {orderProfits.map((o) => (
                <div key={o.id} className="px-3 py-1.5">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-semibold text-slate-800">{o.scope_ref_no}</span>
                    <span className={`font-semibold tabular-nums ${o.margin_pct! >= 0.2 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      毛利率 {formatPercent(o.margin_pct ?? 0)}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-[12px] text-slate-500">{o.scope_label}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-slate-500">
                    <span>采购 {formatMoney(o.cost_purchase, o.currency, { compact: true, decimals: 0 })}</span>
                    <span>·</span>
                    <span>海运 {formatMoney(o.cost_logistics, o.currency, { compact: true, decimals: 0 })}</span>
                    <span>·</span>
                    <span>税费 {formatMoney(o.cost_tax, o.currency, { compact: true, decimals: 0 })}</span>
                    <span>·</span>
                    <span>汇兑 {formatMoney(o.cost_fx, o.currency, { compact: true, decimals: 0 })}</span>
                    <span>·</span>
                    <span>折旧 {formatMoney(o.cost_depreciation, o.currency, { compact: true, decimals: 0 })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts & AI Suggestions side-by-side */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded border border-slate-200 bg-slate-50/40">
            <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
              <span className="flex items-center gap-1 text-[12px] font-semibold text-slate-800">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                预算预警 ({budgetAlerts.length})
              </span>
              <button
                className="flex items-center gap-0.5 text-[13px] text-indigo-600 hover:underline"
                onClick={() => onNavigate('budget')}
              >
                查看 <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {budgetAlerts.length === 0 ? (
                <div className="px-3 py-4 text-center text-[12px] text-slate-400">暂无预警</div>
              ) : (
                budgetAlerts.map((a) => {
                  const tone =
                    a.severity === 'danger' || a.severity === 'critical'
                      ? 'bg-rose-50 text-rose-700'
                      : a.severity === 'warn'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-50 text-slate-600';
                  return (
                    <div key={a.id} className="flex items-start gap-2 px-3 py-2">
                      <Badge className={`h-7 border-0 px-2.5 text-[12px] ${tone}`}>{a.severity.toUpperCase()}</Badge>
                      <p className="flex-1 text-[13px] leading-snug text-slate-700">{a.message}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded border border-slate-200 bg-slate-50/40">
            <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
              <span className="flex items-center gap-1 text-[12px] font-semibold text-slate-800">
                <Brain className="h-3.5 w-3.5 text-indigo-600" />
                AI 分析建议 · {aiSuccess}/{aiTotal}
              </span>
              <button
                className="flex items-center gap-0.5 text-[13px] text-indigo-600 hover:underline"
                onClick={() => onNavigate('ai_analytics')}
              >
                AI 中心 <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {aiJobs.slice(0, 4).map((j) => (
                <div key={j.id} className="flex items-start gap-2 px-3 py-2">
                  <Sparkles className="mt-0.5 h-3 w-3 flex-shrink-0 text-indigo-500" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[13px] font-medium text-slate-800">
                      <span>{aiJobTypeLabel(j.job_type)}</span>
                      <span
                        className={`text-[12px] font-semibold ${
                          j.status === 'succeeded'
                            ? 'text-emerald-600'
                            : j.status === 'running'
                              ? 'text-indigo-600'
                              : 'text-slate-500'
                        }`}
                      >
                        {j.status === 'succeeded' ? '已生成' : j.status === 'running' ? '运行中' : j.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12px] leading-snug text-slate-500">{j.result_summary ?? '—'}</p>
                  </div>
                </div>
              ))}
              <div className="px-3 py-2">
                <Button size="sm" className="h-8 w-full gap-1.5 bg-indigo-600 text-[13px] hover:bg-indigo-500" onClick={() => onNavigate('ai_analytics')}>
                  打开 AI 经营分析 <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Draft vouchers callout */}
        {draftVoucherCount > 0 ? (
          <div className="flex items-center justify-between gap-3 rounded border border-indigo-200 bg-indigo-50/50 px-3 py-2">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-indigo-800">
              <Sparkles className="h-3.5 w-3.5" />
              {draftVoucherCount} 张 AI/系统建议凭证待复核
            </div>
            <Button size="sm" className="h-8 gap-1.5 bg-indigo-600 text-[13px] hover:bg-indigo-500" onClick={() => onNavigate('voucher_center')}>
              进入自动凭证中心 <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function aiJobTypeLabel(type: string): string {
  switch (type) {
    case 'profit_analysis': return 'AI 真实利润分析';
    case 'expense_anomaly': return 'AI 费用异常检测';
    case 'cashflow_forecast': return 'AI 现金流预测';
    case 'budget_forecast': return 'AI 预算预测';
    case 'voucher_suggestion': return 'AI 凭证建议';
    case 'cost_attribution': return 'AI 成本归集';
    case 'board_briefing': return '董事会简报';
    default: return type;
  }
}
