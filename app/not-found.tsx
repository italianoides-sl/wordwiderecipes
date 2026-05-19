import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="da-notfound">
      <div className="da-notfound-inner">
        <span className="da-notfound-num">404</span>
        <h1>Página no encontrada</h1>
        <p>Esta página no existe o fue movida. Pero hay mucho más donde explorar.</p>
        <div className="da-notfound-actions">
          <Link href="/" className="da-btn da-btn--primary">
            Ir al inicio
            <svg className="da-btn-arrow" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 10h12M11 5l5 5-5 5"/>
            </svg>
          </Link>
          <Link href="/es/recipes" className="da-btn da-btn--ghost">
            Explorar recetas
          </Link>
        </div>
      </div>
    </main>
  );
}
