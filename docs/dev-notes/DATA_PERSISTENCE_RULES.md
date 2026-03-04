# 📋 数据持久化规则文档

## 🎯 核心原则

**所有角色创建的流转数据和表单在页面刷新或重启时，绝对不允许自动清空，除非接到明确的删除指令。**

---

## 🔥 强制规则

### 1. **localStorage 持久化要求**
所有业务数据必须使用 localStorage 进行持久化存储，包括但不限于：

- ✅ 客户询价单（RFQ-编号）
- ✅ 业务员报价请求单（QR-编号）
- ✅ 采购需求单
- ✅ 采购订单（PO-编号）
- ✅ 采购询价单（XJ-编号）
- ✅ 供应商报价单（BJ-编号）
- ✅ 订单数据
- ✅ 报价数据
- ✅ 购物车数据
- ✅ 通知数据
- ✅ 审批数据
- ✅ 财务数据
- ✅ 收款记录

### 2. **初始化数据规则**

#### ✅ 正确的初始化方式：
```typescript
const [data, setData] = useState<DataType[]>(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('storage_key');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log('💾 从localStorage加载数据，共', parsed.length, '条');
        return parsed;
      } catch (e) {
        console.error('❌ 加载数据失败:', e);
      }
    }
  }
  return []; // 初始为空数组，不包含任何测试数据
});
```

#### ❌ 禁止的初始化方式：
```typescript
// ❌ 禁止：硬编码测试数据
const [data, setData] = useState<DataType[]>([
  { id: 1, name: 'Test Data' },
  { id: 2, name: 'Sample Data' }
]);

// ❌ 禁止：不使用localStorage
const [data, setData] = useState<DataType[]>([]);
```

### 3. **自动保存规则**

所有数据变更必须自动保存到 localStorage：

```typescript
// 🔥 自动保存到localStorage
React.useEffect(() => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('storage_key', JSON.stringify(data));
    console.log('💾 数据已保存到localStorage，共', data.length, '条');
  }
}, [data]);
```

### 4. **数据删除规则**

#### 允许删除的情况：
- ✅ 用户手动点击"删除"按钮
- ✅ 用户确认清空操作
- ✅ 管理员使用清理工具
- ✅ 明确的用户指令

#### 禁止删除的情况：
- ❌ 页面刷新
- ❌ 组件重新加载
- ❌ 用户切换
- ❌ 路由切换
- ❌ 自动清理定时任务

---

## 📊 已实现持久化的Context列表

### ✅ 完全符合规则的Context：
1. **RFQContext** (`/contexts/RFQContext.tsx`)
   - Storage Key: `rfqs`
   - 数据类型: 采购询价单（XJ-编号）

2. **QuotationRequestContext** (`/contexts/QuotationRequestContext.tsx`)
   - Storage Key: `quotationRequests`
   - 数据类型: 业务员报价请求单（QR-编号）

3. **PurchaseRequirementContext** (`/contexts/PurchaseRequirementContext.tsx`)
   - Storage Key: `purchaseRequirements`
   - 数据类型: 采购需求单

4. **PurchaseOrderContext** (`/contexts/PurchaseOrderContext.tsx`)
   - Storage Key: `purchaseOrders`
   - 数据类型: 采购订单（PO-编号）

5. **InquiryContext** (`/contexts/InquiryContext.tsx`)
   - Storage Key: `cosun_inquiries`
   - 数据类型: 客户询价单（RFQ-客户端）

6. **OrderContext** (`/contexts/OrderContext.tsx`)
   - Storage Key: `cosun_orders` (按用户隔离)
   - 数据类型: 订单数据

7. **QuotationContext** (`/contexts/QuotationContext.tsx`)
   - Storage Key: `cosun_quotations` (按用户隔离)
   - 数据类型: 报价数据

8. **CartContext** (`/contexts/CartContext.tsx`) ✅ 已修复
   - Storage Key: `cosun_cart_items`
   - 数据类型: 购物车数据

9. **NotificationContext** (`/contexts/NotificationContext.tsx`)
   - Storage Key: `cosun_notifications_[userEmail]` (按用户隔离)
   - 数据类型: 通知数据

10. **ApprovalContext** (`/contexts/ApprovalContext.tsx`)
    - Storage Keys: 
      - `cosun_finance_requests` (财务审批)
      - `cosun_manager_requests` (主管审批)
      - `cosun_contract_requests` (合同审批)
      - `cosun_negotiation_requests` (议价请求)
    - 数据类型: 审批数据

11. **FinanceContext** (`/contexts/FinanceContext.tsx`)
    - Storage Key: `accountsReceivable_admin@cosun.com`
    - 数据类型: 应收账款数据

12. **PaymentContext** (`/contexts/PaymentContext.tsx`)
    - Storage Key: `paymentRecords_admin@cosun.com`
    - 数据类型: 收款记录

---

## 🔍 检查清单

在创建新的Context或修改现有Context时，必须确认：

- [ ] 使用localStorage初始化数据
- [ ] 初始值为空数组 `[]`，不包含测试数据
- [ ] 使用 `useEffect` 自动保存数据变更
- [ ] 包含加载成功日志
- [ ] 包含错误处理逻辑
- [ ] 没有自动清空逻辑
- [ ] 删除操作需要用户确认

---

## 🚫 严格禁止的行为

### 1. 自动清空数据
```typescript
// ❌ 禁止在任何生命周期中自动清空数据
useEffect(() => {
  setData([]); // 禁止！
  localStorage.clear(); // 禁止！
  localStorage.removeItem('key'); // 禁止！（除非用户明确操作）
}, []);
```

### 2. 硬编码测试数据
```typescript
// ❌ 禁止在Context中硬编码测试数据
const [data, setData] = useState<DataType[]>([
  { id: 1, test: 'data' } // 禁止！
]);
```

### 3. 定时清理
```typescript
// ❌ 禁止设置定时清理任务
setInterval(() => {
  localStorage.clear(); // 禁止！
}, 86400000);
```

---

## 📝 开发指南

### 创建新的数据Context模板

```typescript
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface DataItem {
  id: string;
  // ... 其他字段
}

interface DataContextType {
  items: DataItem[];
  addItem: (item: DataItem) => void;
  updateItem: (id: string, updates: Partial<DataItem>) => void;
  deleteItem: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 🔥 从localStorage加载初始数据
  const [items, setItems] = useState<DataItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('storage_key_name');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          console.log('💾 从localStorage加载数据，共', parsed.length, '条');
          return parsed;
        } catch (e) {
          console.error('❌ 加载数据失败:', e);
        }
      }
    }
    return []; // 初始为空，不包含测试数据
  });

  // 🔥 自动保存到localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('storage_key_name', JSON.stringify(items));
      console.log('💾 数据已保存到localStorage，共', items.length, '条');
    }
  }, [items]);

  const addItem = (item: DataItem) => {
    setItems(prev => [item, ...prev]);
  };

  const updateItem = (id: string, updates: Partial<DataItem>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const deleteItem = (id: string) => {
    // 删除前应在UI层面要求用户确认
    setItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <DataContext.Provider value={{ items, addItem, updateItem, deleteItem }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};
```

---

## 🔧 测试数据管理

### 创建测试数据的正确方式

1. **使用专门的测试工具**
   - 创建"创建测试数据"按钮
   - 明确标注为"测试"功能
   - 提供清理测试数据的工具

2. **清理工具示例**
   ```typescript
   // 在组件中提供清理按钮
   <Button onClick={() => {
     if (window.confirm('确定清空所有测试数据？')) {
       localStorage.removeItem('storage_key');
       window.location.reload();
     }
   }}>
     清空测试数据
   </Button>
   ```

3. **SupplierDataCleaner 清理工具**
   - 位置: `/components/supplier/SupplierDataCleaner.tsx`
   - 功能: 清空供应商端的所有测试数据
   - 使用: 需要用户手动点击确认

---

## 🎓 最佳实践

1. **数据流转完整性**
   - 所有数据通过正常业务流程创建
   - 从上游到下游完整流转
   - 保留完整的编号关联

2. **数据隔离**
   - 业务员不能看到供应商信息
   - 采购员不能看到客户信息
   - 各角色数据按用户邮箱隔离

3. **日志记录**
   - 加载数据时记录日志
   - 保存数据时记录日志
   - 便于调试和追踪

4. **错误处理**
   - 捕获JSON解析错误
   - 提供降级方案
   - 不影响系统运行

---

## ⚠️ 重要提醒

**这是一个固定规则，除非有明确的指令，否则绝对不允许修改或违反。**

任何违反此规则的代码修改都应该被立即拒绝。

---

## 📅 版本历史

- **v1.0** (2024-12-17) - 初始版本，建立数据持久化规则
- **v1.1** (2024-12-17) - 修复 CartContext 硬编码测试数据问题

---

## 📞 联系方式

如有疑问或需要修改规则，请通过以下方式联系：
- 项目负责人: 福建高盛达富建材有限公司
- 修改规则需要明确的书面指令

---

**本规则文档是系统开发的核心约束，所有开发人员必须严格遵守。**
