-- ============================================================
-- Create container loading MVP core tables
-- 范围：待装柜池 + 柜型规格 + 分柜规划 MVP（不含 placement 层）
-- ============================================================

create table if not exists public.loading_pools (
  id uuid primary key default gen_random_uuid(),
  pool_no text not null unique,
  pool_name text not null,
  pool_type text not null,
  customer_id text,
  customer_name text,
  shipment_batch_no text,
  shipment_split_no text,
  planning_scope text not null default 'outbound_loading',
  pool_status text not null default 'draft',
  planned_loading_date date,
  port_of_loading text,
  destination_port text,
  trade_term text,
  currency text,
  total_orders integer not null default 0,
  total_suppliers integer not null default 0,
  total_skus integer not null default 0,
  total_cartons numeric(18,3) not null default 0,
  total_weight_kg numeric(18,3) not null default 0,
  total_cbm numeric(18,6) not null default 0,
  rules_profile_code text,
  business_constraints_snapshot jsonb not null default '{}'::jsonb,
  remarks text,
  created_by text,
  approved_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_loading_pools_type check (
    pool_type in ('shipment_batch', 'mixed_loading', 'split_shipment', 'manual_pool')
  ),
  constraint chk_loading_pools_scope check (
    planning_scope in ('outbound_loading')
  ),
  constraint chk_loading_pools_status check (
    pool_status in ('draft', 'collecting', 'ready_for_planning', 'planning', 'planned', 'executing', 'closed', 'cancelled')
  )
);

create index if not exists idx_loading_pools_status
  on public.loading_pools (pool_status);

create index if not exists idx_loading_pools_batch
  on public.loading_pools (shipment_batch_no, shipment_split_no);

create index if not exists idx_loading_pools_customer
  on public.loading_pools (customer_id);

create index if not exists idx_loading_pools_loading_date
  on public.loading_pools (planned_loading_date);

drop trigger if exists trg_loading_pools_updated_at on public.loading_pools;
create trigger trg_loading_pools_updated_at
before update on public.loading_pools
for each row execute function public.set_updated_at();

create table if not exists public.loading_pool_items (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.loading_pools(id) on delete cascade,
  source_type text not null,
  source_ref_id uuid,
  sales_contract_id uuid,
  purchase_order_id uuid references public.purchase_orders(id) on delete set null,
  order_id text,
  order_no text,
  customer_id text,
  customer_name text,
  supplier_id text,
  supplier_name text,
  shipment_batch_no text,
  shipment_split_no text,
  sku_id text,
  sku_code text,
  product_name text not null,
  model_no text,
  category_code text,
  cargo_category text,
  packaging_unit_type text not null default 'carton',
  is_palletized boolean not null default false,
  units_per_handling_group integer not null default 1,
  carton_count numeric(18,3) not null default 0,
  quantity numeric(18,3) not null default 0,
  carton_length_cm numeric(18,3) not null default 0,
  carton_width_cm numeric(18,3) not null default 0,
  carton_height_cm numeric(18,3) not null default 0,
  carton_gross_weight_kg numeric(18,3) not null default 0,
  single_carton_cbm numeric(18,6) not null default 0,
  total_weight_kg numeric(18,3) not null default 0,
  total_cbm numeric(18,6) not null default 0,
  rotation_allowed boolean not null default true,
  rotation_modes jsonb not null default '[]'::jsonb,
  stackable boolean not null default true,
  max_stack_layers integer,
  fragile boolean not null default false,
  mixable boolean not null default true,
  must_same_container boolean not null default false,
  manual_lock_container_key text,
  preferred_container_type text,
  forbidden_container_types jsonb not null default '[]'::jsonb,
  must_near_door boolean not null default false,
  must_bottom boolean not null default false,
  must_top boolean not null default false,
  loading_priority integer not null default 100,
  unloading_priority integer not null default 100,
  item_status text not null default 'ready',
  manual_override_flag boolean not null default false,
  constraint_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_loading_pool_items_source_type check (
    source_type in ('cargo_lot', 'consolidation_item', 'manual_entry')
  ),
  constraint chk_loading_pool_items_category check (
    cargo_category in ('heavy', 'normal', 'light') or cargo_category is null
  ),
  constraint chk_loading_pool_items_packaging_unit_type check (
    packaging_unit_type in ('carton', 'bundle', 'pallet')
  ),
  constraint chk_loading_pool_items_status check (
    item_status in ('ready', 'locked', 'allocated', 'partially_allocated', 'loaded', 'cancelled')
  )
);

create index if not exists idx_loading_pool_items_pool_id
  on public.loading_pool_items (pool_id);

create index if not exists idx_loading_pool_items_source
  on public.loading_pool_items (pool_id, source_type, source_ref_id);

create index if not exists idx_loading_pool_items_supplier
  on public.loading_pool_items (supplier_id);

create index if not exists idx_loading_pool_items_order_batch
  on public.loading_pool_items (order_id, shipment_batch_no, shipment_split_no);

create index if not exists idx_loading_pool_items_status
  on public.loading_pool_items (item_status);

create index if not exists idx_loading_pool_items_priority
  on public.loading_pool_items (loading_priority, unloading_priority);

drop trigger if exists trg_loading_pool_items_updated_at on public.loading_pool_items;
create trigger trg_loading_pool_items_updated_at
before update on public.loading_pool_items
for each row execute function public.set_updated_at();

create table if not exists public.container_type_specs (
  id uuid primary key default gen_random_uuid(),
  container_type_code text not null unique,
  container_type_name text not null,
  inner_length_cm numeric(18,3) not null,
  inner_width_cm numeric(18,3) not null,
  inner_height_cm numeric(18,3) not null,
  door_width_cm numeric(18,3),
  door_height_cm numeric(18,3),
  max_payload_kg numeric(18,3) not null,
  max_volume_cbm numeric(18,6) not null,
  tare_weight_kg numeric(18,3),
  usable_volume_ratio numeric(8,4) not null default 0.9500,
  usable_weight_ratio numeric(8,4) not null default 0.9500,
  default_for_export boolean not null default false,
  status text not null default 'active',
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_container_type_specs_status check (
    status in ('active', 'inactive')
  )
);

create index if not exists idx_container_type_specs_status
  on public.container_type_specs (status);

create index if not exists idx_container_type_specs_default
  on public.container_type_specs (default_for_export);

drop trigger if exists trg_container_type_specs_updated_at on public.container_type_specs;
create trigger trg_container_type_specs_updated_at
before update on public.container_type_specs
for each row execute function public.set_updated_at();

insert into public.container_type_specs (
  container_type_code,
  container_type_name,
  inner_length_cm,
  inner_width_cm,
  inner_height_cm,
  door_width_cm,
  door_height_cm,
  max_payload_kg,
  max_volume_cbm,
  tare_weight_kg,
  usable_volume_ratio,
  usable_weight_ratio,
  default_for_export,
  status,
  remarks
) values
  ('20GP', '20GP Standard Container', 589.8, 235.2, 239.3, 234.0, 228.0, 28200.000, 33.200000, 2230.000, 0.9500, 0.9500, false, 'active', 'MVP default seed'),
  ('40GP', '40GP Standard Container', 1203.2, 235.2, 239.3, 234.0, 228.0, 26700.000, 67.700000, 3720.000, 0.9500, 0.9500, false, 'active', 'MVP default seed'),
  ('40HQ', '40HQ High Cube Container', 1203.2, 235.2, 269.8, 234.0, 258.0, 26500.000, 76.300000, 3850.000, 0.9500, 0.9500, true, 'active', 'MVP default seed')
on conflict (container_type_code) do nothing;

create table if not exists public.container_loading_solutions (
  id uuid primary key default gen_random_uuid(),
  solution_no text not null unique,
  pool_id uuid not null references public.loading_pools(id) on delete cascade,
  planning_mode text not null default 'system',
  solution_status text not null default 'draft',
  is_baseline boolean not null default false,
  parent_solution_id uuid references public.container_loading_solutions(id) on delete set null,
  version_no integer not null default 1,
  algorithm_version text,
  estimation_summary jsonb not null default '{}'::jsonb,
  recommended_container_mix jsonb not null default '[]'::jsonb,
  utilization_summary jsonb not null default '{}'::jsonb,
  risk_summary jsonb not null default '{}'::jsonb,
  total_weight_kg numeric(18,3) not null default 0,
  total_cbm numeric(18,6) not null default 0,
  total_cartons numeric(18,3) not null default 0,
  container_count integer not null default 0,
  manual_adjustment_count integer not null default 0,
  confirmed_at timestamptz,
  confirmed_by text,
  executed_at timestamptz,
  executed_by text,
  remarks text,
  created_by text,
  approved_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_container_loading_solutions_planning_mode check (
    planning_mode in ('system', 'manual', 'hybrid')
  ),
  constraint chk_container_loading_solutions_status check (
    solution_status in ('draft', 'recommended', 'confirmed', 'executed', 'cancelled')
  )
);

create index if not exists idx_container_loading_solutions_pool_id
  on public.container_loading_solutions (pool_id);

create index if not exists idx_container_loading_solutions_status
  on public.container_loading_solutions (solution_status);

create index if not exists idx_container_loading_solutions_parent
  on public.container_loading_solutions (parent_solution_id);

create index if not exists idx_container_loading_solutions_baseline
  on public.container_loading_solutions (pool_id, is_baseline);

drop trigger if exists trg_container_loading_solutions_updated_at on public.container_loading_solutions;
create trigger trg_container_loading_solutions_updated_at
before update on public.container_loading_solutions
for each row execute function public.set_updated_at();

create table if not exists public.container_loading_solution_containers (
  id uuid primary key default gen_random_uuid(),
  solution_id uuid not null references public.container_loading_solutions(id) on delete cascade,
  container_index integer not null,
  planned_container_no text,
  actual_container_no text,
  container_type_spec_id uuid references public.container_type_specs(id) on delete restrict,
  container_type_code text not null,
  door_side text not null default 'rear',
  planning_status text not null default 'draft',
  manual_locked boolean not null default false,
  planned_weight_kg numeric(18,3) not null default 0,
  planned_cbm numeric(18,6) not null default 0,
  planned_cartons numeric(18,3) not null default 0,
  weight_utilization numeric(8,4) not null default 0,
  volume_utilization numeric(8,4) not null default 0,
  supplier_grouping_score numeric(8,4) not null default 0,
  loading_risk_score numeric(8,4) not null default 0,
  unloading_risk_score numeric(8,4) not null default 0,
  weight_risk jsonb not null default '{}'::jsonb,
  volume_risk jsonb not null default '{}'::jsonb,
  stacking_risk jsonb not null default '{}'::jsonb,
  fragile_risk jsonb not null default '{}'::jsonb,
  unloading_risk jsonb not null default '{}'::jsonb,
  grouping_risk jsonb not null default '{}'::jsonb,
  near_door_item_count integer not null default 0,
  blocked_access_risk jsonb not null default '{}'::jsonb,
  planned_loading_sequence_summary jsonb not null default '[]'::jsonb,
  actual_weight_kg numeric(18,3) not null default 0,
  actual_cbm numeric(18,6) not null default 0,
  actual_cartons numeric(18,3) not null default 0,
  actual_seal_no text,
  variance_flag boolean not null default false,
  variance_reason text,
  manual_adjustment_notes text,
  executed_at timestamptz,
  executed_by text,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_container_loading_solution_containers_seq unique (solution_id, container_index),
  constraint chk_container_loading_solution_containers_door_side check (
    door_side in ('rear', 'front')
  ),
  constraint chk_container_loading_solution_containers_status check (
    planning_status in ('draft', 'allocated', 'locked', 'executing', 'completed', 'cancelled')
  )
);

create index if not exists idx_container_loading_solution_containers_solution_id
  on public.container_loading_solution_containers (solution_id);

create index if not exists idx_container_loading_solution_containers_type
  on public.container_loading_solution_containers (container_type_code);

create index if not exists idx_container_loading_solution_containers_status
  on public.container_loading_solution_containers (planning_status);

drop trigger if exists trg_container_loading_solution_containers_updated_at on public.container_loading_solution_containers;
create trigger trg_container_loading_solution_containers_updated_at
before update on public.container_loading_solution_containers
for each row execute function public.set_updated_at();

create table if not exists public.container_loading_solution_items (
  id uuid primary key default gen_random_uuid(),
  solution_container_id uuid not null references public.container_loading_solution_containers(id) on delete cascade,
  pool_item_id uuid not null references public.loading_pool_items(id) on delete restrict,
  line_no integer not null,
  item_seq integer not null,
  sales_contract_id uuid,
  purchase_order_id uuid references public.purchase_orders(id) on delete set null,
  order_id text,
  order_no text,
  customer_id text,
  customer_name text,
  supplier_id text,
  supplier_name text,
  shipment_batch_no text,
  shipment_split_no text,
  sku_id text,
  sku_code text,
  product_name text not null,
  model_no text,
  category_code text,
  cargo_category text,
  packaging_unit_type text not null default 'carton',
  is_palletized boolean not null default false,
  units_per_handling_group integer not null default 1,
  planned_carton_count numeric(18,3) not null default 0,
  planned_quantity numeric(18,3) not null default 0,
  planned_weight_kg numeric(18,3) not null default 0,
  planned_cbm numeric(18,6) not null default 0,
  actual_carton_count numeric(18,3) not null default 0,
  actual_quantity numeric(18,3) not null default 0,
  actual_weight_kg numeric(18,3) not null default 0,
  actual_cbm numeric(18,6) not null default 0,
  must_same_container boolean not null default false,
  mixable boolean not null default true,
  loading_priority integer not null default 100,
  unloading_priority integer not null default 100,
  fragile boolean not null default false,
  stackable boolean not null default true,
  max_stack_layers integer,
  rotation_allowed boolean not null default true,
  rotation_modes jsonb not null default '[]'::jsonb,
  preferred_container_type text,
  forbidden_container_types jsonb not null default '[]'::jsonb,
  must_near_door boolean not null default false,
  must_bottom boolean not null default false,
  must_top boolean not null default false,
  near_door_flag boolean not null default false,
  blocked_access_risk jsonb not null default '{}'::jsonb,
  allocation_status text not null default 'allocated',
  manual_override_flag boolean not null default false,
  manual_override_reason text,
  variance_flag boolean not null default false,
  variance_reason text,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_container_loading_solution_items_category check (
    cargo_category in ('heavy', 'normal', 'light') or cargo_category is null
  ),
  constraint chk_container_loading_solution_items_packaging_unit_type check (
    packaging_unit_type in ('carton', 'bundle', 'pallet')
  ),
  constraint chk_container_loading_solution_items_status check (
    allocation_status in ('allocated', 'locked', 'adjusted', 'loaded', 'cancelled')
  )
);

create index if not exists idx_container_loading_solution_items_container_id
  on public.container_loading_solution_items (solution_container_id);

create index if not exists idx_container_loading_solution_items_pool_item_id
  on public.container_loading_solution_items (pool_item_id);

create index if not exists idx_container_loading_solution_items_supplier
  on public.container_loading_solution_items (supplier_id);

create index if not exists idx_container_loading_solution_items_order_batch
  on public.container_loading_solution_items (order_id, shipment_batch_no, shipment_split_no);

create index if not exists idx_container_loading_solution_items_status
  on public.container_loading_solution_items (allocation_status);

create index if not exists idx_container_loading_solution_items_seq
  on public.container_loading_solution_items (solution_container_id, line_no, item_seq);

drop trigger if exists trg_container_loading_solution_items_updated_at on public.container_loading_solution_items;
create trigger trg_container_loading_solution_items_updated_at
before update on public.container_loading_solution_items
for each row execute function public.set_updated_at();

alter table public.loading_pools enable row level security;
alter table public.loading_pool_items enable row level security;
alter table public.container_type_specs enable row level security;
alter table public.container_loading_solutions enable row level security;
alter table public.container_loading_solution_containers enable row level security;
alter table public.container_loading_solution_items enable row level security;

do $$
declare
  table_name text;
  policy_name text;
begin
  for table_name in
    select unnest(array[
      'loading_pools',
      'loading_pool_items',
      'container_type_specs',
      'container_loading_solutions',
      'container_loading_solution_containers',
      'container_loading_solution_items'
    ])
  loop
    policy_name := format('auth_all_%s', table_name);
    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = table_name
        and policyname = policy_name
    ) then
      execute format(
        'create policy %I on public.%I for all to authenticated using (true) with check (true)',
        policy_name,
        table_name
      );
    end if;
  end loop;
end;
$$;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    execute 'alter publication supabase_realtime add table public.loading_pools';
    execute 'alter publication supabase_realtime add table public.loading_pool_items';
    execute 'alter publication supabase_realtime add table public.container_type_specs';
    execute 'alter publication supabase_realtime add table public.container_loading_solutions';
    execute 'alter publication supabase_realtime add table public.container_loading_solution_containers';
    execute 'alter publication supabase_realtime add table public.container_loading_solution_items';
  end if;
exception
  when duplicate_object then null;
end;
$$;
