import type { ContentDraft, QualityReport } from './types';

export function validateContent(draft: ContentDraft): QualityReport {
  const improvements: string[] = [];
  const criticalFixes: string[] = [];

  if (!draft.title?.trim()) criticalFixes.push('missing_title');
  if (!draft.slug?.trim()) criticalFixes.push('missing_slug');
  if (!draft.metaTitle?.trim()) criticalFixes.push('missing_meta_title');
  if (!draft.metaDescription?.trim()) criticalFixes.push('missing_meta_description');
  if (!draft.body?.intro?.trim()) criticalFixes.push('missing_intro');
  if (!Array.isArray(draft.body?.sections) || draft.body.sections.length < 4) {
    criticalFixes.push('not_enough_sections');
  }
  if (!Array.isArray(draft.faq) || draft.faq.length < 5) {
    criticalFixes.push('faq_too_short');
  }
  if ((draft.wordCount ?? 0) < 1000) {
    criticalFixes.push('word_count_too_low');
  }

  if ((draft.metaTitle ?? '').length < 45 || (draft.metaTitle ?? '').length > 60) {
    improvements.push('meta_title_out_of_range');
  }
  if ((draft.metaDescription ?? '').length < 140 || (draft.metaDescription ?? '').length > 160) {
    improvements.push('meta_description_out_of_range');
  }
  if (!draft.body?.experts_note) improvements.push('missing_experts_note');
  if (!draft.body?.mistakes) improvements.push('missing_common_mistakes');
  if (!draft.body?.next_steps) improvements.push('missing_next_steps');

  const score = Math.max(0, 10 - criticalFixes.length * 2 - improvements.length * 0.5);

  return { score, improvements, criticalFixes };
}
