import { getPublishedContent } from '@/lib/db/queries';
import { buildSitemapXml } from '@/lib/seo/sitemap';

export async function GET() {
  const items = await getPublishedContent(5000);
  return new Response(buildSitemapXml(items), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
