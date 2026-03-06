-- Migration 037: sales_quotations 持久化智能核价全局参数
-- 用于确保“利润率批量应用 + 保存草稿”回显一致（Supabase-first）

ALTER TABLE public.sales_quotations
  ADD COLUMN IF NOT EXISTS pricing_defaults JSONB;
