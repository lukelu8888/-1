-- Migration 042: QR convergence alignment
-- 目标：
-- 1. 固化 QR 双表收敛后的最终口径
-- 2. 明确 purchase_requirements 是 QR 主承载
-- 3. 明确 quotation_requests 仅保留为旧采购工作台兼容投影层
-- 4. 修正 quote_requirements 业务视图的数据来源与注释

BEGIN;

COMMENT ON TABLE public.purchase_requirements IS
  'Current runtime source of truth for QR (Quote Requirement / 报价请求单) in the active frontend and business flow.';

COMMENT ON COLUMN public.purchase_requirements.legacy_qr_alias IS
  'Compatibility flag indicating the row may still be exposed through legacy QR aliases and compatibility views.';

COMMENT ON TABLE public.quotation_requests IS
  'Legacy procurement workbench projection for QR retained for backward compatibility. Not the primary QR source of truth.';

COMMENT ON COLUMN public.quotation_requests.qr_context_json IS
  'Legacy compatibility context used by the procurement-side QR projection.';

DROP VIEW IF EXISTS public.quote_requirements;

CREATE VIEW public.quote_requirements AS
SELECT
  pr.id,
  COALESCE(pr.requirement_no, pr.qr_number, pr.display_number) AS qr_number,
  NULL::uuid AS source_inquiry_id,
  pr.source_inquiry_number,
  COALESCE(
    pr.customer_info->>'companyName',
    pr.customer_info->>'company_name',
    pr.customer_info->>'contactPerson',
    ''
  ) AS customer_name,
  COALESCE(
    pr.customer_info->>'email',
    pr.customer_info->>'customerEmail',
    ''
  ) AS customer_email,
  pr.region AS region_code,
  pr.created_at::date AS request_date,
  pr.required_date AS expected_quote_date,
  pr.items AS products,
  pr.status,
  pr.assigned_to,
  pr.created_by::text AS requested_by,
  NULL::text AS requested_by_name,
  pr.notes,
  pr.template_id,
  pr.template_version_id,
  pr.template_snapshot,
  pr.document_data_snapshot,
  pr.document_render_meta,
  COALESCE(pr.customer_info, '{}'::jsonb) AS qr_context_json,
  pr.created_at,
  pr.updated_at
FROM public.purchase_requirements pr
WHERE COALESCE(pr.legacy_qr_alias, TRUE) IS TRUE;

COMMENT ON VIEW public.quote_requirements IS
  'Business-facing QR view sourced from purchase_requirements. quotation_requests is retained only as a legacy procurement compatibility projection.';

COMMIT;
