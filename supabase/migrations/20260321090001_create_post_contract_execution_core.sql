-- ============================================================
-- Post-contract execution core
-- 范围：CG执行、供应商自检、QC验货、国内集货、装柜执行
-- ============================================================

create table if not exists public.purchase_order_execution (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  execution_status text not null default 'supplier_pending_confirmation',
  supplier_confirmed_at timestamptz,
  supplier_rejected_at timestamptz,
  supplier_reply_notes text,
  sample_required boolean not null default false,
  sample_confirmed_at timestamptz,
  production_started_at timestamptz,
  estimated_completion_date date,
  production_completed_at timestamptz,
  supplier_self_inspection_status text not null default 'pending',
  qc_inspection_status text not null default 'pending',
  finished_goods_confirmed_at timestamptz,
  customer_balance_status text not null default 'pending',
  supplier_balance_status text not null default 'pending',
  fulfillment_mode text,
  consolidation_required boolean not null default false,
  shipment_readiness_status text not null default 'pending',
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_purchase_order_execution_po unique (purchase_order_id),
  constraint chk_purchase_order_execution_status check (
    execution_status in (
      'supplier_pending_confirmation',
      'supplier_confirmed',
      'sampling',
      'in_production',
      'supplier_self_inspection_pending',
      'supplier_self_inspection_submitted',
      'qc_pending',
      'qc_passed',
      'qc_failed',
      'finished_goods_ready',
      'awaiting_loading',
      'loaded',
      'shipped',
      'completed'
    )
  )
);

create index if not exists idx_purchase_order_execution_po_id
  on public.purchase_order_execution (purchase_order_id);

create index if not exists idx_purchase_order_execution_status
  on public.purchase_order_execution (execution_status);

drop trigger if exists trg_purchase_order_execution_updated_at on public.purchase_order_execution;
create trigger trg_purchase_order_execution_updated_at
before update on public.purchase_order_execution
for each row execute function public.set_updated_at();

comment on table public.purchase_order_execution is
  'Execution layer for CG/purchase_orders. Stores post-contract operational workflow state.';

create table if not exists public.supplier_inspection_reports (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  report_no text not null unique,
  supplier_id text,
  inspection_date date,
  result text not null default 'pending',
  summary text,
  defect_notes text,
  attachments jsonb not null default '[]'::jsonb,
  submitted_by text,
  submitted_from_portal text,
  verified_by_qc text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_supplier_inspection_result check (
    result in ('pending', 'pass', 'fail', 'pass_with_remark')
  )
);

create index if not exists idx_supplier_inspection_reports_po_id
  on public.supplier_inspection_reports (purchase_order_id);

drop trigger if exists trg_supplier_inspection_reports_updated_at on public.supplier_inspection_reports;
create trigger trg_supplier_inspection_reports_updated_at
before update on public.supplier_inspection_reports
for each row execute function public.set_updated_at();

create table if not exists public.qc_inspection_orders (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  inspection_no text not null unique,
  inspection_type text not null default 'pre_shipment',
  scheduled_date date,
  inspector_id text,
  inspector_name text,
  status text not null default 'pending',
  result text not null default 'pending',
  factory_name text,
  inspection_location text,
  report_files jsonb not null default '[]'::jsonb,
  photos jsonb not null default '[]'::jsonb,
  third_party_agency_id text,
  third_party_agency_name text,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_qc_inspection_order_status check (
    status in ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled')
  ),
  constraint chk_qc_inspection_order_result check (
    result in ('pending', 'pass', 'fail', 'pass_with_remark')
  )
);

create index if not exists idx_qc_inspection_orders_po_id
  on public.qc_inspection_orders (purchase_order_id);

drop trigger if exists trg_qc_inspection_orders_updated_at on public.qc_inspection_orders;
create trigger trg_qc_inspection_orders_updated_at
before update on public.qc_inspection_orders
for each row execute function public.set_updated_at();

create table if not exists public.domestic_transfer_orders (
  id uuid primary key default gen_random_uuid(),
  transfer_no text not null unique,
  purchase_order_id uuid references public.purchase_orders(id) on delete set null,
  shipment_no text,
  source_party_type text not null,
  source_party_id text,
  source_location_id text,
  destination_party_type text not null,
  destination_party_id text,
  destination_location_id text,
  carrier_type text,
  carrier_id text,
  carrier_name text,
  driver_name text,
  driver_phone text,
  vehicle_no text,
  transport_mode text,
  pickup_date date,
  planned_arrival_date date,
  actual_departure_at timestamptz,
  actual_arrival_at timestamptz,
  tracking_no text,
  freight_currency text not null default 'CNY',
  freight_amount numeric not null default 0,
  freight_charge_party text,
  freight_advance_party text,
  freight_settlement_party text,
  freight_payment_status text not null default 'pending',
  status text not null default 'draft',
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_domestic_transfer_status check (
    status in (
      'draft',
      'freight_pending',
      'freight_confirmed',
      'picked_up',
      'in_transit',
      'arrived',
      'received',
      'exception_pending',
      'closed',
      'cancelled'
    )
  )
);

create index if not exists idx_domestic_transfer_orders_po_id
  on public.domestic_transfer_orders (purchase_order_id);

create index if not exists idx_domestic_transfer_orders_status
  on public.domestic_transfer_orders (status);

drop trigger if exists trg_domestic_transfer_orders_updated_at on public.domestic_transfer_orders;
create trigger trg_domestic_transfer_orders_updated_at
before update on public.domestic_transfer_orders
for each row execute function public.set_updated_at();

create table if not exists public.cargo_lots (
  id uuid primary key default gen_random_uuid(),
  cargo_lot_no text not null unique,
  purchase_order_id uuid references public.purchase_orders(id) on delete set null,
  sales_contract_id uuid,
  source_supplier_id text,
  source_location_id text,
  current_location_type text,
  current_location_id text,
  final_loading_location_id text,
  product_id text,
  product_name text not null default '',
  model_no text,
  specification text,
  hs_code text,
  packages numeric not null default 0,
  quantity numeric not null default 0,
  unit text,
  gross_weight numeric not null default 0,
  net_weight numeric not null default 0,
  volume_cbm numeric not null default 0,
  packing_type text,
  has_wood_packing boolean not null default false,
  requires_inspection boolean not null default false,
  requires_co boolean not null default false,
  requires_fumigation boolean not null default false,
  status text not null default 'planned',
  ready_date date,
  loaded_at timestamptz,
  shipped_at timestamptz,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_cargo_lots_status check (
    status in (
      'planned',
      'ready_at_supplier',
      'awaiting_transfer',
      'in_domestic_transit',
      'arrived_at_consolidation_point',
      'waiting_loading',
      'partially_loaded',
      'fully_loaded',
      'shipped',
      'cancelled'
    )
  )
);

create index if not exists idx_cargo_lots_po_id
  on public.cargo_lots (purchase_order_id);

create index if not exists idx_cargo_lots_status
  on public.cargo_lots (status);

drop trigger if exists trg_cargo_lots_updated_at on public.cargo_lots;
create trigger trg_cargo_lots_updated_at
before update on public.cargo_lots
for each row execute function public.set_updated_at();

create table if not exists public.domestic_transfer_order_items (
  id uuid primary key default gen_random_uuid(),
  transfer_order_id uuid not null references public.domestic_transfer_orders(id) on delete cascade,
  cargo_lot_id uuid references public.cargo_lots(id) on delete set null,
  product_id text,
  product_name text not null default '',
  model_no text,
  packages numeric not null default 0,
  quantity numeric not null default 0,
  unit text,
  gross_weight numeric not null default 0,
  net_weight numeric not null default 0,
  volume_cbm numeric not null default 0,
  packing_desc text,
  remarks text,
  created_at timestamptz not null default now()
);

create index if not exists idx_domestic_transfer_order_items_transfer_id
  on public.domestic_transfer_order_items (transfer_order_id);

create table if not exists public.cargo_receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_no text not null unique,
  transfer_order_id uuid not null references public.domestic_transfer_orders(id) on delete cascade,
  receipt_status text not null default 'draft',
  receiver_party_type text,
  receiver_party_id text,
  receiver_location_id text,
  received_at timestamptz,
  received_by text,
  contact_phone text,
  expected_packages numeric not null default 0,
  received_packages numeric not null default 0,
  expected_quantity numeric not null default 0,
  received_quantity numeric not null default 0,
  damage_flag boolean not null default false,
  shortage_flag boolean not null default false,
  overage_flag boolean not null default false,
  variance_flag boolean not null default false,
  photo_files jsonb not null default '[]'::jsonb,
  signed_files jsonb not null default '[]'::jsonb,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_cargo_receipts_status check (
    receipt_status in ('draft', 'receiving', 'received_match', 'received_with_variance', 'exception_open', 'closed')
  )
);

create index if not exists idx_cargo_receipts_transfer_order_id
  on public.cargo_receipts (transfer_order_id);

drop trigger if exists trg_cargo_receipts_updated_at on public.cargo_receipts;
create trigger trg_cargo_receipts_updated_at
before update on public.cargo_receipts
for each row execute function public.set_updated_at();

create table if not exists public.cargo_receipt_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.cargo_receipts(id) on delete cascade,
  cargo_lot_id uuid references public.cargo_lots(id) on delete set null,
  product_id text,
  product_name text not null default '',
  expected_packages numeric not null default 0,
  received_packages numeric not null default 0,
  expected_quantity numeric not null default 0,
  received_quantity numeric not null default 0,
  damage_qty numeric not null default 0,
  shortage_qty numeric not null default 0,
  remarks text,
  created_at timestamptz not null default now()
);

create index if not exists idx_cargo_receipt_items_receipt_id
  on public.cargo_receipt_items (receipt_id);

create table if not exists public.container_load_plans (
  id uuid primary key default gen_random_uuid(),
  load_plan_no text not null unique,
  shipment_no text,
  sales_contract_id uuid,
  status text not null default 'draft',
  container_type text not null default '',
  container_count integer not null default 1,
  loading_mode text,
  consolidation_mode text,
  port_of_loading text,
  port_of_destination text,
  forwarder_id text,
  truck_company_id text,
  customs_broker_id text,
  planned_etd date,
  booking_cutoff_at timestamptz,
  planned_customs_cutoff_at timestamptz,
  planned_loading_date date,
  seal_required boolean not null default true,
  final_seal_no text,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_container_load_plans_status check (
    status in (
      'draft',
      'cargo_collecting',
      'ready_for_loading',
      'loading_in_progress',
      'awaiting_final_seal',
      'sealed',
      'sent_to_port',
      'customs_in_progress',
      'released',
      'departed',
      'closed'
    )
  )
);

create index if not exists idx_container_load_plans_status
  on public.container_load_plans (status);

drop trigger if exists trg_container_load_plans_updated_at on public.container_load_plans;
create trigger trg_container_load_plans_updated_at
before update on public.container_load_plans
for each row execute function public.set_updated_at();

create table if not exists public.container_load_plan_items (
  id uuid primary key default gen_random_uuid(),
  load_plan_id uuid not null references public.container_load_plans(id) on delete cascade,
  cargo_lot_id uuid references public.cargo_lots(id) on delete set null,
  loading_task_id uuid,
  planned_packages numeric not null default 0,
  planned_quantity numeric not null default 0,
  planned_weight numeric not null default 0,
  planned_cbm numeric not null default 0,
  load_sequence_no integer not null default 1,
  is_final_loaded boolean not null default false,
  remarks text,
  created_at timestamptz not null default now()
);

create index if not exists idx_container_load_plan_items_load_plan_id
  on public.container_load_plan_items (load_plan_id);

create table if not exists public.loading_tasks (
  id uuid primary key default gen_random_uuid(),
  loading_task_no text not null unique,
  load_plan_id uuid not null references public.container_load_plans(id) on delete cascade,
  sequence_no integer not null default 1,
  task_status text not null default 'planned',
  loading_point_type text,
  loading_point_id text,
  loading_point_name text,
  truck_company_id text,
  container_no text,
  seal_status text not null default 'not_sealed',
  seal_no text,
  driver_name text,
  driver_phone text,
  vehicle_no text,
  supervisor_name text,
  scheduled_arrival_at timestamptz,
  actual_arrival_at timestamptz,
  loading_start_at timestamptz,
  loading_finish_at timestamptz,
  departed_at timestamptz,
  loaded_packages numeric not null default 0,
  loaded_quantity numeric not null default 0,
  loaded_weight numeric not null default 0,
  loaded_cbm numeric not null default 0,
  container_condition_ok boolean,
  container_clean_ok boolean,
  container_dry_ok boolean,
  odor_check_ok boolean,
  door_lock_ok boolean,
  floor_check_ok boolean,
  empty_container_photos jsonb not null default '[]'::jsonb,
  half_loaded_inner_photos jsonb not null default '[]'::jsonb,
  full_loaded_both_doors_open_photos jsonb not null default '[]'::jsonb,
  left_door_open_photos jsonb not null default '[]'::jsonb,
  both_doors_closed_photos jsonb not null default '[]'::jsonb,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_loading_tasks_status check (
    task_status in (
      'planned',
      'truck_dispatched',
      'arrived',
      'loading',
      'loaded',
      'departed_to_next_stop',
      'completed',
      'exception_open'
    )
  ),
  constraint chk_loading_tasks_seal_status check (
    seal_status in ('not_sealed', 'temporary_unsealed', 'sealed_final')
  )
);

create index if not exists idx_loading_tasks_load_plan_id
  on public.loading_tasks (load_plan_id);

create index if not exists idx_loading_tasks_status
  on public.loading_tasks (task_status);

drop trigger if exists trg_loading_tasks_updated_at on public.loading_tasks;
create trigger trg_loading_tasks_updated_at
before update on public.loading_tasks
for each row execute function public.set_updated_at();

create table if not exists public.loading_task_items (
  id uuid primary key default gen_random_uuid(),
  loading_task_id uuid not null references public.loading_tasks(id) on delete cascade,
  cargo_lot_id uuid references public.cargo_lots(id) on delete set null,
  loaded_packages numeric not null default 0,
  loaded_quantity numeric not null default 0,
  remarks text,
  created_at timestamptz not null default now()
);

create index if not exists idx_loading_task_items_loading_task_id
  on public.loading_task_items (loading_task_id);

create table if not exists public.loading_inspection_orders (
  id uuid primary key default gen_random_uuid(),
  inspection_order_no text not null unique,
  load_plan_id uuid references public.container_load_plans(id) on delete cascade,
  loading_task_id uuid references public.loading_tasks(id) on delete cascade,
  agency_name text,
  agency_type text,
  inspector_name text,
  inspector_phone text,
  scheduled_at timestamptz,
  arrived_at timestamptz,
  completed_at timestamptz,
  inspection_status text not null default 'draft',
  inspection_result text not null default 'pending',
  witness_container_no text,
  witness_seal_no text,
  report_no text,
  report_files jsonb not null default '[]'::jsonb,
  photos jsonb not null default '[]'::jsonb,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_loading_inspection_status check (
    inspection_status in ('draft', 'requested', 'confirmed', 'on_site', 'report_uploaded', 'closed')
  ),
  constraint chk_loading_inspection_result check (
    inspection_result in ('pending', 'passed', 'passed_with_remark', 'failed')
  )
);

create index if not exists idx_loading_inspection_orders_load_plan_id
  on public.loading_inspection_orders (load_plan_id);

create index if not exists idx_loading_inspection_orders_loading_task_id
  on public.loading_inspection_orders (loading_task_id);

drop trigger if exists trg_loading_inspection_orders_updated_at on public.loading_inspection_orders;
create trigger trg_loading_inspection_orders_updated_at
before update on public.loading_inspection_orders
for each row execute function public.set_updated_at();

alter table public.purchase_order_execution enable row level security;
alter table public.supplier_inspection_reports enable row level security;
alter table public.qc_inspection_orders enable row level security;
alter table public.domestic_transfer_orders enable row level security;
alter table public.domestic_transfer_order_items enable row level security;
alter table public.cargo_lots enable row level security;
alter table public.cargo_receipts enable row level security;
alter table public.cargo_receipt_items enable row level security;
alter table public.container_load_plans enable row level security;
alter table public.container_load_plan_items enable row level security;
alter table public.loading_tasks enable row level security;
alter table public.loading_task_items enable row level security;
alter table public.loading_inspection_orders enable row level security;

do $$
declare
  pair record;
begin
  for pair in
    select *
    from (values
      ('auth_all_purchase_order_execution',      'purchase_order_execution'),
      ('auth_all_supplier_inspection_reports',   'supplier_inspection_reports'),
      ('auth_all_qc_inspection_orders',          'qc_inspection_orders'),
      ('auth_all_domestic_transfer_orders',      'domestic_transfer_orders'),
      ('auth_all_domestic_transfer_order_items', 'domestic_transfer_order_items'),
      ('auth_all_cargo_lots',                    'cargo_lots'),
      ('auth_all_cargo_receipts',                'cargo_receipts'),
      ('auth_all_cargo_receipt_items',           'cargo_receipt_items'),
      ('auth_all_container_load_plans',          'container_load_plans'),
      ('auth_all_container_load_plan_items',     'container_load_plan_items'),
      ('auth_all_loading_tasks',                 'loading_tasks'),
      ('auth_all_loading_task_items',            'loading_task_items'),
      ('auth_all_loading_inspection_orders',     'loading_inspection_orders')
    ) as t(policy_name, table_name)
  loop
    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = pair.table_name
        and policyname = pair.policy_name
    ) then
      execute format(
        'create policy %I on public.%I for all to authenticated using (true) with check (true);',
        pair.policy_name,
        pair.table_name
      );
    end if;
  end loop;
end;
$$;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'purchase_order_execution',
    'supplier_inspection_reports',
    'qc_inspection_orders',
    'domestic_transfer_orders',
    'cargo_lots',
    'cargo_receipts',
    'container_load_plans',
    'loading_tasks',
    'loading_inspection_orders'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = tbl
    ) then
      execute format('alter publication supabase_realtime add table public.%I;', tbl);
    end if;
  end loop;
end;
$$;
