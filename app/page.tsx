import { headers } from 'next/headers';
import HeroBanner from '@/components/homepage/HeroBanner';
import AboutSection from '@/components/homepage/AboutSection';
import WhatWeDoSection from '@/components/homepage/WhatWeDoSection';
import ExploreCta from '@/components/homepage/ExploreCta';
import TikTokBand from '@/components/homepage/TikTokBand';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { getContentTypeCounts } from '@/lib/db/queries';
import { withDbFallback } from '@/lib/db/safe-query';

export const dynamic = 'force-dynamic';

export function generateMetadata() {
  return buildPageMetadata({
    title: 'WorldWideRecipes | Atlas culinario mundial',
    description: 'Recetas, tecnicas, ingredientes y guias de gastronomia mundial en español e ingles, con criterio editorial y mirada de chef.',
    path: '/',
  });
}

export default async function HomePage() {
  const locale = headers().get('x-locale') ?? 'es';
  const typeCounts = await withDbFallback(
    getContentTypeCounts(locale),
    [] as Array<{ type: string; count: number }>,
    'Type counts',
  );

  return (
    <main className="wwr-page">
      <HeroBanner locale={locale} />
      <AboutSection />
      <WhatWeDoSection typeCounts={typeCounts} />
      <ExploreCta />
      <TikTokBand />
    </main>
  );
}
