-- Ejecutar en Supabase SQL Editor

alter table public.listings
  add column if not exists updated_at timestamptz not null default now();

alter table public.listings
  add column if not exists price_on_request boolean not null default false;

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_listings_updated_at on public.listings;
create trigger trg_listings_updated_at
before update on public.listings
for each row
execute function public.set_updated_at_timestamp();
