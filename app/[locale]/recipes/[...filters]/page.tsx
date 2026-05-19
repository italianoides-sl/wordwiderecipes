import BrowseContentPage from '@/components/content/BrowseContentPage';
import { parseFilters } from '@/lib/content/routes';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const revalidate = 86_400;

export function generateMetadata({ params }: { params: { locale: string; filters?: string[] } }) {
  return buildPageMetadata({
    title: 'Explorar recetas filtradas | WorldWideRecipes',
    description: 'Explora el archivo publicado de WorldWideRecipes con filtros SEO por tipo, pais, dieta y dificultad.',
    path: `/${params.locale}/recipes/${params.filters?.join('/') ?? ''}`,
  });
}

export default async function RecipeFiltersPage({
  params,
  searchParams,
}: {
  params: { locale: string; filters?: string[] };
  searchParams?: { page?: string };
}) {
  const page = Math.max(Number(searchParams?.page ?? 0), 0);
  return <BrowseContentPage locale={params.locale} filters={parseFilters(params.filters ?? [])} page={page} />;
}
