import { runContentPipeline } from './pipeline';
import type { ContentType, Locale } from './types';

export async function bootstrapContentPages(
  topics: Array<{ topic: string; contentType: ContentType; locale: Locale }>,
) {
  const jobs = [];

  for (const item of topics) {
    jobs.push(
      await runContentPipeline({
        topic: item.topic,
        contentType: item.contentType,
        locale: item.locale,
        jobType: 'bootstrap',
      }),
    );
  }

  return jobs;
}
