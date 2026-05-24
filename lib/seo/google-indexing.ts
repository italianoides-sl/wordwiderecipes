import { google } from 'googleapis';
import { getGoogleServiceAccountCredentials } from '@/lib/google/service-account';

const INDEXING_ENDPOINT = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
const INDEXING_SCOPE = 'https://www.googleapis.com/auth/indexing';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function indexUrl(url: string): Promise<boolean> {
  try {
    const credentials = getGoogleServiceAccountCredentials();
    if (!credentials) {
      console.log('Google Indexing API not configured - skipping');
      return false;
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [INDEXING_SCOPE],
    });

    const client = await auth.getClient();

    const response = await client.request({
      url: INDEXING_ENDPOINT,
      method: 'POST',
      data: {
        url,
        type: 'URL_UPDATED',
      },
    });

    console.log(`Indexed: ${url}`, response.data);
    return true;
  } catch (error: any) {
    // Do not crash the publishing pipeline if indexing fails.
    console.error('INDEXING ERROR:', error);
    console.error(error.response?.data);
    console.error(`Indexing failed for ${url}:`, error.message);
    return false;
  }
}

export async function indexBatch(urls: string[]): Promise<{
  success: number;
  failed: number;
}> {
  // Temporary safety limit while validating indexing behavior.
  const urlsToIndex = urls.slice(0, 5);
  let success = 0;
  let failed = 0;

  for (const url of urlsToIndex) {
    const ok = await indexUrl(url);
    if (ok) success += 1;
    else failed += 1;
    await sleep(500);
  }

  return { success, failed };
}
