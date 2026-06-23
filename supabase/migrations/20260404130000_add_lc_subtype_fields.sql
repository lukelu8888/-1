alter table public.purchase_order_execution
  add column if not exists lc_type text,
  add column if not exists lc_opened_at timestamptz,
  add column if not exists lc_discrepancy_status text,
  add column if not exists lc_maturity_date timestamptz;

comment on column public.purchase_order_execution.lc_type is
  'L/C subtype: at_sight / usance / transferable / revolving';
comment on column public.purchase_order_execution.lc_opened_at is
  'Timestamp when the customer L/C was formally opened/confirmed';
comment on column public.purchase_order_execution.lc_discrepancy_status is
  'Structured L/C discrepancy status: none / open / resolved / waived';
comment on column public.purchase_order_execution.lc_maturity_date is
  'Expected maturity date for usance L/C payment follow-up';

