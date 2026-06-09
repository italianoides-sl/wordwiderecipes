import FilterBar from './FilterBar';
import ContentGrid from './ContentGrid';
import { filterHref, type FilterParams } from '@/lib/content/routes';
import { getContentByFiltersPaged } from '@/lib/db/queries';
import { withDbFallback } from '@/lib/db/safe-query';

export default async function BrowseContentPage({
  filters = {},
  page = 0,
}: {
  filters?: FilterParams;
  page?: number;
}) {
  const result = await withDbFallback(
    getContentByFiltersPaged(filters, page, 12),
    { results: [], total: 0, page, pageSize: 12, hasMore: false },
    'Browse content',
  );
  const hasFilters = Boolean(filters.type || filters.country || filters.diet || filters.difficulty);

  return (
    <main className="article-shell">
      <header className="content-section" style={{ paddingBottom: '24px' }}>
        <div className="article-breadcrumb">
          <a href="/">Inicio</a>
          <span className="article-breadcrumb-sep" aria-hidden="true">›</span>
          <span aria-current="page">Recetas</span>
        </div>
        <h1 className="section-title" style={{ marginBottom: '12px' }}>
          El <em>recetario</em> del mundo.
        </h1>
        <p className="related-title" style={{ marginBottom: 0 }}>
          Recetas, técnicas e ingredientes de cocinas que cruzan océanos. Filtra por país, tipo o dieta.
          {result.total > 0 && ` — ${result.total.toLocaleString('es-ES')} artículos publicados.`}
        </p>
      </header>

      <FilterBar filters={filters} />

      <div className="content-section">
        {hasFilters && !result.results.length ? (
          <section>
            <span className="related-title">Sin resultados</span>
            <h2>Nada coincide con esos filtros.</h2>
            <p>Prueba a quitar uno o explora <a href="/recipes">todas las recetas</a>.</p>
          </section>
        ) : !result.results.length ? (
          <section>
            <span className="related-title">Próximamente</span>
            <h2>Estamos generando contenido nuevo cada día.</h2>
            <p>Vuelve mañana — publicamos cada mañana a las 8:00.</p>
          </section>
        ) : (
          <ContentGrid rows={result.results} />
        )}
      </div>

      {(page > 0 || result.hasMore) ? (
        <nav className="content-section" style={{ paddingTop: 0 }} aria-label="Paginación">
          {page > 0 ? <a href={`${filterHref(filters)}?page=${page - 1}`}>← Anterior</a> : null}
          {result.hasMore ? <a href={`${filterHref(filters)}?page=${page + 1}`}>Siguiente →</a> : null}
        </nav>
      ) : null}
    </main>
  );
}
