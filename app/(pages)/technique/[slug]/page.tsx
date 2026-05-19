import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import ContentDetail from '@/components/content/ContentDetail';
import { getContentBySlugFallback, getRelatedContentForContent } from '@/lib/db/queries';
import { buildMetadata } from '@/lib/seo/metadata';
import type { Locale } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const locale = (headers().get('x-locale') ?? 'es') as Locale;
  const content = await getContentBySlugFallback(params.slug, locale, 'technique').catch(() => null);
  if (!content) return {};
  return buildMetadata(content);
}

export default async function TechniquePage({ params }: { params: { slug: string } }) {
  const locale = (headers().get('x-locale') ?? 'es') as Locale;
  const content = await getContentBySlugFallback(params.slug, locale, 'technique').catch(() => null);
  if (!content) notFound();
  const related = await getRelatedContentForContent(content).catch(() => []);
  return <ContentDetail content={content} related={related} />;
}
