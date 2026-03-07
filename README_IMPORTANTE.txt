CASA-CAR – REEMPLAZO (v3)

Qué arregla:
- Unifica nombres en la APP (titulo/precio/moneda/descripcion) aunque en Supabase la tabla tenga columnas EN INGLÉS (title/price/currency/description).
- Agrega API routes en Next (/api/listings) para LISTAR y CREAR contra Supabase.
- Mejora un poco el layout del formulario.

Requisitos:
1) Tener en Supabase una tabla: public.listings con columnas:
   - id (uuid) default gen_random_uuid() o uuid_generate_v4()
   - title (text)
   - price (numeric)
   - currency (text)
   - description (text)  (puede ser NULL)
   - created_at (timestamptz) default now()

2) Variables de entorno en: C:\casa-car\web\.env.local
   SUPABASE_URL=https://TU-PROYECTO.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY

IMPORTANTE: el SERVICE_ROLE_KEY es secreto. No lo uses en el navegador. Solo en el server (API routes).

Cómo instalar (Windows):
A) Descomprimí este ZIP.
B) Copiá la carpeta 'web' del zip dentro de C:\casa-car\ (reemplazando archivos).
   - Reemplaza:
     C:\casa-car\web\pages\index.js
     C:\casa-car\web\pages\publicar.js
   - Agrega:
     C:\casa-car\web\pages\api\listings.js
     C:\casa-car\web\lib\supabaseAdmin.js
C) En C:\casa-car\web\ ejecutá:
   npm install @supabase/supabase-js
   npm run dev

Test rápido:
- Abrí http://localhost:3000
- Publicá un anuncio y volvé al home: debería aparecer.
- Si no aparece: F12 -> Console / Network para ver error.

SQL para verificar datos (en Supabase SQL Editor):
select id, title, price, currency, description, created_at
from listings
order by created_at desc
limit 20;
