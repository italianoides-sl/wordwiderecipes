import { and, desc, eq, sql } from 'drizzle-orm';
import ContentGrid from '@/components/content/ContentGrid';
import { content, db } from '@/lib/db/schema';
import { buildPageMetadata } from '@/lib/seo/metadata';
import type { Content } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export function generateMetadata() {
  return buildPageMetadata({
    title: 'Buscar | WorldWideRecipes',
    description: 'Busca recetas, tecnicas, ingredientes y guias publicadas en WorldWideRecipes.',
    path: '/search',
  });
}

async function search(query: string): Promise<Content[]> {
  const q = query.trim();
  if (!q) return [];
  const like = `%${q}%`;

  return db
    .select()
    .from(content)
    .where(
      and(
        eq(content.status, 'published'),
        sql`(
          ${content.title} ilike ${like}
          OR ${content.metaDescription} ilike ${like}
          OR ${content.cuisine} ilike ${like}
        )`,
      ),
    )
    .orderBy(desc(content.publishedAt))
    .limit(24);
}

export default async function SearchPage({ searchParams }: { searchParams?: { q?: string } }) {
  const query = searchParams?.q?.trim() ?? '';
  const results = await search(query);

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
