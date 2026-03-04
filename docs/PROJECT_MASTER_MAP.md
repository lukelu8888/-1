# COSUN ERP 项目全景总览

> 更新日期：2026-03-03
> 总文件数：~664 个源文件（src/）+ 项目配置 + 数据库迁移 + 后端 + 文档

---

## 目录

1. [架构总览：Vercel vs Supabase vs Backend](#一架构总览)
2. [项目根目录文件清单](#二项目根目录)
3. [src/ 完整文件地图](#三src-完整文件地图)
4. [每个文件的作用、状态、改造计划](#四文件详细清单)
5. [数据库迁移文件](#五数据库迁移文件)
6. [后端 Laravel API](#六后端-laravel-api)
7. [文档目录](#七文档目录)
8. [改造任务总表](#八改造任务总表)

---

## 一、架构总览

### Vercel（前端托管）

```
你的浏览器 ←→ Vercel CDN ←→ 静态 HTML/JS/CSS（build/ 目录）
```

| 项 | 说明 |
|----|------|
| 部署内容 | `npm run build` 生成的 `build/` 目录（HTML + JS + CSS + 图片） |
| 配置文件 | `vercel.json`（路由重写 + 安全头 + 缓存策略） |
| 域名 | Vercel 自动分配或自定义域名 |
| 作用 | **只负责托管静态文件**，不运行任何服务端代码 |
| 环境变量 | 在 Vercel Dashboard 设置 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY` |

### Supabase（后端即服务）

```
前端 JS ←→ Supabase API（HTTPS）←→ PostgreSQL 数据库
```

| 项 | 说明 |
|----|------|
| 认证 | Supabase Auth（email/password 登录，JWT token） |
| 数据库 | 21 张表 + 90 条 RLS + 33 个触发器 + 21 个函数 |
| 存储 | 2 个 Storage Bucket（付款凭证 + 合同附件） |
| 实时推送 | 8 张表开启 Realtime |
| 编号系统 | `next_number_ex()` 函数，并发安全 |
| AI 基础 | `event_log` + `status_history` + `ai_insights` |
| 配置 | `src/lib/supabase.ts` 中的 URL 和 Anon Key |

### Laravel Backend（废弃中）

```
前端 ←→ api.cosunchina.com（Laravel PHP）←→ MySQL 数据库
```

| 项 | 说明 |
|----|------|
| 位置 | `backend/api/` 目录 |
| 状态 | **正在废弃**，当前 `getApiBaseUrl()` 返回空字符串已禁用 |
| 残留 | `.env.local` 和 `.env.production` 中仍有 `api.cosunchina.com` |
| 前端调用 | 17+ 文件中仍有 `apiFetchJson` 调用（静默失败） |
| 计划 | 全部替换为 Supabase，最终删除整个 `backend/` 目录 |

### 三者关系图

```
┌──────────────┐         ┌──────────────────┐
│   用户浏览器   │ ──────→ │   Vercel CDN     │
│              │ ←────── │  (静态 HTML/JS)   │
└──────────────┘         └──────────────────┘
       │                          │
       │ Supabase JS SDK          │ npm run build
       ↓                          │
┌──────────────────┐      ┌──────────────────┐
│  Supabase Cloud  │      │  你的源代码 (src/)  │
│  ├─ Auth         │      │  ├─ React 组件     │
│  ├─ Database     │      │  ├─ Context 状态   │
│  ├─ Storage      │      │  ├─ Supabase 服务  │
│  ├─ Realtime     │      │  └─ 路由/配置      │
│  └─ Functions    │      └──────────────────┘
└──────────────────┘
       ╳ (已废弃)
┌──────────────────┐
│  Laravel Backend │
│  api.cosunchina  │
└──────────────────┘
```

---

## 二、项目根目录

| 文件/目录 | 作用 | 状态 | 部署位置 |
|---------|------|------|---------|
| `package.json` | NPM 依赖和脚本 | 正常 | 本地 |
| `package-lock.json` | 依赖锁定 | 正常 | 本地 |
| `vite.config.ts` | Vite 构建配置（路径别名、代理、输出目录） | 正常 | 本地 |
| `vercel.json` | Vercel 部署配置（路由重写、安全头） | 正常 | Vercel |
| `netlify.toml` | Netlify 部署配置 | **多余**（如果只用 Vercel） | — |
| `index.html` | SPA 入口 HTML | 正常 | Vercel |
| `.env.local` | 本地环境变量 | **需修改**：删除 `api.cosunchina.com` | 本地 |
| `.env.production` | 生产环境变量 | **需修改**：删除 `api.cosunchina.com` | 本地/Vercel |
| `.gitignore` | Git 忽略规则 | 正常 | 本地 |
| `.npmrc` | NPM 配置 | 正常 | 本地 |
| `README.md` | 项目说明 | 待更新 | 本地 |
| `node_modules/` | 依赖包 | 正常（不提交 git） | 本地 |
| `build/` | 构建输出 | 正常（不提交 git） | Vercel |
| `src/` | **前端源代码** | 见下文详细分析 | Vercel（构建后） |
| `backend/` | Laravel PHP 后端 | **废弃中** | 原部署在 cosunchina 服务器 |
| `database/` | 数据库迁移 SQL | 参考/历史记录 | Supabase（已执行） |
| `docs/` | 项目文档 | 正常 | 本地 |

---

## 三、src/ 完整文件地图

### 3.1 入口文件（src/ 根目录）

| 文件 | 作用 | 状态 |
|------|------|------|
| `main.tsx` | React 应用入口 | 正常 |
| `App.tsx` | 根组件（路由配置） | 正常 |
| `index.css` | 全局 CSS（Tailwind） | 正常 |
| `lazyPages.tsx` | 懒加载页面定义 | 正常 |
| `SYSTEM_RULES.txt` | 系统规则说明文本 | **可删除**（非代码） |
| `test-header-layouts.html` | 头部布局测试 | **可删除**（调试文件） |
| `test-print.html` | 打印测试 | **可删除**（调试文件） |

### 3.2 src/api/（2 个文件）

| 文件 | 作用 | 状态 | 优先级 |
|------|------|------|--------|
| `backend-auth.ts` | Laravel 后端认证和 API 调用 | **需清理**：4 个死函数，17+ 文件依赖 `apiFetchJson` | P2 |
| `social-media-api.ts` | 社交媒体 API（Mock 实现） | 使用中 | — |

### 3.3 src/contexts/（21 个文件）

| 文件 | 数据源 | 状态 | 改造方向 | 优先级 |
|------|--------|------|---------|--------|
| `InquiryContext.tsx` | Supabase | **已正确** | — | — |
| `LanguageContext.tsx` | 内存 | **已正确** | — | — |
| `RegionContext.tsx` | localStorage | **已正确**（UI 偏好） | — | — |
| `RouterContext.tsx` | localStorage | **已正确**（路由状态） | — | — |
| `CartContext.tsx` | localStorage | **可接受**（会话级） | — | — |
| `UserContext.tsx` | 双写 | **需修复** | 移除 localStorage 编号计数器 | P0 |
| `SalesQuotationContext.tsx` | 双写 | **需修复** | Supabase-only | P1 |
| `SalesContractContext.tsx` | 双写 | **需修复** | Supabase-only | P1 |
| `OrderContext.tsx` | 双写 | **需修复** | Supabase-only | P1 |
| `FinanceContext.tsx` | 双写 | **需修复** | Supabase-only | P1 |
| `NotificationContext.tsx` | 双写 | **需修复** | Supabase-only | P1 |
| `PaymentContext.tsx` | 仅 localStorage | **需迁移** | 新建 Supabase 表 | P2 |
| `RFQContext.tsx` | 仅 localStorage | **需迁移** | 使用 `supplier_rfqs` 表 | P2 |
| `QuotationRequestContext.tsx` | 仅 localStorage | **需迁移** | 使用 `quotation_requests` 表 | P2 |
| `SalesOrderContext.tsx` | 仅 localStorage | **需迁移** | 使用 `orders` 表 | P2 |
| `QuotationContext.tsx` | 仅 localStorage | **需迁移** | 使用 `sales_quotations` 表 | P2 |
| `ApprovalContext.tsx` | 仅 localStorage | **需迁移** | 使用 `approval_records` 表 | P2 |
| `PurchaseOrderContext.tsx` | 仅 localStorage | **需迁移** | 需新建表 | P2 |
| `PurchaseRequirementContext.tsx` | 仅 localStorage | **需迁移** | 需新建表 | P2 |
| `AdminOrganizationContext.tsx` | 混合 | **需迁移** | Supabase-only | P2 |
| `OrganizationContext.tsx` | 仅 localStorage | **需迁移** | Supabase-only | P2 |

### 3.4 src/lib/（27 个文件）

| 文件 | 作用 | 状态 | 改造 | 优先级 |
|------|------|------|------|--------|
| `supabase.ts` | Supabase 客户端初始化 | **正常** | — | — |
| `supabaseService.ts` | Supabase CRUD 服务（核心） | **需修复** | 修复字段映射（region→region_code, id 类型） | P0 |
| `supabase-db.ts` | Supabase CRUD 服务（重复） | **需合并** | 合并到 supabaseService.ts | P2 |
| `supabase-auth.ts` | 旧认证（查 users 表） | **死代码，应删除** | 删除 | P1 |
| `database.types.ts` | 数据库类型定义 | **过时** | 需更新为当前 schema | P2 |
| `rbac-config.ts` | RBAC 角色配置 | **EMEA→EA** | 替换 EMEA | P2 |
| `rbac-ultimate-config.ts` | RBAC 高级配置 | **EMEA→EA** | 替换 EMEA | P2 |
| `crm-config.ts` | CRM 配置 | **EMEA→EA** | 替换 EMEA | P2 |
| `customer-salesrep-mapping.ts` | 客户-业务员映射 | **localStorage** | 迁移到 Supabase | P2 |
| `notification-rules.ts` | 通知规则 | **localStorage** | 迁移到 Supabase | P2 |
| `notification-language.ts` | 通知语言 | 正常 | — | — |
| `supplier-store.ts` | 供应商存储 | **localStorage** | 迁移到 `companies` 表 | P2 |
| `storageService.ts` | 存储服务 | 待确认 | — | — |
| `business-event-bus.ts` | 事件总线 | 正常 | — | — |
| `business-type-analytics.ts` | 业务分析 | 正常 | — | — |
| `role-analytics-config.ts` | 角色分析配置 | 正常 | — | — |
| `useSupabaseSync.ts` | Supabase 同步 Hook | 正常 | — | — |
| **erp-core/** | | | | |
| `delete-guard.ts` | 删除保护 | 正常 | — | — |
| `deletion-tombstone.ts` | 软删除标记 | **localStorage** | 使用 DB `deleted_at` 字段 | P2 |
| `event-bus.ts` | 事件总线 | 正常 | — | — |
| `events.ts` | 事件定义 | 正常 | — | — |
| `id-mapping.ts` | ID 映射 | **localStorage** | 使用 `number_mappings` 表 | P2 |
| `number-display.ts` | 编号显示 | 正常 | — | — |
| `sync-policy.ts` | 同步策略 | 正常 | — | — |
| `types.ts` | 类型定义 | 正常 | — | — |
| **services/** | | | | |
| `document-template-service.ts` | 文档模板服务 | 正常 | — | — |
| `documentation-service.ts` | 文档工作流服务 | 正常 | — | — |

### 3.5 src/hooks/（6 个文件）

| 文件 | 作用 | 状态 | 改造 |
|------|------|------|------|
| `useSupabaseAuth.ts` | Supabase 认证 Hook（主用） | **正常** | — |
| `useSupabaseStats.ts` | Supabase 统计 Hook | 正常 | — |
| `useAuth.ts` | 认证 Hook | 待确认 | — |
| `usePermissionEditor.ts` | 权限编辑 Hook | 正常 | — |
| `useQuotationDocumentData.ts` | 报价文档数据 Hook | 正常 | — |
| `useSocialMediaAPI.ts` | 社交媒体 API Hook | 正常 | — |

### 3.6 src/utils/（26 个文件）

| 文件 | 作用 | 状态 | 改造 | 优先级 |
|------|------|------|------|--------|
| `rfqNumberGenerator.ts` | localStorage 编号生成器 | **应废弃** | 改用 `next_number_ex()` | P0 |
| `purchaseOrderNumberGenerator.ts` | 采购单编号（有 EMEA→EA 映射） | **应废弃** | 改用 `next_number_ex()` | P1 |
| `documentNumbering.ts` | 文档编号 | 待确认 | — | — |
| `dataIsolation.ts` | 数据隔离（localStorage 按用户） | **应废弃** | RLS 替代 | P2 |
| `emailNotification.ts` | 邮件通知 | 正常 | — | — |
| `formatters.ts` | 格式化工具 | 正常 | — | — |
| `clipboard.ts` | 剪贴板工具 | 正常 | — | — |
| `pdfExport.ts` | PDF 导出 | 正常 | — | — |
| `pdfGenerator.ts` | PDF 生成 | 正常 | — | — |
| `productDataExtractor.ts` | 产品数据提取 | 正常 | — | — |
| `documentDataAdapters.ts` | 文档数据适配 | 正常 | — | — |
| `a4-print-helper.ts` | A4 打印辅助 | 正常 | — | — |
| `workflowEngine.ts` | 工作流引擎 v1 | 正常 | — | — |
| `workflowEngineV2.ts` | 工作流引擎 v2 | 正常 | — | — |
| `supplierScoring.ts` | 供应商评分 | **localStorage** | 迁移到 Supabase | P2 |
| `autoPopulateFeedback.ts` | 自动填充反馈 | 正常 | — | — |
| `createSupplierQuotationFromRFQ.ts` | 从 XJ (采购询价) 创建供应商报价 | **localStorage** | 迁移到 Supabase | P2 |
| **调试/测试文件（应删除或隐藏）** | | | | |
| `clearFinanceData.ts` | 清除财务数据 | **调试工具** | 生产环境移除 | P2 |
| `clearPaymentData.ts` | 清除付款数据 | **调试工具** | 生产环境移除 | P2 |
| `recoverAllData.ts` | 恢复数据 | **调试工具** | 生产环境移除 | P2 |
| `generateTestRFQ.ts` | 生成测试 XJ (采购询价) | **调试工具** | 生产环境移除 | P2 |
| `initTestData.ts` | 初始化测试数据 | **调试工具** | 生产环境移除 | P2 |
| `testOrderData.ts` | 测试订单数据 | **调试工具** | 生产环境移除 | P2 |
| `migrateQuotations.ts` | 报价迁移 | **调试工具** | 迁移完成后移除 | P2 |
| `resetApp.ts` | 重置应用 | **调试工具** | 生产环境移除 | P2 |

### 3.7 src/config/（15 个文件）

| 文件 | 作用 | 状态 |
|------|------|------|
| `admin.config.ts` | 管理面板配置 | 正常 |
| `businessWorkflow.ts` | 业务流程配置 | 正常 |
| `businessWorkflowComplete33.ts` | 33 步完整流程 | 正常 |
| `businessWorkflowComplete33V2.ts` | 33 步流程 v2 | 正常 |
| `documentTemplateMapping.ts` | 文档模板映射 | 正常 |
| `formLayoutSystem.ts` | 表单布局 | 正常 |
| `formTemplates.ts` | 表单模板 | 正常 |
| `formTemplatesAdvanced.ts` | 高级表单模板 | 正常 |
| `formTemplatesCosunReal.ts` | Cosun 表单模板 | **改为 INQ** 默认值需修改 |
| `formTemplatesHomeDepot.ts` | HomeDepot 表单模板 | 正常 |
| `formTemplatesHomeDepotReal.ts` | HomeDepot 真实模板 | **改为 INQ** 默认值需修改 |
| `formWorkflowMappings.ts` | 表单流程映射 | 正常 |
| `tableColumnConfig.ts` | 表格列配置 | 正常（localStorage UI 配置） |
| `workflowMigrationV1toV2.ts` | 工作流迁移 | 正常 |
| `DOCUMENT_TEMPLATE_SYNC_README.md` | 文档模板说明 | 正常 |

### 3.8 src/data/（16 个文件）

| 文件 | 作用 | 状态 |
|------|------|------|
| `authorizedUsers.ts` | 授权用户列表 | **EMEA→EA** 需修改 |
| `productData.ts` | 产品数据 | 正常 |
| `productCategories.ts` | 产品分类 | 正常 |
| `productDetailsData.ts` | 产品详情 | 正常 |
| `accessoryProductsData.ts` | 配件产品 | 正常 |
| `recommendedProductsData.ts` | 推荐产品 | 正常 |
| `containerTrackingData.ts` | 集装箱跟踪 | 正常 |
| `freightRatesData.ts` | 运费数据 | 正常 |
| `industryTemplates.ts` | 行业模板 | **localStorage** |
| `supplierCustomers.ts` | 供应商客户 | 正常 |
| `suppliersData.ts` | 供应商数据 | 正常 |
| `workflow-inquiry-to-contract.json` | 询价到合同流程 | 正常 |
| `workflow-inquiry-to-contract-readme.md` | 流程说明 | 正常 |
| `inquiry-workflow-usage-guide.md` | 询价流程指南 | 正常 |
| `header/departmentsData.ts` | 部门数据 | 正常 |
| `header/recommendedProductsData.ts` | 推荐产品（头部） | 正常 |

### 3.9 src/components/ 总览（448 个文件）

| 目录 | 文件数 | 主要用途 |
|------|--------|---------|
| `components/`（根） | 65 | 页面级组件（Home, Login, Dashboard 等） |
| `components/admin/` | 80 | 管理后台组件 |
| `components/admin/purchase-order/` | 17 | 采购单模块 |
| `components/admin/workbenches/` | 16 | 各角色工作台 |
| `components/dashboard/` | 48 | 客户仪表板组件 |
| `components/dashboards/` | 17 | 各角色仪表板 |
| `components/supplier/` | 37 | 供应商门户组件 |
| `components/supplier/technical/` | 4 | 技术中心 |
| `components/supplier/resources/` | 3 | 资源管理 |
| `components/supplier/samples/` | 2 | 样品管理 |
| `components/salesperson/` | 8 | 业务员组件 |
| `components/documents/` | 13 | 文档管理 |
| `components/documents/templates/` | 14 | 文档模板 |
| `components/documents/a4/` | 7 | A4 文档系统 |
| `components/ui/` | 53 | UI 基础组件（shadcn/ui） |
| `components/crm/` | 1 | 客户关系管理 |
| `components/demo/` | 7 | 演示组件 |
| `components/workflow/` | 8 | 工作流组件 |
| `components/forms/` | 3 | 表单组件 |
| `components/live/` | 3 | 直播功能 |
| `components/figma/` | 1 | Figma 辅助 |
| `components/finance/` | 1 | 财务组件 |
| `components/ai-content/` | 1 | AI 内容 |

### 3.10 需要删除或隐藏的组件

| 文件 | 原因 |
|------|------|
| `admin/SupabaseConnectionTest.tsx` | 调试工具 |
| `admin/SupabaseDiagnosticPanel.tsx` | 调试工具 |
| `admin/ProcurementDataDebugger.tsx` | 调试工具 |
| `admin/ClearSalesOrderHelper.tsx` | 数据清理工具 |
| `admin/DataCleanupTool.tsx` | 数据清理工具 |
| `supplier/SupplierRFQDebugger.tsx` | 调试工具 |
| `supplier/SupplierDataCleaner.tsx` | 数据清理工具 |
| `documents/DocumentTestPage.tsx` | 测试页面 |
| `DatabaseInitializer.tsx` | 数据库初始化（已不需要） |
| `SetupWelcome.tsx` | 安装欢迎页（待确认） |

### 3.11 其他 src/ 目录

| 目录 | 文件数 | 用途 | 状态 |
|------|--------|------|------|
| `src/assets/` | 16 | 图片资源（Figma 导出） | 正常 |
| `src/styles/` | 1 | 样式文件 | 正常 |
| `src/docs/` | 多个 | 内嵌文档 | 参考 |
| `src/guidelines/` | 多个 | 开发指南 | 参考 |
| `src/modules/tracking/` | 多个 | 物流跟踪模块 | 正常 |
| `src/supabase/functions/` | 7 | Supabase 边缘函数 | 待确认 |

---

## 四、EMEA→EA 需修改的完整文件清单

共 **25+ 文件，60+ 处**：

| # | 文件 | 出现次数 |
|---|------|---------|
| 1 | `src/data/authorizedUsers.ts` | 1 |
| 2 | `src/lib/rbac-config.ts` | 4 |
| 3 | `src/lib/rbac-ultimate-config.ts` | 5 |
| 4 | `src/lib/crm-config.ts` | 2 |
| 5 | `src/components/admin/CEOAnalyticsPro.tsx` | 1 |
| 6 | `src/components/admin/CEOWorkbench.tsx` | 1 |
| 7 | `src/components/admin/CFOAnalytics.tsx` | 5 |
| 8 | `src/components/admin/QuotationManagement.tsx` | 2 |
| 9 | `src/components/admin/AdminInquiryManagementNew.tsx` | 4 |
| 10 | `src/components/admin/AdminInquiryManagement.tsx` | 2 |
| 11 | `src/components/admin/PurchaseOrderManagementEnhanced.tsx` | 1 |
| 12 | `src/components/admin/OrderManagementCenterPro.tsx` | 3 |
| 13 | `src/components/admin/FinanceManagement.tsx` | 2 |
| 14 | `src/components/admin/PayableManagement.tsx` | 5 |
| 15 | `src/components/admin/GlobalBIDashboardCompact.tsx` | 3 |
| 16 | `src/components/admin/PaymentRecordManagement.tsx` | 3 |
| 17 | `src/components/admin/RegionalAnalytics.tsx` | 1 |
| 18 | `src/components/admin/AdminDataAnalyticsNew.tsx` | 4 |
| 19 | `src/components/admin/UserRoleSwitcher.tsx` | 3 |
| 20 | `src/components/crm/CustomerRelationshipManagerPro.tsx` | 3 |
| 21 | `src/components/dashboards/SalesRepDashboardExpert.tsx` | 7 |
| 22 | `src/components/dashboards/RegionalManagerDashboard.tsx` | 14 |
| 23 | `src/components/salesperson/SalesContractManagement.tsx` | 1 |
| 24 | `src/components/salesperson/SalesQuotationManagement.tsx` | 3 |
| 25 | `src/components/Login.tsx` | 1 |
| 26 | `src/supabase/functions/server/init-database.tsx` | 4 |

---

## 五、数据库迁移文件

### Supabase 迁移（已执行，仅供参考）

| 文件 | 用途 | 状态 |
|------|------|------|
| `supabase_migration.sql` | 基础 schema（users, inquiries, quotations 等） | 已执行（旧版） |
| `supabase-migration.sql` | 另一个基础 schema（不同项目 ID） | 可能未执行 |
| `supabase_patch.sql` | 补全字段 + 新建 sales_quotations | 已执行 |
| `supabase_phase2.sql` | Phase2：补全 sales_quotations + inquiries + rfq_records | 已执行 |
| `supabase_auth_setup.sql` | user_profiles + handle_new_user 触发器 | 已执行 |
| `supabase_user_profiles.sql` | 更新 7 个测试用户 | 已执行 |
| `supabase_all_users.sql` | 全量 19 个用户 | 已执行 |
| `supabase_verify_fix.sql` | 验证修复 portal_role | 已执行 |
| `supabase_inquiries_fix.sql` | 补全 inquiries 字段 | 已执行 |
| `supabase_storage_setup.sql` | Storage buckets | 已执行 |
| `011_inquiry_number_sequence.sql` | 简化版编号生成（number_sequences 表） | **未执行**（已被 next_number_ex 替代） |

**注意**：当前 Supabase 的实际 schema 是由 001/002 迁移（多租户 SaaS 版本）创建的，这些迁移文件不在项目中但已在 DB 执行。

### MySQL 迁移（Laravel 后端，废弃中）

| 文件 | 用途 | 状态 |
|------|------|------|
| `schema.sql` | MySQL 基础表结构 | **废弃** |
| `seed.sql` | 测试数据种子 | **废弃** |
| 其他 `alter_*.sql`、`create_*.sql` | 各种表修改 | **废弃** |

---

## 六、后端 Laravel API

| 目录/文件 | 用途 | 状态 |
|---------|------|------|
| `backend/api/` | 完整的 Laravel 11 项目 | **废弃中** |
| `backend/api/app/Http/Controllers/Api/` | 11 个 API Controller | **废弃** |
| `backend/api/app/Models/` | 17 个 Eloquent Model | **废弃** |
| `backend/api/routes/api.php` | API 路由定义 | **废弃** |
| `backend/api/database/migrations/` | Laravel 数据库迁移 | **废弃** |

**计划**：全部替换为 Supabase 后删除整个 `backend/` 目录。

---

## 七、文档目录

| 文件 | 用途 | 状态 |
|------|------|------|
| `docs/SUPABASE_ENVIRONMENT_REPORT.md` | Supabase 完整性报告 | **今日创建** |
| `docs/FRONTEND_AUDIT_REPORT.md` | 前端审计报告 | **今日创建** |
| `docs/PROJECT_MASTER_MAP.md` | 本文档：项目全景总览 | **今日创建** |
| `docs/dev-notes/` | 70+ 个开发笔记 | 历史参考 |
| `docs/API-采购订单-CG采购请求.md` | API 文档 | 参考 |
| `docs/提交报价-部署清单.md` | 部署清单 | 参考 |
| `docs/迁移新服务器-配置清单.md` | 迁移清单 | 参考 |

---

## 八、改造任务总表

### P0 — 立即修复（影响核心流程）

| # | 任务 | 涉及文件 | 改什么 |
|---|------|---------|--------|
| 1 | 修复 inquiries 写入 | `supabaseService.ts` | `region`→`region_code`; 不传 id（让 DB 生成 UUID）; `toInquiryRow`/`fromInquiryRow` 字段映射 |
| 2 | 修复 inquiries 创建 | `InquiryManagement.tsx`, `CreateInquiryPage.tsx` | 不设 `id: inquiryNumber`; date 格式改为 ISO; region 值用 "NA"/"SA"/"EA" 而非全名 |
| 3 | 编号生成改 RPC | `UserContext.tsx`, `rfqNumberGenerator.ts` | 删除 localStorage 计数器; 改用 `supabase.rpc('next_number_ex', {...})` |
| 4 | 添加 Region 映射 | 新建 `src/utils/regionMapper.ts` | "North America"→"NA", "South America"→"SA", "Europe & Africa"→"EA" |

### P1 — 重要修复

| # | 任务 | 涉及文件 | 改什么 |
|---|------|---------|--------|
| 5 | 删除死代码 `supabase-auth.ts` | `src/lib/supabase-auth.ts` | 删除整个文件 |
| 6 | SalesContractContext 改 Supabase-only | `SalesContractContext.tsx` | 移除所有 localStorage 读写; 只从 Supabase 加载/保存 |
| 7 | OrderContext 改 Supabase-only | `OrderContext.tsx` | 同上 |
| 8 | SalesQuotationContext 改 Supabase-only | `SalesQuotationContext.tsx` | 同上 |
| 9 | FinanceContext 改 Supabase-only | `FinanceContext.tsx` | 同上 |
| 10 | NotificationContext 改 Supabase-only | `NotificationContext.tsx` | 移除 localStorage; 使用 Realtime |

### P2 — 清理与完善

| # | 任务 | 涉及文件 | 改什么 |
|---|------|---------|--------|
| 11 | EMEA→EA 全局替换 | 25+ 文件 | 全部替换为 EA |
| 12 | 修改 .env 文件 | `.env.local`, `.env.production` | 删除 `api.cosunchina.com` |
| 13 | 合并重复 Supabase 服务 | `supabaseService.ts`, `supabase-db.ts` | 合并为一个文件 |
| 14 | 清理 backend-auth.ts | `backend-auth.ts` | 移除死函数 |
| 15 | localStorage-only Context 迁移 | 10 个 Context 文件 | 逐个改为 Supabase-only |
| 16 | 移除调试组件 | 10+ 个调试/测试文件 | 从路由中移除或加 admin-only 保护 |
| 17 | 删除 netlify.toml | `netlify.toml` | 如果只用 Vercel 则删除 |
| 18 | 更新 database.types.ts | `database.types.ts` | 用 Supabase CLI 重新生成 |

---

## 九、文件状态图例

| 标记 | 含义 |
|------|------|
| **正常** | 无需修改 |
| **需修复** | 有 bug 或字段不匹配，必须修改 |
| **需迁移** | 从 localStorage 迁移到 Supabase |
| **双写** | 同时写 localStorage 和 Supabase，需改为 Supabase-only |
| **死代码** | 定义但从未调用，应删除 |
| **调试工具** | 开发用调试文件，生产环境应隐藏 |
| **废弃** | 不再使用的功能/文件 |
| **EMEA→EA** | 需要替换区域代码 |
| **改为 INQ** | 需要替换前缀（客户询价） |
| **待确认** | 不确定是否还在使用，需进一步调查 |
