-- ============================================================
-- Cosun ERP - 全量用户 Profile 同步
-- 基于 rbac-config.ts (DEMO_USERS) + authorizedUsers.ts
-- Run in: https://supabase.com/dashboard/project/oaavirpytvemskjooeyg/sql
-- ============================================================

-- ① 更新 auth.users 的 raw_user_meta_data（已在 Supabase Auth 创建的用户）

-- ===== ADMIN PORTAL =====

-- CEO - 张明
update auth.users set raw_user_meta_data = jsonb_build_object(
  'portal_role','admin','rbac_role','CEO','region','all','name','张明','email_verified',true)
where email = 'ceo@cosun.com';

-- CFO - 李华
update auth.users set raw_user_meta_data = jsonb_build_object(
  'portal_role','admin','rbac_role','CFO','region','all','name','李华','email_verified',true)
where email = 'cfo@cosun.com';

-- 销售总监 - 王强
update auth.users set raw_user_meta_data = jsonb_build_object(
  'portal_role','admin','rbac_role','Sales_Director','region','all','name','王强','email_verified',true)
where email = 'sales.director@cosun.com';

-- 北美区域主管 - 刘建国 (john.smith)
update auth.users set raw_user_meta_data = jsonb_build_object(
  'portal_role','admin','rbac_role','Regional_Manager','region','NA','name','刘建国','email_verified',true)
where email = 'john.smith@cosun.com';

-- 南美区域主管 - 陈明华 (carlos.silva)
update auth.users set raw_user_meta_data = jsonb_build_object(
  'portal_role','admin','rbac_role','Regional_Manager','region','SA','name','陈明华','email_verified',true)
where email = 'carlos.silva@cosun.com';

-- 欧非区域主管 - 赵国强 (hans.mueller)
update auth.users set raw_user_meta_data = jsonb_build_object(
  'portal_role','admin','rbac_role','Regional_Manager','region','EMEA','name','赵国强','email_verified',true)
where email = 'hans.mueller@cosun.com';

-- 北美业务员 - 张伟
update auth.users set raw_user_meta_data = jsonb_build_object(
  'portal_role','admin','rbac_role','Sales_Rep','region','NA','name','张伟','email_verified',true)
where email = 'zhangwei@cosun.com';

-- 南美业务员 - 李芳
update auth.users set raw_user_meta_data = jsonb_build_object(
  'portal_role','admin','rbac_role','Sales_Rep','region','SA','name','李芳','email_verified',true)
where email = 'lifang@cosun.com';

-- 欧非业务员 - 王芳
update auth.users set raw_user_meta_data = jsonb_build_object(
  'portal_role','admin','rbac_role','Sales_Rep','region','EMEA','name','王芳','email_verified',true)
where email = 'wangfang@cosun.com';

-- 财务 - 赵敏
update auth.users set raw_user_meta_data = jsonb_build_object(
  'portal_role','admin','rbac_role','Finance','region','all','name','赵敏','email_verified',true)
where email = 'finance@cosun.com';

-- 采购 - 刘刚
update auth.users set raw_user_meta_data = jsonb_build_object(
  'portal_role','admin','rbac_role','Procurement','region','all','name','刘刚','email_verified',true)
where email = 'procurement@cosun.com';

-- 系统管理员
update auth.users set raw_user_meta_data = jsonb_build_object(
  'portal_role','admin','rbac_role','Admin','region','all','name','系统管理员','email_verified',true)
where email = 'admin@cosun.com';

-- 运营专员 - 李娜
update auth.users set raw_user_meta_data = jsonb_build_object(
  'portal_role','admin','rbac_role','Marketing_Ops','region','all','name','李娜','email_verified',true)
where email = 'marketing@cosun.com';

-- 单证员 - 张晖
update auth.users set raw_user_meta_data = jsonb_build_object(
  'portal_role','admin','rbac_role','Documentation_Officer','region','all','name','张晖','email_verified',true)
where email = 'zhanghui@cosun.com';

-- ===== CUSTOMER PORTAL =====

-- 测试客户（北美）
update auth.users set raw_user_meta_data = jsonb_build_object(
  'portal_role','customer','rbac_role',null,'region','NA','name','ABC Customer','company','ABC Building Supplies','email_verified',true)
where email = 'abc.customer@test.com';

-- 测试客户（南美）
update auth.users set raw_user_meta_data = jsonb_build_object(
  'portal_role','customer','rbac_role',null,'region','SA','name','Brasil Customer','company','Brasil Construction Co.','email_verified',true)
where email = 'brasil.customer@test.com';

-- 测试客户（欧非）
update auth.users set raw_user_meta_data = jsonb_build_object(
  'portal_role','customer','rbac_role',null,'region','EMEA','name','Europa Customer','company','Europa Trading GmbH','email_verified',true)
where email = 'europa.customer@test.com';

-- ===== SUPPLIER PORTAL =====

-- 测试供应商（广东）
update auth.users set raw_user_meta_data = jsonb_build_object(
  'portal_role','supplier','rbac_role',null,'region','NA','name','广东五金制造厂','company','广东五金制造厂','email_verified',true)
where email = 'gd.supplier@test.com';

-- 测试供应商（浙江）
update auth.users set raw_user_meta_data = jsonb_build_object(
  'portal_role','supplier','rbac_role',null,'region','NA','name','浙江建材集团','company','浙江建材集团','email_verified',true)
where email = 'zj.supplier@test.com';

-- ② 批量 upsert 到 user_profiles（从 auth.users 同步）
insert into public.user_profiles (id, email, name, portal_role, rbac_role, region)
select
  id,
  email,
  raw_user_meta_data->>'name',
  coalesce(raw_user_meta_data->>'portal_role', 'customer'),
  raw_user_meta_data->>'rbac_role',
  coalesce(raw_user_meta_data->>'region', 'NA')
from auth.users
where email in (
  -- Admin
  'ceo@cosun.com','cfo@cosun.com','sales.director@cosun.com',
  'john.smith@cosun.com','carlos.silva@cosun.com','hans.mueller@cosun.com',
  'zhangwei@cosun.com','lifang@cosun.com','wangfang@cosun.com',
  'finance@cosun.com','procurement@cosun.com','admin@cosun.com',
  'marketing@cosun.com','zhanghui@cosun.com',
  -- Customer
  'abc.customer@test.com','brasil.customer@test.com','europa.customer@test.com',
  -- Supplier
  'gd.supplier@test.com','zj.supplier@test.com'
)
on conflict (id) do update set
  name        = excluded.name,
  portal_role = excluded.portal_role,
  rbac_role   = excluded.rbac_role,
  region      = excluded.region,
  updated_at  = now();

-- ③ 验证：查看所有已同步的 profiles
select
  portal_role,
  rbac_role,
  region,
  name,
  email
from public.user_profiles
order by portal_role, rbac_role, email;
