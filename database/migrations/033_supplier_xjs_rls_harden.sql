-- Migration 033: Harden supplier_xjs RLS to prevent cross-user deletes
-- Goal:
-- 1) Supplier can only insert/update own XJ rows.
-- 2) Delete is restricted to admin/procurement roles.
-- 3) Keep read access for authenticated users to avoid breaking existing pages.

ALTER TABLE public.supplier_xjs ENABLE ROW LEVEL SECURITY;

-- Remove overly permissive policy
DROP POLICY IF EXISTS auth_all_supplier_xjs ON public.supplier_xjs;

-- Read policy (keep compatible with existing screens)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'supplier_xjs'
      AND policyname = 'xj_select_authenticated'
  ) THEN
    CREATE POLICY xj_select_authenticated
      ON public.supplier_xjs
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END;
$$;

-- Supplier/admin can insert:
-- - owner row by email match, OR
-- - admin/procurement profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'supplier_xjs'
      AND policyname = 'xj_insert_owner_or_admin'
  ) THEN
    CREATE POLICY xj_insert_owner_or_admin
      ON public.supplier_xjs
      FOR INSERT
      TO authenticated
      WITH CHECK (
        lower(coalesce(supplier_email, '')) = lower(coalesce(auth.jwt()->>'email', ''))
        OR lower(coalesce(created_by, '')) = lower(coalesce(auth.jwt()->>'email', ''))
        OR EXISTS (
          SELECT 1
          FROM public.user_profiles p
          WHERE p.id = auth.uid()
            AND p.portal_role = 'admin'
            AND coalesce(p.rbac_role, '') IN ('Admin', 'Procurement')
        )
      );
  END IF;
END;
$$;

-- Supplier/admin can update own rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'supplier_xjs'
      AND policyname = 'xj_update_owner_or_admin'
  ) THEN
    CREATE POLICY xj_update_owner_or_admin
      ON public.supplier_xjs
      FOR UPDATE
      TO authenticated
      USING (
        lower(coalesce(supplier_email, '')) = lower(coalesce(auth.jwt()->>'email', ''))
        OR lower(coalesce(created_by, '')) = lower(coalesce(auth.jwt()->>'email', ''))
        OR EXISTS (
          SELECT 1
          FROM public.user_profiles p
          WHERE p.id = auth.uid()
            AND p.portal_role = 'admin'
            AND coalesce(p.rbac_role, '') IN ('Admin', 'Procurement')
        )
      )
      WITH CHECK (
        lower(coalesce(supplier_email, '')) = lower(coalesce(auth.jwt()->>'email', ''))
        OR lower(coalesce(created_by, '')) = lower(coalesce(auth.jwt()->>'email', ''))
        OR EXISTS (
          SELECT 1
          FROM public.user_profiles p
          WHERE p.id = auth.uid()
            AND p.portal_role = 'admin'
            AND coalesce(p.rbac_role, '') IN ('Admin', 'Procurement')
        )
      );
  END IF;
END;
$$;

-- Only admin/procurement can delete (soft-delete update still falls into UPDATE policy)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'supplier_xjs'
      AND policyname = 'xj_delete_admin_or_procurement'
  ) THEN
    CREATE POLICY xj_delete_admin_or_procurement
      ON public.supplier_xjs
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.user_profiles p
          WHERE p.id = auth.uid()
            AND p.portal_role = 'admin'
            AND coalesce(p.rbac_role, '') IN ('Admin', 'Procurement')
        )
      );
  END IF;
END;
$$;
