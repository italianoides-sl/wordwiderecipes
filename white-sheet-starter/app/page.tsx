import { ContentGrid } from '@/components/content/ContentGrid';
import { HeroBanner } from '@/components/homepage/HeroBanner';
import { getPublishedContent } from '@/lib/db/queries';

export default async function HomePage() {
  const items = await getPublishedContent(6);

  return (
    <>
      <HeroBanner />
      <section className="container">
        <p className="eyebrow">Contenido reciente</p>
        <h2>Artículos publicados por la automatización</h2>
        <ContentGrid items={items} />
      </section>
    </>
  );
}
