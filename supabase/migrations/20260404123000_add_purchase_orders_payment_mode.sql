alter table public.purchase_orders
  add column if not exists payment_mode text;

comment on column public.purchase_orders.payment_mode is
  'Structured payment mode inherited from SC/QT: tt_deposit_balance_before_shipment / tt_deposit_balance_against_bl / lc_100 / deposit_plus_lc / dp / da / oa / mixed';

