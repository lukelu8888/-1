-- Persist the permission center configuration in Supabase so role/menu/action/scope
-- changes are no longer localStorage-only.

create table if not exists public.permission_center_state (
  id text primary key default 'default',
  roles jsonb not null default '[]'::jsonb,
  menu_matrix jsonb not null default '{}'::jsonb,
  action_matrix jsonb not null default '{}'::jsonb,
  scope_matrix jsonb not null default '{}'::jsonb,
  user_exceptions jsonb not null default '[]'::jsonb,
  change_logs jsonb not null default '[]'::jsonb,
  updated_by text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.permission_center_state is
  'Permission Center unified state snapshot: roles, menu matrix, action matrix, scope matrix, user exceptions, and change logs.';

create or replace function public.set_permission_center_state_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_permission_center_state_updated_at on public.permission_center_state;

create trigger trg_permission_center_state_updated_at
before update on public.permission_center_state
for each row
execute function public.set_permission_center_state_updated_at();

insert into public.permission_center_state (id)
values ('default')
on conflict (id) do nothing;

alter table public.permission_center_state enable row level security;

drop policy if exists auth_all_permission_center_state on public.permission_center_state;

create policy auth_all_permission_center_state
on public.permission_center_state
for all
to authenticated
using (true)
with check (true);
