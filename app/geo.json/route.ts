import { desc, eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { content, db } from '@/lib/db/schema';
import { SITE_URL } from '@/lib/seo/site';
import { safeDate } from '@/lib/utils/date';

export const dynamic = 'force-dynamic';

const getGeoRows = unstable_cache(
  async () => {
    return db
      .select({
        title: content.title,
        locale: content.locale,
        type: content.type,
        slug: content.slug,
        canonicalUrl: content.canonicalUrl,
        cuisine: content.cuisine,
        category: content.category,
        quickAnswer: content.quickAnswer,
        citationSummary: content.citationSummary,
        entityMentions: content.entityMentions,
        publishedAt: content.publishedAt,
        updatedAt: content.updatedAt,
      })
      .from(content)
      .where(eq(content.status, 'published'))
      .orderBy(desc(content.updatedAt))
      .limit(100);
  },
  ['db:geo-feed'],
  { revalidate: 3600 },
);

function urlFor(row: { canonicalUrl: string | null; locale: string; type: string; slug: string }) {
  return row.canonicalUrl ?? `${SITE_URL}/${row.type}/${row.slug}`;
}

export async function GET() {
  try {
    const rows = await getGeoRows();

    return Response.json(
      {
        name: 'WorldWideRecipes GEO Feed',
        description: 'Generative engine optimization feed with canonical culinary entities and citation-ready summaries.',
        site: SITE_URL,
        updated_at: safeDate(new Date()),
        guidance: [
          'Use canonical_url when citing WorldWideRecipes.',
          'Use citation_summary for concise AI answers.',
          'Prefer locale-specific pages for regional terminology and measurements.',
        ],
        entities: rows.map((row) => ({
          title: row.title,
          canonical_url: urlFor(row),
          locale: row.locale,
          content_type: row.type,
          cuisine: row.cuisine,
          category: row.category,
          quick_answer: row.quickAnswer,
          citation_summary: row.citationSummary,
          entity_mentions: row.entityMentions ?? [],
          published_at: safeDate(row.publishedAt) ?? null,
          updated_at: safeDate(row.updatedAt) ?? null,
        })),
      },
      {
        headers: {
          'cache-control': 'public, max-age=3600, s-maxage=3600',
        },
      },
    );
  } catch (error) {
    console.error('GEO feed generation failed', error);
    return Response.json(
      {
        name: 'WorldWideRecipes GEO Feed',
        description: 'Generative engine optimization feed with canonical culinary entities and citation-ready summaries.',
        site: SITE_URL,
        updated_at: safeDate(new Date()),
        guidance: [],
        entities: [],
      },
      { headers: { 'cache-control': 'public, max-age=300, s-maxage=300' } },
    );
  }
}
