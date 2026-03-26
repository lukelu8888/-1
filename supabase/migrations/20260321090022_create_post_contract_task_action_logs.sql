create table if not exists public.post_contract_task_action_logs (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  task_key text not null,
  task_type text not null,
  action_code text not null,
  action_label text not null,
  status_after text null,
  operator_name text null,
  operator_role text null,
  remarks text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint post_contract_task_action_logs_task_type_check check (
    task_type in (
      'finance_packet',
      'customer_payment',
      'bank_submission',
      'document_release',
      'supplier_balance',
      'case_close',
      'archive',
      'other'
    )
  )
);

create index if not exists idx_post_contract_task_action_logs_po_id
  on public.post_contract_task_action_logs (purchase_order_id, created_at desc);

create index if not exists idx_post_contract_task_action_logs_task
  on public.post_contract_task_action_logs (task_key, task_type, created_at desc);
