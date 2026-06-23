-- Allow anon role to write PIM tables.
-- The admin portal uses the Supabase anon key (no Supabase Auth JWT)
-- for all requests, so write grants must include anon.
-- RLS policies are updated to match.

grant insert, update, delete on public.category_attribute_templates to anon;
grant insert, update, delete on public.category_attributes          to anon;
grant insert, update, delete on public.product_attribute_values     to anon;
grant insert, update, delete on public.product_variants             to anon;
grant insert, update, delete on public.product_assets               to anon;
grant insert, update, delete on public.product_search_index         to anon;

do $$
begin
  -- Drop old authenticated-only write policies and replace with unrestricted ones

  if exists (select 1 from pg_policies where schemaname='public' and tablename='category_attribute_templates' and policyname='category_attribute_templates_write_authenticated') then
    drop policy category_attribute_templates_write_authenticated on public.category_attribute_templates;
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='category_attribute_templates' and policyname='category_attribute_templates_write_all') then
    create policy category_attribute_templates_write_all on public.category_attribute_templates for all using (true) with check (true);
  end if;

  if exists (select 1 from pg_policies where schemaname='public' and tablename='category_attributes' and policyname='category_attributes_write_authenticated') then
    drop policy category_attributes_write_authenticated on public.category_attributes;
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='category_attributes' and policyname='category_attributes_write_all') then
    create policy category_attributes_write_all on public.category_attributes for all using (true) with check (true);
  end if;

  if exists (select 1 from pg_policies where schemaname='public' and tablename='product_attribute_values' and policyname='product_attribute_values_write_authenticated') then
    drop policy product_attribute_values_write_authenticated on public.product_attribute_values;
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='product_attribute_values' and policyname='product_attribute_values_write_all') then
    create policy product_attribute_values_write_all on public.product_attribute_values for all using (true) with check (true);
  end if;

  if exists (select 1 from pg_policies where schemaname='public' and tablename='product_variants' and policyname='product_variants_write_authenticated') then
    drop policy product_variants_write_authenticated on public.product_variants;
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='product_variants' and policyname='product_variants_write_all') then
    create policy product_variants_write_all on public.product_variants for all using (true) with check (true);
  end if;

  if exists (select 1 from pg_policies where schemaname='public' and tablename='product_assets' and policyname='product_assets_write_authenticated') then
    drop policy product_assets_write_authenticated on public.product_assets;
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='product_assets' and policyname='product_assets_write_all') then
    create policy product_assets_write_all on public.product_assets for all using (true) with check (true);
  end if;

  if exists (select 1 from pg_policies where schemaname='public' and tablename='product_search_index' and policyname='product_search_index_write_authenticated') then
    drop policy product_search_index_write_authenticated on public.product_search_index;
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='product_search_index' and policyname='product_search_index_write_all') then
    create policy product_search_index_write_all on public.product_search_index for all using (true) with check (true);
  end if;
end $$;
