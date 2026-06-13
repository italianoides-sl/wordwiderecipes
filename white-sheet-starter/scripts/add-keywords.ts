import { config } from 'dotenv';
import { resolve } from 'path';
import { and, eq, isNull } from 'drizzle-orm';
import { generateJSON } from '@/lib/ai/openai';
import { getDb } from '@/lib/db/client';
import { content } from '@/lib/db/schema';

config({ path: resolve(process.cwd(), '.env.local') });

async function main() {
  const db = getDb();
  const rows = await db
    .select()
    .from(content)
    .where(and(eq(content.status, 'published'), isNull(content.entityMentions)))
    .limit(50);

  for (const article of rows) {
    const keywords = await generateJSON<string[]>(
      `Generate 12 SEO entity keywords for this article as a JSON array only.
Title: ${article.title}
Description: ${article.metaDescription ?? ''}`,
      800,
    );

    await db
      .update(content)
      .set({
        entityMentions: keywords,
        updatedAt: new Date(),
      })
      .where(eq(content.id, article.id));

    console.log(`✅ Keywords: ${article.title}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
