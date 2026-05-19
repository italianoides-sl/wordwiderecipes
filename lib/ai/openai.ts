import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

type GenerateJSONOptions = {
  maxTokens?: number;
  temperature?: number;
};

export async function generateJSON<T>(prompt: string, retries = 2, options: GenerateJSONOptions = {}): Promise<T> {
  const maxTokens = options.maxTokens ?? 8192;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: process.env.AI_MODEL ?? 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: options.temperature ?? 0.75,
        max_tokens: maxTokens,
        seed: 42,
      });

      console.log('finish_reason:', response.choices[0].finish_reason);
      console.log('tokens used:', response.usage);

      const finishReason = response.choices[0].finish_reason;
      if (finishReason === 'length') {
        throw new Error('Response cut off — retrying');
      }

      const text = (response.choices[0].message.content ?? '{}')
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      return JSON.parse(text) as T;
    } catch (err: unknown) {
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 3000));
        continue;
      }
      throw err;
    }
  }
  throw new Error('generateJSON failed after all retries');
}

export async function generateText(prompt: string, maxTokens = 100): Promise<string> {
  const response = await client.chat.completions.create({
    model: process.env.AI_MODEL ?? 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: maxTokens,
  });
  return response.choices[0].message.content ?? '';
}
