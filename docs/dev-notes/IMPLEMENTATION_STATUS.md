# 7级编号体系实施状态

## ✅ 已完成

### **1. Context数据层**
- ✅ `/contexts/SalesQuotationContext.tsx` - 销售报价（QT）管理
- ✅ `/contexts/SalesOrderContext.tsx` - 销售订单（SO）管理
- ✅ `/contexts/PurchaseRequirementContext.tsx` - 采购需求（QR）管理（已存在）
- ✅ `/contexts/ApprovalContext.tsx` - 审批流程管理（已存在）

### **2. 编号生成工具**
- ✅ `/utils/rfqNumberGenerator.ts` - 扩展支持7级编号
  - `generateINQNumber(region)` - 客户询价单
  - `generateQRNumber(region)` - 采购需求单
  - `generateXJNumber(region)` - 询价单（发给供应商）
  - `generateBJNumber()` - 供应商报价单（无region）
  - `generateQTNumber(region)` - 销售报价单
  - `generateSONumber(region)` - 销售订单
  - `generatePurchaseOrderNumber(region)` - 采购订单

### **3. Provider集成**
- ✅ 在 `/App.tsx` 中添加 `SalesQuotationProvider` 和 `SalesOrderProvider`

### **4. 文档**
- ✅ `/SEVEN_LEVEL_NUMBERING_SYSTEM.md` - 完整业务流程和编号体系说明

---

## ⏳ 下一步工作

### **Phase 1: 业务员端模块（最优先）**

#### **1.1 销售报价管理模块**
创建文件：`/components/admin/SalesQuotationManagement.tsx`

功能需求：
- [ ] 创建销售报价（QT）
  - 从QR选择采购成本（BJ汇总）
  - 设置销售价格和利润率
  - 自动计算总成本、总报价、利润率
- [ ] 报价列表（按状态分类）
  - 草稿
  - 待审批
  - 审批中
  - 已审批
  - 已拒绝
- [ ] 提交审批功能
- [ ] 查看审批进度
- [ ] 发送给客户
- [ ] 修改报价（创建新版本）

#### **1.2 销售订单管理模块**
创建文件：`/components/admin/SalesOrderManagement.tsx`

功能需求：
- [ ] 从QT转换为SO
- [ ] 订单列表
- [ ] 订单详情查看
- [ ] 订单状态跟踪
- [ ] 关联PO查看

---

### **Phase 2: 审批工作台**

#### **2.1 区域业务主管审批工作台**
创建文件：`/components/admin/RegionalManagerApprovalWorkbench.tsx`

功能需求：
- [ ] 待审批报价列表
- [ ] 报价详情查看（成本、利润率分析）
- [ ] 批准/驳回操作
- [ ] 审批历史记录

#### **2.2 销售总监审批工作台**
创建文件：`/components/admin/SalesDirectorApprovalWorkbench.tsx`

功能需求：
- [ ] 待审批报价列表（≥$20,000）
- [ ] 报价详情查看
- [ ] 批准/驳回操作
- [ ] 审批历史记录

---

### **Phase 3: 采购员端模块**

#### **3.1 成本汇总反馈功能**
扩展现有文件：`/components/admin/ProcurementQuotationRequests.tsx`

功能需求：
- [ ] 查看QR对应的所有XJ和BJ
- [ ] 对比供应商报价
- [ ] 选择最优供应商
- [ ] 生成成本汇总报告
- [ ] 反馈给业务员

#### **3.2 询价拆分功能**
功能需求：
- [ ] 从QR创建多个XJ
- [ ] 选择供应商
- [ ] 选择产品
- [ ] 批量发送询价

---

### **Phase 4: 流程打通**

#### **4.1 数据流转**
- [ ] INQ → QR 自动关联
- [ ] QR → XJ 拆分创建
- [ ] BJ → QT 成本计算
- [ ] QT → SO 转换
- [ ] SO → PO 采购下单

#### **4.2 状态同步**
- [ ] QT审批状态更新 → 通知业务员
- [ ] 客户接受QT → 自动创建SO
- [ ] SO创建 → 通知采购员
- [ ] PO创建 → 通知供应商

---

## 🎯 关键设计决策

### **1. QT和SO分开（方案A）✅**
- 语义更准确
- 支持报价版本管理
- 统计报价成功率
- 符合实际业务流程

### **2. 编号体系**
```
INQ → QR → XJ → BJ → QT → SO → PO
```

### **3. 审批规则**
- 总金额 < $20,000：区域业务主管审批
- 总金额 ≥ $20,000：区域主管 + 销售总监双层审批

### **4. 权限隔离**
- 业务员不能看到供应商信息
- 采购员不能看到客户信息
- 供应商不能看到客户信息
- 供应商之间完全隔离

---

## 📊 当前架构

```
前端层
├── Customer Portal（客户端）
│   └── 创建INQ、接收QT、确认SO
│
├── Admin Portal（业务员+采购员）
│   ├── 业务员
│   │   ├── 创建QR（基于INQ）
│   │   ├── 创建QT（基于BJ成本）✅ 新增
│   │   ├── 提交审批
│   │   ├── 创建SO（基于QT）✅ 新增
│   │   └── 跟踪订单
│   │
│   ├── 采购员
│   │   ├── 接收QR
│   │   ├── 创建XJ（发给供应商）
│   │   ├── 收集BJ
│   │   ├── 成本汇总反馈
│   │   └── 创建PO（基于SO）
│   │
│   ├── 区域业务主管
│   │   └── 审批QT（<$20k或≥$20k第一级）✅ 新增
│   │
│   └── 销售总监
│       └── 审批QT（≥$20k第二级）✅ 新增
│
└── Supplier Portal（供应商端）
    ├── 接收XJ
    ├── 提交BJ
    └── 接收PO

数据层（Context）
├── InquiryContext（INQ）
├── PurchaseRequirementContext（QR）✅
├── QuotationRequestContext（XJ）
├── RFQContext（可能是BJ）
├── SalesQuotationContext（QT）✅ 新增
├── SalesOrderContext（SO）✅ 新增
├── PurchaseOrderContext（PO）✅
└── ApprovalContext（审批）✅

工具层
└── rfqNumberGenerator.ts ✅ 已扩展支持7级编号
```

---

## 🚦 实施优先级

### **P0 - 立即实施**
1. 销售报价管理模块（业务员创建QT）
2. 审批工作台（区域主管、销售总监）
3. 从QT转为SO功能

### **P1 - 本周完成**
1. 采购成本汇总反馈
2. 询价拆分功能（QR → 多个XJ）
3. 成本计算（BJ → QT）

### **P2 - 后续优化**
1. 报价版本管理
2. 审批流程可视化
3. 数据统计分析（报价成功率、利润率分析）

---

**更新时间**：2024-12-19  
**下一步**：开始实施业务员端销售报价管理模块 🚀
