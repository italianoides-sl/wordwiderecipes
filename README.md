# VirtualChef MVP

Web de VirtualChef con:
- Landing + Descargas + Equipamiento
- Panel admin en `/admin`
- API para suscripciones y catálogo de PDFs
- Persistencia de emails/PDFs en SQLite (entorno local/backend propio)

## Estado actual
- `npm run dev` levanta **frontend + API** a la vez (sin error 500 por proxy caído).
- Descargas tienen puerta de anuncio 1 sola vez por navegador.
- Panel admin permite:
  - ver emails
  - exportar CSV
  - añadir/quitar PDFs sin redeploy

## Scripts
- `npm run dev`: frontend + API local
- `npm run dev:web`: solo frontend (Vite, puerto 3000)
- `npm run dev:api`: solo API (puerto 8787)
- `npm run build`: build frontend
- `npm run start`: servidor API + frontend build (`dist`)

## Variables de entorno
Usa `.env.local` (copiando de `.env.example`):

- `PORT`: puerto API (default `8787`)
- `ADMIN_TOKEN`: token para acceder al panel admin/API admin
- `CORS_ORIGIN`: origen permitido para frontend (ej. `https://tuweb.vercel.app`)
- `DATA_DIR` / `DB_PATH`: ruta SQLite

## Desarrollo local (sin 500)
1. `npm install`
2. Crea `.env.local` desde `.env.example`
3. Ejecuta: `npm run dev`
4. Abre: `http://localhost:3000`

## Dónde se guardan emails
En SQLite:
- archivo: `data/virtualchef.sqlite`
- tabla: `subscribers`

## Panel admin
- URL: `/admin`
- Ejemplo local: `http://localhost:3000/admin`
- Introduces `ADMIN_TOKEN`
- Desde ahí:
  - sección derecha: ves emails
  - botón `Exportar CSV`: descarga lista de emails
  - sección izquierda: agregas/quitas PDFs

## Añadir PDF sin redeploy
En `/admin`:
1. Título
2. Descripción
3. URL pública del PDF
4. `Guardar PDF`

La sección `Descargas` lo muestra al recargar.

## Despliegue en Vercel (recomendado en 1 hora)
Importante: SQLite no es persistente/recomendado en Vercel serverless.

### Opción estable recomendada
- Frontend en Vercel
- Backend (esta API Express + SQLite) en un servidor persistente (Render/Railway/Fly/VM)

### Pasos
1. Despliega backend y confirma que responde:
   - `GET https://tu-backend.com/api/health`
2. En backend define envs:
   - `ADMIN_TOKEN`
   - `CORS_ORIGIN=https://tu-dominio-vercel.app`
3. Deploy frontend en Vercel.

Resultado:
- Web: `https://tu-dominio-vercel.app`
- Panel admin: `https://tu-dominio-vercel.app/admin`
- El panel usa el backend remoto para PDFs y emails.

## Endpoints útiles
- `POST /api/subscribers`
- `GET /api/subscribers` (admin token)
- `GET /api/subscribers/export` (admin token)
- `GET /api/pdfs`
- `POST /api/pdfs` (admin token)
- `DELETE /api/pdfs/:id` (admin token)

## Afiliados activos
- Microplane: `https://amzn.to/4aSXsNB`
- Sartén inox: `https://amzn.to/4040vO3`
- Cebollero Arcos: `https://amzn.to/4rGm5nZ`
- Global GS11: `https://amzn.to/4aWAnd6`
