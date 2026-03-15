-- Migration 059: Recreate and expose create_inquiry_atomic() for customer inquiry creation
--
-- Root cause:
-- - Customer-side ING creation must allocate inquiry numbers under tenant-global visibility.
-- - Client-side allocation conflicts with RLS and causes repeated duplicate inquiry_number errors.
-- - Some environments also did not expose create_inquiry_atomic() to PostgREST schema cache.
--
-- Fix:
-- - Recreate create_inquiry_atomic(p_payload jsonb) as SECURITY DEFINER.
-- - Grant execute to app roles.
-- - Force PostgREST schema cache reload.

CREATE OR REPLACE FUNCTION public.create_inquiry_atomic(p_payload jsonb)
RETURNS public.inquiries
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row public.inquiries%ROWTYPE;
  v_retry_count INT := 0;
BEGIN
  v_row := jsonb_populate_record(NULL::public.inquiries, p_payload);

  IF v_row.id IS NULL THEN
    v_row.id := gen_random_uuid();
  END IF;

  v_row.region_code := COALESCE(NULLIF(BTRIM(v_row.region_code), ''), 'NA');
  v_row.created_at := COALESCE(v_row.created_at, NOW());
  v_row.updated_at := NOW();

  LOOP
    v_row.inquiry_number := public.next_inquiry_number(v_row.region_code, NULL);

    BEGIN
      INSERT INTO public.inquiries
      SELECT v_row.*;

      RETURN v_row;
    EXCEPTION
      WHEN unique_violation THEN
        v_retry_count := v_retry_count + 1;

        IF POSITION('inquiries_inquiry_number_tenant_key' IN SQLERRM) > 0 THEN
          IF v_retry_count >= 20 THEN
            RAISE;
          END IF;
          CONTINUE;
        END IF;

        IF POSITION('inquiries_pkey' IN SQLERRM) > 0 THEN
          IF v_retry_count >= 20 THEN
            RAISE;
          END IF;
          v_row.id := gen_random_uuid();
          CONTINUE;
        END IF;

        RAISE;
    END;
  END LOOP;
END;
$$;
