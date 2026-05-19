import type { AffiliateMarket } from './content';

export interface AffiliateProduct {
  key: string;
  label: string;
  market: AffiliateMarket;
  url: string;
}
