import { and, desc, eq, ne } from 'drizzle-orm';
import { getDb, hasDatabase } from './client';
import { content, type ContentRow } from './schema';

export async function getPublishedContent(limit = 24) {
  if (!hasDatabase()) return [] as ContentRow[];
  return getDb()
    .select()
    .from(content)
    .where(eq(content.status, 'published'))
    .orderBy(desc(content.publishedAt))
    .limit(limit);
}

export async function getContentBySlug(slug: string) {
  if (!hasDatabase()) return null;
  const rows = await getDb()
    .select()
    .from(content)
    .where(and(eq(content.slug, slug), eq(content.status, 'published')))
    .limit(1);
  return rows[0] ?? null;
}

export async function getRelatedContent(item: ContentRow, limit = 3) {
  if (!hasDatabase()) return [] as ContentRow[];
  return getDb()
    .select()
    .from(content)
    .where(
      and(
        eq(content.status, 'published'),
        ne(content.slug, item.slug),
        eq(content.topicalCluster, item.topicalCluster ?? ''),
      ),
    )
    .orderBy(desc(content.publishedAt))
    .limit(limit);
}
