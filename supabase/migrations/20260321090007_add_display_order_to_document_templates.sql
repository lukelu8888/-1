alter table if exists public.document_templates
  add column if not exists display_order integer;

