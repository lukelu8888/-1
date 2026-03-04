-- ============================================================
-- 任务1：Supabase 数据库 RFQ → XJ（采购询价）完整迁移
-- 前提：先执行 012a_diagnose_before_rename.sql 确认实际存在的对象
-- 执行方式：在 Supabase SQL Editor 整段粘贴执行
-- ============================================================

-- -------------------------------------------------------
-- STEP 1: 表名重命名
-- supplier_rfqs → supplier_xjs（采购询价表）
-- rfq_records  → xj_records（采购询价记录表）
-- -------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='supplier_rfqs') THEN
    ALTER TABLE public.supplier_rfqs RENAME TO supplier_xjs;
    RAISE NOTICE '✓ supplier_rfqs → supplier_xjs';
  ELSE
    RAISE NOTICE '⚠ supplier_rfqs 不存在，跳过';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='rfq_records') THEN
    ALTER TABLE public.rfq_records RENAME TO xj_records;
    RAISE NOTICE '✓ rfq_records → xj_records';
  ELSE
    RAISE NOTICE '⚠ rfq_records 不存在，跳过';
  END IF;
END $$;

-- -------------------------------------------------------
-- STEP 2: supplier_xjs 表列名重命名
-- -------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='supplier_xjs' AND column_name='rfq_uid') THEN
    ALTER TABLE public.supplier_xjs RENAME COLUMN rfq_uid TO xj_uid;
    RAISE NOTICE '✓ supplier_xjs.rfq_uid → xj_uid';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='supplier_xjs' AND column_name='rfq_number') THEN
    ALTER TABLE public.supplier_xjs RENAME COLUMN rfq_number TO xj_number;
    RAISE NOTICE '✓ supplier_xjs.rfq_number → xj_number';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='supplier_xjs' AND column_name='supplier_rfq_no') THEN
    ALTER TABLE public.supplier_xjs RENAME COLUMN supplier_rfq_no TO supplier_xj_no;
    RAISE NOTICE '✓ supplier_xjs.supplier_rfq_no → supplier_xj_no';
  END IF;
END $$;

-- -------------------------------------------------------
-- STEP 3: xj_records 表列名重命名
-- -------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='xj_records' AND column_name='rfq_number') THEN
    ALTER TABLE public.xj_records RENAME COLUMN rfq_number TO xj_number;
    RAISE NOTICE '✓ xj_records.rfq_number → xj_number';
  END IF;
END $$;

-- -------------------------------------------------------
-- STEP 4: supplier_quotations 表中 rfq_id → xj_id
-- （supplier_quotations 存的是供应商对采购询价的报价）
-- -------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='supplier_quotations' AND column_name='rfq_id') THEN
    ALTER TABLE public.supplier_quotations RENAME COLUMN rfq_id TO xj_id;
    RAISE NOTICE '✓ supplier_quotations.rfq_id → xj_id';
  END IF;
END $$;

-- -------------------------------------------------------
-- STEP 5: quotation_requests 表中 rfq_id / rfq_number → xj_id / xj_number
-- -------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='quotation_requests' AND column_name='rfq_id') THEN
    ALTER TABLE public.quotation_requests RENAME COLUMN rfq_id TO xj_id;
    RAISE NOTICE '✓ quotation_requests.rfq_id → xj_id';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='quotation_requests' AND column_name='rfq_number') THEN
    ALTER TABLE public.quotation_requests RENAME COLUMN rfq_number TO xj_number;
    RAISE NOTICE '✓ quotation_requests.rfq_number → xj_number';
  END IF;
END $$;

-- -------------------------------------------------------
-- STEP 6: 枚举类型 rfq_status → xj_status
-- -------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rfq_status') THEN
    ALTER TYPE public.rfq_status RENAME TO xj_status;
    RAISE NOTICE '✓ rfq_status → xj_status';
  ELSE
    RAISE NOTICE '⚠ 枚举 rfq_status 不存在，跳过';
  END IF;
END $$;

-- -------------------------------------------------------
-- STEP 7: qr_status 枚举值 rfq_sent → xj_sent（如果存在）
-- -------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'qr_status' AND e.enumlabel = 'rfq_sent'
  ) THEN
    ALTER TYPE public.qr_status RENAME VALUE 'rfq_sent' TO 'xj_sent';
    RAISE NOTICE '✓ qr_status: rfq_sent → xj_sent';
  ELSE
    RAISE NOTICE '⚠ qr_status.rfq_sent 不存在，跳过';
  END IF;
END $$;

-- -------------------------------------------------------
-- STEP 8: number_rules — entity_type 更新
-- supplier_rfq / rfq → xj
-- -------------------------------------------------------
UPDATE public.number_rules
SET entity_type = 'xj'
WHERE entity_type IN ('supplier_rfq', 'rfq')
  AND status != 'retired';

RAISE NOTICE '✓ number_rules entity_type: rfq/supplier_rfq → xj';

-- -------------------------------------------------------
-- STEP 9: RLS 策略重命名（supplier_xjs）
-- -------------------------------------------------------
DO $$
DECLARE
  pol RECORD;
  new_name TEXT;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'supplier_xjs'
      AND (policyname ILIKE '%rfq%')
  LOOP
    new_name := replace(lower(pol.policyname), 'rfq', 'xj');
    EXECUTE format('ALTER POLICY %I ON public.supplier_xjs RENAME TO %I', pol.policyname, new_name);
    RAISE NOTICE '✓ Policy: % → %', pol.policyname, new_name;
  END LOOP;
END $$;

-- -------------------------------------------------------
-- STEP 10: RLS 策略重命名（xj_records）
-- -------------------------------------------------------
DO $$
DECLARE
  pol RECORD;
  new_name TEXT;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'xj_records'
      AND (policyname ILIKE '%rfq%')
  LOOP
    new_name := replace(lower(pol.policyname), 'rfq', 'xj');
    EXECUTE format('ALTER POLICY %I ON public.xj_records RENAME TO %I', pol.policyname, new_name);
    RAISE NOTICE '✓ Policy: % → %', pol.policyname, new_name;
  END LOOP;
END $$;

-- -------------------------------------------------------
-- STEP 11: 触发器重建（PostgreSQL 不支持 RENAME TRIGGER）
-- -------------------------------------------------------
DO $$
BEGIN
  -- xj_records 上的 update_rfq_updated_at
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'update_rfq_updated_at' AND event_object_table = 'xj_records'
  ) THEN
    DROP TRIGGER IF EXISTS update_rfq_updated_at ON public.xj_records;
    CREATE TRIGGER update_xj_updated_at
      BEFORE UPDATE ON public.xj_records
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    RAISE NOTICE '✓ Trigger: update_rfq_updated_at → update_xj_updated_at (xj_records)';
  END IF;

  -- supplier_xjs 上的 trg_rfq_fill_region
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'trg_rfq_fill_region' AND event_object_table = 'supplier_xjs'
  ) THEN
    DROP TRIGGER IF EXISTS trg_rfq_fill_region ON public.supplier_xjs;
    CREATE TRIGGER trg_xj_fill_region
      BEFORE INSERT ON public.supplier_xjs
      FOR EACH ROW EXECUTE FUNCTION fill_rfq_region_code();
    RAISE NOTICE '✓ Trigger: trg_rfq_fill_region → trg_xj_fill_region (supplier_xjs)';
  END IF;

  -- supplier_xjs 上的 trg_rfq_auto_tenant
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'trg_rfq_auto_tenant' AND event_object_table = 'supplier_xjs'
  ) THEN
    DROP TRIGGER IF EXISTS trg_rfq_auto_tenant ON public.supplier_xjs;
    CREATE TRIGGER trg_xj_auto_tenant
      BEFORE INSERT ON public.supplier_xjs
      FOR EACH ROW EXECUTE FUNCTION auto_fill_tenant_id();
    RAISE NOTICE '✓ Trigger: trg_rfq_auto_tenant → trg_xj_auto_tenant (supplier_xjs)';
  END IF;
END $$;

-- -------------------------------------------------------
-- STEP 12: Realtime 订阅更新
-- -------------------------------------------------------
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.supplier_rfqs; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.rfq_records;   EXCEPTION WHEN OTHERS THEN NULL; END;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='supplier_xjs') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='supplier_xjs') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.supplier_xjs;
      RAISE NOTICE '✓ Realtime: added supplier_xjs';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='xj_records') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='xj_records') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.xj_records;
      RAISE NOTICE '✓ Realtime: added xj_records';
    END IF;
  END IF;
END $$;

-- -------------------------------------------------------
-- 验证结果
-- -------------------------------------------------------
SELECT '=== 任务1完成验证 ===' AS info;

SELECT table_name AS "重命名后的表" FROM information_schema.tables
WHERE table_schema='public' AND table_name IN ('supplier_xjs','xj_records')
ORDER BY table_name;

SELECT table_name, column_name AS "剩余rfq列（应为0）"
FROM information_schema.columns
WHERE table_schema='public' AND column_name ILIKE '%rfq%'
ORDER BY table_name;

SELECT typname AS "枚举名（不应有rfq_status）"
FROM pg_type WHERE typname ILIKE '%rfq%';

SELECT entity_type, prefix, status FROM public.number_rules
WHERE entity_type IN ('xj','inq','inquiry') ORDER BY entity_type;
