alter table if exists purchase_order_execution
  add column if not exists bank_submitted_at timestamptz null,
  add column if not exists bank_submitted_by text null,
  add column if not exists document_released_at timestamptz null,
  add column if not exists document_released_by text null;
