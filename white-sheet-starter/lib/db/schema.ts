import {
  boolean,
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

export const content = pgTable(
  'content',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    type: text('type').notNull(),
    title: text('title').notNull(),
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),
    canonicalUrl: text('canonical_url'),
    excerpt: text('excerpt'),
    quickAnswer: text('quick_answer'),
    body: jsonb('body').$type<Record<string, unknown>>().notNull().default({}),
    faq: jsonb('faq').$type<Array<{ question: string; answer: string }>>(),
    schemaArticle: jsonb('schema_article').$type<Record<string, unknown>>(),
    schemaFaq: jsonb('schema_faq').$type<Record<string, unknown>>(),
    imageUrl: text('image_url'),
    imageAlt: text('image_alt'),
    category: text('category'),
    topicalCluster: text('topical_cluster'),
    entityMentions: text('entity_mentions').array(),
    internalLinkCount: integer('internal_link_count').default(0),
    outboundLinkCount: integer('outbound_link_count').default(0),
    qualityScore: numeric('quality_score', { precision: 3, scale: 1 }),
    wordCount: integer('word_count'),
    readingTimeMins: integer('reading_time_mins'),
    status: text('status').default('draft'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    aiGenerated: boolean('ai_generated').default(true),
  },
  (table) => ({
    slugUnique: uniqueIndex('content_slug_unique').on(table.slug),
    typeIdx: index('content_type_idx').on(table.type),
    statusIdx: index('content_status_idx').on(table.status),
    clusterIdx: index('content_cluster_idx').on(table.topicalCluster),
  }),
);

export const generationJobs = pgTable(
  'generation_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    topic: text('topic'),
    contentType: text('content_type'),
    status: text('status').default('pending'),
    contentId: uuid('content_id'),
    qualityScore: numeric('quality_score', { precision: 3, scale: 1 }),
    generationMs: integer('generation_ms'),
    attempts: integer('attempts').default(0),
    errorMessage: text('error_message'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    statusIdx: index('jobs_status_idx').on(table.status),
  }),
);

export const internalLinks = pgTable(
  'internal_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fromSlug: text('from_slug').notNull(),
    toSlug: text('to_slug').notNull(),
    anchorText: text('anchor_text').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    linkUnique: uniqueIndex('internal_link_unique').on(table.fromSlug, table.toSlug),
  }),
);

export type ContentRow = typeof content.$inferSelect;
export type NewContentRow = typeof content.$inferInsert;
