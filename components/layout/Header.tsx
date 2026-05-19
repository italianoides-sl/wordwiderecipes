'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import LocaleSwitcher from './LocaleSwitcher';

type HeaderProps = { locale?: string };

export default function Header({ locale = 'es' }: HeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const tiktokUrl = process.env.NEXT_PUBLIC_TIKTOK_URL ?? 'https://tiktok.com/@tuvirtualchef';

  const links = [
    { label: 'Inicio', href: `/${locale}` },
    { label: '🌐 Explorar', href: `/${locale}/recipes` },
    { label: 'Recetas', href: `/${locale}/recipes/tipo/receta` },
    { label: 'Técnicas', href: `/${locale}/recipes/tipo/tecnica` },
    { label: 'Ingredientes', href: `/${locale}/recipes/tipo/ingrediente` },
    { label: 'Guías', href: `/${locale}/recipes/tipo/guia` },
  ];

  function isActive(href: string) {
    if (href === `/${locale}`) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <header className="da-nav">
      <div className="da-nav-inner">
        <Link href={`/${locale}`} className="da-logo" onClick={() => setMobileOpen(false)}>
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
          <LocaleSwitcher locale={locale} />
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
