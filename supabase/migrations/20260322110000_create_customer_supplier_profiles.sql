-- Customer / Supplier profile persistence
-- Align customer-side and supplier-side profile storage with the admin-side
-- cloud-first model so profile changes are permanently stored in Supabase.

create table if not exists public.customer_organizations (
  id text primary key default gen_random_uuid()::text,
  auth_user_id text not null unique,
  company_name text not null default '',
  contact_person text not null default '',
  email text not null default '',
  phone text not null default '',
  mobile text not null default '',
  address text not null default '',
  website text not null default '',
  business_type text not null default 'Importer',
  logo_url text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint customer_organizations_business_type_check check (
    business_type in ('Retailer', 'Importer', 'Wholesaler', 'Distributor', 'E-commerce', 'Other')
  )
);

create table if not exists public.customer_portal_profiles (
  id text primary key default gen_random_uuid()::text,
  auth_user_id text not null unique,
  display_name text not null default '',
  login_email text not null default '',
  portal_role text not null default 'customer',
  avatar_url text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint customer_portal_profiles_portal_role_check check (
    portal_role in ('customer')
  )
);

create table if not exists public.supplier_organizations (
  id text primary key default gen_random_uuid()::text,
  auth_user_id text not null unique,
  name_cn text not null default '',
  name_en text not null default '',
  description text not null default '',
  phone text not null default '',
  address text not null default '',
  website text not null default '',
  contact_person text not null default '',
  logo_url text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.supplier_portal_profiles (
  id text primary key default gen_random_uuid()::text,
  auth_user_id text not null unique,
  display_name text not null default '',
  login_email text not null default '',
  portal_role text not null default 'supplier',
  role_label text not null default 'Supplier',
  avatar_url text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint supplier_portal_profiles_portal_role_check check (
    portal_role in ('supplier')
  )
);

comment on table public.customer_organizations is
  'Customer-side organization profile persisted in Supabase.';

comment on table public.customer_portal_profiles is
  'Customer-side portal account profile persisted in Supabase.';

comment on table public.supplier_organizations is
  'Supplier-side organization profile persisted in Supabase.';

comment on table public.supplier_portal_profiles is
  'Supplier-side portal account profile persisted in Supabase.';

create or replace function public.set_customer_supplier_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_customer_organizations_updated_at on public.customer_organizations;
create trigger trg_customer_organizations_updated_at
before update on public.customer_organizations
for each row
execute function public.set_customer_supplier_profiles_updated_at();

drop trigger if exists trg_customer_portal_profiles_updated_at on public.customer_portal_profiles;
create trigger trg_customer_portal_profiles_updated_at
before update on public.customer_portal_profiles
for each row
execute function public.set_customer_supplier_profiles_updated_at();

drop trigger if exists trg_supplier_organizations_updated_at on public.supplier_organizations;
create trigger trg_supplier_organizations_updated_at
before update on public.supplier_organizations
for each row
execute function public.set_customer_supplier_profiles_updated_at();

drop trigger if exists trg_supplier_portal_profiles_updated_at on public.supplier_portal_profiles;
create trigger trg_supplier_portal_profiles_updated_at
before update on public.supplier_portal_profiles
for each row
execute function public.set_customer_supplier_profiles_updated_at();

create index if not exists idx_customer_organizations_auth_user_id
  on public.customer_organizations(auth_user_id);

create index if not exists idx_customer_portal_profiles_auth_user_id
  on public.customer_portal_profiles(auth_user_id);

create index if not exists idx_supplier_organizations_auth_user_id
  on public.supplier_organizations(auth_user_id);

create index if not exists idx_supplier_portal_profiles_auth_user_id
  on public.supplier_portal_profiles(auth_user_id);
