import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const LOCALES = ['es', 'es-mx', 'es-ar', 'en', 'pt-br'];

function marketFor(locale: string) {
  if (locale === 'es') return 'es';
  if (locale === 'es-mx') return 'mx';
  if (locale === 'pt-br') return 'br';
  return 'global';
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/es', request.url));
  }

  const parts = pathname.split('/');
  const locale = parts[1];

  if (LOCALES.includes(locale)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-locale', locale);
    requestHeaders.set('x-affiliate-market', marketFor(locale));

    const internalPath = parts.slice(2).join('/');
    const rewriteUrl = new URL(internalPath ? `/${internalPath}` : '/', request.url);
    rewriteUrl.search = search;

    const response = NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
    response.headers.set('x-locale', locale);
    response.headers.set('x-affiliate-market', marketFor(locale));
    return response;
  }

  return NextResponse.redirect(new URL(`/es${pathname}`, request.url));
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
