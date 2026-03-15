-- Migration 041: Document Template Center v1
-- 目标：
-- 1. 建立模板中心主表与版本表
-- 2. 将 INQ / QR / XJ / BJ / QT / SC / CG 收编为 legacy v1
-- 3. 给主业务单据表补齐模板快照字段
-- 4. 明确 QR 的业务口径为 Quote Requirement（报价请求单）
-- 5. 明确 CG 的业务口径为 Purchase Contract（采购合同）

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. 模板中心主表
-- ============================================================
CREATE TABLE IF NOT EXISTS public.document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_code TEXT NOT NULL UNIQUE,
  document_code TEXT NOT NULL,
  template_name_cn TEXT NOT NULL,
  template_name_en TEXT,
  business_stage TEXT NOT NULL,
  renderer_type TEXT NOT NULL DEFAULT 'legacy-react',
  current_version_id UUID NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.document_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.document_templates(id) ON DELETE CASCADE,
  version_no INTEGER NOT NULL,
  version_label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  schema_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  layout_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  style_tokens JSONB NOT NULL DEFAULT '{}'::jsonb,
  sample_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  renderer_component TEXT,
  change_summary TEXT,
  published_by UUID NULL,
  published_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (template_id, version_no)
);

CREATE TABLE IF NOT EXISTS public.document_template_bindings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_code TEXT NOT NULL,
  node_code TEXT NOT NULL,
  document_code TEXT NOT NULL,
  template_id UUID NOT NULL REFERENCES public.document_templates(id) ON DELETE CASCADE,
  template_version_id UUID NOT NULL REFERENCES public.document_template_versions(id) ON DELETE RESTRICT,
  is_default BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (flow_code, node_code, document_code, template_version_id)
);

CREATE TABLE IF NOT EXISTS public.document_template_publish_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.document_templates(id) ON DELETE CASCADE,
  template_version_id UUID NOT NULL REFERENCES public.document_template_versions(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  operator_id UUID NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.document_render_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_code TEXT NOT NULL,
  business_table TEXT NOT NULL,
  business_id UUID NOT NULL,
  template_id UUID NULL REFERENCES public.document_templates(id) ON DELETE SET NULL,
  template_version_id UUID NULL REFERENCES public.document_template_versions(id) ON DELETE SET NULL,
  job_status TEXT NOT NULL DEFAULT 'pending',
  output_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ NULL
);

-- 复用已有 updated_at 触发器函数；若不存在则补建。
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'document_templates',
    'document_template_versions'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I;
       CREATE TRIGGER trg_%I_updated_at
         BEFORE UPDATE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_document_templates_document_code
  ON public.document_templates (document_code);

CREATE INDEX IF NOT EXISTS idx_document_templates_status
  ON public.document_templates (status);

CREATE INDEX IF NOT EXISTS idx_document_template_versions_template_id
  ON public.document_template_versions (template_id);

CREATE INDEX IF NOT EXISTS idx_document_template_bindings_flow_node
  ON public.document_template_bindings (flow_code, node_code, document_code);

-- ============================================================
-- 2. 主链模板注册
-- QR = Quote Requirement（报价请求单）
-- CG = Purchase Contract（采购合同）
-- ============================================================
INSERT INTO public.document_templates (
  template_code,
  document_code,
  template_name_cn,
  template_name_en,
  business_stage,
  renderer_type,
  status,
  description
) VALUES
  ('tpl_inq', 'INQ', '客户询价单', 'Customer Inquiry', 'source', 'legacy-react', 'published', '客户原始询价源头'),
  ('tpl_qr',  'QR',  '报价请求单', 'Quote Requirement', 'internal-cost-request', 'legacy-react', 'published', '业务员向采购员发起的报价请求'),
  ('tpl_xj',  'XJ',  '采购询价单', 'Supplier Inquiry', 'supplier-inquiry', 'legacy-react', 'published', '采购员向供应商询价'),
  ('tpl_bj',  'BJ',  '供应商报价单', 'Supplier Quotation', 'supplier-quotation', 'legacy-react', 'published', '供应商报价反馈'),
  ('tpl_qt',  'QT',  '销售报价单', 'Sales Quotation', 'sales-quotation', 'legacy-react', 'published', '业务员对客户报价'),
  ('tpl_sc',  'SC',  '销售合同', 'Sales Contract', 'sales-contract', 'legacy-react', 'published', '客户成交合同'),
  ('tpl_cg',  'CG',  '采购合同', 'Purchase Contract', 'purchase-contract', 'legacy-react', 'published', '公司与供应商采购合同')
ON CONFLICT (template_code) DO UPDATE SET
  document_code = EXCLUDED.document_code,
  template_name_cn = EXCLUDED.template_name_cn,
  template_name_en = EXCLUDED.template_name_en,
  business_stage = EXCLUDED.business_stage,
  renderer_type = EXCLUDED.renderer_type,
  status = EXCLUDED.status,
  description = EXCLUDED.description,
  updated_at = NOW();

DO $$
DECLARE
  v_template_id UUID;
  v_component TEXT;
BEGIN
  FOR v_template_id, v_component IN
    SELECT
      id,
      CASE template_code
        WHEN 'tpl_inq' THEN 'src/components/documents/templates/CustomerInquiryDocument.tsx'
        WHEN 'tpl_qr'  THEN 'src/components/documents/templates/PurchaseRequirementDocument.tsx'
        WHEN 'tpl_xj'  THEN 'src/components/documents/templates/XJDocument.tsx'
        WHEN 'tpl_bj'  THEN 'src/components/documents/templates/SupplierQuotationDocument.tsx'
        WHEN 'tpl_qt'  THEN 'src/components/documents/templates/QuotationDocument.tsx'
        WHEN 'tpl_sc'  THEN 'src/components/documents/templates/SalesContractDocument.tsx'
        WHEN 'tpl_cg'  THEN 'src/components/documents/templates/PurchaseOrderDocument.tsx'
      END AS renderer_component
    FROM public.document_templates
    WHERE template_code IN ('tpl_inq', 'tpl_qr', 'tpl_xj', 'tpl_bj', 'tpl_qt', 'tpl_sc', 'tpl_cg')
  LOOP
    INSERT INTO public.document_template_versions (
      template_id,
      version_no,
      version_label,
      status,
      schema_json,
      layout_json,
      style_tokens,
      sample_data,
      renderer_component,
      change_summary,
      published_at
    ) VALUES (
      v_template_id,
      1,
      'legacy-v1',
      'published',
      jsonb_build_object('mode', 'legacy-react'),
      '{}'::jsonb,
      '{}'::jsonb,
      '{}'::jsonb,
      v_component,
      'Initial legacy component enrollment',
      NOW()
    )
    ON CONFLICT (template_id, version_no) DO UPDATE SET
      renderer_component = EXCLUDED.renderer_component,
      status = EXCLUDED.status,
      change_summary = EXCLUDED.change_summary,
      updated_at = NOW();
  END LOOP;
END;
$$;

UPDATE public.document_templates t
SET current_version_id = v.id,
    updated_at = NOW()
FROM public.document_template_versions v
WHERE v.template_id = t.id
  AND v.version_no = 1
  AND t.current_version_id IS DISTINCT FROM v.id;

-- ============================================================
-- 3. 给业务单据补齐模板快照字段
-- 当前运行口径：
-- purchase_requirements 作为 QR 的主业务承载
-- quotation_requests 作为采购侧旧工作台兼容投影层保留
-- purchase_orders 当前业务语义按 CG 解释
-- ============================================================
ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS template_id UUID NULL REFERENCES public.document_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_version_id UUID NULL REFERENCES public.document_template_versions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS document_data_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS document_render_meta JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.quotation_requests
  ADD COLUMN IF NOT EXISTS template_id UUID NULL REFERENCES public.document_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_version_id UUID NULL REFERENCES public.document_template_versions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS document_data_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS document_render_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS qr_context_json JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.supplier_xjs
  ADD COLUMN IF NOT EXISTS template_id UUID NULL REFERENCES public.document_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_version_id UUID NULL REFERENCES public.document_template_versions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS document_data_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS document_render_meta JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.supplier_quotations
  ADD COLUMN IF NOT EXISTS template_id UUID NULL REFERENCES public.document_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_version_id UUID NULL REFERENCES public.document_template_versions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS document_data_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS document_render_meta JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.sales_quotations
  ADD COLUMN IF NOT EXISTS template_id UUID NULL REFERENCES public.document_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_version_id UUID NULL REFERENCES public.document_template_versions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS document_data_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS document_render_meta JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.sales_contracts
  ADD COLUMN IF NOT EXISTS template_id UUID NULL REFERENCES public.document_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_version_id UUID NULL REFERENCES public.document_template_versions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS document_data_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS document_render_meta JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS template_id UUID NULL REFERENCES public.document_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_version_id UUID NULL REFERENCES public.document_template_versions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS document_data_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS document_render_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS cg_number TEXT NULL;

ALTER TABLE public.purchase_requirements
  ADD COLUMN IF NOT EXISTS template_id UUID NULL REFERENCES public.document_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_version_id UUID NULL REFERENCES public.document_template_versions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS document_data_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS document_render_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS legacy_qr_alias BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE public.purchase_orders
SET cg_number = COALESCE(cg_number, po_number)
WHERE cg_number IS NULL;

CREATE INDEX IF NOT EXISTS idx_quotation_requests_template_version_id
  ON public.quotation_requests (template_version_id);

CREATE INDEX IF NOT EXISTS idx_sales_quotations_template_version_id
  ON public.sales_quotations (template_version_id);

CREATE INDEX IF NOT EXISTS idx_sales_contracts_template_version_id
  ON public.sales_contracts (template_version_id);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_template_version_id
  ON public.purchase_orders (template_version_id);

-- ============================================================
-- 4. 业务视图与注释
-- ============================================================
CREATE OR REPLACE VIEW public.quote_requirements AS
SELECT
  id,
  request_number AS qr_number,
  source_inquiry_id,
  source_inquiry_number,
  customer_name,
  customer_email,
  region_code,
  request_date,
  expected_quote_date,
  products,
  status,
  assigned_to,
  requested_by,
  requested_by_name,
  notes,
  template_id,
  template_version_id,
  template_snapshot,
  document_data_snapshot,
  document_render_meta,
  qr_context_json,
  created_at,
  updated_at
FROM public.quotation_requests;

COMMENT ON VIEW public.quote_requirements IS
  'QR business-facing view. QR = Quote Requirement = 报价请求单';

COMMENT ON TABLE public.purchase_orders IS
  'Legacy physical table retained for compatibility. Business meaning is CG (采购合同).';

COMMENT ON COLUMN public.purchase_orders.cg_number IS
  'Business-facing contract number for CG. Backfilled from legacy po_number.';

-- ============================================================
-- 5. 默认绑定主链模板
-- ============================================================
INSERT INTO public.document_template_bindings (
  flow_code,
  node_code,
  document_code,
  template_id,
  template_version_id,
  is_default
)
SELECT
  'inq_qr_xj_bj_qt_sc_cg',
  m.node_code,
  m.document_code,
  t.id,
  v.id,
  TRUE
FROM (
  VALUES
    ('inq-create', 'INQ', 'tpl_inq'),
    ('qr-create',  'QR',  'tpl_qr'),
    ('xj-create',  'XJ',  'tpl_xj'),
    ('bj-review',  'BJ',  'tpl_bj'),
    ('qt-create',  'QT',  'tpl_qt'),
    ('sc-create',  'SC',  'tpl_sc'),
    ('cg-create',  'CG',  'tpl_cg')
) AS m(node_code, document_code, template_code)
JOIN public.document_templates t
  ON t.template_code = m.template_code
JOIN public.document_template_versions v
  ON v.template_id = t.id
 AND v.version_no = 1
ON CONFLICT (flow_code, node_code, document_code, template_version_id) DO NOTHING;

-- ============================================================
-- 6. Realtime 发布（安全判重）
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'document_templates'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.document_templates;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'document_template_versions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.document_template_versions;
  END IF;
END;
$$;

COMMIT;
