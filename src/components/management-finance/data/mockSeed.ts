// Mock seed for Management Finance Center.
//
// IMPORTANT — this is *not* business data. It is a deterministic in-memory seed
// used only when the Supabase backend has not been migrated yet, so the UI can
// be developed and demonstrated without `mf_*` tables present.
//
// All real reads / writes must go through `services/managementFinanceService.ts`,
// which falls back to this seed only when Supabase returns "table not found" /
// 401 (PGRST116, 42P01). Once the migration is applied and RLS-compliant data
// arrives, the seed is ignored.

import type {
  MfAccount,
  MfAsset,
  MfBudget,
  MfBudgetLine,
  MfCompany,
  MfCostCenter,
  MfDepartment,
  MfEmployee,
  MfExpenseClaim,
  MfPayslip,
  MfPayslipLine,
  MfPayslipRun,
  MfProfitSnapshot,
  MfSiSchemeVersion,
  MfSiRecord,
  MfTenant,
  MfVoucher,
  MfVoucherLine,
  MfAiJob,
  MfBudgetAlert,
  MfDepreciationRow,
  MfAuditLog,
} from '../types';

const TENANT_ID = 'tenant-mock-0001';
const COMPANY_ID = 'company-mock-cn-01';

export const MOCK_TENANT: MfTenant = {
  id: TENANT_ID,
  code: 'GSD',
  name: '高盛达富国际贸易集团',
  plan: 'enterprise',
  base_currency: 'CNY',
  is_active: true,
};

export const MOCK_COMPANIES: MfCompany[] = [
  {
    id: COMPANY_ID,
    tenant_id: TENANT_ID,
    code: 'CN01',
    name_cn: '高盛达富（深圳）国际贸易有限公司',
    name_en: 'Gaoshengdafu (Shenzhen) International Trading Co.',
    legal_entity: '高盛达富（深圳）',
    base_currency: 'CNY',
    reporting_currency: 'CNY',
    fiscal_year_start_month: 1,
    region: 'CN-South',
    is_active: true,
  },
  {
    id: 'company-mock-hk-01',
    tenant_id: TENANT_ID,
    code: 'HK01',
    name_cn: '高盛达富（香港）有限公司',
    name_en: 'Gaoshengdafu (HK) Limited',
    legal_entity: 'Gaoshengdafu HK Ltd.',
    base_currency: 'HKD',
    reporting_currency: 'CNY',
    fiscal_year_start_month: 1,
    region: 'HK',
    is_active: true,
  },
  {
    id: 'company-mock-us-01',
    tenant_id: TENANT_ID,
    code: 'US01',
    name_cn: '高盛达富美国分公司',
    name_en: 'Gaoshengdafu USA Inc.',
    legal_entity: 'GSD USA Inc.',
    base_currency: 'USD',
    reporting_currency: 'CNY',
    fiscal_year_start_month: 1,
    region: 'US',
    is_active: true,
  },
];

export const MOCK_ACCOUNTS: MfAccount[] = [
  // ── 资产 ─────────────────────────────────────────────────────────
  { id: 'acc-1001', tenant_id: TENANT_ID, code: '1001', name: '库存现金',     parent_id: null, category: 'asset',     direction: 'debit',  is_leaf: true, is_active: true },
  { id: 'acc-1002', tenant_id: TENANT_ID, code: '1002', name: '银行存款',     parent_id: null, category: 'asset',     direction: 'debit',  is_leaf: true, is_active: true },
  { id: 'acc-1122', tenant_id: TENANT_ID, code: '1122', name: '应收账款',     parent_id: null, category: 'asset',     direction: 'debit',  is_leaf: true, is_active: true },
  { id: 'acc-1601', tenant_id: TENANT_ID, code: '1601', name: '固定资产',     parent_id: null, category: 'asset',     direction: 'debit',  is_leaf: true, is_active: true },
  { id: 'acc-1602', tenant_id: TENANT_ID, code: '1602', name: '累计折旧',     parent_id: null, category: 'asset',     direction: 'credit', is_leaf: true, is_active: true },
  // ── 负债 ─────────────────────────────────────────────────────────
  { id: 'acc-2202', tenant_id: TENANT_ID, code: '2202', name: '应付账款',     parent_id: null, category: 'liability', direction: 'credit', is_leaf: true, is_active: true },
  { id: 'acc-2211', tenant_id: TENANT_ID, code: '2211', name: '应付职工薪酬', parent_id: null, category: 'liability', direction: 'credit', is_leaf: true, is_active: true },
  { id: 'acc-2221', tenant_id: TENANT_ID, code: '2221', name: '应交税费',     parent_id: null, category: 'liability', direction: 'credit', is_leaf: true, is_active: true },
  // ── 费用 ─────────────────────────────────────────────────────────
  { id: 'acc-6601', tenant_id: TENANT_ID, code: '6601',    name: '销售费用',           parent_id: null, category: 'expense', direction: 'debit', is_leaf: false, is_active: true },
  { id: 'acc-6602', tenant_id: TENANT_ID, code: '6602',    name: '管理费用',           parent_id: null, category: 'expense', direction: 'debit', is_leaf: false, is_active: true },
  { id: 'acc-6602-1', tenant_id: TENANT_ID, code: '6602.01', name: '管理费用-工资',    parent_id: 'acc-6602', category: 'expense', direction: 'debit', is_leaf: true, is_active: true },
  { id: 'acc-6602-2', tenant_id: TENANT_ID, code: '6602.02', name: '管理费用-社保公积金', parent_id: 'acc-6602', category: 'expense', direction: 'debit', is_leaf: true, is_active: true },
  { id: 'acc-6602-3', tenant_id: TENANT_ID, code: '6602.03', name: '管理费用-折旧',     parent_id: 'acc-6602', category: 'expense', direction: 'debit', is_leaf: true, is_active: true },
  { id: 'acc-6602-4', tenant_id: TENANT_ID, code: '6602.04', name: '管理费用-差旅',     parent_id: 'acc-6602', category: 'expense', direction: 'debit', is_leaf: true, is_active: true },
  { id: 'acc-6602-5', tenant_id: TENANT_ID, code: '6602.05', name: '管理费用-办公',     parent_id: 'acc-6602', category: 'expense', direction: 'debit', is_leaf: true, is_active: true },
  { id: 'acc-6602-6', tenant_id: TENANT_ID, code: '6602.06', name: '管理费用-招待',     parent_id: 'acc-6602', category: 'expense', direction: 'debit', is_leaf: true, is_active: true },
  { id: 'acc-6603', tenant_id: TENANT_ID, code: '6603',    name: '财务费用',           parent_id: null, category: 'expense', direction: 'debit', is_leaf: true, is_active: true },
  { id: 'acc-6603-1', tenant_id: TENANT_ID, code: '6603.01', name: '财务费用-汇兑损益',  parent_id: 'acc-6603', category: 'expense', direction: 'debit', is_leaf: true, is_active: true },
  // ── 成本 ─────────────────────────────────────────────────────────
  { id: 'acc-5001', tenant_id: TENANT_ID, code: '5001', name: '主营业务收入', parent_id: null, category: 'revenue', direction: 'credit', is_leaf: true, is_active: true },
  { id: 'acc-5401', tenant_id: TENANT_ID, code: '5401', name: '主营业务成本', parent_id: null, category: 'cost',    direction: 'debit',  is_leaf: true, is_active: true },
];

export const MOCK_DEPARTMENTS: MfDepartment[] = [
  { id: 'dep-sales',     tenant_id: TENANT_ID, company_id: COMPANY_ID, code: 'D01', name: '国际销售部',   parent_id: null, headcount: 18, is_active: true, cost_center_id: 'cc-sales' },
  { id: 'dep-purchase',  tenant_id: TENANT_ID, company_id: COMPANY_ID, code: 'D02', name: '采购部',       parent_id: null, headcount: 9,  is_active: true, cost_center_id: 'cc-purchase' },
  { id: 'dep-logistics', tenant_id: TENANT_ID, company_id: COMPANY_ID, code: 'D03', name: '物流与仓储部', parent_id: null, headcount: 12, is_active: true, cost_center_id: 'cc-logistics' },
  { id: 'dep-qc',        tenant_id: TENANT_ID, company_id: COMPANY_ID, code: 'D04', name: '验货质检部',   parent_id: null, headcount: 14, is_active: true, cost_center_id: 'cc-qc' },
  { id: 'dep-finance',   tenant_id: TENANT_ID, company_id: COMPANY_ID, code: 'D05', name: '财务部',       parent_id: null, headcount: 6,  is_active: true, cost_center_id: 'cc-finance' },
  { id: 'dep-it',        tenant_id: TENANT_ID, company_id: COMPANY_ID, code: 'D06', name: 'IT/AI研发部',  parent_id: null, headcount: 7,  is_active: true, cost_center_id: 'cc-ai' },
  { id: 'dep-hr',        tenant_id: TENANT_ID, company_id: COMPANY_ID, code: 'D07', name: '人力行政部',   parent_id: null, headcount: 4,  is_active: true, cost_center_id: 'cc-hr' },
];

export const MOCK_COST_CENTERS: MfCostCenter[] = [
  { id: 'cc-sales',     tenant_id: TENANT_ID, company_id: COMPANY_ID, code: 'CC-SAL', name: '销售成本中心',   cc_type: 'department', is_active: true },
  { id: 'cc-purchase',  tenant_id: TENANT_ID, company_id: COMPANY_ID, code: 'CC-PUR', name: '采购成本中心',   cc_type: 'department', is_active: true },
  { id: 'cc-logistics', tenant_id: TENANT_ID, company_id: COMPANY_ID, code: 'CC-LOG', name: '物流成本中心',   cc_type: 'logistics',  is_active: true },
  { id: 'cc-warehouse', tenant_id: TENANT_ID, company_id: COMPANY_ID, code: 'CC-WHS', name: '仓储成本中心',   cc_type: 'warehouse',  is_active: true },
  { id: 'cc-qc',        tenant_id: TENANT_ID, company_id: COMPANY_ID, code: 'CC-QC',  name: '验货成本中心',   cc_type: 'department', is_active: true },
  { id: 'cc-finance',   tenant_id: TENANT_ID, company_id: COMPANY_ID, code: 'CC-FIN', name: '财务成本中心',   cc_type: 'department', is_active: true },
  { id: 'cc-ai',        tenant_id: TENANT_ID, company_id: COMPANY_ID, code: 'CC-AI',  name: 'AI成本中心',     cc_type: 'ai',         is_active: true },
  { id: 'cc-hr',        tenant_id: TENANT_ID, company_id: COMPANY_ID, code: 'CC-HR',  name: '人力成本中心',   cc_type: 'people',     is_active: true },
  { id: 'cc-shared',    tenant_id: TENANT_ID, company_id: COMPANY_ID, code: 'CC-SH',  name: '公共分摊成本中心', cc_type: 'shared',   is_active: true },
];

export const MOCK_EMPLOYEES: MfEmployee[] = [
  { id: 'emp-001', tenant_id: TENANT_ID, company_id: COMPANY_ID, employee_no: 'GSD0001', full_name: '赵敏',   department_id: 'dep-finance',   department_name: '财务部',     cost_center_id: 'cc-finance',   position: 'CFO',       hire_date: '2019-03-01', status: 'active', base_salary: 38000, currency: 'CNY', social_insurance_base: 25000, housing_fund_base: 25000, bank_name: '中国银行', bank_account: '6217 **** **** 0001' },
  { id: 'emp-002', tenant_id: TENANT_ID, company_id: COMPANY_ID, employee_no: 'GSD0002', full_name: '李建国', department_id: 'dep-sales',     department_name: '国际销售部', cost_center_id: 'cc-sales',     position: '销售总监',   hire_date: '2020-06-15', status: 'active', base_salary: 28000, currency: 'CNY', social_insurance_base: 25000, housing_fund_base: 25000 },
  { id: 'emp-003', tenant_id: TENANT_ID, company_id: COMPANY_ID, employee_no: 'GSD0003', full_name: '王晓妹', department_id: 'dep-sales',     department_name: '国际销售部', cost_center_id: 'cc-sales',     position: '区域经理',   hire_date: '2021-02-20', status: 'active', base_salary: 16000, currency: 'CNY', social_insurance_base: 16000, housing_fund_base: 16000 },
  { id: 'emp-004', tenant_id: TENANT_ID, company_id: COMPANY_ID, employee_no: 'GSD0004', full_name: '陈志强', department_id: 'dep-purchase',  department_name: '采购部',     cost_center_id: 'cc-purchase',  position: '采购主管',   hire_date: '2018-11-01', status: 'active', base_salary: 18000, currency: 'CNY', social_insurance_base: 18000, housing_fund_base: 18000 },
  { id: 'emp-005', tenant_id: TENANT_ID, company_id: COMPANY_ID, employee_no: 'GSD0005', full_name: '张丽华', department_id: 'dep-logistics', department_name: '物流与仓储部', cost_center_id: 'cc-logistics', position: '物流主管',  hire_date: '2020-08-10', status: 'active', base_salary: 14000, currency: 'CNY', social_insurance_base: 14000, housing_fund_base: 14000 },
  { id: 'emp-006', tenant_id: TENANT_ID, company_id: COMPANY_ID, employee_no: 'GSD0006', full_name: '刘大鹏', department_id: 'dep-qc',        department_name: '验货质检部', cost_center_id: 'cc-qc',        position: '验货组长',   hire_date: '2019-09-15', status: 'active', base_salary: 12000, currency: 'CNY', social_insurance_base: 12000, housing_fund_base: 12000 },
  { id: 'emp-007', tenant_id: TENANT_ID, company_id: COMPANY_ID, employee_no: 'GSD0007', full_name: '黄子涵', department_id: 'dep-it',        department_name: 'IT/AI研发部', cost_center_id: 'cc-ai',       position: 'AI 工程师',  hire_date: '2022-04-01', status: 'active', base_salary: 32000, currency: 'CNY', social_insurance_base: 25000, housing_fund_base: 25000 },
  { id: 'emp-008', tenant_id: TENANT_ID, company_id: COMPANY_ID, employee_no: 'GSD0008', full_name: '徐美玲', department_id: 'dep-hr',        department_name: '人力行政部', cost_center_id: 'cc-hr',        position: '人力主管',   hire_date: '2021-07-12', status: 'active', base_salary: 13000, currency: 'CNY', social_insurance_base: 13000, housing_fund_base: 13000 },
];

/** 演示：同一城市两套生效区间——新期间选用新版本，历史批次各行仍为入账快照 */
export const MOCK_SI_SCHEME_VERSIONS: MfSiSchemeVersion[] = [
  {
    id: 'si-sz-v2025-07',
    scheme_code: 'SZ-WORKERS',
    region_label: '广东省深圳市',
    label: '城镇职工五险 + 公积金（示范）',
    effective_from: '2025-07-01',
    effective_to: '2026-03-31',
    pension_company_pct: 15,
    pension_employee_pct: 8,
    medical_company_pct: 10,
    medical_employee_pct: 2,
    unemployment_company_pct: 0.5,
    unemployment_employee_pct: 0.5,
    injury_company_pct: 0.16,
    maternity_company_pct: 0.8,
    hf_company_pct: 12,
    hf_employee_pct: 12,
    notes: '演示费率；真实环境按 mf_si_scheme_versions + 封顶保底规则解析。',
  },
  {
    id: 'si-sz-v2026-04',
    scheme_code: 'SZ-WORKERS',
    region_label: '广东省深圳市',
    label: '城镇职工五险 + 公积金（示范 · 费率上调档）',
    effective_from: '2026-04-01',
    effective_to: null,
    pension_company_pct: 16,
    pension_employee_pct: 8,
    medical_company_pct: 10,
    medical_employee_pct: 2,
    unemployment_company_pct: 0.5,
    unemployment_employee_pct: 0.5,
    injury_company_pct: 0.16,
    maternity_company_pct: 0.8,
    hf_company_pct: 12,
    hf_employee_pct: 12,
    notes: '2026-04 起演示用「公司养老」比例调整；已锁定批次不使用本表回算。',
  },
];

const DEMO_SI_SCHEME_VER_ID = 'si-sz-v2026-04';
const DEMO_RULE_EFFECTIVE = '2026-04-01';
const DEMO_TAX_POLICY_ID = 'pit-simplified-demo-v1';

// ─── Payroll Run 2026-04 ────────────────────────────────────────────────────

export const MOCK_PAYSLIP_RUN: MfPayslipRun = {
  id: 'run-2026-04',
  tenant_id: TENANT_ID,
  company_id: COMPANY_ID,
  period_year: 2026,
  period_month: 4,
  run_no: 'PR-2026-04',
  status: 'approved',
  total_gross: 263_400,
  total_net: 197_510,
  total_tax: 18_640,
  total_si: 28_500,
  total_hf: 18_750,
  employee_count: MOCK_EMPLOYEES.length,
  voucher_id: 'vch-payroll-2026-04',
  approved_at: '2026-05-02T03:25:00Z',
  disbursed_at: '2026-05-05T06:10:00Z',
  si_scheme_version_id: DEMO_SI_SCHEME_VER_ID,
  payroll_tax_policy_version_id: DEMO_TAX_POLICY_ID,
  locked_at: '2026-05-02T03:25:00Z',
};

export const MOCK_PAYSLIPS: MfPayslip[] = MOCK_EMPLOYEES.map((emp, idx) => {
  const overtime = idx === 1 ? 2400 : idx === 4 ? 1200 : 0;
  const bonus = idx % 3 === 0 ? 3000 : 0;
  const commission = emp.department_id === 'dep-sales' ? 8500 - idx * 1200 : 0;
  const allowance = 800;
  const gross = emp.base_salary + overtime + bonus + commission + allowance;
  const siEmp = Math.round((emp.social_insurance_base || emp.base_salary) * 0.105);
  const siCo = Math.round((emp.social_insurance_base || emp.base_salary) * 0.2746);
  const hfEmp = Math.round((emp.housing_fund_base || emp.base_salary) * 0.12);
  const hfCo = Math.round((emp.housing_fund_base || emp.base_salary) * 0.12);
  const taxable = Math.max(0, gross - siEmp - hfEmp - 5000);
  const incomeTax = Math.round(taxable * 0.1);
  const net = gross - siEmp - hfEmp - incomeTax;
  const ccCode = MOCK_COST_CENTERS.find((c) => c.id === emp.cost_center_id)?.code ?? null;
  return {
    id: `payslip-${idx + 1}`,
    tenant_id: TENANT_ID,
    run_id: MOCK_PAYSLIP_RUN.id,
    employee_id: emp.id,
    employee_no: emp.employee_no,
    employee_name: emp.full_name,
    department_id: emp.department_id ?? null,
    department_name: emp.department_name ?? null,
    cost_center_id: emp.cost_center_id ?? null,
    snapshot_department_name: emp.department_name ?? null,
    snapshot_cost_center_code: ccCode,
    gross_pay: gross,
    base_salary: emp.base_salary,
    overtime_pay: overtime,
    bonus,
    commission,
    allowance,
    social_insurance_employee: siEmp,
    social_insurance_company: siCo,
    housing_fund_employee: hfEmp,
    housing_fund_company: hfCo,
    income_tax: incomeTax,
    other_deduction: 0,
    net_pay: net,
    currency: 'CNY',
    bank_name: emp.bank_name ?? '中国银行',
    bank_account: emp.bank_account ?? `6217 **** **** ${1000 + idx}`,
    paid_at: '2026-05-05T06:10:00Z',
  } satisfies MfPayslip;
});

export const MOCK_SI_RECORDS: MfSiRecord[] = MOCK_PAYSLIPS.map((p, idx) => ({
  id: `si-${idx + 1}`,
  tenant_id: TENANT_ID,
  company_id: COMPANY_ID,
  employee_id: p.employee_id,
  employee_name: p.employee_name,
  scheme_id: DEMO_SI_SCHEME_VER_ID,
  period_year: 2026,
  period_month: 4,
  si_base: MOCK_EMPLOYEES[idx].social_insurance_base || p.base_salary,
  hf_base: MOCK_EMPLOYEES[idx].housing_fund_base || p.base_salary,
  pension_company: Math.round((MOCK_EMPLOYEES[idx].social_insurance_base || p.base_salary) * 0.16),
  pension_employee: Math.round((MOCK_EMPLOYEES[idx].social_insurance_base || p.base_salary) * 0.08),
  medical_company: Math.round((MOCK_EMPLOYEES[idx].social_insurance_base || p.base_salary) * 0.1),
  medical_employee: Math.round((MOCK_EMPLOYEES[idx].social_insurance_base || p.base_salary) * 0.02),
  unemployment_company: Math.round((MOCK_EMPLOYEES[idx].social_insurance_base || p.base_salary) * 0.005),
  unemployment_employee: Math.round((MOCK_EMPLOYEES[idx].social_insurance_base || p.base_salary) * 0.005),
  injury_company: Math.round((MOCK_EMPLOYEES[idx].social_insurance_base || p.base_salary) * 0.0016),
  maternity_company: Math.round((MOCK_EMPLOYEES[idx].social_insurance_base || p.base_salary) * 0.008),
  housing_fund_company: p.housing_fund_company,
  housing_fund_employee: p.housing_fund_employee,
  total_company:
    p.social_insurance_company + p.housing_fund_company,
  total_employee:
    p.social_insurance_employee + p.housing_fund_employee,
  status: 'paid',
}));

function buildMockPayslipLines(p: MfPayslip, si: MfSiRecord): MfPayslipLine[] {
  const rows: MfPayslipLine[] = [];
  let lineNo = 1;
  const push = (partial: Omit<MfPayslipLine, 'id' | 'payslip_id' | 'run_id' | 'currency' | 'line_no'>) => {
    rows.push({
      id: `pl-${p.id}-${lineNo}`,
      payslip_id: p.id,
      run_id: p.run_id,
      line_no: lineNo++,
      currency: p.currency,
      ...partial,
    });
  };

  push({
    code: 'EARN_BASE',
    label: '基本工资',
    category: 'earning',
    amount: p.base_salary,
    memo: '月度固定薪酬',
  });
  if (p.overtime_pay > 0) {
    push({ code: 'EARN_OT', label: '加班工资', category: 'earning', amount: p.overtime_pay });
  }
  if (p.bonus > 0) {
    push({ code: 'EARN_BONUS', label: '奖金', category: 'earning', amount: p.bonus });
  }
  if (p.commission > 0) {
    push({ code: 'EARN_COMM', label: '提成', category: 'earning', amount: p.commission, memo: '国际销售等业务绩效' });
  }
  if (p.allowance > 0) {
    push({ code: 'EARN_ALLOW', label: '津贴补贴', category: 'earning', amount: p.allowance });
  }

  const siBase = si.si_base ?? null;
  const hfBase = si.hf_base ?? null;

  push({
    code: 'DED_PENSION_EMP',
    label: '基本养老保险（个人）',
    category: 'deduction',
    amount: si.pension_employee,
    applied_base: siBase,
    rate_pct: 8,
    scheme_version_id: DEMO_SI_SCHEME_VER_ID,
    rule_effective_from: DEMO_RULE_EFFECTIVE,
  });
  push({
    code: 'DED_MEDICAL_EMP',
    label: '基本医疗保险（个人）',
    category: 'deduction',
    amount: si.medical_employee,
    applied_base: siBase,
    rate_pct: 2,
    scheme_version_id: DEMO_SI_SCHEME_VER_ID,
    rule_effective_from: DEMO_RULE_EFFECTIVE,
  });
  push({
    code: 'DED_UNEMP_EMP',
    label: '失业保险（个人）',
    category: 'deduction',
    amount: si.unemployment_employee,
    applied_base: siBase,
    rate_pct: 0.5,
    scheme_version_id: DEMO_SI_SCHEME_VER_ID,
    rule_effective_from: DEMO_RULE_EFFECTIVE,
  });
  push({
    code: 'DED_HF_EMP',
    label: '住房公积金（个人）',
    category: 'deduction',
    amount: p.housing_fund_employee,
    applied_base: hfBase,
    rate_pct: 12,
    scheme_version_id: DEMO_SI_SCHEME_VER_ID,
    rule_effective_from: DEMO_RULE_EFFECTIVE,
  });
  push({
    code: 'DED_IIT',
    label: '个人所得税（代扣）',
    category: 'deduction',
    amount: p.income_tax,
    memo: `预扣政策版本 ${DEMO_TAX_POLICY_ID}（演示简易累进）`,
  });

  push({
    code: 'ER_PENSION_CO',
    label: '基本养老保险（公司）',
    category: 'employer_cost',
    amount: si.pension_company,
    applied_base: siBase,
    rate_pct: 16,
    scheme_version_id: DEMO_SI_SCHEME_VER_ID,
    rule_effective_from: DEMO_RULE_EFFECTIVE,
    memo: '计入人力成本·不进入员工实发',
  });
  push({
    code: 'ER_MEDICAL_CO',
    label: '基本医疗保险（公司）',
    category: 'employer_cost',
    amount: si.medical_company,
    applied_base: siBase,
    rate_pct: 10,
    scheme_version_id: DEMO_SI_SCHEME_VER_ID,
    rule_effective_from: DEMO_RULE_EFFECTIVE,
    memo: '计入人力成本·不进入员工实发',
  });
  push({
    code: 'ER_UNEMP_CO',
    label: '失业保险（公司）',
    category: 'employer_cost',
    amount: si.unemployment_company,
    applied_base: siBase,
    rate_pct: 0.5,
    scheme_version_id: DEMO_SI_SCHEME_VER_ID,
    rule_effective_from: DEMO_RULE_EFFECTIVE,
    memo: '计入人力成本·不进入员工实发',
  });
  push({
    code: 'ER_INJURY',
    label: '工伤保险（公司）',
    category: 'employer_cost',
    amount: si.injury_company,
    applied_base: siBase,
    rate_pct: 0.16,
    scheme_version_id: DEMO_SI_SCHEME_VER_ID,
    rule_effective_from: DEMO_RULE_EFFECTIVE,
    memo: '计入人力成本·不进入员工实发',
  });
  push({
    code: 'ER_MATERNITY',
    label: '生育保险（公司）',
    category: 'employer_cost',
    amount: si.maternity_company,
    applied_base: siBase,
    rate_pct: 0.8,
    scheme_version_id: DEMO_SI_SCHEME_VER_ID,
    rule_effective_from: DEMO_RULE_EFFECTIVE,
    memo: '计入人力成本·不进入员工实发',
  });
  push({
    code: 'ER_HF_CO',
    label: '住房公积金（公司）',
    category: 'employer_cost',
    amount: p.housing_fund_company,
    applied_base: hfBase,
    rate_pct: 12,
    scheme_version_id: DEMO_SI_SCHEME_VER_ID,
    rule_effective_from: DEMO_RULE_EFFECTIVE,
    memo: '计入人力成本·不进入员工实发',
  });

  return rows;
}

export const MOCK_PAYSLIP_LINES: MfPayslipLine[] = MOCK_PAYSLIPS.flatMap((p, idx) =>
  buildMockPayslipLines(p, MOCK_SI_RECORDS[idx]),
);

// ─── Fixed Assets ────────────────────────────────────────────────────────────

export const MOCK_ASSETS: MfAsset[] = [
  {
    id: 'ast-001', tenant_id: TENANT_ID, company_id: COMPANY_ID,
    asset_no: 'FA-2024-001', name: '车间叉车（5吨电动）',  category: 'machinery',
    acquisition_date: '2024-03-15', acquisition_cost: 86_000, salvage_value: 4_300,
    useful_life_months: 60, depreciation_method: 'straight_line',
    currency: 'CNY', department_id: 'dep-logistics', department_name: '物流与仓储部', cost_center_id: 'cc-warehouse',
    location: '深圳前海保税仓 B12', status: 'in_use',
    accumulated_depreciation: 23_700, net_book_value: 62_300,
  },
  {
    id: 'ast-002', tenant_id: TENANT_ID, company_id: COMPANY_ID,
    asset_no: 'FA-2023-007', name: '商务车（别克 GL8）', category: 'vehicle',
    acquisition_date: '2023-06-08', acquisition_cost: 358_000, salvage_value: 30_000,
    useful_life_months: 96, depreciation_method: 'straight_line',
    currency: 'CNY', department_id: 'dep-sales', department_name: '国际销售部', cost_center_id: 'cc-sales',
    location: '深圳办公楼地下 P2-08', status: 'in_use',
    accumulated_depreciation: 95_440, net_book_value: 262_560,
  },
  {
    id: 'ast-003', tenant_id: TENANT_ID, company_id: COMPANY_ID,
    asset_no: 'FA-2024-012', name: 'GPU 服务器（H100 ×4）', category: 'electronics',
    acquisition_date: '2024-09-22', acquisition_cost: 920_000, salvage_value: 46_000,
    useful_life_months: 36, depreciation_method: 'straight_line',
    currency: 'CNY', department_id: 'dep-it', department_name: 'IT/AI研发部', cost_center_id: 'cc-ai',
    location: '深圳总部 4F 数据中心', status: 'in_use',
    accumulated_depreciation: 161_500, net_book_value: 758_500,
  },
  {
    id: 'ast-004', tenant_id: TENANT_ID, company_id: COMPANY_ID,
    asset_no: 'FA-2022-018', name: '办公家具（销售大开间）', category: 'other',
    acquisition_date: '2022-11-01', acquisition_cost: 180_000, salvage_value: 9_000,
    useful_life_months: 120, depreciation_method: 'straight_line',
    currency: 'CNY', department_id: 'dep-sales', department_name: '国际销售部', cost_center_id: 'cc-sales',
    location: '深圳总部 3F', status: 'in_use',
    accumulated_depreciation: 49_400, net_book_value: 130_600,
  },
  {
    id: 'ast-005', tenant_id: TENANT_ID, company_id: COMPANY_ID,
    asset_no: 'FA-2025-002', name: '验货设备包（防爆 + 计量）', category: 'machinery',
    acquisition_date: '2025-04-09', acquisition_cost: 56_400, salvage_value: 2_820,
    useful_life_months: 60, depreciation_method: 'straight_line',
    currency: 'CNY', department_id: 'dep-qc', department_name: '验货质检部', cost_center_id: 'cc-qc',
    location: '深圳前海保税仓 A03', status: 'in_use',
    accumulated_depreciation: 11_600, net_book_value: 44_800,
  },
  {
    id: 'ast-006', tenant_id: TENANT_ID, company_id: COMPANY_ID,
    asset_no: 'FA-2021-003', name: '旧打印复印一体机', category: 'electronics',
    acquisition_date: '2021-02-12', acquisition_cost: 8_900, salvage_value: 0,
    useful_life_months: 60, depreciation_method: 'straight_line',
    currency: 'CNY', department_id: 'dep-hr', department_name: '人力行政部', cost_center_id: 'cc-hr',
    location: '深圳总部 5F', status: 'idle',
    accumulated_depreciation: 8_900, net_book_value: 0,
  },
];

export const MOCK_DEPRECIATION: MfDepreciationRow[] = MOCK_ASSETS.flatMap((a, idx) => {
  const monthly = (a.acquisition_cost - a.salvage_value) / a.useful_life_months;
  return [3, 4].map((m, i) => ({
    id: `depr-${a.id}-${m}`,
    tenant_id: TENANT_ID,
    asset_id: a.id,
    period_year: 2026,
    period_month: m,
    amount: Math.round(monthly),
    accumulated: Math.round(monthly * (12 + idx) + i * monthly),
    net_book_value: Math.round(a.net_book_value - i * monthly),
    voucher_id: m === 3 ? `vch-depr-2026-${m}` : null,
    status: m === 3 ? 'posted' : 'planned',
    posted_at: m === 3 ? '2026-04-01T02:00:00Z' : null,
  } satisfies MfDepreciationRow));
});

// ─── Expense Claims ──────────────────────────────────────────────────────────

export const MOCK_EXPENSE_CLAIMS: MfExpenseClaim[] = [
  { id: 'exp-001', tenant_id: TENANT_ID, company_id: COMPANY_ID, claim_no: 'BX-2026-04-018', applicant_name: '王晓妹', department_id: 'dep-sales',     cost_center_id: 'cc-sales',     total_amount:  8_640, currency: 'CNY', exchange_rate: 1, reason: '广交会差旅、客户招待',           status: 'approved',  submitted_at: '2026-05-02', approved_at: '2026-05-03', voucher_id: 'vch-exp-001' },
  { id: 'exp-002', tenant_id: TENANT_ID, company_id: COMPANY_ID, claim_no: 'BX-2026-05-001', applicant_name: '陈志强', department_id: 'dep-purchase',  cost_center_id: 'cc-purchase',  total_amount: 12_300, currency: 'CNY', exchange_rate: 1, reason: '宁波/义乌供应商考察',           status: 'submitted', submitted_at: '2026-05-08' },
  { id: 'exp-003', tenant_id: TENANT_ID, company_id: COMPANY_ID, claim_no: 'BX-2026-05-002', applicant_name: '黄子涵', department_id: 'dep-it',        cost_center_id: 'cc-ai',        total_amount: 18_900, currency: 'USD', exchange_rate: 7.20, reason: 'GPT-5 API & 训练数据集订购', status: 'approved',  submitted_at: '2026-05-06', approved_at: '2026-05-07', voucher_id: 'vch-exp-003' },
  { id: 'exp-004', tenant_id: TENANT_ID, company_id: COMPANY_ID, claim_no: 'BX-2026-05-003', applicant_name: '徐美玲', department_id: 'dep-hr',        cost_center_id: 'cc-hr',        total_amount:  3_600, currency: 'CNY', exchange_rate: 1, reason: '员工生日福利 + 团建',           status: 'paid',      submitted_at: '2026-05-09', approved_at: '2026-05-10', paid_at: '2026-05-12', voucher_id: 'vch-exp-004' },
  { id: 'exp-005', tenant_id: TENANT_ID, company_id: COMPANY_ID, claim_no: 'BX-2026-05-004', applicant_name: '刘大鹏', department_id: 'dep-qc',        cost_center_id: 'cc-qc',        total_amount:  2_100, currency: 'CNY', exchange_rate: 1, reason: '汕头工厂验货差旅',              status: 'rejected',  submitted_at: '2026-05-09' },
  { id: 'exp-006', tenant_id: TENANT_ID, company_id: COMPANY_ID, claim_no: 'BX-2026-05-005', applicant_name: '李建国', department_id: 'dep-sales',     cost_center_id: 'cc-sales',     total_amount:  6_500, currency: 'EUR', exchange_rate: 7.85, reason: '德国客户拜访 + 展会差旅',         status: 'submitted', submitted_at: '2026-05-11' },
];

// ─── Budgets ─────────────────────────────────────────────────────────────────

export const MOCK_BUDGET: MfBudget = {
  id: 'bud-2026',
  tenant_id: TENANT_ID,
  company_id: COMPANY_ID,
  scope: 'company',
  scope_label: '高盛达富（深圳）2026 全公司预算',
  fiscal_year: 2026,
  granularity: 'monthly',
  currency: 'CNY',
  status: 'approved',
  total_amount: 14_650_000,
};

export const MOCK_BUDGET_LINES: MfBudgetLine[] = [
  { id: 'bdl-001', tenant_id: TENANT_ID, budget_id: MOCK_BUDGET.id, category: '工资薪酬',  period_year: 2026, period_month: 4, planned_amount: 280_000, actual_amount: 263_400, variance_amount: -16_600, variance_pct: -0.0593 },
  { id: 'bdl-002', tenant_id: TENANT_ID, budget_id: MOCK_BUDGET.id, category: '社保公积金', period_year: 2026, period_month: 4, planned_amount:  85_000, actual_amount:  78_900, variance_amount:  -6_100, variance_pct: -0.0718 },
  { id: 'bdl-003', tenant_id: TENANT_ID, budget_id: MOCK_BUDGET.id, category: '差旅招待',  period_year: 2026, period_month: 4, planned_amount:  45_000, actual_amount:  62_300, variance_amount:  17_300, variance_pct:  0.3844 },
  { id: 'bdl-004', tenant_id: TENANT_ID, budget_id: MOCK_BUDGET.id, category: '物流费用',  period_year: 2026, period_month: 4, planned_amount: 320_000, actual_amount: 298_500, variance_amount: -21_500, variance_pct: -0.0672 },
  { id: 'bdl-005', tenant_id: TENANT_ID, budget_id: MOCK_BUDGET.id, category: '仓储费用',  period_year: 2026, period_month: 4, planned_amount:  72_000, actual_amount:  68_200, variance_amount:  -3_800, variance_pct: -0.0528 },
  { id: 'bdl-006', tenant_id: TENANT_ID, budget_id: MOCK_BUDGET.id, category: 'IT/AI 投入', period_year: 2026, period_month: 4, planned_amount: 180_000, actual_amount: 215_700, variance_amount:  35_700, variance_pct:  0.1983 },
  { id: 'bdl-007', tenant_id: TENANT_ID, budget_id: MOCK_BUDGET.id, category: '办公费用',  period_year: 2026, period_month: 4, planned_amount:  28_000, actual_amount:  21_300, variance_amount:  -6_700, variance_pct: -0.2393 },
  { id: 'bdl-008', tenant_id: TENANT_ID, budget_id: MOCK_BUDGET.id, category: '折旧分摊',  period_year: 2026, period_month: 4, planned_amount:  35_000, actual_amount:  34_180, variance_amount:    -820, variance_pct: -0.0234 },
];

export const MOCK_BUDGET_ALERTS: MfBudgetAlert[] = [
  { id: 'bda-001', tenant_id: TENANT_ID, company_id: COMPANY_ID, budget_id: MOCK_BUDGET.id, line_id: 'bdl-003', severity: 'warn',     message: '差旅招待已超预算 38.4%，连续两月偏高，建议复核销售部门差旅政策',  triggered_at: '2026-05-01T08:00:00Z' },
  { id: 'bda-002', tenant_id: TENANT_ID, company_id: COMPANY_ID, budget_id: MOCK_BUDGET.id, line_id: 'bdl-006', severity: 'danger',   message: 'IT/AI 投入超预算 19.8%，主要由 GPT-5 token 使用量上升驱动',         triggered_at: '2026-05-04T03:20:00Z' },
  { id: 'bda-003', tenant_id: TENANT_ID, company_id: COMPANY_ID, budget_id: MOCK_BUDGET.id, line_id: 'bdl-007', severity: 'info',     message: '办公费用低于预算 23.9%，可考虑挪用至 IT 投入或差旅',                triggered_at: '2026-05-04T04:00:00Z' },
];

// ─── Profit Snapshots ────────────────────────────────────────────────────────

const baseProfit = (overrides: Partial<MfProfitSnapshot>): MfProfitSnapshot => ({
  id: overrides.id ?? 'p-' + Math.random(),
  tenant_id: TENANT_ID,
  company_id: COMPANY_ID,
  scope: 'department',
  period_year: 2026,
  period_month: 4,
  revenue: 0,
  cost_purchase: 0,
  cost_labor: 0,
  cost_logistics: 0,
  cost_warehouse: 0,
  cost_tax: 0,
  cost_depreciation: 0,
  cost_fx: 0,
  cost_overhead: 0,
  cost_ai: 0,
  total_cost: 0,
  gross_profit: 0,
  margin_pct: 0,
  currency: 'CNY',
  computed_at: new Date().toISOString(),
  ...overrides,
});

const buildProfit = (p: Partial<MfProfitSnapshot>): MfProfitSnapshot => {
  const r = baseProfit(p);
  r.total_cost =
    r.cost_purchase + r.cost_labor + r.cost_logistics + r.cost_warehouse +
    r.cost_tax + r.cost_depreciation + r.cost_fx + r.cost_overhead + r.cost_ai;
  r.gross_profit = r.revenue - r.total_cost;
  r.margin_pct = r.revenue === 0 ? 0 : r.gross_profit / r.revenue;
  return r;
};

export const MOCK_DEPT_PROFITS: MfProfitSnapshot[] = [
  buildProfit({ id: 'pf-d-01', scope: 'department', scope_ref_id: 'dep-sales',     scope_ref_no: 'D01', scope_label: '国际销售部',   revenue: 4_120_000, cost_purchase: 2_350_000, cost_labor: 180_000, cost_logistics: 280_000, cost_warehouse:  62_000, cost_tax: 165_000, cost_depreciation: 22_000, cost_fx:  18_500, cost_overhead: 42_000, cost_ai:   8_200 }),
  buildProfit({ id: 'pf-d-02', scope: 'department', scope_ref_id: 'dep-purchase',  scope_ref_no: 'D02', scope_label: '采购部',       revenue:         0, cost_purchase:         0, cost_labor: 102_000, cost_logistics:  41_000, cost_warehouse:   8_000, cost_tax:       0, cost_depreciation:  4_500, cost_fx:       0, cost_overhead: 12_000, cost_ai:   3_200 }),
  buildProfit({ id: 'pf-d-03', scope: 'department', scope_ref_id: 'dep-logistics', scope_ref_no: 'D03', scope_label: '物流与仓储部', revenue:    62_000, cost_purchase:         0, cost_labor:  98_000, cost_logistics:  18_000, cost_warehouse:  42_000, cost_tax:       0, cost_depreciation: 16_000, cost_fx:       0, cost_overhead:  6_500, cost_ai:   1_400 }),
  buildProfit({ id: 'pf-d-04', scope: 'department', scope_ref_id: 'dep-qc',        scope_ref_no: 'D04', scope_label: '验货质检部',   revenue:   145_000, cost_purchase:         0, cost_labor: 102_000, cost_logistics:   7_500, cost_warehouse:   3_500, cost_tax:       0, cost_depreciation:  3_400, cost_fx:       0, cost_overhead:  5_000, cost_ai:     800 }),
  buildProfit({ id: 'pf-d-05', scope: 'department', scope_ref_id: 'dep-finance',   scope_ref_no: 'D05', scope_label: '财务部',       revenue:         0, cost_purchase:         0, cost_labor:  98_000, cost_logistics:       0, cost_warehouse:       0, cost_tax:       0, cost_depreciation:  1_200, cost_fx:       0, cost_overhead:  3_200, cost_ai:   2_800 }),
  buildProfit({ id: 'pf-d-06', scope: 'department', scope_ref_id: 'dep-it',        scope_ref_no: 'D06', scope_label: 'IT/AI研发部',  revenue:   38_500, cost_purchase:         0, cost_labor: 138_000, cost_logistics:       0, cost_warehouse:       0, cost_tax:       0, cost_depreciation: 25_300, cost_fx:       0, cost_overhead:  4_800, cost_ai: 215_700 }),
];

export const MOCK_ORDER_PROFITS: MfProfitSnapshot[] = [
  buildProfit({ id: 'pf-o-01', scope: 'order',   scope_ref_no: 'ORD-2026-0418', scope_label: 'ABC Trading Ltd. · 货柜照明项目', currency: 'USD', revenue: 125_000, cost_purchase:  78_500, cost_labor:  4_200, cost_logistics: 12_800, cost_warehouse: 1_200, cost_tax: 3_500, cost_depreciation:    480, cost_fx:    320, cost_overhead: 1_800, cost_ai:   180 }),
  buildProfit({ id: 'pf-o-02', scope: 'order',   scope_ref_no: 'ORD-2026-0521', scope_label: 'EuroHome GmbH · 卫浴专项',         currency: 'EUR', revenue:  89_000, cost_purchase:  56_400, cost_labor:  3_100, cost_logistics:  9_600, cost_warehouse:   800, cost_tax: 1_600, cost_depreciation:    260, cost_fx:    480, cost_overhead: 1_200, cost_ai:   120 }),
  buildProfit({ id: 'pf-o-03', scope: 'order',   scope_ref_no: 'ORD-2026-0625', scope_label: 'Industrial Supply Hub · 五金',     currency: 'USD', revenue: 156_000, cost_purchase: 108_400, cost_labor:  5_200, cost_logistics: 16_300, cost_warehouse: 1_400, cost_tax: 4_200, cost_depreciation:    520, cost_fx:    640, cost_overhead: 2_100, cost_ai:   200 }),
  buildProfit({ id: 'pf-o-04', scope: 'order',   scope_ref_no: 'ORD-2026-0701', scope_label: 'BuildMart UK · 钢材+水泥项目',     currency: 'GBP', revenue:  68_000, cost_purchase:  43_200, cost_labor:  2_400, cost_logistics:  7_900, cost_warehouse:   620, cost_tax: 1_300, cost_depreciation:    180, cost_fx:    260, cost_overhead:   900, cost_ai:    80 }),
];

// ─── Vouchers ────────────────────────────────────────────────────────────────

export const MOCK_VOUCHERS: MfVoucher[] = [
  { id: 'vch-payroll-2026-04', tenant_id: TENANT_ID, company_id: COMPANY_ID, voucher_no: 'JE-2026-04-0091', voucher_type: 'PAYROLL',      voucher_date: '2026-04-30', description: '2026年4月工资计提（70人）',              amount: 263_400, currency: 'CNY', exchange_rate: 1, status: 'posted', source_module: 'payroll',   source_ref: MOCK_PAYSLIP_RUN.id, posted_at: '2026-04-30T10:00:00Z' },
  { id: 'vch-depr-2026-3',    tenant_id: TENANT_ID, company_id: COMPANY_ID, voucher_no: 'JE-2026-03-0124', voucher_type: 'DEPRECIATION', voucher_date: '2026-03-31', description: '2026年3月固定资产折旧',                  amount:  34_180, currency: 'CNY', exchange_rate: 1, status: 'posted', source_module: 'asset',     source_ref: 'depr-2026-03',     posted_at: '2026-04-01T02:00:00Z' },
  { id: 'vch-exp-001',        tenant_id: TENANT_ID, company_id: COMPANY_ID, voucher_no: 'JE-2026-05-0015', voucher_type: 'EXPENSE',      voucher_date: '2026-05-03', description: '王晓妹·广交会差旅招待报销',                amount:   8_640, currency: 'CNY', exchange_rate: 1, status: 'posted', source_module: 'expense',   source_ref: 'exp-001',           posted_at: '2026-05-03T08:10:00Z' },
  { id: 'vch-exp-003',        tenant_id: TENANT_ID, company_id: COMPANY_ID, voucher_no: 'JE-2026-05-0021', voucher_type: 'EXPENSE',      voucher_date: '2026-05-07', description: 'GPT-5 API/数据集订购（USD折算）',          amount: 136_080, currency: 'CNY', exchange_rate: 7.20, status: 'posted', source_module: 'expense', source_ref: 'exp-003',           posted_at: '2026-05-07T05:25:00Z' },
  { id: 'vch-exp-004',        tenant_id: TENANT_ID, company_id: COMPANY_ID, voucher_no: 'JE-2026-05-0024', voucher_type: 'EXPENSE',      voucher_date: '2026-05-12', description: '员工生日福利 + 5月团建',                  amount:   3_600, currency: 'CNY', exchange_rate: 1, status: 'posted', source_module: 'expense',   source_ref: 'exp-004',           posted_at: '2026-05-12T06:00:00Z' },
  { id: 'vch-ai-001',         tenant_id: TENANT_ID, company_id: COMPANY_ID, voucher_no: 'JE-2026-05-0026', voucher_type: 'AI',            voucher_date: '2026-05-13', description: 'AI 凭证建议：4月销售部费用归集（草稿）',     amount:  42_800, currency: 'CNY', exchange_rate: 1, status: 'draft',  source_module: 'ai',        source_ref: 'ai-job-005' },
];

export const MOCK_VOUCHER_LINES: MfVoucherLine[] = [
  // Payroll voucher
  { id: 'vl-p-1', voucher_id: 'vch-payroll-2026-04', tenant_id: TENANT_ID, line_no: 1, account_id: 'acc-6602-1', account_code: '6602.01', account_name: '管理费用-工资',     debit: 263_400, credit:       0, currency: 'CNY', exchange_rate: 1, memo: '2026年4月计提薪酬 (gross)' },
  { id: 'vl-p-2', voucher_id: 'vch-payroll-2026-04', tenant_id: TENANT_ID, line_no: 2, account_id: 'acc-2211',   account_code: '2211',    account_name: '应付职工薪酬',       debit:       0, credit: 263_400, currency: 'CNY', exchange_rate: 1, memo: '应付员工税前薪酬' },
  // Depreciation
  { id: 'vl-d-1', voucher_id: 'vch-depr-2026-3',     tenant_id: TENANT_ID, line_no: 1, account_id: 'acc-6602-3', account_code: '6602.03', account_name: '管理费用-折旧',     debit:  34_180, credit:       0, currency: 'CNY', exchange_rate: 1, memo: '2026年3月直线法折旧' },
  { id: 'vl-d-2', voucher_id: 'vch-depr-2026-3',     tenant_id: TENANT_ID, line_no: 2, account_id: 'acc-1602',   account_code: '1602',    account_name: '累计折旧',           debit:       0, credit:  34_180, currency: 'CNY', exchange_rate: 1, memo: '累计折旧增加' },
  // Expense 001
  { id: 'vl-e1-1', voucher_id: 'vch-exp-001', tenant_id: TENANT_ID, line_no: 1, account_id: 'acc-6602-4', account_code: '6602.04', account_name: '管理费用-差旅', debit: 8_640, credit:     0, currency: 'CNY', exchange_rate: 1, memo: '广交会差旅+招待' },
  { id: 'vl-e1-2', voucher_id: 'vch-exp-001', tenant_id: TENANT_ID, line_no: 2, account_id: 'acc-1002',   account_code: '1002',    account_name: '银行存款',     debit:     0, credit: 8_640, currency: 'CNY', exchange_rate: 1, memo: '工行 6217 *** 0007' },
  // Expense 003
  { id: 'vl-e3-1', voucher_id: 'vch-exp-003', tenant_id: TENANT_ID, line_no: 1, account_id: 'acc-6602-5', account_code: '6602.05', account_name: '管理费用-办公', debit: 136_080, credit:       0, currency: 'CNY', exchange_rate: 1, memo: 'GPT-5 + 训练数据 (USD折算)' },
  { id: 'vl-e3-2', voucher_id: 'vch-exp-003', tenant_id: TENANT_ID, line_no: 2, account_id: 'acc-1002',   account_code: '1002',    account_name: '银行存款',     debit:       0, credit: 136_080, currency: 'CNY', exchange_rate: 1, memo: '招行 USD 账户' },
  // Expense 004
  { id: 'vl-e4-1', voucher_id: 'vch-exp-004', tenant_id: TENANT_ID, line_no: 1, account_id: 'acc-6602-5', account_code: '6602.05', account_name: '管理费用-办公', debit: 3_600,  credit:     0, currency: 'CNY', exchange_rate: 1, memo: '员工福利+团建' },
  { id: 'vl-e4-2', voucher_id: 'vch-exp-004', tenant_id: TENANT_ID, line_no: 2, account_id: 'acc-1002',   account_code: '1002',    account_name: '银行存款',     debit:     0, credit: 3_600, currency: 'CNY', exchange_rate: 1 },
  // AI Draft
  { id: 'vl-ai-1', voucher_id: 'vch-ai-001', tenant_id: TENANT_ID, line_no: 1, account_id: 'acc-6601',   account_code: '6601',    account_name: '销售费用',     debit: 42_800, credit:      0, currency: 'CNY', exchange_rate: 1, memo: 'AI 归集：销售部 4 月辅料费 (置信度 92%)' },
  { id: 'vl-ai-2', voucher_id: 'vch-ai-001', tenant_id: TENANT_ID, line_no: 2, account_id: 'acc-1002',   account_code: '1002',    account_name: '银行存款',     debit:      0, credit: 42_800, currency: 'CNY', exchange_rate: 1, memo: '建议: 中行 CNY 主账户' },
];

export const MOCK_AI_JOBS: MfAiJob[] = [
  { id: 'ai-job-001', tenant_id: TENANT_ID, company_id: COMPANY_ID, job_type: 'profit_analysis',   status: 'succeeded', result_summary: '订单 ORD-2026-0418 真实毛利率 17.8%（低于阈值 22%），主要拖累项：海运 +14% / 汇兑 +6%', cost_tokens: 18_400,  cost_usd: 0.46,  started_at: '2026-05-12T03:00:00Z', finished_at: '2026-05-12T03:04:25Z', created_at: '2026-05-12T03:00:00Z' },
  { id: 'ai-job-002', tenant_id: TENANT_ID, company_id: COMPANY_ID, job_type: 'expense_anomaly',   status: 'succeeded', result_summary: '检测到 3 笔差旅报销在金额/时间窗口上偏离班组均值 > 2σ，建议人工复核',                    cost_tokens:  9_320,  cost_usd: 0.23,  started_at: '2026-05-11T08:10:00Z', finished_at: '2026-05-11T08:11:18Z', created_at: '2026-05-11T08:10:00Z' },
  { id: 'ai-job-003', tenant_id: TENANT_ID, company_id: COMPANY_ID, job_type: 'cashflow_forecast', status: 'succeeded', result_summary: '未来 8 周现金流预测：周 6 出现负缺口 ¥-280K，建议提前催收 AR-2026-031 / AR-2026-037', cost_tokens: 21_800,  cost_usd: 0.54,  started_at: '2026-05-13T01:00:00Z', finished_at: '2026-05-13T01:06:11Z', created_at: '2026-05-13T01:00:00Z' },
  { id: 'ai-job-004', tenant_id: TENANT_ID, company_id: COMPANY_ID, job_type: 'budget_forecast',   status: 'running',   result_summary: '正在基于近 12 月数据预测 Q3 IT/AI 预算 ...',                                            cost_tokens:      0,  cost_usd: 0.0,    started_at: '2026-05-14T00:30:00Z',                                  created_at: '2026-05-14T00:30:00Z' },
  { id: 'ai-job-005', tenant_id: TENANT_ID, company_id: COMPANY_ID, job_type: 'voucher_suggestion', status: 'succeeded', result_summary: '生成草稿凭证 JE-2026-05-0026 （销售部 4 月辅料费），置信度 92%',                       cost_tokens:  5_120,  cost_usd: 0.12,  started_at: '2026-05-13T07:00:00Z', finished_at: '2026-05-13T07:00:46Z', created_at: '2026-05-13T07:00:00Z' },
];

export const MOCK_AUDIT_LOGS: MfAuditLog[] = [
  { id: 'al-001', tenant_id: TENANT_ID, company_id: COMPANY_ID, actor_email: 'zhaomin@gsd.cn',  module: 'payroll', action: 'approve', entity: 'mf_payslip_runs',  entity_id: MOCK_PAYSLIP_RUN.id,                          created_at: '2026-05-02T03:25:00Z' },
  { id: 'al-002', tenant_id: TENANT_ID, company_id: COMPANY_ID, actor_email: 'zhaomin@gsd.cn',  module: 'voucher', action: 'post',    entity: 'mf_vouchers',      entity_id: 'vch-payroll-2026-04',                       created_at: '2026-04-30T10:00:00Z' },
  { id: 'al-003', tenant_id: TENANT_ID, company_id: COMPANY_ID, actor_email: 'system',          module: 'asset',   action: 'post',    entity: 'mf_vouchers',      entity_id: 'vch-depr-2026-3',                            created_at: '2026-04-01T02:00:00Z' },
  { id: 'al-004', tenant_id: TENANT_ID, company_id: COMPANY_ID, actor_email: 'lijianguo@gsd.cn', module: 'expense', action: 'submit', entity: 'mf_expense_claims',entity_id: 'exp-006',                                    created_at: '2026-05-11T09:00:00Z' },
  { id: 'al-005', tenant_id: TENANT_ID, company_id: COMPANY_ID, actor_email: 'system',          module: 'ai',      action: 'run',    entity: 'mf_ai_jobs',       entity_id: 'ai-job-003',                                 created_at: '2026-05-13T01:00:00Z' },
];

// ─── Combined export ─────────────────────────────────────────────────────────

export const MOCK_MANAGEMENT_FINANCE_SEED = {
  tenant: MOCK_TENANT,
  companies: MOCK_COMPANIES,
  accounts: MOCK_ACCOUNTS,
  departments: MOCK_DEPARTMENTS,
  cost_centers: MOCK_COST_CENTERS,
  employees: MOCK_EMPLOYEES,
  payslip_run: MOCK_PAYSLIP_RUN,
  payslips: MOCK_PAYSLIPS,
  payslip_lines: MOCK_PAYSLIP_LINES,
  si_scheme_versions: MOCK_SI_SCHEME_VERSIONS,
  si_records: MOCK_SI_RECORDS,
  assets: MOCK_ASSETS,
  depreciation: MOCK_DEPRECIATION,
  expense_claims: MOCK_EXPENSE_CLAIMS,
  budget: MOCK_BUDGET,
  budget_lines: MOCK_BUDGET_LINES,
  budget_alerts: MOCK_BUDGET_ALERTS,
  dept_profits: MOCK_DEPT_PROFITS,
  order_profits: MOCK_ORDER_PROFITS,
  vouchers: MOCK_VOUCHERS,
  voucher_lines: MOCK_VOUCHER_LINES,
  ai_jobs: MOCK_AI_JOBS,
  audit_logs: MOCK_AUDIT_LOGS,
};
