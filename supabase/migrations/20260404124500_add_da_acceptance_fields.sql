alter table public.purchase_order_execution
  add column if not exists acceptance_status text,
  add column if not exists acceptance_date timestamptz,
  add column if not exists acceptance_maturity_date timestamptz;

comment on column public.purchase_order_execution.acceptance_status is
  'D/A acceptance lifecycle: pending / accepted / matured / paid';
comment on column public.purchase_order_execution.acceptance_date is
  'Date when customer/bank acceptance was confirmed for D/A release control';
comment on column public.purchase_order_execution.acceptance_maturity_date is
  'Expected maturity date for D/A payment follow-up';

