-- Migration 040: purchase_requirements 采购反馈/下推字段兼容补齐
-- 目的：确保采购员“智能对比建议 -> 保存反馈 -> 下推业务员询报”全链路字段稳定落库

ALTER TABLE public.purchase_requirements
  ADD COLUMN IF NOT EXISTS purchaser_feedback JSONB,
  ADD COLUMN IF NOT EXISTS pushed_to_quotation BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pushed_to_quotation_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pushed_by TEXT,
  ADD COLUMN IF NOT EXISTS quotation_number TEXT;

CREATE INDEX IF NOT EXISTS idx_pr_pushed_to_quotation_compat
  ON public.purchase_requirements (pushed_to_quotation)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_pr_quotation_number_compat
  ON public.purchase_requirements (quotation_number)
  WHERE quotation_number IS NOT NULL;
