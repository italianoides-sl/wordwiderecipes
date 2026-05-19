export default function StatsSection({ totalCount }: { totalCount: number }) {
  return (
    <section className="da-statbar">
      <div className="da-statbar-grid">
        <div className="da-stat">
          <span className="da-stat-num">
            {totalCount.toLocaleString('es-ES')}
          </span>
          <span className="da-stat-lbl">Páginas publicadas</span>
        </div>
        <div className="da-stat">
          <span className="da-stat-num">
            6
          </span>
          <span className="da-stat-lbl">Tipos de contenido</span>
        </div>
        <div className="da-stat">
          <span className="da-stat-num">
            3
          </span>
          <span className="da-stat-lbl">Idiomas</span>
        </div>
        <div className="da-stat">
          <span className="da-stat-num">
            24/7
          </span>
          <span className="da-stat-lbl">Publicaciones diarias</span>
        </div>
      </div>
    </section>
  );
}
