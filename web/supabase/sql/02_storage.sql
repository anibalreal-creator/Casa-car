-- Storage para fotos
-- 1) Crear bucket listing-images (public)
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

-- Policies (Storage)
-- Permitir subir SOLO a usuarios logueados, dentro de su carpeta (userId/*)
drop policy if exists "upload_own_folder" on storage.objects;
create policy "upload_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir update/delete solo dueño (misma carpeta)
drop policy if exists "update_own_folder" on storage.objects;
create policy "update_own_folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "delete_own_folder" on storage.objects;
create policy "delete_own_folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Lectura pública (bucket public)
-- (si bucket es public, no hace falta policy de select)
