-- Migration 036: purchase_requirements 补齐采购反馈与下推询报字段（Supabase-first）

ALTER TABLE public.purchase_requirements
  ADD COLUMN IF NOT EXISTS purchaser_feedback JSONB,
  ADD COLUMN IF NOT EXISTS pushed_to_quotation BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pushed_to_quotation_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pushed_by TEXT,
  ADD COLUMN IF NOT EXISTS quotation_number TEXT;

CREATE INDEX IF NOT EXISTS idx_pr_pushed_to_quotation
  ON public.purchase_requirements (pushed_to_quotation)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_pr_quotation_number
  ON public.purchase_requirements (quotation_number)
  WHERE quotation_number IS NOT NULL;
