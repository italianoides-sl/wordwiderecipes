export default function TikTokBand() {
  const tiktokUrl = process.env.NEXT_PUBLIC_TIKTOK_URL ?? 'https://tiktok.com/@tuvirtualchef';

  return (
    <section className="content-section" style={{ paddingTop: 0 }}>
      <div className="sidebar-tiktok" style={{ maxWidth: '720px' }}>
        <div className="sidebar-tt-eyebrow">
          <span className="sidebar-tt-dot" />
          TikTok · @tuvirtualchef
        </div>
        <h3 className="sidebar-tt-title">Aprende a cocinar en menos de un minuto.</h3>
        <p className="sidebar-tt-sub">
          Foto-recetas paso a paso. Desliza, lee, cocina. Una nueva técnica cada semana en @tuvirtualchef.
        </p>
        <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="sidebar-tt-btn">
          ↗ Seguir en TikTok
        </a>
      </div>
    </section>
  );
}
