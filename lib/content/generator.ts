import { generateJSON } from '@/lib/ai/openai';
import type { ContentDraft, ContentType, Locale } from './types';

type GenerateContentInput = {
  topic: string;
  contentType: string;
  locale: string;
  improvements?: string[];
  criticalFixes?: string[];
};

type RawDraft = Record<string, unknown>;

const CONTENT_TYPES = new Set(['recipe', 'technique', 'ingredient', 'guide', 'cuisine', 'spice']);
const LOCALES = new Set(['es', 'es-mx', 'es-ar', 'en', 'pt-br']);

const CRITICAL_PREFIX = `Return ONLY valid JSON. No markdown. No preamble.
Must include: quick_answer, citation_summary, personal_opinion in body, faq (min 5 items).
Never start with "Esta deliciosa receta..." or similar generic openers.

`;

function stringField(source: RawDraft, snake: string, camel = snake): string | undefined {
  const value = source[snake] ?? source[camel];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function arrayField<T>(source: RawDraft, snake: string, camel = snake): T[] | undefined {
  const value = source[snake] ?? source[camel];
  return Array.isArray(value) ? (value as T[]) : undefined;
}

function numberField(source: RawDraft, snake: string, camel = snake): number | undefined {
  const value = source[snake] ?? source[camel];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function normalizeSlug(slug: string) {
  return slug
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}

function deriveUniqueAngle(topic: string, contentType: string, locale: string) {
  const market = locale === 'es-mx' ? 'Mexico' : locale === 'es' ? 'España' : locale;
  const angles: Record<string, string> = {
    recipe: `editorial con secretos de chef y opinion personal para cocineros de ${market}`,
    technique: `metodo practico con errores comunes y criterio de chef para ${market}`,
    ingredient: `guia de compra, conservacion y usos reales para ${market}`,
    guide: `recorrido cultural accionable con criterio editorial para ${market}`,
    spice: `perfil aromatico y opinion personal sobre combinaciones para ${market}`,
    cuisine: `explicacion cultural con platos clave y punto de vista editorial para ${market}`,
  };
  return `${angles[contentType] ?? angles.guide}: ${topic}`;
}

function retryPrefix(improvements: string[], criticalFixes: string[]) {
  if (!improvements.length && !criticalFixes.length) return '';
  return `PREVIOUS ATTEMPT FAILED. Fix before generating:
Critical: ${criticalFixes.join(', ')}
Improve: ${improvements.join(', ')}

`;
}

function base(contentType: string) {
  return `
Return ONLY valid JSON (snake_case keys):
{"title":"","slug":"","meta_title":"max 55 chars","meta_description":"max 155 chars","quick_answer":"50 word direct answer","definition":${contentType === 'recipe' ? 'null' : '""'},"citation_summary":"100 words for AI citation","entity_mentions":[],"cuisine":"","category":"","difficulty":"easy|medium|hard","total_time_mins":0,"diet_tags":[],"tiktok_hashtags":[],"body":{},"faq":[{"question":"","answer":""}],"key_facts":[{"label":"","value":""}]}`;
}

function recipePrompt(topic: string, locale: string, uniqueAngle: string) {
  return `Chef writing for worldwiderecipes.app. Locale: ${locale}.
Topic: ${topic}
Angle: ${uniqueAngle}

Rules: cultural opening 100+ words · ingredients with local names, quality notes, substitutes, affiliate_hint for Amazon items · min 10 steps with WHY and sensory cues · 3 variations · min 6 FAQ (60-100w answers) · personal_opinion 60-100w first-person chef reflection · citation_summary 100w

body:{"intro":"","chef_secrets":["","",""],"ingredients":[{"name":"","amount":"","unit":"","note":"","substitute":"","affiliate_hint":""}],"steps":[{"order":1,"title":"","text":"","tip":"","sensory_cue":""}],"variations":[{"name":"","description":""}],"pairing":"","personal_opinion":"A personal reflection of 60-100 words in first person about this dish — a memory, cultural insight, or chef perspective. Must feel genuine and specific, not generic.","chef_note":""}
${base('recipe')}`;
}

function techniquePrompt(topic: string, locale: string, uniqueAngle: string) {
  return `Chef/culinary teacher writing for worldwiderecipes.app. Locale: ${locale}.
Topic: ${topic}
Angle: ${uniqueAngle}

Rules: real kitchen context opening 100+ words · explain what/why/when · min 8 steps with WHY, timing, sensory cues, common mistake · equipment with affiliate_hint · min 6 FAQ (60-100w) · personal_opinion 60-100w first-person · tiktok_cta mentions @tuvirtualchef

body:{"intro":"","what_it_is":"","why_learn":"","equipment":[{"name":"","why":"","affiliate_hint":""}],"before_you_start":"","steps":[{"order":1,"title":"","text":"","common_mistake":""}],"errors":[{"error":"","fix":""}],"practice_exercise":"","advanced_applications":"","personal_opinion":"Personal insight about why this technique matters, when you first learned it, or what mistake changed your understanding. 60-100 words, first person.","tiktok_cta":""}
${base('technique')}`;
}

function ingredientPrompt(topic: string, locale: string, uniqueAngle: string) {
  return `Chef and ingredient buyer writing for worldwiderecipes.app. Locale: ${locale}.
Topic: ${topic}
Angle: ${uniqueAngle}

Rules: market/cultural opening 100+ words · flavor, varieties, buying signs, storage, prep, uses · affiliate_hint for shelf-stable items/tools · min 6 FAQ (60-100w) · personal_opinion 60-100w first-person

body:{"intro":"","origin_story":"","flavor_profile":"","varieties":[{"name":"","description":""}],"how_to_buy":"","how_to_store":"","how_to_prepare":"","classic_uses":[{"dish":"","why":""}],"surprising_uses":[],"nutrition":"","substitutes":[{"name":"","when":"","ratio":""}],"cultural_significance":"","personal_opinion":"A personal connection to this ingredient — first encounter, a market memory, or culinary revelation. 60-100 words, first person."}
${base('ingredient')}`;
}

function guidePrompt(topic: string, locale: string, uniqueAngle: string) {
  return `Culinary editor writing for worldwiderecipes.app. Locale: ${locale}.
Topic: ${topic}
Angle: ${uniqueAngle}

Rules: real place/tradition opening 100+ words · decision criteria, recommendations, mistakes, tools with affiliate_hint when natural · min 6 FAQ (60-100w) · personal_opinion 60-100w first-person

body:{"intro":"","who_this_is_for":"","cultural_context":"","decision_criteria":[{"criterion":"","why_it_matters":""}],"recommendations":[{"name":"","why":"","affiliate_hint":""}],"mistakes_to_avoid":[{"mistake":"","fix":""}],"step_by_step_plan":[{"order":1,"title":"","text":""}],"personal_opinion":"A personal editorial perspective on this topic — a lesson learned, a cultural observation, or a recommendation from experience. 60-100 words, first person.","final_takeaway":""}
${base('guide')}`;
}

function spicePrompt(topic: string, locale: string, uniqueAngle: string) {
  return `Spice specialist writing for worldwiderecipes.app. Locale: ${locale}.
Topic: ${topic}
Angle: ${uniqueAngle}

Rules: market/aroma opening 100+ words · aroma, heat, grinding, pairings, storage, safety · affiliate_hint for grinder/mortar/jars · min 6 FAQ (60-100w) · personal_opinion 60-100w first-person

body:{"intro":"","origin_story":"","flavor_profile":"","best_pairings":[{"ingredient":"","why":""}],"how_to_toast_or_grind":"","how_to_store":"","classic_uses":[{"dish":"","why":""}],"substitutes":[{"name":"","when":"","ratio":""}],"common_mistakes":[{"mistake":"","fix":""}],"personal_opinion":"Personal insight about this spice — a first encounter, an aroma memory, or a combination that changed your cooking. 60-100 words, first person.","affiliate_tools":[{"name":"","why":"","affiliate_hint":""}]}
${base('spice')}`;
}

function cuisinePrompt(topic: string, locale: string, uniqueAngle: string) {
  return `Culinary historian and cook writing for worldwiderecipes.app. Locale: ${locale}.
Topic: ${topic}
Angle: ${uniqueAngle}

Rules: region/city/migration opening 100+ words · pillars, signature dishes, pantry staples with affiliate_hint, techniques, outsider mistakes · min 6 FAQ (60-100w) · personal_opinion 60-100w first-person

body:{"intro":"","cultural_context":"","flavor_pillars":[{"pillar":"","examples":""}],"signature_dishes":[{"dish":"","why_it_matters":""}],"pantry_staples":[{"name":"","use":"","affiliate_hint":""}],"essential_techniques":[{"name":"","why":""}],"how_to_start":[{"order":1,"title":"","text":""}],"common_misconceptions":[{"myth":"","reality":""}],"personal_opinion":"A personal perspective on this cuisine — a meal that revealed something, a regional contrast you noticed, or why it deserves more attention. 60-100 words, first person.","cultural_significance":""}
${base('cuisine')}`;
}

function promptFor(input: Required<Pick<GenerateContentInput, 'topic' | 'contentType' | 'locale'>>) {
  const uniqueAngle = deriveUniqueAngle(input.topic, input.contentType, input.locale);
  switch (input.contentType) {
    case 'recipe':    return recipePrompt(input.topic, input.locale, uniqueAngle);
    case 'technique': return techniquePrompt(input.topic, input.locale, uniqueAngle);
    case 'ingredient':return ingredientPrompt(input.topic, input.locale, uniqueAngle);
    case 'spice':     return spicePrompt(input.topic, input.locale, uniqueAngle);
    case 'cuisine':   return cuisinePrompt(input.topic, input.locale, uniqueAngle);
    case 'guide':
    default:          return guidePrompt(input.topic, input.locale, uniqueAngle);
  }
}

export async function generateContent(input: GenerateContentInput): Promise<ContentDraft> {
  const contentType = CONTENT_TYPES.has(input.contentType) ? input.contentType : 'guide';
  const locale = LOCALES.has(input.locale) ? input.locale : 'es';

  const prompt = `${CRITICAL_PREFIX}${retryPrefix(input.improvements ?? [], input.criticalFixes ?? [])}${promptFor({ topic: input.topic, contentType, locale })}`;

  const raw = await generateJSON<RawDraft>(prompt);
  const body = (raw.body && typeof raw.body === 'object' && !Array.isArray(raw.body) ? raw.body : {}) as Record<string, unknown>;
  const title = stringField(raw, 'title') ?? input.topic;
  const slug = normalizeSlug(stringField(raw, 'slug') ?? title);
  const personalOpinion = typeof body.personal_opinion === 'string' && body.personal_opinion.trim()
    ? body.personal_opinion
    : `Mi opinion personal como editor de cocina: ${title} merece explicarse con contexto, no solo con pasos.`;

  return {
    slug,
    locale: locale as Locale,
    type: contentType as ContentType,
    title,
    metaTitle: stringField(raw, 'meta_title', 'metaTitle')?.slice(0, 55),
    metaDescription: stringField(raw, 'meta_description', 'metaDescription')?.slice(0, 155),
    quickAnswer: stringField(raw, 'quick_answer', 'quickAnswer'),
    definition: stringField(raw, 'definition'),
    keyFacts: arrayField(raw, 'key_facts', 'keyFacts'),
    entityMentions: arrayField(raw, 'entity_mentions', 'entityMentions') ?? [],
    citationSummary: stringField(raw, 'citation_summary', 'citationSummary'),
    body: { ...body, personal_opinion: personalOpinion },
    cuisine: stringField(raw, 'cuisine'),
    category: stringField(raw, 'category'),
    dietTags: arrayField(raw, 'diet_tags', 'dietTags') ?? [],
    difficulty: (() => {
      const difficultyMap: Record<string, string> = {
        'fácil': 'easy', 'facil': 'easy', 'easy': 'easy',
        'medio': 'medium', 'media': 'medium', 'medium': 'medium',
        'difícil': 'hard', 'dificil': 'hard', 'hard': 'hard',
      };
      const raw_diff = stringField(raw, 'difficulty')?.toLowerCase() ?? '';
      return (difficultyMap[raw_diff] ?? 'medium') as ContentDraft['difficulty'];
    })(),
    totalTimeMins: numberField(raw, 'total_time_mins', 'totalTimeMins'),
    tiktokHashtags: arrayField(raw, 'tiktok_hashtags', 'tiktokHashtags') ?? [],
    faq: arrayField(raw, 'faq') ?? [],
    authorEntity: 'WorldWideRecipes Editorial Team',
    expertReviewed: false,
    primarySources: arrayField(raw, 'primary_sources', 'primarySources') ?? [],
    originalData: { generated_for: input.topic, content_type: contentType, locale },
    generationPromptVersion: process.env.CONTENT_PROMPT_VERSION ?? 'v1.0',
  };
}
