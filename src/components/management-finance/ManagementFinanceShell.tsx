import React from 'react';
import {
  Banknote,
  BarChart3,
  Brain,
  ClipboardList,
  Database,
  Download,
  Factory,
  FileText,
  Gauge,
  HardDrive,
  RefreshCw,
  Shield,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { ManagementFinanceTabId } from './types';
import { useManagementFinance } from './context/ManagementFinanceContext';
import { OverviewModule } from './modules/OverviewModule';
import { ExpenseManagementModule } from './modules/ExpenseManagementModule';
import { PayrollModule } from './modules/PayrollModule';
import { SocialInsuranceModule } from './modules/SocialInsuranceModule';
import { FixedAssetsModule } from './modules/FixedAssetsModule';
import { CostCenterModule } from './modules/CostCenterModule';
import { BudgetModule } from './modules/BudgetModule';
import { DepartmentProfitModule } from './modules/DepartmentProfitModule';
import { ProjectProfitModule } from './modules/ProjectProfitModule';
import { AiAnalyticsModule } from './modules/AiAnalyticsModule';
import { VoucherCenterModule } from './modules/VoucherCenterModule';
import { AuditLogModule } from './modules/AuditLogModule';
import { ManagementFinanceFiltersBar } from './ManagementFinanceFiltersBar';

type Group = '驾驶舱' | '业务费用' | '人力成本' | '资产与预算' | '利润分析' | '凭证 / 审计';

interface MfTabDef {
  id: ManagementFinanceTabId;
  label: string;
  group: Group;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const TABS: MfTabDef[] = [
  { id: 'overview',          label: '经营驾驶舱',    group: '驾驶舱',     icon: Gauge,        badge: 'AI' },
  { id: 'expense',           label: '费用管理中心',  group: '业务费用',   icon: ClipboardList },
  { id: 'payroll',           label: '工资与人力成本', group: '人力成本',   icon: Wallet },
  { id: 'social_insurance',  label: '社保公积金',    group: '人力成本',   icon: Shield },
  { id: 'fixed_assets',      label: '固定资产管理',  group: '资产与预算', icon: HardDrive },
  { id: 'cost_center',       label: '成本中心',      group: '资产与预算', icon: Factory },
  { id: 'budget',            label: '预算管理',      group: '资产与预算', icon: BarChart3 },
  { id: 'department_profit', label: '部门利润分析',  group: '利润分析',   icon: Users },
  { id: 'project_profit',    label: '项目/订单利润', group: '利润分析',   icon: FileText },
  { id: 'ai_analytics',      label: 'AI 经营分析',   group: '利润分析',   icon: Brain,        badge: 'AI' },
  { id: 'voucher_center',    label: '自动凭证中心',  group: '凭证 / 审计', icon: Banknote,    badge: 'Auto' },
  { id: 'audit_log',         label: '审计日志',      group: '凭证 / 审计', icon: Database },
];

const GROUP_COLORS: Record<Group, string> = {
  '驾驶舱':       'text-indigo-700',
  '业务费用':     'text-emerald-700',
  '人力成本':     'text-blue-700',
  '资产与预算':   'text-amber-700',
  '利润分析':     'text-purple-700',
  '凭证 / 审计':  'text-rose-700',
};

interface ManagementFinanceShellProps {
  activeTab: ManagementFinanceTabId;
  setActiveTab: (tab: ManagementFinanceTabId) => void;
}

export function ManagementFinanceShell({ activeTab, setActiveTab }: ManagementFinanceShellProps) {
  const { tenant, dataSource, refreshAll, loading } = useManagementFinance();

  return (
    <div className="space-y-3 text-slate-900">
      {/* ── Title bar ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-2 text-[17px] font-semibold leading-tight tracking-tight">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            内部管理财务中心
            <span className="ml-1 rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[12px] font-bold tracking-wider text-indigo-700">
              MANAGEMENT FINANCE
            </span>
            <Badge className="ml-1 h-7 border-indigo-200 bg-white px-2.5 text-[12px] font-medium text-indigo-700">
              业财一体化 + AI 分析
            </Badge>
          </h1>
          <p className="mt-1 text-[12px] leading-snug text-slate-600">
            {tenant?.name ?? '—'} · 多公司 / 多币种 / 多租户 · 自动凭证 · 实时利润 · AI 经营驾驶舱
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
          <Button variant="outline" size="sm" className="h-8 gap-1 border-slate-200 text-[13px]">
            <Download className="h-3.5 w-3.5" />
            导出报表
          </Button>
        </div>
      </div>

      <ManagementFinanceFiltersBar />

      {/* ── Module tab strip ──────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded border border-slate-200 bg-slate-50">
        <div className="flex items-stretch">
          {(['驾驶舱', '业务费用', '人力成本', '资产与预算', '利润分析', '凭证 / 审计'] as Group[]).map(
            (group, gi) => (
              <React.Fragment key={group}>
                {gi > 0 ? <div className="w-px self-stretch bg-slate-200" /> : null}
                <div className="flex flex-shrink-0 items-center">
                  <span
                    className={`flex h-full items-center whitespace-nowrap border-r border-slate-200 px-3 py-2 text-[12px] font-bold ${GROUP_COLORS[group]}`}
                  >
                    {group}
                  </span>
                  <div className="flex items-center gap-0.5 px-1 py-1.5">
                    {TABS.filter((t) => t.group === group).map((t) => {
                      const Icon = t.icon;
                      const isActive = activeTab === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setActiveTab(t.id)}
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded border px-3 py-2 text-[13px] font-semibold transition-colors ${
                            isActive
                              ? 'border-slate-300 bg-white text-slate-900 shadow-sm'
                              : 'border-transparent bg-transparent text-slate-600 hover:border-slate-200 hover:bg-white/70'
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {t.label}
                          {t.badge ? (
                            <span className="ml-0.5 rounded bg-indigo-100 px-1.5 py-0.5 text-[12px] font-bold text-indigo-700">
                              {t.badge}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </React.Fragment>
            ),
          )}
        </div>
      </div>

      {/* ── Active module ─────────────────────────────────────────────── */}
      <div className="rounded border border-slate-200 bg-white">
        {activeTab === 'overview' && <OverviewModule onNavigate={setActiveTab} />}
        {activeTab === 'expense' && <ExpenseManagementModule />}
        {activeTab === 'payroll' && <PayrollModule />}
        {activeTab === 'social_insurance' && <SocialInsuranceModule />}
        {activeTab === 'fixed_assets' && <FixedAssetsModule />}
        {activeTab === 'cost_center' && <CostCenterModule />}
        {activeTab === 'budget' && <BudgetModule />}
        {activeTab === 'department_profit' && <DepartmentProfitModule />}
        {activeTab === 'project_profit' && <ProjectProfitModule />}
        {activeTab === 'ai_analytics' && <AiAnalyticsModule />}
        {activeTab === 'voucher_center' && <VoucherCenterModule />}
        {activeTab === 'audit_log' && <AuditLogModule />}
      </div>
    </div>
  );
}
