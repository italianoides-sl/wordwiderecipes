import { getFeaturedByType } from '@/lib/db/queries';
import { withDbFallback } from '@/lib/db/safe-query';
import type { Locale } from '@/lib/db/schema';

async function loadTechnique(locale: string) {
  return withDbFallback(getFeaturedByType(locale as Locale, 'technique'), null, 'Featured technique');
}

export default async function FeaturedTechnique({ locale = 'es' }: { locale?: string }) {
  const technique = await loadTechnique(locale);
  if (!technique) return null;

  const description = technique.metaDescription ?? technique.quickAnswer ?? '';

  return (
    <section className="hs hs-b is-visible">
      <header className="hs-head">
        <div className="hs-kicker">
          <span className="hs-kicker-line" />
          Seccion 02 · Aprende
          <span className="hs-kicker-num">Tecnica</span>
        </div>
      </header>

      <article className="td-card">
        <div className="td-img" aria-hidden="true">
          <div className="td-img-bg" />
          <div className="td-img-texture" />
          <svg className="td-img-svg" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
            <g stroke="rgba(232,224,213,0.28)" strokeWidth="1.5" fill="none" strokeLinecap="round">
              <path d="M140 200 Q130 170 145 140 Q160 110 145 80" />
              <path d="M200 200 Q210 170 195 140 Q180 110 200 80" />
              <path d="M260 200 Q250 170 265 140 Q280 110 265 80" />
            </g>
            <ellipse cx="200" cy="320" rx="160" ry="36" fill="rgba(0,0,0,0.35)" />
            <path d="M40 320 L60 380 Q80 400 130 400 L270 400 Q320 400 340 380 L360 320 Z" fill="#111" />
            <ellipse cx="200" cy="316" rx="148" ry="30" fill="#8b867d" opacity="0.55" />
          </svg>
          <span className="td-img-label">{technique.title}</span>
        </div>

        <div className="td-body">
          <span className="td-kicker">Tecnica destacada de hoy</span>
          <h3 className="td-title">{technique.title}</h3>
          {description ? <p className="td-description">{description}</p> : null}

          <ul className="td-meta">
            {technique.difficulty ? <li><span className="td-meta-label">Dificultad</span><span className="td-badge td-badge-diff">{technique.difficulty}</span></li> : null}
            {technique.readingTimeMins ? <li><span className="td-meta-label">Lectura</span><span className="td-meta-value">{technique.readingTimeMins} min</span></li> : null}
            <li><span className="td-meta-label">Tipo</span><span className="td-meta-value">{technique.type}</span></li>
          </ul>

          <a href={`/${locale}/technique/${technique.slug}`} className="td-cta">
            Aprender esta tecnica <span>→</span>
          </a>
        </div>
      </article>
    </section>
  );
}
