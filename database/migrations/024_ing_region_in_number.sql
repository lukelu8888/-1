-- Migration 024: ING 编号格式加入 region 前缀，customer_id 必填（不允许 UNKNOWN）
-- 新格式: ING-{region}-{YYMMDD}-{XXXX}（序号池按 customer_id 隔离）
-- 决策依据: customer scope 同时需要地区标识，customer_id 来自登录用户，不允许为空

-- 1. 更新 next_number_ex：customer scope 格式加 region 前缀，customer_id 为空时抛异常
CREATE OR REPLACE FUNCTION public.next_number_ex(
  p_doc_type    TEXT,
  p_region_code TEXT DEFAULT 'UNKNOWN',
  p_customer_id TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_scope_type  TEXT;
  v_prefix      TEXT;
  v_scope_id    TEXT;
  v_date_key    TEXT;
  v_seq         INT;
  v_result      TEXT;
BEGIN
  SELECT scope_type, prefix
    INTO v_scope_type, v_prefix
    FROM public.document_types
   WHERE doc_type = p_doc_type AND is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown doc_type: %', p_doc_type;
  END IF;

  IF v_scope_type = 'derived' THEN
    RAISE EXCEPTION 'doc_type % is derived, use parent document number', p_doc_type;
  END IF;

  v_date_key := TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYMMDD');

  CASE v_scope_type
    WHEN 'customer' THEN
      IF p_customer_id IS NULL OR p_customer_id = '' THEN
        RAISE EXCEPTION 'customer_id is required for doc_type % (scope=customer)', p_doc_type;
      END IF;
      v_scope_id := p_customer_id || ':' || v_date_key;
    WHEN 'region' THEN
      v_scope_id := COALESCE(p_region_code, 'UNKNOWN') || ':' || v_date_key;
    ELSE
      v_scope_id := 'global:' || v_date_key;
  END CASE;

  INSERT INTO public.number_sequences
    (doc_type, scope_type, scope_id, current_value,
     prefix, region_code, date_key, current_seq)
  VALUES
    (p_doc_type, v_scope_type, v_scope_id, 1,
     v_prefix, NULL, v_date_key, 1)
  ON CONFLICT (doc_type, scope_type, scope_id)
  DO UPDATE SET
    current_value = public.number_sequences.current_value + 1,
    updated_at    = now()
  RETURNING current_value INTO v_seq;

  -- customer scope 含 region 前缀；region scope 含 region 前缀；global 不含
  CASE v_scope_type
    WHEN 'customer' THEN
      v_result := v_prefix || '-' || COALESCE(p_region_code, 'UNKNOWN') || '-' || v_date_key || '-' || LPAD(v_seq::TEXT, 4, '0');
    WHEN 'region' THEN
      v_result := v_prefix || '-' || p_region_code || '-' || v_date_key || '-' || LPAD(v_seq::TEXT, 4, '0');
    ELSE
      v_result := v_prefix || '-' || v_date_key || '-' || LPAD(v_seq::TEXT, 4, '0');
  END CASE;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_number_ex(TEXT, TEXT, TEXT) TO authenticated;

-- 2. 更新 next_inquiry_number 签名，透传 customer_id
CREATE OR REPLACE FUNCTION public.next_inquiry_number(
  p_region_code TEXT DEFAULT 'NA',
  p_customer_id TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.next_number_ex('ING', p_region_code, p_customer_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_inquiry_number(TEXT, TEXT) TO authenticated;
