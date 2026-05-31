import { NextResponse } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';
import { generateText } from '@/lib/ai/openai';
import { content, db } from '@/lib/db/schema';
import { fetchArticleImages } from '@/lib/images/unsplash';

export async function GET(req: Request) {
  const auth = req.headers.get('Authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const articles = await db
    .select({
      id: content.id,
      title: content.title,
      type: content.type,
      cuisine: content.cuisine,
      body: content.body,
      imageUrl: content.imageUrl,
      imageAlt: content.imageAlt,
      imageAttribution: content.imageAttribution,
      ogImageUrl: content.ogImageUrl,
    })
    .from(content)
    .where(
      and(
        eq(content.status, 'published'),
        sql`(${content.imageUrl} is null OR jsonb_array_length(coalesce(${content.body}->'images', '[]'::jsonb)) < 2)`,
      ),
    )
    .limit(30);

  let updated = 0;

  for (const article of articles) {
    try {
      const query = await generateText(`
        4-word English Unsplash search query for:
        "${article.title}" (${article.cuisine ?? ''} cuisine)
        Return ONLY the search query, nothing else.
      `);

      const images = await fetchArticleImages({
        contentType: article.type,
        cuisine: article.cuisine ?? undefined,
        title: article.title,
        customQuery: query.trim(),
        count: 3,
      });

      if (images.length > 0) {
        const body = {
          ...(article.body ?? {}),
          images,
        };

        await db
          .update(content)
          .set({
            body,
            imageUrl: article.imageUrl ?? images[0].url,
            imageAlt: article.imageAlt ?? images[0].alt,
            imageAttribution: article.imageAttribution ?? images[0].attribution,
            ogImageUrl: article.ogImageUrl ?? article.imageUrl ?? images[0].url,
          })
          .where(eq(content.id, article.id));

        updated += 1;
        console.log(`Image added: ${article.title}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err) {
      console.error(`Image failed for ${article.title}:`, err);
    }
  }

  return NextResponse.json({
    updated,
    total: articles.length,
    remaining: articles.length - updated,
  });
}
