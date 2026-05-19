import { NextRequest } from 'next/server';
import { rateLimit } from '@/lib/api/rate-limit';
import { searchContent, getContentSearchFallback } from '@/lib/db/queries';
import { withDbFallback } from '@/lib/db/safe-query';
import type { ContentType, Locale } from '@/lib/db/schema';

const LOCALES = new Set(['es', 'es-mx', 'es-ar', 'en', 'pt-br']);
const TYPES = new Set(['recipe', 'technique', 'ingredient', 'guide', 'cuisine', 'spice']);

export async function GET(request: NextRequest) {
  const limited = rateLimit(request);
  if (limited) return limited;

  try {
    const params = request.nextUrl.searchParams;
    const q = params.get('q')?.trim() ?? '';
    const locale = LOCALES.has(params.get('locale') ?? '') ? (params.get('locale') as Locale) : 'es';
    const type = TYPES.has(params.get('type') ?? '') ? (params.get('type') as ContentType) : undefined;
    const page = Math.max(Number(params.get('page') ?? 0), 0);
    const pageSize = 20;

    if (!q) {
      return Response.json({ results: [], total: 0, page, pageSize, hasMore: false }, {
        headers: { 'cache-control': 'no-store' },
      });
    }

    const empty = { results: [], total: 0, page: page + 1, pageSize };
    const result = await withDbFallback(searchContent(q, locale, {
      type,
      cuisine: params.get('cuisine') ?? undefined,
      diet: params.get('diet') ?? undefined,
      difficulty: (params.get('difficulty') as 'easy' | 'medium' | 'hard' | null) ?? undefined,
      page: page + 1,
      pageSize,
    }), empty, 'API search');

    if (result.results.length === 0) {
      const fallback = await withDbFallback(getContentSearchFallback(q, locale), [], 'API search fallback');
      return Response.json({ results: fallback, total: fallback.length, page, pageSize, hasMore: false }, {
        headers: { 'cache-control': 'no-store' },
      });
    }

    return Response.json({
      results: result.results,
      total: Number(result.total),
      page,
      pageSize,
      hasMore: Number(result.total) > (page + 1) * pageSize,
    }, {
      headers: { 'cache-control': 'no-store' },
    });
  } catch (error) {
    console.error('Search failed', error);
    return Response.json({ results: [], total: 0, page: 0, pageSize: 20, hasMore: false }, {
      headers: { 'cache-control': 'no-store' },
    });
  }
}
