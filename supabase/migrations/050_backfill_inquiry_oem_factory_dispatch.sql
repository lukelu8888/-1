insert into public.inquiry_oem_factory_dispatches (
  inquiry_id,
  dispatch_status,
  owner_department,
  generated_at,
  released_at,
  payload
)
select
  i.id as inquiry_id,
  case
    when (i.document_render_meta -> 'oemFactoryFacingVersion' ->> 'releasedAt') is not null
      then 'released_to_factory'
    else 'generated'
  end as dispatch_status,
  coalesce(
    i.document_render_meta -> 'oemFactoryFacingVersion' -> 'payload' ->> 'ownerDepartment',
    'Procurement Department'
  ) as owner_department,
  coalesce(
    nullif(i.document_render_meta -> 'oemFactoryFacingVersion' ->> 'generatedAt', '')::timestamptz,
    i.updated_at,
    i.created_at,
    now()
  ) as generated_at,
  nullif(i.document_render_meta -> 'oemFactoryFacingVersion' ->> 'releasedAt', '')::timestamptz as released_at,
  coalesce(
    i.document_render_meta -> 'oemFactoryFacingVersion' -> 'payload',
    '{}'::jsonb
  ) as payload
from public.inquiries i
where i.document_render_meta ? 'oemFactoryFacingVersion'
  and coalesce(i.document_render_meta -> 'oemFactoryFacingVersion' -> 'payload', '{}'::jsonb) <> '{}'::jsonb
on conflict (inquiry_id) do update
set
  dispatch_status = excluded.dispatch_status,
  owner_department = excluded.owner_department,
  generated_at = excluded.generated_at,
  released_at = excluded.released_at,
  payload = excluded.payload,
  updated_at = now();
