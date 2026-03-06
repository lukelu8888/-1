-- Migration 038: sales_quotations.profit_rate 对齐为百分比语义
-- 兼容历史数据：旧值 0.18 表示 18%，新值统一存 18

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sales_quotations'
      AND column_name = 'profit_rate'
  ) THEN
    ALTER TABLE public.sales_quotations
      ALTER COLUMN profit_rate TYPE NUMERIC(10,4);

    UPDATE public.sales_quotations
    SET profit_rate = ROUND((profit_rate * 100)::numeric, 4)
    WHERE profit_rate IS NOT NULL
      AND ABS(profit_rate) > 0
      AND ABS(profit_rate) < 1;
  END IF;
END
$$;
