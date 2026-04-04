# ERP 全链路对齐任务清单

状态说明：
- `[x]` 已完成
- `[~]` 已部分完成 / 需复核
- `[ ]` 未开始

## A. P0 / 直接影响业务正确性

| 状态 | 任务 | 对应报告 | 备注 |
|---|---|---|---|
| `[x]` | 补 `PaymentMode.da` | BLK-1 | `SalesQuotationContext.tsx` 已有 `da` |
| `[x]` | `DA` 纳入合同/放货路径判断 | Workstream A | 已完成（合同判断、执行层分支、风控摘要、仓配放单与待办分流均已接入） |
| `[x]` | 执行层把 `dp_or_other_collection` 拆成 `dp` / `da` | Workstream A | 已完成（新逻辑支持 `dp_collection / da_acceptance`，旧值兼容保留） |
| `[x]` | 增加 DA 承兑字段：`acceptance_status` / `acceptance_date` / `acceptance_maturity_date` | Workstream A | 已完成（migration + 类型 + 映射） |
| `[x]` | 增加 L/C 子类型字段：`lc_type` / `lc_opened_at` / `lc_discrepancy_status` / `lc_maturity_date` | Workstream A | 已完成（migration + 类型 + 映射） |
| `[x]` | 付款待办按模式拆分 | BLK-2 / Workstream B | 已按 `collectionControlMode + paymentMode` 分流 |
| `[x]` | 补 `purchase_orders` 到 `database.types.ts` | BLK-3 / Workstream C | 已完成 |
| `[x]` | 补后合同执行 20+ 张表到 `database.types.ts` | BLK-3 / ARCH-2 / Workstream C | 已完成 |

## B. PR / CG 治理与审批

| 状态 | 任务 | 对应报告 | 备注 |
|---|---|---|---|
| `[x]` | 新增 `cg_approval` 审批类型 | ARCH-5 / Workstream P | 已完成 |
| `[x]` | 新提交的 CG 审批改用 `type: 'cg_approval'` | ARCH-5 / Workstream P | 已完成 |
| `[x]` | 审批中心兼容识别 `cg_approval` | Workstream P | 已覆盖详情渲染、操作分流、批量补全与旧记录兼容识别 |
| `[x]` | 历史 `contract` 型 CG 审批记录迁移到 `cg_approval` | ARCH-5 / Workstream P | 本轮已落历史回填 migration |
| `[x]` | 拆分 PR 校验与 CG 审批为两步 | MAN-8 / Workstream P | 列表页先做 `PR校验`，校验通过后才允许 `申请审核` |
| `[x]` | 为 `purchase_orders` 增加治理字段：`pr_validation_status` / `pr_validated_at` / `pr_validated_by` | Workstream P | 本轮已落 migration + 类型 + 映射 |
| `[x]` | 为 `purchase_orders` 增加 `cg_type` | Workstream P | 本轮已落 migration + 类型 + 映射 |
| `[x]` | 为 `purchase_orders` 增加 `selected_bj_id` / `bj_locked_at` | MAN-7 / Workstream P | 本轮已落 migration + 类型 + 映射 |
| `[x]` | 为 `purchase_orders` 增加 PR/CG 运行态字段落库：`parent_request_po_number` / `pending_supplier_po_numbers` / `allocated_supplier_count` / `supplier_allocation_ready` / `procurement_request_status` | 域 4-补充 | 本轮已落 migration + 类型 + 映射 |
| `[x]` | XJ/BJ 结果作为 CG 提交前置门控 | MAN-7 / Workstream P | 已完成（先做软门控：缺少 `xjNumber / selectedQuote / selectedBjId` 时弹确认） |
| `[x]` | QT 审批补齐 5 类触发条件：常规 / 大额 / 特价 / 特殊付款 / 战略客户 | 域 1 / Workstream Q | 已完成（新增字段 `qt_type / special_price_flag / special_price_reason / special_payment_terms_flag / strategic_customer_flag / qt_last_approval_at`，提交审批链路已收口到统一 governance service，且已补历史回填 migration，未重做审批中心布局） |
| `[x]` | SC 审批补齐精细化治理：常规 / 大额 / 例外条款 / 战略客户 / 特殊账期 | 域 1 / Workstream Q | 已完成（新增字段 `sc_type / exceptional_clause_flag / exceptional_clause_notes / special_account_period_flag / strategic_customer_flag / sc_last_approval_at`，已接入既有审批体系，并补历史回填 migration；2026-04-04 已修正前端直连 Supabase 审批落点，避免新批准 SC 漏写 `sc_last_approval_at`） |

## C. 业务员待办中心 / 付款待办

| 状态 | 任务 | 对应报告 | 备注 |
|---|---|---|---|
| `[x]` | `payment_followup` 拆分为多 todo 类型 | BLK-2 / Workstream B | 已完成 |
| `[x]` | 增加 `lc_open_chase` | Workstream B | 已完成 |
| `[x]` | 增加 `lc_terms_confirm` | Workstream B | 已完成 |
| `[x]` | 增加 `bl_copy_send` | Workstream B | 已完成 |
| `[x]` | 增加 `balance_tt_chase` | Workstream B | 已完成 |
| `[x]` | 增加 `dp_redemption_chase` | Workstream B | 已完成 |
| `[x]` | 增加 `da_acceptance_chase` | Workstream B | 已完成 |
| `[x]` | 增加 `da_maturity_chase` | Workstream B | 已完成 |
| `[x]` | 增加 `oa_period_warning` | Workstream B | 已完成 |
| `[x]` | 增加 `oa_overdue_chase` | Workstream B | 已完成 |
| `[x]` | `SalesTodoCenter.tsx` 展示新 todo 标签与动作 | Workstream B | 仅补标签映射，未改现有布局交互 |
| `[x]` | 业务员待办中心全面性检查 | 补充优化 | 已补 `taskSections / riskItems / collaborationSections` 数据契约与动作 schema，并统一 `taskSections` 排序与 accent 约束；按当前不重做布局的约束，代码侧检查与数据侧补强已完成，后台升级与跨角色联动后续由独立机制继续承接 |

## D. 超时升级 / 通知机制

| 状态 | 任务 | 对应报告 | 备注 |
|---|---|---|---|
| `[x]` | 选定后台定时方案（pg_cron / Edge Function / 外部 cron） | VIS-1 / Workstream D | 已确定采用 `外部 cron`，见 `超时升级调度方案.md` |
| `[x]` | 新建 `deadlineEscalationService` | Workstream D | 已完成（规则服务已落地） |
| `[x]` | ING 24h 未首响升级 | Workstream D | 代码、脚本、workflow、环境守卫与 `dry-run` 入口均已完成；生产启用仅依赖外部 secrets 配置 |
| `[x]` | QT 7天未反馈升级 | Workstream D | 代码、脚本、workflow、环境守卫与 `dry-run` 入口均已完成；生产启用仅依赖外部 secrets 配置 |
| `[x]` | SC 3天未签升级 | Workstream D | 代码、脚本、workflow、环境守卫与 `dry-run` 入口均已完成；生产启用仅依赖外部 secrets 配置 |
| `[x]` | SC 定金超期升级 | Workstream D | 代码、脚本、workflow、环境守卫与 `dry-run` 入口均已完成；生产启用仅依赖外部 secrets 配置 |
| `[x]` | O/A 账期 T-7 预警 | Workstream D | 代码、脚本、workflow、环境守卫与 `dry-run` 入口均已完成；生产启用仅依赖外部 secrets 配置 |
| `[x]` | DA 到期 T-3 预警 | Workstream D | 代码、脚本、workflow、环境守卫与 `dry-run` 入口均已完成；生产启用仅依赖外部 secrets 配置 |
| `[x]` | Usance L/C 到期 T-5 预警 | Workstream D | 代码、脚本、workflow、环境守卫与 `dry-run` 入口均已完成；生产启用仅依赖外部 secrets 配置 |
| `[x]` | 超时升级链路补齐 secrets 守卫 / 去重 / 失败重试 / 日志输出 / 启用步骤 | VIS-1 / Workstream D | 已完成（fixture dry-run 与 service-role 真跑均已跑通；2026-04-04 已补齐表授权与通知字段兼容，真实写库结果 `scanned=75 / enqueued=65 / deduped=82 / failures=[]`） |

## E. 放货治理 / 例外审批

| 状态 | 任务 | 对应报告 | 备注 |
|---|---|---|---|
| `[x]` | 新增 `exceptional_release` 审批类型 | Workstream E | 已完成（已注册到 `ApprovalType`，审批中心可走审批记录流） |
| `[x]` | 新增 `qc_exception_release` 审批类型 | Workstream E | 已完成（已注册到 `ApprovalType`，审批中心可走审批记录流） |
| `[x]` | 新增 `overdue_release` 审批类型 | Workstream E | 已完成（已注册到 `ApprovalType`，审批中心可走审批记录流） |
| `[x]` | 新增 `low_margin_exception` 审批类型 | Workstream E | 已完成（已注册到 `ApprovalType`，审批中心可走审批记录流） |
| `[x]` | `purchase_order_execution` 增加 `qc_release_status` 等字段 | MAN-2 / Workstream E | 已完成（migration + 类型 + 映射） |
| `[x]` | `accounts_receivable` 增加 `credit_limit_usd` / `overdue_risk_level` / `credit_release_approved_by` | MAN-4 / Workstream E | 已完成（migration + 类型 + 映射） |
| `[x]` | 应收逾期未清阻断新放货 | 域 3 / Workstream E | 已完成（AR 逾期风险已接入放单阻断摘要与仓库执行页自动阻断） |
| `[x]` | 信用额度超限阻断放货 | 域 3 / Workstream E | 已完成（信用额度超限已接入放单阻断摘要与仓库执行页自动阻断） |
| `[x]` | L/C 不符点独立审批流最小闭环 | 域 3 / Workstream E | 已完成（新增 `lc_discrepancy` 审批类型、审批状态字段、审批提交/通过/驳回回写与放单阻断联动，复用既有 `ApprovalCenter`） |
| `[x]` | 封样状态机与封样失效阻断 | 域 4 / Workstream E | 已完成（新增 `seal_status / sealed_sample_* / seal_invalidated_*` 字段，接入执行状态服务，并对无有效封样的量产启动与量产状态推进做强门控） |

## F. 类型系统 / 审计 / 架构债

| 状态 | 任务 | 对应报告 | 备注 |
|---|---|---|---|
| `[x]` | `purchase_order_execution` 全字段类型补齐 | BLK-3 / ARCH-2 / Workstream C | 本轮已补入 `database.types.ts` |
| `[x]` | 补 `post_contract_task_action_logs` 类型 | ARCH-2 / Workstream C | 本轮已补入 `database.types.ts` |
| `[x]` | 补 `voyage_tracking` 类型 | ARCH-2 / Workstream C | 本轮已补入 `database.types.ts` |
| `[x]` | 补 `arrival_notice` 类型 | ARCH-2 / Workstream C | 本轮已补入 `database.types.ts`（表名实际为 `arrival_notices`） |
| `[x]` | 补 `import_clearance_coordination` 类型 | ARCH-2 / Workstream C | 本轮已补入 `database.types.ts` |
| `[x]` | 补 container loading 系列表类型 | ARCH-2 / Workstream C | 本轮已一并补入后合同核心表：装柜、订舱、清关、到港、反馈、仓储集货等类型 |
| `[x]` | 设计并落库 `audit_logs` 表 | ARCH-4 / Workstream F | 已完成（migration + 类型已落地，待后续业务接入写入） |
| `[x]` | 销售链字段级审计接入 | MAN-5 / Workstream F | 已完成（已接 `QT upsert/status`、`SC upsert/status`、`CG upsert` 关键写入口） |
| `[x]` | 拆分 `postContractExecutionServices.ts` | ARCH-1 | 已抽出 `shipmentWorkflowRiskService`（收款/放单风控 + L/C 备注解析）、`shipmentWorkflowSummaryBuilderService`（履约摘要 builder）、`purchaseOrderExecutionStatusService`（执行态读写与状态更新）、`shipmentProgressServices`（在途/到港/清关/交付/反馈）、`bookingAndShippingServices`（订舱询价/发运单）、`loadingExecutionServices`（装柜计划/装柜任务/装柜明细）、`exportDocumentationServices`（出口要求/单证/报关）、`warehouseConsolidationServices`（国内转运/收货/第三方仓/集货）；主文件已压缩到可维护范围 |

## G. 采购工作台 / 角色待办中心

| 状态 | 任务 | 对应报告 | 备注 |
|---|---|---|---|
| `[x]` | `ProcurementDashboard` 真实化整合 | Workstream P / 域 6 | `quotation-requests` 子页真实；overview 已接 PR/CG 数据、任务 section、风险摘要、协同区块与任务队列；按当前不固化新布局的约束，现阶段整合已完成 |
| `[x]` | `ProcurementDashboard` 接 `PurchaseOrderContext` | Workstream P | 已完成 |
| `[x]` | `overview` tab 改真实数据 | Workstream P | 已完成（卡片/列表已由 PR/CG 实时数据驱动） |
| `[x]` | PR 分配待办接入采购工作台 | Workstream P | 已完成（按 `pending_procurement_assignment / partial_allocated` 生成真实队列） |
| `[x]` | CG 审批待办接入采购工作台 | Workstream P | 已完成（按 `pending_manager_approval / pending_ceo_approval` 生成真实队列） |
| `[x]` | Finance 待办中心 | Workstream G | `FinanceDashboardPro` 已接真实应收/采购任务与放单风控队列；已补风险摘要与协同区块，且已抽离 `financeDashboardDataService`，并统一 `taskSections / riskItems / collaborationSections` 数据契约；按当前不固化新布局的约束，数据层与现有页面接入已完成 |
| `[x]` | QC 待办中心 | Workstream G | 已抽出 `qcTaskCenterService` 并接入真实 `purchaseOrders` 阶段流；已补风险摘要、协同区块与真实 `taskSections`；按当前不固化新布局的约束，数据层与现有页面接入已完成，完整页面消费等待后续布局设计 |
| `[x]` | Documentation 待办中心 | Workstream G | 已接真实单证派生任务源（交单/放单/到港/清关）；已补风险摘要、协同区块与真实 `taskSections`；按当前不固化新布局的约束，数据层与现有页面接入已完成，完整页面消费等待后续布局设计 |
| `[x]` | Warehouse 待办中心 | Workstream G | 已抽出 `warehouseTaskCenterService` 并接入真实装柜/放单/结案摘要；已补风险摘要、协同区块与真实 `taskSections`；按当前不固化新布局的约束，数据层与现有页面接入已完成，完整页面消费等待后续布局设计 |
| `[x]` | Order Coordinator 待办中心 | Workstream G | 已抽出 `orderCoordinatorTaskCenterService` 并接入 `OrderManagementCenterPro` 概览摘要；已补风险摘要、协同区块与真实 `taskSections`；按当前不固化新布局的约束，数据层与现有页面接入已完成，角色专属布局等待后续设计 |
| `[x]` | 角色工作台数据契约收敛 | 补充优化 | 已新增 `taskCenterContracts.ts` 统一 `collaborationSections / taskSections / riskItems / riskOverview` 契约；已补 `finalizeTaskSections()`、`finalizeCollaborationSections()`、`finalizeTaskCenterRiskItems()`、`TaskCenterDataBundle + composeTaskCenterDataBundle()`、`TaskCenterCompatFields + buildTaskCenterCompatFields()`、`buildTaskCenterRiskCountMap()`、`buildTaskCenterSectionCountMap()`，并已接入销售/采购/财务/QC/单证/仓配/跟单数据层；按当前不固化新布局的约束，数据契约收敛已完成 |
