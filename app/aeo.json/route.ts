import { desc, eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { content, db } from '@/lib/db/schema';
import { SITE_URL } from '@/lib/seo/site';
import { safeISOString } from '@/lib/utils/date';

export const dynamic = 'force-dynamic';

const getAeoRows = unstable_cache(
  async () => {
    return db
      .select({
        title: content.title,
        locale: content.locale,
        type: content.type,
        slug: content.slug,
        canonicalUrl: content.canonicalUrl,
        quickAnswer: content.quickAnswer,
        citationSummary: content.citationSummary,
        keyFacts: content.keyFacts,
        faq: content.faq,
        entityMentions: content.entityMentions,
        updatedAt: content.updatedAt,
      })
      .from(content)
      .where(eq(content.status, 'published'))
      .orderBy(desc(content.updatedAt))
      .limit(50);
  },
  ['db:aeo-feed'],
  { revalidate: 3600 },
);

function urlFor(row: { canonicalUrl: string | null; locale: string; type: string; slug: string }) {
  return row.canonicalUrl ?? `${SITE_URL}/${row.type}/${row.slug}`;
}

export async function GET() {
  try {
    const rows = await getAeoRows();

    return Response.json(
      {
        name: 'WorldWideRecipes AEO Feed',
        description: 'Machine-readable answer summaries for published culinary content.',
        updated_at: new Date().toISOString(),
        count: rows.length,
        items: rows.map((row) => ({
          title: row.title,
          url: urlFor(row),
          locale: row.locale,
          type: row.type,
          quick_answer: row.quickAnswer,
          citation_summary: row.citationSummary,
          key_facts: row.keyFacts ?? [],
          faq: row.faq ?? [],
          entity_mentions: row.entityMentions ?? [],
          updated_at: safeISOString(row.updatedAt) ?? null,
        })),
      },
      {
        headers: {
          'cache-control': 'public, max-age=3600, s-maxage=3600',
        },
      },
    );
  } catch (error) {
    console.error('AEO feed generation failed', error);
    return Response.json(
      {
        name: 'WorldWideRecipes AEO Feed',
        description: 'Machine-readable answer summaries for published culinary content.',
        updated_at: new Date().toISOString(),
        count: 0,
        items: [],
      },
      { headers: { 'cache-control': 'public, max-age=300, s-maxage=300' } },
    );
  }
}
