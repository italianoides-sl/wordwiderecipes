import { gte } from 'drizzle-orm';
import { generateJSON } from '@/lib/ai/gemini';
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

const AFFILIATE_SCORE: Record<Trend['affiliate_potential'], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export async function GET(req: Request) {
  const auth = req.headers.get('Authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const results = { published: 0, failed: 0, skipped: 0, jobs: [] as Array<Record<string, unknown>> };

  try {
    const trends = await generateJSON<Trend[]>(`
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

Return ONLY valid JSON array of 12 objects:
[{
  "topic": "specific descriptive name",
  "content_type": "recipe|technique|ingredient|guide|spice|cuisine",
  "locale_primary": "es-mx|es",
  "why_trending": "brief reason",
  "unique_angle": "what makes our version different",
  "affiliate_potential": "high|medium|low",
  "tiktok_hashtags": ["#tag"],
  "difficulty_to_rank": "low|medium|high"
}]
    `);

    const recentTitles = await db
      .select({ title: content.title })
      .from(content)
      .where(gte(content.publishedAt, new Date(Date.now() - 30 * 24 * 3600 * 1000)));

    const recentSet = new Set(recentTitles.map((row) => row.title.toLowerCase()));

    const filtered = trends.filter(
      (trend) =>
        !recentSet.has(trend.topic.toLowerCase()) &&
        trend.difficulty_to_rank !== 'high',
    );

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
