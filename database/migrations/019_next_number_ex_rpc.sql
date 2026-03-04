-- Migration 019: 步骤 2c — 新建 next_number_ex 通用编号 RPC
-- 步骤 2d — next_inquiry_number 转调 next_number_ex

-- ============================================================
-- next_number_ex(doc_type, region_code, customer_id)
-- scope_type 逻辑：
--   customer  → scope_id = customer_id（ING 按客户隔离序号）
--   region    → scope_id = region_code（QT/SC 按区域隔离序号）
--   global    → scope_id = 'global'
--   derived   → 直接报错（CI/PL 不通过此函数生成）
-- 编号格式：
--   customer/global → PREFIX-YYMMDD-XXXX
--   region          → PREFIX-REGION-YYMMDD-XXXX
-- ============================================================
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
  -- 读取单据定义
  SELECT scope_type, prefix
    INTO v_scope_type, v_prefix
    FROM public.document_types
   WHERE doc_type = p_doc_type;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'unknown doc_type: %', p_doc_type;
  END IF;

  -- derived 类型不允许通过此函数生成（CI/PL 派生自 SC）
  IF v_scope_type = 'derived' THEN
    RAISE EXCEPTION 'doc_type % is derived and cannot use next_number_ex', p_doc_type;
  END IF;

  -- 确定 scope_id
  v_date_key := to_char(now(), 'YYMMDD');

  IF v_scope_type = 'customer' THEN
    v_scope_id := COALESCE(p_customer_id, 'UNKNOWN');
  ELSIF v_scope_type = 'region' THEN
    v_scope_id := COALESCE(p_region_code, 'UNKNOWN');
  ELSE
    v_scope_id := 'global';
  END IF;

  -- 原子递增（新列 doc_type/scope_type/scope_id/current_value）
  INSERT INTO public.number_sequences
    (doc_type, scope_type, scope_id, current_value,
     prefix, region_code, date_key, current_seq)
  VALUES
    (p_doc_type, v_scope_type, v_scope_id || ':' || v_date_key, 1,
     v_prefix, p_region_code, v_date_key, 1)
  ON CONFLICT (doc_type, scope_type, scope_id)
  DO UPDATE SET
    current_value = public.number_sequences.current_value + 1,
    updated_at    = now()
  RETURNING current_value INTO v_seq;

  -- 拼装编号
  IF v_scope_type = 'region' THEN
    v_result := v_prefix || '-' || p_region_code || '-' || v_date_key || '-' || lpad(v_seq::TEXT, 4, '0');
  ELSE
    v_result := v_prefix || '-' || v_date_key || '-' || lpad(v_seq::TEXT, 4, '0');
  END IF;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_number_ex(TEXT, TEXT, TEXT) TO authenticated;

-- ============================================================
-- 步骤 2d — next_inquiry_number 转调 next_number_ex
-- 保持函数签名不变，向后兼容前端现有调用
-- ============================================================
CREATE OR REPLACE FUNCTION public.next_inquiry_number(p_region_code TEXT DEFAULT 'NA')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.next_number_ex('ING', p_region_code, NULL);
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_inquiry_number(TEXT) TO authenticated;
