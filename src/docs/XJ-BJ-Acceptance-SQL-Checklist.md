# XJ -> BJ Acceptance SQL Checklist (Supabase-first)

Run in Supabase SQL Editor after applying migration `031_xj_bj_schema_rls_alignment.sql`.

## 1) Schema alignment

```sql
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'supplier_quotations'
  and column_name in (
    'id','quotation_number','bj_number','display_number',
    'supplier_code','supplier_name','supplier_email','supplier_company',
    'source_xj_number','source_xj_id','source_qr_number','region_code',
    'products','total_amount','currency','quotation_date','valid_until',
    'payment_terms','delivery_terms','status','notes','created_by',
    'source_doc_id','sales_contract_id','root_sales_contract_id',
    'deleted_at','created_at','updated_at'
  )
order by column_name;
```

## 2) RLS policy alignment

```sql
select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('supplier_xjs', 'supplier_quotations')
order by tablename, policyname;
```

Expected:
- `supplier_xjs` has `auth_all_supplier_xjs`
- `supplier_quotations` has `auth_all_supplier_quotations` (or an equivalent all-access policy for authenticated users)

## 3) Index alignment

```sql
select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'supplier_quotations'
  and (
    indexname ilike '%quotation_number%' or
    indexname ilike '%source_xj_number%' or
    indexname ilike '%supplier_email%' or
    indexname ilike '%status%' or
    indexname ilike '%source_qr%'
  )
order by indexname;
```

## 4) XJ -> BJ link integrity

```sql
select
  x.id as xj_id,
  x.supplier_xj_no as xj_no,
  x.status as xj_status,
  q.id as bj_id,
  q.quotation_number as bj_no,
  q.status as bj_status,
  q.supplier_email
from public.supplier_xjs x
left join public.supplier_quotations q
  on q.source_xj_number = x.supplier_xj_no
 and q.deleted_at is null
where x.deleted_at is null
order by x.created_at desc
limit 50;
```

Check:
- Every submitted BJ should resolve back to the expected XJ via `source_xj_number`.
- Draft BJ can exist without pushing XJ to final quoted state.

## 5) Spot check status consistency

```sql
select
  q.quotation_number,
  q.status as bj_status,
  x.supplier_xj_no,
  x.status as xj_status
from public.supplier_quotations q
left join public.supplier_xjs x
  on x.supplier_xj_no = q.source_xj_number
where q.deleted_at is null
order by q.created_at desc
limit 50;
```

Rule:
- `bj_status in ('submitted','accepted','completed')` => corresponding `xj_status` should be `quoted` (or terminal state by your process policy).
- `bj_status = 'draft'` should not force XJ into `quoted`.
