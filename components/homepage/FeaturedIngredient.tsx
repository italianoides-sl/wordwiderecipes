import { getFeaturedByType } from '@/lib/db/queries';
import { withDbFallback } from '@/lib/db/safe-query';
import type { Locale } from '@/lib/db/schema';

async function loadIngredient(locale: string) {
  return withDbFallback(
    getFeaturedByType(locale as Locale, 'ingredient').then((row) => row ?? getFeaturedByType(locale as Locale, 'spice')),
    null,
    'Featured ingredient',
  );
}

export default async function FeaturedIngredient({ locale = 'es' }: { locale?: string }) {
  const ingredient = await loadIngredient(locale);
  if (!ingredient) return null;

  const description = ingredient.metaDescription ?? ingredient.quickAnswer ?? '';

  return (
    <section className="hs hs-c is-visible">
      <header className="hs-head">
        <div className="hs-kicker">
          <span className="hs-kicker-line" />
          Seccion 03 · Materia prima
          <span className="hs-kicker-num">Ingrediente</span>
        </div>
      </header>

      <div className="if-stage">
        <div className="if-watermark" aria-hidden="true">
          <span className="if-watermark-text">{ingredient.title}</span>
        </div>

        <div className="if-grid">
          <div className="if-image">
            <div className="if-image-bg" />
            <svg className="if-image-svg" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice">
              <ellipse cx="150" cy="220" rx="130" ry="80" fill="#d8d0c3" opacity="0.45" />
              <g stroke="#111" strokeWidth="2.5" fill="none" strokeLinecap="round">
                <path d="M50 100 Q80 150 70 220 Q65 280 100 320" />
                <path d="M120 80 Q100 140 130 220 Q150 290 130 340" />
                <path d="M180 90 Q200 160 170 230 Q150 300 180 350" />
                <path d="M240 110 Q220 170 250 230 Q270 290 240 340" />
              </g>
            </svg>
            <div className="if-image-tape" aria-hidden="true">Fig. III</div>
          </div>

          <div className="if-content">
            <div className="if-content-top">
              <span className="if-kicker">Ingrediente destacado de hoy</span>
              {ingredient.cuisine ? <span className="if-origin">{ingredient.cuisine}</span> : null}
            </div>
            <h3 className="if-name">{ingredient.title}</h3>
            {description ? <p className="if-description">{description}</p> : null}
            <a className="if-cta" href={`/${locale}/${ingredient.type}/${ingredient.slug}`}>
              Leer ingrediente <span>→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
