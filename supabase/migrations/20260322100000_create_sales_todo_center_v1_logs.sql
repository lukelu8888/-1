-- 业务员待办中心 V1
-- 仅创建最小行为层：
-- 1. sales_follow_up_logs
-- 2. sales_customer_reply_logs
--
-- 说明：
-- - 不创建通用待办主表
-- - 不创建统一任务队列表
-- - 待办项继续从真实业务链实时聚合

create table if not exists sales_follow_up_logs (
  id uuid primary key default gen_random_uuid(),

  sales_user_id text,
  sales_user_email text not null,

  customer_id text,
  customer_name_snapshot text not null default '',
  customer_company_snapshot text not null default '',

  doc_type text not null check (
    doc_type in ('ING', 'QR', 'QT', 'SC', 'SHIPMENT', 'POST_DELIVERY')
  ),
  doc_id text not null,
  doc_no_snapshot text not null default '',

  related_ing_id text,
  related_qt_id text,
  related_sc_id text,
  related_shipment_id text,

  current_stage_snapshot text not null default '',
  current_node_snapshot text not null default '',

  action_code text not null check (
    action_code in (
      'contacted_customer',
      'completed_ing_clarification',
      'pushed_to_qr',
      'chased_qr_feedback',
      'sent_qt',
      'chased_qt_feedback',
      'sent_sc',
      'chased_sc_signing',
      'chased_customer_deposit',
      'sent_inspection_report',
      'chased_third_party_inspection',
      'chased_third_party_supervision',
      'chased_customer_payment',
      'confirmed_freight_schedule',
      'notified_arrival',
      'chased_clearance_docs',
      'confirmed_receipt',
      'invited_feedback',
      'recorded_customer_reply',
      'scheduled_follow_up',
      'closed_no_follow_up_needed'
    )
  ),
  action_label_snapshot text not null default '',

  note text,
  customer_reply_summary text,
  next_follow_up_at timestamptz,

  triggered_status_change boolean not null default false,
  triggered_field_name text,
  triggered_field_value text,

  created_at timestamptz not null default now(),
  created_by text
);

create index if not exists idx_sales_follow_up_logs_sales_user_email
  on sales_follow_up_logs (sales_user_email);

create index if not exists idx_sales_follow_up_logs_customer_id
  on sales_follow_up_logs (customer_id);

create index if not exists idx_sales_follow_up_logs_doc_type_doc_id
  on sales_follow_up_logs (doc_type, doc_id);

create index if not exists idx_sales_follow_up_logs_created_at
  on sales_follow_up_logs (created_at desc);

create index if not exists idx_sales_follow_up_logs_next_follow_up_at
  on sales_follow_up_logs (next_follow_up_at);


create table if not exists sales_customer_reply_logs (
  id uuid primary key default gen_random_uuid(),

  customer_id text,
  customer_name_snapshot text not null default '',
  customer_company_snapshot text not null default '',

  doc_type text not null check (
    doc_type in ('ING', 'QT', 'SC', 'SHIPMENT', 'POST_DELIVERY')
  ),
  doc_id text not null,
  doc_no_snapshot text not null default '',

  reply_channel text not null check (
    reply_channel in ('portal', 'email', 'whatsapp', 'wechat', 'phone', 'manual')
  ),
  reply_type text not null check (
    reply_type in (
      'qt_confirmed',
      'qt_negotiating',
      'sc_confirmed',
      'inspection_mode_selected',
      'third_party_inspection_arranged',
      'third_party_supervision_arranged',
      'payment_promised',
      'arrival_acknowledged',
      'clearance_doc_promised',
      'receipt_confirmed',
      'feedback_submitted',
      'general_reply'
    )
  ),

  reply_summary text not null default '',
  raw_reply_text text,

  requires_follow_up boolean not null default true,
  follow_up_due_at timestamptz,

  created_at timestamptz not null default now(),
  created_by text
);

create index if not exists idx_sales_customer_reply_logs_customer_id
  on sales_customer_reply_logs (customer_id);

create index if not exists idx_sales_customer_reply_logs_doc_type_doc_id
  on sales_customer_reply_logs (doc_type, doc_id);

create index if not exists idx_sales_customer_reply_logs_created_at
  on sales_customer_reply_logs (created_at desc);

create index if not exists idx_sales_customer_reply_logs_follow_up_due_at
  on sales_customer_reply_logs (follow_up_due_at);
