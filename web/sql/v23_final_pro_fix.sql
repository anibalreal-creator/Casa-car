create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, listing_id)
);

create table if not exists presence_heartbeats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  session_key text not null,
  is_authenticated boolean default false,
  path text,
  current_path text,
  referrer text,
  user_email text,
  user_agent text,
  last_seen_at timestamptz default now(),
  created_at timestamptz default now()
);

create unique index if not exists idx_presence_heartbeats_session_key_unique on presence_heartbeats(session_key);

alter table favorites enable row level security;
alter table presence_heartbeats enable row level security;

drop policy if exists "read own favorites" on favorites;
create policy "read own favorites" on favorites for select using (auth.uid() = user_id);

drop policy if exists "write own favorites" on favorites;
create policy "write own favorites" on favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
