import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import postgres from 'postgres';

export const content = pgTable(
  'content',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    locale: text('locale').notNull().default('es'),
    type: text('type').notNull(),
    title: text('title').notNull(),
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),
    canonicalUrl: text('canonical_url'),
    quickAnswer: text('quick_answer'),
    definition: text('definition'),
    keyFacts: jsonb('key_facts').$type<Array<{ label: string; value: string }>>(),
    stepsSummary: jsonb('steps_summary').$type<Array<{ step: number; text: string }>>(),
    authorEntity: text('author_entity').default('WorldWideRecipes Editorial Team'),
    expertReviewed: boolean('expert_reviewed').default(false),
    primarySources: jsonb('primary_sources').$type<Array<{ name: string; url?: string; type?: string }>>(),
    originalData: jsonb('original_data').$type<Record<string, unknown>>(),
    entityMentions: text('entity_mentions').array(),
    citationSummary: text('citation_summary'),
    body: jsonb('body').$type<Record<string, unknown>>().notNull().default({}),
    imageUrl: text('image_url'),
    imageAlt: text('image_alt'),
    imageAttribution: text('image_attribution'),
    ogImageUrl: text('og_image_url'),
    cuisine: text('cuisine'),
    category: text('category'),
    dietTags: text('diet_tags').array(),
    difficulty: text('difficulty'),
    totalTimeMins: integer('total_time_mins'),
    season: text('season').array(),
    relatedSlugs: text('related_slugs').array(),
    parentSlug: text('parent_slug'),
    tiktokHashtags: text('tiktok_hashtags').array(),
    affiliateLinks: jsonb('affiliate_links').$type<AffiliateLinkRecord[]>(),
    schemaRecipe: jsonb('schema_recipe').$type<Record<string, unknown>>(),
    schemaHowto: jsonb('schema_howto').$type<Record<string, unknown>>(),
    schemaArticle: jsonb('schema_article').$type<Record<string, unknown>>(),
    schemaFaq: jsonb('schema_faq').$type<Record<string, unknown>>(),
    schemaBreadcrumb: jsonb('schema_breadcrumb').$type<Record<string, unknown>>(),
    faq: jsonb('faq').$type<Array<{ question: string; answer: string }>>(),
    qualityScore: numeric('quality_score', { precision: 3, scale: 1 }),
    qualityDetails: jsonb('quality_details').$type<Record<string, unknown>>(),
    aiModel: text('ai_model').default('gemini-1.5-flash'),
    generationPromptVersion: text('generation_prompt_version'),
    humanReviewed: boolean('human_reviewed').default(false),
    humanReviewedAt: timestamp('human_reviewed_at', { withTimezone: true }),
    wordCount: integer('word_count'),
    readingTimeMins: integer('reading_time_mins'),
    internalLinkCount: integer('internal_link_count').default(0),
    outboundLinkCount: integer('outbound_link_count').default(0),
    impressions7d: integer('impressions_7d').default(0),
    clicks7d: integer('clicks_7d').default(0),
    avgPosition7d: numeric('avg_position_7d', { precision: 5, scale: 2 }),
    topQueries: jsonb('top_queries').$type<Array<{ query: string; clicks: number; position: number }>>(),
    status: text('status').default('draft'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    indexedAt: timestamp('indexed_at', { withTimezone: true }),
    lastCrawledAt: timestamp('last_crawled_at', { withTimezone: true }),
    aiGenerated: boolean('ai_generated').default(true),
  },
  (table) => ({
    slugLocaleUnique: uniqueIndex('content_slug_locale_unique').on(table.slug, table.locale),
    typeIdx: index('idx_content_type').on(table.type),
    localeIdx: index('idx_content_locale').on(table.locale),
    cuisineIdx: index('idx_content_cuisine').on(table.cuisine),
    statusIdx: index('idx_content_status').on(table.status),
    publishedIdx: index('idx_content_published').on(table.publishedAt),
    qualityIdx: index('idx_content_quality').on(table.qualityScore),
    tagsIdx: index('idx_content_tags').using('gin', table.dietTags),
    relatedIdx: index('idx_content_related').using('gin', table.relatedSlugs),
    entitiesIdx: index('idx_content_entities').using('gin', table.entityMentions),
    searchIdx: index('idx_content_search').using(
      'gin',
      sql`to_tsvector('spanish', coalesce(${table.title},'') || ' ' || coalesce(${table.metaDescription},''))`,
    ),
    ftsIdx: index('idx_content_fts').using(
      'gin',
      sql`to_tsvector('simple', coalesce(${table.title},'') || ' ' || coalesce(${table.metaDescription},'') || ' ' || coalesce(${table.cuisine},'') || ' ' || coalesce(array_to_string(${table.dietTags}, ' '),''))`,
    ),
  }),
);

export const affiliateProducts = pgTable(
  'affiliate_products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    nameEs: text('name_es'),
    nameMx: text('name_mx'),
    asinEs: text('asin_es'),
    asinMx: text('asin_mx'),
    asinGlobal: text('asin_global'),
    asinBr: text('asin_br'),
    urlEs: text('url_es'),
    urlMx: text('url_mx'),
    urlGlobal: text('url_global'),
    category: text('category'),
    priceRange: text('price_range'),
    imageUrl: text('image_url'),
    matchKeywords: text('match_keywords').array(),
    cuisines: text('cuisines').array(),
    totalClicks: integer('total_clicks').default(0),
    clicksEs: integer('clicks_es').default(0),
    clicksMx: integer('clicks_mx').default(0),
    estimatedCommissionEs: numeric('estimated_commission_es', { precision: 8, scale: 2 }).default('0'),
    estimatedCommissionMx: numeric('estimated_commission_mx', { precision: 8, scale: 2 }).default('0'),
    active: boolean('active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    keywordsIdx: index('idx_affiliate_keywords').using('gin', table.matchKeywords),
    categoryIdx: index('idx_affiliate_category').on(table.category),
  }),
);

export const affiliateEvents = pgTable(
  'affiliate_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contentId: uuid('content_id').references(() => content.id, { onDelete: 'set null' }),
    productId: uuid('product_id').references(() => affiliateProducts.id, { onDelete: 'set null' }),
    market: text('market'),
    position: text('position'),
    locale: text('locale'),
    clickedAt: timestamp('clicked_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    productIdx: index('idx_aff_events_product').on(table.productId),
    contentIdx: index('idx_aff_events_content').on(table.contentId),
    dateIdx: index('idx_aff_events_date').on(table.clickedAt),
    marketIdx: index('idx_aff_events_market').on(table.market),
  }),
);

export const trendingTopics = pgTable(
  'trending_topics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    topic: text('topic').notNull(),
    contentType: text('content_type'),
    localePrimary: text('locale_primary'),
    whyTrending: text('why_trending'),
    uniqueAngle: text('unique_angle'),
    affiliatePotential: text('affiliate_potential'),
    tiktokHashtags: text('tiktok_hashtags').array(),
    searchIntent: text('search_intent'),
    difficultyToRank: text('difficulty_to_rank'),
    selected: boolean('selected').default(false),
    contentId: uuid('content_id').references(() => content.id),
    skippedReason: text('skipped_reason'),
    detectedAt: timestamp('detected_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    dateIdx: index('idx_trending_date').on(table.detectedAt),
    typeIdx: index('idx_trending_type').on(table.contentType),
  }),
);

export const generationJobs = pgTable(
  'generation_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobType: text('job_type'),
    status: text('status').default('pending'),
    topic: text('topic'),
    contentType: text('content_type'),
    locale: text('locale'),
    promptVersion: text('prompt_version'),
    contentId: uuid('content_id').references(() => content.id),
    qualityScore: numeric('quality_score', { precision: 3, scale: 1 }),
    imageGenerated: boolean('image_generated').default(false),
    indexed: boolean('indexed').default(false),
    tokensUsed: integer('tokens_used'),
    costUsd: numeric('cost_usd', { precision: 8, scale: 6 }),
    generationMs: integer('generation_ms'),
    attempts: integer('attempts').default(0),
    errorMessage: text('error_message'),
    errorDetails: jsonb('error_details').$type<Record<string, unknown>>(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    statusIdx: index('idx_jobs_status').on(table.status),
    createdIdx: index('idx_jobs_created').on(table.createdAt),
    typeIdx: index('idx_jobs_type').on(table.jobType),
  }),
);

export const internalLinks = pgTable(
  'internal_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fromId: uuid('from_id').notNull().references(() => content.id, { onDelete: 'cascade' }),
    toId: uuid('to_id').notNull().references(() => content.id, { onDelete: 'cascade' }),
    anchorText: text('anchor_text'),
    linkType: text('link_type'),
    position: text('position'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    uniqueLink: uniqueIndex('internal_links_from_to_unique').on(table.fromId, table.toId),
    fromIdx: index('idx_links_from').on(table.fromId),
    toIdx: index('idx_links_to').on(table.toId),
  }),
);

export const homepageConfig = pgTable('homepage_config', {
  id: integer('id').primaryKey().default(1),
  heroContentIds: uuid('hero_content_ids').array(),
  featuredTechnique: uuid('featured_technique').references(() => content.id),
  featuredIngredient: uuid('featured_ingredient').references(() => content.id),
  topAffiliateId: uuid('top_affiliate_id').references(() => affiliateProducts.id),
  trendingTags: text('trending_tags').array(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const seoMetrics = pgTable(
  'seo_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contentId: uuid('content_id').references(() => content.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    impressions: integer('impressions').default(0),
    clicks: integer('clicks').default(0),
    avgPosition: numeric('avg_position', { precision: 5, scale: 2 }),
    ctr: numeric('ctr', { precision: 5, scale: 4 }),
    topQuery: text('top_query'),
  },
  (table) => ({
    uniqueMetric: uniqueIndex('seo_metrics_content_date_unique').on(table.contentId, table.date),
    contentIdx: index('idx_seo_content').on(table.contentId),
    dateIdx: index('idx_seo_date').on(table.date),
  }),
);

export const sitemapIndex = pgTable('sitemap_index', {
  id: uuid('id').primaryKey().defaultRandom(),
  contentId: uuid('content_id').references(() => content.id, { onDelete: 'cascade' }),
  sitemapFile: text('sitemap_file'),
  url: text('url').notNull(),
  priority: numeric('priority', { precision: 2, scale: 1 }).default('0.7'),
  changefreq: text('changefreq').default('weekly'),
  lastmod: timestamp('lastmod', { withTimezone: true }).defaultNow(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
}, (table) => ({
  uniqueContent: uniqueIndex('sitemap_index_content_unique').on(table.contentId),
}));

export const pageViews = pgTable(
  'page_views',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contentId: uuid('content_id').references(() => content.id, { onDelete: 'cascade' }),
    locale: text('locale'),
    referrerType: text('referrer_type'),
    device: text('device'),
    viewedAt: timestamp('viewed_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    contentIdx: index('idx_views_content').on(table.contentId),
    dateIdx: index('idx_views_date').on(table.viewedAt),
  }),
);

export type Content = typeof content.$inferSelect;
export type NewContent = typeof content.$inferInsert;
export type AffiliateProduct = typeof affiliateProducts.$inferSelect;
export type NewAffiliateProduct = typeof affiliateProducts.$inferInsert;
export type AffiliateEvent = typeof affiliateEvents.$inferSelect;
export type GenerationJob = typeof generationJobs.$inferSelect;
export type InternalLink = typeof internalLinks.$inferSelect;
export type HomepageConfig = typeof homepageConfig.$inferSelect;
export type SeoMetric = typeof seoMetrics.$inferSelect;
export type SitemapIndex = typeof sitemapIndex.$inferSelect;
export type PageView = typeof pageViews.$inferSelect;

export type Locale = 'es' | 'es-mx' | 'es-ar' | 'en' | 'pt-br';
export type ContentType = 'recipe' | 'technique' | 'ingredient' | 'guide' | 'cuisine' | 'spice';
export type AffiliateMarket = 'es' | 'mx' | 'br' | 'global';
export type AffiliateLinkRecord = {
  label: string;
  asin?: string;
  url: string;
  market: AffiliateMarket;
  type?: string;
  position?: string;
  productId?: string;
};

const databaseUrl = process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/postgres';
const client = postgres(databaseUrl, { prepare: false, max: 1, connect_timeout: 2 });

export const db = drizzle(client);
