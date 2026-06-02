import { and, count, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { cuisineCountries } from '@/lib/cuisine/atlas';
import type { FilterParams } from '@/lib/content/routes';
import {
  affiliateProducts,
  content,
  db,
  homepageConfig,
  pageViews,
  sitemapIndex,
  type AffiliateMarket,
  type Content,
  type ContentType,
  type Locale,
} from './schema';

const DB_CACHE_REVALIDATE_SECONDS = 3600;

function cachedDbQuery<Args extends unknown[], Result>(
  key: string,
  query: (...args: Args) => Promise<Result>,
) {
  return unstable_cache(query, [`db:${key}`], {
    revalidate: DB_CACHE_REVALIDATE_SECONDS,
  });
}

function publishedOnly(): SQL {
  return eq(content.status, 'published');
}

const getPublishedContentCached = cachedDbQuery(
  'published-content',
  async (locale: Locale, type: ContentType | undefined, limit: number, offset: number) => {
  const where = type ? and(publishedOnly(), eq(content.type, type)) : publishedOnly();

  return db
    .select()
    .from(content)
    .where(where)
    .orderBy(desc(content.publishedAt))
    .limit(limit)
    .offset(offset);
  },
);

export async function getPublishedContent(
  locale: Locale,
  type?: ContentType,
  limit = 24,
  offset = 0,
) {
  return getPublishedContentCached(locale, type, limit, offset);
}

const getPublishedSlugsByTypeCached = cachedDbQuery('published-slugs-by-type', async (type: ContentType) => {
  return db
    .select({
      locale: content.locale,
      slug: content.slug,
    })
    .from(content)
    .where(and(eq(content.status, 'published'), eq(content.type, type)))
    .orderBy(desc(content.updatedAt));
});

export async function getPublishedSlugsByType(type: ContentType) {
  return getPublishedSlugsByTypeCached(type);
}

const getContentBySlugCached = cachedDbQuery('content-by-slug', async (slug: string, locale: Locale) => {
  const [row] = await db
    .select()
    .from(content)
    .where(and(eq(content.slug, slug), eq(content.locale, locale), eq(content.status, 'published')))
    .limit(1);

  return row ?? null;
});

export async function getContentBySlug(slug: string, locale: Locale) {
  return getContentBySlugCached(slug, locale);
}

const getContentBySlugAndTypeCached = cachedDbQuery(
  'content-by-slug-and-type',
  async (slug: string, locale: Locale, type: ContentType) => {
  const [row] = await db
    .select()
    .from(content)
    .where(and(eq(content.slug, slug), eq(content.locale, locale), eq(content.type, type), eq(content.status, 'published')))
    .limit(1);

  return row ?? null;
  },
);

export async function getContentBySlugAndType(slug: string, locale: Locale, type: ContentType) {
  return getContentBySlugAndTypeCached(slug, locale, type);
}

export async function getContentBySlugFallback(slug: string, locale: Locale, type: ContentType) {
  const preferred = await getContentBySlugAndType(slug, locale, type);
  if (preferred) return preferred;
  if (locale !== 'es') return getContentBySlugAndType(slug, 'es', type);
  return null;
}

const getContentBySlugOnlyCached = cachedDbQuery('content-by-slug-only', async (slug: string) => {
  const [row] = await db
    .select()
    .from(content)
    .where(and(eq(content.slug, slug), eq(content.status, 'published')))
    .limit(1);
  return row ?? null;
});

export async function getContentBySlugOnly(slug: string) {
  return getContentBySlugOnlyCached(slug);
}

const getRelatedContentRowsCached = cachedDbQuery(
  'related-content-rows',
  async (relatedSlugs: string[], limit: number) => {
    return db
      .select({
        id: content.id,
        slug: content.slug,
        title: content.title,
        type: content.type,
        imageUrl: content.imageUrl,
        cuisine: content.cuisine,
      })
      .from(content)
      .where(
        and(
          publishedOnly(),
          sql`${content.slug} = ANY(${relatedSlugs})`,
        ),
      )
      .limit(limit);
  },
);

export async function getRelatedContent(slug: string, locale: Locale, limit = 6) {
  const current = await getContentBySlug(slug, locale);
  if (!current?.relatedSlugs?.length) return [];

  return getRelatedContentRowsCached(current.relatedSlugs, limit);
}

const getRelatedContentForContentCached = cachedDbQuery(
  'related-content-for-content',
  async (id: string, type: ContentType, relatedSlugs: string[] | null | undefined, limit: number) => {
  if (relatedSlugs?.length) {
    const related = await db
      .select()
      .from(content)
      .where(
        and(
          publishedOnly(),
          sql`${content.slug} = ANY(${relatedSlugs})`,
        ),
      )
      .limit(limit);
    if (related.length) return related;
  }

  return db
    .select()
    .from(content)
    .where(and(publishedOnly(), eq(content.type, type), sql`${content.id} <> ${id}`))
    .orderBy(desc(content.publishedAt))
    .limit(limit);
  },
);

export async function getRelatedContentForContent(row: Content, limit = 4) {
  return getRelatedContentForContentCached(row.id, row.type as ContentType, row.relatedSlugs, limit);
}

const getHomepageConfigCached = cachedDbQuery('homepage-config', async () => {
  const [row] = await db.select().from(homepageConfig).where(eq(homepageConfig.id, 1)).limit(1);
  return row ?? null;
});

export async function getHomepageConfig() {
  return getHomepageConfigCached();
}

const getTopAffiliateProductsCached = cachedDbQuery(
  'top-affiliate-products',
  async (market: AffiliateMarket, limit: number) => {
  const orderColumn =
    market === 'es'
      ? affiliateProducts.clicksEs
      : market === 'mx'
        ? affiliateProducts.clicksMx
        : affiliateProducts.totalClicks;

  return db
    .select()
    .from(affiliateProducts)
    .where(eq(affiliateProducts.active, true))
    .orderBy(desc(orderColumn))
    .limit(limit);
  },
);

export async function getTopAffiliateProducts(market: AffiliateMarket, limit = 10) {
  return getTopAffiliateProductsCached(market, limit);
}

const searchContentCached = cachedDbQuery(
  'search-content',
  async (
  query: string,
  locale: Locale,
  filters?: {
    type?: ContentType;
    cuisine?: string;
    diet?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    page?: number;
    pageSize?: number;
  },
) => {
  const page = Math.max(filters?.page ?? 1, 1);
  const pageSize = Math.min(Math.max(filters?.pageSize ?? 20, 1), 100);
  const terms = query.trim();
  const whereParts: SQL[] = [publishedOnly()];

  if (terms) {
    whereParts.push(sql`
      to_tsvector('simple', coalesce(${content.title},'') || ' ' || coalesce(${content.metaDescription},'') || ' ' || coalesce(${content.cuisine},'') || ' ' || coalesce(array_to_string(${content.dietTags}, ' '),''))
      @@ plainto_tsquery('simple', ${terms})
    `);
  }
  if (filters?.type) whereParts.push(eq(content.type, filters.type));
  if (filters?.cuisine) whereParts.push(eq(content.cuisine, filters.cuisine));
  if (filters?.difficulty) whereParts.push(eq(content.difficulty, filters.difficulty));
  if (filters?.diet) whereParts.push(sql`${content.dietTags} @> ARRAY[${filters.diet}]::text[]`);

  const where = and(...whereParts);
  const [{ total }] = await db.select({ total: count() }).from(content).where(where);
  const results = await db
    .select()
    .from(content)
    .where(where)
    .orderBy(desc(content.publishedAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return { results, total, page, pageSize };
  },
);

export async function searchContent(
  query: string,
  locale: Locale,
  filters?: {
    type?: ContentType;
    cuisine?: string;
    diet?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    page?: number;
    pageSize?: number;
  },
) {
  return searchContentCached(query, locale, filters);
}

const getContentByFiltersPagedCached = cachedDbQuery(
  'content-by-filters-paged',
  async (filters: FilterParams, page: number, pageSize: number) => {
  const safePage = Math.max(page, 0);
  const safePageSize = Math.min(Math.max(pageSize, 1), 48);
  const whereParts: SQL[] = [publishedOnly()];

  if (filters.type) whereParts.push(eq(content.type, filters.type));
  if (filters.cuisine) whereParts.push(eq(content.cuisine, filters.cuisine));
  if (filters.diet) whereParts.push(sql`${content.dietTags} @> ARRAY[${filters.diet}]::text[]`);
  if (filters.difficulty) whereParts.push(eq(content.difficulty, filters.difficulty));

  const where = and(...whereParts);
  const [{ total }] = await db.select({ total: count() }).from(content).where(where);
  const results = await db
    .select()
    .from(content)
    .where(where)
    .orderBy(desc(content.publishedAt))
    .limit(safePageSize)
    .offset(safePage * safePageSize);

  return {
    results,
    total: Number(total),
    page: safePage,
    pageSize: safePageSize,
    hasMore: Number(total) > (safePage + 1) * safePageSize,
  };
  },
);

export async function getContentByFiltersPaged(filters: FilterParams = {}, page = 0, pageSize = 12) {
  return getContentByFiltersPagedCached(filters, page, pageSize);
}

const getContentByFilterCached = cachedDbQuery(
  'content-by-filter',
  async (
  locale: Locale,
  type?: ContentType,
  cuisine?: string,
  diet?: string,
  difficulty?: 'easy' | 'medium' | 'hard',
) => {
  const whereParts: SQL[] = [publishedOnly()];
  if (type) whereParts.push(eq(content.type, type));
  if (cuisine) whereParts.push(eq(content.cuisine, cuisine));
  if (diet) whereParts.push(sql`${content.dietTags} @> ARRAY[${diet}]::text[]`);
  if (difficulty) whereParts.push(eq(content.difficulty, difficulty));

  return db
    .select()
    .from(content)
    .where(and(...whereParts))
    .orderBy(desc(content.publishedAt));
  },
);

export async function getContentByFilter(
  locale: Locale,
  type?: ContentType,
  cuisine?: string,
  diet?: string,
  difficulty?: 'easy' | 'medium' | 'hard',
) {
  return getContentByFilterCached(locale, type, cuisine, diet, difficulty);
}

const getSitemapUrlsCached = cachedDbQuery('sitemap-urls', async (locale?: Locale) => {
  if (locale) {
    return db
      .select()
      .from(sitemapIndex)
      .innerJoin(content, eq(sitemapIndex.contentId, content.id))
      .where(and(eq(content.locale, locale), eq(content.status, 'published')))
      .orderBy(desc(sitemapIndex.lastmod));
  }

  return db.select().from(sitemapIndex).orderBy(desc(sitemapIndex.lastmod));
});

export async function getSitemapUrls(locale?: Locale) {
  return getSitemapUrlsCached(locale);
}

export async function incrementViews(contentId: string) {
  await db.insert(pageViews).values({ contentId });
}

const getContentSearchFallbackCached = cachedDbQuery(
  'content-search-fallback',
  async (query: string, locale: Locale, limit: number) => {
  const like = `%${query}%`;
  return db
    .select()
    .from(content)
    .where(
      and(
        publishedOnly(),
        or(ilike(content.title, like), ilike(content.metaDescription, like), ilike(content.cuisine, like)),
      ),
    )
    .limit(limit);
  },
);

export async function getContentSearchFallback(query: string, locale: Locale, limit = 20) {
  return getContentSearchFallbackCached(query, locale, limit);
}

const getDailyFeaturedContentCached = cachedDbQuery('daily-featured-content', async (locale: Locale, limit: number) => {
  const rows = await db
    .select()
    .from(content)
    .where(and(publishedOnly(), sql`${content.imageUrl} is not null`))
    .orderBy(sql`md5(${content.id}::text || current_date::text)`)
    .limit(limit);

  if (rows.length >= limit) return rows;

  const fallback = await db
    .select()
    .from(content)
    .where(publishedOnly())
    .orderBy(sql`md5(${content.id}::text || current_date::text)`)
    .limit(limit);

  return fallback;
});

export async function getDailyFeaturedContent(locale: Locale, limit = 3) {
  return getDailyFeaturedContentCached(locale, limit);
}

const getHomepageFeaturedContentCached = cachedDbQuery('homepage-featured-content', async (locale: Locale, limit: number) => {
  const configured = await db
    .select()
    .from(content)
    .where(publishedOnly())
    .orderBy(desc(content.impressions7d), desc(content.clicks7d), desc(content.publishedAt))
    .limit(limit);

  if (configured.length) return configured;
  return getPublishedContent(locale, undefined, limit);
});

export async function getHomepageFeaturedContent(locale: Locale, limit = 3) {
  return getHomepageFeaturedContentCached(locale, limit);
}

const getFeaturedByTypeCached = cachedDbQuery('featured-by-type', async (locale: Locale, type: ContentType) => {
  const [row] = await db
    .select()
    .from(content)
    .where(and(publishedOnly(), eq(content.type, type)))
    .orderBy(sql`md5(${content.id}::text || current_date::text)`)
    .limit(1);

  return row ?? null;
});

export async function getFeaturedByType(locale: Locale, type: ContentType) {
  return getFeaturedByTypeCached(locale, type);
}

const getCuisineCountryCountsCached = cachedDbQuery('cuisine-country-counts', async (locale: Locale) => {
  const result: Record<string, number> = {};

  await Promise.all(
    cuisineCountries.map(async (country) => {
      const conditions = country.terms.map((term) => ilike(content.cuisine, `%${term}%`));
      const [{ total }] = await db
        .select({ total: count() })
        .from(content)
        .where(and(publishedOnly(), or(...conditions)));
      result[country.slug] = Number(total);
    }),
  );

  return result;
});

export async function getCuisineCountryCounts(locale: Locale) {
  return getCuisineCountryCountsCached(locale);
}

export async function getPublishedCuisineCountries(locale: Locale) {
  const counts = await getCuisineCountryCounts(locale);
  return cuisineCountries
    .map((country) => ({ ...country, count: counts[country.slug] ?? 0 }))
    .filter((country) => country.count > 0);
}

const getContentTypeCountsCached = cachedDbQuery('content-type-counts', async (locale: string): Promise<Array<{ type: string; count: number }>> => {
  const rows = await db
    .select({ type: content.type, count: sql<number>`cast(count(*) as int)` })
    .from(content)
    .where(publishedOnly())
    .groupBy(content.type);
  return rows;
});

export async function getContentTypeCounts(locale: string): Promise<Array<{ type: string; count: number }>> {
  return getContentTypeCountsCached(locale);
}

const getTotalPublishedCountCached = cachedDbQuery('total-published-count', async (locale: string): Promise<number> => {
  const [row] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(content)
    .where(publishedOnly());
  return row?.count ?? 0;
});

export async function getTotalPublishedCount(locale: string): Promise<number> {
  return getTotalPublishedCountCached(locale);
}

const getDistinctCuisinesCached = cachedDbQuery('distinct-cuisines', async (locale: string): Promise<string[]> => {
  const rows = await db
    .selectDistinct({ cuisine: content.cuisine })
    .from(content)
    .where(and(publishedOnly(), sql`${content.cuisine} is not null`))
    .limit(20);
  return rows.map((r) => r.cuisine).filter(Boolean) as string[];
});

export async function getDistinctCuisines(locale: string): Promise<string[]> {
  return getDistinctCuisinesCached(locale);
}
