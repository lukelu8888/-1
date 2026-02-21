-- 把「客户确认」后的订单状态改回「未确认」，便于重新点击「接受」测试报错
-- 订单号以截图为准：SC-North America-260209-0001（若库里是 SC-NA-260209-0001 请改下面 WHERE 条件）

UPDATE customer_orders
SET
  status = 'Pending',
  customer_feedback = NULL,
  confirmed = NULL,
  confirmed_at = NULL,
  confirmed_by = NULL,
  confirmed_date = NULL,
  updated_at = NOW(3)
WHERE order_number = 'SC-North America-260209-0001';

-- 若库里合同号是 SC-NA-260209-0001，用下面这句代替上面：
-- WHERE order_number = 'SC-NA-260209-0001';

-- 查看是否改到（应影响 1 行）
-- SELECT id, order_number, status, customer_feedback, confirmed, confirmed_at
-- FROM customer_orders
-- WHERE order_number IN ('SC-North America-260209-0001', 'SC-NA-260209-0001');
