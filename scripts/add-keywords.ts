import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
  const { eq, sql } = await import('drizzle-orm');
  const { content, db } = await import('@/lib/db/schema');
  const { generateKeywords } = await import('@/lib/content/keywords');

  const articles = await db
    .select({
      id: content.id,
      title: content.title,
      type: content.type,
      cuisine: content.cuisine,
    })
    .from(content)
    .where(
      sql`${content.status} = 'published'
          AND (
            ${content.body}->>'keywords' IS NULL
            OR jsonb_array_length(coalesce(${content.body}->'keywords', '[]'::jsonb)) = 0
          )`,
    );

  if (!articles.length) {
    console.log('All done — no articles without keywords.');
    process.exit(0);
  }

  console.log(`Found ${articles.length} articles. Processing in batches of 20…\n`);

  let ok = 0;
  let fail = 0;
  const chunkSize = 20;

  const processArticle = async (article: (typeof articles)[number]) => {
    try {
      const keywords = await generateKeywords(
        article.title,
        article.type,
        article.cuisine ?? undefined,
      );
      await db
        .update(content)
        .set({
          body: sql`jsonb_set(${content.body}, '{keywords}', ${JSON.stringify(keywords)}::jsonb)`,
        })
        .where(eq(content.id, article.id));
      ok += 1;
    } catch (err) {
      console.error(`  ❌ ${article.title}:`, err instanceof Error ? err.message : err);
      fail += 1;
    }
  };

  for (let i = 0; i < articles.length; i += chunkSize) {
    const chunk = articles.slice(i, i + chunkSize);
    await Promise.all(chunk.map(processArticle));
    console.log(`✅ ${Math.min(i + chunkSize, articles.length)}/${articles.length}`);
  }

  console.log(`\nDone! ${ok} updated, ${fail} failed.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
