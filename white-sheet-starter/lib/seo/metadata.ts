import type { Metadata } from 'next';
import { PRIMARY_CATEGORY, SITE_NAME, SITE_TAGLINE, SITE_URL, canonicalizeUrl } from '@/lib/config/site';

export function buildSeoTitle(title: string, type: string, cluster?: string) {
  const typeLabel =
    {
      article: 'Artículo',
      guide: 'Guía',
      comparison: 'Comparativa',
      review: 'Review',
      faq: 'FAQ',
      resource: 'Recurso',
    }[type] ?? 'Artículo';

  const clusterLabel = cluster ? ` ${cluster}` : '';
  let seoTitle = title;

  if (seoTitle.length < 40) {
    seoTitle = `${title} | ${typeLabel}${clusterLabel} - ${SITE_NAME}`;
  } else if (seoTitle.length < 55) {
    seoTitle = `${title} | ${SITE_NAME}`;
  } else if (seoTitle.length > 60) {
    seoTitle = `${title.slice(0, 57)}...`;
  }

  return seoTitle.slice(0, 60);
}

export function baseMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: SITE_TAGLINE,
    openGraph: {
      title: `${SITE_NAME} | ${PRIMARY_CATEGORY}`,
      description: SITE_TAGLINE,
      url: SITE_URL,
      siteName: SITE_NAME,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: SITE_NAME,
      description: SITE_TAGLINE,
    },
  };
}

export function contentMetadata(params: {
  title: string;
  description: string;
  type: string;
  slug: string;
  cluster?: string;
}): Metadata {
  const canonical = canonicalizeUrl(undefined, `${SITE_URL}/article/${params.slug}`);
  const title = buildSeoTitle(params.title, params.type, params.cluster);

  return {
    title,
    description: params.description,
    alternates: { canonical },
    openGraph: {
      title,
      description: params.description,
      url: canonical,
      siteName: SITE_NAME,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: params.description,
    },
  };
}
