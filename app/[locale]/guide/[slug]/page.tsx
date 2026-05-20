import { redirect } from 'next/navigation';

export default function LegacyLocaleGuidePage({ params }: { params: { slug: string } }) {
  redirect(`/guide/${params.slug}`);
}
