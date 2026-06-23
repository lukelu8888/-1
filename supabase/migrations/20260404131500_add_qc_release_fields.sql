alter table public.purchase_order_execution
  add column if not exists qc_release_status text,
  add column if not exists qc_release_block_reason text,
  add column if not exists release_approved_by text;

comment on column public.purchase_order_execution.qc_release_status is
  'QC release lifecycle: pending / released / exception_release / blocked';
comment on column public.purchase_order_execution.qc_release_block_reason is
  'Reason why QC release is blocked or requires exception handling';
comment on column public.purchase_order_execution.release_approved_by is
  'Approver who authorized QC exception release or manual release unblock';

