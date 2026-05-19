'use client';

import { useState } from 'react';
import LocaleSwitcher from './LocaleSwitcher';
import SearchOverlay from './SearchOverlay';

const labels = [
  ['Inicio', ''],
  ['Explorar', 'recipes'],
  ['Recetas', 'recipes/tipo/receta'],
  ['Tecnicas', 'recipes/tipo/tecnica'],
  ['Ingredientes', 'recipes/tipo/ingrediente'],
  ['Privacidad', 'privacy-policy'],
  ['Terminos', 'terms'],
  ['Contacto', 'contact'],
];

export default function MobileMenu({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mobile-nav">
      <button className="mobile-nav-button" type="button" onClick={() => setOpen(true)} aria-label="Abrir menu">
        Menu
      </button>
      {open ? (
        <div className="mobile-nav-panel">
          <button className="mobile-nav-close" type="button" onClick={() => setOpen(false)} aria-label="Cerrar menu">
            Cerrar
          </button>
          <nav>
            <SearchOverlay locale={locale} />
            {labels.map(([label, path]) => (
              <a key={label} href={`/${locale}${path ? `/${path}` : ''}`}>{label}</a>
            ))}
            <a href={process.env.NEXT_PUBLIC_TIKTOK_URL ?? 'https://tiktok.com/@tuvirtualchef'} target="_blank" rel="noopener noreferrer">@tuvirtualchef</a>
          </nav>
          <LocaleSwitcher locale={locale} />
        </div>
      ) : null}
    </div>
  );
}
