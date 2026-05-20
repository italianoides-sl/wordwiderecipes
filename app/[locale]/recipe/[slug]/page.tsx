import { redirect } from 'next/navigation';

export default function LegacyLocaleRecipePage({ params }: { params: { slug: string } }) {
  redirect(`/recipe/${params.slug}`);
}
