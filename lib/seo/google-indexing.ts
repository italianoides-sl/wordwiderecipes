import { google } from 'googleapis';

const INDEXING_ENDPOINT = 'https://indexing.googleapis.com/v3/urlNotifications:publish';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function indexUrl(url: string): Promise<boolean> {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!key) {
    console.log('Google service account not configured');
    return false;
  }

  try {
    const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY!;
    const cleaned = rawKey.replace(/\r/g, '').trim();

    let credentials: any;
    try {
      credentials = JSON.parse(cleaned);
    } catch (parseErr) {
      const escaped = cleaned.replace(/\n/g, '\\n');
      credentials = JSON.parse(escaped);
    }

    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    const token = await auth.getAccessToken();
    const accessToken = typeof token === 'string' ? token : (token && (token as any).token) || '';

    const response = await fetch(INDEXING_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ url, type: 'URL_UPDATED' }),
    });

    const result = await response.json().catch(() => ({}));

    if (response.ok) {
      console.log(`✅ Google indexed: ${url}`);
      return true;
    }

    console.error(`Google indexing failed:`, result);
    return false;
  } catch (err) {
    console.error(`Google indexing error:`, err);
    return false;
  }
}

export async function indexBatch(urls: string[]): Promise<{ success: number; failed: number }> {
  const urlsToIndex = urls.slice(0, 5);
  let success = 0;
  let failed = 0;

  for (const u of urlsToIndex) {
    const ok = await indexUrl(u);
    if (ok) success += 1;
    else failed += 1;
    await sleep(500);
  }

  return { success, failed };
}
