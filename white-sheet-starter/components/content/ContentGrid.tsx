import type { ContentRow } from '@/lib/db/schema';
import { ContentCard } from './ContentCard';

export function ContentGrid({ items }: { items: ContentRow[] }) {
  return (
    <div className="content-grid">
      {items.map((item) => (
        <ContentCard key={item.id} item={item} />
      ))}
    </div>
  );
}
