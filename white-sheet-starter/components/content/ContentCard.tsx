import Link from 'next/link';
import type { ContentRow } from '@/lib/db/schema';

export function ContentCard({ item }: { item: ContentRow }) {
  return (
    <article className="content-card">
      <div className="content-card-body">
        <p className="content-card-type">{item.type}</p>
        <h2>
          <Link href={`/article/${item.slug}`}>{item.title}</Link>
        </h2>
        <p>{item.metaDescription ?? item.excerpt ?? item.quickAnswer ?? ''}</p>
      </div>
    </article>
  );
}
