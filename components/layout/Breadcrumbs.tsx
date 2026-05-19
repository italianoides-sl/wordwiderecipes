export default function Breadcrumbs({ items = [] }: { items?: Array<{ label: string; href?: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
      <ol className="flex flex-wrap gap-2">
        <li>
          <a href="/es" className="hover:text-slate-950">Inicio</a>
        </li>
        {items.map((item) => (
          <li key={`${item.href ?? item.label}`} className="before:mr-2 before:content-['/']">
            {item.href ? <a href={item.href} className="hover:text-slate-950">{item.label}</a> : <span>{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
