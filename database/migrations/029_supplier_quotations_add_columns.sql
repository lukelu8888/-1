-- Migration 029: supplier_quotations 补列
-- 补充 BJ 流程所需字段，与 toSQRow 映射对齐

ALTER TABLE public.supplier_quotations
  ADD COLUMN IF NOT EXISTS supplier_company  TEXT,
  ADD COLUMN IF NOT EXISTS source_qr_number  TEXT,
  ADD COLUMN IF NOT EXISTS quotation_date    DATE,
  ADD COLUMN IF NOT EXISTS payment_terms     TEXT,
  ADD COLUMN IF NOT EXISTS delivery_terms    TEXT;

-- 索引（加速按 QR 编号查 BJ）
CREATE INDEX IF NOT EXISTS idx_sq_source_qr ON public.supplier_quotations (source_qr_number) WHERE deleted_at IS NULL;

-- 验证
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'supplier_quotations'
  AND column_name  IN ('supplier_company','source_qr_number','quotation_date','payment_terms','delivery_terms')
ORDER BY column_name;
