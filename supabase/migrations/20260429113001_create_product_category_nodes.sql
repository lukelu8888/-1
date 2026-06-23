create table if not exists public.product_category_nodes (
  id text primary key,
  name text not null,
  parent_id text references public.product_category_nodes(id) on delete cascade,
  description text,
  sort_order int not null default 100,
  region_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_product_category_nodes_parent
  on public.product_category_nodes(parent_id, sort_order);

create index if not exists idx_product_category_nodes_region
  on public.product_category_nodes(region_code, parent_id, sort_order);

alter table public.product_category_nodes enable row level security;

grant select on public.product_category_nodes to anon, authenticated;
grant insert, update, delete on public.product_category_nodes to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'product_category_nodes'
      and policyname = 'Public read product_category_nodes'
  ) then
    create policy "Public read product_category_nodes"
      on public.product_category_nodes
      for select
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'product_category_nodes'
      and policyname = 'product_category_nodes_write_authenticated'
  ) then
    create policy product_category_nodes_write_authenticated
      on public.product_category_nodes
      for all
      to authenticated
      using (true)
      with check (true);
  end if;
end $$;

insert into public.product_category_nodes (id, name, parent_id, description, sort_order, region_code)
select distinct on (seed.id)
  seed.id,
  seed.name,
  seed.parent_id,
  seed.description,
  seed.sort_order,
  seed.region_code
from (
  select
    pmc.id,
    pmc.name,
    null::text as parent_id,
    pmc.description,
    pmc.sort_order,
    pmc.region_code,
    1 as depth_rank
  from public.product_main_categories pmc

  union all

  select
    psc.id,
    psc.name,
    psc.main_category_id as parent_id,
    psc.description,
    psc.sort_order,
    psc.region_code,
    2 as depth_rank
  from public.product_sub_categories psc

  union all

  select
    pc.id,
    pc.name,
    pc.sub_category_id as parent_id,
    pc.description,
    pc.sort_order,
    pc.region_code,
    3 as depth_rank
  from public.product_categories pc
) as seed
order by seed.id, seed.depth_rank desc, seed.sort_order asc
on conflict (id) do update set
  name = excluded.name,
  parent_id = excluded.parent_id,
  description = excluded.description,
  sort_order = excluded.sort_order,
  region_code = excluded.region_code,
  updated_at = now();

comment on table public.product_category_nodes is
  'Canonical multi-level product category tree. Supports arbitrary depth and syncs back to the legacy 3-level category tables for storefront compatibility.';
