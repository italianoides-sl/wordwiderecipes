const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(request: Request, limit = 60, windowMs = 60_000) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwarded || request.headers.get('x-real-ip') || 'local';
  const now = Date.now();
  const current = buckets.get(ip);

  if (!current || current.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + windowMs });
    return null;
  }

  current.count += 1;
  if (current.count > limit) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }

  return null;
}
