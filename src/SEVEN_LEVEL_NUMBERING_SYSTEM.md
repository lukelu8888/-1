# 7级编号体系实现文档

## 📋 完整业务流程和编号关系

```
客户询价 → 采购需求 → 询价供应商 → 供应商报价 → 销售报价 → 销售订单 → 采购订单
   ↓           ↓           ↓           ↓           ↓           ↓           ↓
  INQ         QR          XJ          BJ          QT          SO          PO
```

---

## 🔢 7级编号体系详解

### **1. INQ - 客户询价单（Customer Inquiry）**
- **格式**：`INQ-{REGION}-YYMMDD-XXXX`
- **示例**：`INQ-NA-251219-0001`
- **创建者**：客户（Customer Portal）
- **可见范围**：客户、业务员
- **说明**：客户提交的产品询价需求

### **2. QR - 采购需求单（Purchase Requirement）**
- **格式**：`QR-{REGION}-YYMMDD-XXXX`
- **示例**：`QR-NA-251219-1234`
- **创建者**：业务员（根据INQ创建）
- **可见范围**：业务员、采购员
- **说明**：业务员整理客户需求，提交给采购部门

### **3. XJ - 询价单（RFQ to Supplier）**
- **格式**：`XJ-{REGION}-YYMMDD-XXXX`
- **示例**：`XJ-NA-251219-0001`
- **创建者**：采购员（根据QR创建多个）
- **可见范围**：采购员、对应的供应商
- **说明**：采购员向供应商发出的询价单，一个QR可拆分为多个XJ

### **4. BJ - 供应商报价单（Supplier Quotation）**
- **格式**：`BJ-YYMMDD-XXXX`（⚠️ 无区域代码）
- **示例**：`BJ-251219-0001`
- **创建者**：供应商（Supplier Portal）
- **可见范围**：供应商、采购员
- **说明**：供应商针对XJ提交的报价

### **5. QT - 销售报价单（Sales Quotation）**
- **格式**：`QT-{REGION}-YYMMDD-XXXX`
- **示例**：`QT-NA-251219-6789`
- **创建者**：业务员（根据BJ成本制定销售价格）
- **可见范围**：业务员、审批人、客户
- **说明**：业务员根据采购成本制定的销售报价，**需要审批**

### **6. SO - 销售订单（Sales Order）**
- **格式**：`SO-{REGION}-YYMMDD-XXXX`
- **示例**：`SO-NA-251219-8888`
- **创建者**：业务员（客户接受QT后创建）
- **可见范围**：业务员、采购员、客户
- **说明**：客户接受报价后确认的销售订单

### **7. PO - 采购订单（Purchase Order to Supplier）**
- **格式**：`PO-{REGION}-YYMMDD-XXXX`
- **示例**：`PO-NA-251219-5678`
- **创建者**：采购员（根据SO创建）
- **可见范围**：采购员、供应商
- **说明**：采购员向供应商下达的采购订单

---

## 🔗 编号关联关系

### **典型案例：Best Buy询价洗衣机、烘干机、电热水器**

```
INQ-NA-251219-0001 (Best Buy询价3种产品)
   ↓
QR-NA-251219-1234 (业务员Tom整理采购需求)
   ↓
XJ-NA-251219-0001 → 宁波厂A (洗衣机) → BJ-251219-0001 ($210)
XJ-NA-251219-0002 → 上海厂B (洗衣机) → BJ-251219-0002 ($195) 👑
XJ-NA-251219-0003 → 广州厂C (烘干机) → BJ-251219-0003 ($185)
XJ-NA-251219-0004 → 佛山厂D (电热水器) → BJ-251219-0004 ($115) 👑
XJ-NA-251219-0005 → 中山厂E (电热水器) → BJ-251219-0005 ($118)
   ↓
QT-NA-251219-6789 (业务员Tom制定销售报价)
   成本: $390,000 | 报价: $461,000 | 利润: $71,000 (18.2%)
   审批: 区域主管David ✅ → 销售总监Michael ✅
   ↓
客户接受 ✅
   ↓
SO-NA-251219-8888 (销售订单)
   ↓
PO-NA-251219-5678 → 上海厂B (洗衣机 $195)
PO-NA-251219-5679 → 广州厂C (烘干机 $185)
PO-NA-251219-5680 → 佛山厂D (电热水器 $115)
```

---

## 📊 数据结构设计

### **关键数据关联**

```typescript
// QR采购需求
interface PurchaseRequirement {
  qrNumber: string; // QR-NA-251219-1234
  sourceInquiry: string; // INQ-NA-251219-0001
  items: PurchaseRequirementItem[];
}

// XJ询价单（一个QR可生成多个XJ）
interface RFQInquiry {
  xjNumber: string; // XJ-NA-251219-0001
  qrNumber: string; // 关联QR
  supplierEmail: string;
  product: Product; // ⚠️ 一个XJ只包含一个产品
}

// BJ供应商报价
interface Quotation {
  bjNumber: string; // BJ-251219-0001
  xjNumber: string; // 关联XJ
  supplierEmail: string;
  quotedPrice: number;
}

// QT销售报价
interface SalesQuotation {
  qtNumber: string; // QT-NA-251219-6789
  qrNumber: string; // 关联QR
  inqNumber: string; // 关联INQ
  items: {
    costPrice: number; // 从BJ获取
    selectedBJ: string; // BJ-251219-0002
    salesPrice: number; // 销售价格
    profitMargin: number; // 利润率
  }[];
  approvalStatus: 'draft' | 'pending_approval' | 'approved' | 'rejected';
}

// SO销售订单
interface SalesOrder {
  soNumber: string; // SO-NA-251219-8888
  qtNumber: string; // 关联QT
  qrNumber: string;
  inqNumber: string;
  items: SalesOrderItem[]; // 从QT复制，价格锁定
  poNumbers: string[]; // 关联的PO
}

// PO采购订单
interface PurchaseOrder {
  poNumber: string; // PO-NA-251219-5678
  soNumber: string; // 关联SO
  bjNumber: string; // 关联BJ
  xjNumber: string;
  qrNumber: string;
}
```

---

## 🎯 审批规则

### **QT销售报价审批流程**

```typescript
审批条件：
- 总金额 < $20,000 → 仅需区域业务主管审批（1级）
- 总金额 ≥ $20,000 → 需要区域主管 + 销售总监审批（2级）

审批链：
1. 业务员Tom创建QT-NA-251219-6789
   ↓
2. 自动提交审批（总金额$461,000 ≥ $20,000）
   ↓
3. 区域业务主管David审批 ✅
   ↓
4. 销售总监Michael审批 ✅
   ↓
5. 业务员收到通知，可发送给客户
```

---

## 🔐 权限隔离原则

### **严格的数据隔离**

| 角色 | 可见INQ | 可见QR | 可见XJ | 可见BJ | 可见QT | 可见SO | 可见PO |
|------|---------|--------|--------|--------|--------|--------|--------|
| **客户** | ✅ 自己的 | ❌ | ❌ | ❌ | ✅ 自己的 | ✅ 自己的 | ❌ |
| **业务员** | ✅ | ✅ 自己创建的 | ⚠️ 只看编号 | ⚠️ 只看成本汇总 | ✅ 自己的 | ✅ 自己的 | ❌ |
| **采购员** | ❌ | ✅ 所有 | ✅ 所有 | ✅ 所有 | ❌ | ❌ | ✅ 所有 |
| **供应商** | ❌ | ❌ | ✅ 发给自己的 | ✅ 自己提交的 | ❌ | ❌ | ✅ 发给自己的 |

### **⚠️ 关键隔离规则**

1. **业务员不能看到供应商信息**
   - 业务员只能看到采购成本汇总，不能看到具体供应商是谁
   - 防止业务员跳过公司直接联系供应商

2. **采购员不能看到客户信息**
   - 采购员看QR时，只看到产品需求，看不到客户名称
   - 防止采购员跳过公司直接联系客户

3. **供应商不能看到客户信息**
   - 供应商收到XJ时，只看到COSUN的采购需求
   - 完全不知道最终客户是谁
   - 防止供应商跳单

4. **供应商之间完全隔离**
   - 供应商A看不到供应商B的报价
   - 防止供应商串通

---

## 📁 文件结构

### **新增Context文件**

```
/contexts/
├── SalesQuotationContext.tsx  ✅ 销售报价（QT）
├── SalesOrderContext.tsx       ✅ 销售订单（SO）
├── PurchaseRequirementContext.tsx  （已存在，对应QR）
├── QuotationRequestContext.tsx     （已存在，对应XJ）
├── RFQContext.tsx                  （已存在，可能对应BJ）
├── PurchaseOrderContext.tsx        （已存在，对应PO）
└── ApprovalContext.tsx             （已存在，审批流程）
```

### **编号生成工具**

```
/utils/rfqNumberGenerator.ts  ✅ 已扩展支持7级编号

新增函数：
- generateINQNumber(region)
- generateQRNumber(region)
- generateXJNumber(region)
- generateBJNumber()  // ⚠️ 无region参数
- generateQTNumber(region)
- generateSONumber(region)
- generatePurchaseOrderNumber(region)
```

---

## 🚀 下一步实施计划

### **Phase 1: 基础模块（优先级最高）**
1. ✅ 创建SalesQuotationContext（QT）
2. ✅ 创建SalesOrderContext（SO）
3. ✅ 扩展编号生成工具
4. ⏳ 业务员端"销售报价管理"模块
5. ⏳ 审批工作台（区域主管、销售总监）

### **Phase 2: 采购流程整合**
1. ⏳ 采购员"成本汇总反馈"功能
2. ⏳ 采购员"询价对比"界面
3. ⏳ 业务员"查看采购成本"界面

### **Phase 3: 完整流程打通**
1. ⏳ QR → XJ 拆分询价功能
2. ⏳ BJ → QT 成本计算功能
3. ⏳ QT → SO 转换功能
4. ⏳ SO → PO 采购下单功能

---

## 📝 关键业务规则

1. **一个INQ对应一个QR**
2. **一个QR可拆分为多个XJ**（按产品+供应商拆分）
3. **一个XJ对应一个BJ**
4. **一个QR对应一个QT**（汇总所有产品的销售报价）
5. **一个QT可对应0个或1个SO**（客户可能拒绝报价）
6. **一个SO可对应多个PO**（不同产品发给不同供应商）
7. **QT需要审批，SO不需要审批**
8. **报价编号（QT）和订单编号（SO）严格区分，不可合并**

---

## 🎨 UI设计原则

- **台湾大厂风格**：紧凑、专业、高信息密度
- **主色调**：`#F96302`（橙色）
- **字体大小**：统一14px（极致紧凑）
- **卡片式布局**：关键信息突出，次要信息折叠
- **状态可视化**：清晰的流程进度条

---

**文档创建时间**：2024-12-19  
**版本**：v1.0  
**状态**：✅ 编号体系已实现，模块开发中
