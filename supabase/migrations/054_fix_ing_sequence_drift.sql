-- Migration 054: Self-heal ING sequence drift against existing inquiries
--
-- Root cause:
-- - Some historical ING inserts already consumed inquiry numbers that are ahead of
--   number_sequences.current_value for the same region/day.
-- - next_inquiry_number() then returns already-used numbers, causing repeated 23505
--   conflicts on inquiries.inquiry_number.
--
-- Fix:
-- - Keep ING region-scoped.
-- - When issuing the next ING number, read the current max suffix from public.inquiries
--   for the same region/day and force number_sequences.current_value to catch up before
--   incrementing.

UPDATE public.document_types
   SET scope_type = 'region',
       format = 'ING-REGION-YYMMDD-XXXX'
 WHERE doc_type = 'ING';

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
  v_seq          INT := 0;
BEGIN
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

  INSERT INTO public.number_sequences
    (doc_type, scope_type, scope_id, current_value, prefix, region_code, date_key, current_seq)
  VALUES
    ('ING', 'region', v_scope_id, GREATEST(v_existing_max, 0) + 1, 'ING', v_region_code, v_date_key, GREATEST(v_existing_max, 0) + 1)
  ON CONFLICT (doc_type, scope_type, scope_id)
  DO UPDATE SET
    current_value = GREATEST(public.number_sequences.current_value, v_existing_max) + 1,
    prefix = EXCLUDED.prefix,
    region_code = EXCLUDED.region_code,
    date_key = EXCLUDED.date_key,
    current_seq = GREATEST(public.number_sequences.current_value, v_existing_max) + 1,
    updated_at = NOW()
  RETURNING current_value INTO v_seq;

  RETURN 'ING-' || v_region_code || '-' || v_date_key || '-' || LPAD(v_seq::TEXT, 4, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_inquiry_number(TEXT, TEXT) TO authenticated;
