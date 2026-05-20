import { redirect } from 'next/navigation';

export default function LegacyLocaleTechniquePage({ params }: { params: { slug: string } }) {
  redirect(`/technique/${params.slug}`);
}
