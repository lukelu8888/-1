-- 063_add_payment_mode.sql
-- Phase 1: storage-only introduction of structured payment mode enum field.
-- No gate logic changes; existing rows with payment_mode = NULL behave exactly
-- like the current default (tt_deposit_balance_before_shipment).

ALTER TABLE public.sales_quotations
  ADD COLUMN IF NOT EXISTS payment_mode TEXT NULL;

ALTER TABLE public.sales_contracts
  ADD COLUMN IF NOT EXISTS payment_mode TEXT NULL;

-- Optional: comment describing valid values (enforced in application layer only for now)
-- Valid values: tt_deposit_balance_before_shipment | tt_deposit_balance_against_bl |
--               lc_100 | deposit_plus_lc | dp | oa
