alter table public.sales_contracts
  add column if not exists approval_status text,
  add column if not exists execution_status text,
  add column if not exists payment_status_deposit text,
  add column if not exists payment_status_balance text;

alter table public.sales_contracts
  drop constraint if exists sales_contracts_approval_status_check,
  add constraint sales_contracts_approval_status_check
  check (
    approval_status is null or
    approval_status in ('draft', 'pending_l1', 'pending_l2', 'approved', 'rejected')
  ),
  drop constraint if exists sales_contracts_execution_status_check,
  add constraint sales_contracts_execution_status_check
  check (
    execution_status is null or
    execution_status in (
      'draft',
      'sent_to_customer',
      'customer_confirmed',
      'awaiting_deposit',
      'deposit_uploaded',
      'deposit_confirmed',
      'in_procurement',
      'in_pre_production',
      'in_production',
      'qc_pending',
      'qc_passed',
      'awaiting_balance',
      'balance_uploaded',
      'balance_confirmed',
      'ready_to_ship',
      'shipped',
      'delivered',
      'completed',
      'cancelled'
    )
  ),
  drop constraint if exists sales_contracts_payment_status_deposit_check,
  add constraint sales_contracts_payment_status_deposit_check
  check (
    payment_status_deposit is null or
    payment_status_deposit in ('not_required', 'pending', 'uploaded', 'confirmed')
  ),
  drop constraint if exists sales_contracts_payment_status_balance_check,
  add constraint sales_contracts_payment_status_balance_check
  check (
    payment_status_balance is null or
    payment_status_balance in ('not_due', 'pending', 'uploaded', 'confirmed')
  );

create index if not exists idx_sales_contracts_approval_status
  on public.sales_contracts (approval_status);

create index if not exists idx_sales_contracts_execution_status
  on public.sales_contracts (execution_status);

alter table public.purchase_orders
  add column if not exists document_type text,
  add column if not exists approval_status text,
  add column if not exists execution_status text;

alter table public.purchase_orders
  drop constraint if exists purchase_orders_document_type_check,
  add constraint purchase_orders_document_type_check
  check (
    document_type is null or
    document_type in ('PR', 'CG')
  ),
  drop constraint if exists purchase_orders_approval_status_check,
  add constraint purchase_orders_approval_status_check
  check (
    approval_status is null or
    approval_status in ('draft', 'pending_l1', 'pending_l2', 'approved', 'rejected', 'not_required')
  ),
  drop constraint if exists purchase_orders_execution_status_check,
  add constraint purchase_orders_execution_status_check
  check (
    execution_status is null or
    execution_status in (
      'draft',
      'initiated',
      'pending_assignment',
      'partially_allocated',
      'fully_allocated',
      'approved',
      'pushed_to_supplier',
      'supplier_confirmed',
      'pre_production_sample_pending',
      'pre_production_sample_sent',
      'awaiting_sample_confirmation',
      'sample_confirmed',
      'production_in_progress',
      'supplier_self_inspection_submitted',
      'qc_pending',
      'qc_passed',
      'qc_failed',
      'finished_goods_ready',
      'awaiting_loading',
      'loaded',
      'closed',
      'cancelled'
    )
  );

create index if not exists idx_purchase_orders_document_type
  on public.purchase_orders (document_type);

create index if not exists idx_purchase_orders_approval_status
  on public.purchase_orders (approval_status);

create index if not exists idx_purchase_orders_execution_status
  on public.purchase_orders (execution_status);

update public.sales_contracts
set
  approval_status = coalesce(
    nullif(document_render_meta #>> '{erpWorkflow,approvalStatus}', ''),
    case
      when status::text = 'draft' then 'draft'
      when status::text = 'pending_supervisor' then 'pending_l1'
      when status::text = 'pending_director' then 'pending_l2'
      when status::text in ('approved', 'sent', 'customer_confirmed', 'deposit_uploaded', 'deposit_confirmed', 'po_generated', 'production', 'balance_confirmed', 'shipped', 'completed') then 'approved'
      when status::text = 'rejected' then 'rejected'
      else null
    end
  ),
  execution_status = coalesce(
    nullif(document_render_meta #>> '{erpWorkflow,executionStatus}', ''),
    case
      when status::text = 'sent' then 'sent_to_customer'
      when status::text = 'customer_confirmed' then 'customer_confirmed'
      when status::text = 'deposit_uploaded' then 'deposit_uploaded'
      when status::text = 'deposit_confirmed' then 'deposit_confirmed'
      when status::text = 'po_generated' then 'in_procurement'
      when status::text = 'production' then 'in_production'
      when status::text = 'balance_confirmed' then 'balance_confirmed'
      when status::text = 'shipped' then 'shipped'
      when status::text = 'completed' then 'completed'
      when status::text = 'cancelled' then 'cancelled'
      else 'draft'
    end
  ),
  payment_status_deposit = coalesce(
    nullif(document_render_meta #>> '{erpWorkflow,paymentStatusDeposit}', ''),
    case
      when deposit_confirmed_at is not null then 'confirmed'
      when deposit_proof is not null then 'uploaded'
      when coalesce(deposit_percentage, 0) <= 0 and coalesce(deposit_amount, 0) <= 0 then 'not_required'
      else 'pending'
    end
  ),
  payment_status_balance = coalesce(
    nullif(document_render_meta #>> '{erpWorkflow,paymentStatusBalance}', ''),
    case
      when status::text in ('balance_confirmed', 'shipped', 'completed') then 'confirmed'
      else 'not_due'
    end
  )
where true;

update public.purchase_orders
set
  document_type = coalesce(
    nullif(document_render_meta #>> '{procurementWorkflow,documentType}', ''),
    case
      when procurement_request_status::text in ('pending_procurement_assignment', 'partial_allocated', 'allocated_completed') then 'PR'
      when procurement_request_status::text in ('draft_allocated', 'pending_manager_approval', 'pending_ceo_approval', 'approved_boss', 'rejected_boss', 'pushed_supplier') then 'CG'
      when po_number like 'PR-%' then 'PR'
      else 'CG'
    end
  ),
  approval_status = coalesce(
    nullif(document_render_meta #>> '{procurementWorkflow,approvalStatus}', ''),
    case
      when procurement_request_status::text in ('pending_procurement_assignment', 'partial_allocated', 'allocated_completed') then 'not_required'
      when procurement_request_status::text = 'draft_allocated' then 'draft'
      when procurement_request_status::text = 'pending_manager_approval' then 'pending_l1'
      when procurement_request_status::text = 'pending_ceo_approval' then 'pending_l2'
      when procurement_request_status::text in ('approved_boss', 'pushed_supplier') then 'approved'
      when procurement_request_status::text = 'rejected_boss' then 'rejected'
      else null
    end
  ),
  execution_status = coalesce(
    nullif(document_render_meta #>> '{procurementWorkflow,executionStatus}', ''),
    case
      when procurement_request_status::text = 'pending_procurement_assignment' then 'pending_assignment'
      when procurement_request_status::text = 'partial_allocated' then 'partially_allocated'
      when procurement_request_status::text = 'allocated_completed' then 'fully_allocated'
      when procurement_request_status::text = 'draft_allocated' then 'draft'
      when procurement_request_status::text = 'approved_boss' then 'approved'
      when procurement_request_status::text = 'pushed_supplier' then 'pushed_to_supplier'
      else null
    end
  )
where true;

comment on column public.sales_contracts.approval_status is
  'Split SC approval lane. draft / pending_l1 / pending_l2 / approved / rejected.';
comment on column public.sales_contracts.execution_status is
  'Split SC execution lane used by customer/order/procurement coordination.';
comment on column public.sales_contracts.payment_status_deposit is
  'Split SC deposit payment lane.';
comment on column public.sales_contracts.payment_status_balance is
  'Split SC balance payment lane.';

comment on column public.purchase_orders.document_type is
  'Split procurement document type. PR or CG.';
comment on column public.purchase_orders.approval_status is
  'Split procurement approval lane, mainly authoritative for CG.';
comment on column public.purchase_orders.execution_status is
  'Split procurement execution lane for PR/CG runtime stages.';
