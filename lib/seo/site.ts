const DEFAULT_SITE_URL = 'https://www.worldwiderecipes.app';

export function normalizeSiteUrl(url: string) {
  const trimmed = url.trim();

  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname === 'worldwiderecipes.app') {
      parsed.hostname = 'www.worldwiderecipes.app';
    }
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return trimmed.replace(/\/+$/, '');
  }
}

export function canonicalizeUrl(url: string | null | undefined, fallback?: string) {
  if (typeof url === 'string' && url.trim()) return normalizeSiteUrl(url);
  if (fallback) return normalizeSiteUrl(fallback);
  return SITE_URL;
}

export const SITE_NAME = 'WorldWideRecipes';
export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_BASE_URL ?? DEFAULT_SITE_URL);
export const SITE_EMAIL = 'contact@worldwiderecipes.app';
export const TIKTOK_URL = process.env.NEXT_PUBLIC_TIKTOK_URL ?? 'https://tiktok.com/@tuvirtualchef';
export const LOGO_URL = `${SITE_URL}/logo.png`;
export const AUTHOR_NAME = 'Aleksandro Keci';
export const AUTHOR_ROLE = 'Chef Profesional';
export const AUTHOR_LOCATION = 'Ibiza, España';
export const AUTHOR_URL = `${SITE_URL}/about`;
