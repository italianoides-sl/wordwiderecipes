import { NextRequest } from 'next/server';
import { syncSearchConsoleData } from '@/lib/analytics/gsc';

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');
  const headerSecret = request.headers.get('x-cron-secret');
  return Boolean(secret && (authorization === `Bearer ${secret}` || headerSecret === secret));
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const updated = await syncSearchConsoleData(7);
  return Response.json({ updated });
}

export const GET = POST;
