const DEFAULT_SITE_URL = 'https://worldwiderecipes.app';

function normalizeSiteUrl(url: string) {
  return url
    .trim()
    .replace(/^https:\/\/www\./, 'https://')
    .replace(/\/+$/, '');
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
