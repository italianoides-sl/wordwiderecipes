import { DEFAULT_AUTHOR, SITE_NAME, SITE_URL, canonicalizeUrl } from '@/lib/config/site';
import type { ContentRow } from '@/lib/db/schema';

export function buildArticleSchema(item: ContentRow) {
  const canonical = canonicalizeUrl(item.canonicalUrl, `${SITE_URL}/article/${item.slug}`);

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: item.title,
    description: item.metaDescription ?? item.excerpt ?? '',
    url: canonical,
    mainEntityOfPage: canonical,
    author: {
      '@type': 'Person',
      name: DEFAULT_AUTHOR,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    datePublished: item.publishedAt?.toISOString(),
    dateModified: item.updatedAt?.toISOString(),
    image: item.imageUrl ? [item.imageUrl] : undefined,
  };
}

export function buildFaqSchema(item: ContentRow) {
  if (!item.faq?.length) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: item.faq.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
