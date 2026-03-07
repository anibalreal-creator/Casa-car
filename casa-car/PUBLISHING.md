# PUBLISHING.md — Publicar Casa‑Car (web + app) paso a paso (principiante)

Fecha guía: 16/12/2025 (Argentina)

## 1) Objetivo
Publicar:
- Web en HTTPS (Vercel)
- Backend en internet (Render/Railway/Fly/VPS)
- App Android/iOS con EAS (AAB/IPA) y luego subir a tiendas

---

## 2) Instalar en tu PC (una sola vez)
- Git: https://git-scm.com/downloads
- Node.js LTS: https://nodejs.org
- Docker Desktop: https://www.docker.com/products/docker-desktop/
- (Opcional) VS Code: https://code.visualstudio.com/

---

## 3) Probar local (para saber que funciona)
### 3.1 Backend + DB
En la raíz:
```bash
docker compose -f docker-compose.dev.yml up --build
```
Probá:
- http://localhost:4000/health
- http://localhost:4000/listings

### 3.2 Web
```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```
Abrí: http://localhost:3000

### 3.3 App (Expo)
```bash
cd mobile
npm install
cp .env.example .env
npx expo start
```

---

## 4) Subir a GitHub
1) Crear repo en GitHub llamado `casa-car`
2) En tu terminal (raíz):
```bash
git init
git add .
git commit -m "Casa-Car initial"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/casa-car.git
git push -u origin main
```

---

## 5) Publicar Web en HTTPS (Vercel)
1) Vercel → New Project → Import from GitHub
2) Elegí el repo `casa-car`
3) **Root directory:** `web`
4) Env Vars:
- NEXT_PUBLIC_API_URL = tu backend (por ahora http://localhost:4000)
5) Deploy → listo ✅ (URL https://...)

---

## 6) Publicar Backend (Render recomendado)
1) Render → New Web Service → conectar GitHub
2) Root directory: `backend`
3) Build command:
```bash
npm install && npm run build
```
4) Start command:
```bash
node dist/main.js
```
5) Agregar variables de entorno (Render):
- PORT=4000
- DATABASE_URL=...
- S3_BUCKET / S3_REGION / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY

---

## 7) Subida de fotos a publicaciones (S3)
El backend trae un endpoint demo:
- POST /media/presign
Que devuelve `uploadUrl` y `fileUrl`.
En producción se reemplaza por firma real S3 (AWS SDK).

---

## 8) Builds Android/iOS (Expo EAS)
En tu PC:
```bash
npm install -g eas-cli
eas login
```
Dentro de `mobile/`:
```bash
eas build -p android --profile production
eas build -p ios --profile production
```

---

## 9) Automatización en GitHub Actions
El workflow `.github/workflows/deploy.yml`:
- Deploy web a Vercel al hacer push a main
- Builds móviles al ejecutar manualmente (workflow_dispatch)

### Secrets necesarios en GitHub
- VERCEL_TOKEN
- VERCEL_ORG_ID
- VERCEL_PROJECT_ID
- EAS_TOKEN

---

## 10) Orden exacto recomendado
1) Probar local ✅
2) Subir a GitHub ✅
3) Deploy web Vercel ✅
4) Deploy backend Render ✅
5) Cambiar NEXT_PUBLIC_API_URL y API_URL a tu backend real ✅
6) EAS builds ✅
7) Subir a stores ✅

Cuando me digas “estoy en el paso X”, te guío con clicks exactos.
