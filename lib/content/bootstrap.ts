import { runContentPipeline } from './pipeline';
import type { ContentType, Locale } from './types';

export async function bootstrapContentPages(
  topics: Array<{
    topic: string;
    contentType: ContentType;
    locale: Locale;
    contentCategory?: string;
    promptFocus?: string;
  }>,
) {
  const jobs = [];

  for (const item of topics) {
    jobs.push(
      await runContentPipeline({
        topic: item.topic,
        contentType: item.contentType,
        locale: item.locale,
        jobType: 'bootstrap',
        contentCategory: item.contentCategory,
        promptFocus: item.promptFocus,
      }),
    );
  }

  return jobs;
}
