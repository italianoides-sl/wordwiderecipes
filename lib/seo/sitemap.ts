import { unstable_cache } from 'next/cache';
import { content, db } from '@/lib/db/schema';
import { safeISOString } from '@/lib/utils/date';

const getSitemapEntryRows = unstable_cache(
  async () => {
    return db
      .select({
        slug: content.slug,
        locale: content.locale,
        type: content.type,
        updatedAt: content.updatedAt,
      })
      .from(content);
  },
  ['db:sitemap-entry-rows'],
  { revalidate: 3600 },
);

export async function buildSitemapEntries() {
  const rows = await getSitemapEntryRows();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://worldwiderecipes.app';
  return rows.map((row) => ({
    url: `${baseUrl}/${row.type}/${row.slug}`,
    lastmod: safeISOString(row.updatedAt),
  }));
}
