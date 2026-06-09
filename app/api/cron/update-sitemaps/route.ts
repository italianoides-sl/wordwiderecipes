import { NextRequest } from 'next/server';
import { buildSitemap, SITEMAP_FILES } from '@/lib/seo/sitemap-builder';
import { SITE_URL } from '@/lib/seo/site';

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');
  const headerSecret = request.headers.get('x-cron-secret');
  return Boolean(secret && (authorization === `Bearer ${secret}` || headerSecret === secret));
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let urls = 0;
  for (const file of SITEMAP_FILES) {
    const xml = await buildSitemap({ file });
    urls += (xml.match(/<url>/g) ?? []).length;
  }

  const sitemapUrl = `${SITE_URL}/sitemap.xml`;
  await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`).catch((error) =>
    console.error('Google sitemap ping failed', error),
  );

  return Response.json({ sitemaps: SITEMAP_FILES.length, urls });
}

export const GET = POST;
