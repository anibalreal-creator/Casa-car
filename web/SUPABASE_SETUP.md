# Supabase setup (Casa-Car Web)

## 1) Tabla `listings`

En **Supabase SQL Editor**, ejecutar:

```sql
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  title text not null,
  price numeric,
  currency text default 'ARS',
  photos jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now()
);

create index if not exists listings_created_at_idx on public.listings (created_at desc);
```

## 2) RLS (Row Level Security)

```sql
alter table public.listings enable row level security;

-- Leer: cualquiera (para demo)
create policy "listings_read_all" on public.listings
for select using (true);

-- Insertar: solo usuario logueado
create policy "listings_insert_auth" on public.listings
for insert with check (auth.uid() = user_id);
```

> Nota: para demo, la política de lectura está abierta. En producción, ajustarla.

## 3) Storage bucket `listings`

En **Storage**:
- Crear bucket: `listings`
- Para demo, podés marcarlo como **Public**.

Si querés RLS en Storage, lo dejamos para después.

## 4) Variables de entorno (Vercel / local)

Crear `.env.local` en `web/`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
