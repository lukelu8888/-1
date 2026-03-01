-- ============================================================
-- Cosun ERP - Supabase Database Migration
-- Run this in: https://supabase.com/dashboard/project/oaavirpytvemskjooeyg/sql
-- ============================================================

-- 启用 UUID 扩展
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. 用户表
-- ============================================================
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text,
  portal_role text not null check (portal_role in ('admin', 'customer', 'supplier')),
  rbac_role text,
  region text,
  company text,
  phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 2. 询价单表
-- ============================================================
create table if not exists public.inquiries (
  id text primary key,
  inquiry_number text unique not null,
  user_email text not null,
  buyer_info jsonb default '{}',
  products jsonb default '[]',
  status text default 'pending',
  region text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 3. 报价单表
-- ============================================================
create table if not exists public.quotations (
  id text primary key,
  quotation_number text unique not null,
  inquiry_number text,
  customer_email text not null,
  customer_name text,
  sales_person text,
  products jsonb default '[]',
  total_amount numeric(15,2),
  currency text default 'USD',
  status text default 'draft',
  valid_until text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 4. 销售合同表
-- ============================================================
create table if not exists public.sales_contracts (
  id text primary key,
  contract_number text unique not null,
  quotation_number text,
  inquiry_number text,
  customer_name text not null,
  customer_email text not null,
  customer_company text,
  customer_address text,
  customer_country text,
  sales_person text not null,
  sales_person_name text,
  supervisor text,
  region text,
  products jsonb default '[]',
  total_amount numeric(15,2) default 0,
  currency text default 'USD',
  trade_terms text,
  payment_terms text,
  deposit_percentage numeric(5,2) default 30,
  deposit_amount numeric(15,2) default 0,
  balance_percentage numeric(5,2) default 70,
  balance_amount numeric(15,2) default 0,
  delivery_time text,
  port_of_loading text,
  port_of_destination text,
  status text default 'draft',
  approval_flow jsonb default '{}',
  approval_history jsonb default '[]',
  approval_notes text,
  rejection_reason text,
  deposit_proof jsonb,
  remarks text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  submitted_at timestamptz,
  approved_at timestamptz,
  sent_to_customer_at timestamptz,
  customer_confirmed_at timestamptz
);

-- ============================================================
-- 5. 订单表
-- ============================================================
create table if not exists public.orders (
  id text primary key,
  order_number text unique not null,
  customer text not null,
  customer_email text,
  quotation_id text,
  quotation_number text,
  contract_number text,
  date text not null,
  expected_delivery text,
  total_amount numeric(15,2) default 0,
  currency text default 'USD',
  status text default 'Pending',
  progress integer default 0,
  products jsonb default '[]',
  payment_status text,
  shipping_method text,
  tracking_number text,
  notes text,
  region text,
  deposit_payment_proof jsonb,
  balance_payment_proof jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 6. 应收账款表
-- ============================================================
create table if not exists public.accounts_receivable (
  id text primary key,
  ar_number text unique not null,
  order_number text not null,
  quotation_number text,
  contract_number text,
  customer_name text not null,
  customer_email text not null,
  region text,
  invoice_date text not null,
  due_date text not null,
  total_amount numeric(15,2) default 0,
  paid_amount numeric(15,2) default 0,
  remaining_amount numeric(15,2) default 0,
  currency text default 'USD',
  status text default 'pending',
  payment_terms text,
  products jsonb default '[]',
  payment_history jsonb default '[]',
  deposit_proof jsonb,
  balance_proof jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  notes text
);

-- ============================================================
-- 7. 审批记录表
-- ============================================================
create table if not exists public.approval_records (
  id uuid primary key default uuid_generate_v4(),
  target_type text not null check (target_type in ('quotation', 'contract', 'purchase_order')),
  target_id text not null,
  target_number text not null,
  approver_email text not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 8. 通知表
-- ============================================================
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  recipient_email text not null,
  type text not null,
  title text not null,
  message text,
  data jsonb default '{}',
  is_read boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- 自动更新 updated_at 的触发器
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_users_updated_at before update on public.users
  for each row execute function update_updated_at();
create trigger update_inquiries_updated_at before update on public.inquiries
  for each row execute function update_updated_at();
create trigger update_quotations_updated_at before update on public.quotations
  for each row execute function update_updated_at();
create trigger update_sales_contracts_updated_at before update on public.sales_contracts
  for each row execute function update_updated_at();
create trigger update_orders_updated_at before update on public.orders
  for each row execute function update_updated_at();
create trigger update_accounts_receivable_updated_at before update on public.accounts_receivable
  for each row execute function update_updated_at();
create trigger update_approval_records_updated_at before update on public.approval_records
  for each row execute function update_updated_at();

-- ============================================================
-- 索引（提升查询性能）
-- ============================================================
create index if not exists idx_inquiries_user_email on public.inquiries(user_email);
create index if not exists idx_quotations_customer_email on public.quotations(customer_email);
create index if not exists idx_quotations_inquiry_number on public.quotations(inquiry_number);
create index if not exists idx_sales_contracts_customer_email on public.sales_contracts(customer_email);
create index if not exists idx_sales_contracts_status on public.sales_contracts(status);
create index if not exists idx_sales_contracts_sales_person on public.sales_contracts(sales_person);
create index if not exists idx_orders_customer_email on public.orders(customer_email);
create index if not exists idx_orders_contract_number on public.orders(contract_number);
create index if not exists idx_accounts_receivable_customer_email on public.accounts_receivable(customer_email);
create index if not exists idx_accounts_receivable_order_number on public.accounts_receivable(order_number);
create index if not exists idx_approval_records_approver on public.approval_records(approver_email, status);
create index if not exists idx_notifications_recipient on public.notifications(recipient_email, is_read);

-- ============================================================
-- Row Level Security (RLS) 策略
-- ============================================================
alter table public.users enable row level security;
alter table public.inquiries enable row level security;
alter table public.quotations enable row level security;
alter table public.sales_contracts enable row level security;
alter table public.orders enable row level security;
alter table public.accounts_receivable enable row level security;
alter table public.approval_records enable row level security;
alter table public.notifications enable row level security;

-- 暂时允许所有认证用户读写（开发阶段）
-- 生产环境需要更细粒度的权限控制

create policy "authenticated users can read all" on public.users
  for select to authenticated using (true);
create policy "authenticated users can insert" on public.users
  for insert to authenticated with check (true);
create policy "authenticated users can update own" on public.users
  for update to authenticated using (true);

create policy "authenticated can read inquiries" on public.inquiries
  for select to authenticated using (true);
create policy "authenticated can write inquiries" on public.inquiries
  for all to authenticated using (true) with check (true);

create policy "authenticated can read quotations" on public.quotations
  for select to authenticated using (true);
create policy "authenticated can write quotations" on public.quotations
  for all to authenticated using (true) with check (true);

create policy "authenticated can read contracts" on public.sales_contracts
  for select to authenticated using (true);
create policy "authenticated can write contracts" on public.sales_contracts
  for all to authenticated using (true) with check (true);

create policy "authenticated can read orders" on public.orders
  for select to authenticated using (true);
create policy "authenticated can write orders" on public.orders
  for all to authenticated using (true) with check (true);

create policy "authenticated can read ar" on public.accounts_receivable
  for select to authenticated using (true);
create policy "authenticated can write ar" on public.accounts_receivable
  for all to authenticated using (true) with check (true);

create policy "authenticated can read approvals" on public.approval_records
  for select to authenticated using (true);
create policy "authenticated can write approvals" on public.approval_records
  for all to authenticated using (true) with check (true);

create policy "users can read own notifications" on public.notifications
  for select to authenticated using (recipient_email = auth.jwt() ->> 'email');
create policy "service can write notifications" on public.notifications
  for insert to authenticated with check (true);
create policy "users can update own notifications" on public.notifications
  for update to authenticated using (recipient_email = auth.jwt() ->> 'email');

-- ============================================================
-- 完成
-- ============================================================
-- 在 Supabase Dashboard 的 Realtime 设置中，
-- 开启以下表的 Realtime：
--   sales_contracts, orders, accounts_receivable,
--   approval_records, notifications
