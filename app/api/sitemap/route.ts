import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/api/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const limited = rateLimit(request);
  if (limited) return limited;

  return NextResponse.redirect(new URL('/sitemap.xml', request.url));
}
