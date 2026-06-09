import { SITE_URL } from '@/lib/seo/site';

export async function indexUrlIndexNow(url: string): Promise<boolean> {
  const key = 'be4c0d58bb8b40a6a952c9070b9694c3'
  const keyLocation = `${SITE_URL}/${key}.txt`

  try {
    const makeRequest = () =>
      fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          host: new URL(SITE_URL).host,
          key,
          keyLocation,
          urlList: [url],
        }),
      })

    let response = await makeRequest()

    // Retry once after 5s if the service returns 503
    if (response.status === 503) {
      await new Promise((r) => setTimeout(r, 5000))
      response = await makeRequest()
    }

    if (response.status === 200 || response.status === 202) {
      console.log(`✅ IndexNow: ${url}`)
      return true
    }

    console.error(`IndexNow failed ${response.status} for ${url}`)
    return false
  } catch (err) {
    console.error(`IndexNow error for ${url}:`, err)
    return false
  }
}

export async function indexBatchIndexNow(urls: string[]): Promise<{
  success: number
  failed: number
}> {
  const key = 'be4c0d58bb8b40a6a952c9070b9694c3'
  const keyLocation = `${SITE_URL}/${key}.txt`

  try {
    const makeRequest = () =>
      fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          host: new URL(SITE_URL).host,
          key,
          keyLocation,
          urlList: urls.slice(0, 10000),
        }),
      })

    let response = await makeRequest()
    // Retry once after 5s if the service returns 503
    if (response.status === 503) {
      await new Promise((r) => setTimeout(r, 5000))
      response = await makeRequest()
    }

    if (response.status === 200 || response.status === 202) {
      console.log(`✅ IndexNow batch: ${urls.length} URLs`)
      return { success: urls.length, failed: 0 }
    }

    return { success: 0, failed: urls.length }
  } catch (err) {
    console.error('IndexNow batch error:', err)
    return { success: 0, failed: urls.length }
  }
}
