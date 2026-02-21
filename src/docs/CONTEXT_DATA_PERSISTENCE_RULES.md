# Context数据持久化规则

## 🎯 核心原则

**所有用户创建的数据必须持久化保存，禁止在初始化时强制清空！**

## ✅ 正确的Context数据初始化模式

### 标准模板

```typescript
export const MyDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ✅ 正确：从localStorage加载数据，保留用户创建的所有内容
  const [data, setData] = useState<MyData[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('myDataKey');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          console.log('✅ 从localStorage加载数据，总数:', parsed.length);
          return parsed;
        } catch (e) {
          console.error('❌ 加载数据失败:', e);
        }
      }
    }
    
    // 如果没有保存的数据，返回空数组（而不是示例数据）
    console.log('📋 初始化数据为空数组');
    return [];
  });

  // ✅ 数据变化时自动保存
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('myDataKey', JSON.stringify(data));
      console.log('💾 数据已保存到localStorage，总数:', data.length);
    }
  }, [data]);

  // ... rest of the provider
};
```

## ❌ 禁止的错误模式

### 错误示例1：强制清空localStorage

```typescript
// ❌ 错误：每次刷新都删除用户数据
const [data, setData] = useState<MyData[]>(() => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('myDataKey'); // ❌ 禁止！
    console.log('🗑️ 已永久清空所有数据'); // ❌ 禁止！
  }
  return [];
});
```

### 错误示例2：每次都返回示例数据

```typescript
// ❌ 错误：忽略已保存的数据，每次都返回示例数据
const [data, setData] = useState<MyData[]>([
  { id: '1', name: 'Sample 1' },
  { id: '2', name: 'Sample 2' }
]);
```

### 错误示例3：不保存用户创建的数据

```typescript
// ❌ 错误：没有useEffect保存数据到localStorage
const [data, setData] = useState<MyData[]>([]);
// 缺少保存逻辑！
```

## 📋 必须遵守的Context清单

### 已修复 ✅

- [x] **PurchaseRequirementContext** - 采购需求管理
- [x] **PurchaseOrderContext** - 采购订单管理
- [x] **OrderContext** - 销售订单管理（使用数据隔离系统）

### 需要检查的Context

- [ ] **InquiryContext** - 询价管理
- [ ] **QuotationContext** - 报价管理
- [ ] **FinanceContext** - 财务管理
- [ ] **PaymentContext** - 收款管理
- [ ] **ApprovalContext** - 审批工作流
- [ ] **NotificationContext** - 通知管理
- [ ] **CartContext** - 购物车

## 🔧 数据清理规则

### 何时可以清空数据？

**只有以下情况允许删除localStorage数据：**

1. **用户主动操作**
   - 用户点击"清空购物车"
   - 用户点击"删除全部数据"
   - 用户点击"退出登录"（仅清除auth相关）

2. **开发调试**
   - 在开发工具中手动清理
   - 通过专门的"清理缓存"功能
   - 版本升级时的数据迁移（需要提示用户）

3. **数据过期**
   - 有明确的过期策略（如30天未使用）
   - 必须先提示用户

### 禁止的清理时机

❌ **应用启动时**
❌ **Context初始化时**
❌ **页面刷新时**
❌ **组件重新渲染时**

## 🚀 数据流转规则

### 跨模块数据流转

当数据从一个模块流转到另一个模块时（例如：销售订单 → 采购需求 → 采购订单），必须：

1. **保留来源信息**
   ```typescript
   {
     sourceRef: 'SO-2024-1234', // 来源单号
     source: '销售订单',         // 来源类型
     createdFrom: 'sales-order'  // 创建来源
   }
   ```

2. **建立关联关系**
   ```typescript
   // 采购需求
   {
     id: 'REQ-001',
     salesOrderNo: 'SO-2024-1234'
   }
   
   // 采购订单
   {
     id: 'PO-001',
     requirementNo: 'REQ-001',
     sourceRef: 'SO-2024-1234'
   }
   ```

3. **更新状态级联**
   ```typescript
   // 创建采购订单后，更新采购需求状态
   updateRequirement(requirementId, { status: 'completed' });
   ```

## 🎯 测试检查清单

在修改Context时，必须确认：

- [ ] 刷新页面后，用户创建的数据仍然存在
- [ ] 从A模块下推到B模块的数据被正确保存
- [ ] 关联关系被正确维护（sourceRef, requirementNo等）
- [ ] 状态更新能正确级联（如：需求完成后订单创建）
- [ ] Console没有"强制清空"、"永久删除"等日志
- [ ] localStorage包含正确的数据

## 💡 最佳实践

### 1. 使用详细的日志

```typescript
console.log('✅ 从localStorage加载采购需求数据，总数:', parsed.length);
console.log('💾 采购需求已保存到localStorage，总数:', requirements.length);
console.log('➕ 添加新采购需求:', requirement);
```

### 2. 错误处理

```typescript
try {
  const parsed = JSON.parse(saved);
  return parsed;
} catch (e) {
  console.error('❌ 加载数据失败:', e);
  return [];
}
```

### 3. 数据验证

```typescript
// 验证数据结构
if (Array.isArray(parsed) && parsed.length > 0) {
  // 可选：验证第一条数据的必要字段
  const firstItem = parsed[0];
  if (firstItem.id && firstItem.requirementNo) {
    return parsed;
  }
}
```

## 📚 相关文档

- `/contexts/PurchaseRequirementContext.tsx` - 采购需求Context（已修复）
- `/contexts/PurchaseOrderContext.tsx` - 采购订单Context（标准实现）
- `/contexts/OrderContext.tsx` - 销售订单Context（使用数据隔离）

## 🔄 更新历史

- **2024-12-15**: 修复PurchaseRequirementContext强制清空localStorage的问题
- **2024-12-15**: 创建PurchaseOrderContext，采用正确的数据持久化模式
- **2024-12-15**: 创建本规则文档，防止类似问题再次发生

---

**记住：用户的数据是神圣的，绝不能在他们不知情的情况下删除！**
