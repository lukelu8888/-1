alter table public.accounts_receivable
  add column if not exists deposit_receipt_proof jsonb,
  add column if not exists balance_receipt_proof jsonb;

comment on column public.accounts_receivable.deposit_receipt_proof is
  'Finance-confirmed customer deposit receipt proof used to persist receivable workflow state.';

comment on column public.accounts_receivable.balance_receipt_proof is
  'Finance-confirmed customer balance receipt proof used to persist receivable workflow state.';
