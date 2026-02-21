-- Seed data (demo accounts + sample orders) for MySQL 8.0
-- Run after schema.sql

SET NAMES utf8mb4;
SET time_zone = '+00:00';

USE cosun_b2b;

SET FOREIGN_KEY_CHECKS = 0;

-- ========== Organizations ==========
INSERT INTO organizations (org_type, company_id, name, name_en, country, region, currency, status, level)
VALUES
  ('internal', 'cosun001', 'COSUN Building Materials', 'COSUN Building Materials', 'China', 'all', 'CNY', 'active', 'A')
ON DUPLICATE KEY UPDATE
  name=VALUES(name), name_en=VALUES(name_en), country=VALUES(country), region=VALUES(region), currency=VALUES(currency), status=VALUES(status), level=VALUES(level);

-- Demo customer orgs (3-portal test accounts from Login quick buttons)
INSERT INTO organizations (org_type, company_id, name, country, region, currency, status, level, email)
VALUES
  ('customer', 'abc_test_001', 'ABC Building Supplies', 'USA', 'North America', 'USD', 'active', 'A', 'abc.customer@test.com'),
  ('customer', 'brasil_test_001', 'Brasil Construction Co.', 'Brazil', 'South America', 'USD', 'active', 'B', 'brasil.customer@test.com'),
  ('customer', 'europa_test_001', 'Europa Trading GmbH', 'Germany', 'Europe & Africa', 'EUR', 'active', 'A', 'europa.customer@test.com')
ON DUPLICATE KEY UPDATE
  name=VALUES(name), country=VALUES(country), region=VALUES(region), currency=VALUES(currency), status=VALUES(status), level=VALUES(level), email=VALUES(email);

-- Demo supplier orgs (3-portal test suppliers)
INSERT INTO organizations (org_type, company_id, name, country, region, currency, status, level, email)
VALUES
  ('supplier', 'gd_supplier_001', '广东五金制造厂', 'China', 'Guangdong', 'CNY', 'active', 'A', 'gd.supplier@test.com'),
  ('supplier', 'zj_supplier_001', '浙江建材集团', 'China', 'Zhejiang', 'CNY', 'active', 'A', 'zj.supplier@test.com')
ON DUPLICATE KEY UPDATE
  name=VALUES(name), country=VALUES(country), region=VALUES(region), currency=VALUES(currency), status=VALUES(status), level=VALUES(level), email=VALUES(email);

-- Extra customer orgs for OrderContext demo orders
INSERT INTO organizations (org_type, company_id, name, country, region, currency, status, level, email)
VALUES
  ('customer', 'buildright_001', 'BuildRight Supply Co.', 'United States', 'North America', 'USD', 'active', 'A', 'buildright@example.com'),
  ('customer', 'eurobuilders_001', 'EuroBuilders GmbH', 'Germany', 'Europe & Africa', 'EUR', 'active', 'A', 'eurobuilders@example.com'),
  ('customer', 'latinhardware_001', 'Latin Hardware Ltda', 'Brazil', 'South America', 'USD', 'active', 'B', 'latinhardware@example.com'),
  ('customer', 'megahardware_001', 'MegaHardware Inc.', 'Canada', 'North America', 'USD', 'active', 'A', 'megahardware@example.com'),
  ('customer', 'frenchbuild_001', 'FrenchBuild SARL', 'France', 'Europe & Africa', 'EUR', 'active', 'B', 'frenchbuild@example.com')
ON DUPLICATE KEY UPDATE
  name=VALUES(name), country=VALUES(country), region=VALUES(region), currency=VALUES(currency), status=VALUES(status), level=VALUES(level), email=VALUES(email);

-- ========== Users ==========
SET @org_cosun := (SELECT id FROM organizations WHERE company_id='cosun001' LIMIT 1);
SET @org_abc   := (SELECT id FROM organizations WHERE company_id='abc_test_001' LIMIT 1);
SET @org_br    := (SELECT id FROM organizations WHERE company_id='brasil_test_001' LIMIT 1);
SET @org_eu    := (SELECT id FROM organizations WHERE company_id='europa_test_001' LIMIT 1);
SET @org_gd    := (SELECT id FROM organizations WHERE company_id='gd_supplier_001' LIMIT 1);
SET @org_zj    := (SELECT id FROM organizations WHERE company_id='zj_supplier_001' LIMIT 1);

-- Internal staff (subset aligned with quick login)
INSERT INTO users (user_code, username, email, password, password_plain, portal_role, rbac_role, company_user_role, org_id, region, status, registered_date)
VALUES
  ('ceo001',  'ceo',            'ceo@cosun.com',            'cosun2024', 'cosun2024', 'admin', 'CEO',             'company_admin', @org_cosun, 'all',  'active', '2024-01-15'),
  ('admin002','cfo',            'cfo@cosun.com',            'cosun2024', 'cosun2024', 'admin', 'CFO',             'standard_user', @org_cosun, 'all',  'active', '2024-01-15'),
  ('admin003','sales.director', 'sales.director@cosun.com', 'cosun2024', 'cosun2024', 'admin', 'Sales_Director',  'standard_user', @org_cosun, 'all',  'active', '2024-01-15'),
  ('admin004','john.smith',     'john.smith@cosun.com',     'cosun2024', 'cosun2024', 'admin', 'Regional_Manager','standard_user', @org_cosun, 'NA',   'active', '2024-01-15'),
  ('admin005','carlos.silva',   'carlos.silva@cosun.com',   'cosun2024', 'cosun2024', 'admin', 'Regional_Manager','standard_user', @org_cosun, 'SA',   'active', '2024-01-15'),
  ('admin006','hans.mueller',   'hans.mueller@cosun.com',   'cosun2024', 'cosun2024', 'admin', 'Regional_Manager','standard_user', @org_cosun, 'EMEA', 'active', '2024-01-15'),
  ('sales1',  'zhangwei',       'zhangwei@cosun.com',       'cosun123',  'cosun123',  'admin', 'Sales_Rep',       'standard_user', @org_cosun, 'NA',   'active', '2024-01-15'),
  ('sales2',  'lifang',         'lifang@cosun.com',         'cosun2024', 'cosun2024', 'admin', 'Sales_Rep',       'standard_user', @org_cosun, 'SA',   'active', '2024-01-15'),
  ('sales3',  'wangfang',       'wangfang@cosun.com',       'cosun2024', 'cosun2024', 'admin', 'Sales_Rep',       'standard_user', @org_cosun, 'EMEA', 'active', '2024-01-15'),
  ('admin010','finance',        'finance@cosun.com',        'cosun2024', 'cosun2024', 'admin', 'Finance',         'standard_user', @org_cosun, 'all',  'active', '2024-01-15'),
  ('admin011','procurement',    'procurement@cosun.com',    'cosun2024', 'cosun2024', 'admin', 'Procurement',     'standard_user', @org_cosun, 'all',  'active', '2024-01-15'),
  ('admin001','admin',          'admin@cosun.com',          'admin123',  'admin123',  'admin', 'Admin',           'standard_user', @org_cosun, 'all',  'active', '2024-01-15'),
  ('admin012','marketing',      'marketing@cosun.com',      'cosun2024', 'cosun2024', 'admin', 'Marketing_Ops',   'standard_user', @org_cosun, 'all',  'active', '2024-01-15')
ON DUPLICATE KEY UPDATE
  password=VALUES(password), password_plain=VALUES(password_plain), portal_role=VALUES(portal_role), rbac_role=VALUES(rbac_role), org_id=VALUES(org_id), region=VALUES(region), status=VALUES(status);

-- Test customer logins (Login.tsx quick buttons use these)
INSERT INTO users (user_code, username, email, password, password_plain, portal_role, rbac_role, company_user_role, org_id, region, status, registered_date)
VALUES
  ('customer_test_na', 'abc.customer',   'abc.customer@test.com',   'customer123', 'customer123', 'customer', 'Customer', 'company_admin', @org_abc, 'NA', 'active', '2024-11-01'),
  ('customer_test_sa', 'brasil.customer','brasil.customer@test.com','customer123', 'customer123', 'customer', 'Customer', 'company_admin', @org_br,  'SA', 'active', '2024-11-01'),
  ('customer_test_ea', 'europa.customer','europa.customer@test.com','customer123', 'customer123', 'customer', 'Customer', 'company_admin', @org_eu,  'EA', 'active', '2024-11-01')
ON DUPLICATE KEY UPDATE
  password=VALUES(password), password_plain=VALUES(password_plain), org_id=VALUES(org_id), region=VALUES(region), status=VALUES(status);

-- Test supplier logins
INSERT INTO users (user_code, username, email, password, password_plain, portal_role, rbac_role, company_user_role, org_id, status, registered_date)
VALUES
  ('supplier_test_gd', 'gd.supplier', 'gd.supplier@test.com', 'supplier123', 'supplier123', 'supplier', 'Supplier', 'company_admin', @org_gd, 'active', '2024-11-01'),
  ('supplier_test_zj', 'zj.supplier', 'zj.supplier@test.com', 'supplier123', 'supplier123', 'supplier', 'Supplier', 'company_admin', @org_zj, 'active', '2024-11-01')
ON DUPLICATE KEY UPDATE
  password=VALUES(password), password_plain=VALUES(password_plain), org_id=VALUES(org_id), status=VALUES(status);

-- Extra customer users for demo orders
INSERT INTO users (user_code, username, email, password, password_plain, portal_role, rbac_role, company_user_role, org_id, status, registered_date)
SELECT
  CONCAT('cust_', REPLACE(o.company_id,'-','_')) AS user_code,
  LOWER(REPLACE(REPLACE(o.name,' ',''),'.','')) AS username,
  o.email,
  'customer123' AS password,
  'customer123' AS password_plain,
  'customer' AS portal_role,
  'Customer' AS rbac_role,
  'company_admin' AS company_user_role,
  o.id AS org_id,
  'active' AS status,
  '2025-01-01' AS registered_date
FROM organizations o
WHERE o.org_type='customer'
  AND o.company_id IN ('buildright_001','eurobuilders_001','latinhardware_001','megahardware_001','frenchbuild_001');

-- ========== Sample orders (from OrderContext.generateTestOrders) ==========

-- Order 1
INSERT INTO customer_orders (
  order_uid, order_number, customer_name, customer_email,
  quotation_id, quotation_number, order_date, expected_delivery,
  total_amount, currency, status, progress,
  payment_status, payment_terms, shipping_method, delivery_terms,
  notes, created_from, created_at, updated_at,
  confirmed, confirmed_at, confirmed_by, confirmed_date,
  region, country, delivery_address, contact_person, phone,
  contract_terms
)
VALUES (
  'SC-NA-251220-0001','SC-NA-251220-0001','BuildRight Supply Co.','buildright@example.com',
  'QT-NA-251210-0001','QT-NA-251210-0001','2025-12-20','2026-02-20',
  150000,'USD','Payment Proof Uploaded',0,
  'Awaiting Deposit Confirmation','30% T/T Deposit, 70% Balance Before Shipment','Sea Freight','FOB Fuzhou, China',
  'Deposit payment proof uploaded - awaiting finance confirmation','quotation','2025-12-20 08:00:00.000','2025-12-20 10:30:00.000',
  1,'2025-12-20 08:30:00.000','Admin','2025-12-20',
  'NA','United States','1234 Industrial Pkwy, Dallas, TX 75201, USA','Mike Johnson','+1-214-555-0123',
  JSON_OBJECT(
    'paymentTerms','30% T/T Deposit, 70% Balance Before Shipment',
    'deliveryTerms','FOB Fuzhou, China',
    'shippingMethod','Sea Freight - 40HQ Container',
    'expectedDelivery','2026-02-20',
    'qualityStandards','All products shall comply with UL, CE, and RoHS standards.',
    'warrantyTerms','24-month warranty from date of shipment',
    'remarks','Standard delivery schedule'
  )
);

SET @order1 := (SELECT id FROM customer_orders WHERE order_number='SC-NA-251220-0001' LIMIT 1);
INSERT INTO customer_order_items (order_id, name, quantity, unit_price, total_price, specs, produced) VALUES
  (@order1,'Industrial Circuit Breaker 250A',200,185,37000,'250A, 4-Pole, UL Listed',0),
  (@order1,'Smart Door Lock System',400,125,50000,'WiFi + Bluetooth, Fingerprint + PIN',0),
  (@order1,'Premium Bathroom Faucet Set',300,95,28500,'Brushed Nickel, Water-saving Technology',0),
  (@order1,'Safety Work Gloves Premium',2000,17.25,34500,'Cut Level 5, Touchscreen Compatible',0);
INSERT INTO customer_order_payment_proofs (order_id, proof_type, uploaded_at, uploaded_by, file_url, file_name, amount, currency, notes, status)
VALUES
  (@order1,'deposit_payment','2025-12-20 10:20:00.000','buildright@example.com','https://example.com/deposit-proof-sc-na-251220-0001.pdf','deposit-proof-buildright-45000-usd.pdf',45000,'USD','Wire Transfer | Ref: BR-NA-251220-001 | Bank: Chase | Date: 2025-12-20','pending');

-- Order 2
INSERT INTO customer_orders (
  order_uid, order_number, customer_name, customer_email,
  quotation_id, quotation_number, order_date, expected_delivery,
  total_amount, currency, status, progress,
  payment_status, payment_terms, shipping_method, delivery_terms,
  notes, created_from, created_at, updated_at,
  confirmed, confirmed_at, confirmed_by, confirmed_date,
  region, country, delivery_address, contact_person, phone,
  contract_terms
)
VALUES (
  'SC-EU-251215-0002','SC-EU-251215-0002','EuroBuilders GmbH','eurobuilders@example.com',
  'QT-EU-251208-0002','QT-EU-251208-0002','2025-12-15','2026-03-15',
  220000,'EUR','Deposit Received',10,
  'Deposit Confirmed','30% T/T Deposit, 70% Balance Before Shipment','Sea Freight','CIF Hamburg, Germany',
  'Deposit confirmed by finance - production started','quotation','2025-12-15 09:00:00.000','2025-12-16 14:00:00.000',
  1,'2025-12-15 10:00:00.000','Admin','2025-12-15',
  'EU','Germany','Industriestrasse 45, 20095 Hamburg, Germany','Hans Mueller','+49-40-555-0234',
  JSON_OBJECT(
    'paymentTerms','30% T/T Deposit, 70% Balance Before Shipment',
    'deliveryTerms','CIF Hamburg, Germany',
    'shippingMethod','Sea Freight - 20FT Container',
    'expectedDelivery','2026-03-15',
    'qualityStandards','CE certified, EN standards compliance required',
    'warrantyTerms','24-month warranty from date of shipment',
    'remarks','Production in progress - 10% completed'
  )
);
SET @order2 := (SELECT id FROM customer_orders WHERE order_number='SC-EU-251215-0002' LIMIT 1);
INSERT INTO customer_order_items (order_id, name, quantity, unit_price, total_price, specs, produced) VALUES
  (@order2,'Heavy Duty Door Hinges',5000,12,60000,'Stainless Steel, Load 200kg',500),
  (@order2,'Commercial Door Closer',1000,85,85000,'Hydraulic, Fire-rated',100),
  (@order2,'High-Security Padlocks',3000,25,75000,'Hardened Steel, Pick-resistant',300);
INSERT INTO customer_order_payment_proofs (order_id, proof_type, uploaded_at, uploaded_by, file_url, file_name, amount, currency, notes, status, confirmed_at, confirmed_by)
VALUES
  (@order2,'deposit_payment','2025-12-15 12:00:00.000','eurobuilders@example.com','https://example.com/deposit-proof-sc-eu-251215-0002.pdf','deposit-proof-eurobuilders-66000-eur.pdf',66000,'EUR','SEPA Transfer | Ref: EB-EU-251215-002 | Bank: Deutsche Bank | Date: 2025-12-15','confirmed','2025-12-15 15:30:00.000','finance@gaoshengda.com');
INSERT INTO customer_order_payment_proofs (order_id, proof_type, uploaded_at, uploaded_by, file_url, file_name, actual_amount, currency, receipt_date, bank_reference, notes)
VALUES
  (@order2,'deposit_receipt','2025-12-16 09:00:00.000','finance@gaoshengda.com','https://example.com/receipt-proof-sc-eu-251215-0002.pdf','bank-receipt-eurobuilders-66000-eur.pdf',66000,'EUR','2025-12-15','20251215-ICBC-EU-654321','Received via ICBC Frankfurt branch | All documents verified');

-- Order 3
INSERT INTO customer_orders (
  order_uid, order_number, customer_name, customer_email,
  quotation_id, quotation_number, order_date, expected_delivery,
  total_amount, currency, status, progress,
  payment_status, payment_terms, shipping_method, delivery_terms,
  notes, created_from, created_at, updated_at,
  confirmed, confirmed_at, confirmed_by, confirmed_date,
  region, country, delivery_address, contact_person, phone
)
VALUES (
  'SC-SA-251210-0003','SC-SA-251210-0003','Latin Hardware Ltda','latinhardware@example.com',
  'QT-SA-251201-0003','QT-SA-251201-0003','2025-12-10','2026-02-28',
  180000,'USD','In Production',85,
  'Balance Payment Uploaded','30% T/T Deposit, 70% Balance Before Shipment','Sea Freight','FOB Fuzhou, China',
  'Production 85% complete - Balance payment uploaded, awaiting confirmation','quotation','2025-12-10 08:00:00.000','2025-12-29 16:00:00.000',
  1,'2025-12-10 09:00:00.000','Admin','2025-12-10',
  'SA','Brazil','Av. Paulista 1000, São Paulo, SP 01310-100, Brazil','Carlos Silva','+55-11-3555-0345'
);
SET @order3 := (SELECT id FROM customer_orders WHERE order_number='SC-SA-251210-0003' LIMIT 1);
INSERT INTO customer_order_items (order_id, name, quantity, unit_price, total_price, specs, produced) VALUES
  (@order3,'Electrical Junction Boxes',8000,6.5,52000,'IP65 rated, UV resistant',6800),
  (@order3,'Wall Outlet Sockets',10000,3.2,32000,'Universal, Grounded',8500),
  (@order3,'LED Ceiling Lights',2000,48,96000,'36W, 4000K, Dimmable',1700);
INSERT INTO customer_order_payment_proofs (order_id, proof_type, uploaded_at, uploaded_by, file_url, file_name, amount, currency, notes, status, confirmed_at, confirmed_by)
VALUES
  (@order3,'deposit_payment','2025-12-10 14:00:00.000','latinhardware@example.com','https://example.com/deposit-proof-sc-sa-251210-0003.pdf','deposit-proof-latinhardware-54000-usd.pdf',54000,'USD','Wire Transfer | Ref: LH-SA-251210-003 | Bank: Banco do Brasil | Date: 2025-12-10','confirmed','2025-12-11 10:00:00.000','finance@gaoshengda.com');
INSERT INTO customer_order_payment_proofs (order_id, proof_type, uploaded_at, uploaded_by, file_url, file_name, actual_amount, currency, receipt_date, bank_reference, notes)
VALUES
  (@order3,'deposit_receipt','2025-12-11 11:00:00.000','finance@gaoshengda.com','https://example.com/receipt-proof-sc-sa-251210-0003-deposit.pdf','bank-receipt-latinhardware-54000-usd-deposit.pdf',54000,'USD','2025-12-10','20251210-BOC-SA-789012','Received via Bank of China | Verified and confirmed');
INSERT INTO customer_order_payment_proofs (order_id, proof_type, uploaded_at, uploaded_by, file_url, file_name, amount, currency, notes, status)
VALUES
  (@order3,'balance_payment','2025-12-29 15:45:00.000','latinhardware@example.com','https://example.com/balance-proof-sc-sa-251210-0003.pdf','balance-proof-latinhardware-126000-usd.pdf',126000,'USD','Wire Transfer | Ref: LH-SA-251229-BALANCE | Bank: Banco do Brasil | Date: 2025-12-29','pending');

-- Order 4
INSERT INTO customer_orders (
  order_uid, order_number, customer_name, customer_email,
  quotation_id, quotation_number, order_date, expected_delivery,
  total_amount, currency, status, progress,
  payment_status, payment_terms, shipping_method, delivery_terms,
  notes, created_from, created_at, updated_at,
  confirmed, confirmed_at, confirmed_by, confirmed_date,
  region, country, delivery_address, contact_person, phone
)
VALUES (
  'SC-NA-251205-0004','SC-NA-251205-0004','MegaHardware Inc.','megahardware@example.com',
  'QT-NA-251128-0004','QT-NA-251128-0004','2025-12-05','2026-02-10',
  280000,'USD','Ready to Ship',100,
  'Fully Paid','30% T/T Deposit, 70% Balance Before Shipment','Sea Freight','FOB Fuzhou, China',
  'All payments confirmed - ready to arrange shipment','quotation','2025-12-05 08:00:00.000','2025-12-30 10:00:00.000',
  1,'2025-12-05 09:00:00.000','Admin','2025-12-05',
  'NA','Canada','789 Commerce Blvd, Vancouver, BC V5Z 1M9, Canada','Jennifer Lee','+1-604-555-0456'
);
SET @order4 := (SELECT id FROM customer_orders WHERE order_number='SC-NA-251205-0004' LIMIT 1);
INSERT INTO customer_order_items (order_id, name, quantity, unit_price, total_price, specs, produced) VALUES
  (@order4,'Commercial Door Handles',4000,35,140000,'Stainless Steel, ADA Compliant',4000),
  (@order4,'Window Hardware Sets',2500,28,70000,'Casement Window, White Powder Coat',2500),
  (@order4,'Sliding Door Rollers',3500,20,70000,'Heavy Duty, Nylon Wheels',3500);
INSERT INTO customer_order_payment_proofs (order_id, proof_type, uploaded_at, uploaded_by, file_url, file_name, amount, currency, notes, status, confirmed_at, confirmed_by)
VALUES
  (@order4,'deposit_payment','2025-12-05 13:00:00.000','megahardware@example.com','https://example.com/deposit-proof-sc-na-251205-0004.pdf','deposit-proof-megahardware-84000-usd.pdf',84000,'USD','Wire Transfer | Ref: MH-NA-251205-004 | Bank: TD Canada Trust | Date: 2025-12-05','confirmed','2025-12-06 09:00:00.000','finance@gaoshengda.com'),
  (@order4,'balance_payment','2025-12-28 14:00:00.000','megahardware@example.com','https://example.com/balance-proof-sc-na-251205-0004.pdf','balance-proof-megahardware-196000-usd.pdf',196000,'USD','Wire Transfer | Ref: MH-NA-251228-BALANCE | Bank: TD Canada Trust | Date: 2025-12-28','confirmed','2025-12-29 10:00:00.000','finance@gaoshengda.com');
INSERT INTO customer_order_payment_proofs (order_id, proof_type, uploaded_at, uploaded_by, file_url, file_name, actual_amount, currency, receipt_date, bank_reference, notes)
VALUES
  (@order4,'deposit_receipt','2025-12-06 10:00:00.000','finance@gaoshengda.com','https://example.com/receipt-proof-sc-na-251205-0004-deposit.pdf','bank-receipt-megahardware-84000-usd-deposit.pdf',84000,'USD','2025-12-05','20251205-CCB-NA-345678','Received via China Construction Bank | Verified'),
  (@order4,'balance_receipt','2025-12-29 11:00:00.000','finance@gaoshengda.com','https://example.com/receipt-proof-sc-na-251205-0004-balance.pdf','bank-receipt-megahardware-196000-usd-balance.pdf',196000,'USD','2025-12-28','20251228-CCB-NA-901234','Received via China Construction Bank | All payments complete');

-- Order 5
INSERT INTO customer_orders (
  order_uid, order_number, customer_name, customer_email,
  quotation_id, quotation_number, order_date, expected_delivery,
  total_amount, currency, status, progress,
  payment_status, payment_terms, shipping_method, delivery_terms,
  notes, created_from, created_at, updated_at,
  confirmed, confirmed_at, confirmed_by, confirmed_date,
  region, country, delivery_address, contact_person, phone
)
VALUES (
  'SC-EU-251222-0005','SC-EU-251222-0005','FrenchBuild SARL','frenchbuild@example.com',
  'QT-EU-251218-0005','QT-EU-251218-0005','2025-12-22','2026-03-22',
  95000,'EUR','Pending',0,
  'Payment Rejected','30% T/T Deposit, 70% Balance Before Shipment','Sea Freight','CIF Marseille, France',
  'Deposit payment rejected - customer needs to resubmit','quotation','2025-12-22 08:00:00.000','2025-12-23 11:00:00.000',
  1,'2025-12-22 09:00:00.000','Admin','2025-12-22',
  'EU','France','25 Rue de la République, 13001 Marseille, France','Pierre Dupont','+33-4-9155-0567'
);
SET @order5 := (SELECT id FROM customer_orders WHERE order_number='SC-EU-251222-0005' LIMIT 1);
INSERT INTO customer_order_items (order_id, name, quantity, unit_price, total_price, specs, produced) VALUES
  (@order5,'Waterproof LED Fixtures',1500,42,63000,'IP67, Marine Grade',0),
  (@order5,'Industrial Cable Trays',800,40,32000,'Galvanized Steel, Perforated',0);
INSERT INTO customer_order_payment_proofs (order_id, proof_type, uploaded_at, uploaded_by, file_url, file_name, amount, currency, notes, status, confirmed_at, confirmed_by, rejected_reason)
VALUES
  (@order5,'deposit_payment','2025-12-22 15:00:00.000','frenchbuild@example.com','https://example.com/deposit-proof-sc-eu-251222-0005.pdf','deposit-proof-frenchbuild-28500-eur.pdf',28500,'EUR','SEPA Transfer | Ref: FB-EU-251222-005 | Bank: BNP Paribas','rejected','2025-12-23 10:30:00.000','finance@gaoshengda.com','付款凭证金额不符：凭证显示€27,500，应为€28,500。请重新上传正确金额的付款凭证。');

SET FOREIGN_KEY_CHECKS = 1;
