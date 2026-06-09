import { NextResponse } from 'next/server';
import { eq, isNull, or, sql } from 'drizzle-orm';
import { content, db } from '@/lib/db/schema';
import { generateJSON } from '@/lib/ai/openai';
import { buildSchemas } from '@/lib/content/schemas';
import type { Content } from '@/lib/db/schema';

const BATCH = 30;

export async function GET(req: Request) {
  const auth = req.headers.get('Authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const articles = await db
    .select()
    .from(content)
    .where(
      or(
        isNull(content.dietTags),
        sql`array_length(${content.dietTags}, 1) is null`,
        isNull(content.schemaArticle),
        sql`(${content.schemaArticle}->>'image') is null`,
      ),
    )
    .limit(BATCH);

  let schemasUpdated = 0;
  let tagsGenerated = 0;
  let tagsFailed = 0;

  for (const article of articles) {
    let dietTags = article.dietTags?.length ? article.dietTags : null;

    // --- Step 1: generate dietTags via AI if missing (failure is non-blocking) ---
    if (!dietTags) {
      try {
        const bodyText = JSON.stringify(article.body ?? {}).slice(0, 600);
        const result = await generateJSON<{ tags: string[] }>(
          `Return a JSON object {"tags": [...]} with 3-6 concise dietary/style tags in the SAME language as the title.
Tags should describe dietary restrictions, meal type, or cooking method (e.g. "vegetariano", "sin gluten", "al horno", "rápido", "vegano").
Do NOT repeat the cuisine name already in the metadata.

Title: ${article.title}
Category: ${article.category ?? 'N/A'}
Cuisine: ${article.cuisine ?? 'N/A'}
Type: ${article.type}
Content excerpt: ${bodyText}`,
          1,
          { maxTokens: 200, temperature: 0.3 },
        );
        const raw = Array.isArray(result.tags) ? result.tags.filter(Boolean).slice(0, 6) : [];
        if (raw.length) {
          dietTags = raw;
          tagsGenerated += 1;
        }
      } catch (err) {
        console.error(`AI tags failed for "${article.title}":`, err);
        tagsFailed += 1;
      }

      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    // --- Step 2: always regenerate schemas (no AI, never fails unless DB is down) ---
    try {
      const enriched = { ...article, dietTags: dietTags ?? article.dietTags } as Content;
      const schemas = buildSchemas(enriched);

      await db
        .update(content)
        .set({
          ...(dietTags ? { dietTags } : {}),
          schemaRecipe: schemas.recipe ?? undefined,
          schemaArticle: schemas.article,
          schemaFaq: null,
          schemaHowto: null,
          schemaBreadcrumb: schemas.breadcrumb,
        })
        .where(eq(content.id, article.id));

      schemasUpdated += 1;
    } catch (err) {
      console.error(`Schema update failed for "${article.title}":`, err);
    }
  }

  return NextResponse.json({
    processed: articles.length,
    schemasUpdated,
    tagsGenerated,
    tagsFailed,
    message: articles.length === BATCH ? 'Run again — more articles remaining' : 'All done',
  });
}
