# Casa-Car (Next.js + Supabase)

## 1) Instalar
```bash
npm install
```

## 2) Variables de entorno
Copiá `.env.local.example` como `.env.local` y pegá tus claves de Supabase.

## 3) Base de datos (SQL)
En Supabase > SQL Editor, ejecutá `supabase/schema.sql` (crea tablas + índices).
Luego ejecutá `supabase/rls.sql` (activa RLS + policies).

## 4) Storage
En Supabase > Storage:
- Crear bucket `listings`
- Marcarlo como **PUBLIC**
- Luego en Storage > Policies, ejecutá `supabase/storage_policies.sql` en SQL Editor
  (crea policies para lectura pública y upload para autenticados).

## 5) Correr
```bash
npm run dev
```

Abrí: http://localhost:3000

## Notas
- Para publicar, necesitás estar logueado (hay una página Dashboard con login simple).
- Las fotos se guardan en bucket `listings` y los paths en `anuncio_fotos`.
