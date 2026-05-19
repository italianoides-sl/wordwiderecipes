import Link from 'next/link';

const TYPE_META: Record<string, { label: string; icon: string; description: string; color: string; filterSeg: string }> = {
  recipe:     { label: 'Recetas',      icon: '🍳', description: 'Paso a paso, ingredientes y técnica con criterio de chef.',      color: 'var(--da-burg)',     filterSeg: 'tipo/receta' },
  technique:  { label: 'Técnicas',     icon: '🔪', description: 'El porqué detrás de cada proceso. Aprende a cocinar mejor.',     color: 'var(--da-turq)',     filterSeg: 'tipo/tecnica' },
  ingredient: { label: 'Ingredientes', icon: '🌿', description: 'Origen, sabor, variedades y cómo comprarlo y conservarlo.',      color: 'var(--da-gold)',     filterSeg: 'tipo/ingrediente' },
  guide:      { label: 'Guías',        icon: '📖', description: 'Contexto, historia y cultura detrás de cada gastronomía.',       color: 'var(--da-lavender)', filterSeg: 'tipo/guia' },
  spice:      { label: 'Especias',     icon: '🌶️', description: 'El alma aromática de la cocina mundial.',                        color: 'var(--da-sage)',     filterSeg: 'tipo/especia' },
  cuisine:    { label: 'Cocinas',      icon: '🌍', description: 'Atlas gastronómico de países y regiones culinarias.',            color: 'var(--da-amber)',    filterSeg: 'tipo/cocina' },
};
const TYPE_ORDER = ['recipe', 'technique', 'ingredient', 'guide', 'spice', 'cuisine'];

export default function WhatWeDoSection({
  locale,
  typeCounts,
}: {
  locale: string;
  typeCounts: Array<{ type: string; count: number }>;
}) {
  const countMap = Object.fromEntries(typeCounts.map((r) => [r.type, r.count]));

  return (
    <section className="da-what">
      <div className="da-section-head">
        <div className="da-overline">
          <span className="da-overline-dot" aria-hidden="true"></span>
          Qué hacemos
        </div>
        <h2 className="da-section-h2">
          Seis formas de aprender<br />
          <em>a cocinar el mundo.</em>
        </h2>
      </div>

      <div className="da-type-grid">
        {TYPE_ORDER.map((type) => {
          const meta = TYPE_META[type];
          const count = countMap[type] ?? 0;
          return (
            <Link key={type} href={`/${locale}/recipes/${meta.filterSeg}`} className="da-type-card" style={{ '--c': meta.color } as React.CSSProperties}>
              <div className="da-type-head">
                <span className="da-type-icon">{meta.icon}</span>
                <span className="da-type-count" style={{ color: meta.color }}>
                  {count > 0 ? count.toLocaleString('es-ES') : '—'}
                </span>
              </div>
              <h3 className="da-type-title">{meta.label}</h3>
              <p className="da-type-copy">{meta.description}</p>
              {count === 0 && (
                <span style={{ fontSize: '11px', color: 'var(--da-ink-subtle)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Próximamente
                </span>
              )}
              <div className="da-type-bar"><span /></div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
