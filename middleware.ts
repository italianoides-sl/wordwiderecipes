const LOCALES = ['es', 'es-mx', 'es-ar', 'en', 'pt-br'];

function marketFor(locale: string) {
  if (locale === 'es') return 'es';
  if (locale === 'es-mx') return 'mx';
  if (locale === 'pt-br') return 'br';
  return 'global';
}

function redirect(request: Request, pathname: string) {
  return Response.redirect(new URL(pathname, request.url), 307);
}

function rewrite(request: Request, pathname: string, locale: string, search = '') {
  const url = new URL(pathname, request.url);
  url.search = search;

  const headers = new Headers();
  headers.set('x-middleware-rewrite', url.href);
  headers.set('x-middleware-override-headers', 'x-locale,x-affiliate-market');
  headers.set('x-middleware-request-x-locale', locale);
  headers.set('x-middleware-request-x-affiliate-market', marketFor(locale));
  headers.set('x-locale', locale);
  headers.set('x-affiliate-market', marketFor(locale));

  return new Response(null, { headers });
}

export function middleware(request: Request) {
  const url = new URL(request.url);
  const { pathname, search } = url;

  if (pathname === '/') {
    return redirect(request, '/es');
  }

  const parts = pathname.split('/');
  const locale = parts[1];

  if (LOCALES.includes(locale)) {
    const internalPath = parts.slice(2).join('/');
    return rewrite(request, internalPath ? `/${internalPath}` : '/', locale, search);
  }

  return redirect(request, `/es${pathname}`);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
