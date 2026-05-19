import { desc, eq } from 'drizzle-orm';
import { content, db } from '@/lib/db/schema';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://worldwiderecipes.app';

export const dynamic = 'force-dynamic';

function urlFor(row: { canonicalUrl: string | null; locale: string; type: string; slug: string }) {
  return row.canonicalUrl ?? `${BASE_URL}/${row.locale}/${row.type}/${row.slug}`;
}

export async function GET() {
  try {
    const rows = await db
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
          updated_at: row.updatedAt?.toISOString() ?? null,
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
