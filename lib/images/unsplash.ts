import { createApi } from 'unsplash-js';
import nodeFetch from 'node-fetch';

const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY!,
  fetch: nodeFetch as unknown as typeof fetch,
});

const CUISINE_QUERIES: Record<string, string> = {
  mexicana: 'mexican food tacos mole pozole',
  española: 'spanish food paella tapas jamon',
  japonesa: 'japanese food sushi ramen',
  italiana: 'italian food pasta pizza',
  india: 'indian food curry spices',
  francesa: 'french cuisine bistro',
  tailandesa: 'thai food street food',
  peruana: 'peruvian food ceviche',
  marroquí: 'moroccan food tagine couscous',
  griega: 'greek food mediterranean',
  china: 'chinese food dim sum noodles',
  coreana: 'korean food kimchi bibimbap',
  vietnamita: 'vietnamese food pho banh mi',
  turca: 'turkish food kebab baklava',
  libanesa: 'lebanese food hummus mezze',
};

const TYPE_QUERIES: Record<string, string[]> = {
  recipe: [
    'plated dish food photography',
    'cooking ingredients preparation',
    'finished meal table setting',
  ],
  technique: [
    'chef cooking technique professional kitchen',
    'knife cutting board technique',
    'cooking process close up',
  ],
  ingredient: [
    'fresh ingredient market food',
    'ingredient close up macro photography',
    'raw ingredient preparation',
  ],
  guide: [
    'food culture gastronomy',
    'traditional market food',
    'regional cuisine culture',
  ],
  spice: [
    'spices herbs colorful market',
    'spice close up macro',
    'aromatic herbs cooking',
  ],
  cuisine: [
    'traditional food culture restaurant',
    'local food market street',
    'authentic cuisine plated',
  ],
};

export interface ContentImage {
  url: string;
  thumbUrl: string;
  alt: string;
  attribution: string;
  photographerName: string;
  photographerUrl: string;
  role: 'hero' | 'body' | 'ingredient' | 'technique' | 'result';
}

const FOOD_TERMS = [
  'food',
  'dish',
  'meal',
  'cooking',
  'kitchen',
  'ingredient',
  'restaurant',
  'plated',
  'cuisine',
  'market',
  'spice',
  'chef',
  'recipe',
  'dinner',
  'lunch',
  'breakfast',
];

type UnsplashPhotoForScoring = {
  id: string;
  alt_description?: string | null;
  description?: string | null;
  user: { name: string };
  tags?: Array<{ title?: string | null }>;
};

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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

export async function fetchArticleImages(options: {
  contentType: string;
  cuisine?: string;
  title?: string;
  count?: number;
}): Promise<ContentImage[]> {
  const count = Math.max(2, options.count ?? 3);
  const images: ContentImage[] = [];
  const usedIds = new Set<string>();

  const cuisineQuery = options.cuisine
    ? (CUISINE_QUERIES[options.cuisine.toLowerCase()] ?? '')
    : '';

  const typeQueries = TYPE_QUERIES[options.contentType] ?? TYPE_QUERIES.recipe;

  const titleKeywordList = meaningfulWords(options.title ?? '').slice(0, 5);
  const titleKeywords = titleKeywordList.slice(0, 4).join(' ');

  const querySlots = [
    `${titleKeywords} ${cuisineQuery} plated food editorial photography`.trim(),
    `${titleKeywords} ${typeQueries[1] ?? typeQueries[0]} ${cuisineQuery}`.trim(),
    `${titleKeywords} ${typeQueries[2] ?? typeQueries[0]} food photography`.trim(),
    `${cuisineQuery || titleKeywords || 'world cuisine'} traditional food`.trim(),
  ];

  const roles: ContentImage['role'][] = ['hero', 'body', 'ingredient', 'result'];

  for (let i = 0; i < count; i++) {
    const query = querySlots[i] ?? querySlots[querySlots.length - 1];

    try {
      const result = await unsplash.search.getPhotos({
        query,
        perPage: 15,
        orientation: 'landscape',
        contentFilter: 'high',
      });

      if (result.errors || !result.response?.results.length) continue;

      const photo = chooseBestPhoto(result.response.results, usedIds, titleKeywordList, options.cuisine);
      if (!photo) continue;
      usedIds.add(photo.id);

      await unsplash.photos.trackDownload({
        downloadLocation: photo.links.download_location,
      });

      images.push({
        url: photo.urls.regular,
        thumbUrl: photo.urls.small,
        alt: photo.alt_description ?? `${options.title ?? options.contentType} - ${query}`,
        attribution: `Photo by ${photo.user.name} on Unsplash`,
        photographerName: photo.user.name,
        photographerUrl: `${photo.user.links.html}?utm_source=worldwiderecipes&utm_medium=referral`,
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
