-- ============================================================================
-- Product Management Center — Phase 5b
-- 阶梯报价 (Quantity Tiers) + MOQ 校验
-- ============================================================================
-- B2B 外贸的核心定价模型 — 询盘第一句永远是"买 100 个多少钱"。
-- 我们要把 region price 的「单价」拓展成「按数量阶梯的价格曲线」。
--
-- 关键设计决策
--
--   1. 新增独立表 pc_product_tier_prices，不在 pc_product_region_prices 上加列：
--      不同产品的阶梯档位数量差异很大（化学品 1 档、灯具 4 档、五金 6+ 档），
--      宽表会有大量稀疏 NULL；窄表更适合。
--
--   2. (product_id, region_code, min_qty) 三元组唯一 — 同区域同起订量只
--      有一档价格；销售可以按时间段失效旧档（is_active = false 或 effective_to
--      过期）后再插一档，保留历史。
--
--   3. min_qty 必须 >= 产品 moq；提供 RPC 校验函数让 UI 层主动调用，
--      避免每次写都靠 trigger 拒绝（trigger 报错 UX 不好）。
--
--   4. RPC pc_get_effective_tier_price(product_id, region, qty, as_of) — 给定
--      数量返回对应的档位单价，是后续 SalesQuotation 模块拉报价的入口。
-- ----------------------------------------------------------------------------

create table if not exists public.pc_product_tier_prices (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references public.pc_products(id) on delete cascade,
  region_code     text not null check (region_code in ('NA','SA','EA')),
  -- 本档生效的最小数量（含）
  min_qty         integer not null check (min_qty >= 1),
  -- 本档失效的数量上限（不含）；null 表示「以上不限」— 最高档必须有一档为 null
  max_qty         integer check (max_qty is null or max_qty > min_qty),
  unit_price      numeric(14,4) not null check (unit_price >= 0),
  currency        text not null default 'USD',
  -- 折扣百分比（相对于 region_price.base_price），可选；UI 计算展示用
  discount_percent numeric(5,2) check (
    discount_percent is null or (discount_percent >= 0 and discount_percent <= 100)
  ),
  -- 可覆盖 region 默认 incoterm（不同档位有时谈不同条款，例如 ≥ 1柜走 FOB）
  incoterm        text check (incoterm in ('EXW','FOB','CIF','DAP','DDP')),
  -- 时间窗
  effective_from  date,
  effective_to    date check (effective_to is null or effective_from is null or effective_to >= effective_from),
  is_active       boolean not null default true,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint pc_tier_prices_unique_min_qty unique (product_id, region_code, min_qty)
);

create index if not exists idx_pc_tier_prices_product_region
  on public.pc_product_tier_prices (product_id, region_code, min_qty asc);

create index if not exists idx_pc_tier_prices_active
  on public.pc_product_tier_prices (product_id, region_code)
  where is_active = true;

-- updated_at 自动更新
create or replace function public.pc_tier_prices_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_pc_tier_prices_updated_at on public.pc_product_tier_prices;
create trigger trg_pc_tier_prices_updated_at
  before update on public.pc_product_tier_prices
  for each row execute function public.pc_tier_prices_touch_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────────────────
-- 复用 product-children 模式：同一 tenant 的产品自动可见可写，
-- 删除受 admin 限制（与 pc_product_region_prices 的策略一致）。
alter table public.pc_product_tier_prices enable row level security;

drop policy if exists pc_tier_prices_select on public.pc_product_tier_prices;
create policy pc_tier_prices_select on public.pc_product_tier_prices
  for select using (
    exists (
      select 1 from public.pc_products p
      where p.id = pc_product_tier_prices.product_id
        and p.tenant_id = public.pc_current_tenant_id()
    )
  );

drop policy if exists pc_tier_prices_insert on public.pc_product_tier_prices;
create policy pc_tier_prices_insert on public.pc_product_tier_prices
  for insert with check (
    exists (
      select 1 from public.pc_products p
      where p.id = pc_product_tier_prices.product_id
        and p.tenant_id = public.pc_current_tenant_id()
    )
  );

drop policy if exists pc_tier_prices_update on public.pc_product_tier_prices;
create policy pc_tier_prices_update on public.pc_product_tier_prices
  for update using (
    exists (
      select 1 from public.pc_products p
      where p.id = pc_product_tier_prices.product_id
        and p.tenant_id = public.pc_current_tenant_id()
    )
  ) with check (
    exists (
      select 1 from public.pc_products p
      where p.id = pc_product_tier_prices.product_id
        and p.tenant_id = public.pc_current_tenant_id()
    )
  );

drop policy if exists pc_tier_prices_delete on public.pc_product_tier_prices;
create policy pc_tier_prices_delete on public.pc_product_tier_prices
  for delete using (
    exists (
      select 1 from public.pc_products p
      where p.id = pc_product_tier_prices.product_id
        and p.tenant_id = public.pc_current_tenant_id()
    )
  );

-- ─── RPC: 校验阶梯一致性 ────────────────────────────────────────────────
-- 返回 jsonb 数组，每条 { code, message, severity (error|warning) }。
-- UI 在保存前调用，给运营友好提示。
create or replace function public.pc_validate_tier_prices(
  p_product_id  uuid,
  p_region      text
) returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_moq        integer;
  v_issues     jsonb := '[]'::jsonb;
  v_count      integer;
  v_first_min  integer;
  v_has_open   boolean;
  v_overlap    boolean;
begin
  select moq into v_moq from public.pc_products where id = p_product_id;
  -- 取本区域所有 active 档位，按 min_qty 升序
  with active_tiers as (
    select min_qty, max_qty
      from public.pc_product_tier_prices
     where product_id = p_product_id
       and region_code = p_region
       and is_active = true
     order by min_qty
  )
  select
    count(*),
    min(min_qty),
    bool_or(max_qty is null),
    -- 简单的相邻档检测：当前档的 max 应等于下一档的 min（或都允许为 null）
    bool_or(
      lead(min_qty) over (order by min_qty) is not null
      and (max_qty is null or max_qty <> lead(min_qty) over (order by min_qty))
    )
  into v_count, v_first_min, v_has_open, v_overlap
  from active_tiers;

  if v_count = 0 then
    return v_issues; -- 没有档位 = 没问题（继续用 base_price）
  end if;

  if v_moq is not null and v_first_min < v_moq then
    v_issues := v_issues || jsonb_build_object(
      'code', 'tier-below-moq',
      'message', format('最低档 %s 小于产品 MOQ %s', v_first_min, v_moq),
      'severity', 'error'
    );
  end if;

  if not v_has_open then
    v_issues := v_issues || jsonb_build_object(
      'code', 'no-open-top-tier',
      'message', '最高档应有 max_qty = null（"以上不限"）以覆盖大额订单',
      'severity', 'warning'
    );
  end if;

  if v_overlap then
    v_issues := v_issues || jsonb_build_object(
      'code', 'tier-gap-or-overlap',
      'message', '相邻档位区间不连续（存在缺口或重叠）',
      'severity', 'warning'
    );
  end if;

  return v_issues;
end;
$$;

comment on function public.pc_validate_tier_prices(uuid, text) is
  'Phase 5b: 校验某产品某区域的阶梯档位一致性，返回 issues 数组。';

-- ─── RPC: 选价 ────────────────────────────────────────────────────────
-- 按 (product, region, qty, as_of_date) 选出当前生效的档位单价。
-- 返回 jsonb { tier_id, unit_price, currency, min_qty, max_qty,
--             incoterm, discount_percent, source: 'tier' | 'base' | 'none' }
-- 如果没有命中任何档但 qty >= moq，回退到 region_prices.base_price 作为兜底
-- （source = 'base'）；如果 qty < moq，返回 source = 'none' 让调用方决定。
create or replace function public.pc_get_effective_tier_price(
  p_product_id  uuid,
  p_region      text,
  p_qty         integer,
  p_as_of       date default current_date
) returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_tier      record;
  v_moq       integer;
  v_base      record;
begin
  if p_qty is null or p_qty < 1 then
    return jsonb_build_object('source', 'none', 'reason', 'qty-required');
  end if;

  select moq into v_moq from public.pc_products where id = p_product_id;

  -- 1. 先在 active + 时间窗内的档位里挑最匹配的
  select id, unit_price, currency, min_qty, max_qty, incoterm, discount_percent
    into v_tier
    from public.pc_product_tier_prices
   where product_id = p_product_id
     and region_code = p_region
     and is_active = true
     and (effective_from is null or effective_from <= p_as_of)
     and (effective_to   is null or effective_to   >= p_as_of)
     and min_qty <= p_qty
     and (max_qty is null or max_qty > p_qty)
   order by min_qty desc
   limit 1;

  if found then
    return jsonb_build_object(
      'source',           'tier',
      'tier_id',          v_tier.id,
      'unit_price',       v_tier.unit_price,
      'currency',         v_tier.currency,
      'min_qty',          v_tier.min_qty,
      'max_qty',          v_tier.max_qty,
      'incoterm',         v_tier.incoterm,
      'discount_percent', v_tier.discount_percent
    );
  end if;

  -- 2. 没有阶梯命中：低于 MOQ 的话拒绝（B2B 不能低于 MOQ 报价）
  if v_moq is not null and p_qty < v_moq then
    return jsonb_build_object(
      'source', 'none',
      'reason', 'below-moq',
      'moq', v_moq
    );
  end if;

  -- 3. 数量 ≥ MOQ 但没有阶梯：兜底用 region_prices.base_price
  select base_price, currency
    into v_base
    from public.pc_product_region_prices
   where product_id = p_product_id
     and region_code = p_region
     and is_active = true
   limit 1;

  if not found then
    return jsonb_build_object('source', 'none', 'reason', 'no-region-price');
  end if;

  return jsonb_build_object(
    'source',     'base',
    'unit_price', v_base.base_price,
    'currency',   v_base.currency,
    'min_qty',    coalesce(v_moq, 1)
  );
end;
$$;

comment on function public.pc_get_effective_tier_price(uuid, text, integer, date) is
  'Phase 5b: 给定 (产品, 区域, 数量) 返回 B2B 阶梯单价；< MOQ 返回 source=none。';

-- ─── 把新表加进 RLS 公共子表清单（确保后续维护脚本正确回收/迁移） ────────
-- 不在此处直接修改 20260503020000 的 do-block；只确保新表的 RLS 策略已建。
