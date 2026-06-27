-- Casa-Car Security Advisor hardening.
-- Fixes public RLS warnings, backup tables without RLS, unsafe Storage uploads,
-- and the mutable search_path warning for set_updated_at_timestamp().

begin;

do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'City',
        'ad_campaigns',
        'ad_campaigns_legacy_backup',
        'anuncio_fotos',
        'anuncios',
        'campaigns',
        'consultas_anuncio',
        'favorites',
        'favoritos',
        'featured_plans',
        'items',
        'listings',
        'messages',
        'profiles',
        'reviews',
        'tourism_reservations'
      )
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;

  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

do $$
declare
  r record;
begin
  for r in
    select tablename
    from pg_tables
    where schemaname = 'public'
      and tablename like 'backup%'
  loop
    execute format('alter table public.%I enable row level security', r.tablename);
  end loop;
end $$;

alter table if exists public."City" enable row level security;
alter table if exists public.ad_campaigns enable row level security;
alter table if exists public.ad_campaigns_legacy_backup enable row level security;
alter table if exists public.anuncio_fotos enable row level security;
alter table if exists public.anuncios enable row level security;
alter table if exists public.campaigns enable row level security;
alter table if exists public.consultas_anuncio enable row level security;
alter table if exists public.favorites enable row level security;
alter table if exists public.favoritos enable row level security;
alter table if exists public.featured_plans enable row level security;
alter table if exists public.items enable row level security;
alter table if exists public.listings enable row level security;
alter table if exists public.messages enable row level security;
alter table if exists public.profiles enable row level security;
alter table if exists public.reviews enable row level security;
alter table if exists public.tourism_reservations enable row level security;

create policy "city public id read"
on public."City"
for select
to anon, authenticated
using (id is not null);

create policy "items public id read"
on public.items
for select
to anon, authenticated
using (id is not null);

create policy "listings public active select"
on public.listings
for select
to anon, authenticated
using ((status = 'active') or (auth.uid() = user_id));

create policy "listings own insert"
on public.listings
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "listings own update"
on public.listings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "listings own delete"
on public.listings
for delete
to authenticated
using (auth.uid() = user_id);

create policy "ad_campaigns own select"
on public.ad_campaigns
for select
to authenticated
using (auth.uid() = user_id);

create policy "ad_campaigns own insert"
on public.ad_campaigns
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "ad_campaigns own update"
on public.ad_campaigns
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "ad_campaigns own delete"
on public.ad_campaigns
for delete
to authenticated
using (auth.uid() = user_id);

create policy "campaigns public active select"
on public.campaigns
for select
to anon, authenticated
using ((status = 'active') and (banner_url is not null));

create policy "campaigns own select"
on public.campaigns
for select
to authenticated
using (auth.uid()::text = user_id);

create policy "campaigns own insert"
on public.campaigns
for insert
to authenticated
with check (auth.uid()::text = user_id);

create policy "campaigns own update"
on public.campaigns
for update
to authenticated
using (auth.uid()::text = user_id)
with check (auth.uid()::text = user_id);

create policy "campaigns own delete"
on public.campaigns
for delete
to authenticated
using (auth.uid()::text = user_id);

create policy "anuncios own select"
on public.anuncios
for select
to authenticated
using (auth.uid() = user_id);

create policy "anuncios own insert"
on public.anuncios
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "anuncios own update"
on public.anuncios
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "anuncios own delete"
on public.anuncios
for delete
to authenticated
using (auth.uid() = user_id);

create policy "anuncio_fotos owner select"
on public.anuncio_fotos
for select
to authenticated
using (
  exists (
    select 1
    from public.anuncios a
    where a.id = anuncio_fotos.anuncio_id
      and a.user_id = auth.uid()
  )
);

create policy "anuncio_fotos owner insert"
on public.anuncio_fotos
for insert
to authenticated
with check (
  exists (
    select 1
    from public.anuncios a
    where a.id = anuncio_fotos.anuncio_id
      and a.user_id = auth.uid()
  )
);

create policy "anuncio_fotos owner update"
on public.anuncio_fotos
for update
to authenticated
using (
  exists (
    select 1
    from public.anuncios a
    where a.id = anuncio_fotos.anuncio_id
      and a.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.anuncios a
    where a.id = anuncio_fotos.anuncio_id
      and a.user_id = auth.uid()
  )
);

create policy "anuncio_fotos owner delete"
on public.anuncio_fotos
for delete
to authenticated
using (
  exists (
    select 1
    from public.anuncios a
    where a.id = anuncio_fotos.anuncio_id
      and a.user_id = auth.uid()
  )
);

create policy "consultas owner select"
on public.consultas_anuncio
for select
to authenticated
using (
  exists (
    select 1
    from public.anuncios a
    where a.id = consultas_anuncio.listing_id
      and a.user_id = auth.uid()
  )
);

create policy "consultas owner update"
on public.consultas_anuncio
for update
to authenticated
using (
  exists (
    select 1
    from public.anuncios a
    where a.id = consultas_anuncio.listing_id
      and a.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.anuncios a
    where a.id = consultas_anuncio.listing_id
      and a.user_id = auth.uid()
  )
);

create policy "consultas owner delete"
on public.consultas_anuncio
for delete
to authenticated
using (
  exists (
    select 1
    from public.anuncios a
    where a.id = consultas_anuncio.listing_id
      and a.user_id = auth.uid()
  )
);

create policy "favorites own select"
on public.favorites
for select
to authenticated
using (auth.uid() = user_id);

create policy "favorites own insert"
on public.favorites
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "favorites own delete"
on public.favorites
for delete
to authenticated
using (auth.uid() = user_id);

create policy "favoritos own select"
on public.favoritos
for select
to authenticated
using (auth.uid() = user_id);

create policy "favoritos own insert"
on public.favoritos
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "favoritos own delete"
on public.favoritos
for delete
to authenticated
using (auth.uid() = user_id);

create policy "featured_plans active select"
on public.featured_plans
for select
to anon, authenticated
using ((is_active is true) and (name is not null));

create policy "messages listing owner select"
on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.listings l
    where l.id = messages.listing_id
      and l.user_id = auth.uid()
  )
);

create policy "profiles own select"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "profiles own insert"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "profiles own update"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "reviews public scored select"
on public.reviews
for select
to anon, authenticated
using ((rating between 1 and 5) and (target_user_id is not null));

create policy "storage listings authenticated insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'listings'
  and auth.uid() is not null
  and coalesce((storage.foldername(name))[1], '') in ('publicar', 'editar', 'ads', 'company', 'listings')
  and coalesce((storage.foldername(name))[2], '') = auth.uid()::text
);

create policy "storage listings authenticated update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'listings'
  and auth.uid() is not null
  and coalesce((storage.foldername(name))[1], '') in ('publicar', 'editar', 'ads', 'company', 'listings')
  and coalesce((storage.foldername(name))[2], '') = auth.uid()::text
)
with check (
  bucket_id = 'listings'
  and auth.uid() is not null
  and coalesce((storage.foldername(name))[1], '') in ('publicar', 'editar', 'ads', 'company', 'listings')
  and coalesce((storage.foldername(name))[2], '') = auth.uid()::text
);

create policy "storage listings authenticated delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'listings'
  and auth.uid() is not null
  and coalesce((storage.foldername(name))[1], '') in ('publicar', 'editar', 'ads', 'company', 'listings')
  and coalesce((storage.foldername(name))[2], '') = auth.uid()::text
);

do $$
begin
  if to_regprocedure('public.set_updated_at_timestamp()') is not null then
    execute 'alter function public.set_updated_at_timestamp() set search_path = public, pg_catalog';
  end if;
end $$;

commit;
