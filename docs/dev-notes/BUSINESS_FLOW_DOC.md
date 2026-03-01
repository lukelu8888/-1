# 采购订单与询价报价完整业务流程

## 核心业务流程

### 流程1: 基于询价报价创建采购订单（推荐流程）

```
1. Admin创建采购需求（来自销售订单/库存预警）
   ↓
2. Admin在采购需求池点击"下推询价"按钮
   ↓
3. 弹出对话框，选择要询价的供应商（可多选）
   ├─ 供应商A
   ├─ 供应商B  
   └─ 供应商C
   ↓
4. 系统创建RFQ（询价请求），推送给选中的供应商
   - RFQ编号: RFQ-2025-1217-001
   - 包含：产品信息、数量、要求交期、报价截止日期
   ↓
5. Supplier Portal - 供应商登录查看
   - 进入"询价报价"模块
   - 看到新的RFQ请求
   - 点击"报价"按钮
   ↓
6. 供应商填写报价信息
   - 报价单价
   - 交货周期（leadTime）
   - 最小订购量（MOQ）
   - 付款条款
   - 报价有效期
   ↓
7. 供应商提交报价
   - 报价信息保存到 RFQ.quotes 数组
   - 通知Admin有新报价
   ↓
8. Admin查看所有供应商报价
   - 在采购需求池看到"已有3家报价"
   - 点击查看详情，对比各家价格和条件
   ↓
9. Admin选择最优报价，创建采购订单
   - 基于供应商B的报价创建PO
   - PO记录关联信息：
     {
       poNumber: "PO-2025-1217-49",
       rfqId: "rfq_xxx",
       rfqNumber: "RFQ-2025-1217-001",
       supplierCode: "supplier_b@email.com",
       supplierName: "供应商B公司",
       selectedQuote: {
         quotedPrice: 12.50,
         leadTime: 30,
         moq: 1000,
         paymentTerms: "T/T 30% deposit",
         ...
       }
     }
   ↓
10. PO自动下推给供应商B
    - 根据supplierCode匹配
    - 供应商B在"采购订单"模块看到PO
    ↓
11. 供应商查看采购订单
    - 看到采购单号: PO-2025-1217-49
    - 看到关联的RFQ信息
    - 看到当初自己的报价信息
    - 对比PO价格与报价是否一致
    ↓
12. 供应商确认或拒绝订单
    - 确认：设置实际交货日期
    - 拒绝：填写拒绝原因
```

### 流程2: 直接创建采购订单（无询价流程）

```
1. Admin在采购需求池点击"创建订单"按钮
   ↓
2. 填写采购订单信息
   - 选择供应商
   - 填写产品、数量、价格
   - 设置交期、付款条款
   ↓
3. 创建PO，下推给供应商
   - 此时PO没有rfqId和selectedQuote字段
   ↓
4. 供应商在Portal查看并确认
```

## 数据结构关系图

```
┌─────────────────┐
│ PurchaseRequirement │  采购需求
└─────────────────┘
        │
        ├─ 下推询价 ──→ ┌─────────┐
        │                │   RFQ   │  询价请求
        │                └─────────┘
        │                      │
        │                      │ targetSuppliers: [A, B, C]
        │                      │
        │                      ├─ 供应商A报价 ──→ quotes[0]
        │                      ├─ 供应商B报价 ──→ quotes[1]
        │                      └─ 供应商C报价 ──→ quotes[2]
        │                             │
        │                             │ Admin选择供应商B的报价
        │                             ↓
        └─ 基于报价创建 ──→ ┌───────────────┐
                            │ PurchaseOrder │  采购订单
                            └───────────────┘
                                   │
                                   ├─ rfqId
                                   ├─ rfqNumber
                                   ├─ selectedQuote (供应商B的报价)
                                   └─ supplierCode (供应商B)
```

## 关键代码实现点

### 1. PurchaseOrder接口（已完成）
```typescript
export interface PurchaseOrder {
  // ...其他字段
  
  // 🔥 RFQ关联信息
  rfqId?: string;
  rfqNumber?: string;
  selectedQuote?: {
    supplierCode: string;
    quotedDate: string;
    quotedPrice: number;
    leadTime: number;
    moq: number;
    paymentTerms: string;
    ...
  };
}
```

### 2. 供应商Portal过滤逻辑（已完成）
```typescript
// 在 /components/supplier/PurchaseOrders.tsx
const supplierPurchaseOrders = allPurchaseOrders.filter(po => {
  return po.supplierCode === currentSupplier.email ||
         po.supplierCode === currentSupplier.supplierCode;
});
```

### 3. 待实现功能

#### A. 下推询价功能
```typescript
// 在 PurchaseOrderManagementPro.tsx 添加
const [showRFQDialog, setShowRFQDialog] = useState(false);
const [selectedRequirement, setSelectedRequirement] = useState(null);
const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);

const handlePushToRFQ = (requirement) => {
  setSelectedRequirement(requirement);
  setShowRFQDialog(true);
};

const confirmPushRFQ = () => {
  // 创建RFQ
  const rfq = {
    id: generateId(),
    rfqNumber: `RFQ-2025-${Date.now()}`,
    requirementNo: selectedRequirement.requirementNo,
    targetSuppliers: selectedSuppliers.map(code => ({
      supplierCode: code,
      supplierName: getSupplierName(code),
      supplierEmail: code
    })),
    items: [...],
    expectedDate: selectedRequirement.requiredDate,
    quotationDeadline: getDeadline(),
    ...
  };
  
  addRFQ(rfq);  // 保存到Context
  toast.success('询价请求已发送给供应商！');
};
```

#### B. 供应商查看RFQ并报价
```typescript
// 在 /components/supplier/SupplierQuotations.tsx
// 连接到RFQContext
const { rfqs, getRFQsBySupplier, addQuoteToRFQ } = useRFQs();

const supplierRFQs = getRFQsBySupplier(currentSupplier.email);

const handleSubmitQuote = (rfqId, quoteData) => {
  addQuoteToRFQ(rfqId, {
    supplierCode: currentSupplier.email,
    supplierName: currentSupplier.name,
    quotedDate: new Date().toISOString(),
    quotedPrice: quoteData.unitPrice,
    leadTime: quoteData.leadTime,
    moq: quoteData.moq,
    ...
  });
};
```

#### C. Admin查看报价并创建PO
```typescript
const handleCreatePOFromQuote = (rfq, selectedQuote) => {
  const po = {
    id: generateId(),
    poNumber: `PO-2025-${Date.now()}`,
    rfqId: rfq.id,
    rfqNumber: rfq.rfqNumber,
    supplierCode: selectedQuote.supplierCode,
    supplierName: selectedQuote.supplierName,
    selectedQuote: selectedQuote,
    items: rfq.items.map(item => ({
      ...item,
      unitPrice: selectedQuote.quotedPrice / item.quantity
    })),
    ...
  };
  
  addPurchaseOrder(po);  // 自动推送给供应商
};
```

## 测试场景

### 场景1: 完整询价到采购流程
1. Admin Portal → 供应链管理 → 采购订单管理 → 采购需求池
2. 点击需求的"下推询价"按钮
3. 选择2-3家供应商，确认发送
4. 切换到Supplier Portal（登录供应商账号）
5. 进入"询价报价"模块，看到新RFQ
6. 点击"报价"，填写价格和条件，提交
7. 切换回Admin Portal
8. 查看采购需求，看到"已有报价"标记
9. 对比报价，选择最优报价创建PO
10. 切换到Supplier Portal，在"采购订单"看到新PO
11. 查看PO详情，能看到当初的报价信息
12. 确认订单

### 场景2: 查看关联信息
1. Supplier Portal → 采购订单 → 查看PO详情
2. 显示信息：
   - 采购单号: PO-2025-1217-49
   - 关联询价: RFQ-2025-1217-001
   - 我的报价: $12.50/件
   - 采购价格: $12.50/件（一致）
   - 交货周期: 30天（按报价）

## 数据持久化

所有数据保存在localStorage：
- `rfqs` - 询价请求
- `purchaseOrders` - 采购订单  
- 自动跨Portal同步

## 下一步开发优先级

1. ✅ RFQContext创建（已完成）
2. ✅ PurchaseOrder接口更新（已完成）
3. ✅ Supplier Portal订单过滤（已完成）
4. ⏳ 实现"下推询价"对话框和逻辑
5. ⏳ Supplier Portal显示RFQ列表
6. ⏳ Supplier Portal提交报价功能
7. ⏳ Admin查看报价并创建PO
8. ⏳ Supplier查看PO关联的报价信息
