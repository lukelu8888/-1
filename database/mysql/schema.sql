-- MySQL 8.0 schema for innoshop_react (COSUN 3-Portal B2B flow)
-- Charset: utf8mb4 (recommended for Chinese + emoji-safe)
--
-- Usage:
--   mysql -u root -p < schema.sql
--   mysql -u root -p < seed.sql

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- You can change DB name if needed
CREATE DATABASE IF NOT EXISTS cosun_b2b
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE cosun_b2b;

SET FOREIGN_KEY_CHECKS = 0;

-- ========== Core: organizations & users ==========

CREATE TABLE IF NOT EXISTS organizations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_type ENUM('internal','customer','supplier','agent') NOT NULL,
  company_id VARCHAR(64) NULL, -- e.g. cosun001 / acme001 (from authorizedUsers.companyId)
  name VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NULL,
  country VARCHAR(128) NULL,
  city VARCHAR(128) NULL,
  region VARCHAR(64) NULL, -- e.g. NA/SA/EA/EMEA or "North America"
  currency VARCHAR(8) NULL, -- USD/EUR/CNY/...
  website VARCHAR(255) NULL,
  industry VARCHAR(128) NULL,
  address VARCHAR(512) NULL,
  contact_person VARCHAR(128) NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(64) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active', -- active/inactive/suspended/...
  level VARCHAR(16) NULL, -- A/B/C/VIP...
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_org_company_id (company_id),
  KEY idx_org_type (org_type),
  KEY idx_org_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_code VARCHAR(64) NULL, -- e.g. admin001 / SUP-001 / customer_test_na
  username VARCHAR(128) NOT NULL,
  email VARCHAR(255) NOT NULL,
  -- NOTE:
  -- - `password` is used by Laravel auth (store bcrypt/argon2 hash).
  -- - `password_plain` is DEMO ONLY for keeping original seed passwords (so you can recover / re-hash).
  password VARCHAR(255) NOT NULL,
  password_plain VARCHAR(255) NULL,
  portal_role ENUM('admin','customer','supplier','agent') NOT NULL,
  rbac_role VARCHAR(64) NULL, -- e.g. CEO/CFO/Sales_Director/Regional_Manager/Sales_Rep/Finance/Procurement/Admin/...
  company_user_role VARCHAR(32) NULL, -- company_admin/standard_user
  permissions JSON NULL,
  org_id BIGINT UNSIGNED NULL,
  region VARCHAR(64) NULL,
  country VARCHAR(128) NULL,
  currency VARCHAR(8) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  registered_date DATE NULL,
  last_login_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_portal_role (portal_role),
  KEY idx_users_org (org_id),
  CONSTRAINT fk_users_org FOREIGN KEY (org_id) REFERENCES organizations(id)
    ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== Document sequence (optional; for server-side numbering) ==========
CREATE TABLE IF NOT EXISTS document_sequences (
  doc_type VARCHAR(8) NOT NULL,      -- RFQ/QUO/SC/YS/SK/INQ/QR/XJ/BJ/QT/SO/PO...
  region_code VARCHAR(8) NOT NULL,   -- NA/SA/EA/EMEA or 'GLOBAL' for BJ/XJ
  last_seq INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (doc_type, region_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== Notifications ==========
CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  notif_uid VARCHAR(64) NOT NULL, -- e.g. notif_...
  type VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_id VARCHAR(128) NULL,
  related_type VARCHAR(32) NULL, -- inquiry/quotation/order/payment/factory_po
  recipient_email VARCHAR(255) NOT NULL,
  sender VARCHAR(255) NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at_ms BIGINT UNSIGNED NOT NULL,
  metadata JSON NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_notifications_uid (notif_uid),
  KEY idx_notifications_recipient (recipient_email, is_read),
  KEY idx_notifications_related (related_type, related_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== Customer Inquiry (InquiryContext) ==========
CREATE TABLE IF NOT EXISTS inquiries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  inquiry_uid VARCHAR(128) NOT NULL,     -- inquiry.id in app (e.g. RFQ-NA-251130-0001)
  inquiry_number VARCHAR(128) NULL,      -- optional separate number
  inquiry_date DATE NOT NULL,
  customer_email VARCHAR(255) NOT NULL,  -- inquiry.userEmail
  company_id VARCHAR(64) NULL,           -- for multi-user company support
  region VARCHAR(64) NULL,
  status VARCHAR(32) NOT NULL,           -- draft/pending/quoted/approved/rejected
  is_submitted TINYINT(1) NOT NULL DEFAULT 0,
  total_price DECIMAL(18,2) NOT NULL DEFAULT 0,
  message TEXT NULL,
  created_at_ms BIGINT UNSIGNED NOT NULL,
  submitted_at_ms BIGINT UNSIGNED NULL,
  -- buyerInfo snapshot
  buyer_company_name VARCHAR(255) NULL,
  buyer_contact_person VARCHAR(128) NULL,
  buyer_email VARCHAR(255) NULL,
  buyer_phone VARCHAR(64) NULL,
  buyer_mobile VARCHAR(64) NULL,
  buyer_address VARCHAR(512) NULL,
  buyer_website VARCHAR(255) NULL,
  buyer_business_type VARCHAR(64) NULL,
  -- shippingInfo
  shipping_cartons VARCHAR(64) NULL,
  shipping_cbm VARCHAR(64) NULL,
  shipping_total_gross_weight VARCHAR(64) NULL,
  shipping_total_net_weight VARCHAR(64) NULL,
  -- containerInfo
  container_planning_mode VARCHAR(32) NULL, -- automatic/custom
  container_recommended VARCHAR(64) NULL,
  container_custom JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_inquiry_uid (inquiry_uid),
  KEY idx_inquiries_customer (customer_email),
  KEY idx_inquiries_status (status),
  KEY idx_inquiries_region (region)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inquiry_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  inquiry_id BIGINT UNSIGNED NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  sku VARCHAR(128) NULL,
  model_no VARCHAR(128) NULL,
  specs VARCHAR(512) NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 0,
  unit VARCHAR(32) NOT NULL DEFAULT 'pcs',
  target_price DECIMAL(18,4) NULL,
  currency VARCHAR(8) NULL,
  image_url VARCHAR(512) NULL,
  remarks VARCHAR(512) NULL,
  PRIMARY KEY (id),
  KEY idx_inquiry_items_inquiry (inquiry_id),
  CONSTRAINT fk_inquiry_items_inquiry FOREIGN KEY (inquiry_id) REFERENCES inquiries(id)
    ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== Workflow state (workflowEngineV2 localStorage mirror) ==========
CREATE TABLE IF NOT EXISTS workflow_states (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  inquiry_number VARCHAR(128) NOT NULL,
  current_stage_id VARCHAR(64) NOT NULL,
  current_step_id VARCHAR(64) NOT NULL,
  completed_steps JSON NOT NULL,
  status_history JSON NOT NULL,
  last_updated_ms BIGINT UNSIGNED NOT NULL,
  context JSON NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_workflow_states_inquiry (inquiry_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== Sales quotation (QuotationManagement -> QuotationContext) ==========
CREATE TABLE IF NOT EXISTS quotations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  quotation_uid VARCHAR(128) NOT NULL,       -- Quotation.id in app (e.g. QUO-...)
  quotation_number VARCHAR(128) NOT NULL,    -- QUO-NA-YYMMDD-XXXX
  inquiry_uid VARCHAR(128) NOT NULL,         -- Quotation.inquiryId (references inquiries.inquiry_uid)
  inquiry_number VARCHAR(128) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  region VARCHAR(64) NULL,
  subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,
  discount DECIMAL(18,2) NOT NULL DEFAULT 0,
  tax DECIMAL(18,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT 'USD',
  valid_until DATE NOT NULL,
  payment_terms VARCHAR(512) NOT NULL,
  delivery_terms VARCHAR(512) NOT NULL,
  quotation_date DATE NOT NULL,
  status VARCHAR(32) NOT NULL, -- draft/sent/confirmed/rejected/expired/converted/negotiating/pending_supervisor/pending_director/approved...
  notes TEXT NULL,
  approval_flow JSON NULL,
  approval_history JSON NULL,
  approval_notes TEXT NULL,
  confirmed_date DATE NULL,
  confirmed_by VARCHAR(255) NULL,
  trade_terms VARCHAR(255) NULL,
  port_of_loading VARCHAR(255) NULL,
  packing VARCHAR(255) NULL,
  warranty VARCHAR(255) NULL,
  inspection VARCHAR(255) NULL,
  customer_feedback JSON NULL,
  revision_number INT UNSIGNED NOT NULL DEFAULT 1,
  revisions JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_quotations_uid (quotation_uid),
  UNIQUE KEY uq_quotations_number (quotation_number),
  KEY idx_quotations_customer (customer_email),
  KEY idx_quotations_status (status),
  KEY idx_quotations_inquiry (inquiry_uid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quotation_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  quotation_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NULL,
  sku VARCHAR(128) NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 0,
  unit_price DECIMAL(18,4) NOT NULL DEFAULT 0,
  total_price DECIMAL(18,2) NOT NULL DEFAULT 0,
  specs VARCHAR(512) NULL,
  image_url VARCHAR(512) NULL,
  PRIMARY KEY (id),
  KEY idx_quotation_items_quotation (quotation_id),
  CONSTRAINT fk_quotation_items_quotation FOREIGN KEY (quotation_id) REFERENCES quotations(id)
    ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== Customer orders (OrderContext) ==========
CREATE TABLE IF NOT EXISTS customer_orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_uid VARCHAR(128) NOT NULL,        -- Order.id in app
  order_number VARCHAR(128) NOT NULL,     -- SC-NA-...
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  quotation_number VARCHAR(128) NULL,
  quotation_id VARCHAR(128) NULL,
  order_date DATE NOT NULL,
  expected_delivery VARCHAR(64) NOT NULL, -- app uses string; keep varchar for flexibility
  total_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL,
  status VARCHAR(64) NOT NULL,            -- many states in code, keep varchar
  progress INT UNSIGNED NOT NULL DEFAULT 0,
  payment_status VARCHAR(64) NOT NULL,
  payment_terms VARCHAR(512) NULL,
  shipping_method VARCHAR(128) NOT NULL,
  delivery_terms VARCHAR(255) NULL,
  tracking_number VARCHAR(128) NULL,
  notes TEXT NULL,
  created_from VARCHAR(32) NULL,
  created_at DATETIME(3) NULL,
  updated_at DATETIME(3) NULL,
  confirmed TINYINT(1) NULL,
  confirmed_at DATETIME(3) NULL,
  confirmed_by VARCHAR(255) NULL,
  confirmed_date DATE NULL,
  region VARCHAR(64) NULL,
  country VARCHAR(128) NULL,
  delivery_address VARCHAR(512) NULL,
  contact_person VARCHAR(128) NULL,
  phone VARCHAR(64) NULL,
  customer_feedback JSON NULL,
  contract_terms JSON NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_customer_orders_uid (order_uid),
  UNIQUE KEY uq_customer_orders_number (order_number),
  KEY idx_customer_orders_customer (customer_email),
  KEY idx_customer_orders_status (status),
  KEY idx_customer_orders_quotation (quotation_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 0,
  unit_price DECIMAL(18,4) NULL,
  total_price DECIMAL(18,2) NULL,
  specs VARCHAR(512) NULL,
  produced INT UNSIGNED NULL,
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_id),
  CONSTRAINT fk_customer_order_items_order FOREIGN KEY (order_id) REFERENCES customer_orders(id)
    ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_order_payment_proofs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  proof_type ENUM('deposit_payment','deposit_receipt','balance_payment','balance_receipt') NOT NULL,
  uploaded_at DATETIME(3) NOT NULL,
  uploaded_by VARCHAR(255) NOT NULL,
  file_url VARCHAR(1024) NULL,
  file_name VARCHAR(255) NULL,
  amount DECIMAL(18,2) NULL,
  actual_amount DECIMAL(18,2) NULL,
  currency VARCHAR(8) NOT NULL,
  receipt_date DATE NULL,
  bank_reference VARCHAR(128) NULL,
  notes VARCHAR(1024) NULL,
  status VARCHAR(32) NULL, -- pending/confirmed/rejected (for customer payment proofs)
  confirmed_at DATETIME(3) NULL,
  confirmed_by VARCHAR(255) NULL,
  rejected_reason VARCHAR(1024) NULL,
  PRIMARY KEY (id),
  KEY idx_order_proofs_order (order_id, proof_type),
  CONSTRAINT fk_customer_order_proofs_order FOREIGN KEY (order_id) REFERENCES customer_orders(id)
    ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== Sales Contracts (SalesContractContext) ==========
CREATE TABLE IF NOT EXISTS sales_contracts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  contract_uid VARCHAR(128) NOT NULL,        -- SalesContract.id in app (e.g. SC-<timestamp>)
  contract_number VARCHAR(128) NOT NULL,     -- SC-{REGION}-YYMMDD-XXXX
  quotation_number VARCHAR(128) NOT NULL,    -- 1:1 with QT (app field)
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
  region VARCHAR(16) NOT NULL,               -- NA/SA/EMEA (keep as string)
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
  status VARCHAR(64) NOT NULL,               -- draft/pending_supervisor/.../completed/cancelled
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
  product_id VARCHAR(128) NOT NULL, -- SalesContractProduct.productId
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

-- ========== Sales Orders (SalesOrderContext) ==========
CREATE TABLE IF NOT EXISTS sales_orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  so_uid VARCHAR(128) NOT NULL,          -- SalesOrder.id in app
  so_number VARCHAR(128) NOT NULL,       -- SO-NA-...
  qt_number VARCHAR(128) NOT NULL,
  qr_number VARCHAR(128) NOT NULL,
  inq_number VARCHAR(128) NOT NULL,
  region VARCHAR(16) NOT NULL,           -- NA/SA/EU (as in code)
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_company VARCHAR(255) NOT NULL,
  sales_person_email VARCHAR(255) NOT NULL,
  sales_person_name VARCHAR(128) NOT NULL,
  total_amount DECIMAL(18,2) NOT NULL,
  total_cost DECIMAL(18,2) NOT NULL,
  total_profit DECIMAL(18,2) NOT NULL,
  profit_rate DECIMAL(7,4) NOT NULL,
  currency VARCHAR(8) NOT NULL,
  payment_terms VARCHAR(512) NOT NULL,
  delivery_terms VARCHAR(512) NOT NULL,
  delivery_date DATE NOT NULL,
  status VARCHAR(32) NOT NULL,           -- confirmed/purchasing/in_production/...
  payment_status VARCHAR(16) NOT NULL,   -- unpaid/partial/paid
  paid_amount DECIMAL(18,2) NULL,
  po_numbers JSON NULL,                  -- string[]
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  confirmed_at DATETIME(3) NULL,
  completed_at DATETIME(3) NULL,
  notes TEXT NULL,
  customer_po_number VARCHAR(128) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sales_orders_uid (so_uid),
  UNIQUE KEY uq_sales_orders_number (so_number),
  KEY idx_sales_orders_customer (customer_email),
  KEY idx_sales_orders_sales (sales_person_email),
  KEY idx_sales_orders_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sales_order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sales_order_id BIGINT UNSIGNED NOT NULL,
  item_uid VARCHAR(128) NOT NULL, -- SalesOrderItem.id
  product_name VARCHAR(255) NOT NULL,
  model_no VARCHAR(128) NOT NULL,
  specification VARCHAR(512) NULL,
  quantity INT UNSIGNED NOT NULL,
  unit VARCHAR(32) NOT NULL,
  sales_price DECIMAL(18,4) NOT NULL,
  cost_price DECIMAL(18,4) NOT NULL,
  profit DECIMAL(18,4) NOT NULL,
  profit_margin DECIMAL(7,4) NOT NULL,
  selected_supplier VARCHAR(128) NOT NULL,
  selected_supplier_name VARCHAR(255) NOT NULL,
  selected_bj VARCHAR(128) NOT NULL,
  hs_code VARCHAR(64) NULL,
  remarks VARCHAR(512) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_so_item_uid (item_uid),
  KEY idx_so_items_so (sales_order_id),
  CONSTRAINT fk_so_items_so FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id)
    ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== Finance: Accounts receivable + payments ==========
CREATE TABLE IF NOT EXISTS accounts_receivable (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ar_uid VARCHAR(64) NOT NULL,           -- ar.id in app (ar-...)
  ar_number VARCHAR(128) NOT NULL,       -- YS-{REGION}-...
  order_number VARCHAR(128) NOT NULL,
  quotation_number VARCHAR(128) NULL,
  contract_number VARCHAR(128) NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  region VARCHAR(64) NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  total_amount DECIMAL(18,2) NOT NULL,
  paid_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  remaining_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL,
  status VARCHAR(32) NOT NULL,           -- pending/partially_paid/paid/overdue/proof_uploaded
  payment_terms VARCHAR(512) NOT NULL,
  products JSON NULL,                    -- snapshot list
  payment_history JSON NULL,             -- snapshot list
  deposit_proof JSON NULL,
  balance_proof JSON NULL,
  created_at_ms BIGINT UNSIGNED NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  notes TEXT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ar_uid (ar_uid),
  UNIQUE KEY uq_ar_number (ar_number),
  KEY idx_ar_order (order_number),
  KEY idx_ar_customer (customer_email),
  KEY idx_ar_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_records (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  payment_uid VARCHAR(64) NOT NULL,       -- payment.id in app (payment-...)
  payment_number VARCHAR(128) NOT NULL,   -- SK-{REGION}-...
  receivable_id BIGINT UNSIGNED NOT NULL,
  receivable_number VARCHAR(128) NOT NULL,
  order_number VARCHAR(128) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  currency VARCHAR(8) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(32) NOT NULL,    -- T/T, L/C, ...
  bank_reference VARCHAR(128) NOT NULL,
  bank_name VARCHAR(128) NULL,
  received_by VARCHAR(255) NOT NULL,
  notes TEXT NULL,
  proof_url VARCHAR(1024) NULL,
  proof_file_name VARCHAR(255) NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'confirmed', -- pending/confirmed/rejected
  region VARCHAR(64) NOT NULL,
  created_at_ms BIGINT UNSIGNED NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  confirmed_at_ms BIGINT UNSIGNED NULL,
  confirmed_by VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payment_uid (payment_uid),
  UNIQUE KEY uq_payment_number (payment_number),
  KEY idx_payment_receivable (receivable_id),
  KEY idx_payment_order (order_number),
  CONSTRAINT fk_payment_receivable FOREIGN KEY (receivable_id) REFERENCES accounts_receivable(id)
    ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== Procurement: Purchase Requirement (QR) ==========
CREATE TABLE IF NOT EXISTS purchase_requirements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  requirement_uid VARCHAR(128) NOT NULL,  -- PurchaseRequirement.id in app
  requirement_no VARCHAR(128) NOT NULL,   -- QR-...
  source VARCHAR(64) NOT NULL,
  source_ref VARCHAR(128) NULL,
  source_inquiry_number VARCHAR(128) NULL,
  required_date DATE NOT NULL,
  urgency VARCHAR(16) NOT NULL,           -- high/medium/low
  status VARCHAR(32) NOT NULL,            -- pending/partial/processing/completed
  created_by VARCHAR(255) NOT NULL,
  created_date DATE NOT NULL,
  special_requirements TEXT NULL,
  region VARCHAR(64) NULL,
  sales_order_no VARCHAR(128) NULL,
  customer_snapshot JSON NULL,            -- customer fields (restricted by app permissions)
  purchaser_feedback JSON NULL,
  pushed_to_quotation TINYINT(1) NOT NULL DEFAULT 0,
  pushed_to_quotation_date DATE NULL,
  pushed_by VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pr_uid (requirement_uid),
  UNIQUE KEY uq_pr_no (requirement_no),
  KEY idx_pr_status (status),
  KEY idx_pr_region (region)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS purchase_requirement_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  purchase_requirement_id BIGINT UNSIGNED NOT NULL,
  item_uid VARCHAR(128) NOT NULL, -- PurchaseRequirementItem.id in app
  product_name VARCHAR(255) NOT NULL,
  model_no VARCHAR(128) NOT NULL,
  specification VARCHAR(512) NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 0,
  unit VARCHAR(32) NOT NULL,
  hs_code VARCHAR(64) NULL,
  packing_requirement VARCHAR(255) NULL,
  target_price DECIMAL(18,4) NULL,
  target_currency VARCHAR(8) NULL,
  image_url VARCHAR(512) NULL,
  remarks VARCHAR(512) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pr_item_uid (item_uid),
  KEY idx_pr_items_pr (purchase_requirement_id),
  CONSTRAINT fk_pr_items_pr FOREIGN KEY (purchase_requirement_id) REFERENCES purchase_requirements(id)
    ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== Supplier RFQ (RFQContext) ==========
CREATE TABLE IF NOT EXISTS supplier_rfqs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  rfq_uid VARCHAR(128) NOT NULL,       -- RFQ.id in app
  rfq_number VARCHAR(128) NOT NULL,    -- RFQ.rfqNumber (compat)
  supplier_rfq_no VARCHAR(128) NULL,   -- XJ-...
  supplier_quotation_no VARCHAR(128) NULL, -- BJ-...
  requirement_no VARCHAR(128) NULL,    -- QR-...
  source_inquiry_id VARCHAR(128) NULL,
  source_inquiry_number VARCHAR(128) NULL,
  customer_name VARCHAR(255) NULL,
  customer_region VARCHAR(64) NULL,
  supplier_code VARCHAR(64) NOT NULL,
  supplier_name VARCHAR(255) NOT NULL,
  supplier_contact VARCHAR(128) NULL,
  supplier_email VARCHAR(255) NOT NULL,
  expected_date DATE NOT NULL,
  quotation_deadline DATE NULL,
  status VARCHAR(32) NOT NULL,         -- pending/quoted/accepted/rejected/expired
  remarks TEXT NULL,
  created_by VARCHAR(255) NOT NULL,
  created_date DATE NOT NULL,
  updated_date DATETIME(3) NULL,
  document_data JSON NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_supplier_rfqs_uid (rfq_uid),
  KEY idx_supplier_rfqs_supplier (supplier_code),
  KEY idx_supplier_rfqs_status (status),
  KEY idx_supplier_rfqs_requirement (requirement_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS supplier_rfq_products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  supplier_rfq_id BIGINT UNSIGNED NOT NULL,
  product_uid VARCHAR(128) NOT NULL, -- RFQProduct.id
  product_name VARCHAR(255) NOT NULL,
  model_no VARCHAR(128) NOT NULL,
  specification VARCHAR(512) NULL,
  quantity INT UNSIGNED NOT NULL,
  unit VARCHAR(32) NOT NULL,
  target_price DECIMAL(18,4) NULL,
  currency VARCHAR(8) NOT NULL,
  PRIMARY KEY (id),
  -- Allow the same product_uid to appear in different RFQs (different suppliers),
  -- but prevent duplicates within the same RFQ.
  UNIQUE KEY uq_supplier_rfq_product_uid (supplier_rfq_id, product_uid),
  KEY idx_supplier_rfq_products_rfq (supplier_rfq_id),
  CONSTRAINT fk_supplier_rfq_products_rfq FOREIGN KEY (supplier_rfq_id) REFERENCES supplier_rfqs(id)
    ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS supplier_rfq_quotes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  supplier_rfq_id BIGINT UNSIGNED NOT NULL,
  supplier_code VARCHAR(64) NOT NULL,
  supplier_name VARCHAR(255) NOT NULL,
  quoted_date DATE NOT NULL,
  quoted_price DECIMAL(18,4) NOT NULL,
  currency VARCHAR(8) NOT NULL,
  lead_time INT UNSIGNED NOT NULL,
  moq INT UNSIGNED NOT NULL,
  validity_days INT UNSIGNED NOT NULL,
  payment_terms VARCHAR(512) NOT NULL,
  remarks VARCHAR(1024) NULL,
  quotation_no VARCHAR(128) NULL,
  quote_data JSON NULL,
  PRIMARY KEY (id),
  KEY idx_supplier_rfq_quotes_rfq (supplier_rfq_id),
  KEY idx_supplier_rfq_quotes_quotation_no (quotation_no),
  CONSTRAINT fk_supplier_rfq_quotes_rfq FOREIGN KEY (supplier_rfq_id) REFERENCES supplier_rfqs(id)
    ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== Purchase Orders to suppliers (PurchaseOrderContext) ==========
CREATE TABLE IF NOT EXISTS purchase_orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  po_uid VARCHAR(128) NOT NULL,        -- PurchaseOrder.id in app
  po_number VARCHAR(128) NOT NULL,
  requirement_no VARCHAR(128) NULL,
  source_ref VARCHAR(128) NULL,
  source_so_number VARCHAR(128) NULL,
  order_group VARCHAR(128) NULL,
  is_part_of_group TINYINT(1) NULL,
  group_total_orders INT UNSIGNED NULL,
  group_note VARCHAR(512) NULL,
  rfq_uid VARCHAR(128) NULL,
  rfq_number VARCHAR(128) NULL,
  selected_quote JSON NULL,
  supplier_name VARCHAR(255) NOT NULL,
  supplier_code VARCHAR(64) NOT NULL,
  supplier_contact VARCHAR(128) NULL,
  supplier_phone VARCHAR(64) NULL,
  supplier_address VARCHAR(512) NULL,
  region VARCHAR(64) NULL,
  total_amount DECIMAL(18,2) NOT NULL,
  currency VARCHAR(8) NOT NULL,
  payment_terms VARCHAR(512) NOT NULL,
  delivery_terms VARCHAR(512) NOT NULL,
  order_date DATE NOT NULL,
  expected_date DATE NOT NULL,
  actual_date DATE NULL,
  status VARCHAR(32) NOT NULL,          -- pending/confirmed/producing/shipped/completed/cancelled
  payment_status VARCHAR(16) NOT NULL,  -- unpaid/partial/paid
  remarks TEXT NULL,
  created_by VARCHAR(255) NOT NULL,
  created_date DATE NOT NULL,
  updated_date DATETIME(3) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_purchase_orders_uid (po_uid),
  UNIQUE KEY uq_purchase_orders_number (po_number),
  KEY idx_purchase_orders_supplier (supplier_code),
  KEY idx_purchase_orders_status (status),
  KEY idx_purchase_orders_requirement (requirement_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  purchase_order_id BIGINT UNSIGNED NOT NULL,
  item_uid VARCHAR(128) NOT NULL, -- PurchaseOrderItem.id in app
  product_name VARCHAR(255) NOT NULL,
  model_no VARCHAR(128) NOT NULL,
  specification VARCHAR(512) NULL,
  quantity INT UNSIGNED NOT NULL,
  unit VARCHAR(32) NOT NULL,
  unit_price DECIMAL(18,4) NOT NULL,
  currency VARCHAR(8) NOT NULL,
  subtotal DECIMAL(18,2) NOT NULL,
  hs_code VARCHAR(64) NULL,
  packing_requirement VARCHAR(255) NULL,
  remarks VARCHAR(512) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_po_item_uid (item_uid),
  KEY idx_po_items_po (purchase_order_id),
  CONSTRAINT fk_po_items_po FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id)
    ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== Approvals (ApprovalContext) ==========
CREATE TABLE IF NOT EXISTS approval_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  approval_uid VARCHAR(128) NOT NULL, -- APR-...
  type VARCHAR(32) NOT NULL,          -- quotation/order/payment/contract/sales_contract/price_change
  related_document_id VARCHAR(128) NOT NULL,
  related_document_type VARCHAR(128) NOT NULL,
  related_document JSON NOT NULL,
  submitted_by VARCHAR(255) NOT NULL,
  submitted_by_name VARCHAR(128) NOT NULL,
  submitted_by_role VARCHAR(64) NOT NULL,
  submitted_at DATETIME(3) NOT NULL,
  region VARCHAR(64) NOT NULL,
  current_approver VARCHAR(255) NOT NULL,
  current_approver_role VARCHAR(64) NOT NULL,
  next_approver VARCHAR(255) NULL,
  next_approver_role VARCHAR(64) NULL,
  requires_director_approval TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(16) NOT NULL,        -- pending/approved/rejected/cancelled/forwarded
  urgency VARCHAR(16) NOT NULL DEFAULT 'normal',
  amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT 'USD',
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  product_summary VARCHAR(512) NOT NULL,
  deadline DATETIME(3) NOT NULL,
  expires_in INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_approval_uid (approval_uid),
  KEY idx_approval_current (current_approver, status),
  KEY idx_approval_doc (related_document_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS approval_history_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  approval_request_id BIGINT UNSIGNED NOT NULL,
  history_uid VARCHAR(128) NOT NULL,
  approver VARCHAR(255) NOT NULL,
  approver_name VARCHAR(128) NOT NULL,
  approver_role VARCHAR(64) NOT NULL,
  action VARCHAR(16) NOT NULL,         -- submitted/approved/rejected/forwarded/cancelled
  comment TEXT NOT NULL,
  timestamp DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_approval_hist_uid (history_uid),
  KEY idx_approval_hist_req (approval_request_id),
  CONSTRAINT fk_approval_hist_req FOREIGN KEY (approval_request_id) REFERENCES approval_requests(id)
    ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
