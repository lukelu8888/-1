-- ============================================================
-- Explicit inspection / loading supervision modes
-- 范围：将“客户指定第三方验货”和“第三方监装”显式落入执行层
-- ============================================================

alter table public.purchase_order_execution
  add column if not exists inspection_execution_mode text,
  add column if not exists customer_designated_inspection_agency text,
  add column if not exists customer_designated_inspection_status text not null default 'pending',
  add column if not exists loading_supervision_mode text,
  add column if not exists loading_supervision_agency_name text,
  add column if not exists loading_supervision_required boolean not null default false;

alter table public.purchase_order_execution
  drop constraint if exists chk_purchase_order_execution_inspection_execution_mode;

alter table public.purchase_order_execution
  add constraint chk_purchase_order_execution_inspection_execution_mode check (
    inspection_execution_mode is null
    or inspection_execution_mode in ('our_qc', 'customer_third_party')
  );

alter table public.purchase_order_execution
  drop constraint if exists chk_purchase_order_execution_customer_designated_inspection_status;

alter table public.purchase_order_execution
  add constraint chk_purchase_order_execution_customer_designated_inspection_status check (
    customer_designated_inspection_status in ('pending', 'scheduled', 'in_progress', 'completed', 'reported')
  );

alter table public.purchase_order_execution
  drop constraint if exists chk_purchase_order_execution_loading_supervision_mode;

alter table public.purchase_order_execution
  add constraint chk_purchase_order_execution_loading_supervision_mode check (
    loading_supervision_mode is null
    or loading_supervision_mode in ('internal_only', 'third_party_witness')
  );

