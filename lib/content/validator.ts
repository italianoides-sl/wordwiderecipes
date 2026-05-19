import { generateJSON } from '@/lib/ai/openai';
import type { ContentDraft, QualityReport } from './types';

function fullText(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(fullText).join(' ');
  if (typeof value === 'object') return Object.values(value).map(fullText).join(' ');
  return '';
}

function scoreWordCount(wordCount: number) {
  if (wordCount >= 900) return 10;
  if (wordCount >= 800) return 8;
  if (wordCount >= 500) return 6;
  return 1;
}

function completeScores(report: QualityReport, wordCount: number): QualityReport {
  const scores = {
    cultural_depth: Number(report.scores?.cultural_depth ?? 0),
    chef_authority: Number(report.scores?.chef_authority ?? 0),
    search_coverage: Number(report.scores?.search_coverage ?? 0),
    uniqueness: Number(report.scores?.uniqueness ?? 0),
    word_count: Number(report.scores?.word_count ?? scoreWordCount(wordCount)),
    faq_quality: Number(report.scores?.faq_quality ?? 0),
    affiliate_natural: Number(report.scores?.affiliate_natural ?? 8),
    locale_accuracy: Number(report.scores?.locale_accuracy ?? 8),
    aeo_readiness: Number(report.scores?.aeo_readiness ?? 0),
    geo_readiness: Number(report.scores?.geo_readiness ?? 0),
    personal_opinion: Number(report.scores?.personal_opinion ?? 5),
  };

  const average = Number(
    (
      Object.values(scores).reduce((sum, score) => sum + Math.max(1, Math.min(10, score)), 0) /
      Object.values(scores).length
    ).toFixed(1),
  );

  const reportedAverage = Number(report.average);

  return {
    scores,
    average: Number.isFinite(reportedAverage) && reportedAverage > 0 ? reportedAverage : average,
    publish: Boolean(report.publish),
    hard_fails: Array.isArray(report.hard_fails) ? report.hard_fails : [],
    improvements: Array.isArray(report.improvements) ? report.improvements : [],
  };
}

export async function validateContent(draft: ContentDraft, attempt: number = 1): Promise<QualityReport> {
  const bodyText = draft.body ? JSON.stringify(draft.body) : '';
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;
  const faqCount = draft.faq?.length ?? 0;
  const hardFails: string[] = [];

  if (!draft.title) hardFails.push('Missing title');
  if (!draft.slug) hardFails.push('Missing slug');
  if (!draft.body || typeof draft.body !== 'object') hardFails.push('Missing body');
  if (faqCount < 3) hardFails.push(`Not enough FAQs: ${faqCount} (min 3)`);
  if (wordCount < 500) hardFails.push(`Word count too low: ${wordCount} (min 500)`);

  if (hardFails.length > 0) {
    return {
      scores: {
        cultural_depth: 1,
        chef_authority: 1,
        search_coverage: 1,
        uniqueness: 1,
        word_count: 1,
        faq_quality: 1,
        affiliate_natural: 1,
        locale_accuracy: 1,
        aeo_readiness: 1,
        geo_readiness: 1,
        personal_opinion: 1,
      },
      average: 1.0,
      publish: false,
      hard_fails: hardFails,
      improvements: hardFails,
    };
  }

  const body = draft.body as Record<string, unknown>;
  const validationSummary = {
    title: draft.title,
    quick_answer: draft.quickAnswer ?? null,
    citation_summary: draft.citationSummary ?? null,
    faq_count: faqCount,
    word_count: wordCount,
    intro_preview: typeof body.intro === 'string' ? body.intro.slice(0, 200) : fullText(body).slice(0, 200),
    has_personal_opinion: typeof body.personal_opinion === 'string' && body.personal_opinion.trim().length > 0,
  };

  const report = completeScores(
    await generateJSON<QualityReport>(`
Evaluate this food article quality. Score each dimension 1-10.

ARTICLE SUMMARY:
${JSON.stringify(validationSummary, null, 2)}

Dimensions:
1. cultural_depth (1-10): specific places, traditions, real cultural context?
2. chef_authority (1-10): reads like real cooking knowledge?
3. search_coverage (1-10): covers all questions a searcher would have?
4. uniqueness (1-10): distinctive angle, not generic AI content?
5. word_count (1-10): 900+=10, 800+=8, 500+=6
6. faq_quality (1-10): real questions, substantive answers?
7. affiliate_natural (1-10): affiliate hints are useful and not excessive?
8. locale_accuracy (1-10): names, units, and references fit the locale?
9. aeo_readiness (1-10): structured for featured snippets?
10. geo_readiness (1-10): citable by ChatGPT/Perplexity?
11. personal_opinion (1-10): Does the article contain a genuine personal voice, memory or chef perspective? 10 = vivid and specific, 1 = missing or generic

Return ONLY valid JSON:
{
  "scores": {
    "cultural_depth": 0,
    "chef_authority": 0,
    "search_coverage": 0,
    "uniqueness": 0,
    "word_count": 0,
    "faq_quality": 0,
    "affiliate_natural": 0,
    "locale_accuracy": 0,
    "aeo_readiness": 0,
    "geo_readiness": 0,
    "personal_opinion": 0
  },
  "average": 0.0,
  "publish": true,
  "hard_fails": [],
  "improvements": ["specific actionable improvements if needed"]
}
  `, 1, { maxTokens: 512 }),
    wordCount,
  );

  report.publish = report.average >= 5.0 && hardFails.length === 0;

  return report;
}
