-- ============================================================
-- 步骤 0：诊断查询（只读，不改任何东西）
-- 在 Supabase SQL Editor 中先执行这个，把结果截图给我看
-- ============================================================

-- 0-A: 所有含 rfq/RFQ 的表名
SELECT table_name, 'table' AS object_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name ILIKE '%rfq%' OR table_name ILIKE '%xj%' OR table_name ILIKE '%inq%' OR table_name ILIKE '%inquir%')
ORDER BY table_name;

-- 0-B: 所有含 rfq 的列名（显示表名+列名+类型）
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name ILIKE '%rfq%'
ORDER BY table_name, column_name;

-- 0-C: 所有含 rfq 的枚举类型
SELECT t.typname AS enum_name, e.enumlabel AS value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname ILIKE '%rfq%' OR t.typname ILIKE '%xj%'
ORDER BY t.typname, e.enumsortorder;

-- 0-D: 所有含 rfq 的 RLS 策略
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND (policyname ILIKE '%rfq%' OR tablename ILIKE '%rfq%')
ORDER BY tablename, policyname;

-- 0-E: 所有含 rfq 的触发器
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND (trigger_name ILIKE '%rfq%' OR event_object_table ILIKE '%rfq%')
ORDER BY event_object_table, trigger_name;

-- 0-F: 所有含 rfq 的函数/存储过程
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name ILIKE '%rfq%'
ORDER BY routine_name;

-- 0-G: number_rules 中所有 entity_type 含 rfq/xj 的行
SELECT id, entity_type, region_code, prefix, status
FROM public.number_rules
WHERE entity_type ILIKE '%rfq%'
   OR entity_type ILIKE '%xj%'
   OR entity_type ILIKE '%inq%'
ORDER BY entity_type, region_code;

-- 0-H: inquiries 表的 inquiry_number 前缀统计（INQ vs RFQ）
SELECT 
  CASE 
    WHEN inquiry_number ILIKE 'INQ-%' THEN 'INQ (客户询价 ✓正确)'
    WHEN inquiry_number ILIKE 'RFQ-%' THEN 'RFQ (旧前缀 需改为INQ)'
    WHEN inquiry_number ILIKE 'XJ-%' THEN 'XJ (采购询价 ✓正确)'
    ELSE '其他: ' || LEFT(inquiry_number, 5)
  END AS prefix_type,
  COUNT(*) AS count
FROM public.inquiries
GROUP BY 1
ORDER BY 1;
