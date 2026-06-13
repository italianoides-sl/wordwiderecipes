# Integración con codex-seo

Este starter está pensado para convivir con una instalación local o remota de `codex-seo`.

## Uso recomendado

1. Mantén `codex-seo` como carpeta hermana o submódulo.
2. Ejecuta auditorías antes de lanzar y después de cada bloque grande de contenido.
3. Usa `codex-seo` para:
   - auditoría técnica
   - validación de schema
   - análisis de sitemap
   - clustering y roadmap de contenido
   - revisión de performance y render

## Flujo mínimo

```bash
python ../codex-seo/scripts/verify_environment.py
python ../codex-seo/scripts/analyze_technical.py --url https://example.com
python ../codex-seo/scripts/analyze_schema.py --url https://example.com
python ../codex-seo/scripts/analyze_sitemap.py --url https://example.com/sitemap.xml
python ../codex-seo/scripts/generate_seo_plan.py --site https://example.com
```

## Qué revisar en este starter con codex-seo

- titles y meta descriptions
- canonical coherente
- JSON-LD visible + válido
- arquitectura interna de enlaces
- cobertura del sitemap
- indexabilidad de páginas cron/publicadas
- rendimiento de plantillas

## Personalización

Si tu nicho es local, ecommerce, info-productos o comparativas:

- adapta `lib/seo/schema.ts`
- crea rutas nuevas para hubs programáticos
- añade validaciones específicas en `lib/content/validator.ts`
