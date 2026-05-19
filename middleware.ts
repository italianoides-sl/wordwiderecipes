import { NextResponse, type NextRequest } from 'next/server';

const SUPPORTED_LOCALES = ['es', 'es-mx', 'es-ar', 'en', 'pt-br'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

function preferredLocale(request: NextRequest): SupportedLocale {
  const language = request.headers.get('accept-language')?.toLowerCase() ?? '';
  if (language.includes('es-mx')) return 'es-mx';
  if (language.includes('pt-br')) return 'pt-br';
  if (language.includes('en')) return 'en';
  if (language.includes('es-ar')) return 'es-ar';
  if (language.includes('es')) return 'es';
  return 'es';
}

function marketFor(locale: string) {
  if (locale === 'es') return 'es';
  if (locale === 'es-mx') return 'mx';
  if (locale === 'pt-br') return 'br';
  return 'global';
}

export function middleware(request: NextRequest) {
  const locale = preferredLocale(request);
  const market = marketFor(locale);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-locale', locale);
  requestHeaders.set('x-affiliate-market', market);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('x-locale', locale);
  response.headers.set('x-affiliate-market', market);
  response.headers.set('Vary', 'Accept-Language');

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|favicon.svg|apple-touch-icon.png|android-chrome|ads.txt|robots.txt|sitemap.*|.*\\..*).*)'],
};
