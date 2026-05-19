import { and, eq, sql } from 'drizzle-orm';
import { affiliateProducts, db, type AffiliateMarket, type Locale } from '@/lib/db/schema';
import type { ContentDraft } from './types';

const MARKET_CONFIG: Record<AffiliateMarket, { domain: string; tagEnv: string; asinField: 'asinEs' | 'asinMx' | 'asinBr' | 'asinGlobal' }> = {
  es: { domain: 'amazon.es', tagEnv: 'AMAZON_TAG_ES', asinField: 'asinEs' },
  mx: { domain: 'amazon.com.mx', tagEnv: 'AMAZON_TAG_MX', asinField: 'asinMx' },
  br: { domain: 'amazon.com.br', tagEnv: 'AMAZON_TAG_BR', asinField: 'asinBr' },
  global: { domain: 'amazon.com', tagEnv: 'AMAZON_TAG_GLOBAL', asinField: 'asinGlobal' },
};

const CATEGORY_PRIORITY: Record<string, number> = {
  ingredient: 0,
  spice: 1,
  utensil: 2,
  appliance: 3,
  kit: 4,
  book: 5,
};

function flattenText(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === 'string') return [value.toLowerCase()];
  if (Array.isArray(value)) return value.flatMap(flattenText);
  if (typeof value === 'object') return Object.values(value).flatMap(flattenText);
  return [String(value).toLowerCase()];
}

function extractKeywords(content: ContentDraft) {
  const body = content.body ?? {};
  const terms = [
    ...flattenText(body.ingredients),
    ...flattenText(body.tools),
    ...flattenText(body.equipment),
    ...flattenText(body.recommendations),
    content.title.toLowerCase(),
    content.cuisine?.toLowerCase() ?? '',
  ];

  return [...new Set(terms.flatMap((term) => term.split(/[,;|]/).map((part) => part.trim())).filter(Boolean))];
}

export function buildAffiliateUrl(asin: string, market: AffiliateMarket): string {
  const config = MARKET_CONFIG[market];
  const tag = process.env[config.tagEnv];
  const tagQuery = tag ? `?tag=${encodeURIComponent(tag)}` : '';
  return `https://www.${config.domain}/dp/${encodeURIComponent(asin)}${tagQuery}`;
}

export function detectMarketFromLocale(locale: Locale): AffiliateMarket {
  if (locale === 'es') return 'es';
  if (locale === 'es-mx') return 'mx';
  if (locale === 'pt-br') return 'br';
  return 'global';
}

export async function injectAffiliateLinks(
  contentDraft: ContentDraft,
  market: AffiliateMarket,
): Promise<ContentDraft> {
  const keywords = extractKeywords(contentDraft);
  if (!keywords.length) return { ...contentDraft, affiliateLinks: contentDraft.affiliateLinks ?? [] };

  const products = await db
    .select()
    .from(affiliateProducts)
    .where(
      and(
        eq(affiliateProducts.active, true),
        sql`${affiliateProducts.matchKeywords} && ${keywords}::text[]`,
      ),
    );

  const marketConfig = MARKET_CONFIG[market];
  const seenAsins = new Set<string>();
  const links = products
    .sort((a, b) => (CATEGORY_PRIORITY[a.category ?? 'book'] ?? 99) - (CATEGORY_PRIORITY[b.category ?? 'book'] ?? 99))
    .flatMap((product) => {
      const asin = product[marketConfig.asinField] ?? product.asinGlobal;
      if (!asin || seenAsins.has(asin)) return [];
      seenAsins.add(asin);

      return [{
        label: product.nameEs ?? product.nameMx ?? product.name,
        asin,
        url: buildAffiliateUrl(asin, market),
        market,
        type: product.category ?? undefined,
        position: product.category === 'utensil' || product.category === 'appliance' ? 'tools' : 'ingredients',
        productId: product.id,
      }];
    })
    .slice(0, Number(process.env.MAX_AFFILIATE_LINKS_PER_PAGE ?? 5));

  return {
    ...contentDraft,
    affiliateLinks: links,
  };
}
