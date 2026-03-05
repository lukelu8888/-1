-- Migration 028: 清理 supplier_xjs 冲突 RLS 策略
-- 问题：xj_staff_insert 的 WITH CHECK = null（等同 false），导致所有 INSERT 被静默拒绝。
--       细粒度策略依赖 is_tenant_staff() / current_tenant_id() 函数，
--       这些函数在当前环境未定义或行为不一致。
-- 解决：删除冲突细粒度策略，保留 auth_all_supplier_xjs（authenticated 全开放）。
--       后续如需细化权限，在函数确认可用后再分离角色策略。

-- 删除有问题的细粒度策略
DROP POLICY IF EXISTS xj_staff_insert    ON public.supplier_xjs;
DROP POLICY IF EXISTS xj_staff_select    ON public.supplier_xjs;
DROP POLICY IF EXISTS xj_staff_update    ON public.supplier_xjs;
DROP POLICY IF EXISTS xj_admin_delete    ON public.supplier_xjs;
DROP POLICY IF EXISTS xj_supplier_select ON public.supplier_xjs;
DROP POLICY IF EXISTS xj_supplier_update ON public.supplier_xjs;

-- 确保宽松策略存在（幂等）
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
      FOR ALL TO authenticated
      USING (true) WITH CHECK (true);
    RAISE NOTICE 'Created auth_all_supplier_xjs';
  ELSE
    RAISE NOTICE 'auth_all_supplier_xjs already exists';
  END IF;
END;
$$;

-- 验证
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'supplier_xjs'
ORDER BY policyname;
