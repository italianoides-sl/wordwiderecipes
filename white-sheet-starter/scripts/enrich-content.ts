import { config } from 'dotenv';
import { resolve } from 'path';
import { eq, lt } from 'drizzle-orm';
import { generateJSON } from '@/lib/ai/openai';
import { getDb } from '@/lib/db/client';
import { content } from '@/lib/db/schema';

config({ path: resolve(process.cwd(), '.env.local') });

type Enrichment = {
  experts_note: string;
  mistakes: string;
  variations: string;
  next_steps: string;
  faq: Array<{ question: string; answer: string }>;
};

async function main() {
  const db = getDb();
  const rows = await db
    .select()
    .from(content)
    .where(lt(content.wordCount, 1000))
    .limit(25);

  for (const article of rows) {
    const extra = await generateJSON<Enrichment>(
      `Enrich this article for a premium editorial site.
Return valid JSON only with:
{ "experts_note": "", "mistakes": "", "variations": "", "next_steps": "", "faq": [{"question":"","answer":""}] }
Existing body: ${JSON.stringify(article.body)}`,
      3000,
    );

    const body = article.body as Record<string, unknown>;
    const mergedBody = {
      ...body,
      experts_note: extra.experts_note,
      mistakes: extra.mistakes,
      variations: extra.variations,
      next_steps: extra.next_steps,
    };

    await db
      .update(content)
      .set({
        body: mergedBody,
        faq: extra.faq,
        updatedAt: new Date(),
      })
      .where(eq(content.id, article.id));

    console.log(`✅ Enriched: ${article.title}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
