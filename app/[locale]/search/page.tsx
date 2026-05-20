import { redirect } from 'next/navigation';

export default function LegacyLocaleSearchPage({ searchParams }: { searchParams?: { q?: string } }) {
  const q = searchParams?.q?.trim();
  redirect(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
}
