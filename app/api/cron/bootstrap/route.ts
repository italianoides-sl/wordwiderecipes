import { NextRequest } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';
import { generateJSON } from '@/lib/ai/openai';
import { CONTENT_PLAN, getContentPlanCategory, type ContentPlanCategory } from '@/lib/content/content-plan';
import { runContentPipeline } from '@/lib/content/pipeline';
import { content, db, type ContentType, type Locale } from '@/lib/db/schema';

type BootstrapTopic = {
  topic: string;
  contentType: ContentType;
  locale: Locale;
};

type BootstrapTopicAI = {
  topic: string;
  content_type?: ContentType;
  contentType?: ContentType;
  locale: Locale;
};

type BootstrapTopicResponse = {
  topics?: BootstrapTopicAI[];
  trends?: BootstrapTopicAI[];
  items?: BootstrapTopicAI[];
};

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');
  const headerSecret = request.headers.get('x-cron-secret');
  return Boolean(secret && (authorization === `Bearer ${secret}` || headerSecret === secret));
}

async function getExistingTitles() {
  const existing = await db
    .select({ title: content.title, slug: content.slug })
    .from(content)
    .where(eq(content.status, 'published'));

  return existing.map((row) => row.title.toLowerCase());
}

async function countPublishedInCategory(category: ContentPlanCategory) {
  const [row] = await db
    .select({ count: sql`count(*)` })
    .from(content)
    .where(
      and(
        eq(content.status, 'published'),
        eq(content.type, category.type),
        sql`(${content.category} = ${category.category} OR ${content.originalData}->>'content_category' = ${category.category})`,
      ),
    );

  return Number(row?.count ?? 0);
}

async function getBootstrapTopics(category: ContentPlanCategory, limit: number): Promise<BootstrapTopic[]> {
  const existingTitles = await getExistingTitles();
  const topicsResponse = await generateJSON<BootstrapTopicAI[] | BootstrapTopicResponse>(`
Create ${limit} specific Spanish-language culinary content topics for a bootstrap batch.

Category: ${category.category}
Content type: ${category.type}
Category focus:
${category.prompt_focus}

DO NOT generate any of these already published topics:
${existingTitles.slice(0, 100).join(', ') || 'No published topics yet.'}

Generate something completely different.
Use locales es-mx and es, with a slight preference for es-mx.
Avoid generic titles. Each topic must have clear search intent and natural affiliate potential.

Return a JSON object with this exact structure:
{
  "topics": [
    {"topic":"specific topic","content_type":"${category.type}","locale":"es-mx"}
  ]
}
The topics array must contain exactly ${limit} items.
  `);

  const topics = Array.isArray(topicsResponse)
    ? topicsResponse
    : (topicsResponse.topics ?? topicsResponse.trends ?? topicsResponse.items ?? []);

  if (!Array.isArray(topics) || topics.length === 0) {
    throw new Error(`No bootstrap topics returned for ${category.category}`);
  }

  return topics.slice(0, limit).map((topic) => ({
    topic: topic.topic,
    contentType: topic.content_type ?? topic.contentType ?? category.type,
    locale: topic.locale,
  }));
}

async function runBootstrapBatch(category: ContentPlanCategory) {
  const totalBefore = await countPublishedInCategory(category);
  const remainingBefore = Math.max(category.quota - totalBefore, 0);
  const batchSize = Math.min(10, remainingBefore);

  if (batchSize === 0) {
    return {
      category: category.category,
      generated: 0,
      total_in_category: totalBefore,
      quota: category.quota,
      remaining: 0,
      next_batch: null,
      jobs: [],
    };
  }

  const batch = await getBootstrapTopics(category, batchSize);
  const jobs = [];
  let generated = 0;

  for (const item of batch) {
    const result = await runContentPipeline({
      topic: item.topic,
      contentType: item.contentType,
      locale: item.locale,
      jobType: 'bootstrap',
      promptVersion: process.env.CONTENT_PROMPT_VERSION ?? 'v1.0',
      contentCategory: category.category,
      promptFocus: category.prompt_focus,
    });

    jobs.push({ topic: item.topic, ...result });
    if (result.success) generated += 1;
  }

  const total = await countPublishedInCategory(category);
  const remaining = Math.max(category.quota - total, 0);

  return {
    category: category.category,
    generated,
    total_in_category: total,
    quota: category.quota,
    remaining,
    next_batch: remaining > 0 ? `/api/cron/bootstrap?category=${category.category}` : null,
    jobs,
  };
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const requestedCategory = request.nextUrl.searchParams.get('category');
  const category = getContentPlanCategory(requestedCategory);

  if (requestedCategory && !category) {
    return Response.json(
      {
        error: 'Unknown category',
        categories: CONTENT_PLAN.map((item) => item.category),
      },
      { status: 400 },
    );
  }

  if (category) {
    return Response.json(await runBootstrapBatch(category));
  }

  const results = [];
  for (const item of CONTENT_PLAN) {
    results.push(await runBootstrapBatch(item));
  }

  return Response.json({
    generated: results.reduce((total, item) => total + item.generated, 0),
    remaining: results.reduce((total, item) => total + item.remaining, 0),
    categories: results,
  });
}

export const GET = POST;
