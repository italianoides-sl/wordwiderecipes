import { STARTER_TOPICS } from '@/lib/content/content-plan';
import { runContentPipeline } from '@/lib/content/pipeline';

function authorized(request: Request) {
  const auth = request.headers.get('authorization');
  return Boolean(process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const jobs = [];
  let generated = 0;

  for (const topic of STARTER_TOPICS) {
    const result = await runContentPipeline({
      topic: topic.topic,
      type: topic.type,
      category: topic.category,
      cluster: topic.cluster,
      uniqueAngle: topic.uniqueAngle,
    });

    jobs.push({ topic: topic.topic, ...result });
    if (result.success) generated += 1;
  }

  return Response.json({
    success: true,
    generated,
    attempted: STARTER_TOPICS.length,
    jobs,
  });
}

export const POST = GET;
