-- ============================================================
-- 借抬头出口服务 数据库迁移
-- Export Service Orders + Customer Feature Flags
-- ============================================================

-- 订单序列（ES-YYYY-NNNN）
CREATE SEQUENCE IF NOT EXISTS export_service_order_seq START 1000;

CREATE OR REPLACE FUNCTION next_export_service_id()
RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  RETURN 'ES-' || to_char(NOW(), 'YYYY') || '-' || LPAD(nextval('export_service_order_seq')::text, 4, '0');
END;
$$;

-- ─── 主订单表 ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS export_service_orders (
  id                      TEXT PRIMARY KEY DEFAULT next_export_service_id(),
  source                  TEXT NOT NULL DEFAULT 'customer_portal'
                            CHECK (source IN ('customer_portal', 'email_import')),
  type                    TEXT NOT NULL DEFAULT 'Standard'
                            CHECK (type IN ('Standard', 'Rush', 'Partial')),
  customer_name           TEXT NOT NULL,
  customer_email          TEXT,
  region                  TEXT NOT NULL DEFAULT 'NA'
                            CHECK (region IN ('NA', 'SA', 'EA')),
  manager_name            TEXT,
  sales_name              TEXT,
  tracker_name            TEXT,
  finance_name            TEXT,
  internal_stage          TEXT NOT NULL DEFAULT 'draft_request',
  current_action_role     TEXT NOT NULL DEFAULT 'Foreign Trade Manager',
  is_blocked              BOOLEAN NOT NULL DEFAULT FALSE,
  is_urgent               BOOLEAN NOT NULL DEFAULT FALSE,
  email_subject           TEXT,
  pi_number               TEXT,
  pi_amount               NUMERIC,
  pi_currency             TEXT DEFAULT 'USD',
  pi_rejection_reason     TEXT,
  pi_customer_feedback    TEXT,
  pi_customer_decision    TEXT CHECK (pi_customer_decision IN ('accepted', 'rejected')),
  freight_quotes          JSONB NOT NULL DEFAULT '[]'::jsonb,
  confirmed_forwarder     TEXT,
  confirmed_freight       NUMERIC,
  soa_amount              NUMERIC,
  soa_currency            TEXT DEFAULT 'USD',
  bl_number               TEXT,
  bl_forwarded_at         TIMESTAMPTZ,
  documents               JSONB NOT NULL DEFAULT '[]'::jsonb,
  events                  JSONB NOT NULL DEFAULT '[]'::jsonb,
  internal_notes          TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_export_service_orders_customer_email
  ON export_service_orders (customer_email);

CREATE INDEX IF NOT EXISTS idx_export_service_orders_internal_stage
  ON export_service_orders (internal_stage);

CREATE INDEX IF NOT EXISTS idx_export_service_orders_created_at
  ON export_service_orders (created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_export_service_order_ts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS export_service_orders_updated_at ON export_service_orders;
CREATE TRIGGER export_service_orders_updated_at
  BEFORE UPDATE ON export_service_orders
  FOR EACH ROW EXECUTE FUNCTION update_export_service_order_ts();

-- ─── RLS ──────────────────────────────────────────────────────

ALTER TABLE export_service_orders ENABLE ROW LEVEL SECURITY;

-- 内部用户（authenticated）可以读写所有记录
DROP POLICY IF EXISTS "authenticated can select export service orders" ON export_service_orders;
CREATE POLICY "authenticated can select export service orders"
  ON export_service_orders FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated can insert export service orders" ON export_service_orders;
CREATE POLICY "authenticated can insert export service orders"
  ON export_service_orders FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated can update export service orders" ON export_service_orders;
CREATE POLICY "authenticated can update export service orders"
  ON export_service_orders FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated can delete export service orders" ON export_service_orders;
CREATE POLICY "authenticated can delete export service orders"
  ON export_service_orders FOR DELETE TO authenticated USING (true);

-- ─── 客户功能开关表 ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customer_service_features (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  feature        TEXT NOT NULL,
  enabled        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (customer_email, feature)
);

CREATE INDEX IF NOT EXISTS idx_customer_service_features_email_feature
  ON customer_service_features (customer_email, feature);

ALTER TABLE customer_service_features ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated can manage customer service features" ON customer_service_features;
CREATE POLICY "authenticated can manage customer service features"
  ON customer_service_features FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
