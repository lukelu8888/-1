-- Base website prices should not create promotions.
-- Promotion UI treats compare_at_price > sale_price as a deal signal, so clear
-- compare_at_price for products that are not explicitly published as deals.

update public.product_prices pp
set
  compare_at_price = null,
  updated_at = now()
where pp.price_type = 'website'
  and pp.region_code = 'NA'
  and coalesce(pp.compare_at_price, 0) > 0
  and not exists (
    select 1
    from public.product_publications pub
    where pub.product_id = pp.product_id
      and coalesce(pub.region_code, 'NA') = 'NA'
      and pub.publish_type in ('deal', 'bulk-container')
      and pub.publish_status = 'published'
  );
