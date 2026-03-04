-- Migration 021: 步骤 2f — 添加业务链路索引

-- display_number（全表快速查单据）
CREATE INDEX IF NOT EXISTS idx_inquiries_display_number             ON public.inquiries (display_number);
CREATE INDEX IF NOT EXISTS idx_sales_quotations_display_number      ON public.sales_quotations (display_number);
CREATE INDEX IF NOT EXISTS idx_sales_contracts_display_number       ON public.sales_contracts (display_number);
CREATE INDEX IF NOT EXISTS idx_purchase_requirements_display_number ON public.purchase_requirements (display_number);
CREATE INDEX IF NOT EXISTS idx_supplier_xjs_display_number          ON public.supplier_xjs (display_number);
CREATE INDEX IF NOT EXISTS idx_supplier_quotations_display_number   ON public.supplier_quotations (display_number);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_display_number       ON public.purchase_orders (display_number);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_display_number     ON public.purchase_requests (display_number);
CREATE INDEX IF NOT EXISTS idx_payments_display_number              ON public.payments (display_number);

-- sales_contract_id（利润中心聚合）
CREATE INDEX IF NOT EXISTS idx_inquiries_sales_contract_id             ON public.inquiries (sales_contract_id);
CREATE INDEX IF NOT EXISTS idx_sales_quotations_sales_contract_id      ON public.sales_quotations (sales_contract_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requirements_sales_contract_id ON public.purchase_requirements (sales_contract_id);
CREATE INDEX IF NOT EXISTS idx_supplier_xjs_sales_contract_id          ON public.supplier_xjs (sales_contract_id);
CREATE INDEX IF NOT EXISTS idx_supplier_quotations_sales_contract_id   ON public.supplier_quotations (sales_contract_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_sales_contract_id       ON public.purchase_orders (sales_contract_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_sales_contract_id     ON public.purchase_requests (sales_contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_sales_contract_id              ON public.payments (sales_contract_id);

-- root_sales_contract_id（全链路追溯）
CREATE INDEX IF NOT EXISTS idx_inquiries_root_sc             ON public.inquiries (root_sales_contract_id);
CREATE INDEX IF NOT EXISTS idx_sales_quotations_root_sc      ON public.sales_quotations (root_sales_contract_id);
CREATE INDEX IF NOT EXISTS idx_sales_contracts_root_sc       ON public.sales_contracts (root_sales_contract_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requirements_root_sc ON public.purchase_requirements (root_sales_contract_id);
CREATE INDEX IF NOT EXISTS idx_supplier_xjs_root_sc          ON public.supplier_xjs (root_sales_contract_id);
CREATE INDEX IF NOT EXISTS idx_supplier_quotations_root_sc   ON public.supplier_quotations (root_sales_contract_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_root_sc       ON public.purchase_orders (root_sales_contract_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_root_sc     ON public.purchase_requests (root_sales_contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_root_sc              ON public.payments (root_sales_contract_id);

-- source_doc_id（上下游单据追溯）
CREATE INDEX IF NOT EXISTS idx_inquiries_source_doc             ON public.inquiries (source_doc_id);
CREATE INDEX IF NOT EXISTS idx_sales_quotations_source_doc      ON public.sales_quotations (source_doc_id);
CREATE INDEX IF NOT EXISTS idx_sales_contracts_source_doc       ON public.sales_contracts (source_doc_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requirements_source_doc ON public.purchase_requirements (source_doc_id);
CREATE INDEX IF NOT EXISTS idx_supplier_xjs_source_doc          ON public.supplier_xjs (source_doc_id);
CREATE INDEX IF NOT EXISTS idx_supplier_quotations_source_doc   ON public.supplier_quotations (source_doc_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_source_doc       ON public.purchase_orders (source_doc_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_source_doc     ON public.purchase_requests (source_doc_id);
CREATE INDEX IF NOT EXISTS idx_payments_source_doc              ON public.payments (source_doc_id);
