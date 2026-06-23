# SC-PR-CG Schema Migration Checklist

## 目标

把当前暂存于：

- `sales_contracts.document_render_meta.erpWorkflow`
- `purchase_orders.document_render_meta.procurementWorkflow`

里的兼容状态字段，迁移为正式数据库列，形成这条主线的稳定状态源：

- `SC`: 审批线 / 执行线 / 付款线
- `PR`: 单据类型 / 执行线
- `CG`: 单据类型 / 审批线 / 执行线

本清单只覆盖 `SC -> PR -> CG`，不扩散到后段 QC、订舱、发货。

---

## 一、现状结论

### 1. `sales_contracts`

当前已有：

- `status`
- `approval_flow`
- `approval_history`
- `deposit_proof`
- `deposit_confirmed_by`
- `deposit_confirmed_at`
- `purchase_order_numbers`
- `payment_mode`
- `balance_trigger`

当前缺失正式列：

- `approval_status`
- `execution_status`
- `payment_status_deposit`
- `payment_status_balance`

当前已通过服务层兼容写入：

- `document_render_meta.erpWorkflow.approvalStatus`
- `document_render_meta.erpWorkflow.executionStatus`
- `document_render_meta.erpWorkflow.paymentStatusDeposit`
- `document_render_meta.erpWorkflow.paymentStatusBalance`

### 2. `purchase_orders`

当前已有：

- `procurement_request_status`
- `pr_validation_status`
- `parent_request_po_number`
- `cg_type`

当前缺失正式列：

- `document_type`
- `approval_status`
- `execution_status`

当前已通过服务层兼容写入：

- `document_render_meta.procurementWorkflow.documentType`
- `document_render_meta.procurementWorkflow.approvalStatus`
- `document_render_meta.procurementWorkflow.executionStatus`

---

## 二、第一批正式加列

### A. `public.sales_contracts`

建议新增：

```sql
alter table public.sales_contracts
  add column if not exists approval_status text,
  add column if not exists execution_status text,
  add column if not exists payment_status_deposit text,
  add column if not exists payment_status_balance text;
```

建议约束：

```sql
alter table public.sales_contracts
  drop constraint if exists sales_contracts_approval_status_check,
  add constraint sales_contracts_approval_status_check
  check (
    approval_status is null or
    approval_status in ('draft', 'pending_l1', 'pending_l2', 'approved', 'rejected')
  ),
  drop constraint if exists sales_contracts_execution_status_check,
  add constraint sales_contracts_execution_status_check
  check (
    execution_status is null or
    execution_status in (
      'draft',
      'sent_to_customer',
      'customer_confirmed',
      'awaiting_deposit',
      'deposit_uploaded',
      'deposit_confirmed',
      'in_procurement',
      'in_pre_production',
      'in_production',
      'qc_pending',
      'qc_passed',
      'awaiting_balance',
      'balance_uploaded',
      'balance_confirmed',
      'ready_to_ship',
      'shipped',
      'delivered',
      'completed',
      'cancelled'
    )
  ),
  drop constraint if exists sales_contracts_payment_status_deposit_check,
  add constraint sales_contracts_payment_status_deposit_check
  check (
    payment_status_deposit is null or
    payment_status_deposit in ('not_required', 'pending', 'uploaded', 'confirmed')
  ),
  drop constraint if exists sales_contracts_payment_status_balance_check,
  add constraint sales_contracts_payment_status_balance_check
  check (
    payment_status_balance is null or
    payment_status_balance in ('not_due', 'pending', 'uploaded', 'confirmed')
  );
```

建议索引：

```sql
create index if not exists idx_sales_contracts_approval_status
  on public.sales_contracts (approval_status);

create index if not exists idx_sales_contracts_execution_status
  on public.sales_contracts (execution_status);
```

### B. `public.purchase_orders`

建议新增：

```sql
alter table public.purchase_orders
  add column if not exists document_type text,
  add column if not exists approval_status text,
  add column if not exists execution_status text;
```

建议约束：

```sql
alter table public.purchase_orders
  drop constraint if exists purchase_orders_document_type_check,
  add constraint purchase_orders_document_type_check
  check (
    document_type is null or
    document_type in ('PR', 'CG')
  ),
  drop constraint if exists purchase_orders_approval_status_check,
  add constraint purchase_orders_approval_status_check
  check (
    approval_status is null or
    approval_status in ('draft', 'pending_l1', 'pending_l2', 'approved', 'rejected', 'not_required')
  ),
  drop constraint if exists purchase_orders_execution_status_check,
  add constraint purchase_orders_execution_status_check
  check (
    execution_status is null or
    execution_status in (
      'draft',
      'initiated',
      'pending_assignment',
      'partially_allocated',
      'fully_allocated',
      'approved',
      'pushed_to_supplier',
      'supplier_confirmed',
      'pre_production_sample_pending',
      'pre_production_sample_sent',
      'awaiting_sample_confirmation',
      'sample_confirmed',
      'production_in_progress',
      'supplier_self_inspection_submitted',
      'qc_pending',
      'qc_passed',
      'qc_failed',
      'finished_goods_ready',
      'awaiting_loading',
      'loaded',
      'closed',
      'cancelled'
    )
  );
```

建议索引：

```sql
create index if not exists idx_purchase_orders_document_type
  on public.purchase_orders (document_type);

create index if not exists idx_purchase_orders_approval_status
  on public.purchase_orders (approval_status);

create index if not exists idx_purchase_orders_execution_status
  on public.purchase_orders (execution_status);
```

---

## 三、回填顺序

### Step 1. 回填 `sales_contracts`

规则：

1. 若 `document_render_meta.erpWorkflow` 中已有新字段，优先使用
2. 否则从旧 `status` 推导
3. 再补齐定金/余款付款线

建议回填逻辑：

```sql
update public.sales_contracts
set
  approval_status =
    coalesce(
      nullif(document_render_meta #>> '{erpWorkflow,approvalStatus}', ''),
      case
        when status = 'draft' then 'draft'
        when status = 'pending_supervisor' then 'pending_l1'
        when status = 'pending_director' then 'pending_l2'
        when status in ('approved', 'sent', 'customer_confirmed', 'deposit_uploaded', 'deposit_confirmed', 'po_generated', 'production', 'balance_confirmed', 'shipped', 'completed') then 'approved'
        when status = 'rejected' then 'rejected'
        else null
      end
    ),
  execution_status =
    coalesce(
      nullif(document_render_meta #>> '{erpWorkflow,executionStatus}', ''),
      case
        when status = 'sent' then 'sent_to_customer'
        when status = 'customer_confirmed' then 'customer_confirmed'
        when status = 'deposit_uploaded' then 'deposit_uploaded'
        when status = 'deposit_confirmed' then 'deposit_confirmed'
        when status = 'po_generated' then 'in_procurement'
        when status = 'production' then 'in_production'
        when status = 'balance_confirmed' then 'balance_confirmed'
        when status = 'shipped' then 'shipped'
        when status = 'completed' then 'completed'
        when status = 'cancelled' then 'cancelled'
        else 'draft'
      end
    ),
  payment_status_deposit =
    coalesce(
      nullif(document_render_meta #>> '{erpWorkflow,paymentStatusDeposit}', ''),
      case
        when deposit_confirmed_at is not null then 'confirmed'
        when deposit_proof is not null then 'uploaded'
        when coalesce(deposit_percentage, 0) <= 0 and coalesce(deposit_amount, 0) <= 0 then 'not_required'
        else 'pending'
      end
    ),
  payment_status_balance =
    coalesce(
      nullif(document_render_meta #>> '{erpWorkflow,paymentStatusBalance}', ''),
      case
        when status in ('balance_confirmed', 'shipped', 'completed') then 'confirmed'
        else 'not_due'
      end
    )
where true;
```

### Step 2. 回填 `purchase_orders`

规则：

1. 若 `document_render_meta.procurementWorkflow` 中已有字段，优先使用
2. 否则从 `procurement_request_status` 推导
3. 再用 `po_number / parent_request_po_number` 做兜底

建议回填逻辑：

```sql
update public.purchase_orders
set
  document_type =
    coalesce(
      nullif(document_render_meta #>> '{procurementWorkflow,documentType}', ''),
      case
        when procurement_request_status in ('pending_procurement_assignment', 'partial_allocated', 'allocated_completed') then 'PR'
        when procurement_request_status in ('draft_allocated', 'pending_manager_approval', 'pending_ceo_approval', 'approved_boss', 'rejected_boss', 'pushed_supplier') then 'CG'
        when po_number like 'PR-%' then 'PR'
        else 'CG'
      end
    ),
  approval_status =
    coalesce(
      nullif(document_render_meta #>> '{procurementWorkflow,approvalStatus}', ''),
      case
        when procurement_request_status in ('pending_procurement_assignment', 'partial_allocated', 'allocated_completed') then 'not_required'
        when procurement_request_status = 'draft_allocated' then 'draft'
        when procurement_request_status = 'pending_manager_approval' then 'pending_l1'
        when procurement_request_status = 'pending_ceo_approval' then 'pending_l2'
        when procurement_request_status in ('approved_boss', 'pushed_supplier') then 'approved'
        when procurement_request_status = 'rejected_boss' then 'rejected'
        else null
      end
    ),
  execution_status =
    coalesce(
      nullif(document_render_meta #>> '{procurementWorkflow,executionStatus}', ''),
      case
        when procurement_request_status = 'pending_procurement_assignment' then 'pending_assignment'
        when procurement_request_status = 'partial_allocated' then 'partially_allocated'
        when procurement_request_status = 'allocated_completed' then 'fully_allocated'
        when procurement_request_status = 'draft_allocated' then 'draft'
        when procurement_request_status = 'approved_boss' then 'approved'
        when procurement_request_status = 'pushed_supplier' then 'pushed_to_supplier'
        else null
      end
    )
where true;
```

---

## 四、代码切换顺序

### Phase A. 双写

保持当前已完成状态：

- 服务层继续写 `document_render_meta`
- 同时开始写正式列

涉及文件：

- `src/lib/services/contractOrderArServices.ts`
- `src/contexts/SalesContractContext.tsx`
- `src/lib/services/purchaseOrderQuoteRequirementServices.ts`
- `src/contexts/PurchaseOrderContext.tsx`

### Phase B. 读正式列优先

读顺序改成：

1. 顶层正式列
2. `document_render_meta`
3. 老字段兼容推导

涉及文件：

- `src/lib/customerPortalContractStatus.ts`
- `src/components/admin/PurchaseOrderManagementEnhanced.tsx`
- `src/components/admin/purchase-order/PurchaseOrdersTab.tsx`
- `src/components/admin/purchase-order/ProcurementRequestsTab.tsx`
- `src/lib/services/procurementDashboardDataService.ts`
- `src/lib/services/qcTaskCenterService.ts`
- `src/lib/services/orderCoordinatorTaskCenterService.ts`

### Phase C. 收口旧字段

当正式列稳定后：

- `sales_contracts.status` 继续保留，但只做兼容主状态
- `purchase_orders.procurement_request_status` 继续保留，但逐步退化成 legacy 兼容字段
- `document_render_meta.erpWorkflow / procurementWorkflow` 只保留过渡值，不再作为主状态源

---

## 五、`database.types.ts` 必补项

### `sales_contracts.Row`

需新增：

```ts
approval_status: string | null;
execution_status: string | null;
payment_status_deposit: string | null;
payment_status_balance: string | null;
```

### `purchase_orders.Row`

需新增：

```ts
document_type: string | null;
approval_status: string | null;
execution_status: string | null;
```

---

## 六、验收清单

### A. 数据验收

- [ ] `sales_contracts` 新列存在
- [ ] `purchase_orders` 新列存在
- [ ] 存量数据已完成回填
- [ ] 新建 SC / PR / CG 自动双写正式列

### B. 代码验收

- [ ] 客户侧订单状态优先读取 `sales_contracts.execution_status`
- [ ] 财务侧不会通过旧余款字段误驱动客户执行状态
- [ ] PR 列表优先读取 `purchase_orders.document_type='PR'`
- [ ] CG 审批列表优先读取 `purchase_orders.approval_status`
- [ ] CG 执行列表优先读取 `purchase_orders.execution_status`

### C. 业务验收

- [ ] `deposit_confirmed -> in_procurement`
- [ ] `PR fully_allocated -> 可生成 CG`
- [ ] `CG approved -> 可下推供应商`
- [ ] `CG pushed_to_supplier -> 不等于 In Production`
- [ ] `production_in_progress -> 客户侧 In Production`

---

## 七、建议迁移顺序

1. 新建 migration：给 `sales_contracts / purchase_orders` 加正式列
2. 新建 migration：回填正式列
3. 更新 `database.types.ts`
4. 服务层开始正式列 + `document_render_meta` 双写
5. 页面和任务中心改成正式列优先读取
6. 观察一轮真实业务流转
7. 再决定何时弱化 `document_render_meta` 中的 workflow 字段

---

## 八、当前结论

这份清单可以直接作为下一批 migration 的执行底稿。

当前不建议立刻删除：

- `sales_contracts.status`
- `purchase_orders.procurement_request_status`
- `document_render_meta.erpWorkflow`
- `document_render_meta.procurementWorkflow`

正确做法是：

先加正式列，双写、回填、切读，再逐步退化旧字段。
