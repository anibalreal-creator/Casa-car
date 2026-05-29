-- Casa-Car FINAL EXCELLENCE FOUNDATION
-- Ejecutar por partes en Supabase SQL editor si tu proyecto ya tiene tablas previas.

create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key,
  email text,
  display_name text,
  role text default 'user' check (role in ('admin','empresa','vendedor','user')),
  verified boolean default false,
  created_at timestamptz default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  plan text default 'FREE' check (plan in ('FREE','PRO','BUSINESS','INMOBILIARIA','CONCESIONARIA')),
  active boolean default false,
  expires_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  slot text not null,
  banner_url text not null,
  target_url text,
  plan text default 'FREE',
  budget numeric default 0,
  status text default 'draft',
  impressions integer default 0,
  clicks integer default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists listing_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null,
  reporter_user_id uuid not null,
  reason text not null,
  details text,
  status text default 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  filters jsonb default '{}'::jsonb,
  notify_email boolean default true,
  notify_whatsapp boolean default false,
  created_at timestamptz default now()
);

create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  entity_type text,
  entity_id text,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table ad_campaigns enable row level security;
alter table listing_reports enable row level security;
alter table saved_searches enable row level security;
alter table analytics_events enable row level security;

-- Profiles
DROP POLICY IF EXISTS "profiles read own" ON profiles;
create policy "profiles read own" on profiles for select using (auth.uid() = id);
DROP POLICY IF EXISTS "profiles update own" ON profiles;
create policy "profiles update own" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Subscriptions
DROP POLICY IF EXISTS "subscriptions read own" ON subscriptions;
create policy "subscriptions read own" on subscriptions for select using (auth.uid() = user_id);
DROP POLICY IF EXISTS "subscriptions insert own" ON subscriptions;
create policy "subscriptions insert own" on subscriptions for insert with check (auth.uid() = user_id);

-- Campaigns
DROP POLICY IF EXISTS "campaigns read own" ON ad_campaigns;
create policy "campaigns read own" on ad_campaigns for select using (auth.uid() = user_id);
DROP POLICY IF EXISTS "campaigns insert own" ON ad_campaigns;
create policy "campaigns insert own" on ad_campaigns for insert with check (auth.uid() = user_id);
DROP POLICY IF EXISTS "campaigns update own" ON ad_campaigns;
create policy "campaigns update own" on ad_campaigns for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Reports
DROP POLICY IF EXISTS "reports read own" ON listing_reports;
create policy "reports read own" on listing_reports for select using (auth.uid() = reporter_user_id);
DROP POLICY IF EXISTS "reports insert own" ON listing_reports;
create policy "reports insert own" on listing_reports for insert with check (auth.uid() = reporter_user_id);

-- Saved searches
DROP POLICY IF EXISTS "saved searches read own" ON saved_searches;
create policy "saved searches read own" on saved_searches for select using (auth.uid() = user_id);
DROP POLICY IF EXISTS "saved searches insert own" ON saved_searches;
create policy "saved searches insert own" on saved_searches for insert with check (auth.uid() = user_id);
DROP POLICY IF EXISTS "saved searches delete own" ON saved_searches;
create policy "saved searches delete own" on saved_searches for delete using (auth.uid() = user_id);

-- Analytics (server only recomendable; esta policy permite lectura si luego la necesitás para admin)
DROP POLICY IF EXISTS "analytics deny all" ON analytics_events;
create policy "analytics deny all" on analytics_events for select using (false);

create index if not exists idx_ad_campaigns_user_status on ad_campaigns(user_id, status);
create index if not exists idx_listing_reports_listing on listing_reports(listing_id, status);
create index if not exists idx_saved_searches_user on saved_searches(user_id, created_at desc);
create index if not exists idx_analytics_events_name_created on analytics_events(event_name, created_at desc);
