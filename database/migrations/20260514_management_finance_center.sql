-- ============================================================================
-- 20260514 — Management Finance Center (内部管理财务模块)
-- ============================================================================
-- Owner: ERP Architecture Team
-- Scope: 业财一体化 + AI 经营分析  内部管理财务 10 大子模块的完整数据底座
--   01. 多租户 / 多公司基础                            (mf_tenants, mf_companies)
--   02. 总账与会计核算                                 (mf_accounts, mf_periods, mf_vouchers)
--   03. 成本中心 / 部门 / 项目                          (mf_cost_centers, mf_departments, mf_projects)
--   04. 费用管理                                       (mf_expense_*)
--   05. 工资与人力成本                                 (mf_employees, mf_salary_*, mf_payslips, mf_payslip_lines)
--   06. 社保公积金                                     (mf_social_insurance_*)
--   07. 固定资产                                       (mf_assets, mf_depreciation_schedule, mf_asset_maintenance)
--   08. 预算管理                                       (mf_budgets, mf_budget_lines, mf_budget_alerts)
--   09. 利润分析（部门/项目/订单）                      (mf_profit_*)
--   10. 自动凭证引擎 + 审计                            (mf_voucher_rules, mf_audit_logs, mf_ai_jobs)
--
-- Design principles
--   - Multi-tenant via `tenant_id` (root SaaS isolation)
--   - Multi-company via `company_id` (legal entity inside tenant)
--   - Multi-currency: `currency` + `exchange_rate` on every monetary table
--   - AI-ready: `mf_ai_jobs` for asynchronous analysis dispatch
--   - All business writes ride through Postgres -> RLS -> JWT claims
--   - Apply via: Supabase SQL Editor   /   psql   /   supabase db push
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. Common helpers
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

create or replace function public.mf_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- JWT helpers ------------------------------------------------------------------
create or replace function public.mf_current_tenant()
returns uuid language sql stable as $$
  select nullif(coalesce(
    auth.jwt() ->> 'tenant_id',
    auth.jwt() -> 'app_metadata' ->> 'tenant_id',
    auth.jwt() -> 'user_metadata' ->> 'tenant_id'
  ), '')::uuid;
$$;

create or replace function public.mf_current_company()
returns uuid language sql stable as $$
  select nullif(coalesce(
    auth.jwt() ->> 'company_id',
    auth.jwt() -> 'app_metadata' ->> 'company_id',
    auth.jwt() -> 'user_metadata' ->> 'company_id'
  ), '')::uuid;
$$;

create or replace function public.mf_has_role(p_roles text[])
returns boolean language sql stable as $$
  select coalesce(
    (auth.jwt() ->> 'portal_role') = any(p_roles)
    or (auth.jwt() -> 'app_metadata' ->> 'portal_role') = any(p_roles)
    or (auth.jwt() -> 'user_metadata' ->> 'portal_role') = any(p_roles),
    false
  );
$$;

create or replace function public.mf_is_finance()
returns boolean language sql stable as $$
  select public.mf_has_role(array[
    'admin','CEO','CFO','Finance','External_Accountant','Finance_Manager','Finance_Director'
  ]);
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Tenants & Companies (多租户 + 多公司)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.mf_tenants (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  name          text not null,
  plan          text not null default 'enterprise',
  base_currency text not null default 'CNY',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.mf_companies (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.mf_tenants(id) on delete cascade,
  code            text not null,
  name_cn         text not null,
  name_en         text,
  legal_entity    text,
  base_currency   text not null default 'CNY',
  reporting_currency text not null default 'CNY',
  fiscal_year_start_month smallint not null default 1 check (fiscal_year_start_month between 1 and 12),
  region          text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (tenant_id, code)
);

create index if not exists idx_mf_companies_tenant on public.mf_companies (tenant_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Exchange rates (multi-currency)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.mf_exchange_rates (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.mf_tenants(id) on delete cascade,
  from_currency text not null,
  to_currency   text not null,
  rate          numeric(18,8) not null,
  rate_date     date not null,
  source        text not null default 'manual',  -- manual | api | central_bank
  created_at    timestamptz not null default now(),
  unique (tenant_id, from_currency, to_currency, rate_date)
);

create index if not exists idx_mf_exchange_rates_date on public.mf_exchange_rates (rate_date desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Chart of Accounts (会计科目) + Periods (会计期间)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.mf_accounts (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.mf_tenants(id) on delete cascade,
  company_id    uuid references public.mf_companies(id) on delete cascade,
  code          text not null,                 -- e.g. 6602.01
  name          text not null,                 -- e.g. 管理费用-工资
  parent_id     uuid references public.mf_accounts(id) on delete restrict,
  category      text not null check (category in
                  ('asset','liability','equity','revenue','expense','cost')),
  direction     text not null check (direction in ('debit','credit')),
  is_leaf       boolean not null default true,
  is_active     boolean not null default true,
  description   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tenant_id, code)
);

create index if not exists idx_mf_accounts_company  on public.mf_accounts (tenant_id, company_id);
create index if not exists idx_mf_accounts_category on public.mf_accounts (category);

create table if not exists public.mf_periods (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.mf_tenants(id) on delete cascade,
  company_id    uuid not null references public.mf_companies(id) on delete cascade,
  year          smallint not null,
  month         smallint not null check (month between 1 and 12),
  status        text not null default 'open' check (status in ('open','closing','closed')),
  closed_at     timestamptz,
  closed_by     uuid,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (company_id, year, month)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Cost Centers / Departments / Projects (业财一体化的核心维度)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.mf_cost_centers (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.mf_tenants(id) on delete cascade,
  company_id    uuid not null references public.mf_companies(id) on delete cascade,
  code          text not null,
  name          text not null,
  cc_type       text not null check (cc_type in
                  ('department','project','warehouse','logistics','people','ai','shared')),
  parent_id     uuid references public.mf_cost_centers(id) on delete restrict,
  manager_user_id uuid,
  is_active     boolean not null default true,
  description   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (company_id, code)
);

create index if not exists idx_mf_cc_company on public.mf_cost_centers (tenant_id, company_id);
create index if not exists idx_mf_cc_type    on public.mf_cost_centers (cc_type);

create table if not exists public.mf_departments (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.mf_tenants(id) on delete cascade,
  company_id    uuid not null references public.mf_companies(id) on delete cascade,
  code          text not null,
  name          text not null,
  parent_id     uuid references public.mf_departments(id) on delete restrict,
  cost_center_id uuid references public.mf_cost_centers(id) on delete set null,
  manager_user_id uuid,
  headcount     integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (company_id, code)
);

create table if not exists public.mf_projects (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.mf_tenants(id) on delete cascade,
  company_id    uuid not null references public.mf_companies(id) on delete cascade,
  code          text not null,
  name          text not null,
  customer_id   uuid,
  cost_center_id uuid references public.mf_cost_centers(id) on delete set null,
  manager_user_id uuid,
  status        text not null default 'active'
                  check (status in ('planning','active','on_hold','completed','closed','cancelled')),
  start_date    date,
  end_date      date,
  contract_amount numeric(20,4),
  currency      text not null default 'USD',
  budget_amount numeric(20,4),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (company_id, code)
);

create index if not exists idx_mf_projects_company on public.mf_projects (tenant_id, company_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Vouchers (会计凭证) — 所有业务自动落地点
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.mf_vouchers (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.mf_tenants(id) on delete cascade,
  company_id      uuid not null references public.mf_companies(id) on delete cascade,
  period_id       uuid references public.mf_periods(id) on delete restrict,
  voucher_no      text not null,
  voucher_type    text not null default 'JE'
                    check (voucher_type in ('JE','PAYROLL','DEPRECIATION','EXPENSE','REVENUE','FX','ADJUST','OPENING','CLOSING','AI')),
  voucher_date    date not null,
  description     text,
  amount          numeric(20,4) not null default 0,
  currency        text not null default 'CNY',
  exchange_rate   numeric(18,8) not null default 1,
  status          text not null default 'draft'
                    check (status in ('draft','posted','approved','reversed','void')),
  source_module   text,  -- expense | payroll | asset | budget | manual | ai
  source_ref      text,  -- reference id of the originating business doc
  rule_id         uuid,  -- mf_voucher_rules
  created_by      uuid,
  posted_by       uuid,
  posted_at       timestamptz,
  reversed_by_voucher_id uuid references public.mf_vouchers(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (company_id, voucher_no)
);

create index if not exists idx_mf_vouchers_period on public.mf_vouchers (period_id);
create index if not exists idx_mf_vouchers_date   on public.mf_vouchers (voucher_date desc);
create index if not exists idx_mf_vouchers_src    on public.mf_vouchers (source_module, source_ref);

create table if not exists public.mf_voucher_lines (
  id              uuid primary key default gen_random_uuid(),
  voucher_id      uuid not null references public.mf_vouchers(id) on delete cascade,
  tenant_id       uuid not null references public.mf_tenants(id) on delete cascade,
  line_no         smallint not null,
  account_id      uuid not null references public.mf_accounts(id) on delete restrict,
  cost_center_id  uuid references public.mf_cost_centers(id) on delete set null,
  department_id   uuid references public.mf_departments(id) on delete set null,
  project_id      uuid references public.mf_projects(id) on delete set null,
  debit           numeric(20,4) not null default 0,
  credit          numeric(20,4) not null default 0,
  currency        text not null default 'CNY',
  fx_amount       numeric(20,4),
  exchange_rate   numeric(18,8) not null default 1,
  memo            text,
  created_at      timestamptz not null default now(),
  check ((debit = 0 and credit > 0) or (debit > 0 and credit = 0))
);

create index if not exists idx_mf_voucher_lines_voucher on public.mf_voucher_lines (voucher_id);
create index if not exists idx_mf_voucher_lines_account on public.mf_voucher_lines (account_id);
create index if not exists idx_mf_voucher_lines_cc      on public.mf_voucher_lines (cost_center_id);
create index if not exists idx_mf_voucher_lines_proj    on public.mf_voucher_lines (project_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Voucher Rule Engine (自动凭证引擎)
-- ─────────────────────────────────────────────────────────────────────────────
-- A rule maps a business event to a balanced voucher template.
-- `template` is a JSONB array of lines, each entry has:
--   { side: 'debit'|'credit', account_code: '6602.01', amount_expr: 'payload.gross_pay', cc_expr: 'payload.dept_code' }
-- The frontend / edge function resolves expressions and inserts a posted voucher.

create table if not exists public.mf_voucher_rules (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.mf_tenants(id) on delete cascade,
  company_id      uuid references public.mf_companies(id) on delete cascade,
  code            text not null,
  name            text not null,
  event_type      text not null,  -- e.g. payroll.run, expense.approved, asset.depreciation, ai.adjust
  template        jsonb not null,
  is_active       boolean not null default true,
  priority        smallint not null default 100,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (tenant_id, code)
);

create index if not exists idx_mf_voucher_rules_event on public.mf_voucher_rules (event_type);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Expense Management (费用管理)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.mf_expense_categories (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.mf_tenants(id) on delete cascade,
  code          text not null,
  name          text not null,
  account_id    uuid references public.mf_accounts(id) on delete set null,
  description   text,
  is_active     boolean not null default true,
  unique (tenant_id, code)
);

create table if not exists public.mf_expense_claims (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.mf_tenants(id) on delete cascade,
  company_id      uuid not null references public.mf_companies(id) on delete cascade,
  claim_no        text not null,
  applicant_user_id uuid,
  applicant_name  text,
  department_id   uuid references public.mf_departments(id) on delete set null,
  cost_center_id  uuid references public.mf_cost_centers(id) on delete set null,
  project_id      uuid references public.mf_projects(id) on delete set null,
  total_amount    numeric(20,4) not null default 0,
  currency        text not null default 'CNY',
  exchange_rate   numeric(18,8) not null default 1,
  reason          text,
  status          text not null default 'draft'
                    check (status in ('draft','submitted','approved','rejected','paid','voided')),
  submitted_at    timestamptz,
  approved_at     timestamptz,
  approved_by     uuid,
  paid_at         timestamptz,
  voucher_id      uuid references public.mf_vouchers(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (company_id, claim_no)
);

create index if not exists idx_mf_expense_claims_company on public.mf_expense_claims (tenant_id, company_id);
create index if not exists idx_mf_expense_claims_status  on public.mf_expense_claims (status);

create table if not exists public.mf_expense_items (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.mf_tenants(id) on delete cascade,
  claim_id        uuid not null references public.mf_expense_claims(id) on delete cascade,
  line_no         smallint not null default 1,
  category_id     uuid references public.mf_expense_categories(id) on delete set null,
  description     text,
  expense_date    date,
  amount          numeric(20,4) not null default 0,
  currency        text not null default 'CNY',
  exchange_rate   numeric(18,8) not null default 1,
  vat_rate        numeric(6,4) default 0,
  vat_amount      numeric(20,4) default 0,
  invoice_no      text,
  attachment_url  text,
  cost_center_id  uuid references public.mf_cost_centers(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists idx_mf_expense_items_claim on public.mf_expense_items (claim_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Payroll & Human Resource Cost (工资与人力成本)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.mf_employees (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.mf_tenants(id) on delete cascade,
  company_id      uuid not null references public.mf_companies(id) on delete cascade,
  employee_no     text not null,
  full_name       text not null,
  english_name    text,
  user_id         uuid,
  department_id   uuid references public.mf_departments(id) on delete set null,
  cost_center_id  uuid references public.mf_cost_centers(id) on delete set null,
  position        text,
  hire_date       date,
  termination_date date,
  status          text not null default 'active'
                    check (status in ('active','probation','leave','terminated')),
  id_card         text,
  bank_name       text,
  bank_account    text,
  base_salary     numeric(18,2) default 0,
  currency        text not null default 'CNY',
  social_insurance_base numeric(18,2),
  housing_fund_base     numeric(18,2),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (company_id, employee_no)
);

create index if not exists idx_mf_employees_company on public.mf_employees (tenant_id, company_id);
create index if not exists idx_mf_employees_dept    on public.mf_employees (department_id);

create table if not exists public.mf_salary_structures (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.mf_tenants(id) on delete cascade,
  company_id      uuid not null references public.mf_companies(id) on delete cascade,
  employee_id     uuid not null references public.mf_employees(id) on delete cascade,
  effective_date  date not null,
  base_salary     numeric(18,2) not null default 0,
  position_allowance numeric(18,2) default 0,
  meal_allowance  numeric(18,2) default 0,
  transport_allowance numeric(18,2) default 0,
  other_allowance numeric(18,2) default 0,
  currency        text not null default 'CNY',
  notes           text,
  created_at      timestamptz not null default now(),
  unique (employee_id, effective_date)
);

create table if not exists public.mf_payslip_runs (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.mf_tenants(id) on delete cascade,
  company_id      uuid not null references public.mf_companies(id) on delete cascade,
  period_year     smallint not null,
  period_month    smallint not null check (period_month between 1 and 12),
  run_no          text not null,
  status          text not null default 'draft'
                    check (status in ('draft','calculated','approved','disbursed','locked','cancelled')),
  total_gross     numeric(20,2) default 0,
  total_net       numeric(20,2) default 0,
  total_tax       numeric(20,2) default 0,
  total_si        numeric(20,2) default 0,
  total_hf        numeric(20,2) default 0,
  employee_count  integer default 0,
  voucher_id      uuid references public.mf_vouchers(id) on delete set null,
  approved_by     uuid,
  approved_at     timestamptz,
  disbursed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (company_id, period_year, period_month)
);

create table if not exists public.mf_payslips (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.mf_tenants(id) on delete cascade,
  run_id          uuid not null references public.mf_payslip_runs(id) on delete cascade,
  employee_id     uuid not null references public.mf_employees(id) on delete cascade,
  department_id   uuid references public.mf_departments(id) on delete set null,
  cost_center_id  uuid references public.mf_cost_centers(id) on delete set null,
  gross_pay       numeric(18,2) not null default 0,
  base_salary     numeric(18,2) default 0,
  overtime_pay    numeric(18,2) default 0,
  bonus           numeric(18,2) default 0,
  commission      numeric(18,2) default 0,
  allowance       numeric(18,2) default 0,
  social_insurance_employee numeric(18,2) default 0,
  social_insurance_company  numeric(18,2) default 0,
  housing_fund_employee     numeric(18,2) default 0,
  housing_fund_company      numeric(18,2) default 0,
  income_tax      numeric(18,2) default 0,
  other_deduction numeric(18,2) default 0,
  net_pay         numeric(18,2) not null default 0,
  currency        text not null default 'CNY',
  bank_name       text,
  bank_account    text,
  paid_at         timestamptz,
  pdf_url         text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_mf_payslips_run on public.mf_payslips (run_id);
create index if not exists idx_mf_payslips_emp on public.mf_payslips (employee_id);

create table if not exists public.mf_payslip_lines (
  id              uuid primary key default gen_random_uuid(),
  payslip_id      uuid not null references public.mf_payslips(id) on delete cascade,
  line_type       text not null check (line_type in ('earning','deduction')),
  code            text not null,                    -- BASE, OT, BONUS, SI, HF, TAX, ...
  name            text not null,
  amount          numeric(18,2) not null default 0
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. Social Insurance & Housing Fund (社保 / 公积金 / 个税)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.mf_si_schemes (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.mf_tenants(id) on delete cascade,
  company_id      uuid not null references public.mf_companies(id) on delete cascade,
  scheme_code     text not null,                    -- BJ, SH, GZ, SZ ...
  scheme_name     text not null,
  effective_from  date not null,
  effective_to    date,
  pension_company numeric(7,4) not null default 0.16,
  pension_employee numeric(7,4) not null default 0.08,
  medical_company numeric(7,4) not null default 0.10,
  medical_employee numeric(7,4) not null default 0.02,
  unemployment_company numeric(7,4) not null default 0.005,
  unemployment_employee numeric(7,4) not null default 0.005,
  injury_company numeric(7,4) not null default 0.0016,
  maternity_company numeric(7,4) not null default 0.008,
  housing_fund_company numeric(7,4) not null default 0.12,
  housing_fund_employee numeric(7,4) not null default 0.12,
  base_min        numeric(18,2),
  base_max        numeric(18,2),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  unique (company_id, scheme_code, effective_from)
);

create table if not exists public.mf_si_records (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.mf_tenants(id) on delete cascade,
  company_id      uuid not null references public.mf_companies(id) on delete cascade,
  employee_id     uuid not null references public.mf_employees(id) on delete cascade,
  scheme_id       uuid references public.mf_si_schemes(id) on delete set null,
  period_year     smallint not null,
  period_month    smallint not null check (period_month between 1 and 12),
  si_base         numeric(18,2),
  hf_base         numeric(18,2),
  pension_company numeric(18,2) default 0,
  pension_employee numeric(18,2) default 0,
  medical_company numeric(18,2) default 0,
  medical_employee numeric(18,2) default 0,
  unemployment_company numeric(18,2) default 0,
  unemployment_employee numeric(18,2) default 0,
  injury_company numeric(18,2) default 0,
  maternity_company numeric(18,2) default 0,
  housing_fund_company numeric(18,2) default 0,
  housing_fund_employee numeric(18,2) default 0,
  total_company  numeric(18,2) generated always as (
    coalesce(pension_company,0)+coalesce(medical_company,0)+coalesce(unemployment_company,0)+
    coalesce(injury_company,0)+coalesce(maternity_company,0)+coalesce(housing_fund_company,0)
  ) stored,
  total_employee numeric(18,2) generated always as (
    coalesce(pension_employee,0)+coalesce(medical_employee,0)+coalesce(unemployment_employee,0)+
    coalesce(housing_fund_employee,0)
  ) stored,
  status          text not null default 'draft'
                    check (status in ('draft','calculated','paid','reconciled')),
  created_at      timestamptz not null default now()
);

create index if not exists idx_mf_si_records_emp on public.mf_si_records (employee_id);
create index if not exists idx_mf_si_records_period on public.mf_si_records (company_id, period_year, period_month);

create table if not exists public.mf_iit_brackets (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.mf_tenants(id) on delete cascade,
  country         text not null default 'CN',
  effective_from  date not null,
  effective_to    date,
  bracket_no      smallint not null,
  min_amount      numeric(18,2) not null,
  max_amount      numeric(18,2),
  rate            numeric(6,4) not null,
  quick_deduction numeric(18,2) not null default 0,
  unique (tenant_id, country, effective_from, bracket_no)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. Fixed Assets (固定资产)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.mf_assets (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.mf_tenants(id) on delete cascade,
  company_id      uuid not null references public.mf_companies(id) on delete cascade,
  asset_no        text not null,
  name            text not null,
  category        text not null,                  -- electronics | vehicle | building | machinery | software | other
  acquisition_date date not null,
  acquisition_cost numeric(18,2) not null,
  salvage_value   numeric(18,2) not null default 0,
  useful_life_months integer not null check (useful_life_months > 0),
  depreciation_method text not null default 'straight_line'
                    check (depreciation_method in ('straight_line','double_declining','units_of_production','sum_of_years')),
  currency        text not null default 'CNY',
  department_id   uuid references public.mf_departments(id) on delete set null,
  cost_center_id  uuid references public.mf_cost_centers(id) on delete set null,
  custodian_user_id uuid,
  location        text,
  status          text not null default 'in_use'
                    check (status in ('idle','in_use','under_repair','disposed','scrapped','sold')),
  accumulated_depreciation numeric(18,2) not null default 0,
  net_book_value  numeric(18,2) generated always as (
    coalesce(acquisition_cost,0) - coalesce(accumulated_depreciation,0)
  ) stored,
  disposed_at     date,
  disposal_amount numeric(18,2),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (company_id, asset_no)
);

create index if not exists idx_mf_assets_company on public.mf_assets (tenant_id, company_id);
create index if not exists idx_mf_assets_status on public.mf_assets (status);

create table if not exists public.mf_depreciation_schedule (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.mf_tenants(id) on delete cascade,
  asset_id        uuid not null references public.mf_assets(id) on delete cascade,
  period_year     smallint not null,
  period_month    smallint not null check (period_month between 1 and 12),
  amount          numeric(18,2) not null,
  accumulated     numeric(18,2) not null,
  net_book_value  numeric(18,2) not null,
  voucher_id      uuid references public.mf_vouchers(id) on delete set null,
  status          text not null default 'planned'
                    check (status in ('planned','posted','reversed')),
  posted_at       timestamptz,
  created_at      timestamptz not null default now(),
  unique (asset_id, period_year, period_month)
);

create index if not exists idx_mf_depr_period on public.mf_depreciation_schedule (period_year, period_month);

create table if not exists public.mf_asset_maintenance (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.mf_tenants(id) on delete cascade,
  asset_id        uuid not null references public.mf_assets(id) on delete cascade,
  maintenance_date date not null,
  type            text not null check (type in ('repair','inspection','upgrade','accident','disposal_prep')),
  cost            numeric(18,2) default 0,
  currency        text not null default 'CNY',
  performed_by    text,
  vendor          text,
  description     text,
  attachment_url  text,
  created_at      timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. Budgets (预算管理)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.mf_budgets (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.mf_tenants(id) on delete cascade,
  company_id      uuid not null references public.mf_companies(id) on delete cascade,
  scope           text not null check (scope in ('company','department','project','cost_center')),
  scope_ref_id    uuid,
  fiscal_year     smallint not null,
  granularity     text not null default 'monthly' check (granularity in ('annual','quarterly','monthly')),
  currency        text not null default 'CNY',
  status          text not null default 'draft'
                    check (status in ('draft','submitted','approved','locked','closed')),
  total_amount    numeric(20,2) default 0,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  approved_at     timestamptz,
  approved_by     uuid
);

create index if not exists idx_mf_budgets_scope on public.mf_budgets (scope, scope_ref_id, fiscal_year);

create table if not exists public.mf_budget_lines (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.mf_tenants(id) on delete cascade,
  budget_id       uuid not null references public.mf_budgets(id) on delete cascade,
  account_id      uuid references public.mf_accounts(id) on delete set null,
  category        text not null,                  -- 工资 / 差旅 / 折旧 / 物流 / 仓储 / 其它
  period_year     smallint not null,
  period_month    smallint,
  planned_amount  numeric(18,2) not null default 0,
  actual_amount   numeric(18,2) not null default 0,
  variance_amount numeric(18,2) generated always as (
    coalesce(actual_amount,0) - coalesce(planned_amount,0)
  ) stored,
  variance_pct    numeric(7,4) generated always as (
    case when planned_amount = 0 then null
         else (coalesce(actual_amount,0) - coalesce(planned_amount,0)) / planned_amount
    end
  ) stored,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_mf_budget_lines_budget on public.mf_budget_lines (budget_id);

create table if not exists public.mf_budget_alerts (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.mf_tenants(id) on delete cascade,
  company_id      uuid not null references public.mf_companies(id) on delete cascade,
  budget_id       uuid references public.mf_budgets(id) on delete cascade,
  line_id         uuid references public.mf_budget_lines(id) on delete cascade,
  severity        text not null check (severity in ('info','warn','danger','critical')),
  message         text not null,
  triggered_at    timestamptz not null default now(),
  resolved_at     timestamptz,
  resolved_by     uuid,
  created_at      timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. Profit Analysis (利润分析 — 部门 / 项目 / 订单)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.mf_profit_snapshots (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.mf_tenants(id) on delete cascade,
  company_id      uuid not null references public.mf_companies(id) on delete cascade,
  scope           text not null check (scope in ('department','project','order','customer','company')),
  scope_ref_id    uuid,
  scope_ref_no    text,                            -- order_no / project_code / dept_code
  scope_label     text,
  period_year     smallint not null,
  period_month    smallint,
  revenue         numeric(20,2) default 0,
  cost_purchase   numeric(20,2) default 0,
  cost_labor      numeric(20,2) default 0,
  cost_logistics  numeric(20,2) default 0,
  cost_warehouse  numeric(20,2) default 0,
  cost_tax        numeric(20,2) default 0,
  cost_depreciation numeric(20,2) default 0,
  cost_fx         numeric(20,2) default 0,
  cost_overhead   numeric(20,2) default 0,
  cost_ai         numeric(20,2) default 0,
  total_cost      numeric(20,2) generated always as (
    coalesce(cost_purchase,0)+coalesce(cost_labor,0)+coalesce(cost_logistics,0)+
    coalesce(cost_warehouse,0)+coalesce(cost_tax,0)+coalesce(cost_depreciation,0)+
    coalesce(cost_fx,0)+coalesce(cost_overhead,0)+coalesce(cost_ai,0)
  ) stored,
  gross_profit    numeric(20,2) generated always as (
    coalesce(revenue,0) -
    (coalesce(cost_purchase,0)+coalesce(cost_labor,0)+coalesce(cost_logistics,0)+
     coalesce(cost_warehouse,0)+coalesce(cost_tax,0)+coalesce(cost_depreciation,0)+
     coalesce(cost_fx,0)+coalesce(cost_overhead,0)+coalesce(cost_ai,0))
  ) stored,
  margin_pct      numeric(7,4) generated always as (
    case when coalesce(revenue,0) = 0 then null
         else (coalesce(revenue,0) -
              (coalesce(cost_purchase,0)+coalesce(cost_labor,0)+coalesce(cost_logistics,0)+
               coalesce(cost_warehouse,0)+coalesce(cost_tax,0)+coalesce(cost_depreciation,0)+
               coalesce(cost_fx,0)+coalesce(cost_overhead,0)+coalesce(cost_ai,0)))
              / revenue
    end
  ) stored,
  currency        text not null default 'CNY',
  computed_at     timestamptz not null default now(),
  computed_by     text default 'system',
  notes           text,
  unique (company_id, scope, scope_ref_id, period_year, period_month)
);

create index if not exists idx_mf_profit_scope on public.mf_profit_snapshots (scope, period_year, period_month);

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. AI Jobs & Audit Logs
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.mf_ai_jobs (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.mf_tenants(id) on delete cascade,
  company_id      uuid references public.mf_companies(id) on delete cascade,
  job_type        text not null check (job_type in
                    ('profit_analysis','expense_anomaly','cashflow_forecast',
                     'budget_forecast','board_briefing','voucher_suggestion','cost_attribution')),
  scope           jsonb,
  parameters      jsonb,
  status          text not null default 'queued'
                    check (status in ('queued','running','succeeded','failed','cancelled')),
  result_summary  text,
  result_data     jsonb,
  result_url      text,
  cost_tokens     integer default 0,
  cost_usd        numeric(10,4) default 0,
  started_at      timestamptz,
  finished_at     timestamptz,
  created_by      uuid,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_mf_ai_jobs_type on public.mf_ai_jobs (job_type, status);
create index if not exists idx_mf_ai_jobs_company on public.mf_ai_jobs (company_id, created_at desc);

create table if not exists public.mf_audit_logs (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.mf_tenants(id) on delete cascade,
  company_id      uuid references public.mf_companies(id) on delete cascade,
  actor_user_id   uuid,
  actor_email     text,
  module          text not null,           -- expense | payroll | si | asset | budget | profit | voucher | ai
  action          text not null,           -- create | update | approve | post | reverse | export | run
  entity          text not null,           -- table name or business object
  entity_id       text,
  before_state    jsonb,
  after_state     jsonb,
  ip_address      text,
  user_agent      text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_mf_audit_logs_entity on public.mf_audit_logs (module, entity, entity_id);
create index if not exists idx_mf_audit_logs_actor  on public.mf_audit_logs (actor_user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- Updated_at triggers
-- ─────────────────────────────────────────────────────────────────────────────

do $$
declare tbl text;
begin
  foreach tbl in array array[
    'mf_tenants','mf_companies','mf_accounts','mf_periods',
    'mf_cost_centers','mf_departments','mf_projects',
    'mf_vouchers','mf_voucher_rules',
    'mf_expense_claims','mf_employees','mf_payslip_runs',
    'mf_assets','mf_budgets','mf_budget_lines','mf_ai_jobs'
  ] loop
    execute format(
      'drop trigger if exists trg_%I_updated_at on public.%I;
       create trigger trg_%I_updated_at before update on public.%I
         for each row execute function public.mf_set_updated_at();',
      tbl, tbl, tbl, tbl
    );
  end loop;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 14. Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────
-- Strategy:
--   - Tenant isolation: tenant_id = mf_current_tenant() (from JWT)
--   - Finance-write roles: admin/CEO/CFO/Finance/External_Accountant
--   - Read-only for managers within tenant
-- For local dev (auth disabled) we expose a permissive `dev_mode` policy:
--   set role authenticated;  -- production
-- ─────────────────────────────────────────────────────────────────────────────

do $$
declare tbl text;
begin
  foreach tbl in array array[
    'mf_tenants','mf_companies','mf_exchange_rates','mf_accounts','mf_periods',
    'mf_cost_centers','mf_departments','mf_projects',
    'mf_vouchers','mf_voucher_lines','mf_voucher_rules',
    'mf_expense_categories','mf_expense_claims','mf_expense_items',
    'mf_employees','mf_salary_structures','mf_payslip_runs','mf_payslips','mf_payslip_lines',
    'mf_si_schemes','mf_si_records','mf_iit_brackets',
    'mf_assets','mf_depreciation_schedule','mf_asset_maintenance',
    'mf_budgets','mf_budget_lines','mf_budget_alerts',
    'mf_profit_snapshots','mf_ai_jobs','mf_audit_logs'
  ] loop
    execute format('alter table public.%I enable row level security;', tbl);
    -- read policy
    execute format(
      'drop policy if exists "mf_tenant_read" on public.%I;
       create policy "mf_tenant_read" on public.%I
         for select to authenticated
         using (
           tenant_id is null
           or public.mf_current_tenant() is null
           or tenant_id = public.mf_current_tenant()
         );', tbl, tbl
    );
    -- write policy
    execute format(
      'drop policy if exists "mf_tenant_write" on public.%I;
       create policy "mf_tenant_write" on public.%I
         for all to authenticated
         using (
           public.mf_is_finance()
           and (tenant_id is null
                or public.mf_current_tenant() is null
                or tenant_id = public.mf_current_tenant())
         )
         with check (
           public.mf_is_finance()
           and (tenant_id is null
                or public.mf_current_tenant() is null
                or tenant_id = public.mf_current_tenant())
         );', tbl, tbl
    );
  end loop;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 15. Auto-balance check + Voucher posting RPC
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.mf_check_voucher_balanced(p_voucher_id uuid)
returns boolean language sql stable as $$
  select coalesce(sum(debit), 0) = coalesce(sum(credit), 0)
  from public.mf_voucher_lines
  where voucher_id = p_voucher_id;
$$;

create or replace function public.mf_post_voucher(p_voucher_id uuid, p_actor uuid default null)
returns public.mf_vouchers language plpgsql security definer as $$
declare
  v mf_vouchers;
begin
  if not public.mf_check_voucher_balanced(p_voucher_id) then
    raise exception 'Voucher % is not balanced (debit != credit)', p_voucher_id;
  end if;

  update public.mf_vouchers
    set status = 'posted',
        posted_at = now(),
        posted_by = p_actor
    where id = p_voucher_id and status = 'draft'
  returning * into v;

  if not found then
    raise exception 'Voucher % cannot be posted (not in draft)', p_voucher_id;
  end if;

  insert into public.mf_audit_logs(
    tenant_id, company_id, actor_user_id, module, action, entity, entity_id, after_state
  ) values (
    v.tenant_id, v.company_id, p_actor, 'voucher', 'post', 'mf_vouchers',
    v.id::text, jsonb_build_object('voucher_no', v.voucher_no, 'amount', v.amount)
  );

  return v;
end;
$$;

grant execute on function public.mf_post_voucher(uuid, uuid) to authenticated;
grant execute on function public.mf_check_voucher_balanced(uuid)        to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 16. Default Chart of Accounts seed (中国会计准则 — 缩减版)
-- ─────────────────────────────────────────────────────────────────────────────
-- Tenants can override; this seed is keyed by `code` so duplicates are skipped.

-- (Only seed if you have a tenant. The frontend service will seed per tenant.)

-- ============================================================================
-- End of 20260514_management_finance_center.sql
-- ============================================================================
