-- ============================================================
-- Migration 065: 后段蓝图第三批真实执行表
-- 范围：开船后跟踪、到港、清关、收货、异常
-- ============================================================

-- 前提：public.set_updated_at() 已存在

-- ============================================================
-- 1. voyage_tracking
-- 承接开船后的在途主记录
-- ============================================================
CREATE TABLE IF NOT EXISTS public.voyage_tracking (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_no       TEXT NOT NULL UNIQUE,
  shipment_no       TEXT,
  load_plan_id      UUID REFERENCES public.container_load_plans(id) ON DELETE SET NULL,
  sales_contract_id UUID,
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  bl_no             TEXT,
  container_no      TEXT,
  carrier_name      TEXT,
  vessel_name       TEXT,
  voyage_no         TEXT,
  etd               DATE,
  eta               DATE,
  ata               DATE,
  current_status    TEXT NOT NULL DEFAULT 'departed',
  current_location  TEXT,
  last_event_at     TIMESTAMPTZ,
  tracking_source   TEXT,
  remarks           TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_voyage_tracking_status CHECK (
    current_status IN ('departed', 'in_transit', 'transshipment', 'arrived_at_port', 'delayed', 'exception')
  )
);

CREATE INDEX IF NOT EXISTS idx_voyage_tracking_load_plan_id
  ON public.voyage_tracking (load_plan_id);

CREATE INDEX IF NOT EXISTS idx_voyage_tracking_shipment_no
  ON public.voyage_tracking (shipment_no);

DROP TRIGGER IF EXISTS trg_voyage_tracking_updated_at ON public.voyage_tracking;
CREATE TRIGGER trg_voyage_tracking_updated_at
  BEFORE UPDATE ON public.voyage_tracking
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 2. voyage_tracking_events
-- 航次事件明细
-- ============================================================
CREATE TABLE IF NOT EXISTS public.voyage_tracking_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voyage_id      UUID NOT NULL REFERENCES public.voyage_tracking(id) ON DELETE CASCADE,
  event_code     TEXT,
  event_name     TEXT NOT NULL,
  event_time     TIMESTAMPTZ,
  location       TEXT,
  source         TEXT,
  remarks        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voyage_tracking_events_voyage_id
  ON public.voyage_tracking_events (voyage_id);

-- ============================================================
-- 3. arrival_notices
-- 到港通知
-- ============================================================
CREATE TABLE IF NOT EXISTS public.arrival_notices (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arrival_notice_no   TEXT NOT NULL UNIQUE,
  shipment_no         TEXT,
  voyage_id           UUID REFERENCES public.voyage_tracking(id) ON DELETE SET NULL,
  load_plan_id        UUID REFERENCES public.container_load_plans(id) ON DELETE SET NULL,
  bl_no               TEXT,
  arrival_port        TEXT,
  arrival_at          TIMESTAMPTZ,
  free_days           INTEGER,
  demurrage_rule      TEXT,
  sent_to_customer_at TIMESTAMPTZ,
  sent_to_agent_at    TIMESTAMPTZ,
  status              TEXT NOT NULL DEFAULT 'draft',
  files               JSONB NOT NULL DEFAULT '[]'::jsonb,
  remarks             TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_arrival_notices_status CHECK (
    status IN ('draft', 'ready', 'sent', 'acknowledged')
  )
);

CREATE INDEX IF NOT EXISTS idx_arrival_notices_voyage_id
  ON public.arrival_notices (voyage_id);

DROP TRIGGER IF EXISTS trg_arrival_notices_updated_at ON public.arrival_notices;
CREATE TRIGGER trg_arrival_notices_updated_at
  BEFORE UPDATE ON public.arrival_notices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 4. import_clearance_coordination
-- 目的港清关协同
-- ============================================================
CREATE TABLE IF NOT EXISTS public.import_clearance_coordination (
  id                                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clearance_no                       TEXT NOT NULL UNIQUE,
  shipment_no                        TEXT,
  voyage_id                          UUID REFERENCES public.voyage_tracking(id) ON DELETE SET NULL,
  arrival_notice_id                  UUID REFERENCES public.arrival_notices(id) ON DELETE SET NULL,
  customer_id                        TEXT,
  destination_country                TEXT,
  destination_port                   TEXT,
  import_broker_name                 TEXT,
  import_broker_contact              TEXT,
  import_clearance_responsibility    TEXT,
  destination_delivery_responsibility TEXT,
  clearance_status                   TEXT NOT NULL DEFAULT 'not_started',
  doc_status                         TEXT NOT NULL DEFAULT 'pending',
  customs_release_at                 TIMESTAMPTZ,
  duty_paid_flag                     BOOLEAN NOT NULL DEFAULT FALSE,
  delivery_order_received            BOOLEAN NOT NULL DEFAULT FALSE,
  remarks                            TEXT,
  created_at                         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_import_clearance_coordination_status CHECK (
    clearance_status IN ('not_started', 'documents_sent', 'under_clearance', 'hold', 'released', 'delivered_to_customer')
  )
);

CREATE INDEX IF NOT EXISTS idx_import_clearance_coordination_voyage_id
  ON public.import_clearance_coordination (voyage_id);

DROP TRIGGER IF EXISTS trg_import_clearance_coordination_updated_at ON public.import_clearance_coordination;
CREATE TRIGGER trg_import_clearance_coordination_updated_at
  BEFORE UPDATE ON public.import_clearance_coordination
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 5. delivery_confirmations
-- 客户提货/收货确认
-- ============================================================
CREATE TABLE IF NOT EXISTS public.delivery_confirmations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_confirm_no TEXT NOT NULL UNIQUE,
  shipment_no         TEXT,
  voyage_id           UUID REFERENCES public.voyage_tracking(id) ON DELETE SET NULL,
  clearance_id        UUID REFERENCES public.import_clearance_coordination(id) ON DELETE SET NULL,
  customer_id         TEXT,
  delivered_at        TIMESTAMPTZ,
  received_by         TEXT,
  received_quantity   NUMERIC NOT NULL DEFAULT 0,
  damage_flag         BOOLEAN NOT NULL DEFAULT FALSE,
  shortage_flag       BOOLEAN NOT NULL DEFAULT FALSE,
  claim_flag          BOOLEAN NOT NULL DEFAULT FALSE,
  pod_files           JSONB NOT NULL DEFAULT '[]'::jsonb,
  photos              JSONB NOT NULL DEFAULT '[]'::jsonb,
  remarks             TEXT,
  status              TEXT NOT NULL DEFAULT 'pending',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_delivery_confirmations_status CHECK (
    status IN ('pending', 'received_ok', 'received_with_issue', 'claim_open', 'closed')
  )
);

CREATE INDEX IF NOT EXISTS idx_delivery_confirmations_voyage_id
  ON public.delivery_confirmations (voyage_id);

DROP TRIGGER IF EXISTS trg_delivery_confirmations_updated_at ON public.delivery_confirmations;
CREATE TRIGGER trg_delivery_confirmations_updated_at
  BEFORE UPDATE ON public.delivery_confirmations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 6. delivery_exceptions
-- 交付异常/索赔/延误
-- ============================================================
CREATE TABLE IF NOT EXISTS public.delivery_exceptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exception_no        TEXT NOT NULL UNIQUE,
  shipment_no         TEXT,
  voyage_id           UUID REFERENCES public.voyage_tracking(id) ON DELETE SET NULL,
  delivery_confirm_id UUID REFERENCES public.delivery_confirmations(id) ON DELETE SET NULL,
  exception_type      TEXT NOT NULL,
  reported_by         TEXT,
  reported_at         TIMESTAMPTZ,
  responsible_party   TEXT,
  financial_impact    NUMERIC,
  status              TEXT NOT NULL DEFAULT 'open',
  evidence_files      JSONB NOT NULL DEFAULT '[]'::jsonb,
  resolution_notes    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_delivery_exceptions_type CHECK (
    exception_type IN ('delay', 'shortage', 'damage', 'wrong_delivery', 'clearance_hold', 'document_missing')
  ),
  CONSTRAINT chk_delivery_exceptions_status CHECK (
    status IN ('open', 'investigating', 'awaiting_compensation', 'resolved', 'closed')
  )
);

CREATE INDEX IF NOT EXISTS idx_delivery_exceptions_voyage_id
  ON public.delivery_exceptions (voyage_id);

DROP TRIGGER IF EXISTS trg_delivery_exceptions_updated_at ON public.delivery_exceptions;
CREATE TRIGGER trg_delivery_exceptions_updated_at
  BEFORE UPDATE ON public.delivery_exceptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 7. RLS
-- 第一阶段沿用 authenticated 全开，后续再按角色细化
-- ============================================================
ALTER TABLE public.voyage_tracking               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voyage_tracking_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arrival_notices               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_clearance_coordination ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_confirmations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_exceptions           ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pair RECORD;
BEGIN
  FOR pair IN
    SELECT *
    FROM (VALUES
      ('auth_all_voyage_tracking',               'voyage_tracking'),
      ('auth_all_voyage_tracking_events',        'voyage_tracking_events'),
      ('auth_all_arrival_notices',               'arrival_notices'),
      ('auth_all_import_clearance_coordination', 'import_clearance_coordination'),
      ('auth_all_delivery_confirmations',        'delivery_confirmations'),
      ('auth_all_delivery_exceptions',           'delivery_exceptions')
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
-- 8. Realtime
-- 幂等加入 supabase_realtime publication
-- ============================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'voyage_tracking',
    'arrival_notices',
    'import_clearance_coordination',
    'delivery_confirmations',
    'delivery_exceptions'
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
