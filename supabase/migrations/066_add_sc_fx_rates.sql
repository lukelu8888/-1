-- Phase 8: FX rate map on sales_contracts
-- Convention: fxRates[foreignCurrency] = units of foreignCurrency per 1 SC-currency unit
-- Example:  SC.currency = USD, fx_rates = {"CNY": 7.24}  →  1 USD = 7.24 CNY
-- Conversion formula used in computeSCProfit: cgAmount / fxRates[cgCurrency]
ALTER TABLE sales_contracts
  ADD COLUMN IF NOT EXISTS fx_rates jsonb DEFAULT '{}';
