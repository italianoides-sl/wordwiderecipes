import type { Metadata } from 'next';
import type { Content } from '@/lib/db/schema';
import { AUTHOR_NAME, AUTHOR_URL, SITE_NAME, SITE_URL } from '@/lib/seo/site';
import { safeDate } from '@/lib/utils/date';

const DEFAULT_IMAGE = '/logo.png';

export function buildMetadata(content: Content): Metadata {
  const title = content.metaTitle ?? content.title;
  const description = content.metaDescription ?? content.quickAnswer ?? 'WorldWideRecipes culinary article.';
  const url = content.canonicalUrl ?? `${SITE_URL}/${content.type}/${content.slug}`;
  const image = content.ogImageUrl ?? content.imageUrl ?? DEFAULT_IMAGE;

  const bodyData = (content.body ?? {}) as Record<string, unknown>;
  const bodyKeywords = Array.isArray(bodyData.keywords)
    ? (bodyData.keywords as unknown[]).map(String).filter(Boolean)
    : [];
  const keywords = bodyKeywords.length
    ? bodyKeywords.join(', ')
    : [...(content.dietTags ?? []), content.category, content.cuisine].filter(Boolean).join(', ') || content.title;

  return {
    title,
    description,
    keywords,
    authors: [{ name: AUTHOR_NAME, url: AUTHOR_URL }],
    creator: AUTHOR_NAME,
    publisher: SITE_NAME,
    robots: {
      index: content.status === 'published',
      follow: true,
      googleBot: {
        index: content.status === 'published',
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      siteName: SITE_NAME,
      publishedTime: safeDate(content.publishedAt),
      modifiedTime: safeDate(content.updatedAt ?? content.publishedAt),
      authors: [AUTHOR_NAME],
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export function buildPageMetadata(input: {
  title: string;
  description: string;
  path: string;
  image?: string;
}): Metadata {
  const url = `${SITE_URL}${input.path}`;
  return {
    title: input.title,
    description: input.description,
    authors: [{ name: AUTHOR_NAME, url: AUTHOR_URL }],
    creator: AUTHOR_NAME,
    publisher: SITE_NAME,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    alternates: { canonical: url },
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      type: 'website',
      siteName: SITE_NAME,
      images: [input.image ?? DEFAULT_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
      images: [input.image ?? DEFAULT_IMAGE],
    },
  };
}
