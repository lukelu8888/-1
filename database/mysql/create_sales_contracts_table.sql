-- Sales Contracts (SC) persistence
-- 包含：销售合同主表 + 合同产品明细表

CREATE TABLE IF NOT EXISTS sales_contracts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  contract_uid VARCHAR(128) NOT NULL COMMENT 'SalesContract.id in app (e.g. SC-<timestamp>)',
  contract_number VARCHAR(128) NOT NULL COMMENT 'SC-{REGION}-YYMMDD-XXXX',
  quotation_number VARCHAR(128) NOT NULL COMMENT '1:1 with QT',
  inquiry_number VARCHAR(128) NULL,
  -- customer snapshot
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_company VARCHAR(255) NOT NULL,
  customer_address VARCHAR(512) NOT NULL,
  customer_country VARCHAR(128) NOT NULL,
  contact_person VARCHAR(128) NOT NULL,
  contact_phone VARCHAR(64) NOT NULL,
  -- sales staff
  sales_person_email VARCHAR(255) NOT NULL,
  sales_person_name VARCHAR(128) NOT NULL,
  supervisor_email VARCHAR(255) NULL,
  region VARCHAR(16) NOT NULL COMMENT 'NA/SA/EMEA',
  -- commercial terms
  total_amount DECIMAL(18,2) NOT NULL,
  currency VARCHAR(8) NOT NULL,
  trade_terms VARCHAR(255) NOT NULL,
  payment_terms VARCHAR(512) NOT NULL,
  deposit_percentage DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  deposit_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  balance_percentage DECIMAL(5,2) NOT NULL DEFAULT 70.00,
  balance_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  delivery_time VARCHAR(255) NOT NULL,
  port_of_loading VARCHAR(255) NOT NULL,
  port_of_destination VARCHAR(255) NOT NULL,
  packing VARCHAR(255) NOT NULL,
  -- status flow
  status VARCHAR(64) NOT NULL COMMENT 'draft/pending_supervisor/.../completed/cancelled',
  approval_flow JSON NULL,
  approval_history JSON NULL,
  approval_notes TEXT NULL,
  rejection_reason TEXT NULL,
  -- deposit proof & confirmation
  deposit_proof JSON NULL,
  deposit_confirmed_by VARCHAR(255) NULL,
  deposit_confirmed_at DATETIME(3) NULL,
  deposit_confirm_notes TEXT NULL,
  purchase_order_numbers JSON NULL,
  -- signatures & attachments
  seller_signature JSON NULL,
  buyer_signature JSON NULL,
  attachments JSON NULL,
  remarks TEXT NULL,
  -- timestamps
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  submitted_at DATETIME(3) NULL,
  approved_at DATETIME(3) NULL,
  sent_to_customer_at DATETIME(3) NULL,
  customer_confirmed_at DATETIME(3) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sales_contracts_uid (contract_uid),
  UNIQUE KEY uq_sales_contracts_number (contract_number),
  UNIQUE KEY uq_sales_contracts_qt (quotation_number),
  KEY idx_sales_contracts_customer (customer_email),
  KEY idx_sales_contracts_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sales_contract_products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sales_contract_id BIGINT UNSIGNED NOT NULL,
  product_id VARCHAR(128) NOT NULL COMMENT 'SalesContractProduct.productId',
  product_name VARCHAR(255) NOT NULL,
  specification VARCHAR(512) NOT NULL,
  hs_code VARCHAR(64) NULL,
  quantity INT UNSIGNED NOT NULL,
  unit VARCHAR(32) NOT NULL,
  unit_price DECIMAL(18,4) NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  delivery_time VARCHAR(255) NULL,
  PRIMARY KEY (id),
  KEY idx_sc_products_contract (sales_contract_id),
  CONSTRAINT fk_sc_products_contract FOREIGN KEY (sales_contract_id) REFERENCES sales_contracts(id)
    ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

