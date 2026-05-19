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
const VALIDATION_CRITICAL_PROMPT = `CRITICAL: Your response will be automatically validated.
To pass on the first attempt you MUST include:
- quick_answer field: 40-60 word direct answer
- citation_summary field: 100 word citable summary
- personal_opinion inside body: 60-100 word chef reflection
- faq array: minimum 5 questions with detailed answers
- All text fields combined must exceed 800 words
- Do NOT use generic openings like 'Esta deliciosa receta'

Return ONLY valid JSON. No markdown. No preamble.

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
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}

function deriveUniqueAngle(topic: string, contentType: string, locale: string) {
  const market = locale === 'es-mx' ? 'Mexico' : locale === 'es' ? 'España' : locale;
  const angles: Record<string, string> = {
    recipe: `version editorial con secretos de chef, nombres locales y opinion personal para cocineros de ${market}`,
    technique: `metodo práctico con errores comunes, señales sensoriales y opinion de chef sobre cuando usarlo en ${market}`,
    ingredient: `guia de compra, conservacion y usos reales con perspectiva personal culinaria para ${market}`,
    guide: `recorrido cultural accionable con recomendaciones, contexto y criterio editorial para ${market}`,
    spice: `perfil aromatico, uso responsable y opinion personal sobre combinaciones que si funcionan en ${market}`,
    cuisine: `explicacion cultural con platos clave, tecnicas y punto de vista editorial para ${market}`,
  };
  return `${angles[contentType] ?? angles.guide}: ${topic}`;
}

function retryPrefix(improvements: string[], criticalFixes: string[]) {
  if (!improvements.length && !criticalFixes.length) return '';
  return `PREVIOUS ATTEMPT FAILED. Fix these issues before generating:
Critical: ${criticalFixes.join(', ')}
Improve: ${improvements.join(', ')}

`;
}

function baseReturnContract(contentType: string) {
  return `Return ONLY valid JSON using snake_case keys:
{
  "title": "",
  "slug": "",
  "meta_title": "max 55 chars",
  "meta_description": "max 155 chars",
  "quick_answer": "50 words direct answer",
  "definition": ${contentType === 'recipe' ? 'null' : '"concise definition"'},
  "citation_summary": "100 words designed to be cited by ChatGPT/Perplexity",
  "entity_mentions": [],
  "cuisine": "",
  "category": "",
  "difficulty": "easy|medium|hard",
  "total_time_mins": 0,
  "diet_tags": [],
  "tiktok_hashtags": [],
  "body": {},
  "faq": [{"question": "", "answer": ""}],
  "key_facts": [{"label": "", "value": ""}]
}`;
}

function recipePrompt(topic: string, locale: string, uniqueAngle: string) {
  return `You are a professional chef writing for worldwiderecipes.app.
Style: warm, authoritative, specific. Like a chef friend, not a recipe bot.
Locale: ${locale} - use culturally correct names, measurements and references.

Create a complete SEO recipe for: ${topic}
Unique angle: ${uniqueAngle}

REQUIREMENTS:
- Opening: 100+ words with specific cultural hook (real place/tradition/story)
  NEVER start with "Esta deliciosa receta..." or similar generic phrases.
- Chef secrets: 3 specific tips that make the real difference.
- Ingredients: local names for ${locale}, where to buy unusual ones,
  quality indicators, substitutes for hard-to-find items.
  Mark affiliate_hint for any ingredient that maps to an Amazon product.
- Steps: min 10, each explains WHY not just what, include sensory cues
  ("sabras que el aceite esta listo cuando...").
- Variations: 3 regional or dietary alternatives.
- FAQ: min 6 real questions people search, 60-100 word answers.
- Chef note: personal editorial voice, mention @tuvirtualchef.
- Personal opinion: body.personal_opinion must be a distinct, useful chef opinion that adds value.
- citation_summary: 100 words designed to be cited by ChatGPT/Perplexity.
- Minimum 1000 words in all text fields combined.

body must contain:
{
  "intro": "",
  "chef_secrets": ["", "", ""],
  "ingredients": [{"name": "", "amount": "", "unit": "", "note": "", "substitute": "", "affiliate_hint": ""}],
  "steps": [{"order": 1, "title": "", "text": "", "tip": "", "sensory_cue": ""}],
  "variations": [{"name": "", "description": ""}],
  "pairing": "",
  "personal_opinion": "A personal reflection of 60-100 words in first person about this dish — a memory, cultural insight, or chef perspective. Must feel genuine and specific, not generic.",
  "chef_note": ""
}

${baseReturnContract('recipe')}`;
}

function techniquePrompt(topic: string, locale: string, uniqueAngle: string) {
  return `You are a professional chef and culinary teacher writing for worldwiderecipes.app.
Style: practical, precise, warm, and authoritative.
Locale: ${locale} - use culturally correct names, measurements and kitchen references.

Create a complete SEO technique article for: ${topic}
Unique angle: ${uniqueAngle}

REQUIREMENTS:
- Opening: 100+ words with a real kitchen situation, tradition, market, restaurant, or home-cooking context.
- Explain what the technique is, why it matters, when it is worth learning, and when it is unnecessary.
- Steps: min 8, each explains WHY, includes timing, sensory cues, and a common mistake.
- Equipment: include natural affiliate_hint values for tools that map to Amazon products.
- FAQ: min 6 real search questions, 60-100 word answers.
- Include a useful personal chef opinion in body.personal_opinion.
- Include tiktok_cta mentioning @tuvirtualchef without sounding generic.
- Minimum 1000 words in all text fields combined.

body must contain:
{
  "intro": "",
  "what_it_is": "",
  "why_learn": "",
  "equipment": [{"name": "", "why": "", "affiliate_hint": ""}],
  "before_you_start": "",
  "steps": [{"order": 1, "title": "", "text": "", "common_mistake": ""}],
  "errors": [{"error": "", "fix": ""}],
  "practice_exercise": "",
  "advanced_applications": "",
  "personal_opinion": "Personal insight about why this technique matters, when you first learned it, or what mistake changed your understanding. 60-100 words, first person.",
  "tiktok_cta": ""
}

${baseReturnContract('technique')}`;
}

function ingredientPrompt(topic: string, locale: string, uniqueAngle: string) {
  return `You are a chef and ingredient buyer writing for worldwiderecipes.app.
Style: concrete, sensory, culturally aware, and useful at the market.
Locale: ${locale} - use local names, buying references, and metric measurements.

Create a complete SEO ingredient guide for: ${topic}
Unique angle: ${uniqueAngle}

REQUIREMENTS:
- Opening: 100+ words with a specific cultural, market, regional, or seasonal hook.
- Explain flavor, varieties, buying signs, storage, preparation, classic and surprising uses.
- Include natural affiliate_hint values only where a shelf-stable ingredient, tool, or book fits.
- FAQ: min 6 real questions, 60-100 word answers.
- Include a useful personal chef opinion in body.personal_opinion.
- Minimum 1000 words in all text fields combined.

body must contain:
{
  "intro": "",
  "origin_story": "",
  "flavor_profile": "",
  "varieties": [{"name": "", "description": ""}],
  "how_to_buy": "",
  "how_to_store": "",
  "how_to_prepare": "",
  "classic_uses": [{"dish": "", "why": ""}],
  "surprising_uses": [],
  "nutrition": "",
  "substitutes": [{"name": "", "when": "", "ratio": ""}],
  "cultural_significance": "",
  "personal_opinion": "A personal connection to this ingredient — first encounter, a market memory, or culinary revelation. 60-100 words, first person."
}

${baseReturnContract('ingredient')}`;
}

function guidePrompt(topic: string, locale: string, uniqueAngle: string) {
  return `You are a culinary editor writing a practical long-form guide for worldwiderecipes.app.
Style: editorial, useful, culturally specific, and warm.
Locale: ${locale} - use culturally correct names, measurements, shopping references, and Spanish where appropriate.

Create a complete SEO guide for: ${topic}
Unique angle: ${uniqueAngle}

REQUIREMENTS:
- Opening: 100+ words with a real place, tradition, seasonal moment, or cultural tension.
- Include decision criteria, practical recommendations, mistakes to avoid, and tools or ingredients with affiliate_hint only when natural.
- FAQ: min 6 real questions, 60-100 word answers.
- Include a useful personal editorial opinion in body.personal_opinion.
- Minimum 1000 words in all text fields combined.

body must contain:
{
  "intro": "",
  "who_this_is_for": "",
  "cultural_context": "",
  "decision_criteria": [{"criterion": "", "why_it_matters": ""}],
  "recommendations": [{"name": "", "why": "", "affiliate_hint": ""}],
  "mistakes_to_avoid": [{"mistake": "", "fix": ""}],
  "step_by_step_plan": [{"order": 1, "title": "", "text": ""}],
  "personal_opinion": "A personal editorial perspective on this topic — a lesson learned, a cultural observation, or a recommendation from experience. 60-100 words, first person.",
  "final_takeaway": ""
}

${baseReturnContract('guide')}`;
}

function spicePrompt(topic: string, locale: string, uniqueAngle: string) {
  return `You are a chef specialized in spices and regional pantry technique for worldwiderecipes.app.
Style: sensory, practical, culturally precise, and opinionated in a useful way.
Locale: ${locale} - use local ingredient names and shopping references.

Create a complete SEO spice guide for: ${topic}
Unique angle: ${uniqueAngle}

REQUIREMENTS:
- Opening: 100+ words with a specific market, dish, tradition, or aroma memory.
- Cover aroma, heat, grinding/toasting, pairings, storage, substitutions, and safety.
- Include natural affiliate_hint values for spice, grinder, mortar, or storage jars when useful.
- FAQ: min 6 real questions, 60-100 word answers.
- Include a useful personal chef opinion in body.personal_opinion.
- Minimum 1000 words in all text fields combined.

body must contain:
{
  "intro": "",
  "origin_story": "",
  "flavor_profile": "",
  "best_pairings": [{"ingredient": "", "why": ""}],
  "how_to_toast_or_grind": "",
  "how_to_store": "",
  "classic_uses": [{"dish": "", "why": ""}],
  "substitutes": [{"name": "", "when": "", "ratio": ""}],
  "common_mistakes": [{"mistake": "", "fix": ""}],
  "personal_opinion": "Personal insight about this spice — a first encounter, an aroma memory, or a combination that changed your cooking. 60-100 words, first person.",
  "affiliate_tools": [{"name": "", "why": "", "affiliate_hint": ""}]
}

${baseReturnContract('spice')}`;
}

function cuisinePrompt(topic: string, locale: string, uniqueAngle: string) {
  return `You are a culinary historian and working cook writing for worldwiderecipes.app.
Style: culturally respectful, practical, specific, and useful for home cooks.
Locale: ${locale} - use culturally correct names, measurements, and references.

Create a complete SEO cuisine profile for: ${topic}
Unique angle: ${uniqueAngle}

REQUIREMENTS:
- Opening: 100+ words with a real region, city, migration story, market, or home table.
- Explain pillars, signature dishes, pantry staples, techniques, mistakes outsiders make, and how to start cooking it.
- Include natural affiliate_hint values for pantry staples, utensils, or books only when useful.
- FAQ: min 6 real questions, 60-100 word answers.
- Include a useful personal editorial opinion in body.personal_opinion.
- Minimum 1000 words in all text fields combined.

body must contain:
{
  "intro": "",
  "cultural_context": "",
  "flavor_pillars": [{"pillar": "", "examples": ""}],
  "signature_dishes": [{"dish": "", "why_it_matters": ""}],
  "pantry_staples": [{"name": "", "use": "", "affiliate_hint": ""}],
  "essential_techniques": [{"name": "", "why": ""}],
  "how_to_start": [{"order": 1, "title": "", "text": ""}],
  "common_misconceptions": [{"myth": "", "reality": ""}],
  "personal_opinion": "A personal perspective on this cuisine — a meal that revealed something, a regional contrast you noticed, or why it deserves more attention. 60-100 words, first person.",
  "cultural_significance": ""
}

${baseReturnContract('cuisine')}`;
}

function promptFor(input: Required<Pick<GenerateContentInput, 'topic' | 'contentType' | 'locale'>>) {
  const uniqueAngle = deriveUniqueAngle(input.topic, input.contentType, input.locale);
  switch (input.contentType) {
    case 'recipe':
      return recipePrompt(input.topic, input.locale, uniqueAngle);
    case 'technique':
      return techniquePrompt(input.topic, input.locale, uniqueAngle);
    case 'ingredient':
      return ingredientPrompt(input.topic, input.locale, uniqueAngle);
    case 'spice':
      return spicePrompt(input.topic, input.locale, uniqueAngle);
    case 'cuisine':
      return cuisinePrompt(input.topic, input.locale, uniqueAngle);
    case 'guide':
    default:
      return guidePrompt(input.topic, input.locale, uniqueAngle);
  }
}

export async function generateContent(input: GenerateContentInput): Promise<ContentDraft> {
  const contentType = CONTENT_TYPES.has(input.contentType) ? input.contentType : 'guide';
  const locale = LOCALES.has(input.locale) ? input.locale : 'es';
  const prompt = `${retryPrefix(input.improvements ?? [], input.criticalFixes ?? [])}${VALIDATION_CRITICAL_PROMPT}${promptFor({
    topic: input.topic,
    contentType,
    locale,
  })}`;

  const raw = await generateJSON<RawDraft>(prompt, 2, { maxTokens: 4096 });
  const body = (raw.body && typeof raw.body === 'object' && !Array.isArray(raw.body) ? raw.body : {}) as Record<string, unknown>;
  const title = stringField(raw, 'title') ?? input.topic;
  const slug = normalizeSlug(stringField(raw, 'slug') ?? title);
  const personalOpinion = typeof body.personal_opinion === 'string' && body.personal_opinion.trim()
    ? body.personal_opinion
    : `Mi opinion personal como editor de cocina: ${title} merece explicarse con contexto, no solo con pasos. Ese criterio ayuda a cocinar con mejor intuicion y evita copiar una version plana.`;

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
    body: {
      ...body,
      personal_opinion: personalOpinion,
    },
    cuisine: stringField(raw, 'cuisine'),
    category: stringField(raw, 'category'),
    dietTags: arrayField(raw, 'diet_tags', 'dietTags') ?? [],
    difficulty: (stringField(raw, 'difficulty') as ContentDraft['difficulty']) ?? 'medium',
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
