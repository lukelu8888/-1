# 📋 客户-业务员关系映射系统使用指南

## 🎯 问题背景

### **用户的核心问题：**
> 步骤1的触发人有N个客户，该如何选择？还是不选择？被通知人要选择吗？
> 实际业务环境中，被通知人分各个区域的业务员，同区域业务员也有不一样的人选。

### **真实业务场景：**
1. **多客户问题**：系统中可能有几十个、上百个客户
2. **一对一关系**：每个客户都应该有固定的对接业务员
3. **老客户 vs 新客户**：
   - 老客户：已有对接业务员（例如：ABC Building Supplies → 张伟）
   - 新客户：需要分配业务员（智能分配到负载最低的业务员）
4. **同区域多业务员**：北美区有3个业务员，如何决定谁接手？

---

## 💡 解决方案架构

### **核心设计理念：**
```
┌─────────────────────────────────────────────────┐
│         步骤1：客户提交询价                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  触发人：【不预设】= 任意客户角色               │
│           ├─ ABC Building Supplies             │
│           ├─ Brasil Construction Co.           │
│           ├─ Europa Trading GmbH               │
│           └─ 任何其他客户...                    │
│                                                 │
│  被通知人：【动态路由】                         │
│           ↓                                     │
│   1. 查询：客户-业务员关系表                    │
│           ├─ 已有映射？→ 通知对接业务员         │
│           └─ 没有映射？→ 智能分配新业务员       │
│                                                 │
│   2. 智能分配规则：                             │
│           ├─ 同区域匹配                         │
│           ├─ 负载均衡（选负载最低的）           │
│           └─ 自动保存关系                       │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 📦 系统组成

### **1. 客户-业务员关系表**

存储位置：`localStorage` 键名 `gsd_customer_salesrep_mapping`

```typescript
{
  customerId: "ABC Building Supplies",     // 客户唯一标识
  customerName: "ABC Building Supplies",   // 客户名称
  customerRegion: "north_america",         // 客户区域
  salesRepName: "张伟 (北美区)",           // 对接业务员
  salesRepEmail: "zhangwei@gsd.com",       // 业务员邮箱
  assignedDate: "2024-01-15",              // 分配日期
  assignedBy: "auto",                      // 分配方式（auto/manual）
  notes: "首次询价自动分配"                // 备注
}
```

### **2. 初始测试数据（3个客户）**

| 客户名称 | 区域 | 对接业务员 | 业务员负载 | 分配方式 |
|---------|------|-----------|-----------|---------|
| ABC Building Supplies | 北美区 | 张伟 | 5 | 🤖 自动 |
| Brasil Construction Co. | 南美区 | 赵婷 | 2 | 🤖 自动 |
| Europa Trading GmbH | 欧非区 | 王芳 | 2 | 🤖 自动 |

---

## 🔄 智能路由流程

### **完整业务流程：**

```
┌─────────────────────────────────────────┐
│ 步骤1：客户 X 提交询价                   │
└───────────┬─────────────────────────────┘
            ↓
    【系统自动检测】
            ↓
┌───────────────────────────────────────────┐
│ 查询客户-业务员关系表                     │
│ SQL: SELECT * WHERE customerId = 'X'      │
└───────────┬───────────────────────────────┘
            ↓
        找到了？
       ╱      ╲
     是          否
     ↓           ↓
┌─────────┐  ┌──────────────────┐
│ 返回已有 │  │ 智能分配新业务员  │
│ 业务员   │  │                  │
│         │  │ 1. 识别客户区域   │
│         │  │ 2. 找同区域业务员 │
│         │  │ 3. 按负载排序     │
│         │  │ 4. 选负载最低者   │
│         │  │ 5. 保存新映射关系 │
└────┬────┘  └────────┬─────────┘
     │                │
     └────────┬───────┘
              ↓
    【通知对接业务员】
              ↓
┌─────────────────────────────────┐
│ 业务员收到询价通知               │
│ - 邮件/系统消息                  │
│ - 显示客户信息                   │
│ - 开始跟进流程                   │
└─────────────────────────────────┘
```

---

## 🛠️ 核心API函数

### **1. 智能路由（推荐使用）**

```typescript
import { routeToSalesRep } from '/lib/customer-salesrep-mapping';

// 自动查询或分配业务员
const salesRep = routeToSalesRep(
  'ABC Building Supplies',  // 客户名称
  'north_america'            // 客户区域
);

// 返回：
// - 已有映射：返回对接业务员
// - 没有映射：自动分配+保存+返回新业务员
```

### **2. 查询已有关系**

```typescript
import { getSalesRepByCustomer } from '/lib/customer-salesrep-mapping';

const salesRep = getSalesRepByCustomer('ABC Building Supplies');

// 返回：
// - Personnel 对象（如果已有映射）
// - null（如果没有映射）
```

### **3. 手动分配/修改关系**

```typescript
import { assignSalesRepManual } from '/lib/customer-salesrep-mapping';

assignSalesRepManual(
  'New Customer Inc.',       // 客户名称
  'north_america',           // 客户区域
  '王建 (北美区)',           // 指定业务员
  '手动指定给王建负责'       // 备注
);
```

### **4. 获取业务员的所有客户**

```typescript
import { getCustomersBySalesRep } from '/lib/customer-salesrep-mapping';

const customers = getCustomersBySalesRep('张伟 (北美区)');

// 返回：该业务员负责的所有客户列表
```

### **5. 查看映射摘要**

```typescript
import { getMappingSummary } from '/lib/customer-salesrep-mapping';

console.log(getMappingSummary());

// 输出：
// 当前映射关系（3个）:
// ABC Building Supplies → 张伟 (北美区) (🤖自动)
// Brasil Construction Co. → 赵婷 (南美区) (🤖自动)
// Europa Trading GmbH → 王芳 (欧非区) (🤖自动)
```

---

## 📋 步骤1的最佳实践

### **触发人设置：**

#### ❌ **错误做法：预设客户**
```
触发人：☑ ABC Building Supplies
被通知人：☑ 张伟
```
**问题**：只有ABC客户询价才触发，其他客户无效

#### ✅ **正确做法：不预设/留空**
```
触发人：【空】或 🤖 系统自动检测（客户角色）
被通知人：【空】或 🤖 智能路由
```
**优势**：任何客户询价都会触发，系统自动路由到对应业务员

---

### **被通知人设置：**

#### 方案A：完全自动化（推荐）
```typescript
// 在步骤1的通知逻辑中：
const customer = getCurrentCustomer(); // 获取当前提交询价的客户
const salesRep = routeToSalesRep(customer.name, customer.region);

if (salesRep) {
  sendNotification(salesRep.email, {
    type: 'new_inquiry',
    customer: customer.name,
    details: inquiryDetails
  });
}
```

#### 方案B：半自动化（推荐+手动确认）
```typescript
// 显示推荐的业务员，允许用户调整
const recommendedSalesRep = routeToSalesRep(customer.name, customer.region);

showNotificationDialog({
  recommendedRecipient: recommendedSalesRep,
  allowManualChange: true,  // 允许手动修改
  onConfirm: (selectedSalesRep) => {
    // 保存修改后的关系
    if (selectedSalesRep !== recommendedSalesRep) {
      assignSalesRepManual(customer.name, customer.region, selectedSalesRep);
    }
    sendNotification(selectedSalesRep);
  }
});
```

---

## 🎯 实际使用场景示例

### **场景1：老客户ABC再次询价**

```
1. 客户：ABC Building Supplies 提交询价
   ↓
2. 系统：查询关系表
   → 找到：ABC → 张伟 (2024-01-15分配)
   ↓
3. 系统：自动通知张伟
   ✉️ "您的客户ABC Building Supplies提交了新询价"
   ↓
4. 张伟：查看询价详情，开始跟进
```

### **场景2：新客户XYZ首次询价**

```
1. 客户：XYZ Trading Corp (北美区) 提交询价
   ↓
2. 系统：查询关系表
   → 未找到映射关系
   ↓
3. 系统：智能分配
   → 北美区业务员列表：
      - 张伟：负载5 🟡
      - 王建：负载3 🟢 ← 最低
      - 李明：负载7 🔴
   → 分配给：王建
   ↓
4. 系统：保存新映射关系
   XYZ Trading Corp → 王建 (2024-12-09自动分配)
   ↓
5. 系统：通知王建
   ✉️ "新客户XYZ Trading Corp提交了询价，已分配给您"
   ↓
6. 王建：查看新客户信息，开始跟进
```

### **场景3：手动调整客户-业务员关系**

```
1. 销售主管：发现ABC客户需求复杂
   ↓
2. 决定：从张伟转给更资深的李明
   ↓
3. 操作：打开关系管理界面
   assignSalesRepManual(
     'ABC Building Supplies',
     'north_america',
     '李明 (北美区)',
     '客户需求升级，转给资深业务员'
   )
   ↓
4. 系统：更新关系表
   ABC Building Supplies → 李明 (👤手动)
   ↓
5. 下次：ABC再次询价时，自动通知李明
```

---

## 📊 负载均衡算法

### **业务员负载等级：**

| 负载值 | 等级 | 显示 | 分配优先级 |
|-------|------|------|-----------|
| 0-3   | 低   | 🟢 负载低 | ⭐⭐⭐ 优先分配 |
| 4-6   | 中   | 🟡 负载中 | ⭐⭐ 次优先 |
| 7+    | 高   | 🔴 负载高 | ⭐ 避免分配 |

### **分配策略：**

```typescript
// 1. 筛选同区域业务员
const regionalSalesReps = personnelList
  .filter(p => p.role === '业务员' && p.region === customerRegion);

// 2. 按负载排序（低到高）
regionalSalesReps.sort((a, b) => (a.workload || 0) - (b.workload || 0));

// 3. 选择负载最低的
const assignedSalesRep = regionalSalesReps[0];
```

### **实际分配示例（北美区）：**

```
客户区域：北美区
可用业务员：
  - 王建：负载3 🟢  ← 被选中
  - 张伟：负载5 🟡
  - 李明：负载7 🔴

结果：新客户分配给王建
```

---

## 🔧 管理界面（未来扩展）

### **功能需求：**

1. **关系总览**
   - 表格显示所有客户-业务员映射
   - 支持筛选、搜索、排序

2. **快速分配**
   - 批量导入客户
   - 一键自动分配

3. **手动调整**
   - 拖拽修改关系
   - 备注记录原因

4. **统计分析**
   - 业务员负载分布
   - 客户分布热力图

### **界面草图：**

```
┌─────────────────────────────────────────────────────┐
│ 客户-业务员关系管理                                   │
├─────────────────────────────────────────────────────┤
│ 🔍 搜索客户...        [+ 新增]  [🔄 自动分配]  [导出] │
├─────────────────────────────────────────────────────┤
│ 客户名称              区域    业务员      负载  操作  │
│ ─────────────────────────────────────────────────── │
│ ABC Building Supplies  北美   张伟 🟡5    [编辑][删除]│
│ Brasil Construction    南美   赵婷 🟢2    [编辑][删除]│
│ Europa Trading GmbH    欧非   王芳 🟢2    [编辑][删除]│
│ ...                                                  │
├─────────────────────────────────────────────────────┤
│ 共3个映射关系  |  北美区: 1个  南美区: 1个  欧非区: 1个 │
└─────────────────────────────────────────────────────┘
```

---

## ✅ 使用检查清单

### **系统初始化：**
- [x] `initCustomerSalesRepMapping()` 已在组件加载时调用
- [x] localStorage中存储了3个测试映射关系
- [x] 控制台显示映射摘要

### **老客户询价流程：**
- [x] ABC客户询价 → 自动查询到张伟 → 通知张伟
- [x] Brasil客户询价 → 自动查询到赵婷 → 通知赵婷
- [x] Europa客户询价 → 自动查询到王芳 → 通知王芳

### **新客户询价流程：**
- [x] 新客户（北美区）→ 智能分配到负载最低的业务员
- [x] 自动保存新映射关系到localStorage
- [x] 下次该客户询价时直接通知已分配的业务员

### **手动管理：**
- [x] 可以手动修改客户-业务员关系
- [x] 修改后的关系持久化存储
- [x] 可以删除特定映射关系

---

## 🎁 浏览器控制台管理

打开浏览器Console，直接操作关系库：

```javascript
// 查看所有映射关系
import { getMappingSummary } from '/lib/customer-salesrep-mapping';
console.log(getMappingSummary());

// 查询某客户的业务员
import { getSalesRepByCustomer } from '/lib/customer-salesrep-mapping';
getSalesRepByCustomer('ABC Building Supplies');

// 手动分配新客户
import { assignSalesRepManual } from '/lib/customer-salesrep-mapping';
assignSalesRepManual(
  'New Customer Inc.',
  'north_america',
  '王建 (北美区)',
  '手动分配'
);

// 智能路由（自动查询或分配）
import { routeToSalesRep } from '/lib/customer-salesrep-mapping';
routeToSalesRep('Unknown Customer', 'south_america');

// 重置为初始测试数据
import { resetMappingStore } from '/lib/customer-salesrep-mapping';
resetMappingStore();
```

---

## 📝 总结

### **回答您的原始问题：**

#### **Q1: 步骤1的触发人有N个客户，该如何选择？**
**A1：不需要预设触发人！**
- 触发条件：任何"客户"角色提交询价
- 系统自动检测是哪个客户
- 无需手动配置每个客户

#### **Q2: 被通知人要选择吗？**
**A2：不需要手动选择！**
- 系统自动通过客户-业务员关系表查询
- 老客户：直接通知对接业务员
- 新客户：智能分配+通知

#### **Q3: 同区域业务员也有不一样的人选，如何决定？**
**A3：智能负载均衡！**
- 优先选择负载最低的业务员
- 避免单个业务员负担过重
- 支持手动调整优先级

### **系统优势：**

1. **✅ 模拟真实业务**：完全符合实际运营场景
2. **✅ 零配置负担**：新客户自动分配，无需人工干预
3. **✅ 负载均衡**：智能分配保证工作量公平
4. **✅ 灵活调整**：支持手动修改关系
5. **✅ 数据持久化**：关系保存在localStorage，刷新不丢失
6. **✅ 可扩展**：未来可无缝迁移到Supabase数据库

**您的B2B外贸系统现在拥有了企业级的客户-业务员关系管理能力！** 🎉
