# 🔗 单证管理系统与业务模块对接架构设计

## 目录
1. [当前问题分析](#当前问题分析)
2. [业务模块对接关系](#业务模块对接关系)
3. [技术架构设计](#技术架构设计)
4. [数据流转设计](#数据流转设计)
5. [API接口设计](#api接口设计)
6. [实施方案](#实施方案)

---

## 一、当前问题分析

### 1.1 现状问题

```
❌ 问题1：数据孤岛
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  订单管理中心    │    │  发货管理中心    │    │  单证管理系统    │
│                 │    │                 │    │                 │
│  Mock数据       │    │  Mock数据       │    │  Mock数据       │
│  独立状态       │    │  独立状态       │    │  独立状态       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
     ❌ 无通信             ❌ 无通信             ❌ 无通信

❌ 问题2：业务流程断裂
业务员签订合同 → ❌ 单证系统不知道 → ❌ D02未自动生成
报关行完成报关 → ❌ 单证系统不知道 → ❌ D05未触发提醒
财务部确认收汇 → ❌ 单证系统不知道 → ❌ D11未自动关联

❌ 问题3：手工操作过多
- 业务员需要手动通知单证员
- 单证员需要手动创建单证任务
- 数据需要重复录入

❌ 问题4：数据不一致
- 订单管理中心的订单号 ≠ 单证系统的订单号
- 客户名称、金额、日期等信息不一致
- 无法追溯业务源头
```

### 1.2 期望目标

```
✅ 目标1：统一数据源
┌─────────────────────────────────────────────────────────┐
│              Supabase 统一数据中台                        │
│  orders | customers | contracts | shipments | documents │
└─────────────────────────────────────────────────────────┘
     ↓              ↓              ↓              ↓
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│订单管理  │  │发货管理  │  │财务管理  │  │单证管理  │
└─────────┘  └─────────┘  └─────────┘  └─────────┘

✅ 目标2：自动业务联动
业务员签订合同 → 自动触发 → D02生成 + 单证任务创建
报关行完成报关 → 自动触发 → D05上传提醒
财务部确认收汇 → 自动触发 → D11关联 + D12/D13生成

✅ 目标3：实时数据同步
任何模块的数据变更 → 实时更新 → 所有相关模块

✅ 目标4：完整业务闭环
询价 → 报价 → 合同 → 采购 → 出货 → 报关 → 收汇 → 退税 → 归档
每个节点都有明确的数据流转和单证触发
```

---

## 二、业务模块对接关系

### 2.1 业务流程与模块映射

```
┌────────────────────────────────────────────────────────────────┐
│                     完整业务流程链                              │
└────────────────────────────────────────────────────────────────┘

1️⃣ 询价阶段
   模块：CRM系统 (CustomerRelationshipManagerPro)
   数据：客户信息、产品信息、询价记录
   触发：无（询价阶段不涉及单证）

2️⃣ 报价阶段
   模块：订单管理中心 (OrderManagementCenterPro)
   数据：报价单、产品清单、价格
   触发：无（报价阶段不涉及单证）

3️⃣ 合同签订 ⭐ 关键节点
   模块：订单管理中心 (OrderManagementCenterPro)
   数据：销售合同(SC)、客户、金额、Incoterm、付款条款
   触发单证：
   ├─ D02 (销售合同) - 系统自动生成
   ├─ D04 (国内运费免责) - 根据Incoterm自动判断
   └─ D10 (国际运费免责) - 根据Incoterm自动判断
   
   📊 数据流转：
   OrderManagementCenterPro
     ├─ 创建销售合同(SC)
     ├─ 状态：draft → signed
     └─ 触发事件：CONTRACT_SIGNED
          ↓
   DocumentationWorkbenchUltimate
     ├─ 监听事件：CONTRACT_SIGNED
     ├─ 创建单证任务
     ├─ 生成D02文档
     └─ 自动判断并生成D04/D10

4️⃣ 采购阶段 ⭐ 关键节点
   模块：采购管理 (ProcurementDashboard)
   数据：采购合同(PC)、供应商、采购金额、付款凭证
   触发单证：
   └─ D07 (采购发票及付款凭证) - 系统自动生成
   
   📊 数据流转：
   ProcurementDashboard
     ├─ 创建采购合同(PC)
     ├─ 财务部上传付款凭证
     └─ 触发事件：PROCUREMENT_PAID
          ↓
   DocumentationWorkbenchUltimate
     ├─ 监听事件：PROCUREMENT_PAID
     └─ 生成D07文档

5️⃣ 生产/验货阶段
   模块：供应商管理 + 验货管理 (InspectionManagement)
   数据：生产进度、验货报告、QC结果
   触发：无（不直接涉及出口单证）

6️⃣ 出货通知 ⭐ 关键节点
   模块：订单管理中心 (OrderManagementCenterPro)
   数据：出货通知单、预计发货日期、装箱清单
   触发单证：
   └─ D03 (国内运输单据) - 提醒物流部上传
   
   📊 数据流转：
   OrderManagementCenterPro
     ├─ 业务员发起出货通知
     └─ 触发事件：SHIPPING_NOTICE_ISSUED
          ↓
   DocumentationWorkbenchUltimate
     ├─ 监听事件：SHIPPING_NOTICE_ISSUED
     ├─ 创建单证任务
     └─ 提醒物流部上传D03

7️⃣ 订舱阶段
   模块：发货管理中心 (ShipmentManagementCenterV2)
   数据：订舱单、船期、货代信息
   触发：无

8️⃣ 报关阶段 ⭐ 关键节点
   模块：发货管理中心 (ShipmentManagementCenterV2)
   数据：报关单、装箱单、提运单(B/L)
   触发单证：
   ├─ D05 (报关单/装箱单/提运单) - 提醒报关行上传
   ├─ D06 (委托报关合同) - 提醒报关行上传
   └─ D08 (报关费用免责) - 根据合同条款自动判断
   
   📊 数据流转：
   ShipmentManagementCenterV2
     ├─ 报关行完成报关
     ├─ 状态：customs_processing → customs_cleared
     └─ 触发事件：CUSTOMS_CLEARED
          ↓
   DocumentationWorkbenchUltimate
     ├─ 监听事件：CUSTOMS_CLEARED
     ├─ 提醒报关行上传D05
     ├─ 提醒报关行上传D06
     └─ 自动判断并生成D08

9️⃣ 装船/开船阶段 ⭐ 关键节点
   模块：发货管理中心 (ShipmentManagementCenterV2)
   数据：B/L、开船日期(ETD)、到港日期(ETA)
   触发单证：
   └─ D09 (国际运费发票) - 提醒货代上传
   
   📊 数据流转：
   ShipmentManagementCenterV2
     ├─ 货物装船
     ├─ 状态：loading → shipped
     └─ 触发事件：VESSEL_DEPARTED
          ↓
   DocumentationWorkbenchUltimate
     ├─ 监听事件：VESSEL_DEPARTED
     └─ 提醒货代上传D09

🔟 到港阶段
   模块：发货管理中心 (ShipmentManagementCenterV2)
   数据：到港时间、清关状态
   触发：无

1️⃣1️⃣ 收汇阶段 ⭐ 关键节点
   模块：财务管理 (FinanceManagement)
   数据：银行收汇水单、收款金额、收款日期
   触发单证：
   └─ D11 (收汇水单) - 财务部上传
   
   📊 数据流转：
   FinanceManagement
     ├─ 财务部确认收汇
     ├─ 上传银行收汇水单
     └─ 触发事件：PAYMENT_RECEIVED
          ↓
   DocumentationWorkbenchUltimate
     ├─ 监听事件：PAYMENT_RECEIVED
     └─ 关联D11到订单

1️⃣2️⃣ 结汇阶段 ⭐ 关键节点
   模块：财务管理 (FinanceManagement)
   数据：结汇水单、结汇金额、结汇日期
   触发单证：
   ├─ D12 (结汇水单) - 财务部上传
   └─ D13 (出口退税收汇凭证表) - 系统自动生成
   
   📊 数据流转：
   FinanceManagement
     ├─ 财务部完成结汇
     ├─ 上传结汇水单
     └─ 触发事件：FX_SETTLED
          ↓
   DocumentationWorkbenchUltimate
     ├─ 监听事件：FX_SETTLED
     ├─ 关联D12到订单
     └─ 自动生成D13

1️⃣3️⃣ 退税申报 ⭐ 最终节点
   模块：财务管理 + 单证管理
   数据：所有13项单证的汇总数据
   触发单证：
   └─ D01 (出口退税申报表) - 系统自动生成
   
   📊 数据流转：
   DocumentationWorkbenchUltimate
     ├─ 检查依赖：D05 + D11 + D12 + D13 全部完成
     ├─ 依赖满足后触发事件：DOCS_READY_FOR_TAX_REFUND
     └─ 自动生成D01
          ↓
   FinanceManagement
     ├─ 监听事件：DOCS_READY_FOR_TAX_REFUND
     └─ 提醒财务部提交退税申报

1️⃣4️⃣ 归档阶段
   模块：单证管理 (DocumentationWorkbenchUltimate)
   数据：所有13项单证的PDF/文件
   操作：打包归档到Supabase Storage
```

### 2.2 模块依赖关系图

```
                    ┌─────────────────────┐
                    │   CRM系统（客户）    │
                    └──────────┬──────────┘
                               │ 客户信息
                               ↓
                    ┌─────────────────────┐
                    │   订单管理中心       │ ← 业务员操作
                    │  (合同签订/出货)    │
                    └──────────┬──────────┘
                               │ 合同数据 + 出货通知
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ↓                     ↓                     ↓
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   采购管理       │  │   发货管理中心   │  │   财务管理       │
│  (采购合同)     │  │  (报关/装船)    │  │  (收汇/结汇)    │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                     │
         │ D07               │ D05/D06/D09        │ D11/D12
         │                    │                     │
         └────────────────────┼─────────────────────┘
                              │
                              ↓
                   ┌─────────────────────┐
                   │   单证管理系统       │ ← 单证员操作
                   │  (13项单证全流程)   │
                   └─────────────────────┘
                              │
                              ↓ D01退税
                   ┌─────────────────────┐
                   │   财务管理（退税）   │
                   └─────────────────────┘
```

---

## 三、技术架构设计

### 3.1 架构层次

```
┌─────────────────────────────────────────────────────────────┐
│                    前端展示层 (React)                        │
│  OrderManagement | ShipmentManagement | Documentation       │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    业务逻辑层 (Services)                     │
│  OrderService | ShipmentService | DocumentationService      │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                  事件总线层 (Event Bus)                      │
│  publish() | subscribe() | emit()                           │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                  数据访问层 (Data Layer)                     │
│  Supabase Realtime | REST API | Storage                     │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                  持久化层 (Supabase)                         │
│  PostgreSQL | Storage | Functions | Realtime                │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 事件驱动架构

```typescript
// ============ 事件定义 ============
type BusinessEvent = 
  | 'CONTRACT_SIGNED'            // 合同签订
  | 'PROCUREMENT_PAID'           // 采购付款
  | 'SHIPPING_NOTICE_ISSUED'     // 出货通知发出
  | 'CUSTOMS_CLEARED'            // 报关完成
  | 'VESSEL_DEPARTED'            // 开船
  | 'PAYMENT_RECEIVED'           // 收汇
  | 'FX_SETTLED'                 // 结汇
  | 'DOCS_READY_FOR_TAX_REFUND'; // 单证齐全可退税

interface EventPayload {
  eventType: BusinessEvent;
  orderId: string;
  contractNo?: string;
  timestamp: string;
  data: any;
  operator: string;
}

// ============ 事件总线实现 ============
class BusinessEventBus {
  private listeners: Map<BusinessEvent, Array<(payload: EventPayload) => void>> = new Map();

  // 订阅事件
  subscribe(eventType: BusinessEvent, callback: (payload: EventPayload) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }

  // 发布事件
  publish(payload: EventPayload) {
    console.log(`📢 [EventBus] 发布事件: ${payload.eventType}`, payload);
    
    const callbacks = this.listeners.get(payload.eventType);
    if (callbacks) {
      callbacks.forEach(callback => callback(payload));
    }
    
    // 🔥 同时保存到数据库日志
    this.saveEventLog(payload);
  }

  // 保存事件日志
  private async saveEventLog(payload: EventPayload) {
    // 保存到 business_event_logs 表
    await supabase.from('business_event_logs').insert({
      event_type: payload.eventType,
      order_id: payload.orderId,
      contract_no: payload.contractNo,
      timestamp: payload.timestamp,
      data: payload.data,
      operator: payload.operator
    });
  }
}

// 全局单例
export const eventBus = new BusinessEventBus();
```

### 3.3 业务服务层

```typescript
// ============ 订单服务 ============
class OrderService {
  // 签订合同
  async signContract(contractData: Contract) {
    // 1. 保存合同到数据库
    const { data: contract } = await supabase
      .from('contracts')
      .insert({
        contract_no: contractData.contractNo,
        order_id: contractData.orderId,
        customer_id: contractData.customerId,
        total_value: contractData.totalValue,
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

    // 3. 🔥 发布事件：合同已签订
    eventBus.publish({
      eventType: 'CONTRACT_SIGNED',
      orderId: contractData.orderId,
      contractNo: contractData.contractNo,
      timestamp: new Date().toISOString(),
      data: contract,
      operator: contractData.salesRep
    });

    return contract;
  }

  // 发起出货通知
  async issueShippingNotice(orderId: string, data: ShippingNoticeData) {
    // 1. 创建出货通知单
    const { data: notice } = await supabase
      .from('shipping_notices')
      .insert({
        order_id: orderId,
        shipment_date: data.shipmentDate,
        packing_list: data.packingList,
        status: 'issued'
      })
      .select()
      .single();

    // 2. 更新订单状态
    await supabase
      .from('orders')
      .update({ 
        status: 'shipping_prepared',
        shipment_date: data.shipmentDate
      })
      .eq('order_id', orderId);

    // 3. 🔥 发布事件：出货通知已发出
    eventBus.publish({
      eventType: 'SHIPPING_NOTICE_ISSUED',
      orderId: orderId,
      timestamp: new Date().toISOString(),
      data: notice,
      operator: data.operator
    });

    return notice;
  }
}

// ============ 发货服务 ============
class ShipmentService {
  // 报关完成
  async completeCustomsClearance(orderId: string, data: CustomsData) {
    // 1. 更新发货记录
    await supabase
      .from('shipments')
      .update({
        customs_status: 'cleared',
        customs_date: new Date().toISOString(),
        customs_declaration_no: data.declarationNo
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

    // 3. 🔥 发布事件：报关已完成
    eventBus.publish({
      eventType: 'CUSTOMS_CLEARED',
      orderId: orderId,
      timestamp: new Date().toISOString(),
      data: data,
      operator: data.customsBroker
    });
  }

  // 装船/开船
  async departVessel(orderId: string, data: VesselData) {
    // 1. 更新发货记录
    await supabase
      .from('shipments')
      .update({
        shipping_status: 'shipped',
        etd: data.etd,
        eta: data.eta,
        vessel_name: data.vesselName,
        bl_no: data.blNo
      })
      .eq('order_id', orderId);

    // 2. 🔥 发布事件：开船
    eventBus.publish({
      eventType: 'VESSEL_DEPARTED',
      orderId: orderId,
      timestamp: new Date().toISOString(),
      data: data,
      operator: data.forwarder
    });
  }
}

// ============ 财务服务 ============
class FinanceService {
  // 确认收汇
  async confirmPaymentReceived(orderId: string, data: PaymentData) {
    // 1. 创建收汇记录
    const { data: payment } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        amount: data.amount,
        currency: data.currency,
        received_date: data.receivedDate,
        bank_reference: data.bankReference,
        status: 'received'
      })
      .select()
      .single();

    // 2. 更新订单状态
    await supabase
      .from('orders')
      .update({ 
        status: 'payment_received',
        collection_date: data.receivedDate
      })
      .eq('order_id', orderId);

    // 3. 🔥 发布事件：收汇确认
    eventBus.publish({
      eventType: 'PAYMENT_RECEIVED',
      orderId: orderId,
      timestamp: new Date().toISOString(),
      data: payment,
      operator: data.operator
    });

    return payment;
  }

  // 结汇完成
  async completeFXSettlement(orderId: string, data: FXSettlementData) {
    // 1. 创建结汇记录
    const { data: settlement } = await supabase
      .from('fx_settlements')
      .insert({
        order_id: orderId,
        amount: data.amount,
        exchange_rate: data.exchangeRate,
        settled_date: data.settledDate,
        bank_reference: data.bankReference
      })
      .select()
      .single();

    // 2. 更新订单状态
    await supabase
      .from('orders')
      .update({ 
        status: 'fx_settled',
        settlement_date: data.settledDate
      })
      .eq('order_id', orderId);

    // 3. 🔥 发布事件：结汇完成
    eventBus.publish({
      eventType: 'FX_SETTLED',
      orderId: orderId,
      timestamp: new Date().toISOString(),
      data: settlement,
      operator: data.operator
    });

    return settlement;
  }
}

// ============ 单证服务 ============
class DocumentationService {
  constructor() {
    // 🔥 订阅所有业务事件
    this.subscribeToEvents();
  }

  private subscribeToEvents() {
    // 监听：合同签订
    eventBus.subscribe('CONTRACT_SIGNED', async (payload) => {
      console.log('📋 [单证系统] 检测到合同签订事件，开始处理...');
      
      // 1. 创建单证任务
      await this.createDocumentationTask(payload.orderId, payload.contractNo);
      
      // 2. 自动生成D02
      await this.generateD02(payload.data);
      
      // 3. 根据Incoterm自动判断并生成D04/D10
      await this.autoGenerateWaivers(payload.data);
    });

    // 监听：采购付款
    eventBus.subscribe('PROCUREMENT_PAID', async (payload) => {
      console.log('📋 [单证系统] 检测到采购付款事件，生成D07...');
      await this.generateD07(payload.data);
    });

    // 监听：出货通知
    eventBus.subscribe('SHIPPING_NOTICE_ISSUED', async (payload) => {
      console.log('📋 [单证系统] 检测到出货通知，提醒物流部上传D03...');
      await this.remindUploadD03(payload.orderId);
    });

    // 监听：报关完成
    eventBus.subscribe('CUSTOMS_CLEARED', async (payload) => {
      console.log('📋 [单证系统] 检测到报关完成，提醒报关行上传D05/D06...');
      await this.remindUploadD05(payload.orderId);
      await this.remindUploadD06(payload.orderId);
      await this.autoGenerateD08(payload.data);
    });

    // 监听：开船
    eventBus.subscribe('VESSEL_DEPARTED', async (payload) => {
      console.log('📋 [单证系统] 检测到开船，提醒货代上传D09...');
      await this.remindUploadD09(payload.orderId);
    });

    // 监听：收汇
    eventBus.subscribe('PAYMENT_RECEIVED', async (payload) => {
      console.log('📋 [单证系统] 检测到收汇，关联D11...');
      await this.linkD11(payload.orderId, payload.data);
    });

    // 监听：结汇
    eventBus.subscribe('FX_SETTLED', async (payload) => {
      console.log('📋 [单证系统] 检测到结汇，关联D12并生成D13...');
      await this.linkD12(payload.orderId, payload.data);
      await this.generateD13(payload.orderId, payload.data);
      
      // 检查是否可以生成D01
      await this.checkAndGenerateD01(payload.orderId);
    });
  }

  // 创建单证任务
  async createDocumentationTask(orderId: string, contractNo: string) {
    // 创建13项单证的初始记录
    const docIds = ['D01', 'D02', 'D03', 'D04', 'D05', 'D06', 'D07', 'D08', 'D09', 'D10', 'D11', 'D12', 'D13'];
    
    for (const docId of docIds) {
      await supabase.from('document_instances').insert({
        instance_id: `${orderId}-${docId}`,
        order_id: orderId,
        doc_id: docId,
        status: 'pending',
        generation_type: this.getGenerationType(docId)
      });
    }
    
    console.log(`✅ 已为订单 ${orderId} 创建13项单证任务`);
  }

  // 自动生成D02
  async generateD02(contractData: any) {
    // 使用模板生成D02 PDF
    const pdfFile = await this.generateDocumentFromTemplate('D02', contractData);
    
    // 上传到Storage
    const uploadedFile = await this.uploadDocument(contractData.order_id, 'D02', pdfFile);
    
    // 更新单证状态
    await this.updateDocumentStatus(contractData.order_id, 'D02', 'auto_generated');
    
    console.log(`✅ D02已自动生成: ${uploadedFile.file_name}`);
  }

  // 检查并生成D01
  async checkAndGenerateD01(orderId: string) {
    // 检查依赖：D05 + D11 + D12 + D13
    const deps = await this.checkDependencies(orderId, ['D05', 'D11', 'D12', 'D13']);
    
    if (deps.allCompleted) {
      console.log('✅ D01依赖已齐全，自动生成退税申报表...');
      
      // 生成D01
      const taxRefundData = await this.collectTaxRefundData(orderId);
      await this.generateD01(orderId, taxRefundData);
      
      // 🔥 发布事件：单证齐全可退税
      eventBus.publish({
        eventType: 'DOCS_READY_FOR_TAX_REFUND',
        orderId: orderId,
        timestamp: new Date().toISOString(),
        data: { message: 'All 13 documents completed' },
        operator: 'system'
      });
    } else {
      console.log(`⏳ D01依赖未齐全，缺少: ${deps.missing.join(', ')}`);
    }
  }
}

// 导出服务实例
export const orderService = new OrderService();
export const shipmentService = new ShipmentService();
export const financeService = new FinanceService();
export const documentationService = new DocumentationService();
```

---

## 四、数据流转设计

### 4.1 统一数据模型

```sql
-- ============ 核心业务表 ============

-- 订单主表（统一数据源）
CREATE TABLE orders (
  order_id VARCHAR(50) PRIMARY KEY,
  contract_no VARCHAR(50),
  customer_id VARCHAR(50) NOT NULL,
  sales_rep_id VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL, -- inquiry/quotation/contract_signed/shipping_prepared/customs_cleared/shipped/payment_received/fx_settled/completed
  
  -- 贸易信息
  incoterm VARCHAR(10) NOT NULL,
  payment_term TEXT,
  total_value DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  
  -- 关键日期
  contract_date TIMESTAMP,
  shipment_date TIMESTAMP,
  customs_date TIMESTAMP,
  etd TIMESTAMP,
  eta TIMESTAMP,
  collection_date TIMESTAMP,
  settlement_date TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
  FOREIGN KEY (sales_rep_id) REFERENCES users(user_id)
);

-- 业务事件日志表
CREATE TABLE business_event_logs (
  event_id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  order_id VARCHAR(50) NOT NULL,
  contract_no VARCHAR(50),
  timestamp TIMESTAMP DEFAULT NOW(),
  data JSONB,
  operator VARCHAR(50) NOT NULL,
  
  FOREIGN KEY (order_id) REFERENCES orders(order_id),
  INDEX idx_event_order (order_id),
  INDEX idx_event_type (event_type),
  INDEX idx_event_timestamp (timestamp)
);

-- 单证实例表（已存在，关联到orders）
CREATE TABLE document_instances (
  instance_id VARCHAR(50) PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  doc_id VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL,
  generation_type VARCHAR(20),
  
  -- 自动关联到订单
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  INDEX idx_order_doc (order_id, doc_id)
);
```

### 4.2 数据同步机制

```typescript
// ============ Supabase Realtime 订阅 ============

// 订单状态实时监听
const orderSubscription = supabase
  .channel('orders-changes')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders'
    },
    (payload) => {
      console.log('📊 订单状态变更:', payload);
      
      // 通知所有相关模块
      if (payload.new.status === 'contract_signed') {
        // 通知单证系统
        eventBus.publish({
          eventType: 'CONTRACT_SIGNED',
          orderId: payload.new.order_id,
          contractNo: payload.new.contract_no,
          timestamp: new Date().toISOString(),
          data: payload.new,
          operator: payload.new.sales_rep_id
        });
      }
    }
  )
  .subscribe();

// 单证状态实时监听
const documentSubscription = supabase
  .channel('documents-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'document_instances'
    },
    (payload) => {
      console.log('📋 单证状态变更:', payload);
      
      // 实时更新UI
      window.dispatchEvent(new CustomEvent('document-updated', {
        detail: payload.new
      }));
    }
  )
  .subscribe();
```

---

## 五、API接口设计

### 5.1 RESTful API规范

```typescript
// ============ 订单API ============
POST   /api/orders                      // 创建订单
GET    /api/orders/:orderId             // 获取订单详情
PATCH  /api/orders/:orderId             // 更新订单
POST   /api/orders/:orderId/sign        // 签订合同（触发单证）
POST   /api/orders/:orderId/ship        // 发起出货通知（触发单证）

// ============ 发货API ============
POST   /api/shipments                   // 创建发货记录
PATCH  /api/shipments/:shipmentId       // 更新发货状态
POST   /api/shipments/:shipmentId/customs-clear  // 报关完成（触发单证）
POST   /api/shipments/:shipmentId/depart         // 装船开船（触发单证）

// ============ 财务API ============
POST   /api/payments                    // 记录收汇（触发单证）
POST   /api/fx-settlements              // 记录结汇（触发单证）

// ============ 单证API ============
GET    /api/documents?orderId=xxx       // 获取订单的所有单证
GET    /api/documents/:instanceId       // 获���单证详情
POST   /api/documents/:instanceId/upload   // 上传单证文件
POST   /api/documents/:instanceId/approve  // 审批单证
GET    /api/documents/:instanceId/download // 下载单证文件
POST   /api/documents/generate/:docId   // 手动触发生成单证
```

### 5.2 Hono服务器路由示例

```typescript
// /supabase/functions/server/index.tsx

import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { orderService, documentationService } from './services';

const app = new Hono();
app.use('*', cors());

// ============ 订单路由 ============
app.post('/make-server-880fd43b/orders/:orderId/sign', async (c) => {
  const { orderId } = c.req.param();
  const contractData = await c.req.json();
  
  try {
    const contract = await orderService.signContract({
      orderId,
      ...contractData
    });
    
    return c.json({ success: true, data: contract });
  } catch (error) {
    console.error('签订合同失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/make-server-880fd43b/orders/:orderId/ship', async (c) => {
  const { orderId } = c.req.param();
  const noticeData = await c.req.json();
  
  try {
    const notice = await orderService.issueShippingNotice(orderId, noticeData);
    return c.json({ success: true, data: notice });
  } catch (error) {
    console.error('发起出货通知失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============ 单证路由 ============
app.get('/make-server-880fd43b/documents', async (c) => {
  const orderId = c.req.query('orderId');
  
  const { data, error } = await supabase
    .from('document_instances')
    .select('*')
    .eq('order_id', orderId);
  
  if (error) return c.json({ success: false, error: error.message }, 500);
  return c.json({ success: true, data });
});

app.post('/make-server-880fd43b/documents/:instanceId/upload', async (c) => {
  const { instanceId } = c.req.param();
  const formData = await c.req.formData();
  const file = formData.get('file');
  
  try {
    const uploadedFile = await documentationService.uploadDocument(
      instanceId,
      file
    );
    
    return c.json({ success: true, data: uploadedFile });
  } catch (error) {
    console.error('上传单证失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

Deno.serve(app.fetch);
```

---

## 六、实施方案

### 6.1 分阶段实施

**Phase 1: 基础架构（Week 1-2）**
- ✅ 创建统一数据表（orders扩展、business_event_logs）
- ✅ 实现事件总线（EventBus）
- ✅ 搭建服务层（OrderService、ShipmentService等）

**Phase 2: 核心对接（Week 3-4）**
- ✅ 订单管理 → 单证系统对接
- ✅ 发货管理 → 单证系统对接
- ✅ 财务管理 → 单证系统对接

**Phase 3: 自动化流程（Week 5-6）**
- ✅ 自动生成单证（D02/D04/D07/D10/D13/D01）
- ✅ 智能提醒系统（D03/D05/D06/D09/D11/D12）
- ✅ 依赖检查与触发

**Phase 4: 测试优化（Week 7-8）**
- ✅ 完整流程测试
- ✅ 性能优化
- ✅ 用户培训

### 6.2 迁移方案

```typescript
// 数据迁移：将现有Mock数据迁移到统一数据源

async function migrateToUnifiedDataSource() {
  // 1. 从OrderManagementCenterPro迁移订单数据
  const ordersFromOrderModule = await fetchOrdersFromOrderModule();
  for (const order of ordersFromOrderModule) {
    await supabase.from('orders').upsert({
      order_id: order.id,
      contract_no: order.contractNo,
      customer_id: order.customerId,
      sales_rep_id: order.salesRep,
      status: order.status,
      incoterm: order.incoterm,
      total_value: order.totalValue,
      currency: order.currency,
      contract_date: order.contractDate,
      shipment_date: order.shipmentDate
    });
  }
  
  // 2. 从ShipmentManagementCenterV2迁移发货数据
  const shipmentsFromShipmentModule = await fetchShipmentsFromShipmentModule();
  for (const shipment of shipmentsFromShipmentModule) {
    await supabase.from('shipments').upsert({
      shipment_id: shipment.id,
      order_id: shipment.orderId,
      customs_status: shipment.customsStatus,
      shipping_status: shipment.shippingStatus,
      etd: shipment.etd,
      eta: shipment.eta
    });
  }
  
  // 3. 建立关联关系
  console.log('✅ 数据迁移完成');
}
```

### 6.3 向后兼容

在实施过程中，保留原有Mock数据模式，逐步过渡：

```typescript
// 双模式运行：Mock + Real Data
const USE_REAL_DATA = process.env.ENABLE_REAL_DATA === 'true';

function getOrders() {
  if (USE_REAL_DATA) {
    return fetchOrdersFromSupabase();
  } else {
    return getMockOrders();
  }
}
```

---

## 七、关键技术点

### 7.1 Supabase Realtime实时同步

```typescript
// 多模块实时数据同步
const channel = supabase.channel('business-sync')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'orders'
  }, (payload) => {
    // 订单变更 → 通知所有订阅模块
    broadcastToModules('order-updated', payload.new);
  })
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'document_instances'
  }, (payload) => {
    // 单证变更 → 通知所有订阅模块
    broadcastToModules('document-updated', payload.new);
  })
  .subscribe();
```

### 7.2 事务一致性

```typescript
// 使用Supabase RPC确保事务一致性
async function signContractWithDocuments(contractData) {
  const { data, error } = await supabase.rpc('sign_contract_tx', {
    p_contract_data: contractData
  });
  
  if (error) throw error;
  return data;
}

// PostgreSQL存储过程
CREATE OR REPLACE FUNCTION sign_contract_tx(p_contract_data JSONB)
RETURNS JSONB AS $$
DECLARE
  v_order_id VARCHAR;
  v_contract_no VARCHAR;
BEGIN
  -- 1. 插入合同
  INSERT INTO contracts (contract_no, order_id, ...)
  VALUES (...)
  RETURNING contract_no INTO v_contract_no;
  
  -- 2. 更新订单状态
  UPDATE orders SET status = 'contract_signed' WHERE order_id = v_order_id;
  
  -- 3. 创建单证任务
  INSERT INTO document_instances (instance_id, order_id, doc_id, status)
  SELECT 
    v_order_id || '-' || doc_id,
    v_order_id,
    doc_id,
    'pending'
  FROM unnest(ARRAY['D01','D02','D03',...]) AS doc_id;
  
  -- 4. 记录事件日志
  INSERT INTO business_event_logs (event_type, order_id, data, operator)
  VALUES ('CONTRACT_SIGNED', v_order_id, p_contract_data, ...);
  
  RETURN jsonb_build_object('success', true, 'contract_no', v_contract_no);
END;
$$ LANGUAGE plpgsql;
```

---

## 八、总结

### 8.1 核心价值

1. **🔗 打破数据孤岛** - 所有业务模块共享统一数据源
2. **⚡ 自动化流程** - 业务节点自动触发单证生成
3. **📊 实时同步** - 数据变更实时通知所有模块
4. **🎯 完整闭环** - 从询价到退税的完整业务链条
5. **🛡️ 数据一致性** - 事务级保证，避免数据不一致

### 8.2 技术亮点

- **事件驱动架构** - 解耦业务模块，易于扩展
- **Supabase Realtime** - 实时数据同步
- **服务层抽象** - 统一业务逻辑
- **PostgreSQL事务** - 保证数据一致性
- **向后兼容** - 平滑迁移，双模式运行

---

**文档版本：** v1.0  
**最后更新：** 2025-12-11  
**作者：** THE COSUN BM 系统架构团队
