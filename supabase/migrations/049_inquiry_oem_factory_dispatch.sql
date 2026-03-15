create table if not exists public.inquiry_oem_factory_dispatches (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  dispatch_status text not null default 'generated',
  owner_department text not null default 'Procurement Department',
  generated_at timestamptz not null default now(),
  released_at timestamptz null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (inquiry_id)
);

create index if not exists idx_inquiry_oem_factory_dispatches_inquiry_id
  on public.inquiry_oem_factory_dispatches (inquiry_id);

create index if not exists idx_inquiry_oem_factory_dispatches_status
  on public.inquiry_oem_factory_dispatches (dispatch_status);

create or replace function public.set_inquiry_oem_factory_dispatches_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_inquiry_oem_factory_dispatches_updated_at on public.inquiry_oem_factory_dispatches;

create trigger trg_inquiry_oem_factory_dispatches_updated_at
before update on public.inquiry_oem_factory_dispatches
for each row
execute function public.set_inquiry_oem_factory_dispatches_updated_at();
