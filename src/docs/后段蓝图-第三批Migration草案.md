# 后段蓝图第三批 Migration 草案

## 1. 范围

本草案继续沿着后段蓝图主线A推进，只覆盖后段链路的最后一段：

- `报关 / 开船`
- `在途跟踪`
- `到港通知`
- `清关协同`
- `客户提货 / 收货确认`
- `交付异常处理 / 结案`

本批目标：

- 让后段蓝图从 `CG` 一直落到 `收货/交付异常/结案`
- 不偏离到前段 CRM、询报价、客户前台等其它域

---

## 2. 与前两批的关系

本批默认以下真实表已经存在：

- 第一批
  - `purchase_order_execution`
  - `container_load_plans`
  - `loading_tasks`
- 第二批
  - `export_requirement_checks`
  - `finance_compliance_packets`

本批主要承接：

- `container_load_plans.sent_to_port / departed`
- `export_requirement_checks.ready_for_customs`

---

## 3. Migration 命名建议

建议新建：

- `065_create_post_shipment_tracking_and_delivery.sql`

---

## 4. 建表草案

```sql
-- ============================================================
-- Migration 065: 后段蓝图第三批真实执行表
-- 范围：开船后跟踪、到港、清关、收货、异常
-- ============================================================

-- ============================================================
-- 1. voyage_tracking
-- 作用：承接开船后的在途主记录
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
-- 作用：航次事件明细
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
-- 作用：到港通知
-- ============================================================
CREATE TABLE IF NOT EXISTS public.arrival_notices (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arrival_notice_no  TEXT NOT NULL UNIQUE,
  shipment_no        TEXT,
  voyage_id          UUID REFERENCES public.voyage_tracking(id) ON DELETE SET NULL,
  load_plan_id       UUID REFERENCES public.container_load_plans(id) ON DELETE SET NULL,
  bl_no              TEXT,
  arrival_port       TEXT,
  arrival_at         TIMESTAMPTZ,
  free_days          INTEGER,
  demurrage_rule     TEXT,
  sent_to_customer_at TIMESTAMPTZ,
  sent_to_agent_at   TIMESTAMPTZ,
  status             TEXT NOT NULL DEFAULT 'draft',
  files              JSONB NOT NULL DEFAULT '[]'::jsonb,
  remarks            TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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
-- 作用：目的港清关协同
-- ============================================================
CREATE TABLE IF NOT EXISTS public.import_clearance_coordination (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clearance_no                    TEXT NOT NULL UNIQUE,
  shipment_no                     TEXT,
  voyage_id                       UUID REFERENCES public.voyage_tracking(id) ON DELETE SET NULL,
  arrival_notice_id               UUID REFERENCES public.arrival_notices(id) ON DELETE SET NULL,
  customer_id                     TEXT,
  destination_country             TEXT,
  destination_port                TEXT,
  import_broker_name              TEXT,
  import_broker_contact           TEXT,
  import_clearance_responsibility TEXT,
  destination_delivery_responsibility TEXT,
  clearance_status                TEXT NOT NULL DEFAULT 'not_started',
  doc_status                      TEXT NOT NULL DEFAULT 'pending',
  customs_release_at              TIMESTAMPTZ,
  duty_paid_flag                  BOOLEAN NOT NULL DEFAULT FALSE,
  delivery_order_received         BOOLEAN NOT NULL DEFAULT FALSE,
  remarks                         TEXT,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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
-- 作用：客户提货/收货确认
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
-- 作用：交付异常/索赔/延误
-- ============================================================
CREATE TABLE IF NOT EXISTS public.delivery_exceptions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exception_no       TEXT NOT NULL UNIQUE,
  shipment_no        TEXT,
  voyage_id          UUID REFERENCES public.voyage_tracking(id) ON DELETE SET NULL,
  delivery_confirm_id UUID REFERENCES public.delivery_confirmations(id) ON DELETE SET NULL,
  exception_type     TEXT NOT NULL,
  reported_by        TEXT,
  reported_at        TIMESTAMPTZ,
  responsible_party  TEXT,
  financial_impact   NUMERIC,
  status             TEXT NOT NULL DEFAULT 'open',
  evidence_files     JSONB NOT NULL DEFAULT '[]'::jsonb,
  resolution_notes   TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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
ALTER TABLE public.voyage_tracking                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voyage_tracking_events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arrival_notices                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_clearance_coordination  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_confirmations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_exceptions            ENABLE ROW LEVEL SECURITY;

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
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.voyage_tracking;
ALTER PUBLICATION supabase_realtime ADD TABLE public.arrival_notices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.import_clearance_coordination;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_confirmations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_exceptions;
```

---

## 5. 与现有系统的真实挂接

### 5.1 `ShippingDocumentManagement`

现有 [ShippingDocumentManagement.tsx](/Users/luke/Documents/New%20project%202/innoshop_react20260221/src/components/admin/ShippingDocumentManagement.tsx) 已有以下概念雏形：

- `BL`
- `containerNo`
- `sealNo`
- `tracking.currentStatus`
- `customs`
- `delivery`

处理方式：

- 保留页面入口
- 逐步切换真实数据源：
  - 装柜阶段读 `container_load_plans / loading_tasks`
  - 开船后读 `voyage_tracking`
  - 到港后读 `arrival_notices`
  - 清关后读 `import_clearance_coordination`
  - 收货后读 `delivery_confirmations`

### 5.2 `OrderTracking` 等旧跟踪页

旧跟踪页如果仍使用 mock timeline：

- 可保留作视图参考
- 不得继续作为真实 tracking 主数据来源

### 5.3 财务包挂接

本批虽属主线A后段，但与主线B仍保持挂接：

- `BL / Arrival Notice / POD / Claim Evidence`
  - 可作为 `finance_packet_files.origin_ref_type`
  - 后续供 D05 或审计/索赔包引用

---

## 6. 后段蓝图收口检查

到本批为止，后段蓝图已经形成完整真实主链数据设计：

### 主线A

`CG生效`
-> `采购付款`
-> `产前样/生产`
-> `供应商自检`
-> `QC验货`
-> `国内集货`
-> `到货清点`
-> `装柜计划`
-> `装柜执行`
-> `出口要求判定`
-> `报关/开船`
-> `在途跟踪`
-> `到港通知`
-> `清关协同`
-> `收货确认`
-> `交付异常处理`
-> `结案`
-> `客户线上产品反馈`
-> `业务关闭`

### 主线B

`Finance Compliance Packet`
-> `D01-D13 固定槽位`
-> `多来源文件`
-> `财务确认有效版本`
-> `退税准备`
-> `归档`

---

## 7. 下一步建议

现在不建议继续无限展开新分析，而应该回到“执行”层：

1. 先把三批 migration 草案整理成正式 SQL 文件
2. 再决定先落第一批还是分批落库
3. 再对接前端入口页与旧页面切换方案

如果继续推进，最合理的下一步是：

- 把 `063 / 064 / 065` 三份草案写成真实 migration SQL 文件
- 或先从 `063` 开始正式落库
