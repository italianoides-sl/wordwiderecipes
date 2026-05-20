'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchOverlay() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="search-overlay-root">
      <button className="search-open" type="button" onClick={() => setOpen(true)} aria-label="Buscar">
        Buscar
      </button>
      {open ? (
        <div className="search-panel" role="dialog" aria-label="Buscar en WorldWideRecipes">
          <button className="mobile-nav-close" type="button" onClick={() => setOpen(false)} aria-label="Cerrar busqueda">
            Cerrar
          </button>
          <form onSubmit={submit}>
            <label htmlFor="site-search">Buscar recetas, tecnicas o ingredientes</label>
            <div>
              <input
                id="site-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoFocus
                placeholder="paella, mole, ramen..."
              />
              <button type="submit">Buscar</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
