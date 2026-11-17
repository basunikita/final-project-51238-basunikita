-- Supabase's default privileges give anon and authenticated every privilege
-- on new tables, leaving row-level security as the only gate, and TRUNCATE
-- is not covered by row-level security at all. Signed-out visitors get
-- nothing, and signed-in people keep only what the policies allow.
revoke all on table public.places from anon;
revoke all on table public.items from anon;
revoke truncate, references, trigger on table public.places from authenticated;
revoke truncate, references, trigger on table public.items from authenticated;
