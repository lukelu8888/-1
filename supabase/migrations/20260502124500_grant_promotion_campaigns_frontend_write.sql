-- Allow the frontend Supabase client to manage promotion campaign drafts/publication.
-- RLS policies still apply; this grants the required table privileges.

grant select, insert, update, delete on table public.promotion_campaigns to anon, authenticated;
