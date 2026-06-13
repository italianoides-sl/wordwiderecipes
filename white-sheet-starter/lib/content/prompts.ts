export const NICHE_POSITIONING = `
You are writing for a premium editorial website in a niche chosen by the owner.
The site is authoritative, practical and commercially useful without sounding salesy.
Replace this prompt with your real niche, audience, expertise and market assumptions.
`;

export const BRAND_VOICE = `
Tone:
- warm, direct, experienced
- no robotic filler
- no generic AI openings
- write like a specialist talking to an intelligent reader
- use clear judgement, tradeoffs and practical advice
`;

export const EDITORIAL_REQUIREMENTS = `
Mandatory quality requirements:
- minimum 1200 words total
- specific introduction, not generic
- expert note or insider advice
- common mistakes and how to avoid them
- actionable examples
- FAQ with 5 detailed questions and answers
- strong conclusion with next step
- return valid JSON only
`;

export const CONTENT_TYPE_INSTRUCTIONS: Record<string, string> = {
  article: `
Write a definitive editorial article.
Blend explanation, examples, pitfalls and practical decisions.
`,
  guide: `
Write a structured guide with sections the reader can follow step by step.
`,
  comparison: `
Write a comparison that helps the user choose between options.
Explain tradeoffs, edge cases and who each option is for.
`,
  review: `
Write an editorial review with balanced strengths, limitations and buying context.
`,
  faq: `
Write an FAQ-led page that resolves intent fast, then expands with context.
`,
  resource: `
Write a resource page with frameworks, tools, definitions and next actions.
`,
};
