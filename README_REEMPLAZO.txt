CASA-CAR (parche listo) - Reemplazo directo de archivos

OBJETIVO
- Unificar la base a una sola tabla: public.listings
- Usar SIEMPRE columnas en español: titulo, descripcion, precio, moneda
- Evitar confusión price vs precio
- Publicar desde /publicar y que aparezca en el home / (con botón Recargar)

1) SUPABASE (SQL)
En Supabase > SQL Editor > New query, pegá y ejecutá el archivo:
  supabase/01_schema_listings.sql

Eso crea la tabla public.listings con:
  id (uuid), user_id (uuid), titulo (text), descripcion (text),
  precio (numeric), moneda (text), created_at (timestamptz)

Y deja RLS DESACTIVADO para que funcione sin auth (después lo endurecemos).

2) ENV
En web/.env.local tenés que tener:
  NEXT_PUBLIC_SUPABASE_URL=...
  NEXT_PUBLIC_SUPABASE_ANON_KEY=...

3) REEMPLAZAR ARCHIVOS (FRONT)
Reemplazá estos archivos por los del zip (MISMA RUTA):
  web/lib/supabaseClient.js
  web/lib/formatMoney.js
  web/pages/index.js
  web/pages/publicar.js
  web/pages/anuncio/[id].js

4) CORRER
En la carpeta web:
  npm install
  npm run dev
Abrí:
  http://localhost:3000
  http://localhost:3000/publicar

NOTAS
- El precio acepta solo números (ej: 30000). Si ponés letras, te lo marca como inválido.
- Si no aparece al publicar, tocá "Recargar" o refrescá el navegador.
