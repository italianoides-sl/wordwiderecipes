import { generateJSON } from '@/lib/ai/openai';
import { BRAND_VOICE, CONTENT_TYPE_INSTRUCTIONS, EDITORIAL_REQUIREMENTS, NICHE_POSITIONING } from './prompts';
import type { ContentDraft, ContentType } from './types';

type GenerateInput = {
  topic: string;
  type: ContentType;
  category: string;
  cluster: string;
  uniqueAngle?: string;
  customPrompt?: string;
};

export async function generateContent(input: GenerateInput) {
  const typeInstruction = CONTENT_TYPE_INSTRUCTIONS[input.type];

  const prompt = `
${NICHE_POSITIONING}
${BRAND_VOICE}
${EDITORIAL_REQUIREMENTS}

${typeInstruction}

Topic: ${input.topic}
Category: ${input.category}
Cluster: ${input.cluster}
Unique angle: ${input.uniqueAngle ?? 'custom angle pending'}
Custom niche prompt: ${input.customPrompt ?? 'rewrite this block for your niche'}

Return ONLY valid JSON with this shape:
{
  "title": "",
  "slug": "",
  "type": "${input.type}",
  "category": "${input.category}",
  "topicalCluster": "${input.cluster}",
  "metaTitle": "",
  "metaDescription": "",
  "excerpt": "",
  "quickAnswer": "",
  "body": {
    "intro": "",
    "sections": [{"heading": "", "content": ""}],
    "experts_note": "",
    "mistakes": "",
    "variations": "",
    "next_steps": "",
    "conclusion": ""
  },
  "faq": [{"question": "", "answer": ""}],
  "entityMentions": [],
  "wordCount": 0,
  "readingTimeMins": 0
}`;

  return generateJSON<ContentDraft>(prompt, 6000);
}
