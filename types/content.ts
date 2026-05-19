export type ContentType = 'recipe' | 'technique' | 'ingredient' | 'guide' | 'cuisine' | 'spice';

export type Locale = 'es' | 'es-mx' | 'es-ar' | 'en' | 'pt-br';

export type AffiliateMarket = 'es' | 'mx' | 'br' | 'global';

export interface Content {
  id: string;
  type: ContentType;
  locale: Locale;
  slug: string;
  title: string;
  description: string;
  body: string;
  excerpt?: string;
  imageUrl?: string;
  imageAlt?: string;
  country?: string;
  cuisine?: string;
  ingredients?: string[];
  steps?: string[];
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  totalTimeMinutes?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  dietTags?: string[];
  filterTags?: string[];
  affiliateMarket: AffiliateMarket;
  affiliateLinks?: AffiliateLink[];
  relatedSlugs?: string[];
  faqs?: FAQItem[];
  seoTitle: string;
  seoDescription: string;
  canonicalUrl?: string;
  published: boolean;
  generatedBy?: 'gpt-4o-mini' | 'manual';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface AffiliateLink {
  label: string;
  url: string;
  market: AffiliateMarket;
  productKey?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface HomepageConfig {
  id: string;
  locale: Locale;
  heroSlugs: string[];
  trendingSlugs: string[];
  featuredTechniqueSlug?: string;
  featuredIngredientSlug?: string;
  topAffiliateProductKeys: string[];
  updatedAt: string;
}

export interface Recipe extends Content {
  type: 'recipe';
  ingredients: string[];
  steps: string[];
}

export interface Technique extends Content {
  type: 'technique';
}

export interface Ingredient extends Content {
  type: 'ingredient';
}
