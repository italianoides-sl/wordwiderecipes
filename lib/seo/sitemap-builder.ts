import { and, desc, eq, type SQL } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { content, db, type ContentType, type Locale } from '@/lib/db/schema';
import { SITE_URL, canonicalizeUrl } from '@/lib/seo/site';
import { safeDate } from '@/lib/utils/date';

const MAIN_SITEMAP_PAGE_SIZE = 200;

export const SITEMAP_FILES = [
  'sitemap-recipes-es.xml',
  'sitemap-recipes-es-mx.xml',
  'sitemap-techniques.xml',
  'sitemap-ingredients.xml',
  'sitemap-guides.xml',
  'sitemap-filter-pages.xml',
] as const;

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function contentUrl(row: { canonicalUrl: string | null; locale: string; type: string; slug: string }) {
  return canonicalizeUrl(row.canonicalUrl, `${SITE_URL}/${row.type}/${row.slug}`);
}

function urlEntry(url: string, lastmod: Date | string | null | undefined) {
  const modified = safeDate(lastmod);
  return [
    '  <url>',
    `    <loc>${escapeXml(url)}</loc>`,
    `    <lastmod>${modified}</lastmod>`,
    '  </url>',
  ].join('\n');
}

function sitemapXml(entries: string[]) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
  ].join('\n');
}

function inferOptionsForFile(file: string): { type?: ContentType; locale?: Locale; filterPages?: boolean } {
  if (file === 'sitemap-recipes-es.xml') return { type: 'recipe', locale: 'es' };
  if (file === 'sitemap-recipes-es-mx.xml') return { type: 'recipe', locale: 'es-mx' };
  if (file === 'sitemap-techniques.xml') return { type: 'technique' };
  if (file === 'sitemap-ingredients.xml') return { type: 'ingredient' };
  if (file === 'sitemap-guides.xml') return { type: 'guide' };
  return { filterPages: true };
}

const getMainSitemapRows = unstable_cache(
  async () => {
    return db
      .select({
        slug: content.slug,
        locale: content.locale,
        type: content.type,
        canonicalUrl: content.canonicalUrl,
        updatedAt: content.updatedAt,
      })
      .from(content)
      .where(eq(content.status, 'published'))
      .orderBy(desc(content.updatedAt));
  },
  ['db:sitemap-main-rows'],
  { revalidate: 3600 },
);

const getSitemapRows = unstable_cache(
  async (type?: ContentType, locale?: Locale) => {
    const whereParts: SQL[] = [eq(content.status, 'published')];
    if (type) whereParts.push(eq(content.type, type));
    if (locale) whereParts.push(eq(content.locale, locale));

    return db
      .select({
        slug: content.slug,
        locale: content.locale,
        type: content.type,
        canonicalUrl: content.canonicalUrl,
        updatedAt: content.updatedAt,
      })
      .from(content)
      .where(and(...whereParts))
      .orderBy(desc(content.updatedAt));
  },
  ['db:sitemap-filtered-rows'],
  { revalidate: 3600 },
);

const getFilterPagesRows = unstable_cache(
  async () => {
    return db
      .selectDistinct({
        locale: content.locale,
        type: content.type,
        cuisine: content.cuisine,
        difficulty: content.difficulty,
      })
      .from(content)
      .where(eq(content.status, 'published'));
  },
  ['db:sitemap-filter-pages-rows'],
  { revalidate: 3600 },
);

export async function buildSitemapIndex(): Promise<string> {
  const now = safeDate(new Date());
  const entries = SITEMAP_FILES.map((file) => [
    '  <sitemap>',
    `    <loc>${escapeXml(`${SITE_URL}/${file}`)}</loc>`,
    `    <lastmod>${now}</lastmod>`,
    '  </sitemap>',
  ].join('\n'));

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</sitemapindex>',
  ].join('\n');
}

export async function buildMainSitemap(): Promise<string> {
  const rows = await getMainSitemapRows();
  const entries = mainSitemapEntries(rows);
  const pageCount = Math.max(1, Math.ceil(entries.length / MAIN_SITEMAP_PAGE_SIZE));
  const now = safeDate(new Date());

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...Array.from({ length: pageCount }, (_, index) => [
      '  <sitemap>',
      `    <loc>${escapeXml(`${SITE_URL}/sitemap-${index}.xml`)}</loc>`,
      `    <lastmod>${now}</lastmod>`,
      '  </sitemap>',
    ].join('\n')),
    '</sitemapindex>',
  ].join('\n');
}

export async function buildMainSitemapPage(index: number): Promise<string> {
  const rows = await getMainSitemapRows();
  const entries = mainSitemapEntries(rows);
  const start = Math.max(index, 0) * MAIN_SITEMAP_PAGE_SIZE;
  const pageEntries = entries.slice(start, start + MAIN_SITEMAP_PAGE_SIZE);

  return sitemapXml(
    pageEntries.length
      ? pageEntries
      : [urlEntry(`${SITE_URL}/`, new Date())],
  );
}

function mainSitemapEntries(rows: Awaited<ReturnType<typeof getMainSitemapRows>>) {
  const staticUrls = [
    `${SITE_URL}/`,
    `${SITE_URL}/recipes`,
    `${SITE_URL}/about`,
    `${SITE_URL}/contact`,
    `${SITE_URL}/privacy-policy`,
    `${SITE_URL}/terms`,
  ];

  const entries = [
    ...staticUrls.map((url) => urlEntry(url, new Date())),
    ...rows.map((row) => urlEntry(contentUrl(row), row.updatedAt)),
  ];

  return entries;
}

export async function buildSitemap(options: {
  type?: ContentType;
  locale?: Locale;
  file?: string;
}): Promise<string> {
  const inferred = options.file ? inferOptionsForFile(options.file) : {};
  if (inferred.filterPages) return buildFilterPagesSitemap();

  const type = options.type ?? inferred.type;
  const locale = options.locale ?? inferred.locale;
  const rows = await getSitemapRows(type, locale);

  const entries = rows.map((row) => urlEntry(contentUrl(row), row.updatedAt));
  return sitemapXml(entries);
}

async function buildFilterPagesSitemap() {
  const rows = await getFilterPagesRows();

  const urls = new Set<string>([`${SITE_URL}/`]);
  for (const row of rows) {
    urls.add(`${SITE_URL}/recipes/tipo/${row.type}`);
    if (row.cuisine) urls.add(`${SITE_URL}/recipes/pais/${encodeURIComponent(row.cuisine)}`);
    if (row.difficulty) urls.add(`${SITE_URL}/recipes/dificultad/${row.difficulty}`);
  }

  return sitemapXml([...urls].map((url) => urlEntry(url, new Date())));
}
