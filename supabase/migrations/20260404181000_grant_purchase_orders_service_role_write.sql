grant usage on schema public to service_role;

grant select, insert, update, delete
on table public.purchase_orders
to service_role;
