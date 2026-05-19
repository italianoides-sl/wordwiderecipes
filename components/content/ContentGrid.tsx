import { contentHref } from '@/lib/content/routes';
import type { Content } from '@/lib/db/schema';

export default function ContentGrid({ rows }: { rows: Content[] }) {
  if (!rows.length) {
    return (
      <section className="empty-state">
        <h2>Estamos generando contenido nuevo cada dia.</h2>
        <p>Vuelve pronto: nuevas recetas y tecnicas se publican cada mañana.</p>
        <a href="/recipes">Ver todo</a>
      </section>
    );
  }

  return (
    <section className="directory-grid" aria-label="Articulos publicados">
      {rows.map((item) => (
        <a className="directory-card" href={contentHref(item)} key={item.id}>
          {item.imageUrl ? <img src={item.imageUrl} alt={item.imageAlt ?? item.title} /> : <span className="directory-card-fallback" />}
          <span className="directory-card-type">{item.type}</span>
          <h2>{item.title}</h2>
          <p>{item.metaDescription ?? item.quickAnswer}</p>
          <span className="directory-card-meta">
            {[item.cuisine, item.difficulty, item.totalTimeMins ? `${item.totalTimeMins} min` : null].filter(Boolean).join(' · ')}
          </span>
        </a>
      ))}
    </section>
  );
}
