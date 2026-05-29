-- CASA-CAR - esquema único para anuncios
-- Tabla: public.listings
-- Columnas: titulo, descripcion, precio, moneda

create extension if not exists "pgcrypto";

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  titulo text not null,
  descripcion text not null,
  precio numeric not null check (precio > 0),
  moneda text not null default 'USD',
  created_at timestamptz not null default now()
);

-- Índices útiles
create index if not exists listings_created_at_idx on public.listings (created_at desc);
create index if not exists listings_user_id_idx on public.listings (user_id);

-- Para que funcione sin autenticación por ahora:
alter table public.listings disable row level security;

-- Si en algún momento querés activar RLS con anon (lectura) y auth (escritura),
-- avisame y lo dejamos bien armado con policies.
