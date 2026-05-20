import { content, db } from '@/lib/db/schema';

export async function buildSitemapEntries() {
  const rows = await db
    .select({
      slug: content.slug,
      locale: content.locale,
      type: content.type,
      updatedAt: content.updatedAt,
    })
    .from(content);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://worldwiderecipes.app';
  return rows.map((row) => ({
    url: `${baseUrl}/${row.type}/${row.slug}`,
    lastmod: row.updatedAt?.toISOString() ?? new Date().toISOString(),
  }));
}
