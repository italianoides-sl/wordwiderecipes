import { buildMainSitemap } from '@/lib/seo/sitemap-builder';

export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response(await buildMainSitemap(), {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
