-- Add factory-facing product number to the internal product master.
-- Customer-facing website products continue to show display data, while inquiries
-- carry this value for factory/procurement matching.

alter table public.product_master
  add column if not exists factory_model_no text;

create index if not exists idx_product_master_factory_model_no
  on public.product_master (factory_model_no);

update public.product_master
set factory_model_no = internal_model_no
where factory_model_no is null
  and internal_model_no is not null;

comment on column public.product_master.factory_model_no is
  'Factory-facing product number used for supplier/factory inquiry, procurement, and production matching.';
