import type { CSSProperties } from 'react';
import { countryHref } from '@/lib/cuisine/atlas';
import { getPublishedCuisineCountries } from '@/lib/db/queries';
import { withDbFallback } from '@/lib/db/safe-query';
import type { Locale } from '@/lib/db/schema';

async function loadCountries(locale: string) {
  return withDbFallback(getPublishedCuisineCountries(locale as Locale), [], 'Cuisine countries');
}

export default async function CuisineGrid({ locale = 'es' }: { locale?: string }) {
  const countries = await loadCountries(locale);

  if (!countries.length) return null;

  return (
    <section className="hs hs-a is-visible">
      <header className="hs-head">
        <div className="hs-kicker">
          <span className="hs-kicker-line" />
          Seccion 01 · Atlas
          <span className="hs-kicker-num">Paises</span>
        </div>
        <div className="hs-head-row">
          <h2 className="hs-title">
            La cocina del mundo,<br />
            <em>en un solo lugar.</em>
          </h2>
          <a className="hs-link" href="/recipes">
            Ver todos los paises
            <span>→</span>
          </a>
        </div>
      </header>

      <div className="hs-grid">
        {countries.map((country, index) => (
          <a key={country.code} href={countryHref(locale, country)} className="cc" style={{ '--i': index } as CSSProperties}>
            <span className="cc-flag" aria-hidden="true">{country.flag}</span>
            <span className="cc-name">{country.name}</span>
            {country.count ? (
              <span className="cc-count">
                {country.count.toLocaleString('es-ES')} <span>articulos</span>
              </span>
            ) : null}
            <span className="cc-arrow" aria-hidden="true">→</span>
          </a>
        ))}
      </div>
    </section>
  );
}
