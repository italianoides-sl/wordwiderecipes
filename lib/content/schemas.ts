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
  if (Array.isArray(value)) return value.map(stripUndefined).filter((item) => item !== undefined) as T;
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .map(([key, entry]) => [key, stripUndefined(entry)]),
  ) as T;
}

function body(content: Content) {
  return (content.body ?? {}) as Record<string, unknown>;
}

function arrayField<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
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
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
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

export function buildRecipeSchema(content: Content): RecipeSchema {
  const data = body(content);
  const ingredients = textList(data.ingredients);
  const steps = arrayField(data.steps).map((step, index) => ({
    '@type': 'HowToStep',
    position: index + 1,
    text: textFromObject(step),
  }));

  return stripUndefined({
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: content.title,
    image: content.imageUrl ? [content.imageUrl] : undefined,
    author: author(content),
    datePublished: content.publishedAt?.toISOString(),
    dateModified: content.updatedAt?.toISOString(),
    description: content.metaDescription ?? content.quickAnswer,
    recipeCuisine: content.cuisine,
    recipeCategory: content.category,
    keywords: content.dietTags?.join(', '),
    recipeIngredient: ingredients,
    recipeInstructions: steps,
    totalTime: minutesToDuration(content.totalTimeMins),
    prepTime: minutesToDuration(numberField(data.prepTimeMins ?? data.prep_time_mins)),
    cookTime: minutesToDuration(numberField(data.cookTimeMins ?? data.cook_time_mins)),
    recipeYield: data.recipeYield ?? data.servings,
    nutrition: data.nutrition
      ? {
          '@type': 'NutritionInformation',
          ...(data.nutrition as Record<string, unknown>),
        }
      : undefined,
    aggregateRating: null,
    mainEntityOfPage: contentUrl(content),
  });
}

export function buildHowToSchema(content: Content): HowToSchema {
  const data = body(content);
  const steps = arrayField(data.steps ?? content.stepsSummary).map((step, index) => ({
    '@type': 'HowToStep',
    position: index + 1,
    name: typeof step === 'object' && step ? (step as Record<string, unknown>).name : undefined,
    text: textFromObject(step),
  }));

  return stripUndefined({
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: content.title,
    description: content.metaDescription ?? content.quickAnswer,
    image: content.imageUrl,
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
    image: content.ogImageUrl ?? content.imageUrl,
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
