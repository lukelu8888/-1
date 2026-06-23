-- Allow authenticated back-office users to publish website catalog products.
-- Public visitors keep read-only access through the existing SELECT policies.

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'product_main_categories'
      and policyname = 'product_main_categories_write_authenticated'
  ) then
    create policy product_main_categories_write_authenticated
      on public.product_main_categories
      for all
      to authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'product_sub_categories'
      and policyname = 'product_sub_categories_write_authenticated'
  ) then
    create policy product_sub_categories_write_authenticated
      on public.product_sub_categories
      for all
      to authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'product_categories'
      and policyname = 'product_categories_write_authenticated'
  ) then
    create policy product_categories_write_authenticated
      on public.product_categories
      for all
      to authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'products'
      and policyname = 'products_write_authenticated'
  ) then
    create policy products_write_authenticated
      on public.products
      for all
      to authenticated
      using (true)
      with check (true);
  end if;
end $$;

grant select on public.product_main_categories to anon, authenticated;
grant select on public.product_sub_categories to anon, authenticated;
grant select on public.product_categories to anon, authenticated;
grant select on public.products to anon, authenticated;

grant insert, update, delete on public.product_main_categories to authenticated;
grant insert, update, delete on public.product_sub_categories to authenticated;
grant insert, update, delete on public.product_categories to authenticated;
grant insert, update, delete on public.products to authenticated;

comment on column public.products.specifications is
  'Website product specs JSON. Deals use keys such as Original Price, Discount, Deal Label, On Sale, and Unit.';
