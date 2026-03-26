-- Migration 068: Enterprise master data center
-- Persist company master data in Supabase so admin-side profile editing is
-- cloud-first instead of localStorage-only.

create table if not exists public.admin_organizations (
  id text primary key default 'admin-org-001',
  name_cn text not null default '',
  name_en text not null default '',
  description_cn text not null default '',
  description_en text not null default '',
  phone text not null default '',
  email text not null default '',
  contact_person text not null default '',
  website text not null default '',
  address_cn text not null default '',
  address_en text not null default '',
  tax_id text not null default '',
  default_currency text not null default 'CNY',
  timezone text not null default 'Asia/Shanghai',
  logo_url text null,
  rmb_bank jsonb not null default '{}'::jsonb,
  usd_bank jsonb not null default '{}'::jsonb,
  private_bank jsonb not null default '{}'::jsonb,
  internal_contacts jsonb not null default '[]'::jsonb,
  internal_accounts jsonb not null default '[]'::jsonb,
  document_defaults jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.admin_organizations is
  'Enterprise master data center: company profile, bank accounts, internal contacts, internal accounts, and document defaults.';

create or replace function public.set_admin_organizations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_admin_organizations_updated_at on public.admin_organizations;

create trigger trg_admin_organizations_updated_at
before update on public.admin_organizations
for each row
execute function public.set_admin_organizations_updated_at();
