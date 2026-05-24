#!/usr/bin/env node
/**
 * scripts/generate-content.ts
 *
 * Standalone script — runs directly (no HTTP server needed):
 *   npx tsx scripts/generate-content.ts
 *
 * What it does:
 *   1. Connects to Supabase via DATABASE_URL
 *   2. Connects to OpenAI via OPENAI_API_KEY
 *   3. Connects to Unsplash via UNSPLASH_ACCESS_KEY
 *   4. Asks OpenAI for 10 diverse culinary topics
 *   5. Runs each through the full content pipeline
 *   6. Persists every article to Supabase (quality gate + images included)
 *
 * Required env vars:
 *   DATABASE_URL          — Neon / Postgres connection string
 *   OPENAI_API_KEY        — OpenAI API key
 *   UNSPLASH_ACCESS_KEY   — Unsplash access key
 *
 * Optional:
 *   NEXT_PUBLIC_BASE_URL  — canonical origin (default: https://worldwiderecipes.app)
 *   AI_MODEL              — OpenAI model override (default: gpt-4o-mini)
 *   CONTENT_PROMPT_VERSION — prompt version tag  (default: v1.0)
 *   TOPICS_COUNT          — how many articles to generate (default: 10)
 */

import { generateJSON } from '@/lib/ai/openai';
import { runContentPipeline } from '@/lib/content/pipeline';
import type { ContentType, Locale } from '@/lib/db/schema';

// ─── Types ────────────────────────────────────────────────────────────────────

type Topic = {
  topic: string;
  contentType: ContentType;
  locale: Locale;
};

type RunResult = {
  topic: string;
  contentType: string;
  locale: string;
  success: boolean;
  contentId?: string;
  error?: string;
  durationMs: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(icon: string, msg: string) {
  console.log(`${icon} ${msg}`);
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** Abort early with a clear error message when a required env var is missing. */
function validateEnv() {
  const required = ['DATABASE_URL', 'OPENAI_API_KEY', 'UNSPLASH_ACCESS_KEY'];
  const missing = required.filter((key) => !process.env[key]?.trim());

  if (missing.length > 0) {
    console.error('\n❌  Missing required environment variables:\n');
    missing.forEach((k) => console.error(`     • ${k}`));
    console.error('\nSet them before running this script.\n');
    process.exit(1);
  }
}

// ─── Topic generation ─────────────────────────────────────────────────────────

async function generateTopics(count: number): Promise<Topic[]> {
  log('🤖', `Asking AI for ${count} topics…`);

  const response = await generateJSON<{ topics: Topic[] }>(
    `Generate ${count} specific culinary content topics for WorldWideRecipes.app.
Mix content types: recipe, technique, ingredient, guide, spice, cuisine.
Use a variety of locales: es-mx, es, es-ar, pt-br.
Topics must be specific, interesting, and SEO-friendly — not generic.

Return ONLY valid JSON:
{
  "topics": [
    {"topic": "Tacos al pastor estilo Ciudad de México", "contentType": "recipe", "locale": "es-mx"},
    {"topic": "Técnica de confitar ajo en aceite de oliva", "contentType": "technique", "locale": "es"},
    {"topic": "Guía para elegir el mejor aceite de oliva virgen extra", "contentType": "guide", "locale": "es"},
    {"topic": "Sumac: el condimento agrio del Medio Oriente", "contentType": "spice", "locale": "es-mx"},
    {"topic": "Cozinha nordestina brasileira: pratos e tradições", "contentType": "cuisine", "locale": "pt-br"}
  ]
}
The "topics" array must have exactly ${count} items.`,
    2,
    { temperature: 0.9 },
  );

  const topics = response?.topics;

  if (!Array.isArray(topics) || topics.length === 0) {
    throw new Error('AI returned an empty topics list');
  }

  return topics.slice(0, count);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  validateEnv();

  const targetCount = Number(process.env.TOPICS_COUNT ?? 10);

  log('🚀', 'Content generation pipeline starting');
  log('📅', new Date().toISOString());
  log('🎯', `Target: ${targetCount} articles`);
  console.log();

  // 1. Generate topics via AI
  let topics: Topic[];

  try {
    topics = await generateTopics(targetCount);
  } catch (err) {
    console.error('❌  Failed to generate topics:', err);
    process.exit(1);
  }

  log('📋', `Topics ready (${topics.length}):\n`);
  topics.forEach((t, i) => {
    console.log(`  ${String(i + 1).padStart(2, ' ')}. [${t.contentType}/${t.locale}] ${t.topic}`);
  });
  console.log();

  // 2. Run pipeline for each topic
  const results: RunResult[] = [];

  for (let i = 0; i < topics.length; i++) {
    const { topic, contentType, locale } = topics[i];
    const label = `[${i + 1}/${topics.length}] ${contentType}/${locale}`;

    log('⏳', `${label} — ${topic}`);

    const t0 = Date.now();

    try {
      const result = await runContentPipeline({
        topic,
        contentType,
        locale,
        jobType: 'daily_cron',
      });

      const durationMs = Date.now() - t0;

      if (result.success) {
        log('  ✅', `Published  id=${result.contentId}  (${(durationMs / 1000).toFixed(1)}s)`);
        results.push({ topic, contentType, locale, success: true, contentId: result.contentId, durationMs });
      } else {
        log('  ❌', `Failed — ${result.error}`);
        results.push({ topic, contentType, locale, success: false, error: result.error, durationMs });
      }
    } catch (err) {
      const durationMs = Date.now() - t0;
      const msg = err instanceof Error ? err.message : String(err);
      log('  💥', `Unexpected error — ${msg}`);
      results.push({ topic, contentType, locale, success: false, error: msg, durationMs });
    }

    // Small pause between articles — avoids hammering OpenAI / Unsplash rate limits
    if (i < topics.length - 1) {
      await sleep(2_000);
    }
  }

  // 3. Summary
  const succeeded = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  const totalMs = results.reduce((acc, r) => acc + r.durationMs, 0);

  console.log('\n' + '─'.repeat(52));
  log('📊', 'Summary');
  console.log(`   ✅  Succeeded : ${succeeded.length} / ${results.length}`);
  console.log(`   ❌  Failed    : ${failed.length} / ${results.length}`);
  console.log(`   ⏱   Total time: ${(totalMs / 1000).toFixed(1)}s`);

  if (failed.length > 0) {
    console.log('\n   Failed topics:');
    failed.forEach(({ topic, contentType, locale, error }) => {
      console.log(`   • [${contentType}/${locale}] ${topic}`);
      console.log(`     └─ ${error}`);
    });
  }

  log('📅', `Finished: ${new Date().toISOString()}`);

  // Exit with code 1 only when every single article failed
  if (succeeded.length === 0) {
    console.error('\n❌  All articles failed. Review errors above.\n');
    process.exit(1);
  }

  // Partial success (some failed) still exits 0 — pipeline errors are already
  // recorded in the generation_jobs table for review.
  process.exit(0);
}

void main();

export {};
