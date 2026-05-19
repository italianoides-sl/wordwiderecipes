import { NextRequest } from 'next/server';
import { requireCronSecret } from '@/lib/api/auth';
import { indexUrl } from '@/lib/seo/google-indexing';

export async function POST(request: NextRequest) {
  const unauthorized = requireCronSecret(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => ({}));
  const url = typeof body.url === 'string' ? body.url : '';

  if (!url) {
    return Response.json({ error: 'Missing url' }, { status: 400 });
  }

  const indexed = await indexUrl(url);
  return Response.json({ ok: indexed, url });
}
