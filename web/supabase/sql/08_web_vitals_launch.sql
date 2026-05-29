-- Optional production analytics table for Core Web Vitals.
-- Apply from Supabase SQL editor after 07_production_rls_final.sql.

create table if not exists public.web_vitals (
  id bigserial primary key,
  metric_id text,
  name text not null,
  label text,
  value double precision,
  delta double precision,
  rating text,
  path text,
  href text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists web_vitals_created_at_idx on public.web_vitals (created_at desc);
create index if not exists web_vitals_name_created_at_idx on public.web_vitals (name, created_at desc);
create index if not exists web_vitals_path_created_at_idx on public.web_vitals (path, created_at desc);

alter table public.web_vitals enable row level security;

revoke all on public.web_vitals from anon;
revoke all on public.web_vitals from authenticated;
