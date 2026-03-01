# 当前系统实施状态详细对比

## 📊 7级编号体系 vs 现有实现对比表

| 编号 | 名称 | 格式 | Context文件 | 状态 | 说明 |
|------|------|------|-------------|------|------|
| **INQ** | 客户询价单 | INQ-NA-251219-0001 | `/contexts/InquiryContext.tsx` | ✅ **已实现** | 客户提交询价，字段完整 |
| **QR** | 采购需求单 | QR-NA-251219-1234 | `/contexts/PurchaseRequirementContext.tsx` | ✅ **已实现** | 业务员创建采购需求 |
| **XJ** | 询价单（发给供应商） | XJ-NA-251219-0001 | `/contexts/RFQContext.tsx` | ⚠️ **混乱** | 字段名rfqNumber，实际存储多种编号 |
| **BJ** | 供应商报价单 | BJ-251219-0001 | `/contexts/RFQContext.tsx` | ⚠️ **混乱** | 与XJ共用一个Context，字段quotes数组 |
| **QT** | 销售报价单 | QT-NA-251219-6789 | `/contexts/SalesQuotationContext.tsx` | ✅ **刚创建** | 业务员销售报价，需审批 |
| **SO** | 销售订单 | SO-NA-251219-8888 | `/contexts/SalesOrderContext.tsx` | ✅ **刚创建** | 客户确认后的订单 |
| **PO** | 采购订单（发给供应商） | PO-NA-251219-5678 | `/contexts/PurchaseOrderContext.tsx` | ✅ **已实现** | 采购员向供应商下单 |

---

## 🔍 详细分析

### ✅ **1. INQ - 客户询价单（已完整实现）**

**Context**: `/contexts/InquiryContext.tsx`

**数据结构**:
```typescript
export interface Inquiry {
  id: string;
  date: string;
  userEmail: string;
  products: CartItem[];
  status: 'draft' | 'pending' | 'quoted' | 'approved' | 'rejected';
  isSubmitted: boolean;
  region?: RegionType; // 'North America' | 'South America' | 'Europe & Africa'
  buyerInfo?: {...};
  message?: string;
  createdAt: number;
  submittedAt?: number;
}
```

**评估**: ✅ **完全符合INQ需求**
- ✅ 有区域字段
- ✅ 有客户信息
- ✅ 有产品列表
- ✅ 有状态管理
- ⚠️ **缺少INQ编号字段**（需要添加`inquiryNumber: string`）

---

### ✅ **2. QR - 采购需求单（已完整实现）**

**Context**: `/contexts/PurchaseRequirementContext.tsx`

**数据结构**:
```typescript
export interface PurchaseRequirement {
  id: string;
  requirementNo: string; // ✅ 这就是QR编号
  source: '销售订单' | '库存预警' | '战略备货';
  sourceRef?: string; // 来源单号（如销售订单号）
  items: PurchaseRequirementItem[]; // ✅ 多产品
  status: 'pending' | 'partial' | 'processing' | 'completed';
  region?: string; // ✅ 区域
  salesOrderNo?: string;
  // ❌ 没有customerName - 符合权限隔离原则
}
```

**评估**: ✅ **完全符合QR需求**
- ✅ 有QR编号（requirementNo）
- ✅ 支持多产品
- ✅ 有区域字段
- ✅ 采购员看不到客户信息（权限隔离）
- ⚠️ **缺少关联INQ编号字段**（需要添加`sourceInquiryNumber: string`）

---

### ⚠️ **3. XJ - 询价单（字段混乱，需要重构）**

**Context**: `/contexts/RFQContext.tsx`

**当前数据结构**:
```typescript
export interface RFQ {
  id: string;
  rfqNumber: string; // ⚠️ 字段名混乱！实际存储QR编号
  
  // 🔥 供应商专属编号
  supplierRfqNo?: string; // ✅ 这个才是XJ编号！XJ-251218-7184
  supplierQuotationNo?: string; // ✅ 这个是BJ编号！BJ-251218-7184
  
  // 🔥 关联编号
  sourceQRNumber?: string; // QR编号
  requirementNo?: string; // 🔥 COSUN采购需求编号（重复了）
  
  // 🔥 产品（支持多个）
  products?: RFQProduct[]; // ✅ 新字段，多产品
  
  // 🔥 产品（单个，兼容旧版）
  productName: string;
  modelNo: string;
  // ... 旧字段
  
  // 🔥 供应商（单个）
  supplierCode: string;
  supplierName: string;
  supplierEmail: string;
  
  // 🔥 状态
  status: RFQStatus;
  
  // 🔥 供应商报价（数组）
  quotes?: Array<{...}>; // ⚠️ 这里混入了BJ的数据
}
```

**评估**: ⚠️ **字段混乱，需要重构**

**问题**:
1. ❌ 字段名`rfqNumber`不清晰，实际存储QR编号
2. ⚠️ `supplierRfqNo`才是真正的XJ编号
3. ⚠️ `quotes`数组混入了BJ报价数据
4. ⚠️ 同时支持单产品和多产品（兼容历史）

**建议重构**:
```typescript
export interface SupplierRFQ {
  id: string;
  xjNumber: string; // XJ-NA-251219-0001（询价单编号）
  qrNumber: string; // QR-NA-251219-1234（关联采购需求）
  
  // 供应商信息（一个XJ发给一个供应商）
  supplierCode: string;
  supplierName: string;
  supplierEmail: string;
  
  // 产品信息（一个XJ包含一个产品）
  product: RFQProduct; // ⚠️ 单数，不是数组
  
  // 询价信息
  expectedDate: string;
  quotationDeadline: string;
  
  // 状态
  status: 'pending' | 'quoted' | 'expired';
  
  // 关联的BJ编号（如果供应商已报价）
  bjNumber?: string; // BJ-251219-0001
}
```

---

### ⚠️ **4. BJ - 供应商报价单（与XJ混在一起，需要分离）**

**Context**: 目前在 `/contexts/RFQContext.tsx` 的`quotes`数组里

**当前数据结构**:
```typescript
// 在RFQ接口内部
quotes?: Array<{
  supplierCode: string;
  supplierName: string;
  quotedDate: string;
  quotedPrice: number;
  currency: string;
  leadTime: number;
  moq: number;
  validityDays: number;
  paymentTerms: string;
  remarks?: string;
}>;
```

**评估**: ❌ **需要独立成单独的Context**

**建议新建**:
```typescript
// /contexts/SupplierQuotationContext.tsx
export interface SupplierQuotation {
  id: string;
  bjNumber: string; // BJ-251219-0001（供应商报价单编号）
  xjNumber: string; // XJ-NA-251219-0001（关联询价单）
  qrNumber: string; // QR-NA-251219-1234（关联采购需求）
  
  // 供应商信息
  supplierCode: string;
  supplierName: string;
  supplierEmail: string;
  
  // 报价信息
  product: {
    productName: string;
    modelNo: string;
    quantity: number;
    unit: string;
  };
  quotedPrice: number;
  currency: string;
  leadTime: number;
  moq: number;
  validityDays: number;
  paymentTerms: string;
  
  // 时间
  quotedDate: string;
  
  // 状态
  status: 'pending' | 'accepted' | 'rejected';
  
  remarks?: string;
}
```

---

### ✅ **5. QT - 销售报价单（刚刚新建，完整）**

**Context**: `/contexts/SalesQuotationContext.tsx` ✅

**数据结构**:
```typescript
export interface SalesQuotation {
  id: string;
  qtNumber: string; // QT-NA-251219-6789
  
  // 关联单据
  qrNumber: string; // 关联QR
  inqNumber: string; // 关联INQ
  
  // 客户信息
  region: 'NA' | 'SA' | 'EU';
  customerName: string;
  customerEmail: string;
  
  // 业务员信息
  salesPerson: string;
  salesPersonName: string;
  
  // 产品和价格
  items: SalesQuotationItem[];
  totalCost: number;
  totalPrice: number;
  totalProfit: number;
  profitRate: number;
  
  // 审批状态
  approvalStatus: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  approvalChain: [...];
  
  // 客户响应
  customerStatus: 'not_sent' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'negotiating' | 'expired';
  
  // 版本管理
  version: number;
  previousVersion?: string;
  
  // 关联SO
  soNumber?: string; // 客户接受后生成
}
```

**评估**: ✅ **完全符合QT需求**

---

### ✅ **6. SO - 销售订单（刚刚新建，完整）**

**Context**: `/contexts/SalesOrderContext.tsx` ✅

**数据结构**:
```typescript
export interface SalesOrder {
  id: string;
  soNumber: string; // SO-NA-251219-8888
  
  // 关联单据
  qtNumber: string; // 关联QT
  qrNumber: string;
  inqNumber: string;
  
  // 客户信息
  region: 'NA' | 'SA' | 'EU';
  customerName: string;
  
  // 订单产品（从QT复制，价格锁定）
  items: SalesOrderItem[];
  
  // 订单状态
  status: 'confirmed' | 'purchasing' | 'in_production' | 'qc_inspection' | 'shipping' | 'delivered' | 'completed' | 'cancelled';
  
  // 关联的PO
  poNumbers: string[]; // [PO-5678, PO-5679, PO-5680]
}
```

**评估**: ✅ **完全符合SO需求**

---

### ✅ **7. PO - 采购订单（已完整实现）**

**Context**: `/contexts/PurchaseOrderContext.tsx`

**数据结构**:
```typescript
export interface PurchaseOrder {
  id: string;
  poNumber: string; // 采购订单号
  requirementNo?: string; // 关联的采购需求编号（QR）
  sourceRef?: string; // 来源单号（销售订单号等）
  
  // 订单组信息
  orderGroup?: string;
  isPartOfGroup?: boolean;
  
  // RFQ关联信息
  rfqId?: string;
  rfqNumber?: string;
  selectedQuote?: {...}; // 选中的供应商报价
  
  // 供应商信息（每个PO只对应1个供应商）
  supplierName: string;
  supplierCode: string;
  
  // 区域信息
  region?: string;
  // ❌ 没有customerName - 符合权限隔离原则
  
  // 产品
  items: PurchaseOrderItem[];
  
  // 状态
  status: POStatus;
  paymentStatus: PaymentStatus;
}
```

**评估**: ✅ **完全符合PO需求**
- ✅ 有PO编号
- ✅ 关联QR编号
- ✅ 关联RFQ/报价信息
- ✅ 采购员看不到客户信息（权限隔离）
- ⚠️ **需要添加关联SO编号字段**（`sourceSONumber: string`）

---

## 📝 总结：已实现 vs 缺失

### ✅ **已完整实现的模块**
1. ✅ **INQ** - InquiryContext（需要添加inquiryNumber字段）
2. ✅ **QR** - PurchaseRequirementContext（需要添加sourceInquiryNumber）
3. ✅ **QT** - SalesQuotationContext（新建，完整）
4. ✅ **SO** - SalesOrderContext（新建，完整）
5. ✅ **PO** - PurchaseOrderContext（需要添加sourceSONumber）

### ⚠️ **需要重构的模块**
1. ⚠️ **XJ** - RFQContext（字段混乱，建议重命名为SupplierRFQContext）
2. ⚠️ **BJ** - 目前在RFQContext的quotes数组（建议独立成SupplierQuotationContext）

### ❌ **完全缺失的模块**
- **无**（所有7级都有对应的数据结构，只是XJ和BJ需要重构）

---

## 🔧 需要修复的问题清单

### **优先级P0（必须修复）**

1. **INQ添加编号字段**
   ```typescript
   // /contexts/InquiryContext.tsx
   export interface Inquiry {
     // ... 现有字段
     inquiryNumber?: string; // 🔥 新增：INQ-NA-251219-0001
   }
   ```

2. **QR添加关联INQ字段**
   ```typescript
   // /contexts/PurchaseRequirementContext.tsx
   export interface PurchaseRequirement {
     // ... 现有字段
     sourceInquiryNumber?: string; // 🔥 新增：关联INQ编号
   }
   ```

3. **PO添加关联SO字段**
   ```typescript
   // /contexts/PurchaseOrderContext.tsx
   export interface PurchaseOrder {
     // ... 现有字段
     sourceSONumber?: string; // 🔥 新增：关联SO编号
   }
   ```

### **优先级P1（建议重构，不影响功能）**

4. **重构RFQContext → SupplierRFQContext**
   - 重命名为更清晰的名称
   - 字段`rfqNumber` → `xjNumber`
   - 字段`supplierRfqNo` 删除（重复）
   - 移除`quotes`数组（BJ应该独立）

5. **新建SupplierQuotationContext（BJ）**
   - 从RFQContext的quotes数组分离出来
   - 独立管理供应商报价
   - 一个BJ对应一个XJ

---

## 🎯 实施建议

### **方案A：最小改动（推荐）**
仅添加缺失的关联字段，不重构现有Context：
1. ✅ INQ添加`inquiryNumber`
2. ✅ QR添加`sourceInquiryNumber`
3. ✅ PO添加`sourceSONumber`
4. ✅ 在现有RFQContext中使用`supplierRfqNo`作为XJ编号
5. ✅ 在现有RFQContext的quotes数组中使用`supplierQuotationNo`作为BJ编号

**优点**: 改动最小，不影响现有功能  
**缺点**: 字段名不够清晰

### **方案B：完整重构（彻底但工作量大）**
重构XJ和BJ的Context：
1. ✅ 创建SupplierRFQContext（XJ）
2. ✅ 创建SupplierQuotationContext（BJ）
3. ✅ 迁移现有RFQContext的数据
4. ✅ 更新所有引用

**优点**: 架构清晰，语义准确  
**缺点**: 工作量大，需要迁移数据

---

**我的建议：先采用方案A，快速打通业务流程，后期再考虑方案B重构。**

你觉得呢？🎯
