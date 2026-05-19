import { buildSitemap } from '@/lib/seo/sitemap-builder';

export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response(await buildSitemap({ file: 'sitemap-recipes-es-mx.xml' }), {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
