import OpenAI from 'openai';

let client: OpenAI | null = null;

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is missing');
  }

  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

export async function generateText(prompt: string, maxOutputTokens = 4000) {
  const response = await getClient().responses.create({
    model: process.env.AI_MODEL ?? 'gpt-4o-mini',
    input: prompt,
    max_output_tokens: maxOutputTokens,
  });

  return response.output_text.trim();
}

export async function generateJSON<T>(prompt: string, maxOutputTokens = 4000): Promise<T> {
  const text = await generateText(prompt, maxOutputTokens);
  return JSON.parse(text) as T;
}
