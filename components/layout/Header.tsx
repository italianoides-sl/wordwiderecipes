'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

type NavItem = {
  label: string;
  href: string;
  dropdown?: { label: string; href: string }[];
};

const navItems: NavItem[] = [
  { label: 'Inicio', href: '/' },
  { label: '🌐 Explorar', href: '/recipes' },
  {
    label: 'Recetas',
    href: '/recipes/tipo/receta',
    dropdown: [
      { label: 'Por país', href: '/recipes/pais' },
      { label: 'Por dieta', href: '/recipes/dieta' },
      { label: 'Por dificultad', href: '/recipes/dificultad' },
    ],
  },
  {
    label: 'Técnicas',
    href: '/recipes/tipo/tecnica',
    dropdown: [
      { label: 'Cocción', href: '/recipes/tipo/tecnica' },
      { label: 'Preparación', href: '/recipes/tipo/tecnica' },
      { label: 'Conservación', href: '/recipes/tipo/tecnica' },
    ],
  },
  {
    label: 'Guías',
    href: '/recipes/tipo/guia',
    dropdown: [
      { label: 'Cocina profesional', href: '/recipes/tipo/guia' },
      { label: 'Historia y cultura', href: '/recipes/tipo/guia' },
      { label: 'Ingredientes', href: '/recipes/tipo/guia' },
    ],
  },
];

export default function Header() {
  const pathname = usePathname();
  const tiktokUrl = process.env.NEXT_PUBLIC_TIKTOK_URL ?? 'https://tiktok.com/@tuvirtualchef';

  useEffect(() => {
    const nav = document.querySelector<HTMLElement>('.nav');
    if (!nav) return;
    const navEl = nav;

    let lastY = 0;
    let ticking = false;

    function updateNav() {
      const currentY = window.scrollY;
      const diff = currentY - lastY;

      if (currentY > 20) {
        navEl.classList.add('scrolled');
      } else {
        navEl.classList.remove('scrolled');
      }

      if (diff > 8 && currentY > 80) {
        navEl.classList.add('hidden');
        document.body.classList.add('nav-hidden');
      } else if (diff < -4) {
        navEl.classList.remove('hidden');
        document.body.classList.remove('nav-hidden');
      }

      lastY = currentY;
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(updateNav);
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      navEl.classList.remove('hidden', 'scrolled');
      document.body.classList.remove('nav-hidden');
    };
  }, []);

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <>
      <nav className="nav" aria-label="Principal">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <div className="nav-logo-globe">🌍</div>
            WorldWideRecipes
          </Link>

          <ul className="nav-links">
            {navItems.map((item) => (
              <li key={item.href} className={item.dropdown ? 'nav-has-dropdown' : undefined}>
                <Link href={item.href} className={`nav-link${isActive(item.href) ? ' active' : ''}`}>
                  {item.label}
                  {item.dropdown ? <span className="nav-dropdown-arrow" aria-hidden="true">▾</span> : null}
                </Link>
                {item.dropdown ? (
                  <ul className="nav-dropdown-menu" role="menu">
                    {item.dropdown.map((sub) => (
                      <li key={sub.label} role="none">
                        <Link href={sub.href} className="nav-dropdown-item" role="menuitem">
                          {sub.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
            <li>
              <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="nav-link tiktok">
                @tuvirtualchef ↗
              </a>
            </li>
          </ul>

          <div className="nav-right">
            <Link href="/recipes#browse-search" className="nav-search" aria-label="Buscar">
              🔍
            </Link>
          </div>
        </div>
      </nav>

      <nav className="mobile-bottom-nav" aria-label="Navegación móvil">
        <Link href="/" className={`mobile-nav-item${pathname === '/' ? ' active' : ''}`}>
          <span className="mobile-nav-icon">🏠</span>
          Inicio
        </Link>
        <Link href="/recipes" className={`mobile-nav-item${pathname.startsWith('/recipes') && !pathname.startsWith('/recipes/tipo/receta') && !pathname.startsWith('/recipes/tipo/guia') ? ' active' : ''}`}>
          <span className="mobile-nav-icon">🌐</span>
          Explorar
        </Link>
        <Link href="/recipes/tipo/receta" className={`mobile-nav-item${isActive('/recipes/tipo/receta') ? ' active' : ''}`}>
          <span className="mobile-nav-icon">🍽️</span>
          Recetas
        </Link>
        <Link href="/recipes/tipo/guia" className={`mobile-nav-item${isActive('/recipes/tipo/guia') ? ' active' : ''}`}>
          <span className="mobile-nav-icon">📖</span>
          Guías
        </Link>
        <Link href="/recipes#browse-search" className="mobile-nav-item">
          <span className="mobile-nav-icon">🔍</span>
          Buscar
        </Link>
      </nav>
    </>
  );
}
