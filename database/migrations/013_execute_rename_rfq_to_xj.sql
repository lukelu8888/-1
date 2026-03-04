-- ============================================================
-- 正式执行：基于诊断结果的精确迁移脚本
-- 诊断日期：2026-02-26
-- 执行方式：在 Supabase SQL Editor 整段粘贴，一次执行
-- ============================================================

BEGIN;

-- ============================================================
-- PART A：采购询价 RFQ → XJ
-- ============================================================

-- -------------------------------------------------------
-- A1: 重命名表 supplier_rfqs → supplier_xjs
-- -------------------------------------------------------
ALTER TABLE public.supplier_rfqs RENAME TO supplier_xjs;

-- -------------------------------------------------------
-- A2: 重命名列
-- supplier_xjs.rfq_number     → xj_number
-- supplier_xjs.supplier_rfq_no → supplier_xj_no
-- -------------------------------------------------------
ALTER TABLE public.supplier_xjs RENAME COLUMN rfq_number TO xj_number;
ALTER TABLE public.supplier_xjs RENAME COLUMN supplier_rfq_no TO supplier_xj_no;

-- -------------------------------------------------------
-- A3: 重命名枚举类型
-- rfq_status → xj_status
-- qr_status 中的枚举值 rfq_sent → xj_sent
-- -------------------------------------------------------
ALTER TYPE public.rfq_status RENAME TO xj_status;

ALTER TYPE public.qr_status RENAME VALUE 'rfq_sent' TO 'xj_sent';

-- -------------------------------------------------------
-- A4: 重命名 RLS 策略（6条）
-- -------------------------------------------------------
ALTER POLICY rfq_admin_delete   ON public.supplier_xjs RENAME TO xj_admin_delete;
ALTER POLICY rfq_staff_insert   ON public.supplier_xjs RENAME TO xj_staff_insert;
ALTER POLICY rfq_staff_select   ON public.supplier_xjs RENAME TO xj_staff_select;
ALTER POLICY rfq_staff_update   ON public.supplier_xjs RENAME TO xj_staff_update;
ALTER POLICY rfq_supplier_select ON public.supplier_xjs RENAME TO xj_supplier_select;
ALTER POLICY rfq_supplier_update ON public.supplier_xjs RENAME TO xj_supplier_update;

-- -------------------------------------------------------
-- A5: 重建触发器（PostgreSQL 不支持 RENAME TRIGGER）
-- 4个触发器全部在 supplier_xjs 上
-- -------------------------------------------------------

-- trg_rfq_auto_tenant → trg_xj_auto_tenant
DROP TRIGGER IF EXISTS trg_rfq_auto_tenant ON public.supplier_xjs;
CREATE TRIGGER trg_xj_auto_tenant
  BEFORE INSERT ON public.supplier_xjs
  FOR EACH ROW EXECUTE FUNCTION auto_fill_tenant_id();

-- trg_rfq_fill_region → trg_xj_fill_region（有重复，统一处理）
DROP TRIGGER IF EXISTS trg_rfq_fill_region ON public.supplier_xjs;
CREATE TRIGGER trg_xj_fill_region
  BEFORE INSERT ON public.supplier_xjs
  FOR EACH ROW EXECUTE FUNCTION fill_rfq_region_code();

-- trg_rfq_updated_at → trg_xj_updated_at
DROP TRIGGER IF EXISTS trg_rfq_updated_at ON public.supplier_xjs;
CREATE TRIGGER trg_xj_updated_at
  BEFORE UPDATE ON public.supplier_xjs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -------------------------------------------------------
-- A6: 重命名函数 fill_rfq_region_code → fill_xj_region_code
-- -------------------------------------------------------
ALTER FUNCTION public.fill_rfq_region_code() RENAME TO fill_xj_region_code;

-- 同步更新触发器引用新函数名（重建 trg_xj_fill_region）
DROP TRIGGER IF EXISTS trg_xj_fill_region ON public.supplier_xjs;
CREATE TRIGGER trg_xj_fill_region
  BEFORE INSERT ON public.supplier_xjs
  FOR EACH ROW EXECUTE FUNCTION fill_xj_region_code();

-- -------------------------------------------------------
-- A7: number_rules — 处理 rfq/supplier_rfq 行
-- 因为 xj 记录已存在（之前手动添加），所以冲突的旧行直接 retired
-- 不能改 entity_type（会触发唯一约束冲突）
-- -------------------------------------------------------
UPDATE public.number_rules
SET status = 'retired'
WHERE entity_type IN ('rfq', 'supplier_rfq');

-- -------------------------------------------------------
-- A8: Realtime 订阅更新
-- -------------------------------------------------------
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.supplier_rfqs;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'supplier_xjs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.supplier_xjs;
  END IF;
END $$;

-- ============================================================
-- PART B：客户询价 RFQ- 前缀 → INQ-
-- 只改 inquiries 表（客户询价，主体是客户，前缀应为 INQ）
-- ============================================================

-- B1: 修复 inquiries 表中 3 条 RFQ- 前缀数据
UPDATE public.inquiries
SET inquiry_number = replace(inquiry_number, 'RFQ-', 'INQ-')
WHERE inquiry_number ILIKE 'RFQ-%';

-- B2: 同步更新引用了这些询价单号的关联表
-- quotation_requests.source_inquiry_number
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'quotation_requests'
      AND column_name = 'source_inquiry_number'
  ) THEN
    UPDATE public.quotation_requests
    SET source_inquiry_number = replace(source_inquiry_number, 'RFQ-', 'INQ-')
    WHERE source_inquiry_number ILIKE 'RFQ-%';
  END IF;
END $$;

-- sales_quotations.inquiry_number（如果存在）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sales_quotations'
      AND column_name = 'inquiry_number'
  ) THEN
    UPDATE public.sales_quotations
    SET inquiry_number = replace(inquiry_number, 'RFQ-', 'INQ-')
    WHERE inquiry_number ILIKE 'RFQ-%';
  END IF;
END $$;

-- sales_contracts.inquiry_number（如果存在）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sales_contracts'
      AND column_name = 'inquiry_number'
  ) THEN
    UPDATE public.sales_contracts
    SET inquiry_number = replace(inquiry_number, 'RFQ-', 'INQ-')
    WHERE inquiry_number ILIKE 'RFQ-%';
  END IF;
END $$;

COMMIT;

-- ============================================================
-- 验证（COMMIT 后执行，确认结果）
-- ============================================================

-- V1: 确认表已重命名（应返回 supplier_xjs，不返回 supplier_rfqs）
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('supplier_xjs', 'supplier_rfqs')
ORDER BY table_name;

-- V2: 确认没有 rfq 列名残留
SELECT table_name, column_name FROM information_schema.columns
WHERE table_schema = 'public' AND column_name ILIKE '%rfq%';

-- V3: 确认枚举已改名
SELECT typname FROM pg_type WHERE typname IN ('rfq_status', 'xj_status');

-- V4: 确认 RLS 策略已改名
SELECT policyname FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'supplier_xjs'
ORDER BY policyname;

-- V5: 确认触发器已更新
SELECT trigger_name, event_object_table FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND (trigger_name ILIKE '%rfq%' OR trigger_name ILIKE '%xj%')
ORDER BY trigger_name;

-- V6: 确认函数已重命名
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name ILIKE '%rfq%' OR routine_name ILIKE '%xj%region%';

-- V7: 确认 number_rules 中 rfq/supplier_rfq 已 retired，xj 仍 active
SELECT entity_type, region_code, prefix, status
FROM public.number_rules
WHERE entity_type IN ('rfq', 'supplier_rfq', 'xj', 'inquiry')
ORDER BY entity_type, region_code;
-- 期望结果：rfq/supplier_rfq 状态为 retired，xj 状态为 active

-- V8: 确认 inquiries 中无 RFQ- 前缀（应全为 INQ-）
SELECT
  CASE
    WHEN inquiry_number ILIKE 'INQ-%' THEN 'INQ- ✓ 正确'
    WHEN inquiry_number ILIKE 'RFQ-%' THEN 'RFQ- ✗ 未修复'
    ELSE '其他: ' || LEFT(inquiry_number, 8)
  END AS prefix_status,
  COUNT(*) AS count
FROM public.inquiries
GROUP BY 1 ORDER BY 1;
