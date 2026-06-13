import { config } from 'dotenv';
import { resolve } from 'path';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { content, internalLinks } from '@/lib/db/schema';

config({ path: resolve(process.cwd(), '.env.local') });

async function main() {
  const db = getDb();
  const rows = await db.select().from(content).where(eq(content.status, 'published')).orderBy(desc(content.publishedAt));

  for (const source of rows) {
    const candidates = rows
      .filter((target) => target.slug !== source.slug && target.topicalCluster === source.topicalCluster)
      .slice(0, 3);

    for (const target of candidates) {
      await db
        .insert(internalLinks)
        .values({
          fromSlug: source.slug,
          toSlug: target.slug,
          anchorText: target.title,
        })
        .onConflictDoNothing();
    }

    console.log(`✅ Links mapped: ${source.title}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
