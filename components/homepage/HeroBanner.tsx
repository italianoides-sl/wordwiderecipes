import { getHomepageFeaturedContent } from '@/lib/db/queries';
import { withDbFallback } from '@/lib/db/safe-query';
import { contentHref } from '@/lib/content/routes';
import type { Content, Locale } from '@/lib/db/schema';

function dayLabel() {
  return new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(new Date());
}

async function loadFeatured(locale: string) {
  return withDbFallback(getHomepageFeaturedContent(locale as Locale, 3), [] as Content[], 'Homepage featured content');
}

function CuisineBadge({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  return (
    <span className="wwr-cuisine-badge" style={{ padding: size === 'sm' ? '5px 9px' : '6px 11px', fontSize: size === 'sm' ? '10px' : '11px' }}>
      <span className="wwr-cb-name">{name}</span>
    </span>
  );
}

export default async function HeroBanner({ locale = 'es' }: { locale?: string }) {
  const featured = await loadFeatured(locale);
  const [primary, ...secondary] = featured;
  const day = dayLabel();

  if (!primary) {
    return (
      <section className="wwr-hero">
        <div className="wwr-section-head">
          <div className="wwr-section-eyebrow">
            <span className="wwr-eyebrow-line" aria-hidden="true" />
            <span>Edicion diaria · {day}</span>
          </div>
          <div className="wwr-section-titles">
            <h1 className="wwr-section-title">
              Lo que se cocina <em>hoy.</em>
            </h1>
            <p className="wwr-section-sub">Los articulos destacados apareceran aqui cuando haya contenido publicado.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="wwr-hero">
      <div className="wwr-section-head">
        <div className="wwr-section-eyebrow">
          <span className="wwr-eyebrow-line" aria-hidden="true" />
          <span>Edicion diaria · {day}</span>
        </div>
        <div className="wwr-section-titles">
          <h1 className="wwr-section-title">
            Lo que se cocina <em>hoy.</em>
          </h1>
          <p className="wwr-section-sub">Articulos publicados en la web, rotados cada dia para mezclar temporada, tecnica y cocina del mundo.</p>
        </div>
      </div>

      <div className="wwr-hero-grid">
        <article className="wwr-card wwr-card--featured" data-cuisine={primary.cuisine ?? ''}>
          <a className="wwr-card-link" href={contentHref(primary)}>
            <div className="wwr-card-media">
              {primary.imageUrl ? <img className="wwr-card-img wwr-parallax-img" src={primary.imageUrl} alt={primary.imageAlt ?? primary.title} /> : <div className="image-skeleton" />}
              <div className="wwr-card-overlay" />
              <div className="wwr-card-top">
                {primary.cuisine ? <CuisineBadge name={primary.cuisine} /> : null}
                <span className="wwr-kicker">Destacado de hoy · {day}</span>
              </div>
              <div className="wwr-card-body wwr-card-body--featured">
                <div className="wwr-meta">
                  {primary.readingTimeMins ? <span>{primary.readingTimeMins} min lectura</span> : null}
                  <span>{primary.type}</span>
                </div>
                <h2 className="wwr-card-title wwr-card-title--featured">{primary.title}</h2>
                <p className="wwr-card-excerpt">{primary.metaDescription ?? primary.quickAnswer}</p>
                <div className="wwr-card-footer">
                  <span className="wwr-cta">Leer articulo <span className="wwr-cta-arrow">→</span></span>
                  <span className="wwr-author">por {primary.authorEntity ?? 'WorldWideRecipes'}</span>
                </div>
              </div>
            </div>
          </a>
        </article>

        <div className="wwr-hero-stack">
          {secondary.slice(0, 2).map((item) => (
            <article className="wwr-card wwr-card--secondary" data-cuisine={item.cuisine ?? ''} key={item.id}>
              <a className="wwr-card-link" href={contentHref(item)}>
                <div className="wwr-card-media">
                  {item.imageUrl ? <img className="wwr-card-img wwr-parallax-img" src={item.imageUrl} alt={item.imageAlt ?? item.title} /> : <div className="image-skeleton" />}
                  <div className="wwr-card-overlay" />
                  <div className="wwr-card-top">
                    {item.cuisine ? <CuisineBadge name={item.cuisine} size="sm" /> : null}
                  </div>
                  <div className="wwr-card-body wwr-card-body--secondary">
                    <div className="wwr-meta">
                      {item.readingTimeMins ? <span>{item.readingTimeMins} min lectura</span> : null}
                      <span>{item.type}</span>
                    </div>
                    <h3 className="wwr-card-title wwr-card-title--secondary">{item.title}</h3>
                    <span className="wwr-cta wwr-cta--sm">Leer <span className="wwr-cta-arrow">→</span></span>
                  </div>
                </div>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
