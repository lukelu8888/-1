-- Phase 6b: SC-level additional cost (freight, duties, misc)
-- Currency is implicitly the SC's own currency — no cross-currency logic.
ALTER TABLE sales_contracts
  ADD COLUMN IF NOT EXISTS additional_cost numeric DEFAULT 0;
