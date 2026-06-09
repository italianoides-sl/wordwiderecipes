import { Fragment } from 'react';
import { contentHref } from '@/lib/content/routes';
import type { Content } from '@/lib/db/schema';
import AdUnit from '@/components/ui/AdUnit';

function typeLabel(type: string) {
  if (type === 'recipe') return 'Receta';
  if (type === 'technique') return 'Técnica';
  if (type === 'ingredient') return 'Ingrediente';
  if (type === 'guide') return 'Guía';
  if (type === 'spice') return 'Especia';
  return 'Cocina';
}

function placeholder(type: string) {
  if (type === 'recipe') return '🥘';
  if (type === 'technique') return '🔪';
  if (type === 'ingredient') return '🌿';
  if (type === 'guide') return '📖';
  if (type === 'spice') return '🌶️';
  return '🌍';
}

export default function ContentGrid({ rows }: { rows: Content[] }) {
  if (!rows.length) {
    return (
      <section className="content-section">
        <div className="section-head">
          <h2 className="section-title">Estamos generando <em>contenido nuevo.</em></h2>
        </div>
        <p className="related-title">Vuelve pronto: nuevas recetas y técnicas se publican cada mañana.</p>
      </section>
    );
  }

  return (
    <section className="cards-grid" aria-label="Artículos publicados">
      {rows.map((item, index) => (
        <Fragment key={item.id}>
          <a className="recipe-card" href={contentHref(item)}>
            <div className="recipe-card-img-wrap">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.imageAlt ?? item.title} />
              ) : (
                <div className="ph ph-paella">{placeholder(item.type)}</div>
              )}
              <span className="recipe-card-type">{typeLabel(item.type)}</span>
            </div>
            <div className="recipe-card-body">
              {item.cuisine ? <div className="recipe-card-cuisine">{item.cuisine}</div> : null}
              <h2 className="recipe-card-title">{item.title}</h2>
              <p className="recipe-card-excerpt">{item.metaDescription ?? item.quickAnswer}</p>
              <div className="recipe-card-meta">
                <span>{[item.cuisine, item.difficulty].filter(Boolean).join(' · ') || item.type}</span>
                {item.totalTimeMins ? (
                  <>
                    <span className="recipe-card-meta-dot">·</span>
                    <span>{item.totalTimeMins} min</span>
                  </>
                ) : null}
              </div>
            </div>
          </a>
          {index === 5 ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <AdUnit slot="5544332211" format="horizontal" />
            </div>
          ) : null}
        </Fragment>
      ))}
    </section>
  );
}
