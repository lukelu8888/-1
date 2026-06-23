-- Allow the frontend Supabase client to manage document template drafts/publication.
-- Business-role checks are handled in the application; this grants the table privileges
-- required by PostgREST for the anon/authenticated API roles.

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete
on table
  public.document_templates,
  public.document_template_versions,
  public.document_template_bindings,
  public.document_template_publish_logs,
  public.document_render_jobs
to anon, authenticated, service_role;
