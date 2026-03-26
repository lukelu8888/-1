create table if not exists public.customer_enterprise_invitations (
  id text primary key default gen_random_uuid()::text,
  enterprise_auth_user_id text not null,
  member_id text not null default '',
  login_email text not null default '',
  business_email text not null default '',
  role text not null default 'Purchaser',
  status text not null default 'pending',
  invite_token text not null unique,
  invited_by_email text not null default '',
  invite_url text not null default '',
  expires_at timestamptz null,
  last_sent_at timestamptz null,
  accepted_at timestamptz null,
  linked_auth_user_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_enterprise_invitations_role_check check (
    role in ('Owner', 'Purchaser', 'Finance', 'Viewer')
  ),
  constraint customer_enterprise_invitations_status_check check (
    status in ('pending', 'accepted', 'cancelled', 'expired')
  )
);

comment on table public.customer_enterprise_invitations is
  'Invitation records for customer enterprise member onboarding and activation.';

create or replace function public.set_customer_enterprise_invitations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_customer_enterprise_invitations_updated_at on public.customer_enterprise_invitations;
create trigger trg_customer_enterprise_invitations_updated_at
before update on public.customer_enterprise_invitations
for each row
execute function public.set_customer_enterprise_invitations_updated_at();

create index if not exists idx_customer_enterprise_invitations_enterprise_auth_user_id
  on public.customer_enterprise_invitations(enterprise_auth_user_id);

create index if not exists idx_customer_enterprise_invitations_login_email
  on public.customer_enterprise_invitations(login_email);

create index if not exists idx_customer_enterprise_invitations_invite_token
  on public.customer_enterprise_invitations(invite_token);
