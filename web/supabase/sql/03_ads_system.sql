create table if not exists public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  company_name text not null,
  contact_name text,
  contact_email text not null,
  title text,
  image_url text not null,
  target_url text not null,
  plan_id text,
  plan_name text,
  price_ars numeric default 0,
  slot_key text not null default 'home_mid',
  duration_days int default 7,
  priority int default 50,
  status text not null default 'pending',
  is_active boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  approved_at timestamptz,
  mp_preference_id text,
  mp_payment_id text,
  payment_payload jsonb
);

create index if not exists idx_ad_campaigns_active_slot on public.ad_campaigns(slot_key, is_active, status);

create or replace function public.set_updated_at_ad_campaigns()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_updated_at_ad_campaigns on public.ad_campaigns;
create trigger trg_set_updated_at_ad_campaigns
before update on public.ad_campaigns
for each row execute function public.set_updated_at_ad_campaigns();
