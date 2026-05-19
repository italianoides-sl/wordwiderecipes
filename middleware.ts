import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const acceptLanguage = request.headers.get('accept-language') ?? '';

  const market = acceptLanguage.includes('es-MX') || acceptLanguage.includes('es-mx')
    ? 'mx'
    : acceptLanguage.includes('es')
    ? 'es'
    : 'global';

  response.headers.set('x-affiliate-market', market);

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
