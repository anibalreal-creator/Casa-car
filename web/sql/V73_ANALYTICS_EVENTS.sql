create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid,
  event_type text,
  slot text,
  page text,
  created_at timestamptz default now()
);
