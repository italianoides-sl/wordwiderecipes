import { eq } from 'drizzle-orm';
import { content, db } from '@/lib/db/schema';
import { indexBatchIndexNow } from '@/lib/seo/bing-indexing';

const BASE_URL = 'https://worldwiderecipes.app';

export async function GET(req: Request) {
  const auth = req.headers.get('Authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const articles = await db
    .select({ slug: content.slug, type: content.type })
    .from(content)
    .where(eq(content.status, 'published'));

  const urls = articles.map((article) => `${BASE_URL}/${article.type}/${article.slug}`);
  const result = await indexBatchIndexNow(urls);

  return Response.json({
    ...result,
    total_urls: urls.length,
  });
}

export const POST = GET;
