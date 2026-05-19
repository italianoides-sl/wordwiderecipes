import { defaultLocale, locales } from './config';
import type { Locale } from '@/types/content';

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getLocaleOrDefault(value?: string): Locale {
  return value && isLocale(value) ? value : defaultLocale;
}
