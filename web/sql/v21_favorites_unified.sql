create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  listing_id uuid references listings(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, listing_id)
);

alter table favorites enable row level security;

drop policy if exists "read own favorites" on favorites;
create policy "read own favorites" on favorites
for select using (auth.uid() = user_id);

drop policy if exists "write own favorites" on favorites;
create policy "write own favorites" on favorites
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
