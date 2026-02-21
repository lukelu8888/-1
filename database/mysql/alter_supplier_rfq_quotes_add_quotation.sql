-- 供应商提交报价（BJ）接口用：为 supplier_rfq_quotes 增加 quotation_no、quote_data
-- 请在自己环境执行（只执行一次，重复执行会报列已存在）：
--   mysql -u root -p cosun_b2b < alter_supplier_rfq_quotes_add_quotation.sql
-- 或复制下面 ALTER 在客户端执行

USE cosun_b2b;

ALTER TABLE supplier_rfq_quotes
  ADD COLUMN quotation_no VARCHAR(128) NULL COMMENT 'BJ报价单号' AFTER remarks,
  ADD COLUMN quote_data JSON NULL COMMENT '完整报价payload' AFTER quotation_no;
