import Link from 'next/link';

export default function ExploreCta({ locale }: { locale: string }) {
  return (
    <section className="da-explore-cta">
      <div className="da-cta-glow da-cta-glow-1" aria-hidden="true" />
      <div className="da-cta-glow da-cta-glow-2" aria-hidden="true" />
      <div className="da-cta-inner">
        <div className="da-overline">
          <span className="da-overline-dot" aria-hidden="true"></span>
          Explorar
        </div>
        <h2 className="da-cta-h2">
          La cocina del mundo,<br />
          <em>en un solo lugar.</em>
        </h2>
        <p className="da-cta-sub">
          Recetas, técnicas, ingredientes y guías de cocinas que cruzan océanos. Filtra por país, tipo o dieta.
        </p>
        <Link href={`/${locale}/recipes`} className="da-btn da-btn--primary">
          Explorar recetas
          <svg className="da-btn-arrow" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 10h12M11 5l5 5-5 5"/>
          </svg>
        </Link>
      </div>
    </section>
  );
}
