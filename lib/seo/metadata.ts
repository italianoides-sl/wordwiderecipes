import type { Metadata } from 'next';
import type { Content } from '@/lib/db/schema';

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.worldwiderecipes.app').replace(
  'https://worldwiderecipes.app',
  'https://www.worldwiderecipes.app',
);
const DEFAULT_IMAGE = '/logo.png';

export function buildMetadata(content: Content): Metadata {
  const title = content.metaTitle ?? content.title;
  const description = content.metaDescription ?? content.quickAnswer ?? 'WorldWideRecipes culinary article.';
  const url = content.canonicalUrl ?? `${BASE_URL}/${content.type}/${content.slug}`;
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
  const url = `${BASE_URL}${input.path}`;
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      type: 'website',
      images: [input.image ?? DEFAULT_IMAGE],
    },
  };
}
