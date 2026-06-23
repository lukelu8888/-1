// 内部管理财务模块（Management Finance Center） 类型定义
// 与 database/migrations/20260514_management_finance_center.sql 中的 mf_* 表保持一一映射。
// 所有金额字段以「最小货币单位以上」的标准浮点 number 表达（Supabase numeric -> number），
// 货币由独立 `currency` 字段定义，便于多币种结算与折算。

export type ManagementFinanceTabId =
  | 'overview'
  | 'expense'
  | 'payroll'
  | 'social_insurance'
  | 'fixed_assets'
  | 'cost_center'
  | 'budget'
  | 'department_profit'
  | 'project_profit'
  | 'ai_analytics'
  | 'voucher_center'
  | 'audit_log';

export const MANAGEMENT_FINANCE_TAB_IDS: ManagementFinanceTabId[] = [
  'overview',
  'expense',
  'payroll',
  'social_insurance',
  'fixed_assets',
  'cost_center',
  'budget',
  'department_profit',
  'project_profit',
  'ai_analytics',
  'voucher_center',
  'audit_log',
];

export type CurrencyCode = 'CNY' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'HKD' | string;

export interface MfTenant {
  id: string;
  code: string;
  name: string;
  plan: 'starter' | 'pro' | 'enterprise' | string;
  base_currency: CurrencyCode;
  is_active: boolean;
}

export interface MfCompany {
  id: string;
  tenant_id: string;
  code: string;
  name_cn: string;
  name_en?: string | null;
  legal_entity?: string | null;
  base_currency: CurrencyCode;
  reporting_currency: CurrencyCode;
  fiscal_year_start_month: number;
  region?: string | null;
  is_active: boolean;
}

export interface MfAccount {
  id: string;
  tenant_id: string;
  company_id?: string | null;
  code: string;
  name: string;
  parent_id?: string | null;
  category: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' | 'cost';
  direction: 'debit' | 'credit';
  is_leaf: boolean;
  is_active: boolean;
}

export type CostCenterType =
  | 'department'
  | 'project'
  | 'warehouse'
  | 'logistics'
  | 'people'
  | 'ai'
  | 'shared';

export interface MfCostCenter {
  id: string;
  tenant_id: string;
  company_id: string;
  code: string;
  name: string;
  cc_type: CostCenterType;
  parent_id?: string | null;
  manager_user_id?: string | null;
  is_active: boolean;
  description?: string | null;
}

export interface MfDepartment {
  id: string;
  tenant_id: string;
  company_id: string;
  code: string;
  name: string;
  parent_id?: string | null;
  cost_center_id?: string | null;
  manager_user_id?: string | null;
  headcount: number;
  is_active: boolean;
}

export interface MfProject {
  id: string;
  tenant_id: string;
  company_id: string;
  code: string;
  name: string;
  customer_id?: string | null;
  cost_center_id?: string | null;
  manager_user_id?: string | null;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'closed' | 'cancelled';
  start_date?: string | null;
  end_date?: string | null;
  contract_amount?: number | null;
  budget_amount?: number | null;
  currency: CurrencyCode;
  is_active: boolean;
}

export type VoucherStatus = 'draft' | 'posted' | 'approved' | 'reversed' | 'void';
export type VoucherType =
  | 'JE'
  | 'PAYROLL'
  | 'DEPRECIATION'
  | 'EXPENSE'
  | 'REVENUE'
  | 'FX'
  | 'ADJUST'
  | 'OPENING'
  | 'CLOSING'
  | 'AI';

export interface MfVoucher {
  id: string;
  tenant_id: string;
  company_id: string;
  period_id?: string | null;
  voucher_no: string;
  voucher_type: VoucherType;
  voucher_date: string;
  description?: string | null;
  amount: number;
  currency: CurrencyCode;
  exchange_rate: number;
  status: VoucherStatus;
  source_module?: string | null;
  source_ref?: string | null;
  rule_id?: string | null;
  created_by?: string | null;
  posted_by?: string | null;
  posted_at?: string | null;
  reversed_by_voucher_id?: string | null;
}

export interface MfVoucherLine {
  id: string;
  voucher_id: string;
  tenant_id: string;
  line_no: number;
  account_id: string;
  account_code?: string;
  account_name?: string;
  cost_center_id?: string | null;
  department_id?: string | null;
  project_id?: string | null;
  debit: number;
  credit: number;
  currency: CurrencyCode;
  fx_amount?: number | null;
  exchange_rate: number;
  memo?: string | null;
}

export interface MfVoucherWithLines extends MfVoucher {
  lines: MfVoucherLine[];
}

export interface MfVoucherRule {
  id: string;
  tenant_id: string;
  company_id?: string | null;
  code: string;
  name: string;
  event_type: string;
  template: VoucherRuleTemplateLine[];
  is_active: boolean;
  priority: number;
}

export interface VoucherRuleTemplateLine {
  side: 'debit' | 'credit';
  account_code: string;
  amount_expr: string; // a JSONPath/expression resolved against the event payload
  cost_center_expr?: string;
  department_expr?: string;
  project_expr?: string;
  memo_expr?: string;
}

// ─── Expense ─────────────────────────────────────────────────────────────────

export type ExpenseStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid' | 'voided';

export interface MfExpenseCategory {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  account_id?: string | null;
  description?: string | null;
  is_active: boolean;
}

export interface MfExpenseClaim {
  id: string;
  tenant_id: string;
  company_id: string;
  claim_no: string;
  applicant_user_id?: string | null;
  applicant_name?: string | null;
  department_id?: string | null;
  cost_center_id?: string | null;
  project_id?: string | null;
  total_amount: number;
  currency: CurrencyCode;
  exchange_rate: number;
  reason?: string | null;
  status: ExpenseStatus;
  submitted_at?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  paid_at?: string | null;
  voucher_id?: string | null;
}

export interface MfExpenseItem {
  id: string;
  tenant_id: string;
  claim_id: string;
  line_no: number;
  category_id?: string | null;
  description?: string | null;
  expense_date?: string | null;
  amount: number;
  currency: CurrencyCode;
  exchange_rate: number;
  vat_rate?: number | null;
  vat_amount?: number | null;
  invoice_no?: string | null;
  attachment_url?: string | null;
  cost_center_id?: string | null;
}

// ─── Payroll ─────────────────────────────────────────────────────────────────

export type EmployeeStatus = 'active' | 'probation' | 'leave' | 'terminated';

export interface MfEmployee {
  id: string;
  tenant_id: string;
  company_id: string;
  employee_no: string;
  full_name: string;
  english_name?: string | null;
  user_id?: string | null;
  department_id?: string | null;
  department_name?: string | null;
  cost_center_id?: string | null;
  position?: string | null;
  hire_date?: string | null;
  termination_date?: string | null;
  status: EmployeeStatus;
  id_card?: string | null;
  bank_name?: string | null;
  bank_account?: string | null;
  base_salary: number;
  currency: CurrencyCode;
  social_insurance_base?: number | null;
  housing_fund_base?: number | null;
}

export type PayslipRunStatus =
  | 'draft'
  | 'calculated'
  | 'approved'
  | 'disbursed'
  | 'locked'
  | 'cancelled';

export interface MfPayslipRun {
  id: string;
  tenant_id: string;
  company_id: string;
  period_year: number;
  period_month: number;
  run_no: string;
  status: PayslipRunStatus;
  total_gross: number;
  total_net: number;
  total_tax: number;
  total_si: number;
  total_hf: number;
  employee_count: number;
  voucher_id?: string | null;
  approved_at?: string | null;
  disbursed_at?: string | null;
  /** 本期算薪选用的社保方案版本（演示：规则可变，入账行仍.snapshot） */
  si_scheme_version_id?: string | null;
  /** 个税预扣等政策版本标识（演示） */
  payroll_tax_policy_version_id?: string | null;
  locked_at?: string | null;
}

export interface MfPayslip {
  id: string;
  tenant_id: string;
  run_id: string;
  employee_id: string;
  employee_no?: string;
  employee_name?: string;
  department_id?: string | null;
  department_name?: string | null;
  cost_center_id?: string | null;
  gross_pay: number;
  base_salary: number;
  overtime_pay: number;
  bonus: number;
  commission: number;
  allowance: number;
  social_insurance_employee: number;
  social_insurance_company: number;
  housing_fund_employee: number;
  housing_fund_company: number;
  income_tax: number;
  other_deduction: number;
  net_pay: number;
  currency: CurrencyCode;
  bank_name?: string | null;
  bank_account?: string | null;
  paid_at?: string | null;
  pdf_url?: string | null;
  /** 批次锁定时的组织快照（演示） */
  snapshot_department_name?: string | null;
  snapshot_cost_center_code?: string | null;
}

/** 工资条分项：入账后即为快照，不因后续规则改版而改写 */
export type MfPayslipLineCategory = 'earning' | 'deduction' | 'employer_cost';

export interface MfPayslipLine {
  id: string;
  payslip_id: string;
  run_id: string;
  line_no: number;
  code: string;
  label: string;
  category: MfPayslipLineCategory;
  amount: number;
  currency: CurrencyCode;
  /** 计费基数快照（若有） */
  applied_base?: number | null;
  /** 展示用人-readable 百分数，如 8 表示 8% */
  rate_pct?: number | null;
  scheme_version_id?: string | null;
  rule_effective_from?: string | null;
  memo?: string | null;
}

/** 社保公积金方案版本（仅定义规则；每期台账另存分项快照） */
export interface MfSiSchemeVersion {
  id: string;
  scheme_code: string;
  region_label: string;
  label: string;
  effective_from: string;
  effective_to?: string | null;
  pension_company_pct: number;
  pension_employee_pct: number;
  medical_company_pct: number;
  medical_employee_pct: number;
  unemployment_company_pct: number;
  unemployment_employee_pct: number;
  injury_company_pct: number;
  maternity_company_pct: number;
  hf_company_pct: number;
  hf_employee_pct: number;
  notes?: string | null;
}

// ─── Social Insurance ────────────────────────────────────────────────────────

export interface MfSiScheme {
  id: string;
  tenant_id: string;
  company_id: string;
  scheme_code: string;
  scheme_name: string;
  effective_from: string;
  effective_to?: string | null;
  pension_company: number;
  pension_employee: number;
  medical_company: number;
  medical_employee: number;
  unemployment_company: number;
  unemployment_employee: number;
  injury_company: number;
  maternity_company: number;
  housing_fund_company: number;
  housing_fund_employee: number;
  base_min?: number | null;
  base_max?: number | null;
  is_active: boolean;
}

export interface MfSiRecord {
  id: string;
  tenant_id: string;
  company_id: string;
  employee_id: string;
  employee_name?: string;
  scheme_id?: string | null;
  period_year: number;
  period_month: number;
  si_base?: number | null;
  hf_base?: number | null;
  pension_company: number;
  pension_employee: number;
  medical_company: number;
  medical_employee: number;
  unemployment_company: number;
  unemployment_employee: number;
  injury_company: number;
  maternity_company: number;
  housing_fund_company: number;
  housing_fund_employee: number;
  total_company: number;
  total_employee: number;
  status: 'draft' | 'calculated' | 'paid' | 'reconciled';
}

// ─── Fixed Assets ────────────────────────────────────────────────────────────

export type AssetStatus = 'idle' | 'in_use' | 'under_repair' | 'disposed' | 'scrapped' | 'sold';

export interface MfAsset {
  id: string;
  tenant_id: string;
  company_id: string;
  asset_no: string;
  name: string;
  category: string;
  acquisition_date: string;
  acquisition_cost: number;
  salvage_value: number;
  useful_life_months: number;
  depreciation_method:
    | 'straight_line'
    | 'double_declining'
    | 'units_of_production'
    | 'sum_of_years';
  currency: CurrencyCode;
  department_id?: string | null;
  department_name?: string | null;
  cost_center_id?: string | null;
  custodian_user_id?: string | null;
  location?: string | null;
  status: AssetStatus;
  accumulated_depreciation: number;
  net_book_value: number;
  disposed_at?: string | null;
  disposal_amount?: number | null;
  notes?: string | null;
}

export interface MfDepreciationRow {
  id: string;
  tenant_id: string;
  asset_id: string;
  period_year: number;
  period_month: number;
  amount: number;
  accumulated: number;
  net_book_value: number;
  voucher_id?: string | null;
  status: 'planned' | 'posted' | 'reversed';
  posted_at?: string | null;
}

// ─── Budget ──────────────────────────────────────────────────────────────────

export type BudgetScope = 'company' | 'department' | 'project' | 'cost_center';
export type BudgetStatus = 'draft' | 'submitted' | 'approved' | 'locked' | 'closed';

export interface MfBudget {
  id: string;
  tenant_id: string;
  company_id: string;
  scope: BudgetScope;
  scope_ref_id?: string | null;
  scope_label?: string;
  fiscal_year: number;
  granularity: 'annual' | 'quarterly' | 'monthly';
  currency: CurrencyCode;
  status: BudgetStatus;
  total_amount: number;
  notes?: string | null;
}

export interface MfBudgetLine {
  id: string;
  tenant_id: string;
  budget_id: string;
  account_id?: string | null;
  category: string;
  period_year: number;
  period_month?: number | null;
  planned_amount: number;
  actual_amount: number;
  variance_amount: number;
  variance_pct?: number | null;
}

export interface MfBudgetAlert {
  id: string;
  tenant_id: string;
  company_id: string;
  budget_id?: string | null;
  line_id?: string | null;
  severity: 'info' | 'warn' | 'danger' | 'critical';
  message: string;
  triggered_at: string;
  resolved_at?: string | null;
}

// ─── Profit Snapshots ────────────────────────────────────────────────────────

export type ProfitScope = 'department' | 'project' | 'order' | 'customer' | 'company';

export interface MfProfitSnapshot {
  id: string;
  tenant_id: string;
  company_id: string;
  scope: ProfitScope;
  scope_ref_id?: string | null;
  scope_ref_no?: string | null;
  scope_label?: string | null;
  period_year: number;
  period_month?: number | null;
  revenue: number;
  cost_purchase: number;
  cost_labor: number;
  cost_logistics: number;
  cost_warehouse: number;
  cost_tax: number;
  cost_depreciation: number;
  cost_fx: number;
  cost_overhead: number;
  cost_ai: number;
  total_cost: number;
  gross_profit: number;
  margin_pct?: number | null;
  currency: CurrencyCode;
  computed_at: string;
  notes?: string | null;
}

// ─── AI Jobs ─────────────────────────────────────────────────────────────────

export type MfAiJobType =
  | 'profit_analysis'
  | 'expense_anomaly'
  | 'cashflow_forecast'
  | 'budget_forecast'
  | 'board_briefing'
  | 'voucher_suggestion'
  | 'cost_attribution';

export interface MfAiJob {
  id: string;
  tenant_id: string;
  company_id?: string | null;
  job_type: MfAiJobType;
  scope?: unknown;
  parameters?: unknown;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  result_summary?: string | null;
  result_data?: unknown;
  result_url?: string | null;
  cost_tokens?: number | null;
  cost_usd?: number | null;
  started_at?: string | null;
  finished_at?: string | null;
  created_by?: string | null;
  created_at: string;
}

// ─── Audit Logs ──────────────────────────────────────────────────────────────

export interface MfAuditLog {
  id: string;
  tenant_id: string;
  company_id?: string | null;
  actor_user_id?: string | null;
  actor_email?: string | null;
  module: string;
  action: string;
  entity: string;
  entity_id?: string | null;
  before_state?: unknown;
  after_state?: unknown;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}
