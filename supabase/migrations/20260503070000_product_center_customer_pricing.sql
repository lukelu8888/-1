-- ============================================================================
-- Product Management Center — Phase 5c
-- 客户分层定价 (Customer Tier Pricing) + 客户专属价 (Customer-Specific Prices)
-- ============================================================================
-- B2B 长期客户关系的钩子。三层叠加：
--
--   1. 客户专属价 pc_customer_specific_prices —— 最具体，命中即用，
--      完全覆盖任何阶梯/折扣规则。常见用于年度大单、anchor customer。
--   2. 客户等级 pc_customer_tiers —— 给客户打上「青铜/白银/黄金/白金」
--      标签，每个等级配一个全局默认折扣 %（相对公共阶梯/基准价）。
--   3. 公共阶梯 pc_product_tier_prices (Phase 5b) —— 兜底基线。
--
-- 同时建一个精简的 pc_customers 表（id, code, name, tier_id, ...）。
-- 完整客户主数据（联系人、银行账户、信用额度等）是另一个模块的职责，
-- 这里只放价格规则需要的最小字段。
-- ----------------------------------------------------------------------------

-- ─── 1. 客户等级 ──────────────────────────────────────────────────────────
create table if not exists public.pc_customer_tiers (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   text not null default public.pc_current_tenant_id(),
  code        text not null,
  name        text not null,
  -- 该等级在公共阶梯/基准价之上的默认折扣 % (0-100)，
  -- 0 表示不折扣（青铜默认 0，黄金默认 8，白金默认 12 etc.）
  default_discount_percent numeric(5,2) not null default 0
    check (default_discount_percent >= 0 and default_discount_percent <= 100),
  -- 用于 UI 徽章着色 (tailwind 类名片段，e.g. 'amber','emerald','indigo')
  badge_color text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (tenant_id, code)
);

create index if not exists idx_pc_customer_tiers_tenant
  on public.pc_customer_tiers (tenant_id, sort_order);

-- ─── 2. 客户（精简） ─────────────────────────────────────────────────────
create table if not exists public.pc_customers (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    text not null default public.pc_current_tenant_id(),
  code         text not null,                       -- 内部客户编号 e.g. C-NA-0001
  name         text not null,
  short_name   text,
  region_code  text check (region_code is null or region_code in ('NA','SA','EA')),
  tier_id      uuid references public.pc_customer_tiers(id) on delete set null,
  -- B2B 长期合同字段（默认值，单笔询盘可覆盖）
  default_incoterm        text check (
    default_incoterm is null or
    default_incoterm in ('EXW','FOB','CIF','DAP','DDP')
  ),
  default_payment_terms   text,                     -- 'TT 30%' / 'LC 60d' / 'OA 30d'
  notes        text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (tenant_id, code)
);

create index if not exists idx_pc_customers_tenant_active
  on public.pc_customers (tenant_id, is_active, name);
create index if not exists idx_pc_customers_tier
  on public.pc_customers (tier_id);

-- ─── 3. 客户专属价 ───────────────────────────────────────────────────────
create table if not exists public.pc_customer_specific_prices (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references public.pc_customers(id) on delete cascade,
  product_id    uuid not null references public.pc_products(id) on delete cascade,
  region_code   text not null check (region_code in ('NA','SA','EA')),
  min_qty       integer not null default 1 check (min_qty >= 1),
  max_qty       integer check (max_qty is null or max_qty > min_qty),
  unit_price    numeric(14,4) not null check (unit_price >= 0),
  currency      text not null default 'USD',
  incoterm      text check (incoterm is null or incoterm in ('EXW','FOB','CIF','DAP','DDP')),
  effective_from date,
  effective_to   date check (effective_to is null or effective_from is null or effective_to >= effective_from),
  is_active     boolean not null default true,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (customer_id, product_id, region_code, min_qty)
);

create index if not exists idx_pc_csp_customer_product
  on public.pc_customer_specific_prices (customer_id, product_id, region_code, min_qty);
create index if not exists idx_pc_csp_active_window
  on public.pc_customer_specific_prices (product_id, region_code, is_active);

-- ─── updated_at 触发器（复用 5b 的 touch 函数模式） ───────────────────────
create or replace function public.pc_csp_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

drop trigger if exists trg_pc_customer_tiers_updated_at on public.pc_customer_tiers;
create trigger trg_pc_customer_tiers_updated_at
  before update on public.pc_customer_tiers
  for each row execute function public.pc_csp_touch_updated_at();

drop trigger if exists trg_pc_customers_updated_at on public.pc_customers;
create trigger trg_pc_customers_updated_at
  before update on public.pc_customers
  for each row execute function public.pc_csp_touch_updated_at();

drop trigger if exists trg_pc_csp_updated_at on public.pc_customer_specific_prices;
create trigger trg_pc_csp_updated_at
  before update on public.pc_customer_specific_prices
  for each row execute function public.pc_csp_touch_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────────────────
alter table public.pc_customer_tiers enable row level security;
alter table public.pc_customers enable row level security;
alter table public.pc_customer_specific_prices enable row level security;

-- 等级 / 客户：直接按 tenant_id 比对
drop policy if exists pc_tier_select on public.pc_customer_tiers;
create policy pc_tier_select on public.pc_customer_tiers for select
  using (tenant_id = public.pc_current_tenant_id());
drop policy if exists pc_tier_write on public.pc_customer_tiers;
create policy pc_tier_write on public.pc_customer_tiers for all
  using (tenant_id = public.pc_current_tenant_id())
  with check (tenant_id = public.pc_current_tenant_id());

drop policy if exists pc_customer_select on public.pc_customers;
create policy pc_customer_select on public.pc_customers for select
  using (tenant_id = public.pc_current_tenant_id());
drop policy if exists pc_customer_write on public.pc_customers;
create policy pc_customer_write on public.pc_customers for all
  using (tenant_id = public.pc_current_tenant_id())
  with check (tenant_id = public.pc_current_tenant_id());

-- 专属价：通过父 customer 推断租户（与 5b 的 product-children 模式一致）
drop policy if exists pc_csp_select on public.pc_customer_specific_prices;
create policy pc_csp_select on public.pc_customer_specific_prices for select
  using (
    exists (
      select 1 from public.pc_customers c
      where c.id = pc_customer_specific_prices.customer_id
        and c.tenant_id = public.pc_current_tenant_id()
    )
  );
drop policy if exists pc_csp_write on public.pc_customer_specific_prices;
create policy pc_csp_write on public.pc_customer_specific_prices for all
  using (
    exists (
      select 1 from public.pc_customers c
      where c.id = pc_customer_specific_prices.customer_id
        and c.tenant_id = public.pc_current_tenant_id()
    )
  )
  with check (
    exists (
      select 1 from public.pc_customers c
      where c.id = pc_customer_specific_prices.customer_id
        and c.tenant_id = public.pc_current_tenant_id()
    )
  );

-- ─── RPC: 选价三层叠加 ────────────────────────────────────────────────
-- 输入: (product_id, region, qty, customer_id, as_of_date)
-- 输出: jsonb {
--   source: 'customer-specific' | 'tier-with-discount' | 'base-with-discount'
--           | 'tier' | 'base' | 'none',
--   unit_price (final, 应用折扣后),
--   list_price (折扣前的原价),
--   discount_percent (来自 customer.tier 的默认折扣，专属价层为 0),
--   currency, min_qty, max_qty, incoterm, tier_code, tier_name,
--   reason (none 时)
-- }
--
-- 选价优先级 (高 → 低):
--   A. 客户专属价命中 → source=customer-specific
--   B. 调 pc_get_effective_tier_price 拿到 tier 价或 base 价 →
--      如果客户有 tier，应用 tier.default_discount_percent，
--      source=tier-with-discount / base-with-discount。
--   C. 没客户 / 客户没等级 → 直接返回 5b 的结果，source=tier 或 base。
--   D. 任何路径返回 below-moq / no-region-price 则原样透传。
create or replace function public.pc_get_effective_price_for_customer(
  p_product_id   uuid,
  p_region       text,
  p_qty          integer,
  p_customer_id  uuid,
  p_as_of        date default current_date
) returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_csp        record;
  v_customer   record;
  v_tier_pct   numeric(5,2) := 0;
  v_tier_code  text;
  v_tier_name  text;
  v_tier_res   jsonb;
  v_list       numeric;
  v_final      numeric;
  v_source_in  text;
  v_source_out text;
begin
  if p_qty is null or p_qty < 1 then
    return jsonb_build_object('source','none','reason','qty-required');
  end if;

  -- A. 客户专属价命中 — 完全覆盖
  if p_customer_id is not null then
    select id, unit_price, currency, min_qty, max_qty, incoterm
      into v_csp
      from public.pc_customer_specific_prices
     where customer_id = p_customer_id
       and product_id  = p_product_id
       and region_code = p_region
       and is_active   = true
       and (effective_from is null or effective_from <= p_as_of)
       and (effective_to   is null or effective_to   >= p_as_of)
       and min_qty     <= p_qty
       and (max_qty is null or max_qty > p_qty)
     order by min_qty desc
     limit 1;

    if found then
      return jsonb_build_object(
        'source',           'customer-specific',
        'unit_price',       v_csp.unit_price,
        'list_price',       v_csp.unit_price,
        'discount_percent', 0,
        'currency',         v_csp.currency,
        'min_qty',          v_csp.min_qty,
        'max_qty',          v_csp.max_qty,
        'incoterm',         v_csp.incoterm,
        'specific_id',      v_csp.id
      );
    end if;
  end if;

  -- 取客户等级折扣 (如果客户存在且有 tier)
  if p_customer_id is not null then
    select c.tier_id, t.default_discount_percent, t.code, t.name
      into v_customer
      from public.pc_customers c
      left join public.pc_customer_tiers t on t.id = c.tier_id and t.is_active = true
     where c.id = p_customer_id and c.is_active = true;
    v_tier_pct  := coalesce(v_customer.default_discount_percent, 0);
    v_tier_code := v_customer.code;
    v_tier_name := v_customer.name;
  end if;

  -- B. 调 5b 的选价 RPC
  v_tier_res  := public.pc_get_effective_tier_price(p_product_id, p_region, p_qty, p_as_of);
  v_source_in := v_tier_res ->> 'source';

  if v_source_in = 'none' then
    -- 原样透传 (below-moq / no-region-price / qty-required)
    return v_tier_res;
  end if;

  v_list  := (v_tier_res ->> 'unit_price')::numeric;
  v_final := round(v_list * (1 - v_tier_pct/100.0), 4);

  if v_tier_pct > 0 then
    v_source_out := case v_source_in
                     when 'tier' then 'tier-with-discount'
                     when 'base' then 'base-with-discount'
                     else v_source_in
                   end;
  else
    v_source_out := v_source_in;
  end if;

  return jsonb_build_object(
    'source',           v_source_out,
    'unit_price',       v_final,
    'list_price',       v_list,
    'discount_percent', v_tier_pct,
    'currency',         v_tier_res ->> 'currency',
    'min_qty',          (v_tier_res ->> 'min_qty')::int,
    'max_qty',          case when v_tier_res ? 'max_qty' and (v_tier_res ->> 'max_qty') is not null
                              then (v_tier_res ->> 'max_qty')::int else null end,
    'incoterm',         v_tier_res ->> 'incoterm',
    'tier_id',          v_tier_res ->> 'tier_id',
    'customer_tier_code', v_tier_code,
    'customer_tier_name', v_tier_name
  );
end;
$$;

comment on function public.pc_get_effective_price_for_customer(uuid, text, integer, uuid, date) is
  'Phase 5c: 三层叠加选价 — 客户专属 > 阶梯+客户等级折扣 > 基准+客户等级折扣。';
