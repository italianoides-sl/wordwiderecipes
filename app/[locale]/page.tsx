import HeroBanner from '@/components/homepage/HeroBanner';
import AboutSection from '@/components/homepage/AboutSection';
import WhatWeDoSection from '@/components/homepage/WhatWeDoSection';
import StatsSection from '@/components/homepage/StatsSection';
import ExploreCta from '@/components/homepage/ExploreCta';
import TikTokBand from '@/components/homepage/TikTokBand';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { getContentTypeCounts, getTotalPublishedCount } from '@/lib/db/queries';
import { withDbFallback } from '@/lib/db/safe-query';

export const dynamic = 'force-dynamic';
export const revalidate = 86_400;

export function generateMetadata({ params }: { params: { locale: string } }) {
  return buildPageMetadata({
    title: 'WorldWideRecipes | Atlas culinario mundial',
    description: 'Recetas, tecnicas, ingredientes y guias de gastronomia mundial en español e ingles, con criterio editorial y mirada de chef.',
    path: `/${params.locale}`,
  });
}

export default async function HomePage({ params }: { params: { locale: string } }) {
  const [typeCounts, totalCount] = await Promise.all([
    withDbFallback(getContentTypeCounts(params.locale), [] as Array<{ type: string; count: number }>, 'Type counts'),
    withDbFallback(getTotalPublishedCount(params.locale), 0, 'Total count'),
  ]);

  return (
    <main>
      <HeroBanner locale={params.locale} />
      <AboutSection locale={params.locale} />
      <WhatWeDoSection locale={params.locale} typeCounts={typeCounts} />
      {totalCount > 0 && <StatsSection totalCount={totalCount} locale={params.locale} />}
      <ExploreCta locale={params.locale} />
      <TikTokBand />
    </main>
  );
}
