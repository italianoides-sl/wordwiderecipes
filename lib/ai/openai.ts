import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

type GenerateJSONOptions = {
  maxTokens?: number;
  temperature?: number;
};

function getModel(options: GenerateJSONOptions = {}) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY');
  }

  return genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    generationConfig: {
      temperature: options.temperature,
      maxOutputTokens: options.maxTokens,
    },
  });
}

export async function generateJSON<T>(prompt: string, retries = 2, options: GenerateJSONOptions = {}): Promise<T> {
  const maxTokens = options.maxTokens ?? 8192;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const model = getModel({ ...options, maxTokens });
      const result = await model.generateContent(
        `${prompt}\n\nRespond ONLY with valid JSON, no markdown, no backticks.`,
      );
      const text = result.response.text().trim();
      const clean = text.replace(/```json|```/g, '').trim();

      return JSON.parse(clean) as T;
    } catch (err: unknown) {
      console.error('Gemini generateJSON error:', err);
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
  try {
    const model = getModel({ maxTokens, temperature: 0.7 });
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error('Gemini generateText error:', err);
    throw err;
  }
}
