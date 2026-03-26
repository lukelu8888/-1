-- Enforce business owner invariants at the database layer.
-- 1) System/admin accounts can never be persisted as business owners.
-- 2) owner_user_id is auto-resolved from user_profiles.email when owner_email is present.

CREATE OR REPLACE FUNCTION public.normalize_owner_email(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(lower(trim(input)), '');
$$;

CREATE OR REPLACE FUNCTION public.is_system_business_owner_email(input text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(public.normalize_owner_email(input), '') IN (
    'admin@cosun.com',
    'admin@cosunchina.com',
    'system@cosun.com',
    'system@cosunchina.com'
  );
$$;

CREATE OR REPLACE FUNCTION public.apply_business_owner_invariants()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  resolved_owner_email text;
  resolved_owner_id uuid;
BEGIN
  resolved_owner_email := public.normalize_owner_email(NEW.owner_email);
  NEW.owner_email := resolved_owner_email;

  IF resolved_owner_email IS NOT NULL AND public.is_system_business_owner_email(resolved_owner_email) THEN
    RAISE EXCEPTION 'System account cannot be used as business owner: %', resolved_owner_email
      USING ERRCODE = '23514';
  END IF;

  IF resolved_owner_email IS NULL THEN
    NEW.owner_user_id := NULL;
    RETURN NEW;
  END IF;

  SELECT id
  INTO resolved_owner_id
  FROM public.user_profiles
  WHERE lower(trim(email)) = resolved_owner_email
  ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
  LIMIT 1;

  NEW.owner_user_id := resolved_owner_id;
  RETURN NEW;
END;
$$;

-- Backfill owner_user_id from user_profiles.email for existing data
UPDATE public.quotation_requests qr
SET owner_user_id = up.id
FROM public.user_profiles up
WHERE qr.owner_email IS NOT NULL
  AND NOT public.is_system_business_owner_email(qr.owner_email)
  AND lower(trim(up.email)) = public.normalize_owner_email(qr.owner_email)
  AND qr.owner_user_id IS DISTINCT FROM up.id;

UPDATE public.quote_requirements qr
SET owner_user_id = up.id
FROM public.user_profiles up
WHERE qr.owner_email IS NOT NULL
  AND NOT public.is_system_business_owner_email(qr.owner_email)
  AND lower(trim(up.email)) = public.normalize_owner_email(qr.owner_email)
  AND qr.owner_user_id IS DISTINCT FROM up.id;

UPDATE public.sales_quotations sq
SET owner_user_id = up.id
FROM public.user_profiles up
WHERE sq.owner_email IS NOT NULL
  AND NOT public.is_system_business_owner_email(sq.owner_email)
  AND lower(trim(up.email)) = public.normalize_owner_email(sq.owner_email)
  AND sq.owner_user_id IS DISTINCT FROM up.id;

UPDATE public.sales_contracts sc
SET owner_user_id = up.id
FROM public.user_profiles up
WHERE sc.owner_email IS NOT NULL
  AND NOT public.is_system_business_owner_email(sc.owner_email)
  AND lower(trim(up.email)) = public.normalize_owner_email(sc.owner_email)
  AND sc.owner_user_id IS DISTINCT FROM up.id;

UPDATE public.purchase_orders po
SET owner_user_id = up.id
FROM public.user_profiles up
WHERE po.owner_email IS NOT NULL
  AND NOT public.is_system_business_owner_email(po.owner_email)
  AND lower(trim(up.email)) = public.normalize_owner_email(po.owner_email)
  AND po.owner_user_id IS DISTINCT FROM up.id;

DROP TRIGGER IF EXISTS trg_quotation_requests_owner_invariants ON public.quotation_requests;
CREATE TRIGGER trg_quotation_requests_owner_invariants
BEFORE INSERT OR UPDATE OF owner_email, owner_user_id
ON public.quotation_requests
FOR EACH ROW
EXECUTE FUNCTION public.apply_business_owner_invariants();

DROP TRIGGER IF EXISTS trg_quote_requirements_owner_invariants ON public.quote_requirements;
CREATE TRIGGER trg_quote_requirements_owner_invariants
BEFORE INSERT OR UPDATE OF owner_email, owner_user_id
ON public.quote_requirements
FOR EACH ROW
EXECUTE FUNCTION public.apply_business_owner_invariants();

DROP TRIGGER IF EXISTS trg_sales_quotations_owner_invariants ON public.sales_quotations;
CREATE TRIGGER trg_sales_quotations_owner_invariants
BEFORE INSERT OR UPDATE OF owner_email, owner_user_id
ON public.sales_quotations
FOR EACH ROW
EXECUTE FUNCTION public.apply_business_owner_invariants();

DROP TRIGGER IF EXISTS trg_sales_contracts_owner_invariants ON public.sales_contracts;
CREATE TRIGGER trg_sales_contracts_owner_invariants
BEFORE INSERT OR UPDATE OF owner_email, owner_user_id
ON public.sales_contracts
FOR EACH ROW
EXECUTE FUNCTION public.apply_business_owner_invariants();

DROP TRIGGER IF EXISTS trg_purchase_orders_owner_invariants ON public.purchase_orders;
CREATE TRIGGER trg_purchase_orders_owner_invariants
BEFORE INSERT OR UPDATE OF owner_email, owner_user_id
ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.apply_business_owner_invariants();

ALTER TABLE public.quotation_requests
  DROP CONSTRAINT IF EXISTS quotation_requests_owner_user_id_fkey,
  ADD CONSTRAINT quotation_requests_owner_user_id_fkey
    FOREIGN KEY (owner_user_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL NOT VALID;

ALTER TABLE public.quote_requirements
  DROP CONSTRAINT IF EXISTS quote_requirements_owner_user_id_fkey,
  ADD CONSTRAINT quote_requirements_owner_user_id_fkey
    FOREIGN KEY (owner_user_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL NOT VALID;

ALTER TABLE public.sales_quotations
  DROP CONSTRAINT IF EXISTS sales_quotations_owner_user_id_fkey,
  ADD CONSTRAINT sales_quotations_owner_user_id_fkey
    FOREIGN KEY (owner_user_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL NOT VALID;

ALTER TABLE public.sales_contracts
  DROP CONSTRAINT IF EXISTS sales_contracts_owner_user_id_fkey,
  ADD CONSTRAINT sales_contracts_owner_user_id_fkey
    FOREIGN KEY (owner_user_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL NOT VALID;

ALTER TABLE public.purchase_orders
  DROP CONSTRAINT IF EXISTS purchase_orders_owner_user_id_fkey,
  ADD CONSTRAINT purchase_orders_owner_user_id_fkey
    FOREIGN KEY (owner_user_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL NOT VALID;

ALTER TABLE public.quotation_requests VALIDATE CONSTRAINT quotation_requests_owner_user_id_fkey;
ALTER TABLE public.quote_requirements VALIDATE CONSTRAINT quote_requirements_owner_user_id_fkey;
ALTER TABLE public.sales_quotations VALIDATE CONSTRAINT sales_quotations_owner_user_id_fkey;
ALTER TABLE public.sales_contracts VALIDATE CONSTRAINT sales_contracts_owner_user_id_fkey;
ALTER TABLE public.purchase_orders VALIDATE CONSTRAINT purchase_orders_owner_user_id_fkey;
