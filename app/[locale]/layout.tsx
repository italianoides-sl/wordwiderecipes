import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { locales } from '@/lib/i18n/config';

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: { locale: string };
};

export function generateMetadata({ params }: LocaleLayoutProps): Metadata {
  const languages = Object.fromEntries(locales.map((locale) => [locale, `/${locale}`]));

  return {
    title: 'WorldWideRecipes',
    description: 'Recetas, tecnicas e ingredientes de cocina mundial en español e ingles.',
    openGraph: {
      title: 'WorldWideRecipes',
      description: 'Recetas, tecnicas e ingredientes de cocina mundial en español e ingles.',
      type: 'website',
      url: `/${params.locale}`,
      images: ['/logo.png'],
    },
    alternates: {
      canonical: `/${params.locale}`,
      languages,
    },
  };
}

export default function LocaleLayout({ children, params }: LocaleLayoutProps) {
  return (
    <div className="site-shell">
      <Header locale={params.locale} />
      {children}
      <Footer locale={params.locale} />
    </div>
  );
}
