# ERP V2.2 KPI 口径树

## 1. 目标

这份口径树只做第一版基础收口，目标不是一次性做完所有 BI，而是先解决三件事：

1. 同一个指标在不同工作台里不再各自定义。
2. 审批治理与执行治理新增字段能进入统一统计口径。
3. 后续仪表盘、预警、报表、审计接入时有单一来源。

当前代码基础：

- 口径目录服务：[erpKpiDefinitionService.ts](/Users/luke/Documents/New%20project%202/innoshop_react20260221/src/lib/services/erpKpiDefinitionService.ts)
- 快照服务：[erpKpiSnapshotService.ts](/Users/luke/Documents/New%20project%202/innoshop_react20260221/src/lib/services/erpKpiSnapshotService.ts)

## 2. 设计原则

1. 先统一“纳入/排除规则”，再谈展示。
2. 一个指标只认一张主表和一套主时间字段。
3. ERP V2.2 新增治理字段必须进入 KPI 口径，而不是只停留在审批页面。
4. 先做 `count / sum` 级别的稳定指标，比例类指标后续再基于这些基础指标推导。

## 3. 口径树

### 3.1 询盘域

| 指标 | 主表 | 主时间字段 | 纳入口径 | 排除口径 |
|---|---|---|---|---|
| 已提交询盘数 | `inquiries` | `submitted_at` | `is_submitted = true`；历史兼容 `status != draft` | 纯草稿询盘 |

### 3.2 QT 报价域

| 指标 | 主表 | 主时间字段 | 纳入口径 | 排除口径 |
|---|---|---|---|---|
| QT 待审批数 | `sales_quotations` | `updated_at` | `approval_status in (pending_approval, pending_supervisor, pending_director)` | 已批准、已驳回、已撤回 |
| QT 已批准数 | `sales_quotations` | `qt_last_approval_at` | `approval_status = approved` | 非 approved |
| QT 特价数 | `sales_quotations` | `updated_at` | `qt_type = special_price` 或 `special_price_flag = true` | 其他类型 |
| QT 特殊付款数 | `sales_quotations` | `updated_at` | `qt_type = special_payment` 或 `special_payment_terms_flag = true` | 其他类型 |
| QT 战略客户数 | `sales_quotations` | `updated_at` | `strategic_customer_flag = true` | 非战略客户 |

### 3.3 SC 合同域

| 指标 | 主表 | 主时间字段 | 纳入口径 | 排除口径 |
|---|---|---|---|---|
| SC 待审批数 | `sales_contracts` | `updated_at` | `status in (pending_approval, pending_supervisor, pending_director)` | 已批准、已驳回、已发送客户 |
| SC 有效合同数 | `sales_contracts` | `approved_at` | `status in (approved, sent_to_customer, customer_confirmed)` | 非有效状态 |
| SC 例外条款数 | `sales_contracts` | `updated_at` | `exceptional_clause_flag = true` | 无例外条款 |
| SC 特殊账期数 | `sales_contracts` | `updated_at` | `special_account_period_flag = true` | 常规账期 |
| SC 战略客户数 | `sales_contracts` | `updated_at` | `strategic_customer_flag = true` | 非战略客户 |

### 3.4 审批域

| 指标 | 主表 | 主时间字段 | 纳入口径 | 排除口径 |
|---|---|---|---|---|
| 统一待审批数 | `approval_records` | `created_at` | `status = pending` | 非 pending |

### 3.5 应收域

| 指标 | 主表 | 主时间字段 | 纳入口径 | 排除口径 |
|---|---|---|---|---|
| 应收未清笔数 | `accounts_receivable` | `due_date` | `status != paid` 或 `remaining_amount > 0` | 已结清 |
| 应收未清金额 | `accounts_receivable` | `due_date` | 对未清记录汇总 `remaining_amount` | 已结清金额 |
| 应收逾期笔数 | `accounts_receivable` | `due_date` | `status != paid` 且 `due_date < today` | 未到期或已结清 |

### 3.6 执行治理域

| 指标 | 主表 | 主时间字段 | 纳入口径 | 排除口径 |
|---|---|---|---|---|
| L/C 不符点待审批数 | `purchase_order_execution` | `lc_discrepancy_approval_requested_at` | `lc_discrepancy_approval_status = pending` | 非 pending |
| L/C 不符点未闭环数 | `purchase_order_execution` | `lc_discrepancy_recorded_at` | `lc_discrepancy_status in (open, pending, raised)` | 已 approved / not_required |
| 封样失效数 | `purchase_order_execution` | `seal_invalidated_at` | `seal_status = invalidated` | 非 invalidated |
| 封样阻断数 | `purchase_order_execution` | `updated_at` | `sample_required = true` 且 `seal_status in (not_sealed, pending_confirmation, invalidated)` | `seal_status in (confirmed, not_required)` |

## 4. V2.2 新增字段如何进入 KPI

本轮新治理字段已经纳入口径，不再只是存档字段：

| 字段 | 进入的口径 |
|---|---|
| `sales_quotations.qt_type` | QT 特价数 / 特殊付款数 / 战略客户数 |
| `sales_quotations.qt_last_approval_at` | QT 已批准数主时间字段 |
| `sales_contracts.sc_type` | SC 分类统计基础 |
| `sales_contracts.sc_last_approval_at` | SC 有效合同与审批时点核对 |
| `purchase_order_execution.lc_discrepancy_approval_status` | L/C 不符点待审批数 |
| `purchase_order_execution.seal_status` | 封样失效数 / 封样阻断数 |

## 5. 当前已知边界

1. 现有很多 dashboard 仍在使用 mock KPI，不应直接视为正式口径。
2. 目前第一版快照服务只输出稳定的实时计数/金额，不输出同比、环比、目标完成率。
3. `notifications` 表当前历史类型字段有兼容差异，暂不纳入第一版 KPI 口径树。
4. 真实 `purchase_order_execution` 业务样本还少，执行治理域指标已具备取数能力，但长期趋势要等样本积累。
5. 当前已支持全局视角、区域视角，以及当前登录业务员本人的 KPI 快照透传；国家、客户和手工指定其他业务员仍保留回退值。

## 6. 下一步建议

1. 继续把更多 dashboard 从 mock 值切到快照服务，优先补区域经理/业务员视角的稳定卡片。
2. 继续把财务类口径（`revenue / cost / profit_margin / payables / avg_order_value`）纳入统一快照。
3. 在 `audit_logs` 上接第二层字段级审计，解决“指标异常时如何追变更来源”的问题。
