-- Crear bucket listings y marcarlo PUBLIC antes de esto.

drop policy if exists "Public read listings objects" on storage.objects;
create policy "Public read listings objects"
on storage.objects
for select
to public
using (bucket_id = 'listings');

drop policy if exists "Auth upload listings objects" on storage.objects;
create policy "Auth upload listings objects"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'listings');

drop policy if exists "Auth update listings objects" on storage.objects;
create policy "Auth update listings objects"
on storage.objects
for update
to authenticated
using (bucket_id = 'listings')
with check (bucket_id = 'listings');

drop policy if exists "Auth delete listings objects" on storage.objects;
create policy "Auth delete listings objects"
on storage.objects
for delete
to authenticated
using (bucket_id = 'listings');
