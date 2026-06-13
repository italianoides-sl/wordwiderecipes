function authorized(request: Request) {
  const auth = request.headers.get('authorization');
  return Boolean(process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return Response.json({
    success: true,
    message: 'Using dynamic sitemap route. No static files to rebuild in starter.',
  });
}
