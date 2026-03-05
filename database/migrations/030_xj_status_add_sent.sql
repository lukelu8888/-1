-- Migration 030: xj_status 枚举补充 sent 值
-- 原枚举缺少 sent，导致下推供应商时写入报错：
-- "invalid input value for enum xj_status: sent"

ALTER TYPE xj_status ADD VALUE IF NOT EXISTS 'sent';

-- 验证
SELECT enumlabel FROM pg_enum
JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
WHERE typname = 'xj_status'
ORDER BY enumsortorder;
