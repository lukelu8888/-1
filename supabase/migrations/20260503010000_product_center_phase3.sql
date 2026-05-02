-- ─────────────────────────────────────────────────────────────────────────
-- Product Center · Phase 3
-- Adds:
--   1. pc_product_price_history.effective_from / effective_to  (scheduled prices)
--   2. pc_supplier_quotes                                     (per-supplier quote history)
--   3. pc_review_history                                      (full review state machine timeline)
--
-- Naming follows the same conventions as 20260503000000_product_center.sql:
--   pc_*    prefix, snake_case, RLS reserved, soft-delete via archived_at
--   trigger pc_set_updated_at() handles the updated_at column.
-- ─────────────────────────────────────────────────────────────────────────

-- 1) extend pc_product_price_history with effective windows -------------------

alter table if exists public.pc_product_price_history
  add column if not exists effective_from timestamptz,
  add column if not exists effective_to   timestamptz;

create index if not exists idx_pc_price_hist_effective
  on public.pc_product_price_history(product_id, region_code, effective_from);

comment on column public.pc_product_price_history.effective_from is
  'Optional UTC timestamp from when the new value should be applied. Null = immediate.';
comment on column public.pc_product_price_history.effective_to is
  'Optional expiry of this price version. Null = supersede on next change.';

-- 2) supplier quotes ----------------------------------------------------------
--
-- A separate table from pc_product_suppliers because we want full historic
-- traceability of every quote received from each supplier. The "current" flag
-- is mutually exclusive within (product_id, supplier_id).

do $$ begin
  create type pc_incoterm as enum ('EXW', 'FOB', 'CIF', 'DDP');
exception when duplicate_object then null; end $$;

create table if not exists public.pc_supplier_quotes (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          text not null,
  product_id         uuid not null references public.pc_products(id) on delete cascade,
  supplier_id        text not null,
  supplier_name      text not null,
  supplier_model_no  text,
  quoted_price       numeric(14, 4) not null,
  currency           text not null,
  moq                integer not null check (moq >= 1),
  valid_from         timestamptz,
  valid_until        timestamptz,
  incoterm           pc_incoterm,
  port               text,
  notes              text,
  is_current         boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  created_by         text,
  archived_at        timestamptz
);

create index if not exists idx_pc_supplier_quotes_product
  on public.pc_supplier_quotes(product_id);
create index if not exists idx_pc_supplier_quotes_supplier
  on public.pc_supplier_quotes(supplier_id);
create index if not exists idx_pc_supplier_quotes_tenant
  on public.pc_supplier_quotes(tenant_id);

-- Only one quote per (product, supplier) may be marked current.
create unique index if not exists ux_pc_supplier_quotes_current
  on public.pc_supplier_quotes(product_id, supplier_id)
  where is_current = true and archived_at is null;

drop trigger if exists trg_pc_supplier_quotes_updated on public.pc_supplier_quotes;
create trigger trg_pc_supplier_quotes_updated
  before update on public.pc_supplier_quotes
  for each row execute function pc_set_updated_at();

alter table public.pc_supplier_quotes enable row level security;

comment on table public.pc_supplier_quotes is
  'Per-supplier quote history. Drives the cost basis used in Pricing Center landed-cost calculations.';
comment on column public.pc_supplier_quotes.is_current is
  'True when this quote is the active one for (product, supplier). Enforced by partial unique index.';

-- 3) review history -----------------------------------------------------------
--
-- Append-only timeline of every review state transition for a product.
-- Lets us reconstruct any product's review history including who acted,
-- the exact reason and what fields were missing at submission.

create table if not exists public.pc_review_history (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       text not null,
  product_id      uuid not null references public.pc_products(id) on delete cascade,
  from_status     pc_review_status not null,
  to_status       pc_review_status not null,
  reason          text,
  actor_name      text,
  actor_role      text,
  -- snapshot of missingImage / missingPrice / missingCategory / missingSeo / missingSupplier
  missing_flags   text[] default '{}',
  occurred_at     timestamptz not null default now()
);

create index if not exists idx_pc_review_history_product
  on public.pc_review_history(product_id);
create index if not exists idx_pc_review_history_time
  on public.pc_review_history(occurred_at);
create index if not exists idx_pc_review_history_tenant
  on public.pc_review_history(tenant_id);

alter table public.pc_review_history enable row level security;

comment on table public.pc_review_history is
  'Append-only log of product review transitions; powers the Review Center timeline drawer and audit reports.';

-- 4) extend audit logs with field categorisation ------------------------------

alter table if exists public.pc_product_audit_logs
  add column if not exists category text;

comment on column public.pc_product_audit_logs.category is
  'Optional grouping for audit entries: pricing | publishing | review | metadata | media | mapping.';
