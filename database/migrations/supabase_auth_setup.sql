-- ============================================================
-- Cosun ERP - Supabase Auth Setup
-- Run in: https://supabase.com/dashboard/project/oaavirpytvemskjooeyg/sql
-- ============================================================

-- 1. 用户元数据表（关联 Supabase Auth 的 auth.users）
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text,
  portal_role text not null check (portal_role in ('admin', 'customer', 'supplier')),
  rbac_role text,   -- CEO, CFO, Sales_Director, Regional_Manager, Sales_Rep, Finance, Procurement, Admin ...
  region text,      -- NA, SA, EMEA, all
  company text,
  phone text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_profiles enable row level security;

-- 用户只能读自己的 profile；admin 可读所有
create policy "users can read own profile" on public.user_profiles
  for select to authenticated using (id = auth.uid());

create policy "admin can read all profiles" on public.user_profiles
  for select to authenticated using (
    exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.portal_role = 'admin'
    )
  );

create policy "users can update own profile" on public.user_profiles
  for update to authenticated using (id = auth.uid());

-- service_role 可以写（用于后台同步）
create policy "service role full access" on public.user_profiles
  for all to service_role using (true) with check (true);

-- 触发器：Auth 用户注册时自动创建 profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email, name, portal_role, rbac_role, region)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'portal_role', 'customer'),
    new.raw_user_meta_data->>'rbac_role',
    coalesce(new.raw_user_meta_data->>'region', 'NA')
  )
  on conflict (id) do update set
    name = excluded.name,
    portal_role = excluded.portal_role,
    rbac_role = excluded.rbac_role,
    region = excluded.region,
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at 触发器
create trigger update_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function update_updated_at();

-- ============================================================
-- 2. 创建测试账号（用 Supabase Auth API 创建，这里只插入 profile）
-- 注意：实际用户需通过 Supabase Dashboard > Authentication > Users 创建
--       或通过下面的 SQL 直接插入（仅限开发环境）
-- ============================================================

-- 辅助函数：通过 email 获取用户 ID（用于 profile 插入）
create or replace function public.get_user_id_by_email(p_email text)
returns uuid as $$
  select id from auth.users where email = p_email limit 1;
$$ language sql security definer;

-- ============================================================
-- 3. 在 Supabase Auth 创建测试用户的说明
-- 请去 Dashboard > Authentication > Users > Invite user 创建以下账号：
--
-- Admin Portal（内部员工）：
--   admin@cosun.com          密码: Cosun2024!   portal_role: admin   rbac_role: Admin
--   ceo@cosun.com            密码: Cosun2024!   portal_role: admin   rbac_role: CEO
--   cfo@cosun.com            密码: Cosun2024!   portal_role: admin   rbac_role: CFO
--   sales.director@cosun.com 密码: Cosun2024!   portal_role: admin   rbac_role: Sales_Director
--   john.smith@cosun.com     密码: Cosun2024!   portal_role: admin   rbac_role: Regional_Manager  region: NA
--   carlos.silva@cosun.com   密码: Cosun2024!   portal_role: admin   rbac_role: Regional_Manager  region: SA
--   hans.mueller@cosun.com   密码: Cosun2024!   portal_role: admin   rbac_role: Regional_Manager  region: EMEA
--   zhangwei@cosun.com       密码: Cosun2024!   portal_role: admin   rbac_role: Sales_Rep         region: NA
--   finance@cosun.com        密码: Cosun2024!   portal_role: admin   rbac_role: Finance
--   procurement@cosun.com    密码: Cosun2024!   portal_role: admin   rbac_role: Procurement
--
-- Customer Portal（客户）：
--   abc.customer@test.com    密码: Customer123! portal_role: customer
--
-- Supplier Portal（供应商）：
--   gd.supplier@test.com     密码: Supplier123! portal_role: supplier
-- ============================================================
