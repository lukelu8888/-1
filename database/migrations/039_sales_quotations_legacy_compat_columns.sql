-- Migration 039: sales_quotations 旧 schema 兼容补齐
-- 目标：修复线上触发器/函数仍引用 legacy 列（如 inquiry_number）时导致的 QT 写入失败

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'sales_quotations'
  ) THEN
    ALTER TABLE public.sales_quotations
      ADD COLUMN IF NOT EXISTS quotation_number TEXT,
      ADD COLUMN IF NOT EXISTS inquiry_number TEXT,
      ADD COLUMN IF NOT EXISTS region TEXT,
      ADD COLUMN IF NOT EXISTS total_amount NUMERIC(15,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS delivery_time TEXT,
      ADD COLUMN IF NOT EXISTS validity_period TEXT,
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
      ADD COLUMN IF NOT EXISTS sent_to_customer BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS sent_to_customer_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS pricing_defaults JSONB;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sales_quotations'
      AND column_name = 'quotation_number'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sales_quotations'
      AND column_name = 'qt_number'
  ) THEN
    EXECUTE $sql$
      UPDATE public.sales_quotations
      SET quotation_number = COALESCE(quotation_number, qt_number)
      WHERE quotation_number IS NULL
        AND qt_number IS NOT NULL
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sales_quotations'
      AND column_name = 'inquiry_number'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sales_quotations'
      AND column_name = 'inq_number'
  ) THEN
    EXECUTE $sql$
      UPDATE public.sales_quotations
      SET inquiry_number = COALESCE(inquiry_number, inq_number)
      WHERE inquiry_number IS NULL
        AND inq_number IS NOT NULL
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sales_quotations'
      AND column_name = 'total_amount'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sales_quotations'
      AND column_name = 'total_price'
  ) THEN
    EXECUTE $sql$
      UPDATE public.sales_quotations
      SET total_amount = COALESCE(total_amount, total_price, 0)
      WHERE total_amount IS NULL
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sales_quotations'
      AND column_name = 'delivery_time'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sales_quotations'
      AND column_name = 'delivery_date'
  ) THEN
    EXECUTE $sql$
      UPDATE public.sales_quotations
      SET delivery_time = COALESCE(delivery_time, delivery_date::text)
      WHERE delivery_time IS NULL
        AND delivery_date IS NOT NULL
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sales_quotations'
      AND column_name = 'validity_period'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sales_quotations'
      AND column_name = 'valid_until'
  ) THEN
    EXECUTE $sql$
      UPDATE public.sales_quotations
      SET validity_period = COALESCE(validity_period, valid_until::text)
      WHERE validity_period IS NULL
        AND valid_until IS NOT NULL
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sales_quotations'
      AND column_name = 'status'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sales_quotations'
      AND column_name = 'approval_status'
  ) THEN
    EXECUTE $sql$
      UPDATE public.sales_quotations
      SET status = COALESCE(NULLIF(status, ''), approval_status, 'draft')
      WHERE status IS NULL
         OR status = ''
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sales_quotations'
      AND column_name = 'sent_to_customer'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sales_quotations'
      AND column_name = 'customer_status'
  ) THEN
    EXECUTE $sql$
      UPDATE public.sales_quotations
      SET sent_to_customer = COALESCE(sent_to_customer, customer_status IS NOT NULL AND customer_status <> 'not_sent')
      WHERE sent_to_customer IS NULL
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sales_quotations'
      AND column_name = 'sent_to_customer_at'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sales_quotations'
      AND column_name = 'sent_at'
  ) THEN
    EXECUTE $sql$
      UPDATE public.sales_quotations
      SET sent_to_customer_at = COALESCE(sent_to_customer_at, sent_at)
      WHERE sent_to_customer_at IS NULL
        AND sent_at IS NOT NULL
    $sql$;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_sales_quotations_quotation_number_compat
  ON public.sales_quotations (quotation_number)
  WHERE quotation_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sales_quotations_inquiry_number_compat
  ON public.sales_quotations (inquiry_number)
  WHERE inquiry_number IS NOT NULL;
