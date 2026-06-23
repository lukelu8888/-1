alter table public.accounts_receivable
  add column if not exists credit_limit_usd numeric,
  add column if not exists overdue_risk_level text,
  add column if not exists credit_release_approved_by text;

comment on column public.accounts_receivable.credit_limit_usd is
  'Approved customer credit limit in USD for O/A and exceptional release governance';
comment on column public.accounts_receivable.overdue_risk_level is
  'Overdue risk level: low / medium / high / critical';
comment on column public.accounts_receivable.credit_release_approved_by is
  'Approver who authorized credit/overdue release for shipment or document release';

