grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete
on table public.approval_records
to authenticated, service_role;
