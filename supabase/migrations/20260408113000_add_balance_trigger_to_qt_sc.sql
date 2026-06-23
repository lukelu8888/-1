-- Persist structured receivable trigger on QT / SC so finance flow is driven by
-- contract payment configuration instead of page-local guesses.

ALTER TABLE public.sales_quotations
  ADD COLUMN IF NOT EXISTS payment_mode TEXT NULL,
  ADD COLUMN IF NOT EXISTS balance_trigger TEXT NULL;

ALTER TABLE public.sales_contracts
  ADD COLUMN IF NOT EXISTS payment_mode TEXT NULL,
  ADD COLUMN IF NOT EXISTS balance_trigger TEXT NULL;

COMMENT ON COLUMN public.sales_quotations.payment_mode IS
  'Structured payment mode for finance/approval flow.';
COMMENT ON COLUMN public.sales_quotations.balance_trigger IS
  'When the balance stage becomes active: before_shipment | after_shipment | lc_ready | after_deposit.';

COMMENT ON COLUMN public.sales_contracts.payment_mode IS
  'Structured payment mode inherited from QT and used as finance flow source of truth.';
COMMENT ON COLUMN public.sales_contracts.balance_trigger IS
  'When the balance stage becomes active: before_shipment | after_shipment | lc_ready | after_deposit.';
