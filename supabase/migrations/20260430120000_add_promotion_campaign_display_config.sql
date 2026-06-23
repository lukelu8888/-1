-- Frontend display rules for promotion campaigns.
-- Keeps campaign business data and popup/banner placement rules together.

alter table public.promotion_campaigns
  add column if not exists display_config jsonb not null default '{}'::jsonb;

