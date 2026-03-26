-- 069_add_business_owner_audit_fields.sql
-- Introduce explicit owner/operator/acting/authenticated identity fields
-- for core internal business documents so role switching no longer overloads
-- created_by or sales_person semantics.

DO $$
DECLARE
  target_table text;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'quotation_requests',
    'quote_requirements',
    'sales_quotations',
    'sales_contracts',
    'purchase_orders'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS owner_user_id uuid', target_table);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS owner_email text', target_table);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS owner_name text', target_table);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS owner_role text', target_table);

    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS operator_user_id uuid', target_table);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS operator_email text', target_table);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS operator_role text', target_table);

    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS acting_user_id uuid', target_table);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS acting_user_email text', target_table);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS acting_user_role text', target_table);

    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS authenticated_user_id uuid', target_table);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS authenticated_user_email text', target_table);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS authenticated_user_role text', target_table);
  END LOOP;
END $$;

-- Backfill quotation_requests (legacy QR view)
UPDATE public.quotation_requests
SET
  owner_email = COALESCE(NULLIF(owner_email, ''), NULLIF(requested_by, '')),
  owner_name = COALESCE(NULLIF(owner_name, ''), NULLIF(requested_by_name, '')),
  owner_role = COALESCE(NULLIF(owner_role, ''), 'Sales_Rep')
WHERE
  owner_email IS NULL
  OR owner_name IS NULL
  OR owner_role IS NULL;

-- Backfill quote_requirements (core QR table)
UPDATE public.quote_requirements
SET
  owner_email = COALESCE(
    NULLIF(owner_email, ''),
    NULLIF(document_render_meta #>> '{identityAudit,businessOwner,email}', ''),
    NULLIF(document_render_meta #>> '{identityAudit,actingUser,email}', '')
  ),
  owner_name = COALESCE(
    NULLIF(owner_name, ''),
    NULLIF(document_render_meta #>> '{identityAudit,businessOwner,name}', ''),
    NULLIF(document_render_meta #>> '{identityAudit,actingUser,name}', '')
  ),
  owner_role = COALESCE(
    NULLIF(owner_role, ''),
    NULLIF(document_render_meta #>> '{identityAudit,businessOwner,role}', ''),
    'Sales_Rep'
  ),
  operator_email = COALESCE(
    NULLIF(operator_email, ''),
    NULLIF(document_render_meta #>> '{identityAudit,operatorUser,email}', '')
  ),
  operator_role = COALESCE(
    NULLIF(operator_role, ''),
    NULLIF(document_render_meta #>> '{identityAudit,operatorUser,role}', '')
  ),
  acting_user_email = COALESCE(
    NULLIF(acting_user_email, ''),
    NULLIF(document_render_meta #>> '{identityAudit,actingUser,email}', '')
  ),
  acting_user_role = COALESCE(
    NULLIF(acting_user_role, ''),
    NULLIF(document_render_meta #>> '{identityAudit,actingUser,role}', '')
  ),
  authenticated_user_email = COALESCE(
    NULLIF(authenticated_user_email, ''),
    NULLIF(document_render_meta #>> '{identityAudit,authenticatedUser,email}', '')
  ),
  authenticated_user_role = COALESCE(
    NULLIF(authenticated_user_role, ''),
    NULLIF(document_render_meta #>> '{identityAudit,authenticatedUser,role}', '')
  )
WHERE
  owner_email IS NULL
  OR operator_email IS NULL
  OR acting_user_email IS NULL
  OR authenticated_user_email IS NULL;

-- Backfill QT / SC / PO from existing owner fields
UPDATE public.sales_quotations
SET
  owner_email = COALESCE(NULLIF(owner_email, ''), NULLIF(sales_person, '')),
  owner_name = COALESCE(NULLIF(owner_name, ''), NULLIF(sales_person_name, '')),
  owner_role = COALESCE(NULLIF(owner_role, ''), 'Sales_Rep')
WHERE
  owner_email IS NULL
  OR owner_name IS NULL
  OR owner_role IS NULL;

UPDATE public.sales_contracts
SET
  owner_email = COALESCE(NULLIF(owner_email, ''), NULLIF(sales_person, '')),
  owner_name = COALESCE(NULLIF(owner_name, ''), NULLIF(sales_person_name, '')),
  owner_role = COALESCE(NULLIF(owner_role, ''), 'Sales_Rep')
WHERE
  owner_email IS NULL
  OR owner_name IS NULL
  OR owner_role IS NULL;

UPDATE public.purchase_orders
SET
  owner_email = COALESCE(
    NULLIF(owner_email, ''),
    NULLIF(document_render_meta #>> '{identityAudit,businessOwner,email}', '')
  ),
  owner_name = COALESCE(
    NULLIF(owner_name, ''),
    NULLIF(document_render_meta #>> '{identityAudit,businessOwner,name}', '')
  ),
  owner_role = COALESCE(
    NULLIF(owner_role, ''),
    NULLIF(document_render_meta #>> '{identityAudit,businessOwner,role}', '')
  )
WHERE
  owner_email IS NULL
  OR owner_name IS NULL
  OR owner_role IS NULL;

CREATE INDEX IF NOT EXISTS idx_quotation_requests_owner_email ON public.quotation_requests (owner_email);
CREATE INDEX IF NOT EXISTS idx_quote_requirements_owner_email ON public.quote_requirements (owner_email);
CREATE INDEX IF NOT EXISTS idx_sales_quotations_owner_email ON public.sales_quotations (owner_email);
CREATE INDEX IF NOT EXISTS idx_sales_contracts_owner_email ON public.sales_contracts (owner_email);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_owner_email ON public.purchase_orders (owner_email);

COMMENT ON COLUMN public.quotation_requests.owner_email IS 'Business owner email. Distinct from operator/acting user.';
COMMENT ON COLUMN public.quote_requirements.owner_email IS 'Business owner email. Distinct from operator/acting user.';
COMMENT ON COLUMN public.sales_quotations.owner_email IS 'Business owner email. Distinct from operator/acting user.';
COMMENT ON COLUMN public.sales_contracts.owner_email IS 'Business owner email. Distinct from operator/acting user.';
COMMENT ON COLUMN public.purchase_orders.owner_email IS 'Business owner email. Distinct from operator/acting user.';
