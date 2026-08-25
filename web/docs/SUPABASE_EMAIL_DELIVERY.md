# Supabase Auth email delivery

Casa-Car usa Supabase Auth para crear cuentas y confirmar emails.

## Problema detectado

El error `Email rate limit exceeded` viene de Supabase Auth. Con el proveedor de email integrado, Supabase limita los endpoints que envian correos a pocos envios por hora para todo el proyecto. En produccion no alcanza para usuarios reales.

Referencias oficiales:

- https://supabase.com/docs/guides/auth/rate-limits
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/deployment/going-into-prod

## Configuracion necesaria en Supabase

1. Abrir Supabase Dashboard.
2. Ir a `Authentication` > `Emails` / `SMTP Settings`.
3. Configurar un SMTP propio, por ejemplo Resend, SendGrid, AWS SES o SMTP del dominio.
4. Verificar dominio/remitente, idealmente `no-reply@casa-car.com`.
5. Ir a `Authentication` > `URL Configuration`.
6. Confirmar:
   - Site URL: `https://www.casa-car.com`
   - Redirect URLs: `https://www.casa-car.com/auth/callback`
7. En `Authentication` > `Rate Limits`, subir el limite de envio de emails segun el SMTP contratado.

## Configuracion por API

Tambien se puede aplicar por API si estan disponibles estos datos:

- `SUPABASE_ACCESS_TOKEN`: token personal de Supabase Dashboard.
- `SUPABASE_PROJECT_REF`: `cdmlyrjccdxakvbmbbpp`.
- `SMTP_ADMIN_EMAIL`: remitente, por ejemplo `no-reply@casa-car.com`.
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_SENDER_NAME`: por ejemplo `Casa-Car`.

Con esos valores cargados como variables de entorno, ejecutar:

```bash
node scripts/configure-supabase-smtp.mjs
```

## Cambios de app

- Registro y magic link ahora usan `emailRedirectTo` hacia `/auth/callback`.
- La UI evita reintentos inmediatos por 5 minutos para no quemar el rate limit.
- El error de limite se muestra con una explicacion clara para usuarios, sin detalles tecnicos.
