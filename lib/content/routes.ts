import { countryFromParam, cuisineCountries } from '@/lib/cuisine/atlas';
import type { ContentType } from '@/lib/db/schema';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type FilterParams = {
  type?: ContentType;
  cuisine?: string;
  country?: string;
  diet?: string;
  difficulty?: Difficulty;
};

const TYPE_TO_URL: Record<ContentType, string> = {
  recipe: 'receta',
  technique: 'tecnica',
  ingredient: 'ingrediente',
  guide: 'guia',
  spice: 'especia',
  cuisine: 'cocina',
};

const URL_TO_TYPE: Record<string, ContentType> = {
  recipe: 'recipe',
  receta: 'recipe',
  recetas: 'recipe',
  technique: 'technique',
  tecnica: 'technique',
  tecnicas: 'technique',
  ingredient: 'ingredient',
  ingrediente: 'ingredient',
  ingredientes: 'ingredient',
  guide: 'guide',
  guia: 'guide',
  guias: 'guide',
  spice: 'spice',
  especia: 'spice',
  especias: 'spice',
  cuisine: 'cuisine',
  cocina: 'cuisine',
  cocinas: 'cuisine',
};

const DIFFICULTY_TO_URL: Record<Difficulty, string> = {
  easy: 'facil',
  medium: 'media',
  hard: 'dificil',
};

const URL_TO_DIFFICULTY: Record<string, Difficulty> = {
  easy: 'easy',
  facil: 'easy',
  medium: 'medium',
  medio: 'medium',
  media: 'medium',
  hard: 'hard',
  dificil: 'hard',
};

export function contentHref(item: { locale?: string | null; type: string; slug: string }) {
  return item.locale ? `/${item.locale}/${item.type}/${item.slug}` : `/${item.type}/${item.slug}`;
}

export function typeToFilterSegment(type: ContentType) {
  return TYPE_TO_URL[type];
}

export function filterHref(filters: FilterParams = {}) {
  const segments: string[] = [];
  if (filters.type) segments.push('tipo', TYPE_TO_URL[filters.type]);
  if (filters.country) segments.push('pais', filters.country);
  if (filters.diet) segments.push('dieta', filters.diet);
  if (filters.difficulty) segments.push('dificultad', DIFFICULTY_TO_URL[filters.difficulty]);
  return `/recipes${segments.length ? `/${segments.join('/')}` : ''}`;
}

export function mapType(value?: string): ContentType | undefined {
  if (!value) return undefined;
  return URL_TO_TYPE[decodeURIComponent(value).toLowerCase()];
}

export function mapDifficulty(value?: string): Difficulty | undefined {
  if (!value) return undefined;
  return URL_TO_DIFFICULTY[decodeURIComponent(value).toLowerCase()];
}

export function parseFilters(segments: string[] = []): FilterParams {
  const filters: FilterParams = {};

  for (let i = 0; i < segments.length; i += 2) {
    const key = segments[i];
    const value = segments[i + 1];
    if (!key || !value) continue;

    if (key === 'tipo') filters.type = mapType(value);
    if (key === 'pais') {
      const country = countryFromParam(value);
      if (country) {
        filters.country = country.slug;
        filters.cuisine = country.cuisine;
      }
    }
    if (key === 'dieta') filters.diet = decodeURIComponent(value).toLowerCase();
    if (key === 'dificultad') filters.difficulty = mapDifficulty(value);
  }

  return filters;
}

export function countrySlugForCuisine(cuisine?: string | null) {
  if (!cuisine) return undefined;
  const normalized = cuisine.toLowerCase();
  return cuisineCountries.find((country) =>
    country.cuisine.toLowerCase() === normalized || country.terms.includes(normalized),
  )?.slug;
}
