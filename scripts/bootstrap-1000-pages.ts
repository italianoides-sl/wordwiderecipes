import { generateJSON } from '@/lib/ai/gemini';
import { bootstrapContentPages } from '@/lib/content/bootstrap';
import type { ContentType, Locale } from '@/lib/db/schema';

type Topic = { topic: string; contentType: ContentType; locale: Locale };

async function main() {
  const topics = await generateJSON<Topic[]>(`
Generate 1000 specific Spanish culinary content topics for WorldWideRecipes.
Mix recipes, techniques, ingredients, guides, spices, and cuisine profiles.
Locales must be es-mx or es. Return ONLY valid JSON:
[{"topic":"","contentType":"recipe","locale":"es-mx"}]
  `);

  const batchSize = Number(process.env.BOOTSTRAP_BATCH_SIZE ?? 10);
  for (let i = 0; i < topics.length; i += batchSize) {
    const batch = topics.slice(i, i + batchSize);
    const results = await bootstrapContentPages(batch);
    console.log(`Batch ${i / batchSize + 1}`, results);
  }
}

void main();

export {};
