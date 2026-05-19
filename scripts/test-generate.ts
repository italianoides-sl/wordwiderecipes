import { runContentPipeline } from '@/lib/content/pipeline';
import type { ContentType } from '@/lib/db/schema';

const contentTypes: ContentType[] = ['recipe', 'technique', 'ingredient', 'guide', 'spice', 'cuisine'];

async function main() {
  for (const contentType of contentTypes) {
    const result = await runContentPipeline({
      topic: `pieza editorial de prueba para ${contentType}`,
      contentType,
      locale: 'es-mx',
      jobType: 'manual',
    });
    console.log(contentType, result);
  }
}

void main();

export {};
