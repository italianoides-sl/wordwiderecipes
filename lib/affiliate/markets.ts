import type { AffiliateMarket, Locale } from '@/lib/db/schema';

export function detectAffiliateMarket(locale: Locale | string): AffiliateMarket {
  if (locale === 'es') return 'es';
  if (locale === 'es-mx') return 'mx';
  if (locale === 'pt-br') return 'br';
  return 'global';
}
