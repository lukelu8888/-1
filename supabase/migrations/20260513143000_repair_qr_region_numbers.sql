-- Repair non-standard QR numbers by restoring the region segment.
-- Standard: QR-{REGION}-{YYMMDD}-{SEQ}

DO $$
BEGIN
  CREATE TEMP TABLE tmp_qr_number_repairs ON COMMIT DROP AS
  WITH normalized AS (
    SELECT
      id,
      btrim(requirement_no) AS old_no,
      upper(regexp_replace(btrim(requirement_no), '^PR-', 'QR-', 'i')) AS normalized_no,
      CASE
        WHEN upper(coalesce(region, 'NA')) IN ('NA', 'NORTH AMERICA') THEN 'NA'
        WHEN upper(coalesce(region, 'NA')) IN ('SA', 'SOUTH AMERICA') THEN 'SA'
        WHEN upper(coalesce(region, 'NA')) IN ('EA', 'EUROPE & AFRICA', 'EUROPE-AFRICA', 'EUROPE AND AFRICA') THEN 'EA'
        ELSE upper(coalesce(nullif(btrim(region), ''), 'NA'))
      END AS region_code
    FROM public.quote_requirements
    WHERE deleted_at IS NULL
      AND requirement_no IS NOT NULL
      AND btrim(requirement_no) <> ''
  ),
  candidates AS (
    SELECT
      id,
      old_no,
      CASE
        WHEN normalized_no ~ '^QR-(NA|SA|EA)-[0-9]{6}-[0-9]{4}$' THEN normalized_no
        WHEN normalized_no ~ '^QR-[0-9]{6}-[0-9]{4}$' THEN regexp_replace(normalized_no, '^QR-([0-9]{6})-([0-9]{4})$', 'QR-' || region_code || '-\1-\2')
        ELSE normalized_no
      END AS new_no
    FROM normalized
  )
  SELECT c.*
  FROM candidates c
  WHERE c.old_no IS NOT NULL
    AND c.new_no IS NOT NULL
    AND c.old_no <> c.new_no
    AND NOT EXISTS (
      SELECT 1
      FROM public.quote_requirements q
      WHERE q.id <> c.id
        AND q.requirement_no = c.new_no
    );

  UPDATE public.quote_requirements q
  SET
    requirement_no = r.new_no,
    qr_number = r.new_no,
    display_number = r.new_no,
    document_data_snapshot = coalesce(q.document_data_snapshot, '{}'::jsonb)
      || jsonb_build_object(
        'requirementNo', r.new_no,
        'requirementNumber', r.new_no,
        'qrNumber', r.new_no,
        'displayNumber', r.new_no
      ),
    updated_at = now()
  FROM tmp_qr_number_repairs r
  WHERE q.id = r.id;

  UPDATE public.sales_quotations s
  SET qr_number = r.new_no
  FROM tmp_qr_number_repairs r
  WHERE s.qr_number = r.old_no;

  UPDATE public.supplier_quotations s
  SET source_qr_number = r.new_no
  FROM tmp_qr_number_repairs r
  WHERE s.source_qr_number = r.old_no;

  UPDATE public.supplier_xjs x
  SET source_qr_number = r.new_no
  FROM tmp_qr_number_repairs r
  WHERE x.source_qr_number = r.old_no;

  UPDATE public.supplier_xjs x
  SET requirement_no = r.new_no
  FROM tmp_qr_number_repairs r
  WHERE x.requirement_no = r.old_no;

  UPDATE public.purchase_orders p
  SET requirement_no = r.new_no
  FROM tmp_qr_number_repairs r
  WHERE p.requirement_no = r.old_no;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.quote_requirements TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sales_quotations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.supplier_quotations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.supplier_xjs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.purchase_orders TO service_role;
