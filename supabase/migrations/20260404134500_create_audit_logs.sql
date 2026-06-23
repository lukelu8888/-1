-- Migration 20260404134500: Global business audit logs
-- Provide a shared field-level audit ledger for ERP business objects so
-- operations can answer who changed what and when across sales + execution.

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null default '',
  entity_id uuid not null,
  actor_id uuid null references auth.users(id) on delete set null,
  actor_email text not null default '',
  actor_role text not null default '',
  action text not null default '' check (action in ('create', 'update', 'delete', 'approve', 'reject', 'forward', 'cancel')),
  changed_fields jsonb not null default '{}'::jsonb,
  source text not null default 'internal',
  occurred_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_audit_logs_entity
  on public.audit_logs (entity_type, entity_id, occurred_at desc);

create index if not exists idx_audit_logs_actor
  on public.audit_logs (actor_email, occurred_at desc);

alter table public.audit_logs enable row level security;

drop policy if exists "service role full access audit logs" on public.audit_logs;
create policy "service role full access audit logs"
on public.audit_logs
for all
to service_role
using (true)
with check (true);

drop policy if exists "admin can read audit logs" on public.audit_logs;
create policy "admin can read audit logs"
on public.audit_logs
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

drop policy if exists "admin can insert audit logs" on public.audit_logs;
create policy "admin can insert audit logs"
on public.audit_logs
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

comment on table public.audit_logs is
  'Global ERP audit trail for field-level and approval-related business changes.';
