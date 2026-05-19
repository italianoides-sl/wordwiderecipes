import { createApi } from 'unsplash-js';
import nodeFetch from 'node-fetch';
import { generateText } from '@/lib/ai/openai';

const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY!,
  fetch: nodeFetch as unknown as typeof fetch,
});

export interface ContentImage {
  url: string;
  thumbUrl: string;
  alt: string;
  attribution: string;
  photographerName: string;
  photographerUrl: string;
  role: 'hero' | 'body' | 'ingredient' | 'technique' | 'result';
}

type UnsplashPhotoForScoring = {
  id: string;
  alt_description?: string | null;
  description?: string | null;
  links: { download_location: string; html: string };
  urls: { regular: string; small: string };
  user: { name: string; links: { html: string } };
  tags?: Array<{ title?: string | null }>;
};

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function meaningfulWords(value: string) {
  const stop = new Set(['para', 'como', 'este', 'esta', 'estos', 'estas', 'con', 'sin', 'una', 'uno', 'del', 'las', 'los', 'the', 'and', 'food']);
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3 && !stop.has(word));
}

function photoText(photo: UnsplashPhotoForScoring) {
  return normalizeText([
    photo.alt_description,
    photo.description,
    photo.user.name,
    ...(photo.tags?.map((tag) => tag.title) ?? []),
  ].filter(Boolean).join(' '));
}

const FOOD_TERMS = ['food', 'dish', 'meal', 'cooking', 'kitchen', 'ingredient', 'restaurant', 'plated', 'cuisine', 'market', 'spice', 'chef', 'recipe', 'dinner', 'lunch', 'breakfast'];

function scorePhoto(photo: UnsplashPhotoForScoring, keywords: string[], cuisine?: string) {
  const text = photoText(photo);
  const cuisineWords = cuisine ? meaningfulWords(cuisine) : [];
  const foodScore = FOOD_TERMS.reduce((score, term) => score + (text.includes(term) ? 2 : 0), 0);
  const keywordScore = keywords.reduce((score, term) => score + (text.includes(term) ? 4 : 0), 0);
  const cuisineScore = cuisineWords.reduce((score, term) => score + (text.includes(term) ? 5 : 0), 0);
  const irrelevantPenalty = ['person', 'portrait', 'building', 'landscape', 'mountain', 'beach'].some((term) => text.includes(term)) ? 4 : 0;
  return foodScore + keywordScore + cuisineScore - irrelevantPenalty;
}

function chooseBestPhoto<T extends UnsplashPhotoForScoring>(
  photos: T[],
  usedIds: Set<string>,
  keywords: string[],
  cuisine?: string,
) {
  return photos
    .filter((photo) => !usedIds.has(photo.id))
    .map((photo) => ({ photo, score: scorePhoto(photo, keywords, cuisine) }))
    .sort((a, b) => b.score - a.score)[0]?.photo;
}

async function generateImageSearchQuery(options: {
  title: string;
  contentType: string;
  cuisine: string;
}): Promise<string> {
  try {
    const query = await generateText(`
Generate a precise Unsplash photo search query for this food content. The photo must be DIRECTLY related to the specific dish or technique — not generic food.

Title: "${options.title}"
Type: ${options.contentType}
Cuisine: ${options.cuisine}

Rules:
- Max 4 words
- Must describe the EXACT dish/technique visually
- Use English (Unsplash searches better in English)
- Be specific: "sous vide steak" not "cooking meat"
- Examples:
  "Tacos al Pastor" → "tacos al pastor street food"
  "Técnica Brunoise" → "knife dicing vegetables chef"
  "Chile Ancho" → "dried ancho chile pepper"
  "Paella Valenciana" → "paella pan saffron rice"
  "Ramen Tonkotsu" → "ramen bowl pork broth"

Return ONLY the search query, nothing else. No quotes, no explanation.`);
    return query.trim().replace(/^["']|["']$/g, '');
  } catch {
    return meaningfulWords(options.title).slice(0, 3).join(' ') || options.contentType;
  }
}

async function isPhotoRelevant(photo: UnsplashPhotoForScoring, title: string): Promise<boolean> {
  const description = photo.alt_description ?? photo.description ?? '';
  const tags = photo.tags?.map((t) => t.title).filter(Boolean).join(', ') ?? '';
  if (!description && !tags) return true;

  try {
    const answer = await generateText(`Is this Unsplash photo relevant to "${title}"?
Photo description: "${description}"
Photo tags: "${tags}"
Answer only YES or NO.`);
    return answer.trim().toUpperCase().startsWith('YES');
  } catch {
    return true;
  }
}

export async function fetchArticleImages(options: {
  contentType: string;
  cuisine?: string;
  title?: string;
  body?: unknown;
  count?: number;
}): Promise<ContentImage[]> {
  const count = Math.max(2, options.count ?? 3);
  const images: ContentImage[] = [];
  const usedIds = new Set<string>();

  const heroQuery = await generateImageSearchQuery({
    title: options.title ?? '',
    contentType: options.contentType,
    cuisine: options.cuisine ?? '',
  });

  console.log(`Image search query for "${options.title}": ${heroQuery}`);

  const titleKeywordList = meaningfulWords(options.title ?? '').slice(0, 5);

  const querySlots = [
    heroQuery,
    `${heroQuery} food photography`,
    `${options.cuisine ?? 'world'} cuisine food photography`,
    titleKeywordList.slice(0, 3).join(' ') || options.contentType,
  ];

  const roles: ContentImage['role'][] = ['hero', 'body', 'ingredient', 'result'];

  for (let i = 0; i < count; i++) {
    const query = querySlots[i] ?? querySlots[querySlots.length - 1];

    try {
      const result = await unsplash.search.getPhotos({
        query,
        perPage: 20,
        orientation: 'landscape',
        contentFilter: 'high',
      });

      if (result.errors || !result.response?.results.length) continue;

      const candidates = result.response.results.filter((p) => !usedIds.has(p.id));
      let chosen: (typeof candidates)[0] | undefined;

      for (const candidate of candidates.slice(0, 5)) {
        const relevant = i === 0
          ? await isPhotoRelevant(candidate as UnsplashPhotoForScoring, options.title ?? '')
          : true;
        if (relevant) {
          chosen = candidate;
          break;
        }
        console.log(`Skipping irrelevant photo: "${candidate.alt_description}" for "${options.title}"`);
      }

      if (!chosen) {
        chosen = chooseBestPhoto(candidates as UnsplashPhotoForScoring[], usedIds, titleKeywordList, options.cuisine) as typeof candidates[0] | undefined;
      }
      if (!chosen) continue;

      usedIds.add(chosen.id);

      await unsplash.photos.trackDownload({
        downloadLocation: chosen.links.download_location,
      });

      console.log(`✅ Image match: "${chosen.alt_description}" for "${options.title}"`);

      images.push({
        url: chosen.urls.regular,
        thumbUrl: chosen.urls.small,
        alt: chosen.alt_description ?? `${options.title ?? options.contentType} - ${query}`,
        attribution: `Photo by ${chosen.user.name} on Unsplash`,
        photographerName: chosen.user.name,
        photographerUrl: `${chosen.user.links.html}?utm_source=worldwiderecipes&utm_medium=referral`,
        role: roles[i] ?? 'body',
      });

      await sleep(300);
    } catch (err) {
      console.error(`Image fetch failed for slot ${i}:`, err);
    }
  }

  if (images.length < 2) {
    throw new Error(`Could not fetch minimum 2 images for "${options.title}". Got ${images.length}.`);
  }

  return images;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
