const DEFAULT_SITE_URL = 'https://example.com';

export function normalizeSiteUrl(url: string) {
  return url.trim().replace(/\/+$/, '');
}

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Tu Marca';
export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_BASE_URL ?? DEFAULT_SITE_URL);
export const SITE_TAGLINE =
  process.env.NEXT_PUBLIC_SITE_TAGLINE ?? 'Sistema editorial automatizado para tu nicho';
export const PRIMARY_CATEGORY = process.env.NEXT_PUBLIC_PRIMARY_CATEGORY ?? 'nicho';
export const SITE_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'hola@example.com';
export const X_URL = process.env.NEXT_PUBLIC_X_URL ?? 'https://x.com/tu_marca';
export const INSTAGRAM_URL =
  process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? 'https://instagram.com/tu_marca';
export const YOUTUBE_URL =
  process.env.NEXT_PUBLIC_YOUTUBE_URL ?? 'https://youtube.com/@tu_marca';
export const DEFAULT_AUTHOR = 'Equipo Editorial';
export const DEFAULT_AUTHOR_ROLE = 'Editor especializado';

export function canonicalizeUrl(url: string | null | undefined, fallback?: string) {
  if (typeof url === 'string' && url.trim()) return normalizeSiteUrl(url);
  return fallback ? normalizeSiteUrl(fallback) : SITE_URL;
}
