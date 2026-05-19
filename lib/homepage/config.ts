import { desc, eq, sql } from 'drizzle-orm';
import { affiliateEvents, content, db, homepageConfig } from '@/lib/db/schema';

function seasonalIngredientTerms(month: number) {
  if ([3, 4, 5].includes(month)) return ['nopal', 'aguacate', 'fresa', 'chile poblano'];
  if ([6, 7, 8].includes(month)) return ['mango', 'maiz', 'tomatillo', 'calabacita'];
  if ([9, 10, 11].includes(month)) return ['calabaza', 'camote', 'granada', 'chile ancho'];
  return ['mandarina', 'guayaba', 'piloncillo', 'canela'];
}

export async function updateHomepageConfig(): Promise<void> {
  const heroRows = await db.execute<{ id: string }>(sql`
    select c.id
    from content c
    left join page_views pv
      on pv.content_id = c.id
      and pv.viewed_at >= now() - interval '72 hours'
    where c.status = 'published'
      and c.published_at >= now() - interval '72 hours'
    group by c.id
    order by count(pv.id) desc, c.published_at desc
    limit 3
  `);

  const [featuredTechnique] = await db.execute<{ id: string }>(sql`
    select c.id
    from content c
    left join page_views pv on pv.content_id = c.id
    where c.status = 'published'
      and c.type = 'technique'
    group by c.id
    order by count(pv.id) asc, c.published_at desc
    limit 1
  `);

  const terms = seasonalIngredientTerms(new Date().getMonth() + 1);
  const [featuredIngredient] = await db.execute<{ id: string }>(sql`
    select c.id
    from content c
    where c.status = 'published'
      and c.type in ('ingredient', 'spice')
      and (
        c.title ilike any(${terms.map((term) => `%${term}%`)}::text[])
        or c.slug ilike any(${terms.map((term) => `%${term}%`)}::text[])
      )
    order by c.published_at desc
    limit 1
  `);

  const [topAffiliate] = await db
    .select({ productId: affiliateEvents.productId, clicks: sql<number>`count(*)` })
    .from(affiliateEvents)
    .where(sql`${affiliateEvents.clickedAt} >= date_trunc('month', now())`)
    .groupBy(affiliateEvents.productId)
    .orderBy(desc(sql`count(*)`))
    .limit(1);

  const tagRows = await db
    .select({ tags: content.tiktokHashtags })
    .from(content)
    .where(sql`${content.publishedAt} >= date_trunc('day', now()) and ${content.status} = 'published'`)
    .limit(25);

  const trendingTags = [...new Set(tagRows.flatMap((row) => row.tags ?? []))].slice(0, 12);

  await db
    .insert(homepageConfig)
    .values({
      id: 1,
      heroContentIds: heroRows.map((row) => row.id),
      featuredTechnique: featuredTechnique?.id,
      featuredIngredient: featuredIngredient?.id,
      topAffiliateId: topAffiliate?.productId ?? undefined,
      trendingTags,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: homepageConfig.id,
      set: {
        heroContentIds: heroRows.map((row) => row.id),
        featuredTechnique: featuredTechnique?.id,
        featuredIngredient: featuredIngredient?.id,
        topAffiliateId: topAffiliate?.productId ?? undefined,
        trendingTags,
        updatedAt: new Date(),
      },
    });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (baseUrl && secret) {
    await fetch(`${baseUrl}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: '/', secret }),
    }).catch((error) => console.error('Homepage revalidation failed', error));
  }
}
