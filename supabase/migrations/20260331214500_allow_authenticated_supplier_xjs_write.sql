alter table public.supplier_xjs enable row level security;

drop policy if exists auth_all_supplier_xjs on public.supplier_xjs;

create policy auth_all_supplier_xjs
on public.supplier_xjs
for all
to authenticated
using (true)
with check (true);
