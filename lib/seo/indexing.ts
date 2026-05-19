import { indexUrl } from './google-indexing';

export async function notifyGoogleIndexingApi(url: string) {
  return indexUrl(url);
}
