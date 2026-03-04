-- Migration 020: 步骤 2e — 各业务表字段对齐 + 新建 purchase_requests(PR)
-- 原则：只加列，不删旧列，旧编号列保留，新编号列并存

-- ============================================================
-- 统一字段：display_number / source_doc_id / sales_contract_id
--           root_sales_contract_id / customer_id
-- ============================================================

-- inquiries（ING）
ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS ing_number             TEXT,
  ADD COLUMN IF NOT EXISTS display_number         TEXT,
  ADD COLUMN IF NOT EXISTS source_doc_id          UUID,
  ADD COLUMN IF NOT EXISTS sales_contract_id      UUID,
  ADD COLUMN IF NOT EXISTS root_sales_contract_id UUID,
  ADD COLUMN IF NOT EXISTS customer_id            TEXT;

-- sales_quotations（QT）
ALTER TABLE public.sales_quotations
  ADD COLUMN IF NOT EXISTS display_number         TEXT,
  ADD COLUMN IF NOT EXISTS source_doc_id          UUID,
  ADD COLUMN IF NOT EXISTS sales_contract_id      UUID,
  ADD COLUMN IF NOT EXISTS root_sales_contract_id UUID,
  ADD COLUMN IF NOT EXISTS customer_id            TEXT;

-- sales_contracts（SC）
ALTER TABLE public.sales_contracts
  ADD COLUMN IF NOT EXISTS sc_number              TEXT,
  ADD COLUMN IF NOT EXISTS display_number         TEXT,
  ADD COLUMN IF NOT EXISTS source_doc_id          UUID,
  ADD COLUMN IF NOT EXISTS root_sales_contract_id UUID,
  ADD COLUMN IF NOT EXISTS customer_id            TEXT;

-- purchase_requirements（QR 主表）
ALTER TABLE public.purchase_requirements
  ADD COLUMN IF NOT EXISTS qr_number              TEXT,
  ADD COLUMN IF NOT EXISTS display_number         TEXT,
  ADD COLUMN IF NOT EXISTS source_doc_id          UUID,
  ADD COLUMN IF NOT EXISTS sales_contract_id      UUID,
  ADD COLUMN IF NOT EXISTS root_sales_contract_id UUID;

-- supplier_xjs（XJ）
ALTER TABLE public.supplier_xjs
  ADD COLUMN IF NOT EXISTS display_number         TEXT,
  ADD COLUMN IF NOT EXISTS source_doc_id          UUID,
  ADD COLUMN IF NOT EXISTS sales_contract_id      UUID,
  ADD COLUMN IF NOT EXISTS root_sales_contract_id UUID;

-- supplier_quotations（BJ）
ALTER TABLE public.supplier_quotations
  ADD COLUMN IF NOT EXISTS bj_number              TEXT,
  ADD COLUMN IF NOT EXISTS display_number         TEXT,
  ADD COLUMN IF NOT EXISTS source_doc_id          UUID,
  ADD COLUMN IF NOT EXISTS sales_contract_id      UUID,
  ADD COLUMN IF NOT EXISTS root_sales_contract_id UUID;

-- purchase_orders（CG）
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS cg_number              TEXT,
  ADD COLUMN IF NOT EXISTS display_number         TEXT,
  ADD COLUMN IF NOT EXISTS source_doc_id          UUID,
  ADD COLUMN IF NOT EXISTS sales_contract_id      UUID,
  ADD COLUMN IF NOT EXISTS root_sales_contract_id UUID;

-- payments（Finance）
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS display_number         TEXT,
  ADD COLUMN IF NOT EXISTS source_doc_id          UUID,
  ADD COLUMN IF NOT EXISTS sales_contract_id      UUID,
  ADD COLUMN IF NOT EXISTS root_sales_contract_id UUID;

-- ============================================================
-- 新建 purchase_requests（PR）— SC → CG 的采购请求
-- ============================================================
CREATE TABLE IF NOT EXISTS public.purchase_requests (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_number               TEXT NOT NULL UNIQUE,
  display_number          TEXT,
  sc_number               TEXT,
  sales_contract_id       UUID,
  root_sales_contract_id  UUID,
  source_doc_id           UUID,
  region_code             TEXT,
  customer_name           TEXT NOT NULL DEFAULT '',
  customer_email          TEXT,
  customer_id             TEXT,
  items                   JSONB NOT NULL DEFAULT '[]',
  status                  TEXT NOT NULL DEFAULT 'pending',
  requested_by            TEXT,
  requested_by_name       TEXT,
  assigned_to             TEXT,
  priority                TEXT NOT NULL DEFAULT 'medium',
  notes                   TEXT,
  created_by              TEXT,
  deleted_at              TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- updated_at 触发器
DROP TRIGGER IF EXISTS trg_purchase_requests_updated_at ON public.purchase_requests;
CREATE TRIGGER trg_purchase_requests_updated_at
  BEFORE UPDATE ON public.purchase_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'purchase_requests'
      AND policyname = 'auth_all_purchase_requests'
  ) THEN
    CREATE POLICY auth_all_purchase_requests ON public.purchase_requests
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END;
$$;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_requests;
