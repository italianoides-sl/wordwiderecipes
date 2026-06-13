import { buildPageMetadata } from '@/lib/seo/metadata';

export function generateMetadata() {
  return buildPageMetadata({
    title: 'Aleksandro Keci — Chef Profesional | WorldWideRecipes',
    description: 'Chef profesional con más de 15 años en cocinas de Ibiza. De panadero y carnicero a los hoteles más exclusivos del mundo. Fundador de WorldWideRecipes.',
    path: '/about',
  });
}

export default function AboutPage() {
  return (
    <main className="about-page">

      {/* ── Hero: foto + bio principal ── */}
      <div className="about-hero">
        <div className="about-photo">
          <img
            src="/aleksandro-keci.jpg"
            alt="Aleksandro Keci, Chef Profesional en Ibiza"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', borderRadius: 'inherit' }}
          />
        </div>

        <div>
          <div className="about-eyebrow">Chef · WorldWideRecipes</div>
          <h1 className="about-name">
            Aleksandro <em>Keci</em>
          </h1>
          <p className="about-role">Chef Profesional · Ibiza, España</p>

          <div className="about-bio">
            <p>
              Mi pasión por la cocina empezó desde abajo: primero como panadero, después como carnicero,
              aprendiendo el origen real de los ingredientes antes de llegar a los fogones.
              Ese recorrido me dio una perspectiva que pocas escuelas de cocina pueden enseñar.
            </p>
            <p>
              Con los años fui escalando en entornos cada vez más exigentes, hasta llegar a cocinas
              de <strong>lujo internacional</strong> — incluyendo hoteles de la categoría de{' '}
              <strong>Six Senses</strong> — donde la precisión, la creatividad y la excelencia
              no son opcionales.
            </p>
            <p>
              Hoy dirijo <strong>WorldWideRecipes</strong>: una plataforma donde comparto todo lo
              aprendido en más de 15 años de cocina real. Recetas auténticas, técnicas profesionales
              y guías escritas desde la experiencia — no desde un algoritmo.
            </p>
          </div>

          <div className="about-cta-row">
            <a
              href="https://tiktok.com/@tuvirtualchef"
              target="_blank"
              rel="noopener noreferrer"
              className="about-tiktok-link"
            >
              ↗ @tuvirtualchef en TikTok
            </a>
            <a
              href="https://www.linkedin.com/in/aleksandro-keci-3b5424208"
              target="_blank"
              rel="noopener noreferrer"
              className="about-linkedin-link"
            >
              ↗ LinkedIn
            </a>
          </div>
        </div>
      </div>

      {/* ── Trayectoria ── */}
      <section className="about-section">
        <h2 className="about-section-title">Trayectoria profesional</h2>
        <div className="about-career">
          <div className="about-career-item">
            <span className="about-career-year">2023 — hoy</span>
            <div className="about-career-body">
              <strong>Fundador &amp; Chef Editor — WorldWideRecipes</strong>
              <p>Plataforma gastronómica con recetas, técnicas y guías de cocina de todo el mundo. Contenido escrito y revisado con criterio culinario profesional.</p>
            </div>
          </div>
          <div className="about-career-item">
            <span className="about-career-year">Cumbre</span>
            <div className="about-career-body">
              <strong>Chef en hoteles de lujo internacional — Six Senses &amp; otros</strong>
              <p>Trabajo en entornos de hospitalidad de ultra-lujo donde la excelencia culinaria es el estándar mínimo. Cocina de autor, menús de degustación y atención al detalle absoluta.</p>
            </div>
          </div>
          <div className="about-career-item">
            <span className="about-career-year">Ibiza</span>
            <div className="about-career-body">
              <strong>Chef Profesional — Restaurantes &amp; Catering de alto nivel</strong>
              <p>Más de 15 años en cocinas profesionales de la isla. Restaurantes de temporada, catering exclusivo y eventos privados para clientela internacional.</p>
            </div>
          </div>
          <div className="about-career-item">
            <span className="about-career-year">Inicio</span>
            <div className="about-career-body">
              <strong>Panadero &amp; Carnicero — Formación en origen</strong>
              <p>La trayectoria empezó aprendiendo el producto desde su raíz: la panadería artesanal y la carnicería. Una base que marca la diferencia en la cocina profesional.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Especialidades ── */}
      <section className="about-section">
        <h2 className="about-section-title">Especialidades</h2>
        <div className="about-tags">
          <span className="about-tag">Cocina mediterránea</span>
          <span className="about-tag">Alta cocina &amp; lujo</span>
          <span className="about-tag">Catering exclusivo</span>
          <span className="about-tag">Técnicas clásicas y modernas</span>
          <span className="about-tag">Gastronomía internacional</span>
          <span className="about-tag">Cocina de temporada</span>
          <span className="about-tag">Panadería artesanal</span>
          <span className="about-tag">Carnicería &amp; despiece</span>
          <span className="about-tag">Gestión de cocina</span>
          <span className="about-tag">Creación de contenido culinario</span>
        </div>
      </section>

      {/* ── Sobre WorldWideRecipes ── */}
      <section className="about-section about-section--highlight">
        <h2 className="about-section-title">Sobre WorldWideRecipes</h2>
        <div className="about-bio">
          <p>
            WorldWideRecipes nació de la convicción de que la cocina es el lenguaje universal
            más honesto que existe. Cada cultura tiene una forma única de entender el alimento,
            el tiempo y el cuidado hacia los demás — y eso merece ser documentado con rigor.
          </p>
          <p>
            Aquí encontrarás recetas auténticas de todo el mundo, técnicas profesionales explicadas
            sin condescendencia y guías escritas por alguien que lleva décadas viviendo de la cocina.
            Sin algoritmos. Sin atajos.
          </p>
        </div>
      </section>

    </main>
  );
}
