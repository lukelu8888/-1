// Management Finance Center — Supabase-first service layer.
//
// All UI components must call this service instead of touching `supabase` or
// localStorage directly. The service:
//   - Performs the actual queries against the `mf_*` tables defined in
//     `database/migrations/20260514_management_finance_center.sql`.
//   - Falls back to a deterministic mock seed (`MOCK_MANAGEMENT_FINANCE_SEED`)
//     when the tables haven't been migrated yet (e.g. on the dev frontend
//     before `supabase db push`), so the UI still renders end-to-end.
//   - Surfaces a small typed API per sub-module of Management Finance Center.
//
// IMPORTANT:
//   - No business data may be persisted to localStorage. Service-side caches
//     are in-memory only, and only used as a fallback for unmigrated DBs.
//   - All multi-tenant reads filter by `tenant_id` to satisfy RLS.
//   - Auto-voucher posting goes through the RPC `mf_post_voucher`.
//
// SECURITY:
//   - Writes require a finance role (admin/CEO/CFO/Finance/External_Accountant)
//     as enforced by the `mf_tenant_write` RLS policy.

import { supabase } from '../supabase';
import { MOCK_MANAGEMENT_FINANCE_SEED } from '../../components/management-finance/data/mockSeed';
import type {
  MfAccount,
  MfAiJob,
  MfAiJobType,
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
  MfVoucher,
  MfVoucherLine,
  MfVoucherWithLines,
} from '../../components/management-finance/types';

// ─── Supabase availability check ────────────────────────────────────────────

let mfAvailability: 'unknown' | 'available' | 'fallback' = 'unknown';

const isTableMissingError = (err: unknown): boolean => {
  const message = String((err as { message?: string })?.message || '').toLowerCase();
  const code = String((err as { code?: string })?.code || '');
  return (
    code === '42P01' ||
    code === 'PGRST116' ||
    message.includes('relation') && message.includes('does not exist') ||
    message.includes('schema cache')
  );
};

const markFallback = (err: unknown, label: string): void => {
  if (mfAvailability === 'unknown') {
    if (isTableMissingError(err)) {
      mfAvailability = 'fallback';
      // eslint-disable-next-line no-console
      console.warn(
        `[ManagementFinanceService] Falling back to mock seed for "${label}". ` +
          `Apply database/migrations/20260514_management_finance_center.sql to enable live data.`,
      );
    } else {
      // eslint-disable-next-line no-console
      console.error(`[ManagementFinanceService] Query "${label}" failed:`, err);
    }
  }
};

export const getManagementFinanceAvailability = () => mfAvailability;

// ─── 1. Companies & tenant ──────────────────────────────────────────────────

export async function fetchCompanies(): Promise<MfCompany[]> {
  if (mfAvailability === 'fallback') return MOCK_MANAGEMENT_FINANCE_SEED.companies;
  try {
    const { data, error } = await supabase
      .from('mf_companies')
      .select('*')
      .eq('is_active', true)
      .order('code');
    if (error) throw error;
    mfAvailability = 'available';
    return (data as MfCompany[]) || [];
  } catch (err) {
    markFallback(err, 'fetchCompanies');
    return MOCK_MANAGEMENT_FINANCE_SEED.companies;
  }
}

export async function fetchTenant(): Promise<MfTenant | null> {
  if (mfAvailability === 'fallback') return MOCK_MANAGEMENT_FINANCE_SEED.tenant;
  try {
    const { data, error } = await supabase
      .from('mf_tenants')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    mfAvailability = 'available';
    return (data as MfTenant) ?? MOCK_MANAGEMENT_FINANCE_SEED.tenant;
  } catch (err) {
    markFallback(err, 'fetchTenant');
    return MOCK_MANAGEMENT_FINANCE_SEED.tenant;
  }
}

// ─── 2. Chart of accounts ───────────────────────────────────────────────────

export async function fetchAccounts(companyId?: string): Promise<MfAccount[]> {
  if (mfAvailability === 'fallback') return MOCK_MANAGEMENT_FINANCE_SEED.accounts;
  try {
    let query = supabase.from('mf_accounts').select('*').eq('is_active', true);
    if (companyId) query = query.or(`company_id.eq.${companyId},company_id.is.null`);
    const { data, error } = await query.order('code');
    if (error) throw error;
    mfAvailability = 'available';
    return (data as MfAccount[]) || [];
  } catch (err) {
    markFallback(err, 'fetchAccounts');
    return MOCK_MANAGEMENT_FINANCE_SEED.accounts;
  }
}

// ─── 3. Cost centers, departments ───────────────────────────────────────────

export async function fetchCostCenters(companyId?: string): Promise<MfCostCenter[]> {
  if (mfAvailability === 'fallback') return MOCK_MANAGEMENT_FINANCE_SEED.cost_centers;
  try {
    let query = supabase.from('mf_cost_centers').select('*').eq('is_active', true);
    if (companyId) query = query.eq('company_id', companyId);
    const { data, error } = await query.order('code');
    if (error) throw error;
    mfAvailability = 'available';
    return (data as MfCostCenter[]) || [];
  } catch (err) {
    markFallback(err, 'fetchCostCenters');
    return MOCK_MANAGEMENT_FINANCE_SEED.cost_centers;
  }
}

export async function fetchDepartments(companyId?: string): Promise<MfDepartment[]> {
  if (mfAvailability === 'fallback') return MOCK_MANAGEMENT_FINANCE_SEED.departments;
  try {
    let query = supabase.from('mf_departments').select('*').eq('is_active', true);
    if (companyId) query = query.eq('company_id', companyId);
    const { data, error } = await query.order('code');
    if (error) throw error;
    mfAvailability = 'available';
    return (data as MfDepartment[]) || [];
  } catch (err) {
    markFallback(err, 'fetchDepartments');
    return MOCK_MANAGEMENT_FINANCE_SEED.departments;
  }
}

// ─── 4. Expense ─────────────────────────────────────────────────────────────

export async function fetchExpenseClaims(filters: { status?: string; companyId?: string } = {}): Promise<MfExpenseClaim[]> {
  if (mfAvailability === 'fallback') {
    let rows = MOCK_MANAGEMENT_FINANCE_SEED.expense_claims;
    if (filters.status) rows = rows.filter((r) => r.status === filters.status);
    return rows;
  }
  try {
    let query = supabase
      .from('mf_expense_claims')
      .select('*')
      .order('submitted_at', { ascending: false });
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.companyId) query = query.eq('company_id', filters.companyId);
    const { data, error } = await query;
    if (error) throw error;
    mfAvailability = 'available';
    return (data as MfExpenseClaim[]) || [];
  } catch (err) {
    markFallback(err, 'fetchExpenseClaims');
    let rows = MOCK_MANAGEMENT_FINANCE_SEED.expense_claims;
    if (filters.status) rows = rows.filter((r) => r.status === filters.status);
    return rows;
  }
}

// ─── 5. Payroll ─────────────────────────────────────────────────────────────

export async function fetchPayslipRun(year: number, month: number): Promise<MfPayslipRun | null> {
  if (mfAvailability === 'fallback') {
    return MOCK_MANAGEMENT_FINANCE_SEED.payslip_run.period_year === year &&
      MOCK_MANAGEMENT_FINANCE_SEED.payslip_run.period_month === month
      ? MOCK_MANAGEMENT_FINANCE_SEED.payslip_run
      : null;
  }
  try {
    const { data, error } = await supabase
      .from('mf_payslip_runs')
      .select('*')
      .eq('period_year', year)
      .eq('period_month', month)
      .maybeSingle();
    if (error) throw error;
    mfAvailability = 'available';
    return (data as MfPayslipRun) ?? null;
  } catch (err) {
    markFallback(err, 'fetchPayslipRun');
    return MOCK_MANAGEMENT_FINANCE_SEED.payslip_run;
  }
}

export async function fetchPayslips(runId?: string): Promise<MfPayslip[]> {
  if (mfAvailability === 'fallback') {
    if (!runId) return MOCK_MANAGEMENT_FINANCE_SEED.payslips;
    return MOCK_MANAGEMENT_FINANCE_SEED.payslips.filter((p) => p.run_id === runId);
  }
  try {
    let query = supabase
      .from('mf_payslips')
      .select('*, mf_employees!inner(employee_no, full_name, department_id), mf_departments(name)');
    if (runId) query = query.eq('run_id', runId);
    const { data, error } = await query;
    if (error) throw error;
    mfAvailability = 'available';
    return ((data as unknown) as MfPayslip[]) || [];
  } catch (err) {
    markFallback(err, 'fetchPayslips');
    return MOCK_MANAGEMENT_FINANCE_SEED.payslips;
  }
}

/** 工资条分项快照（入账后不因规则改版重写） */
export async function fetchPayslipLines(runId?: string): Promise<MfPayslipLine[]> {
  if (mfAvailability === 'fallback') {
    const rows = MOCK_MANAGEMENT_FINANCE_SEED.payslip_lines ?? [];
    if (!runId) return rows;
    return rows.filter((l) => l.run_id === runId);
  }
  try {
    let query = supabase.from('mf_payslip_lines').select('*').order('line_no');
    if (runId) query = query.eq('run_id', runId);
    const { data, error } = await query;
    if (error) throw error;
    mfAvailability = 'available';
    return ((data as unknown) as MfPayslipLine[]) || [];
  } catch (err) {
    markFallback(err, 'fetchPayslipLines');
    const rows = MOCK_MANAGEMENT_FINANCE_SEED.payslip_lines ?? [];
    if (!runId) return rows;
    return rows.filter((l) => l.run_id === runId);
  }
}

/** 社保方案版本（effective_from/to），用于选用规则而非回算历史 */
export async function fetchSiSchemeVersions(): Promise<MfSiSchemeVersion[]> {
  if (mfAvailability === 'fallback') {
    return MOCK_MANAGEMENT_FINANCE_SEED.si_scheme_versions ?? [];
  }
  try {
    const { data, error } = await supabase.from('mf_si_scheme_versions').select('*').order('effective_from');
    if (error) throw error;
    mfAvailability = 'available';
    return ((data as unknown) as MfSiSchemeVersion[]) || [];
  } catch (err) {
    markFallback(err, 'fetchSiSchemeVersions');
    return MOCK_MANAGEMENT_FINANCE_SEED.si_scheme_versions ?? [];
  }
}

export async function fetchEmployees(companyId?: string): Promise<MfEmployee[]> {
  if (mfAvailability === 'fallback') return MOCK_MANAGEMENT_FINANCE_SEED.employees;
  try {
    let query = supabase
      .from('mf_employees')
      .select('*, mf_departments(name)')
      .eq('status', 'active');
    if (companyId) query = query.eq('company_id', companyId);
    const { data, error } = await query.order('employee_no');
    if (error) throw error;
    mfAvailability = 'available';
    return ((data as unknown) as MfEmployee[]) || [];
  } catch (err) {
    markFallback(err, 'fetchEmployees');
    return MOCK_MANAGEMENT_FINANCE_SEED.employees;
  }
}

// ─── 6. Social insurance ────────────────────────────────────────────────────

export async function fetchSiRecords(year: number, month: number): Promise<MfSiRecord[]> {
  if (mfAvailability === 'fallback') {
    return MOCK_MANAGEMENT_FINANCE_SEED.si_records.filter(
      (r) => r.period_year === year && r.period_month === month,
    );
  }
  try {
    const { data, error } = await supabase
      .from('mf_si_records')
      .select('*, mf_employees(full_name)')
      .eq('period_year', year)
      .eq('period_month', month);
    if (error) throw error;
    mfAvailability = 'available';
    return ((data as unknown) as MfSiRecord[]) || [];
  } catch (err) {
    markFallback(err, 'fetchSiRecords');
    return MOCK_MANAGEMENT_FINANCE_SEED.si_records;
  }
}

// ─── 7. Fixed assets ────────────────────────────────────────────────────────

export async function fetchAssets(companyId?: string): Promise<MfAsset[]> {
  if (mfAvailability === 'fallback') return MOCK_MANAGEMENT_FINANCE_SEED.assets;
  try {
    let query = supabase.from('mf_assets').select('*, mf_departments(name)');
    if (companyId) query = query.eq('company_id', companyId);
    const { data, error } = await query.order('acquisition_date', { ascending: false });
    if (error) throw error;
    mfAvailability = 'available';
    return ((data as unknown) as MfAsset[]) || [];
  } catch (err) {
    markFallback(err, 'fetchAssets');
    return MOCK_MANAGEMENT_FINANCE_SEED.assets;
  }
}

export async function fetchDepreciationSchedule(filters: { year?: number; month?: number; assetId?: string } = {}): Promise<MfDepreciationRow[]> {
  if (mfAvailability === 'fallback') {
    let rows = MOCK_MANAGEMENT_FINANCE_SEED.depreciation;
    if (filters.year) rows = rows.filter((r) => r.period_year === filters.year);
    if (filters.month) rows = rows.filter((r) => r.period_month === filters.month);
    if (filters.assetId) rows = rows.filter((r) => r.asset_id === filters.assetId);
    return rows;
  }
  try {
    let query = supabase.from('mf_depreciation_schedule').select('*');
    if (filters.year) query = query.eq('period_year', filters.year);
    if (filters.month) query = query.eq('period_month', filters.month);
    if (filters.assetId) query = query.eq('asset_id', filters.assetId);
    const { data, error } = await query;
    if (error) throw error;
    mfAvailability = 'available';
    return ((data as unknown) as MfDepreciationRow[]) || [];
  } catch (err) {
    markFallback(err, 'fetchDepreciationSchedule');
    return MOCK_MANAGEMENT_FINANCE_SEED.depreciation;
  }
}

// ─── 8. Budgets ─────────────────────────────────────────────────────────────

export async function fetchBudgets(fiscalYear: number): Promise<MfBudget[]> {
  if (mfAvailability === 'fallback') {
    return [MOCK_MANAGEMENT_FINANCE_SEED.budget].filter((b) => b.fiscal_year === fiscalYear);
  }
  try {
    const { data, error } = await supabase
      .from('mf_budgets')
      .select('*')
      .eq('fiscal_year', fiscalYear);
    if (error) throw error;
    mfAvailability = 'available';
    return (data as MfBudget[]) || [];
  } catch (err) {
    markFallback(err, 'fetchBudgets');
    return [MOCK_MANAGEMENT_FINANCE_SEED.budget];
  }
}

export async function fetchBudgetLines(budgetId: string): Promise<MfBudgetLine[]> {
  if (mfAvailability === 'fallback') {
    return MOCK_MANAGEMENT_FINANCE_SEED.budget_lines.filter((l) => l.budget_id === budgetId);
  }
  try {
    const { data, error } = await supabase
      .from('mf_budget_lines')
      .select('*')
      .eq('budget_id', budgetId)
      .order('period_year')
      .order('period_month');
    if (error) throw error;
    mfAvailability = 'available';
    return (data as MfBudgetLine[]) || [];
  } catch (err) {
    markFallback(err, 'fetchBudgetLines');
    return MOCK_MANAGEMENT_FINANCE_SEED.budget_lines;
  }
}

export async function fetchBudgetAlerts(): Promise<MfBudgetAlert[]> {
  if (mfAvailability === 'fallback') return MOCK_MANAGEMENT_FINANCE_SEED.budget_alerts;
  try {
    const { data, error } = await supabase
      .from('mf_budget_alerts')
      .select('*')
      .is('resolved_at', null)
      .order('triggered_at', { ascending: false });
    if (error) throw error;
    mfAvailability = 'available';
    return (data as MfBudgetAlert[]) || [];
  } catch (err) {
    markFallback(err, 'fetchBudgetAlerts');
    return MOCK_MANAGEMENT_FINANCE_SEED.budget_alerts;
  }
}

// ─── 9. Profit snapshots ────────────────────────────────────────────────────

export async function fetchProfitSnapshots(scope: 'department' | 'order' | 'project'): Promise<MfProfitSnapshot[]> {
  if (mfAvailability === 'fallback') {
    if (scope === 'department') return MOCK_MANAGEMENT_FINANCE_SEED.dept_profits;
    if (scope === 'order') return MOCK_MANAGEMENT_FINANCE_SEED.order_profits;
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('mf_profit_snapshots')
      .select('*')
      .eq('scope', scope)
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false });
    if (error) throw error;
    mfAvailability = 'available';
    return (data as MfProfitSnapshot[]) || [];
  } catch (err) {
    markFallback(err, 'fetchProfitSnapshots');
    if (scope === 'department') return MOCK_MANAGEMENT_FINANCE_SEED.dept_profits;
    if (scope === 'order') return MOCK_MANAGEMENT_FINANCE_SEED.order_profits;
    return [];
  }
}

// ─── 10. Vouchers ───────────────────────────────────────────────────────────

export async function fetchVouchers(filters: { sourceModule?: string; status?: string } = {}): Promise<MfVoucherWithLines[]> {
  if (mfAvailability === 'fallback') {
    let vouchers = MOCK_MANAGEMENT_FINANCE_SEED.vouchers;
    if (filters.sourceModule) vouchers = vouchers.filter((v) => v.source_module === filters.sourceModule);
    if (filters.status) vouchers = vouchers.filter((v) => v.status === filters.status);
    return vouchers.map((v) => ({
      ...v,
      lines: MOCK_MANAGEMENT_FINANCE_SEED.voucher_lines.filter((l) => l.voucher_id === v.id),
    }));
  }
  try {
    let query = supabase
      .from('mf_vouchers')
      .select('*, mf_voucher_lines(*, mf_accounts(code,name))')
      .order('voucher_date', { ascending: false });
    if (filters.sourceModule) query = query.eq('source_module', filters.sourceModule);
    if (filters.status) query = query.eq('status', filters.status);
    const { data, error } = await query;
    if (error) throw error;
    mfAvailability = 'available';
    return ((data as unknown) as MfVoucherWithLines[]) || [];
  } catch (err) {
    markFallback(err, 'fetchVouchers');
    return MOCK_MANAGEMENT_FINANCE_SEED.vouchers.map((v) => ({
      ...v,
      lines: MOCK_MANAGEMENT_FINANCE_SEED.voucher_lines.filter((l) => l.voucher_id === v.id),
    }));
  }
}

export async function postVoucher(voucherId: string): Promise<MfVoucher | null> {
  if (mfAvailability === 'fallback') {
    const v = MOCK_MANAGEMENT_FINANCE_SEED.vouchers.find((it) => it.id === voucherId);
    if (!v) return null;
    v.status = 'posted';
    v.posted_at = new Date().toISOString();
    return v;
  }
  try {
    const { data, error } = await supabase.rpc('mf_post_voucher', { p_voucher_id: voucherId });
    if (error) throw error;
    mfAvailability = 'available';
    return (data as MfVoucher) ?? null;
  } catch (err) {
    markFallback(err, 'postVoucher');
    throw err;
  }
}

// ─── 11. AI jobs ────────────────────────────────────────────────────────────

export async function fetchAiJobs(): Promise<MfAiJob[]> {
  if (mfAvailability === 'fallback') return MOCK_MANAGEMENT_FINANCE_SEED.ai_jobs;
  try {
    const { data, error } = await supabase
      .from('mf_ai_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    mfAvailability = 'available';
    return (data as MfAiJob[]) || [];
  } catch (err) {
    markFallback(err, 'fetchAiJobs');
    return MOCK_MANAGEMENT_FINANCE_SEED.ai_jobs;
  }
}

export async function enqueueAiJob(jobType: MfAiJobType, parameters: Record<string, unknown> = {}): Promise<MfAiJob | null> {
  const newJob: MfAiJob = {
    id: `ai-job-${Date.now()}`,
    tenant_id: MOCK_MANAGEMENT_FINANCE_SEED.tenant.id,
    company_id: MOCK_MANAGEMENT_FINANCE_SEED.companies[0]?.id ?? null,
    job_type: jobType,
    parameters,
    status: 'queued',
    created_at: new Date().toISOString(),
  };
  if (mfAvailability === 'fallback') {
    MOCK_MANAGEMENT_FINANCE_SEED.ai_jobs.unshift(newJob);
    return newJob;
  }
  try {
    const { data, error } = await supabase
      .from('mf_ai_jobs')
      .insert({ job_type: jobType, parameters })
      .select()
      .single();
    if (error) throw error;
    return data as MfAiJob;
  } catch (err) {
    markFallback(err, 'enqueueAiJob');
    MOCK_MANAGEMENT_FINANCE_SEED.ai_jobs.unshift(newJob);
    return newJob;
  }
}

// ─── 12. Audit logs ─────────────────────────────────────────────────────────

export async function fetchAuditLogs(): Promise<MfAuditLog[]> {
  if (mfAvailability === 'fallback') return MOCK_MANAGEMENT_FINANCE_SEED.audit_logs;
  try {
    const { data, error } = await supabase
      .from('mf_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    mfAvailability = 'available';
    return (data as MfAuditLog[]) || [];
  } catch (err) {
    markFallback(err, 'fetchAuditLogs');
    return MOCK_MANAGEMENT_FINANCE_SEED.audit_logs;
  }
}

export type ManagementFinanceService = {
  fetchTenant: typeof fetchTenant;
  fetchCompanies: typeof fetchCompanies;
  fetchAccounts: typeof fetchAccounts;
  fetchCostCenters: typeof fetchCostCenters;
  fetchDepartments: typeof fetchDepartments;
  fetchExpenseClaims: typeof fetchExpenseClaims;
  fetchPayslipRun: typeof fetchPayslipRun;
  fetchPayslips: typeof fetchPayslips;
  fetchEmployees: typeof fetchEmployees;
  fetchSiRecords: typeof fetchSiRecords;
  fetchAssets: typeof fetchAssets;
  fetchDepreciationSchedule: typeof fetchDepreciationSchedule;
  fetchBudgets: typeof fetchBudgets;
  fetchBudgetLines: typeof fetchBudgetLines;
  fetchBudgetAlerts: typeof fetchBudgetAlerts;
  fetchProfitSnapshots: typeof fetchProfitSnapshots;
  fetchVouchers: typeof fetchVouchers;
  fetchAiJobs: typeof fetchAiJobs;
  fetchAuditLogs: typeof fetchAuditLogs;
  postVoucher: typeof postVoucher;
  enqueueAiJob: typeof enqueueAiJob;
};
