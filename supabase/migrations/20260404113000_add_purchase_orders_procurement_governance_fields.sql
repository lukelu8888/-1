ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS parent_request_po_number text,
  ADD COLUMN IF NOT EXISTS pending_supplier_po_numbers text[],
  ADD COLUMN IF NOT EXISTS allocated_supplier_count integer,
  ADD COLUMN IF NOT EXISTS supplier_allocation_ready boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS procurement_request_status text,
  ADD COLUMN IF NOT EXISTS pr_validation_status text,
  ADD COLUMN IF NOT EXISTS pr_validated_at timestamptz,
  ADD COLUMN IF NOT EXISTS pr_validated_by text,
  ADD COLUMN IF NOT EXISTS cg_type text,
  ADD COLUMN IF NOT EXISTS selected_bj_id uuid,
  ADD COLUMN IF NOT EXISTS bj_locked_at timestamptz;

ALTER TABLE public.purchase_orders
  DROP CONSTRAINT IF EXISTS purchase_orders_procurement_request_status_check,
  ADD CONSTRAINT purchase_orders_procurement_request_status_check
  CHECK (
    procurement_request_status IS NULL OR
    procurement_request_status IN (
      'pending_procurement_assignment',
      'partial_allocated',
      'allocated_completed',
      'draft_allocated',
      'pending_manager_approval',
      'pending_ceo_approval',
      'approved_boss',
      'rejected_boss',
      'pushed_supplier'
    )
  ),
  DROP CONSTRAINT IF EXISTS purchase_orders_pr_validation_status_check,
  ADD CONSTRAINT purchase_orders_pr_validation_status_check
  CHECK (
    pr_validation_status IS NULL OR
    pr_validation_status IN ('pending', 'passed', 'failed')
  ),
  DROP CONSTRAINT IF EXISTS purchase_orders_cg_type_check,
  ADD CONSTRAINT purchase_orders_cg_type_check
  CHECK (
    cg_type IS NULL OR
    cg_type IN ('standard', 'urgent', 'exception', 'over_budget')
  ),
  DROP CONSTRAINT IF EXISTS purchase_orders_allocated_supplier_count_check,
  ADD CONSTRAINT purchase_orders_allocated_supplier_count_check
  CHECK (
    allocated_supplier_count IS NULL OR allocated_supplier_count >= 0
  );

CREATE INDEX IF NOT EXISTS idx_purchase_orders_parent_request_po_number
  ON public.purchase_orders (parent_request_po_number);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_procurement_request_status
  ON public.purchase_orders (procurement_request_status);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_selected_bj_id
  ON public.purchase_orders (selected_bj_id);

COMMENT ON COLUMN public.purchase_orders.parent_request_po_number IS 'Parent PR number for CG records, e.g. PR-xxx.';
COMMENT ON COLUMN public.purchase_orders.pending_supplier_po_numbers IS 'Generated CG numbers linked to the PR allocation batch.';
COMMENT ON COLUMN public.purchase_orders.allocated_supplier_count IS 'Number of suppliers allocated from the PR.';
COMMENT ON COLUMN public.purchase_orders.supplier_allocation_ready IS 'True after at least one supplier allocation has been submitted from the PR.';
COMMENT ON COLUMN public.purchase_orders.procurement_request_status IS 'Unified PR/CG lifecycle state used by procurement workflow.';
COMMENT ON COLUMN public.purchase_orders.pr_validation_status IS 'PR validation state before CG approval.';
COMMENT ON COLUMN public.purchase_orders.pr_validated_at IS 'Timestamp when PR validation passed or failed.';
COMMENT ON COLUMN public.purchase_orders.pr_validated_by IS 'User/email that completed PR validation.';
COMMENT ON COLUMN public.purchase_orders.cg_type IS 'Governance classification for CG approval routing.';
COMMENT ON COLUMN public.purchase_orders.selected_bj_id IS 'Locked BJ comparison result chosen for the CG.';
COMMENT ON COLUMN public.purchase_orders.bj_locked_at IS 'Timestamp when BJ result was locked for downstream CG workflow.';
