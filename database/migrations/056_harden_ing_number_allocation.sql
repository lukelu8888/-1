-- Migration 056: Harden ING number allocation against duplicate conflicts
--
-- Root cause:
-- - Client create flows may race on inquiry creation and/or reuse stale inquiry_number values.
-- - Even after sequence drift correction, concurrent requests can still collide on the
--   inquiries_inquiry_number_tenant_key unique constraint.
--
-- Fix:
-- - Always allocate a fresh inquiry_number inside the DB for create_inquiry_atomic().
-- - Use a transaction advisory lock keyed by region/day so ING numbers are issued serially.
-- - Derive the next suffix from the current max persisted inquiry_number for that region/day.
-- - Keep number_sequences in sync as a side effect, but no longer trust it as the sole source of truth.

CREATE OR REPLACE FUNCTION public.next_inquiry_number(
  p_region_code TEXT DEFAULT 'NA',
  p_customer_id TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_region_code  TEXT := COALESCE(NULLIF(BTRIM(p_region_code), ''), 'NA');
  v_date_key     TEXT := TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYMMDD');
  v_scope_id     TEXT := v_region_code || ':' || v_date_key;
  v_existing_max INT := 0;
  v_next_seq     INT := 0;
BEGIN
  -- Serialise ING number allocation per region/day inside the transaction.
  PERFORM pg_advisory_xact_lock(hashtext('ING'), hashtext(v_scope_id));

  SELECT COALESCE(
           MAX(
             COALESCE(
               NULLIF(SUBSTRING(inquiry_number FROM '([0-9]{4})$'), ''),
               '0'
             )::INT
           ),
           0
         )
    INTO v_existing_max
    FROM public.inquiries
   WHERE inquiry_number LIKE 'ING-' || v_region_code || '-' || v_date_key || '-%';

  v_next_seq := v_existing_max + 1;

  INSERT INTO public.number_sequences
    (doc_type, scope_type, scope_id, current_value, prefix, region_code, date_key, current_seq)
  VALUES
    ('ING', 'region', v_scope_id, v_next_seq, 'ING', v_region_code, v_date_key, v_next_seq)
  ON CONFLICT (doc_type, scope_type, scope_id)
  DO UPDATE SET
    current_value = GREATEST(public.number_sequences.current_value, v_next_seq),
    prefix = EXCLUDED.prefix,
    region_code = EXCLUDED.region_code,
    date_key = EXCLUDED.date_key,
    current_seq = GREATEST(public.number_sequences.current_seq, v_next_seq),
    updated_at = NOW();

  RETURN 'ING-' || v_region_code || '-' || v_date_key || '-' || LPAD(v_next_seq::TEXT, 4, '0');
END;
$$;
