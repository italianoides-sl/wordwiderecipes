import { headers } from 'next/headers';
import ContentGrid from '@/components/content/ContentGrid';
import { buildPageMetadata } from '@/lib/seo/metadata';
import type { Content } from '@/lib/db/schema';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://worldwiderecipes.app';

export const dynamic = 'force-dynamic';

export function generateMetadata() {
  return buildPageMetadata({
    title: 'Buscar | WorldWideRecipes',
    description: 'Busca recetas, tecnicas, ingredientes y guias publicadas en WorldWideRecipes.',
    path: '/search',
  });
}

async function search(locale: string, query: string) {
  if (!query.trim()) return { results: [] as Content[], total: 0, page: 0, hasMore: false };
  const url = `${BASE_URL}/api/search?q=${encodeURIComponent(query)}&locale=${encodeURIComponent(locale)}&page=0`;
  const response = await fetch(url, { cache: 'no-store' }).catch(() => null);
  if (!response?.ok) return { results: [] as Content[], total: 0, page: 0, hasMore: false };
  return response.json() as Promise<{ results: Content[]; total: number; page: number; hasMore: boolean }>;
}

export default async function SearchPage({ searchParams }: { searchParams?: { q?: string } }) {
  const locale = headers().get('x-locale') ?? 'es';
  const query = searchParams?.q?.trim() ?? '';
  const result = await search(locale, query);

  return (
    <main className="wwr-page directory-page">
      <section className="directory-hero">
        <span className="directory-flag" aria-hidden="true">⌕</span>
        <div>
          <p className="directory-kicker">Busqueda</p>
          <h1>{query ? `${result.total} resultados para "${query}"` : 'Buscar en WorldWideRecipes'}</h1>
          <p>{query ? 'Resultados publicados desde la base de datos.' : 'Busca recetas, tecnicas, ingredientes o cocinas.'}</p>
        </div>
      </section>

      {query && result.results.length ? <ContentGrid rows={result.results} /> : null}

      {query && !result.results.length ? (
        <section className="empty-state">
          <h2>No encontramos resultados para &quot;{query}&quot;</h2>
          <p>Prueba con una cocina, ingrediente o tecnica distinta, o explora por categoria.</p>
          <a href="/recipes">Explorar categorias</a>
        </section>
      ) : null}
    </main>
  );
}
