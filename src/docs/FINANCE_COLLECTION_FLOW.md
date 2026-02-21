# 📊 财务管理：应收账款与收款管理业务流程设计

## 📘 业务概述

在B2B外贸业务中，**应收账款（Accounts Receivable）**和**收款管理（Collection Management）**是财务管理的核心环节。

---

## 🔄 财务流程图

```
┌─────────────────────────────────────────────────────────────────┐
│                         B2B外贸财务闭环                          │
└─────────────────────────────────────────────────────────────────┘

  📋 订单确认                  💰 收款管理                   📊 财务核销
       ↓                           ↓                            ↓
┌─────────────┐           ┌─────────────────┐          ┌──────────────┐
│  订单 (ORD) │  →生成→   │ 应收账款 (YS)    │  ←关联←  │ 收款记录 (SK)  │
│ ORD-NA-001  │           │  YS-NA-001      │          │  SK-NA-001    │
│ 总额$100K   │           │ 应收: $100K     │          │  定金: $30K   │
│             │           │ 已收: $0        │          │  尾款: $70K   │
│             │           │ 未收: $100K     │          │               │
│ 状态: 已确认 │           │ 状态: Pending   │          │ 状态: 已确认   │
└─────────────┘           └─────────────────┘          └──────────────┘
                                  ↓                            ↓
                          【收到定金30%】              【创建收款记录SK-001】
                                  ↓                            ↓
                          ┌─────────────────┐          ┌──────────────┐
                          │ 应收账款 (YS)    │  ←核销←  │  SK-NA-001   │
                          │  YS-NA-001      │          │  $30,000     │
                          │ 应收: $100K     │          │  T/T电汇     │
                          │ 已收: $30K      │          │  2025-11-21  │
                          │ 未收: $70K      │          │               │
                          │ 状态: Partial   │          │ 状态: 已确认   │
                          └─────────────────┘          └──────────────┘
                                  ↓                            ↓
                          【收到尾款70%】              【创建收款记录SK-002】
                                  ↓                            ↓
                          ┌─────────────────┐          ┌──────────────┐
                          │ 应收账款 (YS)    │  ←核销←  │  SK-NA-002   │
                          │  YS-NA-001      │          │  $70,000     │
                          │ 应收: $100K     │          │  T/T电汇     │
                          │ 已收: $100K  ✅ │          │  2025-11-25  │
                          │ 未收: $0     ✅ │          │               │
                          │ 状态: Paid   ✅ │          │ 状态: 已确认   │
                          └─────────────────┘          └──────────────┘
```

---

## 📁 数据结构设计

### 1️⃣ **应收账款（AccountReceivable - YS）**

```typescript
interface AccountReceivable {
  // 基本信息
  id: string;                          // 内部ID: ar-xxxxx
  arNumber: string;                    // 应收账款编号: YS-{REGION}-YYMMDD-XXXX
  orderNumber: string;                 // 关联订单号: ORD-NA-251122-0001
  
  // 客户信息
  customerName: string;                // 客户名称
  customerEmail: string;               // 客户邮箱
  region: string;                      // 区域: NA/SA/EA
  
  // 金额信息 🔥 核心字段
  totalAmount: number;                 // 总应收金额: $100,000
  paidAmount: number;                  // 已收金额: $30,000
  remainingAmount: number;             // 未收金额: $70,000
  currency: string;                    // 货币: USD/EUR/CNY
  
  // 状态管理
  status: 'pending' | 'partially_paid' | 'paid' | 'overdue';
  // - pending: 待收款（未收到任何款项）
  // - partially_paid: 部分收款（已收部分款项）
  // - paid: 已收清（全部款项已收）
  // - overdue: 逾期（超过到期日未收款）
  
  // 时间信息
  invoiceDate: string;                 // 开票日期
  dueDate: string;                     // 到期日期
  createdAt: number;                   // 创建时间
  
  // 收款历史 🔥 关联收款记录
  paymentHistory: Array<{
    date: string;                      // 收款日期
    amount: number;                    // 收款金额
    method: string;                    // 收款方式: T/T, L/C, etc.
    reference: string;                 // 银行流水号
    receivedBy: string;                // 收款确认人
    notes?: string;                    // 备注
    proofUrl?: string;                 // 收款凭证URL
    proofFileName?: string;            // 凭证文件名
  }>;
  
  // 客户凭证（同步自订单）
  depositProof?: {                     // 定金凭证
    uploadedAt: string;
    uploadedBy: string;
    fileUrl?: string;
    fileName?: string;
    amount: number;
    currency: string;
    notes?: string;
  };
  
  balanceProof?: {                     // 余款凭证
    uploadedAt: string;
    uploadedBy: string;
    fileUrl?: string;
    fileName?: string;
    amount: number;
    currency: string;
    notes?: string;
  };
}
```

### 2️⃣ **收款记录（PaymentRecord - SK）**

```typescript
interface PaymentRecord {
  // 基本信息
  id: string;                          // 内部ID: payment-xxxxx
  paymentNumber: string;               // 收款编号: SK-{REGION}-YYMMDD-XXXX
  
  // 关联信息 🔥 关键关联
  receivableNumber: string;            // 关联应收账款号: YS-NA-251122-0001
  receivableId: string;                // 关联应收账款ID
  orderNumber: string;                 // 关联订单号: ORD-NA-251122-0001
  
  // 客户信息
  customerName: string;
  customerEmail: string;
  
  // 收款信息
  amount: number;                      // 本次收款金额: $30,000
  currency: string;                    // 货币: USD/EUR/CNY
  paymentDate: string;                 // 收款日期: 2025-11-21
  
  // 付款方式
  paymentMethod: 'T/T' | 'L/C' | 'D/P' | 'D/A' | 'Western Union' | 'PayPal' | 'Other';
  bankReference: string;               // 银行流水号/交易参考号
  bankName?: string;                   // 收款银行
  
  // 确认信息
  receivedBy: string;                  // 收款确认人（财务人员）
  notes?: string;                      // 备注
  proofUrl?: string;                   // 收款凭证URL
  proofFileName?: string;              // 收款凭证文件名
  
  // 状态
  status: 'pending' | 'confirmed' | 'rejected';
  // - pending: 待确认（财务未确认）
  // - confirmed: 已确认（财务已确认收款）
  // - rejected: 已拒绝（收款凭证有误）
  
  // 元数据
  region: string;                      // 区域代码: NA/SA/EA
  createdAt: number;                   // 创建时间
  createdBy: string;                   // 创建人
  confirmedAt?: number;                // 确认时间
  confirmedBy?: string;                // 确认人
}
```

---

## 🔗 **核心逻辑关系**

### **关系模型：1对多（1:N）**

```
1个应收账款 (YS-NA-251122-0001)
    ↓
    ├─ 收款记录1 (SK-NA-251122-0001): 定金 $30,000 ✅
    ├─ 收款记录2 (SK-NA-251125-0002): 尾款 $70,000 ✅
    └─ ... (可能有多笔收款)

核心规则：
1. ✅ 一个应收账款可以对应多笔收款记录
2. ✅ 每笔收款记录必须关联一个应收账款
3. ✅ 收款总额不能超过应收总额
4. ✅ 每笔收款都会减少应收账款的未收金额
5. ✅ 状态联动：应收状态根据收款比例自动更新
```

---

## 💻 **核心业务逻辑实现**

### **场景1：创建收款记录并核销应收账款**

```typescript
// 步骤1: 创建收款记录
const newPayment = addPayment({
  receivableId: 'ar-xxx',
  receivableNumber: 'YS-NA-251122-0001',
  orderNumber: 'ORD-NA-251122-0001',
  customerName: 'ACME Supply Co.',
  customerEmail: 'contact@acme.com',
  amount: 30000,                      // 定金30%
  currency: 'USD',
  paymentDate: '2025-11-21',
  paymentMethod: 'T/T',
  bankReference: 'TT20251121001',
  receivedBy: 'admin@cosun.com',
  status: 'confirmed',
  region: 'NA',
  createdBy: 'admin@cosun.com'
});

// 步骤2: 核销应收账款
recordPayment(receivableId, {
  date: '2025-11-21',
  amount: 30000,
  method: 'T/T',
  reference: newPayment.paymentNumber,
  receivedBy: 'admin@cosun.com',
  proofUrl: newPayment.proofUrl
});

// 步骤3: 自动更新应收账款
// FinanceContext会自动计算：
// - paidAmount: 0 + 30000 = 30000
// - remainingAmount: 100000 - 30000 = 70000
// - status: 'pending' → 'partially_paid'
```

### **场景2：应收账款状态自动更新逻辑**

```typescript
const recordPayment = (id: string, payment: PaymentData) => {
  setAccountsReceivable(prev =>
    prev.map(ar => {
      if (ar.id === id) {
        // 计算新的已收金额和未收金额
        const newPaidAmount = ar.paidAmount + payment.amount;
        const newRemainingAmount = ar.totalAmount - newPaidAmount;
        
        // 自动更新状态
        const newStatus = 
          newRemainingAmount <= 0 ? 'paid' :           // 已收清
          newPaidAmount > 0 ? 'partially_paid' :       // 部分收款
          new Date(ar.dueDate) < new Date() ? 'overdue' : 'pending';  // 逾期/待收
        
        return {
          ...ar,
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          status: newStatus,
          paymentHistory: [...ar.paymentHistory, payment]  // 追加收款记录
        };
      }
      return ar;
    })
  );
};
```

---

## 📊 **UI展示逻辑**

### **财务管理中心（Finance Management）**

```
┌────────────────────────────────────────────────────────────┐
│  💼 财务管理中心                                            │
├────────────────────────────────────────────────────────────┤
│  📊 统计卡片                                                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│  │ 总收入  │ │  应收   │ │  逾期   │ │ 利润率  │         │
│  │ ¥81.8万 │ │ $417K   │ │   1     │ │ 31.6%   │         │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘         │
├────────────────────────────────────────────────────────────┤
│  📑 Tab导航                                                 │
│  ┌──────────┬──────────┬──────────┬──────────┬────────┐  │
│  │💳收款管理 │💰应收账款 │📄发票管理 │📊利润分析 │📈报表  │  │
│  └──────────┴──────────┴──────────┴──────────┴────────┘  │
└────────────────────────────────────────────────────────────┘
```

### **收款管理（Collection Management）Tab**

显示所有收款记录（SK系列），按时间倒序排列

```
┌─────────────────────────────────────────────────────────────┐
│  💳 收款管理 (Collection Management)                         │
├─────────────────────────────────────────────────────────────┤
│  收款编号        | 应收账款号    | 订单号       | 金额        │
│  SK-NA-251122-01 | YS-NA-251122 | ORD-NA-251122| $30,000 ✅ │
│  SK-NA-251125-02 | YS-NA-251122 | ORD-NA-251122| $70,000 ✅ │
│  SK-NA-251120-01 | YS-NA-251120 | ORD-NA-251120| $50,000 ✅ │
└─────────────────────────────────────────────────────────────┘
```

### **应收账款（Accounts Receivable）Tab**

显示所有应收账款（YS系列），按状态和金额排序

```
┌─────────────────────────────────────────────────────────────┐
│  💰 应收账款 (Accounts Receivable)                           │
├─────────────────────────────────────────────────────────────┤
│  应收编号        | 订单号       | 总额   | 已收  | 未收  | 状态    │
│  YS-NA-251122-01 | ORD-NA-251122| $100K  | $100K | $0    | ✅已收清│
│  YS-NA-251120-01 | ORD-NA-251120| $150K  | $50K  | $100K | ⏳部分  │
│  YS-NA-251118-01 | ORD-NA-251118| $80K   | $0    | $80K  | ⚠️待收  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 **关键业务规则**

### ✅ **收款记录编号规则**

```
格式: SK-{REGION}-YYMMDD-XXXX

SK     = 收款 (Shoukuan)
REGION = NA (北美) / SA (南美) / EA (欧非)
YYMMDD = 收款日期 (年月日)
XXXX   = 累计序号（永不重置）

示例:
SK-NA-251122-0001 = 2025年11月22日北美地区第1笔收款 ✅
SK-NA-251125-0002 = 2025年11月25日北美地区第2笔收款 ✅（累计序号）
SK-SA-251122-0001 = 2025年11月22日南美地区第1笔收款 ✅（不同地区独立计数）
```

### ✅ **状态联动规则**

| 应收状态 | 条件 | 说明 |
|---------|------|------|
| `pending` | 已收金额 = $0 | 待收款，未收到任何款项 |
| `partially_paid` | 0 < 已收金额 < 总金额 | 部分收款，已收部分款项 |
| `paid` | 已收金额 = 总金额 | 已收清，全部款项已收 ✅ |
| `overdue` | 当前日期 > 到期日期 且 未收清 | 逾期，需要催款 ⚠️ |

### ✅ **财务校验规则**

1. **收款总额校验**：
   ```typescript
   // ❌ 禁止：收款总额超过应收总额
   if (totalPaidAmount + newPaymentAmount > totalReceivableAmount) {
     throw new Error('收款金额超过应收金额！');
   }
   ```

2. **重复收款校验**：
   ```typescript
   // ❌ 禁止：同一银行流水号重复录入
   if (existingPayments.some(p => p.bankReference === newBankReference)) {
     throw new Error('该银行流水号已存在！');
   }
   ```

3. **必须先有应收**：
   ```typescript
   // ❌ 禁止：没有应收账款就创建收款记录
   if (!receivableExists(orderNumber)) {
     throw new Error('请先创建应收账款！');
   }
   ```

---

## 📝 **完整示例：$100K订单收款流程**

### **订单信息**
- 订单号：`ORD-NA-251122-0001`
- 总金额：`$100,000 USD`
- 付款条款：`30% T/T预付，70%见提单副本`

---

### **步骤1：订单确认 → 生成应收账款**

```typescript
// OrderTracking.tsx - 订单确认时自动创建应收账款
const handleConfirmOrder = (order) => {
  const newAR = addAccountReceivable({
    arNumber: 'YS-NA-251122-0001',
    orderNumber: 'ORD-NA-251122-0001',
    customerName: 'ACME Supply Co.',
    customerEmail: 'contact@acme.com',
    region: 'NA',
    totalAmount: 100000,
    paidAmount: 0,
    remainingAmount: 100000,
    currency: 'USD',
    status: 'pending',
    invoiceDate: '2025-11-22',
    dueDate: '2025-12-22',
    paymentHistory: [],
    createdBy: 'admin@cosun.com'
  });
};
```

**结果：**
```
✅ 应收账款已创建
   编号: YS-NA-251122-0001
   总额: $100,000
   已收: $0
   未收: $100,000
   状态: Pending（待收款）
```

---

### **步骤2：收到定金30% → 创建收款记录**

```typescript
// CollectionManagement.tsx - 财务确认收到定金
const handleRecordPayment = () => {
  // 1. 创建收款记录
  const payment = addPayment({
    receivableId: 'ar-xxx',
    receivableNumber: 'YS-NA-251122-0001',
    orderNumber: 'ORD-NA-251122-0001',
    customerName: 'ACME Supply Co.',
    customerEmail: 'contact@acme.com',
    amount: 30000,              // 定金30%
    currency: 'USD',
    paymentDate: '2025-11-22',
    paymentMethod: 'T/T',
    bankReference: 'TT20251122001',
    bankName: 'Bank of China',
    receivedBy: 'admin@cosun.com',
    notes: '定金30%已到账',
    status: 'confirmed',
    region: 'NA',
    createdBy: 'admin@cosun.com'
  });
  
  // 2. 核销应收账款
  recordPayment('ar-xxx', {
    date: '2025-11-22',
    amount: 30000,
    method: 'T/T',
    reference: 'SK-NA-251122-0001',
    receivedBy: 'admin@cosun.com'
  });
};
```

**结果：**
```
✅ 收款记录已创建
   编号: SK-NA-251122-0001
   金额: $30,000 (定金30%)
   方式: T/T电汇
   状态: 已确认

✅ 应收账款已更新
   编号: YS-NA-251122-0001
   总额: $100,000
   已收: $30,000 (+$30K)
   未收: $70,000
   状态: Partial（部分收款）✅
```

---

### **步骤3：收到尾款70% → 创建第二笔收款记录**

```typescript
// CollectionManagement.tsx - 财务确认收到尾款
const handleRecordBalance = () => {
  // 1. 创建收款记录
  const payment = addPayment({
    receivableId: 'ar-xxx',
    receivableNumber: 'YS-NA-251122-0001',
    orderNumber: 'ORD-NA-251122-0001',
    customerName: 'ACME Supply Co.',
    customerEmail: 'contact@acme.com',
    amount: 70000,              // 尾款70%
    currency: 'USD',
    paymentDate: '2025-11-25',
    paymentMethod: 'T/T',
    bankReference: 'TT20251125002',
    bankName: 'Bank of China',
    receivedBy: 'admin@cosun.com',
    notes: '尾款70%已到账',
    status: 'confirmed',
    region: 'NA',
    createdBy: 'admin@cosun.com'
  });
  
  // 2. 核销应收账款
  recordPayment('ar-xxx', {
    date: '2025-11-25',
    amount: 70000,
    method: 'T/T',
    reference: 'SK-NA-251125-0002',
    receivedBy: 'admin@cosun.com'
  });
};
```

**结果：**
```
✅ 收款记录已创建
   编号: SK-NA-251125-0002
   金额: $70,000 (尾款70%)
   方式: T/T电汇
   状态: 已确认

✅ 应收账款已更新（完全核销）
   编号: YS-NA-251122-0001
   总额: $100,000
   已收: $100,000 (+$70K) ✅
   未收: $0 ✅
   状态: Paid（已收清）✅✅✅
```

---

## 🎯 **总结：关键特性**

| 特性 | 说明 |
|------|------|
| **1对多关系** | 1个应收账款 → 多笔收款记录 |
| **自动核销** | 每笔收款自动更新应收账款的已收/未收金额 |
| **状态联动** | 根据收款比例自动更新应收状态 |
| **编号规则** | YS（应收）、SK（收款）+ 区域 + 日期 + 序号 |
| **财务校验** | 收款总额≤应收总额 |
| **完整追踪** | paymentHistory记录所有收款历史 |
| **凭证管理** | 支持上传收款凭证 |

---

## 📚 **相关文件**

- `/contexts/FinanceContext.tsx` - 应收账款Context
- `/contexts/PaymentContext.tsx` - 收款记录Context
- `/components/admin/CollectionManagement.tsx` - 收款管理UI
- `/components/admin/AccountsReceivableList.tsx` - 应收账款列表UI
- `/components/admin/FinanceManagement.tsx` - 财务管理中心

---

**🎉 财务流程设计完成！**
