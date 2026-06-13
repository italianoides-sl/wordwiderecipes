import { SITE_URL } from '@/lib/config/site';
import type { ContentRow } from '@/lib/db/schema';

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildSitemapXml(items: ContentRow[]) {
  const urls = items
    .map((item) => {
      const lastmod = item.updatedAt?.toISOString() ?? new Date().toISOString();
      return `<url><loc>${escapeXml(`${SITE_URL}/article/${item.slug}`)}</loc><lastmod>${lastmod}</lastmod></url>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${SITE_URL}</loc></url>
<url><loc>${SITE_URL}/articles</loc></url>
${urls}
</urlset>`;
}
