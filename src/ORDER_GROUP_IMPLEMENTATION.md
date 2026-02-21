# 📦 订单组功能实现方案（方案A - 自动拆单）

## ✅ 已完成的准备工作

### 1. 数据结构更新
- ✅ `PurchaseOrder`接口添加订单组字段
- ✅ `PurchaseOrderContext`添加订单组查询方法
- ✅ 创建`PurchaseOrderGroupView`组件

### 2. 新增字段

```typescript
interface PurchaseOrder {
  // ... 其他字段
  
  // 🔥 订单组信息
  orderGroup?: string;        // "PO-GROUP-20251217-001"
  isPartOfGroup?: boolean;    // true
  groupTotalOrders?: number;  // 3（总共3个PO）
  groupNote?: string;         // "客户SO-2025-0892拆分订单"
}
```

### 3. 新增Context方法

```typescript
// 查询订单组的所有PO
getPurchaseOrdersByGroup(orderGroup: string): PurchaseOrder[]

// 批量添加PO（用于拆单）
addPurchaseOrderBatch(orders: PurchaseOrder[]): void

// 订单组统计
getOrderGroupStats(orderGroup: string): {
  total: number;
  confirmed: number;
  shipped: number;
  completed: number;
}
```

---

## 🎯 核心业务流程

### 场景：一个销售订单需要3个供应商供货

```
销售订单 SO-2025-0892
├─ 产品A (LED灯) 100个 → 需要供应商
├─ 产品B (开关) 200个 → 需要供应商
└─ 产品C (插座) 300个 → 需要供应商
```

### 步骤1: 发RFQ询价

```javascript
// 采购员为每个产品发RFQ
RFQ-001 (产品A) → 供应商A1, A2, A3
RFQ-002 (产品B) → 供应商B1, B2, B3  
RFQ-003 (产品C) → 供应商C1, C2, C3

// 供应商报价
产品A: 
  - 供应商A1 报价 $13.00
  - 供应商A2 报价 $12.50 ← 选中
  - 供应商A3 报价 $14.00

产品B:
  - 供应商B1 报价 $8.00 ← 选中
  - 供应商B2 报价 $8.50
  - 供应商B3 报价 $9.00

产品C:
  - 供应商C1 报价 $16.00
  - 供应商C2 报价 $17.00
  - 供应商C3 报价 $15.00 ← 选中
```

### 步骤2: 创建PO（自动拆单）

```javascript
// 生成订单组号
const orderGroup = `PO-GROUP-${Date.now()}`;
// 例如: "PO-GROUP-20251217-001"

// 创建3个独立PO
const purchaseOrders = [
  {
    id: generateId(),
    poNumber: "PO-2025-1217-001",
    
    // 🔥 订单组信息
    orderGroup: "PO-GROUP-20251217-001",
    isPartOfGroup: true,
    groupTotalOrders: 3,
    groupNote: "销售订单SO-2025-0892拆分订单",
    
    // 供应商信息
    supplierCode: "supplier_a2@email.com",
    supplierName: "供应商A2",
    
    // RFQ关联
    rfqId: "rfq_001",
    rfqNumber: "RFQ-001",
    selectedQuote: {
      supplierCode: "supplier_a2@email.com",
      quotedPrice: 12.50,
      leadTime: 30,
      ...
    },
    
    // 产品清单
    items: [
      {
        productName: "LED灯",
        quantity: 100,
        unitPrice: 12.50,
        ...
      }
    ],
    
    sourceRef: "SO-2025-0892",
    totalAmount: 1250.00,
    ...
  },
  
  {
    id: generateId(),
    poNumber: "PO-2025-1217-002",
    orderGroup: "PO-GROUP-20251217-001",  // 🔥 同一订单组
    isPartOfGroup: true,
    groupTotalOrders: 3,
    groupNote: "销售订单SO-2025-0892拆分订单",
    
    supplierCode: "supplier_b1@email.com",
    supplierName: "供应商B1",
    
    rfqId: "rfq_002",
    rfqNumber: "RFQ-002",
    
    items: [
      {
        productName: "开关",
        quantity: 200,
        unitPrice: 8.00,
        ...
      }
    ],
    
    sourceRef: "SO-2025-0892",
    totalAmount: 1600.00,
    ...
  },
  
  {
    id: generateId(),
    poNumber: "PO-2025-1217-003",
    orderGroup: "PO-GROUP-20251217-001",  // 🔥 同一订单组
    isPartOfGroup: true,
    groupTotalOrders: 3,
    groupNote: "销售订单SO-2025-0892拆分订单",
    
    supplierCode: "supplier_c3@email.com",
    supplierName: "供应商C3",
    
    rfqId: "rfq_003",
    rfqNumber: "RFQ-003",
    
    items: [
      {
        productName: "插座",
        quantity: 300,
        unitPrice: 15.00,
        ...
      }
    ],
    
    sourceRef: "SO-2025-0892",
    totalAmount: 4500.00,
    ...
  }
];

// 🔥 批量添加到Context
addPurchaseOrderBatch(purchaseOrders);
```

### 步骤3: 自动推送给各供应商

```javascript
// PO自动根据supplierCode匹配供应商

Supplier Portal - 供应商A2登录:
  → 看到 PO-2025-1217-001（只包含LED灯）
  
Supplier Portal - 供应商B1登录:
  → 看到 PO-2025-1217-002（只包含开关）
  
Supplier Portal - 供应商C3登录:
  → 看到 PO-2025-1217-003（只包含插座）
```

---

## 🎨 Admin Portal UI设计

### 采购订单列表（增强版）

```tsx
<Table>
  <TableRow>
    <TableCell>
      <div>
        <p className="font-medium text-blue-600">PO-2025-1217-001</p>
        <p className="text-xs text-slate-500">2025-12-17</p>
      </div>
      {/* 🔥 订单组标识 */}
      {po.isPartOfGroup && (
        <Badge variant="outline" className="mt-1 bg-orange-50 border-orange-300 text-orange-700">
          <Package className="w-3 h-3 mr-1" />
          订单组 (1/3)
        </Badge>
      )}
    </TableCell>
    
    <TableCell>供应商A2</TableCell>
    <TableCell>LED灯 x100</TableCell>
    <TableCell>$1,250.00</TableCell>
    <TableCell>{getStatusBadge(po.status)}</TableCell>
    
    <TableCell>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost">详情</Button>
        
        {/* 🔥 查看订单组按钮 */}
        {po.isPartOfGroup && (
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => viewOrderGroup(po.orderGroup)}
          >
            <Package className="w-3 h-3 mr-1" />
            组视图
          </Button>
        )}
      </div>
    </TableCell>
  </TableRow>
</Table>
```

### 订单组视图（全屏对话框）

点击"组视图"后，显示订单组详情：

```
┌─────────────────────────────────────────────────────────────┐
│ ← 返回列表                              [导出] [打印]       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📦 订单组信息                              [订单组] Badge  │
│  此订单组包含 3 个采购订单，来自同一业务需求                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 订单组号: PO-GROUP-20251217-001                      │  │
│  │ 来源单号: SO-2025-0892                               │  │
│  │ 采购需求号: PR-2025-1215-001                         │  │
│  │ 创建日期: 2025-12-17                                 │  │
│  │                                                       │  │
│  │ 备注: 销售订单SO-2025-0892拆分订单                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │总订单数 │  │已确认   │  │已发货   │  │已完成   │      │
│  │   3     │  │   2     │  │   1     │  │   0     │      │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │
│                                                              │
│  订单明细                                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │订单号      供应商  产品    金额      交期    状态    │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │PO-...-001  供应商A2 LED灯  $1,250  12-30  已确认 [详情]│
│  │  (1/3)                                                │  │
│  │PO-...-002  供应商B1 开关   $1,600  12-30  已确认 [详情]│
│  │  (2/3)                                                │  │
│  │PO-...-003  供应商C3 插座   $4,500  12-30  待确认 [详情]│
│  │  (3/3)                                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  订单组摘要                                                  │
│  总供应商数: 3家                                             │
│  总产品种类: 3种                                             │
│  总订单金额: $7,350.00                                       │
│  完成进度: 0%                                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 测试数据生成脚本

在浏览器控制台执行，快速创建测试订单组：

```javascript
// 🔥 一键创建订单组测试数据
(function() {
  const orderGroup = `PO-GROUP-${Date.now()}`;
  const sourceRef = "SO-2025-0892";
  
  const testOrders = [
    {
      id: `po_${Date.now()}_1`,
      poNumber: `PO-2025-1217-${Math.floor(Math.random() * 900) + 100}`,
      orderGroup,
      isPartOfGroup: true,
      groupTotalOrders: 3,
      groupNote: `销售订单${sourceRef}拆分订单`,
      
      supplierCode: "supplier_a@test.com",
      supplierName: "测试供应商A",
      
      items: [{
        id: "item1",
        productName: "LED灯",
        modelNo: "LED-100W",
        quantity: 100,
        unit: "个",
        unitPrice: 12.50,
        currency: "USD",
        subtotal: 1250
      }],
      
      totalAmount: 1250,
      currency: "USD",
      paymentTerms: "T/T 30% deposit",
      deliveryTerms: "FOB",
      orderDate: "2025-12-17",
      expectedDate: "2025-12-30",
      status: "confirmed",
      paymentStatus: "unpaid",
      sourceRef,
      createdBy: "admin@cosun.com",
      createdDate: "2025-12-17"
    },
    {
      id: `po_${Date.now()}_2`,
      poNumber: `PO-2025-1217-${Math.floor(Math.random() * 900) + 100}`,
      orderGroup,
      isPartOfGroup: true,
      groupTotalOrders: 3,
      groupNote: `销售订单${sourceRef}拆分订单`,
      
      supplierCode: "supplier_b@test.com",
      supplierName: "测试供应商B",
      
      items: [{
        id: "item2",
        productName: "开关",
        modelNo: "SW-200",
        quantity: 200,
        unit: "个",
        unitPrice: 8.00,
        currency: "USD",
        subtotal: 1600
      }],
      
      totalAmount: 1600,
      currency: "USD",
      paymentTerms: "T/T 30% deposit",
      deliveryTerms: "FOB",
      orderDate: "2025-12-17",
      expectedDate: "2025-12-30",
      status: "confirmed",
      paymentStatus: "unpaid",
      sourceRef,
      createdBy: "admin@cosun.com",
      createdDate: "2025-12-17"
    },
    {
      id: `po_${Date.now()}_3`,
      poNumber: `PO-2025-1217-${Math.floor(Math.random() * 900) + 100}`,
      orderGroup,
      isPartOfGroup: true,
      groupTotalOrders: 3,
      groupNote: `销售订单${sourceRef}拆分订单`,
      
      supplierCode: "supplier_c@test.com",
      supplierName: "测试供应商C",
      
      items: [{
        id: "item3",
        productName: "插座",
        modelNo: "SK-300",
        quantity: 300,
        unit: "个",
        unitPrice: 15.00,
        currency: "USD",
        subtotal: 4500
      }],
      
      totalAmount: 4500,
      currency: "USD",
      paymentTerms: "T/T 30% deposit",
      deliveryTerms: "FOB",
      orderDate: "2025-12-17",
      expectedDate: "2025-12-30",
      status: "pending",
      paymentStatus: "unpaid",
      sourceRef,
      createdBy: "admin@cosun.com",
      createdDate: "2025-12-17"
    }
  ];
  
  // 保存到localStorage
  const existingPOs = JSON.parse(localStorage.getItem('purchaseOrders') || '[]');
  const newPOs = [...existingPOs, ...testOrders];
  localStorage.setItem('purchaseOrders', JSON.stringify(newPOs));
  
  console.log('%c✅ 订单组测试数据已创建！', 'color: green; font-size: 16px; font-weight: bold');
  console.log('📦 订单组号:', orderGroup);
  console.log('📋 包含订单数:', testOrders.length);
  console.log('💰 总金额:', testOrders.reduce((sum, o) => sum + o.totalAmount, 0));
  
  alert(`✅ 订单组测试数据已创建！\n订单组号: ${orderGroup}\n包含 ${testOrders.length} 个采购订单`);
  location.reload();
})();
```

---

## 🔄 下一步开发优先级

### 高优先级
1. ✅ 数据结构更新（已完成）
2. ✅ Context方法添加（已完成）
3. ✅ 订单组视图组件（已完成）
4. ⏳ 采购订单列表显示订单组标识
5. ⏳ 点击"组视图"按钮打开订单组详情

### 中优先级
6. ⏳ 创建PO时自动拆单逻辑
7. ⏳ 订单组批量操作（确认、取消、导出）
8. ⏳ 订单组进度跟踪

### 低优先级
9. ⏳ 订单组甘特图
10. ⏳ 订单组财务汇总

---

## 📊 数据关系图

```
销售订单 SO-2025-0892
  ↓
采购需求 PR-2025-1215-001
  ↓
RFQ询价
  ├─ RFQ-001 (产品A) → 供应商A1, A2, A3
  ├─ RFQ-002 (产品B) → 供应商B1, B2, B3
  └─ RFQ-003 (产品C) → 供应商C1, C2, C3
  ↓
选择最优报价
  ├─ 产品A → 供应商A2
  ├─ 产品B → 供应商B1
  └─ 产品C → 供应商C3
  ↓
创建订单组 PO-GROUP-20251217-001
  ├─ PO-2025-1217-001 → 供应商A2 (产品A)
  ├─ PO-2025-1217-002 → 供应商B1 (产品B)
  └─ PO-2025-1217-003 → 供应商C3 (产品C)
  ↓
推送到Supplier Portal
  ├─ 供应商A2 → 看到 PO-2025-1217-001
  ├─ 供应商B1 → 看到 PO-2025-1217-002
  └─ 供应商C3 → 看到 PO-2025-1217-003
```

---

## ✨ 业务价值

1. **清晰的订单关系** - 虽然拆分成3个PO，但通过orderGroup关联
2. **独立管理** - 每个供应商独立确认、发货、付款
3. **灵活跟踪** - 可以单独查看每个PO，也可以组视图查看全部
4. **便于报关** - 不同供应商可能不同时间发货，独立报关文档
5. **财务清晰** - 每个供应商独立付款记录

---

**状态**: ✅ 数据结构和组件已完成
**测试**: 可用测试脚本快速验证
**文档**: 完整
