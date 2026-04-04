alter table public.purchase_order_execution
  add column if not exists lc_discrepancy_notes text,
  add column if not exists lc_discrepancy_recorded_at timestamptz,
  add column if not exists lc_discrepancy_recorded_by text,
  add column if not exists lc_discrepancy_approval_status text not null default 'not_required',
  add column if not exists lc_discrepancy_approval_requested_at timestamptz,
  add column if not exists lc_discrepancy_approval_requested_by text,
  add column if not exists lc_discrepancy_approved_at timestamptz,
  add column if not exists lc_discrepancy_approved_by text,
  add column if not exists lc_discrepancy_rejected_at timestamptz,
  add column if not exists lc_discrepancy_rejected_by text,
  add column if not exists seal_status text not null default 'not_required',
  add column if not exists sealed_sample_ref text,
  add column if not exists sealed_sample_version text,
  add column if not exists sealed_sample_uploaded_at timestamptz,
  add column if not exists sealed_sample_uploaded_by text,
  add column if not exists sealed_sample_confirmed_at timestamptz,
  add column if not exists sealed_sample_confirmed_by text,
  add column if not exists seal_invalidated_at timestamptz,
  add column if not exists seal_invalidated_by text,
  add column if not exists seal_invalidated_reason text;

alter table public.purchase_order_execution
  drop constraint if exists chk_purchase_order_execution_lc_discrepancy_approval_status;

alter table public.purchase_order_execution
  add constraint chk_purchase_order_execution_lc_discrepancy_approval_status
  check (lc_discrepancy_approval_status in ('not_required', 'pending', 'approved', 'rejected'));

alter table public.purchase_order_execution
  drop constraint if exists chk_purchase_order_execution_seal_status;

alter table public.purchase_order_execution
  add constraint chk_purchase_order_execution_seal_status
  check (seal_status in ('not_required', 'pending', 'sealed', 'uploaded', 'confirmed', 'invalidated'));

update public.purchase_order_execution
set
  lc_discrepancy_notes = coalesce(lc_discrepancy_notes, remarks),
  lc_discrepancy_approval_status = case
    when coalesce(lc_discrepancy_status, '') in ('resolved', 'waived') then 'approved'
    when coalesce(lc_discrepancy_status, '') in ('open', 'pending', 'raised') then 'pending'
    else 'not_required'
  end,
  seal_status = case
    when coalesce(sample_required, false) = false then 'not_required'
    when seal_confirmed_at is not null then 'confirmed'
    when sample_confirmed_at is not null then 'sealed'
    else 'pending'
  end,
  sealed_sample_confirmed_at = coalesce(sealed_sample_confirmed_at, seal_confirmed_at)
where true;

comment on column public.purchase_order_execution.lc_discrepancy_notes is
  'Structured L/C discrepancy notes independent from free-form remarks.';
comment on column public.purchase_order_execution.lc_discrepancy_approval_status is
  'Approval lifecycle of L/C discrepancy handling: not_required / pending / approved / rejected.';
comment on column public.purchase_order_execution.seal_status is
  'Seal state machine: not_required / pending / sealed / uploaded / confirmed / invalidated.';
comment on column public.purchase_order_execution.sealed_sample_ref is
  'Reference number of the sealed sample used as production and QC baseline.';

create index if not exists idx_purchase_order_execution_lc_discrepancy_approval_status
  on public.purchase_order_execution (lc_discrepancy_approval_status);
create index if not exists idx_purchase_order_execution_seal_status
  on public.purchase_order_execution (seal_status);
