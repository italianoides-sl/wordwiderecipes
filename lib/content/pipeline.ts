import { and, eq } from 'drizzle-orm';
import {
  content,
  db,
  generationJobs,
  sitemapIndex,
  type Content,
  type ContentType,
  type Locale,
} from '@/lib/db/schema';
import { fetchArticleImages, type ContentImage } from '@/lib/images/unsplash';
import { generateText } from '@/lib/ai/openai';
import { indexUrl } from '@/lib/seo/google-indexing';
import { updateHomepageConfig } from '@/lib/homepage/config';
import { buildSchemas } from './schemas';
import { detectMarketFromLocale, injectAffiliateLinks } from './affiliate-injector';
import { generateContent } from './generator';
import { computeInternalLinks } from './internal-linker';
import { validateContent } from './validator';
import type { ContentDraft, QualityReport } from './types';

type PipelineConfig = {
  topic: string;
  contentType: ContentType | string;
  locale: Locale | string;
  jobType: 'bootstrap' | 'daily_cron' | 'manual';
  promptVersion?: string;
};

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL ?? 'https://worldwiderecipes.app';
}

function sitemapFileFor(type: string, locale: string) {
  if (type === 'recipe') return `sitemap-recipes-${locale}.xml`;
  if (type === 'technique') return 'sitemap-techniques.xml';
  if (type === 'ingredient' || type === 'spice') return 'sitemap-ingredients.xml';
  if (type === 'guide' || type === 'cuisine') return 'sitemap-guides.xml';
  return 'sitemap.xml';
}

async function createJob(config: PipelineConfig) {
  const [job] = await db
    .insert(generationJobs)
    .values({
      jobType: config.jobType,
      status: 'running',
      topic: config.topic,
      contentType: config.contentType,
      locale: config.locale,
      promptVersion: config.promptVersion ?? process.env.CONTENT_PROMPT_VERSION ?? 'v1.0',
      startedAt: new Date(),
      attempts: 0,
    })
    .returning();

  return job;
}

async function updateJob(
  jobId: string,
  values: {
    status?: 'pending' | 'running' | 'completed' | 'failed' | 'partial';
    content_id?: string;
    quality_score?: number;
    image_generated?: boolean;
    indexed?: boolean;
    error_message?: string;
    error_details?: Record<string, unknown>;
    attempts?: number;
    completed_at?: string;
    generation_ms?: number;
  },
) {
  await db
    .update(generationJobs)
    .set({
      status: values.status,
      contentId: values.content_id,
      qualityScore: values.quality_score === undefined ? undefined : values.quality_score.toFixed(1),
      imageGenerated: values.image_generated,
      indexed: values.indexed,
      errorMessage: values.error_message,
      errorDetails: values.error_details,
      attempts: values.attempts,
      completedAt: values.completed_at ? new Date(values.completed_at) : undefined,
      generationMs: values.generation_ms,
    })
    .where(eq(generationJobs.id, jobId));
}

function draftToContentForSchemas(draft: ContentDraft): Content {
  const now = new Date();
  return {
    id: '00000000-0000-0000-0000-000000000000',
    slug: draft.slug,
    locale: draft.locale,
    type: draft.type,
    title: draft.title,
    metaTitle: draft.metaTitle ?? null,
    metaDescription: draft.metaDescription ?? null,
    canonicalUrl: draft.canonicalUrl ?? `${getBaseUrl()}/${draft.type}/${draft.slug}`,
    quickAnswer: draft.quickAnswer ?? null,
    definition: draft.definition ?? null,
    keyFacts: draft.keyFacts ?? null,
    stepsSummary: draft.stepsSummary ?? null,
    authorEntity: draft.authorEntity ?? 'WorldWideRecipes Editorial Team',
    expertReviewed: draft.expertReviewed ?? false,
    primarySources: draft.primarySources ?? null,
    originalData: draft.originalData ?? null,
    entityMentions: draft.entityMentions ?? null,
    citationSummary: draft.citationSummary ?? null,
    body: draft.body,
    imageUrl: draft.imageUrl ?? null,
    imageAlt: draft.imageAlt ?? null,
    imageAttribution: draft.imageAttribution ?? null,
    ogImageUrl: draft.ogImageUrl ?? draft.imageUrl ?? null,
    cuisine: draft.cuisine ?? null,
    category: draft.category ?? null,
    dietTags: draft.dietTags ?? null,
    difficulty: draft.difficulty ?? null,
    totalTimeMins: draft.totalTimeMins ?? null,
    season: draft.season ?? null,
    relatedSlugs: draft.relatedSlugs ?? null,
    parentSlug: draft.parentSlug ?? null,
    tiktokHashtags: draft.tiktokHashtags ?? null,
    affiliateLinks: draft.affiliateLinks ?? null,
    schemaRecipe: null,
    schemaHowto: null,
    schemaArticle: null,
    schemaFaq: null,
    schemaBreadcrumb: null,
    faq: draft.faq ?? null,
    qualityScore: draft.qualityScore?.toFixed(1) ?? null,
    qualityDetails: draft.qualityDetails ?? null,
    aiModel: draft.aiModel ?? 'gpt-4o-mini',
    generationPromptVersion: draft.generationPromptVersion ?? null,
    humanReviewed: false,
    humanReviewedAt: null,
    wordCount: draft.wordCount ?? null,
    readingTimeMins: draft.readingTimeMins ?? null,
    internalLinkCount: draft.internalLinkCount ?? 0,
    outboundLinkCount: draft.outboundLinkCount ?? 0,
    impressions7d: 0,
    clicks7d: 0,
    avgPosition7d: null,
    topQueries: null,
    status: 'published',
    publishedAt: now,
    updatedAt: now,
    indexedAt: null,
    lastCrawledAt: null,
    aiGenerated: true,
  };
}

function countWords(draft: ContentDraft): number {
  return JSON.stringify(draft).split(/\s+/).filter(Boolean).length;
}

function sanitizeContent(draft: ContentDraft): ContentDraft {
  const clean = (obj: unknown): unknown => {
    if (typeof obj === 'string') return obj.trim().replace(/\n{3,}/g, '\n\n');
    if (Array.isArray(obj)) return obj.map(clean);
    if (obj && typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj as Record<string, unknown>).map(([key, value]) => [key, clean(value)]),
      );
    }
    return obj;
  };

  const sanitized = clean(draft) as ContentDraft;
  const filterSteps = (steps: unknown) => {
    if (!Array.isArray(steps)) return [];
    return steps
      .map((step) => {
        if (!step || typeof step !== 'object') return { text: '' };
        const record = step as Record<string, unknown>;
        return {
          ...record,
          text: typeof record.text === 'string' ? record.text.trim() : '',
        };
      })
      .filter((step) => {
        return step.text.length >= 40;
      });
  };

  sanitized.body = {
    ...sanitized.body,
    ...(Array.isArray(sanitized.body?.steps) ? { steps: filterSteps(sanitized.body.steps) } : {}),
    ...(Array.isArray(sanitized.body?.step_by_step_plan) ? { step_by_step_plan: filterSteps(sanitized.body.step_by_step_plan) } : {}),
    ...(Array.isArray(sanitized.body?.how_to_start) ? { how_to_start: filterSteps(sanitized.body.how_to_start) } : {}),
  };

  return sanitized;
}

function assertValidSteps(draft: ContentDraft) {
  const steps = Array.isArray(draft.body?.steps) ? draft.body.steps : [];
  const validSteps = steps
    .map((step) => {
      if (!step || typeof step !== 'object') return false;
      const record = step as Record<string, unknown>;
      return {
        ...record,
        text: typeof record.text === 'string' ? record.text.trim() : '',
      };
    })
    .filter((step): step is Record<string, unknown> & { text: string } => {
      return Boolean(step) && typeof step === 'object' && step.text.length >= 40;
    });
  draft.body.steps = validSteps;

  if (validSteps.length < 4) {
    throw new Error(`Only ${validSteps.length} valid steps — regenerating`);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runContentPipeline(config: PipelineConfig): Promise<{ success: boolean; contentId?: string; error?: string }> {
  const startedAt = Date.now();
  const job = await createJob(config);

  try {
    let draft: ContentDraft | null = null;
    let quality: QualityReport | null = null;
    let attempts = 0;

    while (attempts < 2) {
      attempts += 1;
      await updateJob(job.id, { status: 'running', attempts });

      try {
        draft = await generateContent({
          topic: config.topic,
          contentType: config.contentType,
          locale: config.locale,
          improvements: quality?.improvements ?? [],
          criticalFixes: quality?.hard_fails ?? [],
        });
        draft = sanitizeContent(draft);
        assertValidSteps(draft);
      } catch (err) {
        await updateJob(job.id, {
          status: attempts < 2 ? 'running' : 'failed',
          attempts,
          error_message: `Generation attempt ${attempts} failed: ${err}`,
          completed_at: attempts >= 2 ? new Date().toISOString() : undefined,
          generation_ms: Date.now() - startedAt,
        });
        if (attempts >= 2) return { success: false, error: 'Content generation failed' };
        await sleep(2000);
        continue;
      }

      quality = await validateContent(draft, attempts);
      await updateJob(job.id, { quality_score: quality.average, attempts });

      if (quality.publish) break;

      console.log(`Attempt ${attempts} quality ${quality.average}/10 - retrying`);
      console.log('Issues:', quality.hard_fails, quality.improvements);

      if (attempts >= 2) {
        await updateJob(job.id, {
          status: 'failed',
          error_message: `Quality too low after ${attempts} attempts: ${quality.average}/10`,
          error_details: { quality },
          completed_at: new Date().toISOString(),
          generation_ms: Date.now() - startedAt,
        });
        return { success: false, error: `Quality score ${quality.average} below threshold` };
      }

      await sleep(1500);
    }

    if (!draft || !quality?.publish) {
      return { success: false, error: 'Content did not pass quality gate' };
    }

    let images: ContentImage[] = [];
    try {
      const imageQuery = await generateText(
        `4-word English Unsplash search query for: "${draft.title}" (${draft.cuisine ?? config.contentType} cuisine)\nExamples: "tacos al pastor street", "sous vide steak plated"\nReturn ONLY the query, nothing else.`,
      );
      images = await fetchArticleImages({
        contentType: config.contentType,
        cuisine: draft.cuisine,
        title: draft.title,
        customQuery: imageQuery.trim(),
        count: 3,
      });
      await updateJob(job.id, { image_generated: true });
    } catch (err) {
      console.error('Image fetch failed:', err);
      await updateJob(job.id, {
        error_message: `Images failed (article still published): ${err}`,
      });
    }

    const affiliateDraft = sanitizeContent(await injectAffiliateLinks(draft, detectMarketFromLocale(draft.locale)));
    const fullBody = {
      ...affiliateDraft.body,
      images,
    };
    const wordCount = countWords({ ...affiliateDraft, body: fullBody });
    const enrichedDraft: ContentDraft = {
      ...affiliateDraft,
      body: fullBody,
      imageUrl: images[0]?.url,
      imageAlt: images[0]?.alt,
      imageAttribution: images[0]?.attribution,
      ogImageUrl: images[0]?.url,
      qualityScore: quality.average,
      qualityDetails: quality.scores,
      aiModel: process.env.AI_MODEL ?? 'gpt-4o-mini',
      generationPromptVersion: config.promptVersion ?? process.env.CONTENT_PROMPT_VERSION ?? 'v1.0',
      wordCount,
      readingTimeMins: Math.ceil(wordCount / 200),
    };

    const slugExists = await db
      .select({ id: content.id })
      .from(content)
      .where(eq(content.slug, enrichedDraft.slug))
      .limit(1);

    const finalDraft: ContentDraft = {
      ...enrichedDraft,
      slug: slugExists.length > 0 ? `${enrichedDraft.slug}-${config.locale}-${Date.now()}` : enrichedDraft.slug,
    };

    const difficultyMap: Record<string, string> = {
      'fácil': 'easy', 'facil': 'easy', 'easy': 'easy', 'baja': 'easy', 'bajo': 'easy',
      'medio': 'medium', 'media': 'medium', 'moderate': 'medium', 'medium': 'medium',
      'difícil': 'hard', 'dificil': 'hard', 'hard': 'hard', 'difficult': 'hard', 'alta': 'hard', 'alto': 'hard',
    };
    finalDraft.difficulty = (difficultyMap[finalDraft.difficulty?.toLowerCase()?.trim() ?? ''] ?? 'medium') as ContentDraft['difficulty'];

    const schemas = buildSchemas(draftToContentForSchemas(finalDraft));
    const url = `${getBaseUrl()}/${config.contentType}/${finalDraft.slug}`;

    const [inserted] = await db
      .insert(content)
      .values({
        slug: finalDraft.slug,
        locale: finalDraft.locale,
        type: finalDraft.type,
        title: finalDraft.title,
        metaTitle: finalDraft.metaTitle,
        metaDescription: finalDraft.metaDescription,
        canonicalUrl: url,
        quickAnswer: finalDraft.quickAnswer,
        definition: finalDraft.definition,
        keyFacts: finalDraft.keyFacts,
        stepsSummary: finalDraft.stepsSummary,
        authorEntity: finalDraft.authorEntity ?? 'WorldWideRecipes Editorial Team',
        expertReviewed: finalDraft.expertReviewed ?? false,
        primarySources: finalDraft.primarySources,
        originalData: finalDraft.originalData,
        entityMentions: finalDraft.entityMentions,
        citationSummary: finalDraft.citationSummary,
        body: finalDraft.body,
        imageUrl: finalDraft.imageUrl,
        imageAlt: finalDraft.imageAlt,
        imageAttribution: finalDraft.imageAttribution,
        ogImageUrl: finalDraft.ogImageUrl,
        cuisine: finalDraft.cuisine,
        category: finalDraft.category,
        dietTags: finalDraft.dietTags,
        difficulty: finalDraft.difficulty,
        totalTimeMins: finalDraft.totalTimeMins,
        season: finalDraft.season,
        parentSlug: finalDraft.parentSlug,
        tiktokHashtags: finalDraft.tiktokHashtags,
        affiliateLinks: finalDraft.affiliateLinks,
        schemaRecipe: schemas.recipe ?? undefined,
        schemaHowto: schemas.howto ?? undefined,
        schemaArticle: schemas.article,
        schemaFaq: schemas.faq,
        schemaBreadcrumb: schemas.breadcrumb,
        faq: finalDraft.faq,
        qualityScore: quality.average.toFixed(1),
        qualityDetails: quality.scores,
        aiModel: process.env.AI_MODEL ?? 'gpt-4o-mini',
        generationPromptVersion: finalDraft.generationPromptVersion,
        wordCount,
        readingTimeMins: Math.ceil(wordCount / 200),
        outboundLinkCount: finalDraft.outboundLinkCount,
        status: 'published',
        publishedAt: new Date(),
        aiGenerated: true,
      })
      .returning({ id: content.id });

    const contentId = inserted.id;

    try {
      await computeInternalLinks(contentId, finalDraft.locale);
    } catch (err) {
      console.error('Internal links failed (non-blocking):', err);
    }

    await db
      .insert(sitemapIndex)
      .values({
        contentId,
        sitemapFile: sitemapFileFor(finalDraft.type, finalDraft.locale),
        url,
        priority: finalDraft.type === 'recipe' ? '0.8' : '0.7',
        changefreq: 'weekly',
        lastmod: new Date(),
      })
      .onConflictDoUpdate({
        target: sitemapIndex.contentId,
        set: {
          sitemapFile: sitemapFileFor(finalDraft.type, finalDraft.locale),
          url,
          priority: finalDraft.type === 'recipe' ? '0.8' : '0.7',
          changefreq: 'weekly',
          lastmod: new Date(),
        },
      });

    let indexed = false;
    try {
      indexed = await indexUrl(url);
      if (indexed) {
        await db.update(content).set({ indexedAt: new Date() }).where(eq(content.id, contentId));
      }
    } catch (err) {
      console.error('Indexing failed (non-blocking):', err);
    }

    try {
      await fetch(`${getBaseUrl()}/api/revalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.CRON_SECRET ?? ''}`,
        },
        body: JSON.stringify({
          path: `/${config.locale}/${config.contentType}/${finalDraft.slug}`,
          secret: process.env.REVALIDATE_SECRET,
        }),
      });
    } catch (err) {
      console.error('Revalidation failed (non-blocking):', err);
    }

    if (config.jobType === 'daily_cron') {
      try {
        await updateHomepageConfig();
      } catch (err) {
        console.error('Homepage refresh failed (non-blocking):', err);
      }
    }

    await updateJob(job.id, {
      status: 'completed',
      content_id: contentId,
      quality_score: quality.average,
      image_generated: images.length >= 2,
      indexed,
      completed_at: new Date().toISOString(),
      generation_ms: Date.now() - startedAt,
    });

    console.log(`Published: ${url} (quality: ${quality.average}/10, images: ${images.length})`);
    return { success: true, contentId };
  } catch (err) {
    await updateJob(job.id, {
      status: 'failed',
      error_message: String(err),
      completed_at: new Date().toISOString(),
      generation_ms: Date.now() - startedAt,
    });
    console.error(`Pipeline failed for "${config.topic}":`, err);
    return { success: false, error: String(err) };
  }
}
