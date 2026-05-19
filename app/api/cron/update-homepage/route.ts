import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, generationJobs } from '@/lib/db/schema';
import { updateHomepageConfig } from '@/lib/homepage/config';

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');
  const headerSecret = request.headers.get('x-cron-secret');
  return Boolean(secret && (authorization === `Bearer ${secret}` || headerSecret === secret));
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const [job] = await db.insert(generationJobs).values({
    jobType: 'daily_cron',
    status: 'running',
    topic: 'update-homepage',
    startedAt: new Date(),
  }).returning();

  try {
    await updateHomepageConfig();
    await db.update(generationJobs).set({ status: 'completed', completedAt: new Date() }).where(eq(generationJobs.id, job.id));
    return Response.json({ updated: true, jobId: job.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown update-homepage error';
    await db.update(generationJobs).set({ status: 'failed', errorMessage: message, completedAt: new Date() }).where(eq(generationJobs.id, job.id));
    return Response.json({ updated: false, error: message, jobId: job.id }, { status: 500 });
  }
}

export const GET = POST;
