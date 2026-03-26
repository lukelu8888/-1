-- Customer enterprise contacts and accounts center
-- Formalize the customer-side enterprise member model so one customer enterprise
-- can manage multiple contacts, login accounts, and business roles.

create table if not exists public.customer_enterprise_members (
  id text primary key default gen_random_uuid()::text,
  enterprise_auth_user_id text not null,
  linked_auth_user_id text null,
  name text not null default '',
  title text not null default '',
  business_email text not null default '',
  login_email text not null default '',
  role text not null default 'Purchaser',
  status text not null default 'invited',
  can_login boolean not null default true,
  last_login_at text not null default '',
  permissions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint customer_enterprise_members_role_check check (
    role in ('Owner', 'Purchaser', 'Finance', 'Viewer')
  ),
  constraint customer_enterprise_members_status_check check (
    status in ('active', 'invited', 'suspended')
  ),
  constraint customer_enterprise_members_enterprise_login_email_key unique (enterprise_auth_user_id, login_email)
);

comment on table public.customer_enterprise_members is
  'Customer-side enterprise contacts and login accounts persisted in Supabase.';

create or replace function public.set_customer_enterprise_members_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_customer_enterprise_members_updated_at on public.customer_enterprise_members;
create trigger trg_customer_enterprise_members_updated_at
before update on public.customer_enterprise_members
for each row
execute function public.set_customer_enterprise_members_updated_at();

create index if not exists idx_customer_enterprise_members_enterprise_auth_user_id
  on public.customer_enterprise_members(enterprise_auth_user_id);

create index if not exists idx_customer_enterprise_members_login_email
  on public.customer_enterprise_members(login_email);
