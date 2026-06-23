-- Migration 20260328101500: Admin account password change audit trail
-- Record only operator-triggered password actions so operations can
-- distinguish manual resets/overrides from unintended system drift.

create table if not exists public.admin_account_password_audit_logs (
  id uuid primary key default gen_random_uuid(),
  changed_at timestamptz not null default timezone('utc', now()),
  action text not null check (action in ('manual_set', 'reset')),
  account_id text null,
  employee_id text null,
  employee_no text null,
  employee_name text not null default '',
  username text not null default '',
  login_email text not null default '',
  actor_name text not null default '',
  actor_email text not null default '',
  force_password_reset boolean not null default false,
  reason text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_admin_account_password_audit_logs_changed_at
  on public.admin_account_password_audit_logs (changed_at desc);

create index if not exists idx_admin_account_password_audit_logs_login_email
  on public.admin_account_password_audit_logs (login_email, changed_at desc);

alter table public.admin_account_password_audit_logs enable row level security;

drop policy if exists "service role full access admin account password audits" on public.admin_account_password_audit_logs;
create policy "service role full access admin account password audits"
on public.admin_account_password_audit_logs
for all
to service_role
using (true)
with check (true);

drop policy if exists "admin can read account password audits" on public.admin_account_password_audit_logs;
create policy "admin can read account password audits"
on public.admin_account_password_audit_logs
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

drop policy if exists "admin can insert account password audits" on public.admin_account_password_audit_logs;
create policy "admin can insert account password audits"
on public.admin_account_password_audit_logs
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

comment on table public.admin_account_password_audit_logs is
  'Audit trail for operator-triggered admin account password resets and manual password assignments.';
