-- Migration 023: Fix number_sequences constraints to support next_number_ex RPC
-- Problem: old unique constraint (prefix, region_code, date_key) conflicted with new
--          ON CONFLICT (doc_type, scope_type, scope_id) in next_number_ex.
--          region_code also had NOT NULL which prevented inserting NULL for new rows.

-- 1. Drop old unique constraint
ALTER TABLE public.number_sequences
  DROP CONSTRAINT IF EXISTS number_sequences_prefix_region_code_date_key_key;

-- 2. Drop NOT NULL on legacy columns no longer used as unique key
ALTER TABLE public.number_sequences
  ALTER COLUMN region_code DROP NOT NULL,
  ALTER COLUMN prefix      DROP NOT NULL,
  ALTER COLUMN date_key    DROP NOT NULL;

-- 3. Re-create next_number_ex with region_code=NULL on INSERT to avoid old constraint
CREATE OR REPLACE FUNCTION public.next_number_ex(
  p_doc_type    TEXT,
  p_region_code TEXT DEFAULT 'UNKNOWN',
  p_customer_id TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_scope_type  TEXT;
  v_prefix      TEXT;
  v_scope_id    TEXT;
  v_date_key    TEXT;
  v_seq         INT;
  v_result      TEXT;
BEGIN
  SELECT scope_type, prefix
    INTO v_scope_type, v_prefix
    FROM public.document_types
   WHERE doc_type = p_doc_type AND is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown doc_type: %', p_doc_type;
  END IF;

  IF v_scope_type = 'derived' THEN
    RAISE EXCEPTION 'doc_type % is derived, use parent document number', p_doc_type;
  END IF;

  v_date_key := TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYMMDD');

  CASE v_scope_type
    WHEN 'customer' THEN
      v_scope_id := COALESCE(p_customer_id, 'UNKNOWN') || ':' || v_date_key;
    WHEN 'region' THEN
      v_scope_id := COALESCE(p_region_code, 'UNKNOWN') || ':' || v_date_key;
    ELSE
      v_scope_id := 'global:' || v_date_key;
  END CASE;

  INSERT INTO public.number_sequences
    (doc_type, scope_type, scope_id, current_value,
     prefix, region_code, date_key, current_seq)
  VALUES
    (p_doc_type, v_scope_type, v_scope_id, 1,
     v_prefix, NULL, v_date_key, 1)
  ON CONFLICT (doc_type, scope_type, scope_id)
  DO UPDATE SET
    current_value = public.number_sequences.current_value + 1,
    updated_at    = now()
  RETURNING current_value INTO v_seq;

  CASE v_scope_type
    WHEN 'region' THEN
      v_result := v_prefix || '-' || p_region_code || '-' || v_date_key || '-' || LPAD(v_seq::TEXT, 4, '0');
    ELSE
      v_result := v_prefix || '-' || v_date_key || '-' || LPAD(v_seq::TEXT, 4, '0');
  END CASE;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_number_ex(TEXT, TEXT, TEXT) TO authenticated;
