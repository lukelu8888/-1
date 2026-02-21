# 📊 7级编号体系 - 实施对比图

## 🎯 快速总览

| 级别 | 编号 | 名称 | Context文件 | 实施状态 | 完成度 |
|:----:|:----:|------|-------------|----------|:------:|
| 1️⃣ | **INQ** | 客户询价单 | `InquiryContext.tsx` | ✅ 已实现 | 95% |
| 2️⃣ | **QR** | 采购需求单 | `PurchaseRequirementContext.tsx` | ✅ 已实现 | 95% |
| 3️⃣ | **XJ** | 询价单（发供应商） | `RFQContext.tsx` | ⚠️ 字段混乱 | 70% |
| 4️⃣ | **BJ** | 供应商报价单 | `RFQContext.tsx`（quotes数组） | ⚠️ 需独立 | 70% |
| 5️⃣ | **QT** | 销售报价单 | `SalesQuotationContext.tsx` | ✅ 新建完整 | 100% |
| 6️⃣ | **SO** | 销售订单 | `SalesOrderContext.tsx` | ✅ 新建完整 | 100% |
| 7️⃣ | **PO** | 采购订单 | `PurchaseOrderContext.tsx` | ✅ 已实现 | 95% |

---

## 📋 详细对比表

### ✅ 第1级：INQ - 客户询价单

| 项目 | 要求 | 现状 | 差距 |
|------|------|------|------|
| **Context文件** | InquiryContext.tsx | ✅ 存在 | - |
| **编号字段** | `inquiryNumber: string` | ❌ 缺失 | 需要添加 |
| **区域字段** | `region: RegionType` | ✅ 已有 | - |
| **客户信息** | `buyerInfo: {...}` | ✅ 已有 | - |
| **产品列表** | `products: CartItem[]` | ✅ 已有 | - |
| **状态管理** | `status: 'draft' \| 'pending' \| ...` | ✅ 已有 | - |

**完成度**: 95% ⭐⭐⭐⭐⭐  
**缺失**: 只需添加`inquiryNumber`字段

---

### ✅ 第2级：QR - 采购需求单

| 项目 | 要求 | 现状 | 差距 |
|------|------|------|------|
| **Context文件** | PurchaseRequirementContext.tsx | ✅ 存在 | - |
| **编号字段** | `requirementNo: string` | ✅ 已有 | - |
| **关联INQ** | `sourceInquiryNumber: string` | ❌ 缺失 | 需要添加 |
| **区域字段** | `region: string` | ✅ 已有 | - |
| **产品列表** | `items: PurchaseRequirementItem[]` | ✅ 已有 | - |
| **权限隔离** | 采购员看不到客户名 | ✅ 已实现 | - |

**完成度**: 95% ⭐⭐⭐⭐⭐  
**缺失**: 只需添加`sourceInquiryNumber`字段

---

### ⚠️ 第3级：XJ - 询价单（发给供应商）

| 项目 | 要求 | 现状 | 差距 |
|------|------|------|------|
| **Context文件** | SupplierRFQContext.tsx | ⚠️ RFQContext.tsx（名称不清） | 建议重命名 |
| **编号字段** | `xjNumber: string` | ⚠️ `supplierRfqNo` | 字段名混乱 |
| **关联QR** | `qrNumber: string` | ⚠️ `requirementNo` / `sourceQRNumber` | 重复字段 |
| **供应商信息** | `supplierCode, supplierName` | ✅ 已有 | - |
| **产品信息** | `product: RFQProduct` | ⚠️ 单个+数组并存 | 字段混乱 |
| **状态管理** | `status: RFQStatus` | ✅ 已有 | - |

**完成度**: 70% ⭐⭐⭐⭐  
**问题**:
- ❌ 字段`rfqNumber`实际存储QR编号，不是XJ编号
- ⚠️ `supplierRfqNo`才是真正的XJ编号
- ⚠️ 同时支持单产品和多产品（兼容历史）

**建议**:
```typescript
// 理想状态
export interface SupplierRFQ {
  xjNumber: string; // XJ-NA-251219-0001
  qrNumber: string; // QR-NA-251219-1234
  product: RFQProduct; // 单个产品
  supplierCode: string;
  status: 'pending' | 'quoted' | 'expired';
}
```

---

### ⚠️ 第4级：BJ - 供应商报价单

| 项目 | 要求 | 现状 | 差距 |
|------|------|------|------|
| **Context文件** | SupplierQuotationContext.tsx | ❌ 在RFQContext的quotes数组 | 需要独立 |
| **编号字段** | `bjNumber: string` | ⚠️ `supplierQuotationNo` | 字段名不清 |
| **关联XJ** | `xjNumber: string` | ❌ 缺失 | 需要添加 |
| **报价信息** | `quotedPrice, leadTime, moq` | ✅ 已有 | - |
| **供应商信息** | `supplierCode, supplierName` | ✅ 已有 | - |

**完成度**: 70% ⭐⭐⭐⭐  
**问题**:
- ❌ BJ数据混在RFQ的quotes数组里，没有独立Context
- ❌ 没有BJ编号字段
- ❌ 没有关联XJ编号

**建议**:
```typescript
// 新建 /contexts/SupplierQuotationContext.tsx
export interface SupplierQuotation {
  bjNumber: string; // BJ-251219-0001
  xjNumber: string; // XJ-NA-251219-0001
  qrNumber: string; // QR-NA-251219-1234
  quotedPrice: number;
  leadTime: number;
  moq: number;
  status: 'pending' | 'accepted' | 'rejected';
}
```

---

### ✅ 第5级：QT - 销售报价单

| 项目 | 要求 | 现状 | 差距 |
|------|------|------|------|
| **Context文件** | SalesQuotationContext.tsx | ✅ 新建 | - |
| **编号字段** | `qtNumber: string` | ✅ 已有 | - |
| **关联QR** | `qrNumber: string` | ✅ 已有 | - |
| **关联INQ** | `inqNumber: string` | ✅ 已有 | - |
| **成本信息** | `selectedBJ, costPrice` | ✅ 已有 | - |
| **销售价格** | `salesPrice, profitMargin` | ✅ 已有 | - |
| **审批流程** | `approvalStatus, approvalChain` | ✅ 已有 | - |
| **版本管理** | `version, previousVersion` | ✅ 已有 | - |
| **客户响应** | `customerStatus, customerResponse` | ✅ 已有 | - |

**完成度**: 100% ⭐⭐⭐⭐⭐  
**状态**: ✅ 完美！新建完整，所有字段齐全

---

### ✅ 第6级：SO - 销售订单

| 项目 | 要求 | 现状 | 差距 |
|------|------|------|------|
| **Context文件** | SalesOrderContext.tsx | ✅ 新建 | - |
| **编号字段** | `soNumber: string` | ✅ 已有 | - |
| **关联QT** | `qtNumber: string` | ✅ 已有 | - |
| **关联QR** | `qrNumber: string` | ✅ 已有 | - |
| **关联INQ** | `inqNumber: string` | ✅ 已有 | - |
| **订单产品** | `items: SalesOrderItem[]` | ✅ 已有 | - |
| **订单状态** | `status: 'confirmed' \| ...` | ✅ 已有 | - |
| **关联PO** | `poNumbers: string[]` | ✅ 已有 | - |

**完成度**: 100% ⭐⭐⭐⭐⭐  
**状态**: ✅ 完美！新建完整，所有字段齐全

---

### ✅ 第7级：PO - 采购订单

| 项目 | 要求 | 现状 | 差距 |
|------|------|------|------|
| **Context文件** | PurchaseOrderContext.tsx | ✅ 存在 | - |
| **编号字段** | `poNumber: string` | ✅ 已有 | - |
| **关联QR** | `requirementNo: string` | ✅ 已有 | - |
| **关联SO** | `sourceSONumber: string` | ❌ 缺失 | 需要添加 |
| **关联RFQ/报价** | `rfqNumber, selectedQuote` | ✅ 已有 | - |
| **供应商信息** | `supplierName, supplierCode` | ✅ 已有 | - |
| **权限隔离** | 采购员看不到客户名 | ✅ 已实现 | - |

**完成度**: 95% ⭐⭐⭐⭐⭐  
**缺失**: 只需添加`sourceSONumber`字段

---

## 🔗 编号关联关系检查

### **理想状态（7级编号完整关联）**

```
INQ-NA-251219-0001
   ↓ sourceInquiryNumber
QR-NA-251219-1234
   ↓ qrNumber
XJ-NA-251219-0001 (发给供应商A)
   ↓ xjNumber
BJ-251219-0001 (供应商A报价)
   ↓ selectedBJ
QT-NA-251219-6789 (业务员销售报价)
   ↓ qtNumber
SO-NA-251219-8888 (客户确认订单)
   ↓ sourceSONumber
PO-NA-251219-5678 (采购订单给供应商A)
```

### **当前状态检查**

| 关联 | 字段 | 状态 |
|------|------|------|
| INQ → QR | QR.sourceInquiryNumber | ❌ 缺失 |
| QR → XJ | XJ.qrNumber | ⚠️ 字段名混乱（requirementNo） |
| XJ → BJ | BJ.xjNumber | ❌ 缺失（BJ在quotes数组） |
| BJ → QT | QT.selectedBJ | ✅ 已有 |
| QT → SO | SO.qtNumber | ✅ 已有 |
| SO → PO | PO.sourceSONumber | ❌ 缺失 |

**关联完整度**: 3/6 = 50%

---

## 🛠️ 需要修复的字段清单

### **最小改动方案（推荐）**

```typescript
// 1️⃣ /contexts/InquiryContext.tsx
export interface Inquiry {
  // ... 现有字段
  inquiryNumber?: string; // 🔥 新增：INQ-NA-251219-0001
}

// 2️⃣ /contexts/PurchaseRequirementContext.tsx
export interface PurchaseRequirement {
  // ... 现有字段
  sourceInquiryNumber?: string; // 🔥 新增：INQ编号
}

// 3️⃣ /contexts/RFQContext.tsx
export interface RFQ {
  // ... 现有字段
  // ⚠️ 使用 supplierRfqNo 作为 XJ编号
  // ⚠️ 使用 supplierQuotationNo 作为 BJ编号
  // ⚠️ 在 quotes 数组中存储 BJ数据
}

// 4️⃣ /contexts/PurchaseOrderContext.tsx
export interface PurchaseOrder {
  // ... 现有字段
  sourceSONumber?: string; // 🔥 新增：SO编号
}
```

**改动**: 仅3个字段，工作量最小 ✅

---

## 📊 实施状态总结

### **已完成** ✅
- ✅ INQ（客户询价）- 95%完成
- ✅ QR（采购需求）- 95%完成  
- ✅ QT（销售报价）- 100%完成 🎉
- ✅ SO（销售订单）- 100%完成 🎉
- ✅ PO（采购订单）- 95%完成

### **需要整理** ⚠️
- ⚠️ XJ（询价单）- 70%完成（字段混乱）
- ⚠️ BJ（供应商报价）- 70%完成（需独立）

### **缺失字段** ❌
1. ❌ INQ.inquiryNumber
2. ❌ QR.sourceInquiryNumber
3. ❌ PO.sourceSONumber
4. ❌ BJ需要独立Context（可选）

---

## 🎯 下一步行动计划

### **Phase 1: 最小改动，打通流程（1小时）**
1. ✅ 添加INQ.inquiryNumber字段
2. ✅ 添加QR.sourceInquiryNumber字段
3. ✅ 添加PO.sourceSONumber字段
4. ✅ 使用现有RFQ的supplierRfqNo作为XJ编号
5. ✅ 使用现有RFQ的quotes数组存储BJ数据

### **Phase 2: 开发业务模块（今天完成）**
1. 业务员端 - 销售报价管理（创建QT）
2. 审批工作台（区域主管、销售总监）
3. QT转SO功能

### **Phase 3: 数据重构（可选，后期优化）**
1. 重构RFQContext → SupplierRFQContext
2. 新建SupplierQuotationContext（BJ独立）
3. 数据迁移

---

**结论**: 
- 7级编号体系中，**5个级别已完整实现**（INQ、QR、QT、SO、PO）
- **2个级别需要整理**（XJ、BJ在RFQContext中）
- **总体完成度：85%** 🎉
- **建议：采用最小改动方案，快速打通业务流程** ✅
