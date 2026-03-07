alter table public.anuncios enable row level security;
alter table public.anuncio_fotos enable row level security;

drop policy if exists "public read anuncios" on public.anuncios;
create policy "public read anuncios"
on public.anuncios
for select
to public
using (true);

drop policy if exists "auth insert anuncios" on public.anuncios;
create policy "auth insert anuncios"
on public.anuncios
for insert
to authenticated
with check (true);

drop policy if exists "public read anuncio_fotos" on public.anuncio_fotos;
create policy "public read anuncio_fotos"
on public.anuncio_fotos
for select
to public
using (true);

drop policy if exists "auth insert anuncio_fotos" on public.anuncio_fotos;
create policy "auth insert anuncio_fotos"
on public.anuncio_fotos
for insert
to authenticated
with check (true);
