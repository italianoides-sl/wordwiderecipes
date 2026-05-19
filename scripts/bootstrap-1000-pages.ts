import { generateJSON } from '@/lib/ai/openai';
import { bootstrapContentPages } from '@/lib/content/bootstrap';
import type { ContentType, Locale } from '@/lib/db/schema';

type Topic = { topic: string; contentType: ContentType; locale: Locale };
type TopicResponse = { topics?: Topic[]; trends?: Topic[]; items?: Topic[] };

async function main() {
  const topicsResponse = await generateJSON<Topic[] | TopicResponse>(`
Generate 1000 specific World Wide culinary content topics for WorldWideRecipes.
Mix recipes, techniques, ingredients, guides, spices, and cuisine profiles.
Locales must be es-mx or es.

Return a JSON object with this exact structure:
{
  "topics": [
    {"topic":"","contentType":"recipe","locale":"es-mx"}
  ]
}
The topics array must contain exactly 1000 items.
  `);

  const topics = Array.isArray(topicsResponse)
    ? topicsResponse
    : (topicsResponse.topics ?? topicsResponse.trends ?? topicsResponse.items ?? []);

  if (!Array.isArray(topics) || topics.length === 0) {
    throw new Error('No bootstrap topics returned from AI');
  }

  const batchSize = Number(process.env.BOOTSTRAP_BATCH_SIZE ?? 10);
  for (let i = 0; i < topics.length; i += batchSize) {
    const batch = topics.slice(i, i + batchSize);
    const results = await bootstrapContentPages(batch);
    console.log(`Batch ${i / batchSize + 1}`, results);
  }
}

void main();

export {};
