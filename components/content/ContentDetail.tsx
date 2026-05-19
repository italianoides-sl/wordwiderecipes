import Script from 'next/script';
import dynamic from 'next/dynamic';
import BodyRenderer from './BodyRenderer';
import ShareActions from './ShareActions';
import TikTokCTA from '@/components/recipe/TikTokCTA';
import { contentHref, countrySlugForCuisine, typeToFilterSegment } from '@/lib/content/routes';
import type { Content, ContentType } from '@/lib/db/schema';

const Sidebar = dynamic(() => import('@/components/recipe/Sidebar'), { ssr: false, loading: () => null });
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://worldwiderecipes.app';

function text(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join(' ');
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).map(text).filter(Boolean).join(' ');
  return '';
}

function array<T = Record<string, unknown>>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function imageAttribution(content: Content) {
  if (!content.imageAttribution) return null;
  const image = array<Record<string, unknown>>((content.body as Record<string, unknown> | undefined)?.images)[0];
  const photographerName = text(image?.photographerName);
  const photographerUrl = text(image?.photographerUrl);

  if (photographerName && photographerUrl) {
    return (
      <figcaption className="rp-hero-caption">
        Photo by <a href={photographerUrl} target="_blank" rel="noopener noreferrer">{photographerName}</a>{' '}
        on <a href="https://unsplash.com/?utm_source=worldwiderecipes&utm_medium=referral" target="_blank" rel="noopener noreferrer">Unsplash</a>
      </figcaption>
    );
  }

  return <figcaption className="rp-hero-caption">{content.imageAttribution}</figcaption>;
}

function JsonLd({ id, data }: { id: string; data?: Record<string, unknown> | null }) {
  if (!data) return null;
  return <Script id={id} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default function ContentDetail({ content, related }: { content: Content; related: Content[] }) {
  const typeFilter = typeToFilterSegment(content.type as ContentType);
  const countrySlug = countrySlugForCuisine(content.cuisine);
  const localeRoot = `/${content.locale}`;
  const typeHref = `${localeRoot}/recipes/tipo/${typeFilter}`;
  const cuisineHref = countrySlug ? `${localeRoot}/recipes/pais/${countrySlug}` : null;
  const breadcrumb = content.schemaBreadcrumb ?? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${BASE_URL}${localeRoot}` },
      { '@type': 'ListItem', position: 2, name: content.type, item: `${BASE_URL}${typeHref}` },
      { '@type': 'ListItem', position: 3, name: content.cuisine ?? content.title, item: `${BASE_URL}${contentHref(content)}` },
    ],
  };

  return (
    <main className="rp-shell">
      <JsonLd id={`schema-article-${content.id}`} data={content.schemaArticle} />
      <JsonLd id={`schema-recipe-${content.id}`} data={content.schemaRecipe} />
      <JsonLd id={`schema-howto-${content.id}`} data={content.schemaHowto} />
      <JsonLd id={`schema-faq-${content.id}`} data={content.schemaFaq} />
      <JsonLd id={`schema-breadcrumb-${content.id}`} data={breadcrumb} />

      <div className="rp-layout">
        <article className="rp-main content-detail">
          <nav className="rp-breadcrumb" aria-label="Migas de pan">
            <ol>
              <li><a href={localeRoot}>Inicio</a><span className="rp-bc-sep">›</span></li>
              <li><a href={typeHref}>{content.type}</a><span className="rp-bc-sep">›</span></li>
              {content.cuisine ? (
                <li>
                  {cuisineHref ? <a href={cuisineHref}>{content.cuisine}</a> : <span>{content.cuisine}</span>}
                  <span className="rp-bc-sep">›</span>
                </li>
              ) : null}
              <li><span aria-current="page">{content.title}</span></li>
            </ol>
          </nav>

          {content.imageUrl ? (
            <figure className="rp-hero">
              <div className="rp-hero-frame">
                <img src={content.imageUrl} alt={content.imageAlt ?? content.title} />
              </div>
              {imageAttribution(content)}
            </figure>
          ) : <div className="image-skeleton rp-hero-frame" />}

          <header className="rp-title-block">
            <div className="rp-badges">
              {content.cuisine ? <span className="rp-badge rp-badge-cuisine">{content.cuisine}</span> : null}
              {content.difficulty ? <span className="rp-badge rp-badge-diff">{content.difficulty}</span> : null}
              {content.dietTags?.map((tag) => <span className="rp-badge rp-badge-diet" key={tag}>{tag}</span>)}
            </div>
            <h1 className="rp-title">{content.title}</h1>
            <ul className="rp-meta-row" role="list">
              {content.readingTimeMins ? <li>{content.readingTimeMins} min de lectura</li> : null}
              {content.totalTimeMins ? <li>{content.totalTimeMins} min total</li> : null}
              {content.difficulty ? <li>{content.difficulty}</li> : null}
              <li><ShareActions title={content.title} /></li>
            </ul>
          </header>

          {content.quickAnswer ? (
            <section className="quick-answer-box" id="sec-ingredientes">
              <h2>Respuesta rápida</h2>
              <p>{content.quickAnswer}</p>
            </section>
          ) : null}

          <BodyRenderer content={content} />

          {content.affiliateLinks?.length ? (
            <p className="affiliate-notice">
              🛒 Algunos enlaces de esta página son de afiliado Amazon. Si compras a través de ellos, ganamos una pequeña comisión sin coste adicional para ti.
            </p>
          ) : null}

          {content.keyFacts?.length ? (
            <section className="body-section" id="sec-pasos">
              <h2>Datos clave</h2>
              <table className="content-table"><tbody>
                {content.keyFacts.map((fact) => <tr key={fact.label}><th>{fact.label}</th><td>{fact.value}</td></tr>)}
              </tbody></table>
            </section>
          ) : null}

          {content.faq?.length ? (
            <section className="body-section rp-faq" id="sec-faq">
              <h2>Preguntas frecuentes</h2>
              <div className="faq-accordion">
                {content.faq.map((item) => (
                  <details key={item.question}>
                    <summary>{item.question}</summary>
                    <p>{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          {content.affiliateLinks?.length ? (
            <section className="affiliate-tools" id="sec-herramientas">
              <h2>Herramientas y productos</h2>
              <p className="affiliate-notice" style={{ marginTop: 0 }}>
                🛒 Los siguientes enlaces son de afiliado Amazon. Ganamos una pequeña comisión sin coste adicional para ti.
              </p>
              <div className="body-card-grid">
                {content.affiliateLinks.map((link) => (
                  <a key={link.url} href={link.url} target="_blank" rel="nofollow sponsored" className="body-card affiliate-tool-card">
                    <strong>{link.label}</strong>
                    <span>Amazon</span>
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          {related.length ? (
            <section className="related-section">
              <h2>También te puede interesar</h2>
              <div className="directory-grid">
                {related.slice(0, 4).map((item) => (
                  <a className="directory-card" href={contentHref(item)} key={item.id}>
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.imageAlt ?? item.title} /> : <span className="directory-card-fallback" />}
                    <span className="directory-card-type">{item.type}</span>
                    <h3>{item.title}</h3>
                    <p>{item.metaDescription ?? item.quickAnswer}</p>
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          <div className="wwr-ai-disclosure">
            Artículo redactado con asistencia de OpenAI · Revisado editorialmente · Fotos: Unsplash
          </div>

          <TikTokCTA hashtags={content.tiktokHashtags ?? []} />
        </article>

        <Sidebar content={content} />
      </div>
    </main>
  );
}
