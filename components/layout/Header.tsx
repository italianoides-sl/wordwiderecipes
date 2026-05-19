'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

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

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <header className="da-nav">
      <div className="da-nav-inner">
        <Link href="/" className="da-logo" onClick={() => setMobileOpen(false)}>
          <span className="da-logo-globe">🌍</span>
          <span>WorldWideRecipes</span>
        </Link>

        <nav className={`da-nav-links${mobileOpen ? ' is-open' : ''}`} aria-label="Principal">
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
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>
      </div>
    </header>
  );
}
