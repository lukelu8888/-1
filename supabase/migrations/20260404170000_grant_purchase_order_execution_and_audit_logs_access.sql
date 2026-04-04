grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete
on table public.purchase_order_execution
to authenticated, service_role;

grant select, insert, update, delete
on table public.audit_logs
to authenticated, service_role;
