-- Migration 034: Add soft-delete audit fields for supplier_xjs
-- Goal: make "who deleted this XJ" traceable in acceptance phase.

ALTER TABLE public.supplier_xjs
  ADD COLUMN IF NOT EXISTS deleted_by TEXT,
  ADD COLUMN IF NOT EXISTS deleted_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_supplier_xjs_deleted_by
  ON public.supplier_xjs (deleted_by)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_supplier_xjs_deleted_at
  ON public.supplier_xjs (deleted_at)
  WHERE deleted_at IS NOT NULL;
