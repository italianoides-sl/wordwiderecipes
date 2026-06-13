import { config } from 'dotenv';
import { resolve } from 'path';
import { STARTER_TOPICS } from '@/lib/content/content-plan';
import { runContentPipeline } from '@/lib/content/pipeline';

config({ path: resolve(process.cwd(), '.env.local') });

async function main() {
  for (const topic of STARTER_TOPICS) {
    const result = await runContentPipeline({
      topic: topic.topic,
      type: topic.type,
      category: topic.category,
      cluster: topic.cluster,
      uniqueAngle: topic.uniqueAngle,
    });

    if (result.success) {
      console.log(`✅ Generated: ${topic.topic}`);
    } else {
      console.log(`❌ Failed: ${topic.topic} -> ${result.error}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
