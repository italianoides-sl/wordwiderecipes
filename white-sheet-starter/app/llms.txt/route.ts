import { SITE_NAME, SITE_TAGLINE, SITE_URL } from '@/lib/config/site';

export async function GET() {
  const text = `${SITE_NAME}
${SITE_TAGLINE}
Base URL: ${SITE_URL}
Purpose: editorial website generated with a structured automation pipeline.
Content policy: adapt prompts, facts and review process to your niche.
`;

  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
