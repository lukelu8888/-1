-- ============================================================
-- Add post-QC customer notice and booking workflow
-- 范围：完货通知/验货方式 + 订舱询价/比价 + Shipping Order / 港口备案
-- ============================================================

alter table public.purchase_order_execution
  add column if not exists customer_inspection_mode text,
  add column if not exists goods_ready_notified_to_customer_at timestamptz,
  add column if not exists inspection_method_notified_at timestamptz,
  add column if not exists qc_report_shared_to_customer_at timestamptz,
  add column if not exists freight_inquiry_status text not null default 'pending',
  add column if not exists selected_booking_quote_id uuid,
  add column if not exists shipping_order_status text not null default 'pending';

comment on column public.purchase_order_execution.customer_inspection_mode is
  'How customer inspection is handled after QC: our_qc_report_shared | customer_self_inspection | customer_third_party_inspection';

comment on column public.purchase_order_execution.goods_ready_notified_to_customer_at is
  'Timestamp when customer was notified that goods are ready after supplier self-inspection / QC.';

comment on column public.purchase_order_execution.inspection_method_notified_at is
  'Timestamp when customer was informed whether our QC or customer third-party inspection will be used.';

comment on column public.purchase_order_execution.qc_report_shared_to_customer_at is
  'Timestamp when our QC report was shared to customer in ERP, if our QC is the governing inspection path.';

comment on column public.purchase_order_execution.freight_inquiry_status is
  'Freight inquiry lifecycle: pending | quoting | compared | customer_confirmation_pending | confirmed | shipping_order_issued';

comment on column public.purchase_order_execution.shipping_order_status is
  'Shipping order lifecycle: pending | draft | issued_to_forwarder | booking_confirmed | port_filing_pending | port_filing_completed';

create table if not exists public.booking_quote_requests (
  id uuid primary key default gen_random_uuid(),
  request_no text not null unique,
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  load_plan_id uuid references public.container_load_plans(id) on delete set null,
  destination_port text,
  trade_term text,
  booking_responsibility text,
  freight_confirmation_required boolean not null default false,
  customer_confirmation_required boolean not null default false,
  customer_confirmed_at timestamptz,
  cargo_ready_date date,
  container_type text,
  quantity_summary text,
  quote_deadline_at timestamptz,
  selected_option_id uuid,
  status text not null default 'draft',
  remarks text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_booking_quote_requests_status check (
    status in (
      'draft',
      'quoting',
      'compared',
      'customer_confirmation_pending',
      'confirmed',
      'shipping_order_issued',
      'cancelled'
    )
  )
);

create index if not exists idx_booking_quote_requests_purchase_order_id
  on public.booking_quote_requests (purchase_order_id);

drop trigger if exists trg_booking_quote_requests_updated_at on public.booking_quote_requests;
create trigger trg_booking_quote_requests_updated_at
before update on public.booking_quote_requests
for each row execute function public.set_updated_at();

create table if not exists public.booking_quote_options (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.booking_quote_requests(id) on delete cascade,
  option_rank integer not null default 1,
  forwarder_id text,
  forwarder_name text not null default '',
  carrier_name text not null default '',
  vessel_name text,
  voyage_no text,
  etd date,
  eta date,
  transit_days integer,
  freight_currency text not null default 'USD',
  freight_amount numeric not null default 0,
  surcharge_amount numeric not null default 0,
  total_amount numeric not null default 0,
  quote_valid_until timestamptz,
  is_selected boolean not null default false,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_booking_quote_options_request_id
  on public.booking_quote_options (request_id);

drop trigger if exists trg_booking_quote_options_updated_at on public.booking_quote_options;
create trigger trg_booking_quote_options_updated_at
before update on public.booking_quote_options
for each row execute function public.set_updated_at();

create table if not exists public.shipping_orders (
  id uuid primary key default gen_random_uuid(),
  shipping_order_no text not null unique,
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  booking_quote_request_id uuid references public.booking_quote_requests(id) on delete set null,
  selected_quote_option_id uuid references public.booking_quote_options(id) on delete set null,
  load_plan_id uuid references public.container_load_plans(id) on delete set null,
  forwarder_id text,
  forwarder_name text,
  carrier_name text,
  vessel_name text,
  voyage_no text,
  booking_no text,
  destination_port text,
  planned_etd date,
  booking_cutoff_at timestamptz,
  si_cutoff_at timestamptz,
  port_filing_required boolean not null default false,
  port_filing_status text not null default 'not_required',
  shipping_order_status text not null default 'draft',
  issued_at timestamptz,
  booking_confirmed_at timestamptz,
  remarks text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_shipping_orders_port_filing_status check (
    port_filing_status in ('not_required', 'pending', 'submitted', 'completed')
  ),
  constraint chk_shipping_orders_status check (
    shipping_order_status in ('draft', 'issued_to_forwarder', 'booking_confirmed', 'cancelled')
  )
);

create index if not exists idx_shipping_orders_purchase_order_id
  on public.shipping_orders (purchase_order_id);

drop trigger if exists trg_shipping_orders_updated_at on public.shipping_orders;
create trigger trg_shipping_orders_updated_at
before update on public.shipping_orders
for each row execute function public.set_updated_at();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'fk_booking_quote_requests_selected_option_id'
  ) then
    alter table public.booking_quote_requests
      add constraint fk_booking_quote_requests_selected_option_id
      foreign key (selected_option_id)
      references public.booking_quote_options(id)
      on delete set null;
  end if;
end;
$$;

alter table public.booking_quote_requests enable row level security;
alter table public.booking_quote_options enable row level security;
alter table public.shipping_orders enable row level security;

do $$
declare
  table_name text;
  policy_name text;
begin
  for table_name in
    select unnest(array['booking_quote_requests', 'booking_quote_options', 'shipping_orders'])
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
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    execute 'alter publication supabase_realtime add table public.booking_quote_requests';
    execute 'alter publication supabase_realtime add table public.booking_quote_options';
    execute 'alter publication supabase_realtime add table public.shipping_orders';
  end if;
exception
  when duplicate_object then null;
end;
$$;
