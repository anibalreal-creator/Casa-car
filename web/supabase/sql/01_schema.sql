-- Casa-Car schema (Postgres / Supabase)
-- Ejecutar en: Supabase -> SQL Editor

create extension if not exists pgcrypto;

-- Tabla anuncios
create table if not exists public.anuncios (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  status text not null default 'draft' check (status in ('draft','published')),
  owner_id uuid references auth.users(id) on delete cascade,

  tipo text not null check (tipo in ('inmueble','auto')),
  operacion text not null check (operacion in ('venta','alquiler')),
  moneda text not null check (moneda in ('USD','ARS','BRL')),

  ciudad text not null,
  titulo text not null,
  descripcion text,
  precio numeric not null check (precio > 0),

  contact_whatsapp text,
  images jsonb not null default '[]'::jsonb
);

create index if not exists anuncios_status_idx on public.anuncios(status);
create index if not exists anuncios_ciudad_idx on public.anuncios(ciudad);

-- RLS
alter table public.anuncios enable row level security;

-- Ver: cualquiera ve publicados, dueño ve los suyos
drop policy if exists "select_published_or_owner" on public.anuncios;
create policy "select_published_or_owner"
on public.anuncios
for select
using (
  status = 'published'
  OR auth.uid() = owner_id
);

-- Insert: solo logueado (owner_id debe ser él)
drop policy if exists "insert_owner_only" on public.anuncios;
create policy "insert_owner_only"
on public.anuncios
for insert
with check (auth.uid() = owner_id);

-- Update: solo dueño
drop policy if exists "update_owner_only" on public.anuncios;
create policy "update_owner_only"
on public.anuncios
for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

-- Delete: solo dueño
drop policy if exists "delete_owner_only" on public.anuncios;
create policy "delete_owner_only"
on public.anuncios
for delete
using (auth.uid() = owner_id);
