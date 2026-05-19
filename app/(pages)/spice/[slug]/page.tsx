import { notFound } from 'next/navigation';
import ContentDetail from '@/components/content/ContentDetail';
import { getContentBySlugOnly, getRelatedContentForContent } from '@/lib/db/queries';
import { buildMetadata } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const content = await getContentBySlugOnly(params.slug).catch(() => null);
  if (!content) return {};
  return buildMetadata(content);
}

export default async function Page({ params }: { params: { slug: string } }) {
  const content = await getContentBySlugOnly(params.slug).catch(() => null);
  if (!content) notFound();
  const related = await getRelatedContentForContent(content).catch(() => []);
  return <ContentDetail content={content} related={related} />;
}
