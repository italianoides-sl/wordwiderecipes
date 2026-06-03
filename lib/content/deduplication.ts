import { desc, eq } from 'drizzle-orm';
import { content, db } from '@/lib/db/schema';

type PublishedContentRow = {
  title: string;
  slug: string;
};

export type PublishedContentDedupIndex = {
  rows: PublishedContentRow[];
  values: Set<string>;
  searchables: string[];
};

let publishedContentIndexPromise: Promise<PublishedContentDedupIndex> | null = null;

function normalizeValue(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, ' ');
}

function significantWords(value: string) {
  return normalizeValue(value)
    .split(' ')
    .filter((word) => word.length > 4);
}

function buildKeyPhrase(value: string) {
  return significantWords(value).slice(0, 3).join(' ');
}

export function normalizeSlugCandidate(value: string) {
  return normalizeValue(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function addValue(index: PublishedContentDedupIndex, value: string) {
  const normalized = value.trim();
  if (!normalized || index.values.has(normalized)) return;

  index.values.add(normalized);
  index.searchables.push(normalized);
}

export function rememberPublishedContent(index: PublishedContentDedupIndex, row: PublishedContentRow) {
  index.rows.unshift(row);
  addValue(index, normalizeValue(row.title));
  addValue(index, normalizeValue(row.slug));

  const keyPhrase = buildKeyPhrase(row.title);
  if (keyPhrase) {
    addValue(index, keyPhrase);
  }
}

export function rememberTopicInDedupIndex(index: PublishedContentDedupIndex, topic: string) {
  rememberPublishedContent(index, {
    title: topic,
    slug: normalizeSlugCandidate(topic),
  });
}

export function clonePublishedContentIndex(index: PublishedContentDedupIndex): PublishedContentDedupIndex {
  return {
    rows: [...index.rows],
    values: new Set(index.values),
    searchables: [...index.searchables],
  };
}

export function isDuplicateTopic(topic: string, index: PublishedContentDedupIndex): boolean {
  const normalizedTopic = normalizeValue(topic);
  if (!normalizedTopic) return false;

  if (index.values.has(normalizedTopic)) return true;

  const slug = normalizeSlugCandidate(normalizedTopic);
  if (slug && index.values.has(slug)) return true;

  const keyPhrase = buildKeyPhrase(normalizedTopic);
  if (keyPhrase && index.values.has(keyPhrase)) return true;

  const words = significantWords(normalizedTopic);
  if (words.length === 0) return false;

  let matches = 0;
  for (const word of words) {
    for (const existing of index.searchables) {
      if (existing.includes(word)) {
        matches += 1;
        break;
      }
    }

    if (matches >= 4) {
      return true;
    }
  }

  return false;
}

export function getRecentPublishedTitles(index: PublishedContentDedupIndex, limit = 200) {
  return index.rows.slice(0, limit).map((row) => row.title);
}

async function loadPublishedContentIndex(): Promise<PublishedContentDedupIndex> {
  const existingTitles = await db
    .select({
      title: content.title,
      slug: content.slug,
    })
    .from(content)
    .where(eq(content.status, 'published'))
    .orderBy(desc(content.publishedAt));

  const index: PublishedContentDedupIndex = {
    rows: [...existingTitles],
    values: new Set<string>(),
    searchables: [],
  };

  for (const row of existingTitles) {
    addValue(index, normalizeValue(row.title));
    addValue(index, normalizeValue(row.slug));

    const keyPhrase = buildKeyPhrase(row.title);
    if (keyPhrase) {
      addValue(index, keyPhrase);
    }
  }

  return index;
}

export async function getPublishedContentIndex(options?: { refresh?: boolean }) {
  if (options?.refresh || !publishedContentIndexPromise) {
    publishedContentIndexPromise = loadPublishedContentIndex();
  }

  return publishedContentIndexPromise;
}
