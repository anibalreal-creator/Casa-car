-- Casa-Car PRO Growth migration
-- Ejecutar en Supabase SQL Editor

alter table public.listings
  add column if not exists seo_slug text,
  add column if not exists verified boolean not null default false,
  add column if not exists clicks_whatsapp integer not null default 0,
  add column if not exists clicks_mail integer not null default 0,
  add column if not exists chat_messages integer not null default 0,
  add column if not exists mercadopago_status text,
  add column if not exists mercadopago_payment_id text,
  add column if not exists premium_expires_at timestamptz;

create unique index if not exists listings_seo_slug_key on public.listings (seo_slug) where seo_slug is not null;
create index if not exists listings_is_premium_idx on public.listings (is_premium desc, highlighted desc, views desc, created_at desc);
create index if not exists listings_verified_idx on public.listings (verified);

create table if not exists public.payment_events (
  id bigint generated always as identity primary key,
  listing_id bigint references public.listings(id) on delete set null,
  provider text not null default 'mercadopago',
  event_type text not null,
  provider_payment_id text,
  status text,
  payload_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists payment_events_listing_id_idx on public.payment_events(listing_id);
create index if not exists payment_events_provider_payment_id_idx on public.payment_events(provider_payment_id);

create table if not exists public.listing_contact_events (
  id bigint generated always as identity primary key,
  listing_id bigint not null references public.listings(id) on delete cascade,
  event_type text not null,
  user_email text,
  created_at timestamptz not null default now()
);

create index if not exists listing_contact_events_listing_id_idx on public.listing_contact_events(listing_id);
create index if not exists listing_contact_events_event_type_idx on public.listing_contact_events(event_type);

alter table public.messages
  add column if not exists listing_owner_id uuid,
  add column if not exists conversation_key text;

create index if not exists messages_listing_id_created_at_idx on public.messages(listing_id, created_at desc);

-- RLS sugerida para payment_events (desactivada por defecto)
-- alter table public.payment_events enable row level security;
-- create policy "service role full access payment_events" on public.payment_events for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
