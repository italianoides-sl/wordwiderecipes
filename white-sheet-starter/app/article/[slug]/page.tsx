import { notFound } from 'next/navigation';
import { ContentDetail } from '@/components/content/ContentDetail';
import { getContentBySlug, getRelatedContent } from '@/lib/db/queries';
import { contentMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const item = await getContentBySlug(params.slug);
  if (!item) return {};

  return contentMetadata({
    title: item.title,
    description: item.metaDescription ?? item.excerpt ?? '',
    type: item.type,
    slug: item.slug,
    cluster: item.topicalCluster ?? undefined,
  });
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const item = await getContentBySlug(params.slug);
  if (!item) notFound();

  const related = await getRelatedContent(item, 3);
  return <ContentDetail item={item} related={related} />;
}
