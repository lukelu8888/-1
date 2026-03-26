-- Extend inquiry records with business owner fields so salesperson-facing inquiry
-- pages can also move from email-only filtering to owner_user_id-first matching.

ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS owner_user_id uuid;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS owner_email text;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS owner_name text;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS owner_role text;

UPDATE public.inquiries i
SET
  owner_email = COALESCE(NULLIF(i.owner_email, ''), NULLIF(i.assigned_to, '')),
  owner_role = COALESCE(NULLIF(i.owner_role, ''), 'Sales_Rep')
WHERE i.owner_email IS NULL
   OR i.owner_role IS NULL;

UPDATE public.inquiries i
SET owner_user_id = up.id
FROM public.user_profiles up
WHERE i.owner_email IS NOT NULL
  AND NOT public.is_system_business_owner_email(i.owner_email)
  AND lower(trim(up.email)) = public.normalize_owner_email(i.owner_email)
  AND i.owner_user_id IS DISTINCT FROM up.id;

DROP TRIGGER IF EXISTS trg_inquiries_owner_invariants ON public.inquiries;
CREATE TRIGGER trg_inquiries_owner_invariants
BEFORE INSERT OR UPDATE OF owner_email, owner_user_id
ON public.inquiries
FOR EACH ROW
EXECUTE FUNCTION public.apply_business_owner_invariants();

ALTER TABLE public.inquiries
  DROP CONSTRAINT IF EXISTS inquiries_owner_user_id_fkey,
  ADD CONSTRAINT inquiries_owner_user_id_fkey
    FOREIGN KEY (owner_user_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL NOT VALID;

ALTER TABLE public.inquiries VALIDATE CONSTRAINT inquiries_owner_user_id_fkey;

CREATE INDEX IF NOT EXISTS idx_inquiries_owner_email ON public.inquiries (owner_email);
COMMENT ON COLUMN public.inquiries.owner_email IS 'Business owner email for salesperson-facing inquiry visibility.';
