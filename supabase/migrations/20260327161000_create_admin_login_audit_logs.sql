-- Migration 20260327161000: Admin login audit trail
-- Record every admin-portal login attempt so operations can answer
-- "who logged in and when" without relying on browser cache.

create table if not exists public.admin_login_audit_logs (
  id uuid primary key default gen_random_uuid(),
  attempted_at timestamptz not null default timezone('utc', now()),
  entered_identifier text not null default '',
  login_email text not null default '',
  normalized_login_email text not null default '',
  auth_user_id uuid null references auth.users(id) on delete set null,
  admin_name text not null default '',
  portal_role text not null default '',
  rbac_role text not null default '',
  region text not null default '',
  status text not null default 'success' check (status in ('success', 'failure')),
  failure_reason text not null default '',
  user_agent text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_admin_login_audit_logs_attempted_at
  on public.admin_login_audit_logs (attempted_at desc);

create index if not exists idx_admin_login_audit_logs_login_email
  on public.admin_login_audit_logs (normalized_login_email, attempted_at desc);

alter table public.admin_login_audit_logs enable row level security;

drop policy if exists "service role full access admin login audits" on public.admin_login_audit_logs;
create policy "service role full access admin login audits"
on public.admin_login_audit_logs
for all
to service_role
using (true)
with check (true);

drop policy if exists "admin can read login audits" on public.admin_login_audit_logs;
create policy "admin can read login audits"
on public.admin_login_audit_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.user_profiles p
    where p.id = auth.uid()
      and coalesce(p.portal_role, '') in ('admin', 'staff')
  )
);

drop policy if exists "admin can insert login audits" on public.admin_login_audit_logs;
create policy "admin can insert login audits"
on public.admin_login_audit_logs
for insert
to authenticated
with check (
  exists (
    select 1
    from public.user_profiles p
    where p.id = auth.uid()
      and coalesce(p.portal_role, '') in ('admin', 'staff')
  )
);

comment on table public.admin_login_audit_logs is
  'Admin portal login audit trail for successful and failed login attempts.';
