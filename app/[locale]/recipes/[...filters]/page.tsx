import { redirect } from 'next/navigation';

export default function LegacyLocaleRecipeFiltersPage({ params }: { params: { filters?: string[] } }) {
  const suffix = params.filters?.length ? `/${params.filters.join('/')}` : '';
  redirect(`/recipes${suffix}`);
}
