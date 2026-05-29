drop table if exists favorites;
create table favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid,
  listing_id text
);