# 业务员待办中心 V1 Migration 草案

## 一、目的

这份 migration 草案只服务于：

- **业务员待办中心 V1**

目标是把前面已经确认的数据模型，落成最小可执行的数据库结构建议。

本草案只覆盖：

1. `sales_follow_up_logs`
2. `sales_customer_reply_logs`

可选扩展：

3. `sales_follow_up_plans`

---

## 二、落地原则

### 1. 不做通用待办表

V1 不创建：

- `sales_todos`
- `task_center_items`
- `unified_tasks`

原因：

- 容易重新走回“通用待办系统”
- 和业务员待办中心的角色特征不匹配

### 2. 只落日志和回复

V1 先把：

- 业务员跟进动作
- 客户回复

落库。

待办项本身继续从真实业务链实时聚合。

### 3. 所有状态类字段使用 TEXT + CHECK

保持和当前项目的规范一致。

---

## 三、表一：sales_follow_up_logs

## 3.1 用途

记录业务员对某个客户、某个业务单做过的真实跟进动作。

---

## 3.2 建表建议

```sql
create table if not exists sales_follow_up_logs (
  id uuid primary key default gen_random_uuid(),

  sales_user_id text,
  sales_user_email text not null,

  customer_id text,
  customer_name_snapshot text not null default '',
  customer_company_snapshot text not null default '',

  doc_type text not null check (
    doc_type in ('ING', 'QR', 'QT', 'SC', 'SHIPMENT', 'POST_DELIVERY')
  ),
  doc_id text not null,
  doc_no_snapshot text not null default '',

  related_ing_id text,
  related_qt_id text,
  related_sc_id text,
  related_shipment_id text,

  current_stage_snapshot text not null default '',
  current_node_snapshot text not null default '',

  action_code text not null check (
    action_code in (
      'contacted_customer',
      'completed_ing_clarification',
      'pushed_to_qr',
      'chased_qr_feedback',
      'sent_qt',
      'chased_qt_feedback',
      'sent_sc',
      'chased_sc_signing',
      'chased_customer_deposit',
      'sent_inspection_report',
      'chased_third_party_inspection',
      'chased_third_party_supervision',
      'chased_customer_payment',
      'confirmed_freight_schedule',
      'notified_arrival',
      'chased_clearance_docs',
      'confirmed_receipt',
      'invited_feedback',
      'recorded_customer_reply',
      'scheduled_follow_up',
      'closed_no_follow_up_needed'
    )
  ),
  action_label_snapshot text not null default '',

  note text,
  customer_reply_summary text,
  next_follow_up_at timestamptz,

  triggered_status_change boolean not null default false,
  triggered_field_name text,
  triggered_field_value text,

  created_at timestamptz not null default now(),
  created_by text
);
```

---

## 3.3 索引建议

```sql
create index if not exists idx_sales_follow_up_logs_sales_user_email
  on sales_follow_up_logs (sales_user_email);

create index if not exists idx_sales_follow_up_logs_customer_id
  on sales_follow_up_logs (customer_id);

create index if not exists idx_sales_follow_up_logs_doc_type_doc_id
  on sales_follow_up_logs (doc_type, doc_id);

create index if not exists idx_sales_follow_up_logs_created_at
  on sales_follow_up_logs (created_at desc);

create index if not exists idx_sales_follow_up_logs_next_follow_up_at
  on sales_follow_up_logs (next_follow_up_at);
```

---

## 3.4 字段说明

### 快照字段

以下字段明确是快照字段：

- `customer_name_snapshot`
- `customer_company_snapshot`
- `doc_no_snapshot`
- `current_stage_snapshot`
- `current_node_snapshot`
- `action_label_snapshot`

原因：

- 业务员跟进日志需要保留当时语义
- 即使客户名、单号、节点文案后续调整，历史日志也不应被污染

### 触发回写字段

以下字段用于审计动作是否联动了真实业务节点：

- `triggered_status_change`
- `triggered_field_name`
- `triggered_field_value`

V1 不要求复杂 JSON 审计结构，先用简单字段即可。

---

## 四、表二：sales_customer_reply_logs

## 4.1 用途

记录客户真实回复，与业务员动作分开建模。

---

## 4.2 建表建议

```sql
create table if not exists sales_customer_reply_logs (
  id uuid primary key default gen_random_uuid(),

  customer_id text,
  customer_name_snapshot text not null default '',
  customer_company_snapshot text not null default '',

  doc_type text not null check (
    doc_type in ('ING', 'QT', 'SC', 'SHIPMENT', 'POST_DELIVERY')
  ),
  doc_id text not null,
  doc_no_snapshot text not null default '',

  reply_channel text not null check (
    reply_channel in ('portal', 'email', 'whatsapp', 'wechat', 'phone', 'manual')
  ),
  reply_type text not null check (
    reply_type in (
      'qt_confirmed',
      'qt_negotiating',
      'sc_confirmed',
      'inspection_mode_selected',
      'third_party_inspection_arranged',
      'third_party_supervision_arranged',
      'payment_promised',
      'arrival_acknowledged',
      'clearance_doc_promised',
      'receipt_confirmed',
      'feedback_submitted',
      'general_reply'
    )
  ),

  reply_summary text not null default '',
  raw_reply_text text,

  requires_follow_up boolean not null default true,
  follow_up_due_at timestamptz,

  created_at timestamptz not null default now(),
  created_by text
);
```

---

## 4.3 索引建议

```sql
create index if not exists idx_sales_customer_reply_logs_customer_id
  on sales_customer_reply_logs (customer_id);

create index if not exists idx_sales_customer_reply_logs_doc_type_doc_id
  on sales_customer_reply_logs (doc_type, doc_id);

create index if not exists idx_sales_customer_reply_logs_created_at
  on sales_customer_reply_logs (created_at desc);

create index if not exists idx_sales_customer_reply_logs_follow_up_due_at
  on sales_customer_reply_logs (follow_up_due_at);
```

---

## 4.4 字段说明

### 快照字段

以下字段是快照字段：

- `customer_name_snapshot`
- `customer_company_snapshot`
- `doc_no_snapshot`

### 回复类型字段

`reply_type` 不是通用客服枚举，而是专门服务业务员待办中心的业务回复类型。

目的：

- 能直接生成“最近客户回复”
- 能判断是否要生成新的待办
- 能为右侧辅助栏和详情抽屉提供稳定来源

---

## 五、可选表三：sales_follow_up_plans

## 5.1 是否建议在 V1 落地

建议：

- **先不强制**

原因：

- `next_follow_up_at` 先放在 `sales_follow_up_logs` 就够支撑 V1
- 先把业务员待办中心做出来更重要

如果后续需要更强的“未来待办计划”能力，再在 V1.1 或 V2 补。

---

## 5.2 如果需要的建表建议

```sql
create table if not exists sales_follow_up_plans (
  id uuid primary key default gen_random_uuid(),

  sales_user_id text,
  sales_user_email text not null,

  customer_id text,
  customer_name_snapshot text not null default '',
  customer_company_snapshot text not null default '',

  doc_type text not null check (
    doc_type in ('ING', 'QR', 'QT', 'SC', 'SHIPMENT', 'POST_DELIVERY')
  ),
  doc_id text not null,
  doc_no_snapshot text not null default '',

  plan_type text not null check (
    plan_type in ('follow_up', 'payment_chase', 'reply_check', 'arrival_check', 'feedback_invite')
  ),
  planned_at timestamptz not null,
  reason text,

  status text not null default 'open' check (
    status in ('open', 'done', 'cancelled', 'expired')
  ),
  completed_at timestamptz,
  completed_by_log_id uuid references sales_follow_up_logs(id),

  created_at timestamptz not null default now(),
  created_by text
);
```

---

## 六、是否需要 RLS / 权限边界

V1 至少需要考虑这个边界：

- 业务员只能看到与自己相关的跟进日志
- 销售经理可看到团队范围
- 销售总监可看到区域/全局范围

所以后续如果落到 Supabase，建议按：

- `sales_user_email`
- 当前登录用户角色

做访问限制。

本草案先不展开 RLS 细节，但建表时必须预留：

- `sales_user_id`
- `sales_user_email`

---

## 七、与真实业务对象的关系

## 7.1 不新增业务主对象

本草案不创建新的业务主对象来代替：

- `ING`
- `QT`
- `SC`
- `purchase_order_execution`
- `voyage_tracking`
- `arrival_notices`
- `delivery_confirmations`
- `post_order_feedback`

待办中心仍然依赖这些真实对象。

## 7.2 新增的是“行为层”

新增表只承载：

- 业务员行为
- 客户回复
- 可选的未来跟进计划

所以这是行为层，不是业务主链替代层。

---

## 八、V1 建议落地顺序

### 第一步

先落：

- `sales_follow_up_logs`
- `sales_customer_reply_logs`

### 第二步

在服务层做实时聚合：

- `ING`
- `QT`
- `SC`
- 付款/到港/收货/反馈

### 第三步

页面只先接：

- 顶部动作条
- 主执行表
- 最近客户回复
- 最近跟进记录
- 详情抽屉动作

### 第四步

如果业务员明确需要“未来计划表”，再补：

- `sales_follow_up_plans`

---

## 九、最终判断标准

只要 migration 方案满足以下 4 点，就说明没有走偏：

1. 只服务业务员待办中心
2. 不做通用待办主表
3. 能承载真实跟进日志与客户回复
4. 保持待办项来自真实业务链实时聚合

如果后续 migration 开始变成：

- 通用任务中心
- 所有角色共用一套待办主表

就说明已经偏离目标。
