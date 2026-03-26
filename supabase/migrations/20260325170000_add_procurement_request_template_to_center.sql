alter table if exists public.document_templates
  add column if not exists display_order integer;

insert into public.document_templates (
  template_code,
  document_code,
  template_name_cn,
  template_name_en,
  business_stage,
  renderer_type,
  status,
  description,
  display_order,
  is_active,
  updated_at
) values (
  'tpl_pr',
  'PR',
  'PR',
  'PR',
  'procurement-request',
  'legacy-react',
  'published',
  '采购员基于销售合同做供应商拆分与采购分配',
  8,
  true,
  now()
)
on conflict (template_code) do update set
  document_code = excluded.document_code,
  template_name_cn = excluded.template_name_cn,
  template_name_en = excluded.template_name_en,
  business_stage = excluded.business_stage,
  renderer_type = excluded.renderer_type,
  status = excluded.status,
  description = excluded.description,
  display_order = excluded.display_order,
  is_active = excluded.is_active,
  updated_at = now();

update public.document_templates
set
  display_order = case template_code
    when 'tpl_sc' then 7
    when 'tpl_pr' then 8
    when 'tpl_cg' then 9
    when 'tpl_ci' then 10
    when 'tpl_pl' then 11
    when 'tpl_soa' then 12
    else display_order
  end,
  updated_at = now()
where template_code in ('tpl_sc', 'tpl_pr', 'tpl_cg', 'tpl_ci', 'tpl_pl', 'tpl_soa');
