import { eq } from 'drizzle-orm';
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
    canonicalUrl: draft.canonicalUrl ?? `${getBaseUrl()}/${draft.locale}/${draft.type}/${draft.slug}`,
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
    aiModel: draft.aiModel ?? 'gemini-1.5-flash',
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

    while (attempts < 3) {
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
      } catch (err) {
        await updateJob(job.id, {
          status: attempts < 3 ? 'running' : 'failed',
          attempts,
          error_message: `Generation attempt ${attempts} failed: ${err}`,
          completed_at: attempts >= 3 ? new Date().toISOString() : undefined,
          generation_ms: Date.now() - startedAt,
        });
        if (attempts >= 3) return { success: false, error: 'Content generation failed' };
        await sleep(2000);
        continue;
      }

      quality = await validateContent(draft);
      await updateJob(job.id, { quality_score: quality.average, attempts });

      if (quality.publish) break;

      console.log(`Attempt ${attempts} quality ${quality.average}/10 - retrying`);
      console.log('Issues:', quality.hard_fails, quality.improvements);

      if (attempts >= 3) {
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
      images = await fetchArticleImages({
        contentType: config.contentType,
        cuisine: draft.cuisine,
        title: draft.title,
        count: 3,
      });
      await updateJob(job.id, { image_generated: true });
    } catch (err) {
      console.error('Image fetch failed:', err);
      await updateJob(job.id, {
        error_message: `Images failed (article still published): ${err}`,
      });
    }

    const affiliateDraft = await injectAffiliateLinks(draft, detectMarketFromLocale(draft.locale));
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
      aiModel: 'gemini-1.5-flash',
      generationPromptVersion: config.promptVersion ?? process.env.CONTENT_PROMPT_VERSION ?? 'v1.0',
      wordCount,
      readingTimeMins: Math.ceil(wordCount / 200),
    };

    const schemas = buildSchemas(draftToContentForSchemas(enrichedDraft));
    const url = `${getBaseUrl()}/${config.locale}/${config.contentType}/${draft.slug}`;

    const [inserted] = await db
      .insert(content)
      .values({
        slug: enrichedDraft.slug,
        locale: enrichedDraft.locale,
        type: enrichedDraft.type,
        title: enrichedDraft.title,
        metaTitle: enrichedDraft.metaTitle,
        metaDescription: enrichedDraft.metaDescription,
        canonicalUrl: url,
        quickAnswer: enrichedDraft.quickAnswer,
        definition: enrichedDraft.definition,
        keyFacts: enrichedDraft.keyFacts,
        stepsSummary: enrichedDraft.stepsSummary,
        authorEntity: enrichedDraft.authorEntity ?? 'WorldWideRecipes Editorial Team',
        expertReviewed: enrichedDraft.expertReviewed ?? false,
        primarySources: enrichedDraft.primarySources,
        originalData: enrichedDraft.originalData,
        entityMentions: enrichedDraft.entityMentions,
        citationSummary: enrichedDraft.citationSummary,
        body: enrichedDraft.body,
        imageUrl: enrichedDraft.imageUrl,
        imageAlt: enrichedDraft.imageAlt,
        imageAttribution: enrichedDraft.imageAttribution,
        ogImageUrl: enrichedDraft.ogImageUrl,
        cuisine: enrichedDraft.cuisine,
        category: enrichedDraft.category,
        dietTags: enrichedDraft.dietTags,
        difficulty: enrichedDraft.difficulty,
        totalTimeMins: enrichedDraft.totalTimeMins,
        season: enrichedDraft.season,
        parentSlug: enrichedDraft.parentSlug,
        tiktokHashtags: enrichedDraft.tiktokHashtags,
        affiliateLinks: enrichedDraft.affiliateLinks,
        schemaRecipe: schemas.recipe ?? undefined,
        schemaHowto: schemas.howto ?? undefined,
        schemaArticle: schemas.article,
        schemaFaq: schemas.faq,
        schemaBreadcrumb: schemas.breadcrumb,
        faq: enrichedDraft.faq,
        qualityScore: quality.average.toFixed(1),
        qualityDetails: quality.scores,
        aiModel: 'gemini-1.5-flash',
        generationPromptVersion: enrichedDraft.generationPromptVersion,
        wordCount,
        readingTimeMins: Math.ceil(wordCount / 200),
        outboundLinkCount: enrichedDraft.outboundLinkCount,
        status: 'published',
        publishedAt: new Date(),
        aiGenerated: true,
      })
      .returning({ id: content.id });

    const contentId = inserted.id;

    try {
      await computeInternalLinks(contentId, enrichedDraft.locale);
    } catch (err) {
      console.error('Internal links failed (non-blocking):', err);
    }

    await db
      .insert(sitemapIndex)
      .values({
        contentId,
        sitemapFile: sitemapFileFor(enrichedDraft.type, enrichedDraft.locale),
        url,
        priority: enrichedDraft.type === 'recipe' ? '0.8' : '0.7',
        changefreq: 'weekly',
        lastmod: new Date(),
      })
      .onConflictDoUpdate({
        target: sitemapIndex.contentId,
        set: {
          sitemapFile: sitemapFileFor(enrichedDraft.type, enrichedDraft.locale),
          url,
          priority: enrichedDraft.type === 'recipe' ? '0.8' : '0.7',
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
          path: `/${config.locale}/${config.contentType}/${draft.slug}`,
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
