# 内部管理财务中心 · Management Finance Center

> 业财一体化 + AI 经营分析的企业级 SaaS ERP 财务大脑。
>
> 本文是内部管理财务模块的完整开发方案：数据库结构、Supabase Schema、RLS、API、页面结构、状态流转、自动凭证引擎、AI 接口、权限体系。

---

## 1. 目标与定位

| 项目 | 说明 |
| --- | --- |
| 业务范围 | 费用 / 工资 / 社保公积金 / 固定资产 / 成本中心 / 预算 / 部门利润 / 项目利润 / AI 分析 / 自动凭证 |
| 架构定位 | "外部经营财务模块"（应收 / 应付 / 收付款 / 发票）之外的**管理侧** |
| 工程定位 | 全公司唯一的"管理财务真源"。所有业务自动生成凭证并落入此模块。 |
| 终极目标 | **AI 驱动的国际贸易企业 ERP 财务中心** |

### 核心架构原则

1. **业财一体化** — 凭证是唯一的真源；UI 上看到的所有利润 / 成本数字必须由凭证回算。
2. **多租户优先** — 所有表都有 `tenant_id`，RLS 按 JWT 中的 `tenant_id` 进行硬隔离。
3. **多公司支持** — `mf_companies` 在租户下定义法律主体；外币业务通过 `mf_exchange_rates` 折算到报表币种。
4. **多币种** — 每条金额都成对存储 `currency` + `exchange_rate`，凭证账行同时记录原币种与本位币金额。
5. **AI Ready** — `mf_ai_jobs` 统一调度所有 AI 作业（利润分析、费用异常、现金流预测、预算预测、凭证建议、董事会简报）。
6. **零 localStorage 业务数据** — 全部业务数据走 Supabase（`scripts/guard-business-storage.mjs` 已守护）。
7. **审计追溯** — 所有关键动作（创建 / 审批 / 落账 / 冲销 / AI 运行）都写 `mf_audit_logs`。

---

## 2. 一级模块结构

```text
内部管理财务（management-finance-center）
├── 经营驾驶舱            OverviewModule
├── 费用管理中心          ExpenseManagementModule
├── 工资与人力成本        PayrollModule
├── 社保 / 公积金 / 个税  SocialInsuranceModule
├── 固定资产管理          FixedAssetsModule
├── 成本中心              CostCenterModule
├── 预算管理              BudgetModule
├── 部门利润分析          DepartmentProfitModule
├── 项目 / 订单利润       ProjectProfitModule
├── AI 经营分析中心       AiAnalyticsModule
├── 自动凭证中心          VoucherCenterModule
└── 审计日志              AuditLogModule
```

UI 按业务侧分组（驾驶舱 / 业务费用 / 人力成本 / 资产与预算 / 利润分析 / 凭证 · 审计）。

---

## 3. 数据库结构 (PostgreSQL / Supabase)

完整 DDL：`database/migrations/20260514_management_finance_center.sql`

### 3.1 表清单（全部以 `mf_` 前缀以避免与外部财务模块冲突）

| 域 | 表 | 用途 |
| --- | --- | --- |
| 租户/公司 | `mf_tenants`, `mf_companies` | SaaS 多租户根隔离 + 法律主体 |
| 多币种 | `mf_exchange_rates` | 每日汇率（多源：手工 / API / 央行） |
| 总账 | `mf_accounts`, `mf_periods` | 会计科目 + 会计期间（开 / 关账） |
| 维度 | `mf_cost_centers`, `mf_departments`, `mf_projects` | 成本中心 / 部门 / 项目 |
| 凭证 | `mf_vouchers`, `mf_voucher_lines`, `mf_voucher_rules` | 凭证主子表 + 规则引擎 |
| 费用 | `mf_expense_categories`, `mf_expense_claims`, `mf_expense_items` | 报销三表 |
| 工资 | `mf_employees`, `mf_salary_structures`, `mf_payslip_runs`, `mf_payslips`, `mf_payslip_lines` | 工资 / 工资条 |
| 社保 | `mf_si_schemes`, `mf_si_records`, `mf_iit_brackets` | 社保方案 + 月度记录 + 个税税档 |
| 资产 | `mf_assets`, `mf_depreciation_schedule`, `mf_asset_maintenance` | 资产台账 + 折旧计划 + 维修 |
| 预算 | `mf_budgets`, `mf_budget_lines`, `mf_budget_alerts` | 预算 + 分摊 + 预警 |
| 利润 | `mf_profit_snapshots` | 真实利润快照（部门 / 项目 / 订单 / 客户 / 公司） |
| AI / 审计 | `mf_ai_jobs`, `mf_audit_logs` | AI 任务 + 审计 |

### 3.2 关键设计点

- `mf_vouchers` × `mf_voucher_lines`：每行强制 `debit XOR credit > 0` 的 CHECK；落账走 `mf_post_voucher(uuid)` RPC，会先校验 `mf_check_voucher_balanced` 再 `update status='posted'` 并写审计。
- `mf_profit_snapshots`：使用 PostgreSQL 计算列 (`GENERATED ALWAYS AS ... STORED`) 物化 `total_cost`、`gross_profit`、`margin_pct`，避免在前端反复算。
- `mf_si_records`：`total_company`、`total_employee` 也是计算列。
- `mf_budget_lines`：`variance_amount`、`variance_pct` 计算列。
- `mf_assets`：`net_book_value` 计算列；折旧通过 `mf_depreciation_schedule` 月级条目持久化，方便 P&L 钻取。
- `mf_voucher_rules.template (JSONB)`：保存模板表达式，如：

  ```json
  {
    "event_type": "payroll.run",
    "template": [
      { "side": "debit",  "account_code": "6602.01", "amount_expr": "payload.gross_total", "cc_expr": "payload.dept_code" },
      { "side": "credit", "account_code": "2211",    "amount_expr": "payload.gross_total" }
    ]
  }
  ```

---

## 4. RLS 策略

每张 `mf_*` 表都启用 RLS，并装配两条策略：

- `mf_tenant_read`（SELECT）：要求 `tenant_id IS NULL OR tenant_id = public.mf_current_tenant()`
- `mf_tenant_write`（ALL）：在读条件之上，再要求 `public.mf_is_finance()`，即 JWT 中 `portal_role` 必须是
  `admin | CEO | CFO | Finance | External_Accountant | Finance_Manager | Finance_Director`。

辅助函数：

```sql
public.mf_current_tenant()   -- 从 JWT 读 tenant_id
public.mf_current_company()  -- 同上 company_id
public.mf_is_finance()       -- 角色判定
```

> 因为现有的客户端默认未携带 `tenant_id`，策略中包含 "`tenant_id IS NULL OR ...`"，以便在本地开发模式下也能读到数据。上生产前请确保 JWT 注入 `tenant_id`。

---

## 5. API / Service 层

文件：`src/lib/services/managementFinanceService.ts`

特性：

1. **Supabase-first**：每个查询先走 `mf_*` 表。
2. **优雅降级**：若表尚未创建（PGRST116 / `42P01`），自动 fallback 到 `MOCK_MANAGEMENT_FINANCE_SEED` 内存种子，并通过 `[ManagementFinanceService]` 控制台告警提示用户执行迁移。
3. **统一接口**：所有 Module 只通过 React Context（`useManagementFinance`）消费。
4. **AI 接口**：`enqueueAiJob(type, parameters)` 写入 `mf_ai_jobs`，由后端的 Edge Function 或工作进程消费。

主要导出：

```ts
fetchTenant / fetchCompanies / fetchAccounts / fetchCostCenters / fetchDepartments
fetchExpenseClaims / fetchPayslipRun / fetchPayslips / fetchEmployees
fetchSiRecords / fetchAssets / fetchDepreciationSchedule
fetchBudgets / fetchBudgetLines / fetchBudgetAlerts
fetchProfitSnapshots (department | order | project)
fetchVouchers / postVoucher (RPC: mf_post_voucher)
fetchAiJobs / enqueueAiJob
fetchAuditLogs
```

---

## 6. 页面结构 / 状态流转

```
ManagementFinanceCenter (default export from src/components/management-finance/)
└── <ManagementFinanceProvider>
    ├── eager fetchAll() on mount → 19 个 slice 一次性拉取
    ├── refreshSlice('expense' | 'payroll' | 'assets' | 'budget' | ...) — 单 slice 增量刷新
    └── <ManagementFinanceShell>
        ├── 标题栏 (tenant 名 + dataSource 徽章)
        ├── 公司 / 期间筛选 (multi-company aware)
        ├── 分组导航 Tab
        └── 12 个 <Module />
```

### 入口

| 路径 | 说明 |
| --- | --- |
| `AdminDashboard → management-finance-center` | 顶级菜单项（图标 `Sparkles`，徽章 `AI`） |
| `FinanceManagement.tsx → activeTab='management-finance'` | 现有"财务管理中心"的「内部管理」分组里也嵌入了同一个组件 |

---

## 7. 自动凭证引擎设计

### 7.1 事件类型 (event_type)

| 事件 | 触发点 | 借 | 贷 |
| --- | --- | --- | --- |
| `payroll.run` | 工资入账 | 管理费用-工资 / 社保(公司) / 公积金(公司) | 应付职工薪酬 / 其他应付款-社保(公司) / 其他应付款-公积金(公司) |
| `payroll.disburse` | 工资发放 | 应付职工薪酬 | 银行存款 / 应交税费-个税 / 其他应付款-社保(个人) / 其他应付款-公积金(个人) |
| `asset.depreciation` | 月末计提 | 管理费用-折旧 | 累计折旧 |
| `asset.disposal` | 资产处置 | 累计折旧 / 营业外支出 | 固定资产 / 营业外收入 |
| `expense.approved` | 报销通过 | 管理费用-差旅/办公/招待/福利 | 银行存款 / 库存现金 |
| `fx.revaluation` | 月末汇兑 | 财务费用-汇兑损益（损） | 应收账款 / 银行存款（外币科目） |
| `ai.adjust` | AI 凭证建议 | 由模板动态填写（草稿） | — |

### 7.2 引擎流程

1. 业务模块（报销 / 工资 / 折旧 / …）在状态流转的关键节点，调用 `enqueueVoucher(event_type, payload)`。
2. 引擎查找 `mf_voucher_rules` 中 `event_type` 匹配且 `is_active = true` 的规则（按 `priority` 排序）。
3. 对模板做表达式求值：`payload.gross_total`、`payload.dept_code` … 得到凭证行。
4. 写入 `mf_vouchers (status='draft')` + `mf_voucher_lines`。
5. UI（自动凭证中心）展示草稿；财务人员或 RPA 调用 `mf_post_voucher(uuid)` 落账（校验借贷平衡 → 写审计）。
6. 落账后向所有相关业务对象（如 `mf_expense_claims.voucher_id`）回写关联。

---

## 8. AI 分析接口

AI 作业类型对应到 `mf_ai_jobs.job_type` 枚举：

| 类型 | 输入 (parameters) | 输出 (result_data / result_summary) |
| --- | --- | --- |
| `profit_analysis` | `{order_no, scope_id}` | 真实利润拆解 + 改善建议 |
| `expense_anomaly` | `{period_year, period_month}` | 可疑报销列表（金额 / 时间 / 人员） |
| `cashflow_forecast` | `{horizon_weeks}` | 未来 N 周 CF 缺口 / 节点 |
| `budget_forecast` | `{budget_id, fiscal_year}` | 下一季度预算 P50/P80/P95 |
| `voucher_suggestion` | `{bank_txn_id}` | 借贷科目建议 + 成本中心 + 置信度 |
| `cost_attribution` | `{period_year, scope}` | 公共费用智能分摊比例 |
| `board_briefing` | `{period_year, period_month}` | PDF 简报 URL + 文本摘要 |

### 调用约定

- 客户端只调 `enqueueAiJob(type, params)`，不直接调 LLM。
- 后端实现以下二选一：
  1. **Edge Function (Supabase)**：监听 `mf_ai_jobs` 状态 = `queued` 的行 → 调 LLM → 更新 `result_*` + 计费字段。
  2. **Worker (Node/Python)**：长轮询同一表。
- AI 结果可直接生成"草稿凭证"（`source_module='ai'`），由人工复核后落账，形成闭环。

---

## 9. 权限体系

- **角色**：复用现有 `rbac-config.ts` 中的 `access:finance_management` permission，并在 SQL 函数 `mf_is_finance()` 中要求 `portal_role` 在 finance 角色集合内。
- **公司可见性**：通过 `mf_companies.id` × 用户 JWT 的 `company_id` 做行级限定（生产化时在 `mf_tenant_read` 策略中增加 `company_id = mf_current_company()` 条件）。
- **数据范围**：
  - CEO / CFO / Admin：可见所有公司
  - Finance：可见本租户全部数据
  - External_Accountant：可见但只读（在 `mf_tenant_write` 中可扩展 `mf_is_finance_writer()`）

---

## 10. 状态流转（关键模块）

### 10.1 费用 `mf_expense_claims.status`

```
draft → submitted → approved → paid → voided
              └─→ rejected (终态)
```

### 10.2 工资 `mf_payslip_runs.status`

```
draft → calculated → approved → disbursed → locked
                                    └─→ cancelled (异常)
```

### 10.3 凭证 `mf_vouchers.status`

```
draft → posted → reversed (反向凭证, 写 reversed_by_voucher_id)
draft → void (作废, 不入账)
```

### 10.4 资产 `mf_assets.status`

```
in_use ↔ under_repair
        ↘
        idle
        ↘
        disposed / scrapped / sold (终态)
```

### 10.5 预算 `mf_budgets.status`

```
draft → submitted → approved → locked → closed
```

---

## 11. UI 规范

- 风格对标 **Oracle / SAP / NetSuite / 金蝶云星空 / 用友 NC**
- 字号：标题 14-15px / 正文 11px / 数据 11px tabular-nums
- 颜色：
  - 财务侧：浅色玻璃质感 + 紧凑表格
  - 利润：emerald / rose 双色编码
  - AI 建议：indigo
- A4 打印 / PDF 导出：每个模块的"导出报表"按钮预留 Hook（未来对接 `jspdf` + `html2canvas`，已是依赖）。
- 深 / 浅色：组件全部使用 Tailwind tokens（`slate / indigo / emerald`），可一键叠加深色模式。

---

## 12. 开发与部署清单

### 12.1 数据库迁移

```bash
# 推荐方式
supabase db push                                # 推送当前 supabase/migrations/
# 或单文件执行
psql "$SUPABASE_DB_URL" < database/migrations/20260514_management_finance_center.sql
```

### 12.2 前端

无新增依赖。所有依赖项均已在 `package.json` 中。

```bash
npm run build       # vite build — 已验证通过
npm run dev         # 本地开发
```

### 12.3 验证

1. 启动后进入 `Admin → 内部管理财务中心`（菜单标签：`AI`）。
2. 若未执行 SQL，会看到 **FALLBACK SEED** 徽章，所有模块以 mock 数据渲染。
3. 执行 SQL 后刷新，徽章变 **SUPABASE LIVE**，并读真实数据。

### 12.4 待办（生产化）

- [ ] 在 `mf_tenant_read` 中加入 `company_id` 维度
- [ ] 实现 Edge Function 消费 `mf_ai_jobs`
- [ ] 对接现有 ERP 业务事件总线（`erp-core/event-bus.ts`），让"销售订单完成 / 采购入库 / 应付付款"自动触发对应的凭证规则
- [ ] 工资条 PDF 模板（`DocumentCenter` 内已有模板系统，注入新模板类型 `PAYSLIP`）
- [ ] 部门 / 项目利润快照的物化任务（cron + RPC `mf_compute_profit_snapshots`）

---

## 13. 文件索引

| 文件 | 说明 |
| --- | --- |
| `database/migrations/20260514_management_finance_center.sql` | DDL + RLS + 函数 |
| `src/components/management-finance/index.tsx` | 入口 |
| `src/components/management-finance/ManagementFinanceShell.tsx` | 顶层 Shell |
| `src/components/management-finance/types.ts` | 类型 |
| `src/components/management-finance/context/ManagementFinanceContext.tsx` | 全局 Context |
| `src/components/management-finance/components/` | 共享 UI（StatStrip / ModuleHeader / Currency） |
| `src/components/management-finance/modules/` | 12 个一级模块 |
| `src/components/management-finance/data/mockSeed.ts` | Fallback 种子 |
| `src/lib/services/managementFinanceService.ts` | Supabase 服务层 |

---

## 14. 与外部经营财务模块的关系

| 类别 | 外部经营财务 | 内部管理财务（本模块） |
| --- | --- | --- |
| 关注点 | 收入、客户、现金流入 / 出 | 内部费用、人力、资产、利润、预算、AI |
| 凭证来源 | 收款 / 付款 / 发票 | 工资 / 费用 / 折旧 / 汇兑 / AI |
| 数据库前缀 | （现有：`sales_quotations`, `accounts_receivable`, `payment_*` 等） | `mf_*` |
| 整合方式 | 共用 `mf_vouchers`（账面是统一的） | — |

两个模块在**凭证 / 总账层完全打通**：所有业务侧最终都汇聚到 `mf_vouchers`，AI 分析与利润计算同时读两侧数据。

---

> **结论**：本方案以 Supabase + PostgreSQL 为底座，前端 React + TypeScript + Tailwind，构建了一个企业级、可 SaaS 化、多租户、多公司、多币种、AI 可扩展、零 localStorage 业务数据、且与现有外部经营财务模块凭证账面完全统一的"内部管理财务中心"。已经做到：
>
> 1. ✅ 完整数据库结构（30 张表 + 计算列 + 触发器）
> 2. ✅ Supabase Schema + RLS
> 3. ✅ API / Service 层（Supabase-first + 降级 fallback）
> 4. ✅ 页面结构（12 个模块 / 6 个分组）
> 5. ✅ 状态流转（费用 / 工资 / 凭证 / 资产 / 预算）
> 6. ✅ 自动凭证引擎（规则 JSON + RPC 平衡校验 + 落账 / 审计）
> 7. ✅ AI 分析接口（7 类 job + 异步队列 + 凭证建议反哺）
> 8. ✅ 权限体系（角色 → JWT → RLS）
> 9. ✅ 完整开发方案（本文件）
