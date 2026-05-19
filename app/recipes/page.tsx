import { headers } from 'next/headers';
import BrowseContentPage from '@/components/content/BrowseContentPage';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';

export function generateMetadata() {
  return buildPageMetadata({
    title: 'Articulos y recetas | WorldWideRecipes',
    description: 'Archivo publicado de recetas, tecnicas, ingredientes, especias, guias y cocinas del mundo en WorldWideRecipes.',
    path: '/recipes',
  });
}

export default async function RecipesIndexPage({ searchParams }: { searchParams?: { page?: string } }) {
  const locale = headers().get('x-locale') ?? 'es';
  const page = Math.max(Number(searchParams?.page ?? 0), 0);
  return <BrowseContentPage locale={locale} page={page} />;
}
