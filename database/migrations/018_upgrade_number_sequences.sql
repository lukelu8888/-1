-- Migration 018: 步骤 2b — 升级 number_sequences
-- 策略：只加列，不删旧列，保持 next_inquiry_number 向后兼容

-- 新增列（已存在则跳过）
ALTER TABLE public.number_sequences
  ADD COLUMN IF NOT EXISTS doc_type     TEXT,
  ADD COLUMN IF NOT EXISTS scope_type   TEXT,
  ADD COLUMN IF NOT EXISTS scope_id     TEXT,
  ADD COLUMN IF NOT EXISTS current_value INT NOT NULL DEFAULT 0;

-- 新唯一约束（新 RPC 使用，旧约束 prefix+region_code+date_key 保留）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_number_sequences_new'
  ) THEN
    ALTER TABLE public.number_sequences
      ADD CONSTRAINT uq_number_sequences_new
      UNIQUE (doc_type, scope_type, scope_id);
  END IF;
END;
$$;
