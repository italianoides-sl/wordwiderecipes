import { revalidatePath } from 'next/cache';
import { NextRequest } from 'next/server';
import { requireCronSecret } from '@/lib/api/auth';

export async function POST(request: NextRequest) {
  const unauthorized = requireCronSecret(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => ({}));

  if (!process.env.REVALIDATE_SECRET || body.secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const path = typeof body.path === 'string' ? body.path : '/';
  revalidatePath(path);

  return Response.json({ revalidated: true, path });
}
