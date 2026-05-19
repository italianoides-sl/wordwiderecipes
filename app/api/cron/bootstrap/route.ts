import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { generateJSON } from '@/lib/ai/gemini';
import { runContentPipeline } from '@/lib/content/pipeline';
import { db, generationJobs, type ContentType, type Locale } from '@/lib/db/schema';

type BootstrapTopic = {
  topic: string;
  contentType: ContentType;
  locale: Locale;
};

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');
  const headerSecret = request.headers.get('x-cron-secret');
  return Boolean(secret && (authorization === `Bearer ${secret}` || headerSecret === secret));
}

async function getBootstrapTopics(offset: number, limit: number): Promise<BootstrapTopic[]> {
  const topics = await generateJSON<Array<{ topic: string; content_type: ContentType; locale: Locale }>>(`
Create ${limit} specific Spanish-language culinary content topics for a bootstrap batch.
Start at catalog offset ${offset}.
Mix content types across recipe, technique, ingredient, guide, spice, and cuisine.
Use locales es-mx and es, with a slight preference for es-mx.
Avoid generic titles. Each topic must have clear search intent and natural affiliate potential.

Return ONLY valid JSON:
[{"topic":"specific topic","content_type":"recipe|technique|ingredient|guide|spice|cuisine","locale":"es-mx|es"}]
  `);

  return topics.map((topic) => ({
    topic: topic.topic,
    contentType: topic.content_type,
    locale: topic.locale,
  }));
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const completedJobs = await db
    .select({ id: generationJobs.id })
    .from(generationJobs)
    .where(eq(generationJobs.jobType, 'bootstrap'));

  const offset = completedJobs.length;
  const batch = await getBootstrapTopics(offset, 50);
  const jobs = [];
  let batchComplete = 0;

  for (const item of batch) {
    const result = await runContentPipeline({
      topic: item.topic,
      contentType: item.contentType,
      locale: item.locale,
      jobType: 'bootstrap',
      promptVersion: process.env.CONTENT_PROMPT_VERSION ?? 'v1.0',
    });

    jobs.push({ topic: item.topic, ...result });
    if (result.success) batchComplete += 1;
  }

  const total = offset + batchComplete;
  return Response.json({
    batch_complete: batchComplete,
    total,
    remaining: Math.max(1000 - total, 0),
    jobs,
  });
}

export const GET = POST;
