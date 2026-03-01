-- ============================================================
-- Cosun ERP - Phase 2: 完整数据迁移补丁
-- Run in: https://supabase.com/dashboard/project/oaavirpytvemskjooeyg/sql
-- ============================================================

-- ============================================================
-- 1. 补全 sales_quotations 字段（对齐前端 SalesQuotation 类型）
-- ============================================================
alter table public.sales_quotations
  add column if not exists qt_number text,
  add column if not exists qr_number text,
  add column if not exists inq_number text,
  add column if not exists sales_person_email text,
  add column if not exists items jsonb default '[]',
  add column if not exists total_cost numeric(15,2) default 0,
  add column if not exists total_price numeric(15,2) default 0,
  add column if not exists total_profit numeric(15,2) default 0,
  add column if not exists profit_rate numeric(5,4) default 0,
  add column if not exists delivery_terms text,
  add column if not exists delivery_date text,
  add column if not exists valid_until text,
  add column if not exists version integer default 1,
  add column if not exists previous_version text,
  add column if not exists approval_chain jsonb default '[]',
  add column if not exists customer_status text default 'not_sent',
  add column if not exists customer_response_data jsonb,
  add column if not exists so_number text,
  add column if not exists pushed_to_contract boolean default false,
  add column if not exists pushed_contract_number text,
  add column if not exists pushed_contract_at timestamptz,
  add column if not exists pushed_by text,
  add column if not exists customer_notes text,
  add column if not exists internal_notes text,
  add column if not exists trade_terms jsonb,
  add column if not exists remarks text,
  add column if not exists sent_to_customer_at timestamptz;

-- 确保 qt_number 唯一索引存在
create unique index if not exists idx_sales_quotations_qt_number on public.sales_quotations(qt_number);
create index if not exists idx_sales_quotations_sales_person on public.sales_quotations(sales_person);
create index if not exists idx_sales_quotations_qr_number on public.sales_quotations(qr_number);
create index if not exists idx_sales_quotations_customer_status on public.sales_quotations(customer_status);

-- ============================================================
-- 2. 补全 notifications 字段（对齐前端 Notification 类型）
-- ============================================================
alter table public.notifications
  add column if not exists related_id text,
  add column if not exists related_type text,
  add column if not exists sender text,
  add column if not exists metadata jsonb,
  add column if not exists created_at_ms bigint;

-- 通知表索引
create index if not exists idx_notifications_recipient on public.notifications(recipient_email);
create index if not exists idx_notifications_is_read on public.notifications(is_read);

-- ============================================================
-- 3. 新增 inquiries 表（对齐前端 Inquiry 类型）
-- ============================================================
create table if not exists public.inquiries (
  id text primary key,
  inquiry_number text,
  date text,
  user_email text not null,
  company_id text,
  region text,
  status text default 'draft',
  is_submitted boolean default false,
  total_price numeric(15,2) default 0,
  message text,
  buyer_info jsonb,
  shipping_info jsonb,
  container_info jsonb,
  products jsonb default '[]',
  created_at bigint,
  submitted_at bigint,
  updated_at timestamptz default now()
);

alter table public.inquiries enable row level security;
create policy "authenticated can read inquiries" on public.inquiries
  for select to authenticated using (true);
create policy "authenticated can write inquiries" on public.inquiries
  for all to authenticated using (true) with check (true);

create index if not exists idx_inquiries_user_email on public.inquiries(user_email);
create index if not exists idx_inquiries_status on public.inquiries(status);
create index if not exists idx_inquiries_is_submitted on public.inquiries(is_submitted);
create index if not exists idx_inquiries_region on public.inquiries(region);

-- trigger for inquiries updated_at
create trigger update_inquiries_updated_at before update on public.inquiries
  for each row execute function update_updated_at();

-- ============================================================
-- 4. 新增 rfq 表（供应商询价单 RFQ）
-- ============================================================
create table if not exists public.rfq_records (
  id text primary key,
  rfq_number text unique,
  inquiry_number text,
  sales_quotation_number text,
  supplier_email text not null,
  supplier_name text,
  products jsonb default '[]',
  status text default 'draft',
  notes text,
  response_deadline text,
  responded_at timestamptz,
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.rfq_records enable row level security;
create policy "authenticated can read rfq" on public.rfq_records
  for select to authenticated using (true);
create policy "authenticated can write rfq" on public.rfq_records
  for all to authenticated using (true) with check (true);

create index if not exists idx_rfq_supplier_email on public.rfq_records(supplier_email);
create index if not exists idx_rfq_status on public.rfq_records(status);

create trigger update_rfq_updated_at before update on public.rfq_records
  for each row execute function update_updated_at();

-- ============================================================
-- 5. 开启 Realtime for 新表
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'inquiries'
  ) then
    alter publication supabase_realtime add table public.inquiries;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'rfq_records'
  ) then
    alter publication supabase_realtime add table public.rfq_records;
  end if;
end $$;

-- ============================================================
-- 完成！Phase 2 数据库结构已就绪
-- ============================================================
