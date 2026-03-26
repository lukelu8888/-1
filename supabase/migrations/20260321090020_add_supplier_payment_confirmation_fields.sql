alter table if exists public.purchase_order_execution
  add column if not exists supplier_balance_confirmed_at timestamptz null,
  add column if not exists supplier_balance_confirmed_by text null;
