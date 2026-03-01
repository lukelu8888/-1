-- ============================================================
-- 修复 inquiries 表：补全前端需要的所有字段
-- 在 Supabase SQL Editor 执行：
-- https://supabase.com/dashboard/project/oaavirpytvemskjooeyg/sql/new
-- ============================================================

alter table public.inquiries
  add column if not exists inquiry_number text,
  add column if not exists date text,
  add column if not exists company_id text,
  add column if not exists is_submitted boolean default false,
  add column if not exists total_price numeric(15,2) default 0,
  add column if not exists message text,
  add column if not exists shipping_info jsonb default '{}',
  add column if not exists container_info jsonb,
  add column if not exists submitted_at timestamptz;

-- inquiry_number 唯一索引（如果还没建）
create unique index if not exists idx_inquiries_inquiry_number
  on public.inquiries(inquiry_number)
  where inquiry_number is not null;

-- 确认结果
select column_name, data_type
from information_schema.columns
where table_name = 'inquiries' and table_schema = 'public'
order by ordinal_position;
