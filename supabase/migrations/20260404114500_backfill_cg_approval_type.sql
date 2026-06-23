DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'approval_records'
      AND column_name = 'record_type'
  ) THEN
    EXECUTE $sql$
      UPDATE public.approval_records
      SET type = 'cg_approval'
      WHERE COALESCE(type, '') = 'contract'
        AND (
          COALESCE(related_document_type, '') = '采购请求审批'
          OR COALESCE(entity_type, '') = 'purchase_order'
          OR COALESCE(record_type::text, '') = 'purchase_order'
        )
    $sql$;
  ELSE
    UPDATE public.approval_records
    SET type = 'cg_approval'
    WHERE COALESCE(type, '') = 'contract'
      AND (
        COALESCE(related_document_type, '') = '采购请求审批'
        OR COALESCE(entity_type, '') = 'purchase_order'
      );
  END IF;
END $$;
