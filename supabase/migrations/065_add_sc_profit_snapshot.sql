-- Phase 7A: profit snapshot — written once when SC reaches 'completed'.
-- JSONB column; no index required (point-lookups only via SC id).
ALTER TABLE sales_contracts
  ADD COLUMN IF NOT EXISTS profit_snapshot jsonb;
