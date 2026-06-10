import type { Content } from '@/lib/db/schema';
import { safeDate } from '@/lib/utils/date';
import {
  AUTHOR_LOCATION,
  AUTHOR_NAME,
  AUTHOR_ROLE,
  AUTHOR_URL,
  LOGO_URL,
  SITE_NAME,
  SITE_URL,
  TIKTOK_URL,
  canonicalizeUrl,
} from '@/lib/seo/site';

export type RecipeSchema = Record<string, unknown>;
export type ArticleSchema = Record<string, unknown>;
export type BreadcrumbSchema = Record<string, unknown>;
export type OrganizationSchema = Record<string, unknown>;

function safeUrl(url: string): string {
  return url.replace(/([^:])\/\/+/g, '$1/');
}

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(stripUndefined).filter((item) => item !== undefined && item !== null) as T;
  }
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
    const record = value as Record<string, unknown>;
    return String(record.text ?? record.name ?? record.label ?? record.item ?? record.ingredient ?? '');
  }
  return String(value);
}

function contentUrl(content: Content): string {
  return safeUrl(canonicalizeUrl(content.canonicalUrl, `${SITE_URL}/${content.type}/${content.slug}`));
}

function buildAuthor(): Record<string, unknown> {
  return {
    '@type': 'Person',
    '@id': `${AUTHOR_URL}#person`,
    name: AUTHOR_NAME,
    url: AUTHOR_URL,
    jobTitle: AUTHOR_ROLE,
    homeLocation: {
      '@type': 'Place',
      name: AUTHOR_LOCATION,
    },
    worksFor: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    sameAs: [TIKTOK_URL],
  };
}

function buildPublisher(): Record<string, unknown> {
  return {
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: LOGO_URL,
    },
  };
}

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
  add(content.ogImageUrl);
  for (const image of arrayField<Record<string, unknown>>(body(content).images)) {
    add(image.url);
  }

  if (!images.length) return undefined;
  return images.length === 1 ? images[0] : images;
}

function buildKeywordsField(content: Content): string | undefined {
  const bodyKeywords = arrayField<unknown>(body(content).keywords)
    .map(textFromObject)
    .filter(Boolean);

  if (bodyKeywords.length) return bodyKeywords.join(', ');

  const parts = [...(content.dietTags ?? []), content.category, content.cuisine].filter(Boolean);
  if (parts.length) return [...new Set(parts)].join(', ');

  return content.title
    .split(/[\s,\-–]+/)
    .filter((word) => word.length > 3)
    .join(', ') || undefined;
}

function baseFields(content: Content): Record<string, unknown> {
  return {
    name: content.title,
    description: content.metaDescription ?? content.quickAnswer,
    image: buildImageField(content),
    author: buildAuthor(),
    publisher: buildPublisher(),
    datePublished: safeDate(content.publishedAt),
    dateModified: safeDate(content.updatedAt ?? content.publishedAt),
    inLanguage: content.locale ?? 'es',
    url: contentUrl(content),
  };
}

export function buildRecipeSchema(content: Content): RecipeSchema {
  const data = body(content);
  const images = arrayField<Record<string, unknown>>(data.images);
  const steps = arrayField<Record<string, unknown>>(data.steps);
  const ingredients = arrayField<Record<string, unknown>>(data.ingredients);
  const primaryImage = content.imageUrl ?? textFromObject(images[0]?.url) ?? LOGO_URL;

  return stripUndefined({
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    ...baseFields(content),
    headline: content.metaTitle ?? content.title,
    keywords: buildKeywordsField(content),
    recipeIngredient: ingredients
      .map((ingredient) =>
        [textFromObject(ingredient.amount), textFromObject(ingredient.unit), textFromObject(ingredient.name)]
          .map((part) => part.trim())
          .filter(Boolean)
          .join(' '),
      )
      .filter(Boolean),
    recipeInstructions: steps
      .map((step, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        name: textFromObject(step.title) || `Paso ${index + 1}`,
        text: textFromObject(step.content ?? step.text),
      }))
      .filter((step) => step.text),
    image: [primaryImage, ...images.map((image) => textFromObject(image.url)).filter(Boolean)],
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': contentUrl(content),
    },
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
    about: [content.cuisine, content.category, ...(content.dietTags ?? [])].filter(Boolean),
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': contentUrl(content),
    },
  });
}

export function buildBreadcrumbSchema(content: Content): BreadcrumbSchema {
  const typeLabel = `${content.type.charAt(0).toUpperCase()}${content.type.slice(1)}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_NAME, item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: typeLabel, item: safeUrl(`${SITE_URL}/recipes`) },
      { '@type': 'ListItem', position: 3, name: content.title, item: contentUrl(content) },
    ],
  };
}

export function buildOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
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
    recipe: content.type === 'recipe' ? buildRecipeSchema(content) : null,
    article: buildArticleSchema(content),
    breadcrumb: buildBreadcrumbSchema(content),
    organization: buildOrganizationSchema(),
  };
}
