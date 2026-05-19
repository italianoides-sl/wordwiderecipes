import type { AffiliateLinkRecord, Content, ContentType, Locale } from '@/lib/db/schema';

export type { Content, ContentType, Locale };

export interface ContentDraft {
  slug: string;
  locale: Locale;
  type: ContentType;
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  quickAnswer?: string;
  definition?: string;
  keyFacts?: Array<{ label: string; value: string }>;
  stepsSummary?: Array<{ step: number; text: string }>;
  authorEntity?: string;
  expertReviewed?: boolean;
  primarySources?: Array<{ name: string; url?: string; type?: string }>;
  originalData?: Record<string, unknown>;
  entityMentions?: string[];
  citationSummary?: string;
  body: Record<string, unknown>;
  imageUrl?: string;
  imageAlt?: string;
  imageAttribution?: string;
  ogImageUrl?: string;
  cuisine?: string;
  category?: string;
  dietTags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  totalTimeMins?: number;
  season?: string[];
  relatedSlugs?: string[];
  parentSlug?: string;
  tiktokHashtags?: string[];
  affiliateLinks?: AffiliateLinkRecord[];
  schemaRecipe?: Record<string, unknown> | null;
  schemaHowto?: Record<string, unknown> | null;
  schemaArticle?: Record<string, unknown>;
  schemaFaq?: Record<string, unknown>;
  schemaBreadcrumb?: Record<string, unknown>;
  faq?: Array<{ question: string; answer: string }>;
  qualityScore?: number;
  qualityDetails?: Record<string, unknown>;
  aiModel?: string;
  generationPromptVersion?: string;
  wordCount?: number;
  readingTimeMins?: number;
  internalLinkCount?: number;
  outboundLinkCount?: number;
}

export interface QualityReport {
  scores: {
    cultural_depth: number;
    chef_authority: number;
    search_coverage: number;
    uniqueness: number;
    word_count: number;
    faq_quality: number;
    affiliate_natural: number;
    locale_accuracy: number;
    aeo_readiness: number;
    geo_readiness: number;
    personal_opinion: number;
  };
  average: number;
  publish: boolean;
  hard_fails: string[];
  improvements: string[];
}
