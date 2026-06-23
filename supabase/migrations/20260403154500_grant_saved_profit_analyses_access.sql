grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete
on table public.saved_profit_analyses
to authenticated, service_role;
