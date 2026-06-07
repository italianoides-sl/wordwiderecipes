import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { HIGH_PRIORITY_KITCHEN_THEORY_GUIDES } from '@/lib/content/content-plan';
import { runContentPipeline } from '@/lib/content/pipeline';
import { content, db } from '@/lib/db/schema';

const KITCHEN_THEORY_GUIDES = HIGH_PRIORITY_KITCHEN_THEORY_GUIDES;
const BATCH_SIZE = 5;
const ARTICLE_TIMEOUT_MS = 45_000;

function buildPromptFocus(item: (typeof KITCHEN_THEORY_GUIDES)[number]) {
  return `You are a professional chef with 15+ years of experience working in high-end restaurants in Ibiza, Spain.

Write a comprehensive, authoritative guide about:
"${item.topic}"

Unique angle: ${item.unique_angle}

Requirements:
- Minimum 1000 words
- Written in Spanish using "tú" form
- Warm, professional, personal tone — like a mentor talking to a student
- Include real anecdotes and examples from professional kitchen experience
- Keep all key sections: intro, professional tips, common mistakes, and FAQ
- Make each section shorter, tighter, and more concise than a long-form 2000-word guide
- Structure with clear H2 and H3 sections
- Include a "Lo que nadie te dice" section with honest insights
- Include "Errores comunes" section
- Include "Consejos profesionales" section
- Include FAQ with 5 detailed questions and answers
- End with a concise motivational conclusion
- This is NOT a recipe — it is editorial professional content
- Make it feel like it was written by a real human chef, not AI`;
}

async function runWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');
  const headerSecret = request.headers.get('x-cron-secret');
  return Boolean(secret && (authorization === `Bearer ${secret}` || headerSecret === secret));
}

async function getPublishedTitles() {
  const existing = await db
    .select({ title: content.title })
    .from(content)
    .where(eq(content.status, 'published'));

  return new Set(existing.map((row) => row.title.toLowerCase()));
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const publishedTitles = await getPublishedTitles();

    const pending = KITCHEN_THEORY_GUIDES.filter((topic) => !publishedTitles.has(topic.topic.toLowerCase()));

    const batch = pending.slice(0, BATCH_SIZE);

    if (batch.length === 0) {
      return Response.json({
        success: true,
        message: 'All kitchen theory guides published',
        total: KITCHEN_THEORY_GUIDES.length,
        remaining: 0,
      });
    }

    const jobs: Array<Record<string, unknown>> = [];
    let generated = 0;

    for (const item of batch) {
      let result: { success: boolean; contentId?: string; error?: string };

      try {
        result = await runWithTimeout(
          runContentPipeline({
            topic: item.topic,
            contentType: item.contentType,
            locale: item.locale,
            jobType: 'bootstrap',
            promptVersion: process.env.CONTENT_PROMPT_VERSION ?? 'v1.0',
            contentCategory: 'guias',
            promptFocus: buildPromptFocus(item),
          }),
          ARTICLE_TIMEOUT_MS,
        );
      } catch (err) {
        result = {
          success: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }

      jobs.push({ topic: item.topic, ...result });
      if (result.success) generated += 1;
    }

    const remaining = pending.length - batch.length;

    console.log(
      `Bootstrap guides batch: ${generated}/${batch.length} published. ${remaining} topics remaining.`,
    );

    return Response.json({
      success: true,
      generated,
      attempted: batch.length,
      remaining,
      total: KITCHEN_THEORY_GUIDES.length,
      next_batch: remaining > 0 ? '/api/cron/bootstrap-guides' : null,
      jobs,
    });
  } catch (err) {
    console.error('Bootstrap guides cron error:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

export const GET = POST;
