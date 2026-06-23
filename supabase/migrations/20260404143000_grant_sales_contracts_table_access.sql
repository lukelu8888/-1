grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete
on table public.sales_contracts
to authenticated, service_role;
