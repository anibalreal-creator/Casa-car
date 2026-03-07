-- PASO 2 (PRO): Fotos por anuncio
-- 1) Tabla: 1 anuncio -> muchas fotos
create table if not exists public.anuncio_fotos (
  id uuid primary key default gen_random_uuid(),
  anuncio_id uuid not null references public.anuncios(id) on delete cascade,
  path text not null,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_anuncio_fotos_anuncio_id
  on public.anuncio_fotos(anuncio_id);

create unique index if not exists ux_anuncio_fotos_anuncio_path
  on public.anuncio_fotos(anuncio_id, path);

-- 2) RLS
alter table public.anuncio_fotos enable row level security;

-- Lectura pública (para que cualquiera vea fotos)
drop policy if exists "public read anuncio_fotos" on public.anuncio_fotos;
create policy "public read anuncio_fotos"
on public.anuncio_fotos
for select
to public
using (true);

-- Insert solo autenticados (quien publica)
drop policy if exists "auth insert anuncio_fotos" on public.anuncio_fotos;
create policy "auth insert anuncio_fotos"
on public.anuncio_fotos
for insert
to authenticated
with check (true);

-- (Opcional) delete solo autenticados
-- drop policy if exists "auth delete anuncio_fotos" on public.anuncio_fotos;
-- create policy "auth delete anuncio_fotos"
-- on public.anuncio_fotos
-- for delete
-- to authenticated
-- using (true);


-- PASO 2 (PRO): Storage policies para bucket `listings`
-- Requisito: tener creado el bucket en Storage con nombre EXACTO: listings

-- Lectura pública del bucket listings
-- (para que se muestren imágenes sin login)
drop policy if exists "Public read listings" on storage.objects;
create policy "Public read listings"
on storage.objects
for select
to public
using (bucket_id = 'listings');

-- Subida solo autenticados
-- (para que cualquiera NO pueda subir basura)
drop policy if exists "Auth upload listings" on storage.objects;
create policy "Auth upload listings"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'listings');
