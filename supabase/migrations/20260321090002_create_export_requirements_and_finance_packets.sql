-- ============================================================
-- Export requirements and finance compliance packets
-- 范围：出口要求判定 + 财务合规文件包
-- ============================================================

create table if not exists public.export_requirement_checks (
  id uuid primary key default gen_random_uuid(),
  check_no text not null unique,
  sales_contract_id uuid,
  purchase_order_id uuid references public.purchase_orders(id) on delete set null,
  shipment_no text,
  load_plan_id uuid references public.container_load_plans(id) on delete set null,
  destination_country text,
  trade_term text,
  customer_id text,
  requires_customs_declaration boolean not null default true,
  requires_inspection boolean not null default false,
  requires_co boolean not null default false,
  requires_fumigation boolean not null default false,
  requires_loading_inspection_report boolean not null default false,
  requires_health_certificate boolean not null default false,
  requires_other_docs boolean not null default false,
  other_doc_notes text,
  checked_by text,
  checked_at timestamptz,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_export_requirement_checks_status check (
    status in ('draft', 'checking', 'confirmed', 'documents_pending', 'ready_for_customs')
  )
);

create index if not exists idx_export_requirement_checks_po_id
  on public.export_requirement_checks (purchase_order_id);

create index if not exists idx_export_requirement_checks_load_plan_id
  on public.export_requirement_checks (load_plan_id);

drop trigger if exists trg_export_requirement_checks_updated_at on public.export_requirement_checks;
create trigger trg_export_requirement_checks_updated_at
before update on public.export_requirement_checks
for each row execute function public.set_updated_at();

create table if not exists public.finance_compliance_packets (
  id uuid primary key default gen_random_uuid(),
  packet_no text not null unique,
  export_case_no text,
  sales_contract_id uuid,
  purchase_order_id uuid references public.purchase_orders(id) on delete set null,
  load_plan_id uuid references public.container_load_plans(id) on delete set null,
  export_check_id uuid references public.export_requirement_checks(id) on delete set null,
  sc_no text,
  cg_no text,
  shipment_no text,
  load_plan_no text,
  customs_decl_no text,
  customer_id text,
  customer_name text not null default '',
  region text,
  currency text not null default 'USD',
  trade_term text,
  destination_country text,
  status text not null default 'draft',
  doc_ready_percent numeric not null default 0,
  tax_refund_ready boolean not null default false,
  archived_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_finance_compliance_packets_status check (
    status in ('draft', 'collecting', 'partially_ready', 'ready_for_fx_docs', 'ready_for_tax_refund', 'archived')
  )
);

create index if not exists idx_finance_compliance_packets_po_id
  on public.finance_compliance_packets (purchase_order_id);

create index if not exists idx_finance_compliance_packets_shipment_no
  on public.finance_compliance_packets (shipment_no);

drop trigger if exists trg_finance_compliance_packets_updated_at on public.finance_compliance_packets;
create trigger trg_finance_compliance_packets_updated_at
before update on public.finance_compliance_packets
for each row execute function public.set_updated_at();

comment on table public.finance_compliance_packets is
  'Finance compliance packet for one export case. Stores financial document readiness and archival state.';

create table if not exists public.finance_packet_document_slots (
  id uuid primary key default gen_random_uuid(),
  packet_id uuid not null references public.finance_compliance_packets(id) on delete cascade,
  doc_code text not null,
  doc_name text not null,
  doc_category text,
  is_required boolean not null default true,
  requirement_rule text,
  source_type text,
  source_ref text,
  status text not null default 'pending',
  current_file_id uuid,
  missing_reason text,
  generated_at timestamptz,
  confirmed_at timestamptz,
  confirmed_by text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_finance_packet_document_slots unique (packet_id, doc_code),
  constraint chk_finance_packet_document_slots_doc_code check (
    doc_code in ('D01', 'D02', 'D03', 'D04', 'D05', 'D06', 'D07', 'D08', 'D09', 'D10', 'D11', 'D12', 'D13')
  ),
  constraint chk_finance_packet_document_slots_status check (
    status in ('not_required', 'pending', 'awaiting_upload', 'awaiting_generation', 'linked', 'uploaded', 'generated', 'verified', 'rejected')
  )
);

create index if not exists idx_finance_packet_document_slots_packet_id
  on public.finance_packet_document_slots (packet_id);

create index if not exists idx_finance_packet_document_slots_doc_code
  on public.finance_packet_document_slots (doc_code);

drop trigger if exists trg_finance_packet_document_slots_updated_at on public.finance_packet_document_slots;
create trigger trg_finance_packet_document_slots_updated_at
before update on public.finance_packet_document_slots
for each row execute function public.set_updated_at();

create table if not exists public.finance_packet_files (
  id uuid primary key default gen_random_uuid(),
  packet_id uuid not null references public.finance_compliance_packets(id) on delete cascade,
  slot_id uuid not null references public.finance_packet_document_slots(id) on delete cascade,
  version_no integer not null default 1,
  file_name text not null,
  file_type text,
  storage_bucket text,
  storage_path text,
  file_url text,
  origin_mode text not null default 'manual_admin_upload',
  origin_ref_type text,
  origin_ref_id text,
  uploaded_from_portal text,
  uploaded_by_party_type text,
  uploaded_by_party_id text,
  is_primary_source boolean not null default false,
  verified_by_finance text,
  verified_at timestamptz,
  uploaded_at timestamptz not null default now(),
  is_current boolean not null default false,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_finance_packet_files_origin_mode check (
    origin_mode in (
      'auto_generated',
      'auto_linked',
      'manual_admin_upload',
      'supplier_portal_upload',
      'partner_portal_upload',
      'finance_upload'
    )
  )
);

create index if not exists idx_finance_packet_files_packet_id
  on public.finance_packet_files (packet_id);

create index if not exists idx_finance_packet_files_slot_id
  on public.finance_packet_files (slot_id);

create index if not exists idx_finance_packet_files_origin_mode
  on public.finance_packet_files (origin_mode);

drop trigger if exists trg_finance_packet_files_updated_at on public.finance_packet_files;
create trigger trg_finance_packet_files_updated_at
before update on public.finance_packet_files
for each row execute function public.set_updated_at();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'fk_finance_packet_document_slots_current_file_id'
  ) then
    alter table public.finance_packet_document_slots
      add constraint fk_finance_packet_document_slots_current_file_id
      foreign key (current_file_id)
      references public.finance_packet_files(id)
      on delete set null;
  end if;
end;
$$;

create or replace function public.seed_finance_packet_document_slots()
returns trigger
language plpgsql
as $$
begin
  insert into public.finance_packet_document_slots (
    packet_id, doc_code, doc_name, doc_category, is_required, status
  )
  values
    (new.id, 'D01', '出口退税申报表', 'tax', true, 'awaiting_generation'),
    (new.id, 'D02', '购销合同/发票/付款凭证', 'trade', true, 'pending'),
    (new.id, 'D03', '国内运输单据及运费凭证', 'logistics', false, 'pending'),
    (new.id, 'D04', '国内运费免责说明', 'logistics', false, 'awaiting_generation'),
    (new.id, 'D05', '报关单/装箱单/提运单', 'customs', true, 'pending'),
    (new.id, 'D06', '委托报关合同及费用凭证', 'customs', false, 'pending'),
    (new.id, 'D07', '采购发票及付款凭证', 'trade', true, 'pending'),
    (new.id, 'D08', '报关费用免责说明', 'customs', false, 'awaiting_generation'),
    (new.id, 'D09', '国际运费发票及付款凭证', 'logistics', false, 'pending'),
    (new.id, 'D10', '国际运费免责说明', 'logistics', false, 'awaiting_generation'),
    (new.id, 'D11', '收汇水单', 'finance', true, 'awaiting_upload'),
    (new.id, 'D12', '结汇水单', 'finance', true, 'awaiting_upload'),
    (new.id, 'D13', '出口退（免）税收汇凭证情况表', 'tax', true, 'awaiting_generation');

  return new;
end;
$$;

drop trigger if exists trg_seed_finance_packet_document_slots on public.finance_compliance_packets;
create trigger trg_seed_finance_packet_document_slots
after insert on public.finance_compliance_packets
for each row execute function public.seed_finance_packet_document_slots();

alter table public.export_requirement_checks enable row level security;
alter table public.finance_compliance_packets enable row level security;
alter table public.finance_packet_document_slots enable row level security;
alter table public.finance_packet_files enable row level security;

do $$
declare
  pair record;
begin
  for pair in
    select *
    from (values
      ('auth_all_export_requirement_checks',     'export_requirement_checks'),
      ('auth_all_finance_compliance_packets',    'finance_compliance_packets'),
      ('auth_all_finance_packet_document_slots', 'finance_packet_document_slots'),
      ('auth_all_finance_packet_files',          'finance_packet_files')
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
    'export_requirement_checks',
    'finance_compliance_packets',
    'finance_packet_document_slots',
    'finance_packet_files'
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
