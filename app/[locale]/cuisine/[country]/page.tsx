import { redirect } from 'next/navigation';
import ContentDetail from '@/components/content/ContentDetail';
import { countryFromParam } from '@/lib/cuisine/atlas';
import { getContentByFilter, getContentBySlugAndType, getPublishedSlugsByType, getRelatedContentForContent } from '@/lib/db/queries';
import { withDbFallback } from '@/lib/db/safe-query';
import { buildMetadata, buildPageMetadata } from '@/lib/seo/metadata';
import type { Locale } from '@/lib/db/schema';

export const revalidate = 86_400;

export async function generateMetadata({ params }: { params: { locale: string; country: string } }) {
  const country = countryFromParam(params.country);

  if (!country) {
    const content = await getContentBySlugAndType(params.country, params.locale as Locale, 'cuisine').catch(() => null);
    if (content) return buildMetadata(content);
    return buildPageMetadata({
      title: 'Cocinas del mundo | WorldWideRecipes',
      description: 'Explora recetas, tecnicas, ingredientes y guias culinarias por pais.',
      path: `/${params.locale}/recipes`,
    });
  }

  return buildPageMetadata({
    title: `${country.name} | WorldWideRecipes`,
    description: `Recetas, tecnicas, ingredientes y guias de cocina ${country.cuisine} con contexto cultural.`,
    path: `/${params.locale}/cuisine/${country.slug}`,
  });
}

export async function generateStaticParams() {
  const rows = await getPublishedSlugsByType('cuisine').catch(() => []);
  return rows.map((row) => ({ locale: row.locale, country: row.slug }));
}

function articleHref(locale: string, item: { type: string; slug: string }) {
  return `/${locale}/${item.type}/${item.slug}`;
}

export default async function CuisinePage({ params }: { params: { locale: string; country: string } }) {
  const country = countryFromParam(params.country);
  if (!country) {
    const content = await getContentBySlugAndType(params.country, params.locale as Locale, 'cuisine').catch(() => null);
    if (!content) redirect(`/${params.locale}/recipes`);
    const related = await getRelatedContentForContent(content).catch(() => []);
    return <ContentDetail content={content} related={related} />;
  }
  if (country.slug !== params.country) redirect(`/${params.locale}/cuisine/${country.slug}`);

  let rows: Awaited<ReturnType<typeof getContentByFilter>> = [];
  rows = await withDbFallback(getContentByFilter(params.locale as Locale, undefined, country.cuisine), [], 'Cuisine page content');

  return (
    <main className="wwr-page directory-page">
      <section className="directory-hero">
        <span className="directory-flag" aria-hidden="true">{country.flag}</span>
        <div>
          <p className="directory-kicker">Atlas culinario</p>
          <h1>{country.name}</h1>
          <p>{rows.length ? `${rows.length} articulos de cocina ${country.cuisine}` : `Cocina ${country.cuisine}`}: recetas, tecnicas, ingredientes y guias para cocinar con contexto.</p>
        </div>
      </section>

      <section className="directory-grid" aria-label={`Articulos de ${country.name}`}>
        {rows.slice(0, 48).map((item) => (
          <a className="directory-card" href={articleHref(params.locale, item)} key={item.id}>
            {item.imageUrl ? <img src={item.imageUrl} alt={item.imageAlt ?? item.title} /> : <span className="directory-card-fallback" />}
            <span className="directory-card-type">{item.type}</span>
            <h2>{item.title}</h2>
            <p>{item.metaDescription ?? item.quickAnswer}</p>
          </a>
        ))}
      </section>
    </main>
  );
}
