-- ============================================================
-- Cosun ERP - Supabase Storage Setup
-- Run in: https://supabase.com/dashboard/project/oaavirpytvemskjooeyg/sql
-- ============================================================

-- 1. 创建付款凭证 bucket（公开可读）
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  true,
  10485760,  -- 10MB
  array['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];

-- 2. 创建合同附件 bucket（公开可读）
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'contract-attachments',
  'contract-attachments',
  true,
  20971520,  -- 20MB
  array['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 20971520;

-- 3. Storage RLS 策略：已登录用户可以上传/读取/删除自己的文件
-- 付款凭证
create policy "authenticated users can upload payment proofs"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'payment-proofs');

create policy "payment proofs are publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'payment-proofs');

create policy "authenticated users can delete own payment proofs"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'payment-proofs');

-- 合同附件
create policy "authenticated users can upload contract attachments"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'contract-attachments');

create policy "contract attachments are publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'contract-attachments');

create policy "authenticated users can delete own contract attachments"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'contract-attachments');

-- ============================================================
-- 完成！Storage buckets 已配置
-- 注意：如果上面的 RLS policy 已存在会报错，可以忽略
-- ============================================================
