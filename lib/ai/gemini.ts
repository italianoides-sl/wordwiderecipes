import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash-lite',
  generationConfig: {
    temperature: 0.75,
    topP: 0.85,
    maxOutputTokens: 8192,
  }
});

export async function generateJSON<T>(prompt: string, retries = 3): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const clean = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      return JSON.parse(clean) as T;
    } catch (err: any) {
      if ((err.status === 503 || err.status === 429) && attempt < retries) {
        const wait = (attempt + 1) * 15000;
        console.log(`Gemini ${err.status} — retrying in ${wait / 1000}s (attempt ${attempt + 1}/${retries})`);
        await sleep(wait);
        continue;
      }
      throw err;
    }
  }
  throw new Error('generateJSON failed after all retries');
}

export async function generateText(prompt: string): Promise<string> {
  const result = await model.generateContent(prompt);
  return result.response.text();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
