alter table if exists public.purchase_order_execution
  add column if not exists case_close_status text not null default 'pending',
  add column if not exists case_closed_at timestamptz null,
  add column if not exists case_closed_by text null,
  add column if not exists archive_status text not null default 'pending',
  add column if not exists archived_at timestamptz null,
  add column if not exists archived_by text null;

alter table if exists public.purchase_order_execution
  drop constraint if exists chk_purchase_order_execution_case_close_status;

alter table if exists public.purchase_order_execution
  add constraint chk_purchase_order_execution_case_close_status
  check (case_close_status in ('pending', 'in_progress', 'closed'));

alter table if exists public.purchase_order_execution
  drop constraint if exists chk_purchase_order_execution_archive_status;

alter table if exists public.purchase_order_execution
  add constraint chk_purchase_order_execution_archive_status
  check (archive_status in ('pending', 'ready', 'archived'));

create index if not exists idx_purchase_order_execution_case_close_status
  on public.purchase_order_execution (case_close_status);

create index if not exists idx_purchase_order_execution_archive_status
  on public.purchase_order_execution (archive_status);
