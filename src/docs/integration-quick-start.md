# 🚀 单证管理系统集成快速指南

## 目录
1. [快速开始](#快速开始)
2. [使用示例](#使用示例)
3. [各模块集成方式](#各模块集成方式)
4. [常见问题](#常见问题)

---

## 一、快速开始

### 1.1 初始化事件总线和服务

```typescript
// 在App.tsx或主入口文件中初始化

import { eventBus } from './lib/business-event-bus';
import { documentationService } from './lib/services/documentation-service';
import { projectId, publicAnonKey } from './utils/supabase/info';

// 应用启动时初始化
useEffect(() => {
  // 1. 初始化事件总线
  eventBus.initSupabase(
    `https://${projectId}.supabase.co`,
    publicAnonKey
  );
  
  // 2. 初始化单证服务
  documentationService.init(
    `https://${projectId}.supabase.co`,
    publicAnonKey
  );
  
  console.log('✅ 业务事件系统已初始化');
}, []);
```

---

## 二、使用示例

### 2.1 订单管理模块 → 触发单证流程

```typescript
// /components/admin/OrderManagementCenterPro.tsx

import { eventBus, createEventPayload } from '../../lib/business-event-bus';

function OrderManagementCenterPro() {
  // 业务员签订合同
  const handleSignContract = async (contractData) => {
    try {
      // 1. 保存合同到数据库
      const { data: contract } = await supabase
        .from('contracts')
        .insert({
          contract_no: contractData.contractNo,
          order_id: contractData.orderId,
          customer_name: contractData.customerName,
          total_value: contractData.totalValue,
          currency: contractData.currency,
          incoterm: contractData.incoterm,
          payment_term: contractData.paymentTerm,
          status: 'signed',
          signed_date: new Date().toISOString()
        })
        .select()
        .single();
      
      // 2. 更新订单状态
      await supabase
        .from('orders')
        .update({ 
          status: 'contract_signed',
          contract_date: new Date().toISOString()
        })
        .eq('order_id', contractData.orderId);
      
      // 3. 🔥 发布事件：合同已签订（自动触发单证流程）
      eventBus.publish(
        createEventPayload(
          'CONTRACT_SIGNED',
          contractData.orderId,
          contract,
          currentUser.username,
          contract.contract_no
        )
      );
      
      // 4. 提示用户
      toast.success('合同签订成功！单证系统已自动创建13项单证任务');
      
    } catch (error) {
      console.error('签订合同失败:', error);
      toast.error('签订合同失败');
    }
  };

  // 业务员发起出货通知
  const handleIssueShippingNotice = async (orderId, shipmentData) => {
    try {
      // 1. 创建出货通知单
      const { data: notice } = await supabase
        .from('shipping_notices')
        .insert({
          order_id: orderId,
          shipment_date: shipmentData.shipmentDate,
          packing_list: shipmentData.packingList,
          status: 'issued'
        })
        .select()
        .single();
      
      // 2. 🔥 发布事件：出货通知已发出（提醒物流上传D03）
      eventBus.publish(
        createEventPayload(
          'SHIPPING_NOTICE_ISSUED',
          orderId,
          notice,
          currentUser.username
        )
      );
      
      toast.success('出货通知已发出！单证系统已提醒物流部上传D03');
      
    } catch (error) {
      console.error('发起出货通知失败:', error);
    }
  };

  return (
    <div>
      {/* 订单列表 */}
      <Button onClick={() => handleSignContract(contractData)}>
        签订合同
      </Button>
      <Button onClick={() => handleIssueShippingNotice(orderId, data)}>
        发起出货通知
      </Button>
    </div>
  );
}
```

### 2.2 发货管理模块 → 触发单证流程

```typescript
// /components/admin/ShipmentManagementCenterV2.tsx

import { eventBus, createEventPayload } from '../../lib/business-event-bus';

function ShipmentManagementCenterV2() {
  // 报关完成
  const handleCustomsCleared = async (orderId, customsData) => {
    try {
      // 1. 更新发货记录
      await supabase
        .from('shipments')
        .update({
          customs_status: 'cleared',
          customs_date: new Date().toISOString(),
          customs_declaration_no: customsData.declarationNo
        })
        .eq('order_id', orderId);
      
      // 2. 更新订单状态
      await supabase
        .from('orders')
        .update({ 
          status: 'customs_cleared',
          customs_date: new Date().toISOString()
        })
        .eq('order_id', orderId);
      
      // 3. 🔥 发布事件：报关已完成（提醒报关行上传D05/D06）
      eventBus.publish(
        createEventPayload(
          'CUSTOMS_CLEARED',
          orderId,
          customsData,
          'customs_broker'
        )
      );
      
      toast.success('报关完成！单证系统已提醒报关行上传D05、D06');
      
    } catch (error) {
      console.error('报关操作失败:', error);
    }
  };

  // 装船/开船
  const handleVesselDeparted = async (orderId, vesselData) => {
    try {
      // 1. 更新发货记录
      await supabase
        .from('shipments')
        .update({
          shipping_status: 'shipped',
          etd: vesselData.etd,
          eta: vesselData.eta,
          vessel_name: vesselData.vesselName,
          bl_no: vesselData.blNo
        })
        .eq('order_id', orderId);
      
      // 2. 🔥 发布事件：开船（提醒货代上传D09）
      eventBus.publish(
        createEventPayload(
          'VESSEL_DEPARTED',
          orderId,
          vesselData,
          'forwarder'
        )
      );
      
      toast.success('装船完成！单证系统已提醒货代上传D09');
      
    } catch (error) {
      console.error('装船操作失败:', error);
    }
  };

  return (
    <div>
      <Button onClick={() => handleCustomsCleared(orderId, data)}>
        报关完成
      </Button>
      <Button onClick={() => handleVesselDeparted(orderId, data)}>
        装船/开船
      </Button>
    </div>
  );
}
```

### 2.3 财务管理模块 → 触发单证流程

```typescript
// /components/admin/FinanceManagement.tsx

import { eventBus, createEventPayload } from '../../lib/business-event-bus';

function FinanceManagement() {
  // 确认收汇
  const handleConfirmPayment = async (orderId, paymentData) => {
    try {
      // 1. 创建收汇记录
      const { data: payment } = await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          amount: paymentData.amount,
          currency: paymentData.currency,
          received_date: paymentData.receivedDate,
          bank_reference: paymentData.bankReference,
          status: 'received'
        })
        .select()
        .single();
      
      // 2. 上传收汇水单文件到Storage
      const { data: uploadedFile } = await supabase.storage
        .from('make-880fd43b-documents')
        .upload(`orders/${orderId}/D11/收汇水单.pdf`, paymentData.file);
      
      // 3. 更新订单状态
      await supabase
        .from('orders')
        .update({ 
          status: 'payment_received',
          collection_date: paymentData.receivedDate
        })
        .eq('order_id', orderId);
      
      // 4. 🔥 发布事件：收汇确认（自动关联D11）
      eventBus.publish(
        createEventPayload(
          'PAYMENT_RECEIVED',
          orderId,
          { ...payment, fileUrl: uploadedFile.path },
          currentUser.username
        )
      );
      
      toast.success('收汇确认成功！单证系统已自动关联D11');
      
    } catch (error) {
      console.error('确认收汇失败:', error);
    }
  };

  // 完成结汇
  const handleCompleteSettlement = async (orderId, settlementData) => {
    try {
      // 1. 创建结汇记录
      const { data: settlement } = await supabase
        .from('fx_settlements')
        .insert({
          order_id: orderId,
          amount: settlementData.amount,
          exchange_rate: settlementData.exchangeRate,
          settled_date: settlementData.settledDate,
          bank_reference: settlementData.bankReference
        })
        .select()
        .single();
      
      // 2. 上传结汇水单文件
      const { data: uploadedFile } = await supabase.storage
        .from('make-880fd43b-documents')
        .upload(`orders/${orderId}/D12/结汇水单.pdf`, settlementData.file);
      
      // 3. 更新订单状态
      await supabase
        .from('orders')
        .update({ 
          status: 'fx_settled',
          settlement_date: settlementData.settledDate
        })
        .eq('order_id', orderId);
      
      // 4. 🔥 发布事件：结汇完成（自动关联D12、生成D13、检查D01）
      eventBus.publish(
        createEventPayload(
          'FX_SETTLED',
          orderId,
          { ...settlement, fileUrl: uploadedFile.path },
          currentUser.username
        )
      );
      
      toast.success('结汇完成！单证系统已自动生成D13，并检查是否可生成D01');
      
    } catch (error) {
      console.error('结汇操作失败:', error);
    }
  };

  return (
    <div>
      <Button onClick={() => handleConfirmPayment(orderId, data)}>
        确认收汇
      </Button>
      <Button onClick={() => handleCompleteSettlement(orderId, data)}>
        完成结汇
      </Button>
    </div>
  );
}
```

### 2.4 单证管理模块 → 监听业务事件

```typescript
// /components/admin/workbenches/DocumentationWorkbenchUltimate.tsx

import { useBusinessEvent } from '../../../lib/business-event-bus';
import { documentationService } from '../../../lib/services/documentation-service';

function DocumentationWorkbenchUltimate() {
  const [orders, setOrders] = useState([]);

  // 🔥 监听：合同签订事件（实时刷新订单列表）
  useBusinessEvent('CONTRACT_SIGNED', (payload) => {
    console.log('📋 [UI] 检测到合同签订，刷新订单列表...');
    fetchOrders(); // 重新获取订单列表
    toast.info(`订单 ${payload.orderId} 的单证任务已创建`);
  });

  // 🔥 监听：单证齐全可退税
  useBusinessEvent('DOCS_READY_FOR_TAX_REFUND', (payload) => {
    console.log('📋 [UI] 检测到单证齐全，可提交退税...');
    toast.success(`订单 ${payload.orderId} 的13项单证已齐全，可提交退税申报！`);
    // 自动跳转到退税申报界面
    setActiveTab('tax-refund');
  });

  // 🔥 监听：所有业务事件（用于实时刷新单证状态）
  useEffect(() => {
    const handler = (event: CustomEvent) => {
      console.log('📋 [UI] 业务事件触发，刷新单证状态:', event.detail);
      
      // 实时刷新单证列表
      if (event.detail.orderId) {
        refreshDocumentStatus(event.detail.orderId);
      }
    };

    window.addEventListener('business-event', handler as any);

    return () => {
      window.removeEventListener('business-event', handler as any);
    };
  }, []);

  // 刷新单证状态
  const refreshDocumentStatus = async (orderId: string) => {
    const documents = await documentationService.getOrderDocuments(orderId);
    // 更新UI显示
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.orderId === orderId 
          ? { ...order, documents } 
          : order
      )
    );
  };

  return (
    <div>
      {/* 单证工作台UI */}
    </div>
  );
}
```

---

## 三、各模块集成方式

### 3.1 模块集成清单

| 模块 | 触发的事件 | 需要修改的文件 | 工作量 |
|------|-----------|---------------|--------|
| **订单管理中心** | `CONTRACT_SIGNED`<br/>`SHIPPING_NOTICE_ISSUED` | `/components/admin/OrderManagementCenterPro.tsx` | 2小时 |
| **采购管理** | `PROCUREMENT_PAID` | `/components/dashboards/ProcurementDashboard.tsx` | 1小时 |
| **发货管理中心** | `CUSTOMS_CLEARED`<br/>`VESSEL_DEPARTED` | `/components/admin/ShipmentManagementCenterV2.tsx` | 2小时 |
| **财务管理** | `PAYMENT_RECEIVED`<br/>`FX_SETTLED` | `/components/admin/FinanceManagement.tsx` | 2小时 |
| **单证管理系统** | 监听所有事件 | `/components/admin/workbenches/DocumentationWorkbenchUltimate.tsx` | 3小时 |

**总工作量估算：** 10小时（1-2个工作日）

### 3.2 数据库表创建

在Supabase中创建以下表：

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
CREATE INDEX idx_event_timestamp ON business_event_logs(timestamp);

-- 单证实例表（如果还没有创建）
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

## 四、常见问题

### Q1: 如何避免重复订阅事件？

**A:** 在服务初始化时检查是否已初始化：

```typescript
class DocumentationService {
  private isInitialized = false;

  init() {
    if (this.isInitialized) {
      console.warn('服务已初始化，跳过');
      return;
    }
    
    this.subscribeToBusinessEvents();
    this.isInitialized = true;
  }
}
```

### Q2: 如何调试事件流？

**A:** 在浏览器控制台查看事件日志：

```typescript
// 查看事件总线统计
console.log(eventBus.getStats());

// 查看事件日志
const { data } = await supabase
  .from('business_event_logs')
  .select('*')
  .eq('order_id', 'SO-xxx')
  .order('timestamp', { ascending: false });

console.table(data);
```

### Q3: 如何在现有系统中逐步迁移？

**A:** 使用双模式运行：

```typescript
const USE_EVENT_BUS = localStorage.getItem('useEventBus') === 'true';

if (USE_EVENT_BUS) {
  // 新方式：事件总线
  eventBus.publish(...);
} else {
  // 旧方式：直接调用
  documentationService.createTask(...);
}
```

### Q4: 性能影响？

**A:** 事件总线是内存操作，性能影响可忽略：
- 事件发布：< 1ms
- 监听器执行：取决于业务逻辑
- 数据库日志保存：异步操作，不阻塞主流程

---

## 五、验证测试

### 5.1 完整流程测试脚本

```typescript
// 测试完整业务流程
async function testFullWorkflow() {
  console.log('🧪 开始测试完整业务流程...');
  
  const testOrderId = 'SO-TEST-001';
  const testContractNo = 'SC-TEST-001';
  
  // 1️⃣ 签订合同
  console.log('1️⃣ 模拟签订合同...');
  eventBus.publish(createEventPayload(
    'CONTRACT_SIGNED',
    testOrderId,
    {
      order_id: testOrderId,
      contract_no: testContractNo,
      incoterm: 'FOB',
      customer_name: 'Test Customer',
      total_value: 100000,
      currency: 'USD'
    },
    'test_user',
    testContractNo
  ));
  
  await sleep(2000); // 等待处理
  
  // 检查单证任务是否创建
  const docs = await documentationService.getOrderDocuments(testOrderId);
  console.log(`✅ 单证任务已创建: ${docs.length}项`);
  
  // 2️⃣ 出货通知
  console.log('2️⃣ 模拟出货通知...');
  eventBus.publish(createEventPayload(
    'SHIPPING_NOTICE_ISSUED',
    testOrderId,
    { shipment_date: '2025-12-15' },
    'test_user'
  ));
  
  // 3️⃣ 报关完成
  console.log('3️⃣ 模拟报关完成...');
  eventBus.publish(createEventPayload(
    'CUSTOMS_CLEARED',
    testOrderId,
    { declaration_no: 'CUSTOMS-001' },
    'customs_broker'
  ));
  
  // 4️⃣ 开船
  console.log('4️⃣ 模拟开船...');
  eventBus.publish(createEventPayload(
    'VESSEL_DEPARTED',
    testOrderId,
    { vessel_name: 'TEST VESSEL', etd: '2025-12-20' },
    'forwarder'
  ));
  
  // 5️⃣ 收汇
  console.log('5️⃣ 模拟收汇...');
  eventBus.publish(createEventPayload(
    'PAYMENT_RECEIVED',
    testOrderId,
    { amount: 100000, currency: 'USD' },
    'finance'
  ));
  
  // 6️⃣ 结汇
  console.log('6️⃣ 模拟结汇...');
  eventBus.publish(createEventPayload(
    'FX_SETTLED',
    testOrderId,
    { amount: 100000, exchange_rate: 7.2 },
    'finance'
  ));
  
  await sleep(3000); // 等待处理
  
  // 检查最终结果
  const finalDocs = await documentationService.getOrderDocuments(testOrderId);
  console.log('📊 最终单证状态:');
  console.table(finalDocs.map(d => ({
    单证: d.doc_id,
    状态: d.status,
    生成方式: d.generation_type
  })));
  
  console.log('✅ 测试完成！');
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 运行测试
testFullWorkflow();
```

---

**文档版本：** v1.0  
**最后更新：** 2025-12-11  
**作者：** THE COSUN BM 集成团队
