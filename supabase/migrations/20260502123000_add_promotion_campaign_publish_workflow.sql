-- Add an explicit draft/published workflow for website promotion campaigns.

alter table public.promotion_campaigns
  add column if not exists status text not null default 'published'
    check (status in ('draft', 'published')),
  add column if not exists published_at timestamptz;

update public.promotion_campaigns
set published_at = coalesce(published_at, updated_at, created_at, now())
where status = 'published'
  and published_at is null;

create index if not exists idx_promotion_campaigns_publication
  on public.promotion_campaigns(region_code, status, start_date, end_date);

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'promotion_campaigns'
      and policyname = 'promotion_campaigns_write_public_admin'
  ) then
    create policy promotion_campaigns_write_public_admin
      on public.promotion_campaigns
      for all
      to anon, authenticated
      using (true)
      with check (true);
  end if;
end $$;
