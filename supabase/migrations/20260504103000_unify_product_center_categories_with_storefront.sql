-- ============================================================================
-- Unify Product Center categories with the storefront category tree
-- ============================================================================
-- The storefront reads public.product_category_nodes. Product Center mirrors
-- that tree in public.pc_product_categories with code = 'storefront:' || node.id.
-- Remove the temporary mock:* category tree so backend category management and
-- the public storefront operate on one canonical hierarchy.

delete from public.pc_product_categories
where code like 'mock:%';

with storefront_category_ids as (
  select array_agg(id order by level, sort_order, code) as ids
  from public.pc_product_categories
  where code like 'storefront:%'
)
update public.pc_product_attributes attr
set
  applies_to_category_ids = storefront_category_ids.ids,
  updated_at = now()
from storefront_category_ids
where attr.tenant_id = 'tenant_default'
  and attr.code in (
    'color',
    'voltage',
    'material',
    'finish',
    'power_wattage',
    'pack_size'
  );
