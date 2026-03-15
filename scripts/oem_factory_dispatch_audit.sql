-- Mainline B OEM factory dispatch audit
-- Run in Supabase SQL Editor or any Postgres client connected to the project.

with inquiry_oem_base as (
  select
    i.id as inquiry_id,
    i.inquiry_number,
    i.date,
    coalesce(i.document_render_meta -> 'oemModule' -> 'internalProcessing' ->> 'factoryForwardingStatus', '') as legacy_factory_status,
    coalesce(i.document_render_meta -> 'oemModule' -> 'internalProcessing' ->> 'replacementVersionStatus', '') as legacy_replacement_status,
    coalesce(i.document_render_meta -> 'oemModule' -> 'internalProcessing' ->> 'anonymizationStatus', '') as legacy_anonymization_status
  from public.inquiries i
),
mapping_health as (
  select
    m.inquiry_id,
    count(pm.id) as mapping_count,
    count(*) filter (
      where pm.mapping_status = 'mapped'
        and coalesce(pm.internal_model_number, '') <> ''
        and pm.internal_model_number not ilike '%PENDING%'
        and coalesce(pm.internal_sku, '') <> ''
        and pm.internal_sku not ilike '%PENDING%'
    ) as mapped_count
  from public.inquiry_oem_modules m
  left join public.inquiry_oem_part_mappings pm
    on pm.inquiry_oem_module_id = m.id
  group by m.inquiry_id
)
select
  b.inquiry_number,
  b.date,
  m.enabled as oem_enabled,
  coalesce(d.dispatch_status, 'missing') as dispatch_status,
  b.legacy_factory_status,
  b.legacy_replacement_status,
  b.legacy_anonymization_status,
  coalesce(h.mapping_count, 0) as mapping_count,
  coalesce(h.mapped_count, 0) as mapped_count,
  case
    when m.enabled is true and d.id is null then 'missing_dispatch'
    when coalesce(b.legacy_factory_status, '') = 'released_to_factory' and d.released_at is null then 'released_without_dispatch_release_time'
    when coalesce(h.mapping_count, 0) = 0 then 'no_part_mapping'
    when coalesce(h.mapping_count, 0) <> coalesce(h.mapped_count, 0) then 'incomplete_part_mapping'
    when d.payload is null or d.payload = '{}'::jsonb then 'empty_dispatch_payload'
    else 'ok'
  end as audit_result
from inquiry_oem_base b
join public.inquiry_oem_modules m
  on m.inquiry_id = b.inquiry_id
left join public.inquiry_oem_factory_dispatches d
  on d.inquiry_id = b.inquiry_id
left join mapping_health h
  on h.inquiry_id = b.inquiry_id
where m.enabled is true
order by
  case
    when d.id is null then 0
    when coalesce(h.mapping_count, 0) <> coalesce(h.mapped_count, 0) then 1
    else 2
  end,
  b.date desc,
  b.inquiry_number desc;
