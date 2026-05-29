-- Casa-Car Reset PRO + UUID clean schema
-- WARNING: this resets core marketplace tables.
-- Run only if you want a clean, aligned SaaS schema.

create extension if not exists pgcrypto;

begin;

-- Drop dependent policies first where relevant
alter table if exists public.favorites disable row level security;
alter table if exists public.listings disable row level security;
alter table if exists public.ad_campaigns disable row level security;
alter table if exists public.subscriptions disable row level security;
alter table if exists public.payments disable row level security;
alter table if exists public.presence_heartbeats disable row level security;
alter table if exists public.reviews disable row level security;
alter table if exists public.reports disable row level security;
alter table if exists public.saved_searches disable row level security;

-- Drop and recreate core tables cleanly with UUIDs

drop table if exists public.reports cascade;
drop table if exists public.reviews cascade;
drop table if exists public.favorites cascade;
drop table if exists public.saved_searches cascade;
drop table if exists public.presence_heartbeats cascade;
drop table if exists public.payments cascade;
drop table if exists public.subscriptions cascade;
drop table if exists public.ad_campaigns cascade;
drop table if exists public.listings cascade;
drop table if exists public.verification_requests cascade;
drop table if exists public.profiles cascade;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  role text not null default 'user' check (role in ('admin','empresa','vendedor','user')),
  verified boolean not null default false,
  display_name text,
  avatar_url text,
  whatsapp text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  subcategory text,
  operation text,
  country text,
  province text,
  city text,
  price numeric(14,2),
  currency text default 'USD',
  status text not null default 'draft' check (status in ('draft','active','paused','expired','archived')),
  premium boolean not null default false,
  premium_until timestamptz,
  expires_at timestamptz,
  cover_image text,
  images jsonb not null default '[]'::jsonb,
  attributes jsonb not null default '{}'::jsonb,
  views_count integer not null default 0,
  whatsapp_clicks integer not null default 0,
  mail_clicks integer not null default 0,
  chats_count integer not null default 0,
  contact_email text,
  contact_phone text,
  contact_name text,
  slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index listings_user_idx on public.listings(user_id);
create index listings_status_idx on public.listings(status);
create index listings_category_idx on public.listings(category);
create index listings_location_idx on public.listings(country, province, city);

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, listing_id)
);

create table public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  query jsonb not null default '{}'::jsonb,
  notifications_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'basic' check (plan in ('basic','pro','empresa','inmobiliaria','concesionaria','owner')),
  status text not null default 'active' check (status in ('active','canceled','expired','pending')),
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  quota_listings integer not null default 3,
  analytics_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('listing','ad','subscription')),
  reference_id uuid,
  mp_preference_id text,
  mp_payment_id text,
  amount numeric(14,2),
  currency text default 'ARS',
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  title text,
  description text,
  banner_url text,
  target_url text,
  plan text not null default 'basic' check (plan in ('basic','premium','destacado')),
  slot text not null default 'home_media',
  status text not null default 'pending' check (status in ('pending','active','paused','expired','draft')),
  starts_at timestamptz,
  ends_at timestamptz,
  impressions integer not null default 0,
  clicks integer not null default 0,
  contact_email text,
  contact_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ad_campaigns_user_idx on public.ad_campaigns(user_id);
create index ad_campaigns_status_idx on public.ad_campaigns(status);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(listing_id, reviewer_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now()
);

create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text,
  document_url text,
  notes text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create table public.presence_heartbeats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  session_key text,
  path text,
  is_authenticated boolean not null default false,
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index presence_heartbeats_last_seen_idx on public.presence_heartbeats(last_seen desc);
create index presence_heartbeats_user_idx on public.presence_heartbeats(user_id);

-- owner mode only for requested email
insert into public.profiles (id, email, role, verified, display_name)
select id, email, 'admin', true, 'Anibal Real'
from auth.users
where lower(email) = 'anibalreal@hotmail.com'
on conflict (id) do update set
  email = excluded.email,
  role = 'admin',
  verified = true,
  display_name = excluded.display_name,
  updated_at = now();

insert into public.subscriptions (user_id, plan, status, quota_listings, analytics_enabled)
select id, 'owner', 'active', 9999, true
from auth.users
where lower(email) = 'anibalreal@hotmail.com'
on conflict do nothing;

-- helper functions
create or replace function public.increment_campaign_impressions(campaign_uuid uuid)
returns void
language sql
security definer
as $$
  update public.ad_campaigns
  set impressions = coalesce(impressions, 0) + 1,
      updated_at = now()
  where id = campaign_uuid;
$$;

create or replace function public.increment_campaign_clicks(campaign_uuid uuid)
returns void
language sql
security definer
as $$
  update public.ad_campaigns
  set clicks = coalesce(clicks, 0) + 1,
      updated_at = now()
  where id = campaign_uuid;
$$;

create or replace view public.owner_live_metrics as
select
  (select count(*) from public.presence_heartbeats where last_seen > now() - interval '5 minutes') as online_now,
  (select count(distinct coalesce(user_id::text, email, session_key)) from public.presence_heartbeats where last_seen::date = current_date) as unique_today,
  (select count(distinct user_id) from public.presence_heartbeats where is_authenticated = true and last_seen > now() - interval '5 minutes') as authenticated_now,
  (select count(distinct user_id) from public.presence_heartbeats where is_authenticated = true and last_seen::date = current_date) as authenticated_today;

-- RLS
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.favorites enable row level security;
alter table public.saved_searches enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.ad_campaigns enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;
alter table public.verification_requests enable row level security;
alter table public.presence_heartbeats enable row level security;

create policy "profiles self read" on public.profiles for select using (auth.uid() = id);
create policy "profiles self update" on public.profiles for update using (auth.uid() = id);

create policy "listings public active read" on public.listings for select using (status = 'active');
create policy "listings own read" on public.listings for select using (auth.uid() = user_id);
create policy "listings own write" on public.listings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "favorites own read" on public.favorites for select using (auth.uid() = user_id);
create policy "favorites own write" on public.favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "saved searches own" on public.saved_searches for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "subscriptions own read" on public.subscriptions for select using (auth.uid() = user_id);
create policy "payments own read" on public.payments for select using (auth.uid() = user_id);
create policy "payments own insert" on public.payments for insert with check (auth.uid() = user_id);
create policy "campaigns own read" on public.ad_campaigns for select using (auth.uid() = user_id);
create policy "campaigns own write" on public.ad_campaigns for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reviews public read" on public.reviews for select using (true);
create policy "reviews authenticated insert" on public.reviews for insert with check (auth.uid() = reviewer_id);
create policy "reports own insert" on public.reports for insert with check (auth.uid() = reporter_id);
create policy "verification own read" on public.verification_requests for select using (auth.uid() = user_id);
create policy "verification own insert" on public.verification_requests for insert with check (auth.uid() = user_id);
create policy "presence own insert" on public.presence_heartbeats for insert with check (auth.uid() = user_id or user_id is null);
create policy "presence own read" on public.presence_heartbeats for select using (auth.uid() = user_id);

commit;
