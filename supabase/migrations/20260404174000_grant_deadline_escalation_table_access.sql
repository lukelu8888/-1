grant usage on schema public to service_role;

grant select
on table public.inquiries
to service_role;

grant select
on table public.purchase_orders
to service_role;

grant select, insert
on table public.notifications
to service_role;
