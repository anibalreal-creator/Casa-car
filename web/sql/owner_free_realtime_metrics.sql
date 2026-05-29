create table if not exists presence_heartbeats (
  session_key text primary key,
  user_id uuid null,
  user_email text null,
  is_authenticated boolean not null default false,
  current_path text null,
  referrer text null,
  user_agent text null,
  last_seen_at timestamptz not null default now()
);

create index if not exists idx_presence_last_seen on presence_heartbeats(last_seen_at desc);
create index if not exists idx_presence_user_id on presence_heartbeats(user_id, last_seen_at desc);

alter table presence_heartbeats enable row level security;

drop policy if exists "presence deny public select" on presence_heartbeats;
create policy "presence deny public select"
on presence_heartbeats
for select
using (false);

drop policy if exists "presence deny public write" on presence_heartbeats;
create policy "presence deny public write"
on presence_heartbeats
for all
using (false)
with check (false);
