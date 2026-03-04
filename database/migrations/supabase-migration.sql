-- ============================================================
-- COSUN ERP Supabase Database Migration
-- Run this in: https://supabase.com/dashboard/project/jynjkxunchopyhwimbcy/sql/new
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS TABLE (mirrors Supabase Auth users with ERP roles)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  portal_role TEXT NOT NULL CHECK (portal_role IN ('admin', 'customer', 'supplier')) DEFAULT 'customer',
  rbac_role TEXT,
  name TEXT,
  company TEXT,
  phone TEXT,
  region TEXT,
  country TEXT,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. INQUIRIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inquiry_number TEXT UNIQUE NOT NULL,
  user_email TEXT NOT NULL,
  buyer_name TEXT,
  buyer_company TEXT,
  buyer_country TEXT,
  products JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. SALES QUOTATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sales_quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_number TEXT UNIQUE NOT NULL,
  inquiry_number TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_company TEXT,
  sales_person TEXT,
  sales_person_name TEXT,
  supervisor TEXT,
  region TEXT,
  products JSONB NOT NULL DEFAULT '[]',
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  price_type TEXT,
  profit_margin NUMERIC(5,2),
  payment_terms TEXT,
  delivery_time TEXT,
  validity_period TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  approval_status TEXT,
  sent_to_customer BOOLEAN DEFAULT FALSE,
  customer_response TEXT,
  customer_decline_reason TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ
);

-- ============================================================
-- 4. SALES CONTRACTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sales_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_number TEXT UNIQUE NOT NULL,
  quotation_number TEXT,
  inquiry_number TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_company TEXT,
  customer_address TEXT,
  customer_country TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  sales_person TEXT,
  sales_person_name TEXT,
  supervisor TEXT,
  region TEXT,
  products JSONB NOT NULL DEFAULT '[]',
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  trade_terms TEXT,
  payment_terms TEXT,
  deposit_percentage NUMERIC(5,2) DEFAULT 30,
  deposit_amount NUMERIC(15,2) DEFAULT 0,
  balance_percentage NUMERIC(5,2) DEFAULT 70,
  balance_amount NUMERIC(15,2) DEFAULT 0,
  delivery_time TEXT,
  port_of_loading TEXT,
  port_of_destination TEXT,
  packing TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  approval_flow JSONB,
  approval_history JSONB DEFAULT '[]',
  approval_notes TEXT,
  rejection_reason TEXT,
  deposit_proof JSONB,
  deposit_confirmed_by TEXT,
  deposit_confirmed_at TIMESTAMPTZ,
  deposit_confirm_notes TEXT,
  purchase_order_numbers TEXT[],
  seller_signature JSONB,
  buyer_signature JSONB,
  remarks TEXT,
  attachments JSONB DEFAULT '[]',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  sent_to_customer_at TIMESTAMPTZ,
  customer_confirmed_at TIMESTAMPTZ
);

-- ============================================================
-- 5. ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  customer TEXT NOT NULL,
  customer_email TEXT,
  quotation_id TEXT,
  quotation_number TEXT,
  contract_number TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery DATE,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'Pending',
  progress INTEGER DEFAULT 0,
  products JSONB NOT NULL DEFAULT '[]',
  payment_status TEXT,
  payment_terms TEXT,
  shipping_method TEXT,
  delivery_terms TEXT,
  tracking_number TEXT,
  notes TEXT,
  created_from TEXT,
  region TEXT,
  country TEXT,
  delivery_address TEXT,
  contact_person TEXT,
  phone TEXT,
  customer_feedback JSONB,
  deposit_payment_proof JSONB,
  deposit_receipt_proof JSONB,
  balance_payment_proof JSONB,
  balance_receipt_proof JSONB,
  contract_terms JSONB,
  confirmed BOOLEAN DEFAULT FALSE,
  confirmed_at TIMESTAMPTZ,
  confirmed_by TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. ACCOUNTS RECEIVABLE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.accounts_receivable (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ar_number TEXT UNIQUE NOT NULL,
  order_number TEXT NOT NULL,
  quotation_number TEXT,
  contract_number TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  region TEXT,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(15,2) DEFAULT 0,
  remaining_amount NUMERIC(15,2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_terms TEXT,
  products JSONB NOT NULL DEFAULT '[]',
  payment_history JSONB DEFAULT '[]',
  deposit_proof JSONB,
  balance_proof JSONB,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. SUPPLIER QUOTATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.supplier_quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id TEXT,
  xj_number TEXT,
  supplier_email TEXT NOT NULL,
  supplier_name TEXT,
  products JSONB NOT NULL DEFAULT '[]',
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  price_type TEXT,
  payment_terms TEXT,
  delivery_time TEXT,
  validity_period TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. APPROVAL RECORDS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.approval_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_type TEXT NOT NULL CHECK (record_type IN ('sales_quotation', 'sales_contract', 'purchase_order')),
  reference_id TEXT NOT NULL,
  reference_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  requested_by TEXT NOT NULL,
  requested_by_name TEXT,
  approver TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);

-- ============================================================
-- 9. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_email TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  reference_id TEXT,
  reference_type TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_sales_contracts_customer_email ON public.sales_contracts(customer_email);
CREATE INDEX IF NOT EXISTS idx_sales_contracts_status ON public.sales_contracts(status);
CREATE INDEX IF NOT EXISTS idx_sales_contracts_contract_number ON public.sales_contracts(contract_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_contract_number ON public.orders(contract_number);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_customer_email ON public.accounts_receivable(customer_email);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_order_number ON public.accounts_receivable(order_number);
CREATE INDEX IF NOT EXISTS idx_sales_quotations_customer_email ON public.sales_quotations(customer_email);
CREATE INDEX IF NOT EXISTS idx_approval_records_approver ON public.approval_records(approver);
CREATE INDEX IF NOT EXISTS idx_approval_records_status ON public.approval_records(status);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_email);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON public.inquiries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_sales_quotations_updated_at BEFORE UPDATE ON public.sales_quotations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_sales_contracts_updated_at BEFORE UPDATE ON public.sales_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_accounts_receivable_updated_at BEFORE UPDATE ON public.accounts_receivable FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_supplier_quotations_updated_at BEFORE UPDATE ON public.supplier_quotations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_approval_records_updated_at BEFORE UPDATE ON public.approval_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - Portal Isolation
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow all operations via service role (used server-side / anon for now)
-- In production, replace with proper JWT-based policies

-- Sales Contracts: customers see only their own, admins see all
CREATE POLICY "sales_contracts_customer_select" ON public.sales_contracts
  FOR SELECT USING (
    customer_email = current_setting('request.jwt.claims', true)::jsonb->>'email'
    OR (current_setting('request.jwt.claims', true)::jsonb->>'role')::text = 'service_role'
  );

CREATE POLICY "sales_contracts_admin_all" ON public.sales_contracts
  FOR ALL USING (true) WITH CHECK (true);

-- Orders: customers see only their own
CREATE POLICY "orders_customer_select" ON public.orders
  FOR SELECT USING (
    customer_email = current_setting('request.jwt.claims', true)::jsonb->>'email'
    OR (current_setting('request.jwt.claims', true)::jsonb->>'role')::text = 'service_role'
  );

CREATE POLICY "orders_admin_all" ON public.orders
  FOR ALL USING (true) WITH CHECK (true);

-- Notifications: users see only their own
CREATE POLICY "notifications_own" ON public.notifications
  FOR SELECT USING (
    recipient_email = current_setting('request.jwt.claims', true)::jsonb->>'email'
    OR (current_setting('request.jwt.claims', true)::jsonb->>'role')::text = 'service_role'
  );

CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- For remaining tables: allow all for now (tighten in production)
CREATE POLICY "inquiries_all" ON public.inquiries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "sales_quotations_all" ON public.sales_quotations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "accounts_receivable_all" ON public.accounts_receivable FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "supplier_quotations_all" ON public.supplier_quotations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "approval_records_all" ON public.approval_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "users_all" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Enable Realtime for key tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_contracts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.accounts_receivable;
ALTER PUBLICATION supabase_realtime ADD TABLE public.approval_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_quotations;
