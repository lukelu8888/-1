-- ============================================================
-- Market Category Research (MCR) — Database Schema
-- Apply via: Supabase SQL Editor or supabase db push
-- ============================================================

-- ─── 1. Research Runs ─────────────────────────────────────────────────────────

create table if not exists public.mcr_runs (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  source_category     text not null,
  region              text not null default 'North America',
  country             text not null default 'US',
  audience            text not null default 'both'
                        check (audience in ('b2b','b2c','both')),
  requested_level     text not null default 'L2'
                        check (requested_level in ('L1','L2','L3','L4')),
  time_windows        text[] not null default '{}',
  data_sources        text[] not null default '{}',
  benchmark_retailers text[] not null default '{}',
  notes               text,
  status              text not null default 'draft'
                        check (status in ('draft','running','completed','failed')),
  candidate_count     integer not null default 0,
  pending_review_count integer not null default 0,
  created_by          text,         -- admin email
  completed_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_mcr_runs_status    on public.mcr_runs (status);
create index if not exists idx_mcr_runs_country   on public.mcr_runs (country);
create index if not exists idx_mcr_runs_created   on public.mcr_runs (created_at desc);

-- ─── 2. Candidate Categories ──────────────────────────────────────────────────

create table if not exists public.mcr_candidates (
  id                  uuid primary key default gen_random_uuid(),
  run_id              uuid references public.mcr_runs(id) on delete cascade,
  name_zh             text,
  name_en             text not null,
  suggested_level     text not null default 'L2'
                        check (suggested_level in ('L1','L2','L3','L4')),
  region              text not null default 'North America',
  country             text not null default 'US',
  audience            text not null default 'both',
  -- Scores (0-100)
  score_confidence    smallint not null default 0 check (score_confidence between 0 and 100),
  score_trend         smallint not null default 0 check (score_trend between 0 and 100),
  score_demand        smallint not null default 0 check (score_demand between 0 and 100),
  score_competition   smallint not null default 0 check (score_competition between 0 and 100),
  score_market_fit    smallint not null default 0 check (score_market_fit between 0 and 100),
  score_seasonality   smallint not null default 0 check (score_seasonality between 0 and 100),
  -- Classification
  risk_level          text not null default 'medium'
                        check (risk_level in ('low','medium','high')),
  status              text not null default 'candidate'
                        check (status in ('candidate','needs_review','approved','rejected','watchlist','published')),
  opportunity_types   text[] not null default '{}',
  -- Trend data (stored as JSONB for time-window data points)
  trend_windows       jsonb not null default '[]',
  -- Review
  review_notes        text,
  reviewed_by         text,
  reviewed_at         timestamptz,
  -- Publish
  published_category_id text,
  published_at        timestamptz,
  evidence_count      integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_mcr_candidates_run    on public.mcr_candidates (run_id);
create index if not exists idx_mcr_candidates_status on public.mcr_candidates (status);
create index if not exists idx_mcr_candidates_conf   on public.mcr_candidates (score_confidence desc);

-- ─── 3. Evidence ──────────────────────────────────────────────────────────────

create table if not exists public.mcr_evidence (
  id                  uuid primary key default gen_random_uuid(),
  candidate_id        uuid references public.mcr_candidates(id) on delete cascade,
  source              text not null
                        check (source in ('google_trends','merchant_center','amazon_oe',
                                          'retailer_scan','google_shopping','manual')),
  source_label        text not null,
  title               text not null,
  summary             text,
  evidence_status     text not null default 'single_source'
                        check (evidence_status in ('market_verified','cross_verified',
                                                   'single_source','fallback','manual')),
  metrics             jsonb,        -- arbitrary k/v metrics
  url                 text,
  raw_payload_hash    text not null default 'sha256:pending',
  fetched_at          timestamptz not null default now(),
  created_at          timestamptz not null default now()
);

create index if not exists idx_mcr_evidence_candidate on public.mcr_evidence (candidate_id);
create index if not exists idx_mcr_evidence_source    on public.mcr_evidence (source);
create index if not exists idx_mcr_evidence_status    on public.mcr_evidence (evidence_status);

-- ─── 4. Retailer Scans ────────────────────────────────────────────────────────

create table if not exists public.mcr_retailer_scans (
  id                  uuid primary key default gen_random_uuid(),
  candidate_id        uuid references public.mcr_candidates(id) on delete cascade,
  retailer            text not null,
  category_path       text not null,
  product_count       integer not null default 0,
  bestseller_rank     integer,
  avg_rating          numeric(3,1),
  review_count        integer,
  price_min           numeric(10,2),
  price_max           numeric(10,2),
  price_currency      text not null default 'USD',
  promotion_signal    boolean not null default false,
  seasonal_signal     boolean not null default false,
  source_url          text,
  confidence          smallint not null default 0 check (confidence between 0 and 100),
  fetched_at          timestamptz not null default now(),
  created_at          timestamptz not null default now()
);

create index if not exists idx_mcr_scans_candidate on public.mcr_retailer_scans (candidate_id);
create index if not exists idx_mcr_scans_retailer  on public.mcr_retailer_scans (retailer);

-- ─── 5. Publish Logs ──────────────────────────────────────────────────────────

create table if not exists public.mcr_publish_logs (
  id                    uuid primary key default gen_random_uuid(),
  candidate_id          uuid references public.mcr_candidates(id),
  candidate_name        text not null,
  published_at          timestamptz not null default now(),
  published_by          text not null,
  target_category_id    text not null,
  target_path           text not null,
  seo_title             text,
  parent_category_id    text,
  created_at            timestamptz not null default now()
);

create index if not exists idx_mcr_publish_candidate on public.mcr_publish_logs (candidate_id);

-- ─── Hot Products (attached to candidates) ────────────────────────────────────

create table if not exists public.mcr_hot_products (
  id              uuid primary key default gen_random_uuid(),
  candidate_id    uuid references public.mcr_candidates(id) on delete cascade,
  name            text not null,
  retailer        text not null,
  price           numeric(10,2),
  currency        text not null default 'USD',
  rank            integer,
  rating          numeric(3,1),
  review_count    integer,
  image_url       text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_mcr_hotproducts_candidate on public.mcr_hot_products (candidate_id);

-- ─── Updated_at triggers ──────────────────────────────────────────────────────

create or replace function public.mcr_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger mcr_runs_updated_at
  before update on public.mcr_runs
  for each row execute function public.mcr_set_updated_at();

create or replace trigger mcr_candidates_updated_at
  before update on public.mcr_candidates
  for each row execute function public.mcr_set_updated_at();

-- ─── evidence_count sync trigger ─────────────────────────────────────────────

create or replace function public.mcr_sync_evidence_count()
returns trigger language plpgsql as $$
begin
  update public.mcr_candidates
  set evidence_count = (
    select count(*) from public.mcr_evidence
    where candidate_id = coalesce(new.candidate_id, old.candidate_id)
  )
  where id = coalesce(new.candidate_id, old.candidate_id);
  return coalesce(new, old);
end;
$$;

create or replace trigger mcr_evidence_count_insert
  after insert on public.mcr_evidence
  for each row execute function public.mcr_sync_evidence_count();

create or replace trigger mcr_evidence_count_delete
  after delete on public.mcr_evidence
  for each row execute function public.mcr_sync_evidence_count();

-- ─── candidate_count / pending_review_count sync ─────────────────────────────

create or replace function public.mcr_sync_run_counts()
returns trigger language plpgsql as $$
declare
  v_run_id uuid := coalesce(new.run_id, old.run_id);
begin
  update public.mcr_runs
  set
    candidate_count      = (select count(*) from public.mcr_candidates where run_id = v_run_id),
    pending_review_count = (select count(*) from public.mcr_candidates where run_id = v_run_id and status = 'needs_review')
  where id = v_run_id;
  return coalesce(new, old);
end;
$$;

create or replace trigger mcr_run_counts_ins
  after insert on public.mcr_candidates
  for each row execute function public.mcr_sync_run_counts();

create or replace trigger mcr_run_counts_upd
  after update of status on public.mcr_candidates
  for each row execute function public.mcr_sync_run_counts();

create or replace trigger mcr_run_counts_del
  after delete on public.mcr_candidates
  for each row execute function public.mcr_sync_run_counts();

-- ─── RLS (Row Level Security) ─────────────────────────────────────────────────
-- Admin users (portal_role = 'admin') have full access.
-- Adjust to your actual auth.users metadata shape as needed.

alter table public.mcr_runs            enable row level security;
alter table public.mcr_candidates      enable row level security;
alter table public.mcr_evidence        enable row level security;
alter table public.mcr_retailer_scans  enable row level security;
alter table public.mcr_publish_logs    enable row level security;
alter table public.mcr_hot_products    enable row level security;

-- Allow admin users full CRUD; block all other roles.
-- Using a helper that reads the 'portal_role' claim from the JWT.
create or replace function public.mcr_is_admin()
returns boolean language sql stable as $$
  select coalesce(
    (auth.jwt() ->> 'portal_role') = 'admin'
    or (auth.jwt() -> 'user_metadata' ->> 'portal_role') = 'admin'
    or (auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'admin',
    false
  );
$$;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'mcr_runs','mcr_candidates','mcr_evidence',
    'mcr_retailer_scans','mcr_publish_logs','mcr_hot_products'
  ] loop
    execute format(
      'create policy if not exists "admin_full_access" on public.%I
       for all to authenticated using (public.mcr_is_admin())
       with check (public.mcr_is_admin());', tbl
    );
  end loop;
end;
$$;
