import Link from 'next/link';

export default function ExploreCta() {
  return (
    <section className="content-section">
      <div className="section-head" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '14px' }}>
        <h2 className="section-title">
          La cocina del mundo, <em>en un solo lugar.</em>
        </h2>
        <p className="related-title">
          Recetas, técnicas, ingredientes y guías de cocinas que cruzan océanos. Filtra por país, tipo o dieta.
        </p>
        <Link href="/recipes" className="about-tiktok-link">
          Explorar recetas →
        </Link>
      </div>
    </section>
  );
}
