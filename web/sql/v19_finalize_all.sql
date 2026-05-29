-- Casa-Car v19 final completion pack
-- Ejecutar este script DESPUÉS de v17_reset_campaigns_and_analytics.sql
-- Objetivo: dejar columnas y tablas clave alineadas para el proyecto final.

create extension if not exists pgcrypto;

-- profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text
);

alter table profiles add column if not exists email text;
alter table profiles add column if not exists role text default 'user';

-- listings
create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  description text,
  status text default 'active',
  is_premium boolean default false,
  expires_at timestamptz,
  created_at timestamptz default now()
);

alter table listings add column if not exists status text default 'active';
alter table listings add column if not exists is_premium boolean default false;
alter table listings add column if not exists expires_at timestamptz;
alter table listings add column if not exists created_at timestamptz default now();

-- ad_campaigns
create table if not exists ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  company_name text,
  title text,
  banner_url text,
  slot text,
  status text default 'active',
  impressions integer default 0,
  clicks integer default 0,
  contact_email text,
  contact_phone text,
  starts_at timestamptz default now(),
  ends_at timestamptz,
  created_at timestamptz default now()
);

alter table ad_campaigns add column if not exists company_name text;
alter table ad_campaigns add column if not exists title text;
alter table ad_campaigns add column if not exists banner_url text;
alter table ad_campaigns add column if not exists slot text;
alter table ad_campaigns add column if not exists status text default 'active';
alter table ad_campaigns add column if not exists impressions integer default 0;
alter table ad_campaigns add column if not exists clicks integer default 0;
alter table ad_campaigns add column if not exists contact_email text;
alter table ad_campaigns add column if not exists contact_phone text;
alter table ad_campaigns add column if not exists starts_at timestamptz default now();
alter table ad_campaigns add column if not exists ends_at timestamptz;
alter table ad_campaigns add column if not exists created_at timestamptz default now();

-- favorites
create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  listing_id uuid references listings(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, listing_id)
);

-- subscriptions
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  plan text default 'basic',
  status text default 'active',
  started_at timestamptz default now(),
  expires_at timestamptz,
  metadata jsonb default '{}'::jsonb
);

alter table subscriptions add column if not exists plan text default 'basic';
alter table subscriptions add column if not exists status text default 'active';
alter table subscriptions add column if not exists started_at timestamptz default now();
alter table subscriptions add column if not exists expires_at timestamptz;
alter table subscriptions add column if not exists metadata jsonb default '{}'::jsonb;

-- payments
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text,
  reference_id uuid,
  mp_preference_id text,
  status text default 'pending',
  amount numeric default 0,
  created_at timestamptz default now()
);

-- presence
create table if not exists presence_heartbeats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  session_key text not null,
  is_authenticated boolean default false,
  path text,
  last_seen_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_presence_heartbeats_last_seen_at on presence_heartbeats(last_seen_at);
create index if not exists idx_presence_heartbeats_user_id on presence_heartbeats(user_id);
create unique index if not exists idx_presence_heartbeats_session_key_unique on presence_heartbeats(session_key);

-- owner/admin seed
insert into profiles (id, email, role)
select id, email, 'admin'
from auth.users
where lower(email) = 'anibalreal@hotmail.com'
on conflict (id) do update set email = excluded.email, role = 'admin';

insert into subscriptions (user_id, plan, status, started_at, expires_at, metadata)
select id, 'owner', 'active', now(), now() + interval '10 years', jsonb_build_object('source','v19_finalize_all')
from auth.users
where lower(email) = 'anibalreal@hotmail.com'
on conflict do nothing;

-- RLS básicas
alter table listings enable row level security;
alter table favorites enable row level security;
alter table ad_campaigns enable row level security;
alter table subscriptions enable row level security;
alter table payments enable row level security;
alter table presence_heartbeats enable row level security;

drop policy if exists "read own listings" on listings;
create policy "read own listings" on listings for select using (auth.uid() = user_id);

drop policy if exists "write own listings" on listings;
create policy "write own listings" on listings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "read own favorites" on favorites;
create policy "read own favorites" on favorites for select using (auth.uid() = user_id);

drop policy if exists "write own favorites" on favorites;
create policy "write own favorites" on favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "campaigns own read" on ad_campaigns;
create policy "campaigns own read" on ad_campaigns for select using (auth.uid() = user_id);

drop policy if exists "campaigns own write" on ad_campaigns;
create policy "campaigns own write" on ad_campaigns for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "subscriptions own read" on subscriptions;
create policy "subscriptions own read" on subscriptions for select using (auth.uid() = user_id);

drop policy if exists "payments own read" on payments;
create policy "payments own read" on payments for select using (auth.uid() = user_id);

drop policy if exists "presence service only select" on presence_heartbeats;
create policy "presence service only select" on presence_heartbeats for select using (false);

drop policy if exists "presence service only write" on presence_heartbeats;
create policy "presence service only write" on presence_heartbeats for insert with check (false);
