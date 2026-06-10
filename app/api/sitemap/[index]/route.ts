import { buildMainSitemapPage } from '@/lib/seo/sitemap-builder';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { index: string } },
) {
  const index = Number.parseInt(params.index, 10);

  return new Response(await buildMainSitemapPage(Number.isNaN(index) ? 0 : index), {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
