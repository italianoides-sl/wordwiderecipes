import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
  const { sql } = await import('drizzle-orm');
  const { content, db } = await import('@/lib/db/schema');
  const { computeInternalLinks } = await import('@/lib/content/internal-linker');

  const articles = await db
    .select({ id: content.id, title: content.title, locale: content.locale })
    .from(content)
    .where(
      sql`${content.status} = 'published'
          AND (
            ${content.relatedSlugs} IS NULL
            OR array_length(${content.relatedSlugs}, 1) IS NULL
          )`,
    );

  if (!articles.length) {
    console.log('All done — every article already has related links.');
    process.exit(0);
  }

  console.log(`Found ${articles.length} articles. Processing in batches of 20…\n`);

  let ok = 0;
  let fail = 0;
  const chunkSize = 20;

  const processArticle = async (article: (typeof articles)[number]) => {
    try {
      await computeInternalLinks(article.id, article.locale);
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
