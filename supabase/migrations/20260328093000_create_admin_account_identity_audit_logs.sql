-- Migration 20260328093000: Admin account identity change audit trail
-- Record controlled changes to internal login usernames/emails so
-- operations can review who changed identity-bearing credentials.

create table if not exists public.admin_account_identity_audit_logs (
  id uuid primary key default gen_random_uuid(),
  changed_at timestamptz not null default timezone('utc', now()),
  account_id text null,
  employee_id text null,
  employee_no text null,
  employee_name text not null default '',
  actor_name text not null default '',
  actor_email text not null default '',
  previous_username text null,
  next_username text null,
  previous_login_email text null,
  next_login_email text not null default '',
  reason text not null default '',
  auth_sync_required boolean not null default true,
  password_reset_required boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_admin_account_identity_audit_logs_changed_at
  on public.admin_account_identity_audit_logs (changed_at desc);

create index if not exists idx_admin_account_identity_audit_logs_next_login_email
  on public.admin_account_identity_audit_logs (next_login_email, changed_at desc);

alter table public.admin_account_identity_audit_logs enable row level security;

drop policy if exists "service role full access admin account identity audits" on public.admin_account_identity_audit_logs;
create policy "service role full access admin account identity audits"
on public.admin_account_identity_audit_logs
for all
to service_role
using (true)
with check (true);

drop policy if exists "admin can read account identity audits" on public.admin_account_identity_audit_logs;
create policy "admin can read account identity audits"
on public.admin_account_identity_audit_logs
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

drop policy if exists "admin can insert account identity audits" on public.admin_account_identity_audit_logs;
create policy "admin can insert account identity audits"
on public.admin_account_identity_audit_logs
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

comment on table public.admin_account_identity_audit_logs is
  'Audit trail for controlled internal account username/email changes.';
