-- Migration 022: 步骤 3a/3b/3c — 数据迁移回填

-- 3a+3b: display_number + 新编号字段回填
UPDATE public.inquiries
SET display_number = inquiry_number,
    ing_number     = inquiry_number
WHERE display_number IS NULL AND inquiry_number IS NOT NULL;

UPDATE public.sales_quotations
SET display_number = qt_number
WHERE display_number IS NULL AND qt_number IS NOT NULL;

UPDATE public.sales_contracts
SET display_number = contract_number,
    sc_number      = contract_number
WHERE display_number IS NULL AND contract_number IS NOT NULL;

UPDATE public.purchase_requirements
SET display_number = requirement_no,
    qr_number      = requirement_no
WHERE display_number IS NULL AND requirement_no IS NOT NULL;

UPDATE public.supplier_xjs
SET display_number = xj_number
WHERE display_number IS NULL AND xj_number IS NOT NULL;

UPDATE public.supplier_quotations
SET display_number = quotation_number
WHERE display_number IS NULL AND quotation_number IS NOT NULL;

UPDATE public.purchase_orders
SET display_number = po_number,
    cg_number      = po_number
WHERE display_number IS NULL AND po_number IS NOT NULL;

UPDATE public.payments
SET display_number = payment_number
WHERE display_number IS NULL AND payment_number IS NOT NULL;

-- 3c: 校准 number_sequences.current_value（基于 inquiries 现有最大序号）
INSERT INTO public.number_sequences
  (doc_type, scope_type, scope_id, current_value,
   prefix, region_code, date_key, current_seq)
SELECT
  'ING',
  'customer',
  'UNKNOWN:' || SPLIT_PART(inquiry_number, '-', 3),
  MAX(CAST(SPLIT_PART(inquiry_number, '-', 4) AS INT)),
  'INQ',
  SPLIT_PART(inquiry_number, '-', 2),
  SPLIT_PART(inquiry_number, '-', 3),
  MAX(CAST(SPLIT_PART(inquiry_number, '-', 4) AS INT))
FROM public.inquiries
WHERE inquiry_number ~ '^INQ-\w+-\d{6}-\d+$'
GROUP BY SPLIT_PART(inquiry_number, '-', 2), SPLIT_PART(inquiry_number, '-', 3)
ON CONFLICT (doc_type, scope_type, scope_id)
DO UPDATE SET
  current_value = GREATEST(
    public.number_sequences.current_value,
    EXCLUDED.current_value
  ),
  updated_at = now();
