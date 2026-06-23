-- Website promotion campaigns shown on public Home and Deals pages.

create table if not exists public.promotion_campaigns (
  id text primary key,
  region_code text not null,
  name text not null,
  type text not null default 'weekly'
    check (type in ('weekly', 'flash', 'seasonal', 'container', 'clearance', 'holiday')),
  start_date date not null,
  end_date date not null,
  headline text not null default '',
  description text not null default '',
  cta_text text not null default 'Shop Now',
  banner_color text not null default 'from-red-600 to-orange-500',
  product_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_promotion_campaigns_region_dates
  on public.promotion_campaigns(region_code, start_date, end_date);

alter table public.promotion_campaigns enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'promotion_campaigns'
      and policyname = 'Public read promotion_campaigns'
  ) then
    create policy "Public read promotion_campaigns"
      on public.promotion_campaigns
      for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'promotion_campaigns'
      and policyname = 'promotion_campaigns_write_authenticated'
  ) then
    create policy promotion_campaigns_write_authenticated
      on public.promotion_campaigns
      for all
      to authenticated
      using (true)
      with check (true);
  end if;
end $$;

create or replace function public.set_promotion_campaigns_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_promotion_campaigns_updated_at on public.promotion_campaigns;
create trigger trg_promotion_campaigns_updated_at
before update on public.promotion_campaigns
for each row
execute function public.set_promotion_campaigns_updated_at();
