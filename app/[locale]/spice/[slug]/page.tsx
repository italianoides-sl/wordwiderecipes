import { redirect } from 'next/navigation';

export default function LegacyLocaleSpicePage({ params }: { params: { slug: string } }) {
  redirect(`/spice/${params.slug}`);
}
