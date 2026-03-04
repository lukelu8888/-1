-- ============================================================
-- Migration 012: Rename RFQ → XJ (采购询价) across all DB objects
-- 业务原因：主体是采购员，不是供应商，正确术语为"采购询价(XJ)"
-- 执行方式：在 Supabase SQL Editor 中整段执行
-- ============================================================

-- -------------------------------------------------------
-- STEP 1: Rename supplier_rfqs table → supplier_xjs
-- -------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'supplier_rfqs') THEN
    ALTER TABLE public.supplier_rfqs RENAME TO supplier_xjs;
    RAISE NOTICE 'Renamed supplier_rfqs → supplier_xjs';
  ELSE
    RAISE NOTICE 'Table supplier_rfqs does not exist, skipping';
  END IF;
END $$;

-- -------------------------------------------------------
-- STEP 2: Rename rfq_records table → xj_records
-- -------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rfq_records') THEN
    ALTER TABLE public.rfq_records RENAME TO xj_records;
    RAISE NOTICE 'Renamed rfq_records → xj_records';
  ELSE
    RAISE NOTICE 'Table rfq_records does not exist, skipping';
  END IF;
END $$;

-- -------------------------------------------------------
-- STEP 3: Rename columns in supplier_xjs (formerly supplier_rfqs)
-- -------------------------------------------------------
DO $$
BEGIN
  -- rfq_uid → xj_uid
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='supplier_xjs' AND column_name='rfq_uid') THEN
    ALTER TABLE public.supplier_xjs RENAME COLUMN rfq_uid TO xj_uid;
    RAISE NOTICE 'Renamed column rfq_uid → xj_uid in supplier_xjs';
  END IF;

  -- rfq_number → xj_number
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='supplier_xjs' AND column_name='rfq_number') THEN
    ALTER TABLE public.supplier_xjs RENAME COLUMN rfq_number TO xj_number;
    RAISE NOTICE 'Renamed column rfq_number → xj_number in supplier_xjs';
  END IF;

  -- supplier_rfq_no → supplier_xj_no
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='supplier_xjs' AND column_name='supplier_rfq_no') THEN
    ALTER TABLE public.supplier_xjs RENAME COLUMN supplier_rfq_no TO supplier_xj_no;
    RAISE NOTICE 'Renamed column supplier_rfq_no → supplier_xj_no in supplier_xjs';
  END IF;
END $$;

-- -------------------------------------------------------
-- STEP 4: Rename columns in xj_records (formerly rfq_records)
-- -------------------------------------------------------
DO $$
BEGIN
  -- rfq_number → xj_number
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='xj_records' AND column_name='rfq_number') THEN
    ALTER TABLE public.xj_records RENAME COLUMN rfq_number TO xj_number;
    RAISE NOTICE 'Renamed column rfq_number → xj_number in xj_records';
  END IF;
END $$;

-- -------------------------------------------------------
-- STEP 5: Rename rfq_id → xj_id in quotation_requests (if exists)
-- -------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='quotation_requests' AND column_name='rfq_id') THEN
    ALTER TABLE public.quotation_requests RENAME COLUMN rfq_id TO xj_id;
    RAISE NOTICE 'Renamed column rfq_id → xj_id in quotation_requests';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='quotation_requests' AND column_name='rfq_number') THEN
    ALTER TABLE public.quotation_requests RENAME COLUMN rfq_number TO xj_number;
    RAISE NOTICE 'Renamed column rfq_number → xj_number in quotation_requests';
  END IF;
END $$;

-- -------------------------------------------------------
-- STEP 6: Rename rfq_status enum → xj_status (if exists as separate enum)
-- -------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rfq_status') THEN
    ALTER TYPE rfq_status RENAME TO xj_status;
    RAISE NOTICE 'Renamed enum rfq_status → xj_status';
  ELSE
    RAISE NOTICE 'Enum rfq_status does not exist, skipping';
  END IF;
END $$;

-- -------------------------------------------------------
-- STEP 7: Update number_rules entity_type from supplier_rfq → xj
-- -------------------------------------------------------
UPDATE public.number_rules
SET entity_type = 'xj'
WHERE entity_type IN ('supplier_rfq', 'rfq')
  AND status != 'retired';

-- -------------------------------------------------------
-- STEP 8: Rename RLS policies on supplier_xjs
-- -------------------------------------------------------
DO $$
DECLARE
  pol RECORD;
  new_name TEXT;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'supplier_xjs'
      AND policyname LIKE 'rfq%'
  LOOP
    new_name := regexp_replace(pol.policyname, '^rfq', 'xj');
    EXECUTE format('ALTER POLICY %I ON public.supplier_xjs RENAME TO %I', pol.policyname, new_name);
    RAISE NOTICE 'Renamed policy % → %', pol.policyname, new_name;
  END LOOP;
END $$;

-- -------------------------------------------------------
-- STEP 9: Rename RLS policies on xj_records
-- -------------------------------------------------------
DO $$
DECLARE
  pol RECORD;
  new_name TEXT;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'xj_records'
      AND policyname LIKE '%rfq%'
  LOOP
    new_name := replace(pol.policyname, 'rfq', 'xj');
    EXECUTE format('ALTER POLICY %I ON public.xj_records RENAME TO %I', pol.policyname, new_name);
    RAISE NOTICE 'Renamed policy % → %', pol.policyname, new_name;
  END LOOP;
END $$;

-- -------------------------------------------------------
-- STEP 10: Update Realtime publication (remove old, add new)
-- -------------------------------------------------------
DO $$
BEGIN
  -- Remove old table names from publication if present
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.supplier_rfqs;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.rfq_records;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Add new table names
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='supplier_xjs') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = 'supplier_xjs'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.supplier_xjs;
      RAISE NOTICE 'Added supplier_xjs to supabase_realtime';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='xj_records') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = 'xj_records'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.xj_records;
      RAISE NOTICE 'Added xj_records to supabase_realtime';
    END IF;
  END IF;
END $$;

-- -------------------------------------------------------
-- STEP 11: Rename triggers on renamed tables
-- -------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_rfq_updated_at' AND event_object_table = 'xj_records') THEN
    -- Triggers cannot be renamed in Postgres, drop and recreate
    DROP TRIGGER IF EXISTS update_rfq_updated_at ON public.xj_records;
    CREATE TRIGGER update_xj_updated_at
      BEFORE UPDATE ON public.xj_records
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    RAISE NOTICE 'Recreated trigger update_xj_updated_at on xj_records';
  END IF;
END $$;

-- -------------------------------------------------------
-- STEP 12: Update supplier_xjs trigger if rfq-named
-- -------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name LIKE '%rfq%' AND event_object_table = 'supplier_xjs') THEN
    DROP TRIGGER IF EXISTS trg_rfq_fill_region ON public.supplier_xjs;
    DROP TRIGGER IF EXISTS trg_rfq_auto_tenant ON public.supplier_xjs;

    -- Recreate as xj-named triggers (reuse same functions)
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'fill_rfq_region_code') THEN
      CREATE TRIGGER trg_xj_fill_region
        BEFORE INSERT ON public.supplier_xjs
        FOR EACH ROW EXECUTE FUNCTION fill_rfq_region_code();
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_fill_tenant_id') THEN
      CREATE TRIGGER trg_xj_auto_tenant
        BEFORE INSERT ON public.supplier_xjs
        FOR EACH ROW EXECUTE FUNCTION auto_fill_tenant_id();
    END IF;

    RAISE NOTICE 'Recreated triggers on supplier_xjs';
  END IF;
END $$;

-- -------------------------------------------------------
-- VERIFICATION
-- -------------------------------------------------------
SELECT 'supplier_xjs exists' AS check, COUNT(*) AS rows FROM public.supplier_xjs;
SELECT 'xj_records exists' AS check, COUNT(*) AS rows FROM public.xj_records;
SELECT 'number_rules xj' AS check, entity_type, prefix, status FROM public.number_rules WHERE entity_type = 'xj';
