import { eq } from 'drizzle-orm';
import { getDb, hasDatabase } from '@/lib/db/client';
import { content, generationJobs } from '@/lib/db/schema';
import { generateContent } from './generator';
import { validateContent } from './validator';
import type { ContentType } from './types';

type PipelineInput = {
  topic: string;
  type: ContentType;
  category: string;
  cluster: string;
  uniqueAngle?: string;
  customPrompt?: string;
};

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}

export async function runContentPipeline(input: PipelineInput) {
  const startedAt = Date.now();
  const db = hasDatabase() ? getDb() : null;

  let jobId: string | undefined;

  if (db) {
    const [job] = await db
      .insert(generationJobs)
      .values({
        topic: input.topic,
        contentType: input.type,
        status: 'running',
        startedAt: new Date(),
        attempts: 1,
      })
      .returning();
    jobId = job.id;
  }

  try {
    const draft = await generateContent(input);
    draft.slug = draft.slug?.trim() ? draft.slug : slugify(draft.title || input.topic);
    draft.type = input.type;
    draft.category = input.category;
    draft.topicalCluster = input.cluster;

    const quality = validateContent(draft);

    if (quality.criticalFixes.length > 0) {
      throw new Error(`Validation failed: ${quality.criticalFixes.join(', ')}`);
    }

    const payload = {
      slug: draft.slug,
      type: draft.type,
      title: draft.title,
      metaTitle: draft.metaTitle,
      metaDescription: draft.metaDescription,
      excerpt: draft.excerpt,
      quickAnswer: draft.quickAnswer,
      body: draft.body,
      faq: draft.faq,
      category: draft.category,
      topicalCluster: draft.topicalCluster,
      entityMentions: draft.entityMentions,
      wordCount: draft.wordCount,
      readingTimeMins: draft.readingTimeMins,
      qualityScore: quality.score.toFixed(1),
      status: 'published' as const,
      publishedAt: new Date(),
      updatedAt: new Date(),
    };

    if (db) {
      const existing = await db.select().from(content).where(eq(content.slug, payload.slug)).limit(1);

      const [saved] = existing.length
        ? await db.update(content).set(payload).where(eq(content.slug, payload.slug)).returning()
        : await db.insert(content).values(payload).returning();

      if (jobId) {
        await db
          .update(generationJobs)
          .set({
            status: 'completed',
            contentId: saved.id,
            qualityScore: quality.score.toFixed(1),
            generationMs: Date.now() - startedAt,
            completedAt: new Date(),
          })
          .where(eq(generationJobs.id, jobId));
      }

      return { success: true, contentId: saved.id, slug: saved.slug };
    }

    return { success: true, contentId: 'dry-run', slug: payload.slug, draft: payload };
  } catch (error) {
    if (db && jobId) {
      await db
        .update(generationJobs)
        .set({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : String(error),
          generationMs: Date.now() - startedAt,
          completedAt: new Date(),
        })
        .where(eq(generationJobs.id, jobId));
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
