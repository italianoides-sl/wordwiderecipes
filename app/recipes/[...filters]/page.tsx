import { headers } from 'next/headers';
import BrowseContentPage from '@/components/content/BrowseContentPage';
import { parseFilters } from '@/lib/content/routes';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: { filters?: string[] } }) {
  return buildPageMetadata({
    title: 'Explorar recetas filtradas | WorldWideRecipes',
    description: 'Explora el archivo publicado de WorldWideRecipes con filtros SEO por tipo, pais, dieta y dificultad.',
    path: `/recipes/${params.filters?.join('/') ?? ''}`,
  });
}

export default async function RecipeFiltersPage({
  params,
  searchParams,
}: {
  params: { filters?: string[] };
  searchParams?: { page?: string };
}) {
  const locale = headers().get('x-locale') ?? 'es';
  const page = Math.max(Number(searchParams?.page ?? 0), 0);
  return <BrowseContentPage locale={locale} filters={parseFilters(params.filters ?? [])} page={page} />;
}
