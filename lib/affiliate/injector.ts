import { injectAffiliateLinks } from '@/lib/content/affiliate-injector';
import type { AffiliateMarket } from '@/lib/db/schema';
import type { ContentDraft } from '@/lib/content/types';

export async function injectAffiliateUrls(content: ContentDraft, market: AffiliateMarket = 'global') {
  return injectAffiliateLinks(content, market);
}
