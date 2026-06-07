import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

type FaqItem = { question: string; answer: string };

type EnrichmentResponse = {
  intro?: string;
  chef_note?: string;
  variations?: Array<{ name?: string; description?: string }> | string;
  common_mistakes?: Array<{ mistake?: string; solution?: string; fix?: string; avoid?: string }> | string;
  storage?: string;
  serving_suggestions?: string;
  faq?: FaqItem[];
};

function text(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join(' ');
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).map(text).filter(Boolean).join(' ');
  return '';
}

function wordCount(value: unknown): number {
  return text(value).split(/\s+/).filter(Boolean).length;
}

function faqItems(value: unknown): FaqItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const question = text((item as Record<string, unknown>).question).trim();
      const answer = text((item as Record<string, unknown>).answer).trim();
      return question && answer ? { question, answer } : null;
    })
    .filter((item): item is FaqItem => Boolean(item));
}

function contentWordCount(article: { body: unknown; faq?: unknown; title?: string | null; quickAnswer?: string | null }) {
  const body = article.body && typeof article.body === 'object' && !Array.isArray(article.body)
    ? { ...(article.body as Record<string, unknown>) }
    : {};
  const bodyFaq = faqItems(body.faq);
  delete body.faq;

  return wordCount({
    title: article.title ?? '',
    quickAnswer: article.quickAnswer ?? '',
    body,
    faq: bodyFaq.length ? bodyFaq : faqItems(article.faq),
  });
}

function buildPrompt(article: {
  title: string;
  type: string;
  body: Record<string, unknown>;
  faq?: FaqItem[];
  introWords: number;
}) {
  return `You are a professional chef. Enrich this existing culinary article to make it more valuable and personal.

Write in Spanish, in warm conversational "tú" form, with a real chef voice.
Keep the new sections editorial, useful and specific.

Article type: ${article.type}
Title: ${article.title}
Current intro word count: ${article.introWords}
Existing FAQ count: ${article.faq?.length ?? 0}

Existing content:
${JSON.stringify(article.body)}

Existing FAQ:
${JSON.stringify(article.faq ?? [])}

If the intro is under 200 words, return an expanded "intro" field in Spanish with at least 200 words.

Add these sections in Spanish:
1. chef_note: A personal professional tip (around 100 words)
2. variations: 3 recipe or usage variations (around 150 words total)
3. common_mistakes: 3 mistakes and solutions (around 150 words total)
4. storage: Storage and reheating or preservation tips (around 100 words)
5. serving_suggestions: What to serve with it or how to present it (around 80-120 words)
6. faq: Array of 5 objects with "question" and "answer" (each answer minimum 60 words)

Return ONLY the new sections as JSON, not the full article.
Format:
{
  "intro": "",
  "chef_note": "",
  "variations": [{"name":"","description":""}],
  "common_mistakes": [{"mistake":"","solution":""}],
  "storage": "",
  "serving_suggestions": "",
  "faq": [{"question":"","answer":""}]
}`;
}

async function main() {
  const { asc, eq, sql } = await import('drizzle-orm');
  const { generateJSON } = await import('@/lib/ai/openai');
  const { content, db } = await import('@/lib/db/schema');

  const processedIds = new Set<string>();
  let totalUpdated = 0;
  let totalFailed = 0;

  while (true) {
    const batch = await db
      .select({
        id: content.id,
        title: content.title,
        type: content.type,
        body: content.body,
        faq: content.faq,
        wordCount: content.wordCount,
        quickAnswer: content.quickAnswer,
      })
      .from(content)
      .where(sql`${content.status} = 'published' AND coalesce(${content.wordCount}, 0) < 1000`)
      .orderBy(asc(content.wordCount), asc(content.updatedAt))
      .limit(50);

    const articles = batch.filter((article) => !processedIds.has(article.id));
    if (!articles.length) break;

    console.log(`Found ${articles.length} thin articles. Processing in batches of 10...\n`);

    for (let i = 0; i < articles.length; i += 10) {
      const chunk = articles.slice(i, i + 10);

      await Promise.all(
        chunk.map(async (article) => {
          processedIds.add(article.id);

          const body = (article.body && typeof article.body === 'object' && !Array.isArray(article.body))
            ? { ...(article.body as Record<string, unknown>) }
            : {};
          const existingFaq = faqItems(body.faq).length ? faqItems(body.faq) : faqItems(article.faq);
          const introWords = wordCount(body.intro);
          const oldWords = article.wordCount ?? contentWordCount(article);

          try {
            const enrichment = await generateJSON<EnrichmentResponse>(
              buildPrompt({
                title: article.title,
                type: article.type,
                body,
                faq: existingFaq,
                introWords,
              }),
              2,
              { maxTokens: 4096, temperature: 0.7 },
            );

            const mergedFaq = faqItems(enrichment.faq).length ? faqItems(enrichment.faq) : existingFaq;
            const nextBody: Record<string, unknown> = {
              ...body,
              ...(typeof enrichment.intro === 'string' && enrichment.intro.trim() ? { intro: enrichment.intro.trim() } : {}),
              ...(typeof enrichment.chef_note === 'string' && enrichment.chef_note.trim() ? { chef_note: enrichment.chef_note.trim() } : {}),
              ...(enrichment.variations ? { variations: enrichment.variations } : {}),
              ...(enrichment.common_mistakes ? { common_mistakes: enrichment.common_mistakes } : {}),
              ...(typeof enrichment.storage === 'string' && enrichment.storage.trim() ? { storage: enrichment.storage.trim() } : {}),
              ...(typeof enrichment.serving_suggestions === 'string' && enrichment.serving_suggestions.trim()
                ? { serving_suggestions: enrichment.serving_suggestions.trim() }
                : {}),
              ...(mergedFaq.length ? { faq: mergedFaq } : {}),
            };

            const newWords = contentWordCount({
              title: article.title,
              quickAnswer: article.quickAnswer,
              body: nextBody,
              faq: mergedFaq,
            });

            await db
              .update(content)
              .set({
                body: nextBody,
                faq: mergedFaq,
                wordCount: newWords,
                updatedAt: new Date(),
              })
              .where(eq(content.id, article.id));

            totalUpdated += 1;
            console.log(`✅ Enriched: ${article.title} (${oldWords} → ${newWords})`);
          } catch (error) {
            totalFailed += 1;
            console.error(`❌ Failed: ${article.title} — ${error instanceof Error ? error.message : String(error)}`);
          }
        }),
      );
    }
  }

  console.log(`\nDone. ${totalUpdated} enriched, ${totalFailed} failed.`);
}

void main().catch((error) => {
  console.error('Fatal:', error);
  process.exit(1);
});
