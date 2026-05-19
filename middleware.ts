import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SUPPORTED_LOCALES = ['es', 'es-mx', 'es-ar', 'en', 'pt-br'] as const;
const DEFAULT_LOCALE = 'es';
const PUBLIC_FILE = /\.(?:avif|css|gif|ico|jpg|jpeg|js|json|map|png|svg|txt|webmanifest|webp|woff|woff2|xml)$/i;
const LOCALE_LIKE = /^[a-z]{2}(?:-[a-z]{2})?$/i;

function isSupportedLocale(value: string | undefined): value is (typeof SUPPORTED_LOCALES)[number] {
  return Boolean(value && SUPPORTED_LOCALES.includes(value.toLowerCase() as (typeof SUPPORTED_LOCALES)[number]));
}

function detectLocale(acceptLanguage: string) {
  const header = acceptLanguage.toLowerCase();
  if (header.includes('es-mx')) return 'es-mx';
  if (header.includes('es-ar')) return 'es-ar';
  if (header.includes('pt-br') || header.includes('pt')) return 'pt-br';
  if (header.includes('en')) return 'en';
  if (header.includes('es')) return 'es';
  return DEFAULT_LOCALE;
}

function affiliateMarket(locale: string) {
  if (locale === 'es') return 'es';
  if (locale === 'es-mx') return 'mx';
  if (locale === 'pt-br') return 'br';
  return 'global';
}

function withLocaleHeaders(request: NextRequest, locale: string) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-locale', locale);
  requestHeaders.set('x-affiliate-market', affiliateMarket(locale));
  return requestHeaders;
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const acceptLanguage = request.headers.get('accept-language') ?? '';
  const detectedLocale = detectLocale(acceptLanguage);

  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = `/${detectedLocale}`;
    return NextResponse.redirect(url);
  }

  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0]?.toLowerCase();

  if (isSupportedLocale(firstSegment)) {
    const internalPath = `/${segments.slice(1).join('/')}`;
    const url = request.nextUrl.clone();
    url.pathname = internalPath === '/' ? '/' : internalPath.replace(/\/$/, '');
    url.search = search;

    const response = NextResponse.rewrite(url, {
      request: {
        headers: withLocaleHeaders(request, firstSegment),
      },
    });
    response.headers.set('x-affiliate-market', affiliateMarket(firstSegment));
    response.headers.set('x-locale', firstSegment);
    return response;
  }

  if (firstSegment && LOCALE_LIKE.test(firstSegment)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}/${segments.slice(1).join('/')}`.replace(/\/$/, '');
    url.search = search;
    return NextResponse.redirect(url);
  }

  if (PUBLIC_FILE.test(pathname)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${detectedLocale}${pathname}`;
  url.search = search;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)'],
};
