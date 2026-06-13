import { getPublishedContent } from '@/lib/db/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').toLowerCase().trim();
  const items = await getPublishedContent(100);
  const filtered = q
    ? items.filter((item) =>
        [item.title, item.metaDescription, item.excerpt, item.topicalCluster]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(q)),
      )
    : items;

  return Response.json({ items: filtered.slice(0, 20) });
}
