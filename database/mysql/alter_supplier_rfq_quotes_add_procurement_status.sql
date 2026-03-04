-- 采购员接受/拒绝报价：为 supplier_xj_quotes 增加 procurement_status
-- 请在自己环境执行（只执行一次）：
--   mysql -u root -p cosun_b2b < alter_supplier_xj_quotes_add_procurement_status.sql

USE cosun_b2b;

ALTER TABLE supplier_xj_quotes
  ADD COLUMN procurement_status VARCHAR(32) NOT NULL DEFAULT 'submitted' COMMENT 'submitted/accepted/rejected' AFTER quote_data;
