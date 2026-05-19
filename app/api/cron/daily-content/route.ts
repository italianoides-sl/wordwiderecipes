import { desc } from 'drizzle-orm';
import { generateJSON } from '@/lib/ai/openai';
import { runContentPipeline } from '@/lib/content/pipeline';
import { content, db, trendingTopics } from '@/lib/db/schema';
import type { ContentType, Locale } from '@/lib/db/schema';

type Trend = {
  topic: string;
  content_type: ContentType;
  locale_primary: Locale;
  why_trending: string;
  unique_angle: string;
  affiliate_potential: 'high' | 'medium' | 'low';
  tiktok_hashtags: string[];
  difficulty_to_rank: 'low' | 'medium' | 'high';
};

type TrendResponse = {
  trends?: Trend[];
  topics?: Trend[];
  items?: Trend[];
};

const AFFILIATE_SCORE: Record<Trend['affiliate_potential'], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET(req: Request) {
  const auth = req.headers.get('Authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const results = { published: 0, failed: 0, skipped: 0, jobs: [] as Array<Record<string, unknown>> };

  try {
    const recentTopics = await db
      .select({ topic: trendingTopics.topic })
      .from(trendingTopics)
      .orderBy(desc(trendingTopics.detectedAt))
      .limit(100);

    const recentTopicsList = recentTopics
      .map((row) => row.topic)
      .filter(Boolean)
      .join(', ');

    const trendsResponse = await generateJSON<Trend[] | TrendResponse>(`
You are a culinary trend analyst for Spain and Latin America.
Today: ${new Date().toISOString().split('T')[0]}
Primary market: Mexico. Secondary: Spain.

Find 12 high-potential food content topics for today.
Prioritize: trending on TikTok MX/ES, seasonal ingredients,
underrepresented topics in Spanish food content, high affiliate potential.

Rules:
- Max 4 recipes, min 2 techniques, min 1 ingredient, min 1 guide
- Mix locales: 60% es-mx, 40% es
- No generic topics. Only specific, interesting angles.
- Must have affiliate potential (links to Amazon products naturally)

IMPORTANT - DO NOT suggest these topics, they are already published:
${recentTopicsList || 'No previous topics yet.'}

Generate topics that are completely different from the above list.

Return a JSON object with this exact structure:
{
  "trends": [
    {
      "topic": "specific descriptive name",
      "content_type": "recipe|technique|ingredient|guide|spice|cuisine",
      "locale_primary": "es-mx|es",
      "why_trending": "brief reason",
      "unique_angle": "what makes our version different",
      "affiliate_potential": "high|medium|low",
      "tiktok_hashtags": ["#tag"],
      "difficulty_to_rank": "low|medium|high"
    }
  ]
}
The trends array must contain exactly 12 items.
    `, 3, { maxTokens: 1024 });

    const trends = Array.isArray(trendsResponse)
      ? trendsResponse
      : (trendsResponse.trends ?? trendsResponse.topics ?? trendsResponse.items ?? []);

    if (!Array.isArray(trends) || trends.length === 0) {
      throw new Error('No trends returned from AI');
    }

    const existingContent = await db
      .select({
        slug: content.slug,
        title: content.title,
        locale: content.locale,
      })
      .from(content);

    const existingTopicsRows = await db
      .select({
        topic: trendingTopics.topic,
        locale: trendingTopics.localePrimary,
      })
      .from(trendingTopics);

    const existingSlugs = new Set(existingContent.map((row) => `${row.locale}:${row.slug}`));
    const existingTopics = existingTopicsRows
      .map((row) => ({
        topic: row.topic?.toLowerCase().trim(),
        locale: row.locale,
      }))
      .filter((row): row is { topic: string; locale: string } => Boolean(row.topic && row.locale));

    function isTooSimilar(topic: string, locale: string): boolean {
      const normalizedTopic = topic.toLowerCase().trim();

      if (existingTopics.some((existing) => existing.locale === locale && existing.topic === normalizedTopic)) {
        return true;
      }

      const topicWords = normalizedTopic.split(/\s+/).filter((word) => word.length > 4);
      if (!topicWords.length) return false;

      for (const existing of existingContent) {
        if (existing.locale !== locale) continue;
        const title = existing.title?.toLowerCase().trim();
        if (!title) continue;
        const matches = topicWords.filter((word) => title.includes(word));
        if (matches.length >= 3) return true;
      }

      return false;
    }

    const uniqueTrends = trends.filter((trend) => !isTooSimilar(trend.topic, trend.locale_primary));

    if (uniqueTrends.length === 0) {
      return Response.json({
        success: true,
        message: 'All trends already published - no new content needed',
        published: 0,
      });
    }

    const filtered = uniqueTrends.filter((trend) => {
      if (trend.difficulty_to_rank === 'high') return false;
      return !existingSlugs.has(`${trend.locale_primary}:${normalizeSlug(trend.topic)}`);
    });

    for (const trend of filtered) {
      await db
        .insert(trendingTopics)
        .values({
          topic: trend.topic,
          contentType: trend.content_type,
          localePrimary: trend.locale_primary,
          whyTrending: trend.why_trending,
          uniqueAngle: trend.unique_angle,
          affiliatePotential: trend.affiliate_potential,
          tiktokHashtags: trend.tiktok_hashtags,
          difficultyToRank: trend.difficulty_to_rank,
          detectedDate: new Date().toISOString().split('T')[0],
          detectedAt: new Date(),
          selected: true,
        })
        .onConflictDoNothing();
    }

    const toGenerate = filtered
      .sort((a, b) => AFFILIATE_SCORE[b.affiliate_potential] - AFFILIATE_SCORE[a.affiliate_potential])
      .slice(0, 10);

    for (const trend of toGenerate) {
      const result = await runContentPipeline({
        topic: trend.topic,
        contentType: trend.content_type,
        locale: trend.locale_primary,
        jobType: 'daily_cron',
      });

      if (result.success) {
        results.published += 1;
        results.jobs.push({ topic: trend.topic, status: 'published', id: result.contentId });
      } else {
        results.failed += 1;
        results.jobs.push({ topic: trend.topic, status: 'failed', error: result.error });
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    results.skipped = trends.length - toGenerate.length;
  } catch (err) {
    console.error('Daily cron error:', err);
    return Response.json(
      {
        error: String(err),
        partial: results,
      },
      { status: 500 },
    );
  }

  const duration = Math.round((Date.now() - startTime) / 1000);

  console.log(`Daily cron done in ${duration}s:`, results);

  return Response.json({
    success: true,
    duration_seconds: duration,
    ...results,
  });
}

export const POST = GET;
