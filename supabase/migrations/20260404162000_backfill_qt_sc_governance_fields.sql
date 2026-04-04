with qt_governance as (
  select
    id,
    (
      coalesce(special_price_flag, false)
      or nullif(btrim(coalesce(special_price_reason, '')), '') is not null
      or (coalesce(profit_rate, 0) > 0 and coalesce(profit_rate, 0) < 15)
    ) as derived_special_price_flag,
    (
      coalesce(special_payment_terms_flag, false)
      or lower(coalesce(payment_mode, '')) in ('oa', 'da', 'dp')
      or lower(coalesce(payment_terms, '')) like any (array[
        '%open account%',
        '%d/a%',
        '%d/p%',
        '%net %',
        '%installment%',
        '%usance%',
        '%账期%',
        '%赊销%',
        '%远期%',
        '%分期%'
      ])
    ) as derived_special_payment_terms_flag,
    coalesce(strategic_customer_flag, false) as derived_strategic_customer_flag,
    coalesce(total_price, total_amount, 0) >= 20000 as derived_large_amount,
    coalesce(
      qt_last_approval_at,
      case
        when coalesce(approval_status::text, '') = 'approved' then updated_at
        else null
      end
    ) as derived_qt_last_approval_at
  from public.sales_quotations
)
update public.sales_quotations as qt
set
  special_price_flag = governance.derived_special_price_flag,
  special_payment_terms_flag = governance.derived_special_payment_terms_flag,
  strategic_customer_flag = governance.derived_strategic_customer_flag,
  qt_type = case
    when governance.derived_special_price_flag then 'special_price'
    when governance.derived_special_payment_terms_flag then 'special_payment'
    when governance.derived_strategic_customer_flag then 'strategic_customer'
    when governance.derived_large_amount then 'large_amount'
    else 'regular'
  end,
  qt_last_approval_at = governance.derived_qt_last_approval_at
from qt_governance as governance
where governance.id = qt.id;

with sc_governance as (
  select
    id,
    (
      coalesce(exceptional_clause_flag, false)
      or nullif(btrim(coalesce(exceptional_clause_notes, '')), '') is not null
    ) as derived_exceptional_clause_flag,
    (
      coalesce(special_account_period_flag, false)
      or lower(coalesce(payment_terms, '')) like any (array[
        '%open account%',
        '%d/a%',
        '%d/p%',
        '%net %',
        '%installment%',
        '%usance%',
        '%账期%',
        '%赊销%',
        '%远期%',
        '%分期%'
      ])
    ) as derived_special_account_period_flag,
    coalesce(strategic_customer_flag, false) as derived_strategic_customer_flag,
    coalesce(total_amount, 0) >= 20000 as derived_large_amount,
    coalesce(
      sc_last_approval_at,
      approved_at,
      case
        when coalesce(status::text, '') in (
          'approved',
          'sent',
          'customer_confirmed',
          'customer_rejected',
          'customer_requested_changes',
          'deposit_uploaded',
          'deposit_confirmed',
          'po_generated',
          'production',
          'balance_confirmed',
          'shipped',
          'completed'
        ) then updated_at
        else null
      end
    ) as derived_sc_last_approval_at
  from public.sales_contracts
)
update public.sales_contracts as sc
set
  exceptional_clause_flag = governance.derived_exceptional_clause_flag,
  special_account_period_flag = governance.derived_special_account_period_flag,
  strategic_customer_flag = governance.derived_strategic_customer_flag,
  sc_type = case
    when governance.derived_exceptional_clause_flag then 'exceptional_clause'
    when governance.derived_special_account_period_flag then 'special_account_period'
    when governance.derived_strategic_customer_flag then 'strategic_customer'
    when governance.derived_large_amount then 'large_amount'
    else 'regular'
  end,
  sc_last_approval_at = governance.derived_sc_last_approval_at
from sc_governance as governance
where governance.id = sc.id;
