-- Migration 025: 确认 supplier_quotations 列命名
-- 经查实际 DB 列为 source_xj_id (uuid) 和 source_xj_number (text)
-- 从未存在 rfq_id 列，无需执行 RENAME，此 migration 为空操作记录。

-- SELECT column_name FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'supplier_quotations';
-- 结果已确认：source_xj_id, source_xj_number 均已正确命名。
