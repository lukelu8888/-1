-- 重置采购需求（QR）的下推状态，使其可以再次下推报价管理
-- 用法：mysql -u root -p cosun_b2b < reset_pushed_to_quotation.sql

USE cosun_b2b;

-- 🔥 方法1：重置指定QR单号的下推状态（推荐）
-- 把 QR-NA-260202-0002 改成你要重置的QR单号
UPDATE purchase_requirements
SET 
  pushed_to_quotation = 0,
  pushed_to_quotation_date = NULL,
  pushed_by = NULL
WHERE requirement_no = 'QR-NA-260202-0002';

-- 🔥 方法2：重置所有已下推的QR（谨慎使用）
-- UPDATE purchase_requirements
-- SET 
--   pushed_to_quotation = 0,
--   pushed_to_quotation_date = NULL,
--   pushed_by = NULL
-- WHERE pushed_to_quotation = 1;

-- 🔥 可选：删除对应的销售报价单（QT）（如果不想保留已创建的报价单）
-- 注意：删除前请先确认，这个操作不可恢复！
-- DELETE FROM sales_quotation_items WHERE quotation_id IN (
--   SELECT id FROM sales_quotations WHERE qr_number = 'QR-NA-260202-0002'
-- );
-- DELETE FROM sales_quotations WHERE qr_number = 'QR-NA-260202-0002';

-- 🔥 验证：查看重置后的状态
SELECT 
  requirement_no AS 'QR单号',
  pushed_to_quotation AS '已下推',
  pushed_to_quotation_date AS '下推日期',
  pushed_by AS '下推人',
  status AS '状态'
FROM purchase_requirements
WHERE requirement_no = 'QR-NA-260202-0002';
