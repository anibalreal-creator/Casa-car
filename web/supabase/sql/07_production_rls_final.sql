-- Casa-Car production RLS final hardening.
-- Run in Supabase SQL editor after applying schema migrations.

alter table if exists public.profiles enable row level security;
alter table if exists public.listings enable row level security;
alter table if exists public.favorites enable row level security;
alter table if exists public.saved_searches enable row level security;
alter table if exists public.subscriptions enable row level security;
alter table if exists public.payments enable row level security;
alter table if exists public.ad_campaigns enable row level security;
alter table if exists public.reviews enable row level security;
alter table if exists public.reports enable row level security;
alter table if exists public.verification_requests enable row level security;
alter table if exists public.tourism_reservations enable row level security;
alter table if exists public.presence_heartbeats enable row level security;

drop policy if exists "profiles own read" on public.profiles;
create policy "profiles own read" on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "listings public active read" on public.listings;
create policy "listings public active read" on public.listings for select using (status = 'active' or auth.uid() = user_id);

drop policy if exists "listings own insert" on public.listings;
create policy "listings own insert" on public.listings for insert with check (auth.uid() = user_id);

drop policy if exists "listings own update" on public.listings;
create policy "listings own update" on public.listings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "listings own delete" on public.listings;
create policy "listings own delete" on public.listings for delete using (auth.uid() = user_id);

drop policy if exists "favorites own read" on public.favorites;
create policy "favorites own read" on public.favorites for select using (auth.uid() = user_id);

drop policy if exists "favorites own insert" on public.favorites;
create policy "favorites own insert" on public.favorites for insert with check (auth.uid() = user_id);

drop policy if exists "favorites own delete" on public.favorites;
create policy "favorites own delete" on public.favorites for delete using (auth.uid() = user_id);

drop policy if exists "saved searches own" on public.saved_searches;
create policy "saved searches own" on public.saved_searches for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "subscriptions own read" on public.subscriptions;
create policy "subscriptions own read" on public.subscriptions for select using (auth.uid() = user_id);

drop policy if exists "payments own read" on public.payments;
create policy "payments own read" on public.payments for select using (auth.uid() = user_id);

drop policy if exists "campaigns own read" on public.ad_campaigns;
create policy "campaigns own read" on public.ad_campaigns for select using (auth.uid() = user_id);

drop policy if exists "campaigns own insert" on public.ad_campaigns;
create policy "campaigns own insert" on public.ad_campaigns for insert with check (auth.uid() = user_id);

drop policy if exists "campaigns own update" on public.ad_campaigns;
create policy "campaigns own update" on public.ad_campaigns for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "reviews public read" on public.reviews;
create policy "reviews public read" on public.reviews for select using (true);

drop policy if exists "reviews authenticated insert" on public.reviews;
-- Reviews are written through the server API with the service role.
-- Direct browser inserts stay closed because existing Casa-Car schemas differ.
create policy "reviews authenticated insert" on public.reviews for insert with check (false);

do $$
begin
  if to_regclass('public.reports') is not null then
    execute 'drop policy if exists "reports own insert" on public.reports';
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'reports' and column_name = 'reporter_id'
    ) then
      execute 'create policy "reports own insert" on public.reports for insert with check (auth.uid() = reporter_id)';
    else
      execute 'create policy "reports own insert" on public.reports for insert with check (false)';
    end if;
  end if;

  if to_regclass('public.verification_requests') is not null then
    execute 'drop policy if exists "verification own read" on public.verification_requests';
    execute 'drop policy if exists "verification own insert" on public.verification_requests';
    execute 'create policy "verification own read" on public.verification_requests for select using (auth.uid() = user_id)';
    execute 'create policy "verification own insert" on public.verification_requests for insert with check (auth.uid() = user_id)';
  end if;

  if to_regclass('public.tourism_reservations') is not null then
    execute 'drop policy if exists "tourism reservations insert public" on public.tourism_reservations';
    execute 'drop policy if exists "tourism reservations owner read" on public.tourism_reservations';
    execute 'drop policy if exists "tourism reservations owner update" on public.tourism_reservations';
    execute 'create policy "tourism reservations insert public" on public.tourism_reservations for insert with check (true)';
    execute 'create policy "tourism reservations owner read" on public.tourism_reservations for select using (exists (select 1 from public.listings l where l.id = tourism_reservations.listing_id and l.user_id = auth.uid()))';
    execute 'create policy "tourism reservations owner update" on public.tourism_reservations for update using (exists (select 1 from public.listings l where l.id = tourism_reservations.listing_id and l.user_id = auth.uid())) with check (exists (select 1 from public.listings l where l.id = tourism_reservations.listing_id and l.user_id = auth.uid()))';
  end if;

  if to_regclass('public.presence_heartbeats') is not null then
    execute 'drop policy if exists "presence deny public select" on public.presence_heartbeats';
    execute 'drop policy if exists "presence deny public insert" on public.presence_heartbeats';
    execute 'create policy "presence deny public select" on public.presence_heartbeats for select using (false)';
    execute 'create policy "presence deny public insert" on public.presence_heartbeats for insert with check (false)';
  end if;
end $$;
