import { NextRequest } from 'next/server';
import { rateLimit } from '@/lib/api/rate-limit';
import { db, pageViews } from '@/lib/db/schema';

const REFERRERS = new Set(['google', 'tiktok', 'direct', 'social', 'other']);
const DEVICES = new Set(['mobile', 'tablet', 'desktop']);

export async function POST(request: NextRequest) {
  const limited = rateLimit(request);
  if (limited) return limited;

  try {
    const body = await request.json();
    void db.insert(pageViews).values({
      contentId: body.contentId,
      locale: body.locale,
      referrerType: REFERRERS.has(body.referrerType) ? body.referrerType : REFERRERS.has(body.referrer) ? body.referrer : 'other',
      device: DEVICES.has(body.device) ? body.device : 'desktop',
    }).catch((error) => console.error('Page view tracking failed', error));
  } catch (error) {
    console.error('Page view tracking failed', error);
  }

  return Response.json({ success: true });
}
