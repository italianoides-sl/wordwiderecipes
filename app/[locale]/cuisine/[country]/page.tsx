import { redirect } from 'next/navigation';

export default function LegacyLocaleCuisinePage({ params }: { params: { country: string } }) {
  redirect(`/cuisine/${params.country}`);
}
