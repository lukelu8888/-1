-- ============================================================
-- Create customs preparation and declarations
-- 范围：CI/PL/报关资料 + 报关申报
-- ============================================================

create table if not exists public.shipment_document_sets (
  id uuid primary key default gen_random_uuid(),
  document_set_no text not null unique,
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  load_plan_id uuid references public.container_load_plans(id) on delete set null,
  commercial_invoice_no text,
  packing_list_no text,
  ci_status text not null default 'draft',
  pl_status text not null default 'draft',
  docs_ready_at timestamptz,
  prepared_by text,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_shipment_document_sets_ci_status check (
    ci_status in ('draft', 'prepared', 'confirmed')
  ),
  constraint chk_shipment_document_sets_pl_status check (
    pl_status in ('draft', 'prepared', 'confirmed')
  )
);

create index if not exists idx_shipment_document_sets_purchase_order_id
  on public.shipment_document_sets (purchase_order_id);

drop trigger if exists trg_shipment_document_sets_updated_at on public.shipment_document_sets;
create trigger trg_shipment_document_sets_updated_at
before update on public.shipment_document_sets
for each row execute function public.set_updated_at();

create table if not exists public.customs_declarations (
  id uuid primary key default gen_random_uuid(),
  customs_decl_no text not null unique,
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  load_plan_id uuid references public.container_load_plans(id) on delete set null,
  broker_name text,
  declaration_date date,
  declaration_status text not null default 'draft',
  released_at timestamptz,
  declaration_files jsonb not null default '[]'::jsonb,
  remarks text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_customs_declarations_status check (
    declaration_status in ('draft', 'submitted', 'under_review', 'released', 'hold', 'rejected')
  )
);

create index if not exists idx_customs_declarations_purchase_order_id
  on public.customs_declarations (purchase_order_id);

drop trigger if exists trg_customs_declarations_updated_at on public.customs_declarations;
create trigger trg_customs_declarations_updated_at
before update on public.customs_declarations
for each row execute function public.set_updated_at();

alter table public.shipment_document_sets enable row level security;
alter table public.customs_declarations enable row level security;

do $$
declare
  table_name text;
  policy_name text;
begin
  for table_name in
    select unnest(array['shipment_document_sets', 'customs_declarations'])
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
    execute 'alter publication supabase_realtime add table public.shipment_document_sets';
    execute 'alter publication supabase_realtime add table public.customs_declarations';
  end if;
exception
  when duplicate_object then null;
end;
$$;
