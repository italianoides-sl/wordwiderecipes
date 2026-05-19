import { and, desc, eq, type SQL } from 'drizzle-orm';
import { content, db, type ContentType, type Locale } from '@/lib/db/schema';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://worldwiderecipes.app';

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
  return row.canonicalUrl ?? `${BASE_URL}/${row.locale}/${row.type}/${row.slug}`;
}

function priorityFor(type: string) {
  if (type === 'cuisine') return '0.9';
  if (type === 'recipe' || type === 'technique') return '0.8';
  if (type === 'ingredient' || type === 'spice') return '0.7';
  return '0.7';
}

function urlEntry(url: string, lastmod: Date | string | null | undefined, priority: string, changefreq: string) {
  const modified = lastmod ? new Date(lastmod).toISOString() : new Date().toISOString();
  return [
    '  <url>',
    `    <loc>${escapeXml(url)}</loc>`,
    `    <lastmod>${modified}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
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

export async function buildSitemapIndex(): Promise<string> {
  const now = new Date().toISOString();
  const entries = SITEMAP_FILES.map((file) => [
    '  <sitemap>',
    `    <loc>${escapeXml(`${BASE_URL}/${file}`)}</loc>`,
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
  const rows = await db
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

  if (!rows.length) {
    return sitemapXml([
      urlEntry(`${BASE_URL}/es`, new Date(), '1.0', 'daily'),
    ]);
  }

  const staticUrls = ['es', 'es-mx', 'en'].flatMap((locale) => [
    `${BASE_URL}/${locale}`,
    `${BASE_URL}/${locale}/recipes`,
    `${BASE_URL}/${locale}/about`,
    `${BASE_URL}/${locale}/contact`,
    `${BASE_URL}/${locale}/privacy-policy`,
    `${BASE_URL}/${locale}/terms`,
  ]);

  const entries = [
    ...staticUrls.map((url) => urlEntry(url, new Date(), url.endsWith('/recipes') ? '0.8' : '0.6', 'weekly')),
    ...rows.map((row) => urlEntry(contentUrl(row), row.updatedAt, priorityFor(row.type), 'weekly')),
  ];

  return sitemapXml(entries);
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
  const whereParts: SQL[] = [eq(content.status, 'published')];
  if (type) whereParts.push(eq(content.type, type));
  if (locale) whereParts.push(eq(content.locale, locale));

  const rows = await db
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

  const entries = rows.map((row) => urlEntry(contentUrl(row), row.updatedAt, priorityFor(row.type), 'weekly'));
  return sitemapXml(entries);
}

async function buildFilterPagesSitemap() {
  const rows = await db
    .selectDistinct({
      locale: content.locale,
      type: content.type,
      cuisine: content.cuisine,
      difficulty: content.difficulty,
    })
    .from(content)
    .where(eq(content.status, 'published'));

  const urls = new Set<string>([`${BASE_URL}/`]);
  for (const row of rows) {
    urls.add(`${BASE_URL}/${row.locale}/recipes/tipo/${row.type}`);
    if (row.cuisine) urls.add(`${BASE_URL}/${row.locale}/recipes/pais/${encodeURIComponent(row.cuisine)}`);
    if (row.difficulty) urls.add(`${BASE_URL}/${row.locale}/recipes/dificultad/${row.difficulty}`);
  }

  return sitemapXml([...urls].map((url) => urlEntry(url, new Date(), url === `${BASE_URL}/` ? '1.0' : '0.6', url === `${BASE_URL}/` ? 'daily' : 'monthly')));
}
