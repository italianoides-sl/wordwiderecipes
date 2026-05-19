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

function withMarket(response: NextResponse, locale: string) {
  response.headers.set('x-affiliate-market', marketFor(locale));
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];

  if (pathname === '/') {
    const locale = preferredLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    return withMarket(NextResponse.redirect(url), locale);
  }

  if (first && first.length <= 5 && !SUPPORTED_LOCALES.includes(first as SupportedLocale)) {
    const url = request.nextUrl.clone();
    url.pathname = '/es';
    return withMarket(NextResponse.redirect(url), 'es');
  }

  if (!first || !SUPPORTED_LOCALES.includes(first as SupportedLocale)) {
    const locale = preferredLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname}`;
    return withMarket(NextResponse.redirect(url), locale);
  }

  return withMarket(NextResponse.next(), first);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|favicon.svg|apple-touch-icon.png|android-chrome|ads.txt|robots.txt|sitemap.*|.*\\..*).*)'],
};
