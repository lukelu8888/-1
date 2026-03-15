-- Migration 062: Make inquiry number allocation happen on INSERT, not via RPC only
--
-- Root cause:
-- - Customer inquiry creation was depending on create_inquiry_atomic() being visible in
--   PostgREST schema cache.
-- - When RPC visibility drifted, create flow failed even though the DB-side numbering
--   logic existed.
-- - next_inquiry_number() also regressed to relying only on persisted inquiries, which
--   can still race before concurrent inserts commit.
--
-- Fix:
-- - Restore next_inquiry_number() to allocate against the greater of:
--   1) current persisted ING max suffix for region/day
--   2) number_sequences.current_value
-- - Add a BEFORE INSERT trigger so direct INSERTs with inquiry_number = null are assigned
--   a server-side ING number atomically inside the insert transaction.

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
  v_scope_id       TEXT := v_region_code || ':' || v_date_key;
  v_existing_max   INT := 0;
  v_sequence_value INT := 0;
  v_next_seq       INT := 0;
BEGIN
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

CREATE OR REPLACE FUNCTION public.assign_inquiry_number_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.id IS NULL THEN
    NEW.id := gen_random_uuid();
  END IF;

  NEW.region_code := COALESCE(NULLIF(BTRIM(NEW.region_code), ''), 'NA');
  NEW.created_at := COALESCE(NEW.created_at, NOW());
  NEW.updated_at := NOW();

  IF NEW.inquiry_number IS NULL OR BTRIM(NEW.inquiry_number) = '' THEN
    NEW.inquiry_number := public.next_inquiry_number(NEW.region_code, NULL);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assign_inquiry_number_before_insert ON public.inquiries;

CREATE TRIGGER assign_inquiry_number_before_insert
BEFORE INSERT ON public.inquiries
FOR EACH ROW
EXECUTE FUNCTION public.assign_inquiry_number_before_insert();
