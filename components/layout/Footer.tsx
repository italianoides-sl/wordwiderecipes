import Link from 'next/link';

export default function Footer() {
  const tiktokUrl = process.env.NEXT_PUBLIC_TIKTOK_URL ?? 'https://tiktok.com/@tuvirtualchef';

  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="footer-brand footer-col">
          <div className="footer-logo">
            <span>🌍</span> WorldWideRecipes
          </div>
          <p>La cocina del mundo en un solo lugar. Recetas, técnicas y guías escritas por un chef profesional.</p>
          <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="footer-tiktok">
            ↗ @tuvirtualchef en TikTok
          </a>
        </div>

        <div className="footer-col">
          <div className="footer-col-title">Explorar</div>
          <nav aria-label="Explorar">
            <Link href="/recipes">Recetas</Link>
            <Link href="/recipes/tipo/tecnica">Técnicas de cocina</Link>
            <Link href="/recipes/tipo/guia">Guías profesionales</Link>
            <Link href="/recipes">Por país</Link>
            <Link href="/recipes">Por dificultad</Link>
          </nav>
        </div>

        <div className="footer-col">
          <div className="footer-col-title">Legal</div>
          <nav aria-label="Legal">
            <Link href="/about">Sobre el autor</Link>
            <Link href="/privacy-policy">Privacidad</Link>
            <Link href="/terms">Términos</Link>
            <Link href="/contact">Contacto</Link>
            <Link href="/privacy-policy">Cookies</Link>
          </nav>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 WorldWideRecipes · Aleksandro Keci, Chef Profesional</p>
      </div>
    </footer>
  );
}
