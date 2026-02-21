# 🔐 模块-角色权限映射表
## THE COSUN BM - B2B外贸独立站三Portal系统

---

## 📊 角色定义

| 角色代码 | 中文名称 | 英文名称 | 职责范围 |
|---------|---------|---------|---------|
| **CEO** | 老板/总经理 | Chief Executive Officer | 公司最高决策者，全权限 |
| **CFO** | 财务总监 | Chief Financial Officer | 财务负责人，财务全权限 |
| **Sales_Manager** | 销售主管 | Sales Manager | 销售团队管理（含销售总监和区域主管） |
| **Sales_Rep** | 业务员 | Sales Representative | 一线销售人员 |
| **Finance** | 财务专员 | Finance Specialist | 财务执行人员 |
| **Procurement** | 采购专员 | Procurement Specialist | 采购负责人 |
| **Marketing_Ops** | 运营专员 | Marketing Operations | 社媒营销与线索获取 |
| **Admin** | 系统管理员 | System Administrator | IT技术人员，系统维护 |
| **Supplier** | 供应商 | Supplier | 外部供应商 |

---

## 🎯 核心模块权限映射

### 1️⃣ **工作台** (Dashboard)
- **模块ID**: `overview`
- **权限要求**: `access:dashboard`
- **可见角色**: ✅ 所有角色
- **说明**: 所有用户都需要访问工作台

---

### 2️⃣ **客户关系管理（CRM）**
- **模块ID**: `crm`
- **权限要求**: `access:customer_management`
- **可见角色**: 
  - ✅ CEO
  - ✅ Sales_Manager（销售总监 + 区域主管）
  - ✅ Sales_Rep（业务员）
  - ✅ Finance（财务需要查看客户信息）
- **说明**: 销售团队核心模块，包含潜客转化、客户分类、销售漏斗、社媒分析等8大功能

---

### 3️⃣ **订单管理中心**
- **模块ID**: `order-management-center`
- **权限要求**: `access:order_management`
- **可见角色**:
  - ✅ CEO
  - ✅ CFO
  - ✅ Sales_Manager
  - ✅ Sales_Rep
  - ✅ Finance
  - ✅ Procurement
- **说明**: 订单全生命周期管理

---

### 4️⃣ **发货管理**
- **模块ID**: `shipping-document-management`
- **权限要求**: `access:shipping`
- **可见角色**:
  - ✅ CEO
  - ✅ CFO
  - ✅ Sales_Manager
  - ✅ Sales_Rep
  - ✅ Finance
  - ✅ Procurement
- **说明**: 发货单据管理

---

### 5️⃣ **CEO战略驾驶舱**
- **模块ID**: `analytics`
- **权限要求**: `access:analytics`
- **可见角色**:
  - ✅ CEO
  - ✅ CFO
  - ✅ Sales_Manager（仅销售总监 region='all'）
- **说明**: 高层战略决策仪表盘，区域主管不可见

---

### 6️⃣ **全局BI仪表盘**
- **模块ID**: `global-bi-dashboard`
- **权限要求**: `access:analytics`
- **可见角色**:
  - ✅ CEO
  - ✅ CFO
  - ✅ Sales_Manager（仅销售总监 region='all'）
- **说明**: 全局商业智能分析

---

### 7️⃣ **智能流程引擎**
- **模块ID**: `smart-workflow-engine`
- **权限要求**: `access:inquiry_management`
- **可见角色**:
  - ✅ CEO
  - ✅ Sales_Manager
  - ✅ Sales_Rep
- **说明**: 业务流程自动化引擎

---

### 8️⃣ **业务流程编辑器 Pro**
- **模块ID**: `workflow-editor`
- **权限要求**: `access:data_management`
- **可见角色**:
  - ✅ CEO
  - ✅ Admin（系统管理员）
- **说明**: 🔒 技术模块，仅系统管理员可配置

---

### 9️⃣ **工作流验证中心**
- **模块ID**: `workflow-validation`
- **权限要求**: `access:data_management`
- **可见角色**:
  - ✅ CEO
  - ✅ Admin
- **说明**: 🔒 技术模块，工作流测试验证

---

### 🔟 **表单管理中心**
- **模块ID**: `form-manager`
- **权限要求**: `access:data_management`
- **可见角色**:
  - ✅ CEO
  - ✅ Admin
- **说明**: 🔒 技术模块，表单模板DIY

---

### 1️⃣1️⃣ **状态流转模拟器**
- **模块ID**: `status-flow-simulator`
- **权限要求**: `access:data_management`
- **可见角色**:
  - ✅ CEO
  - ✅ Admin
- **说明**: 🔒 技术模块，订单状态流转测试

---

### 1️⃣2️⃣ **产品管理**
- **模块ID**: `product-management`
- **权限要求**: `access:dashboard`
- **可见角色**: ✅ 所有角色
- **说明**: 产品信息管理

---

### 1️⃣3️⃣ **产品推送**
- **模块ID**: `product-push`
- **权限要求**: `access:dashboard`
- **可见角色**: ✅ 所有角色
- **说明**: 产品推送给客户

---

### 1️⃣4️⃣ **消息中心**
- **模块ID**: `messaging`
- **权限要求**: `access:dashboard`
- **可见角色**: ✅ 所有角色
- **说明**: 站内消息通知

---

### 1️⃣5️⃣ **社交媒体营销**
- **模块ID**: `social-media-marketing`
- **权限要求**: `access:dashboard`
- **可见角色**: ✅ 所有角色
- **说明**: LinkedIn/Facebook/Instagram/YouTube/直播系统

---

### 1️⃣6️⃣ **业务流程中心**
- **模块ID**: `order-flow-center`
- **权限要求**: `access:inquiry_management`
- **可见角色**:
  - ✅ CEO
  - ✅ Sales_Manager
  - ✅ Sales_Rep
- **说明**: 询价-报价-合同-订单流程

---

### 1️⃣7️⃣ **财务管理**
- **模块ID**: `finance-management`
- **权限要求**: `access:receivables` OR `access:payables`
- **可见角色**:
  - ✅ CEO
  - ✅ CFO
  - ✅ Finance
- **说明**: 应收应付、收款付款管理

---

### 1️⃣8️⃣ **角色权限管理**
- **模块ID**: `role-permission`
- **权限要求**: `access:user_management`
- **可见角色**:
  - ✅ CEO
  - ✅ Admin
- **说明**: RBAC权限配置中心

---

### 1️⃣9️⃣ **企业级备份中心**
- **模块ID**: `enterprise-backup-center`
- **权限要求**: `access:settings`
- **可见角色**:
  - ✅ CEO
  - ✅ Admin
- **说明**: 5层企业级数据备份系统

---

### 2️⃣0️⃣ **Supabase诊断面板**
- **模块ID**: `supabase-diagnostic`
- **权限要求**: `access:settings`
- **可见角色**:
  - ✅ CEO
  - ✅ Admin
- **说明**: 🔧 技术诊断工具

---

## 🏭 供应链管理模块

### 2️⃣1️⃣ **供应商管理**
- **模块ID**: `supplier-management`
- **权限要求**: `access:supplier_management`
- **可见角色**:
  - ✅ CEO
  - ✅ CFO
  - ✅ Procurement（采购专员）
  - ✅ Finance
- **说明**: ❌ 销售团队不可见（前后台分离）

---

### 2️⃣2️⃣ **服务商管理**
- **模块ID**: `service-provider-management`
- **权限要求**: `access:service_provider`
- **可见角色**:
  - ✅ CEO
  - ✅ CFO
  - ✅ Procurement
  - ✅ Finance
- **说明**: 货代、验货公司等服务商

---

## 📈 增强业务模块

### 2️⃣3️⃣ **报价管理增强版**
- **模块ID**: `quote-management-enhanced`
- **权限要求**: `access:quote_management`
- **可见角色**:
  - ✅ CEO
  - ✅ Sales_Manager
  - ✅ Sales_Rep
- **说明**: 智能报价系统

---

### 2️⃣4️⃣ **合同管理Pro版**
- **模块ID**: `contract-management-pro`
- **权限要求**: `access:contract_management`
- **可见角色**:
  - ✅ CEO
  - ✅ CFO
  - ✅ Sales_Manager
  - ✅ Sales_Rep
  - ✅ Finance
- **说明**: 合同全生命周期管理

---

### 2️⃣5️⃣ **物流追踪可视化**
- **模块ID**: `logistics-tracking-visual`
- **权限要求**: `access:shipping`
- **可见角色**:
  - ✅ CEO
  - ✅ CFO
  - ✅ Sales_Manager
  - ✅ Procurement
- **说明**: 实时物流追踪地图

---

### 2️⃣6️⃣ **多语言/多货币**
- **模块ID**: `multi-language-currency`
- **权限要求**: `access:settings`
- **可见角色**:
  - ✅ CEO
  - ✅ Admin
- **说明**: 全球化配置中心

---

### 2️⃣7️⃣ **客户信用评估**
- **模块ID**: `customer-credit-evaluation`
- **权限要求**: `access:receivables`
- **可见角色**:
  - ✅ CEO
  - ✅ CFO
  - ✅ Finance
- **说明**: 客户信用风险管理

---

### 2️⃣8️⃣ **销售预测与目标**
- **模块ID**: `sales-forecasting-targets`
- **权限要求**: `access:analytics`
- **可见角色**:
  - ✅ CEO
  - ✅ Sales_Manager（仅销售总监）
- **说明**: AI驱动的销售预测

---

### 2️⃣9️⃣ **销售预测与目标 Pro Max**
- **模块ID**: `sales-forecasting-targets-pro-max`
- **权限要求**: `access:analytics`
- **可见角色**:
  - ✅ CEO
  - ✅ Sales_Manager（仅销售总监）
- **说明**: 高级销售预测系统

---

## 🎭 角色模块可见性矩阵

| 模块 | CEO | CFO | 销售总监 | 区域主管 | 业务员 | 财务 | 采购 | Admin |
|-----|-----|-----|---------|---------|-------|-----|-----|-------|
| 工作台 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| CRM | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| 订单管理 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| 发货管理 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| CEO战略驾驶舱 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 全局BI | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 智能流程 | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| 流程编辑器 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| 流程验证 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| 表单管理 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| 状态模拟器 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| 产品管理 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| 产品推送 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| 消息中心 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 社媒营销 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| 业务流程 | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| 财务管理 | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| 权限管理 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| 备份中心 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| 诊断面板 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| 供应商管理 | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| 服务商管理 | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| 报价管理 | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| 合同管理 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| 物流追踪 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| 多语言货币 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| 信用评估 | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| 销售预测 | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 销售预测Pro | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 📝 权限设计原则

### 1. **前后台严格分离**
- ❌ 销售团队（Sales_Manager, Sales_Rep）**不能**访问供应商管理
- ✅ 采购团队（Procurement）**不能**直接接触客户

### 2. **财务数据分级**
- **CEO/CFO**: 完整财务数据（成本、利润、定价）
- **销售总监**: 毛利润（不含成本明细）
- **区域主管**: 毛利润（本区域）
- **业务员**: 无财务数据

### 3. **技术模块隔离**
- **Admin**: 只能访问技术模块（流程编辑、表单、备份、诊断）
- **Admin**: ❌ 不能访问业务模块（订单、客户、财务）

### 4. **数据范围控制**
- **CEO**: 全局数据
- **销售总监**: 全球销售数据
- **区域主管**: 本区域数据
- **业务员**: 本人数据

---

## 🔄 更新日志

- **2024-12-01**: 创建模块-角色权限映射表
- **2024-12-01**: 优化CEO战略驾驶舱命名
- **2024-12-01**: 移除独立的"潜客转化工作台"和"客户健康度监控"，整合到CRM模块

---

**文档维护**: 每次新增模块或修改权限时，必须更新此文档 ✅
