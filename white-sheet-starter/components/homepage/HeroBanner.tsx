import Link from 'next/link';
import { PRIMARY_CATEGORY, SITE_NAME, SITE_TAGLINE } from '@/lib/config/site';

export function HeroBanner() {
  return (
    <section className="hero">
      <div className="container hero-inner">
        <p className="eyebrow">White-label editorial engine</p>
        <h1>{SITE_NAME}</h1>
        <p className="hero-copy">
          {SITE_TAGLINE}. Reescribe este bloque para tu nicho, propuesta de valor, tono y modelo
          de monetización.
        </p>
        <div className="hero-actions">
          <Link href="/articles" className="button button-primary">
            Explorar contenido
          </Link>
          <span className="hero-badge">Cluster principal: {PRIMARY_CATEGORY}</span>
        </div>
      </div>
    </section>
  );
}
