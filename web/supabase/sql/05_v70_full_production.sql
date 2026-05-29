-- Casa-Car V70 Full Producción
-- Ejecutar en Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  phone text,
  role text not null default 'user',
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  category text not null,
  subtype text,
  listing_type text not null default 'venta',
  price numeric not null default 0,
  currency text not null default 'USD',
  country text,
  state text,
  city text,
  zone text,
  address text,
  lat numeric,
  lng numeric,
  language text not null default 'es',
  description text,
  phone text,
  images jsonb not null default '[]'::jsonb,
  main_image_index integer not null default 0,
  rooms numeric,
  bathrooms numeric,
  surface numeric,
  pool boolean not null default false,
  garage boolean not null default false,
  highlighted boolean not null default false,
  is_premium boolean not null default false,
  premium_plan text,
  premium_expires_at timestamptz,
  verified boolean not null default false,
  views integer not null default 0,
  clicks_whatsapp integer not null default 0,
  clicks_mail integer not null default 0,
  chat_messages integer not null default 0,
  specs_json jsonb not null default '{}'::jsonb,
  seo_slug text,
  slug text,
  status text not null default 'active',
  mercadopago_status text,
  mercadopago_payment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists listings_seo_slug_key on public.listings (seo_slug) where seo_slug is not null;
create index if not exists listings_user_id_idx on public.listings (user_id, created_at desc);
create index if not exists listings_status_idx on public.listings (status);
create index if not exists listings_category_idx on public.listings (category);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, listing_id)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'basic',
  status text not null default 'active',
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.payment_events (
  id bigint generated always as identity primary key,
  listing_id uuid references public.listings(id) on delete set null,
  campaign_id uuid,
  provider text not null default 'mercadopago',
  event_type text not null,
  provider_payment_id text,
  status text,
  payload_json jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  company_name text,
  contact_email text,
  contact_phone text,
  contact_name text,
  title text,
  description text,
  plan_key text not null default 'basico',
  slot_key text not null default 'home_middle',
  banner_url text,
  destination_url text,
  cta_text text default 'Ver más',
  mercadopago_status text default 'pending',
  mercadopago_payment_id text,
  impressions integer not null default 0,
  clicks integer not null default 0,
  status text not null default 'pending_payment',
  active boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ad_campaigns_user_id_idx on public.ad_campaigns (user_id, created_at desc);
create index if not exists ad_campaigns_status_idx on public.ad_campaigns (status);
create index if not exists ad_campaigns_slot_idx on public.ad_campaigns (slot_key);

create table if not exists public.presence_heartbeats (
  session_key text primary key,
  user_id uuid references auth.users(id) on delete set null,
  is_authenticated boolean not null default false,
  last_seen_at timestamptz not null default now(),
  path text,
  user_agent text,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at_timestamp();

drop trigger if exists trg_listings_updated_at on public.listings;
create trigger trg_listings_updated_at before update on public.listings for each row execute function public.set_updated_at_timestamp();

drop trigger if exists trg_ad_campaigns_updated_at on public.ad_campaigns;
create trigger trg_ad_campaigns_updated_at before update on public.ad_campaigns for each row execute function public.set_updated_at_timestamp();

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.favorites enable row level security;
alter table public.subscriptions enable row level security;
alter table public.ad_campaigns enable row level security;
alter table public.presence_heartbeats enable row level security;

drop policy if exists "profiles own read" on public.profiles;
create policy "profiles own read" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles own write" on public.profiles;
create policy "profiles own write" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update" on public.profiles for update using (auth.uid() = id);

drop policy if exists "public active listings" on public.listings;
create policy "public active listings" on public.listings for select using (status = 'active' or auth.uid() = user_id);
drop policy if exists "listings own insert" on public.listings;
create policy "listings own insert" on public.listings for insert with check (auth.uid() = user_id);
drop policy if exists "listings own update" on public.listings;
create policy "listings own update" on public.listings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "listings own delete" on public.listings;
create policy "listings own delete" on public.listings for delete using (auth.uid() = user_id);

drop policy if exists "favorites own read" on public.favorites;
create policy "favorites own read" on public.favorites for select using (auth.uid() = user_id);
drop policy if exists "favorites own write" on public.favorites;
create policy "favorites own write" on public.favorites for insert with check (auth.uid() = user_id);
drop policy if exists "favorites own delete" on public.favorites;
create policy "favorites own delete" on public.favorites for delete using (auth.uid() = user_id);

drop policy if exists "subscriptions own read" on public.subscriptions;
create policy "subscriptions own read" on public.subscriptions for select using (auth.uid() = user_id);

drop policy if exists "campaigns own read" on public.ad_campaigns;
create policy "campaigns own read" on public.ad_campaigns for select using (auth.uid() = user_id);
drop policy if exists "campaigns own insert" on public.ad_campaigns;
create policy "campaigns own insert" on public.ad_campaigns for insert with check (auth.uid() = user_id);
drop policy if exists "campaigns own update" on public.ad_campaigns;
create policy "campaigns own update" on public.ad_campaigns for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "campaigns own delete" on public.ad_campaigns;
create policy "campaigns own delete" on public.ad_campaigns for delete using (auth.uid() = user_id);

-- service/backend only
DROP POLICY IF EXISTS "presence service only select" ON public.presence_heartbeats;
CREATE POLICY "presence service only select" ON public.presence_heartbeats FOR SELECT USING (false);
DROP POLICY IF EXISTS "presence service only insert" ON public.presence_heartbeats;
CREATE POLICY "presence service only insert" ON public.presence_heartbeats FOR INSERT WITH CHECK (false);
DROP POLICY IF EXISTS "presence service only update" ON public.presence_heartbeats;
CREATE POLICY "presence service only update" ON public.presence_heartbeats FOR UPDATE USING (false);
