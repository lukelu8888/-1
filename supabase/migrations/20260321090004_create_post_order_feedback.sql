-- ============================================================
-- Post-order feedback
-- 范围：客户线上产品反馈
-- ============================================================

create table if not exists public.post_order_feedback (
  id                       uuid primary key default gen_random_uuid(),
  feedback_no              text not null unique,
  sales_contract_id        uuid,
  purchase_order_id        uuid references public.purchase_orders(id) on delete set null,
  shipment_no              text,
  voyage_id                uuid references public.voyage_tracking(id) on delete set null,
  delivery_confirmation_id uuid references public.delivery_confirmations(id) on delete set null,
  customer_id              text,
  customer_name            text not null default '',
  feedback_channel         text not null default 'customer_portal',
  feedback_status          text not null default 'submitted',
  product_rating           integer,
  packaging_rating         integer,
  delivery_rating          integer,
  service_rating           integer,
  overall_rating           integer,
  quality_issue_flag       boolean not null default false,
  packaging_issue_flag     boolean not null default false,
  delivery_issue_flag      boolean not null default false,
  reorder_intent           text,
  recommend_intent         text,
  feedback_text            text,
  attachments              jsonb not null default '[]'::jsonb,
  submitted_at             timestamptz not null default now(),
  submitted_by             text,
  reviewed_by              text,
  reviewed_at              timestamptz,
  internal_summary         text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint chk_post_order_feedback_status check (
    feedback_status in ('submitted', 'reviewed', 'archived')
  ),
  constraint chk_post_order_feedback_channel check (
    feedback_channel in ('customer_portal', 'admin_entry', 'sales_entry')
  ),
  constraint chk_post_order_feedback_rating_product check (
    product_rating is null or product_rating between 1 and 5
  ),
  constraint chk_post_order_feedback_rating_packaging check (
    packaging_rating is null or packaging_rating between 1 and 5
  ),
  constraint chk_post_order_feedback_rating_delivery check (
    delivery_rating is null or delivery_rating between 1 and 5
  ),
  constraint chk_post_order_feedback_rating_service check (
    service_rating is null or service_rating between 1 and 5
  ),
  constraint chk_post_order_feedback_rating_overall check (
    overall_rating is null or overall_rating between 1 and 5
  )
);

create index if not exists idx_post_order_feedback_po_id
  on public.post_order_feedback (purchase_order_id);

create index if not exists idx_post_order_feedback_voyage_id
  on public.post_order_feedback (voyage_id);

create index if not exists idx_post_order_feedback_delivery_confirmation_id
  on public.post_order_feedback (delivery_confirmation_id);

drop trigger if exists trg_post_order_feedback_updated_at on public.post_order_feedback;
create trigger trg_post_order_feedback_updated_at
before update on public.post_order_feedback
for each row execute function public.set_updated_at();

alter table public.post_order_feedback enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'post_order_feedback'
      and policyname = 'auth_all_post_order_feedback'
  ) then
    create policy auth_all_post_order_feedback on public.post_order_feedback
      for all to authenticated using (true) with check (true);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'post_order_feedback'
  ) then
    alter publication supabase_realtime add table public.post_order_feedback;
  end if;
end;
$$;
