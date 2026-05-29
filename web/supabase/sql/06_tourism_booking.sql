-- Casa-Car Tourism PRO: reservas, disponibilidad y pagos.
-- Ejecutar en Supabase SQL Editor antes de activar reservas reales en produccion.

create table if not exists public.tourism_reservations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  check_in date not null,
  check_out date not null,
  guests integer not null default 1,
  nights integer not null default 1,
  guest_name text not null,
  guest_email text not null,
  guest_phone text,
  note text,
  currency text not null default 'USD',
  total_estimate numeric(14,2) not null default 0,
  status text not null default 'pending_confirmation',
  payment_provider text,
  payment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tourism_reservations_listing_id_idx on public.tourism_reservations(listing_id);
create index if not exists tourism_reservations_dates_idx on public.tourism_reservations(check_in, check_out);
create index if not exists tourism_reservations_status_idx on public.tourism_reservations(status);

alter table public.tourism_reservations enable row level security;

drop policy if exists "tourism_reservations_insert_public" on public.tourism_reservations;
create policy "tourism_reservations_insert_public"
on public.tourism_reservations
for insert
with check (true);

drop policy if exists "tourism_reservations_owner_read" on public.tourism_reservations;
create policy "tourism_reservations_owner_read"
on public.tourism_reservations
for select
using (
  exists (
    select 1
    from public.listings l
    where l.id = tourism_reservations.listing_id
      and l.user_id = auth.uid()
  )
);

drop policy if exists "tourism_reservations_owner_update" on public.tourism_reservations;
create policy "tourism_reservations_owner_update"
on public.tourism_reservations
for update
using (
  exists (
    select 1
    from public.listings l
    where l.id = tourism_reservations.listing_id
      and l.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.listings l
    where l.id = tourism_reservations.listing_id
      and l.user_id = auth.uid()
  )
);
