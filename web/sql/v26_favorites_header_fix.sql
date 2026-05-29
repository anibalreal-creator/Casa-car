drop table if exists favorites;

create table favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id text not null,
  created_at timestamptz default now(),
  constraint favorites_user_listing_unique unique (user_id, listing_id)
);

alter table favorites enable row level security;

drop policy if exists "read own favorites" on favorites;
create policy "read own favorites"
on favorites
for select
using (auth.uid() = user_id);

drop policy if exists "write own favorites" on favorites;
create policy "write own favorites"
on favorites
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
