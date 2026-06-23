-- Migration: Make ING suffix sequence accumulate forever per region
--
-- New rule:
-- - Display format stays ING-{REGION}-{YYMMDD}-{SEQ}
-- - The date portion still reflects the day of allocation
-- - The suffix no longer resets daily/yearly; it keeps increasing for each region
-- - Once suffix exceeds 9999, it continues naturally as 10000, 10001, ...

CREATE OR REPLACE FUNCTION public.next_inquiry_number(
  p_region_code TEXT DEFAULT 'NA',
  p_customer_id TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_region_code    TEXT := COALESCE(NULLIF(BTRIM(p_region_code), ''), 'NA');
  v_date_key       TEXT := TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYMMDD');
  v_scope_id       TEXT := v_region_code;
  v_existing_max   INT := 0;
  v_sequence_value INT := 0;
  v_next_seq       INT := 0;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('ING'), hashtext(v_scope_id));

  SELECT COALESCE(
           MAX(
             COALESCE(
               NULLIF(SUBSTRING(inquiry_number FROM '([0-9]+)$'), ''),
               '0'
             )::INT
           ),
           0
         )
    INTO v_existing_max
    FROM public.inquiries
   WHERE inquiry_number LIKE 'ING-' || v_region_code || '-%';

  SELECT COALESCE(current_value, 0)
    INTO v_sequence_value
    FROM public.number_sequences
   WHERE doc_type = 'ING'
     AND scope_type = 'region'
     AND scope_id = v_scope_id;

  v_next_seq := GREATEST(v_existing_max, v_sequence_value) + 1;

  INSERT INTO public.number_sequences
    (doc_type, scope_type, scope_id, current_value, prefix, region_code, date_key, current_seq)
  VALUES
    ('ING', 'region', v_scope_id, v_next_seq, 'ING', v_region_code, v_date_key, v_next_seq)
  ON CONFLICT (doc_type, scope_type, scope_id)
  DO UPDATE SET
    current_value = EXCLUDED.current_value,
    prefix = EXCLUDED.prefix,
    region_code = EXCLUDED.region_code,
    date_key = EXCLUDED.date_key,
    current_seq = EXCLUDED.current_seq,
    updated_at = NOW();

  RETURN 'ING-' || v_region_code || '-' || v_date_key || '-' || LPAD(v_next_seq::TEXT, 4, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_inquiry_number(TEXT, TEXT) TO authenticated;
