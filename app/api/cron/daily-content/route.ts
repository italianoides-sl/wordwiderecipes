import { desc, eq } from 'drizzle-orm';
import { generateJSON } from '@/lib/ai/openai';
import { getContentPlanCategory } from '@/lib/content/content-plan';
import { runContentPipeline } from '@/lib/content/pipeline';
import { content, db, trendingTopics } from '@/lib/db/schema';
import type { ContentType, Locale } from '@/lib/db/schema';

type Trend = {
  topic: string;
  content_type: ContentType;
  content_category?:
    | 'recetas'
    | 'tecnicas'
    | 'marinadas'
    | 'salsas'
    | 'historia'
    | 'ingredientes'
    | 'especias'
    | 'guias'
    | 'herramientas';
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

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function inferContentCategory(trend: Trend) {
  if (trend.content_category) return trend.content_category;
  if (trend.content_type === 'technique') return 'tecnicas';
  if (trend.content_type === 'guide') return 'historia';
  return 'recetas';
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

    const existingContent = await db
      .select({
        slug: content.slug,
        title: content.title,
        locale: content.locale,
      })
      .from(content)
      .where(eq(content.status, 'published'))
      .orderBy(desc(content.publishedAt))
      .limit(200);

    const recentTopicsList = recentTopics
      .map((row) => row.topic)
      .concat(existingContent.map((row) => row.title))
      .filter(Boolean)
      .slice(0, 100)
      .join(', ');

    const trendsResponse = await generateJSON<Trend[] | TrendResponse>(`
You are a culinary trend analyst for Spain and Latin America.
Today: ${new Date().toISOString().split('T')[0]}
Primary market: Mexico. Secondary: Spain.

Generate 10 food content topics following this distribution:
5 recipes (diverse world cuisines, no repetition),
2 techniques (professional cooking methods),
1 marinade (any protein, any cuisine),
1 sauce or vinaigrette (unique, not common),
1 history or culture article about food.

Check these already published topics and avoid them:
${recentTopicsList || 'No previous topics yet.'}

Focus on: authenticity, cultural depth, unique angles.
Trending topics in MX and ES preferred.
Mix locales: 60% es-mx, 40% es.
No generic topics. Only specific, interesting angles.

Return a JSON object with this exact structure:
{
  "trends": [
    {
      "topic": "specific descriptive name",
      "content_type": "recipe|technique|guide",
      "content_category": "recetas|tecnicas|marinadas|salsas|historia",
      "locale_primary": "es-mx|es",
      "why_trending": "brief reason",
      "unique_angle": "what makes our version different",
      "affiliate_potential": "high|medium|low",
      "tiktok_hashtags": ["#tag"],
      "difficulty_to_rank": "low|medium|high"
    }
  ]
}
The trends array must contain exactly 10 items.
    `, 3, { maxTokens: 8192 });

    const trends = Array.isArray(trendsResponse)
      ? trendsResponse
      : (trendsResponse.trends ?? trendsResponse.topics ?? trendsResponse.items ?? []);

    if (!Array.isArray(trends) || trends.length === 0) {
      throw new Error('No trends returned from AI');
    }

    const existingTopicsRows = await db
      .select({
        topic: trendingTopics.topic,
        locale: trendingTopics.localePrimary,
      })
      .from(trendingTopics)
      .orderBy(desc(trendingTopics.detectedAt))
      .limit(50);

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

    // Select up to 10 trends following the distribution:
    // 4 recipes, 1 technique, 1 marinade or sauce, 1 ingredient or spice,
    // 1 kitchen guide/tool, 1 history, 1 free choice
    const selected = new Set<number>();
    const toGenerate: Trend[] = [];

    function pick(predicate: (t: Trend) => boolean, limit: number) {
      for (let i = 0; i < filtered.length && toGenerate.length < 10 && limit > 0; i++) {
        if (selected.has(i)) continue;
        const t = filtered[i];
        if (predicate(t)) {
          selected.add(i);
          toGenerate.push(t);
          limit -= 1;
        }
      }
    }

    // 4 recipes
    pick((t) => t.content_type === 'recipe' || t.content_category === 'recetas', 4);
    // 1 technique
    pick((t) => t.content_type === 'technique' || t.content_category === 'tecnicas', 1);
    // 1 marinade or sauce
    pick((t) => t.content_category === 'marinadas' || t.content_category === 'salsas', 1);
    // 1 ingredient or spice
    pick((t) => t.content_type === 'ingredient' || t.content_type === 'spice' || t.content_category === 'ingredientes' || t.content_category === 'especias', 1);
    // 1 kitchen guide or tool
    pick((t) => t.content_type === 'guide' || t.content_category === 'guias' || t.content_category === 'herramientas', 1);
    // 1 history
    pick((t) => t.content_category === 'historia', 1);
    // Free choice: fill remaining up to 10
    pick(() => true, 10 - toGenerate.length);

    for (const trend of toGenerate) {
      const contentCategory = inferContentCategory(trend);
      const planCategory = getContentPlanCategory(contentCategory);
      const result = await runContentPipeline({
        topic: trend.topic,
        contentType: trend.content_type,
        locale: trend.locale_primary,
        jobType: 'daily_cron',
        contentCategory,
        promptFocus: planCategory?.prompt_focus,
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
