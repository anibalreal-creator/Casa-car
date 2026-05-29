# Casa-Car production external checklist

Do not commit real secrets. Configure these values only inside Vercel and Supabase dashboards.

## Vercel

- Root directory: `web`
- Build command: `npm run build`
- Production environment variables:
  - `NEXT_PUBLIC_SITE_URL=https://www.casa-car.com`
  - `SITE_URL=https://www.casa-car.com`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `MERCADOPAGO_ACCESS_TOKEN`
  - `MP_ACCESS_TOKEN`
  - `ADMIN_API_KEY`

## Mercado Pago

- Webhook premium: `https://www.casa-car.com/api/payments/mercadopago/webhook`
- Webhook ads: `https://www.casa-car.com/api/payments/mercadopago/ad-webhook`
- Run one sandbox or real low-value payment and confirm:
  - Premium listing activates.
  - Ad campaign moves from `pending_payment` to `active`.
  - Tourism reservation with `pay_now` returns checkout and webhook is received.

## Supabase

- Apply SQL migrations through `web/supabase/sql/07_production_rls_final.sql`.
- Authentication URL configuration:
  - Site URL: `https://www.casa-car.com`
  - Redirect URLs: `https://www.casa-car.com/**`

## Google Search Console

- Verify domain property.
- Submit: `https://www.casa-car.com/sitemap.xml`
- Run before submitting: `npm run launch:audit -- https://www.casa-car.com`
- Inspect and request indexing for:
  - `/`
  - `/buscar`
  - `/sitemap.xml`
  - `/autos`
  - `/propiedades`
  - `/turismo`
  - a real listing URL
  - a real SEO landing URL

## Launch audit

From `C:\casa-car\web`:

```bash
npm run build
npm run launch:audit -- https://www.casa-car.com
```

The audit checks home, Tourism Booking-style filters, sitemap, robots, premium checkout protection and tourism reservation validation.
