import { redirect } from 'next/navigation';

export default function LegacyLocaleIngredientPage({ params }: { params: { slug: string } }) {
  redirect(`/ingredient/${params.slug}`);
}
