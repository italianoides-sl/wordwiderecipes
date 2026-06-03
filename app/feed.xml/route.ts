import { desc, eq } from 'drizzle-orm';
import { content, db } from '@/lib/db/schema';

const baseUrl = 'https://worldwiderecipes.app';

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toCdata(value: string) {
  return `<![CDATA[${value.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

function getExcerpt(article: {
  metaDescription: string | null;
  quickAnswer: string | null;
  body: Record<string, unknown>;
  title: string;
}) {
  if (article.metaDescription?.trim()) return article.metaDescription.trim();
  if (article.quickAnswer?.trim()) return article.quickAnswer.trim();

  const intro = article.body?.intro;
  if (typeof intro === 'string' && intro.trim()) {
    return intro.trim();
  }

  return article.title;
}

function getKeywords(body: Record<string, unknown>) {
  const rawKeywords = body?.keywords;
  if (!Array.isArray(rawKeywords)) return '';

  return rawKeywords
    .filter((keyword): keyword is string => typeof keyword === 'string' && keyword.trim().length > 0)
    .map((keyword) => keyword.trim())
    .join(', ');
}

function getContentHtml(body: Record<string, unknown>) {
  const intro = typeof body?.intro === 'string' ? body.intro.trim() : '';
  if (!intro) return '';

  return `<p>${escapeXml(intro)}</p>`;
}

export async function GET() {
  const articles = await db
    .select({
      title: content.title,
      slug: content.slug,
      type: content.type,
      metaDescription: content.metaDescription,
      quickAnswer: content.quickAnswer,
      imageUrl: content.imageUrl,
      publishedAt: content.publishedAt,
      body: content.body,
    })
    .from(content)
    .where(eq(content.status, 'published'))
    .orderBy(desc(content.publishedAt))
    .limit(100);

  const items = articles.map((article) => {
    const url = `${baseUrl}/${article.type}/${article.slug}`;
    const date = article.publishedAt
      ? new Date(article.publishedAt).toUTCString()
      : new Date().toUTCString();
    const image = article.imageUrl?.trim() ?? '';
    const excerpt = getExcerpt(article);
    const keywords = getKeywords(article.body);
    const contentHtml = getContentHtml(article.body);

    return `
    <item>
      <title>${toCdata(article.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <description>${toCdata(excerpt)}</description>
      <pubDate>${date}</pubDate>
      <category>${toCdata(article.type)}</category>
      ${keywords ? `<category>${toCdata(keywords)}</category>` : ''}
      ${contentHtml ? `<content:encoded>${toCdata(contentHtml)}</content:encoded>` : ''}
      ${image ? `
      <media:content
        url="${escapeXml(image)}"
        medium="image"
        type="image/jpeg"
      />
      <enclosure url="${escapeXml(image)}" type="image/jpeg" length="0"/>
      ` : ''}
    </item>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>WorldWideRecipes — La cocina del mundo</title>
    <link>${baseUrl}</link>
    <description>Recetas internacionales, técnicas de cocina e ingredientes de todo el mundo en español.</description>
    <language>es</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${baseUrl}/logo.png</url>
      <title>WorldWideRecipes</title>
      <link>${baseUrl}</link>
    </image>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
