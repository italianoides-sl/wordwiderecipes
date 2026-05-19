import { NextRequest } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { rateLimit } from '@/lib/api/rate-limit';
import { affiliateEvents, affiliateProducts, db, type AffiliateMarket } from '@/lib/db/schema';

const MARKETS = new Set(['es', 'mx', 'global', 'br']);

export async function POST(request: NextRequest) {
  const limited = rateLimit(request);
  if (limited) return limited;

  try {
    const body = await request.json();
    const market = MARKETS.has(body.market) ? (body.market as AffiliateMarket) : 'global';

    void db.insert(affiliateEvents).values({
      contentId: body.contentId,
      productId: body.productId,
      market,
      position: body.position,
      locale: body.locale,
    }).catch((error) => console.error('Affiliate click tracking failed', error));

    if (body.productId) {
      const clickUpdate = {
        totalClicks: sql`coalesce(${affiliateProducts.totalClicks}, 0) + 1`,
        ...(market === 'es' ? { clicksEs: sql`coalesce(${affiliateProducts.clicksEs}, 0) + 1` } : {}),
        ...(market === 'mx' ? { clicksMx: sql`coalesce(${affiliateProducts.clicksMx}, 0) + 1` } : {}),
      };

      void db
        .update(affiliateProducts)
        .set(clickUpdate)
        .where(eq(affiliateProducts.id, body.productId))
        .catch((error) => console.error('Affiliate product update failed', error));
    }
  } catch (error) {
    console.error('Affiliate click tracking failed', error);
  }

  return Response.json({ success: true });
}
