import { generateJSON } from '@/lib/ai/openai';

export async function generateKeywords(
  title: string,
  type: string,
  cuisine?: string,
): Promise<string[]> {
  const result = await generateJSON<{ keywords: string[] }>(
    `Generate 10 SEO keywords in Spanish for a culinary article.

Title: "${title}"
Type: ${type}
Cuisine: ${cuisine ?? 'internacional'}

Include exactly:
- 1 exact match keyword (simplified title)
- 2 long-tail keywords (4+ words each)
- 2 question keywords starting with: cómo, qué es, cuál, para qué
- 2 related search terms people also look for
- 1 Mexican variation or context
- 1 Spanish variation or context
- 1 ingredient or technique keyword

Rules:
- All keywords in Spanish
- No duplicates
- Max 60 characters each
- Return JSON: {"keywords": ["...", "..."]}`,
    1,
    { maxTokens: 300, temperature: 0.4 },
  );

  return Array.isArray(result.keywords)
    ? result.keywords.map((k) => String(k).trim()).filter(Boolean).slice(0, 10)
    : [];
}
