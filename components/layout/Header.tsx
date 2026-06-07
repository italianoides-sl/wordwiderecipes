'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const links = [
  { label: 'Inicio', href: '/' },
  { label: '🌐 Explorar', href: '/recipes' },
  { label: 'Recetas', href: '/recipes/tipo/receta' },
  { label: 'Técnicas', href: '/recipes/tipo/tecnica' },
  { label: 'Ingredientes', href: '/recipes/tipo/ingrediente' },
  { label: 'Guías', href: '/recipes/tipo/guia' },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const tiktokUrl = process.env.NEXT_PUBLIC_TIKTOK_URL ?? 'https://tiktok.com/@tuvirtualchef';

  useEffect(() => {
    document.body.classList.toggle('da-mobile-menu-open', mobileOpen);
    return () => document.body.classList.remove('da-mobile-menu-open');
  }, [mobileOpen]);

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <>
      <header className="da-nav">
        <div className="da-nav-inner">
          <Link href="/" className="da-logo" onClick={() => setMobileOpen(false)}>
            <span className="da-logo-globe">🌍</span>
            <span>WorldWideRecipes</span>
          </Link>

          <nav id="main-mobile-menu" className={`da-nav-links${mobileOpen ? ' is-open' : ''}`} aria-label="Principal">
            <button
              className="da-nav-close"
              aria-label="Cerrar menu"
              type="button"
              onClick={() => setMobileOpen(false)}
            >
              ×
            </button>
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`da-nav-link${isActive(l.href) ? ' is-active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/recipes#browse-search"
              className="da-nav-link da-nav-search"
              aria-label="Buscar"
              onClick={() => setMobileOpen(false)}
            >
              🔍
            </Link>
            <a
              href={tiktokUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="da-nav-link da-nav-link--tt"
            >
              @tuvirtualchef ↗
            </a>
          </nav>

          <button
            className={`da-burger${mobileOpen ? ' is-open' : ''}`}
            aria-label="Menú"
            aria-expanded={mobileOpen}
            aria-controls="main-mobile-menu"
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      <nav className="da-nav-bottom" aria-label="Navegación móvil">
        <Link href="/" className={`da-nav-bottom-item${pathname === '/' ? ' is-active' : ''}`}>
          <span className="da-nav-bottom-icon">🏠</span>
          <span>Inicio</span>
        </Link>
        <Link href="/recipes" className={`da-nav-bottom-item${pathname.startsWith('/recipes') && !pathname.startsWith('/recipes/tipo/receta') && !pathname.startsWith('/recipes/tipo/guia') ? ' is-active' : ''}`}>
          <span className="da-nav-bottom-icon">🌐</span>
          <span>Explorar</span>
        </Link>
        <Link href="/recipes/tipo/receta" className={`da-nav-bottom-item${isActive('/recipes/tipo/receta') ? ' is-active' : ''}`}>
          <span className="da-nav-bottom-icon">🍽️</span>
          <span>Recetas</span>
        </Link>
        <Link href="/recipes/tipo/guia" className={`da-nav-bottom-item${isActive('/recipes/tipo/guia') ? ' is-active' : ''}`}>
          <span className="da-nav-bottom-icon">📖</span>
          <span>Guías</span>
        </Link>
        <Link href="/recipes#browse-search" className="da-nav-bottom-item">
          <span className="da-nav-bottom-icon">🔍</span>
          <span>Buscar</span>
        </Link>
      </nav>
    </>
  );
}
