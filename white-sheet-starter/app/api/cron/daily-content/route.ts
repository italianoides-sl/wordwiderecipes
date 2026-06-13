import { runContentPipeline } from '@/lib/content/pipeline';

function authorized(request: Request) {
  const auth = request.headers.get('authorization');
  return Boolean(process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`);
}

const DAILY_QUEUE = [
  {
    topic: 'Plantilla diaria: reescribe este topic para tu nicho',
    type: 'article' as const,
    category: 'daily',
    cluster: 'daily-publishing',
    uniqueAngle: 'pieza editorial breve con intención clara de búsqueda',
  },
];

export async function GET(request: Request) {
  if (!authorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = [];

  for (const topic of DAILY_QUEUE) {
    results.push(await runContentPipeline(topic));
  }

  return Response.json({ success: true, results });
}

export const POST = GET;
