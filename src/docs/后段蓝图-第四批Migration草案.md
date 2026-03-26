# 后段蓝图第四批 Migration 草案

## 1. 范围

本草案只覆盖后段蓝图主线A的最终节点：

- `客户线上产品反馈`

注意：

- 这不是前段“客户确认合同/订单”的 feedback
- 这是交付完成或结案之后，客户在线上对产品、包装、交付体验的反馈

---

## 2. 为什么单独建模

当前系统里已经有一些 `customer_feedback` 字段，但它们主要用于：

- 客户接受 / 拒绝 / 协商报价或合同

这和后段蓝图里的终点不是一回事。

后段主线最终节点需要记录的是：

- 产品满意度
- 包装满意度
- 交付满意度
- 是否有质量问题
- 是否愿意复购
- 是否愿意推荐
- 文字评价
- 图片/附件

所以要单独建真实表，不复用旧前段 feedback 字段。

---

## 3. Migration 命名建议

建议新建：

- `20260321090004_create_post_order_feedback.sql`

---

## 4. 建表草案

```sql
create table if not exists public.post_order_feedback (
  id                       uuid primary key default gen_random_uuid(),
  feedback_no              text not null unique,
  sales_contract_id        uuid,
  purchase_order_id        uuid references public.purchase_orders(id) on delete set null,
  shipment_no              text,
  voyage_id                uuid references public.voyage_tracking(id) on delete set null,
  delivery_confirmation_id uuid references public.delivery_confirmations(id) on delete set null,
  customer_id              text,
  customer_name            text not null default '',
  feedback_channel         text not null default 'customer_portal',
  feedback_status          text not null default 'submitted',
  product_rating           integer,
  packaging_rating         integer,
  delivery_rating          integer,
  service_rating           integer,
  overall_rating           integer,
  quality_issue_flag       boolean not null default false,
  packaging_issue_flag     boolean not null default false,
  delivery_issue_flag      boolean not null default false,
  reorder_intent           text,
  recommend_intent         text,
  feedback_text            text,
  attachments              jsonb not null default '[]'::jsonb,
  submitted_at             timestamptz not null default now(),
  submitted_by             text,
  reviewed_by              text,
  reviewed_at              timestamptz,
  internal_summary         text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint chk_post_order_feedback_status check (
    feedback_status in ('submitted', 'reviewed', 'archived')
  ),
  constraint chk_post_order_feedback_channel check (
    feedback_channel in ('customer_portal', 'admin_entry', 'sales_entry')
  ),
  constraint chk_post_order_feedback_rating_product check (
    product_rating is null or product_rating between 1 and 5
  ),
  constraint chk_post_order_feedback_rating_packaging check (
    packaging_rating is null or packaging_rating between 1 and 5
  ),
  constraint chk_post_order_feedback_rating_delivery check (
    delivery_rating is null or delivery_rating between 1 and 5
  ),
  constraint chk_post_order_feedback_rating_service check (
    service_rating is null or service_rating between 1 and 5
  ),
  constraint chk_post_order_feedback_rating_overall check (
    overall_rating is null or overall_rating between 1 and 5
  )
);
```

---

## 5. 主线挂接

主线A尾部应调整为：

`客户收货`
-> `交付异常处理 / 客诉`
-> `结案`
-> `客户线上产品反馈`
-> `业务归档完成`

`post_order_feedback` 就是这个最终节点的真实落点。

---

## 6. 与旧字段关系

旧字段：

- `customer_feedback`

旧字段保留用于：

- 客户对报价/合同/订单确认的反馈

新表：

- `post_order_feedback`

新表用于：

- 交付完成后的客户体验反馈
- 产品评价
- 售后复盘
- 复购意向

两者不能混用。
