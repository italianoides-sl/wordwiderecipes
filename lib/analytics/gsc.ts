import { GoogleAuth } from 'google-auth-library';
import { and, eq } from 'drizzle-orm';
import { content, db, seoMetrics } from '@/lib/db/schema';
import { getGoogleServiceAccountCredentials } from '@/lib/google/service-account';

type SearchConsoleRow = {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

function isoDate(daysAgo: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function getAuth() {
  const credentials = getGoogleServiceAccountCredentials();
  if (!credentials) return null;

  return new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
}

function parseContentLocation(pageUrl: string) {
  try {
    const url = new URL(pageUrl);
    const [locale, , slug] = url.pathname.split('/').filter(Boolean);
    if (!locale || !slug) return null;
    return { locale, slug };
  } catch {
    return null;
  }
}

export async function syncSearchConsoleData(daysBack = 7): Promise<number> {
  const auth = getAuth();
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY ?? process.env.NEXT_PUBLIC_BASE_URL;
  if (!auth || !siteUrl) return 0;

  const client = await auth.getClient();
  const response = await client.request<{ rows?: SearchConsoleRow[] }>({
    url: `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    method: 'POST',
    data: {
      startDate: isoDate(daysBack),
      endDate: isoDate(1),
      dimensions: ['page', 'query'],
      rowLimit: 25000,
    },
  });

  const rows = response.data.rows ?? [];
  const byContent = new Map<string, {
    contentId: string;
    clicks: number;
    impressions: number;
    weightedPosition: number;
    queries: Array<{ query: string; clicks: number; position: number }>;
  }>();

  for (const row of rows) {
    const [pageUrl, query] = row.keys ?? [];
    if (!pageUrl) continue;

    const location = parseContentLocation(pageUrl);
    if (!location) continue;

    const [contentRow] = await db
      .select({ id: content.id })
      .from(content)
      .where(and(eq(content.slug, location.slug), eq(content.locale, location.locale)))
      .limit(1);
    if (!contentRow) continue;

    const current = byContent.get(contentRow.id) ?? {
      contentId: contentRow.id,
      clicks: 0,
      impressions: 0,
      weightedPosition: 0,
      queries: [],
    };

    const clicks = row.clicks ?? 0;
    const impressions = row.impressions ?? 0;
    const position = row.position ?? 0;
    current.clicks += clicks;
    current.impressions += impressions;
    current.weightedPosition += position * Math.max(impressions, 1);
    if (query) current.queries.push({ query, clicks, position });
    byContent.set(contentRow.id, current);
  }

  const metricDate = isoDate(1);
  for (const aggregate of byContent.values()) {
    const avgPosition = aggregate.impressions
      ? aggregate.weightedPosition / aggregate.impressions
      : null;
    const ctr = aggregate.impressions ? aggregate.clicks / aggregate.impressions : 0;
    const topQueries = aggregate.queries.sort((a, b) => b.clicks - a.clicks).slice(0, 10);

    await db
      .insert(seoMetrics)
      .values({
        contentId: aggregate.contentId,
        date: metricDate,
        impressions: aggregate.impressions,
        clicks: aggregate.clicks,
        avgPosition: avgPosition?.toFixed(2),
        ctr: ctr.toFixed(4),
        topQuery: topQueries[0]?.query,
      })
      .onConflictDoUpdate({
        target: [seoMetrics.contentId, seoMetrics.date],
        set: {
          impressions: aggregate.impressions,
          clicks: aggregate.clicks,
          avgPosition: avgPosition?.toFixed(2),
          ctr: ctr.toFixed(4),
          topQuery: topQueries[0]?.query,
        },
      });

    await db
      .update(content)
      .set({
        impressions7d: aggregate.impressions,
        clicks7d: aggregate.clicks,
        avgPosition7d: avgPosition?.toFixed(2),
        topQueries,
      })
      .where(eq(content.id, aggregate.contentId));
  }

  return byContent.size;
}
