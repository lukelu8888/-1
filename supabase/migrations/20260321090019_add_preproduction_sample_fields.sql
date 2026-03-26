alter table if exists public.purchase_order_execution
  add column if not exists pre_production_sample_status text not null default 'not_required',
  add column if not exists pre_production_sample_no text null,
  add column if not exists sample_round integer not null default 1,
  add column if not exists pre_production_sample_sent_at timestamptz null,
  add column if not exists seal_confirmed_at timestamptz null;

alter table if exists public.purchase_order_execution
  drop constraint if exists chk_purchase_order_execution_pre_production_sample_status;

alter table if exists public.purchase_order_execution
  add constraint chk_purchase_order_execution_pre_production_sample_status
  check (pre_production_sample_status in ('not_required', 'pending', 'sent', 'approved', 'rejected'));

create index if not exists idx_purchase_order_execution_pre_production_sample_status
  on public.purchase_order_execution (pre_production_sample_status);
