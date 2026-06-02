import ContentGrid from '@/components/content/ContentGrid';
import { getContentSearchFallback } from '@/lib/db/queries';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';

export function generateMetadata() {
  return buildPageMetadata({
    title: 'Buscar | WorldWideRecipes',
    description: 'Busca recetas, tecnicas, ingredientes y guias publicadas en WorldWideRecipes.',
    path: '/search',
  });
}

export default async function SearchPage({ searchParams }: { searchParams?: { q?: string } }) {
  const query = searchParams?.q?.trim() ?? '';
  const results = query ? await getContentSearchFallback(query, 'es', 24) : [];

  return (
    <main className="wwr-page directory-page">
      <section className="directory-hero">
        <span className="directory-flag" aria-hidden="true">⌕</span>
        <div>
          <p className="directory-kicker">Busqueda</p>
          <h1>{query ? `${results.length} resultados para "${query}"` : 'Buscar en WorldWideRecipes'}</h1>
          <p>{query ? 'Resultados publicados desde la base de datos.' : 'Busca recetas, tecnicas, ingredientes o cocinas.'}</p>
        </div>
      </section>

      {query && results.length ? <ContentGrid rows={results} /> : null}

      {query && !results.length ? (
        <section className="empty-state">
          <h2>No encontramos resultados para &quot;{query}&quot;</h2>
          <p>Prueba con otro termino.</p>
          <a href="/recipes">Explorar categorias</a>
        </section>
      ) : null}
    </main>
  );
}
