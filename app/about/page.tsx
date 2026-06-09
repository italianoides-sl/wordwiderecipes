import { buildPageMetadata } from '@/lib/seo/metadata';

export function generateMetadata() {
  return buildPageMetadata({
    title: 'Aleksandro Keci | WorldWideRecipes',
    description: 'Chef profesional en Ibiza y fundador de WorldWideRecipes.',
    path: '/about',
  });
}

export default function AboutPage() {
  return (
    <main className="about-page">
      <div className="about-hero" style={{ gridTemplateColumns: '1fr', maxWidth: '640px', marginInline: 'auto' }}>
        <div>
          <div className="about-eyebrow">Chef · WorldWideRecipes</div>
          <h1 className="about-name">
            Aleksandro <em>Keci</em>
          </h1>
          <p className="about-role">Chef Profesional · Ibiza, España</p>
          <div className="about-bio">
            <p>
              Llevo más de 15 años cocinando en cocinas profesionales de Ibiza. He trabajado en restaurantes
              de temporada, catering de alto nivel y eventos privados en la isla.
            </p>
            <p>
              WorldWideRecipes nació de una convicción simple: <strong>cada cultura tiene algo único que enseñarnos a través de su cocina</strong>.
              No como curiosidad turística, sino como forma de entender el mundo.
            </p>
            <p>
              Aquí encontrarás recetas reales, técnicas profesionales y guías escritas desde la experiencia - no desde un algoritmo.
            </p>
          </div>
          <a href="https://tiktok.com/@tuvirtualchef" target="_blank" rel="noopener noreferrer" className="about-tiktok-link">
            ↗ Sígueme en @tuvirtualchef
          </a>
        </div>
      </div>
    </main>
  );
}
