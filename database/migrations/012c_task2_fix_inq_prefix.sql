-- ============================================================
-- 任务2：修复 inquiries 表中仍用 RFQ- 前缀的客户询价单号
-- 判断依据：inquiries 表 = 客户询价，前缀应为 INQ- 不是 RFQ-
-- 执行方式：在任务1成功后，在 Supabase SQL Editor 执行
-- ============================================================

-- -------------------------------------------------------
-- STEP 1: 先查看有多少条 RFQ- 前缀的客户询价单
-- -------------------------------------------------------
SELECT
  inquiry_number,
  'RFQ- 需改为 INQ-' AS action,
  replace(inquiry_number, 'RFQ-', 'INQ-') AS new_number
FROM public.inquiries
WHERE inquiry_number ILIKE 'RFQ-%'
ORDER BY inquiry_number;

-- -------------------------------------------------------
-- STEP 2: 执行替换（RFQ- → INQ-）
-- 仅针对 inquiries 表（客户询价）
-- -------------------------------------------------------
UPDATE public.inquiries
SET inquiry_number = replace(inquiry_number, 'RFQ-', 'INQ-')
WHERE inquiry_number ILIKE 'RFQ-%';

-- 记录影响行数
DO $$
DECLARE
  cnt INTEGER;
BEGIN
  GET DIAGNOSTICS cnt = ROW_COUNT;
  RAISE NOTICE '✓ inquiries 表更新了 % 条记录 RFQ- → INQ-', cnt;
END $$;

-- -------------------------------------------------------
-- STEP 3: 检查 quotation_requests / sales_quotations 中
--         source_inquiry_number 如果引用了 RFQ- 也要更新
-- -------------------------------------------------------
-- quotation_requests.source_inquiry_number
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='quotation_requests'
      AND column_name='source_inquiry_number'
  ) THEN
    UPDATE public.quotation_requests
    SET source_inquiry_number = replace(source_inquiry_number, 'RFQ-', 'INQ-')
    WHERE source_inquiry_number ILIKE 'RFQ-%';
    RAISE NOTICE '✓ quotation_requests.source_inquiry_number 已更新';
  END IF;
END $$;

-- sales_quotations.inquiry_number (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='sales_quotations'
      AND column_name='inquiry_number'
  ) THEN
    UPDATE public.sales_quotations
    SET inquiry_number = replace(inquiry_number, 'RFQ-', 'INQ-')
    WHERE inquiry_number ILIKE 'RFQ-%';
    RAISE NOTICE '✓ sales_quotations.inquiry_number 已更新';
  END IF;
END $$;

-- sales_contracts.inquiry_number (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='sales_contracts'
      AND column_name='inquiry_number'
  ) THEN
    UPDATE public.sales_contracts
    SET inquiry_number = replace(inquiry_number, 'RFQ-', 'INQ-')
    WHERE inquiry_number ILIKE 'RFQ-%';
    RAISE NOTICE '✓ sales_contracts.inquiry_number 已更新';
  END IF;
END $$;

-- -------------------------------------------------------
-- STEP 4: 检查 number_rules 中的 inquiry entity_type
-- 确保 entity_type='inquiry' 对应 prefix='INQ'（不是 RFQ）
-- -------------------------------------------------------
UPDATE public.number_rules
SET prefix = 'INQ'
WHERE entity_type = 'inquiry'
  AND prefix = 'RFQ'
  AND status != 'retired';

DO $$
DECLARE cnt INTEGER;
BEGIN
  GET DIAGNOSTICS cnt = ROW_COUNT;
  IF cnt > 0 THEN
    RAISE NOTICE '✓ number_rules: % 条 inquiry 规则的 prefix 已从 RFQ 改为 INQ', cnt;
  ELSE
    RAISE NOTICE '✓ number_rules: inquiry prefix 已经是 INQ，无需修改';
  END IF;
END $$;

-- -------------------------------------------------------
-- 验证结果
-- -------------------------------------------------------
SELECT '=== 任务2完成验证 ===' AS info;

-- 确认没有 RFQ- 前缀的询价单
SELECT
  CASE
    WHEN inquiry_number ILIKE 'INQ-%' THEN 'INQ- ✓ 正确（客户询价）'
    WHEN inquiry_number ILIKE 'RFQ-%' THEN 'RFQ- ✗ 还需处理'
    ELSE '其他: ' || LEFT(inquiry_number, 8)
  END AS prefix_status,
  COUNT(*) AS count
FROM public.inquiries
GROUP BY 1 ORDER BY 1;

-- 确认 number_rules 中 inquiry 的 prefix 是 INQ
SELECT entity_type, region_code, prefix, status
FROM public.number_rules
WHERE entity_type = 'inquiry'
ORDER BY region_code;
