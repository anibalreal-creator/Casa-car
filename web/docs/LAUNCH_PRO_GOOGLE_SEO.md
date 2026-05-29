# Casa-Car launch PRO and Google SEO

Este archivo es operativo. No pegar claves ni tokens aca.

## Antes de publicar fuerte

1. En Vercel configurar dominio final.
2. En Vercel configurar:
   - `NEXT_PUBLIC_SITE_URL=https://casa-car.com`
   - `SITE_URL=https://casa-car.com`
3. Redeploy production.
4. Ejecutar:

```bash
npm run launch:audit -- https://casa-car.com
```

## Google Search Console

1. Crear propiedad de dominio.
2. Verificar DNS.
3. Enviar sitemap:

```text
https://casa-car.com/sitemap.xml
```

4. Inspeccionar y pedir indexacion para:
   - `/`
   - `/buscar`
   - `/autos`
   - `/propiedades`
   - `/turismo`
   - un anuncio real
   - una landing real con ciudad o tema

## Landings SEO listas

Categorias:

- `/autos`
- `/propiedades`
- `/turismo`
- `/nautica`
- `/motos`
- `/camiones`
- `/maquinaria`
- `/servicios`

Temas:

- `/autos/bmw`
- `/autos/toyota`
- `/autos/pickups`
- `/propiedades/venta-santa-fe`
- `/propiedades/alquiler-temporario`
- `/turismo/cabanas`
- `/turismo/experiencias`
- `/turismo/pesca-buceo-navegacion`
- `/nautica/yates-miami`
- `/nautica/lanchas`

## Contenido que posiciona

- Usar fotos reales.
- Titulos unicos con marca/modelo/ubicacion.
- Descripciones unicas de 300 a 900 palabras en anuncios importantes.
- Evitar anuncios duplicados.
- Cargar ciudad, provincia, pais y precio.
- Completar specs por categoria.
- Conseguir enlaces desde redes, empresas y aliados.

## Supabase

Aplicar en este orden:

1. `web/supabase/sql/07_production_rls_final.sql`
2. `web/supabase/sql/08_web_vitals_launch.sql`

## Mercado Pago

Probar en sandbox o pago real bajo:

1. Usuario logueado publica anuncio.
2. Usuario compra premium de su propio anuncio.
3. Webhook confirma pago.
4. Anuncio queda premium/destacado.
5. Campana publicitaria pasa de `pending_payment` a `active`.

## Medicion

El proyecto registra Core Web Vitals en `/api/analytics/web-vitals`.
La tabla opcional es `web_vitals`.
