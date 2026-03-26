-- ============================================================
-- Add collection control gates to purchase_order_execution
-- 范围：完货后收款控制、交单/放单控制
-- ============================================================

alter table public.purchase_order_execution
  add column if not exists collection_control_mode text,
  add column if not exists document_release_mode text,
  add column if not exists customer_balance_gate_status text not null default 'pending',
  add column if not exists customer_balance_confirmed_at timestamptz,
  add column if not exists bank_submission_status text not null default 'not_required',
  add column if not exists document_release_status text not null default 'pending';

comment on column public.purchase_order_execution.collection_control_mode is
  'Collection control branch after QC: prepaid_before_booking | post_tt_before_obl_release | lc_bank_negotiation | dp_or_other_collection';

comment on column public.purchase_order_execution.document_release_mode is
  'How shipping documents are released: release_after_full_payment | release_after_bank_negotiation | release_after_dp_collection';

comment on column public.purchase_order_execution.customer_balance_gate_status is
  'Controls whether booking / original BL release / collection can proceed.';

comment on column public.purchase_order_execution.bank_submission_status is
  'L/C or collection document submission lifecycle.';

comment on column public.purchase_order_execution.document_release_status is
  'Document release lifecycle for BL / full set release.';
