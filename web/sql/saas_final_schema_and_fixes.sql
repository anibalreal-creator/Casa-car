-- Casa-Car SaaS final schema + fixes

-- ad campaigns compatibility
alter table if exists ad_campaigns add column if not exists company_name text;
alter table if exists ad_campaigns add column if not exists contact_email text;
alter table if exists ad_campaigns add column if not exists contact_phone text;
alter table if exists ad_campaigns add column if not exists contact_name text;
alter table if exists ad_campaigns add column if not exists title text;
alter table if exists ad_campaigns add column if not exists description text;
alter table if exists ad_campaigns add column if not exists plan_key text;
alter table if exists ad_campaigns add column if not exists slot_key text;
alter table if exists ad_campaigns add column if not exists banner_url text;
alter table if exists ad_campaigns add column if not exists destination_url text;
alter table if exists ad_campaigns add column if not exists cta_text text;
alter table if exists ad_campaigns add column if not exists mercadopago_status text default 'pending';
alter table if exists ad_campaigns add column if not exists mercadopago_payment_id text;
alter table if exists ad_campaigns add column if not exists impressions integer default 0;
alter table if exists ad_campaigns add column if not exists clicks integer default 0;
alter table if exists ad_campaigns add column if not exists status text default 'pending';
alter table if exists ad_campaigns add column if not exists starts_at timestamptz;
alter table if exists ad_campaigns add column if not exists ends_at timestamptz;

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

-- payments
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text not null default 'listing',
  reference_id uuid,
  mp_preference_id text,
  status text default 'pending',
  amount numeric(12,2) default 0,
  created_at timestamptz default now()
);

-- favorites
create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  listing_id uuid references listings(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, listing_id)
);

-- realtime presence
create table if not exists presence_heartbeats (
  session_key text primary key,
  user_id uuid references auth.users(id) on delete set null,
  is_authenticated boolean default false,
  last_seen_at timestamptz default now(),
  path text,
  user_agent text
);
create index if not exists idx_presence_last_seen on presence_heartbeats(last_seen_at desc);
create index if not exists idx_presence_user_id on presence_heartbeats(user_id, last_seen_at desc);

-- helper RPCs
create or replace function increment_campaign_impression(campaign_id uuid)
returns void language sql as $$
  update ad_campaigns set impressions = coalesce(impressions,0) + 1 where id = campaign_id;
$$;

create or replace function increment_campaign_click(campaign_id uuid)
returns void language sql as $$
  update ad_campaigns set clicks = coalesce(clicks,0) + 1 where id = campaign_id;
$$;

-- RLS
alter table if exists favorites enable row level security;
alter table if exists subscriptions enable row level security;
alter table if exists payments enable row level security;
alter table if exists ad_campaigns enable row level security;
alter table if exists presence_heartbeats enable row level security;

drop policy if exists "favorites own read" on favorites;
create policy "favorites own read" on favorites for select using (auth.uid() = user_id);
drop policy if exists "favorites own write" on favorites;
create policy "favorites own write" on favorites for insert with check (auth.uid() = user_id);
drop policy if exists "favorites own delete" on favorites;
create policy "favorites own delete" on favorites for delete using (auth.uid() = user_id);

drop policy if exists "subscriptions own read" on subscriptions;
create policy "subscriptions own read" on subscriptions for select using (auth.uid() = user_id);

drop policy if exists "payments own read" on payments;
create policy "payments own read" on payments for select using (auth.uid() = user_id);

drop policy if exists "campaigns own read" on ad_campaigns;
create policy "campaigns own read" on ad_campaigns for select using (auth.uid() = user_id);
drop policy if exists "campaigns own write" on ad_campaigns;
create policy "campaigns own write" on ad_campaigns for insert with check (auth.uid() = user_id);

drop policy if exists "presence service only select" on presence_heartbeats;
create policy "presence service only select" on presence_heartbeats for select using (false);
drop policy if exists "presence service only write" on presence_heartbeats;
create policy "presence service only write" on presence_heartbeats for insert with check (false);

-- owner utility: reassign orphan listings to owner email if needed (edit before running if needed)
-- update listings set user_id = (select id from auth.users where email = 'anibalreal@hotmail.com') where user_id is null;
