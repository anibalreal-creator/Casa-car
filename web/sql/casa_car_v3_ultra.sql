
-- Casa-Car v3 Ultra: tablas y políticas base

create table if not exists profiles (
  id uuid primary key,
  role text default 'user',
  display_name text,
  verified boolean default false,
  created_at timestamptz default now()
);

create table if not exists subscriptions (
  user_id uuid primary key,
  plan text default 'FREE',
  active boolean default false,
  expires_at timestamptz,
  updated_at timestamptz default now()
);

create table if not exists ad_campaigns (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  name text not null,
  plan text default 'BASICO',
  budget numeric default 0,
  slot text default 'home_hero',
  target_url text,
  banner_url text,
  notes text,
  status text default 'draft',
  start_date timestamptz default now(),
  end_date timestamptz,
  created_at timestamptz default now()
);

create table if not exists verification_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  company_name text,
  contact_name text,
  phone text,
  website text,
  status text default 'pending',
  notes text,
  created_at timestamptz default now()
);

create table if not exists reviews (
  id bigint generated always as identity primary key,
  target_user_id uuid not null,
  author_user_id uuid,
  rating int not null,
  comment text,
  reviewer_name text,
  reviewer_email text,
  created_at timestamptz default now()
);

alter table profiles add column if not exists verified boolean default false;
alter table reviews alter column author_user_id drop not null;
alter table reviews add column if not exists reviewer_name text;
alter table reviews add column if not exists reviewer_email text;

alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table ad_campaigns enable row level security;
alter table verification_requests enable row level security;
alter table reviews enable row level security;

create policy if not exists "profiles read own" on profiles for select using (auth.uid() = id);
create policy if not exists "subscriptions read own" on subscriptions for select using (auth.uid() = user_id);
create policy if not exists "subscriptions upsert own" on subscriptions for insert with check (auth.uid() = user_id);
create policy if not exists "campaigns read own" on ad_campaigns for select using (auth.uid() = user_id);
create policy if not exists "campaigns insert own" on ad_campaigns for insert with check (auth.uid() = user_id);
create policy if not exists "verification insert own" on verification_requests for insert with check (auth.uid() = user_id);
create policy if not exists "reviews public read" on reviews for select using (true);
create policy if not exists "reviews public insert" on reviews for insert with check (true);
