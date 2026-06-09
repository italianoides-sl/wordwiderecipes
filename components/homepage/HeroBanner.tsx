import { getHomepageFeaturedContent } from '@/lib/db/queries';
import { withDbFallback } from '@/lib/db/safe-query';
import { contentHref } from '@/lib/content/routes';
import type { Content, Locale } from '@/lib/db/schema';

function dayLabel() {
  const day = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(new Date());
  return day.charAt(0).toUpperCase() + day.slice(1);
}

async function loadFeatured(locale: string) {
  return withDbFallback(getHomepageFeaturedContent(locale as Locale, 3), [] as Content[], 'Homepage featured content');
}

function placeholderClass(index: number) {
  return index === 0 ? 'ph-ramen' : index === 1 ? 'ph-paella' : 'ph-tacos';
}

function placeholderIcon(index: number) {
  return index === 0 ? '🍜' : index === 1 ? '🥘' : '🌮';
}

export default async function HeroBanner({ locale = 'es' }: { locale?: string }) {
  const featured = await loadFeatured(locale);
  const [primary, ...secondary] = featured;
  const day = dayLabel();

  if (!primary) {
    return (
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-left">
            <div className="hero-eyebrow">
              <span className="hero-eyebrow-dot" />
              Edición diaria · {day}
            </div>
            <h1 className="hero-headline">
              Lo que se cocina
              <em> hoy.</em>
            </h1>
            <p className="hero-sub">Los artículos destacados aparecerán aquí cuando haya contenido publicado.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="hero-left">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot" />
            Edición diaria · {day}
          </div>

          <h1 className="hero-headline">
            Lo que se cocina
            <em> hoy.</em>
          </h1>

          <p className="hero-sub">
            Artículos publicados cada día para mezclar temporada, técnica y cocina del mundo.
          </p>

          <div className="hero-stats">
            <div>
              <div className="hero-stat-num">{featured.length}</div>
              <div className="hero-stat-label">Destacados</div>
            </div>
            <div>
              <div className="hero-stat-num">3</div>
              <div className="hero-stat-label">Tipos</div>
            </div>
            <div>
              <div className="hero-stat-num">24/7</div>
              <div className="hero-stat-label">Publicación</div>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <a href={contentHref(primary)} className="hero-card hero-card--main">
            {primary.imageUrl ? (
              <img className="hero-card-img" src={primary.imageUrl} alt={primary.imageAlt ?? primary.title} />
            ) : (
              <div className={`ph ${placeholderClass(0)}`} style={{ minHeight: 460 }}>{placeholderIcon(0)}</div>
            )}
            <div className="hero-card-overlay" />
            <div className="hero-card-body">
              {primary.cuisine ? <div className="hero-card-badge">{primary.cuisine}</div> : null}
              <h2 className="hero-card-title">{primary.title}</h2>
              <div className="hero-card-meta">Destacado de hoy · {primary.readingTimeMins ?? 12} min lectura</div>
            </div>
          </a>

          {secondary.slice(0, 2).map((item, index) => (
            <a href={contentHref(item)} className="hero-card hero-card--sm" key={item.id}>
              {item.imageUrl ? (
                <img className="hero-card-img" src={item.imageUrl} alt={item.imageAlt ?? item.title} />
              ) : (
                <div className={`ph ${placeholderClass(index + 1)}`} style={{ minHeight: 210 }}>{placeholderIcon(index + 1)}</div>
              )}
              <div className="hero-card-overlay" />
              <div className="hero-card-body">
                {item.cuisine ? <div className="hero-card-badge">{item.cuisine}</div> : null}
                <h3 className="hero-card-title">{item.title}</h3>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
