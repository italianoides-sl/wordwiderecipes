import BrowseContentPage from '@/components/content/BrowseContentPage';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const revalidate = 86_400;

export function generateMetadata({ params }: { params: { locale: string } }) {
  return buildPageMetadata({
    title: 'Articulos y recetas | WorldWideRecipes',
    description: 'Archivo publicado de recetas, tecnicas, ingredientes, especias, guias y cocinas del mundo en WorldWideRecipes.',
    path: `/${params.locale}/recipes`,
  });
}

export default async function RecipesIndexPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams?: { page?: string };
}) {
  const page = Math.max(Number(searchParams?.page ?? 0), 0);
  return <BrowseContentPage locale={params.locale} page={page} />;
}
