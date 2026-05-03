-- ============================================================================
-- Product Management Center — Phase 5a
-- Storage bucket `product-media` + RLS policies for product images / videos.
-- ============================================================================
-- Goals
--   * Vendor-portal-grade media handling: real file upload (not placeholder URL),
--     served from a public CDN-fronted bucket so the storefront can render it
--     without signed URLs.
--   * Tenant-aware path layout so admins from one tenant cannot list / mutate
--     another tenant's files: <tenant_id>/<product_id>/<media_kind>/<file>.
--   * Read-public so storefront pages and emails can use the URL directly.
--   * Mutate (insert/update/delete) gated to authenticated users — RLS on the
--     `pc_product_media` row layer + tenant-aware path enforcement here.
--
-- Symmetric with how Phase 5+ Excel ZIP-of-images uploads will work: each row
-- in the Excel template references an image filename, and `pc_bulk_upsert_*`
-- (future) will resolve the URL via the same `product-media` bucket.
-- ----------------------------------------------------------------------------

-- 1. Create the bucket if missing. `public = true` lets us return CDN URLs
--    directly without signed-URL bookkeeping. Mutations are RLS-gated below.
insert into storage.buckets (id, name, public)
values ('product-media', 'product-media', true)
on conflict (id) do update set public = excluded.public;

-- 2. Drop any prior policies for this bucket so we can re-create them
--    idempotently. We name policies `pc_media_*` so the matcher is precise.
do $$
declare pol record;
begin
  for pol in
    select policyname
      from pg_policies
     where schemaname = 'storage'
       and tablename = 'objects'
       and policyname like 'pc_media_%'
  loop
    execute format('drop policy if exists %I on storage.objects', pol.policyname);
  end loop;
end $$;

-- 3. Public read — anyone (anon + authenticated) can fetch a URL once they
--    know it. The path is opaque enough that "guessability" is not a real
--    risk, and it keeps the storefront simple.
create policy pc_media_select on storage.objects
  for select
  using (bucket_id = 'product-media');

-- 4. Authenticated-only writes. We additionally enforce that the FIRST path
--    segment is the caller's tenant_id, so a JWT scoped to tenant A cannot
--    write into tenant B's prefix. The DB-side `pc_current_tenant_id()`
--    helper (created in 20260503020000_product_center_rls_and_rpcs.sql)
--    inspects JWT claims and falls back to `tenant_default` for legacy
--    single-tenant data, so single-tenant deployments keep working.
create policy pc_media_insert on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'product-media'
    and split_part(name, '/', 1) = public.pc_current_tenant_id()
  );

create policy pc_media_update on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'product-media'
    and split_part(name, '/', 1) = public.pc_current_tenant_id()
  )
  with check (
    bucket_id = 'product-media'
    and split_part(name, '/', 1) = public.pc_current_tenant_id()
  );

create policy pc_media_delete on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'product-media'
    and split_part(name, '/', 1) = public.pc_current_tenant_id()
  );

-- 5. Helper that returns the canonical storage path for a media object so
--    the service layer doesn't have to encode the convention in client code.
--    Path: <tenant>/<product_id>/<kind>/<sanitized_basename>
--    The basename is prefixed with a short timestamp suffix to disambiguate
--    repeated uploads of the same filename.
create or replace function public.pc_build_media_path(
  p_product_id uuid,
  p_kind       text,
  p_filename   text
) returns text
language plpgsql
stable
as $$
declare
  v_safe text;
begin
  v_safe := regexp_replace(coalesce(p_filename, 'upload'), '[^a-zA-Z0-9._-]+', '_', 'g');
  return format(
    '%s/%s/%s/%s_%s',
    public.pc_current_tenant_id(),
    p_product_id::text,
    p_kind,
    to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS'),
    v_safe
  );
end;
$$;

comment on function public.pc_build_media_path(uuid, text, text) is
  'Phase 5a: deterministic, tenant-prefixed storage path for product-media uploads.';
