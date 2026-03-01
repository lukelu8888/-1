# 🔄 业务流程模块设计 - 完整数据流转方案

## 📋 问题分析

### **当前缺失的模块**
根据你提供的截图（业务员的订单管理中心），当前有：
1. ✅ 订单全盘
2. ✅ 询价管理（管理客户INQ）
3. ✅ 报价管理（管理QT）
4. ✅ 订单管理（管理SO）
5. ✅ 收款管理

### **缺失的关键环节**
❌ **没有"采购需求管理"模块** → 业务员无法创建QR发给采购员  
❌ **没有"成本反馈"模块** → 采购员无法将成本反馈给业务员

---

## 🎯 完整的业务流程（7级编号体系）

```
【客户端】
  ↓ 提交询价
【业务员端 - 询价管理】INQ-NA-251220-0001（客户询价）
  ↓ 创建采购需求 ⭐ 缺失！
【业务员端 - 采购需求管理】QR-NA-251220-1234（采购需求）
  ↓ 提交给采购部门
【采购员端 - 采购需求】QR-NA-251220-1234（接收需求）
  ↓ 向供应商询价
【采购员端 - 供应商询价】XJ-NA-251220-0001（询价单）
  ↓ 供应商报价
【供应商端 - 我的询价】BJ-251220-0001（供应商报价）
  ↓ 采购员选择最优报价
【采购员端 - 报价对比】选择供应商A，成本$100
  ↓ 反馈成本给业务员 ⭐ 缺失！
【业务员端 - 采购需求管理】查看成本反馈
  ↓ 基于成本创建销售报价
【业务员端 - 报价管理】QT-NA-251220-6789（销售报价）
  ↓ 提交审批
【审批工作台】区域主管/销售总监审批
  ↓ 发送给客户
【客户端】查看QT
  ↓ 客户接受
【业务员端 - 订单管理】SO-NA-251220-8888（销售订单）
  ↓ 创建采购订单
【采购员端 - 采购订单】PO-NA-251220-5678（采购订单）
```

---

## 💡 解决方案：通过状态流转实现数据传递

### **方案A：最简方案（推荐）**

**核心思想**：不需要物理"发送"，而是通过**权限隔离**和**状态变更**实现数据流转

#### **1️⃣ 业务员端 - 添加"采购需求管理"模块**

**位置**：在"询价管理"和"报价管理"之间

**Tab结构**：
```
订单全盘 | 询价管理 | 采购需求管理 (NEW!) | 报价管理 | 订单管理 | 收款管理
```

**功能**：
1. ✅ **创建采购需求（QR）**
   - 从客户询价（INQ）一键创建
   - 填写采购需求信息
   - 选择产品、数量、期望价格

2. ✅ **提交给采购部门**
   - 点击"提交采购部门"按钮
   - QR状态：`draft` → `submitted`
   - 采购员端自动收到

3. ✅ **查看成本反馈**
   - 采购员选择供应商后，QR状态变为`quoted`
   - 业务员可以看到采购成本
   - 基于成本创建销售报价（QT）

4. ✅ **状态追踪**
   - `draft` - 草稿
   - `submitted` - 已提交给采购
   - `processing` - 采购处理中（采购员已向供应商询价）
   - `quoted` - 已获得报价（采购员已反馈成本）
   - `completed` - 已完成（业务员已创建QT）

---

#### **2️⃣ 采购员端 - "采购需求"模块（已有）**

**位置**：采购员Portal的主要模块

**功能**：
1. ✅ **接收业务员的QR**
   - 自动显示所有`status = 'submitted'`的QR
   - 查看需求详情（产品、数量、期望交期）
   - **看不到客户名称**（权限隔离）

2. ✅ **向供应商询价**
   - 从QR创建XJ（询价单）
   - 可以向多个供应商发起XJ
   - QR状态自动变为`processing`

3. ✅ **接收供应商报价（BJ）**
   - 查看供应商的报价
   - 对比多个供应商的价格、交期、MOQ

4. ✅ **选择最优报价，反馈成本**
   - 选择最佳供应商
   - 点击"反馈成本给业务员"
   - QR状态变为`quoted`
   - **成本信息自动关联到QR**

---

### **数据流转示意图**

```
【业务员】创建QR
   ↓
QR.status = 'draft'
QR.createdBy = '业务员邮箱'
   ↓ 点击"提交采购部门"
QR.status = 'submitted'
QR.submittedAt = timestamp
   ↓
【采购员】查看QR列表（只显示submitted的）
   ↓ 点击"向供应商询价"
QR.status = 'processing'
创建XJ-1, XJ-2, XJ-3（发给3个供应商）
   ↓
【供应商】提交BJ报价
   ↓
【采购员】对比BJ，选择供应商A
   ↓ 点击"反馈成本给业务员"
QR.status = 'quoted'
QR.selectedSupplier = {
  bjNumber: 'BJ-251220-0001',
  supplierName: '供应商A',
  costPrice: 100,
  currency: 'USD',
  leadTime: 30
}
   ↓
【业务员】在"采购需求管理"中看到QR变为quoted状态
   ↓ 点击"创建销售报价"
基于QR.selectedSupplier的成本，创建QT
QT.costPrice = QR.selectedSupplier.costPrice
QT.salesPrice = costPrice * (1 + profitMargin)
QR.status = 'completed'
```

---

## 🎨 UI设计方案

### **业务员端 - 采购需求管理模块**

#### **Tab结构**
```
┌─────────────────────────────────────────────────────┐
│ 📊 订单全盘 | 📋 询价管理 | 🔄 采购需求 | 💰 报价管理 │
└─────────────────────────────────────────────────────┘
```

#### **列表界面**
```
┌──────────────────────────────────────────────────────────────────────┐
│ 🔄 采购需求管理                                       ➕ 新建采购需求 │
├──────────────────────────────────────────────────────────────────────┤
│ 🔍 搜索采购需求单号、产品名称...              全部状态 ▼  清除       │
├──────────────────────────────────────────────────────────────────────┤
│ 需求单号          来源询价         产品         日期        状态     操作 │
├──────────────────────────────────────────────────────────────────────┤
│ QR-NA-251220-1234 INQ-NA-251220-0001  3个产品  12/20/2025  [已报价]  查看成本 → 创建报价 │
│ QR-NA-251220-1235 INQ-NA-251220-0002  2个产品  12/19/2025  [处理中]  查看进度 │
│ QR-NA-251220-1236 INQ-NA-251220-0003  1个产品  12/18/2025  [已提交]  催促采购 │
└──────────────────────────────────────────────────────────────────────┘
```

#### **状态标签设计**
```
草稿       [灰色]  - 尚未提交
已提交     [蓝色]  - 已提交给采购部门，等待处理
处理中     [橙色]  - 采购员已向供应商询价
已报价     [绿色]  - 采购员已反馈成本
已完成     [深绿]  - 已创建销售报价
已取消     [红色]  - 已取消
```

#### **创建采购需求弹窗**
```
┌────────────────────────────────────────────────┐
│ ➕ 创建采购需求                              ✕ │
├────────────────────────────────────────────────┤
│ 📋 基本信息                                    │
│                                                │
│ 来源询价单号                                   │
│ ┌────────────────────────────────────────┐   │
│ │ INQ-NA-251220-0001         🔍 选择询价  │   │
│ └────────────────────────────────────────┘   │
│                                                │
│ 客户名称：ABC Building Supplies（自动填充）    │
│ 区域：北美（自动填充）                          │
│                                                │
│ 期望交期                                       │
│ ┌────────────────────────────────────────┐   │
│ │ 2025-01-20                       📅    │   │
│ └────────────────────────────────────────┘   │
│                                                │
│ 📦 产品清单（从询价单导入）                    │
│ ┌────────────────────────────────────────┐   │
│ │ ☑ LED Bulb 10W  数量: 1000 PCS        │   │
│ │ ☑ Switch 2-Gang  数量: 500 PCS         │   │
│ │ ☑ Socket 13A     数量: 300 PCS         │   │
│ └────────────────────────────────────────┘   │
│                                                │
│ 特殊要求                                       │
│ ┌────────────────────────────────────────┐   │
│ │ 需要CE认证，包装要求客户logo...          │   │
│ └────────────────────────────────────────┘   │
│                                                │
│          [保存草稿]  [提交采购部门]            │
└────────────────────────────────────────────────┘
```

#### **查看成本反馈详情**
```
┌────────────────────────────────────────────────┐
│ 💰 采购成本反馈 - QR-NA-251220-1234          ✕ │
├────────────────────────────────────────────────┤
│ 📋 采购需求信息                                │
│ 来源询价：INQ-NA-251220-0001                   │
│ 客户名称：ABC Building Supplies               │
│ 提交日期：2025-12-20                           │
│                                                │
│ 📊 供应商报价对比（采购员已选择）              │
│                                                │
│ ✅ 选中供应商：东莞市华兴电器有限公司          │
│ 报价单号：BJ-251220-0001                       │
│                                                │
│ ┌────────────────────────────────────────┐   │
│ │ 产品          数量   单价    小计       │   │
│ ├────────────────────────────────────────┤   │
│ │ LED Bulb 10W   1000  $1.20  $1,200.00  │   │
│ │ Switch 2-Gang   500  $3.50  $1,750.00  │   │
│ │ Socket 13A      300  $2.80    $840.00  │   │
│ ├────────────────────────────────────────┤   │
│ │ 总成本：                    $3,790.00  │   │
│ └────────────────────────────────────────┘   │
│                                                │
│ 交货期：30天                                   │
│ 付款条件：30% TT预付，70% 见提单复印件         │
│                                                │
│          [查看其他报价]  [创建销售报价 →]      │
└────────────────────────────────────────────────┘
```

---

### **采购员端 - 采购需求模块（扩展）**

#### **列表界面**
```
┌──────────────────────────────────────────────────────────────────────┐
│ 📥 采购需求                                                           │
├──────────────────────────────────────────────────────────────────────┤
│ 🔍 搜索需求单号...                        待处理 ▼  清除             │
├──────────────────────────────────────────────────────────────────────┤
│ 需求单号          业务员      产品      期望交期     状态      操作    │
├──────────────────────────────────────────────────────────────────────┤
│ QR-NA-251220-1234  张三      3个产品   01/20/2025  [已提交]  向供应商询价 │
│ QR-NA-251220-1235  李四      2个产品   01/15/2025  [处理中]  查看询价进度 │
│ QR-NA-251220-1236  王五      1个产品   01/10/2025  [已报价]  反馈成本 ✅ │
└──────────────────────────────────────────────────────────────────────┘
```

#### **向供应商询价（从QR创建XJ）**
```
┌────────────────────────────────────────────────┐
│ 📤 向供应商询价 - QR-NA-251220-1234          ✕ │
├────────────────────────────────────────────────┤
│ 📋 需求信息                                    │
│ 需求单号：QR-NA-251220-1234                    │
│ 业务员：张三                                   │
│ 区域：北美                                     │
│ ❌ 客户名称：***（不可见，权限隔离）           │
│                                                │
│ 📦 产品清单                                    │
│ • LED Bulb 10W - 1000 PCS                     │
│ • Switch 2-Gang - 500 PCS                     │
│ • Socket 13A - 300 PCS                        │
│                                                │
│ 🏭 选择供应商（可多选）                        │
│ ┌────────────────────────────────────────┐   │
│ │ ☑ 东莞市华兴电器有限公司 (SUP-001)       │   │
│ │ ☑ 深圳市明达照明科技 (SUP-002)           │   │
│ │ ☑ 佛山市亮点电器厂 (SUP-003)             │   │
│ └────────────────────────────────────────┘   │
│                                                │
│ 报价截止日期                                   │
│ ┌────────────────────────────────────────┐   │
│ │ 2025-12-25                       📅    │   │
│ └────────────────────────────────────────┘   │
│                                                │
│ 备注                                           │
│ ┌────────────────────────────────────────┐   │
│ │ 请提供CE认证，包装需支持客户logo...      │   │
│ └────────────────────────────────────────┘   │
│                                                │
│          [取消]  [发送询价单（3个供应商）]     │
└────────────────────────────────────────────────┘

发送后自动创建：
- XJ-NA-251220-0001（发给SUP-001）
- XJ-NA-251220-0002（发给SUP-002）
- XJ-NA-251220-0003（发给SUP-003）
QR状态自动变为 'processing'
```

#### **报价对比与成本反馈**
```
┌────────────────────────────────────────────────┐
│ 📊 供应商报价对比 - QR-NA-251220-1234        ✕ │
├────────────────────────────────────────────────┤
│ 已收到 3/3 家供应商报价                        │
│                                                │
│ ┌────────────────────────────────────────┐   │
│ │ 供应商A：东莞市华兴电器  总价:$3,790    │   │
│ │ 交期:30天 付款:30/70 MOQ:500           │   │
│ │ [查看详情]  [✅ 选择]                   │   │
│ └────────────────────────────────────────┘   │
│                                                │
│ ┌────────────────────────────────────────┐   │
│ │ 供应商B：深圳市明达照明  总价:$3,950    │   │
│ │ 交期:25天 付款:50/50 MOQ:300           │   │
│ │ [查看详情]  [选择]                     │   │
│ └────────────────────────────────────────┘   │
│                                                │
│ ┌────────────────────────────────────────┐   │
│ │ 供应商C：佛山市亮点电器  总价:$4,100    │   │
│ │ 交期:35天 付款:30/70 MOQ:1000          │   │
│ │ [查看详情]  [选择]                     │   │
│ └────────────────────────────────────────┘   │
│                                                │
│ ✅ 已选择：供应商A - 东莞市华兴电器            │
│                                                │
│          [取消]  [反馈成本给业务员 →]          │
└────────────────────────────────────────────────┘

点击"反馈成本给业务员"后：
- QR.status = 'quoted'
- QR.selectedSupplier = {供应商A信息}
- 业务员端可以看到成本
```

---

## 📊 数据结构扩展

### **PurchaseRequirement 接口扩展**

```typescript
export interface PurchaseRequirement {
  id: string;
  requirementNo: string; // QR-NA-251220-1234
  
  // 🔥 关联信息
  sourceInquiryNumber?: string; // INQ-NA-251220-0001
  sourceRef?: string;
  
  // 🔥 状态信息（扩展）
  status: 'draft' | 'submitted' | 'processing' | 'quoted' | 'completed' | 'cancelled';
  
  // 🔥 采购员反馈的成本信息（NEW!）
  selectedSupplier?: {
    bjNumber: string; // BJ-251220-0001
    supplierCode: string; // SUP-001
    supplierName: string; // 东莞市华兴电器
    xjNumber: string; // XJ-NA-251220-0001（关联的询价单）
    costPrice: number; // 总成本
    currency: string; // USD
    leadTime: number; // 30天
    moq: number; // 最小订购量
    paymentTerms: string; // 付款条件
    quotedDate: string; // 报价日期
    remarks?: string;
  };
  
  // 🔥 时间信息
  submittedAt?: string; // 提交给采购的时间
  processedAt?: string; // 采购开始处理的时间
  quotedAt?: string; // 采购反馈成本的时间
  completedAt?: string; // 业务员创建QT的时间
  
  // ... 其他现有字段
}
```

---

## 🔄 完整的数据流转流程代码示例

### **业务员创建QR并提交**
```typescript
// 1. 业务员从INQ创建QR
const createQRFromINQ = (inquiry: Inquiry) => {
  const qr: PurchaseRequirement = {
    id: generateId(),
    requirementNo: generateQRNumber(inquiry.region), // QR-NA-251220-1234
    sourceInquiryNumber: inquiry.inquiryNumber, // INQ-NA-251220-0001
    items: inquiry.products.map(p => ({
      ...p,
      // 转换格式
    })),
    status: 'draft',
    createdBy: currentUser.email,
    createdDate: new Date().toISOString(),
    region: inquiry.region,
    // ... 其他字段
  };
  
  addPurchaseRequirement(qr);
};

// 2. 业务员提交给采购部门
const submitToProcurement = (qrId: string) => {
  updatePurchaseRequirement(qrId, {
    status: 'submitted',
    submittedAt: new Date().toISOString()
  });
  
  // 🔔 可选：发送通知给采购员
  notifyProcurement(qrId);
};
```

### **采购员处理QR**
```typescript
// 3. 采购员向供应商询价
const createXJFromQR = (qr: PurchaseRequirement, supplierCodes: string[]) => {
  // 更新QR状态
  updatePurchaseRequirement(qr.id, {
    status: 'processing',
    processedAt: new Date().toISOString()
  });
  
  // 创建多个XJ（一个供应商一个）
  supplierCodes.forEach(supplierCode => {
    const xj: RFQ = {
      id: generateId(),
      supplierRfqNo: generateXJNumber(qr.region), // XJ-NA-251220-0001
      requirementNo: qr.requirementNo, // 关联QR
      supplierCode: supplierCode,
      products: qr.items,
      status: 'pending',
      // ... 其他字段
    };
    
    addRFQ(xj);
  });
};

// 4. 采购员选择供应商，反馈成本
const feedbackCostToSales = (qr: PurchaseRequirement, selectedBJ: any) => {
  updatePurchaseRequirement(qr.id, {
    status: 'quoted',
    quotedAt: new Date().toISOString(),
    selectedSupplier: {
      bjNumber: selectedBJ.supplierQuotationNo,
      supplierCode: selectedBJ.supplierCode,
      supplierName: selectedBJ.supplierName,
      xjNumber: selectedBJ.supplierRfqNo,
      costPrice: selectedBJ.totalPrice,
      currency: selectedBJ.currency,
      leadTime: selectedBJ.leadTime,
      moq: selectedBJ.moq,
      paymentTerms: selectedBJ.paymentTerms,
      quotedDate: new Date().toISOString()
    }
  });
  
  // 🔔 可选：通知业务员
  notifySalesPerson(qr.createdBy, qr.id);
};
```

### **业务员基于成本创建QT**
```typescript
// 5. 业务员创建销售报价
const createQTFromQR = (qr: PurchaseRequirement, profitMargin: number) => {
  if (!qr.selectedSupplier) {
    throw new Error('采购成本尚未反馈');
  }
  
  const qt: SalesQuotation = {
    id: generateId(),
    qtNumber: generateQTNumber(qr.region), // QT-NA-251220-6789
    qrNumber: qr.requirementNo, // 关联QR
    inqNumber: qr.sourceInquiryNumber, // 关联INQ
    
    // 成本信息（来自采购反馈）
    items: qr.items.map(item => ({
      ...item,
      costPrice: qr.selectedSupplier.costPrice / qr.items.length, // 简化计算
      salesPrice: costPrice * (1 + profitMargin),
      profit: salesPrice - costPrice,
      profitRate: profitMargin
    })),
    
    selectedBJ: {
      bjNumber: qr.selectedSupplier.bjNumber,
      supplierName: qr.selectedSupplier.supplierName,
      // ...
    },
    
    status: 'draft',
    approvalStatus: 'draft',
    createdBy: currentUser.email,
    createdDate: new Date().toISOString(),
    // ... 其他字段
  };
  
  addSalesQuotation(qt);
  
  // 更新QR状态为已完成
  updatePurchaseRequirement(qr.id, {
    status: 'completed',
    completedAt: new Date().toISOString()
  });
};
```

---

## 🎯 总结：是否必要？

### ✅ **强烈建议添加"采购需求管理"模块**

**理由**：
1. **业务流程完整性** - 没有这个模块，业务员无法将询价传递给采购员
2. **数据可追溯性** - QR作为中间单据，连接INQ和QT，是关键的追溯节点
3. **权限隔离原则** - 通过QR，采购员只看到需求，看不到客户信息
4. **成本透明化** - 业务员可以清晰看到采购成本，计算合理利润

### ✅ **不需要独立的"反馈模块"**

**理由**：
1. **数据自动流转** - 采购员选择供应商后，成本自动关联到QR
2. **状态驱动** - 通过QR.status变化，业务员自动收到通知
3. **减少UI复杂度** - 避免创建过多独立模块

---

## 🚀 实施建议

### **Phase 1：添加"采购需求管理"模块（业务员端）**
1. 创建`PurchaseRequirementManagement.tsx`组件
2. 支持从INQ创建QR
3. 提交给采购部门
4. 查看成本反馈
5. 从QR创建QT

### **Phase 2：扩展"采购需求"模块（采购员端）**
1. 接收业务员的QR
2. 从QR创建多个XJ
3. 对比BJ报价
4. 选择供应商，反馈成本

### **Phase 3：集成到订单管理中心**
1. 在Tab Bar中添加"采购需求"Tab
2. 调整Tab顺序：`订单全盘 | 询价管理 | 采购需求 | 报价管理 | 订单管理 | 收款管理`

---

**结论**：✅ **必须添加"采购需求管理"模块**，这是连接业务员和采购员的关键桥梁！
