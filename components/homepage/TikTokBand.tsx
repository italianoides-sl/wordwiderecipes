export default function TikTokBand() {
  const tiktokUrl = process.env.NEXT_PUBLIC_TIKTOK_URL ?? 'https://tiktok.com/@tuvirtualchef';
  return (
    <section className="da-tt">
      <div className="da-tt-glow" aria-hidden="true" />
      <div className="da-tt-grid">
        <div>
          <div className="da-overline da-overline--tt">
            <span className="da-overline-dot" aria-hidden="true"></span>
            TikTok · @tuvirtualchef
          </div>
          <h2 className="da-tt-h2">
            Aprende a cocinar<br />
            <em>en menos de un minuto.</em>
          </h2>
          <p className="da-tt-sub">
            Foto-recetas paso a paso. Desliza, lee, cocina. Una nueva técnica cada semana en @tuvirtualchef.
          </p>
          <div className="da-tt-tags" style={{ marginTop: '16px' }}>
            {['#cocinaen60s', '#técnicasdecocina', '#recetasrápidas', '#tuvirtualchef'].map((tag) => (
              <span key={tag} className="da-tt-tag">{tag}</span>
            ))}
          </div>
        </div>

        <div>
          <p style={{ color: 'var(--da-ink-muted)', fontSize: '15px', fontStyle: 'italic', lineHeight: 1.5 }}>
            Chef profesional basado en Ibiza. Recetas de cocina mundial con técnica y criterio — sin complicaciones.
          </p>
        </div>

        <div className="da-tt-cta-wrap">
          <span className="da-tt-followers">+30K seguidores</span>
          <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="da-btn da-btn--tt">
            <span className="da-btn-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.55a8.16 8.16 0 0 0 4.77 1.52V6.69h-1.84z"/>
              </svg>
            </span>
            Seguir en TikTok
            <svg className="da-btn-arrow" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 10h12M11 5l5 5-5 5"/>
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
