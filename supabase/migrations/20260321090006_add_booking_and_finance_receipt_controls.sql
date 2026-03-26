-- ============================================================
-- Add booking control and finance receipt confirmation controls
-- 范围：订舱责任、运费确认、财务确认到款
-- ============================================================

alter table public.purchase_order_execution
  add column if not exists booking_responsibility text,
  add column if not exists freight_confirmation_required boolean not null default false,
  add column if not exists freight_confirmed_by_customer_at timestamptz,
  add column if not exists booking_status text not null default 'pending',
  add column if not exists customer_payment_received_at timestamptz,
  add column if not exists customer_payment_confirmed_at timestamptz,
  add column if not exists finance_confirmed_received_by text;

comment on column public.purchase_order_execution.booking_responsibility is
  'Who is responsible for booking: our_company | customer_confirmed_freight | customer_nominated_forwarder';

comment on column public.purchase_order_execution.freight_confirmation_required is
  'For FOB scenarios where customer must confirm freight before we book.';

comment on column public.purchase_order_execution.booking_status is
  'Booking lifecycle: pending | blocked_by_payment | blocked_by_freight_confirmation | ready_to_book | booked';

comment on column public.purchase_order_execution.customer_payment_confirmed_at is
  'Timestamp when finance confirmed customer funds were actually received.';

comment on column public.purchase_order_execution.finance_confirmed_received_by is
  'Finance operator who confirmed the receipt gate.';
