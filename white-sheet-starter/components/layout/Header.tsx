import Link from 'next/link';
import { SITE_NAME } from '@/lib/config/site';

export function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          {SITE_NAME}
        </Link>
        <nav className="site-nav">
          <Link href="/articles">Artículos</Link>
        </nav>
      </div>
    </header>
  );
}
