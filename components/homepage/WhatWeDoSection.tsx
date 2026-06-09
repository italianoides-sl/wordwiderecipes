import Link from 'next/link';

const TYPE_META: Record<string, { label: string; description: string; filterSeg: string }> = {
  recipe: { label: 'Recetas', description: 'Paso a paso, ingredientes y técnica con criterio de chef.', filterSeg: 'tipo/receta' },
  technique: { label: 'Técnicas', description: 'El porqué detrás de cada proceso. Aprende a cocinar mejor.', filterSeg: 'tipo/tecnica' },
  guide: { label: 'Guías', description: 'Contexto, historia y cultura detrás de cada gastronomía.', filterSeg: 'tipo/guia' },
};

const TYPE_ORDER = ['recipe', 'technique', 'guide'];

export default function WhatWeDoSection({ typeCounts }: { typeCounts: Array<{ type: string; count: number }> }) {
  const countMap = Object.fromEntries(typeCounts.map((row) => [row.type, row.count]));

  return (
    <section className="content-section">
      <div className="section-head">
        <h2 className="section-title">
          Tres formas de aprender <em>a cocinar el mundo.</em>
        </h2>
      </div>

      <div className="cards-grid">
        {TYPE_ORDER.map((type) => {
          const meta = TYPE_META[type];
          const count = countMap[type] ?? 0;
          if (!count) return null;
          return (
            <Link key={type} href={`/recipes/${meta.filterSeg}`} className="recipe-card">
              <div className="recipe-card-body">
                <div className="recipe-card-cuisine">{count.toLocaleString('es-ES')} artículos</div>
                <h3 className="recipe-card-title">{meta.label}</h3>
                <p className="recipe-card-excerpt">{meta.description}</p>
                <div className="recipe-card-meta">
                  <span>Explorar</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
