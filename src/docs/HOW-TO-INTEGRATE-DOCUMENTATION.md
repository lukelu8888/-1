# 🚀 如何集成单证管理系统 - 快速指南

## 📋 概述

您已经手动创建了完整的事件驱动架构，包括：

1. ✅ `/lib/business-event-bus.ts` - 业务事件总线
2. ✅ `/lib/services/documentation-service.ts` - 单证服务
3. ✅ `/docs/documentation-integration-architecture.md` - 完整架构文档
4. ✅ `/docs/integration-quick-start.md` - 快速集成指南
5. ✅ `/components/admin/workbenches/DocumentationWorkbenchUltimate.tsx` - 单证管理UI（已集成事件监听）

---

## ⚡ 快速集成步骤

### Step 1: 初始化服务（在App.tsx中）

```typescript
// /App.tsx

import { useEffect } from 'react';
import { eventBus } from './lib/business-event-bus';
import { documentationService } from './lib/services/documentation-service';
import { projectId, publicAnonKey } from './utils/supabase/info';

function App() {
  useEffect(() => {
    // 初始化事件总线
    eventBus.initSupabase(
      `https://${projectId}.supabase.co`,
      publicAnonKey
    );
    
    // 初始化单证服务
    documentationService.init(
      `https://${projectId}.supabase.co`,
      publicAnonKey
    );
    
    console.log('✅ 单证管理系统已初始化');
  }, []);

  return (
    // ... your app
  );
}
```

---

### Step 2: 在订单管理中触发事件

```typescript
// /components/admin/OrderManagementCenterPro.tsx

import { eventBus, createEventPayload } from '../../lib/business-event-bus';
import { useAuth } from '../../hooks/useAuth';

function OrderManagementCenterPro() {
  const { currentUser } = useAuth();

  // 🔥 业务员签订合同
  const handleSignContract = async (contractData) => {
    // 1. 保存合同到数据库
    const contract = await saveContract(contractData);
    
    // 2. 发布事件（自动触发单证流程）
    eventBus.publish(
      createEventPayload(
        'CONTRACT_SIGNED',
        contractData.orderId,
        contract,
        currentUser.username,
        contract.contract_no
      )
    );
    
    toast.success('合同签订成功！单证系统已自动创建任务');
  };

  return (
    <Button onClick={() => handleSignContract(data)}>
      签订合同
    </Button>
  );
}
```

---

### Step 3: 在发货管理中触发事件

```typescript
// /components/admin/ShipmentManagementCenterV2.tsx

import { eventBus, createEventPayload } from '../../lib/business-event-bus';

function ShipmentManagementCenterV2() {
  // 🔥 报关完成
  const handleCustomsCleared = async (orderId, customsData) => {
    // 1. 更新数据库
    await updateCustomsStatus(orderId, 'cleared');
    
    // 2. 发布事件（自动提醒上传D05/D06）
    eventBus.publish(
      createEventPayload(
        'CUSTOMS_CLEARED',
        orderId,
        customsData,
        'customs_broker'
      )
    );
    
    toast.success('报关完成！单证系统已提醒上传D05、D06');
  };

  return (
    <Button onClick={() => handleCustomsCleared(orderId, data)}>
      报关完成
    </Button>
  );
}
```

---

### Step 4: 在财务管理中触发事件

```typescript
// /components/admin/FinanceManagement.tsx

import { eventBus, createEventPayload } from '../../lib/business-event-bus';

function FinanceManagement() {
  // 🔥 确认收汇
  const handleConfirmPayment = async (orderId, paymentData) => {
    // 1. 创建收汇记录
    await createPaymentRecord(orderId, paymentData);
    
    // 2. 发布事件（自动关联D11）
    eventBus.publish(
      createEventPayload(
        'PAYMENT_RECEIVED',
        orderId,
        paymentData,
        currentUser.username
      )
    );
    
    toast.success('收汇确认成功！单证系统已关联D11');
  };

  // 🔥 完成结汇
  const handleCompleteSettlement = async (orderId, settlementData) => {
    // 1. 创建结汇记录
    await createSettlementRecord(orderId, settlementData);
    
    // 2. 发布事件（自动关联D12、生成D13、检查D01）
    eventBus.publish(
      createEventPayload(
        'FX_SETTLED',
        orderId,
        settlementData,
        currentUser.username
      )
    );
    
    toast.success('结汇完成！D12已关联，D13已生成，正在检查D01');
  };

  return (
    <>
      <Button onClick={() => handleConfirmPayment(orderId, data)}>
        确认收汇
      </Button>
      <Button onClick={() => handleCompleteSettlement(orderId, data)}>
        完成结汇
      </Button>
    </>
  );
}
```

---

### Step 5: 单证管理系统监听事件（已完成）✅

`DocumentationWorkbenchUltimate` 已经集成了事件监听：

```typescript
// /components/admin/workbenches/DocumentationWorkbenchUltimate.tsx

// 🔥 监听：合同签订事件
useBusinessEvent('CONTRACT_SIGNED', (payload) => {
  toast.info(`订单 ${payload.orderId} 的单证任务已创建`);
});

// 🔥 监听：单证齐全可退税
useBusinessEvent('DOCS_READY_FOR_TAX_REFUND', (payload) => {
  toast.success(`🎉 订单 ${payload.orderId} 的13项单证已齐全，可提交退税申报！`);
});

// ... 其他事件监听
```

---

## 📊 数据库表创建

在 Supabase 中创建以下表：

```sql
-- 业务事件日志表
CREATE TABLE business_event_logs (
  event_id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  order_id VARCHAR(50) NOT NULL,
  contract_no VARCHAR(50),
  timestamp TIMESTAMP DEFAULT NOW(),
  data JSONB,
  operator VARCHAR(50) NOT NULL,
  metadata JSONB
);

CREATE INDEX idx_event_order ON business_event_logs(order_id);
CREATE INDEX idx_event_type ON business_event_logs(event_type);

-- 单证实例表
CREATE TABLE document_instances (
  instance_id VARCHAR(50) PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  doc_id VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL,
  generation_type VARCHAR(20),
  upload_date TIMESTAMP,
  upload_by VARCHAR(50),
  reviewer VARCHAR(50),
  review_date TIMESTAMP,
  approve_date TIMESTAMP,
  version INTEGER DEFAULT 1,
  urgency VARCHAR(20),
  remarks TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_order_doc ON document_instances(order_id, doc_id);
```

---

## 🎯 8种业务事件

| 事件类型 | 触发时机 | 触发模块 | 单证系统响应 |
|---------|---------|---------|-------------|
| `CONTRACT_SIGNED` | 合同签订 | 订单管理 | 创建13项单证任务 + 生成D02 + 判断D04/D10 |
| `PROCUREMENT_PAID` | 采购付款 | 采购管理 | 生成D07 |
| `SHIPPING_NOTICE_ISSUED` | 出货通知 | 订单管理 | 提醒上传D03 |
| `CUSTOMS_CLEARED` | 报关完成 | 发货管理 | 提醒上传D05/D06 + 判断D08 |
| `VESSEL_DEPARTED` | 开船 | 发货管理 | 提醒上传D09 |
| `PAYMENT_RECEIVED` | 收汇 | 财务管理 | 关联D11 |
| `FX_SETTLED` | 结汇 | 财务管理 | 关联D12 + 生成D13 + 检查D01 |
| `DOCS_READY_FOR_TAX_REFUND` | 单证齐全 | 单证系统 | 通知财务可退税 |

---

## 🧪 测试流程

### 测试完整业务流程

```typescript
// 1. 签订合同
eventBus.publish(createEventPayload(
  'CONTRACT_SIGNED',
  'SO-TEST-001',
  { order_id: 'SO-TEST-001', incoterm: 'FOB', ... },
  'test_user',
  'SC-TEST-001'
));

// 2. 报关完成
eventBus.publish(createEventPayload(
  'CUSTOMS_CLEARED',
  'SO-TEST-001',
  { declaration_no: 'CUSTOMS-001' },
  'customs_broker'
));

// 3. 收汇
eventBus.publish(createEventPayload(
  'PAYMENT_RECEIVED',
  'SO-TEST-001',
  { amount: 100000, currency: 'USD' },
  'finance'
));

// 4. 结汇
eventBus.publish(createEventPayload(
  'FX_SETTLED',
  'SO-TEST-001',
  { amount: 100000, exchange_rate: 7.2 },
  'finance'
));
```

查看控制台日志，确认事件流转正常。

---

## ✅ 集成检查清单

- [ ] App.tsx中初始化eventBus和documentationService
- [ ] 订单管理模块集成 `CONTRACT_SIGNED` 事件
- [ ] 发货管理模块集成 `CUSTOMS_CLEARED` + `VESSEL_DEPARTED` 事件
- [ ] 财务管理模块集成 `PAYMENT_RECEIVED` + `FX_SETTLED` 事件
- [ ] 单证管理系统监听所有事件
- [ ] Supabase创建business_event_logs和document_instances表
- [ ] 测试完整业务流程

---

## 📚 完整文档

- **架构设计**：`/docs/documentation-integration-architecture.md`
- **快速集成**：`/docs/integration-quick-start.md`
- **业务设计**：`/docs/documentation-system-design.md`

---

**版本：** v1.0  
**最后更新：** 2025-12-11  
**作者：** THE COSUN BM Integration Team
