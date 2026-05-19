import FilterBar from './FilterBar';
import ContentGrid from './ContentGrid';
import { filterHref, type FilterParams } from '@/lib/content/routes';
import { getContentByFiltersPaged } from '@/lib/db/queries';
import { withDbFallback } from '@/lib/db/safe-query';
import type { Locale } from '@/lib/db/schema';

export default async function BrowseContentPage({
  locale,
  filters = {},
  page = 0,
}: {
  locale: string;
  filters?: FilterParams;
  page?: number;
}) {
  const result = await withDbFallback(
    getContentByFiltersPaged(locale as Locale, filters, page, 12),
    { results: [], total: 0, page, pageSize: 12, hasMore: false },
    'Browse content',
  );
  const hasFilters = Boolean(filters.type || filters.country || filters.diet || filters.difficulty);

  return (
    <main className="wwr-page directory-page">
      <header className="bp-header">
        <div className="bp-bc">
          <a href="/">Inicio</a>
          <span aria-hidden="true">›</span>
          <span aria-current="page">Recetas</span>
        </div>
        <h1 className="bp-h1">
          El <em>recetario</em> del mundo.
        </h1>
        <p className="bp-lede">
          Recetas, técnicas e ingredientes de cocinas que cruzan océanos. Filtra por país, tipo o dieta.
          {result.total > 0 && ` — ${result.total.toLocaleString('es-ES')} artículos publicados.`}
        </p>
      </header>

      <FilterBar filters={filters} />

      {hasFilters && !result.results.length ? (
        <section className="bp-empty">
          <span className="bp-empty-eyebrow">Sin resultados</span>
          <h2>Nada coincide con esos filtros.</h2>
          <p>Prueba a quitar uno o explora <a href="/recipes">todas las recetas</a>.</p>
        </section>
      ) : !result.results.length ? (
        <section className="bp-empty">
          <span className="bp-empty-eyebrow">Próximamente</span>
          <h2>Estamos generando contenido nuevo cada día.</h2>
          <p>Vuelve mañana — publicamos cada mañana a las 8:00.</p>
        </section>
      ) : (
        <ContentGrid rows={result.results} />
      )}

      {(page > 0 || result.hasMore) ? (
        <nav className="pagination-nav" aria-label="Paginación">
          {page > 0 ? <a href={`${filterHref(filters)}?page=${page - 1}`}>← Anterior</a> : null}
          {result.hasMore ? <a href={`${filterHref(filters)}?page=${page + 1}`}>Siguiente →</a> : null}
        </nav>
      ) : null}
    </main>
  );
}
