-- Migration 043: rename purchase_requirements to quote_requirements
-- 目标：
-- 1. 将 QR 主承载物理表正式更名为 quote_requirements
-- 2. 清理开发阶段遗留的 purchase_requirements 旧命名
-- 3. 将业务视图 quote_requirements 让位给物理表本身

BEGIN;

DROP VIEW IF EXISTS public.quote_requirements;

ALTER TABLE IF EXISTS public.purchase_requirements
  RENAME TO quote_requirements;

ALTER INDEX IF EXISTS idx_purchase_requirements_template_version_id
  RENAME TO idx_quote_requirements_template_version_id;

COMMENT ON TABLE public.quote_requirements IS
  'Runtime source of truth for QR (Quote Requirement / 报价请求单).';

COMMENT ON COLUMN public.quote_requirements.legacy_qr_alias IS
  'Compatibility marker retained during development-stage renaming cleanup.';

COMMIT;
