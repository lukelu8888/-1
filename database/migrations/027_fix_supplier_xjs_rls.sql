-- Migration 027: 修复 supplier_xjs RLS Policy 缺失
-- 原因：016_business_flow_tables.sql 中 DO $$ 使用两个 unnest() 并行展开
--       在 PostgreSQL 中会产生笛卡尔积而非 zip，导致 policy 名与表名错配，
--       auth_all_supplier_xjs 策略实际未被创建。
-- 影响：supplier_xjs 表 RLS 启用但无 Policy，所有前端写入被静默拒绝。

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'supplier_xjs'
      AND policyname = 'auth_all_supplier_xjs'
  ) THEN
    CREATE POLICY auth_all_supplier_xjs
      ON public.supplier_xjs
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
    RAISE NOTICE 'Created policy auth_all_supplier_xjs on supplier_xjs';
  ELSE
    RAISE NOTICE 'Policy auth_all_supplier_xjs already exists, skipped';
  END IF;
END;
$$;

-- 验证
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'supplier_xjs';
