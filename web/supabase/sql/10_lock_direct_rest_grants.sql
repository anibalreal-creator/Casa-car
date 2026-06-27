-- Lock direct PostgREST access to sensitive tables.
-- Casa-Car exposes public data through sanitized API routes, not raw table reads.

revoke select, insert, update, delete on table public.listings from anon, authenticated;
revoke select, insert, update, delete on table public.ad_campaigns from anon, authenticated;
revoke select, insert, update, delete on table public.messages from anon, authenticated;
revoke select, insert, update, delete on table public.consultas_anuncio from anon, authenticated;
revoke select, insert, update, delete on table public.anuncio_fotos from anon, authenticated;
revoke select, insert, update, delete on table public.payment_events from anon, authenticated;
revoke select, insert, update, delete on table public.subscriptions from anon, authenticated;
revoke select, insert, update, delete on table public.profiles from anon, authenticated;
revoke select, insert, update, delete on table public.favorites from anon, authenticated;
revoke select, insert, update, delete on table public.favoritos from anon, authenticated;
revoke select, insert, update, delete on table public.saved_searches from anon, authenticated;
revoke select, insert, update, delete on table public.presence_heartbeats from anon, authenticated;
revoke select, insert, update, delete on table public.analytics_events from anon, authenticated;
revoke select, insert, update, delete on table public.listing_events from anon, authenticated;

-- This table intentionally contains only public plan metadata.
grant select on table public.featured_plans to anon, authenticated;
