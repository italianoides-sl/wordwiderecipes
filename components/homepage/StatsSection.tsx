export default function StatsSection({ totalCount }: { totalCount: number }) {
  return (
    <section className="content-section" style={{ paddingTop: 0 }}>
      <div className="hero-stats" style={{ borderTop: '1px solid var(--border-md)', paddingTop: '32px' }}>
        <div>
          <div className="hero-stat-num">{totalCount.toLocaleString('es-ES')}</div>
          <div className="hero-stat-label">Páginas publicadas</div>
        </div>
        <div>
          <div className="hero-stat-num">6</div>
          <div className="hero-stat-label">Tipos</div>
        </div>
        <div>
          <div className="hero-stat-num">1</div>
          <div className="hero-stat-label">Idioma raíz</div>
        </div>
        <div>
          <div className="hero-stat-num">24/7</div>
          <div className="hero-stat-label">Publicación</div>
        </div>
      </div>
    </section>
  );
}
