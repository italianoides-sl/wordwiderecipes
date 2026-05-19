import { NextRequest } from 'next/server';
import { rateLimit } from '@/lib/api/rate-limit';
import { getContentBySlugAndType } from '@/lib/db/queries';
import { withDbFallback } from '@/lib/db/safe-query';
import type { ContentType, Locale } from '@/lib/db/schema';

const LOCALES = new Set(['es', 'es-mx', 'es-ar', 'en', 'pt-br']);
const TYPES = new Set(['recipe', 'technique', 'ingredient', 'guide', 'cuisine', 'spice']);

export async function GET(request: NextRequest) {
  const limited = rateLimit(request);
  if (limited) return limited;

  const params = request.nextUrl.searchParams;
  const locale = params.get('locale') ?? '';
  const type = params.get('type') ?? '';
  const slug = params.get('slug') ?? '';

  if (!LOCALES.has(locale) || !TYPES.has(type) || !slug) {
    return Response.json({ exists: false });
  }

  const row = await withDbFallback(
    getContentBySlugAndType(slug, locale as Locale, type as ContentType),
    null,
    'Content exists API',
  );
  return Response.json({ exists: Boolean(row) });
}
