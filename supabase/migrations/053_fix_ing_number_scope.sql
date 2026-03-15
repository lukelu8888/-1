-- Migration 053: Fix ING numbering to be region-scoped and globally unique per region/day
--
-- Root cause:
-- ING was configured as scope_type='customer', but the generated number format does not
-- encode customer identity. That makes different customers generate identical
-- ING-{REGION}-{YYMMDD}-{XXXX} values and collide with the unique constraint on inquiries.

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
BEGIN
  RETURN public.next_number_ex('ING', p_region_code, NULL);
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_inquiry_number(TEXT, TEXT) TO authenticated;
