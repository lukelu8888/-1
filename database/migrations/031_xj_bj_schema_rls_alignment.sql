-- Migration 031: XJ -> BJ 验收前的 schema / RLS 对齐
-- 原则：Supabase-first，字段标准先行；只补齐缺失项，不破坏现有数据

-- ============================================================
-- 1) supplier_quotations 字段补齐（与 toSQRow/fromSQRow 对齐）
-- ============================================================
ALTER TABLE public.supplier_quotations
  ADD COLUMN IF NOT EXISTS quotation_number      TEXT,
  ADD COLUMN IF NOT EXISTS supplier_code         TEXT,
  ADD COLUMN IF NOT EXISTS source_xj_number      TEXT,
  ADD COLUMN IF NOT EXISTS source_xj_id          UUID,
  ADD COLUMN IF NOT EXISTS region_code           TEXT,
  ADD COLUMN IF NOT EXISTS valid_until           DATE,
  ADD COLUMN IF NOT EXISTS deleted_at            TIMESTAMPTZ;

-- 兼容历史字段回填（不覆盖已有标准字段）
UPDATE public.supplier_quotations
SET
  quotation_number = COALESCE(quotation_number, bj_number, display_number, xj_number),
  source_xj_number = COALESCE(source_xj_number, xj_number)
WHERE quotation_number IS NULL OR source_xj_number IS NULL;

-- 默认值 / 非空兜底
ALTER TABLE public.supplier_quotations
  ALTER COLUMN products SET DEFAULT '[]'::jsonb,
  ALTER COLUMN total_amount SET DEFAULT 0,
  ALTER COLUMN currency SET DEFAULT 'CNY',
  ALTER COLUMN status SET DEFAULT 'draft';

UPDATE public.supplier_quotations SET products = '[]'::jsonb WHERE products IS NULL;
UPDATE public.supplier_quotations SET total_amount = 0 WHERE total_amount IS NULL;
UPDATE public.supplier_quotations SET currency = 'CNY' WHERE currency IS NULL OR currency = '';
UPDATE public.supplier_quotations SET status = 'draft' WHERE status IS NULL OR status = '';
UPDATE public.supplier_quotations SET supplier_email = '' WHERE supplier_email IS NULL;

ALTER TABLE public.supplier_quotations
  ALTER COLUMN products SET NOT NULL,
  ALTER COLUMN total_amount SET NOT NULL,
  ALTER COLUMN currency SET NOT NULL,
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN supplier_email SET NOT NULL;

-- ============================================================
-- 2) 索引补齐（XJ->BJ 关联 + 常用筛选）
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_sq_quotation_number
  ON public.supplier_quotations (quotation_number)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sq_source_xj_number
  ON public.supplier_quotations (source_xj_number)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sq_supplier_email
  ON public.supplier_quotations (supplier_email)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sq_status
  ON public.supplier_quotations (status)
  WHERE deleted_at IS NULL;

-- ============================================================
-- 3) RLS 对齐（避免环境缺策略导致静默失败）
-- ============================================================
ALTER TABLE public.supplier_quotations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'supplier_quotations'
      AND policyname = 'auth_all_supplier_quotations'
  ) THEN
    CREATE POLICY auth_all_supplier_quotations
      ON public.supplier_quotations
      FOR ALL TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END;
$$;

-- ============================================================
-- 4) Realtime 发布（幂等）
-- ============================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.supplier_quotations;
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END;
$$;
