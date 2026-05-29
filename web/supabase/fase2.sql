create table if not exists public.favoritos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, listing_id)
);

create table if not exists public.perfiles (
  id uuid primary key,
  email text,
  rol text not null default 'user',
  created_at timestamptz not null default now()
);

alter table public.listings add column if not exists destacado boolean not null default false;
alter table public.listings add column if not exists destacado_hasta timestamptz;

alter table public.favoritos enable row level security;
alter table public.perfiles enable row level security;

create policy if not exists "favoritos_select_own" on public.favoritos
for select to authenticated
using (auth.uid() = user_id);

create policy if not exists "favoritos_insert_own" on public.favoritos
for insert to authenticated
with check (auth.uid() = user_id);

create policy if not exists "favoritos_delete_own" on public.favoritos
for delete to authenticated
using (auth.uid() = user_id);

create policy if not exists "perfiles_select_own" on public.perfiles
for select to authenticated
using (auth.uid() = id);
