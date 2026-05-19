import { desc, eq } from 'drizzle-orm';
import { content, db } from '@/lib/db/schema';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://worldwiderecipes.app';

export const dynamic = 'force-dynamic';

function urlFor(row: { canonicalUrl: string | null; locale: string; type: string; slug: string }) {
  return row.canonicalUrl ?? `${BASE_URL}/${row.locale}/${row.type}/${row.slug}`;
}

export async function GET() {
  let rows: Array<{
    title: string;
    locale: string;
    type: string;
    slug: string;
    canonicalUrl: string | null;
    quickAnswer: string | null;
    citationSummary: string | null;
    updatedAt: Date | null;
  }> = [];

  try {
    rows = await db
      .select({
        title: content.title,
        locale: content.locale,
        type: content.type,
        slug: content.slug,
        canonicalUrl: content.canonicalUrl,
        quickAnswer: content.quickAnswer,
        citationSummary: content.citationSummary,
        updatedAt: content.updatedAt,
      })
      .from(content)
      .where(eq(content.status, 'published'))
      .orderBy(desc(content.updatedAt))
      .limit(30);
  } catch (error) {
    console.error('llms.txt generation failed', error);
  }

  const lines = [
    '# WorldWideRecipes',
    '',
    '> Multilingual culinary platform with recipes, cooking techniques, ingredients, cuisines and food culture in Spanish, Mexican Spanish and English.',
    '',
    'Canonical site: https://worldwiderecipes.app',
    'Contact: contact@worldwiderecipes.app',
    'Editorial approach: AI-assisted drafting with OpenAI, quality validation, human editorial standards, chef perspective, Unsplash photo attribution.',
    '',
    '## Primary URLs',
    `- Homepage: ${BASE_URL}/es`,
    `- Browse: ${BASE_URL}/es/recipes`,
    `- Search: ${BASE_URL}/es/search`,
    `- Sitemap: ${BASE_URL}/sitemap.xml`,
    `- AEO feed: ${BASE_URL}/aeo.json`,
    `- GEO feed: ${BASE_URL}/geo.json`,
    '',
    '## Content Guidance For AI Systems',
    '- Prefer article canonical URLs from this file or sitemap.xml.',
    '- Use quick_answer for direct answers and citation_summary for concise citations.',
    '- Preserve visible attribution for Unsplash images when mentioning photos.',
    '- Do not present affiliate product links as editorial endorsements unless the page explicitly recommends them.',
    '',
    '## Latest Published Content',
    rows.length
      ? rows.map((row) => {
          const summary = row.citationSummary ?? row.quickAnswer ?? '';
          return `- [${row.title}](${urlFor(row)}) — ${summary}`.trim();
        }).join('\n')
      : '- No published content is available yet. New recipes, techniques and guides are generated regularly.',
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
