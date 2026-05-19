export default function TikTokEmbed() {
  return (
    <section className="tcs-shell">
      <div className="ttc ttc-full is-visible">
        <div className="ttc-spine" aria-hidden="true" />
        <div className="ttc-inner">
          <div className="ttc-col-copy ttc-stagger">
            <div className="ttc-overline">
              <span className="ttc-overline-dot" />
              TuVirtualChef
            </div>
            <h2 className="ttc-headline">La receta escrita y el gesto en video.</h2>
            <p className="ttc-subline">
              En TikTok compartimos gestos de cocina, texturas y puntos de coccion que complementan las guias escritas.
            </p>
            <a className="ttc-cta" href={process.env.NEXT_PUBLIC_TIKTOK_URL ?? 'https://tiktok.com/@tuvirtualchef'} target="_blank" rel="noopener noreferrer">
              Ver en TikTok <span className="ttc-cta-arrow">→</span>
            </a>
          </div>
          <div className="ttc-col-stats ttc-stagger">
            <div className="ttc-handle-row">
              <span className="ttc-handle-tag">@tuvirtualchef</span>
            </div>
            <span className="ttc-cyan-tag">Video complementario</span>
          </div>
        </div>
      </div>
    </section>
  );
}
