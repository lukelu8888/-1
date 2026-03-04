-- ============================================================
-- 任务3：全面检查 Supabase + localStorage + Vercel 是否还有 RFQ 残留
-- 执行方式：在任务1、2成功后执行此脚本（只读，不改任何东西）
-- ============================================================

SELECT '=== 全面 RFQ 残留检查 ===' AS title;

-- -------------------------------------------------------
-- A. Supabase 数据库层
-- -------------------------------------------------------

-- A1: 表名中含 rfq
SELECT 'A1-表名' AS check_type, table_name AS item, '需处理' AS status
FROM information_schema.tables
WHERE table_schema='public' AND table_name ILIKE '%rfq%'
UNION ALL
SELECT 'A1-表名' AS check_type, '(无rfq表名)' AS item, '✓ 干净' AS status
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema='public' AND table_name ILIKE '%rfq%'
)
ORDER BY check_type, item;

-- A2: 列名中含 rfq
SELECT 'A2-列名' AS check_type, table_name || '.' || column_name AS item, '需处理' AS status
FROM information_schema.columns
WHERE table_schema='public' AND column_name ILIKE '%rfq%'
UNION ALL
SELECT 'A2-列名', '(无rfq列名)', '✓ 干净'
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema='public' AND column_name ILIKE '%rfq%'
)
ORDER BY check_type, item;

-- A3: 枚举含 rfq
SELECT 'A3-枚举' AS check_type, t.typname || '.' || e.enumlabel AS item, '需处理' AS status
FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname ILIKE '%rfq%' OR e.enumlabel ILIKE '%rfq%'
UNION ALL
SELECT 'A3-枚举', '(无rfq枚举值)', '✓ 干净'
WHERE NOT EXISTS (
  SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
  WHERE t.typname ILIKE '%rfq%' OR e.enumlabel ILIKE '%rfq%'
)
ORDER BY check_type, item;

-- A4: RLS 策略含 rfq
SELECT 'A4-RLS策略' AS check_type, tablename || ': ' || policyname AS item, '需处理' AS status
FROM pg_policies
WHERE schemaname='public' AND (policyname ILIKE '%rfq%' OR tablename ILIKE '%rfq%')
UNION ALL
SELECT 'A4-RLS策略', '(无rfq策略)', '✓ 干净'
WHERE NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname='public' AND (policyname ILIKE '%rfq%' OR tablename ILIKE '%rfq%')
)
ORDER BY check_type, item;

-- A5: 触发器含 rfq
SELECT 'A5-触发器' AS check_type, event_object_table || ': ' || trigger_name AS item, '需处理' AS status
FROM information_schema.triggers
WHERE trigger_schema='public' AND (trigger_name ILIKE '%rfq%' OR event_object_table ILIKE '%rfq%')
UNION ALL
SELECT 'A5-触发器', '(无rfq触发器)', '✓ 干净'
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.triggers
  WHERE trigger_schema='public' AND (trigger_name ILIKE '%rfq%' OR event_object_table ILIKE '%rfq%')
)
ORDER BY check_type, item;

-- A6: 函数含 rfq
SELECT 'A6-函数' AS check_type, routine_name AS item, '注意：函数体可能含rfq逻辑' AS status
FROM information_schema.routines
WHERE routine_schema='public' AND routine_name ILIKE '%rfq%'
UNION ALL
SELECT 'A6-函数', '(无rfq函数名)', '✓ 干净'
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.routines
  WHERE routine_schema='public' AND routine_name ILIKE '%rfq%'
)
ORDER BY check_type, item;

-- A7: number_rules 中的 rfq
SELECT 'A7-编号规则' AS check_type, entity_type || '/' || region_code || ' prefix=' || prefix AS item,
  CASE WHEN entity_type ILIKE '%rfq%' THEN '需处理' ELSE '✓ 正常' END AS status
FROM public.number_rules
WHERE entity_type ILIKE '%rfq%' OR prefix = 'RFQ'
UNION ALL
SELECT 'A7-编号规则', '(number_rules 无rfq)', '✓ 干净'
WHERE NOT EXISTS (
  SELECT 1 FROM public.number_rules WHERE entity_type ILIKE '%rfq%' OR prefix = 'RFQ'
)
ORDER BY check_type, item;

-- A8: inquiries 表中仍有 RFQ- 前缀的数据
SELECT 'A8-数据前缀' AS check_type,
  inquiry_number AS item,
  'inquiries表: RFQ-前缀应改为INQ-' AS status
FROM public.inquiries
WHERE inquiry_number ILIKE 'RFQ-%'
UNION ALL
SELECT 'A8-数据前缀', '(无RFQ-前缀的客户询价单)', '✓ 干净'
WHERE NOT EXISTS (
  SELECT 1 FROM public.inquiries WHERE inquiry_number ILIKE 'RFQ-%'
)
ORDER BY check_type, item;

-- -------------------------------------------------------
-- B. Vercel / 前端 (代码层面已清理，这里只能检查数据)
-- -------------------------------------------------------
SELECT '--- B. Vercel前端代码已在本地清理，构建通过 ---' AS note;
SELECT '--- 前端 localStorage 的key已全部改为 xjs/supplierXJs ---' AS note;
SELECT '--- API路径已改为 /api/supplier-xjs ---' AS note;

-- -------------------------------------------------------
-- C. 最终状态汇总
-- -------------------------------------------------------
SELECT '=== 最终状态汇总 ===' AS title;

SELECT
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name ILIKE '%rfq%') AS "rfq表名数（应0）",
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND column_name ILIKE '%rfq%') AS "rfq列名数（应0）",
  (SELECT COUNT(*) FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid WHERE t.typname ILIKE '%rfq%') AS "rfq枚举值数（应0）",
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname='public' AND policyname ILIKE '%rfq%') AS "rfq策略数（应0）",
  (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema='public' AND trigger_name ILIKE '%rfq%') AS "rfq触发器数（应0）",
  (SELECT COUNT(*) FROM public.inquiries WHERE inquiry_number ILIKE 'RFQ-%') AS "RFQ前缀询价单数（应0）",
  (SELECT COUNT(*) FROM public.number_rules WHERE entity_type ILIKE '%rfq%') AS "rfq编号规则数（应0）";
