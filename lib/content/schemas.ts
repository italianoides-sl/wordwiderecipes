import type { Content } from '@/lib/db/schema';

export type RecipeSchema = Record<string, unknown>;
export type HowToSchema = Record<string, unknown>;
export type ArticleSchema = Record<string, unknown>;
export type FAQPageSchema = Record<string, unknown>;
export type BreadcrumbSchema = Record<string, unknown>;
export type OrganizationSchema = Record<string, unknown>;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://worldwiderecipes.app';
const LOGO_URL = `${BASE_URL}/logo.png`;

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) return value.map(stripUndefined).filter((item) => item !== undefined && item !== null) as T;
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => entry !== undefined && entry !== null)
      .map(([key, entry]) => [key, stripUndefined(entry)]),
  ) as T;
}

function body(content: Content) {
  return (content.body ?? {}) as Record<string, unknown>;
}

function arrayField<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

// Builds the image field for Recipe/HowTo/Article schemas.
// Returns an array of absolute URLs gathered from all available sources,
// or a single string if only one image exists, or undefined if none found.
function buildImageField(content: Content): string | string[] | undefined {
  const seen = new Set<string>();
  const images: string[] = [];

  const add = (url: unknown) => {
    if (typeof url === 'string' && url.startsWith('http') && !seen.has(url)) {
      seen.add(url);
      images.push(url);
    }
  };

  // Priority 1: dedicated imageUrl column
  add(content.imageUrl);

  // Priority 2: all images stored in body.images (Unsplash images fetched during pipeline)
  for (const img of arrayField<Record<string, unknown>>(body(content).images)) {
    add(img.url);
  }

  // Priority 3: OG image (may be same as imageUrl, deduped via Set)
  add(content.ogImageUrl);

  if (images.length === 0) return undefined;
  if (images.length === 1) return images[0];
  return images;
}

// Builds the keywords field for Recipe schema.
// Combines dietTags + category + cuisine; falls back to words from the title
// so the field is never missing or empty.
function buildKeywordsField(content: Content): string | undefined {
  const parts: string[] = [];

  if (content.dietTags?.length) parts.push(...content.dietTags);
  if (content.category) parts.push(content.category);
  if (content.cuisine) parts.push(content.cuisine);

  const unique = [...new Set(parts.filter(Boolean))];
  if (unique.length > 0) return unique.join(', ');

  // Fallback: meaningful words extracted from the title
  const titleWords = (content.title ?? '')
    .split(/[\s,\-–]+/)
    .filter((w) => w.length > 3);
  return titleWords.join(', ') || undefined;
}

function textList(value: unknown): string[] {
  return arrayField(value)
    .map((item) => (typeof item === 'string' ? item : textFromObject(item)))
    .filter(Boolean);
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

function numberField(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function minutesToDuration(minutes?: number | null) {
  if (!minutes || minutes <= 0) return undefined;
  return `PT${minutes}M`;
}

function contentUrl(content: Content) {
  if (content.canonicalUrl) return content.canonicalUrl;
  return `${BASE_URL}/${content.type}/${content.slug}`;
}

function publisher() {
  return {
    '@type': 'Organization',
    name: 'WorldWideRecipes',
    url: BASE_URL,
    logo: {
      '@type': 'ImageObject',
      url: LOGO_URL,
    },
  };
}

function author(content: Content) {
  return {
    '@type': content.authorEntity?.includes('Team') ? 'Organization' : 'Person',
    name: content.authorEntity ?? 'WorldWideRecipes Editorial Team',
  };
}

function recipeAuthor() {
  return {
    '@type': 'Organization',
    name: 'WorldWideRecipes',
    url: BASE_URL,
  };
}

function recipeIngredient(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value !== 'object') return String(value);

  const ingredient = value as Record<string, unknown>;
  const amount = textFromObject(ingredient.amount).trim();
  const unit = textFromObject(ingredient.unit).trim();
  const name = textFromObject(ingredient.name).trim();
  const text = [amount, unit, name].filter(Boolean).join(' ');

  return text || textFromObject(value);
}

function stepName(step: unknown): string | undefined {
  if (!step || typeof step !== 'object') return undefined;
  const record = step as Record<string, unknown>;
  return textFromObject(record.title ?? record.name).trim() || undefined;
}

function aggregateRating(value: unknown) {
  if (!value || typeof value !== 'object') return undefined;
  const rating = value as Record<string, unknown>;
  const ratingValue = numberField(rating.ratingValue ?? rating.rating_value ?? rating.value);
  const ratingCount = numberField(rating.ratingCount ?? rating.rating_count ?? rating.count);
  if (!ratingValue || !ratingCount) return undefined;

  return {
    '@type': 'AggregateRating',
    ratingValue,
    ratingCount,
  };
}

export function buildRecipeSchema(content: Content): RecipeSchema {
  const data = body(content);
  const ingredients = arrayField(data.ingredients).map(recipeIngredient).filter(Boolean);
  const steps = arrayField(data.steps).map((step, index) => ({
    '@type': 'HowToStep',
    position: index + 1,
    name: stepName(step),
    text: textFromObject(step),
  }));

  return stripUndefined({
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: content.title,
    description: content.metaDescription ?? content.quickAnswer,
    image: buildImageField(content),
    author: recipeAuthor(),
    datePublished: content.publishedAt?.toISOString(),
    dateModified: content.updatedAt?.toISOString(),
    prepTime: minutesToDuration(numberField(data.prepTimeMins ?? data.prep_time_mins)) ?? 'PT20M',
    cookTime: minutesToDuration(numberField(data.cookTimeMins ?? data.cook_time_mins)),
    totalTime: minutesToDuration(content.totalTimeMins),
    recipeYield: data.recipeYield ?? data.recipe_yield ?? data.servings ?? '4 porciones',
    recipeCategory: content.category,
    recipeCuisine: content.cuisine,
    recipeIngredient: ingredients,
    recipeInstructions: steps,
    keywords: buildKeywordsField(content),
    nutrition: data.nutrition
      ? {
          '@type': 'NutritionInformation',
          ...(data.nutrition as Record<string, unknown>),
        }
      : undefined,
    aggregateRating: aggregateRating(data.aggregateRating ?? data.aggregate_rating ?? data.rating),
    mainEntityOfPage: contentUrl(content),
  });
}

export function buildHowToSchema(content: Content): HowToSchema {
  const data = body(content);
  const steps = arrayField(data.steps ?? content.stepsSummary).map((step, index) => ({
    '@type': 'HowToStep',
    position: index + 1,
    name: stepName(step),
    text: textFromObject(step),
  }));

  return stripUndefined({
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: content.title,
    description: content.metaDescription ?? content.quickAnswer,
    image: buildImageField(content),
    totalTime: minutesToDuration(content.totalTimeMins),
    supply: textList(data.supply ?? data.ingredients).map((name) => ({ '@type': 'HowToSupply', name })),
    tool: textList(data.tool ?? data.tools ?? data.equipment).map((name) => ({ '@type': 'HowToTool', name })),
    step: steps,
    mainEntityOfPage: contentUrl(content),
  });
}

export function buildArticleSchema(content: Content): ArticleSchema {
  return stripUndefined({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: content.metaTitle ?? content.title,
    image: buildImageField(content),
    author: {
      '@type': 'Person',
      name: content.authorEntity ?? 'WorldWideRecipes Editorial Team',
    },
    publisher: publisher(),
    datePublished: content.publishedAt?.toISOString(),
    dateModified: content.updatedAt?.toISOString(),
    description: content.metaDescription ?? content.quickAnswer,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': contentUrl(content),
    },
  });
}

export function buildFAQSchema(content: Content): FAQPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: (content.faq ?? []).map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function buildBreadcrumbSchema(content: Content): BreadcrumbSchema {
  const localeUrl = `${BASE_URL}/${content.locale}`;
  const typeLabel = `${content.type.charAt(0).toUpperCase()}${content.type.slice(1)}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'WorldWideRecipes',
        item: BASE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: content.locale,
        item: localeUrl,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: typeLabel,
        item: `${localeUrl}/${content.type}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: content.title,
        item: contentUrl(content),
      },
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
    sameAs: [process.env.NEXT_PUBLIC_TIKTOK_URL ?? 'https://tiktok.com/@tuvirtualchef'],
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
    howto: content.type === 'technique' || content.type === 'guide' ? buildHowToSchema(content) : null,
    article: buildArticleSchema(content),
    faq: buildFAQSchema(content),
    breadcrumb: buildBreadcrumbSchema(content),
    organization: buildOrganizationSchema(),
  };
}
