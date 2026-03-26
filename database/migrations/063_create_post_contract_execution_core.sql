-- ============================================================
-- Migration 063: 后段蓝图第一批真实执行表
-- 范围：CG执行、供应商自检、QC验货、国内集货、装柜执行
-- ============================================================

-- 前提：public.set_updated_at() 已存在

-- ============================================================
-- 1. purchase_order_execution
-- 为 purchase_orders(CG) 增加执行层，不污染合同主状态
-- ============================================================
CREATE TABLE IF NOT EXISTS public.purchase_order_execution (
  id                                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id                 UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  execution_status                  TEXT NOT NULL DEFAULT 'supplier_pending_confirmation',
  supplier_confirmed_at             TIMESTAMPTZ,
  supplier_rejected_at              TIMESTAMPTZ,
  supplier_reply_notes              TEXT,
  sample_required                   BOOLEAN NOT NULL DEFAULT FALSE,
  sample_confirmed_at               TIMESTAMPTZ,
  production_started_at             TIMESTAMPTZ,
  estimated_completion_date         DATE,
  production_completed_at           TIMESTAMPTZ,
  supplier_self_inspection_status   TEXT NOT NULL DEFAULT 'pending',
  qc_inspection_status              TEXT NOT NULL DEFAULT 'pending',
  finished_goods_confirmed_at       TIMESTAMPTZ,
  customer_balance_status           TEXT NOT NULL DEFAULT 'pending',
  supplier_balance_status           TEXT NOT NULL DEFAULT 'pending',
  fulfillment_mode                  TEXT,
  consolidation_required            BOOLEAN NOT NULL DEFAULT FALSE,
  shipment_readiness_status         TEXT NOT NULL DEFAULT 'pending',
  remarks                           TEXT,
  created_at                        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_purchase_order_execution_po UNIQUE (purchase_order_id),
  CONSTRAINT chk_purchase_order_execution_status CHECK (
    execution_status IN (
      'supplier_pending_confirmation',
      'supplier_confirmed',
      'sampling',
      'in_production',
      'supplier_self_inspection_pending',
      'supplier_self_inspection_submitted',
      'qc_pending',
      'qc_passed',
      'qc_failed',
      'finished_goods_ready',
      'awaiting_loading',
      'loaded',
      'shipped',
      'completed'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_purchase_order_execution_po_id
  ON public.purchase_order_execution (purchase_order_id);

CREATE INDEX IF NOT EXISTS idx_purchase_order_execution_status
  ON public.purchase_order_execution (execution_status);

DROP TRIGGER IF EXISTS trg_purchase_order_execution_updated_at ON public.purchase_order_execution;
CREATE TRIGGER trg_purchase_order_execution_updated_at
  BEFORE UPDATE ON public.purchase_order_execution
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.purchase_order_execution IS
  'Execution layer for CG/purchase_orders. Stores post-contract operational workflow state.';

-- ============================================================
-- 2. supplier_inspection_reports
-- 供应商自检与资料上传
-- ============================================================
CREATE TABLE IF NOT EXISTS public.supplier_inspection_reports (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id     UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  report_no             TEXT NOT NULL UNIQUE,
  supplier_id           TEXT,
  inspection_date       DATE,
  result                TEXT NOT NULL DEFAULT 'pending',
  summary               TEXT,
  defect_notes          TEXT,
  attachments           JSONB NOT NULL DEFAULT '[]'::jsonb,
  submitted_by          TEXT,
  submitted_from_portal TEXT,
  verified_by_qc        TEXT,
  verified_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_supplier_inspection_result CHECK (
    result IN ('pending', 'pass', 'fail', 'pass_with_remark')
  )
);

CREATE INDEX IF NOT EXISTS idx_supplier_inspection_reports_po_id
  ON public.supplier_inspection_reports (purchase_order_id);

DROP TRIGGER IF EXISTS trg_supplier_inspection_reports_updated_at ON public.supplier_inspection_reports;
CREATE TRIGGER trg_supplier_inspection_reports_updated_at
  BEFORE UPDATE ON public.supplier_inspection_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 3. qc_inspection_orders
-- 我方QC验货任务与结果
-- ============================================================
CREATE TABLE IF NOT EXISTS public.qc_inspection_orders (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id        UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  inspection_no            TEXT NOT NULL UNIQUE,
  inspection_type          TEXT NOT NULL DEFAULT 'pre_shipment',
  scheduled_date           DATE,
  inspector_id             TEXT,
  inspector_name           TEXT,
  status                   TEXT NOT NULL DEFAULT 'pending',
  result                   TEXT NOT NULL DEFAULT 'pending',
  factory_name             TEXT,
  inspection_location      TEXT,
  report_files             JSONB NOT NULL DEFAULT '[]'::jsonb,
  photos                   JSONB NOT NULL DEFAULT '[]'::jsonb,
  third_party_agency_id    TEXT,
  third_party_agency_name  TEXT,
  remarks                  TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_qc_inspection_order_status CHECK (
    status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled')
  ),
  CONSTRAINT chk_qc_inspection_order_result CHECK (
    result IN ('pending', 'pass', 'fail', 'pass_with_remark')
  )
);

CREATE INDEX IF NOT EXISTS idx_qc_inspection_orders_po_id
  ON public.qc_inspection_orders (purchase_order_id);

DROP TRIGGER IF EXISTS trg_qc_inspection_orders_updated_at ON public.qc_inspection_orders;
CREATE TRIGGER trg_qc_inspection_orders_updated_at
  BEFORE UPDATE ON public.qc_inspection_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 4. domestic_transfer_orders
-- 国内集货主单
-- ============================================================
CREATE TABLE IF NOT EXISTS public.domestic_transfer_orders (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_no               TEXT NOT NULL UNIQUE,
  purchase_order_id         UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  shipment_no               TEXT,
  source_party_type         TEXT NOT NULL,
  source_party_id           TEXT,
  source_location_id        TEXT,
  destination_party_type    TEXT NOT NULL,
  destination_party_id      TEXT,
  destination_location_id   TEXT,
  carrier_type              TEXT,
  carrier_id                TEXT,
  carrier_name              TEXT,
  driver_name               TEXT,
  driver_phone              TEXT,
  vehicle_no                TEXT,
  transport_mode            TEXT,
  pickup_date               DATE,
  planned_arrival_date      DATE,
  actual_departure_at       TIMESTAMPTZ,
  actual_arrival_at         TIMESTAMPTZ,
  tracking_no               TEXT,
  freight_currency          TEXT NOT NULL DEFAULT 'CNY',
  freight_amount            NUMERIC NOT NULL DEFAULT 0,
  freight_charge_party      TEXT,
  freight_advance_party     TEXT,
  freight_settlement_party  TEXT,
  freight_payment_status    TEXT NOT NULL DEFAULT 'pending',
  status                    TEXT NOT NULL DEFAULT 'draft',
  remarks                   TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_domestic_transfer_status CHECK (
    status IN (
      'draft',
      'freight_pending',
      'freight_confirmed',
      'picked_up',
      'in_transit',
      'arrived',
      'received',
      'exception_pending',
      'closed',
      'cancelled'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_domestic_transfer_orders_po_id
  ON public.domestic_transfer_orders (purchase_order_id);

CREATE INDEX IF NOT EXISTS idx_domestic_transfer_orders_status
  ON public.domestic_transfer_orders (status);

DROP TRIGGER IF EXISTS trg_domestic_transfer_orders_updated_at ON public.domestic_transfer_orders;
CREATE TRIGGER trg_domestic_transfer_orders_updated_at
  BEFORE UPDATE ON public.domestic_transfer_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 5. cargo_lots
-- 货物批次主对象
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cargo_lots (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cargo_lot_no              TEXT NOT NULL UNIQUE,
  purchase_order_id         UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  sales_contract_id         UUID,
  source_supplier_id        TEXT,
  source_location_id        TEXT,
  current_location_type     TEXT,
  current_location_id       TEXT,
  final_loading_location_id TEXT,
  product_id                TEXT,
  product_name              TEXT NOT NULL DEFAULT '',
  model_no                  TEXT,
  specification             TEXT,
  hs_code                   TEXT,
  packages                  NUMERIC NOT NULL DEFAULT 0,
  quantity                  NUMERIC NOT NULL DEFAULT 0,
  unit                      TEXT,
  gross_weight              NUMERIC NOT NULL DEFAULT 0,
  net_weight                NUMERIC NOT NULL DEFAULT 0,
  volume_cbm                NUMERIC NOT NULL DEFAULT 0,
  packing_type              TEXT,
  has_wood_packing          BOOLEAN NOT NULL DEFAULT FALSE,
  requires_inspection       BOOLEAN NOT NULL DEFAULT FALSE,
  requires_co               BOOLEAN NOT NULL DEFAULT FALSE,
  requires_fumigation       BOOLEAN NOT NULL DEFAULT FALSE,
  status                    TEXT NOT NULL DEFAULT 'planned',
  ready_date                DATE,
  loaded_at                 TIMESTAMPTZ,
  shipped_at                TIMESTAMPTZ,
  remarks                   TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_cargo_lots_status CHECK (
    status IN (
      'planned',
      'ready_at_supplier',
      'awaiting_transfer',
      'in_domestic_transit',
      'arrived_at_consolidation_point',
      'waiting_loading',
      'partially_loaded',
      'fully_loaded',
      'shipped',
      'cancelled'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_cargo_lots_po_id
  ON public.cargo_lots (purchase_order_id);

CREATE INDEX IF NOT EXISTS idx_cargo_lots_status
  ON public.cargo_lots (status);

DROP TRIGGER IF EXISTS trg_cargo_lots_updated_at ON public.cargo_lots;
CREATE TRIGGER trg_cargo_lots_updated_at
  BEFORE UPDATE ON public.cargo_lots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 6. domestic_transfer_order_items
-- 国内转运明细
-- ============================================================
CREATE TABLE IF NOT EXISTS public.domestic_transfer_order_items (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_order_id  UUID NOT NULL REFERENCES public.domestic_transfer_orders(id) ON DELETE CASCADE,
  cargo_lot_id       UUID REFERENCES public.cargo_lots(id) ON DELETE SET NULL,
  product_id         TEXT,
  product_name       TEXT NOT NULL DEFAULT '',
  model_no           TEXT,
  packages           NUMERIC NOT NULL DEFAULT 0,
  quantity           NUMERIC NOT NULL DEFAULT 0,
  unit               TEXT,
  gross_weight       NUMERIC NOT NULL DEFAULT 0,
  net_weight         NUMERIC NOT NULL DEFAULT 0,
  volume_cbm         NUMERIC NOT NULL DEFAULT 0,
  packing_desc       TEXT,
  remarks            TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_domestic_transfer_order_items_transfer_id
  ON public.domestic_transfer_order_items (transfer_order_id);

-- ============================================================
-- 7. cargo_receipts
-- 到货清点主单
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cargo_receipts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_no            TEXT NOT NULL UNIQUE,
  transfer_order_id     UUID NOT NULL REFERENCES public.domestic_transfer_orders(id) ON DELETE CASCADE,
  receipt_status        TEXT NOT NULL DEFAULT 'draft',
  receiver_party_type   TEXT,
  receiver_party_id     TEXT,
  receiver_location_id  TEXT,
  received_at           TIMESTAMPTZ,
  received_by           TEXT,
  contact_phone         TEXT,
  expected_packages     NUMERIC NOT NULL DEFAULT 0,
  received_packages     NUMERIC NOT NULL DEFAULT 0,
  expected_quantity     NUMERIC NOT NULL DEFAULT 0,
  received_quantity     NUMERIC NOT NULL DEFAULT 0,
  damage_flag           BOOLEAN NOT NULL DEFAULT FALSE,
  shortage_flag         BOOLEAN NOT NULL DEFAULT FALSE,
  overage_flag          BOOLEAN NOT NULL DEFAULT FALSE,
  variance_flag         BOOLEAN NOT NULL DEFAULT FALSE,
  photo_files           JSONB NOT NULL DEFAULT '[]'::jsonb,
  signed_files          JSONB NOT NULL DEFAULT '[]'::jsonb,
  remarks               TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_cargo_receipts_status CHECK (
    receipt_status IN ('draft', 'receiving', 'received_match', 'received_with_variance', 'exception_open', 'closed')
  )
);

CREATE INDEX IF NOT EXISTS idx_cargo_receipts_transfer_order_id
  ON public.cargo_receipts (transfer_order_id);

DROP TRIGGER IF EXISTS trg_cargo_receipts_updated_at ON public.cargo_receipts;
CREATE TRIGGER trg_cargo_receipts_updated_at
  BEFORE UPDATE ON public.cargo_receipts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 8. cargo_receipt_items
-- 到货清点明细
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cargo_receipt_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id          UUID NOT NULL REFERENCES public.cargo_receipts(id) ON DELETE CASCADE,
  cargo_lot_id        UUID REFERENCES public.cargo_lots(id) ON DELETE SET NULL,
  product_id          TEXT,
  product_name        TEXT NOT NULL DEFAULT '',
  expected_packages   NUMERIC NOT NULL DEFAULT 0,
  received_packages   NUMERIC NOT NULL DEFAULT 0,
  expected_quantity   NUMERIC NOT NULL DEFAULT 0,
  received_quantity   NUMERIC NOT NULL DEFAULT 0,
  damage_qty          NUMERIC NOT NULL DEFAULT 0,
  shortage_qty        NUMERIC NOT NULL DEFAULT 0,
  remarks             TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cargo_receipt_items_receipt_id
  ON public.cargo_receipt_items (receipt_id);

-- ============================================================
-- 9. container_load_plans
-- 装柜总计划
-- ============================================================
CREATE TABLE IF NOT EXISTS public.container_load_plans (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_plan_no               TEXT NOT NULL UNIQUE,
  shipment_no                TEXT,
  sales_contract_id          UUID,
  status                     TEXT NOT NULL DEFAULT 'draft',
  container_type             TEXT NOT NULL DEFAULT '',
  container_count            INTEGER NOT NULL DEFAULT 1,
  loading_mode               TEXT,
  consolidation_mode         TEXT,
  port_of_loading            TEXT,
  port_of_destination        TEXT,
  forwarder_id               TEXT,
  truck_company_id           TEXT,
  customs_broker_id          TEXT,
  planned_etd                DATE,
  booking_cutoff_at          TIMESTAMPTZ,
  planned_customs_cutoff_at  TIMESTAMPTZ,
  planned_loading_date       DATE,
  seal_required              BOOLEAN NOT NULL DEFAULT TRUE,
  final_seal_no              TEXT,
  remarks                    TEXT,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_container_load_plans_status CHECK (
    status IN (
      'draft',
      'cargo_collecting',
      'ready_for_loading',
      'loading_in_progress',
      'awaiting_final_seal',
      'sealed',
      'sent_to_port',
      'customs_in_progress',
      'released',
      'departed',
      'closed'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_container_load_plans_status
  ON public.container_load_plans (status);

DROP TRIGGER IF EXISTS trg_container_load_plans_updated_at ON public.container_load_plans;
CREATE TRIGGER trg_container_load_plans_updated_at
  BEFORE UPDATE ON public.container_load_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 10. container_load_plan_items
-- 装柜计划货物分配
-- ============================================================
CREATE TABLE IF NOT EXISTS public.container_load_plan_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_plan_id      UUID NOT NULL REFERENCES public.container_load_plans(id) ON DELETE CASCADE,
  cargo_lot_id      UUID REFERENCES public.cargo_lots(id) ON DELETE SET NULL,
  loading_task_id   UUID,
  planned_packages  NUMERIC NOT NULL DEFAULT 0,
  planned_quantity  NUMERIC NOT NULL DEFAULT 0,
  planned_weight    NUMERIC NOT NULL DEFAULT 0,
  planned_cbm       NUMERIC NOT NULL DEFAULT 0,
  load_sequence_no  INTEGER NOT NULL DEFAULT 1,
  is_final_loaded   BOOLEAN NOT NULL DEFAULT FALSE,
  remarks           TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_container_load_plan_items_load_plan_id
  ON public.container_load_plan_items (load_plan_id);

-- ============================================================
-- 11. loading_tasks
-- 装柜任务
-- ============================================================
CREATE TABLE IF NOT EXISTS public.loading_tasks (
  id                                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loading_task_no                      TEXT NOT NULL UNIQUE,
  load_plan_id                         UUID NOT NULL REFERENCES public.container_load_plans(id) ON DELETE CASCADE,
  sequence_no                          INTEGER NOT NULL DEFAULT 1,
  task_status                          TEXT NOT NULL DEFAULT 'planned',
  loading_point_type                   TEXT,
  loading_point_id                     TEXT,
  loading_point_name                   TEXT,
  truck_company_id                     TEXT,
  container_no                         TEXT,
  seal_status                          TEXT NOT NULL DEFAULT 'not_sealed',
  seal_no                              TEXT,
  driver_name                          TEXT,
  driver_phone                         TEXT,
  vehicle_no                           TEXT,
  supervisor_name                      TEXT,
  scheduled_arrival_at                 TIMESTAMPTZ,
  actual_arrival_at                    TIMESTAMPTZ,
  loading_start_at                     TIMESTAMPTZ,
  loading_finish_at                    TIMESTAMPTZ,
  departed_at                          TIMESTAMPTZ,
  loaded_packages                      NUMERIC NOT NULL DEFAULT 0,
  loaded_quantity                      NUMERIC NOT NULL DEFAULT 0,
  loaded_weight                        NUMERIC NOT NULL DEFAULT 0,
  loaded_cbm                           NUMERIC NOT NULL DEFAULT 0,
  container_condition_ok               BOOLEAN,
  container_clean_ok                   BOOLEAN,
  container_dry_ok                     BOOLEAN,
  odor_check_ok                        BOOLEAN,
  door_lock_ok                         BOOLEAN,
  floor_check_ok                       BOOLEAN,
  empty_container_photos               JSONB NOT NULL DEFAULT '[]'::jsonb,
  half_loaded_inner_photos             JSONB NOT NULL DEFAULT '[]'::jsonb,
  full_loaded_both_doors_open_photos   JSONB NOT NULL DEFAULT '[]'::jsonb,
  left_door_open_photos                JSONB NOT NULL DEFAULT '[]'::jsonb,
  both_doors_closed_photos             JSONB NOT NULL DEFAULT '[]'::jsonb,
  remarks                              TEXT,
  created_at                           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_loading_tasks_status CHECK (
    task_status IN (
      'planned',
      'truck_dispatched',
      'arrived',
      'loading',
      'loaded',
      'departed_to_next_stop',
      'completed',
      'exception_open'
    )
  ),
  CONSTRAINT chk_loading_tasks_seal_status CHECK (
    seal_status IN ('not_sealed', 'temporary_unsealed', 'sealed_final')
  )
);

CREATE INDEX IF NOT EXISTS idx_loading_tasks_load_plan_id
  ON public.loading_tasks (load_plan_id);

CREATE INDEX IF NOT EXISTS idx_loading_tasks_status
  ON public.loading_tasks (task_status);

DROP TRIGGER IF EXISTS trg_loading_tasks_updated_at ON public.loading_tasks;
CREATE TRIGGER trg_loading_tasks_updated_at
  BEFORE UPDATE ON public.loading_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 12. loading_task_items
-- 装柜任务明细
-- ============================================================
CREATE TABLE IF NOT EXISTS public.loading_task_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loading_task_id  UUID NOT NULL REFERENCES public.loading_tasks(id) ON DELETE CASCADE,
  cargo_lot_id     UUID REFERENCES public.cargo_lots(id) ON DELETE SET NULL,
  loaded_packages  NUMERIC NOT NULL DEFAULT 0,
  loaded_quantity  NUMERIC NOT NULL DEFAULT 0,
  remarks          TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loading_task_items_loading_task_id
  ON public.loading_task_items (loading_task_id);

-- ============================================================
-- 13. loading_inspection_orders
-- 第三方监装
-- ============================================================
CREATE TABLE IF NOT EXISTS public.loading_inspection_orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_order_no   TEXT NOT NULL UNIQUE,
  load_plan_id          UUID REFERENCES public.container_load_plans(id) ON DELETE CASCADE,
  loading_task_id       UUID REFERENCES public.loading_tasks(id) ON DELETE CASCADE,
  agency_name           TEXT,
  agency_type           TEXT,
  inspector_name        TEXT,
  inspector_phone       TEXT,
  scheduled_at          TIMESTAMPTZ,
  arrived_at            TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  inspection_status     TEXT NOT NULL DEFAULT 'draft',
  inspection_result     TEXT NOT NULL DEFAULT 'pending',
  witness_container_no  TEXT,
  witness_seal_no       TEXT,
  report_no             TEXT,
  report_files          JSONB NOT NULL DEFAULT '[]'::jsonb,
  photos                JSONB NOT NULL DEFAULT '[]'::jsonb,
  remarks               TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_loading_inspection_status CHECK (
    inspection_status IN ('draft', 'requested', 'confirmed', 'on_site', 'report_uploaded', 'closed')
  ),
  CONSTRAINT chk_loading_inspection_result CHECK (
    inspection_result IN ('pending', 'passed', 'passed_with_remark', 'failed')
  )
);

CREATE INDEX IF NOT EXISTS idx_loading_inspection_orders_load_plan_id
  ON public.loading_inspection_orders (load_plan_id);

CREATE INDEX IF NOT EXISTS idx_loading_inspection_orders_loading_task_id
  ON public.loading_inspection_orders (loading_task_id);

DROP TRIGGER IF EXISTS trg_loading_inspection_orders_updated_at ON public.loading_inspection_orders;
CREATE TRIGGER trg_loading_inspection_orders_updated_at
  BEFORE UPDATE ON public.loading_inspection_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 14. RLS
-- 第一阶段沿用 authenticated 全开，后续再按角色细化
-- ============================================================
ALTER TABLE public.purchase_order_execution      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_inspection_reports   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qc_inspection_orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domestic_transfer_orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domestic_transfer_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargo_lots                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargo_receipts                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargo_receipt_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.container_load_plans          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.container_load_plan_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loading_tasks                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loading_task_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loading_inspection_orders     ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pair RECORD;
BEGIN
  FOR pair IN
    SELECT *
    FROM (VALUES
      ('auth_all_purchase_order_execution',      'purchase_order_execution'),
      ('auth_all_supplier_inspection_reports',   'supplier_inspection_reports'),
      ('auth_all_qc_inspection_orders',          'qc_inspection_orders'),
      ('auth_all_domestic_transfer_orders',      'domestic_transfer_orders'),
      ('auth_all_domestic_transfer_order_items', 'domestic_transfer_order_items'),
      ('auth_all_cargo_lots',                    'cargo_lots'),
      ('auth_all_cargo_receipts',                'cargo_receipts'),
      ('auth_all_cargo_receipt_items',           'cargo_receipt_items'),
      ('auth_all_container_load_plans',          'container_load_plans'),
      ('auth_all_container_load_plan_items',     'container_load_plan_items'),
      ('auth_all_loading_tasks',                 'loading_tasks'),
      ('auth_all_loading_task_items',            'loading_task_items'),
      ('auth_all_loading_inspection_orders',     'loading_inspection_orders')
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
-- 15. Realtime
-- 幂等加入 supabase_realtime publication
-- ============================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'purchase_order_execution',
    'supplier_inspection_reports',
    'qc_inspection_orders',
    'domestic_transfer_orders',
    'cargo_lots',
    'cargo_receipts',
    'container_load_plans',
    'loading_tasks',
    'loading_inspection_orders'
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
