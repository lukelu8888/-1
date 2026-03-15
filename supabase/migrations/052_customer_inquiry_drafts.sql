-- ============================================================
-- Migration 052: Customer-side new inquiry drafts
-- Persist "Your Items -> Added Items" in Supabase so customer-side
-- inquiry drafting is cloud-first instead of localStorage-first.
-- ============================================================

create table if not exists public.customer_inquiry_drafts (
  id uuid primary key default gen_random_uuid(),
  draft_type text not null default 'new_inquiry',
  customer_email text not null,
  customer_user_id uuid null,
  company_id text null,
  region_code text null,
  products_json jsonb not null default '[]'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists uq_customer_inquiry_drafts_email_type
  on public.customer_inquiry_drafts (customer_email, draft_type);

create index if not exists idx_customer_inquiry_drafts_updated_at
  on public.customer_inquiry_drafts (updated_at desc);

comment on table public.customer_inquiry_drafts is
  'Cloud draft storage for customer-side inquiry composition, including Your Items / Added Items.';

comment on column public.customer_inquiry_drafts.products_json is
  'Serialized selectedProducts array for the customer-side new inquiry dialog.';

create or replace function public.set_customer_inquiry_drafts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_customer_inquiry_drafts_updated_at on public.customer_inquiry_drafts;

create trigger trg_customer_inquiry_drafts_updated_at
before update on public.customer_inquiry_drafts
for each row
execute function public.set_customer_inquiry_drafts_updated_at();
