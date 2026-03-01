-- ============================================================
-- 验证 + 修复供应商/客户账号的 portal_role
-- 在 Supabase SQL Editor 执行
-- ============================================================

-- 1. 查看当前账号状态
select 
  u.email,
  u.raw_user_meta_data->>'portal_role' as meta_portal_role,
  p.portal_role as profile_portal_role,
  p.name
from auth.users u
left join public.user_profiles p on p.id = u.id
where u.email in (
  'gd.supplier@test.com',
  'abc.customer@test.com',
  'admin@cosun.com'
)
order by u.email;

-- 2. 强制修复 gd.supplier 的 user_profiles（如果 portal_role 不对）
update public.user_profiles
set portal_role = 'supplier',
    name = '广东五金制造厂',
    region = 'NA',
    updated_at = now()
where email = 'gd.supplier@test.com';

-- 3. 强制修复 abc.customer 的 user_profiles
update public.user_profiles
set portal_role = 'customer',
    name = 'abc.customer',
    updated_at = now()
where email = 'abc.customer@test.com';

-- 4. 确认修复结果
select email, portal_role, name from public.user_profiles
where email in ('gd.supplier@test.com','abc.customer@test.com','admin@cosun.com');
