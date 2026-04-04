# ERP V2.2 环境执行与验数清单

本文档用于把 ERP V2.2 本轮已完成的代码闭环推进到环境闭环。

适用范围：

- QT 审批 5 类触发条件
- SC 审批精细化治理
- L/C 不符点独立审批流
- 封样状态机与封样失效阻断
- 全局审计表 `audit_logs`

## 1. 当前远端迁移状态

本地已通过 `supabase migration list` 确认，远端当前已完成以下 migration：

| 状态 | Migration | 用途 |
|---|---|---|
| `[x]` | `20260404134500_create_audit_logs.sql` | 全局字段级审计底座 |
| `[x]` | `20260404153000_add_qt_sc_governance_fields.sql` | QT / SC 审批治理字段 |
| `[x]` | `20260404154500_add_lc_discrepancy_and_seal_governance_fields.sql` | L/C 不符点审批字段 + 封样状态机字段 |
| `[x]` | `20260404162000_backfill_qt_sc_governance_fields.sql` | 历史 QT / SC 治理标签与最近审批时间回填 |
| `[x]` | `20260404170000_grant_purchase_order_execution_and_audit_logs_access.sql` | 补齐 `purchase_order_execution / audit_logs` 的 API 访问授权 |
| `[x]` | `20260404174000_grant_deadline_escalation_table_access.sql` | 补齐超时升级真跑所需 `inquiries / purchase_orders / notifications` 的 API 访问授权 |
| `[x]` | `20260404181000_grant_purchase_orders_service_role_write.sql` | 补齐受控执行样本验证所需 `purchase_orders` 写权限 |

## 2. 执行顺序

已执行顺序：

1. `20260404134500_create_audit_logs.sql`
2. `20260404153000_add_qt_sc_governance_fields.sql`
3. `20260404154500_add_lc_discrepancy_and_seal_governance_fields.sql`
4. `20260404162000_backfill_qt_sc_governance_fields.sql`
5. `20260404170000_grant_purchase_order_execution_and_audit_logs_access.sql`
6. `20260404174000_grant_deadline_escalation_table_access.sql`
7. `20260404181000_grant_purchase_orders_service_role_write.sql`

原因：

- `audit_logs` 是独立底座，先落不影响业务表
- `20260404162000` 依赖 `20260404153000` 中新增的 QT / SC 字段
- L/C / 封样字段与回填无直接依赖，但建议与 QT / SC 字段同批次完成

## 3. 执行方式

推荐方式：

```bash
supabase db push
```

如果只需要先确认待执行项：

```bash
supabase migration list
```

说明：

- 远端库已完成推送，当前重点转为第 4 节验数与抽样
- anon REST 业务行结果可能因 RLS 被裁成空数组；这种情况下只能证明表与字段可达，不能替代真正的 SQL 验数
- 当前已通过 service-role 视角完成第一轮远端验数
- 仓库已新增远端验数脚本：`npm run erp:v22:validate-remote`
- 如需同时补一条审计验证样本，可执行：`ERP_V22_INSERT_AUDIT_SAMPLE=1 npm run erp:v22:validate-remote`
- 仓库已新增执行层验证样本脚本：`npm run erp:v22:execution-sample`
- 该脚本默认仅输出 `plan`，只有显式设置确认变量才允许 `create / cleanup`

## 4. 验数 SQL

### 4.1 确认字段已存在

```sql
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'sales_quotations'
  and column_name in (
    'qt_type',
    'special_price_flag',
    'special_price_reason',
    'special_payment_terms_flag',
    'strategic_customer_flag',
    'qt_last_approval_at'
  )
order by column_name;
```

```sql
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'sales_contracts'
  and column_name in (
    'sc_type',
    'exceptional_clause_flag',
    'exceptional_clause_notes',
    'special_account_period_flag',
    'strategic_customer_flag',
    'sc_last_approval_at'
  )
order by column_name;
```

```sql
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'purchase_order_execution'
  and column_name in (
    'lc_discrepancy_notes',
    'lc_discrepancy_approval_status',
    'lc_discrepancy_approval_requested_at',
    'lc_discrepancy_approved_at',
    'lc_discrepancy_rejected_at',
    'seal_status',
    'sealed_sample_ref',
    'sealed_sample_uploaded_at',
    'sealed_sample_confirmed_at',
    'seal_invalidated_at',
    'seal_invalidated_reason'
  )
order by column_name;
```

### 4.2 QT / SC 历史回填是否生效

```sql
select
  qt_type,
  count(*) as row_count
from public.sales_quotations
group by qt_type
order by row_count desc, qt_type asc;
```

```sql
select
  sc_type,
  count(*) as row_count
from public.sales_contracts
group by sc_type
order by row_count desc, sc_type asc;
```

```sql
select
  count(*) filter (where approval_status = 'approved' and qt_last_approval_at is null) as approved_qt_missing_last_approval_at,
  count(*) filter (where status in ('approved', 'sent', 'customer_confirmed', 'production', 'shipped', 'completed') and sc_last_approval_at is null) as active_sc_missing_last_approval_at
from public.sales_quotations qt
cross join public.sales_contracts sc
limit 1;
```

如果你担心上面这条 cross join 不直观，也可以拆开分别执行：

```sql
select count(*) as approved_qt_missing_last_approval_at
from public.sales_quotations
where approval_status = 'approved'
  and qt_last_approval_at is null;
```

```sql
select count(*) as active_sc_missing_last_approval_at
from public.sales_contracts
where status in ('approved', 'sent', 'customer_confirmed', 'production', 'shipped', 'completed')
  and sc_last_approval_at is null;
```

### 4.3 L/C 不符点与封样状态分布

```sql
select
  lc_discrepancy_status,
  lc_discrepancy_approval_status,
  count(*) as row_count
from public.purchase_order_execution
group by lc_discrepancy_status, lc_discrepancy_approval_status
order by row_count desc;
```

```sql
select
  seal_status,
  count(*) as row_count
from public.purchase_order_execution
group by seal_status
order by row_count desc, seal_status asc;
```

### 4.4 审计表是否可用

```sql
select
  to_regclass('public.audit_logs') as audit_logs_table,
  count(*) as current_row_count
from public.audit_logs;
```

### 4.5 当前已完成的远端验数结果

截至 2026-04-04，已通过 service-role 口径确认：

| 状态 | 验数项 | 当前结果 | 备注 |
|---|---|---|---|
| `[x]` | 已批准 QT 缺 `qt_last_approval_at` 数量 | `0` | 当前已批准 QT 没有遗漏最近审批时间 |
| `[x]` | 活跃 SC 缺 `sc_last_approval_at` 数量 | `0` | 发现 1 条当日新批合同缺口后，已补平并修正代码入口 |
| `[x]` | QT 类型分布 | `regular = 4`, `special_price = 2` | 当前远端样本量较小，但字段与分布已可读 |
| `[x]` | SC 类型分布 | `regular = 1` | 当前远端样本量较小，但字段与分布已可读 |
| `[x]` | `purchase_order_execution` API 访问 | 已恢复 | 原先 `permission denied`，现已通过 grant migration 打通 |
| `[x]` | `audit_logs` API 访问 | 已恢复 | 原先 `permission denied`，现已通过 grant migration 打通 |
| `[x]` | `purchase_order_execution` 受控样本验证 | 已完成 | 2026-04-04 已创建并清理 1 条带标记样本，验证过 `seal_status = invalidated / lc_discrepancy_status = open / lc_discrepancy_approval_status = pending` |
| `[~]` | `purchase_order_execution` 状态分布 | 当前为 `0` 行 | 受控样本已清理，说明共享环境当前仍没有真实执行业务样本 |
| `[x]` | `audit_logs` 当前行数 | `1` | 已通过远端验数脚本插入 1 条 `erp_v22_environment_validation` 样本 |
| `[x]` | 超时升级真跑 | 已通过 | 2026-04-04 已完成真实写库验证，`scanned = 75`、`enqueued = 65`、`deduped = 82`、`failures = []` |
| `[~]` | GitHub Actions 托管环境复跑 | 待触发 | 当前本机无 GitHub Actions 触发凭据；建议按 `超时升级调度方案.md` 中的托管环境参数在仓库 `lukelu8888/-1` 的 `main@45c591d7` 上手工触发 |

## 5. 抽样验收建议

每类至少抽样 2 到 3 条：

### QT

- 低毛利或显式特价单，确认 `qt_type = special_price`
- 含 OA / DA / D/P / 账期条款的单，确认 `qt_type = special_payment`
- 大额单，确认 `qt_type = large_amount`

### SC

- 有 `exceptional_clause_notes` 的单，确认 `sc_type = exceptional_clause`
- 有特殊账期的单，确认 `sc_type = special_account_period`
- 大额单，确认 `sc_type = large_amount`

### L/C

- `lc_discrepancy_status in ('open', 'pending', 'raised')` 的单，确认已带 `lc_discrepancy_approval_status`
- 已解决或豁免的单，确认审批状态已进入 `approved`

### 封样

- `sample_required = false` 的单，确认 `seal_status = not_required`
- 已封样确认的单，确认 `seal_status = confirmed`
- 历史封样失效的单，确认 `seal_status = invalidated`

## 5.1 受控验证样本工具

当远端 `purchase_orders / purchase_order_execution` 没有真实业务样本时，可使用以下工具准备一条带明确标记的验证样本：

```bash
npm run erp:v22:execution-sample -- plan
```

如需真正创建远端验证样本，必须显式确认：

```bash
ERP_V22_REMOTE_SAMPLE_CONFIRM=CREATE_REMOTE_SAMPLE npm run erp:v22:execution-sample -- create
```

验证完成后，可用以下命令清理：

```bash
ERP_V22_REMOTE_SAMPLE_CONFIRM=DELETE_REMOTE_SAMPLE npm run erp:v22:execution-sample -- cleanup
```

约束：

- 样本统一使用标记 `erp_v22_execution_validation_sample`
- 默认不写远端，避免误伤共享环境
- 适用于 L/C 不符点与封样状态分布验证，不建议长期保留

## 6. 真正算完成的标准

只有以下 4 项都满足，才能把本轮环境闭环也算完成：

| 状态 | 项目 | 当前判断 | 备注 |
|---|---|---|---|
| `[x]` | 7 条 migration 已上远端 | 已完成 | 已通过 `supabase migration list` 确认远端与本地一致 |
| `[x]` | 第一轮远端验数已打通 | 已完成 | 已通过 service-role 视角确认 QT / SC 关键字段与缺失量，并确认 `purchase_order_execution / audit_logs` 可访问 |
| `[~]` | QT / SC / L/C / 封样各抽样 2 到 3 条 | 待补真实样本 | 当前 QT / SC 可抽样；L/C / 封样已通过 1 条受控样本完成功能验证，但共享环境仍没有真实执行业务样本 |
| `[x]` | 超时升级真跑一轮 | 已完成 | 已通过本地 service-role 真跑完成一次真实写库验证 |
