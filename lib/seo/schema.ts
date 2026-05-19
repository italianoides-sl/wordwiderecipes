import type { Content } from '@/lib/db/schema';
import { buildSchemas } from '@/lib/content/schemas';

export function buildStructuredData(content: Content) {
  return buildSchemas(content);
}
