/**
 * Admin Portal Configuration
 * 管理员门户配置
 * 
 * IMPORTANT 重要说明:
 * - TEST_MODE: 测试模式开关，正式发布时设置为 false
 * - 测试模式下：所有订单都可以删除
 * - 生产模式下：只有标记为"测试订单"的才能删除
 */

export const ADMIN_CONFIG = {
  /**
   * 测试模式开关
   * true: 测试阶段 - 显示所有删除按钮，所有订单都可删除
   * false: 生产环境 - 只有标记为"测试订单"的才显示删除按钮
   * 
   * ⚠️ 正式发布前请设置为 false
   */
  TEST_MODE: true,

  /**
   * 允许删除测试订单（即使在生产环境）
   * true: 生产环境下仍可删除标记为测试的订单
   * false: 生产环境下完全禁止删除
   */
  ALLOW_DELETE_TEST_ORDERS: true,

  /**
   * 删除确认文本（防止误操作）
   */
  DELETE_CONFIRMATION: {
    testMode: '当前为测试模式，确定要删除此订单吗？',
    testOrder: '此为测试订单，确定要删除吗？',
    production: '⚠️ 生产环境禁止删除订单！请联系 COSUN 系统管理员。',
  },

  /**
   * COSUN 管理员权限
   * 拥有完整系统管理权限的账号列表
   */
  SUPER_ADMINS: ['admin@cosun.com', 'system@cosun.com'],
} as const;

/**
 * 检查是否可以删除订单
 * @param order 订单对象
 * @param userEmail 当前用户邮箱
 * @returns 是否允许删除
 */
export function canDeleteOrder(order: any, userEmail?: string): boolean {
  // 如果是测试模式，所有订单都可以删除
  if (ADMIN_CONFIG.TEST_MODE) {
    return true;
  }

  // 生产模式下，检查是否允许删除测试订单
  if (ADMIN_CONFIG.ALLOW_DELETE_TEST_ORDERS && order.isTest) {
    return true;
  }

  // COSUN 超级管理员拥有完整权限（可选）
  if (userEmail && ADMIN_CONFIG.SUPER_ADMINS.includes(userEmail)) {
    return true;
  }

  return false;
}

/**
 * 获取删除确认消息
 * @param order 订单对象
 * @returns 确认消息文本
 */
export function getDeleteConfirmation(order: any): string {
  if (ADMIN_CONFIG.TEST_MODE) {
    return ADMIN_CONFIG.DELETE_CONFIRMATION.testMode;
  }

  if (order.isTest) {
    return ADMIN_CONFIG.DELETE_CONFIRMATION.testOrder;
  }

  return ADMIN_CONFIG.DELETE_CONFIRMATION.production;
}
