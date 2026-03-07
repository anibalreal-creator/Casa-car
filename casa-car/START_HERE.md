# Casa-Car (Web) — empezar por acá

Este proyecto es un monorepo.

## Carpeta correcta para correr la web

Usá **esta**:

```
apps/web
```

> La carpeta `web/` que está en la raíz es un backup/artefactos y **no** es la app fuente.

## 1) Variables de entorno

En `apps/web/`:

1. Copiá `apps/web/.env.example` a `apps/web/.env.local`
2. Pegá tus valores reales:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (ej: `http://localhost:3000`)

## 2) Base de datos (fotos pro)

En Supabase (SQL Editor) ejecutá:

```
supabase/step2_anuncio_fotos.sql
```

Eso crea:
- `public.anuncio_fotos` (1 anuncio -> muchas fotos)
- Policies para leer público y subir solo autenticados
- Policies de Storage para el bucket `listings`

## 3) Correr la web

Abrí una terminal en `apps/web/`:

```bash
npm install
npm run dev
```

Abrí:
- http://localhost:3000

## 4) Publicar con fotos

Entrá a:
- `/publicar`

Subí 1 o más fotos. Se guardan en:
- Storage bucket: `listings`
- Tabla: `public.anuncio_fotos`

