# 前端代码完整审计报告

> 审计日期：2026-03-03
> 项目：COSUN ERP + AI SaaS
> 审计范围：`src/` 全部前端代码

---

## 一、localStorage 中必须迁移到 Supabase 的数据

### 1.1 核心业务数据（P0 必须迁移）

| # | localStorage Key | 当前存储内容 | 所在文件 | 目标 Supabase 表 |
|---|-----------------|-------------|---------|----------------|
| 1 | `salesContracts` | 销售合同数据 | SalesContractContext.tsx, SalesContractManagement.tsx, UploadPaymentProofDialog.tsx | `sales_contracts` |
| 2 | `orders_{email}` | 客户订单 | OrderContext.tsx, SalesContractContext.tsx, clearFinanceData.ts, ConfirmReceiptDialog.tsx | `orders` |
| 3 | `salesOrders` | 销售订单 | SalesOrderContext.tsx(仅 localStorage), ClearSalesOrderHelper.tsx | `orders` |
| 4 | `accountsReceivable_{email}` | 应收账款 | FinanceContext.tsx, InspectionServiceFeeManagement.tsx, UploadPaymentProofDialog.tsx, clearFinanceData.ts | `accounts_receivable`（需新建） |
| 5 | `{email}_paymentRecords` | 付款记录 | PaymentContext.tsx(仅 localStorage), clearPaymentData.ts | 需新建 `payment_records` 表 |
| 6 | `quotations_{email}` | 报价单 | QuotationContext.tsx, QuotationManagement.tsx, SalesContractManagement.tsx, clearFinanceData.ts | `sales_quotations` |
| 7 | `supplierQuotations` | 供应商报价 | SupplierOrderManagementCenter.tsx, PurchaserFeedbackForm.tsx, createSupplierQuotationFromRFQ.ts, migrateQuotations.ts | `supplier_quotations`（需新建） |
| 8 | `rfqs` / `supplierRFQs` | 采购询价 | RFQContext.tsx(仅 localStorage), SupplierRFQDebugger.tsx, clearFinanceData.ts | `supplier_rfqs` |
| 9 | `cosun_approval_requests` | 审批请求 | ApprovalContext.tsx(仅 localStorage) | `approval_records`（已存在但未使用） |
| 10 | `inquiry_draft` / `cosun_inquiry_draft` | 询价草稿 | CreateInquiryPage.tsx, InquiryPreviewDialogNew.tsx | `inquiries`（status=draft） |
| 11 | `notifications_{email}` | 通知 | NotificationContext.tsx, clearFinanceData.ts | `notifications` |
| 12 | `purchaseRequirements` | 采购需求 | PurchaseRequirementContext.tsx, ProcurementDataDebugger.tsx | 需新建 `purchase_requirements` 表 |
| 13 | `quotationRequests` | 报价请求 | QuotationRequestContext.tsx(仅 localStorage) | `quotation_requests` |

### 1.2 主数据（P1 迁移）

| # | localStorage Key | 当前存储内容 | 所在文件 | 目标 Supabase 表 |
|---|-----------------|-------------|---------|----------------|
| 14 | `cosun_customer_profile` | 客户公司资料 | CustomerProfile.tsx | `companies` + `contacts` |
| 15 | `cosun_admin_org_profile_v3` | 管理端公司资料（银行、地址） | AdminOrganizationContext.tsx | `companies` + `company_bank_accounts` |
| 16 | `cosun_admin_user_profile` | 管理端用户资料 | AdminOrganizationContext.tsx | `user_profiles` |
| 17 | `cosun_org_profile` | 供应商公司资料 | OrganizationContext.tsx | `companies` |
| 18 | `cosun_supplier_user_profile` | 供应商用户资料 | OrganizationContext.tsx | `user_profiles` |
| 19 | `gsd_supplier_store` | 供应商列表 | supplier-store.ts | `companies`（party_type=supplier） |
| 20 | `suppliers` | 供应商列表（旧） | supplierScoring.ts | `companies`（party_type=supplier） |
| 21 | `supplier_product_library` | 供应商产品目录 | ProductLibrary.tsx | 需新建或使用现有结构 |
| 22 | `supplier_drawing_management` | 图纸管理 | DrawingManagement.tsx | `documents` |
| 23 | `gsd_customer_salesrep_mapping` | 客户-业务员对应关系 | customer-salesrep-mapping.ts | `company_portal_users` 或新建映射表 |
| 24 | `gsd_notification_rules` | 通知规则配置 | notification-rules.ts | 需新建 `notification_rules` 表 |

### 1.3 编号与同步元数据（P1 迁移）

| # | localStorage Key | 当前存储内容 | 所在文件 | 目标 |
|---|-----------------|-------------|---------|------|
| 25 | `cosun_inquiry_counter_{region}_{date}` | 询价编号计数器 | UserContext.tsx | `next_number_ex()` RPC |
| 26 | `document_counter_data` | 多种单据编号计数器 | rfqNumberGenerator.ts | `next_number_ex()` RPC |
| 27 | `cosun_erp_id_mappings_v1` | 内外部 ID 映射 | id-mapping.ts | `number_mappings` |
| 28 | `cosun_erp_tombstones_v1` | 软删除标记 | deletion-tombstone.ts, SalesContractContext.tsx | DB `deleted_at` 字段 |

### 1.4 业务配置（P2 迁移）

| # | localStorage Key | 当前存储内容 | 所在文件 | 目标 |
|---|-----------------|-------------|---------|------|
| 29 | `sales_targets_data_pro` | 销售目标数据 | SalesForecastingTargetsProMaxEditable.tsx | 需新建表 |
| 30 | `sales_management_data` | 销售管理数据 | SalesForecastingTargetsProMaxEditable.tsx | 需新建表 |
| 31 | `approval_center_pending_bridge_v1` | 审批中心桥接数据 | ApprovalCenter.tsx, PurchaseOrderManagementEnhanced.tsx, SalesQuotationManagement.tsx | `approval_records` |
| 32 | `customer_quotations_bridge` | 客户报价桥接 | QuotationReceived.tsx | 应直接查询 Supabase |
| 33 | `customer_decline_bridge` | 客户拒绝/协商桥接 | QuotationDetailView.tsx | `sales_quotations` 状态字段 |
| 34 | `publicCustomerPool` | 公海客户池 | SocialMediaLeadsFlow.tsx | 需新建表 |
| 35 | `formVersions` / `formUsageStats` / `formFieldAnalysis` | 表单版本/统计 | FormLibraryManagementPro.tsx | 需新建表 |
| 36 | `business_workflow_config` | 业务流程配置 | WorkflowEditorProV2.tsx | 需新建表 |
| 37 | `supplier_product_categories` | 供应商产品分类 | industryTemplates.ts | 可用 companies 的 metadata |
| 38 | `targetPrice_{quoteId}` | 目标价格 | SmartProfitAnalyzerPanel.tsx | `sales_quotations` 或 `ai_insights` |

### 1.5 可保留在 localStorage 的数据（UI 偏好）

| # | Key | 用途 | 判定 |
|---|-----|------|------|
| 1 | `dashboardActiveView` | 当前活跃标签页 | 保留 |
| 2 | `dashboardMenuOrder` | 菜单排序 | 保留 |
| 3 | `dashboardSidebarWidth` | 侧边栏宽度 | 保留 |
| 4 | `sidebarWidth` | 侧边栏宽度 | 保留 |
| 5 | `supplyChainMenuCollapsed` | 菜单折叠状态 | 保留 |
| 6 | `adminDashboardActiveTab` | 管理面板标签 | 保留 |
| 7 | `adminDashboardMenuOrder` | 管理面板菜单排序 | 保留 |
| 8 | `orderManagementCenterActiveTab` | 订单管理标签 | 保留 |
| 9 | `cosun_current_page` | 当前页面路由 | 保留 |
| 10 | `cosun_category_params` | 分类参数 | 保留 |
| 11 | `cosun_remember_*` | 记住登录 | 保留 |
| 12 | `cosun-region` | 区域偏好 | 保留 |
| 13 | `rbac_role_order` / `rbac_module_order` | RBAC 排序 | 保留 |
| 14 | `doc_nav_order` | 文档导航排序 | 保留 |
| 15 | `table_column_config` | 表格列配置 | 保留 |
| 16 | `supplier_selected_industry` | 供应商行业选择 | 保留 |
| 17 | `cosun_cart_items` | 购物车 | 保留（会话级） |

### 1.6 认证相关（应由 Supabase Auth 管理）

| # | Key | 当前用途 | 处理方式 |
|---|-----|---------|---------|
| 1 | `cosun_auth_user` | 缓存登录用户 | 由 `useSupabaseAuth` 写入，作为兼容层可暂保留 |
| 2 | `cosun_current_user` | RBAC 用户 | 同上 |
| 3 | `cosun_backend_user` | 后端用户 | 禁用后端 API 后应移除 |
| 4 | `cosun_api_token` | 后端 API Token | 禁用后端 API 后应移除 |
| 5 | `cosun_user_session` | 会话 | 应使用 Supabase session |
| 6 | `cosun_session_expiry` | 会话过期 | 应使用 Supabase session |
| 7 | `cosun_user_info` | 用户信息 | 应读 `user_profiles` |

---

## 二、多余的代码

### 2.1 死代码（定义但从未被调用）

| # | 文件 | 符号 | 说明 |
|---|------|------|------|
| 1 | `src/lib/supabase-auth.ts` | **整个文件** | 未被任何文件导入，已被 `useSupabaseAuth.ts` 替代 |
| 2 | `src/api/backend-auth.ts` | `apiLogin()` | 无调用方；登录已走 Supabase Auth |
| 3 | `src/api/backend-auth.ts` | `setApiToken()` | 无调用方 |
| 4 | `src/api/backend-auth.ts` | `setBackendUser()` | 无调用方 |
| 5 | `src/api/backend-auth.ts` | `getAuthHeaders()` | 无调用方 |
| 6 | `src/lib/supabaseService.ts` | `arService` | 定义但从未被导入 |
| 7 | `src/lib/supabaseService.ts` | `approvalService` | 定义但从未被导入 |
| 8 | `src/lib/supabaseService.ts` | `notificationService` | 定义但从未被导入（`notificationSupabaseService` 被使用） |

### 2.2 重复/冗余服务

| # | 问题 | 文件 A | 文件 B | 说明 |
|---|------|--------|--------|------|
| 1 | 两套认证系统 | `src/lib/supabase-auth.ts`（查 `users` 表） | `src/hooks/useSupabaseAuth.ts`（查 `user_profiles` 表） | 应删除 A，统一用 B |
| 2 | 两套通知服务 | `supabaseService.ts` 中的 `notificationService` | `supabaseService.ts` 中的 `notificationSupabaseService` | 应删除前者 |
| 3 | 两套合同服务 | `supabaseService.ts` 中的 `contractService` | `supabase-db.ts` 中的 `salesContractsDb` | 功能重叠，应统一 |
| 4 | 两套订单服务 | `supabaseService.ts` 中的 `orderService` | `supabase-db.ts` 中的 `ordersDb` | 功能重叠，应统一 |
| 5 | 两套报价服务 | `supabaseService.ts` 中的 `salesQuotationService` | `supabase-db.ts` 中的 `salesQuotationsDb` | 功能重叠，应统一 |

### 2.3 废弃的后端 API 调用

`apiFetchJson`（调用 `api.cosunchina.com`）仍在 **17+ 个文件** 中使用：

| # | 文件 | 调用次数 | 用途 |
|---|------|---------|------|
| 1 | PurchaseOrderManagementEnhanced.tsx | 15+ | 采购单、供应商、合同、报价 |
| 2 | SalesQuotationManagement.tsx | 12+ | 销售报价 CRUD |
| 3 | SalesContractContext.tsx | 8 | 销售合同 CRUD |
| 4 | PurchaseOrderContext.tsx | 6 | 采购单 |
| 5 | ApprovalCenter.tsx | 5 | 审批 |
| 6 | OrderContext.tsx | 2 | 订单 |
| 7 | PurchaseRequirementContext.tsx | 2 | 采购需求 |
| 8 | RFQContext.tsx | 1 | 采购询价 |
| 9 | InquiryPreviewDialogNew.tsx | 1 | 询价 |
| 10 | AdminInquiryManagementNew.tsx | 1 | 管理端询价 |
| 11+ | 其他文件 | 1-2 | 各种 API |

**说明**：当前 `backend-auth.ts` 中 `getApiBaseUrl()` 返回空字符串时会 throw error，这些调用实际上会静默失败。但代码仍然存在，增加维护负担。

### 2.4 废弃的环境配置

| # | 文件 | 内容 | 问题 |
|---|------|------|------|
| 1 | `.env.production` | `VITE_API_BASE_URL=https://api.cosunchina.com` | 应删除或置空 |
| 2 | `.env.local` | `VITE_API_BASE_URL=https://api.cosunchina.com` | 应删除或置空 |

---

## 三、多余的功能

### 3.1 完全基于 localStorage 的 Context（无后端支撑）

以下 Context 完全在 localStorage 中运行，没有任何 Supabase 支持。在当前阶段它们的数据不会持久化到数据库：

| # | Context | 管理的数据 | 问题 |
|---|---------|-----------|------|
| 1 | `PaymentContext.tsx` | 付款记录 | 仅 localStorage，无 Supabase 表 |
| 2 | `RFQContext.tsx` | 采购询价 | 仅 localStorage + 可选后端 API |
| 3 | `QuotationRequestContext.tsx` | 报价请求 | 仅 localStorage |
| 4 | `SalesOrderContext.tsx` | 销售订单 | 仅 localStorage |
| 5 | `QuotationContext.tsx` | 报价管理（旧） | 仅 localStorage |
| 6 | `ApprovalContext.tsx` | 审批请求 | 仅 localStorage（Supabase 有表但未使用） |

### 3.2 调试/测试页面（生产环境应移除或隐藏）

| # | 文件/组件 | 用途 |
|---|---------|------|
| 1 | `SupplierRFQDebugger.tsx` | 采购询价调试器 |
| 2 | `ProcurementDataDebugger.tsx` | 采购数据调试器 |
| 3 | `SupabaseConnectionTest.tsx` | Supabase 连接测试 |
| 4 | `ClearSalesOrderHelper.tsx` | 清除销售订单工具 |
| 5 | `clearFinanceData.ts` | 清除财务数据工具 |
| 6 | `clearPaymentData.ts` | 清除付款数据工具 |
| 7 | `recoverAllData.ts` | 数据恢复工具 |
| 8 | `DocumentTestPage.tsx` | 文档测试页 |
| 9 | `migrateQuotations.ts` | 报价迁移工具 |

### 3.3 未使用的旧表查询

| # | 代码 | 问题 |
|---|------|------|
| 1 | `supabase.from('users')` | 应该查 `user_profiles`，`users` 表可能已不存在或数据过时 |

---

## 四、错误的代码

### 4.1 字段名不匹配（导致数据写入错误列或丢失）

| # | 文件 | 前端字段 | DB 字段 | 影响 |
|---|------|---------|--------|------|
| 1 | supabaseService.ts `toInquiryRow` | `region` | `region_code` | 区域数据写到错误字段，DB 中 region_code 为 NULL |
| 2 | InquiryManagement.tsx | `region: userRegion`（值为 "North America"） | `region_code`（值应为 "NA"） | 即使字段名对了，值也不对 |
| 3 | supabaseService.ts `fromInquiryRow` | 读 `r.region` | 应读 `r.region_code` | 读取时也错 |

### 4.2 ID 类型错误（TEXT vs UUID）

| # | 文件 | 问题代码 | 影响 |
|---|------|---------|------|
| 1 | InquiryManagement.tsx:142 | `id: inquiryNumber`（如 "INQ-NA-260303-0001"） | 把编号当 UUID 用，INSERT 到 UUID 列失败 |
| 2 | CreateInquiryPage.tsx:196 | `id: inquiryNumber` | 同上 |
| 3 | supabaseService.ts:519 | `const newId = newNumber; retryRow = {..., id: newId}` | 冲突重试时也用 TEXT 当 UUID |

**正确做法**：不传 `id`，让 DB 的 `uuid_generate_v4()` 自动生成。`inquiry_number` 作为单独字段存储编号。

### 4.3 日期格式错误

| # | 文件 | 问题代码 | DB 期望 |
|---|------|---------|--------|
| 1 | InquiryManagement.tsx:143 | `date: new Date().toLocaleDateString('en-US', ...)` → "03/03/2026" | DATE 类型需要 "2026-03-03" |
| 2 | CreateInquiryPage.tsx:197 | `date: new Date().toISOString().split('T')[0]` → "2026-03-03" | 正确 |

### 4.4 EMEA vs EA 不一致（60+ 处）

以下文件仍使用 `EMEA`（数据库已统一为 `EA`）：

| # | 文件 | 出现次数 |
|---|------|---------|
| 1 | `src/data/authorizedUsers.ts` | 1 |
| 2 | `src/components/admin/CEOAnalyticsPro.tsx` | 1 |
| 3 | `src/components/dashboards/SalesRepDashboardExpert.tsx` | 7 |
| 4 | `src/components/admin/CEOWorkbench.tsx` | 1 |
| 5 | `src/components/admin/CFOAnalytics.tsx` | 5 |
| 6 | `src/components/admin/QuotationManagement.tsx` | 2 |
| 7 | `src/components/admin/AdminInquiryManagementNew.tsx` | 4 |
| 8 | `src/components/admin/PurchaseOrderManagementEnhanced.tsx` | 1 |
| 9 | `src/components/admin/OrderManagementCenterPro.tsx` | 3 |
| 10 | `src/components/admin/FinanceManagement.tsx` | 2 |
| 11 | `src/components/admin/PayableManagement.tsx` | 5 |
| 12 | `src/components/admin/GlobalBIDashboardCompact.tsx` | 3 |
| 13 | `src/components/admin/PaymentRecordManagement.tsx` | 3 |
| 14 | `src/components/admin/AdminInquiryManagement.tsx` | 2 |
| 15 | `src/components/crm/CustomerRelationshipManagerPro.tsx` | 3 |
| 16 | `src/lib/crm-config.ts` | 2 |
| 17 | `src/components/salesperson/SalesContractManagement.tsx` | 1 |
| 18 | `src/components/dashboards/RegionalManagerDashboard.tsx` | 14 |
| 19 | `src/components/admin/RegionalAnalytics.tsx` | 1 |
| 20 | `src/components/Login.tsx` | 1 |
| 21 | `src/components/salesperson/SalesQuotationManagement.tsx` | 3 |
| 22 | `src/components/admin/AdminDataAnalyticsNew.tsx` | 4 |
| 23 | `src/lib/rbac-ultimate-config.ts` | 5 |
| 24 | `src/components/admin/UserRoleSwitcher.tsx` | 3 |
| 25 | `src/lib/rbac-config.ts` | 4 |
| 26 | `src/supabase/functions/server/init-database.tsx` | 4 |

### 4.5 XJ (采购询价) vs INQ 前缀混用

以下文件中客户询价应使用 `INQ` 前缀（当前部分代码仍错误使用 `RFQ` 格式）：

| # | 文件 | 说明 |
|---|------|------|
| 1 | `src/components/admin/CreateRFQFromInquiryDialog.tsx` | 应生成 `INQ-{Date.now()}-...` |
| 2 | `src/components/admin/PushToRFQDialog.tsx` | 应生成 `INQ-{Date.now()}-...` |
| 3 | `src/config/formTemplatesCosunReal.ts` | 默认值应为 `INQ-2024-0001` |
| 4 | `src/config/formTemplatesHomeDepotReal.ts` | 默认值应为 `INQ-HD-2024-0001` |
| 5 | `src/utils/recoverAllData.ts` | 硬编码应为 `INQ-NA-251119-0001` |
| 6 | `src/components/admin/AdminInquiryManagement.tsx` | 注释中引用 INQ 格式 |
| 7 | `src/utils/rfqNumberGenerator.ts` | 客户询价编号注释应为 `Format: INQ-{REGION}-YYMMDD-XXXX` |
| 8 | 多个供应商组件 | 采购询价（XJ）在供应商相关组件中使用 RFQ 标识符是正确的 |

**注意**：采购询价（XJ）在代码中使用 RFQ 标识符是正确的。只有客户询价（Inquiry）应使用 INQ。

### 4.6 status 枚举值不匹配

| # | 位置 | 前端传值 | DB 枚举 inquiry_status | 问题 |
|---|------|---------|----------------------|------|
| 1 | InquiryManagement.tsx | `"submitted"` | draft/pending/quoted/approved/rejected | `submitted` 不在枚举中 |
| 2 | 各处 | 自由文本 | 严格枚举 | 可能导致 INSERT 被拒绝 |

---

## 五、需要修复的功能

### 5.1 P0 — 核心流程修复

| # | 功能 | 问题 | 修复方案 |
|---|------|------|---------|
| 1 | **询价创建** | id 类型错误(TEXT→UUID), region→region_code, date 格式, status 枚举 | 重写 `toInquiryRow`，不传 id，使用 `next_number_ex()` 生成编号 |
| 2 | **询价编号** | 使用 localStorage 计数器（重复、跨设备不同步） | 改用 `supabase.rpc('next_number_ex', {entity:'inquiry', region:'NA'})` |
| 3 | **业务员查看询价** | RLS 需要 `tenant_id`，触发器 `auto_fill_tenant_id()` 依赖 `current_tenant_id()` | 确保用户在 `tenant_memberships` 中（已确认），前端不需要手动传 tenant_id |
| 4 | **用户认证** | 查 `users` 表 vs `user_profiles` 表 | 统一使用 `user_profiles`，删除 `supabase-auth.ts` |
| 5 | **Region 映射** | 前端用 "North America" → DB 用 "NA" | 添加统一映射函数 |

### 5.2 P1 — Context 改造（双写→单写）

| # | Context | 当前状态 | 改造方向 |
|---|---------|---------|---------|
| 1 | **SalesQuotationContext** | 双写（Supabase + localStorage） | Supabase-only |
| 2 | **SalesContractContext** | 双写（Supabase + localStorage + 后端 API） | Supabase-only |
| 3 | **OrderContext** | 双写（Supabase + localStorage + 后端 API） | Supabase-only |
| 4 | **FinanceContext** | 双写（Supabase + localStorage） | Supabase-only |
| 5 | **NotificationContext** | 双写（Supabase + localStorage） | Supabase-only |
| 6 | **UserContext** | 双写 + localStorage 编号计数器 | Supabase Auth only + `next_number_ex()` |

### 5.3 P2 — localStorage-only Context 迁移

| # | Context | 改造方向 |
|---|---------|---------|
| 1 | **PaymentContext** | 需要新建 Supabase 表，迁移为 Supabase-only |
| 2 | **RFQContext** | 使用已存在的 `supplier_rfqs` 表 |
| 3 | **QuotationRequestContext** | 使用已存在的 `quotation_requests` 表 |
| 4 | **SalesOrderContext** | 使用已存在的 `orders` 表 |
| 5 | **QuotationContext** | 使用已存在的 `sales_quotations` 表 |
| 6 | **ApprovalContext** | 使用已存在的 `approval_records` 表 |
| 7 | **PurchaseOrderContext** | 需要新建 `purchase_orders` 表 |
| 8 | **PurchaseRequirementContext** | 需要新建 `purchase_requirements` 表 |

### 5.4 P2 — 统一清理

| # | 任务 | 影响范围 |
|---|------|---------|
| 1 | EMEA → EA 全局替换 | 25+ 文件，60+ 处 |
| 2 | 删除 `supabase-auth.ts` | 1 文件 |
| 3 | 清理 `backend-auth.ts` 死代码 | 4 个未使用函数 |
| 4 | 合并重复的 Supabase 服务 | `supabaseService.ts` + `supabase-db.ts` |
| 5 | 删除/隐藏调试组件 | 9 个调试文件 |
| 6 | 清理 `.env.production` 中的 `api.cosunchina.com` | 2 个环境文件 |

---

## 六、20 个 Context 状态总览

| Context | 数据源 | 状态 | 优先级 |
|---------|--------|------|--------|
| InquiryContext | **Supabase-only** | 正确 | — |
| LanguageContext | 内存 | 正确 | — |
| RegionContext | localStorage | 正确（UI 偏好） | — |
| RouterContext | localStorage | 正确（路由状态） | — |
| CartContext | localStorage | 可接受（会话级） | — |
| UserContext | 双写 | **需修复** | P0 |
| SalesQuotationContext | 双写 | **需修复** | P1 |
| SalesContractContext | 双写 | **需修复** | P1 |
| OrderContext | 双写 | **需修复** | P1 |
| FinanceContext | 双写 | **需修复** | P1 |
| NotificationContext | 双写 | **需修复** | P1 |
| PaymentContext | 仅 localStorage | **需迁移** | P2 |
| RFQContext | 仅 localStorage | **需迁移** | P2 |
| QuotationRequestContext | 仅 localStorage | **需迁移** | P2 |
| SalesOrderContext | 仅 localStorage | **需迁移** | P2 |
| QuotationContext | 仅 localStorage | **需迁移** | P2 |
| ApprovalContext | 仅 localStorage | **需迁移** | P2 |
| PurchaseOrderContext | 仅 localStorage | **需迁移** | P2 |
| PurchaseRequirementContext | 仅 localStorage | **需迁移** | P2 |
| AdminOrganizationContext | 混合 | **需迁移** | P2 |
| OrganizationContext | 仅 localStorage | **需迁移** | P2 |

---

## 七、改造路线图建议

### 阶段一：P0 核心修复（1-2 天）
1. 修复 `inquiries` 写入：id→UUID, region→region_code, date/status 格式
2. 编号生成改用 `next_number_ex()` RPC
3. 删除 `supabase-auth.ts`，统一 `user_profiles`
4. 添加 region 映射函数（"North America" → "NA"）
5. EMEA → EA 全局替换

### 阶段二：P1 双写修复（3-5 天）
1. SalesContractContext → Supabase-only
2. OrderContext → Supabase-only
3. SalesQuotationContext → Supabase-only
4. FinanceContext → Supabase-only
5. NotificationContext → Supabase-only
6. UserContext → 移除 localStorage 编号计数器

### 阶段三：P2 迁移与清理（1-2 周）
1. localStorage-only Context 逐个迁移到 Supabase
2. 新建缺失的 Supabase 表（payment_records, purchase_requirements 等）
3. 合并重复服务文件
4. 移除调试组件
5. 清理后端 API 相关代码
6. 清理环境配置
