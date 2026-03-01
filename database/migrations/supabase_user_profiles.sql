-- ============================================================
-- 更新所有测试用户的 raw_user_meta_data 和 user_profiles
-- Run in: https://supabase.com/dashboard/project/oaavirpytvemskjooeyg/sql
-- ============================================================

-- 1. 更新 auth.users 的 raw_user_meta_data
update auth.users set raw_user_meta_data = '{"portal_role":"admin","rbac_role":"Admin","region":"all","name":"系统管理员","email_verified":true}'
  where email = 'admin@cosun.com';

update auth.users set raw_user_meta_data = '{"portal_role":"admin","rbac_role":"CEO","region":"all","name":"CEO","email_verified":true}'
  where email = 'ceo@cosun.com';

update auth.users set raw_user_meta_data = '{"portal_role":"admin","rbac_role":"Finance","region":"all","name":"赵敏","email_verified":true}'
  where email = 'finance@cosun.com';

update auth.users set raw_user_meta_data = '{"portal_role":"admin","rbac_role":"Regional_Manager","region":"NA","name":"John Smith","email_verified":true}'
  where email = 'john.smith@cosun.com';

update auth.users set raw_user_meta_data = '{"portal_role":"admin","rbac_role":"Sales_Rep","region":"NA","name":"张伟","email_verified":true}'
  where email = 'zhangwei@cosun.com';

update auth.users set raw_user_meta_data = '{"portal_role":"customer","rbac_role":null,"region":"NA","name":"ABC Customer","email_verified":true}'
  where email = 'abc.customer@test.com';

update auth.users set raw_user_meta_data = '{"portal_role":"supplier","rbac_role":null,"region":"NA","name":"广东供应商","email_verified":true}'
  where email = 'gd.supplier@test.com';

-- 2. 同步写入 user_profiles 表（upsert）
insert into public.user_profiles (id, email, name, portal_role, rbac_role, region)
select id, email,
  raw_user_meta_data->>'name',
  coalesce(raw_user_meta_data->>'portal_role', 'customer'),
  raw_user_meta_data->>'rbac_role',
  coalesce(raw_user_meta_data->>'region', 'NA')
from auth.users
where email in (
  'admin@cosun.com','ceo@cosun.com','finance@cosun.com',
  'john.smith@cosun.com','zhangwei@cosun.com',
  'abc.customer@test.com','gd.supplier@test.com'
)
on conflict (id) do update set
  name       = excluded.name,
  portal_role = excluded.portal_role,
  rbac_role  = excluded.rbac_role,
  region     = excluded.region,
  updated_at = now();

-- 3. 验证结果
select email, portal_role, rbac_role, region, name
from public.user_profiles
order by portal_role, email;
