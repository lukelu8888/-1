-- 创建销售报价单（QT）表
-- 业务员从成本询报下推生成的报价单

USE cosun_b2b;

CREATE TABLE IF NOT EXISTS sales_quotations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  quotation_uid VARCHAR(128) NOT NULL,        -- UUID for frontend
  qt_number VARCHAR(128) NOT NULL,              -- QT-NA-251219-6789
  -- 关联单据
  qr_number VARCHAR(128) NOT NULL,             -- QR-NA-251219-1234（采购需求单）
  inq_number VARCHAR(128) NULL,                -- INQ-NA-251219-0001（客户询价单）
  -- 区域和客户
  region VARCHAR(16) NOT NULL,                 -- NA/SA/EU
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_company VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(64) NULL,
  customer_address VARCHAR(512) NULL,
  -- 业务员信息
  sales_person_email VARCHAR(255) NOT NULL,
  sales_person_name VARCHAR(128) NOT NULL,
  -- 财务汇总
  total_cost DECIMAL(18,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(18,2) NOT NULL DEFAULT 0,
  total_profit DECIMAL(18,2) NOT NULL DEFAULT 0,
  profit_rate DECIMAL(5,4) NOT NULL DEFAULT 0, -- 0.18 = 18%
  currency VARCHAR(8) NOT NULL DEFAULT 'USD',
  -- 商务条款
  payment_terms VARCHAR(512) NULL,
  delivery_terms VARCHAR(512) NULL,
  delivery_date DATE NULL,
  valid_until DATE NULL,
  -- 审批状态
  approval_status VARCHAR(32) NOT NULL DEFAULT 'draft', -- draft/pending_approval/approved/rejected
  approval_chain JSON NULL,                    -- 审批链
  customer_status VARCHAR(32) NOT NULL DEFAULT 'not_sent', -- not_sent/sent/viewed/accepted/rejected/negotiating/expired
  customer_response JSON NULL,
  -- 关联销售订单
  so_number VARCHAR(128) NULL,
  -- 下推销售合同相关
  pushed_to_contract TINYINT(1) NOT NULL DEFAULT 0,
  pushed_contract_number VARCHAR(128) NULL,
  pushed_contract_at DATETIME(3) NULL,
  pushed_by VARCHAR(255) NULL,
  -- 版本管理
  version INT UNSIGNED NOT NULL DEFAULT 1,
  previous_version VARCHAR(128) NULL,
  -- 备注
  notes TEXT NULL,
  customer_notes TEXT NULL,
  internal_notes TEXT NULL,
  remarks TEXT NULL,
  trade_terms JSON NULL,
  -- 时间戳
  sent_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_sales_quotations_uid (quotation_uid),
  UNIQUE KEY uq_sales_quotations_number (qt_number),
  KEY idx_sales_quotations_sales_person (sales_person_email),
  KEY idx_sales_quotations_qr (qr_number),
  KEY idx_sales_quotations_status (approval_status),
  KEY idx_sales_quotations_customer_status (customer_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sales_quotation_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  quotation_id BIGINT UNSIGNED NOT NULL,
  product_id VARCHAR(128) NULL,
  product_name VARCHAR(255) NOT NULL,
  model_no VARCHAR(128) NULL,
  specification VARCHAR(512) NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 0,
  unit VARCHAR(32) NOT NULL DEFAULT 'PCS',
  -- 成本信息
  cost_price DECIMAL(18,4) NOT NULL DEFAULT 0,
  selected_supplier VARCHAR(255) NULL,
  selected_supplier_name VARCHAR(255) NULL,
  selected_bj VARCHAR(128) NULL,              -- 关联的供应商报价单号 BJ-xxx
  moq INT UNSIGNED NULL,
  lead_time VARCHAR(64) NULL,
  -- 销售报价
  sales_price DECIMAL(18,4) NOT NULL DEFAULT 0,
  profit_margin DECIMAL(5,4) NOT NULL DEFAULT 0,
  profit DECIMAL(18,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(18,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(18,2) NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT 'USD',
  hs_code VARCHAR(64) NULL,
  remarks TEXT NULL,
  PRIMARY KEY (id),
  KEY idx_quotation_items_quotation (quotation_id),
  CONSTRAINT fk_sales_quotation_items_quotation FOREIGN KEY (quotation_id) REFERENCES sales_quotations(id)
    ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
