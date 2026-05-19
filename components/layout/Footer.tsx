import Link from 'next/link';

export default function Footer() {
  const tiktokUrl = process.env.NEXT_PUBLIC_TIKTOK_URL ?? 'https://tiktok.com/@tuvirtualchef';

  return (
    <footer className="da-footer-full">
      <div className="da-footer-main">
        <div className="da-footer-col da-footer-brand">
          <div className="da-footer-logo">
            <span style={{ fontSize: '20px' }}>🌍</span>
            <span>WorldWideRecipes</span>
          </div>
          <p>La cocina del mundo en un solo lugar.</p>
          <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="da-footer-tt">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.55a8.16 8.16 0 0 0 4.77 1.52V6.69h-1.84z"/>
            </svg>
            @tuvirtualchef
          </a>
        </div>

        <nav className="da-footer-col" aria-label="Navegar">
          <span className="da-footer-col-title">Navegar</span>
          <Link href="/">Inicio</Link>
          <Link href="/recipes">Explorar</Link>
          <Link href="/recipes/tipo/receta">Recetas</Link>
          <Link href="/recipes/tipo/tecnica">Técnicas</Link>
          <Link href="/recipes/tipo/ingrediente">Ingredientes</Link>
          <Link href="/recipes/tipo/guia">Guías</Link>
        </nav>

        <nav className="da-footer-col" aria-label="Legal">
          <span className="da-footer-col-title">Legal</span>
          <Link href="/privacy-policy">Privacidad</Link>
          <Link href="/terms">Términos</Link>
          <Link href="/about">Sobre nosotros</Link>
          <Link href="/contact">Contacto</Link>
        </nav>
      </div>

      <div className="da-footer-bottom">
        <p>© 2026 WorldWideRecipes · <a href="mailto:contact@worldwiderecipes.app">contact@worldwiderecipes.app</a></p>
        <p>worldwiderecipes.app participa en el Programa de Afiliados de Amazon Services LLC. Ganamos comisiones por compras realizadas a través de nuestros enlaces, sin coste adicional para ti.</p>
        <p>
          Redactado con OpenAI · Fotos de <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a>
        </p>
      </div>
    </footer>
  );
}
