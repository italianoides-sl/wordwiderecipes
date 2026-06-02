import type { Content } from '@/lib/db/schema';
import { safeISOString } from '@/lib/utils/date';

export type RecipeSchema = Record<string, unknown>;
export type HowToSchema = Record<string, unknown>;
export type ArticleSchema = Record<string, unknown>;
export type FAQPageSchema = Record<string, unknown>;
export type BreadcrumbSchema = Record<string, unknown>;
export type OrganizationSchema = Record<string, unknown>;

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://worldwiderecipes.app').replace(/\/+$/, '');
const LOGO_URL = `${BASE_URL}/logo.png`;
const TIKTOK_URL = process.env.NEXT_PUBLIC_TIKTOK_URL ?? 'https://tiktok.com/@tuvirtualchef';

// ─── Utilities ───────────────────────────────────────────────────────────────

function safeUrl(url: string): string {
  return url.replace(/([^:])\/\/+/g, '$1/');
}

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) return value.map(stripUndefined).filter((item) => item !== undefined && item !== null) as T;
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => entry !== undefined && entry !== null)
      .map(([key, entry]) => [key, stripUndefined(entry)]),
  ) as T;
}

function body(content: Content): Record<string, unknown> {
  return (content.body ?? {}) as Record<string, unknown>;
}

function arrayField<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function textFromObject(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const r = value as Record<string, unknown>;
    return String(r.text ?? r.name ?? r.label ?? r.item ?? r.ingredient ?? '');
  }
  return String(value);
}

function textList(value: unknown): string[] {
  return arrayField(value)
    .map((item) => (typeof item === 'string' ? item : textFromObject(item)))
    .filter(Boolean);
}

function numberField(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function minutesToDuration(minutes?: number | null): string | undefined {
  if (!minutes || minutes <= 0) return undefined;
  return `PT${minutes}M`;
}

function stepName(step: unknown): string | undefined {
  if (!step || typeof step !== 'object') return undefined;
  return textFromObject((step as Record<string, unknown>).title ?? (step as Record<string, unknown>).name).trim() || undefined;
}

function recipeIngredient(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value !== 'object') return String(value);
  const ing = value as Record<string, unknown>;
  return [textFromObject(ing.amount), textFromObject(ing.unit), textFromObject(ing.name)]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' ') || textFromObject(value);
}

function aggregateRating(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const r = value as Record<string, unknown>;
  const ratingValue = numberField(r.ratingValue ?? r.rating_value ?? r.value);
  const ratingCount = numberField(r.ratingCount ?? r.rating_count ?? r.count);
  if (!ratingValue || !ratingCount) return undefined;
  return { '@type': 'AggregateRating', ratingValue, ratingCount };
}

// ─── URL helpers ─────────────────────────────────────────────────────────────

function contentUrl(content: Content): string {
  return safeUrl(content.canonicalUrl ?? `${BASE_URL}/${content.type}/${content.slug}`);
}

// ─── Shared field builders ────────────────────────────────────────────────────

function buildAuthor(): Record<string, unknown> {
  return {
    '@type': 'Organization',
    name: 'WorldWideRecipes',
    url: BASE_URL,
    logo: LOGO_URL,
    sameAs: [TIKTOK_URL],
  };
}

function buildPublisher(): Record<string, unknown> {
  return {
    '@type': 'Organization',
    name: 'WorldWideRecipes',
    url: BASE_URL,
    logo: { '@type': 'ImageObject', url: LOGO_URL },
  };
}

// Collects all available image URLs from the content record (deduped, absolute only).
function buildImageField(content: Content): string | string[] | undefined {
  const seen = new Set<string>();
  const images: string[] = [];
  const add = (url: unknown) => {
    if (typeof url === 'string' && url.startsWith('http') && !seen.has(url)) {
      seen.add(url);
      images.push(url);
    }
  };
  add(content.imageUrl);
  for (const img of arrayField<Record<string, unknown>>(body(content).images)) add(img.url);
  add(content.ogImageUrl);
  if (images.length === 0) return undefined;
  return images.length === 1 ? images[0] : images;
}

// Returns the images array (always an array, possibly empty) for step-level image rotation.
function imagesArray(content: Content): string[] {
  const field = buildImageField(content);
  if (!field) return [];
  return Array.isArray(field) ? field : [field];
}

// Keywords: body.tags → dietTags + category + cuisine → title words (never empty if title exists).
function buildKeywordsField(content: Content): string | undefined {
  const bodyTags = arrayField<unknown>(body(content).tags)
    .map(textFromObject)
    .filter(Boolean);
  if (bodyTags.length) return bodyTags.join(', ');

  const parts: string[] = [];
  if (content.dietTags?.length) parts.push(...content.dietTags);
  if (content.category) parts.push(content.category);
  if (content.cuisine) parts.push(content.cuisine);
  const unique = [...new Set(parts.filter(Boolean))];
  if (unique.length) return unique.join(', ');

  return (content.title ?? '').split(/[\s,\-–]+/).filter((w) => w.length > 3).join(', ') || undefined;
}

// Fields shared across ALL schema types.
function baseFields(content: Content): Record<string, unknown> {
  return {
    name: content.title,
    description: content.metaDescription ?? content.quickAnswer,
    image: buildImageField(content),
    author: buildAuthor(),
    publisher: buildPublisher(),
    datePublished: safeISOString(content.publishedAt),
    dateModified: safeISOString(content.updatedAt ?? content.publishedAt),
    inLanguage: content.locale ?? 'es',
    url: contentUrl(content),
  };
}

// ─── Schema builders ──────────────────────────────────────────────────────────

export function buildRecipeSchema(content: Content): RecipeSchema {
  const data = body(content);
  const images = Array.isArray(data.images) ? (data.images as any[]) : [];
  const steps = Array.isArray(data.steps) ? (data.steps as any[]) : [];
  const ingredients = Array.isArray(data.ingredients) ? (data.ingredients as any[]) : [];
  const keywords = Array.isArray(data.keywords)
    ? data.keywords.map(textFromObject).filter(Boolean).join(', ')
    : typeof data.keywords === 'string'
    ? data.keywords
    : content.title ?? 'receta';

  const primaryImage = content.imageUrl ?? images?.[0]?.url ?? LOGO_URL;

  const recipeSchema = stripUndefined({
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: content.title ?? '',
    description: content.metaDescription ?? content.quickAnswer ?? '',
    image: [primaryImage, ...images.map((i: any) => i?.url).filter(Boolean)] as string[],
    keywords,
    author: {
      '@type': 'Organization',
      name: 'WorldWideRecipes',
    },
    datePublished: safeISOString(content.publishedAt),
    dateModified: safeISOString(content.updatedAt ?? content.publishedAt),
    recipeIngredient: ingredients
      .map((ing: any) => `${ing?.amount ?? ''} ${ing?.unit ?? ''} ${ing?.name ?? ''}`.trim())
      .filter(Boolean),
    recipeInstructions: steps
      .map((step: any, i: number) => ({
        '@type': 'HowToStep',
        position: i + 1,
        name: step?.title ?? `Paso ${i + 1}`,
        text: step?.content ?? step?.text ?? '',
      }))
      .filter((s: any) => s.text),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: String(content.qualityScore ?? 4.5),
      ratingCount: '1',
      bestRating: '10',
      worstRating: '1',
    },
  });

  return recipeSchema;
}

export function buildHowToSchema(content: Content): HowToSchema {
  const data = body(content);
  const imgs = imagesArray(content);

  const steps = arrayField(data.steps ?? content.stepsSummary).map((step, i) => {
    const imgUrl = imgs.length ? imgs[i % imgs.length] : undefined;
    return {
      '@type': 'HowToStep',
      position: i + 1,
      name: stepName(step),
      text: textFromObject(step),
      ...(imgUrl ? { image: { '@type': 'ImageObject', url: imgUrl } } : {}),
    };
  });

  return stripUndefined({
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    ...baseFields(content),
    keywords: buildKeywordsField(content),
    totalTime: minutesToDuration(content.totalTimeMins) ?? 'PT30M',
    estimatedCost: { '@type': 'MonetaryAmount', currency: 'EUR', value: '0' },
    supply: textList(data.supply ?? data.ingredients).map((name) => ({ '@type': 'HowToSupply', name })),
    tool: textList(data.tool ?? data.tools ?? data.equipment).map((name) => ({ '@type': 'HowToTool', name })),
    step: steps,
    mainEntityOfPage: contentUrl(content),
  });
}

const ARTICLE_SECTION: Record<string, string> = {
  guide: 'Guías de cocina',
  ingredient: 'Ingredientes',
  spice: 'Especias',
  cuisine: 'Gastronomía',
  news: 'Noticias de cocina',
};

export function buildArticleSchema(content: Content): ArticleSchema {
  const data = body(content);
  const articleBody = typeof data.intro === 'string' ? data.intro : (content.quickAnswer ?? undefined);

  return stripUndefined({
    '@context': 'https://schema.org',
    '@type': content.type === 'news' ? 'NewsArticle' : 'Article',
    ...baseFields(content),
    headline: content.metaTitle ?? content.title,
    articleBody,
    articleSection: ARTICLE_SECTION[content.type] ?? 'Gastronomía',
    keywords: buildKeywordsField(content),
    wordCount: content.wordCount ?? undefined,
    mainEntityOfPage: { '@type': 'WebPage', '@id': contentUrl(content) },
  });
}

export function buildFAQSchema(content: Content): FAQPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: (content.faq ?? []).map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export function buildBreadcrumbSchema(content: Content): BreadcrumbSchema {
  const typeLabel = `${content.type.charAt(0).toUpperCase()}${content.type.slice(1)}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'WorldWideRecipes', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: typeLabel, item: safeUrl(`${BASE_URL}/recipes`) },
      { '@type': 'ListItem', position: 3, name: content.title, item: contentUrl(content) },
    ],
  };
}

export function buildOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'WorldWideRecipes',
    url: BASE_URL,
    logo: LOGO_URL,
    sameAs: [TIKTOK_URL],
    knowsAbout: [
      'Gastronomía internacional',
      'Recetas',
      'Técnicas de cocina',
      'Ingredientes regionales',
      'Cocina mexicana',
      'Cocina española',
      'Cultura alimentaria',
    ],
  };
}

export function buildSchemas(content: Content) {
  return {
    // Recipe → Schema.org/Recipe
    recipe: content.type === 'recipe' ? buildRecipeSchema(content) : null,
    // Technique → Schema.org/HowTo  |  guide now maps to Article (not HowTo)
    howto: content.type === 'technique' ? buildHowToSchema(content) : null,
    // All types get an Article/NewsArticle schema as fallback for Google Discover
    article: buildArticleSchema(content),
    faq: buildFAQSchema(content),
    breadcrumb: buildBreadcrumbSchema(content),
    organization: buildOrganizationSchema(),
  };
}
