# Casa-Car (web) - Fix Auth Supabase

Este zip trae un `web/` mínimo (Next.js Pages Router) con:
- lib/supabaseClient.js
- Login / Signup / Reset
- Limpieza automática del hash `#error=otp_expired`
- Redirección a /dashboard cuando hay sesión

## 1) Variables de entorno
Copiá `.env.local.example` a `.env.local` y completá:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

## 2) Supabase Dashboard
Authentication > URL Configuration:
- Site URL: http://localhost:3000
- Redirect URLs:
  - http://localhost:3000/**
  - http://127.0.0.1:3000/**
  - http://192.168.0.11:3000/**  (si entrás desde otro dispositivo)

## 3) Correr
npm install
npm run dev
Abrí: http://localhost:3000

## 4) Qué revisar si no loguea
- Consola del browser: faltan env vars?
- Network: token?grant_type=password debe dar 200
- En Supabase Auth logs: debe aparecer /token request completed
