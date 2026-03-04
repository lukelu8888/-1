-- ============================================================
-- Migration 016: 业务流程核心表
-- 覆盖流程: INQ → QR → XJ(供应商询价) → QT → SC → PR → CG(采购订单) + 付款
-- 表: quotation_requests, supplier_xjs, purchase_requirements,
--      purchase_orders, payments
-- ============================================================

-- ============================================================
-- 1. quotation_requests (QR) — 业务员向采购发起的报价请求
--    流程位置: INQ → [QR] → XJ
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quotation_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number  TEXT NOT NULL UNIQUE,          -- QR-xxxx
  region_code     TEXT,                           -- NA / SA / EA
  source_inquiry_id     UUID,                     -- 关联询价 INQ
  source_inquiry_number TEXT,
  customer_name   TEXT NOT NULL DEFAULT '',
  customer_email  TEXT,
  customer_company TEXT,
  products        JSONB NOT NULL DEFAULT '[]',    -- 产品明细数组
  status          TEXT NOT NULL DEFAULT 'pending', -- pending/processing/completed/cancelled
  assigned_to     TEXT,                            -- 分配给的采购员 email
  requested_by    TEXT,                            -- 发起人 email
  requested_by_name TEXT,
  request_date    DATE,
  expected_quote_date DATE,
  urgency         TEXT NOT NULL DEFAULT 'medium',  -- low/medium/high/urgent
  priority        TEXT NOT NULL DEFAULT 'medium',
  xj_ids          JSONB NOT NULL DEFAULT '[]',     -- 关联的 XJ 询价单 id 列表
  xj_count        INT  NOT NULL DEFAULT 0,
  notes           TEXT,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. supplier_xjs (XJ) — 采购向供应商发出的询价单
--    流程位置: QR → [XJ] → 供应商报价BJ
-- ============================================================
CREATE TABLE IF NOT EXISTS public.supplier_xjs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  xj_number             TEXT NOT NULL UNIQUE,      -- XJ-xxxx
  supplier_xj_no        TEXT,                       -- 供应商自己的询价编号
  supplier_quotation_no TEXT,                       -- 供应商回复的报价编号
  source_qr_number      TEXT,                       -- 来源 QR 编号
  source_inquiry_id     UUID,                       -- 来源 INQ id
  source_inquiry_number TEXT,                       -- 来源 INQ 编号
  requirement_no        TEXT,                       -- 关联采购需求编号
  source_ref            TEXT,                       -- 其他来源引用
  region_code           TEXT,
  customer_name         TEXT,
  customer_region       TEXT,
  supplier_code         TEXT NOT NULL DEFAULT '',
  supplier_name         TEXT NOT NULL DEFAULT '',
  supplier_contact      TEXT,
  supplier_email        TEXT NOT NULL DEFAULT '',
  products              JSONB NOT NULL DEFAULT '[]',  -- 询价产品列表
  product_name          TEXT NOT NULL DEFAULT '',
  model_no              TEXT NOT NULL DEFAULT '',
  specification         TEXT,
  quantity              NUMERIC NOT NULL DEFAULT 0,
  unit                  TEXT NOT NULL DEFAULT 'pcs',
  target_price          NUMERIC,
  currency              TEXT NOT NULL DEFAULT 'USD',
  expected_date         DATE,
  quotation_deadline    DATE,
  priority              TEXT NOT NULL DEFAULT 'medium',
  status                TEXT NOT NULL DEFAULT 'pending', -- pending/sent/replied/closed
  quotes                JSONB NOT NULL DEFAULT '[]',     -- 供应商回复报价列表
  remarks               TEXT,
  created_by            TEXT NOT NULL DEFAULT '',
  deleted_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. purchase_requirements (PR) — 业务员发给采购员的采购需求
--    流程位置: SC → [PR] → CG
-- ============================================================
CREATE TABLE IF NOT EXISTS public.purchase_requirements (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_number    TEXT NOT NULL UNIQUE,       -- PR-xxxx
  source_inquiry_id     UUID,
  source_inquiry_number TEXT,
  region_code           TEXT,
  customer_name         TEXT NOT NULL DEFAULT '',
  customer_email        TEXT,
  items                 JSONB NOT NULL DEFAULT '[]',  -- 采购物品明细
  status                TEXT NOT NULL DEFAULT 'pending', -- pending/assigned/processing/completed
  requested_by          TEXT,                         -- 发起人(业务员) email
  requested_by_name     TEXT,
  assigned_to           TEXT,                         -- 分配给的采购员 email
  priority              TEXT NOT NULL DEFAULT 'medium',
  notes                 TEXT,
  created_by            TEXT,
  deleted_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. purchase_orders (CG) — 采购员向工厂/供应商下的采购订单
--    流程位置: PR → [CG]
-- ============================================================
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number             TEXT NOT NULL UNIQUE,       -- CG-xxxx 或 PO-xxxx
  requirement_no        TEXT,                        -- 来源采购需求编号
  xj_number             TEXT,                        -- 关联 XJ 询价编号
  supplier_code         TEXT NOT NULL DEFAULT '',
  supplier_name         TEXT NOT NULL DEFAULT '',
  supplier_email        TEXT NOT NULL DEFAULT '',
  region_code           TEXT,
  items                 JSONB NOT NULL DEFAULT '[]',  -- 采购明细
  total_amount          NUMERIC NOT NULL DEFAULT 0,
  currency              TEXT NOT NULL DEFAULT 'USD',
  payment_terms         TEXT,                         -- 付款条款 e.g. T/T 30%
  delivery_terms        TEXT,                         -- 交货条款 e.g. FOB Shanghai
  expected_delivery_date DATE,
  status                TEXT NOT NULL DEFAULT 'draft', -- draft/sent/confirmed/production/shipped/completed/cancelled
  notes                 TEXT,
  created_by            TEXT,
  deleted_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. payments — 付款记录（含客户付给我们 + 我们付给供应商）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number  TEXT NOT NULL UNIQUE,             -- PAY-xxxx
  order_number    TEXT,                              -- 关联销售合同/订单编号
  contract_number TEXT,                              -- 关联 SC 编号
  customer_name   TEXT NOT NULL DEFAULT '',
  customer_email  TEXT NOT NULL DEFAULT '',
  amount          NUMERIC NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'USD',
  payment_type    TEXT NOT NULL DEFAULT 'deposit',   -- deposit/final/advance/refund
  payment_method  TEXT,                              -- T/T / L/C / 电汇 etc.
  status          TEXT NOT NULL DEFAULT 'pending',   -- pending/received/confirmed/overdue
  due_date        DATE,
  paid_date       DATE,
  bank_info       JSONB,                             -- 银行账户信息
  attachment_url  TEXT,                              -- 付款凭证附件 URL
  notes           TEXT,
  created_by      TEXT,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 自动更新 updated_at 触发器
-- ============================================================
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
    'quotation_requests',
    'supplier_xjs',
    'purchase_requirements',
    'purchase_orders',
    'payments'
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

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE public.quotation_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_xjs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments              ENABLE ROW LEVEL SECURITY;

-- 管理员/业务员：完全访问（service_role 或 authenticated）
-- 简单策略：authenticated 用户可读写（后续按角色细化）
CREATE POLICY IF NOT EXISTS "auth_all_quotation_requests"    ON public.quotation_requests    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "auth_all_supplier_xjs"          ON public.supplier_xjs          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "auth_all_purchase_requirements" ON public.purchase_requirements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "auth_all_purchase_orders"       ON public.purchase_orders       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "auth_all_payments"              ON public.payments              FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 索引（加速常用查询）
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_qr_status         ON public.quotation_requests (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_qr_source_inq     ON public.quotation_requests (source_inquiry_id);
CREATE INDEX IF NOT EXISTS idx_xj_supplier_email ON public.supplier_xjs (supplier_email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_xj_created_by     ON public.supplier_xjs (created_by) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_xj_status         ON public.supplier_xjs (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pr_status         ON public.purchase_requirements (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_po_status         ON public.purchase_orders (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_po_supplier_email ON public.purchase_orders (supplier_email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pay_customer_email ON public.payments (customer_email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pay_status        ON public.payments (status) WHERE deleted_at IS NULL;

-- ============================================================
-- Realtime 订阅开启
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.quotation_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.supplier_xjs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_requirements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
