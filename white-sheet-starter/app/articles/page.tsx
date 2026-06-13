import type { Metadata } from 'next';
import { ContentGrid } from '@/components/content/ContentGrid';
import { SITE_NAME } from '@/lib/config/site';
import { getPublishedContent } from '@/lib/db/queries';

export const metadata: Metadata = {
  title: `Artículos | ${SITE_NAME}`,
  description: 'Archivo editorial automatizado del proyecto.',
};

export default async function ArticlesPage() {
  const items = await getPublishedContent(24);

  return (
    <section className="container" style={{ paddingTop: 48 }}>
      <p className="eyebrow">Archivo</p>
      <h1>Artículos</h1>
      <ContentGrid items={items} />
    </section>
  );
}
