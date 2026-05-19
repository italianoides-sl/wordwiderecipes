export function requireCronSecret(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');
  const headerSecret = request.headers.get('x-cron-secret');

  if (!secret || (authorization !== `Bearer ${secret}` && headerSecret !== secret)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
