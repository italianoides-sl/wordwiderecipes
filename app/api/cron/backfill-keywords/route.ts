import { NextResponse } from 'next/server';
import { eq, or, sql } from 'drizzle-orm';
import { content, db } from '@/lib/db/schema';
import { generateJSON } from '@/lib/ai/openai';
import { buildSchemas } from '@/lib/content/schemas';
import type { Content } from '@/lib/db/schema';

// Processes up to BATCH articles per call. Run repeatedly until remaining === 0.
const BATCH = 30;

function draftToContent(row: typeof content.$inferSelect): Content {
  return row as Content;
}

export async function GET(req: Request) {
  const auth = req.headers.get('Authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Articles missing dietTags OR where schemaArticle has no image field stored
  const articles = await db
    .select()
    .from(content)
    .where(
      or(
        sql`${content.dietTags} is null`,
        sql`array_length(${content.dietTags}, 1) is null`,
        sql`${content.schemaArticle} is null`,
        sql`${content.schemaArticle}->>'image' is null`,
      ),
    )
    .limit(BATCH);

  let updated = 0;
  let skipped = 0;

  for (const article of articles) {
    try {
      // --- 1. Generate dietTags if missing ---
      let dietTags = article.dietTags ?? [];

      if (!dietTags.length) {
        const bodyText = JSON.stringify(article.body ?? {}).slice(0, 600);
        const result = await generateJSON<{ tags: string[] }>(
          `You are a recipe classification assistant. Based on the following recipe info, return a JSON object {"tags": [...]} with 3-6 concise dietary/style tags in the SAME language as the title. Tags should describe dietary restrictions, meal type, cooking method, or cuisine style (e.g. "vegetariano", "sin gluten", "al horno", "rápido", "vegano", "sin lactosa"). Do NOT repeat the cuisine name already in the metadata.

Title: ${article.title}
Category: ${article.category ?? 'N/A'}
Cuisine: ${article.cuisine ?? 'N/A'}
Type: ${article.type}
Content excerpt: ${bodyText}`,
          1,
          { maxTokens: 120, temperature: 0.4 },
        );
        dietTags = Array.isArray(result.tags) ? result.tags.filter(Boolean).slice(0, 6) : [];
      }

      // --- 2. Regenerate schemas with improved builder ---
      const enriched: Content = draftToContent({ ...article, dietTags });
      const schemas = buildSchemas(enriched);

      await db
        .update(content)
        .set({
          dietTags: dietTags.length ? dietTags : article.dietTags,
          schemaRecipe: schemas.recipe ?? undefined,
          schemaArticle: schemas.article,
          schemaFaq: schemas.faq,
          schemaBreadcrumb: schemas.breadcrumb,
        })
        .where(eq(content.id, article.id));

      updated += 1;
    } catch (err) {
      console.error(`backfill-keywords failed for "${article.title}":`, err);
      skipped += 1;
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return NextResponse.json({
    processed: articles.length,
    updated,
    skipped,
    message: articles.length === BATCH ? 'Run again — more articles remaining' : 'All done',
  });
}
