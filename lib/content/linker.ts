import { computeInternalLinks } from './internal-linker';

export async function computeRelatedSlugs(contentId: string, locale: string) {
  await computeInternalLinks(contentId, locale);
  return true;
}
