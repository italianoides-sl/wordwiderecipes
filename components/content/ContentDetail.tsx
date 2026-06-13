import dynamic from 'next/dynamic';
import BodyRenderer from './BodyRenderer';
import ShareActions from './ShareActions';
import TikTokCTA from '@/components/recipe/TikTokCTA';
import { countrySlugForCuisine, typeToFilterSegment } from '@/lib/content/routes';
import { buildSchemas } from '@/lib/content/schemas';
import type { Content, ContentType } from '@/lib/db/schema';

const Sidebar = dynamic(() => import('@/components/recipe/Sidebar'), { ssr: false, loading: () => null });

function safeDate(val: unknown): string {
  if (!val) return '';
  const d = new Date(val as string);
  return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
}

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

function faqItems(content: Content) {
  const body = (content.body ?? {}) as Record<string, unknown>;
  const bodyFaq = array<Record<string, unknown>>(body.faq)
    .map((item) => ({
      question: text(item.question).trim(),
      answer: text(item.answer).trim(),
    }))
    .filter((item) => item.question && item.answer);

  if (bodyFaq.length) return bodyFaq;

  return (content.faq ?? [])
    .map((item) => ({
      question: text(item.question).trim(),
      answer: text(item.answer).trim(),
    }))
    .filter((item) => item.question && item.answer);
}

function JsonLd({ id, data }: { id: string; data?: Record<string, unknown> | null }) {
  if (!data) return null;
  return (
    <script
      id={id}
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function ContentDetail({ content, related }: { content: Content; related: Content[] }) {
  const typeFilter = typeToFilterSegment(content.type as ContentType);
  const countrySlug = countrySlugForCuisine(content.cuisine);
  const typeHref = `/recipes/tipo/${typeFilter}`;
  const cuisineHref = countrySlug ? `/recipes/pais/${countrySlug}` : null;
  const schemas = buildSchemas(content);
  const faq = faqItems(content);

  return (
    <main className="article-shell">
      <JsonLd id={`schema-article-${content.id}`} data={schemas.article} />
      <JsonLd id={`schema-recipe-${content.id}`} data={schemas.recipe} />
      <JsonLd id={`schema-breadcrumb-${content.id}`} data={schemas.breadcrumb} />

      <div className="article-layout">
        <article className="article-main">
          <nav className="article-breadcrumb" aria-label="Migas de pan">
            <a href="/">Inicio</a>
            <span className="article-breadcrumb-sep">›</span>
            <a href={typeHref}>{content.type}</a>
            {content.cuisine ? (
              <>
                <span className="article-breadcrumb-sep">›</span>
                {cuisineHref ? <a href={cuisineHref}>{content.cuisine}</a> : <span>{content.cuisine}</span>}
              </>
            ) : null}
            <span className="article-breadcrumb-sep">›</span>
            <span aria-current="page">{content.title}</span>
          </nav>

          {content.imageUrl ? (
            <figure>
              <div className="article-hero-img">
                <img src={content.imageUrl} alt={content.imageAlt ?? content.title} />
              </div>
            </figure>
          ) : <div className="article-hero-img"><div className="ph ph-paella">🍽️</div></div>}

          <header>
            <div className="article-badges">
              {content.cuisine ? <span className="badge badge-cuisine">{content.cuisine}</span> : null}
              {content.difficulty ? <span className="badge badge-diff">{content.difficulty}</span> : null}
              {content.dietTags?.map((tag) => <span className="badge badge-diet" key={tag}>{tag}</span>)}
            </div>
            <h1 className="article-title">{content.title}</h1>
            {(content.metaDescription ?? content.quickAnswer) ? (
              <p className="article-subtitle">{content.metaDescription ?? content.quickAnswer}</p>
            ) : null}
            <div className="author-block">
              <span style={{ width: '28px', height: '2px', background: 'var(--gold)', display: 'block', flexShrink: 0 }} aria-hidden="true" />
              <div className="author-info">
                <span className="author-name">Aleksandro Keci</span>
                <span className="author-title">Chef Profesional · Ibiza, España</span>
              </div>
            </div>
            <time className="article-published-date" dateTime={safeDate(content.publishedAt)}>
              Publicado el {new Date(content.publishedAt || Date.now()).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            <ul className="article-meta-row" role="list">
              {content.readingTimeMins ? <li className="article-meta-item">⏱ {content.readingTimeMins} min lectura</li> : null}
              {content.totalTimeMins ? <li className="article-meta-item">🔥 {content.totalTimeMins} min total</li> : null}
              {content.difficulty ? <li className="article-meta-item">📊 {content.difficulty}</li> : null}
              <li className="article-meta-item"><ShareActions title={content.title} /></li>
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

          {faq.length ? (
            <section className="body-section rp-faq" id="sec-faq">
              <h2>Preguntas frecuentes</h2>
              <div className="faq-accordion">
                {faq.map((item) => (
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

          <TikTokCTA hashtags={content.tiktokHashtags ?? []} />

          {related.length ? (
            <section className="related-section">
              <p className="related-title">Si esto te ha gustado, también podría interesarte</p>
              <div className="related-grid">
                {related.slice(0, 2).map((article) => (
                  <a href={`/${article.type}/${article.slug}`} className="related-card" key={article.id}>
                    <div className="related-card-img">
                      {article.imageUrl ? <img src={article.imageUrl} alt={article.imageAlt ?? article.title} /> : <div className="ph ph-tacos">🌮</div>}
                    </div>
                    <div className="related-card-body">
                      <span className="related-card-type">{article.type}</span>
                      <h4 className="related-card-title">{article.title}</h4>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          ) : null}
        </article>

        <Sidebar content={content} className="wwr-article-sidebar" />
      </div>
    </main>
  );
}
