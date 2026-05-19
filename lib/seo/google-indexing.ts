import { GoogleAuth } from 'google-auth-library';
import { eq } from 'drizzle-orm';
import { db, sitemapIndex } from '@/lib/db/schema';

const INDEXING_ENDPOINT = 'https://indexing.googleapis.com/v3/urlNotifications:publish';

function getQuota() {
  return Number(process.env.GOOGLE_INDEXING_QUOTA_DAILY ?? 200);
}

function getAuth() {
  const rawCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!rawCredentials) return null;

  return new GoogleAuth({
    credentials: JSON.parse(rawCredentials),
    scopes: ['https://www.googleapis.com/auth/indexing'],
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function indexUrl(url: string): Promise<boolean> {
  const auth = getAuth();
  if (!auth) return false;

  try {
    const client = await auth.getClient();
    await client.request({
      url: INDEXING_ENDPOINT,
      method: 'POST',
      data: { url, type: 'URL_UPDATED' },
    });

    await db.update(sitemapIndex).set({ submittedAt: new Date() }).where(eq(sitemapIndex.url, url));
    return true;
  } catch (error) {
    console.error('Google Indexing API failed', error);
    return false;
  }
}

export async function indexBatch(urls: string[]): Promise<{
  success: string[];
  failed: string[];
  rateLimited: boolean;
}> {
  const quota = getQuota();
  const limitedUrls = urls.slice(0, quota);
  const success: string[] = [];
  const failed: string[] = [];

  for (const url of limitedUrls) {
    const indexed = await indexUrl(url);
    if (indexed) success.push(url);
    else failed.push(url);
    await sleep(200);
  }

  return {
    success,
    failed,
    rateLimited: urls.length > quota,
  };
}
