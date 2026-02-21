# 🗑️ 订单删除功能配置指南

## 📋 概述

本系统为 **Admin Portal** 的订单管理模块提供了灵活的删除功能配置，满足测试阶段和生产环境的不同需求。

---

## 🎯 设计理念

### **业务需求**
1. **测试阶段**：需要频繁清理测试数据，所有订单都应该可以删除
2. **生产环境**：不能随意删除业务订单，保护关键数据
3. **测试订单标记**：即使在生产环境，也需要能够删除标记为"测试"的订单

### **解决方案**
采用 **双层保护机制**：
- **测试模式开关** (`TEST_MODE`)：控制整体删除权限
- **测试订单标记** (`isTest`)：标识哪些订单可以安全删除

---

## ⚙️ 配置文件说明

### **文件位置**
```
/config/admin.config.ts
```

### **核心配置项**

```typescript
export const ADMIN_CONFIG = {
  /**
   * 🔧 TEST_MODE - 测试模式开关
   * 
   * true  → 测试阶段：所有订单都可以删除
   * false → 生产环境：只有标记为测试的订单可以删除
   * 
   * ⚠️ 正式发布前请务必设置为 false
   */
  TEST_MODE: true,

  /**
   * 🔐 ALLOW_DELETE_TEST_ORDERS
   * 
   * true  → 生产环境下仍可删除标记为测试的订单
   * false → 生产环境下完全禁止删除
   */
  ALLOW_DELETE_TEST_ORDERS: true,

  /**
   * 📝 DELETE_CONFIRMATION - 删除确认文本
   */
  DELETE_CONFIRMATION: {
    testMode: '当前为测试模式，确定要删除此订单吗？',
    testOrder: '此为测试订单，确定要删除吗？',
    production: '⚠️ 生产环境禁止删除订单！请联系 COSUN 系统管理员。',
  },

  /**
   * 👑 SUPER_ADMINS - 超级管理员权限
   * 拥有完整系统管理权限的账号列表
   */
  SUPER_ADMINS: ['admin@cosun.com', 'system@cosun.com'],
}
```

---

## 🚀 使用场景

### **场景 1：测试阶段（当前状态）**

**配置**
```typescript
TEST_MODE: true
```

**行为**
- ✅ 所有订单都显示"删除"按钮
- ✅ 可以删除任何订单（在制订单 + 历史订单）
- ✅ 删除确认提示："当前为测试模式，确定要删除此订单吗？"

**适用场景**
- 开发阶段测试功能
- 演示系统前清理数据
- 压力测试后批量清理

---

### **场景 2：正式发布后（生产环境）**

**配置**
```typescript
TEST_MODE: false
ALLOW_DELETE_TEST_ORDERS: true
```

**行为**
- ✅ 只有标记为 `isTest: true` 的订单才显示"删除"按钮
- ❌ 正式业务订单不显示删除按钮
- ✅ 删除测试订单时提示："此为测试订单，确定要删除吗？"

**如何标记测试订单**
```typescript
// 在创建订单时添加 isTest 标记
const order = {
  id: 'ORD-2025-0001',
  customer: 'Test Customer',
  isTest: true,  // 🔖 标记为测试订单
  // ... 其他字段
}
```

---

### **场景 3：完全锁定删除功能**

**配置**
```typescript
TEST_MODE: false
ALLOW_DELETE_TEST_ORDERS: false
```

**行为**
- ❌ 所有订单都不显示"删除"按钮
- ❌ 完全禁止删除任何订单
- ⚠️ 删除按钮变为灰色不可点击（或完全隐藏）

**适用场景**
- 系统审计期间
- 财务结算期间
- 合规要求完全锁定数据

---

## 📌 正式发布前的操作步骤

### **Step 1: 修改配置文件**
```typescript
// /config/admin.config.ts

export const ADMIN_CONFIG = {
  TEST_MODE: false,  // ⚠️ 从 true 改为 false
  ALLOW_DELETE_TEST_ORDERS: true,  // 保持 true，允许删除测试订单
  // ... 其他配置保持不变
}
```

### **Step 2: 验证配置生效**
1. 重新启动应用
2. 登录 Admin Portal
3. 进入订单管理模块
4. 检查：
   - ✓ 正式订单应该**没有**"删除"按钮
   - ✓ 测试订单应该**有**"删除"按钮

### **Step 3: 清理测试数据（可选）**
在修改配置前，可以先在测试模式下清理所有测试数据：
```
1. TEST_MODE: true  → 删除所有测试订单
2. TEST_MODE: false → 切换到生产模式
```

---

## 🛡️ 安全机制

### **权限检查函数**
```typescript
// 检查是否可以删除订单
canDeleteOrder(order, userEmail): boolean

// 判断逻辑
if (TEST_MODE) {
  return true;  // 测试模式下所有订单都可删除
}

if (ALLOW_DELETE_TEST_ORDERS && order.isTest) {
  return true;  // 生产模式下只有测试订单可删除
}

if (SUPER_ADMINS.includes(userEmail)) {
  return true;  // 超级管理员拥有完整权限
}

return false;  // 其他情况禁止删除
```

### **确认对话框**
```typescript
// 获取删除确认消息
getDeleteConfirmation(order): string

// 根据模式和订单类型返回不同提示
- 测试模式 → "当前为测试模式，确定要删除此订单吗？"
- 测试订单 → "此为测试订单，确定要删除吗？"
- 生产订单 → "⚠️ 生产环境禁止删除订单！"
```

---

## 📊 功能对比表

| 配置场景 | TEST_MODE | ALLOW_DELETE_TEST | 正式订单 | 测试订单 |
|---------|----------|------------------|---------|---------|
| **测试阶段** | `true` | `true` | ✅ 可删除 | ✅ 可删除 |
| **生产环境** | `false` | `true` | ❌ 禁止 | ✅ 可删除 |
| **完全锁定** | `false` | `false` | ❌ 禁止 | ❌ 禁止 |

---

## 🎨 UI 呈现

### **删除按钮样式**
```tsx
<Button
  size="sm"
  className="h-7 px-2 text-xs bg-rose-600 hover:bg-rose-700"
>
  <Trash2 className="w-3.5 h-3.5 mr-1" />
  删除
</Button>
```

### **确认对话框**
- 标题：**删除订单** / **删除历史订单**
- 红色确认按钮：`bg-rose-600`
- 灰色取消按钮
- 显示订单编号加粗提示

---

## 💡 最佳实践

### **1. 测试订单命名规范**
```typescript
// 建议在订单编号中体现测试标记
{
  id: 'ORD-TEST-2025-0001',  // 以 TEST 开头
  isTest: true
}
```

### **2. 定期清理测试数据**
- 建议每周清理一次测试订单
- 避免测试数据污染生产环境统计

### **3. 权限分级**
- 普通管理员：只能删除测试订单
- COSUN 超级管理员：拥有完整删除权限
- 可通过 `SUPER_ADMINS` 数组配置

### **4. 审计日志（建议扩展）**
```typescript
// 未来可以添加删除日志
const deleteLog = {
  operator: userEmail,
  orderId: order.id,
  deletedAt: new Date(),
  isTestOrder: order.isTest,
  mode: TEST_MODE ? 'test' : 'production'
}
```

---

## ⚠️ 重要提醒

### **正式发布前必须检查**
- [ ] TEST_MODE 设置为 `false`
- [ ] 所有测试订单已标记 `isTest: true`
- [ ] SUPER_ADMINS 列表已更新为实际管理员邮箱
- [ ] 测试删除功能确保只有测试订单可删除

### **数据安全提示**
- ⚠️ 删除操作**无法撤销**
- ⚠️ 删除前务必弹出确认对话框
- ⚠️ 建议在删除前进行数据备份
- ⚠️ 生产环境禁止随意删除业务订单

---

## 📞 技术支持

如有问题，请联系：
- **系统管理员**: admin@cosun.com
- **技术支持**: tech-support@cosun.com

---

**最后更新**: 2025-11-20
**版本**: 1.0.0
