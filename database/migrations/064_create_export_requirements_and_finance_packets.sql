-- ============================================================
-- Migration 064: 后段蓝图第二批真实执行表
-- 范围：出口要求判定 + 财务合规文件包
-- ============================================================

-- 前提：public.set_updated_at() 已存在

-- ============================================================
-- 1. export_requirement_checks
-- 报关前统一判定商检/CO/熏蒸/第三方监装报告等要求
-- ============================================================
CREATE TABLE IF NOT EXISTS public.export_requirement_checks (
  id                                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_no                           TEXT NOT NULL UNIQUE,
  sales_contract_id                  UUID,
  purchase_order_id                  UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  shipment_no                        TEXT,
  load_plan_id                       UUID REFERENCES public.container_load_plans(id) ON DELETE SET NULL,
  destination_country                TEXT,
  trade_term                         TEXT,
  customer_id                        TEXT,
  requires_customs_declaration       BOOLEAN NOT NULL DEFAULT TRUE,
  requires_inspection                BOOLEAN NOT NULL DEFAULT FALSE,
  requires_co                        BOOLEAN NOT NULL DEFAULT FALSE,
  requires_fumigation                BOOLEAN NOT NULL DEFAULT FALSE,
  requires_loading_inspection_report BOOLEAN NOT NULL DEFAULT FALSE,
  requires_health_certificate        BOOLEAN NOT NULL DEFAULT FALSE,
  requires_other_docs                BOOLEAN NOT NULL DEFAULT FALSE,
  other_doc_notes                    TEXT,
  checked_by                         TEXT,
  checked_at                         TIMESTAMPTZ,
  status                             TEXT NOT NULL DEFAULT 'draft',
  created_at                         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_export_requirement_checks_status CHECK (
    status IN ('draft', 'checking', 'confirmed', 'documents_pending', 'ready_for_customs')
  )
);

CREATE INDEX IF NOT EXISTS idx_export_requirement_checks_po_id
  ON public.export_requirement_checks (purchase_order_id);

CREATE INDEX IF NOT EXISTS idx_export_requirement_checks_load_plan_id
  ON public.export_requirement_checks (load_plan_id);

DROP TRIGGER IF EXISTS trg_export_requirement_checks_updated_at ON public.export_requirement_checks;
CREATE TRIGGER trg_export_requirement_checks_updated_at
  BEFORE UPDATE ON public.export_requirement_checks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 2. finance_compliance_packets
-- 单票业务财务合规总包
-- ============================================================
CREATE TABLE IF NOT EXISTS public.finance_compliance_packets (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_no            TEXT NOT NULL UNIQUE,
  export_case_no       TEXT,
  sales_contract_id    UUID,
  purchase_order_id    UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  load_plan_id         UUID REFERENCES public.container_load_plans(id) ON DELETE SET NULL,
  export_check_id      UUID REFERENCES public.export_requirement_checks(id) ON DELETE SET NULL,
  sc_no                TEXT,
  cg_no                TEXT,
  shipment_no          TEXT,
  load_plan_no         TEXT,
  customs_decl_no      TEXT,
  customer_id          TEXT,
  customer_name        TEXT NOT NULL DEFAULT '',
  region               TEXT,
  currency             TEXT NOT NULL DEFAULT 'USD',
  trade_term           TEXT,
  destination_country  TEXT,
  status               TEXT NOT NULL DEFAULT 'draft',
  doc_ready_percent    NUMERIC NOT NULL DEFAULT 0,
  tax_refund_ready     BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at          TIMESTAMPTZ,
  created_by           TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_finance_compliance_packets_status CHECK (
    status IN ('draft', 'collecting', 'partially_ready', 'ready_for_fx_docs', 'ready_for_tax_refund', 'archived')
  )
);

CREATE INDEX IF NOT EXISTS idx_finance_compliance_packets_po_id
  ON public.finance_compliance_packets (purchase_order_id);

CREATE INDEX IF NOT EXISTS idx_finance_compliance_packets_shipment_no
  ON public.finance_compliance_packets (shipment_no);

DROP TRIGGER IF EXISTS trg_finance_compliance_packets_updated_at ON public.finance_compliance_packets;
CREATE TRIGGER trg_finance_compliance_packets_updated_at
  BEFORE UPDATE ON public.finance_compliance_packets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.finance_compliance_packets IS
  'Finance compliance packet for one export case. Stores financial document readiness and archival state.';

-- ============================================================
-- 3. finance_packet_document_slots
-- D01-D13 固定槽位
-- ============================================================
CREATE TABLE IF NOT EXISTS public.finance_packet_document_slots (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id          UUID NOT NULL REFERENCES public.finance_compliance_packets(id) ON DELETE CASCADE,
  doc_code           TEXT NOT NULL,
  doc_name           TEXT NOT NULL,
  doc_category       TEXT,
  is_required        BOOLEAN NOT NULL DEFAULT TRUE,
  requirement_rule   TEXT,
  source_type        TEXT,
  source_ref         TEXT,
  status             TEXT NOT NULL DEFAULT 'pending',
  current_file_id    UUID,
  missing_reason     TEXT,
  generated_at       TIMESTAMPTZ,
  confirmed_at       TIMESTAMPTZ,
  confirmed_by       TEXT,
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_finance_packet_document_slots UNIQUE (packet_id, doc_code),
  CONSTRAINT chk_finance_packet_document_slots_doc_code CHECK (
    doc_code IN ('D01', 'D02', 'D03', 'D04', 'D05', 'D06', 'D07', 'D08', 'D09', 'D10', 'D11', 'D12', 'D13')
  ),
  CONSTRAINT chk_finance_packet_document_slots_status CHECK (
    status IN ('not_required', 'pending', 'awaiting_upload', 'awaiting_generation', 'linked', 'uploaded', 'generated', 'verified', 'rejected')
  )
);

CREATE INDEX IF NOT EXISTS idx_finance_packet_document_slots_packet_id
  ON public.finance_packet_document_slots (packet_id);

CREATE INDEX IF NOT EXISTS idx_finance_packet_document_slots_doc_code
  ON public.finance_packet_document_slots (doc_code);

DROP TRIGGER IF EXISTS trg_finance_packet_document_slots_updated_at ON public.finance_packet_document_slots;
CREATE TRIGGER trg_finance_packet_document_slots_updated_at
  BEFORE UPDATE ON public.finance_packet_document_slots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 4. finance_packet_files
-- 槽位下的多版本文件
-- ============================================================
CREATE TABLE IF NOT EXISTS public.finance_packet_files (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id               UUID NOT NULL REFERENCES public.finance_compliance_packets(id) ON DELETE CASCADE,
  slot_id                 UUID NOT NULL REFERENCES public.finance_packet_document_slots(id) ON DELETE CASCADE,
  version_no              INTEGER NOT NULL DEFAULT 1,
  file_name               TEXT NOT NULL,
  file_type               TEXT,
  storage_bucket          TEXT,
  storage_path            TEXT,
  file_url                TEXT,
  origin_mode             TEXT NOT NULL DEFAULT 'manual_admin_upload',
  origin_ref_type         TEXT,
  origin_ref_id           TEXT,
  uploaded_from_portal    TEXT,
  uploaded_by_party_type  TEXT,
  uploaded_by_party_id    TEXT,
  is_primary_source       BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by_finance     TEXT,
  verified_at             TIMESTAMPTZ,
  uploaded_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_current              BOOLEAN NOT NULL DEFAULT FALSE,
  remarks                 TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_finance_packet_files_origin_mode CHECK (
    origin_mode IN (
      'auto_generated',
      'auto_linked',
      'manual_admin_upload',
      'supplier_portal_upload',
      'partner_portal_upload',
      'finance_upload'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_finance_packet_files_packet_id
  ON public.finance_packet_files (packet_id);

CREATE INDEX IF NOT EXISTS idx_finance_packet_files_slot_id
  ON public.finance_packet_files (slot_id);

CREATE INDEX IF NOT EXISTS idx_finance_packet_files_origin_mode
  ON public.finance_packet_files (origin_mode);

DROP TRIGGER IF EXISTS trg_finance_packet_files_updated_at ON public.finance_packet_files;
CREATE TRIGGER trg_finance_packet_files_updated_at
  BEFORE UPDATE ON public.finance_packet_files
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- current_file_id 外键回填
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_finance_packet_document_slots_current_file_id'
  ) THEN
    ALTER TABLE public.finance_packet_document_slots
      ADD CONSTRAINT fk_finance_packet_document_slots_current_file_id
      FOREIGN KEY (current_file_id)
      REFERENCES public.finance_packet_files(id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

-- ============================================================
-- 5. packet 默认槽位初始化函数
-- 创建 packet 后自动写入 D01-D13 槽位
-- ============================================================
CREATE OR REPLACE FUNCTION public.seed_finance_packet_document_slots()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.finance_packet_document_slots (
    packet_id, doc_code, doc_name, doc_category, is_required, status
  )
  VALUES
    (NEW.id, 'D01', '出口退税申报表', 'tax', true, 'awaiting_generation'),
    (NEW.id, 'D02', '购销合同/发票/付款凭证', 'trade', true, 'pending'),
    (NEW.id, 'D03', '国内运输单据及运费凭证', 'logistics', false, 'pending'),
    (NEW.id, 'D04', '国内运费免责说明', 'logistics', false, 'awaiting_generation'),
    (NEW.id, 'D05', '报关单/装箱单/提运单', 'customs', true, 'pending'),
    (NEW.id, 'D06', '委托报关合同及费用凭证', 'customs', false, 'pending'),
    (NEW.id, 'D07', '采购发票及付款凭证', 'trade', true, 'pending'),
    (NEW.id, 'D08', '报关费用免责说明', 'customs', false, 'awaiting_generation'),
    (NEW.id, 'D09', '国际运费发票及付款凭证', 'logistics', false, 'pending'),
    (NEW.id, 'D10', '国际运费免责说明', 'logistics', false, 'awaiting_generation'),
    (NEW.id, 'D11', '收汇水单', 'finance', true, 'awaiting_upload'),
    (NEW.id, 'D12', '结汇水单', 'finance', true, 'awaiting_upload'),
    (NEW.id, 'D13', '出口退（免）税收汇凭证情况表', 'tax', true, 'awaiting_generation');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_seed_finance_packet_document_slots ON public.finance_compliance_packets;
CREATE TRIGGER trg_seed_finance_packet_document_slots
  AFTER INSERT ON public.finance_compliance_packets
  FOR EACH ROW EXECUTE FUNCTION public.seed_finance_packet_document_slots();

-- ============================================================
-- 6. RLS
-- 第一阶段沿用 authenticated 全开，后续再按角色细化
-- ============================================================
ALTER TABLE public.export_requirement_checks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_compliance_packets     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_packet_document_slots  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_packet_files           ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pair RECORD;
BEGIN
  FOR pair IN
    SELECT *
    FROM (VALUES
      ('auth_all_export_requirement_checks',     'export_requirement_checks'),
      ('auth_all_finance_compliance_packets',    'finance_compliance_packets'),
      ('auth_all_finance_packet_document_slots', 'finance_packet_document_slots'),
      ('auth_all_finance_packet_files',          'finance_packet_files')
    ) AS t(policy_name, table_name)
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = pair.table_name
        AND policyname = pair.policy_name
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true);',
        pair.policy_name,
        pair.table_name
      );
    END IF;
  END LOOP;
END;
$$;

-- ============================================================
-- 7. Realtime
-- 幂等加入 supabase_realtime publication
-- ============================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'export_requirement_checks',
    'finance_compliance_packets',
    'finance_packet_document_slots',
    'finance_packet_files'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', tbl);
    END IF;
  END LOOP;
END;
$$;
