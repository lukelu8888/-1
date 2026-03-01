-- ============================================================
-- Cosun ERP - Supabase Patch: 补全缺失字段
-- Run in: https://supabase.com/dashboard/project/oaavirpytvemskjooeyg/sql
-- ============================================================

-- 补全 sales_contracts 缺失字段
alter table public.sales_contracts
  add column if not exists contact_person text,
  add column if not exists contact_phone text,
  add column if not exists packing text,
  add column if not exists deposit_confirmed_by text,
  add column if not exists deposit_confirmed_at timestamptz,
  add column if not exists deposit_confirm_notes text,
  add column if not exists purchase_order_numbers jsonb,
  add column if not exists seller_signature jsonb,
  add column if not exists buyer_signature jsonb,
  add column if not exists attachments jsonb default '[]',
  add column if not exists created_by text;

-- 补全 orders 缺失字段
alter table public.orders
  add column if not exists payment_terms text,
  add column if not exists delivery_terms text,
  add column if not exists created_from text,
  add column if not exists country text,
  add column if not exists delivery_address text,
  add column if not exists contact_person text,
  add column if not exists phone text,
  add column if not exists customer_feedback jsonb,
  add column if not exists deposit_receipt_proof jsonb,
  add column if not exists balance_receipt_proof jsonb,
  add column if not exists contract_terms jsonb,
  add column if not exists confirmed boolean default false,
  add column if not exists confirmed_at timestamptz,
  add column if not exists confirmed_by text,
  add column if not exists created_by text;

-- 补全 approval_records 缺失字段
alter table public.approval_records
  add column if not exists record_type text,
  add column if not exists reference_id text,
  add column if not exists reference_number text,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists requested_by text,
  add column if not exists requested_by_name text,
  add column if not exists approver text,
  add column if not exists approved_at timestamptz;

-- 补全 notifications 缺失字段
alter table public.notifications
  add column if not exists read boolean default false,
  add column if not exists reference_id text,
  add column if not exists reference_type text;

-- 新增 sales_quotations 表（报价单）
create table if not exists public.sales_quotations (
  id text primary key,
  quotation_number text unique not null,
  inquiry_number text,
  customer_name text,
  customer_email text not null,
  customer_company text,
  sales_person text,
  sales_person_name text,
  supervisor text,
  region text,
  products jsonb default '[]',
  total_amount numeric(15,2) default 0,
  currency text default 'USD',
  price_type text,
  profit_margin numeric(5,2),
  payment_terms text,
  delivery_time text,
  validity_period text,
  status text default 'draft',
  approval_status text,
  sent_to_customer boolean default false,
  customer_response text,
  customer_decline_reason text,
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  sent_at timestamptz,
  responded_at timestamptz
);

-- RLS for sales_quotations
alter table public.sales_quotations enable row level security;
create policy "authenticated can read quotations" on public.sales_quotations
  for select to authenticated using (true);
create policy "authenticated can write quotations" on public.sales_quotations
  for all to authenticated using (true) with check (true);

-- trigger for sales_quotations updated_at
create trigger update_sales_quotations_updated_at before update on public.sales_quotations
  for each row execute function update_updated_at();

-- 索引
create index if not exists idx_sales_quotations_customer_email on public.sales_quotations(customer_email);
create index if not exists idx_sales_quotations_status on public.sales_quotations(status);
create index if not exists idx_approval_records_approver on public.approval_records(approver, status);

-- 开启 Realtime（在 Supabase Dashboard > Database > Replication 手动开启，或用下面的方法）
-- 注意：下面的语句需要 supabase_realtime publication 已存在
do $$
begin
  -- sales_contracts
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'sales_contracts'
  ) then
    alter publication supabase_realtime add table public.sales_contracts;
  end if;
  -- orders
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
  -- accounts_receivable
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'accounts_receivable'
  ) then
    alter publication supabase_realtime add table public.accounts_receivable;
  end if;
  -- approval_records
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'approval_records'
  ) then
    alter publication supabase_realtime add table public.approval_records;
  end if;
  -- notifications
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
  -- sales_quotations
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'sales_quotations'
  ) then
    alter publication supabase_realtime add table public.sales_quotations;
  end if;
end $$;

-- ============================================================
-- 完成！所有表结构已与前端代码完全对齐
-- ============================================================
