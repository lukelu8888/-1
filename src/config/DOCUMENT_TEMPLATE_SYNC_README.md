# 📋 文档模板中心化管理与同步机制

## 🎯 概述

本系统实现了**文档模板的中心化管理和自动同步机制**，确保所有业务模块使用统一的、最新版本的文档模板。

### 核心优势

✅ **单一数据源（Single Source of Truth）**  
- 文档中心作为唯一的模板源
- 所有业务模块引用同一套模板组件
- 模板升级后，所有使用的地方自动更新

✅ **模板与业务解耦**  
- 模板组件与业务逻辑分离
- 数据适配器负责格式转换
- 业务模块无需关心模板内部实现

✅ **版本控制与追溯**  
- 每个模板都有版本号
- 同步日志记录所有更新
- 可追溯模板使用历史

---

## 📁 文件结构

```
/components/documents/templates/          # 🔥 文档模板中心（唯一源）
├── CustomerInquiryDocument.tsx          # 客户询价单模板
├── QuotationDocument.tsx                 # 报价单模板
├── ProformaInvoiceDocument.tsx          # 形式发票模板
├── SalesContractDocument.tsx            # 销售合同模板 ⭐
├── PurchaseOrderDocument.tsx            # 采购订单模板
├── CommercialInvoiceDocument.tsx        # 商业发票模板
├── PackingListDocument.tsx              # 装箱单模板
├── ShippingNoticeDocument.tsx           # 发货通知模板
└── StatementOfAccountDocument.tsx       # 对账单模板

/config/
├── documentTemplateMapping.ts           # 🔥 模板映射配置
└── DOCUMENT_TEMPLATE_SYNC_README.md     # 本文档

/utils/
└── documentDataAdapters.ts              # 🔥 数据适配器

/components/admin/
├── AdminActiveOrders.tsx                # 销售端 - 使用SalesContractDocument
├── QuotationManagement.tsx              # 销售端 - 使用QuotationDocument
└── ...

/components/customer/
├── CustomerInquiry.tsx                  # 客户端 - 使用CustomerInquiryDocument
└── ...
```

---

## 🔄 工作流程

### 1. 模板定义（文档中心）

所有文档模板统一定义在 `/components/documents/templates/` 目录下。

```typescript
// /components/documents/templates/SalesContractDocument.tsx

export interface SalesContractData {
  contractNo: string;
  contractDate: string;
  seller: { ... };
  buyer: { ... };
  products: Array<{ ... }>;
  terms: { ... };
  // ...
}

export const SalesContractDocument = forwardRef<HTMLDivElement, SalesContractDocumentProps>(
  ({ data }, ref) => {
    return (
      <div className="sales-contract">
        {/* 台湾大厂风格的专业销售合同布局 */}
      </div>
    );
  }
);
```

### 2. 映射配置（模板注册表）

在 `/config/documentTemplateMapping.ts` 中定义模板到业务模块的映射关系。

```typescript
export const DOCUMENT_TEMPLATE_MAPPING = {
  'sales-contract': {
    templateId: 'sales-contract',
    templateName: '销售合同',
    templateComponent: '@/components/documents/templates/SalesContractDocument',
    dataInterface: 'SalesContractData',
    usedInModules: [
      { module: 'admin-portal', subModule: 'active-orders' },
      { module: 'documentation-center', subModule: 'document-library' }
    ]
  }
};
```

### 3. 数据适配（格式转换）

在 `/utils/documentDataAdapters.ts` 中实现业务数据到模板数据的转换。

```typescript
export function adaptOrderToSalesContract(orderData: OrderData): SalesContractData {
  return {
    contractNo: generateContractNumber(orderData.orderNumber),
    contractDate: orderData.date,
    seller: getCompanyInfo(),
    buyer: {
      companyName: orderData.customer,
      address: orderData.customerAddress,
      // ...
    },
    products: orderData.products.map(p => ({
      description: p.name,
      quantity: p.quantity,
      // ...
    })),
    terms: {
      paymentTerms: orderData.paymentTerms || '30% T/T deposit, 70% balance',
      // ...
    }
  };
}
```

### 4. 业务模块使用

业务模块直接导入文档中心的模板组件，并使用适配器转换数据。

```typescript
// /components/admin/AdminActiveOrders.tsx

import { SalesContractDocument } from '../documents/templates/SalesContractDocument';
import { adaptOrderToSalesContract } from '../../utils/documentDataAdapters';

// 在预览模式中使用
<SalesContractDocument
  data={adaptOrderToSalesContract(selectedOrder)}
/>

// 在打印容器中使用（Portal）
<div className="sales-contract-print-area">
  <SalesContractDocument
    data={adaptOrderToSalesContract(selectedOrder)}
  />
</div>
```

---

## 🔧 已完成的同步工作

### ✅ 客户端 - 询价模块
- **模板**：`CustomerInquiryDocument.tsx`
- **业务模块**：`/components/customer/CustomerInquiry.tsx`
- **状态**：已同步

### ✅ 销售端 - 报价管理
- **模板**：`QuotationDocument.tsx`
- **业务模块**：`/components/admin/QuotationManagement.tsx`
- **状态**：已同步

### ✅ 销售端 - 销售合同管理（本次完成）
- **模板**：`SalesContractDocument.tsx`
- **业务模块**：`/components/admin/AdminActiveOrders.tsx`
- **适配器**：`adaptOrderToSalesContract()`
- **状态**：✅ 已完成同步
- **功能**：
  - ✅ Dialog预览使用文档中心模板
  - ✅ Portal打印容器使用文档中心模板
  - ✅ 数据适配器自动转换订单格式
  - ✅ 支持A4打印和PDF导出

---

## 📋 待完成的同步任务

### 🔲 采购员 - 采购合同模块
- **模板**：`PurchaseOrderDocument.tsx`
- **业务模块**：创建 `/components/procurement/PurchaseManagement.tsx`
- **适配器**：创建 `adaptPurchaseToPurchaseOrder()`

### 🔲 销售端 - 发货管理
- **模板**：
  - `CommercialInvoiceDocument.tsx`
  - `PackingListDocument.tsx`
  - `ShippingNoticeDocument.tsx`
- **业务模块**：`/components/admin/ShipmentManagementCenterV2.tsx`
- **适配器**：创建相应的数据适配器

### 🔲 财务端 - 应收账款
- **模板**：`StatementOfAccountDocument.tsx`
- **业务模块**：`/components/admin/AccountsReceivableList.tsx`
- **适配器**：创建 `adaptARToStatementOfAccount()`

---

## 🎓 如何添加新模板或同步现有模板

### Step 1: 创建/更新文档模板（如果不存在）

```typescript
// /components/documents/templates/NewDocument.tsx

export interface NewDocumentData {
  // 定义数据接口
}

export const NewDocument = forwardRef<HTMLDivElement, Props>(
  ({ data }, ref) => {
    return (
      <div ref={ref} className="cosun-a4-page">
        {/* 台湾大厂风格布局 */}
      </div>
    );
  }
);
```

### Step 2: 在映射配置中注册模板

```typescript
// /config/documentTemplateMapping.ts

export const DOCUMENT_TEMPLATE_MAPPING = {
  // ... 现有模板
  'new-document': {
    templateId: 'new-document',
    templateName: '新文档',
    templateComponent: '@/components/documents/templates/NewDocument',
    dataInterface: 'NewDocumentData',
    usedInModules: [
      { module: 'xxx-portal', subModule: 'xxx-module' }
    ]
  }
};
```

### Step 3: 创建数据适配器

```typescript
// /utils/documentDataAdapters.ts

export function adaptBusinessDataToNewDocument(businessData: any): NewDocumentData {
  return {
    // 转换逻辑
  };
}
```

### Step 4: 在业务模块中使用

```typescript
// /components/xxx/YourBusinessModule.tsx

import { NewDocument } from '../documents/templates/NewDocument';
import { adaptBusinessDataToNewDocument } from '../../utils/documentDataAdapters';

// 预览
<NewDocument data={adaptBusinessDataToNewDocument(yourData)} />

// 打印（使用Portal）
{createPortal(
  <div className="print-area" style={{ display: 'none' }}>
    <NewDocument data={adaptBusinessDataToNewDocument(yourData)} />
  </div>,
  document.body
)}
```

### Step 5: 记录同步日志

```typescript
import { logTemplateSync } from '../config/documentTemplateMapping';

logTemplateSync({
  timestamp: new Date().toISOString(),
  templateId: 'new-document',
  templateName: '新文档',
  version: '1.0.0',
  syncedModules: ['xxx-portal/xxx-module'],
  status: 'success',
  message: '成功同步新文档模板到业务模块'
});
```

---

## 🔥 模板升级流程

当需要升级某个文档模板时：

### 1. 修改模板文件

只需修改 `/components/documents/templates/` 中的对应模板文件。

```typescript
// 例如：升级SalesContractDocument.tsx
// 添加新字段、优化布局、修复bug等
```

### 2. 更新版本号

```typescript
// /config/documentTemplateMapping.ts

export const TEMPLATE_VERSIONS = {
  'sales-contract': '1.1.0', // 从1.0.0升级到1.1.0
  // ...
};
```

### 3. 测试所有使用该模板的模块

根据 `DOCUMENT_TEMPLATE_MAPPING` 中的 `usedInModules` 列表，测试所有相关模块：

```typescript
// 'sales-contract' 被以下模块使用：
usedInModules: [
  { module: 'admin-portal', subModule: 'active-orders' },
  { module: 'documentation-center', subModule: 'document-library' }
]
```

### 4. 部署更新

由于所有模块都引用同一个模板组件，部署后**自动生效**！

---

## 📊 模板使用追踪

可以通过映射配置快速查看：

### 查询某个模板被哪些模块使用

```typescript
import { getModulesByTemplate } from '../config/documentTemplateMapping';

const modules = getModulesByTemplate('sales-contract');
// 返回: [
//   { module: 'admin-portal', subModule: 'active-orders', description: '销售端 - 订单管理' },
//   { module: 'documentation-center', subModule: 'document-library', description: '单证制作中心' }
// ]
```

### 查询某个模块使用哪个模板

```typescript
import { getTemplateByModule } from '../config/documentTemplateMapping';

const template = getTemplateByModule('admin-portal', 'active-orders');
// 返回: {
//   templateId: 'sales-contract',
//   templateName: '销售合同',
//   templateComponent: '@/components/documents/templates/SalesContractDocument',
//   ...
// }
```

---

## 🎯 最佳实践

### ✅ DO - 推荐做法

1. **始终使用文档中心的模板**  
   ```typescript
   import { SalesContractDocument } from '../documents/templates/SalesContractDocument';
   ```

2. **使用数据适配器转换格式**  
   ```typescript
   const contractData = adaptOrderToSalesContract(orderData);
   ```

3. **遵循模板的数据接口**  
   ```typescript
   <SalesContractDocument data={contractData} />
   ```

4. **打印时使用Portal技术**  
   ```typescript
   {createPortal(<Template data={data} />, document.body)}
   ```

### ❌ DON'T - 避免做法

1. **❌ 不要复制模板代码到业务模块**  
   ```typescript
   // ❌ 错误做法
   // 在AdminActiveOrders.tsx中复制粘贴整个合同模板
   ```

2. **❌ 不要在业务模块中硬编码文档布局**  
   ```typescript
   // ❌ 错误做法
   const contract = <div>硬编码的合同HTML...</div>
   ```

3. **❌ 不要直接修改业务数据结构来适应模板**  
   ```typescript
   // ❌ 错误做法
   order.contractNo = ...  // 直接修改订单对象
   
   // ✅ 正确做法
   const contractData = adaptOrderToSalesContract(order); // 使用适配器
   ```

---

## 📝 总结

通过实施**文档模板中心化管理与同步机制**，我们实现了：

1. ✅ **文档中心作为唯一的模板源**，避免了多处维护同一模板的问题
2. ✅ **模板升级自动同步**，只需修改一处，所有使用的地方自动更新
3. ✅ **业务逻辑与模板解耦**，数据适配器负责格式转换
4. ✅ **版本控制与追溯**，可查看每个模板的使用情况和更新历史
5. ✅ **统一的文档风格**，所有文档保持台湾大厂专业风格一致性

### 当前进度

- ✅ 客户询价单 → 客户端询价模块
- ✅ 业务员报价单 → 销售端报价模块
- ✅ 销售合同 → 销售端订单管理（本次完成）
- 🔲 采购订单 → 采购员采购模块（待完成）
- 🔲 商业发票/装箱单/发货通知 → 销售端发货管理（待完成）
- 🔲 对账单 → 财务端应收账款（待完成）

---

## 🙋 FAQ

### Q: 如果我需要在某个模块中自定义模板怎么办？

A: 不建议自定义。如果确实需要特殊样式，应该：
1. 在模板组件中添加`variant`属性
2. 通过props控制不同的显示模式
3. 保持模板的统一性

### Q: 数据适配器会影响性能吗？

A: 不会。适配器只是数据格式转换，运行时开销极小。而且只在渲染时执行一次。

### Q: 如何确保所有模块都使用最新版本的模板？

A: 由于采用direct import，只要重新部署应用，所有模块都会自动使用最新版本。无需手动同步。

---

**作者**: COSUN B2B System  
**最后更新**: 2025-12-14  
**版本**: 1.0.0
