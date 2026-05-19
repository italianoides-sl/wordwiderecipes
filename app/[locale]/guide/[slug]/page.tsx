import { notFound } from 'next/navigation';
import ContentDetail from '@/components/content/ContentDetail';
import { getContentBySlugAndType, getPublishedSlugsByType, getRelatedContentForContent } from '@/lib/db/queries';
import { buildMetadata } from '@/lib/seo/metadata';
import type { Locale } from '@/lib/db/schema';

export const revalidate = 86_400;

export async function generateMetadata({ params }: { params: { locale: string; slug: string } }) {
  const content = await getContentBySlugAndType(params.slug, params.locale as Locale, 'guide').catch(() => null);
  if (!content) return {};
  return buildMetadata(content);
}

export async function generateStaticParams() {
  const rows = await getPublishedSlugsByType('guide').catch(() => []);
  return rows.map((row) => ({ locale: row.locale, slug: row.slug }));
}

export default async function GuidePage({ params }: { params: { locale: string; slug: string } }) {
  const content = await getContentBySlugAndType(params.slug, params.locale as Locale, 'guide').catch(() => null);
  if (!content) notFound();
  const related = await getRelatedContentForContent(content).catch(() => []);
  return <ContentDetail content={content} related={related} />;
}
