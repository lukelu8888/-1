-- ============================================================
-- Post-shipment tracking and delivery
-- 范围：开船后跟踪、到港、清关、收货、异常
-- ============================================================

create table if not exists public.voyage_tracking (
  id uuid primary key default gen_random_uuid(),
  tracking_no text not null unique,
  shipment_no text,
  load_plan_id uuid references public.container_load_plans(id) on delete set null,
  sales_contract_id uuid,
  purchase_order_id uuid references public.purchase_orders(id) on delete set null,
  bl_no text,
  container_no text,
  carrier_name text,
  vessel_name text,
  voyage_no text,
  etd date,
  eta date,
  ata date,
  current_status text not null default 'departed',
  current_location text,
  last_event_at timestamptz,
  tracking_source text,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_voyage_tracking_status check (
    current_status in ('departed', 'in_transit', 'transshipment', 'arrived_at_port', 'delayed', 'exception')
  )
);

create index if not exists idx_voyage_tracking_load_plan_id
  on public.voyage_tracking (load_plan_id);

create index if not exists idx_voyage_tracking_shipment_no
  on public.voyage_tracking (shipment_no);

drop trigger if exists trg_voyage_tracking_updated_at on public.voyage_tracking;
create trigger trg_voyage_tracking_updated_at
before update on public.voyage_tracking
for each row execute function public.set_updated_at();

create table if not exists public.voyage_tracking_events (
  id uuid primary key default gen_random_uuid(),
  voyage_id uuid not null references public.voyage_tracking(id) on delete cascade,
  event_code text,
  event_name text not null,
  event_time timestamptz,
  location text,
  source text,
  remarks text,
  created_at timestamptz not null default now()
);

create index if not exists idx_voyage_tracking_events_voyage_id
  on public.voyage_tracking_events (voyage_id);

create table if not exists public.arrival_notices (
  id uuid primary key default gen_random_uuid(),
  arrival_notice_no text not null unique,
  shipment_no text,
  voyage_id uuid references public.voyage_tracking(id) on delete set null,
  load_plan_id uuid references public.container_load_plans(id) on delete set null,
  bl_no text,
  arrival_port text,
  arrival_at timestamptz,
  free_days integer,
  demurrage_rule text,
  sent_to_customer_at timestamptz,
  sent_to_agent_at timestamptz,
  status text not null default 'draft',
  files jsonb not null default '[]'::jsonb,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_arrival_notices_status check (
    status in ('draft', 'ready', 'sent', 'acknowledged')
  )
);

create index if not exists idx_arrival_notices_voyage_id
  on public.arrival_notices (voyage_id);

drop trigger if exists trg_arrival_notices_updated_at on public.arrival_notices;
create trigger trg_arrival_notices_updated_at
before update on public.arrival_notices
for each row execute function public.set_updated_at();

create table if not exists public.import_clearance_coordination (
  id uuid primary key default gen_random_uuid(),
  clearance_no text not null unique,
  shipment_no text,
  voyage_id uuid references public.voyage_tracking(id) on delete set null,
  arrival_notice_id uuid references public.arrival_notices(id) on delete set null,
  customer_id text,
  destination_country text,
  destination_port text,
  import_broker_name text,
  import_broker_contact text,
  import_clearance_responsibility text,
  destination_delivery_responsibility text,
  clearance_status text not null default 'not_started',
  doc_status text not null default 'pending',
  customs_release_at timestamptz,
  duty_paid_flag boolean not null default false,
  delivery_order_received boolean not null default false,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_import_clearance_coordination_status check (
    clearance_status in ('not_started', 'documents_sent', 'under_clearance', 'hold', 'released', 'delivered_to_customer')
  )
);

create index if not exists idx_import_clearance_coordination_voyage_id
  on public.import_clearance_coordination (voyage_id);

drop trigger if exists trg_import_clearance_coordination_updated_at on public.import_clearance_coordination;
create trigger trg_import_clearance_coordination_updated_at
before update on public.import_clearance_coordination
for each row execute function public.set_updated_at();

create table if not exists public.delivery_confirmations (
  id uuid primary key default gen_random_uuid(),
  delivery_confirm_no text not null unique,
  shipment_no text,
  voyage_id uuid references public.voyage_tracking(id) on delete set null,
  clearance_id uuid references public.import_clearance_coordination(id) on delete set null,
  customer_id text,
  delivered_at timestamptz,
  received_by text,
  received_quantity numeric not null default 0,
  damage_flag boolean not null default false,
  shortage_flag boolean not null default false,
  claim_flag boolean not null default false,
  pod_files jsonb not null default '[]'::jsonb,
  photos jsonb not null default '[]'::jsonb,
  remarks text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_delivery_confirmations_status check (
    status in ('pending', 'received_ok', 'received_with_issue', 'claim_open', 'closed')
  )
);

create index if not exists idx_delivery_confirmations_voyage_id
  on public.delivery_confirmations (voyage_id);

drop trigger if exists trg_delivery_confirmations_updated_at on public.delivery_confirmations;
create trigger trg_delivery_confirmations_updated_at
before update on public.delivery_confirmations
for each row execute function public.set_updated_at();

create table if not exists public.delivery_exceptions (
  id uuid primary key default gen_random_uuid(),
  exception_no text not null unique,
  shipment_no text,
  voyage_id uuid references public.voyage_tracking(id) on delete set null,
  delivery_confirm_id uuid references public.delivery_confirmations(id) on delete set null,
  exception_type text not null,
  reported_by text,
  reported_at timestamptz,
  responsible_party text,
  financial_impact numeric,
  status text not null default 'open',
  evidence_files jsonb not null default '[]'::jsonb,
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_delivery_exceptions_type check (
    exception_type in ('delay', 'shortage', 'damage', 'wrong_delivery', 'clearance_hold', 'document_missing')
  ),
  constraint chk_delivery_exceptions_status check (
    status in ('open', 'investigating', 'awaiting_compensation', 'resolved', 'closed')
  )
);

create index if not exists idx_delivery_exceptions_voyage_id
  on public.delivery_exceptions (voyage_id);

drop trigger if exists trg_delivery_exceptions_updated_at on public.delivery_exceptions;
create trigger trg_delivery_exceptions_updated_at
before update on public.delivery_exceptions
for each row execute function public.set_updated_at();

alter table public.voyage_tracking enable row level security;
alter table public.voyage_tracking_events enable row level security;
alter table public.arrival_notices enable row level security;
alter table public.import_clearance_coordination enable row level security;
alter table public.delivery_confirmations enable row level security;
alter table public.delivery_exceptions enable row level security;

do $$
declare
  pair record;
begin
  for pair in
    select *
    from (values
      ('auth_all_voyage_tracking',               'voyage_tracking'),
      ('auth_all_voyage_tracking_events',        'voyage_tracking_events'),
      ('auth_all_arrival_notices',               'arrival_notices'),
      ('auth_all_import_clearance_coordination', 'import_clearance_coordination'),
      ('auth_all_delivery_confirmations',        'delivery_confirmations'),
      ('auth_all_delivery_exceptions',           'delivery_exceptions')
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
    'voyage_tracking',
    'arrival_notices',
    'import_clearance_coordination',
    'delivery_confirmations',
    'delivery_exceptions'
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
