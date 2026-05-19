import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

type GenerateJSONOptions = {
  maxTokens?: number;
  temperature?: number;
};

export async function generateJSON<T>(prompt: string, retries = 3, options: GenerateJSONOptions = {}): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: process.env.AI_MODEL ?? 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: options.temperature ?? 0.75,
        max_tokens: options.maxTokens ?? 4096,
      });
      const text = response.choices[0].message.content ?? '{}';
      return JSON.parse(text) as T;
    } catch (err: any) {
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 3000));
        continue;
      }
      throw err;
    }
  }
  throw new Error('generateJSON failed after all retries');
}

export async function generateText(prompt: string): Promise<string> {
  const response = await client.chat.completions.create({
    model: process.env.AI_MODEL ?? 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.75,
    max_tokens: 4096,
  });
  return response.choices[0].message.content ?? '';
}
