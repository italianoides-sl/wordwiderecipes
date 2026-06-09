import { eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { content, db } from '@/lib/db/schema';
import { SITE_URL } from '@/lib/seo/site';
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
      .from(content)
      .where(eq(content.status, 'published'));
  },
  ['db:sitemap-entry-rows'],
  { revalidate: 3600 },
);

export async function buildSitemapEntries() {
  const rows = await getSitemapEntryRows();

  return rows.map((row) => ({
    url: `${SITE_URL}/${row.type}/${row.slug}`,
    lastmod: safeISOString(row.updatedAt),
  }));
}
