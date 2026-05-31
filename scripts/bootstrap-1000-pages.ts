import { and, eq, sql } from 'drizzle-orm';
import { generateJSON } from '@/lib/ai/openai';
import { bootstrapContentPages } from '@/lib/content/bootstrap';
import { CONTENT_PLAN, CONTENT_PLAN_TOTAL, type ContentPlanCategory } from '@/lib/content/content-plan';
import { content, db, type ContentType, type Locale } from '@/lib/db/schema';

type Topic = { topic: string; contentType?: ContentType; content_type?: ContentType; locale: Locale };
type TopicResponse = { topics?: Topic[]; trends?: Topic[]; items?: Topic[] };

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getExistingTitles() {
  const existing = await db
    .select({ title: content.title, slug: content.slug })
    .from(content)
    .where(eq(content.status, 'published'));

  return existing.map((row) => row.title.toLowerCase());
}

async function countPublishedInCategory(category: ContentPlanCategory) {
  const [row] = await db
    .select({ count: sql`count(*)` })
    .from(content)
    .where(
      and(
        eq(content.status, 'published'),
        eq(content.type, category.type),
        sql`(${content.category} = ${category.category} OR ${content.originalData}->>'content_category' = ${category.category})`,
      ),
    );

  return Number(row?.count ?? 0);
}

async function generateTopics(category: ContentPlanCategory, count: number, existingTitles: string[]) {
  const topicsResponse = await generateJSON<Topic[] | TopicResponse>(`
Generate ${count} specific Spanish-language culinary content topics for WorldWideRecipes.

Category: ${category.category}
Content type: ${category.type}
Category focus:
${category.prompt_focus}

Also consider these current food trends (2025-2026):
- Smash burgers and Oklahoma onion smash style
- Korean corn dogs (gamja-hotdog)
- Birria tacos and quesabirria
- Butter boards and compound butters
- Dubai chocolate with pistachio cream
- Levantine cuisine (Lebanese, Syrian, Israeli)
- Peruvian fusion and nikkei cuisine
- Filipino adobo variations
- West African cuisine (jollof, egusi, suya)
- Japanese convenience store food recreations
- Fermented and probiotic foods
- Zero-waste cooking and root-to-stem
- Air fryer adaptations of classic recipes
- Cottage cheese high-protein recipes
- Viral TikTok recipes: pasta chips, cloud bread, baked oats

Incorporate these trends naturally when relevant to the category.
Don't force them — only use when they fit the category focus.

DO NOT generate any of these already published topics:
${existingTitles.slice(0, 100).join(', ') || 'No published topics yet.'}

Generate something completely different.
Use locales es-mx and es, with a slight preference for es-mx.
Avoid generic topics. Every topic must be specific enough to become a definitive article.

Return a JSON object with this exact structure:
{
  "topics": [
    {"topic":"specific topic","contentType":"${category.type}","locale":"es-mx"}
  ]
}
The topics array must contain exactly ${count} items.
  `);

  const topics = Array.isArray(topicsResponse)
    ? topicsResponse
    : (topicsResponse.topics ?? topicsResponse.trends ?? topicsResponse.items ?? []);

  if (!Array.isArray(topics) || topics.length === 0) {
    throw new Error(`No bootstrap topics returned for ${category.category}`);
  }

  return topics.slice(0, count).map((topic) => ({
    topic: topic.topic,
    contentType: topic.content_type ?? topic.contentType ?? category.type,
    locale: topic.locale,
    contentCategory: category.category,
    promptFocus: category.prompt_focus,
  }));
}

async function generateBatch(category: ContentPlanCategory, count: number) {
  const existingTitles = await getExistingTitles();
  const topics = await generateTopics(category, count, existingTitles);
  const results = await bootstrapContentPages(topics);
  const generated = results.filter((result) => result.success).length;

  console.log(`${category.category}: generated ${generated}/${count}`);
  return { generated, results };
}

async function main() {
  console.log(`Bootstrap: ${CONTENT_PLAN_TOTAL} total pages planned`)
  console.log(`Starting at: ${new Date().toISOString()}`)

  for (const category of CONTENT_PLAN) {
    let existingCount = await countPublishedInCategory(category)
    let needed = category.quota - existingCount
    
    if (needed <= 0) {
      console.log(`✅ ${category.category}: already complete (${existingCount}/${category.quota})`)
      continue
    }

    console.log(`📝 ${category.category}: need ${needed} more (${existingCount}/${category.quota})`)

    while (needed > 0) {
      // Generate 20 per batch instead of 10
      const batch = Math.min(20, needed)
      
      try {
        const { generated } = await generateBatch(category, batch)

        if (generated === 0) {
          console.warn(`⚠️ ${category.category}: 0 generated, retrying in 30s...`)
          await sleep(30000)
          continue
        }

        // Shorter sleep with Unsplash production (1000 req/hr)
        await sleep(3000)
        
        existingCount = await countPublishedInCategory(category)
        needed = category.quota - existingCount
        
        console.log(`📊 ${category.category}: ${existingCount}/${category.quota} — ${Math.max(needed, 0)} remaining`)
      } catch (err) {
        console.error(`❌ ${category.category} batch error:`, err)
        await sleep(15000) // wait 15s on error then retry
      }
    }
    
    console.log(`✅ ${category.category}: COMPLETE`)
  }

  console.log(`🎉 Bootstrap complete at: ${new Date().toISOString()}`)
}

void main();

export {};
