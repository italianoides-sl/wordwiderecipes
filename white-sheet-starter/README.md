# White Sheet Codex SEO Starter

Starter white-label para lanzar una web editorial programática con:

- Next.js App Router
- pipeline de generación con OpenAI
- cron endpoints para bootstrap y publicación diaria
- base de datos PostgreSQL/Supabase con Drizzle
- SEO técnico listo para indexación
- estructura preparada para integrar `codex-seo`

No está atado a recetas. Lo único que debes reescribir para tu nicho es:

- marca y links
- claves API
- prompts editoriales
- tipos de contenido y topics base
- copy legal y monetización

## Qué incluye

- `app/`: web pública, endpoints cron, sitemap, robots y `llms.txt`
- `components/`: homepage, cards, detail pages y JSON-LD
- `lib/content/`: prompts, generación, validación y pipeline
- `lib/seo/`: metadata, schema y sitemap helpers
- `lib/db/`: tablas y queries
- `scripts/`: bootstrap manual, enriquecimiento, keywords e interlinking
- `.github/workflows/`: ejemplo de publicación diaria
- `supabase/migrations/`: SQL inicial
- `docs/CODEX_SEO.md`: cómo conectar este starter con tu toolkit `codex-seo`

## Qué personalizar primero

1. Copia `.env.example` a `.env.local`.
2. Cambia marca, dominio y redes en `lib/config/site.ts`.
3. Reescribe los prompts en `lib/content/prompts.ts`.
4. Ajusta los tipos y topics base en `lib/content/content-plan.ts`.
5. Cambia homepage y copy visual en `components/homepage/HeroBanner.tsx`.
6. Adapta schema y metadata si tu nicho necesita `Product`, `Course`, `Service`, etc.

## Instalación

```bash
npm install
```

Si usas Supabase:

1. crea un proyecto nuevo
2. ejecuta `supabase/migrations/001_initial_schema.sql`
3. rellena `DATABASE_URL`

## Scripts

```bash
npm run dev
npm run build
npm run bootstrap-content
npm run enrich-content
npm run add-keywords
npm run add-internal-links
```

## Flujo recomendado

1. Define 20-50 topics base por clúster en `content-plan.ts`.
2. Ejecuta bootstrap para llenar el site con artículos semilla.
3. Programa `daily-content` desde GitHub Actions o cron externo.
4. Añade `codex-seo` para auditorías, schema, hreflang, sitemap y contenido.
5. Usa Search Console + logs de `generation_jobs` para iterar.

## Estructura de prompts

Los prompts están separados a propósito:

- `NICHE_POSITIONING`
- `BRAND_VOICE`
- `EDITORIAL_REQUIREMENTS`
- `CONTENT_TYPE_INSTRUCTIONS`

Eso te permite cambiar de nicho sin tocar el pipeline.

## Integración con codex-seo

Este starter no duplica tu toolkit `codex-seo`. Lo integra.

Lee `docs/CODEX_SEO.md` para:

- checklist de instalación
- qué comandos correr tras cada deploy
- cómo usarlo para clusterización, auditoría técnica y schema QA

## Variables que deben quedar privadas

- `OPENAI_API_KEY`
- `DATABASE_URL`
- credenciales Google
- cualquier API de scraping, analytics o afiliación

## Puntos que debes revisar antes de producción

- legal: privacidad, cookies, disclosure de afiliados y política IA
- monetización: ads.txt, CMP, tracking y eventos
- imágenes: licencias, CDN y tamaños
- schema: adaptar al tipo real de negocio
- revisión editorial: no publiques sin guardrails en un nicho YMYL

## Qué no he fijado adrede

- prompts definitivos
- branding
- enlaces personales
- claves API
- taxonomía exacta del nicho
- páginas legales finales

Eso queda libre para que lo reescribas sin arrastrar la identidad de este proyecto.
