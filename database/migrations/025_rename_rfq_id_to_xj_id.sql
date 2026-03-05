-- Migration 025: rename supplier_quotations.rfq_id → xj_id
-- 目的：将 supplier_quotations 表中的 rfq_id 列改名为 xj_id，
--       消除术语歧义，与前端统一使用 xj 命名。

-- 1. 重命名列
ALTER TABLE public.supplier_quotations
  RENAME COLUMN rfq_id TO xj_id;

-- 2. 若存在旧索引则重建（可选，名称改为更清晰）
-- DROP INDEX IF EXISTS supplier_quotations_rfq_id_idx;
-- CREATE INDEX IF NOT EXISTS supplier_quotations_xj_id_idx ON public.supplier_quotations (xj_id);
