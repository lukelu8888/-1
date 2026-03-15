-- ============================================================
-- Migration 046: Internal Model Number System
-- 目标：
-- 1. 建立 ERP 内部主型号主表
-- 2. 建立客户/供应商外部型号映射表
-- 3. 建立按 Region 永久递增的内部型号序列表
-- 4. 提供 next_internal_model_no(region) 原子编号 RPC
-- 规则：
--   Region-YYMM-0001
-- 说明：
--   - YYMM 仅为生成时标签
--   - 0001 为同一 Region 下永久连续递增序号
--   - 不按天重置
--   - 不按月重置
-- ============================================================

CREATE TABLE IF NOT EXISTS public.product_master (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_model_no TEXT NOT NULL UNIQUE,
  region_code       TEXT NOT NULL,
  product_name      TEXT NOT NULL,
  description       TEXT NULL,
  image_url         TEXT NULL,
  status            TEXT NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_master_region_code
  ON public.product_master(region_code);

CREATE TABLE IF NOT EXISTS public.product_model_mappings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID NOT NULL REFERENCES public.product_master(id) ON DELETE CASCADE,
  party_type        TEXT NOT NULL CHECK (party_type IN ('customer', 'supplier')),
  party_id          TEXT NOT NULL,
  external_model_no TEXT NOT NULL,
  external_product_name TEXT NULL,
  external_specification TEXT NULL,
  external_image_url TEXT NULL,
  is_primary        BOOLEAN NOT NULL DEFAULT FALSE,
  mapping_status    TEXT NOT NULL DEFAULT 'pending' CHECK (mapping_status IN ('pending', 'suggested', 'confirmed', 'rejected')),
  match_confidence  NUMERIC(5,4) NULL,
  suggested_product_id UUID NULL REFERENCES public.product_master(id) ON DELETE SET NULL,
  confirmed_product_id UUID NULL REFERENCES public.product_master(id) ON DELETE SET NULL,
  created_from_doc_type TEXT NULL,
  created_from_doc_id TEXT NULL,
  created_by        TEXT NULL,
  confirmed_by      TEXT NULL,
  confirmed_at      TIMESTAMPTZ NULL,
  remarks           TEXT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_product_model_mappings_unique
  ON public.product_model_mappings(product_id, party_type, party_id, external_model_no);

CREATE INDEX IF NOT EXISTS idx_product_model_mappings_party_lookup
  ON public.product_model_mappings(party_type, party_id, external_model_no);

CREATE TABLE IF NOT EXISTS public.product_mapping_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_model_id UUID NOT NULL REFERENCES public.product_model_mappings(id) ON DELETE CASCADE,
  event_type        TEXT NOT NULL CHECK (event_type IN ('created', 'auto_suggested', 'linked', 'relinked', 'rejected', 'merged')),
  from_product_id   UUID NULL REFERENCES public.product_master(id) ON DELETE SET NULL,
  to_product_id     UUID NULL REFERENCES public.product_master(id) ON DELETE SET NULL,
  operator_id       TEXT NULL,
  notes             TEXT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_mapping_events_external_model_id
  ON public.product_mapping_events(external_model_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.internal_model_sequences (
  region_code   TEXT PRIMARY KEY,
  current_value INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.next_internal_model_no(
  p_region_code TEXT DEFAULT 'NA'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_region_code TEXT;
  v_yymm        TEXT;
  v_seq         INT;
BEGIN
  v_region_code := upper(coalesce(nullif(trim(p_region_code), ''), 'NA'));
  v_yymm := to_char(now(), 'YYMM');

  INSERT INTO public.internal_model_sequences (region_code, current_value)
  VALUES (v_region_code, 1)
  ON CONFLICT (region_code)
  DO UPDATE SET
    current_value = public.internal_model_sequences.current_value + 1,
    updated_at = now()
  RETURNING current_value INTO v_seq;

  RETURN v_region_code || '-' || v_yymm || '-' || lpad(v_seq::TEXT, 4, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_internal_model_no(TEXT) TO authenticated;

ALTER TABLE public.product_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_model_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_mapping_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_model_sequences ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'product_master'
      AND policyname = 'product_master_read_authenticated'
  ) THEN
    CREATE POLICY product_master_read_authenticated
      ON public.product_master
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'product_master'
      AND policyname = 'product_master_write_authenticated'
  ) THEN
    CREATE POLICY product_master_write_authenticated
      ON public.product_master
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'product_model_mappings'
      AND policyname = 'product_model_mappings_read_authenticated'
  ) THEN
    CREATE POLICY product_model_mappings_read_authenticated
      ON public.product_model_mappings
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'product_model_mappings'
      AND policyname = 'product_model_mappings_write_authenticated'
  ) THEN
    CREATE POLICY product_model_mappings_write_authenticated
      ON public.product_model_mappings
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'product_mapping_events'
      AND policyname = 'product_mapping_events_read_authenticated'
  ) THEN
    CREATE POLICY product_mapping_events_read_authenticated
      ON public.product_mapping_events
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'product_mapping_events'
      AND policyname = 'product_mapping_events_write_authenticated'
  ) THEN
    CREATE POLICY product_mapping_events_write_authenticated
      ON public.product_mapping_events
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END;
$$;
