import type { Metadata } from 'next';
import type { Content } from '@/lib/db/schema';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://worldwiderecipes.app';
const DEFAULT_IMAGE = '/logo.png';

export function buildMetadata(content: Content): Metadata {
  const title = content.metaTitle ?? content.title;
  const description = content.metaDescription ?? content.quickAnswer ?? 'WorldWideRecipes culinary article.';
  const url = content.canonicalUrl ?? `${BASE_URL}/${content.locale}/${content.type}/${content.slug}`;
  const image = content.ogImageUrl ?? content.imageUrl ?? DEFAULT_IMAGE;

  return {
    title,
    description,
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
