-- ============================================================
-- Add consolidation receiving and warehouse settlement fields
-- 范围：多供应商集货到同一装柜点时的承运商联系、接收信息、仓库结算
-- ============================================================

alter table public.domestic_transfer_orders
  add column if not exists carrier_contact_name text,
  add column if not exists carrier_contact_phone text,
  add column if not exists carrier_contact_email text,
  add column if not exists receiver_contact_name text,
  add column if not exists receiver_contact_phone text,
  add column if not exists warehouse_name text,
  add column if not exists warehouse_type text,
  add column if not exists warehouse_address text,
  add column if not exists warehouse_settlement_party text,
  add column if not exists warehouse_settlement_currency text not null default 'CNY',
  add column if not exists warehouse_settlement_amount numeric not null default 0,
  add column if not exists warehouse_settlement_status text not null default 'pending';

comment on column public.domestic_transfer_orders.carrier_contact_name is
  'Primary carrier / domestic logistics contact person for consolidation transfer.';

comment on column public.domestic_transfer_orders.receiver_contact_name is
  'Named receiver at the consolidation warehouse / supplier / self-operated warehouse.';

comment on column public.domestic_transfer_orders.warehouse_name is
  'Actual receiving warehouse or factory used as consolidation point.';

comment on column public.domestic_transfer_orders.warehouse_type is
  'factory | supplier_warehouse | third_party_warehouse | self_operated_warehouse';

comment on column public.domestic_transfer_orders.warehouse_settlement_party is
  'Who settles with the receiving warehouse / consolidation point.';

comment on column public.domestic_transfer_orders.warehouse_settlement_status is
  'pending | confirmed | paid';
