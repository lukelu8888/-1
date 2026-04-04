alter table public.sales_quotations
  add column if not exists qt_type text not null default 'regular',
  add column if not exists special_price_flag boolean not null default false,
  add column if not exists special_price_reason text,
  add column if not exists special_payment_terms_flag boolean not null default false,
  add column if not exists strategic_customer_flag boolean not null default false,
  add column if not exists qt_last_approval_at timestamptz;

alter table public.sales_contracts
  add column if not exists sc_type text not null default 'regular',
  add column if not exists exceptional_clause_flag boolean not null default false,
  add column if not exists exceptional_clause_notes text,
  add column if not exists special_account_period_flag boolean not null default false,
  add column if not exists strategic_customer_flag boolean not null default false,
  add column if not exists sc_last_approval_at timestamptz;

comment on column public.sales_quotations.qt_type is
  'QT governance category: regular / large_amount / special_price / special_payment / strategic_customer';
comment on column public.sales_quotations.special_price_flag is
  'Whether QT is a special-price quotation that must carry governance review.';
comment on column public.sales_quotations.special_price_reason is
  'Reason for special price or below-floor commercial approval.';
comment on column public.sales_quotations.special_payment_terms_flag is
  'Whether QT contains special payment terms such as OA/DA/extended account period.';
comment on column public.sales_quotations.strategic_customer_flag is
  'Whether QT belongs to a key or strategic customer.';
comment on column public.sales_quotations.qt_last_approval_at is
  'Timestamp of the latest completed QT approval action.';

comment on column public.sales_contracts.sc_type is
  'SC governance category: regular / large_amount / exceptional_clause / strategic_customer / special_account_period';
comment on column public.sales_contracts.exceptional_clause_flag is
  'Whether SC contains non-standard liability / delivery / compensation / payment clauses.';
comment on column public.sales_contracts.exceptional_clause_notes is
  'Detailed explanation of exceptional clauses.';
comment on column public.sales_contracts.special_account_period_flag is
  'Whether SC contains special account period / credit term arrangements.';
comment on column public.sales_contracts.strategic_customer_flag is
  'Whether SC belongs to a key or strategic customer.';
comment on column public.sales_contracts.sc_last_approval_at is
  'Timestamp of the latest completed SC approval action.';

create index if not exists idx_sales_quotations_qt_type
  on public.sales_quotations (qt_type);
create index if not exists idx_sales_contracts_sc_type
  on public.sales_contracts (sc_type);
