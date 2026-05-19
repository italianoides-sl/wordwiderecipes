import { and, count, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';
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

function publishedLocale(locale: Locale): SQL {
  return and(eq(content.status, 'published'), eq(content.locale, locale))!;
}

export async function getPublishedContent(
  locale: Locale,
  type?: ContentType,
  limit = 24,
  offset = 0,
) {
  const where = type ? and(publishedLocale(locale), eq(content.type, type)) : publishedLocale(locale);

  return db
    .select()
    .from(content)
    .where(where)
    .orderBy(desc(content.publishedAt))
    .limit(limit)
    .offset(offset);
}

export async function getPublishedSlugsByType(type: ContentType) {
  return db
    .select({
      locale: content.locale,
      slug: content.slug,
    })
    .from(content)
    .where(and(eq(content.status, 'published'), eq(content.type, type)))
    .orderBy(desc(content.updatedAt));
}

export async function getContentBySlug(slug: string, locale: Locale) {
  const [row] = await db
    .select()
    .from(content)
    .where(and(eq(content.slug, slug), eq(content.locale, locale), eq(content.status, 'published')))
    .limit(1);

  return row ?? null;
}

export async function getContentBySlugAndType(slug: string, locale: Locale, type: ContentType) {
  const [row] = await db
    .select()
    .from(content)
    .where(and(eq(content.slug, slug), eq(content.locale, locale), eq(content.type, type), eq(content.status, 'published')))
    .limit(1);

  return row ?? null;
}

export async function getRelatedContent(slug: string, locale: Locale, limit = 6) {
  const current = await getContentBySlug(slug, locale);
  if (!current?.relatedSlugs?.length) return [];

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
        publishedLocale(locale),
        sql`${content.slug} = ANY(${current.relatedSlugs})`,
      ),
    )
    .limit(limit);
}

export async function getRelatedContentForContent(row: Content, limit = 4) {
  if (row.relatedSlugs?.length) {
    const related = await db
      .select()
      .from(content)
      .where(
        and(
          publishedLocale(row.locale as Locale),
          sql`${content.slug} = ANY(${row.relatedSlugs})`,
        ),
      )
      .limit(limit);
    if (related.length) return related;
  }

  return db
    .select()
    .from(content)
    .where(and(publishedLocale(row.locale as Locale), eq(content.type, row.type), sql`${content.id} <> ${row.id}`))
    .orderBy(desc(content.publishedAt))
    .limit(limit);
}

export async function getHomepageConfig() {
  const [row] = await db.select().from(homepageConfig).where(eq(homepageConfig.id, 1)).limit(1);
  return row ?? null;
}

export async function getTopAffiliateProducts(market: AffiliateMarket, limit = 10) {
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
}

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
  const page = Math.max(filters?.page ?? 1, 1);
  const pageSize = Math.min(Math.max(filters?.pageSize ?? 20, 1), 100);
  const terms = query.trim();
  const whereParts: SQL[] = [publishedLocale(locale)];

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
}

export async function getContentByFiltersPaged(locale: Locale, filters: FilterParams = {}, page = 0, pageSize = 12) {
  const safePage = Math.max(page, 0);
  const safePageSize = Math.min(Math.max(pageSize, 1), 48);
  const whereParts: SQL[] = [publishedLocale(locale)];

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
}

export async function getContentByFilter(
  locale: Locale,
  type?: ContentType,
  cuisine?: string,
  diet?: string,
  difficulty?: 'easy' | 'medium' | 'hard',
) {
  const whereParts: SQL[] = [publishedLocale(locale)];
  if (type) whereParts.push(eq(content.type, type));
  if (cuisine) whereParts.push(eq(content.cuisine, cuisine));
  if (diet) whereParts.push(sql`${content.dietTags} @> ARRAY[${diet}]::text[]`);
  if (difficulty) whereParts.push(eq(content.difficulty, difficulty));

  return db
    .select()
    .from(content)
    .where(and(...whereParts))
    .orderBy(desc(content.publishedAt));
}

export async function getSitemapUrls(locale?: Locale) {
  if (locale) {
    return db
      .select()
      .from(sitemapIndex)
      .innerJoin(content, eq(sitemapIndex.contentId, content.id))
      .where(and(eq(content.locale, locale), eq(content.status, 'published')))
      .orderBy(desc(sitemapIndex.lastmod));
  }

  return db.select().from(sitemapIndex).orderBy(desc(sitemapIndex.lastmod));
}

export async function incrementViews(contentId: string) {
  await db.insert(pageViews).values({ contentId });
}

export async function getContentSearchFallback(query: string, locale: Locale, limit = 20) {
  const like = `%${query}%`;
  return db
    .select()
    .from(content)
    .where(
      and(
        publishedLocale(locale),
        or(ilike(content.title, like), ilike(content.metaDescription, like), ilike(content.cuisine, like)),
      ),
    )
    .limit(limit);
}

export async function getDailyFeaturedContent(locale: Locale, limit = 3) {
  const rows = await db
    .select()
    .from(content)
    .where(and(publishedLocale(locale), sql`${content.imageUrl} is not null`))
    .orderBy(sql`md5(${content.id}::text || current_date::text)`)
    .limit(limit);

  if (rows.length >= limit) return rows;

  const fallback = await db
    .select()
    .from(content)
    .where(publishedLocale(locale))
    .orderBy(sql`md5(${content.id}::text || current_date::text)`)
    .limit(limit);

  return fallback;
}

export async function getHomepageFeaturedContent(locale: Locale, limit = 3) {
  const configured = await db
    .select()
    .from(content)
    .where(publishedLocale(locale))
    .orderBy(desc(content.impressions7d), desc(content.clicks7d), desc(content.publishedAt))
    .limit(limit);

  if (configured.length) return configured;
  return getPublishedContent(locale, undefined, limit);
}

export async function getFeaturedByType(locale: Locale, type: ContentType) {
  const [row] = await db
    .select()
    .from(content)
    .where(and(publishedLocale(locale), eq(content.type, type)))
    .orderBy(sql`md5(${content.id}::text || current_date::text)`)
    .limit(1);

  return row ?? null;
}

export async function getCuisineCountryCounts(locale: Locale) {
  const result: Record<string, number> = {};

  await Promise.all(
    cuisineCountries.map(async (country) => {
      const conditions = country.terms.map((term) => ilike(content.cuisine, `%${term}%`));
      const [{ total }] = await db
        .select({ total: count() })
        .from(content)
        .where(and(publishedLocale(locale), or(...conditions)));
      result[country.slug] = Number(total);
    }),
  );

  return result;
}

export async function getPublishedCuisineCountries(locale: Locale) {
  const counts = await getCuisineCountryCounts(locale);
  return cuisineCountries
    .map((country) => ({ ...country, count: counts[country.slug] ?? 0 }))
    .filter((country) => country.count > 0);
}

export async function getContentTypeCounts(locale: string): Promise<Array<{ type: string; count: number }>> {
  const rows = await db
    .select({ type: content.type, count: sql<number>`cast(count(*) as int)` })
    .from(content)
    .where(and(eq(content.status, 'published'), eq(content.locale, locale)))
    .groupBy(content.type);
  return rows;
}

export async function getTotalPublishedCount(locale: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(content)
    .where(and(eq(content.status, 'published'), eq(content.locale, locale)));
  return row?.count ?? 0;
}

export async function getDistinctCuisines(locale: string): Promise<string[]> {
  const rows = await db
    .selectDistinct({ cuisine: content.cuisine })
    .from(content)
    .where(and(eq(content.status, 'published'), eq(content.locale, locale), sql`${content.cuisine} is not null`))
    .limit(20);
  return rows.map((r) => r.cuisine).filter(Boolean) as string[];
}
