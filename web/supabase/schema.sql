-- TABLA anuncios
create table if not exists public.anuncios (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  precio numeric not null,
  moneda text not null default 'ARS',
  ciudad text,
  tipo text not null default 'inmueble',
  operacion text not null default 'venta',
  created_at timestamptz not null default now()
);

create index if not exists anuncios_created_at_idx on public.anuncios (created_at desc);

-- TABLA anuncio_fotos
create table if not exists public.anuncio_fotos (
  id bigserial primary key,
  anuncio_id uuid not null references public.anuncios(id) on delete cascade,
  path text not null,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists anuncio_fotos_anuncio_id_idx on public.anuncio_fotos (anuncio_id);
create index if not exists anuncio_fotos_orden_idx on public.anuncio_fotos (anuncio_id, orden);

create unique index if not exists anuncio_fotos_unique on public.anuncio_fotos (anuncio_id, path);
