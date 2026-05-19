import { and, eq, ne, sql } from 'drizzle-orm';
import { content, db, internalLinks } from '@/lib/db/schema';

function overlapScore(a: string[], b: string[]) {
  const left = new Set(a.map((item) => item.toLowerCase()));
  return b.reduce((score, item) => score + (left.has(item.toLowerCase()) ? 1 : 0), 0);
}

function termsFor(row: { title: string; slug: string; cuisine: string | null; category: string | null; entityMentions: string[] | null }) {
  return [
    row.title,
    row.slug,
    row.cuisine ?? '',
    row.category ?? '',
    ...(row.entityMentions ?? []),
  ]
    .join(' ')
    .split(/[\s,/|-]+/)
    .map((term) => term.trim())
    .filter(Boolean);
}

export async function computeInternalLinks(contentId: string, locale: string): Promise<void> {
  const [newContent] = await db.select().from(content).where(eq(content.id, contentId)).limit(1);
  if (!newContent) return;

  const existing = await db
    .select()
    .from(content)
    .where(and(eq(content.locale, locale), eq(content.status, 'published'), ne(content.id, contentId)));

  const newTerms = termsFor(newContent);
  const related = existing
    .map((candidate) => ({
      candidate,
      score:
        overlapScore(newTerms, termsFor(candidate)) +
        (candidate.cuisine && candidate.cuisine === newContent.cuisine ? 3 : 0) +
        (candidate.type === newContent.type ? 1 : 0),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((item) => item.candidate);

  if (related.length) {
    await db
      .insert(internalLinks)
      .values(
        related.map((target) => ({
          fromId: contentId,
          toId: target.id,
          anchorText: target.title,
          linkType: target.cuisine === newContent.cuisine ? 'same_cuisine' : 'related',
          position: 'related_section',
        })),
      )
      .onConflictDoNothing();
  }

  await db
    .update(content)
    .set({
      relatedSlugs: related.map((target) => target.slug),
      internalLinkCount: related.length,
    })
    .where(eq(content.id, contentId));

  const reverseCandidates = existing
    .filter((candidate) => {
      const mentions = candidate.entityMentions ?? [];
      return mentions.some((mention) =>
        [newContent.title, newContent.slug, newContent.cuisine ?? '']
          .filter(Boolean)
          .some((term) => mention.toLowerCase().includes(term.toLowerCase())),
      );
    })
    .slice(0, 2);

  if (reverseCandidates.length) {
    await db
      .insert(internalLinks)
      .values(
        reverseCandidates.map((source) => ({
          fromId: source.id,
          toId: contentId,
          anchorText: newContent.title,
          linkType: 'related',
          position: 'body',
        })),
      )
      .onConflictDoNothing();

    await Promise.all(
      reverseCandidates.map((source) =>
        db
          .update(content)
          .set({
            relatedSlugs: sql`array(
              select distinct unnest(coalesce(${content.relatedSlugs}, '{}') || ARRAY[${newContent.slug}]::text[])
            )`,
            internalLinkCount: sql`coalesce(${content.internalLinkCount}, 0) + 1`,
          })
          .where(eq(content.id, source.id)),
      ),
    );
  }
}
