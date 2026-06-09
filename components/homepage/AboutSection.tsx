export default function AboutSection() {
  return (
    <section style={{ background: 'var(--cream-dark)', padding: '2px 0' }}>
      <div className="about-page">
        <div className="about-hero" style={{ gridTemplateColumns: '1fr', maxWidth: '640px' }}>
          <div>
            <div className="about-eyebrow">Chef · WorldWideRecipes</div>
            <h2 className="about-name">
              Aleksandro <em>Keci</em>
            </h2>
            <p className="about-role">Chef Profesional · Ibiza, España</p>
            <div className="about-bio">
              <p>Llevo más de 15 años cocinando en cocinas profesionales de Ibiza, entre restaurantes de temporada, catering de alto nivel y eventos privados.</p>
              <p>WorldWideRecipes nació de una convicción simple: <strong>cada cultura tiene algo único que enseñarnos a través de su cocina</strong>.</p>
              <p>Aquí encontrarás recetas reales, técnicas profesionales y guías escritas desde la experiencia.</p>
            </div>
            <a href="https://tiktok.com/@tuvirtualchef" target="_blank" rel="noopener noreferrer" className="about-tiktok-link">
              ↗ Sígueme en @tuvirtualchef
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
