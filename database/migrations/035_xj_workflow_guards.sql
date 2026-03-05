-- Migration 035: XJ workflow guards
-- 1) Supplier cannot soft-delete supplier_xjs
-- 2) purchase_requirements with downstream XJ cannot be deleted

CREATE OR REPLACE FUNCTION public.guard_supplier_xj_soft_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_portal_role TEXT;
  v_rbac_role   TEXT;
BEGIN
  -- Only intercept soft-delete transition
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    -- service role bypass
    IF coalesce(auth.jwt()->>'role', '') = 'service_role' THEN
      RETURN NEW;
    END IF;

    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'forbidden: unauthenticated soft delete on supplier_xjs';
    END IF;

    SELECT p.portal_role, p.rbac_role
      INTO v_portal_role, v_rbac_role
    FROM public.user_profiles p
    WHERE p.id = auth.uid();

    IF coalesce(v_portal_role, '') <> 'admin'
       OR coalesce(v_rbac_role, '') NOT IN ('Admin', 'Procurement') THEN
      RAISE EXCEPTION 'forbidden: only admin/procurement can delete supplier_xjs';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_supplier_xj_soft_delete ON public.supplier_xjs;
CREATE TRIGGER trg_guard_supplier_xj_soft_delete
BEFORE UPDATE ON public.supplier_xjs
FOR EACH ROW
EXECUTE FUNCTION public.guard_supplier_xj_soft_delete();


CREATE OR REPLACE FUNCTION public.guard_pr_delete_with_downstream_xj()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_has_xj BOOLEAN := FALSE;
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.supplier_xjs x
      WHERE x.deleted_at IS NULL
        AND x.requirement_no = OLD.requirement_number
    ) INTO v_has_xj;

    IF v_has_xj THEN
      RAISE EXCEPTION 'forbidden: downstream XJ exists for requirement %', OLD.requirement_number;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_pr_delete_with_downstream_xj ON public.purchase_requirements;
CREATE TRIGGER trg_guard_pr_delete_with_downstream_xj
BEFORE UPDATE ON public.purchase_requirements
FOR EACH ROW
EXECUTE FUNCTION public.guard_pr_delete_with_downstream_xj();
