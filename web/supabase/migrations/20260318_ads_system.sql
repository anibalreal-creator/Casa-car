-- Casa-Car Ads System
-- Ejecutar en Supabase SQL Editor

create table if not exists public.ad_campaigns (
  id bigint generated always as identity primary key,
  user_id uuid,
  company_name text not null,
  title text not null,
  description text,
  plan_key text not null default 'basico',
  slot_key text not null default 'home_middle',
  banner_url text not null,
  destination_url text not null,
  cta_text text default 'Ver más',
  contact_name text,
  contact_email text,
  status text not null default 'pending_payment',
  starts_at timestamptz,
  ends_at timestamptz,
  mercadopago_status text,
  mercadopago_payment_id text,
  created_at timestamptz not null default now()
);

create index if not exists ad_campaigns_slot_key_idx on public.ad_campaigns(slot_key);
create index if not exists ad_campaigns_status_idx on public.ad_campaigns(status);
create index if not exists ad_campaigns_created_at_idx on public.ad_campaigns(created_at desc);
create index if not exists ad_campaigns_contact_email_idx on public.ad_campaigns(contact_email);

alter table public.payment_events
  add column if not exists campaign_id bigint references public.ad_campaigns(id) on delete set null;
