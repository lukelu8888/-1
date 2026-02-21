# 🗑️ 数据清理工具使用指南

## 📚 可用的清理工具

系统提供了多个数据清理工具，可以在浏览器控制台中使用。

---

## 🔧 工具列表

### 1️⃣ **清空收款管理数据**

```javascript
clearPaymentData()
```

**功能：** 清除所有收款记录（SK系列）

**影响范围：**
- ✅ 删除所有收款记录（PaymentContext）
- ❌ 不影响应收账款数据
- ❌ 不影响订单数据

**使用场景：**
- 测试收款流程时清空历史数据
- 重置收款记录编号序列

---

### 2️⃣ **清空财务数据**

```javascript
clearFinanceData()
```

**功能：** 清除所有应收账款数据（YS系列）

**影响范围：**
- ✅ 删除所有应收账款（FinanceContext）
- ❌ 不影响收款记录
- ❌ 不影响订单数据

**使用场景：**
- 测试应收账款生成流程
- 重置应收账款编号序列

---

### 3️⃣ **完整数据恢复**

```javascript
recoverAllData('customer@example.com')
```

**功能：** 恢复测试数据（询价、报价、订单）

**影响范围：**
- ✅ 创建测试询价单
- ✅ 创建测试报价单
- ✅ 创建测试订单
- ❌ 不影响财务数据

**使用场景：**
- 初次使用系统时创建测试数据
- 演示完整业务流程

---

### 4️⃣ **重置文档编号计数器**

```javascript
resetDocumentCounter()
```

**功能：** 重置所有文档编号计数器（RFQ/QUO/ORD/YS/SK）

**影响范围：**
- ✅ 重置询价单编号计数器
- ✅ 重置报价单编号计数器
- ✅ 重置订单编号计数器
- ❌ 不删除已有数据

**使用场景：**
- 希望编号从0001重新开始
- 测试编号生成逻辑

---

## 📋 常用清理场景

### **场景1：完全清空系统，重新开始**

```javascript
// 步骤1：清空所有数据
localStorage.clear()

// 步骤2：刷新页面
location.reload()

// 步骤3：恢复测试数据（可选）
recoverAllData('customer@example.com')
```

---

### **场景2：只清空财务数据（保留订单数据）**

```javascript
// 步骤1：清空应收账款
clearFinanceData()

// 步骤2：清空收款记录
clearPaymentData()

// 步骤3：刷新页面
location.reload()
```

**结果：**
- ✅ 订单数据保留
- ✅ 询价、报价数据保留
- ❌ 应收账款已删除
- ❌ 收款记录已删除

---

### **场景3：只清空收款记录（保留应收账款）**

```javascript
// 步骤1：清空收款记录
clearPaymentData()

// 步骤2：刷新页面
location.reload()
```

**结果：**
- ✅ 应收账款保留
- ❌ 收款记录已删除

---

### **场景4：重置编号序列（不删除数据）**

```javascript
// 步骤1：重置计数器
resetDocumentCounter()

// 步骤2：刷新页面
location.reload()
```

**结果：**
- ✅ 下一个询价单将是：RFQ-NA-YYMMDD-0001
- ✅ 下一个报价单将是：QUO-NA-YYMMDD-0001
- ✅ 下一个订单将是：ORD-NA-YYMMDD-0001
- ✅ 历史数据保留

---

## 🧪 测试流程推荐

### **测试收款管理流程**

```javascript
// 1. 清空旧数据
clearPaymentData()
clearFinanceData()
location.reload()

// 2. 创建测试订单
recoverAllData('customer@example.com')

// 3. 进入Admin Dashboard
// - 订单管理 → 确认订单 → 自动生成应收账款 YS-NA-YYMMDD-0001
// - 财务管理 → 收款管理 → 登记收款 → 创建收款记录 SK-NA-YYMMDD-0001

// 4. 验证联动
// - 应收账款的已收/未收金额应该自动更新
// - 应收账款状态应该从 Pending → Partial → Paid

// 5. 清理（可选）
clearPaymentData()
clearFinanceData()
location.reload()
```

---

## ⚠️ 注意事项

### **数据隔离**

系统使用**多租户数据隔离**机制：

- **Customer数据**：存储在 `customer@example.com` 账号下
- **Admin数据**：存储在 `admin@cosun.com` 账号下
- **财务数据**：统一存储在 `admin@cosun.com` 账号下

### **清理工具权限**

```javascript
// ✅ 任何人都可以清理自己账号的数据
clearPaymentData()  // 清理当前账号的收款记录

// ✅ Admin可以清理财务数据
clearFinanceData()  // 需要Admin权限
```

### **不可恢复**

⚠️ **警告：数据清理操作不可恢复！**

- localStorage数据一旦删除，无法恢复
- 建议在清理前导出重要数据
- 测试环境可以随意清理

---

## 📊 数据存储键名

如果需要手动检查或清理数据：

```javascript
// 收款记录
localStorage.getItem('admin@cosun.com_paymentRecords')

// 应收账款
localStorage.getItem('admin@cosun.com_accountsReceivable')

// 订单数据
localStorage.getItem('admin@cosun.com_orders')

// 询价数据（客户）
localStorage.getItem('customer@example.com_inquiries')

// 询价数据（Admin）
localStorage.getItem('admin@cosun.com_inquiries')

// 报价数据
localStorage.getItem('admin@cosun.com_quotations')

// 文档编号计数器
localStorage.getItem('document_counter_data')
```

---

## 🎯 快速参考

| 操作 | 命令 | 影响 |
|------|------|------|
| 清空收款记录 | `clearPaymentData()` | 删除SK系列 |
| 清空应收账款 | `clearFinanceData()` | 删除YS系列 |
| 恢复测试数据 | `recoverAllData('customer@example.com')` | 创建测试询价/报价/订单 |
| 重置编号计数器 | `resetDocumentCounter()` | 编号从0001开始 |
| 完全清空 | `localStorage.clear()` | 删除所有数据 ⚠️ |
| 刷新页面 | `location.reload()` | 重新加载 |

---

## 💡 提示

### **开发调试时**

```javascript
// 快速清空并重置
localStorage.clear()
location.reload()
recoverAllData('customer@example.com')
```

### **演示前准备**

```javascript
// 清空历史数据
clearPaymentData()
clearFinanceData()

// 重置编号
resetDocumentCounter()

// 刷新
location.reload()

// 创建干净的测试数据
recoverAllData('customer@example.com')
```

### **生产环境**

⚠️ **生产环境禁止使用清理工具！**

- 生产环境应该移除这些工具
- 或者添加权限检查
- 定期备份localStorage数据

---

## 📞 技术支持

如果遇到数据问题：

1. **检查浏览器控制台**是否有错误
2. **检查localStorage**数据是否存在
3. **尝试清空并重置**数据
4. **联系技术支持**获取帮助

---

**🎉 数据清理工具使用指南完成！**
