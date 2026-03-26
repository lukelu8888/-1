-- ============================================================
-- Create container loading placements
-- 范围：单柜装载 placement 层（为 2.5D/3D 与装柜顺序服务）
-- ============================================================

create table if not exists public.container_loading_placements (
  id uuid primary key default gen_random_uuid(),
  solution_container_id uuid not null references public.container_loading_solution_containers(id) on delete cascade,
  solution_item_id uuid not null references public.container_loading_solution_items(id) on delete cascade,
  placement_unit_no text not null,
  carton_serial_no text,
  packaging_unit_type text not null default 'carton',
  is_palletized boolean not null default false,
  units_per_handling_group integer not null default 1,
  handling_group_no text,
  x_cm numeric(18,3) not null default 0,
  y_cm numeric(18,3) not null default 0,
  z_cm numeric(18,3) not null default 0,
  length_cm numeric(18,3) not null default 0,
  width_cm numeric(18,3) not null default 0,
  height_cm numeric(18,3) not null default 0,
  weight_kg numeric(18,3) not null default 0,
  cbm numeric(18,6) not null default 0,
  rotation_mode text not null default 'LWH',
  layer_index integer not null default 1,
  face_to_door boolean not null default false,
  near_door_flag boolean not null default false,
  loading_sequence integer not null default 0,
  unloading_sequence integer not null default 0,
  placement_status text not null default 'planned',
  blocked_access_risk jsonb not null default '{}'::jsonb,
  fragile_risk jsonb not null default '{}'::jsonb,
  is_manual_adjusted boolean not null default false,
  manual_adjustment_reason text,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_container_loading_placements_unit unique (solution_container_id, placement_unit_no),
  constraint chk_container_loading_placements_packaging_unit_type check (
    packaging_unit_type in ('carton', 'bundle', 'pallet')
  ),
  constraint chk_container_loading_placements_rotation_mode check (
    rotation_mode in ('LWH', 'WLH', 'HLW', 'HWL', 'LHW', 'WHL')
  ),
  constraint chk_container_loading_placements_status check (
    placement_status in ('planned', 'adjusted', 'applied', 'cancelled')
  )
);

create index if not exists idx_container_loading_placements_container_id
  on public.container_loading_placements (solution_container_id);

create index if not exists idx_container_loading_placements_item_id
  on public.container_loading_placements (solution_item_id);

create index if not exists idx_container_loading_placements_sequence
  on public.container_loading_placements (solution_container_id, loading_sequence, unloading_sequence);

create index if not exists idx_container_loading_placements_layer
  on public.container_loading_placements (solution_container_id, layer_index);

drop trigger if exists trg_container_loading_placements_updated_at on public.container_loading_placements;
create trigger trg_container_loading_placements_updated_at
before update on public.container_loading_placements
for each row execute function public.set_updated_at();

alter table public.container_loading_placements enable row level security;

do $$
declare
  policy_name text;
begin
  policy_name := 'auth_all_container_loading_placements';
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'container_loading_placements'
      and policyname = policy_name
  ) then
    execute format(
      'create policy %I on public.container_loading_placements for all to authenticated using (true) with check (true)',
      policy_name
    );
  end if;
end;
$$;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    execute 'alter publication supabase_realtime add table public.container_loading_placements';
  end if;
exception
  when duplicate_object then null;
end;
$$;
