import { and, eq, isNull } from 'drizzle-orm';
import { content, db } from '@/lib/db/schema';
import { indexBatch } from '@/lib/seo/google-indexing';

const BASE_URL = 'https://worldwiderecipes.app';

export async function GET(req: Request) {
  const auth = req.headers.get('Authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const unindexed = await db
      .select({ id: content.id, slug: content.slug, type: content.type })
      .from(content)
      .where(and(eq(content.status, 'published'), isNull(content.indexedAt)))
      .limit(5);

    const urlsToIndex = unindexed.slice(0, 5);

    const indexedIds: string[] = [];
    let success = 0;
    let failed = 0;

    for (const article of urlsToIndex) {
      const url = `${BASE_URL}/${article.type}/${article.slug}`;
      const result = await indexBatch([url]);

      if (result.success === 1) {
        indexedIds.push(article.id);
        success += 1;
      } else {
        failed += 1;
      }
    }

    if (indexedIds.length > 0) {
      await db
        .update(content)
        .set({ indexedAt: new Date() })
        .where(and(eq(content.status, 'published'), isNull(content.indexedAt), eq(content.id, indexedIds[0])));

      for (const id of indexedIds.slice(1)) {
        await db
          .update(content)
          .set({ indexedAt: new Date() })
          .where(and(eq(content.status, 'published'), isNull(content.indexedAt), eq(content.id, id)));
      }
    }

    return Response.json({ success, failed });
  } catch (error) {
    console.error('INDEX EXISTING CRON ERROR:', error);
    return Response.json({ error: 'Indexing cron failed' }, { status: 500 });
  }
}
