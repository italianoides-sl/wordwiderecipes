import { headers } from 'next/headers';

export function getLocale(): string {
  return headers().get('x-locale') ?? 'es';
}
