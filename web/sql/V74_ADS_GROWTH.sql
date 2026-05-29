create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid,
  event_type text,
  slot text,
  page text,
  created_at timestamptz default now()
);

create index if not exists analytics_events_campaign_id_idx on public.analytics_events(campaign_id);
create index if not exists analytics_events_event_type_idx on public.analytics_events(event_type);
create index if not exists analytics_events_created_at_idx on public.analytics_events(created_at);
