-- Migration 067: Fix approval_records schema
-- Problem 1: action column is NOT NULL with no DEFAULT and a CHECK constraint
--             that excludes 'submitted'/'pending'. Blocks all new insertions.
-- Problem 2: New columns (current_approver, submitted_by, actor_email, etc.)
--             used by approvalRecordService don't exist in DB, so getForApprover
--             returns nothing for managers.

-- Fix action column: make nullable so initial submissions can pass null
ALTER TABLE approval_records
  ALTER COLUMN action DROP NOT NULL,
  ALTER COLUMN action SET DEFAULT NULL;

-- Add new business columns used by approvalRecordService.upsert and getForApprover
ALTER TABLE approval_records
  ADD COLUMN IF NOT EXISTS type              text,
  ADD COLUMN IF NOT EXISTS related_document_id   text,
  ADD COLUMN IF NOT EXISTS related_document_type text,
  ADD COLUMN IF NOT EXISTS related_document  jsonb,
  ADD COLUMN IF NOT EXISTS submitted_by      text,
  ADD COLUMN IF NOT EXISTS submitted_by_name text,
  ADD COLUMN IF NOT EXISTS submitted_by_role text,
  ADD COLUMN IF NOT EXISTS submitted_at      timestamptz,
  ADD COLUMN IF NOT EXISTS region            text,
  ADD COLUMN IF NOT EXISTS current_approver  text,
  ADD COLUMN IF NOT EXISTS current_approver_role text,
  ADD COLUMN IF NOT EXISTS next_approver     text,
  ADD COLUMN IF NOT EXISTS next_approver_role text,
  ADD COLUMN IF NOT EXISTS requires_director_approval boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS urgency           text DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS amount            numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency          text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS customer_name     text,
  ADD COLUMN IF NOT EXISTS customer_email    text,
  ADD COLUMN IF NOT EXISTS product_summary   text,
  ADD COLUMN IF NOT EXISTS approval_history  jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS deadline          timestamptz,
  ADD COLUMN IF NOT EXISTS entity_type       text,
  ADD COLUMN IF NOT EXISTS entity_id         uuid,
  ADD COLUMN IF NOT EXISTS entity_number     text,
  ADD COLUMN IF NOT EXISTS actor_email       text,
  ADD COLUMN IF NOT EXISTS actor_role        text,
  ADD COLUMN IF NOT EXISTS status_before     text,
  ADD COLUMN IF NOT EXISTS status_after      text;

-- Index for manager approval center lookup performance
CREATE INDEX IF NOT EXISTS idx_approval_records_current_approver
  ON approval_records (current_approver);

CREATE INDEX IF NOT EXISTS idx_approval_records_submitted_by
  ON approval_records (submitted_by);
