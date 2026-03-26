-- ============================================================
-- Create third-party warehouses and consolidation plans
-- 范围：第三方仓库主数据 + 装柜前集货配柜计划
-- ============================================================

create table if not exists public.third_party_warehouses (
  id uuid primary key default gen_random_uuid(),
  warehouse_no text not null unique,
  warehouse_name text not null,
  warehouse_type text not null default 'third_party_warehouse',
  contact_name text,
  contact_phone text,
  contact_email text,
  address text,
  city text,
  province text,
  country text not null default 'China',
  status text not null default 'active',
  service_scope jsonb not null default '[]'::jsonb,
  settlement_terms text,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_third_party_warehouses_status check (
    status in ('active', 'inactive', 'suspended')
  )
);

create index if not exists idx_third_party_warehouses_status
  on public.third_party_warehouses (status);

drop trigger if exists trg_third_party_warehouses_updated_at on public.third_party_warehouses;
create trigger trg_third_party_warehouses_updated_at
before update on public.third_party_warehouses
for each row execute function public.set_updated_at();

create table if not exists public.consolidation_plans (
  id uuid primary key default gen_random_uuid(),
  plan_no text not null unique,
  shipment_no text,
  load_plan_id uuid references public.container_load_plans(id) on delete set null,
  consolidation_point_type text not null,
  consolidation_point_id text,
  consolidation_point_name text not null,
  consolidation_point_address text,
  warehouse_contact_name text,
  warehouse_contact_phone text,
  planned_loading_date date,
  status text not null default 'planning',
  remarks text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_consolidation_plans_status check (
    status in ('planning', 'collecting', 'ready_for_loading', 'loading', 'closed', 'cancelled')
  )
);

create index if not exists idx_consolidation_plans_load_plan_id
  on public.consolidation_plans (load_plan_id);

drop trigger if exists trg_consolidation_plans_updated_at on public.consolidation_plans;
create trigger trg_consolidation_plans_updated_at
before update on public.consolidation_plans
for each row execute function public.set_updated_at();

create table if not exists public.consolidation_plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.consolidation_plans(id) on delete cascade,
  purchase_order_id uuid references public.purchase_orders(id) on delete set null,
  supplier_id text,
  supplier_name text,
  product_name text not null default '',
  model_no text,
  planned_container_no text,
  planned_container_slot text,
  planned_packages numeric not null default 0,
  planned_quantity numeric not null default 0,
  received_packages numeric not null default 0,
  received_quantity numeric not null default 0,
  item_status text not null default 'planned',
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_consolidation_plan_items_status check (
    item_status in ('planned', 'in_transit', 'received', 'stacked', 'loaded', 'cancelled')
  )
);

create index if not exists idx_consolidation_plan_items_plan_id
  on public.consolidation_plan_items (plan_id);

drop trigger if exists trg_consolidation_plan_items_updated_at on public.consolidation_plan_items;
create trigger trg_consolidation_plan_items_updated_at
before update on public.consolidation_plan_items
for each row execute function public.set_updated_at();

alter table public.domestic_transfer_orders
  add column if not exists consolidation_plan_id uuid references public.consolidation_plans(id) on delete set null,
  add column if not exists consolidation_item_id uuid references public.consolidation_plan_items(id) on delete set null;

alter table public.cargo_receipts
  add column if not exists consolidation_plan_id uuid references public.consolidation_plans(id) on delete set null;

alter table public.third_party_warehouses enable row level security;
alter table public.consolidation_plans enable row level security;
alter table public.consolidation_plan_items enable row level security;

do $$
declare
  table_name text;
  policy_name text;
begin
  for table_name in
    select unnest(array['third_party_warehouses', 'consolidation_plans', 'consolidation_plan_items'])
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
    execute 'alter publication supabase_realtime add table public.third_party_warehouses';
    execute 'alter publication supabase_realtime add table public.consolidation_plans';
    execute 'alter publication supabase_realtime add table public.consolidation_plan_items';
  end if;
exception
  when duplicate_object then null;
end;
$$;
