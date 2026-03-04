-- ============================================================
-- P0③: 并发安全的询价单编号生成
-- 表: number_sequences  (存储每个 prefix+region+date 的当前最大序号)
-- 函数: next_inquiry_number(region_code TEXT) → TEXT
--   返回格式: INQ-{REGION}-{YYMMDD}-{0001..9999}
--   并发安全: 使用 INSERT ... ON CONFLICT + RETURNING 原子递增
-- ============================================================

-- 1. 编号序列表
CREATE TABLE IF NOT EXISTS public.number_sequences (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prefix      TEXT NOT NULL,          -- e.g. 'INQ', 'QT', 'SO'
  region_code TEXT NOT NULL,          -- e.g. 'NA', 'SA', 'EA'
  date_key    TEXT NOT NULL,          -- e.g. '260303' (YYMMDD)
  current_seq INT  NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(prefix, region_code, date_key)
);

-- RLS: 允许所有认证用户调用 RPC（实际权限由函数控制）
ALTER TABLE public.number_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_can_read_sequences"
  ON public.number_sequences FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_can_insert_sequences"
  ON public.number_sequences FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_can_update_sequences"
  ON public.number_sequences FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. 并发安全的编号生成函数
CREATE OR REPLACE FUNCTION public.next_inquiry_number(p_region_code TEXT DEFAULT 'NA')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_date_key TEXT;
  v_seq      INT;
  v_result   TEXT;
BEGIN
  -- 当前日期 YYMMDD
  v_date_key := to_char(now(), 'YYMMDD');

  -- 原子递增: INSERT 新行或 UPDATE 已有行，返回递增后的序号
  INSERT INTO public.number_sequences (prefix, region_code, date_key, current_seq)
  VALUES ('INQ', p_region_code, v_date_key, 1)
  ON CONFLICT (prefix, region_code, date_key)
  DO UPDATE SET
    current_seq = public.number_sequences.current_seq + 1,
    updated_at  = now()
  RETURNING current_seq INTO v_seq;

  -- 组装编号: INQ-NA-260303-0001
  v_result := 'INQ-' || p_region_code || '-' || v_date_key || '-' || lpad(v_seq::TEXT, 4, '0');

  RETURN v_result;
END;
$$;

-- 授予认证用户执行权限
GRANT EXECUTE ON FUNCTION public.next_inquiry_number(TEXT) TO authenticated;
