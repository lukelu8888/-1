create table if not exists public.saved_profit_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  analysis_id text not null,
  quotation_id text null,
  quotation_number text null,
  analysis_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint saved_profit_analyses_user_analysis_unique unique (user_id, analysis_id)
);

create index if not exists idx_saved_profit_analyses_user_id
  on public.saved_profit_analyses (user_id);

create index if not exists idx_saved_profit_analyses_user_updated_at
  on public.saved_profit_analyses (user_id, updated_at desc);

alter table public.saved_profit_analyses enable row level security;

drop policy if exists "customer own saved profit analyses select" on public.saved_profit_analyses;
create policy "customer own saved profit analyses select"
on public.saved_profit_analyses
for select
to authenticated
using (lower(trim(user_id)) = lower(trim(coalesce(auth.jwt() ->> 'email', ''))));

drop policy if exists "customer own saved profit analyses insert" on public.saved_profit_analyses;
create policy "customer own saved profit analyses insert"
on public.saved_profit_analyses
for insert
to authenticated
with check (lower(trim(user_id)) = lower(trim(coalesce(auth.jwt() ->> 'email', ''))));

drop policy if exists "customer own saved profit analyses update" on public.saved_profit_analyses;
create policy "customer own saved profit analyses update"
on public.saved_profit_analyses
for update
to authenticated
using (lower(trim(user_id)) = lower(trim(coalesce(auth.jwt() ->> 'email', ''))))
with check (lower(trim(user_id)) = lower(trim(coalesce(auth.jwt() ->> 'email', ''))));

drop policy if exists "customer own saved profit analyses delete" on public.saved_profit_analyses;
create policy "customer own saved profit analyses delete"
on public.saved_profit_analyses
for delete
to authenticated
using (lower(trim(user_id)) = lower(trim(coalesce(auth.jwt() ->> 'email', ''))));
