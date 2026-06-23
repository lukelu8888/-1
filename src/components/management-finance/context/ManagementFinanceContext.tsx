import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as svc from '../../../lib/services/managementFinanceService';
import type {
  MfAccount,
  MfAiJob,
  MfAsset,
  MfAuditLog,
  MfBudget,
  MfBudgetAlert,
  MfBudgetLine,
  MfCompany,
  MfCostCenter,
  MfDepartment,
  MfDepreciationRow,
  MfEmployee,
  MfExpenseClaim,
  MfPayslip,
  MfPayslipLine,
  MfPayslipRun,
  MfProfitSnapshot,
  MfSiRecord,
  MfSiSchemeVersion,
  MfTenant,
  MfVoucherWithLines,
} from '../types';

/**
 * Top-level state for Management Finance Center.
 *
 * Every sub-module subscribes to the slice it needs. The provider runs an
 * eager initial fetch (a single round-trip per slice) and exposes a typed
 * `refresh()` method so that mutating actions can re-pull the affected slice.
 *
 * Multi-company / multi-currency support is encoded via `companyId` and
 * `currency`. Future "switch company" UI should set these on the provider.
 */

interface ManagementFinanceContextValue {
  // Identity
  tenant: MfTenant | null;
  companies: MfCompany[];
  companyId: string | null;
  setCompanyId: (id: string) => void;
  // Reference data
  accounts: MfAccount[];
  costCenters: MfCostCenter[];
  departments: MfDepartment[];
  employees: MfEmployee[];
  // Module data
  expenseClaims: MfExpenseClaim[];
  payslipRun: MfPayslipRun | null;
  payslips: MfPayslip[];
  payslipLines: MfPayslipLine[];
  siSchemeVersions: MfSiSchemeVersion[];
  siRecords: MfSiRecord[];
  assets: MfAsset[];
  depreciation: MfDepreciationRow[];
  budgets: MfBudget[];
  budgetLines: MfBudgetLine[];
  budgetAlerts: MfBudgetAlert[];
  deptProfits: MfProfitSnapshot[];
  orderProfits: MfProfitSnapshot[];
  vouchers: MfVoucherWithLines[];
  aiJobs: MfAiJob[];
  auditLogs: MfAuditLog[];
  // Period selection
  period: { year: number; month: number };
  setPeriod: (p: { year: number; month: number }) => void;
  // Status
  loading: boolean;
  dataSource: 'supabase' | 'fallback' | 'unknown';
  // Actions
  refreshAll: () => Promise<void>;
  refreshSlice: (slice: ManagementFinanceSlice) => Promise<void>;
  enqueueAiJob: typeof svc.enqueueAiJob;
  postVoucher: typeof svc.postVoucher;
}

export type ManagementFinanceSlice =
  | 'expense'
  | 'payroll'
  | 'social_insurance'
  | 'assets'
  | 'budget'
  | 'profit'
  | 'vouchers'
  | 'ai_jobs'
  | 'audit_log';

const ManagementFinanceContext = createContext<ManagementFinanceContextValue | null>(null);

export const useManagementFinance = () => {
  const ctx = useContext(ManagementFinanceContext);
  if (!ctx) {
    throw new Error('useManagementFinance must be used within ManagementFinanceProvider');
  }
  return ctx;
};

const DEFAULT_PERIOD = { year: 2026, month: 4 };

export function ManagementFinanceProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<MfTenant | null>(null);
  const [companies, setCompanies] = useState<MfCompany[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<MfAccount[]>([]);
  const [costCenters, setCostCenters] = useState<MfCostCenter[]>([]);
  const [departments, setDepartments] = useState<MfDepartment[]>([]);
  const [employees, setEmployees] = useState<MfEmployee[]>([]);
  const [expenseClaims, setExpenseClaims] = useState<MfExpenseClaim[]>([]);
  const [payslipRun, setPayslipRun] = useState<MfPayslipRun | null>(null);
  const [payslips, setPayslips] = useState<MfPayslip[]>([]);
  const [payslipLines, setPayslipLines] = useState<MfPayslipLine[]>([]);
  const [siSchemeVersions, setSiSchemeVersions] = useState<MfSiSchemeVersion[]>([]);
  const [siRecords, setSiRecords] = useState<MfSiRecord[]>([]);
  const [assets, setAssets] = useState<MfAsset[]>([]);
  const [depreciation, setDepreciation] = useState<MfDepreciationRow[]>([]);
  const [budgets, setBudgets] = useState<MfBudget[]>([]);
  const [budgetLines, setBudgetLines] = useState<MfBudgetLine[]>([]);
  const [budgetAlerts, setBudgetAlerts] = useState<MfBudgetAlert[]>([]);
  const [deptProfits, setDeptProfits] = useState<MfProfitSnapshot[]>([]);
  const [orderProfits, setOrderProfits] = useState<MfProfitSnapshot[]>([]);
  const [vouchers, setVouchers] = useState<MfVoucherWithLines[]>([]);
  const [aiJobs, setAiJobs] = useState<MfAiJob[]>([]);
  const [auditLogs, setAuditLogs] = useState<MfAuditLog[]>([]);
  const [period, setPeriod] = useState<{ year: number; month: number }>(DEFAULT_PERIOD);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'supabase' | 'fallback' | 'unknown'>('unknown');

  const refreshAll = React.useCallback(async () => {
    setLoading(true);
    try {
      const [
        t, comps, accs, ccs, deps, emps, exps, run, slips, pLines, siVer, si, ast, depr,
        bud, lns, alerts, dProf, oProf, vchs, ai, audit,
      ] = await Promise.all([
        svc.fetchTenant(),
        svc.fetchCompanies(),
        svc.fetchAccounts(),
        svc.fetchCostCenters(),
        svc.fetchDepartments(),
        svc.fetchEmployees(),
        svc.fetchExpenseClaims(),
        svc.fetchPayslipRun(period.year, period.month),
        svc.fetchPayslips(),
        svc.fetchPayslipLines(),
        svc.fetchSiSchemeVersions(),
        svc.fetchSiRecords(period.year, period.month),
        svc.fetchAssets(),
        svc.fetchDepreciationSchedule({ year: period.year }),
        svc.fetchBudgets(period.year),
        Promise.resolve([] as MfBudgetLine[]), // populated after budgets resolves
        svc.fetchBudgetAlerts(),
        svc.fetchProfitSnapshots('department'),
        svc.fetchProfitSnapshots('order'),
        svc.fetchVouchers(),
        svc.fetchAiJobs(),
        svc.fetchAuditLogs(),
      ]);

      setTenant(t);
      setCompanies(comps);
      if (!companyId && comps.length > 0) setCompanyId(comps[0].id);
      setAccounts(accs);
      setCostCenters(ccs);
      setDepartments(deps);
      setEmployees(emps);
      setExpenseClaims(exps);
      setPayslipRun(run);
      setPayslips(slips);
      setPayslipLines(pLines);
      setSiSchemeVersions(siVer);
      setSiRecords(si);
      setAssets(ast);
      setDepreciation(depr);
      setBudgets(bud);

      const firstBudget = bud[0];
      const linesResult = firstBudget ? await svc.fetchBudgetLines(firstBudget.id) : [];
      setBudgetLines(linesResult);

      setBudgetAlerts(alerts);
      setDeptProfits(dProf);
      setOrderProfits(oProf);
      setVouchers(vchs);
      setAiJobs(ai);
      setAuditLogs(audit);
      setDataSource(svc.getManagementFinanceAvailability() === 'fallback' ? 'fallback' : 'supabase');
    } finally {
      setLoading(false);
    }
  }, [period.year, period.month, companyId]);

  useEffect(() => {
    refreshAll().catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[ManagementFinanceProvider] initial load failed', err);
    });
    // run-once at mount; subsequent refresh via refreshAll/refreshSlice
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshSlice = React.useCallback(
    async (slice: ManagementFinanceSlice) => {
      switch (slice) {
        case 'expense':
          setExpenseClaims(await svc.fetchExpenseClaims());
          break;
        case 'payroll': {
          const [run, slips, lines, siVer] = await Promise.all([
            svc.fetchPayslipRun(period.year, period.month),
            svc.fetchPayslips(),
            svc.fetchPayslipLines(),
            svc.fetchSiSchemeVersions(),
          ]);
          setPayslipRun(run);
          setPayslips(slips);
          setPayslipLines(lines);
          setSiSchemeVersions(siVer);
          break;
        }
        case 'social_insurance': {
          const [siRows, siVer] = await Promise.all([
            svc.fetchSiRecords(period.year, period.month),
            svc.fetchSiSchemeVersions(),
          ]);
          setSiRecords(siRows);
          setSiSchemeVersions(siVer);
          break;
        }
        case 'assets': {
          const [a, d] = await Promise.all([
            svc.fetchAssets(),
            svc.fetchDepreciationSchedule({ year: period.year }),
          ]);
          setAssets(a);
          setDepreciation(d);
          break;
        }
        case 'budget': {
          const [b, alerts] = await Promise.all([
            svc.fetchBudgets(period.year),
            svc.fetchBudgetAlerts(),
          ]);
          setBudgets(b);
          setBudgetAlerts(alerts);
          if (b[0]) setBudgetLines(await svc.fetchBudgetLines(b[0].id));
          break;
        }
        case 'profit': {
          const [d, o] = await Promise.all([
            svc.fetchProfitSnapshots('department'),
            svc.fetchProfitSnapshots('order'),
          ]);
          setDeptProfits(d);
          setOrderProfits(o);
          break;
        }
        case 'vouchers':
          setVouchers(await svc.fetchVouchers());
          break;
        case 'ai_jobs':
          setAiJobs(await svc.fetchAiJobs());
          break;
        case 'audit_log':
          setAuditLogs(await svc.fetchAuditLogs());
          break;
      }
    },
    [period.year, period.month],
  );

  const value = useMemo<ManagementFinanceContextValue>(
    () => ({
      tenant,
      companies,
      companyId,
      setCompanyId,
      accounts,
      costCenters,
      departments,
      employees,
      expenseClaims,
      payslipRun,
      payslips,
      payslipLines,
      siSchemeVersions,
      siRecords,
      assets,
      depreciation,
      budgets,
      budgetLines,
      budgetAlerts,
      deptProfits,
      orderProfits,
      vouchers,
      aiJobs,
      auditLogs,
      period,
      setPeriod,
      loading,
      dataSource,
      refreshAll,
      refreshSlice,
      enqueueAiJob: svc.enqueueAiJob,
      postVoucher: svc.postVoucher,
    }),
    [
      tenant, companies, companyId, accounts, costCenters, departments, employees,
      expenseClaims, payslipRun, payslips, payslipLines, siSchemeVersions, siRecords, assets, depreciation,
      budgets, budgetLines, budgetAlerts, deptProfits, orderProfits, vouchers,
      aiJobs, auditLogs, period, loading, dataSource, refreshAll, refreshSlice,
    ],
  );

  return (
    <ManagementFinanceContext.Provider value={value}>{children}</ManagementFinanceContext.Provider>
  );
}
