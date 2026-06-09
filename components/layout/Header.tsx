'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const links = [
  { label: 'Inicio', href: '/' },
  { label: '🌐 Explorar', href: '/recipes' },
  { label: 'Recetas', href: '/recipes/tipo/receta' },
  { label: 'Técnicas', href: '/recipes/tipo/tecnica' },
  { label: 'Guías', href: '/recipes/tipo/guia' },
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
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={`nav-link${isActive(link.href) ? ' active' : ''}`}>
                  {link.label}
                </Link>
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
